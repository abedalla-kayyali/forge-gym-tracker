import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import {
  pullFromCloud, pushToCloud, onSyncStateChange, getSyncState, type SyncState,
} from '../lib/cloudSync';
import { initSyncQueueListeners, drainSyncQueue } from '../lib/syncQueue';

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

  useEffect(() => {
    const unsub = onSyncStateChange(setState);
    return () => { unsub; };
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
      // Also push local data in case guest had unsynced stuff
      await pushToCloud();
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const debouncedPush = () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => {
        pushToCloud();
      }, 1500);
    };

    const onMutated = () => debouncedPush();
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
