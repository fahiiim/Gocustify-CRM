from __future__ import annotations

import logging
from pathlib import Path
from typing import Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.helpers import utc_now

logger = logging.getLogger(__name__)


async def cleanup_tenant_cascading(
    db: AsyncIOMotorDatabase,
    organization_id: str | None = None,
    owner_id: str | None = None,
) -> dict[str, Any]:
    """
    T18 / FEAT-ADMIN-04: Cascading Tenant Cleanup on Hard Deletion.
    When a tenant or owner is deleted:
    1. Releases and unassigns allocated Telnyx phone numbers back to inventory.
    2. Purges document and media files stored on disk / S3.
    3. Purges documents, messages, contacts, calls, and integrations.
    4. Purges subordinate users, RBAC roles, and the organization record.
    """
    now = utc_now()
    resolved_org_id = organization_id

    # If owner_id is provided but organization_id is not, resolve org_id from owner
    if owner_id and not resolved_org_id:
        user_query = {"_id": ObjectId(owner_id)} if ObjectId.is_valid(owner_id) else {"_id": owner_id}
        owner_doc = await db.users.find_one(user_query)
        if owner_doc:
            resolved_org_id = owner_doc.get("organization_id")

    # If organization_id is provided but owner_id is not, resolve owner
    if resolved_org_id and not owner_id:
        owner_doc = await db.users.find_one({"organization_id": resolved_org_id, "role": "owner"})
        if owner_doc:
            owner_id = str(owner_doc["_id"])

    # Collect all team member IDs belonging to this organization / owner
    member_ids: set[str] = set()
    if owner_id:
        member_ids.add(str(owner_id))
    
    users_cursor = db.users.find({
        "$or": [
            {"organization_id": resolved_org_id} if resolved_org_id else {"created_by": str(owner_id)},
            {"created_by": str(owner_id)} if owner_id else {"organization_id": resolved_org_id},
        ]
    })
    async for u in users_cursor:
        member_ids.add(str(u["_id"]))

    user_id_matches = list(member_ids)
    user_id_or_oids = [ObjectId(uid) for uid in user_id_matches if ObjectId.is_valid(uid)] + user_id_matches

    # 1. Release / unassign Telnyx phone numbers
    telnyx_filter: dict[str, Any] = {
        "$or": [
            {"organization_id": resolved_org_id} if resolved_org_id else {"assigned_to": {"$in": user_id_matches}},
            {"assigned_to": {"$in": user_id_matches}},
        ]
    }
    released_numbers = await db.telnyx_phone_numbers.update_many(
        telnyx_filter,
        {
            "$set": {
                "status": "available",
                "assigned_to": None,
                "assigned_at": None,
                "organization_id": None,
                "updated_at": now,
            }
        },
    )

    # 2. Purge documents and physical files
    doc_filter: dict[str, Any] = {
        "$or": [
            {"organization_id": resolved_org_id} if resolved_org_id else {"user_id": {"$in": user_id_matches}},
            {"user_id": {"$in": user_id_matches}},
        ]
    }
    purged_files_count = 0
    docs_cursor = db.documents.find(doc_filter)
    async for doc in docs_cursor:
        for path_key in ("storage_path", "file_path", "local_path"):
            path_val = doc.get(path_key)
            if path_val:
                try:
                    p = Path(path_val)
                    if p.exists() and p.is_file():
                        p.unlink(missing_ok=True)
                        purged_files_count += 1
                except Exception as exc:
                    logger.warning("Failed to delete file %s during tenant cleanup: %s", path_val, exc)

    deleted_docs = await db.documents.delete_many(doc_filter)

    # 3. Purge social integrations, messages, contacts, and calls
    deleted_integrations = await db.social_integrations.delete_many(doc_filter)
    deleted_contacts = await db.contacts.delete_many(doc_filter)
    deleted_messages = await db.messages.delete_many(doc_filter)
    deleted_calls = await db.calls.delete_many(doc_filter)

    # 4. Purge users and RBAC assignments
    deleted_rbac = await db.rbac_user_roles.delete_many({
        "$or": [
            {"organization_id": resolved_org_id} if resolved_org_id else {"user_id": {"$in": user_id_matches}},
            {"user_id": {"$in": user_id_matches}},
        ]
    })
    deleted_users = await db.users.delete_many({"_id": {"$in": user_id_or_oids}})

    # 5. Purge organization record
    deleted_org_count = 0
    if resolved_org_id:
        res = await db.organizations.delete_one({"organization_id": resolved_org_id})
        deleted_org_count = res.deleted_count

    return {
        "organization_id": resolved_org_id,
        "released_phone_numbers": released_numbers.modified_count,
        "purged_files_count": purged_files_count,
        "deleted_documents": deleted_docs.deleted_count,
        "deleted_integrations": deleted_integrations.deleted_count,
        "deleted_contacts": deleted_contacts.deleted_count,
        "deleted_messages": deleted_messages.deleted_count,
        "deleted_calls": deleted_calls.deleted_count,
        "deleted_users": deleted_users.deleted_count,
        "deleted_rbac_roles": deleted_rbac.deleted_count,
        "deleted_organization": deleted_org_count,
    }
