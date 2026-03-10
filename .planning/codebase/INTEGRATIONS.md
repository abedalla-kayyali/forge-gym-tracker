# External Integrations

**Analysis Date:** 2026-03-09

## APIs & External Services

**CDN Dependencies:**
- Chart.js CDN - chart rendering for dashboard/analytics
  - SDK/Client: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` in `index.html`
  - Auth: None
- Google Fonts CDN - typography
  - SDK/Client: `fonts.googleapis.com` + `fonts.gstatic.com` links in `index.html`
  - Auth: None

## Data Storage

**Databases:**
- Browser IndexedDB (local only)
  - Connection: Browser API (`indexedDB.open`) in `index.html`
  - Client: Native IndexedDB wrapper `_idb` in `index.html`

**File Storage:**
- Local filesystem for dev-only icon writes through `POST /save-icons` in `serve.js`

**Caching:**
- Service Worker Cache Storage in `sw.js` (cache name `forge-v20`)

## Authentication & Identity

**Auth Provider:**
- Custom/local profile only (`forge_profile` in `localStorage`)
  - Implementation: No login/auth backend; single-device local data model in `index.html`

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Browser and Node console logs (`index.html`, `sw.js`, `serve.js`)

## CI/CD & Deployment

**Hosting:**
- Not pinned; static hosting expected (PWA manifest + SW pattern in root files)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- None detected

**Secrets location:**
- Not applicable (no secret-backed external APIs detected)

## Webhooks & Callbacks

**Incoming:**
- Local endpoint `POST /save-icons` in `serve.js` (development utility)

**Outgoing:**
- Browser requests to CDN resources in `index.html`

---

*Integration audit: 2026-03-09*
