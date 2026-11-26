from __future__ import annotations

import re
from typing import Any
from bson import ObjectId


_MAX_REGEX_LEN = 250


def safe_regex(term: str | None, options: str = "i", exact: bool = False) -> dict[str, str]:
    """
    Safely build a MongoDB $regex filter with re.escape to prevent
    NoSQL regex injection and ReDoS (Regular Expression Denial of Service).

    Returns an empty dict if term is empty or whitespace.
    """
    if not term:
        return {}
    clean = str(term).strip()
    if not clean:
        return {}
    # Truncate overly long search terms to protect against CPU exhaustion
    if len(clean) > _MAX_REGEX_LEN:
        clean = clean[:_MAX_REGEX_LEN]
    escaped = re.escape(clean)
    pattern = f"^{escaped}$" if exact else escaped
    return {"$regex": pattern, "$options": options}


def safe_search_or(fields: list[str], search: str | None, options: str = "i") -> dict[str, list[dict[str, Any]]]:
    """
    Safely build a MongoDB $or query across multiple fields with re.escape.
    Returns an empty dict if search is empty or fields list is empty.
    """
    if not search or not str(search).strip() or not fields:
        return {}
    pattern = safe_regex(search, options=options)
    if not pattern:
        return {}
    return {"$or": [{field: pattern} for field in fields]}


def sanitize_nosql_dict(data: Any, max_depth: int = 8) -> Any:
    """
    Recursively remove or sanitize keys starting with '$' or containing '.'
    to prevent operator injection or unauthorized subdocument modification.
    """
    if max_depth <= 0:
        return {}
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            str_key = str(key)
            # Block keys starting with $ (operator injection) or containing . (path traversal)
            if str_key.startswith("$") or "." in str_key:
                continue
            sanitized[str_key] = sanitize_nosql_dict(value, max_depth - 1)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_nosql_dict(item, max_depth - 1) for item in data]
    return data


def safe_object_id(val: Any) -> ObjectId | None:
    """
    Safely validate and construct an ObjectId. Returns None if invalid.
    """
    if not val:
        return None
    if isinstance(val, ObjectId):
        return val
    try:
        str_val = str(val).strip()
        if ObjectId.is_valid(str_val):
            return ObjectId(str_val)
    except Exception:
        pass
    return None
