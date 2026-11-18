# AGENTS.md — madbel-dashboard (`madbel-dashboard/AGENTS.md`)

React + Vite (Ant Design UI). Internal admin/owner/manager control panel — **not** the customer CRM (that's `Mabdel Website`).

## Two audiences, one codebase

Same build is deployed to two subdomains with different intended audiences:

- `admin.gocustify.com` — super_admin / admin pages (platform operators: user list, demo requests, admin creation, Telnyx number management, subscriptions oversight).
- `owner.gocustify.com` — owner / manager pages (business owners managing their own org: team management, team analysis, billing).

Role-based routing/redirect (`RoleRedirect` at `/`) decides what a logged-in user sees; there is no separate build per subdomain — the split is a routing/visibility concern, not a build concern.

## Directory structure

```
src/
  Components/
    Common/, Dashboard/, Sidebar/   # Sidebar.jsx has the role-gated nav item list (ADMIN_MENU etc) — add new admin pages here
  Layout/Main/
  Pages/                             # one folder per feature: Owner/, Subscriptions/, TelnyxNumbers/, Earnings/, ClientManagement/, ...
  router/
    Routes.jsx                      # full route table
  services/                         # one *Api.js per backend feature area (see below)
  utils/
```

## Routes (`src/router/Routes.jsx`)

Public: `/sign-in`, `/sso`. Gated: `/onboarding`, `/trial-expired`, then under a layout wrapper: `/dashboard`, `/owner`, `/owner/team`, `/owner/analysis`, `/owner/member/:userId/analysis`, `/user-list`, `/block-list`, `/earnings`, `/analysis-page`, `/subscriptions`, `/create-admin`, `/client-management`, `/categories`, `/reports`, `/demo-requests`, `/ads-setup`, `/activity&events`, `/notifications`, `/settings` (+ sub-pages: about-us, terms-and-conditions, privacy-policy, sms-messaging-policy, acceptable-use-policy, google-calendar, profile, change-password, billing), `/messages`, `/telnyx-numbers`.

## API client pattern

`src/services/httpClient.js` is the shared base client (auth header, error handling — same `apiRequest` helper every other `*Api.js` file wraps). Each feature area gets its own thin file: `adminApi.js`, `ownerApi.js`, `telnyxNumbersApi.js`, `subscriptionApi.js`, `chatApi.js`, `cmsApi.js`, `integrationsApi.js`, `reportsApi.js`, `earningsApi.js`, `categoriesApi.js`, `adsApi.js`, `availabilitySlotsApi.js`, `demoRequestsApi.js`, `meetingRequestsApi.js`, `notificationsApi.js`, `shopApi.js`, `activitiesApi.js`, `staticMockApi.js`. New backend endpoint → new function in the matching `*Api.js` file, following the existing file's shape (see `src/services/README.md`).

## Adding a role-gated nav item

Follow the existing pattern in `Sidebar.jsx`: import an icon, push `{ icon, label, Link }` into the role's menu array (e.g. `ADMIN_MENU`), then add the matching route in `Routes.jsx`.

## Scripts

```
npm run dev
npm run build
npm run lint
```

## Known notes

- `Pages/Settings/LegalEditor/` exists for editing the CMS content pages shared with the Website.
- `BillingPage.jsx` (`/settings/billing`) is **not** related to Stripe Connect merchant onboarding — that flow lives entirely on the Website side; don't assume this file is relevant to Stripe Connect work just because of the name.
