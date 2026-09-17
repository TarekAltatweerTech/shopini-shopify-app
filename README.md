# Shopini Express — Shopify embedded app

The merchant-facing UI that runs inside the Shopify admin. A static single-page
app: no server, no database, no credentials of its own. Everything it shows and
everything it writes goes through the Shopini Express Laravel backend.

```
┌──────────────── Shopify admin (admin.shopify.com) ─────────────────┐
│                                                                    │
│   ┌────────────────────── <iframe> ───────────────────────┐        │
│   │  this app  ──  App Bridge  ──  shopify.idToken()      │        │
│   └──────────────────────────┬────────────────────────────┘        │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │  Authorization: Bearer <session token>
                               ▼
                     Laravel backend  ──  Shopify Admin GraphQL API
                                      ──  Shopini Express database
```

## Stack

| | |
|---|---|
| **Preact** via `preact/compat` | Every file imports from `react` and uses React hooks. The runtime is Preact because it passes props and `onEvent` handlers through to custom elements correctly — React's synthetic event system does not, which is why Shopify's own Polaris scaffolding is Preact. |
| **Polaris web components** | Loaded from Shopify's CDN as `<s-*>` elements. No npm package, no stylesheet, no provider. They inherit the merchant's admin theme, including dark mode and right-to-left. |
| **App Bridge** | Loaded from Shopify's CDN. Provides `window.shopify`, and with it the session token. |
| **Vite** | Build only. Output is plain static files. |

Total bundle: ~38 KB (13 KB gzipped). Polaris and App Bridge are served by
Shopify and cached across every app a merchant has installed.

## Setup

```bash
npm install
cp .env.example .env    # then fill both values
npm run dev
```

```bash
# .env
VITE_SHOPIFY_API_KEY=...            # Client ID from the Partner Dashboard (public)
VITE_API_BASE_URL=https://api...    # Laravel backend origin, no trailing slash
```

`VITE_SHOPIFY_API_KEY` is public by design — it ships in the bundle and in the
page's meta tag. The Client **Secret** belongs to the backend and must never
appear in this repository.

The dev server has to be reached over HTTPS from Shopify's own origin, so run it
behind a tunnel (`shopify app dev` provisions one, or use your own) and point the
app URL at the tunnel host while developing.

## Project layout

```
index.html                  App Bridge + Polaris script tags, in that order
src/
  main.jsx                  Mounts the app. No provider, no CSS import.
  App.jsx                   Loads the session, switches on `state`
  lib/api.js                Every backend call, and the only place auth is handled
  components/
    Loading.jsx             Spinner page
    ErrorState.jsx          Per-status failure wording
    NotEmbedded.jsx         Opened outside the Shopify admin
    StoreSummary.jsx        The five order counters
  screens/
    Onboarding.jsx          Apply for an account, or connect an existing one
    PendingApproval.jsx     Awaiting approval from Shopini operations
    Rejected.jsx            Application declined
    Dashboard.jsx           Orders and sync activity
    dashboard/
      OrdersTable.jsx       Filterable, paginated order list
      OrderDetail.jsx       One order, including why a sync failed
      SyncLogs.jsx          Integration event feed
```

## How it works

### Authentication

`src/lib/api.js` is the only file that touches authentication. Every request
fetches a fresh App Bridge session token and sends it as a bearer token:

```js
const token = await window.shopify.idToken();
fetch(url, { headers: { Authorization: `Bearer ${token}` } });
```

Tokens last about a minute, so they are fetched per request rather than held in
state. There is no cookie, no `localStorage` and no stored credential anywhere
in the app — third-party storage is blocked inside the admin iframe regardless.

The backend reads the shop out of the signed token, so the app never sends a
shop domain. One would be ignored.

### Application state

`GET /api/shopify/session` returns a `state` field with four possible values,
and `App.jsx` renders one screen per value:

| `state` | Screen |
|---|---|
| `needs_onboarding` | `Onboarding` — apply, or connect an existing account |
| `pending_approval` | `PendingApproval` — Shopini operations are reviewing |
| `rejected` | `Rejected` — declined, with a way to reach support |
| `active` | `Dashboard` — orders and sync activity |

Merchants are approved by hand, so `pending_approval` is an ordinary state of
this app rather than a failure, and the screen is written that way. Every state
renders a real screen; none of them is an error page.

`/api/shopify/session` is not a plain read. On the first open after
installation it is what completes the install, because the backend exchanges
the session token for a Shopify access token at that moment. **It must be the
first call.**

### Backend endpoints

All under `/api/shopify/`, all authenticated by the session token, rate limited
to 120 requests/minute per shop.

| Endpoint | Purpose |
|---|---|
| `GET session` | Completes installation, returns `state` |
| `GET onboarding/options` | Countries, governorates, cities, business types, and prefill values |
| `POST onboarding` | Submits the account application |
| `POST link` | Connects an existing Shopini account |
| `GET store` | Connected store details |
| `GET orders` | Paginated orders, optional `status` filter |
| `GET orders/{id}` | One order, including `last_error` |
| `GET sync-logs` | Integration event feed |

## Deployment — Netlify

`netlify.toml` is committed and configures everything needed:

- **`Content-Security-Policy: frame-ancestors`** for `*.myshopify.com` and
  `admin.shopify.com`. Without it the browser refuses to let Shopify embed the
  page and merchants see a blank frame.
- **No `X-Frame-Options`.** It has no wildcard support and overrides
  `frame-ancestors` in browsers that honour it. Do not add it.
- **SPA fallback** so any path serves `index.html`. Without it a reload returns
  404, which inside the admin frame reads as a broken app.
- **Cache headers** — hashed assets immutable, `index.html` never cached.

Steps:

1. Connect the repository to Netlify. Build command `npm run build`, publish
   directory `dist` (both already in `netlify.toml`).
2. Set `VITE_SHOPIFY_API_KEY` and `VITE_API_BASE_URL` in **Site settings →
   Environment variables**.
3. Deploy, then note the production URL.

Netlify issues a fresh URL per deploy preview. The app URL in the Partner
Dashboard must be the **stable production domain**, never a preview URL, or the
app breaks on the next deploy.

## Connecting to the backend

Two values have to match on the backend side, or nothing works:

```dotenv
# backend .env
FRONTEND_URL="https://<your-site>.netlify.app"   # CORS allowlist
```

Without it every request from this app is blocked by CORS.

The backend already allows the `Authorization` header and refuses credentialed
origins, which is why `api.js` sends `credentials: 'omit'`.

## Shopify configuration

`shopify.app.toml` is committed with placeholders. The two hosts it references
are different and mixing them up is the usual cause of a failed review:

- `application_url` → **this site**, on Netlify.
- `webhooks.subscriptions.uri` → **the Laravel backend**. Shopify delivers
  compliance webhooks there; this project is static and has no endpoint that
  could answer them.

In the Partner Dashboard, confirm:

- **Embed app in Shopify admin** is on.
- **Allowed redirection URLs** is empty — Managed Installation has no OAuth
  callback.
- The compliance webhook URLs point at the backend.

## Testing

1. Create a development store in the Partner Dashboard and install the app.
2. The app should open inside the Shopify admin with the address bar staying on
   `admin.shopify.com/store/<name>/apps/shopini-express`. If it changes to the
   Netlify host, something is navigating the top frame — search for
   `window.top`, `window.parent`, `target="_top"` and external `location.href`
   assignments.
3. Development stores are approved automatically by the backend, so the state
   moves to `active` as soon as onboarding is submitted.
4. To see the `pending_approval` screen, ask the backend team to disable
   `SHOPIFY_AUTO_APPROVE_DEV_STORES` on the test environment.

### Troubleshooting

| Symptom | Cause |
|---|---|
| `window.shopify is undefined` | A Shopify script is missing, `app-bridge.js` is not first in `<head>`, or `VITE_SHOPIFY_API_KEY` is empty so the meta tag rendered blank |
| `<s-page>` renders as an unstyled block | `polaris-1.js` failed to load — check the network tab and the CSP |
| Every request returns `401` | A token is being cached past its ~60s lifetime, or the `Authorization` header is not reaching the backend |
| Requests blocked by CORS | The site origin is not in the backend's `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` |
| Blank frame inside the admin | `frame-ancestors` missing, or `X-Frame-Options` was added |
| `404` with `installed: false` | `/api/shopify/session` was not called first |

## Conventions

- Never navigate the top frame. Use the router, or `window.shopify.navigation`
  for movement inside the admin. `target="_blank"` on a link is fine;
  `target="_top"` is not.
- No cookies or browser storage for authentication.
- Polaris fires `input` on every keystroke and `change` on commit. Read
  `event.target.value` from either.
- Boolean attributes on custom elements are passed as `value || undefined` so a
  `false` removes the attribute rather than setting `"false"`, which a custom
  element reads as truthy.

## References

- [App Bridge](https://shopify.dev/docs/api/app-bridge-library)
- [Polaris web components](https://shopify.dev/docs/api/app-home/web-components)
- [Session token authentication](https://shopify.dev/docs/apps/auth/session-tokens)
- [Token exchange](https://shopify.dev/docs/apps/auth/get-access-tokens/token-exchange)
