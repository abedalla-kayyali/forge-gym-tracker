# Code Review: Data Backup System (Working-Tree Changes)
**Date:** 2026-03-21
**Reviewer:** Claude Code (Senior Code Reviewer)
**Scope:** Unstaged working-tree diff against HEAD (558d617)

---

## What Was Implemented

- `js/data-transfer.js` — expanded CSV/JSON export to collect all localStorage keys for 10 data types
- `supabase/functions/backup-engine/index.ts` — new edge function: JWT-authed client path + cron path writing all 10 tabs to Google Sheets via service-account OAuth
- `supabase/migrations/20260319000000_backup_state.sql` — `backup_state` table for cron cursor
- `js/google-drive-backup.js` (new, referenced in index.html) — client-side Google Drive JSON backup via GSI
- `js/storage.js` — new `FORGE_STORAGE.makeId()` using `crypto.randomUUID`
- `js/sync.js`, `js/cardio-log.js`, `js/workout-save.js`, `js/template-manager.js` — adopt `makeId()` instead of `Date.now()` IDs
- `index.html` — GSI script tag, Google Drive UI card, `google-drive-backup.js` script tag, `FORGE_GDRIVE.onSave()` hook in `save()`
- `smoke_check.js` — file-existence and snippet checks updated

---

## Plan Alignment

The spec called for: Google Sheets backup, all 10 sheet tabs, cron + client paths, Supabase Edge Function.

All 10 tabs are present in `backup-engine`: workouts, meals, meal_library, bodyweight, cardio, steps, checkins, templates, settings, users.

One unplanned addition: a separate **Google Drive JSON backup** path (GSI client, `google-drive-backup.js`). This is a beneficial addition but was not in the original 13-task plan. The coding agent should confirm this scope expansion was intentional.

---

## Critical Issues (Must Fix)

### 1. `google-drive-backup.js` is referenced but does not exist in the repo
`index.html` loads `<script src="js/google-drive-backup.js">` and `save()` calls `window.FORGE_GDRIVE.onSave()`, but the file is not present in the diff or the working tree. This will cause a **404 on every page load** and a silent `onSave()` no-op that could mislead users into thinking their data is being backed up when it is not.

**Fix:** Either create `js/google-drive-backup.js` with at minimum a stub `window.FORGE_GDRIVE = { onSave: () => {} }`, or remove the script tag and save-hook until the file is ready.

### 2. Cron loop has no per-user error isolation
In `backup-engine/index.ts`, `runCronBackup` iterates over up to 20 profiles in a `for` loop with no per-user `try/catch`. A single user with malformed `profile.data` (e.g. a corrupt JSON blob, unexpected type, missing `private_key` in creds) will throw and abort the entire batch, leaving all subsequent users un-backed-up and the cursor incorrectly not advanced.

```ts
for (const profile of profiles) {
  // No try/catch — one bad record kills the whole batch
  const allWorkouts = serWorkouts(...);
  ...
  rowsWritten += await writeAllTabs(...);
}
```

**Fix:** Wrap the loop body in `try/catch`, log the error per user, and continue.

### 3. `smoke_check.js` does not assert `google-drive-backup.js` exists
The smoke check's `requiredFiles` array was not updated to include `js/google-drive-backup.js`. Since the file is missing (issue #1), the smoke check would pass while the app is broken.

---

## Important Issues (Should Fix)

### 4. No CORS / OPTIONS preflight handler in `backup-engine`
The edge function's `Deno.serve` handler does not respond to `OPTIONS` preflight requests. If the client-side backup path is ever called directly from the browser (not just from a server-side cron), it will fail CORS preflight. The existing `forge-parse` function presumably has this pattern — `backup-engine` should match it.

**Fix:** Add at the top of the handler:
```ts
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
}
```

### 5. `data-transfer.js` — `exportForgeData` silently degrades on missing globals
The new collection helpers (`_lsGet`, `_collectPrefixed`, `_collectForgeAll`) swallow all errors with empty `catch {}` blocks. This is appropriate defensively, but the function has no indicator to the user or caller when data collection partially fails. If `localStorage` is unavailable (private browsing, storage quota error, security policy), the export will silently produce an empty file.

**Fix:** Add a top-level warning toast or console.warn when all collected data arrays are empty.

### 6. `sync.js` — `_syncRecordId` falls back to a timestamp when `value` is already set
```js
id: _syncRecordId('wk', w.id || w.date),
```
`_syncRecordId` only uses `makeId` when `value` is falsy. If `w.id` is already a stable UUID from a previous sync, this is correct. But if `w.id` is a legacy `Date.now()` string (which is truthy), it will be reused as-is, meaning the migration to stable IDs only applies to new records. This is not a bug per se, but it means existing records will never get stable IDs on re-sync. Confirm this is the intended behavior.

### 7. `backup_state` migration — no RLS policy
The migration creates the `backup_state` table but the diff does not show any Row Level Security policy for it. The `__cron__` sentinel row is written by the service role key (correct), but if RLS is enabled on the database by default, user-level reads/writes to this table from the client path may fail silently. Verify that RLS is either disabled for this table or an appropriate policy is defined.

---

## Suggestions (Nice to Have)

### 8. `makeId` in `storage.js` — `global.crypto` guard is overly cautious
The implementation checks `typeof global !== 'undefined'` before accessing `crypto.randomUUID`. In a browser PWA context `global` is not defined; `window.crypto.randomUUID` is the correct check. The current code will always fall through to the timestamp fallback in browsers, negating the UUID benefit.

**Fix:** Change the guard to `typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'`.

### 9. `cardio-log.js`, `workout-save.js`, `template-manager.js` — ID migration is inconsistent
Three files now use `makeId` but other files that generate IDs (e.g. `bio-log.js`, `checkin-actions.js`) were not updated. This creates an inconsistency in ID format across data types. Consider a follow-up task to unify all ID generation.

### 10. `index.html` GSI script tag loads unconditionally
`<script src="https://accounts.google.com/gsi/client" async defer>` loads on every page view for all users, including those who never use Google Drive backup. This is a third-party script with privacy implications. Consider lazy-loading it only when the user clicks the Drive backup card.

---

## What Was Done Well

- All secrets are read from `Deno.env` — no hardcoded credentials anywhere.
- The service-account JWT flow in `backup-engine` is correctly implemented (RS256, proper claim set, base64 encoding to avoid shell escaping issues).
- The cron path uses a cursor pattern (`backup_state`) to handle large user bases in paginated batches — good scalability design.
- `upsertSheetTab` uses key-column matching for idempotent writes rather than appending — correct for a backup system.
- `makeId` fallback chain (UUID → timestamp+random) is safe.
- The `save()` hook integration (`FORGE_GDRIVE.onSave()`) uses a guard (`window.FORGE_GDRIVE &&`) so it won't throw if the module is absent — but issue #1 means the module IS absent.

---

## Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | CRITICAL | `index.html`, `js/google-drive-backup.js` | File referenced but missing — 404 on load |
| 2 | CRITICAL | `supabase/functions/backup-engine/index.ts` | No per-user error isolation in cron loop |
| 3 | CRITICAL | `smoke_check.js` | Missing file not caught by smoke check |
| 4 | IMPORTANT | `supabase/functions/backup-engine/index.ts` | No OPTIONS/CORS preflight handler |
| 5 | IMPORTANT | `js/data-transfer.js` | Silent empty-export with no user feedback |
| 6 | IMPORTANT | `js/sync.js` | Legacy IDs not migrated on re-sync (confirm intent) |
| 7 | IMPORTANT | `supabase/migrations/…_backup_state.sql` | No RLS policy on `backup_state` table |
| 8 | SUGGESTION | `js/storage.js` | `global.crypto` guard wrong in browser — always falls back |
| 9 | SUGGESTION | Multiple files | Inconsistent `makeId` adoption across data types |
| 10 | SUGGESTION | `index.html` | GSI script loads unconditionally for all users |
