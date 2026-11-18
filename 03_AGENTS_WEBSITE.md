# AGENTS.md — Mabdel Website (`Mabdel Website/AGENTS.md`)

React + Vite. This is the main customer-facing CRM — business owners' day-to-day app.

## Directory structure

```
src/
  api/
    client.js       # base HTTP client (axios/fetch wrapper), handles auth header + token refresh
    services.js      # all backend calls as named functions (smartflowApi-style), one per endpoint
  components/        # shared UI; Calls/, Documents/, Skeletons/, inbox/, ui/ subfolders
  constants/
  context/            # LanguageContext (i18n), TelnyxVoiceContext (WebRTC voice state)
  i18n/
    locales/          # en-US.js etc — all user-facing strings
  layouts/             # MainLayout.jsx etc
  pages/                # one file/folder per route — Documents/, Profile/ have their own subfolders
  store/
  utils/
```

## Routing (`src/App.jsx`)

Public routes: `/`, `/subscription`, `/login`, `/begin`, `/onboarding`, `/confirm-meeting/:token`, `/sign/:docType/:token`, and a family of CMS content pages (`/privacy-policy`, `/terms-and-conditions`, `/sms-messaging-policy`, `/acceptable-use-policy`, `/refund-policy`, `/protocols-for-law-enforcement`, `/account-deletion`, `/about-us`, `/help-support`) all rendered by one generic `<ContentPage forcedSlug="...">` component backed by the backend's content-page system — adding a new static legal/info page needs **no new route component**, just a new slug entry in the backend's `DEFAULT_CONTENT_PAGES`.

Authenticated routes (behind an auth guard): `/dashboard`, `/conversations`, `/unified-conversation`, `/ai-workflow`, `/contacts`, `/groups`, `/calendar`, `/bulk-messaging`, `/invoices`, `/documents`, `/integrations`, `/notifications`, `/calls`, `/ai-call`, `/create-post`, `/admin`, `/profile`, `/voice-conversation`, `/join-event`.

Note: `/conversations` and `/unified-conversation` are two different inboxes that filter each other out by platform — contact DMs (e.g. WhatsApp) only show in Unified, not in Conversations.

## API client pattern

All backend calls go through named functions in `src/api/services.js`, which call the shared client in `src/api/client.js`. New backend features get a new function here, not ad-hoc fetch calls in components.

## i18n

All user-facing text lives in `src/i18n/locales/<locale>.js` (e.g. `en-US.js`) as flat key/string pairs, consumed via `LanguageContext`. Never hardcode UI copy in a component.

## Scripts

```
npm run dev            # vite dev server
npm run build           # production build
npm run test            # vitest run
npm run lint
npm run check:bundle-size
```

## Known gotchas

- Token refresh: there is a real interceptor in the API client that refreshes the access token before the 30-minute expiry — this was missing for a long time and caused silent 401 logouts; if debugging "stale data" reports, check this is still wired up.
- CORS: the backend's `.env` has had duplicate `CORS_ORIGINS` keys (one comma-separated, one JSON-array format) that must be kept in sync — a dev server on an unlisted port will get CORS errors even after a fix, due to browser preflight caching (`access-control-max-age`); hard-reload (`ignoreCache`) after a server-side CORS fix.
- All displayed times are forced to CST/CDT via `dateUtils.js` — use its helpers (`formatCalendarDate` vs `formatCstDate`) rather than raw `Date` formatting; date-only fields need UTC anchoring to avoid an off-by-one day.
- Brand color is logo purple (not cyan) — if you see a stray cyan value, it is leftover from the pre-rebrand theme.
