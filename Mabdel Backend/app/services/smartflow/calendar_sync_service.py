"""
CalendarSyncService: Bi-directional synchronization, hash gating, and deduplication
between Google, Microsoft, and internal calendar systems.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.helpers import utc_now

logger = logging.getLogger(__name__)


def compute_event_sync_hash(
    title: str | None,
    starts_at: datetime | str | None,
    ends_at: datetime | str | None,
    location: str | None = None,
    description: str | None = None,
) -> str:
    """Calculates a deterministic SHA256 hash of event core scheduling attributes."""
    s_at = starts_at.isoformat() if isinstance(starts_at, datetime) else str(starts_at or "")
    e_at = ends_at.isoformat() if isinstance(ends_at, datetime) else str(ends_at or "")
    
    payload = [
        str(title or "").strip().lower(),
        s_at,
        e_at,
        str(location or "").strip().lower(),
        str(description or "").strip().lower(),
    ]
    raw = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class CalendarSyncService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    def should_sync_to_platform(self, event_doc: Dict[str, Any], target_platform: str) -> bool:
        """Determines if an event should be synced outbound to target_platform.
        Prevents bounce-back loop if event originated from that platform or if already synced.
        """
        origin = event_doc.get("sync_origin") or event_doc.get("origin_platform")
        if origin and origin.lower() == target_platform.lower():
            # Never bounce back an event to its source provider
            return False

        # If already synced and content hash unchanged, skip redundant push
        platform_id_key = f"{target_platform.lower()}_event_id"
        if target_platform.lower() == "google_business":
            platform_id_key = "google_event_id"
        elif target_platform.lower() in ("microsoft_calendar", "microsoft"):
            platform_id_key = "microsoft_event_id"

        current_hash = event_doc.get("sync_hash")
        last_synced_hash = event_doc.get("last_synced_hashes", {}).get(target_platform)
        if event_doc.get(platform_id_key) and current_hash and last_synced_hash == current_hash:
            return False

        return True

    async def deduplicate_and_upsert_remote_event(
        self,
        user_id: str,
        platform: str,
        remote_event_id: str,
        mapped_event_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Upserts an inbound event from an external provider (Google/Microsoft),
        preventing duplicate event rows through remote_id lookup, exact slot matching,
        and hash gating.
        """
        platform_key = "google_event_id" if "google" in platform.lower() else "microsoft_event_id"
        now = utc_now()
        new_hash = compute_event_sync_hash(
            title=mapped_event_data.get("title"),
            starts_at=mapped_event_data.get("starts_at"),
            ends_at=mapped_event_data.get("ends_at"),
            location=mapped_event_data.get("location"),
            description=mapped_event_data.get("description"),
        )

        # 1. Lookup by platform remote ID
        existing = await self.db.calendar_events.find_one({
            "user_id": user_id,
            platform_key: remote_event_id,
        })

        # 2. If not found by remote ID, search by exact time slot & title (e.g. created locally first)
        if not existing:
            existing = await self.db.calendar_events.find_one({
                "user_id": user_id,
                "starts_at": mapped_event_data.get("starts_at"),
                "ends_at": mapped_event_data.get("ends_at"),
                "title": mapped_event_data.get("title"),
            })

        if existing:
            # Check if event content has actually changed
            existing_hash = existing.get("sync_hash")
            if existing_hash == new_hash and existing.get(platform_key) == remote_event_id:
                return {"action": "skipped_unchanged", "event_id": str(existing["_id"])}

            # Update existing event
            update_fields = {
                **mapped_event_data,
                platform_key: remote_event_id,
                "sync_hash": new_hash,
                "updated_at": now,
            }
            if not existing.get("sync_origin"):
                update_fields["sync_origin"] = platform

            await self.db.calendar_events.update_one(
                {"_id": existing["_id"]},
                {"$set": update_fields},
            )
            return {"action": "updated", "event_id": str(existing["_id"])}

        # 3. Insert brand new event
        insert_doc = {
            "user_id": user_id,
            **mapped_event_data,
            platform_key: remote_event_id,
            "sync_origin": platform,
            "sync_hash": new_hash,
            "share_token": None,
            "created_at": now,
            "updated_at": now,
        }
        res = await self.db.calendar_events.insert_one(insert_doc)
        return {"action": "inserted", "event_id": str(res.inserted_id)}
