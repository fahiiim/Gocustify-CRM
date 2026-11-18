from unittest.mock import MagicMock
from app.services.smartflow.ivr_engine import IVREngine

def test_ivr_early_dtmf_buffering_and_drain():
    engine = IVREngine()
    call_id = "call_test_123"

    # Digit received before agent is created
    result = engine.process_digit(call_id, "2", agent=None)
    assert result is False
    assert engine.peek_buffered_digits(call_id) == ["2"]

    # Another digit received
    engine.buffer_dtmf(call_id, "1")
    assert engine.peek_buffered_digits(call_id) == ["2", "1"]

    # Now agent connects
    mock_agent = MagicMock()
    mock_agent.is_speaking = False
    mock_agent.set_language_from_digit.return_value = True

    buffered = engine.get_buffered_digits(call_id)
    assert buffered == ["2", "1"]
    assert engine.peek_buffered_digits(call_id) == []

    # Drain digits to agent
    for d in buffered:
        engine.process_digit(call_id, d, mock_agent)

    assert mock_agent.set_language_from_digit.call_count == 2
    mock_agent.set_language_from_digit.assert_any_call("2")
    mock_agent.set_language_from_digit.assert_any_call("1")

def test_ivr_early_dtmf_barge_in():
    engine = IVREngine()
    call_id = "call_barge_in"

    mock_agent = MagicMock()
    mock_agent.is_speaking = True
    mock_agent.barge_in_triggered = False
    mock_agent.set_language_from_digit.return_value = True

    # Digit received while agent is speaking
    res = engine.process_digit(call_id, "3", mock_agent)
    assert res is True
    assert mock_agent.barge_in_triggered is True

def test_ivr_clear_buffer_on_hangup():
    engine = IVREngine()
    call_id = "call_hangup_clean"
    engine.buffer_dtmf(call_id, "5")
    assert len(engine.peek_buffered_digits(call_id)) == 1

    engine.clear_buffer(call_id)
    assert len(engine.peek_buffered_digits(call_id)) == 0
