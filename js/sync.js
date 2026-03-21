// FORGE Sync Engine
// Syncs localStorage data to/from Supabase in the background.
// offline-first: localStorage is the working copy; Supabase is the cloud source of truth.
//
// Public API (on window):
//   _syncPull(userId)            — fetch all user data from Supabase → localStorage
//   _syncPush(userId)            — push all localStorage data to Supabase (upsert)
//   _syncPushDebounced()         — debounced version called after every save()
//   _syncPushProfile(userId)     — push only the profile row (called after onboarding)
//   _forgeSignOut()              — sign out and reset to auth screen

(function () {
  'use strict';

  const LS = window.FORGE_STORAGE ? window.FORGE_STORAGE.KEYS : null;
  const PENDING_KEY = 'forge_sync_pending';
  const DEBOUNCE_MS = 2000;

  let _debounceTimer = null;
  let _currentUserId = null;
  const _tableCache = {};

  // ── Helpers ──────────────────────────────────────────────────────────────

  function _ls(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function _lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
  function _syncRecordId(kind, raw) {
    const value = String(raw || '').trim();
    if (value) return value;
    if (window.FORGE_STORAGE && typeof window.FORGE_STORAGE.makeId === 'function') {
      return window.FORGE_STORAGE.makeId(kind || 'sync');
    }
    return (kind || 'sync') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }
  async function _hasTable(table) {
    if (!window._sb || !table) return false;
    if (Object.prototype.hasOwnProperty.call(_tableCache, table)) return _tableCache[table];
    try {
      const { error } = await window._sb.from(table).select('id').limit(1);
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (error.code === 'PGRST205' || msg.includes('could not find') || msg.includes('relation') || msg.includes('404')) {
          _tableCache[table] = false;
          return false;
        }
      }
      _tableCache[table] = !error;
      return _tableCache[table];
    } catch (_e) {
      _tableCache[table] = false;
      return false;
    }
  }

  function _profileTargetsUpdatedAt(profile) {
    const rawTs = profile?.customNutritionTargets?.updatedAt;
    const ts = parseInt(rawTs, 10);
    return Number.isFinite(ts) ? ts : 0;
  }

  function _mergeProfileData(localProfile, remoteProfile) {
    const local = (localProfile && typeof localProfile === 'object') ? localProfile : {};
    const remote = (remoteProfile && typeof remoteProfile === 'object') ? remoteProfile : {};
    const merged = { ...local, ...remote };

    const localTargets = local.customNutritionTargets;
    const remoteTargets = remote.customNutritionTargets;
    const localTs = _profileTargetsUpdatedAt(local);
    const remoteTs = _profileTargetsUpdatedAt(remote);

    if (localTargets && typeof localTargets === 'object' && (!remoteTargets || localTs > remoteTs)) {
      merged.customNutritionTargets = localTargets;
    } else if (remoteTargets && typeof remoteTargets === 'object') {
      merged.customNutritionTargets = remoteTargets;
    }

    return merged;
  }

  async function _upsert(table, rows) {
    if (!window._sb || !rows) return;
    if (!Array.isArray(rows)) rows = [rows];
    if (rows.length === 0) return;
    const { error } = await window._sb.from(table).upsert(rows, { onConflict: 'id' });
    if (error) console.warn('[FORGE sync] upsert error', table, error.message);
  }

  async function _upsertSingle(table, row, conflictCol) {
    if (!window._sb || !row) return;
    const { error } = await window._sb.from(table).upsert(row, { onConflict: conflictCol || 'user_id' });
    if (error) console.warn('[FORGE sync] upsert error', table, error.message);
  }

  // ── Push ─────────────────────────────────────────────────────────────────

  async function _syncPushWorkouts(userId) {
    const workouts = _ls('forge_workouts');
    if (!Array.isArray(workouts) || workouts.length === 0) return;
    const rows = workouts.map(w => ({
      id:      _syncRecordId('wk', w.id || w.date),
      user_id: userId,
      data:    w,
      date:    w.date ? new Date(w.date).toISOString() : new Date().toISOString()
    }));
    await _upsert('workouts', rows);
  }

  async function _syncPushBwWorkouts(userId) {
    const bw = _ls('forge_bw_workouts');
    if (!Array.isArray(bw) || bw.length === 0) return;
    const rows = bw.map(w => ({
      id:      _syncRecordId('bwk', w.id || w.date),
      user_id: userId,
      data:    w,
      date:    w.date ? new Date(w.date).toISOString() : new Date().toISOString()
    }));
    await _upsert('bw_workouts', rows);
  }

  async function _syncPushCardio(userId) {
    if (!await _hasTable('cardio')) return;
    const cardio = _ls('forge_cardio');
    if (!Array.isArray(cardio) || cardio.length === 0) return;
    const rows = cardio.map(c => ({
      id:      _syncRecordId('cardio', c.id || c.date),
      user_id: userId,
      data:    c,
      date:    c.date ? new Date(c.date).toISOString() : new Date().toISOString()
    }));
    await _upsert('cardio', rows);
  }

  async function _syncPushBodyWeight(userId) {
    const entries = _ls('forge_bodyweight');
    if (!Array.isArray(entries) || entries.length === 0) return;
    const rows = entries.map((e, i) => ({
      id:      _syncRecordId('bw', e.id || e.date || i),
      user_id: userId,
      data:    e,
      date:    e.date || new Date().toISOString().slice(0, 10)
    }));
    const { error } = await window._sb.from('body_weight').upsert(rows, { onConflict: 'id' });
    if (error) console.warn('[FORGE sync] upsert error body_weight', error.message);
  }

  async function _syncPushTemplates(userId) {
    const templates = _ls('forge_templates');
    if (!Array.isArray(templates) || templates.length === 0) return;
    const rows = templates.map(t => ({
      id:      _syncRecordId('tmpl', t.id || t.name),
      user_id: userId,
      data:    t
    }));
    await _upsert('templates', rows);
  }

  async function _syncPushSimple(table, lsKey, userId) {
    const data = _ls(lsKey);
    if (data === null || data === undefined) return;
    await _upsertSingle(table, { user_id: userId, data });
  }

  function _collectDateRowsFromPrefixedKeys(prefix, userId) {
    const rows = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const date = key.slice(prefix.length);
        if (!date) continue;
        const data = _ls(key);
        if (data == null) continue;
        rows.push({ user_id: userId, date, data });
      }
    } catch (_err) {}
    return rows;
  }

  async function _syncPushCheckins(userId) {
    // Prefer the actual runtime storage model: forge_checkin_<toDateString()>
    // Keep fallback support for legacy forge_checkins object.
    const rows = _collectDateRowsFromPrefixedKeys('forge_checkin_', userId);
    const checkins = _ls('forge_checkins');
    if (checkins && typeof checkins === 'object') {
      Object.entries(checkins).forEach(([date, data]) => {
        if (rows.some(r => r.date === date)) return;
        rows.push({ user_id: userId, date, data });
      });
    }
    if (rows.length === 0) return;
    const { error } = await window._sb.from('checkins').upsert(rows, { onConflict: 'user_id,date' });
    if (error) console.warn('[FORGE sync] upsert error checkins', error.message);
  }

  async function _syncPushWater(userId) {
    // Prefer runtime storage model: forge_water_<toDateString()>
    // Keep fallback support for legacy forge_water object.
    const rows = _collectDateRowsFromPrefixedKeys('forge_water_', userId);
    const water = _ls('forge_water');
    if (water && typeof water === 'object') {
      Object.entries(water).forEach(([date, data]) => {
        if (rows.some(r => r.date === date)) return;
        rows.push({ user_id: userId, date, data });
      });
    }
    if (rows.length === 0) return;
    const { error } = await window._sb.from('water').upsert(rows, { onConflict: 'user_id,date' });
    if (error) console.warn('[FORGE sync] upsert error water', error.message);
  }

  async function _syncPushSteps(userId) {
    const steps = _ls('forge_steps');
    if (!steps || typeof steps !== 'object') return;
    const rows = Object.entries(steps).map(([date, val]) => {
      // Keys in stepsData use toDateString() format; convert to YYYY-MM-DD for Supabase
      // Use local date parts (not toISOString) to avoid UTC off-by-one for UTC+ timezones
      const d = new Date(date);
      const isoDate = isNaN(d.getTime()) ? date :
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return {
        user_id: userId,
        date: isoDate,
        steps: typeof val === 'number' ? val : (val?.steps || 0)
      };
    });
    if (rows.length === 0) return;
    const { error } = await window._sb.from('steps').upsert(rows, { onConflict: 'user_id,date' });
    if (error) console.warn('[FORGE sync] upsert error steps', error.message);
  }

  // Profile push (called directly after onboarding)
  window._syncPushProfile = async function (userId) {
    if (!window._sb || !userId) return;
    const profileRaw = _ls('forge_profile') || {};
    const { error } = await window._sb.from('profiles')
      .upsert({ id: userId, data: profileRaw }, { onConflict: 'id' });
    if (error) console.warn('[FORGE sync] upsert error profiles', error.message);
  };

  // Full push of all data
  window._syncPush = async function (userId) {
    if (!window._sb || !userId) return;
    try {
      await Promise.all([
        window._syncPushProfile(userId),
        _syncPushWorkouts(userId),
        _syncPushBwWorkouts(userId),
        _syncPushCardio(userId),
        _syncPushBodyWeight(userId),
        _syncPushTemplates(userId),
        _syncPushSimple('settings',     'forge_settings',     userId),
        _syncPushSimple('meals',        'forge_meals',        userId),
        _syncPushSimple('meal_library', 'forge_meal_library', userId),
        _syncPushCheckins(userId),
        _syncPushWater(userId),
        _syncPushSteps(userId)
      ]);
      localStorage.removeItem(PENDING_KEY);
    } catch (e) {
      console.warn('[FORGE sync] push error', e);
      localStorage.setItem(PENDING_KEY, '1');
    }
  };

  // Debounced push — called after every save()
  window._syncPushDebounced = function () {
    if (!window._sb || !_currentUserId) return;
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      window._syncPush(_currentUserId);
    }, DEBOUNCE_MS);
  };

  // ── Pull ─────────────────────────────────────────────────────────────────

  window._syncPull = async function (userId) {
    if (!window._sb || !userId) return;
    _currentUserId = userId;
    try {
      // Run cardio table check in parallel with other queries using a safe fallback
      const cardioReq = _tableCache && _tableCache.cardio === false
        ? Promise.resolve({ data: [], error: null })
        : window._sb.from('cardio').select('data').eq('user_id', userId);

      const [
        profileRes, workoutsRes, bwRes, cardioRes, bwWeightRes, tplRes,
        settingsRes, mealsRes, mealLibRes, checkinsRes, waterRes, stepsRes
      ] = await Promise.all([
        window._sb.from('profiles').select('data').eq('id', userId).maybeSingle(),
        window._sb.from('workouts').select('data').eq('user_id', userId),
        window._sb.from('bw_workouts').select('data').eq('user_id', userId),
        cardioReq,
        window._sb.from('body_weight').select('data').eq('user_id', userId),
        window._sb.from('templates').select('data').eq('user_id', userId),
        window._sb.from('settings').select('data').eq('user_id', userId).maybeSingle(),
        window._sb.from('meals').select('data').eq('user_id', userId).maybeSingle(),
        window._sb.from('meal_library').select('data').eq('user_id', userId).maybeSingle(),
        window._sb.from('checkins').select('date,data').eq('user_id', userId),
        window._sb.from('water').select('date,data').eq('user_id', userId),
        window._sb.from('steps').select('date,steps').eq('user_id', userId)
      ]);

      // Log any per-table errors (RLS failures, missing tables, auth issues)
      if (workoutsRes.error)  console.error('[FORGE sync] workouts error:',  workoutsRes.error);
      if (bwRes.error)        console.error('[FORGE sync] bw_workouts error:', bwRes.error);
      if (bwWeightRes.error)  console.error('[FORGE sync] body_weight error:', bwWeightRes.error);
      if (cardioRes.error) {
        const msg = String(cardioRes.error.message || '').toLowerCase();
        if (!msg.includes('relation') && !msg.includes('does not exist')) {
          console.error('[FORGE sync] cardio error:', cardioRes.error);
        }
        if (_tableCache) _tableCache.cardio = false;
      }

      // Profiles (preserve freshest nutrition target overrides by timestamp)
      if (profileRes.data?.data) {
        const localProfile = _ls('forge_profile') || {};
        _lsSet('forge_profile', _mergeProfileData(localProfile, profileRes.data.data));
      }

      // Arrays — only write if data came back (preserve existing LS if Supabase errored)
      if (workoutsRes.data?.length) _lsSet('forge_workouts', workoutsRes.data.map(r => r.data));
      if (bwRes.data?.length)       _lsSet('forge_bw_workouts', bwRes.data.map(r => r.data));
      if (cardioRes.data?.length)   _lsSet('forge_cardio', cardioRes.data.map(r => r.data));
      if (bwWeightRes.data?.length) _lsSet('forge_bodyweight', bwWeightRes.data.map(r => r.data));
      if (tplRes.data?.length)      _lsSet('forge_templates', tplRes.data.map(r => r.data));

      // Single-row blobs
      if (settingsRes.data?.data) _lsSet('forge_settings', settingsRes.data.data);
      if (mealsRes.data?.data)    _lsSet('forge_meals', mealsRes.data.data);
      if (mealLibRes.data?.data)  _lsSet('forge_meal_library', mealLibRes.data.data);

      // Date-keyed objects
      if (checkinsRes.data?.length) {
        const obj = {};
        checkinsRes.data.forEach(r => {
          obj[r.date] = r.data;
          _lsSet('forge_checkin_' + r.date, r.data);
        });
        _lsSet('forge_checkins', obj);
      }
      if (waterRes.data?.length) {
        const obj = {};
        waterRes.data.forEach(r => {
          obj[r.date] = r.data;
          _lsSet('forge_water_' + r.date, r.data);
        });
        _lsSet('forge_water', obj);
      }
      if (stepsRes.data?.length) {
        const obj = {};
        const savedGoal = parseInt(localStorage.getItem('forge_step_goal') || '0') || 10000;
        stepsRes.data.forEach(r => {
          // r.date from Supabase is YYYY-MM-DD; parse in local time to match today() = toDateString()
          const parts = r.date.split('-').map(Number);
          const key = new Date(parts[0], parts[1] - 1, parts[2]).toDateString();
          obj[key] = { steps: r.steps, goal: savedGoal };
        });
        _lsSet('forge_steps', obj);
        // Sync in-memory stepsData so renderStepsPanel reads fresh values without reload
        if (typeof stepsData !== 'undefined') {
          Object.keys(stepsData).forEach(k => delete stepsData[k]);
          Object.assign(stepsData, obj);
        }
        // Re-render steps panel and DNN so checkmarks reflect synced steps
        if (typeof renderStepsPanel === 'function') renderStepsPanel();
        if (typeof renderDailyNonNegotiables === 'function') renderDailyNonNegotiables();
      }

      console.log('[FORGE sync] pull complete — workouts:', workoutsRes.data?.length ?? 0,
        'bw:', bwRes.data?.length ?? 0);
    } catch (e) {
      console.error('[FORGE sync] pull FAILED (unexpected error):', e);
    }
  };

  // ── Sign out ─────────────────────────────────────────────────────────────

  window._forgeSignOut = async function () {
    clearTimeout(_debounceTimer);
    _currentUserId = null;
    if (window._sb) await window._sb.auth.signOut();
    // Clear user data from localStorage (keep app shell keys)
    [
      'forge_workouts','forge_bw_workouts','forge_bodyweight',
      'forge_cardio','forge_templates','forge_settings','forge_meals','forge_meal_library',
      'forge_checkins','forge_water','forge_steps','forge_profile',
      'forge_sync_pending','forge_schema_version'
    ].forEach(k => localStorage.removeItem(k));
    // Reload to show auth screen
    window.location.reload();
  };

  // ── Online retry ─────────────────────────────────────────────────────────

  window.addEventListener('online', function () {
    if (localStorage.getItem(PENDING_KEY) && _currentUserId) {
      console.log('[FORGE sync] back online — retrying pending push');
      window._syncPush(_currentUserId);
    }
  });

  // ── Set current user (called after pull/boot) ────────────────────────────
  window._syncSetUser = function (userId) {
    _currentUserId = userId;
  };

})();
