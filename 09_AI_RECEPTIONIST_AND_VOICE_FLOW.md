# AI Phone Receptionist, Voice Workflows & WebRTC (`09_AI_RECEPTIONIST_AND_VOICE_FLOW.md`)

The AI phone receptionist and voice calling subsystem is the most complex stateful flow in the repository. Read this before modifying any file related to calls, Telnyx, OpenAI Realtime, or appointment booking from calls.

---

## 1. Two AI Call Architectures in the Backend

The backend has two complementary AI call handlers that share organization settings (`AICallSettingsService`), business facts, and scheduling/capability gates:

1. **OpenAI Realtime Speech-to-Speech (`app/services/realtime_receptionist.py` — `RealtimeReceptionist`):**
   - Bridges Telnyx media streams (bidirectional audio over WebSocket) directly with the OpenAI Realtime API (`gpt-realtime`, `gpt-4o-mini-transcribe`).
   - Uses OpenAI server-side VAD (voice activity detection) for natural turn-taking and barge-in (truncating/clearing the Telnyx outbound audio buffer when the caller speaks).
   - Executes function/tool calls (`check_availability`, `book_appointment`, `reschedule_appointment`, `cancel_appointment`, `take_message`, `send_sms`, `transfer_call`, etc.) through the capability gate.

2. **Turn-by-Turn Phone Agent & Deterministic Scheduling State Machine (`app/services/ai_phone_agent.py` — `AIPhoneAgent`):**
   - Manages explicit conversation phases (`idle` → `language_menu` → `offering_slot` → `collecting_first_name` → `collecting_last_name` → `collecting_phone` / `confirming_phone` → `collecting_email` / `confirming_email` → `confirming` → `idle`) and delegates open-ended Q&A to `GoCustifyAIService` and `app/workflows/`.
   - **Strict Verification Loop:** Collects first name and last name separately, reads back phone and email, and loops (`collecting_phone` ↔ `confirming_phone`, `collecting_email` ↔ `confirming_email`) with **no attempt cap** until the caller explicitly confirms (`yes`).
   - **Prompt Injection Fencing:** `_assemble_prompt()` wraps owner-supplied `custom_instructions` inside `OWNER_BLOCK_START` / `OWNER_BLOCK_END` data fences and places `NON-NEGOTIABLE RULES` (`STRICT NON-HALLUCINATION RULE`) **after** the owner block so free-text instructions can never override safety or hallucination rules.
   - **Multi-Language Support (`app/services/call_phrases.py`):** 11 languages (`en`, `es`, `fr`, `de`, `pt`, `it`, `nl`, `pl`, `ru`, `ja`, `zh`) with localized prompts, weekday/month formatting, and optional DTMF keypad language menu (`language_menu_enabled`).

---

## 2. Capability Gates & Human-in-the-Loop Approval (`ReceptionistActionService`)

Every side-effecting AI receptionist tool is governed by per-organization capability settings stored in `organizations.ai_call_settings.capabilities` and resolved via `self.resolve_capability(organization_id, capability_key)`:

- **`ai_allowed`**: The AI executes the action immediately during the call (e.g., books the calendar event, creates the CRM contact, queues the SMS).
- **`human_approval_required`**: The AI does **not** mutate live records directly; instead, it creates a pending approval item in `receptionist_actions` via `ReceptionistActionService(db).request(...)` (`app/services/smartflow/receptionist_action_service.py`) or `CallMeetingRequestService` (`call_meeting_requests`).
  - Business owners/managers review and approve/reject these in Website (`/calls` / `/ai-call` / meeting requests) via `/api/v1/smartflow/receptionist/actions/{id}/approve` or `/api/v1/smartflow/calls/meeting-requests/{id}/accept`.
- **`disabled`**: The AI politely refuses the action and offers to take a message instead.

---

## 3. Outbound SMS Delivery Rule (Business Number vs Platform Number)

- Automated confirmation/reminder/follow-up texts triggered by appointments or calls (`app/services/smartflow/appointment_notifications.py` — `AppointmentNotifier`) **never** fire raw SMS from the platform's master fallback number directly.
- Instead, they resolve the organization's SMS conversation thread (`_sms_thread`) and call `self.create_message(...)` with `"platform": "sms", "direction": "outbound", "automated": True`, which routes delivery through the business's own assigned Telnyx number and keeps the message visible in the owner's CRM inbox.

---

## 4. Browser & Mobile WebRTC Voice Calling

In addition to AI-handled calls, human team members can place and receive live voice calls from the browser (`Mabdel Website`) and mobile app (`madbel-mobile`):

- **Backend (`app/services/telnyx_web_voice_service.py` & `app/api/v1/endpoints/calls.py`):**
  - Issues short-lived Telnyx WebRTC login credentials/SIP tokens scoped to the user's organization number.
- **Website (`Mabdel Website/src/context/TelnyxVoiceContext.jsx`):**
  - Uses `@telnyx/webrtc` (`TelnyxRTC`) to register the browser client, dial outbound numbers, and answer inbound rings.
- **Mobile (`madbel-mobile/src/voice/`):**
  - Split between `VoiceProvider.js` (`@telnyx/react-native-voice-sdk` + `react-native-webrtc` for Android/iOS native) and `VoiceProvider.web.js` (`@telnyx/react-voice-commons-sdk` for web). Always check both files when modifying shared call state in mobile.

