// FORGE Gym Tracker - storage helpers
// Centralizes storage keys, safe JSON reads, and IndexedDB mirroring.
(function initForgeStorage(global) {
  'use strict';

  const KEYS = Object.freeze({
    WORKOUTS: 'forge_workouts',
    BODY_WEIGHT: 'forge_bodyweight',
    TEMPLATES: 'forge_templates',
    SETTINGS: 'forge_settings',
    MEALS: 'forge_meals',
    MEAL_LIBRARY: 'forge_meal_library',
    BW_WORKOUTS: 'forge_bw_workouts',
    WATER_PREFIX: 'forge_water_',
    CARDIO: 'forge_cardio'
  });

  const CORE_IDB_KEYS = Object.freeze([
    KEYS.WORKOUTS,
    KEYS.BODY_WEIGHT,
    KEYS.TEMPLATES,
    KEYS.SETTINGS,
    KEYS.MEALS,
    KEYS.MEAL_LIBRARY,
    KEYS.CARDIO
  ]);

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('[FORGE] localStorage corrupt:', key);
      return fallback;
    }
  }

  function createIdbBackup() {
    let db = null;

    function put(key, value) {
      if (!db) return;
      try {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(value, key);
      } catch (_err) {
        // Non-fatal: keep app functional if backup write fails.
      }
    }

    function get(key) {
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error('no db'));
          return;
        }
        const tx = db.transaction('kv', 'readonly');
        const req = tx.objectStore('kv').get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = reject;
      });
    }

    function syncFromLocalStorage() {
      CORE_IDB_KEYS.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
          put(key, JSON.parse(raw));
        } catch (_err) {
          // Ignore malformed value and continue syncing.
        }
      });
    }

    try {
      const req = indexedDB.open('forge-v3', 1);
      req.onupgradeneeded = (event) => {
        event.target.result.createObjectStore('kv');
      };
      req.onsuccess = (event) => {
        db = event.target.result;
        syncFromLocalStorage();
      };
    } catch (_err) {
      // IDB may be unavailable in private mode; degrade silently.
    }

    return {
      put,
      get,
      ready: () => !!db,
      restoreToLS: async () => {
        for (const key of CORE_IDB_KEYS) {
          try {
            const val = await get(key);
            if (val != null) localStorage.setItem(key, JSON.stringify(val));
          } catch (_err) {
            // Ignore per-key restore failures.
          }
        }
      }
    };
  }

  // ── HTML entity encoder ─────────────────────────────────────────────────────
  // Use _esc(str) for any user-controlled string inserted via innerHTML.
  // Encodes & < > " ' to prevent XSS in dynamic HTML templates.
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Create high-entropy ids for persisted records to reduce collision risk.
  function makeId(prefix) {
    const p = (typeof prefix === 'string' && prefix.trim()) ? prefix.trim() : 'id';
    try {
      if (global.crypto && typeof global.crypto.randomUUID === 'function') {
        return p + '_' + global.crypto.randomUUID();
      }
    } catch (_err) {
      // Fall through to timestamp+random fallback.
    }
    return p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  // ── Schema migration runner ──────────────────────────────────────────────────
  // Bump SCHEMA_VERSION when changing localStorage payload shapes.
  // Add migration blocks inside runMigrations() for each version step.
  const SCHEMA_VERSION = 1;

  function runMigrations() {
    try {
      const stored = parseInt(localStorage.getItem('forge_schema_version') || '0', 10);
      if (stored >= SCHEMA_VERSION) return;
      // === Add migration blocks here as schema evolves ===
      // Example: if (stored < 2) { /* migrate v1→v2 */ }
      localStorage.setItem('forge_schema_version', String(SCHEMA_VERSION));
      console.log('[FORGE] Schema migrated to v' + SCHEMA_VERSION);
    } catch (err) {
      console.warn('[FORGE] Schema migration failed:', err);
    }
  }

  global.FORGE_STORAGE = {
    KEYS,
    CORE_IDB_KEYS,
    SCHEMA_VERSION,
    lsGet,
    createIdbBackup,
    esc,
    makeId,
    runMigrations
  };
})(window);
