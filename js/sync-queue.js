// FORGE Sync Queue
// Persistent write-behind queue for Supabase operations that fail because the
// service is unreachable. Local data is the source of truth; this queue only
// catches up the cloud mirror once the network is back.
//
// Flow:
//   • Caller does the local write FIRST (localStorage), then attempts the
//     cloud write. If the cloud write throws a network/5xx error, it calls
//     window._forgeSyncQueue.enqueue({...}).
//   • The queue is drained on `window.online`, on visibility return, and on
//     a 60-second interval whenever navigator.onLine is true and _sb exists.
//
// Op shape:
//   { type: 'upsert', table: 'community_meals', row: {...}, onConflict: 'name_key', dedupeKey?: string }

(function () {
  'use strict';

  const QUEUE_KEY = 'forge_sync_queue_v1';
  let draining = false;
  let drainTimer = null;

  function _load() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  }

  function _save(arr) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(arr)); } catch {}
  }

  function _emitChange() {
    try { window.dispatchEvent(new CustomEvent('forge:sync-queue-changed', { detail: { size: _load().length } })); } catch {}
  }

  function enqueue(op) {
    if (!op || !op.type) return;
    const q = _load();
    if (op.dedupeKey) {
      const i = q.findIndex((x) => x.dedupeKey === op.dedupeKey);
      if (i >= 0) q.splice(i, 1);
    }
    q.push({ ...op, ts: Date.now(), tries: 0 });
    // Cap at 500 entries to avoid runaway growth
    while (q.length > 500) q.shift();
    _save(q);
    _emitChange();
  }

  function _isSchemaError(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    return err?.code === 'PGRST205'
      || msg.includes('could not find')
      || msg.includes('relation') && msg.includes('does not exist')
      || msg.includes('schema cache');
  }

  function _isRetryable(err) {
    if (!err) return false;
    if (_isSchemaError(err)) return false;
    // Auth/permission: don't retry
    if (err.code === '42501' || err.status === 401 || err.status === 403) return false;
    return true;
  }

  async function _runOp(op) {
    const sb = window._sb;
    if (!sb) throw new Error('SB_OFFLINE');
    if (op.type === 'upsert') {
      const opts = op.onConflict ? { onConflict: op.onConflict } : undefined;
      const { error } = await sb.from(op.table).upsert(op.row, opts);
      if (error) throw error;
    } else if (op.type === 'insert') {
      const { error } = await sb.from(op.table).insert(op.row);
      if (error) throw error;
    } else if (op.type === 'delete') {
      let q = sb.from(op.table).delete();
      Object.entries(op.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (error) throw error;
    } else {
      throw new Error('UNKNOWN_OP_TYPE:' + op.type);
    }
  }

  async function drainNow() {
    if (draining) return { drained: 0, remaining: _load().length };
    if (!navigator.onLine || !window._sb) return { drained: 0, remaining: _load().length };
    draining = true;
    let drained = 0;
    try {
      const q = _load();
      const remaining = [];
      for (const op of q) {
        try {
          await _runOp(op);
          drained++;
        } catch (err) {
          if (_isRetryable(err)) {
            remaining.push({ ...op, tries: (op.tries || 0) + 1, lastError: String(err?.message || err) });
          }
          // Non-retryable: drop silently (schema missing, RLS denial, etc.)
        }
      }
      _save(remaining);
      _emitChange();
      return { drained, remaining: remaining.length };
    } finally {
      draining = false;
    }
  }

  function scheduleDrain(delay) {
    if (drainTimer) return;
    drainTimer = setTimeout(() => {
      drainTimer = null;
      drainNow();
    }, delay || 500);
  }

  function size() { return _load().length; }

  function clear() {
    _save([]);
    _emitChange();
  }

  // ── Triggers ──────────────────────────────────────────────────────────
  window.addEventListener('online', () => scheduleDrain(800));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) scheduleDrain(1200);
  });
  // Periodic backstop every 60s
  setInterval(() => { if (navigator.onLine && _load().length) drainNow(); }, 60000);
  // Initial drain shortly after load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scheduleDrain(2500), { once: true });
  } else {
    scheduleDrain(2500);
  }

  window._forgeSyncQueue = { enqueue, drainNow, size, clear };
})();
