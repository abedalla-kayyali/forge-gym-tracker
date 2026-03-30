# FORGE App Memory

Last updated: 2026-03-21 (Google Drive backup + export parity + security hardening)

## Repository Snapshot
- This repo is a large workspace; the production FORGE app is first-party code in `index.html`, `js/`, `css/`, `data/`, `icons/`, `supabase/`, and `scripts/`.
- `docs/` is extensive planning/audit history (70+ files, mostly dated 2026-03).
- There is also an `OpenViking/` subtree with third-party/C++ content; treat it as separate from main FORGE web app work unless explicitly requested.
- Git currently shows multiple untracked directories (`.agents/`, `.claude/*`, `OpenViking/`, parts of `supabase/`), so avoid broad staging commands.

## Current Runtime Model
- Stack: static HTML + vanilla JS modules (no bundler, no package manager in app root).
- Entry: `index.html` includes CDN libraries (Chart.js, Hammer.js, chartjs-plugin-zoom, Supabase JS) and then many local scripts.
- App config is in `js/config.js`:
  - `FORGE_VERSION = 'v241'`
  - `FORGE_BUILD = '2026-03-18 (...)'`
  - `FORGE_CONFIG` contains Supabase URL/anon key, `FOOD_SEARCH_URL`, and Google Drive backup config:
    - `GOOGLE_DRIVE_CLIENT_ID` (must be set for prod)
    - `GOOGLE_DRIVE_BACKUP_FILE` (default `FORGE_backup_latest.json`)
- Bootstrap (`js/bootstrap.js`) registers service worker and aggressively checks for updates.

## Storage and Data Flow
- Primary working store: `localStorage` (`forge_*` keys).
- Backup mirror: IndexedDB (`forge-v3`, object store `kv`) via `window.FORGE_STORAGE.createIdbBackup()` in `js/storage.js`.
- Migration hook: `window.FORGE_STORAGE.runMigrations()` with `SCHEMA_VERSION = 1`.
- Backup/export layer (`js/data-transfer.js`) now has:
  - `buildBackupPayload()` and `restoreBackupPayload()` helpers (shared by local file backup + Google Drive).
  - JSON backup `version: 5` with `allForgeStorageRaw` full-fidelity snapshot of all `forge_*` keys.
  - Full CSV export includes all structured sections plus `ALL FORGE STORAGE KEYS (FULL)`.
- Sync model: offline-first, cloud sync in `js/sync.js`:
  - Pull/push helpers (`_syncPull`, `_syncPush`, `_syncPushDebounced`, `_syncPushProfile`).
  - Data pushes to Supabase tables: `workouts`, `bw_workouts`, `cardio`, `body_weight`, `templates`, `settings`, `meals`, `meal_library`, `checkins`, `water`, `steps`, `profiles`.

## Frontend Module Topology
- `js/` contains 68 first-party modules; key large files:
  - `dashboard-history.js` (history/dashboard rendering core)
  - `i18n.js` (translations + language behavior)
  - `exercises.js` (exercise/program datasets)
  - `rag-search.js` (RAG/coach search client behavior)
  - `profile-avatar.js`, `social-ui.js`, `duels.js`, `coach-state.js`, `auth-ui.js`
- New module:
  - `js/google-drive-backup.js` handles Google OAuth token flow, upload/restore with Drive `appDataFolder`, connection state, and auto backup triggers.
- CSS:
  - `css/main.css` is the main design system/style file
  - `css/entry-premium.css`, `css/form-inspector.css` are feature-specific overlays
- `index.html` still contains substantial inline logic plus module-script loading; load order remains critical.

## Supabase / Backend Surfaces
- Edge functions in `supabase/functions/`:
  - `food-search`: USDA/OpenFoodFacts normalized nutrition lookup.
  - `forge-search`: embedding similarity search + optional Anthropic streaming response.
  - `forge-parse`: transcript-to-structured-workout parsing via Anthropic.
  - `forge-ingest`: ingestion pipeline (present in tree; inspect before edits).
  - `backup-engine`: scheduled export/backup orchestration incl. Google Sheets API integration.
- SQL migrations:
  - `001_forge_embeddings.sql`: pgvector table + `match_forge_embeddings` RPC + RLS policy.
  - `20260319000000_backup_state.sql`: `backup_state` cursor table for backup pagination state.
- Security update:
  - `supabase/functions/forge-parse/index.ts` now enforces bearer auth and validates user with Supabase auth before processing.

## PWA / Offline Notes
- Service worker is `sw.js`, current cache name `forge-v241` (aligned with `FORGE_VERSION`).
- It precaches selected core assets and CDN libs, uses mixed strategies (network-first for app shell/critical assets).
- Version/cache mismatch previously existed and has been corrected in current tree.

## Security and Reliability Conventions
- Escape user-controlled HTML with `FORGE_STORAGE.esc()` (`_esc` alias in runtime usage).
- `js/rag-search.js` source rendering now escapes retrieved content/date/labels before `innerHTML` injection.
- `serve.js` binds to `127.0.0.1`, protects `/save-icons` to localhost, and uses `_safePath()` against traversal.
- Sync has defensive fallbacks and pending flag (`forge_sync_pending`) when cloud push fails.
- ID generation hardening:
  - `FORGE_STORAGE.makeId(prefix)` added.
  - Used for workout/cardio/template/custom record creation and sync fallback ID assignment in `js/sync.js`.

## Operational Workflow Memory
- Dev run: `node serve.js` then open `http://localhost:8765`.
- Lightweight checks used in repo:
  - `node check_v3.js`
  - `node smoke_check.js`
  - `node --check js/storage.js`
  - `node --check serve.js`
  - `node --check js/data-transfer.js`
  - `node --check js/google-drive-backup.js`
- Reference docs:
  - Deep architecture map: `FORGE_APP_REFERENCE.md`
  - Regression flow: `REGRESSION_CHECKLIST.md`

## Known Footguns
- This codebase has some mojibake/encoding artifacts in comments and older docs; preserve semantics when editing and avoid accidental mass re-encoding.
- Because app logic is spread across large `index.html` blocks plus many global-script modules, renames and load-order changes can silently break runtime.
