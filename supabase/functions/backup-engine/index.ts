import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRON_SECRET    = Deno.env.get('CRON_SECRET') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY       = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SHEETS_CREDS   = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS') ?? '';
const ADMIN_SHEET_ID = Deno.env.get('ADMIN_SHEET_ID') ?? '';

// ── Base64url helpers ─────────────────────────────────────────────────────────
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
  // Credentials stored as base64 to avoid shell escaping issues
  const credsJson = atob(SHEETS_CREDS);
  const creds = JSON.parse(credsJson);
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

// ── Sheet upsert with 5000-row guard ─────────────────────────────────────────
async function upsertSheetTab(
  token: string, sheetId: string, tabName: string,
  headers: string[], rows: string[][], keyColCount: number
): Promise<number> {
  if (rows.length === 0) return 0;
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  await fetch(`${base}:batchUpdate`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName } } }] })
  });

  const readRes = await fetch(`${base}/values/${encodeURIComponent(tabName)}`, { headers: auth });
  const readJson = await readRes.json();
  const existingRows: string[][] = readJson.values ?? [];

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

// ── Per-user sheet creator ─────────────────────────────────────────────────────
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

  await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email })
  });

  return spreadsheetId;
}

// ── Tab definitions ───────────────────────────────────────────────────────────
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

const TAB_KEY_COLS: Record<string, number> = {
  workouts: 4, meals: 3, meal_library: 3, bodyweight: 3,
  cardio: 4, steps: 3, checkins: 3, templates: 2, settings: 2, users: 2,
};
const USER_KEY_COLS: Record<string, number> = {
  workouts: 2, meals: 1, meal_library: 1, bodyweight: 1,
  cardio: 2, steps: 1, checkins: 1, templates: 1, settings: 1, users: 1,
};

// ── Serializers ───────────────────────────────────────────────────────────────
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

function stripPrefix(rows: string[][]): string[][] {
  return rows.map(r => r.slice(2));
}

// ── Write all tabs (admin + per-user) ─────────────────────────────────────────
async function writeAllTabs(
  token: string, userSheetId: string, sheetUrl: string,
  uid: string, em: string,
  allWorkouts: string[][], allMeals: string[][], allMealLib: string[][],
  allBodyweight: string[][], allCardio: string[][], allSteps: string[][],
  allCheckins: string[][], allTemplates: string[][], allSettings: string[][],
  allUsers: string[][]
): Promise<number> {
  let n = 0;
  // Per-user sheet
  n += await upsertSheetTab(token, userSheetId, 'workouts',     USER_HEADERS.workouts,     stripPrefix(allWorkouts),    USER_KEY_COLS.workouts);
  n += await upsertSheetTab(token, userSheetId, 'meals',        USER_HEADERS.meals,        stripPrefix(allMeals),       USER_KEY_COLS.meals);
  n += await upsertSheetTab(token, userSheetId, 'meal_library', USER_HEADERS.meal_library, stripPrefix(allMealLib),     USER_KEY_COLS.meal_library);
  n += await upsertSheetTab(token, userSheetId, 'bodyweight',   USER_HEADERS.bodyweight,   stripPrefix(allBodyweight),  USER_KEY_COLS.bodyweight);
  n += await upsertSheetTab(token, userSheetId, 'cardio',       USER_HEADERS.cardio,       stripPrefix(allCardio),      USER_KEY_COLS.cardio);
  n += await upsertSheetTab(token, userSheetId, 'steps',        USER_HEADERS.steps,        stripPrefix(allSteps),       USER_KEY_COLS.steps);
  n += await upsertSheetTab(token, userSheetId, 'checkins',     USER_HEADERS.checkins,     stripPrefix(allCheckins),    USER_KEY_COLS.checkins);
  n += await upsertSheetTab(token, userSheetId, 'templates',    USER_HEADERS.templates,    stripPrefix(allTemplates),   USER_KEY_COLS.templates);
  n += await upsertSheetTab(token, userSheetId, 'settings',     USER_HEADERS.settings,     stripPrefix(allSettings),    USER_KEY_COLS.settings);
  n += await upsertSheetTab(token, userSheetId, 'users',        USER_HEADERS.users,        stripPrefix(allUsers),       USER_KEY_COLS.users);
  // Admin sheet
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'workouts',     ADMIN_HEADERS.workouts,     allWorkouts,    TAB_KEY_COLS.workouts);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'meals',        ADMIN_HEADERS.meals,        allMeals,       TAB_KEY_COLS.meals);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'meal_library', ADMIN_HEADERS.meal_library, allMealLib,     TAB_KEY_COLS.meal_library);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'bodyweight',   ADMIN_HEADERS.bodyweight,   allBodyweight,  TAB_KEY_COLS.bodyweight);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'cardio',       ADMIN_HEADERS.cardio,       allCardio,      TAB_KEY_COLS.cardio);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'steps',        ADMIN_HEADERS.steps,        allSteps,       TAB_KEY_COLS.steps);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'checkins',     ADMIN_HEADERS.checkins,     allCheckins,    TAB_KEY_COLS.checkins);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'templates',    ADMIN_HEADERS.templates,    allTemplates,   TAB_KEY_COLS.templates);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'settings',     ADMIN_HEADERS.settings,     allSettings,    TAB_KEY_COLS.settings);
  n += await upsertSheetTab(token, ADMIN_SHEET_ID, 'users',        ADMIN_HEADERS.users,        allUsers,       TAB_KEY_COLS.users);
  return n;
}

// ── Client backup path ────────────────────────────────────────────────────────
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

  const allWorkouts   = serWorkouts([...(payload.forge_workouts as unknown[]??[]),...(payload.forge_bw_workouts as unknown[]??[])], uid, em);
  const allMeals      = serMeals(payload.forge_meals, uid, em);
  const allMealLib    = serMealLibrary(payload.forge_meal_library, uid, em);
  const allBodyweight = serBodyweight(payload.forge_bodyweight as unknown[]??[], uid, em);
  const allCardio     = serCardio(payload.forge_cardio as unknown[]??[], uid, em);
  const allSteps      = serSteps(payload.forge_steps, uid, em);
  const allCheckins   = serCheckins(payload.forge_checkins, payload.forge_water, uid, em);
  const allTemplates  = serTemplates(payload.forge_templates as unknown[]??[], uid, em);
  const allSettings   = serSettings(payload.forge_settings, uid, em);
  const allUsers      = serUsers(payload.forge_profile, sheetUrl, uid, em);

  const rowsWritten = await writeAllTabs(
    token, userSheetId, sheetUrl, uid, em,
    allWorkouts, allMeals, allMealLib, allBodyweight, allCardio,
    allSteps, allCheckins, allTemplates, allSettings, allUsers
  );

  // Fetch-and-merge profile.data to avoid overwriting other fields
  const { data: profileRow } = await sb.from('profiles').select('data').eq('id', uid).single();
  const existingData = profileRow?.data ?? {};
  await sb.from('profiles').upsert({
    id: uid,
    data: { ...existingData, backup_sheet_id: userSheetId, backup_sheet_url: sheetUrl, last_backup_at: new Date().toISOString() }
  }, { onConflict: 'id' });

  return { success: true, mode: 'client', rowsWritten, sheetUrl, lastBackupAt: new Date().toISOString() };
}

// ── Cron backup path ──────────────────────────────────────────────────────────
async function runCronBackup(sb: ReturnType<typeof createClient>) {
  const token = await getGoogleAccessToken();

  const { data: stateRow } = await sb.from('backup_state').select('cursor').eq('user_id', '__cron__').single();
  let cursor: string | null = stateRow?.cursor ?? null;

  let query = sb.from('profiles').select('id, data').order('id').limit(20);
  if (cursor) query = query.gt('id', cursor);
  const { data: profiles, error } = await query;
  if (error || !profiles) return { success: false, error: JSON.stringify(error), step: 'profiles_query' };

  let rowsWritten = 0;

  for (const profile of profiles) {
    const uid = profile.id;
    try {
      const em = profile.data?.email ?? uid;

      const [wRes, bwRes, cardioRes, bwWeightRes, mealsRes, mlRes, stepsRes] = await Promise.all([
        sb.from('workouts').select('data').eq('user_id', uid),
        sb.from('bw_workouts').select('data').eq('user_id', uid),
        sb.from('cardio').select('data').eq('user_id', uid),
        sb.from('body_weight').select('data').eq('user_id', uid),
        sb.from('meals').select('data').eq('user_id', uid),
        sb.from('meal_library').select('data').eq('user_id', uid),
        sb.from('steps').select('date, steps').eq('user_id', uid),
      ]);

      const userSheetId = await ensureUserSheet(token, uid, em);
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${userSheetId}/edit`;

      const allWorkouts   = serWorkouts([...(wRes.data??[]).map((r:{data:unknown})=>r.data),...(bwRes.data??[]).map((r:{data:unknown})=>r.data)], uid, em);
      const allMeals      = serMeals((mealsRes.data?.[0] as {data:unknown})?.data ?? {}, uid, em);
      const allMealLib    = serMealLibrary((mlRes.data?.[0] as {data:unknown})?.data ?? {}, uid, em);
      const allBodyweight = serBodyweight((bwWeightRes.data??[]).map((r:{data:unknown})=>r.data), uid, em);
      const allCardio     = serCardio((cardioRes.data??[]).map((r:{data:unknown})=>r.data), uid, em);
      const allSteps      = serSteps(Object.fromEntries((stepsRes.data??[]).map((r:{date:string,steps:number})=>[r.date,r.steps])), uid, em);
      const allCheckins   = serCheckins(profile.data?.checkins ?? {}, profile.data?.water ?? {}, uid, em);
      const allTemplates  = serTemplates(profile.data?.templates ?? [], uid, em);
      const allSettings   = serSettings(profile.data?.settings ?? {}, uid, em);
      const allUsers      = serUsers(profile.data, sheetUrl, uid, em);

      rowsWritten += await writeAllTabs(
        token, userSheetId, sheetUrl, uid, em,
        allWorkouts, allMeals, allMealLib, allBodyweight, allCardio,
        allSteps, allCheckins, allTemplates, allSettings, allUsers
      );

      await sb.from('profiles').update({
        data: { ...profile.data, backup_sheet_url: sheetUrl, last_backup_at: new Date().toISOString() }
      }).eq('id', uid);
    } catch (e) {
      console.error(`[backup-engine] skipping user ${uid}:`, String(e));
    }
    cursor = uid;
  }

  const nextCursor = profiles.length === 20 ? cursor : null;
  await sb.from('backup_state').upsert(
    { user_id: '__cron__', cursor: nextCursor, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  return { success: true, mode: 'cron', usersProcessed: profiles.length, rowsWritten };
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-cron-secret',
};

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const isCron = req.headers.get('x-cron-secret') === CRON_SECRET && CRON_SECRET !== '';
  const jwt = (req.headers.get('authorization') ?? '').replace('Bearer ', '');

  const json = (body: unknown, init?: ResponseInit) =>
    Response.json(body, { ...init, headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) } });

  if (isCron) {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    try {
      return json(await runCronBackup(sb));
    } catch (e) {
      return json({ error: String(e), stack: (e as Error).stack }, { status: 500 });
    }
  }

  if (!jwt) return json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  });
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  return json(await runClientBackup(sb, user, payload));
});
