from __future__ import annotations

import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Tuple

from app.core.exceptions import AppException

# Common US/Canada Area Code to IANA Timezone mapping
AREA_CODE_TIMEZONES: dict[str, str] = {
    # Eastern (sample standard area codes)
    "201": "America/New_York", "202": "America/New_York", "203": "America/New_York",
    "212": "America/New_York", "215": "America/New_York", "216": "America/New_York",
    "305": "America/New_York", "315": "America/New_York", "330": "America/New_York",
    "404": "America/New_York", "412": "America/New_York", "516": "America/New_York",
    "518": "America/New_York", "617": "America/New_York", "703": "America/New_York",
    "718": "America/New_York", "770": "America/New_York", "804": "America/New_York",
    "813": "America/New_York", "845": "America/New_York", "860": "America/New_York",
    "914": "America/New_York", "917": "America/New_York", "973": "America/New_York",

    # Central
    "210": "America/Chicago", "214": "America/Chicago", "217": "America/Chicago",
    "281": "America/Chicago", "312": "America/Chicago", "314": "America/Chicago",
    "414": "America/Chicago", "469": "America/Chicago", "504": "America/Chicago",
    "512": "America/Chicago", "612": "America/Chicago", "615": "America/Chicago",
    "630": "America/Chicago", "708": "America/Chicago", "713": "America/Chicago",
    "817": "America/Chicago", "832": "America/Chicago", "847": "America/Chicago",
    "901": "America/Chicago", "918": "America/Chicago", "972": "America/Chicago",

    # Mountain
    "303": "America/Denver", "385": "America/Denver", "406": "America/Denver",
    "480": "America/Phoenix", "505": "America/Denver", "520": "America/Phoenix",
    "602": "America/Phoenix", "623": "America/Phoenix", "719": "America/Denver",
    "720": "America/Denver", "801": "America/Denver", "970": "America/Denver",

    # Pacific
    "206": "America/Los_Angeles", "209": "America/Los_Angeles", "213": "America/Los_Angeles",
    "253": "America/Los_Angeles", "310": "America/Los_Angeles", "323": "America/Los_Angeles",
    "408": "America/Los_Angeles", "415": "America/Los_Angeles", "425": "America/Los_Angeles",
    "503": "America/Los_Angeles", "509": "America/Los_Angeles", "510": "America/Los_Angeles",
    "530": "America/Los_Angeles", "562": "America/Los_Angeles", "619": "America/Los_Angeles",
    "626": "America/Los_Angeles", "650": "America/Los_Angeles", "661": "America/Los_Angeles",
    "702": "America/Los_Angeles", "707": "America/Los_Angeles", "714": "America/Los_Angeles",
    "760": "America/Los_Angeles", "818": "America/Los_Angeles", "858": "America/Los_Angeles",
    "909": "America/Los_Angeles", "916": "America/Los_Angeles", "925": "America/Los_Angeles",
    "949": "America/Los_Angeles", "971": "America/Los_Angeles",

    # Alaska & Hawaii
    "907": "America/Anchorage",
    "808": "Pacific/Honolulu",
}


def resolve_recipient_timezone(phone_number: str | None, default_tz: str = "America/New_York") -> str:
    """Extract area code from phone number (E.164 or national format) and resolve recipient timezone."""
    if not phone_number:
        return default_tz

    digits = re.sub(r"\D", "", phone_number)
    # North American numbers: 1 + 10 digits or 10 digits
    if len(digits) == 11 and digits.startswith("1"):
        area_code = digits[1:4]
    elif len(digits) == 10:
        area_code = digits[0:3]
    else:
        return default_tz

    return AREA_CODE_TIMEZONES.get(area_code, default_tz)


def is_tcpa_quiet_hours(
    phone_number: str | None = None,
    check_time: datetime | None = None,
    recipient_timezone: str | None = None,
) -> Tuple[bool, str]:
    """
    Evaluates whether the given moment falls within TCPA quiet hours (before 8:00 AM or after 9:00 PM local time).
    Returns (is_quiet_hours, reason).
    """
    tz_name = recipient_timezone or resolve_recipient_timezone(phone_number)
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("America/New_York")

    now_utc = check_time or datetime.now(timezone.utc)
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)

    local_dt = now_utc.astimezone(tz)
    local_hour = local_dt.hour

    # TCPA standard: 08:00 to 21:00 recipient local time
    if local_hour < 8 or local_hour >= 21:
        return (
            True,
            f"TCPA quiet hours active: outbound calls are prohibited between 9:00 PM and 8:00 AM recipient local time. "
            f"Current recipient local time is {local_dt.strftime('%I:%M %p')} ({tz_name}).",
        )

    return (False, "Compliant")


def assert_tcpa_compliant(
    phone_number: str | None,
    check_time: datetime | None = None,
    recipient_timezone: str | None = None,
    bypass_quiet_hours: bool = False,
) -> None:
    """Raises AppException if placing an outbound call violates TCPA quiet hours."""
    if bypass_quiet_hours:
        return

    quiet, reason = is_tcpa_quiet_hours(phone_number, check_time, recipient_timezone)
    if quiet:
        raise AppException(
            status_code=400,
            code="TCPA_QUIET_HOURS_VIOLATION",
            message=reason,
        )
