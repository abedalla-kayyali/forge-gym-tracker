# FORGE App Memory

Last updated: 2026-03-10

## What This Project Is
- A static, local-first gym tracker PWA.
- Main app is a single-page, vanilla JS application centered in `index.html`.
- CSS and multiple data/helper modules are extracted into `css/` and `js/`.

## Core Runtime Model
- Primary persistence: `localStorage` keys prefixed with `forge_`.
- Backup persistence: IndexedDB mirror (`forge-v3` DB) via `js/storage.js` `createIdbBackup()`.
- Offline support: service worker cache in `sw.js` (`CACHE_NAME = forge-v20`). Chart.js CDN is pre-cached on SW install so charts work offline after first load.
- Dev serving: `node serve.js` on `http://127.0.0.1:8765` (loopback-only since 2026-03-10 security fix).

## App Architecture (Practical View)
- UI and most behavior are in `index.html` (very large monolithic script).
- `js/storage.js` loads first — exports `window.FORGE_STORAGE` with: `KEYS`, `lsGet`, `createIdbBackup`, `esc()`, `runMigrations()`.
- `js/exercises.js` contains exercise catalog and set-entry/exercise library helpers.
- `js/i18n.js` contains translation dictionary + mobile/PWA install UX hooks.
- Additional extracted modules: `ghost-autocomplete.js`, `dashboard-history.js`, `feedback-ui.js`, `recovery-plate.js`, `xp-system.js` (see `<script src>` tags in index.html lines ~2116–2146).
- Charting relies on CDN Chart.js loaded in `index.html` (and pre-cached by SW).

## Major Domains
- Workout logging:
- Weighted: `_saveWeightedWorkout()`
- Bodyweight: `saveBwWorkout()`
- Analytics:
- `renderDashboard()`, `renderVolumeChart()`, `updateWeightChart()`, `renderFreqChart()`
- Coaching/gamification:
- `renderCoach()`, `renderMissions()`, XP/level functions
- Recovery and tracking:
- Steps, water, check-in, body comp, progress photos, calendar

## Key Data Keys (High Value)
- `forge_workouts`
- `forge_bw_workouts`
- `forge_bodyweight`
- `forge_templates`
- `forge_settings`
- `forge_meals` / `forge_meal_library`
- `forge_profile`
- `forge_theme`
- `forge_accent`
- `forge_layout`
- `forge_steps`
- `forge_deload_data`
- `forge_schema_version` — written by `runMigrations()`; current value: `1`

## Important Constraints
- No test framework detected (manual verification only).
- No build tooling or package manager detected.
- Script load order matters: `storage.js` must load before other modules and before the main script block.
- Refactors should preserve storage schema compatibility; use `runMigrations()` for shape changes.

## Security Conventions (as of 2026-03-10)
- **XSS:** Always wrap user-controlled strings in `_esc()` before inserting into `innerHTML`. `_esc` is `window.FORGE_STORAGE.esc` aliased at the top of the main script block. Numbers and controlled enums are safe without escaping.
- **serve.js:** POST /save-icons is localhost-only. Static file handler uses `_safePath()` to prevent path traversal. Server binds to `127.0.0.1` (not `0.0.0.0`).
- **postSaveHooks:** Re-entrancy guarded by `_postSaveRunning` flag; reset via `Promise.resolve().then()`.

## Existing Deep Reference
- Detailed long-form map already exists in:
- `FORGE_APP_REFERENCE.md`
- This memory file is the fast operational summary; the reference file is the exhaustive map.
