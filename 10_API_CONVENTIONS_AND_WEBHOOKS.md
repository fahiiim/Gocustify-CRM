# API Conventions, Routing Tree & Webhooks (`10_API_CONVENTIONS_AND_WEBHOOKS.md`)

All three client apps (`Mabdel Website`, `madbel-dashboard`, `madbel-mobile`) communicate with `Mabdel Backend`. Follow these exact conventions when adding or debugging endpoints.

---

## 1. Standard JSON Response Envelope

### Success Response (`app/utils/responses.py::success_response`)
Almost all v1 and SmartFlow endpoints return:
```json
{
  "success": true,
  "message": "Request successful.",
  "data": { ... }
}
```
*(Note: Some `/api/v1/dashboard/*` endpoints return raw Pydantic models or custom dicts directly—always check the matching frontend `*Api.js` in `madbel-dashboard/src/services/` before changing a dashboard endpoint's response shape).*

### Error Response (`app/core/exceptions.py`)
Raised via `AppException(status_code=..., code="...", message="...", details=...)`:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human-readable explanation",
    "details": null
  },
  "detail": "Human-readable explanation"
}
```

---

## 2. Complete Route Prefix Tree (`app/main.py`)

`app/main.py` mounts routers at four top-level layers:

1. **Health & Readiness (Root):**
   - `GET /health` → always `200` if process is up.
   - `GET /ready` → `200` if MongoDB ping succeeds, `503` if MongoDB is unreachable.
2. **Main Versioned API (`/api/v1/*` via `app/api/v1/router.py`):**
   - `/api/v1/auth/*` (`auth_routes.py`) — register, verify-otp, login, google, refresh, logout, forgot/reset password.
   - `/api/v1/app-config/*`, `/api/v1/onboarding/*`, `/api/v1/content/*` (public CMS pages by slug).
   - `/api/v1/public/demo-requests`, `/api/v1/public/meeting-requests` (unauthenticated landing-page forms).
   - `/api/v1/subscriptions/*` (`endpoints/subscription.py`) — plans, trial start, Stripe Checkout session, billing portal, webhook.
   - `/api/v1/stripe-connect/*` (`endpoints/stripe_connect.py`) — merchant onboarding, status, payout dashboard link.
   - `/api/v1/invoices/*` (`endpoints/invoices.py`) — CRUD, PDF generation, email/SMS share, Stripe Connect checkout.
   - `/api/v1/calls/*` (`endpoints/calls.py`) — Telnyx voice/SMS webhooks, outbound call initiation, WebRTC token, call stream WS.
   - `/api/v1/telnyx/*` (`endpoints/telnyx_provisioning.py`) — search/purchase/assign/release phone numbers.
   - `/api/v1/media/private/{folder}/{filename}` (`endpoints/private_media.py`) — authenticated org-scoped private file download.
   - `/api/v1/smartflow/*` (`endpoints/smartflow/__init__.py`) — 22 sub-modules: `home`, `contacts`, `conversations`, `ai`, `ai_call_test`, `bulk_messages`, `calendar`, `caldav`, `documents`, `email_domains`, `leases`, `agreements`, `call_meeting_requests`, `calls`, `providers`, `integrations`, `notifications`, `groups`, `settings`, `receptionist_actions`, `receptionist_workflows`, `social_posts`.
   - `/api/v1/dashboard/*` (`app/api/dashboard/router.py`) — `admin`, `super`, `owner`, `rbac`, `subscription`, `telnyx-numbers`, `demo-requests`, `meeting-requests`, `availability-slots`, `notifications`, `webhooks`.
3. **Top-Level Webhook & Public Aliases:**
   - `app/api/telnyx_webhook_alias.py` — top-level `/webhooks/telnyx/*` aliases so Telnyx Portal webhook URLs work whether configured with or without `/api/v1`.
   - `app/api/public_calendar.py` — public meeting confirmation/cancellation token routes (`/confirm-meeting/:token`).
   - `app/api/compat_routes.py` — legacy mobile compatibility routes.
4. **Static Media Mount (`/media`):**
   - Served by `_PublicMediaFiles` in `app/main.py` — serves public assets (avatars, logos) while explicitly returning `404` for any path starting with a folder in `PRIVATE_MEDIA_FOLDERS`.

---

## 3. Webhook Verification & Internal Gateways

| Webhook / Gateway | Verification Mechanism | Key File |
|---|---|---|
| **Telnyx Voice & SMS** | Ed25519 signature verification (`telnyx-signature-ed25519`, `telnyx-timestamp`) using `TELNYX_PUBLIC_KEY` when `TELNYX_VALIDATE_SIGNATURE=True`. | `app/api/v1/endpoints/calls.py`, `app/api/telnyx_webhook_alias.py` |
| **Stripe Billing & Connect** | `stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)` | `app/api/v1/endpoints/subscription.py`, `app/api/v1/endpoints/stripe_connect.py` |
| **Meta (FB/IG/WA/Messenger)** | `GET` hub challenge verification (`META_WEBHOOK_VERIFY_TOKEN`) + `POST` `X-Hub-Signature-256` HMAC-SHA256 verification (`META_CLIENT_SECRET`). | `app/api/v1/endpoints/smartflow/integrations.py` |
| **DocuSign Connect** | HMAC signature validation via `DOCUSIGN_CONNECT_SECRET`. | `app/services/docusign_service.py` |
| **Resend Inbound Email** | Svix/Resend webhook signature verification (`RESEND_INBOUND_WEBHOOK_SECRET`). | `app/api/v1/endpoints/smartflow/email_domains.py` |
| **WhatsApp Gateway (`Mabdel Backend/whatsapp-gateway/`)** | Separate Node.js service (`Baileys` / WhatsApp Web bridge) that communicates with FastAPI using `X-Internal-Secret: <WHATSAPP_GATEWAY_INTERNAL_SECRET>`. | `Mabdel Backend/whatsapp-gateway/`, `app/services/smartflow/integration_service.py` |

