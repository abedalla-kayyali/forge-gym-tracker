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
- Triggered by: Supabase pg_cron (every 24h) + authenticated POST from client (manual)
- Responsibilities:
  - Pull all user data from Supabase tables
  - Write to Google Sheets via Sheets API v4 (service account auth)
  - Smart upsert: update changed rows, append new ones, never delete
  - Create per-user sheet if it doesn't exist yet
  - Store per-user sheet URL back into `profiles` table (`backup_sheet_id`, `backup_sheet_url`)
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
| `bodyweight` | `user_id + date` | user_id, email, date, weight, unit |
| `cardio` | `user_id + date + type` | user_id, email, date, type, duration_min, distance, calories |
| `steps` | `user_id + date` | user_id, email, date, steps, goal |
| `checkins` | `user_id + date` | user_id, email, date, energy, mood, sleep_h, hrv, rhr, notes |
| `users` | `user_id` | user_id, email, name, joined_at, last_active, backup_sheet_url |

### Per-User Sheet (one sheet per user)
Named: `FORGE — {user_email}`
Same tab structure as admin sheet but filtered to that user only. No `user_id`/`email` columns (redundant).

Sheet ID stored in `profiles.backup_sheet_id`. URL stored in `profiles.backup_sheet_url`.

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

---

## Data Scope

All keys backed up per user:

| localStorage Key | Sheet Tab |
|-----------------|-----------|
| `forge_workouts` | workouts |
| `forge_bw_workouts` | workouts (bodyweight exercises) |
| `forge_cardio` | cardio |
| `forge_bodyweight` | bodyweight |
| `forge_meals` | meals |
| `forge_meal_library` | meals (template meals) |
| `forge_steps` / `forge_steps_*` | steps |
| `forge_checkin_*` | checkins |
| `forge_water_*` | checkins (water column) |
| `forge_profile` | users |

---

## Backup Trigger Flow

```
[Supabase pg_cron: every 24h]
  OR
[Client: app open, forge_last_backup > 24h ago]
  OR
[User taps "Backup Now"]
  │
  ▼
backup-engine Edge Function
  ├── Auth check (anon users skipped)
  ├── Pull data from Supabase tables per user
  ├── Upsert into admin master sheet (all tabs)
  ├── Upsert into per-user sheet (create if missing)
  ├── Update profiles.backup_sheet_url + profiles.last_backup_at
  └── Return { success, rowsWritten, sheetUrl, lastBackupAt }
  │
  ▼
Client (backup-manager.js)
  ├── Save forge_backup_sheet_url to localStorage
  ├── Save forge_last_backup timestamp
  └── Re-render More tab backup card
```

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
| Edge Function timeout (>30s) | Process users in batches of 50 |
| First backup for new user | Create sheet, set URL in profile, return URL to client |
| Client offline when auto-trigger fires | Skip, retry on next app open |
| Sheets API credential error | Log to Supabase, surface error toast in app |

---

## Files to Create / Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/functions/backup-engine/index.ts` | Edge Function — full backup logic |
| Create | `js/backup-manager.js` | Client IIFE — trigger, status, UI wiring |
| Modify | `index.html` | Add backup card HTML to More tab + script tag |
| Modify | `css/main.css` | Backup card styles |
| Modify | `js/config.js` | Version bump |

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
