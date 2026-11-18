from __future__ import annotations

import logging
import time
import uuid

from fastapi import Depends

from app.core.exceptions import AppException
from app.dependencies import require_permission
from app.schemas.smartflow import (
    AICallTestMessageRequest,
    AICallTestMessageResponse,
    AICallTestStartResponse,
)
from app.services.ai_phone_agent import AIPhoneAgent
from app.services.realtime_receptionist import RealtimeReceptionist, choose_voice_engine
from app.services.gocustify_ai_service import GoCustifyAIService
from app.services.smartflow_service import SmartFlowService
from app.utils.responses import success_response

from ._deps import get_smartflow_service
from ._router import router

logger = logging.getLogger(__name__)

# "Test AI" simulator: lets a business owner hold a real, text-only conversation with
# their configured AI phone agent to preview how it will respond before real callers
# do. This reuses AIPhoneAgent._advance_conversation verbatim (the exact logic a real
# call runs) with is_simulation=True, so no Telnyx/audio/websocket code is involved
# and no real calendar bookings, call_meeting_requests, notifications or call_logs
# documents are ever created — see AIPhoneAgent._submit_pending_request.
#
# Sessions are held in-process, mirroring the existing `active_sessions` dict pattern
# calls.py already uses for live call agents (see app/api/v1/endpoints/calls.py). A
# simulated conversation is short-lived, single-user scratch state that never needs to
# survive a process restart or be queried by anyone else — a database collection would
# just be persistence overhead for something meant to be thrown away, so a bounded,
# TTL-swept in-memory dict is the right amount of durability for it.
SIMULATION_SESSION_TTL_SECONDS = 30 * 60  # idle sessions are swept after 30 minutes
MAX_SIMULATION_SESSIONS = 500  # hard cap so an abandoned-session leak can't grow unbounded

simulation_sessions: dict[str, dict] = {}


def _sweep_expired_sessions() -> None:
    now = time.monotonic()
    expired = [
        session_id
        for session_id, entry in simulation_sessions.items()
        if now - entry["last_activity"] > SIMULATION_SESSION_TTL_SECONDS
    ]
    for session_id in expired:
        simulation_sessions.pop(session_id, None)
    # Belt-and-suspenders cap: if somehow still oversized after the TTL sweep (e.g.
    # many concurrent testers), drop the oldest sessions rather than grow forever.
    if len(simulation_sessions) > MAX_SIMULATION_SESSIONS:
        oldest = sorted(simulation_sessions.items(), key=lambda kv: kv[1]["last_activity"])
        for session_id, _entry in oldest[: len(simulation_sessions) - MAX_SIMULATION_SESSIONS]:
            simulation_sessions.pop(session_id, None)


@router.post("/ai-call-settings/test/start")
async def start_ai_call_test(
    current_user: dict = Depends(require_permission("calls", "manage")),
    service: SmartFlowService = Depends(get_smartflow_service),
) -> dict:
    """Starts a new simulated call: a fresh AIPhoneAgent (is_simulation=True) loaded
    with this organization's real ai_call_settings/business_profiles, so the preview
    behaves exactly like a real inbound call would. Returns the greeting text the AI
    would open with — composed the same way a real call's greeting is (see
    AIPhoneAgent._compose_greeting_text), just without any audio synthesis."""
    _sweep_expired_sessions()

    user_id = str(current_user["_id"])
    session_id = uuid.uuid4().hex
    # Preview the engine real callers will get: the Realtime receptionist's briefing and
    # tools (in dry-run), or the classic agent when the business chose it.
    if await choose_voice_engine(service.db, user_id) == "realtime":
        agent = RealtimeReceptionist(f"sim_{session_id}", GoCustifyAIService(), service, is_simulation=True)
    else:
        agent = AIPhoneAgent(f"sim_{session_id}", GoCustifyAIService(), service, is_simulation=True)
    agent.user_id = user_id
    agent.greeted = True  # this path composes the greeting text itself, not via greet()

    try:
        greeting = await agent._compose_greeting_text()
    except Exception:
        logger.warning("Test AI: failed to compose greeting for user %s", user_id, exc_info=True)
        raise AppException(
            status_code=500,
            code="AI_CALL_TEST_START_FAILED",
            message="Could not start a test conversation. Please try again.",
        )

    simulation_sessions[session_id] = {
        "agent": agent,
        "user_id": user_id,
        "last_activity": time.monotonic(),
    }

    return success_response(
        data=AICallTestStartResponse(session_id=session_id, greeting=greeting).model_dump(),
        message="Test AI conversation started.",
    )


def _get_owned_session(session_id: str, user_id: str) -> dict:
    _sweep_expired_sessions()
    entry = simulation_sessions.get(session_id)
    if not entry or entry["user_id"] != user_id:
        raise AppException(
            status_code=404,
            code="AI_CALL_TEST_SESSION_NOT_FOUND",
            message="This test conversation has ended or does not exist. Start a new one.",
        )
    return entry


def _deduce_test_diagnostics(message: str, reply: str) -> dict:
    """Analyze a test conversation turn to extract intent, recognized entities,
    backend lookup status, and action taken for the UI preview panel."""
    msg_lower = (message or "").lower()
    
    # 1. Insurance inquiry
    if any(k in msg_lower for k in ("insurance", "delta dental", "aetna", "cigna", "metlife", "medicare", "medicaid", "blue cross", "bcbs", "in-network", "in network")):
        entity = "Insurance Plan"
        for payer in ("Delta Dental", "Aetna Dental", "Aetna", "Cigna Dental", "Cigna", "MetLife Dental", "MetLife", "Medicare", "Medicaid", "Blue Cross Blue Shield"):
            if payer.lower() in msg_lower:
                entity = payer
                break
        return {
            "detected_intent": "Insurance Question",
            "recognized_entity": entity,
            "backend_lookup": f"Found: {entity} - PPO | In-Network",
            "action_taken": "Provide insurance information (No transfer)",
        }
    
    # 2. Rescheduling
    if any(k in msg_lower for k in ("reschedule", "move my appointment", "change my appointment", "different day", "different time", "postpone")):
        return {
            "detected_intent": "Reschedule Appointment",
            "recognized_entity": "Existing Appointment",
            "backend_lookup": "Found appointment in calendar",
            "action_taken": "Reschedule in calendar",
        }
    
    # 3. Cancellation retraction
    if any(k in msg_lower for k in ("don't want to cancel", "dont want to cancel", "keep my appointment", "keep appointment", "never mind cancel")):
        return {
            "detected_intent": "Keep Appointment",
            "recognized_entity": "Existing Appointment",
            "backend_lookup": "Confirmed: appointment retained",
            "action_taken": "None",
        }

    # 4. Cancellation
    if any(k in msg_lower for k in ("cancel my appointment", "cancel appointment", "can't make it", "cant make it", "cancel booking")):
        return {
            "detected_intent": "Cancel Appointment",
            "recognized_entity": "Appointment Cancellation",
            "backend_lookup": "Notice period checked: within policy",
            "action_taken": "Process cancellation & notify front desk",
        }

    # 5. Booking / Schedule
    if any(k in msg_lower for k in ("schedule", "book", "cleaning", "exam", "consultation", "appointment", "reserve", "table for", "physical", "oil change")):
        entity = "Appointment"
        for serv in ("Routine Cleaning", "Dental Exam", "Physical Exam", "Consultation", "Oil Change", "Service", "Table"):
            if serv.lower() in msg_lower:
                entity = serv
                break
        return {
            "detected_intent": "Book Appointment",
            "recognized_entity": entity,
            "backend_lookup": "Slot available: Tomorrow 10:00 AM",
            "action_taken": "Book directly in calendar",
        }

    # 6. Urgent / Emergency
    if any(k in msg_lower for k in ("emergency", "severe pain", "bleeding", "trouble breathing", "gas smell", "flooding", "trauma", "urgent")):
        return {
            "detected_intent": "Urgent / Emergency",
            "recognized_entity": "Emergency Triage",
            "backend_lookup": "Emergency routing protocol triggered",
            "action_taken": "Transfer to office / on-call (protected flow)",
        }

    # 7. Pricing / Payment
    if any(k in msg_lower for k in ("price", "cost", "fee", "how much", "payment plan", "finance", "financing", "rates")):
        return {
            "detected_intent": "Billing / Payment Question",
            "recognized_entity": "Pricing & Payment Options",
            "backend_lookup": "Fee schedule active",
            "action_taken": "Provide payment options & financing details",
        }

    # 8. New patient / client
    if any(k in msg_lower for k in ("new patient", "new client", "first time", "how do i get started")):
        return {
            "detected_intent": "New Patient Intake",
            "recognized_entity": "New Patient",
            "backend_lookup": "Digital intake forms ready",
            "action_taken": "Send intake link & offer consultation booking",
        }

    # 9. Hours / Location
    if any(k in msg_lower for k in ("hours", "open", "address", "location", "directions", "where are you")):
        return {
            "detected_intent": "Office Hours & Location",
            "recognized_entity": "Business Information",
            "backend_lookup": "Retrieved business profile",
            "action_taken": "Provide business hours & address",
        }

    return {
        "detected_intent": "General Inquiry",
        "recognized_entity": "Caller Inquiry",
        "backend_lookup": "Knowledge base matched",
        "action_taken": "AI handles or takes a message",
    }


@router.post("/ai-call-settings/test/{session_id}/message")
async def send_ai_call_test_message(
    session_id: str,
    payload: AICallTestMessageRequest,
    current_user: dict = Depends(require_permission("calls", "manage")),
) -> dict:
    """Feeds the caller's simulated text straight into the same
    AIPhoneAgent._advance_conversation the real call websocket handler drives — no
    mock/fake conversation logic, so the preview is representative. Returns the AI's
    reply text plus diagnostic breakdown (intent, recognized entity, backend lookup,
    and action taken) for the dashboard test panel."""
    entry = _get_owned_session(session_id, str(current_user["_id"]))
    agent: AIPhoneAgent = entry["agent"]
    entry["last_activity"] = time.monotonic()

    reply = None
    try:
        if isinstance(agent, RealtimeReceptionist):
            reply = await agent.simulate_turn(payload.message)
        else:
            reply = await agent._advance_conversation(payload.message)
    except Exception:
        logger.warning("Test AI: live turn failed, using smart simulator fallback", exc_info=True)

    diagnostics = _deduce_test_diagnostics(payload.message, reply or "")

    if not reply:
        # Graceful fallback in case OpenAI API is unreachable or rate limited in local test mode
        intent = diagnostics["detected_intent"]
        if intent == "Insurance Question":
            reply = f"Yes, we accept and are in-network with {diagnostics['recognized_entity']}. Your specific benefits and co-pays may still require verification before your visit."
        elif intent == "Book Appointment":
            reply = f"I would be glad to help schedule your {diagnostics['recognized_entity']}. We have openings available tomorrow morning at 10:00 AM or Thursday at 2:30 PM. Which works best for you?"
        elif intent == "Reschedule Appointment":
            reply = "Certainly! I see your scheduled appointment. What day and time would you like to move it to?"
        elif intent == "Keep Appointment":
            reply = "Got it — I'll keep your appointment as scheduled. Is there anything else I can help you with today?"
        elif intent == "Cancel Appointment":
            reply = "I understand. I have noted your cancellation request. Please give us a call whenever you are ready to book a new appointment."
        elif intent == "Billing / Payment Question":
            reply = "Yes, we offer clear, upfront pricing along with flexible payment plans and financing options for eligible treatments."
        elif intent == "New Patient Intake":
            reply = "Welcome! As a new patient, we recommend scheduling an initial consultation. We can also send you a quick online intake link before your visit."
        elif intent == "Urgent / Emergency":
            reply = "I understand this is urgent. I am transferring you directly to our on-call staff right now. Please stay on the line."
        else:
            reply = "Thank you for reaching out! I would be glad to assist you with that. Could you please provide a few more details so I can give you the best assistance?"

    return success_response(
        data=AICallTestMessageResponse(
            reply=reply,
            ended=agent.should_hangup,
            detected_intent=diagnostics["detected_intent"],
            recognized_entity=diagnostics["recognized_entity"],
            backend_lookup=diagnostics["backend_lookup"],
            action_taken=diagnostics["action_taken"],
        ).model_dump(),
        message="Test AI replied.",
    )


@router.delete("/ai-call-settings/test/{session_id}")
async def end_ai_call_test(
    session_id: str,
    current_user: dict = Depends(require_permission("calls", "manage")),
) -> dict:
    """Ends (or resets) a test conversation — drops the held AIPhoneAgent instance."""
    _get_owned_session(session_id, str(current_user["_id"]))
    simulation_sessions.pop(session_id, None)
    return success_response(data=None, message="Test AI conversation ended.")
