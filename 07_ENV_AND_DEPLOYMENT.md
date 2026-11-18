# Environment variables & deployment — per app

## Mabdel Backend (`Mabdel Backend/.env`)

Grouped by category (names only — see `app/core/config.py` for defaults/validators):

- **Core**: `ENVIRONMENT`, `DEBUG`, `SECRET_KEY`, `OAUTH_TOKEN_ENCRYPTION_KEY`, `TRUSTED_HOSTS`, `CORS_ORIGINS` (⚠ historically duplicated in two formats — comma-separated and JSON-array — keep both in sync if the parser still expects either).
- **Database**: `MONGODB_URI`, `DATABASE_NAME`, `DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL`.
- **Auth/JWT**: `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`, `OTP_*`.
- **AI**: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REALTIME_URL`, `OPENAI_REALTIME_MODEL`, `OPENAI_REALTIME_TRANSCRIBE_MODEL`, `AI_CALL_MAX_SECONDS`, `AI_CALL_IDLE_PROMPT_SECONDS`, `AI_CALL_IDLE_HANGUP_SECONDS`.
- **Telephony (Telnyx)**: `TELNYX_API_KEY`, `TELNYX_PUBLIC_KEY`, `TELNYX_PHONE_NUMBER`, `TELNYX_MESSAGING_PROFILE_ID`, `TELNYX_VOICE_APPLICATION_ID`, `TELNYX_WEBHOOK_URL`, `TELNYX_VALIDATE_SIGNATURE`, `TELNYX_STREAM_TRACK`, `TELNYX_NUMBER_COUNTRY`.
- **Payments (Stripe)**: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_RESTRICTED_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLATFORM_FEE_PERCENT`, `STRIPE_PRICE_STARTER`/`_GROWTH`/`_PRO`.
- **Calendar**: `GOOGLE_CLIENT_ID`/`_SECRET`/`_REDIRECT_URI`/`_MOBILE_CLIENT_ID`, `ZOOM_CLIENT_ID`/`_SECRET`/`_REDIRECT_URI`, `MICROSOFT_CLIENT_ID`/`_SECRET`/`_TENANT_ID`/`_REDIRECT_URI`.
- **E-sign (DocuSign)**: `DOCUSIGN_CLIENT_ID`/`_SECRET`/`_ACCOUNT_ID`/`_USER_ID`/`_AUTH_SERVER`/`_REDIRECT_URI`/`_RETURN_URL`/`_CONNECT_SECRET`/`_ENVIRONMENT`.
- **Social (Meta + others)**: `META_CLIENT_ID`/`_SECRET`/`_REDIRECT_URI`, `META_INSTAGRAM_REDIRECT_URI`, `META_MESSENGER_REDIRECT_URI`, `META_WHATSAPP_REDIRECT_URI`, `META_WEBHOOK_VERIFY_TOKEN`, `META_GRAPH_VERSION` (pinned — Graph API versions expire), `INSTAGRAM_APP_ID`/`_SECRET`, `LINKEDIN_*`, `TWITTER_*`, `SNAPCHAT_*`, `THREADS_*`, `WEBHOOK_SHARED_SECRET`.
- **WhatsApp gateway**: `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_INTERNAL_SECRET`.
- **Email**: `RESEND_API_KEY`, `MAILTRAP_API_TOKEN`, `MAIL_FROM`, `MAIL_FROM_NAME`, `SMTP_*`, business-domain email: `EMAIL_DOMAIN_ROOT`, `EMAIL_DOMAIN_DNS_PROVIDER`, `EMAIL_DOMAIN_ALLOW_CUSTOM`, `EMAIL_DOMAIN_DEFAULT_PREFIX`, `RESEND_INBOUND_WEBHOOK_SECRET`, `RESEND_INBOUND_MX_HOST`, `ROUTE53_HOSTED_ZONE_ID`, `AWS_ACCESS_KEY_ID`/`_SECRET_ACCESS_KEY`/`_REGION`.
- **Push notifications**: `FCM_SERVER_KEY`, `APNS_KEY_ID`/`_TEAM_ID`/`_BUNDLE_ID`/`_PRIVATE_KEY`/`_USE_SANDBOX`, `PUSH_DELIVERY_SYNC`.
- **URLs**: `PUBLIC_BACKEND_URL`, `PUBLIC_FRONTEND_URL`.
- **Media**: `MEDIA_ROOT`, `MEDIA_PUBLIC_PATH`, `MEDIA_MAX_UPLOAD_BYTES`, `MEDIA_ALLOWED_IMAGE_TYPES`.
- **Rate limiting**: `AUTH_RATE_LIMIT_MAX_REQUESTS`/`_WINDOW_SECONDS`, `MUTATION_RATE_LIMIT_MAX_REQUESTS`/`_WINDOW_SECONDS`.

Validators enforce: `SECRET_KEY` cannot stay at its dev default outside `development`; `OAUTH_TOKEN_ENCRYPTION_KEY` must be set outside `development`; wildcard `CORS_ORIGINS`/`TRUSTED_HOSTS` are rejected outside `development`.

## Mabdel Website (`Mabdel Website/.env`)

```
VITE_API_BASE_URL=<backend base url>
VITE_DASHBOARD_URL=<dashboard base url>
```
Deployed via Vercel (`vercel.json` present) — confirm current target before assuming Vercel vs the EC2 host for this specific app.

## madbel-dashboard (`madbel-dashboard/.env`)

```
VITE_API_BASE_URL=<backend base url>
```
Also has a `vercel.json`, but production dashboard is served from the EC2 host (`admin.gocustify.com`, `owner.gocustify.com` via nginx) per the deploy flow below — verify which path is actually live before deploying through Vercel.

## madbel-mobile

No `.env` found at the root in this scan — check `app.json`/`app.config.js`/EAS config for API base URL and OAuth client IDs (e.g. `GOOGLE_MOBILE_CLIENT_ID` equivalent) before assuming env-var-based config like the web apps.

## Third-party accounts needed to run this project

Telnyx (phone numbers, Call Control app, messaging profile), OpenAI (API key + Realtime access), Stripe (platform account **with Connect enabled** — note: Connect must be explicitly turned on in the Stripe Dashboard before `stripe.accounts.create` works, this has been a real live blocker), Google Cloud (OAuth client for Calendar + mobile sign-in), Zoom, Microsoft Azure AD (OAuth), DocuSign (developer/production account), Meta Developer app (Facebook/Instagram/WhatsApp/Messenger products), LinkedIn/Twitter/Snapchat/Threads developer apps (optional, per social integration), Resend (email sending + inbound), AWS (Route53 for email domain automation, S3 if used for media), MongoDB Atlas, Redis.

## Deployment

**Backend + Dashboard** (same EC2 host, SSH alias `mabdel`):
1. `ssh mabdel`
2. `cd` to the repo checkout on the server
3. `git pull`
4. Backend: rebuild/restart via `docker-compose -f docker-compose.prod.yml up -d --build <backend-service-name>`
5. Dashboard: rebuild (`npm run build`) and deploy the static output to both `admin.gocustify.com` and `owner.gocustify.com` nginx document roots (same build, same files — the split is routing-only).
6. Verify: health check endpoint + a direct curl of a known-good API route; for the dashboard, load both subdomains in a browser and confirm role-gated nav renders correctly.

**Website**: confirm current target (Vercel vs the same EC2 nginx) before deploying — `vercel.json` exists but may not be the live path.

**Mobile**: native builds via `expo run:android`/`expo run:ios` against the checked-in `android/` project; app-store submission is a manual Google Play Console / Apple App Store Connect process, not part of this repo's CI.
