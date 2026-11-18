"""
IVREngine: Handles DTMF input buffering, early barge-in, and menu routing.
Ensures that keypresses sent before or during prompt playback are buffered and processed.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class IVREngine:
    """Manages DTMF buffers and early barge-in processing across call sessions."""

    def __init__(self) -> None:
        self._early_dtmf_buffers: Dict[str, List[str]] = {}

    def buffer_dtmf(self, call_id: str, digit: str) -> None:
        """Buffers an early DTMF keypress received before the agent is ready or during prompt playback."""
        if not digit:
            return
        buf = self._early_dtmf_buffers.setdefault(call_id, [])
        buf.append(str(digit))
        logger.info("Call %s: buffered early DTMF digit '%s' (total buffered: %d)", call_id, digit, len(buf))

    def get_buffered_digits(self, call_id: str) -> List[str]:
        """Returns and clears all buffered DTMF digits for the call."""
        return self._early_dtmf_buffers.pop(call_id, [])

    def peek_buffered_digits(self, call_id: str) -> List[str]:
        """Returns current buffered DTMF digits without removing them."""
        return list(self._early_dtmf_buffers.get(call_id, []))

    def clear_buffer(self, call_id: str) -> None:
        """Cleans up any buffered DTMF digits when a call hangs up or completes."""
        self._early_dtmf_buffers.pop(call_id, None)

    def process_digit(self, call_id: str, digit: str, agent: Any = None) -> bool:
        """Processes a DTMF digit against an agent.
        If the agent is speaking, activates barge-in.
        Returns True if handled, or False if buffered or ignored.
        """
        if not digit:
            return False

        if agent is None:
            self.buffer_dtmf(call_id, digit)
            return False

        # If agent is currently speaking, trigger early barge-in
        if getattr(agent, "is_speaking", False):
            setattr(agent, "barge_in_triggered", True)
            logger.info("Call %s: Early DTMF barge-in triggered on digit '%s'", call_id, digit)

        # Apply language switch or menu routing if agent supports it
        if hasattr(agent, "set_language_from_digit"):
            handled = agent.set_language_from_digit(digit)
            if handled and hasattr(agent, "acknowledge_language_switch"):
                import asyncio
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(agent.acknowledge_language_switch())
                except RuntimeError:
                    # No active event loop in thread/test environment
                    pass
            return handled

        return False


ivr_engine = IVREngine()
