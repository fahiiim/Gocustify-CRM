import pytest
from datetime import datetime, timezone
from bson import ObjectId
from app.services.smartflow.calendar_sync_service import (
    CalendarSyncService,
    compute_event_sync_hash,
)

def test_compute_event_sync_hash_determinism():
    t1 = datetime(2026, 11, 20, 10, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 11, 20, 11, 0, tzinfo=timezone.utc)

    h1 = compute_event_sync_hash("Team Standup", t1, t2, location="Room A", description="Weekly sync")
    h2 = compute_event_sync_hash("team standup", t1, t2, location="room a", description="weekly sync")
    assert h1 == h2

    h3 = compute_event_sync_hash("Team Standup", t1, t2, location="Room B", description="Weekly sync")
    assert h1 != h3

def test_should_sync_to_platform_bounce_loop_guard():
    sync = CalendarSyncService(None)
    event_from_google = {
        "sync_origin": "google_business",
        "title": "Google Event",
        "google_event_id": "g123",
    }
    # Origin provider match -> skip outbound push to prevent infinite loop
    assert sync.should_sync_to_platform(event_from_google, "google_business") is False
    assert sync.should_sync_to_platform(event_from_google, "microsoft") is True

@pytest.mark.asyncio
async def test_deduplicate_and_upsert_remote_event(mock_db):
    sync = CalendarSyncService(mock_db)
    user_id = str(ObjectId())

    start_time = datetime(2026, 12, 1, 14, 0, tzinfo=timezone.utc)
    end_time = datetime(2026, 12, 1, 15, 0, tzinfo=timezone.utc)

    # 1. Existing local event created by user directly
    local_event_res = await mock_db.calendar_events.insert_one({
        "user_id": user_id,
        "title": "Client Consultation",
        "starts_at": start_time,
        "ends_at": end_time,
        "location": "Main Clinic",
        "sync_origin": "local",
    })
    local_id = local_event_res.inserted_id

    # 2. Remote event arrives from Google Calendar with identical slot & title
    remote_data = {
        "title": "Client Consultation",
        "starts_at": start_time,
        "ends_at": end_time,
        "location": "Main Clinic",
        "description": "Imported remote details",
    }

    res = await sync.deduplicate_and_upsert_remote_event(
        user_id=user_id,
        platform="google_business",
        remote_event_id="google_remote_999",
        mapped_event_data=remote_data,
    )

    # Should update existing instead of creating a second duplicate event
    assert res["action"] == "updated"
    assert res["event_id"] == str(local_id)

    total_events = await mock_db.calendar_events.count_documents({"user_id": user_id})
    assert total_events == 1

    updated_doc = await mock_db.calendar_events.find_one({"_id": local_id})
    assert updated_doc["google_event_id"] == "google_remote_999"
    assert updated_doc["sync_hash"] is not None

    # 3. Same remote event arrives again with identical data
    res_repeat = await sync.deduplicate_and_upsert_remote_event(
        user_id=user_id,
        platform="google_business",
        remote_event_id="google_remote_999",
        mapped_event_data=remote_data,
    )
    assert res_repeat["action"] == "skipped_unchanged"

    total_events_after = await mock_db.calendar_events.count_documents({"user_id": user_id})
    assert total_events_after == 1
