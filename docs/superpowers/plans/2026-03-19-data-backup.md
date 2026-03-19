# Data Backup System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically back up all FORGE user data to Google Sheets every 24h (Supabase scheduled Edge Function) with a manual fallback trigger in the app and per-user sheet access from the More tab.

**Architecture:** A `backup-engine` Supabase Edge Function handles two paths: cron (reads all users from DB via service_role) and client (accepts localStorage payload from user). A client-side IIFE (`backup-manager.js`) detects stale backups on app open, sends the payload, and stores the returned sheet URL. A "Data Backup" card in the More tab shows status and a direct link to the user's personal Google Sheet.

**Tech Stack:** Deno (Supabase Edge Functions), Google Sheets API v4, service account auth, vanilla JS IIFE, localStorage, Supabase secrets.

**Spec:** `docs/superpowers/specs/2026-03-19-data-backup-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/functions/backup-engine/index.ts` | Full backup Edge Function — auth split, data read, Sheets upsert |
| Create | `supabase/migrations/20260319000000_backup_state.sql` | `backup_state` table for cursor-based timeout recovery |
| Create | `js/backup-manager.js` | Client IIFE — collects localStorage data, calls Edge Function, stores sheet URL |
| Modify | `index.html` | Add backup card HTML to More tab + `<script>` tag |
| Modify | `css/main.css` | Backup card styles (`.bkp-*` classes) |
| Modify | `js/config.js` | Version bump |

---

## Task 1: Database — `backup_state` migration

**Files:**
- Create: `supabase/migrations/20260319000000_backup_state.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- backup_state: tracks cursor position for paginated cron backups
CREATE TABLE IF NOT EXISTS backup_state (
  user_id    TEXT        PRIMARY KEY,
  cursor     TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE backup_state ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS; deny all other access
CREATE POLICY "service_role only" ON backup_state USING (FALSE);
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```
Expected: migration applied, `backup_state` table visible in Dashboard > Table Editor.

- [ ] **Step 3: Verify table exists**

In Supabase SQL Editor:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'backup_state';
```
Expected: 3 rows — `user_id TEXT`, `cursor TEXT`, `updated_at TIMESTAMPTZ`.

---

## Task 2: Google Cloud — service account setup (one-time manual)

- [ ] **Step 1: Create Google Cloud project**

Go to https://console.cloud.google.com → New Project → name: `forge-backup`.

- [ ] **Step 2: Enable Sheets API and Drive API**

APIs & Services > Library → search "Google Sheets API" → Enable. Repeat for "Google Drive API".

- [ ] **Step 3: Create service account**

IAM & Admin > Service Accounts > Create:
- Name: `forge-backup`
- No project-level role needed

- [ ] **Step 4: Download credentials JSON**

Service account > Keys > Add Key > JSON. Save as `forge-backup-credentials.json` locally (do NOT commit to git).

- [ ] **Step 5: Create admin Google Sheet**

Go to https://sheets.google.com → Blank sheet → name: `FORGE Admin Backup`.
Share with service account email as Editor.
Copy Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`.

- [ ] **Step 6: Add Supabase secrets**

```bash
CRON_SECRET=$(openssl rand -hex 32)
supabase secrets set GOOGLE_SHEETS_CREDENTIALS="$(cat forge-backup-credentials.json)"
supabase secrets set ADMIN_SHEET_ID="<paste sheet ID here>"
supabase secrets set CRON_SECRET="$CRON_SECRET"
echo "CRON_SECRET=$CRON_SECRET"   # save this value — you'll need it for testing
```

Verify:
```bash
supabase secrets list
```
Expected: `GOOGLE_SHEETS_CREDENTIALS`, `ADMIN_SHEET_ID`, `CRON_SECRET` all listed.

---

## Task 3: Edge Function — skeleton + auth split

**Files:**
- Create: `supabase/functions/backup-engine/index.ts`

- [ ] **Step 1: Create the function skeleton**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRON_SECRET    = Deno.env.get('CRON_SECRET') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY       = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SHEETS_CREDS   = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS') ?? '';
const ADMIN_SHEET_ID = Deno.env.get('ADMIN_SHEET_ID') ?? '';

Deno.serve(async (req: Request) => {
  const isCron = req.headers.get('x-cron-secret') === CRON_SECRET && CRON_SECRET !== '';
  const jwt = (req.headers.get('authorization') ?? '').replace('Bearer ', '');

  if (isCron) {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    return Response.json(await runCronBackup(sb));
  }

  if (!jwt) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  });
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  return Response.json(await runClientBackup(sb, user, payload));
});

async function runCronBackup(_sb: ReturnType<typeof createClient>) {
  return { success: true, mode: 'cron', usersProcessed: 0 };
}

async function runClientBackup(
  _sb: ReturnType<typeof createClient>,
  _user: { id: string; email?: string },
  _payload: Record<string, unknown>
) {
  return { success: true, mode: 'client', rowsWritten: 0 };
}
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy backup-engine --no-verify-jwt
```
Expected: `Deployed backup-engine successfully`.

- [ ] **Step 3: Smoke-test cron auth (use the CRON_SECRET value you saved in Task 2 Step 6)**

```bash
FUNC_URL=$(supabase status --output json | python3 -c "import sys,json; print(json.load(sys.stdin)['API URL'])")/functions/v1/backup-engine
curl -s -X POST "$FUNC_URL" \
  -H "x-cron-secret: <paste your CRON_SECRET value here>" \
  -H "Content-Type: application/json"
```
Expected: `{"success":true,"mode":"cron","usersProcessed":0}`

- [ ] **Step 4: Smoke-test unauthorized rejection**

```bash
curl -s -X POST "$FUNC_URL" -H "Content-Type: application/json"
```
Expected: `{"error":"Unauthorized"}` with HTTP 401.

---

## Task 4: Edge Function — Google Sheets helpers

**Files:**
- Modify: `supabase/functions/backup-engine/index.ts`

Add these helpers above `Deno.serve`.

- [ ] **Step 1: Add base64url helper and service account JWT**

```typescript
function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function uint8ToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToBinary(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getGoogleAccessToken(): Promise<string> {
  const creds = JSON.parse(SHEETS_CREDS);
  const now = Math.floor(Date.now() / 1000);
  const header  = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim   = toBase64Url(JSON.stringify({
    iss:   creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }));
  const signingInput = `${header}.${claim}`;
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', pemToBinary(creds.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
  const jwtToken = `${signingInput}.${uint8ToBase64Url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google auth failed: ${JSON.stringify(json)}`);
  return json.access_token;
}
```

- [ ] **Step 2: Add `upsertSheetTab` helper with 5000-row guard**

```typescript
async function upsertSheetTab(
  token: string,
  sheetId: string,
  tabName: string,
  headers: string[],
  rows: string[][],
  keyColCount: number
): Promise<number> {
  if (rows.length === 0) return 0;
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Ensure tab exists (ignore error if already present)
  await fetch(`${base}:batchUpdate`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName } } }] })
  });

  // Read existing rows
  const readRes = await fetch(`${base}/values/${encodeURIComponent(tabName)}`, { headers: auth });
  const readJson = await readRes.json();
  const existingRows: string[][] = readJson.values ?? [];

  // First-time or large sheet: append-only (skip diff for >5000 existing rows)
  if (existingRows.length === 0) {
    await fetch(`${base}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ values: [headers, ...rows] })
    });
    return rows.length;
  }
  if (existingRows.length > 5000) {
    await fetch(`${base}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ values: rows })
    });
    return rows.length;
  }

  // Smart upsert: build key map
  const keyMap = new Map<string, number>();
  for (let i = 1; i < existingRows.length; i++) {
    const key = existingRows[i].slice(0, keyColCount).join('|');
    keyMap.set(key, i + 1);
  }

  const updates: { range: string; values: string[][] }[] = [];
  const appends: string[][] = [];

  for (const row of rows) {
    const key = row.slice(0, keyColCount).join('|');
    if (keyMap.has(key)) {
      const sheetRow = keyMap.get(key)!;
      if (existingRows[sheetRow - 1]?.join('|') !== row.join('|')) {
        updates.push({ range: `${tabName}!A${sheetRow}`, values: [row] });
      }
    } else {
      appends.push(row);
    }
  }

  if (updates.length > 0) {
    await fetch(`${base}/values:batchUpdate`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ valueInputOption: 'RAW', data: updates })
    });
  }
  if (appends.length > 0) {
    await fetch(`${base}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ values: appends })
    });
  }
  return updates.length + appends.length;
}
```

- [ ] **Step 3: Add `ensureUserSheet` helper**

```typescript
async function ensureUserSheet(token: string, userId: string, email: string): Promise<string> {
  const shortId = userId.substring(0, 8);
  const title = `FORGE — ${email} (${shortId})`;
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(title)}'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'&fields=files(id)`,
    { headers: auth }
  );
  const searchJson = await searchRes.json();
  if (searchJson.files?.length > 0) return searchJson.files[0].id;

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ properties: { title } })
  });
  const { spreadsheetId } = await createRes.json();

  // Share with user as Viewer
  await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email })
  });

  return spreadsheetId;
}
```

- [ ] **Step 4: Deploy and verify helpers compile**

```bash
supabase functions deploy backup-engine --no-verify-jwt
```
Expected: no TypeScript errors.

---

## Task 5: Edge Function — tab definitions + serializers

**Files:**
- Modify: `supabase/functions/backup-engine/index.ts`

Add all constants and serializer functions above `Deno.serve`.

- [ ] **Step 1: Add tab header and key-column constants (10 tabs, admin + per-user variants)**

```typescript
// Admin sheet headers (include user_id + email as first two columns)
const ADMIN_HEADERS: Record<string, string[]> = {
  workouts:     ['user_id','email','date','exercise','muscle','sets','reps','weight','unit','notes'],
  meals:        ['user_id','email','date','meal_name','kcal','protein','carbs','fat'],
  meal_library: ['user_id','email','template_id','name','kcal','protein','carbs','fat','saved_at'],
  bodyweight:   ['user_id','email','date','weight','unit'],
  cardio:       ['user_id','email','date','type','duration_min','distance','calories'],
  steps:        ['user_id','email','date','steps'],
  checkins:     ['user_id','email','date','energy','mood','sleep_h','hrv','rhr','water_ml','notes'],
  templates:    ['user_id','email','name','exercises','created_at'],
  settings:     ['user_id','email','units','goal_type','step_goal','theme'],
  users:        ['user_id','email','name','joined_at','last_active','backup_sheet_url'],
};

// Per-user sheet headers (no user_id/email — redundant)
const USER_HEADERS: Record<string, string[]> = {
  workouts:     ['date','exercise','muscle','sets','reps','weight','unit','notes'],
  meals:        ['date','meal_name','kcal','protein','carbs','fat'],
  meal_library: ['template_id','name','kcal','protein','carbs','fat','saved_at'],
  bodyweight:   ['date','weight','unit'],
  cardio:       ['date','type','duration_min','distance','calories'],
  steps:        ['date','steps'],
  checkins:     ['date','energy','mood','sleep_h','hrv','rhr','water_ml','notes'],
  templates:    ['name','exercises','created_at'],
  settings:     ['units','goal_type','step_goal','theme'],
  users:        ['name','joined_at','last_active','backup_sheet_url'],
};

// How many leading columns form the composite key (admin headers)
const TAB_KEY_COLS: Record<string, number> = {
  workouts: 4, meals: 3, meal_library: 3, bodyweight: 3,
  cardio: 4, steps: 3, checkins: 3, templates: 2, settings: 2, users: 2,
};
// Per-user key cols (offset by 2 since no user_id/email)
const USER_KEY_COLS: Record<string, number> = {
  workouts: 2, meals: 1, meal_library: 1, bodyweight: 1,
  cardio: 2, steps: 1, checkins: 1, templates: 1, settings: 1, users: 1,
};
```

- [ ] **Step 2: Add all serializer functions**

```typescript
// Returns rows WITH user_id+email prefix (for admin sheet)
function serWorkouts(raw: unknown[], uid: string, em: string): string[][] {
  const rows: string[][] = [];
  for (const w of raw as Record<string,unknown>[]) {
    const date = String(w.date ?? '');
    const sets = (w.sets ?? []) as Record<string,unknown>[];
    if (sets.length === 0) {
      rows.push([uid,em,date,String(w.exercise??w.name??''),String(w.muscle??''),'','','','kg','']);
    } else {
      for (const s of sets) {
        rows.push([uid,em,date,String(w.exercise??w.name??''),String(w.muscle??''),
          String(s.sets??''),String(s.reps??''),String(s.weight??''),String(s.unit??'kg'),String(w.notes??'')]);
      }
    }
  }
  return rows;
}

function serMeals(raw: unknown, uid: string, em: string): string[][] {
  const obj = (raw ?? {}) as Record<string,unknown>;
  const rows: string[][] = [];
  for (const [date, meals] of Object.entries(obj)) {
    for (const m of (meals ?? []) as Record<string,unknown>[]) {
      rows.push([uid,em,date,String(m.name??''),String(m.kcal??''),String(m.p??''),String(m.c??''),String(m.f??'')]);
    }
  }
  return rows;
}

function serMealLibrary(raw: unknown, uid: string, em: string): string[][] {
  const obj = (raw ?? {}) as Record<string,unknown>;
  return Object.entries(obj).map(([id,t]) => {
    const tmpl = t as Record<string,unknown>;
    return [uid,em,id,String(tmpl.name??''),String(tmpl.kcal??''),String(tmpl.p??''),String(tmpl.c??''),String(tmpl.f??''),String(tmpl.savedAt??'')];
  });
}

function serBodyweight(raw: unknown[], uid: string, em: string): string[][] {
  return (raw ?? []).map((e) => {
    const r = e as Record<string,unknown>;
    return [uid,em,String(r.date??''),String(r.weight??''),String(r.unit??'kg')];
  });
}

function serCardio(raw: unknown[], uid: string, em: string): string[][] {
  return (raw ?? []).map((e) => {
    const r = e as Record<string,unknown>;
    return [uid,em,String(r.date??''),String(r.type??''),String(r.duration??''),String(r.distance??''),String(r.calories??'')];
  });
}

function serSteps(raw: unknown, uid: string, em: string): string[][] {
  const obj = (raw ?? {}) as Record<string,unknown>;
  return Object.entries(obj).map(([date, val]) => {
    const v = val as Record<string,unknown>;
    const steps = typeof v === 'number' ? v : (v?.steps ?? '');
    return [uid, em, date, String(steps)];
  });
}

function serCheckins(checkins: unknown, water: unknown, uid: string, em: string): string[][] {
  const cin = (checkins ?? {}) as Record<string,unknown>;
  const wat = (water ?? {}) as Record<string,unknown>;
  const dates = new Set([...Object.keys(cin), ...Object.keys(wat)]);
  return [...dates].map(date => {
    const c = (cin[date] ?? {}) as Record<string,unknown>;
    return [uid,em,date,String(c.energy??''),String(c.mood??''),String(c.sleepH??''),
      String(c.hrv??''),String(c.rhr??''),String(wat[date]??''),String(c.notes??'')];
  });
}

function serTemplates(raw: unknown[], uid: string, em: string): string[][] {
  return (raw ?? []).map((t) => {
    const r = t as Record<string,unknown>;
    return [uid,em,String(r.name??r.label??''),JSON.stringify(r.exercises??r.sets??[]),String(r.createdAt??r.date??'')];
  });
}

function serSettings(raw: unknown, uid: string, em: string): string[][] {
  const s = (raw ?? {}) as Record<string,unknown>;
  return [[uid,em,String(s.units??'metric'),String(s.goalType??''),String(s.stepGoal??''),String(s.theme??'')]];
}

function serUsers(profile: unknown, sheetUrl: string, uid: string, em: string): string[][] {
  const p = (profile ?? {}) as Record<string,unknown>;
  return [[uid,em,String(p.name??p.displayName??''),String(p.joinedAt??p.createdAt??''),
    String(p.lastActive??''),sheetUrl]];
}

// Strip first 2 columns (user_id, email) to produce per-user rows
function stripPrefix(rows: string[][]): string[][] {
  return rows.map(r => r.slice(2));
}
```

---

## Task 6: Edge Function — client backup path

**Files:**
- Modify: `supabase/functions/backup-engine/index.ts`

- [ ] **Step 1: Replace `runClientBackup` stub with full implementation**

```typescript
async function runClientBackup(
  sb: ReturnType<typeof createClient>,
  user: { id: string; email?: string },
  payload: Record<string, unknown>
) {
  const token = await getGoogleAccessToken();
  const uid = user.id;
  const em = user.email ?? uid;

  const userSheetId = await ensureUserSheet(token, uid, em);
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${userSheetId}/edit`;

  // Build all serialized row sets
  const allWorkouts = serWorkouts([
    ...(payload.forge_workouts as unknown[] ?? []),
    ...(payload.forge_bw_workouts as unknown[] ?? [])
  ], uid, em);
  const allMeals       = serMeals(payload.forge_meals, uid, em);
  const allMealLib     = serMealLibrary(payload.forge_meal_library, uid, em);
  const allBodyweight  = serBodyweight(payload.forge_bodyweight as unknown[] ?? [], uid, em);
  const allCardio      = serCardio(payload.forge_cardio as unknown[] ?? [], uid, em);
  const allSteps       = serSteps(payload.forge_steps, uid, em);
  const allCheckins    = serCheckins(payload.forge_checkins, payload.forge_water, uid, em);
  const allTemplates   = serTemplates(payload.forge_templates as unknown[] ?? [], uid, em);
  const allSettings    = serSettings(payload.forge_settings, uid, em);
  const allUsers       = serUsers(payload.forge_profile, sheetUrl, uid, em);

  let rowsWritten = 0;

  // ── Per-user sheet (no user_id/email columns) ──────────────────────────────
  rowsWritten += await upsertSheetTab(token, userSheetId, 'workouts',     USER_HEADERS.workouts,     stripPrefix(allWorkouts),    USER_KEY_COLS.workouts);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'meals',        USER_HEADERS.meals,        stripPrefix(allMeals),       USER_KEY_COLS.meals);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'meal_library', USER_HEADERS.meal_library, stripPrefix(allMealLib),     USER_KEY_COLS.meal_library);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'bodyweight',   USER_HEADERS.bodyweight,   stripPrefix(allBodyweight),  USER_KEY_COLS.bodyweight);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'cardio',       USER_HEADERS.cardio,       stripPrefix(allCardio),      USER_KEY_COLS.cardio);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'steps',        USER_HEADERS.steps,        stripPrefix(allSteps),       USER_KEY_COLS.steps);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'checkins',     USER_HEADERS.checkins,     stripPrefix(allCheckins),    USER_KEY_COLS.checkins);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'templates',    USER_HEADERS.templates,    stripPrefix(allTemplates),   USER_KEY_COLS.templates);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'settings',     USER_HEADERS.settings,     stripPrefix(allSettings),    USER_KEY_COLS.settings);
  rowsWritten += await upsertSheetTab(token, userSheetId, 'users',        USER_HEADERS.users,        stripPrefix(allUsers),       USER_KEY_COLS.users);

  // ── Admin sheet (with user_id/email columns) ───────────────────────────────
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'workouts',     ADMIN_HEADERS.workouts,     allWorkouts,    TAB_KEY_COLS.workouts);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'meals',        ADMIN_HEADERS.meals,        allMeals,       TAB_KEY_COLS.meals);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'meal_library', ADMIN_HEADERS.meal_library, allMealLib,     TAB_KEY_COLS.meal_library);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'bodyweight',   ADMIN_HEADERS.bodyweight,   allBodyweight,  TAB_KEY_COLS.bodyweight);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'cardio',       ADMIN_HEADERS.cardio,       allCardio,      TAB_KEY_COLS.cardio);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'steps',        ADMIN_HEADERS.steps,        allSteps,       TAB_KEY_COLS.steps);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'checkins',     ADMIN_HEADERS.checkins,     allCheckins,    TAB_KEY_COLS.checkins);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'templates',    ADMIN_HEADERS.templates,    allTemplates,   TAB_KEY_COLS.templates);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'settings',     ADMIN_HEADERS.settings,     allSettings,    TAB_KEY_COLS.settings);
  rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'users',        ADMIN_HEADERS.users,        allUsers,       TAB_KEY_COLS.users);

  // ── Merge sheet URL into profile.data (fetch-and-merge to preserve other fields) ─
  const { data: profileRow } = await sb.from('profiles').select('data').eq('user_id', uid).single();
  const existingData = profileRow?.data ?? {};
  await sb.from('profiles').upsert({
    user_id: uid,
    data: { ...existingData, backup_sheet_id: userSheetId, backup_sheet_url: sheetUrl, last_backup_at: new Date().toISOString() }
  }, { onConflict: 'user_id' });

  return { success: true, mode: 'client', rowsWritten, sheetUrl, lastBackupAt: new Date().toISOString() };
}
```

- [ ] **Step 2: Deploy and test**

```bash
supabase functions deploy backup-engine --no-verify-jwt
```

Get user JWT from DevTools > Application > Local Storage > key starting with `sb-` ending with `-auth-token` > `access_token` value.

```bash
curl -s -X POST "$FUNC_URL" \
  -H "Authorization: Bearer <user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"forge_workouts":[],"forge_bw_workouts":[],"forge_meals":{},"forge_bodyweight":[],"forge_cardio":[],"forge_steps":{},"forge_checkins":{},"forge_water":{},"forge_meal_library":{},"forge_templates":[],"forge_settings":{},"forge_profile":{}}'
```
Expected: `{"success":true,"mode":"client","rowsWritten":0,"sheetUrl":"https://docs.google.com/...","lastBackupAt":"..."}`

Verify: personal Google Sheet created and visible in Google Drive with 10 tabs.

---

## Task 7: Edge Function — cron backup path

**Files:**
- Modify: `supabase/functions/backup-engine/index.ts`

- [ ] **Step 1: Replace `runCronBackup` stub with full implementation**

```typescript
async function runCronBackup(sb: ReturnType<typeof createClient>) {
  const token = await getGoogleAccessToken();

  // Read cursor from last run
  const { data: stateRow } = await sb.from('backup_state')
    .select('cursor').eq('user_id', '__cron__').single();
  let cursor: string | null = stateRow?.cursor ?? null;

  // Fetch next batch of 20 users after cursor
  let query = sb.from('profiles').select('user_id, data').order('user_id').limit(20);
  if (cursor) query = query.gt('user_id', cursor);
  const { data: profiles, error } = await query;
  if (error || !profiles) return { success: false, error: String(error) };

  let rowsWritten = 0;

  for (const profile of profiles) {
    const uid = profile.user_id;
    const em = profile.data?.email ?? uid;

    // Read data from Supabase tables
    const [wRes, bwRes, cardioRes, bwWeightRes, mealsRes, mlRes, stepsRes] = await Promise.all([
      sb.from('workouts').select('data').eq('user_id', uid),
      sb.from('bw_workouts').select('data').eq('user_id', uid),
      sb.from('cardio').select('data').eq('user_id', uid),
      sb.from('bodyweights').select('data').eq('user_id', uid),
      sb.from('meals').select('data').eq('user_id', uid),
      sb.from('meal_library').select('data').eq('user_id', uid),
      sb.from('steps').select('date, steps').eq('user_id', uid),
    ]);

    const userSheetId = await ensureUserSheet(token, uid, em);
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${userSheetId}/edit`;

    const allWorkouts    = serWorkouts([...(wRes.data??[]).map((r:{data:unknown})=>r.data), ...(bwRes.data??[]).map((r:{data:unknown})=>r.data)], uid, em);
    const allMeals       = serMeals((mealsRes.data?.[0] as {data:unknown})?.data ?? {}, uid, em);
    const allMealLib     = serMealLibrary((mlRes.data?.[0] as {data:unknown})?.data ?? {}, uid, em);
    const allBodyweight  = serBodyweight((bwWeightRes.data??[]).map((r:{data:unknown})=>r.data), uid, em);
    const allCardio      = serCardio((cardioRes.data??[]).map((r:{data:unknown})=>r.data), uid, em);
    const allSteps       = serSteps(Object.fromEntries((stepsRes.data??[]).map((r:{date:string,steps:number})=>[r.date,r.steps])), uid, em);
    const allCheckins    = serCheckins(profile.data?.checkins ?? {}, profile.data?.water ?? {}, uid, em);
    const allTemplates   = serTemplates(profile.data?.templates ?? [], uid, em);
    const allSettings    = serSettings(profile.data?.settings ?? {}, uid, em);
    const allUsers       = serUsers(profile.data, sheetUrl, uid, em);

    // Per-user sheet
    await upsertSheetTab(token, userSheetId, 'workouts',     USER_HEADERS.workouts,     stripPrefix(allWorkouts),   USER_KEY_COLS.workouts);
    await upsertSheetTab(token, userSheetId, 'meals',        USER_HEADERS.meals,        stripPrefix(allMeals),      USER_KEY_COLS.meals);
    await upsertSheetTab(token, userSheetId, 'meal_library', USER_HEADERS.meal_library, stripPrefix(allMealLib),    USER_KEY_COLS.meal_library);
    await upsertSheetTab(token, userSheetId, 'bodyweight',   USER_HEADERS.bodyweight,   stripPrefix(allBodyweight), USER_KEY_COLS.bodyweight);
    await upsertSheetTab(token, userSheetId, 'cardio',       USER_HEADERS.cardio,       stripPrefix(allCardio),     USER_KEY_COLS.cardio);
    await upsertSheetTab(token, userSheetId, 'steps',        USER_HEADERS.steps,        stripPrefix(allSteps),      USER_KEY_COLS.steps);
    await upsertSheetTab(token, userSheetId, 'checkins',     USER_HEADERS.checkins,     stripPrefix(allCheckins),   USER_KEY_COLS.checkins);
    await upsertSheetTab(token, userSheetId, 'templates',    USER_HEADERS.templates,    stripPrefix(allTemplates),  USER_KEY_COLS.templates);
    await upsertSheetTab(token, userSheetId, 'settings',     USER_HEADERS.settings,     stripPrefix(allSettings),   USER_KEY_COLS.settings);
    await upsertSheetTab(token, userSheetId, 'users',        USER_HEADERS.users,        stripPrefix(allUsers),      USER_KEY_COLS.users);

    // Admin sheet
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'workouts',     ADMIN_HEADERS.workouts,     allWorkouts,    TAB_KEY_COLS.workouts);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'meals',        ADMIN_HEADERS.meals,        allMeals,       TAB_KEY_COLS.meals);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'meal_library', ADMIN_HEADERS.meal_library, allMealLib,     TAB_KEY_COLS.meal_library);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'bodyweight',   ADMIN_HEADERS.bodyweight,   allBodyweight,  TAB_KEY_COLS.bodyweight);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'cardio',       ADMIN_HEADERS.cardio,       allCardio,      TAB_KEY_COLS.cardio);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'steps',        ADMIN_HEADERS.steps,        allSteps,       TAB_KEY_COLS.steps);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'checkins',     ADMIN_HEADERS.checkins,     allCheckins,    TAB_KEY_COLS.checkins);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'templates',    ADMIN_HEADERS.templates,    allTemplates,   TAB_KEY_COLS.templates);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'settings',     ADMIN_HEADERS.settings,     allSettings,    TAB_KEY_COLS.settings);
    rowsWritten += await upsertSheetTab(token, ADMIN_SHEET_ID, 'users',        ADMIN_HEADERS.users,        allUsers,       TAB_KEY_COLS.users);

    // Update profile with sheet URL
    await sb.from('profiles').update({
      data: { ...profile.data, backup_sheet_url: sheetUrl, last_backup_at: new Date().toISOString() }
    }).eq('user_id', uid);

    cursor = uid;
  }

  // Save cursor (null if batch < 20 means all users processed — reset for next full run)
  const nextCursor = profiles.length === 20 ? cursor : null;
  await sb.from('backup_state').upsert(
    { user_id: '__cron__', cursor: nextCursor, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  return { success: true, mode: 'cron', usersProcessed: profiles.length, rowsWritten };
}
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy backup-engine --no-verify-jwt
```

- [ ] **Step 3: Test cron path (use saved CRON_SECRET value)**

```bash
curl -s -X POST "$FUNC_URL" \
  -H "x-cron-secret: <your actual CRON_SECRET value>" \
  -H "Content-Type: application/json"
```
Expected: `{"success":true,"mode":"cron","usersProcessed":N,"rowsWritten":N}`

Verify: admin sheet tabs populated, per-user sheets created.

- [ ] **Step 4: Commit Edge Function**

```bash
git add supabase/functions/backup-engine/ supabase/migrations/
git commit -m "feat: backup-engine Edge Function — Sheets upsert, cron + client paths, all 10 tabs"
```

---

## Task 8: Supabase schedule

- [ ] **Step 1: Set up scheduled function**

Go to Supabase Dashboard > Edge Functions > backup-engine > Schedule.
Add schedule: `0 2 * * *`
Set HTTP header: `x-cron-secret: <your CRON_SECRET value>`

- [ ] **Step 2: Verify schedule saved**

Dashboard shows "Next run: tomorrow 02:00 UTC".

---

## Task 9: CSS — backup card styles

**Files:**
- Modify: `css/main.css` (append at end)

- [ ] **Step 1: Append styles**

```css
/* ── Data Backup Card ──────────────────────────────────────────────────────── */
.bkp-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin:12px 14px;}
.bkp-card-title{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:2px;color:var(--text1);margin-bottom:2px;}
.bkp-status{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);margin-bottom:12px;}
.bkp-status.good{color:#4ade80;}
.bkp-status.never{color:var(--text3);}
.bkp-btn-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.bkp-btn{font-family:'DM Mono',monospace;font-size:11px;padding:7px 14px;border-radius:8px;cursor:pointer;border:none;letter-spacing:.5px;}
.bkp-btn-primary{background:var(--accent);color:#000;}
.bkp-btn-primary:disabled{opacity:.5;cursor:not-allowed;}
.bkp-btn-sheet{background:transparent;border:1px solid var(--border);color:var(--text2);display:none;}
.bkp-btn-sheet.visible{display:inline-flex;align-items:center;gap:4px;}
.bkp-spinner{display:none;width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--accent);border-radius:50%;animation:bkp-spin .6s linear infinite;margin-left:6px;vertical-align:middle;}
.bkp-spinner.active{display:inline-block;}
@keyframes bkp-spin{to{transform:rotate(360deg)}}
```

- [ ] **Step 2: Verify**

```bash
grep -c "bkp-card\|bkp-btn\|bkp-status\|bkp-spinner" css/main.css
```
Expected: ≥ 8

---

## Task 10: HTML — backup card in More tab

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Find insertion point inside More tab**

```bash
grep -n "view-more\|more-section\|more-content\|settings-section" index.html | head -10
```

- [ ] **Step 2: Insert backup card as first card inside `#view-more`**

Find the opening content inside `<div id="view-more" class="view">` (around line 1486) and insert immediately after the hero/header block:

```html
<!-- DATA BACKUP CARD -->
<div class="bkp-card" id="bkp-card">
  <div class="bkp-card-title">DATA BACKUP</div>
  <div class="bkp-status never" id="bkp-status">Never backed up</div>
  <div class="bkp-btn-row">
    <button class="bkp-btn bkp-btn-primary" id="bkp-now-btn" onclick="window.triggerManualBackup()">
      Backup Now<span class="bkp-spinner" id="bkp-spinner"></span>
    </button>
    <button class="bkp-btn bkp-btn-sheet" id="bkp-sheet-btn" onclick="window.openMySheet()">
      ↗ Open My Sheet
    </button>
  </div>
</div>
```

- [ ] **Step 3: Add script tag — find last `<script src="js/...">` and add after it**

```html
<script src="js/backup-manager.js"></script>
```

- [ ] **Step 4: Verify**

```bash
grep -n "bkp-card\|backup-manager" index.html
```
Expected: 2 matches.

---

## Task 11: `js/backup-manager.js` — client IIFE

**Files:**
- Create: `js/backup-manager.js`

- [ ] **Step 1: Create the file**

```js
'use strict';
// FORGE Backup Manager
// Exposes: window.triggerManualBackup(), window.openMySheet(), window.getBackupStatus()

(function () {
  const BACKUP_KEY      = 'forge_last_backup';
  const SHEET_URL_KEY   = 'forge_backup_sheet_url';
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

  function _ls(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }
  function _lsRaw(k) { try { return localStorage.getItem(k); } catch { return null; } }

  function _collectPayload() {
    const staticKeys = [
      'forge_workouts','forge_bw_workouts','forge_cardio','forge_bodyweight',
      'forge_meals','forge_meal_library','forge_templates','forge_settings',
      'forge_profile','forge_steps'
    ];
    const payload = {};
    for (const k of staticKeys) payload[k] = _ls(k);

    // Prefixed keys: forge_checkin_*, forge_water_*, forge_steps_*
    const checkins = {}, water = {}, stepsExtra = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('forge_checkin_')) checkins[k.replace('forge_checkin_', '')] = _ls(k);
      if (k.startsWith('forge_water_'))   water[k.replace('forge_water_', '')]     = _ls(k);
      if (k.startsWith('forge_steps_'))   stepsExtra[k.replace('forge_steps_', '')] = _ls(k);
    }
    // Merge prefixed steps into forge_steps object
    if (typeof payload.forge_steps !== 'object' || !payload.forge_steps) payload.forge_steps = {};
    Object.assign(payload.forge_steps, stepsExtra);
    payload.forge_checkins = checkins;
    payload.forge_water = water;
    return payload;
  }

  function _setStatus(text, cls) {
    const el = document.getElementById('bkp-status');
    if (!el) return;
    el.textContent = text;
    el.className = `bkp-status ${cls ?? ''}`;
  }

  function _setLoading(on) {
    const btn = document.getElementById('bkp-now-btn');
    const spinner = document.getElementById('bkp-spinner');
    if (btn) btn.disabled = on;
    if (spinner) spinner.classList.toggle('active', on);
  }

  function _updateSheetBtn() {
    const url = _lsRaw(SHEET_URL_KEY);
    const btn = document.getElementById('bkp-sheet-btn');
    if (btn) btn.classList.toggle('visible', !!url);
  }

  function _fmtAgo(ts) {
    if (!ts) return 'Never backed up';
    const diff = Date.now() - ts;
    if (diff < 60000)    return 'Backed up just now';
    if (diff < 3600000)  return `Backed up ${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `Backed up ${Math.floor(diff / 3600000)}h ago`;
    return `Backed up ${Math.floor(diff / 86400000)}d ago`;
  }

  function _refreshUI() {
    const ts = _ls(BACKUP_KEY);
    _setStatus(_fmtAgo(ts), ts ? 'good' : 'never');
    _updateSheetBtn();
  }

  async function _doBackup() {
    // Find Supabase auth token in localStorage
    let jwt = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        try { jwt = JSON.parse(localStorage.getItem(k))?.access_token; } catch { /* skip */ }
        if (jwt) break;
      }
    }
    if (!jwt) { _setStatus('Sign in to enable backups', 'never'); return; }

    _setLoading(true);
    _setStatus('Syncing your data…');

    try {
      const payload = _collectPayload();
      const supabaseUrl = (window.FORGE_CONFIG && window.FORGE_CONFIG.SUPABASE_URL) || '';
      if (!supabaseUrl) throw new Error('SUPABASE_URL not found in FORGE_CONFIG');

      const res = await fetch(`${supabaseUrl}/functions/v1/backup-engine`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();

      if (data.sheetUrl) localStorage.setItem(SHEET_URL_KEY, data.sheetUrl);
      localStorage.setItem(BACKUP_KEY, JSON.stringify(Date.now()));
      _refreshUI();
      if (typeof showToast === 'function') showToast('Backup complete ✓');
    } catch (e) {
      _setStatus('Backup failed — tap to retry', 'never');
      console.error('[backup-manager]', e);
    } finally {
      _setLoading(false);
    }
  }

  window.triggerManualBackup = _doBackup;
  window.openMySheet = function () {
    const url = _lsRaw(SHEET_URL_KEY);
    if (url) window.open(url, '_blank');
  };
  window.getBackupStatus = function () {
    return { lastBackup: _ls(BACKUP_KEY), sheetUrl: _lsRaw(SHEET_URL_KEY) };
  };

  function _autoCheck() {
    const last = _ls(BACKUP_KEY);
    if (!last || (Date.now() - last) > BACKUP_INTERVAL) {
      setTimeout(_doBackup, 8000); // delay to let app fully init
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _refreshUI(); _autoCheck(); });
  } else {
    _refreshUI();
    _autoCheck();
  }

  console.log('[FORGE] Backup manager loaded');
})();
```

- [ ] **Step 2: Verify file created**

```bash
wc -l js/backup-manager.js
```
Expected: ~100+ lines.

---

## Task 12: Version bump + commit + push

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Bump FORGE_VERSION by 1 in `js/config.js`**

- [ ] **Step 2: Commit**

```bash
git add js/backup-manager.js index.html css/main.css js/config.js
git commit -m "feat: data backup — Google Sheets sync, Backup Now button, Open My Sheet link"
```

- [ ] **Step 3: Push**

```bash
git push origin master
```

---

## Task 13: End-to-end verification

- [ ] **Step 1: More tab shows backup card**

Open app → More tab → verify "Never backed up" status and "Backup Now" button visible. "Open My Sheet" hidden.

- [ ] **Step 2: Manual backup with real data**

Tap "Backup Now" → spinner appears → toast "Backup complete ✓" → status "Backed up just now" → "↗ Open My Sheet" button appears.

- [ ] **Step 3: Verify all 10 sheet tabs exist**

Click "Open My Sheet" → Google Sheet opens. Verify these tabs exist: `workouts`, `meals`, `meal_library`, `bodyweight`, `cardio`, `steps`, `checkins`, `templates`, `settings`, `users`. Check headers match spec. Verify no `user_id`/`email` columns in per-user sheet.

- [ ] **Step 4: Admin sheet updated**

Open admin sheet → verify same data appears with `user_id` and `email` columns prepended.

- [ ] **Step 5: No duplicate rows on re-run**

Tap "Backup Now" again → row counts in sheet unchanged. Change a workout, tap again → that row updated in sheet.

- [ ] **Step 6: Auto-trigger after 24h**

In DevTools console:
```js
localStorage.setItem('forge_last_backup', JSON.stringify(Date.now() - 25*60*60*1000));
location.reload();
```
After ~8 seconds → backup triggers automatically.

- [ ] **Step 7: Cron path**

```bash
curl -s -X POST "$FUNC_URL" \
  -H "x-cron-secret: <your actual CRON_SECRET value>" \
  -H "Content-Type: application/json"
```
Expected: `{"success":true,"mode":"cron","usersProcessed":N,"rowsWritten":N}`

- [ ] **Step 8: Signed-out user**

Sign out → reload → backup card shows "Sign in to enable backups". No crash, no errors in console.
