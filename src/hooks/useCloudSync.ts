import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import {
  pullFromCloud, pushToCloud, pushKey, reconcilePush, isSyncKey, onSyncStateChange, getSyncState, type SyncState,
} from '../lib/cloudSync';
import { initSyncQueueListeners, drainSyncQueue } from '../lib/syncQueue';
import { rehydrateAllStores } from '../stores/rehydrate';

/**
 * Mount-once hook: auto-sync when the user logs in.
 *   • On mount: if logged in → PULL remote, then PUSH local (reconcile).
 *   • On window `forge:mutated` event: debounced PUSH.
 *   • Exposes sync state for the UI.
 *
 * Stores should dispatch `window.dispatchEvent(new Event('forge:mutated'))`
 * whenever they write. (A cheap alternative is to just push on every
 * visibility-change or before unload — both included here as safety nets.)
 */
export function useCloudSync() {
  const { user } = useAuth();
  const [state, setState] = useState<SyncState>(getSyncState());
  const didInitialSync = useRef(false);
  const pushTimer = useRef<number | null>(null);
  const pendingKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onSyncStateChange(setState);
    return () => { unsub(); };
  }, []);

  // Re-read stores from localStorage whenever a cloud pull updates it,
  // so newly-synced data appears without a page reload.
  useEffect(() => {
    const onPulled = () => rehydrateAllStores();
    window.addEventListener('forge:pulled', onPulled);
    return () => window.removeEventListener('forge:pulled', onPulled);
  }, []);

  // One-time: start the sync-queue background drainers (online / visibility / interval)
  useEffect(() => {
    const teardown = initSyncQueueListeners();
    return teardown;
  }, []);

  useEffect(() => {
    if (!user || didInitialSync.current) return;
    didInitialSync.current = true;
    (async () => {
      // Drain anything queued from prior offline sessions before pulling
      await drainSyncQueue();
      await pullFromCloud();
      // Reconcile local→cloud: push only keys newer than (or absent from) the
      // cloud so we never clobber data synced more recently from another device.
      await reconcilePush();
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Push only the keys that actually changed (coalesced over a debounce
    // window) instead of re-uploading every key on each mutation — far lighter
    // on metered connections.
    const flush = () => {
      const keys = [...pendingKeys.current];
      pendingKeys.current.clear();
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw == null) continue;
        let value: unknown;
        try { value = JSON.parse(raw); } catch { continue; }
        void pushKey(key, value);
      }
    };
    const scheduleFlush = () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(flush, 1500);
    };

    const onMutated = (e: Event) => {
      const key = (e as CustomEvent).detail?.key as string | undefined;
      if (key && isSyncKey(key)) {
        pendingKeys.current.add(key);
        scheduleFlush();
      }
    };
    // Full flush on background/unload as a safety net (catches anything missed).
    const onVisibility = () => { if (document.visibilityState === 'hidden') pushToCloud(); };
    const onPageHide = () => { pushToCloud(); };

    window.addEventListener('forge:mutated', onMutated);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('forge:mutated', onMutated);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [user]);

  return { state };
}
