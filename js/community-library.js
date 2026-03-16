'use strict';

(function () {
  const EXERCISE_CACHE_KEY = 'forge_shared_exercises_cache';
  const MEAL_CACHE_KEY = 'forge_shared_meals_cache';

  let _exerciseCache = _readCache(EXERCISE_CACHE_KEY, []);
  let _mealCache = _readCache(MEAL_CACHE_KEY, []);
  let _exerciseBoot = null;
  let _mealBoot = null;

  function _readCache(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function _writeCache(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) {}
  }

  function _emit(type) {
    try { window.dispatchEvent(new CustomEvent(type)); } catch (_e) {}
  }

  function normalizeCommunityNameKey(name) {
    return String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ');
  }

  function _sb() {
    return window._sb || null;
  }

  function _mapExerciseRow(row) {
    return {
      id: row.id || '',
      n: String(row.name || '').trim(),
      m: String(row.muscle || 'Core').trim(),
      e: String(row.equipment || 'other').trim(),
      t: String(row.tip || '').trim(),
      shared: true
    };
  }

  function _mapMealRow(row) {
    return {
      id: row.id || '',
      name: String(row.name || '').trim(),
      category: String(row.category || '').trim(),
      kcalPerUnit: +(+row.calories || 0).toFixed(1),
      pPerUnit: +(+row.protein || 0).toFixed(1),
      cPerUnit: +(+row.carbs || 0).toFixed(1),
      fPerUnit: +(+row.fat || 0).toFixed(1),
      uses: 0,
      lastUsed: 0,
      shared: true
    };
  }

  function _mergeExercises(base, shared) {
    const out = [];
    const seen = new Set();
    [...(base || []), ...(shared || [])].forEach((item) => {
      const key = normalizeCommunityNameKey(item?.n || item?.name || '');
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
    return out;
  }

  function _mergeMealEntries(localEntries, sharedEntries) {
    const out = [];
    const seen = new Set();
    [...(localEntries || []), ...(sharedEntries || [])].forEach((item) => {
      const key = normalizeCommunityNameKey(item?.name || '');
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
    return out;
  }

  // Track which tables are confirmed missing so we don't retry every load
  const _missingTables = new Set();

  function _isMissingTable(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    return err?.code === 'PGRST205' || msg.includes('could not find') || msg.includes('relation') || msg.includes('schema cache');
  }

  async function _fetchExercises() {
    if (!_sb()) return _exerciseCache;
    if (_missingTables.has('community_exercises')) return _exerciseCache;
    try {
      const { data, error } = await _sb().from('community_exercises')
        .select('id,name,muscle,equipment,tip,created_at')
        .order('name', { ascending: true });
      if (error) {
        if (_isMissingTable(error)) { _missingTables.add('community_exercises'); return _exerciseCache; }
        throw error;
      }
      _exerciseCache = Array.isArray(data) ? data.map(_mapExerciseRow) : [];
      _writeCache(EXERCISE_CACHE_KEY, _exerciseCache);
      _emit('forge:community-exercises-updated');
      return _exerciseCache;
    } catch (err) {
      if (!_isMissingTable(err)) console.warn('[FORGE community] exercise fetch failed', err?.message || err);
      return _exerciseCache;
    }
  }

  async function _fetchMeals() {
    if (!_sb()) return _mealCache;
    if (_missingTables.has('community_meals')) return _mealCache;
    try {
      const { data, error } = await _sb().from('community_meals')
        .select('id,name,category,calories,protein,carbs,fat,created_at')
        .order('name', { ascending: true });
      if (error) {
        if (_isMissingTable(error)) { _missingTables.add('community_meals'); return _mealCache; }
        throw error;
      }
      _mealCache = Array.isArray(data) ? data.map(_mapMealRow) : [];
      _writeCache(MEAL_CACHE_KEY, _mealCache);
      _emit('forge:community-meals-updated');
      return _mealCache;
    } catch (err) {
      if (!_isMissingTable(err)) console.warn('[FORGE community] meal fetch failed', err?.message || err);
      return _mealCache;
    }
  }

  function ensureCommunityExercisesLoaded() {
    if (!_exerciseBoot) _exerciseBoot = _fetchExercises().finally(() => { _exerciseBoot = null; });
    return _exerciseBoot;
  }

  function ensureCommunityMealsLoaded() {
    if (!_mealBoot) _mealBoot = _fetchMeals().finally(() => { _mealBoot = null; });
    return _mealBoot;
  }

  async function addCommunityExercise(entry) {
    const name = String(entry?.name || '').trim();
    const name_key = normalizeCommunityNameKey(name);
    if (!name_key) throw new Error('invalid exercise name');
    const payload = {
      name,
      name_key,
      muscle: String(entry?.muscle || 'Core').trim() || 'Core',
      equipment: String(entry?.equipment || 'other').trim() || 'other',
      tip: String(entry?.tip || '').trim()
    };
    const localFallback = _mapExerciseRow(payload);
    if (!_sb()) {
      _exerciseCache = _mergeExercises(_exerciseCache, [localFallback]);
      _writeCache(EXERCISE_CACHE_KEY, _exerciseCache);
      _emit('forge:community-exercises-updated');
      return localFallback;
    }
    try {
      const { data, error } = await _sb().from('community_exercises')
        .upsert(payload, { onConflict: 'name_key' })
        .select('id,name,muscle,equipment,tip,created_at')
        .single();
      if (error) throw error;
      const mapped = _mapExerciseRow(data || payload);
      _exerciseCache = _mergeExercises(_exerciseCache, [mapped]);
      _writeCache(EXERCISE_CACHE_KEY, _exerciseCache);
      _emit('forge:community-exercises-updated');
      return mapped;
    } catch (err) {
      console.warn('[FORGE community] exercise upsert failed', err?.message || err);
      _exerciseCache = _mergeExercises(_exerciseCache, [localFallback]);
      _writeCache(EXERCISE_CACHE_KEY, _exerciseCache);
      _emit('forge:community-exercises-updated');
      return localFallback;
    }
  }

  async function addCommunityMeal(entry) {
    const name = String(entry?.name || '').trim();
    const name_key = normalizeCommunityNameKey(name);
    if (!name_key) throw new Error('invalid meal name');
    const payload = {
      name,
      name_key,
      category: String(entry?.category || '').trim(),
      calories: Math.max(0, parseFloat(entry?.kcal) || 0),
      protein: Math.max(0, parseFloat(entry?.p) || 0),
      carbs: Math.max(0, parseFloat(entry?.c) || 0),
      fat: Math.max(0, parseFloat(entry?.f) || 0)
    };
    const localFallback = _mapMealRow(payload);
    if (!_sb()) {
      _mealCache = _mergeMealEntries(_mealCache, [localFallback]);
      _writeCache(MEAL_CACHE_KEY, _mealCache);
      _emit('forge:community-meals-updated');
      return localFallback;
    }
    try {
      const { data, error } = await _sb().from('community_meals')
        .upsert(payload, { onConflict: 'name_key' })
        .select('id,name,category,calories,protein,carbs,fat,created_at')
        .single();
      if (error) throw error;
      const mapped = _mapMealRow(data || payload);
      _mealCache = _mergeMealEntries(_mealCache, [mapped]);
      _writeCache(MEAL_CACHE_KEY, _mealCache);
      _emit('forge:community-meals-updated');
      return mapped;
    } catch (err) {
      console.warn('[FORGE community] meal upsert failed', err?.message || err);
      _mealCache = _mergeMealEntries(_mealCache, [localFallback]);
      _writeCache(MEAL_CACHE_KEY, _mealCache);
      _emit('forge:community-meals-updated');
      return localFallback;
    }
  }

  function getMergedExerciseCatalog(base) {
    return _mergeExercises(base || [], _exerciseCache || []);
  }

  function getCommunityMealEntries(localEntries) {
    return _mergeMealEntries(localEntries || [], _mealCache || []);
  }

  function findCommunityMealByName(name) {
    const key = normalizeCommunityNameKey(name);
    if (!key) return null;
    return (_mealCache || []).find((item) => normalizeCommunityNameKey(item.name) === key) || null;
  }

  window.normalizeCommunityNameKey = normalizeCommunityNameKey;
  window.ensureCommunityExercisesLoaded = ensureCommunityExercisesLoaded;
  window.ensureCommunityMealsLoaded = ensureCommunityMealsLoaded;
  window.addCommunityExercise = addCommunityExercise;
  window.addCommunityMeal = addCommunityMeal;
  window.getMergedExerciseCatalog = getMergedExerciseCatalog;
  window.getCommunityMealEntries = getCommunityMealEntries;
  window.findCommunityMealByName = findCommunityMealByName;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      ensureCommunityExercisesLoaded();
      ensureCommunityMealsLoaded();
    }, { once: true });
  } else {
    ensureCommunityExercisesLoaded();
    ensureCommunityMealsLoaded();
  }
})();
