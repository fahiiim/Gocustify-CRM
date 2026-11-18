from __future__ import annotations

from app.tests.conftest import grant_role
from app.tests.test_team_direct_messaging import _signup

# Regression coverage for a real, confirmed vulnerability: the platform admin
# "manage any user" routes (/api/v1/dashboard/admin/users/{id}, .../status)
# checked only the "users:edit"/"users:view" permission slug, which every
# business owner holds for managing their own team. There was no organization
# check, so any owner account could read or edit any other organization's
# user - including changing that user's email, which can rebind Google OAuth
# login and password-recovery identity. These routes are platform-admin-only
# by design (only madbel-dashboard calls them, never the owner-facing app),
# so the fix restricts them to the admin/super_admin roles outright rather
# than trying to carve out a per-organization exception.


def test_an_owner_cannot_read_another_organizations_user(client, mock_db):
    owner_headers, _ = _signup(client, mock_db, "admin-guard-owner@example.com", "Owner")
    _, stranger_id = _signup(client, mock_db, "admin-guard-stranger@example.com", "Stranger")

    response = client.get(f"/api/v1/dashboard/admin/users/{stranger_id}", headers=owner_headers)

    assert response.status_code == 403


def test_an_owner_cannot_change_another_organizations_users_email(client, mock_db):
    owner_headers, _ = _signup(client, mock_db, "admin-guard-owner2@example.com", "Owner")
    _, stranger_id = _signup(client, mock_db, "admin-guard-stranger2@example.com", "Stranger")

    response = client.patch(
        f"/api/v1/dashboard/admin/users/{stranger_id}",
        headers=owner_headers,
        json={"email": "attacker-controlled@example.com"},
    )

    assert response.status_code == 403
    stranger = client.get(f"/api/v1/dashboard/admin/users/{stranger_id}", headers=owner_headers)
    assert stranger.status_code == 403  # still can't even read it back, let alone have changed it


def test_an_owner_cannot_block_another_organizations_user(client, mock_db):
    owner_headers, _ = _signup(client, mock_db, "admin-guard-owner3@example.com", "Owner")
    _, stranger_id = _signup(client, mock_db, "admin-guard-stranger3@example.com", "Stranger")

    response = client.patch(
        f"/api/v1/dashboard/admin/users/{stranger_id}/status",
        headers=owner_headers,
        json={"status": "blocked"},
    )

    assert response.status_code == 403


def test_an_owner_cannot_block_another_organizations_user_via_the_block_alias_route(client, mock_db):
    """Regression for R01: the main PATCH .../status route was restricted to
    admin/super_admin, but the /block, /ban, /unblock, /unban alias routes
    still used require_permission("users", "edit"), which every owner holds -
    the restriction never actually covered these aliases."""
    owner_headers, _ = _signup(client, mock_db, "admin-guard-owner4@example.com", "Owner")
    _, stranger_id = _signup(client, mock_db, "admin-guard-stranger4@example.com", "Stranger")

    for path in ("block", "ban"):
        response = client.post(f"/api/v1/dashboard/admin/users/{stranger_id}/{path}", headers=owner_headers)
        assert response.status_code == 403, path

    for path in ("unblock", "unban"):
        response = client.post(f"/api/v1/dashboard/admin/users/{stranger_id}/{path}", headers=owner_headers)
        assert response.status_code == 403, path


def test_a_platform_admin_can_still_manage_any_organizations_user(client, mock_db):
    admin_headers, _ = _signup(client, mock_db, "admin-guard-admin@example.com", "Platform Admin")
    grant_role(mock_db, "admin-guard-admin@example.com", "admin")
    _, target_id = _signup(client, mock_db, "admin-guard-target@example.com", "Target")

    response = client.get(f"/api/v1/dashboard/admin/users/{target_id}", headers=admin_headers)

    assert response.status_code == 200


def test_a_platform_admin_cannot_modify_or_block_a_super_admin(client, mock_db):
    """Regression test for T06 / FEAT-RBAC-04: Subordinate Admins must not be
    able to update profile, change email, or toggle status of a Super Admin."""
    admin_headers, _ = _signup(client, mock_db, "subordinate-admin@example.com", "Sub Admin")
    grant_role(mock_db, "subordinate-admin@example.com", "admin")

    _, super_admin_id = _signup(client, mock_db, "supreme-admin@example.com", "Super Admin")
    grant_role(mock_db, "supreme-admin@example.com", "super_admin")

    # 1. Subordinate Admin attempts to edit Super Admin profile
    patch_res = client.patch(
        f"/api/v1/dashboard/admin/users/{super_admin_id}",
        headers=admin_headers,
        json={"email": "compromised@example.com"},
    )
    assert patch_res.status_code == 403
    assert "Super Admin" in patch_res.json().get("message", "")

    # 2. Subordinate Admin attempts to block Super Admin via status route
    status_res = client.patch(
        f"/api/v1/dashboard/admin/users/{super_admin_id}/status",
        headers=admin_headers,
        json={"status": "blocked"},
    )
    assert status_res.status_code == 403

    # 3. Subordinate Admin attempts to block Super Admin via alias route
    block_res = client.post(
        f"/api/v1/dashboard/admin/users/{super_admin_id}/block",
        headers=admin_headers,
    )
    assert block_res.status_code == 403


def test_a_super_admin_can_manage_users(client, mock_db):
    """Super Admin has full authority to manage and block users."""
    super_headers, _ = _signup(client, mock_db, "boss-admin@example.com", "Boss")
    grant_role(mock_db, "boss-admin@example.com", "super_admin")

    _, target_id = _signup(client, mock_db, "sub-user@example.com", "Sub User")

    status_res = client.patch(
        f"/api/v1/dashboard/admin/users/{target_id}/status",
        headers=super_headers,
        json={"status": "blocked"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["data"] is True
