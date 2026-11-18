# AGENTS.md (repo root: `C:\project\Mabdel AI\AGENTS.md`)

> Place this file at the monorepo root. It is the first thing a coding agent should read.

## Monorepo map

Single git repo, single origin (`https://github.com/IH-Arik/Mabdel.git`), branch `master`. Four apps:

| App | Path | Stack | Purpose |
|---|---|---|---|
| Backend | `Mabdel Backend/` | FastAPI (Python), MongoDB (Motor/async), Celery+Redis | Single API for all clients |
| Website | `Mabdel Website/` | React (Vite) | Main customer-facing CRM (business owners use this day to day) |
| Dashboard | `madbel-dashboard/` | React (Vite) | Internal admin/owner/manager control panel, split across two subdomains |
| Mobile | `madbel-mobile/` | React Native (Expo, bare — has `android/` project, not pure managed Expo) | Mobile client, includes a Telnyx WebRTC voice/calling module |

Product name: GoCustify (user-facing brand). Internal repo/package name: Mabdel.

## How the apps connect

```
Website  ─┐
Dashboard ─┼─> Backend API (FastAPI, api.gocustify.com) ─> MongoDB Atlas
Mobile    ─┘                     │
                                   ├─> Telnyx (calls, SMS, number provisioning, WebRTC voice)
                                   ├─> Stripe (Connect destination charges — payments to business owners)
                                   ├─> OpenAI Realtime (AI phone receptionist, speech-to-speech)
                                   ├─> Google / Zoom / CalDAV / Microsoft (calendar sync)
                                   ├─> DocuSign (lease/agreement e-signing)
                                   ├─> Meta (Facebook/Instagram/WhatsApp/Messenger integrations)
                                   ├─> Resend / Zoho / SMTP (email sending, business email domains)
                                   └─> Redis + Celery (background jobs: reminders, periodic sync)
```

All four clients talk to the **same** backend base URL; there is no per-app backend.

## Production hosts

- Backend API: `api.gocustify.com` (FastAPI in Docker on an EC2 box reachable via the `mabdel` SSH alias, `docker-compose.prod.yml`)
- Website: `gocustify.com`
- Dashboard, admin-facing pages: `admin.gocustify.com`
- Dashboard, owner/manager-facing pages: `owner.gocustify.com`
- Backend + Dashboard are deployed from this same monorepo, same EC2 host.

## Where to go next

Read the app-specific and architecture files before touching code:

- `02_AGENTS_BACKEND.md` — FastAPI backend, `SmartFlowService` mixin architecture, RBAC, and trap/legacy folders
- `03_AGENTS_WEBSITE.md` — Website (customer CRM)
- `04_AGENTS_DASHBOARD.md` — admin/owner dashboard
- `05_AGENTS_MOBILE.md` — React Native app
- `06_ARCHITECTURE.md` — cross-app data flow and integration map
- `07_ENV_AND_DEPLOYMENT.md` — env vars and deploy steps per app
- `08_DATABASE_AND_TENANCY_SCHEMA.md` — MongoDB collections, `organization_id` vs `user_id` tenancy rules, and schema cheat-sheet
- `09_AI_RECEPTIONIST_AND_VOICE_FLOW.md` — OpenAI Realtime vs turn-by-turn AI phone agent, capability gates (`ReceptionistActionService`), and WebRTC voice
- `10_API_CONVENTIONS_AND_WEBHOOKS.md` — standard response envelopes, route prefix tree, webhook verification, and `whatsapp-gateway`
- `11_KNOWN_GAPS_AND_AUDIT_STATUS.md` — verified/fixed features vs remaining open audit gaps (do not re-fix solved bugs or assume unbuilt cron jobs exist)

## Standing conventions used throughout this repo

- No migrations for MongoDB — new fields/collections are created lazily by the code that first writes them.
- A new backend endpoint file is dead until it is `include_router`-mounted into the matching `router.py` — this has been a real recurring bug class (an endpoint existed, worked in isolation, but was never reachable because nobody mounted it).
- RBAC enforcement must happen in the repository/service layer, not just hidden in the frontend — several real bugs were restrictions that existed in the DB but were never actually intersected into the effective-permission calculation.
- Prefer verifying claims against the running code/live system over trusting comments, docs, or prior audits — this codebase has had real cases of stale/fabricated documentation.
