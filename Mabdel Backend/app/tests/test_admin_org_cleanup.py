from __future__ import annotations

import asyncio
from pathlib import Path
from bson import ObjectId

from app.services.tenant_cleanup_service import cleanup_tenant_cascading


def test_cascading_tenant_cleanup_releases_dids_and_purges_assets(mock_db, tmp_path):
    # Setup test organization and owner
    org_id = "test-org-cleanup-1"
    owner_id = str(ObjectId())
    staff_id = str(ObjectId())

    # Create dummy file on disk representing uploaded document
    test_file = tmp_path / "tenant_contract.pdf"
    test_file.write_text("dummy contract contents")
    assert test_file.exists()

    async def setup_data():
        # Organization
        await mock_db.organizations.insert_one({
            "organization_id": org_id,
            "name": "Acme Dental Care",
        })
        # Users
        await mock_db.users.insert_many([
            {"_id": ObjectId(owner_id), "email": "owner@acmedental.com", "role": "owner", "organization_id": org_id},
            {"_id": ObjectId(staff_id), "email": "staff@acmedental.com", "role": "staff", "organization_id": org_id},
        ])
        # Telnyx phone number assigned
        await mock_db.telnyx_phone_numbers.insert_one({
            "phone_number": "+18005550199",
            "status": "assigned",
            "assigned_to": owner_id,
            "organization_id": org_id,
        })
        # Document record pointing to the file on disk
        await mock_db.documents.insert_one({
            "organization_id": org_id,
            "user_id": owner_id,
            "name": "Contract.pdf",
            "storage_path": str(test_file),
        })
        # Contacts, messages, integrations
        await mock_db.contacts.insert_one({"organization_id": org_id, "name": "Patient Zero"})
        await mock_db.messages.insert_one({"organization_id": org_id, "content": "Welcome message"})
        await mock_db.social_integrations.insert_one({"organization_id": org_id, "platform": "facebook_messenger"})
        await mock_db.rbac_user_roles.insert_one({"organization_id": org_id, "user_id": staff_id, "role": "staff"})

    asyncio.run(setup_data())

    # Execute cascading cleanup
    result = asyncio.run(cleanup_tenant_cascading(mock_db, organization_id=org_id))

    assert result["released_phone_numbers"] == 1
    assert result["deleted_documents"] == 1
    assert result["purged_files_count"] == 1
    assert result["deleted_organization"] == 1
    assert result["deleted_users"] >= 2

    # Verify Telnyx number is released back to available
    number_doc = asyncio.run(mock_db.telnyx_phone_numbers.find_one({"phone_number": "+18005550199"}))
    assert number_doc["status"] == "available"
    assert number_doc["assigned_to"] is None
    assert number_doc["organization_id"] is None

    # Verify physical file was unlinked
    assert not test_file.exists()

    # Verify database collections were purged
    assert asyncio.run(mock_db.organizations.count_documents({"organization_id": org_id})) == 0
    assert asyncio.run(mock_db.users.count_documents({"organization_id": org_id})) == 0
    assert asyncio.run(mock_db.documents.count_documents({"organization_id": org_id})) == 0
    assert asyncio.run(mock_db.contacts.count_documents({"organization_id": org_id})) == 0
    assert asyncio.run(mock_db.messages.count_documents({"organization_id": org_id})) == 0
    assert asyncio.run(mock_db.social_integrations.count_documents({"organization_id": org_id})) == 0
