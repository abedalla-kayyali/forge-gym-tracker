# FORGE — Issues Fix Plan

**Date:** 2026-03-10
**Status:** In Progress
**Owner:** Engineering
**Source:** Full codebase analysis 2026-03-10

---

## Issues Identified & Fix Strategy

### 1. Security — serve.js Open CORS + Path Traversal

**Problem:**
`serve.js` sets `Access-Control-Allow-Origin: *` and exposes an unauthenticated `POST /save-icons` endpoint that writes base64-decoded PNG files to disk. The static file handler has no path traversal guard — a crafted `?../../../evil` URL could read files outside the project root.

**Fix:**
- Restrict `POST /save-icons` to `localhost`-only requests (check `Host` header)
- Add path traversal guard to static file handler: verify resolved path stays within ROOT
- Keep CORS `*` for GET (needed for PWA dev), restrict write methods

**Risk:** Low — changes only `serve.js` (dev-only tool, not shipped to users)

---

### 2. Security — XSS via innerHTML with User Data

**Problem:**
Dynamic HTML is constructed with template literals and injected via `innerHTML`. Exercise names, workout notes, and profile fields are user-controlled strings. If any contain `<script>` or `onerror=` attributes, they execute in the app context.

**Fix:**
- Add `_esc(str)` helper: HTML-encodes `& < > " '` characters
- Apply `_esc()` to all user-controlled string insertions in innerHTML contexts
- Search surface: exercise names, muscle names from imports, notes, profile name

**Risk:** Low-Medium — targeted helper addition; every insertion must be audited

---

### 3. Reliability — No Schema Versioning

**Problem:**
`localStorage` schemas are implicit. Any future change to `forge_workouts` object shape silently breaks reads for existing users. No migration path exists.

**Fix:**
- Add `FORGE_SCHEMA_VERSION = 1` constant at top of Script Block 1
- Add `_runMigrations()` function called once on startup
- Save version to `forge_schema_version` key
- Provides scaffold for future migrations without breaking current data

**Risk:** Very Low — additive only, touches no existing data

---

### 4. Reliability — CDN-only Chart.js (Offline Risk)

**Problem:**
Chart.js is loaded from `cdn.jsdelivr.net`. If the CDN is unavailable and the cache hasn't been warmed (first offline session), all analytics charts fail silently.

**Fix:**
- Update `sw.js` CORE_ASSETS to include the Chart.js CDN URL
- SW will cache it on first online load; subsequent offline sessions get the cached copy
- Chart.js CDN already uses `https` and doesn't block with CORS

**Risk:** Very Low — additive to sw.js, improves reliability

---

### 5. Performance — postSaveHooks Re-entrant Renders

**Problem:**
`postSaveHooks()` triggers simultaneous re-renders of Coach, dashboard panels, XP bar, header stats, and missions. If called twice quickly (e.g., double-tap save), renders overlap and can corrupt chart canvas state.

**Fix:**
- Add `_postSaveRunning = false` guard flag
- `postSaveHooks()` returns early if already running
- Reset flag after all async render work is queued

**Risk:** Very Low — additive flag guard

---

## Execution Log

| # | Fix | Status | Date |
|---|---|---|---|
| 1 | serve.js security hardening | ✅ Done | 2026-03-10 |
| 2 | XSS _esc() helper + audit | ✅ Done | 2026-03-10 |
| 3 | Schema versioning scaffold | ✅ Done | 2026-03-10 |
| 4 | SW CDN caching | ✅ Done | 2026-03-10 |
| 5 | postSaveHooks render guard | ✅ Done | 2026-03-10 |
| 6 | Docs updated | ✅ Done | 2026-03-10 |

---

## Files Changed

| File | Change |
|---|---|
| `serve.js` | Localhost-only POST guard, path traversal fix |
| `index.html` | `_esc()` XSS helper, `_runMigrations()` schema versioning, `postSaveHooks` guard |
| `sw.js` | Chart.js CDN URL added to CORE_ASSETS |
| `FORGE_APP_REFERENCE.md` | Updated with new functions |
| `memory/MEMORY.md` | Updated operational notes |

---

## Out of Scope (Future Work)

- Monolith JS extraction — high risk without test coverage
- ES module migration — requires build tooling decision
- Automated test suite — needs framework selection (Vitest / Playwright)
- Cloud sync / chunked export — significant new feature work
- Full `postSaveHooks` incremental rendering — requires domain-level dirty tracking
