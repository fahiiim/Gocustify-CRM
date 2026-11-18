# Database & Multi-Tenancy Schema Reference (`08_DATABASE_AND_TENANCY_SCHEMA.md`)

This document explains how MongoDB collections, organization tenancy (`organization_id` vs `user_id`), and RBAC permissions are structured across `Mabdel Backend`.

---

## 1. Multi-Tenancy Model (`organization_id` vs `user_id`)

1. **How an Organization ID is Assigned:**
   - When a business **Owner** registers (or completes onboarding), their `organization_id` is typically set to `str(owner_user["_id"])` (or a dedicated org identifier stored in `users.organization_id` and `organizations.organization_id`).
   - When the Owner or a Manager invites/creates team members (`manager`, `staff`, `assistant`), those team members receive the **exact same** `organization_id` on their `users` document (`users.organization_id`).
2. **Two Scoping Patterns in MongoDB Queries:**
   - **Pattern A — Direct `organization_id` scoping:**
     Used by org-level collections (`organizations`, `call_meeting_requests`, `telnyx_numbers`, `booking_leases`, `receptionist_actions`, `email_domains`).
   - **Pattern B — Team `user_id` list scoping (`{"user_id": {"$in": team_ids}}`):**
     Used by collections originally designed around `user_id` (`contacts`, `conversations`, `messages`, `calendar_events`, `call_logs`, `social_integrations`, `invoices`, `leases`, `agreements`, `groups`).
   - **Always use `SmartFlowBase` helpers** (`app/services/smartflow/_base_mixins/access.py`):
     - `await self._resolve_organization_id(user_id)` → returns the user's `organization_id` (falling back to `str(user_id)` for standalone owners).
     - `await self._resolve_team_user_ids(user_id)` → returns all `str(u["_id"])` in the same organization so queries like `{"user_id": {"$in": team_ids}}` give org-wide visibility to owners, managers, staff, and assistants.
     - `await self._resolve_org_owner_user_id(user_id)` → resolves the primary owner's `user_id` for an organization.

---

## 2. Core MongoDB Collections Cheat-Sheet

### Identity, Tenancy & RBAC
| Collection | Primary Key / Lookup | Key Fields & Notes |
|---|---|---|
| `users` | `_id` (ObjectId), `email` | `full_name`, `email`, `password_hash`, `role` / `primary_role` (`super_admin`, `admin`, `owner`, `manager`, `staff`, `assistant`), `organization_id`, `status` (`active`, `blocked`, `pending`), `is_verified`, `subscription_plan`, `subscription_status`, `trial_ends_at`, `stripe_customer_id`, `stripe_account_id`. |
| `organizations` | `organization_id` (str) | `organization_id`, `name`, `owner_user_id`, `business_hours` (`timezone`, `days`, `start_hour`, `end_hour`, `slot_minutes`), `require_meeting_approval` (bool), `ai_call_settings` (nested dict: `assistant_name`, `voice_id`, `business_type`, `greeting_inbound`, `greeting_outbound`, `closing_message`, `custom_instructions`, `language_menu_enabled`, `language_menu`, `sms_confirmations_enabled`, `appointment_reminders_enabled`, `appointment_reminder_hours_before`, `capabilities`). |
| `business_profiles` | `user_id` (str) | `user_id`, `business_name`, `business_category`, `phone_number`, `website`, `office_address` (`street_address`, `city`, `state`, `postal_code`, `country`). |
| `rbac_roles` | `name` / `slug` | Role definitions (`super_admin`, `admin`, `owner`, `manager`, `staff`, `assistant`) and their default module/action permission matrices. |
| `rbac_user_roles` | `user_id` (str) | Maps `user_id` to assigned role(s) (`role_name`, `organization_id`). |
| `rbac_user_restrictions` | `(user_id, organization_id)` | Per-user permission cap (`allowed_permissions: list[str]`). Intersected (`&=`) with role permissions in `RBACRepository.get_user_effective_permissions()`. |
| `rbac_audit_logs` | `_id` | Audit trail for role/permission and team-status changes. |
| `otp_codes` | `(email, purpose)` | `code`, `purpose` (`signup`, `password_reset`, etc.), `expires_at`, `used`, `attempts`. |
| `refresh_tokens` | `token_hash` / `jti` | Tracks active/revoked refresh tokens. |

### Messaging, CRM & Social
| Collection | Primary Key / Lookup | Key Fields & Notes |
|---|---|---|
| `contacts` | `_id`, `user_id` | `user_id`, `name`, `email`, `phone`, `avatar_url`, `identities` (`[{"platform": "sms"\|"whatsapp"\|"email"\|..., "external_id": ..., "handle": ...}]`), `tags`, `notes`, `birthday`. |
| `conversations` | `_id`, `user_id` | `user_id`, `organization_id`, `contact_id`, `platform` (`sms`, `whatsapp`, `email`, `facebook`, `instagram`, `messenger`, `ai_receptionist`, `internal`), `type` (`direct`, `group`), `external_phone`, `last_message_at`, `unread_count`, `archived`. |
| `messages` | `_id`, `conversation_id` | `conversation_id`, `user_id`, `contact_id`, `platform`, `direction` (`inbound`, `outbound`), `content`, `attachments` (private media URLs), `status` (`queued`, `sent`, `delivered`, `failed`), `automated` (bool), `timestamp` / `created_at`. |
| `groups` | `_id`, `user_id` | `user_id`, `organization_id`, `name`, `group_type` (`manager`, `staff`, `assistant`, `custom`), `member_ids`, `contact_ids`. System role groups auto-sync with RBAC roles. |
| `bulk_messages` | `_id`, `user_id` | `user_id`, `title`, `content`, `channel` (`sms`, `email`, `whatsapp`), `status` (`draft`, `scheduled`, `processing`, `sent`, `failed`), `scheduled_for`, `recipient_contact_ids`, `processing_started_at`. |
| `social_integrations` | `_id`, `user_id` | `user_id`, `platform` (`facebook`, `instagram`, `whatsapp`, `messenger`, `linkedin`, `twitter`, `threads`, `snapchat`), `status` (`connected`, `disconnected`), encrypted OAuth tokens, `external_account_id`. |
| `social_posts` | `_id`, `user_id` | `user_id`, `platforms`, `content`, `media_urls`, `status` (`draft`, `scheduled`, `published`, `failed`), `scheduled_at`. |

### Calls, AI Receptionist & Calendar
| Collection | Primary Key / Lookup | Key Fields & Notes |
|---|---|---|
| `telnyx_numbers` | `phone_number` (E.164) | `phone_number`, `telnyx_number_id`, `organization_id`, `assigned_user_id`, `status` (`active`, `released`, `suspended`), `capabilities`, `connection_id`, `messaging_profile_id`. |
| `call_logs` | `_id`, `twilio_call_sid` | `user_id`, `organization_id`, `twilio_call_sid` (stores Telnyx `call_control_id` or call leg ID for backward compatibility), `call_type` (`inbound`, `outbound`, `missed`), `from_number`, `phone_number` (to_number), `status`, `duration_seconds`, `recording_url`, `transcript`, `summary`, `ai_handled` / `ai_ready`. |
| `call_meeting_requests` | `_id`, `organization_id` | Created when AI phone agent books a slot and `require_meeting_approval=True` (or pending confirmation). Fields: `organization_id`, `call_sid`, `caller_name`, `caller_email`, `caller_phone`, `requested_start`, `requested_end`, `status` (`pending`, `confirmed`, `declined`), `calendar_event_id`. |
| `receptionist_actions` | `_id`, `organization_id` | Human-in-the-loop approval queue when an AI capability is set to `human_approval_required`. Fields: `organization_id`, `user_id`, `tool` (`book_appointment`, `reschedule_appointment`, `cancel_appointment`, `send_sms`, `create_crm_contact`, etc.), `arguments`, `status` (`pending`, `approved`, `rejected`, `executed`, `failed`), `caller_phone`. |
| `calendar_events` | `_id`, `user_id` | `user_id`, `organization_id`, `title`, `description`, `starts_at` (UTC datetime), `ends_at` (UTC datetime), `timezone`, `status` (`scheduled`, `confirmed`, `cancelled`), `location`, `meeting_link`, `provider` (`local`, `google`, `zoom`, `microsoft`, `caldav`), `customer` (`name`, `phone`, `email`), `reminder_sent_at` (UTC datetime or `None`). |
| `booking_leases` | `_id` (`org_id` key) | Compare-and-swap lock document used by `@serialized_booking` (`holder`, `acquired_at`, `expires_at`). |
| `caldav_connections` | `_id`, `user_id` | `user_id`, `server_url`, `username`, encrypted `password`, `calendar_url`, `sync_token`, `last_synced_at`. |

### Documents, Billing & Support
| Collection | Primary Key / Lookup | Key Fields & Notes |
|---|---|---|
| `invoices` | `_id`, `invoice_number` | `user_id`, `organization_id`, `contact_id`, `client_name`, `client_email`, `items`, `subtotal`, `tax`, `total`, `currency`, `status` (`draft`, `sent`, `paid`, `overdue`, `cancelled`), `due_date`, `stripe_payment_intent_id`, `stripe_checkout_session_id`, `pdf_url`. |
| `leases` / `agreements` | `_id`, `user_id` | `user_id`, `title`, `status` (`draft`, `sent`, `partially_signed`, `completed`, `declined`, `voided`), `docusign_envelope_id`, `signing_token_hash`, `owner_signature`, `Variables`/`party_details`, `pdf_url`. |
| `support_sessions` | `_id`, `user_id` | Helpdesk live chat threads between business users and platform admins (`user_id`, `organization_id`, `subject`, `status` (`open`, `closed`), `unread_for_admin`, `unread_for_user`, `last_message_at`). |
| `support_messages` | `_id`, `session_id` | Messages inside a `support_sessions` thread (`session_id`, `sender_role` (`user`, `admin`), `sender_id`, `content`, `attachments`, `created_at`). |
| `content_pages` | `slug` | CMS legal/static pages (`privacy-policy`, `terms-and-conditions`, `sms-messaging-policy`, `acceptable-use-policy`, `refund-policy`, `about-us`, `help-support`, etc.). Lazily seeded by `ContentService.ensure_defaults()`. |

---

## 3. Mongomock & Query Portability Rules

- The test suite (`app/tests/`) uses `mongomock` via `conftest.py`.
- **Avoid complex `$lookup` with `let` / pipeline stages** or `$facet` in repositories when a two-step `find()` + Python dict join works cleanly—`mongomock` raises `NotImplementedError` on sub-pipeline `$lookup`.
- **Always use deterministic tie-breaking on sorts:** `[("created_at", -1), ("_id", -1)]` because fast consecutive writes within the same test or async task can share an identical millisecond timestamp.

