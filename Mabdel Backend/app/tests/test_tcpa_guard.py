from __future__ import annotations

from datetime import datetime, timezone
import pytest
from app.core.exceptions import AppException
from app.services.smartflow.tcpa_guard import (
    resolve_recipient_timezone,
    is_tcpa_quiet_hours,
    assert_tcpa_compliant,
)


def test_tcpa_area_code_timezone_resolution():
    assert resolve_recipient_timezone("+12125550123") == "America/New_York"
    assert resolve_recipient_timezone("3125554321") == "America/Chicago"
    assert resolve_recipient_timezone("+13035557890") == "America/Denver"
    assert resolve_recipient_timezone("+12135559999") == "America/Los_Angeles"
    assert resolve_recipient_timezone("+18085551111") == "Pacific/Honolulu"
    # Fallback default
    assert resolve_recipient_timezone("+19995551111") == "America/New_York"


def test_tcpa_quiet_hours_detection():
    # 212 is Eastern time (UTC-5 in standard, UTC-4 in daylight)
    # Set check_time: 07:00 UTC = 02:00 AM or 03:00 AM local time -> Quiet Hours
    night_time = datetime(2026, 11, 18, 7, 0, 0, tzinfo=timezone.utc)
    is_quiet, reason = is_tcpa_quiet_hours("+12125550123", check_time=night_time)
    assert is_quiet is True
    assert "TCPA quiet hours active" in reason

    # 18:00 UTC = 13:00 or 14:00 local time -> Compliant (Business hours)
    day_time = datetime(2026, 11, 18, 18, 0, 0, tzinfo=timezone.utc)
    is_quiet, reason = is_tcpa_quiet_hours("+12125550123", check_time=day_time)
    assert is_quiet is False
    assert reason == "Compliant"

    # Late night 22:00 local time (03:00 UTC next day) -> Quiet Hours
    late_time = datetime(2026, 11, 19, 3, 30, 0, tzinfo=timezone.utc)
    is_quiet, reason = is_tcpa_quiet_hours("+12125550123", check_time=late_time)
    assert is_quiet is True


def test_assert_tcpa_compliant_raises_on_violation():
    night_time = datetime(2026, 11, 18, 7, 0, 0, tzinfo=timezone.utc)

    with pytest.raises(AppException) as exc_info:
        assert_tcpa_compliant("+12125550123", check_time=night_time)
    assert exc_info.value.code == "TCPA_QUIET_HOURS_VIOLATION"

    # Bypass allows it through
    assert_tcpa_compliant("+12125550123", check_time=night_time, bypass_quiet_hours=True)
