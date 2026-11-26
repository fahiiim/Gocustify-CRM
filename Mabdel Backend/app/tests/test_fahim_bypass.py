from __future__ import annotations
import pytest
from app.core.config import settings

def test_fahim_subscription_signup_bypasses_stripe(client, mock_db, monkeypatch):
    """When fahimsarker0805@gmail.com signs up on /subscription, Stripe is completely bypassed
    and the user account is provisioned directly with Owner and Enterprise access."""
    payload = {
        "full_name": "Fahim Sarker",
        "original_email": "fahimsarker0805@gmail.com",
        "business_name": "Fahim Dental Care",
        "business_address": "123 Main St",
        "owner_dob": "1995-05-08",
        "phone_no": "+15551234567",
        "business_type": "Dental Clinic",
        "plan": "subscribe",
        "tier": "enterprise",
    }
    response = client.post("/api/v1/auth/subscription-signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "checkout_url" in data["data"]
    assert "/login?email=fahimsarker0805@gmail.com" in data["data"]["checkout_url"]

    # Verify user can log in with Fahim1234!
    login_resp = client.post("/api/v1/auth/login", json={"email": "fahimsarker0805@gmail.com", "password": "Fahim1234!"})
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    assert login_resp.json()["data"]["user"]["role"] == "owner"

    # Verify gated route is accessible with this token without subscription error
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["email"] == "fahimsarker0805@gmail.com"


def test_fahim_register_on_login_page_bypasses_subscription(client, mock_db):
    """When fahimsarker0805@gmail.com registers via /login form, they are created as Owner
    with active enterprise status and can immediately log in with their chosen password."""
    # Clean up previous if any
    import asyncio
    asyncio.run(mock_db.users.delete_many({"$or": [{"email": "fahimsarker0805@gmail.com"}, {"original_email": "fahimsarker0805@gmail.com"}]}))

    reg_payload = {
        "full_name": "Fahim Sarker",
        "email": "fahimsarker0805@gmail.com",
        "password": "MyChosenPassword123!",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201

    # Login directly
    login_resp = client.post("/api/v1/auth/login", json={"email": "fahimsarker0805@gmail.com", "password": "MyChosenPassword123!"})
    assert login_resp.status_code == 200
    assert login_resp.json()["data"]["user"]["role"] == "owner"
