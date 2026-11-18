import pytest
import asyncio
from bson import ObjectId
from app.core.security import create_access_token

def _auth_user(mock_db, email: str = "review_owner@example.com") -> tuple[dict[str, str], str]:
    user_id = str(ObjectId())
    asyncio.run(mock_db.users.insert_one({
        "_id": ObjectId(user_id),
        "email": email,
        "full_name": "Review Owner",
        "business_name": "Smile Dental Clinic",
        "role": "owner",
        "is_active": True,
        "is_verified": True,
    }))
    token = create_access_token(user_id, email)
    return {"Authorization": f"Bearer {token}"}, user_id

def test_google_business_reviews_api_flow(client, mock_db):
    headers, user_id = _auth_user(mock_db)

    # 1. Fetch accounts
    acc_resp = client.get("/api/v1/smartflow/integrations/google_business/accounts", headers=headers)
    assert acc_resp.status_code == 200
    accounts = acc_resp.json()["data"]
    assert len(accounts) >= 1
    assert accounts[0]["accountName"] == "Smile Dental Clinic"
    assert len(accounts[0]["locations"]) >= 1

    # 2. Insert mock Google review
    review_oid = ObjectId()
    review_id = "rev_google_123"
    asyncio.run(mock_db.google_reviews.insert_one({
        "_id": review_oid,
        "user_id": user_id,
        "location_id": "primary",
        "reviewId": review_id,
        "starRating": "FIVE",
        "comment": "Outstanding service and very polite staff!",
        "reviewer": {"displayName": "Michael Brown"},
    }))

    # 3. List reviews
    rev_resp = client.get("/api/v1/smartflow/integrations/google_business/accounts/default/locations/primary/reviews", headers=headers)
    assert rev_resp.status_code == 200
    revs = rev_resp.json()["data"]
    assert len(revs) == 1
    assert revs[0]["reviewId"] == review_id
    assert revs[0]["starRating"] == "FIVE"

    # 4. Reply to review
    reply_resp = client.put(
        f"/api/v1/smartflow/integrations/google_business/accounts/default/locations/primary/reviews/{review_id}/reply",
        headers=headers,
        json={"comment": "Thank you so much Michael! We appreciate your trust."},
    )
    assert reply_resp.status_code == 200
    assert reply_resp.json()["data"]["comment"] == "Thank you so much Michael! We appreciate your trust."

    # 5. Sync to inbox
    sync_resp = client.post(
        "/api/v1/smartflow/integrations/google_business/accounts/default/locations/primary/reviews/sync",
        headers=headers,
    )
    assert sync_resp.status_code == 200
    assert sync_resp.json()["data"]["synced"] == 1

    # Verify message in inbox
    inbox_msg = asyncio.run(mock_db.messages.find_one({"user_id": user_id, "platform": "google_reviews"}))
    assert inbox_msg is not None
    assert "Michael Brown" in inbox_msg["sender_name"]

    # 6. Delete review reply
    del_reply_resp = client.delete(
        f"/api/v1/smartflow/integrations/google_business/accounts/default/locations/primary/reviews/{review_id}/reply",
        headers=headers,
    )
    assert del_reply_resp.status_code == 200
    updated_rev = asyncio.run(mock_db.google_reviews.find_one({"reviewId": review_id}))
    assert "reviewReply" not in updated_rev or updated_rev.get("reviewReply") is None
