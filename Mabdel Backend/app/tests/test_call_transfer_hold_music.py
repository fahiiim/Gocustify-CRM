import pytest
from unittest.mock import MagicMock, patch
from app.services.call_service import CallService

@pytest.mark.asyncio
async def test_transfer_call_injects_hold_music():
    service = CallService()
    mock_client = MagicMock()

    with patch.object(service, "_client", return_value=mock_client), \
         patch("app.services.call_service.settings") as mock_settings:
        mock_settings.HOLD_MUSIC_URL = "https://cdn.example.com/audio/jazz-hold.mp3"

        # Default hold music injected
        res = await service.transfer_call("call_ctrl_123", to_number="+15551234567")
        assert res is True
        mock_client.calls.actions.transfer.assert_called_once_with(
            "call_ctrl_123",
            to="+15551234567",
            audio_url="https://cdn.example.com/audio/jazz-hold.mp3",
        )

@pytest.mark.asyncio
async def test_transfer_call_custom_hold_music():
    service = CallService()
    mock_client = MagicMock()

    with patch.object(service, "_client", return_value=mock_client):
        res = await service.transfer_call(
            "call_ctrl_456",
            to_number="+15559876543",
            audio_url="https://cdn.example.com/audio/custom-chime.mp3",
        )
        assert res is True
        mock_client.calls.actions.transfer.assert_called_once_with(
            "call_ctrl_456",
            to="+15559876543",
            audio_url="https://cdn.example.com/audio/custom-chime.mp3",
        )

@pytest.mark.asyncio
async def test_play_and_stop_hold_music():
    service = CallService()
    mock_client = MagicMock()

    with patch.object(service, "_client", return_value=mock_client):
        start_res = await service.play_hold_music("call_ctrl_789", audio_url="https://cdn.example.com/audio/stream.mp3")
        assert start_res is True
        mock_client.calls.actions.playback_start.assert_called_once_with(
            "call_ctrl_789",
            audio_url="https://cdn.example.com/audio/stream.mp3",
        )

        stop_res = await service.stop_hold_music("call_ctrl_789")
        assert stop_res is True
        mock_client.calls.actions.playback_stop.assert_called_once_with("call_ctrl_789")
