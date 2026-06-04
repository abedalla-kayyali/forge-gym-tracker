/**
 * FORGE cloud-sync — local-first, Supabase-backed.
 *
 * Design:
 *   • Local writes always happen first (zustand stores + localStorage).
 *   • When a real user is signed in, we **mirror** every local key under
 *     `user_data(user_id, key, value jsonb, updated_at)`.
 *   • On login / app boot we PULL the remote keys and merge them if they're
 *     newer than local (last-writer-wins by `updated_at`).
 *   • If the `user_data` table doesn't exist (migration not yet applied),
 *     all writes no-op silently so the app keeps working offline-only.
 *
 * This lets guest users keep their data even if they later sign up — on first
 * login we push the guest's local data into the cloud.
 */

import { supabase } from './supabase';
import { STORAGE_KEYS } from './constants';
import { enqueueSyncOp, isRetryable } from './syncQueue';
import { isLikelyNetworkError } from './offlineAuth';

const TABLE = 'user_data';

// Keys that should be mirrored to the cloud.
// Uses actual STORAGE_KEYS values from constants.ts.
// NOTE: this must cover every key that holds user-generated DATA or CONTENT so
// it roams across devices. Device-local display prefs (theme/accent/sound/
// haptic/layout/custom-bg) and ephemeral UI flags are intentionally excluded.
const SYNC_KEYS = [
  // Workout data & content
  STORAGE_KEYS.WORKOUTS,
  STORAGE_KEYS.BW_WORKOUTS,
  STORAGE_KEYS.CARDIO,
  STORAGE_KEYS.CARDIO_CUSTOM_TYPES,
  STORAGE_KEYS.TEMPLATES,
  STORAGE_KEYS.BW_CUSTOM_EXERCISES,
  // Profile
  STORAGE_KEYS.PROFILE,
  // Nutrition
  STORAGE_KEYS.MEALS,
  STORAGE_KEYS.MEAL_LIBRARY,
  STORAGE_KEYS.MACRO_TARGETS,
  STORAGE_KEYS.WATER,
  // Body & measurements
  STORAGE_KEYS.BODY_WEIGHT,
  STORAGE_KEYS.MEASUREMENTS,
  STORAGE_KEYS.INBODY,
  // Steps & health
  STORAGE_KEYS.STEPS,
  STORAGE_KEYS.STEP_GOAL,
  STORAGE_KEYS.READINESS,
  STORAGE_KEYS.CHECKINS,
  // Coach & programs
  STORAGE_KEYS.ACTIVE_PROGRAM,
  STORAGE_KEYS.AI_PROGRAM,
  STORAGE_KEYS.SPLIT,
  STORAGE_KEYS.MESOCYCLE,
  STORAGE_KEYS.MRV_CONFIG,
  STORAGE_KEYS.DELOAD_DATA,
  STORAGE_KEYS.SAVED_ANSWERS,
  // Social
  STORAGE_KEYS.DUEL_STATE,
  // Gamification & goals
  STORAGE_KEYS.ACHIEVEMENTS,
  STORAGE_KEYS.EXPERIENCE,
  STORAGE_KEYS.GOAL,
  // literal keys stored outside STORAGE_KEYS
  'forge-custom-exercises-v1',
].filter(Boolean) as string[];

/** Whether a localStorage key participates in cloud sync (used for per-key push). */
export function isSyncKey(key: string): boolean {
  return SYNC_KEYS.includes(key);
}

export type SyncState = 'idle' | 'pulling' | 'pushing' | 'error' | 'unavailable';

let state: SyncState = 'idle';
const listeners = new Set<(s: SyncState) => void>();
function setState(s: SyncState) {
  state = s;
  listeners.forEach((l) => l(s));
}
export function getSyncState() { return state; }
export function onSyncStateChange(cb: (s: SyncState) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Pull all user keys from cloud and merge into localStorage if cloud row
 * is newer than local (local `forge:sync:updated:<key>` timestamp).
 */
export async function pullFromCloud(): Promise<{ synced: number; skipped: number; error?: string }> {
  const uid = await getUserId();
  if (!uid) return { synced: 0, skipped: 0, error: 'not signed in' };
  setState('pulling');
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('key, value, updated_at')
      .eq('user_id', uid);

    if (error) {
      // Table missing OR Supabase unreachable → sync unavailable but app still works
      const notExist = /relation .* does not exist|schema.*user_data/i.test(error.message);
      const offline = isLikelyNetworkError(error);
      setState(notExist || offline ? 'unavailable' : 'error');
      return { synced: 0, skipped: 0, error: error.message };
    }
    let synced = 0, skipped = 0;
    for (const row of data ?? []) {
      const key = row.key as string;
      const remoteTs = new Date(row.updated_at as string).getTime();
      const localTs = Number(localStorage.getItem(`forge:sync:updated:${key}`) ?? '0');
      if (remoteTs > localTs) {
        localStorage.setItem(key, JSON.stringify(row.value));
        localStorage.setItem(`forge:sync:updated:${key}`, String(remoteTs));
        synced++;
      } else {
        skipped++;
      }
    }
    // Notify the app so in-memory zustand stores re-read the freshly-pulled
    // localStorage data without requiring a full page reload.
    if (synced > 0) {
      try {
        window.dispatchEvent(new CustomEvent('forge:pulled', { detail: { count: synced } }));
      } catch { /* SSR / restricted env */ }
    }
    setState('idle');
    return { synced, skipped };
  } catch (e) {
    setState(isLikelyNetworkError(e) ? 'unavailable' : 'error');
    return { synced: 0, skipped: 0, error: (e as Error).message };
  }
}

type SyncRow = { user_id: string; key: string; value: unknown; updated_at: string };

/** Shared upsert with the offline-queue + state-machine handling. */
async function upsertRows(rows: SyncRow[]): Promise<{ pushed: number; error?: string }> {
  if (rows.length === 0) { setState('idle'); return { pushed: 0 }; }
  try {
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'user_id,key' });
    if (error) {
      const notExist = /relation .* does not exist|schema.*user_data/i.test(error.message);
      if (notExist) {
        setState('unavailable');
      } else if (isRetryable(error)) {
        // Network/5xx — queue each row so we retry when service is back
        rows.forEach((r) => enqueueSyncOp({
          type: 'upsert', table: TABLE, row: r, onConflict: 'user_id,key',
          dedupeKey: `user_data:${r.user_id}:${r.key}`,
        }));
        setState('unavailable');
      } else {
        setState('error');
      }
      return { pushed: 0, error: error.message };
    }
    // Mark local timestamps so pulls don't overwrite
    rows.forEach((r) => localStorage.setItem(`forge:sync:updated:${r.key}`, String(new Date(r.updated_at).getTime())));
    setState('idle');
    return { pushed: rows.length };
  } catch (e) {
    // Network throw (fetch failed, DNS error etc.)
    if (isRetryable(e)) {
      rows.forEach((r) => enqueueSyncOp({
        type: 'upsert', table: TABLE, row: r, onConflict: 'user_id,key',
        dedupeKey: `user_data:${r.user_id}:${r.key}`,
      }));
      setState('unavailable');
    } else {
      setState('error');
    }
    return { pushed: 0, error: (e as Error).message };
  }
}

/**
 * Push all local keys to the cloud (upsert with now() timestamp).
 * Silently no-ops if user_data table doesn't exist.
 *
 * Use this for the "I just mutated locally, save my changes" path (debounced
 * writes, visibility/pagehide). For login/guest-merge reconciliation use
 * {@link reconcilePush}, which avoids clobbering newer cloud data.
 */
export async function pushToCloud(): Promise<{ pushed: number; error?: string }> {
  const uid = await getUserId();
  if (!uid) return { pushed: 0, error: 'not signed in' };
  setState('pushing');
  const now = new Date().toISOString();
  const rows = SYNC_KEYS.flatMap((key): SyncRow[] => {
    const raw = localStorage.getItem(key);
    if (raw == null) return [];
    let value: unknown;
    try { value = JSON.parse(raw); } catch { return []; }
    return [{ user_id: uid, key, value, updated_at: now }];
  });
  return upsertRows(rows);
}

/**
 * Last-writer-wins push: upload only local keys that are newer than (or absent
 * from) the cloud. Used during login / guest-merge reconciliation so we never
 * overwrite data that another device synced more recently.
 */
export async function reconcilePush(): Promise<{ pushed: number; error?: string }> {
  const uid = await getUserId();
  if (!uid) return { pushed: 0, error: 'not signed in' };
  setState('pushing');
  // Fetch remote timestamps to compare per key.
  const { data, error } = await supabase
    .from(TABLE)
    .select('key, updated_at')
    .eq('user_id', uid);
  if (error) {
    const notExist = /relation .* does not exist|schema.*user_data/i.test(error.message);
    setState(notExist || isLikelyNetworkError(error) ? 'unavailable' : 'error');
    return { pushed: 0, error: error.message };
  }
  const remoteTs = new Map<string, number>();
  for (const row of data ?? []) {
    remoteTs.set(row.key as string, new Date(row.updated_at as string).getTime());
  }
  const now = new Date().toISOString();
  const rows = SYNC_KEYS.flatMap((key): SyncRow[] => {
    const raw = localStorage.getItem(key);
    if (raw == null) return [];
    const localTs = Number(localStorage.getItem(`forge:sync:updated:${key}`) ?? '0');
    const rTs = remoteTs.get(key);
    // Cloud copy is newer-or-equal → it wins, don't push.
    if (rTs !== undefined && rTs >= localTs) return [];
    let value: unknown;
    try { value = JSON.parse(raw); } catch { return []; }
    return [{ user_id: uid, key, value, updated_at: now }];
  });
  return upsertRows(rows);
}

/** Push a single key — called by stores on write (debounced from the hook). */
export async function pushKey(key: string, value: unknown): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  const now = new Date().toISOString();
  const row = { user_id: uid, key, value, updated_at: now };
  try {
    const { error } = await supabase.from(TABLE).upsert([row], { onConflict: 'user_id,key' });
    if (!error) {
      localStorage.setItem(`forge:sync:updated:${key}`, String(new Date(now).getTime()));
      return;
    }
    if (/relation .* does not exist|schema.*user_data/i.test(error.message)) {
      setState('unavailable');
    } else if (isRetryable(error)) {
      enqueueSyncOp({
        type: 'upsert', table: TABLE, row, onConflict: 'user_id,key',
        dedupeKey: `user_data:${uid}:${key}`,
      });
      setState('unavailable');
    }
  } catch (e) {
    // Network throw — queue for retry. Local data stays the source of truth.
    if (isRetryable(e)) {
      enqueueSyncOp({
        type: 'upsert', table: TABLE, row, onConflict: 'user_id,key',
        dedupeKey: `user_data:${uid}:${key}`,
      });
      setState('unavailable');
    }
  }
}

/**
 * Triggered on first login after being a guest. Reconciles local + cloud:
 * pulls remote data first (newer cloud rows win), then pushes only the local
 * keys that are newer or have no cloud row — so guest data is preserved without
 * clobbering more-recent data already synced from another device.
 */
export async function mergeGuestIntoAccount(): Promise<void> {
  await pullFromCloud();
  await reconcilePush();
}
