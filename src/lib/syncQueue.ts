/**
 * Persistent write-behind queue for cloud-sync operations that fail because
 * Supabase is unreachable. Local data is the source of truth; this queue
 * only catches up the cloud mirror once the network is back.
 *
 * Used by cloudSync.ts when pushKey / upsert throws a network/5xx error.
 * Drained on `online` event, visibility return, and a 60s backstop interval.
 */

import { supabase } from './supabase';
import { isLikelyNetworkError } from './offlineAuth';

const QUEUE_KEY = 'forge_sync_queue_v1';
const MAX_QUEUE = 500;

type QueueOp =
  | { type: 'upsert'; table: string; row: Record<string, unknown>; onConflict?: string; dedupeKey?: string }
  | { type: 'insert'; table: string; row: Record<string, unknown>; dedupeKey?: string }
  | { type: 'delete'; table: string; match: Record<string, unknown>; dedupeKey?: string };

interface StoredOp {
  op: QueueOp;
  ts: number;
  tries: number;
  lastError?: string;
}

let draining = false;
let drainTimer: number | null = null;

function load(): StoredOp[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as StoredOp[]; }
  catch { return []; }
}

function save(arr: StoredOp[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(arr)); } catch { /* quota */ }
  try { window.dispatchEvent(new CustomEvent('forge:sync-queue-changed', { detail: { size: arr.length } })); } catch { /* noop */ }
}

export function enqueueSyncOp(op: QueueOp): void {
  const q = load();
  if (op.dedupeKey) {
    const i = q.findIndex((x) => x.op.dedupeKey === op.dedupeKey);
    if (i >= 0) q.splice(i, 1);
  }
  q.push({ op, ts: Date.now(), tries: 0 });
  while (q.length > MAX_QUEUE) q.shift();
  save(q);
}

function isSchemaError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  const msg = String(e?.message ?? err ?? '').toLowerCase();
  if (e?.code === 'PGRST205') return true;
  if (msg.includes('could not find')) return true;
  if (msg.includes('relation') && msg.includes('does not exist')) return true;
  if (msg.includes('schema cache')) return true;
  return false;
}

function isPermissionError(err: unknown): boolean {
  const e = err as { code?: string; status?: number };
  return e?.code === '42501' || e?.status === 401 || e?.status === 403;
}

async function runOp(op: QueueOp): Promise<void> {
  if (op.type === 'upsert') {
    const opts = op.onConflict ? { onConflict: op.onConflict } : undefined;
    const { error } = await supabase.from(op.table).upsert(op.row, opts);
    if (error) throw error;
  } else if (op.type === 'insert') {
    const { error } = await supabase.from(op.table).insert(op.row);
    if (error) throw error;
  } else if (op.type === 'delete') {
    let q = supabase.from(op.table).delete();
    for (const [k, v] of Object.entries(op.match)) {
      q = q.eq(k, v as never);
    }
    const { error } = await q;
    if (error) throw error;
  }
}

export async function drainSyncQueue(): Promise<{ drained: number; remaining: number }> {
  if (draining) return { drained: 0, remaining: load().length };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { drained: 0, remaining: load().length };
  }
  draining = true;
  let drained = 0;
  try {
    const q = load();
    const remaining: StoredOp[] = [];
    for (const item of q) {
      try {
        await runOp(item.op);
        drained++;
      } catch (err) {
        if (isSchemaError(err) || isPermissionError(err)) {
          // Drop — these will never succeed by retrying
          continue;
        }
        remaining.push({
          ...item,
          tries: item.tries + 1,
          lastError: String((err as { message?: string })?.message ?? err),
        });
      }
    }
    save(remaining);
    return { drained, remaining: remaining.length };
  } finally {
    draining = false;
  }
}

export function syncQueueSize(): number {
  return load().length;
}

export function clearSyncQueue(): void {
  save([]);
}

export function isRetryable(err: unknown): boolean {
  return isLikelyNetworkError(err) && !isSchemaError(err) && !isPermissionError(err);
}

let initialized = false;

export function initSyncQueueListeners(): () => void {
  if (initialized) return () => undefined;
  initialized = true;

  const scheduleDrain = (delay: number) => {
    if (drainTimer != null) return;
    drainTimer = window.setTimeout(() => {
      drainTimer = null;
      drainSyncQueue();
    }, delay);
  };

  const onOnline = () => scheduleDrain(800);
  const onVisible = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) scheduleDrain(1200);
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  const interval = window.setInterval(() => {
    if (navigator.onLine && load().length) drainSyncQueue();
  }, 60000);

  // Initial drain attempt shortly after init
  scheduleDrain(2500);

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(interval);
    if (drainTimer != null) window.clearTimeout(drainTimer);
    initialized = false;
  };
}
