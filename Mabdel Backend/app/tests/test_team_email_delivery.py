from __future__ import annotations

import asyncio
from bson import ObjectId
from app.services.smartflow.conversation_service import ConversationService


def test_team_scoped_email_delivery_contact_lookup(mock_db, monkeypatch):
    """T24 / FEAT-DELIVERY-04: Staff user can reply via email to a contact created by Owner."""
    org_id = "org-email-team-1"
    owner_id = str(ObjectId())
    staff_id = str(ObjectId())
    contact_id = str(ObjectId())

    # Seed organization and users
    async def setup():
        await mock_db.organizations.insert_one({"organization_id": org_id})
        await mock_db.users.insert_many([
            {"_id": ObjectId(owner_id), "organization_id": org_id, "role": "owner", "email": "owner@team.com"},
            {"_id": ObjectId(staff_id), "organization_id": org_id, "role": "staff", "email": "staff@team.com"},
        ])
        # Contact created by OWNER
        await mock_db.contacts.insert_one({
            "_id": ObjectId(contact_id),
            "user_id": owner_id,
            "organization_id": org_id,
            "name": "Jane Patient",
            "email": "jane@example.com",
        })

    asyncio.run(setup())

    conv_service = ConversationService(mock_db)

    # Mock EmailDomainService to verify recipient and return True
    sent_emails = []

    class MockEmailDomainService:
        def __init__(self, db):
            self.db = db

        async def resolve_sender(self, user_id, prefix=None):
            return {"email": "support@team.com"}

        async def send_inbound_reply(self, **kwargs):
            sent_emails.append(kwargs)
            return True

    from app.services import email_domain
    monkeypatch.setattr(email_domain, "EmailDomainService", MockEmailDomainService)

    from app.services.email_service import EmailService
    async def mock_send_business_email(self, **kwargs):
        sent_emails.append(kwargs)
        return True
    monkeypatch.setattr(EmailService, "send_business_email", mock_send_business_email)

    # Staff user delivers email to the contact
    delivered = asyncio.run(
        conv_service._deliver_email(
            user_id=staff_id,
            contact_id=contact_id,
            content="Hello from our clinic staff!",
        )
    )

    assert delivered is True
    assert len(sent_emails) == 1
    assert sent_emails[0]["email"] == "jane@example.com"
    assert "Hello from our clinic staff!" in sent_emails[0]["text"]
