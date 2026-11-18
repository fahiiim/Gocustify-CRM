# AGENTS.md — Mabdel Backend (`Mabdel Backend/AGENTS.md`)

FastAPI backend, async Motor/MongoDB, single API serving Website, Dashboard, and Mobile.

## Directory structure

```
app/
  api/
    v1/
      endpoints/        # feature routers: calls.py, invoices.py, telnyx_provisioning.py, subscription.py, stripe_connect.py, ...
      router.py         # mounts every v1 endpoint router into api_router — a router file not imported here is dead code
      auth_routes.py, content_routes.py, onboarding_routes.py, app_config_routes.py
      endpoints/smartflow/   # smartflow-specific sub-routers (messaging/integration/contact feature set)
    dashboard/
      admin.py, super_admin.py, owner.py, rbac.py, subscription.py, telnyx_numbers.py,
      demo_requests.py, meeting_requests.py, availability_slots.py, notifications.py, webhooks.py
      router.py          # mounts every dashboard router with its own prefix — same "must be included or it's dead" rule
  core/                  # config.py (Settings/env vars), database.py (mongo_manager), security.py (JWT), exceptions.py
  models/                # Pydantic/DB-shape models
  repositories/          # DB access layer, one repository per domain (rbac_repository.py, auth_repository.py, ...)
    dashboard/            # dashboard-specific repositories
  schemas/                # request/response Pydantic schemas
    smartflow/
  services/               # business logic, one service class per domain
    smartflow/
    dashboard/
    email_domain/
  workers/                # Celery app + periodic tasks
    tasks/
  workflows/              # AI/receptionist workflow graph (nodes + prompts)
  scripts/                # one-off maintenance scripts
  tests/                  # pytest, 117+ test files, one per feature area — mirrors the bug this repo fixes most often
  utils/
```

## Critical pattern: router mounting

Creating `app/api/v1/endpoints/foo.py` with a working `router` object does **nothing** until:
1. It is imported in `app/api/v1/router.py`: `from app.api.v1.endpoints.foo import router as foo_router`
2. It is mounted: `api_router.include_router(foo_router)`

Same two-step rule applies to `app/api/dashboard/router.py` for anything under `/dashboard/*`. A real production bug this session was exactly this: `subscription.py`'s router existed, worked, had tests, but was never mounted — so every endpoint in it 404'd in production.

## Auth & RBAC

- JWT access + refresh tokens, `app/core/security.py::create_access_token`.
- Dependency injection: `get_current_user`, `get_mongo_database` (from `app.dependencies`).
- Role gates: `require_role(["super_admin", "admin"])`, permission gates: `require_permission(module, action)`.
- Roles in use: `super_admin`, `admin`, `owner`, `manager`, `staff`, `assistant`.
- `rbac_user_roles` collection: role assignment per user.
- `rbac_user_restrictions` collection: a per-user `allowed_permissions` allowlist that **caps** the role-derived permission set — must be intersected in, not just read. See `app/repositories/rbac_repository.py::get_user_effective_permissions`.
- Blocked/suspended accounts must be checked at **every** token-issuing entry point independently (login, refresh, Google OAuth login) — each issues its own usable token, so checking only `get_current_user` leaves the other paths open.
- Manager/Staff/Assistant groups auto-sync their membership to RBAC roles.
- Team visibility (who can see whom) is org-wide (owner and manager see the same roster); write permissions are hierarchy-gated, not creator-gated — e.g. a manager can create Staff/Assistant but not Manager.

## MongoDB

- No migration framework. New collections/fields are created the first time code writes them (see `content_service.py::DEFAULT_CONTENT_PAGES` + `ensure_defaults()` for the lazy-seed pattern used for CMS-style content pages).
- Core collections: `users`, `organizations`, `rbac_roles`, `rbac_user_roles`, `rbac_user_restrictions`, `rbac_audit_logs`, `call_logs`, `support_sessions`, `support_messages`, `booking_leases`.
- Sort tiebreaking: when two documents can share a `created_at` timestamp (written in the same request), sort on `[("created_at", -1), ("_id", -1)]` — `_id` (ObjectId) is strictly insertion-ordered and resolves the tie; `created_at` alone is not safe.
- Testing uses `mongomock`, which does **not** support `$lookup` with `let`/sub-pipelines (`NotImplementedError`). Prefer plain `find()` + Python-side grouping over aggregation pipelines for portability.

## Key integrations (service files)

| Integration | Service file | Notes |
|---|---|---|
| Telnyx calls/SMS/numbers | `telnyx_provisioning_service.py`, `telnyx_web_voice_service.py`, `ai_phone_agent.py`, `realtime_receptionist.py` | `telnyx.Client(api_key=...)`, not module-level `telnyx.Call`. DTMF is `client.calls.actions.send_dtmf(...)`, not `client.calls.send_dtmf(...)`. Webhook events (`call.initiated`, `call.answered`, `call.dtmf.received`, `call.hangup`) land on `/webhooks/telnyx/voice`; live sessions tracked in a module-level `active_sessions` dict (single-uvicorn-worker assumption). |
| OpenAI Realtime (AI receptionist) | `realtime_receptionist.py`, `ai_phone_agent.py` | `gpt-realtime` voice model, `gpt-4o-mini-transcribe` for transcription, built-in turn detection drives barge-in. |
| Stripe Connect (payouts to business owners) | `stripe_connect_service.py`, `invoice_service.py` | Destination-charge pattern: `transfer_data.destination` = connected account id, optional `application_fee_amount`. |
| Stripe subscriptions (platform billing) | `stripe_subscription_service.py` | |
| Calendar | `app/services/smartflow/calendar_service.py`, `caldav_service.py`, `appointment_service.py` | Google, Zoom, Microsoft, CalDAV (Apple) — CalDAV has dedicated SSRF hardening (`_safe_request` chokepoint in `caldav_service.py`: DNS-resolves and rejects private/loopback/link-local IPs, https-only, no `follow_redirects=True`). |
| DocuSign & E-Sign (leases/agreements) | `docusign_service.py`, `document_signing_service.py`, `app/services/smartflow/lease_service.py`, `app/services/smartflow/agreement_service.py` | Supports both DocuSign Envelope two-signer flows (`/api/v1/smartflow/leases`, `/api/v1/smartflow/agreements`, `/webhooks/docusign`) and native token-based public signing (`/sign/:docType/:token`). |
| Media Storage (Public vs Private) | `media_storage_service.py`, `app/api/v1/endpoints/private_media.py`, `app/main.py` | Sensitive folders (`PRIVATE_MEDIA_FOLDERS`: chat attachments, lease/agreement PDFs, signatures, voice notes) are stored outside the public static directory (`private_uploads/`) and served only via authenticated org-scoped `/api/v1/media/private/{folder}/{filename}`. `_PublicMediaFiles` in `app/main.py` also blocks those folder names at `/media`. |
| Facebook/Instagram/Meta | `social_posts_service.py`, `social_provider_adapters.py` | Connect + inbox/message integration only — no automatic comment/DM reply generation exists as of this writing. |
| Booking concurrency | `app/services/smartflow/booking_lock.py` | `@serialized_booking` decorator: org-level compare-and-swap lease lock on `booking_leases`, 5s acquire retry, 90s lease expiry, 60s operation timeout. |

## SmartFlowService & Mixin Architecture

`SmartFlowService` (`app/services/smartflow_service.py` → re-exports `app/services/smartflow/smartflow_orchestrator.py`) is the central business-logic orchestrator for CRM/SmartFlow endpoints:
- **Base class (`app/services/smartflow/_base.py` — `SmartFlowBase`):** Composes 12 focused mixins from `app/services/smartflow/_base_mixins/` (`core.py`, `access.py`, `contact.py`, `call.py`, `conversation.py`, `notifications.py`, `integrations.py`, `calendar.py`, `bulk_messaging.py`, `lease_agreement.py`, `workflow_prefill.py`, `business.py`).
- **Domain Services (`app/services/smartflow/*_service.py`):** `ContactService`, `ConversationService`, `AgreementService`, `LeaseService`, `BulkMessageService`, `CalendarService`, `AppointmentService`, `AICallSettingsService`, `IntegrationService`, `NotificationService`, `CallHistoryService`, `CallMeetingRequestService`, `WorkflowService`, `DocumentService`, `HistoryService`, `ProviderService`, `ReceptionistActionService`, `ReceptionistWorkflowService`.
- Every domain service inherits from `SmartFlowBase`, so cross-cutting helpers like `self._resolve_organization_id(user_id)`, `self._resolve_team_user_ids(user_id)`, `self.resolve_capability(org_id, cap)`, and `self.create_notification(...)` are available on `self`.

## Legacy / Trap Folders (Do Not Edit by Mistake)

- **Active Dashboard Backend:** Always edit `Mabdel Backend/app/api/dashboard/`, `Mabdel Backend/app/services/dashboard/`, and `Mabdel Backend/app/repositories/dashboard/`. If you see any stray/legacy `Mabdel Backend/Dashboard/` directory or worktree artifact, **do not edit it** — `app.main:app` only mounts `app/api/dashboard/router.py`.
- **Root `Mabdel Backend/tests/` vs `Mabdel Backend/app/tests/`:** The canonical test suite is `Mabdel Backend/app/tests/` (120+ test files).
- **`Mabdel Backend/public_website/`:** Static snapshot directory; the real customer CRM frontend is `Mabdel Website/` at the monorepo root.

## Celery / background jobs

`app/workers/celery_app.py` `beat_schedule` (as of this writing): `social.sync_polling_platforms` (5 min), `caldav.sync_connections` (5 min), `appointments.send_reminders` (15 min). There is **no** scheduled job enforcing trial expiration, number deactivation, or birthday messages — if a task description assumes one exists, verify first.

## Running tests

```
"Mabdel Backend\.venv\Scripts\python.exe" -m pytest app/tests -v
```
(Windows path has a space — quote it. 117+ test files, one per feature area; always run the relevant file plus the full suite before committing.)

## Local run

```
"Mabdel Backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Deploy

Backend ships via Docker (`Dockerfile`, `docker-compose.yml` for local, `docker-compose.prod.yml` for prod) on the EC2 host reachable via the `mabdel` SSH alias — pull, rebuild the backend container, restart, verify with a health check / direct endpoint curl.
