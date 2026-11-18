# Architecture — cross-app data flow and integration map

## The four apps, one backend

```
                      ┌───────────────────┐
                      │   Mabdel Backend   │   FastAPI, single API for all clients
                      │   api.gocustify.com│
                      └─────────┬──────────┘
         ┌──────────────┬───────┼───────┬──────────────┐
         │              │       │       │              │
   Mabdel Website  madbel-dashboard  madbel-mobile  (webhooks: Telnyx,
   gocustify.com   admin.gocustify.com /  (RN, Expo)   Meta, Resend,
   (customer CRM)  owner.gocustify.com                DocuSign, Stripe)
```

There is no API gateway or per-app backend — every client calls the same FastAPI instance. Dashboard's split across two subdomains (`admin.` vs `owner.`) is a frontend routing/role concern only; it is one build, one deploy.

## Third-party integration map (who owns what)

| Integration | What it's for | Owning backend service(s) | Which frontend surfaces it |
|---|---|---|---|
| Telnyx | Inbound/outbound calls, SMS, AI receptionist audio, number provisioning, browser/mobile WebRTC calling | `telnyx_provisioning_service.py`, `telnyx_web_voice_service.py`, `ai_phone_agent.py`, `realtime_receptionist.py` | Website (`/calls`, `/ai-call`, `TelnyxVoiceContext`), Dashboard (`TelnyxNumbers` admin page), Mobile (`src/voice/`) |
| OpenAI Realtime | Speech-to-speech AI phone receptionist | `realtime_receptionist.py`, `ai_phone_agent.py` | not directly user-facing — runs on the call itself; configured via Website's AI call settings |
| Stripe Connect | Payments from end-customers to the business owner (destination charges) | `stripe_connect_service.py`, `invoice_service.py` | Website `/invoices` |
| Stripe (platform billing) | Platform's own subscription billing of business owners | `stripe_subscription_service.py` | Website `/subscription`, Dashboard `/subscriptions` |
| Google Calendar / Zoom / Microsoft / CalDAV (Apple) | Calendar sync + real meeting links | `app/services/smartflow/calendar_service.py`, `caldav_service.py`, `appointment_service.py` | Website `/calendar`, Website integrations settings; Dashboard `/settings/google-calendar` |
| DocuSign & Native E-Sign | Lease/agreement two-signer e-signing | `docusign_service.py`, `document_signing_service.py`, `app/services/smartflow/lease_service.py`, `app/services/smartflow/agreement_service.py` | Website `/documents`, `/sign/:docType/:token` |
| Meta (Facebook/Instagram/WhatsApp/Messenger) | Social connect + inbox; WhatsApp gateway | `social_posts_service.py`, `social_provider_adapters.py`, separate `whatsapp-gateway` container | Website `/create-post`, `/conversations` / `/unified-conversation` |
| Resend / Zoho / SMTP | Outbound email, business email domains, inbound replies into Unified Conversations | `email_service.py`, `app/services/email_domain/` | Website bulk messaging + Unified Conversations |
| Redis + Celery | Background jobs (periodic sync, reminders) | `app/workers/` | not user-facing |

## Data flow for the two highest-traffic paths

**Inbound call (AI receptionist):**
Telnyx receives a call on a business's number → webhook POST to `/webhooks/telnyx/voice` (`call.initiated`) → backend looks up the org owning that number → starts an `AIPhoneAgent`/`RealtimeReceptionist` session (kept in an in-process `active_sessions` dict) → OpenAI Realtime handles the conversation → call events (`call.answered`, `call.dtmf.received`, `call.hangup`) continue hitting the same webhook → call record written to `call_logs`, visible in Website `/calls`.

**Booking a slot:**
Website/AI receptionist requests a booking → `booking_lock.py`'s `@serialized_booking` decorator takes an org-level lease lock (prevents double-booking under concurrent requests) → slot written → confirmation SMS sent from the org's Telnyx number → calendar event created on whichever provider the org has connected.

## RBAC model (applies across all clients)

Roles: `super_admin`, `admin` (platform operators) and `owner`, `manager`, `staff`, `assistant` (per-business). Permission checks are backend-enforced (`require_role`/`require_permission` dependencies) — frontend nav visibility is a UX convenience, never the actual gate. A per-user `rbac_user_restrictions` allowlist can further cap what a role would otherwise allow. Team/data visibility within a business is org-wide (owner and manager see the same roster/contacts/invoices); RBAC governs who can *write*, not who can *see*.

## Known architectural constraints to respect

- Single-uvicorn-worker assumption for live call sessions (`active_sessions` is an in-process dict, not shared across workers/processes) — scaling the backend to multiple workers would break in-flight AI calls unless this is externalized first.
- No MongoDB migration framework — schema evolution is additive and lazy; don't design a feature that requires a one-time backfill without writing that backfill script yourself (see `app/scripts/`).
