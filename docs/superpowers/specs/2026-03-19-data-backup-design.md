# FORGE Data Backup System — Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Goal

Automatically back up all FORGE user data to Google Sheets every 24 hours, with a manual fallback trigger in the app. Each user gets a personal Google Sheet with their full data history. An admin master sheet aggregates all users for analysis. Smart upsert ensures the sheets always reflect current state without duplicates.

---

## Architecture

Three components:

### 1. `backup-engine` Supabase Edge Function
- Deployed at: `supabase/functions/backup-engine/index.ts`
- Triggered by:
  - **Automatic (24h):** Supabase Dashboard scheduled function (Edge Functions > Schedule). NOT pg_cron — pg_cron runs SQL only and cannot invoke Edge Functions. The schedule is set to `0 2 * * *` (2 AM UTC daily).
  - **Manual fallback (client):** authenticated POST from client with user JWT
- **Auth split:**
  - Cron path: no JWT. Function checks for `X-Cron-Secret` header (stored as Supabase secret `CRON_SECRET`). Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS and read all users' data.
  - Client path: standard `Bearer` JWT via `supabase.auth.getUser(token)`. Processes only that user's data.
- **Timeout handling:** Edge Function timeout is 150s. For cron path, users are processed in cursor-paginated batches of 20. Each batch writes and commits independently. A `backup_cursor` is stored in a `backup_state` table to resume on next invocation if timeout occurs.
- Responsibilities:
  - Pull all user data from Supabase tables (service_role key for cron, user JWT for client)
  - Write to Google Sheets via Sheets API v4 (service account auth)
  - Smart upsert: update changed rows, append new ones, never delete
  - Create per-user sheet if it doesn't exist yet
  - Store per-user sheet URL back into `profiles.data` JSONB (`backup_sheet_id`, `backup_sheet_url`, `last_backup_at`) — no migration needed
  - Return `{ success, usersProcessed, rowsWritten, lastBackupAt }`

### 2. `js/backup-manager.js` (client IIFE)
- Exposes: `window.triggerManualBackup()`, `window.getBackupStatus()`
- On app open: reads `forge_last_backup` from localStorage
  - If >24h elapsed → calls `backup-engine` as manual fallback
  - If backup running → shows spinner in More tab
- On manual trigger: calls `backup-engine` with `{ manual: true }`
- Saves returned `backup_sheet_url` to localStorage as `forge_backup_sheet_url`
- Updates `forge_last_backup` timestamp on success

### 3. UI — More Tab "Data Backup" Card
- Shows: last backup timestamp ("Backed up 3h ago" / "Never backed up")
- Button: "Backup Now" → calls `window.triggerManualBackup()`
- Link: "Open My Sheet" → opens `forge_backup_sheet_url` in new tab (hidden until first backup)
- Loading state: spinner + "Syncing your data…" during backup

---

## Google Sheets Structure

### Admin Master Sheet (service account owned)
One sheet, multiple tabs — all users combined:

| Tab | Row Key | Columns |
|-----|---------|---------|
| `workouts` | `user_id + date + exercise` | user_id, email, date, exercise, muscle, sets, reps, weight, unit, notes |
| `meals` | `user_id + date + meal_name` | user_id, email, date, meal_name, kcal, protein, carbs, fat |
| `meal_library` | `user_id + template_id` | user_id, email, template_id, name, kcal, protein, carbs, fat, saved_at |
| `bodyweight` | `user_id + date` | user_id, email, date, weight, unit |
| `cardio` | `user_id + date + type` | user_id, email, date, type, duration_min, distance, calories |
| `steps` | `user_id + date` | user_id, email, date, steps |
| `checkins` | `user_id + date` | user_id, email, date, energy, mood, sleep_h, hrv, rhr, water_ml, notes |
| `templates` | `user_id + template_name` | user_id, email, template_name, exercises, created_at |
| `settings` | `user_id` | user_id, email, units, goal_type, step_goal, theme, notifications |
| `users` | `user_id` | user_id, email, name, joined_at, last_active, backup_sheet_url |

### Per-User Sheet (one sheet per user)
Named: `FORGE — {user_email} ({user_id[:8]})`
Same tab structure as admin sheet but filtered to that user only. No `user_id`/`email` columns (redundant).

Sheet ID stored in `profiles.data->>'backup_sheet_id'`. URL stored in `profiles.data->>'backup_sheet_url'`. Both are written as JSONB keys inside the existing `profiles.data` column — no migration needed.

---

## Smart Upsert Logic

Each data type has a **composite row key** (see table above). On each backup run:

1. Fetch all existing rows from the target sheet tab
2. Build a key→rowIndex map from column A values
3. For each incoming data row:
   - Key exists + data unchanged → skip
   - Key exists + data changed → batch update that row
   - Key not found → append to end
4. Execute batch update in one Sheets API call per tab (minimize quota usage)
5. Never delete rows — only add/update

**Memory note:** For first-time backups (empty sheet), skip the fetch step and go straight to append. For existing sheets, if row count exceeds 5,000 rows per tab, use append-only mode (skip the read+diff step) to avoid Sheets API response size limits.

---

## Data Scope

All keys backed up per user:

| localStorage Key | Sheet Tab |
|-----------------|-----------|
| `forge_workouts` | workouts |
| `forge_bw_workouts` | workouts (bodyweight exercises, same tab) |
| `forge_cardio` | cardio |
| `forge_bodyweight` | bodyweight |
| `forge_meals` | meals |
| `forge_meal_library` | meal_library (separate tab — templates, not logged meals) |
| `forge_templates` | templates |
| `forge_steps` / `forge_steps_*` | steps (no goal column — goal is a single scalar in settings) |
| `forge_checkin_*` | checkins |
| `forge_water_*` | checkins (water_ml column) |
| `forge_settings` | settings |
| `forge_profile` | users |

---

## Backup Trigger Flow

```
[Supabase scheduled Edge Function: every 24h (0 2 * * *)]
  → X-Cron-Secret header, service_role key, reads ALL users from Supabase tables
  OR
[Client: app open, forge_last_backup > 24h ago]
  → Bearer JWT, reads only calling user's data from localStorage payload
  OR
[User taps "Backup Now"]
  → Bearer JWT, reads only calling user's data from localStorage payload
  │
  ▼
backup-engine Edge Function
  ├── Auth: cron path → verify X-Cron-Secret; client path → verify JWT
  ├── Cron: query Supabase tables with service_role (data synced there by sync.js)
  ├── Client: accept user data payload sent in POST body (from localStorage)
  ├── Upsert into admin master sheet (all tabs)
  ├── Upsert into per-user sheet (create if missing)
  ├── Update profiles.data JSONB: backup_sheet_url + last_backup_at
  └── Return { success, rowsWritten, sheetUrl, lastBackupAt }
  │
  ▼
Client (backup-manager.js)
  ├── Save forge_backup_sheet_url to localStorage
  ├── Save forge_last_backup timestamp
  └── Re-render More tab backup card
```

**Data source clarification:**
- **Cron path (server-side):** Reads directly from Supabase tables (workouts, meals, steps, etc.) using `service_role` key. This data is already synced there by `js/sync.js` on every save.
- **Client path (manual/fallback):** `backup-manager.js` collects all `forge_*` localStorage keys and sends them as JSON payload in the POST body. The Edge Function parses and writes this payload to Sheets. No direct DB read needed.

---

## Google Service Account Setup

- One Google Cloud project: `forge-backup`
- Service account: `forge-backup@forge-backup.iam.gserviceaccount.com`
- Credentials JSON stored as Supabase secret: `GOOGLE_SHEETS_CREDENTIALS`
- Admin sheet ID stored as Supabase secret: `ADMIN_SHEET_ID`
- Service account has Editor access to admin sheet
- Per-user sheets created by service account (service account = owner, user gets Viewer share via email)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Google Sheets API rate limit | Retry with exponential backoff (3 attempts) |
| User has no data | Skip that tab, don't create empty sheets |
| Edge Function timeout (150s wall clock) | Cron processes users in cursor-paginated batches of 20; cursor saved in `backup_state` table to resume on next invocation |
| First backup for new user | Create sheet, set URL in profile, return URL to client |
| Client offline when auto-trigger fires | Skip, retry on next app open |
| Sheets API credential error | Log to Supabase, surface error toast in app |

---

## Files to Create / Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/functions/backup-engine/index.ts` | Edge Function — full backup logic |
| Create | `supabase/migrations/YYYYMMDD_backup_state.sql` | Creates `backup_state` table: `user_id TEXT PK, cursor TEXT, updated_at TIMESTAMPTZ` |
| Create | `js/backup-manager.js` | Client IIFE — trigger, status, UI wiring |
| Modify | `index.html` | Add backup card HTML to More tab + script tag |
| Modify | `css/main.css` | Backup card styles |
| Modify | `js/config.js` | Version bump |

**Supabase secrets required:**
- `GOOGLE_SHEETS_CREDENTIALS` — service account JSON
- `ADMIN_SHEET_ID` — admin master sheet ID
- `CRON_SECRET` — shared secret for scheduled invocation auth

**Supabase schedule:** Set in Dashboard > Edge Functions > backup-engine > Schedule: `0 2 * * *`

---

## Success Criteria

- [ ] Supabase cron runs backup-engine every 24h without manual intervention
- [ ] User opening app after 24h triggers fallback backup automatically
- [ ] "Backup Now" button completes and shows "Backed up just now"
- [ ] "Open My Sheet" link opens correct per-user Google Sheet
- [ ] Admin sheet contains all users' data across all tabs
- [ ] Re-running backup updates changed rows, doesn't duplicate
- [ ] Users with no data don't get empty sheets created
- [ ] Backup works offline-gracefully (no crash, retries on next open)
