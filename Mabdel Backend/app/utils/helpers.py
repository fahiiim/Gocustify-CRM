from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId


def utc_now() -> datetime:
    return datetime.now(UTC)


def generate_otp(length: int = 6) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def to_object_id(value: str) -> ObjectId:
    return ObjectId(value)


def _with_utc_tzinfo(value: Any) -> Any:
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    if isinstance(value, dict):
        return {key: _with_utc_tzinfo(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_with_utc_tzinfo(item) for item in value]
    return value


def serialize_mongo_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return None
    serialized = {key: _with_utc_tzinfo(value) for key, value in document.items()}
    if "_id" in serialized:
        serialized["_id"] = str(serialized["_id"])
    return serialized


def serialize_mongo_documents(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [serialize_mongo_document(document) or {} for document in documents]


async def resolve_team_user_ids(db, user_id: str) -> list[str]:
    """Every user_id that shares CRM data visibility with this user: every member of
    the same organization, or just themselves if they aren't scoped to one."""
    if not ObjectId.is_valid(user_id):
        return [user_id]
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"organization_id": 1})
    org_id = (user or {}).get("organization_id")
    if not org_id:
        return [user_id]
    return await resolve_organization_user_ids(db, org_id)


async def resolve_organization_user_ids(db, organization_id: str) -> list[str]:
    """Every user_id belonging to an organization, given its id directly (no seed user
    to look up first) — e.g. resolving who to ring for a business's shared phone number."""
    docs = await db.users.find({"organization_id": organization_id}, {"_id": 1}).to_list(None)
    return [str(d["_id"]) for d in docs]


def mask_email(email: str) -> str:
    name, domain = email.split("@")
    if len(name) <= 2:
        masked_name = f"{name[0]}*" if len(name) == 2 else "*"
    else:
        masked_name = f"{name[:2]}***"
    return f"{masked_name}@{domain}"


def parse_decimal_string(val: Any) -> float | None:
    """Parse a numeric string or number into a float, supporting both US and European
    decimal and thousands separator styles (e.g. '1,5', '1.234,50', '1,234.50').
    Rejects booleans, NaN/Inf, malformed and ambiguous strings (like '1,234')."""
    import math
    import re

    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    s = str(val).strip().lstrip("$€£¥").strip()
    if not s or ",," in s or ".." in s:
        return None

    # German/European style: 1.234,50 or 1.000.000,50
    if re.match(r"^\d{1,3}(\.\d{3})+,\d+$", s):
        clean = s.replace(".", "").replace(",", ".")
        try:
            return float(clean)
        except ValueError:
            return None

    # US/UK style: 1,234.50 or 1,000,000.50
    if re.match(r"^\d{1,3}(,\d{3})+\.\d+$", s):
        clean = s.replace(",", "")
        try:
            return float(clean)
        except ValueError:
            return None

    # Single comma, no dot: e.g. '1,5' or '1,50' or '0,75' -> European decimal
    if "," in s and "." not in s:
        parts = s.split(",")
        if len(parts) == 2:
            # Reject ambiguous strings such as '1,234' with exactly 3 trailing digits
            if len(parts[1]) == 3:
                return None
            try:
                return float(s.replace(",", "."))
            except ValueError:
                return None
        return None

    # Single dot, no comma: e.g. '1.5' or '1234.50'
    if "." in s and "," not in s:
        parts = s.split(".")
        if len(parts) == 2:
            try:
                return float(s)
            except ValueError:
                return None
        return None

    # Plain integer digits: e.g. '1500'
    if re.match(r"^\d+$", s):
        try:
            return float(s)
        except ValueError:
            return None

    return None

