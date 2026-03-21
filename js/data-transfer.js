function exportCSV() {
  const _lsGet = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const _lsRaw = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const _collectPrefixed = (prefix) => {
    const out = {};
    try {
      Object.keys(localStorage).forEach((key) => {
        if (!key || key.indexOf(prefix) !== 0) return;
        const raw = localStorage.getItem(key);
        if (raw == null) return;
        try { out[key] = JSON.parse(raw); }
        catch { out[key] = raw; }
      });
    } catch (_e) {}
    return out;
  };
  const _collectForgeAll = () => {
    const out = {};
    try {
      Object.keys(localStorage).forEach((key) => {
        if (!key || !/^forge_/i.test(key)) return;
        const raw = localStorage.getItem(key);
        if (raw == null) return;
        try { out[key] = JSON.parse(raw); }
        catch { out[key] = raw; }
      });
    } catch (_e) {}
    return out;
  };

  const wgt = typeof workouts !== 'undefined' ? workouts : (_lsGet('forge_workouts') || []);
  const bwW = typeof bwWorkouts !== 'undefined' ? bwWorkouts : (_lsGet('forge_bw_workouts') || []);
  const bwB = typeof bodyWeight !== 'undefined' ? bodyWeight : (_lsGet('forge_bodyweight') || []);
  const cardio = typeof cardioLog !== 'undefined' ? cardioLog : (_lsGet('forge_cardio') || []);
  const templatesData = typeof templates !== 'undefined' ? templates : (_lsGet('forge_templates') || []);
  const meals = _lsGet('forge_meals') || {};
  const mealLibrary = _lsGet('forge_meal_library') || {};
  const readiness = _lsGet('forge_readiness') || {};
  const inbodyTests = _lsGet('forge_inbody_tests') || [];
  const measurements = _lsGet('forge_measurements') || [];
  const checkins = _lsGet('forge_checkins') || {};
  const water = _lsGet('forge_water') || {};
  const steps = _lsGet('forge_steps') || {};
  const checkinsDaily = _collectPrefixed('forge_checkin_');
  const waterDaily = _collectPrefixed('forge_water_');
  const stepsDaily = _collectPrefixed('forge_steps_');
  const bwCustomExercises = _lsGet('forge_bw_custom_exercises') || [];
  const cardioCustomTypes = _lsGet('forge_cardio_custom_types') || [];
  const profile = _lsGet('forge_profile') || {};
  const settingsData = typeof settings !== 'undefined' ? settings : (_lsGet('forge_settings') || {});
  const uiData = {
    theme: _lsRaw('forge_theme') || '',
    accent: _lsRaw('forge_accent') || '',
    layout: _lsGet('forge_layout') || null,
    lang: _lsRaw('forge_lang') || '',
    stepGoal: _lsRaw('forge_step_goal') || ''
  };
  const forgeAll = _collectForgeAll();

  const _hasAny = (v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return !!v;
  };
  const hasData =
    _hasAny(wgt) || _hasAny(bwW) || _hasAny(bwB) || _hasAny(cardio) || _hasAny(templatesData) ||
    _hasAny(meals) || _hasAny(mealLibrary) || _hasAny(readiness) || _hasAny(inbodyTests) ||
    _hasAny(measurements) || _hasAny(checkins) || _hasAny(water) || _hasAny(steps) ||
    _hasAny(checkinsDaily) || _hasAny(waterDaily) || _hasAny(stepsDaily) || _hasAny(profile) ||
    _hasAny(settingsData) || _hasAny(bwCustomExercises) || _hasAny(cardioCustomTypes) || _hasAny(uiData) ||
    _hasAny(forgeAll);
  if (!hasData) { showToast('No data to export!'); return; }

  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const dt = iso => new Date(iso).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'numeric' });
  const tm = iso => new Date(iso).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  const _fmtDateMaybe = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return dt(d.toISOString());
    } catch (_e) {}
    return String(value);
  };
  const _csvObj = (obj) => {
    try { return JSON.stringify(obj ?? {}); } catch { return String(obj ?? ''); }
  };

  let csv = '';

  const _appendKVSection = (title, obj) => {
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) return;
    csv += '=== ' + title + ' ===\n';
    csv += 'Key,Value\n';
    Object.keys(obj).sort().forEach((key) => {
      const val = obj[key];
      csv += [q(key), q((val && typeof val === 'object') ? _csvObj(val) : val)].join(',') + '\n';
    });
    csv += '\n';
  };

  csv += '=== FORGE GYM FULL EXPORT ===\n';
  csv += 'Exported:,' + q(new Date().toLocaleString('en-GB')) + '\n';
  csv += 'Weighted Workouts:,' + wgt.length + '\n';
  csv += 'Bodyweight Workouts:,' + bwW.length + '\n';
  csv += 'Cardio Workouts:,' + cardio.length + '\n';
  csv += 'Body Comp Entries:,' + bwB.length + '\n';
  csv += 'Readiness Days:,' + Object.keys(readiness).length + '\n';

  const prCount = wgt.filter(w => w && w.isPR).length + bwW.filter(w => w && w.isPR).length;
  csv += 'Personal Records:,' + prCount + '\n';

  const totalVol = wgt.reduce((a, w) => a + (w && w.totalVolume ? w.totalVolume : 0), 0);
  csv += 'Total Volume Lifted:,' + Math.round(totalVol) + ' kg\n';

  const allDates = [...wgt, ...bwW].map(w => w && w.date).filter(Boolean).sort();
  if (allDates.length) {
    csv += 'First Session:,' + q(dt(allDates[0])) + '\n';
    csv += 'Latest Session:,' + q(dt(allDates[allDates.length - 1])) + '\n';
  }
  csv += '\n';

  if (wgt.length) {
    csv += '=== WEIGHTED WORKOUTS ===\n';
    csv += 'Date,Time,Muscle Group,Exercise Type,Exercise,Set #,Reps,Weight,Unit,Set Volume (kg),Session Volume (kg),PR?,Notes\n';

    const byMuscle = {};
    wgt.forEach(w => { (byMuscle[w.muscle] = byMuscle[w.muscle] || []).push(w); });
    const MUSCLE_ORDER = ['Chest','Back','Shoulders','Biceps','Triceps','Forearms','Legs','Glutes','Core','Calves'];
    const muscleOrder = [...MUSCLE_ORDER, ...Object.keys(byMuscle).filter(m => !MUSCLE_ORDER.includes(m))];

    muscleOrder.forEach(muscle => {
      if (!byMuscle[muscle]) return;
      const sessions = [...byMuscle[muscle]].sort((a,b) => new Date(a.date) - new Date(b.date));
      sessions.forEach(w => {
        const sets = Array.isArray(w.sets) ? w.sets : [];
        const sessionVol = Math.round(w.totalVolume || sets.reduce((a,s)=>a+((s.reps||0)*(s.weight||0)),0));
        const exLower = String(w.exercise || '').toLowerCase();
        const exType = exLower.includes('press') ? 'Press' :
                       exLower.includes('curl') ? 'Curl' :
                       exLower.includes('row') ? 'Row' :
                       exLower.includes('squat') ? 'Squat' :
                       exLower.includes('deadlift') ? 'Deadlift' :
                       exLower.includes('fly') || exLower.includes('flye') ? 'Fly' :
                       exLower.includes('pull') ? 'Pull' :
                       exLower.includes('push') ? 'Push' :
                       exLower.includes('raise') ? 'Raise' :
                       exLower.includes('extension') ? 'Extension' :
                       exLower.includes('kickback') ? 'Kickback' :
                       exLower.includes('dip') ? 'Dip' : 'Other';

        sets.forEach((s, i) => {
          const reps = Number(s.reps || 0);
          const weight = Number(s.weight || 0);
          const setVol = Math.round(reps * weight);
          csv += [
            q(_fmtDateMaybe(w.date)),
            q(tm(w.date)),
            q(muscle),
            q(exType),
            q(w.exercise),
            i + 1,
            reps,
            weight,
            q(s.unit || 'kg'),
            setVol,
            i === 0 ? sessionVol : '',
            i === 0 && w.isPR ? 'PR' : '',
            i === 0 ? q(w.notes || '') : ''
          ].join(',') + '\n';
        });
      });
    });
    csv += '\n';

    csv += '=== EXERCISE PROGRESS HISTORY ===\n';
    csv += 'Exercise,Muscle Group,Date,Max Weight (kg),Total Reps,Sets,Session Volume (kg),PR?\n';
    const byExercise = {};
    wgt.forEach(w => { (byExercise[w.exercise] = byExercise[w.exercise] || []).push(w); });
    Object.keys(byExercise).sort().forEach(ex => {
      const sessions = [...byExercise[ex]].sort((a,b) => new Date(a.date) - new Date(b.date));
      sessions.forEach(w => {
        const sets = Array.isArray(w.sets) ? w.sets : [];
        const maxW = sets.length ? Math.max(...sets.map(s => Number(s.weight || 0))) : 0;
        const totReps = sets.reduce((a, s) => a + Number(s.reps || 0), 0);
        const vol = Math.round(w.totalVolume || sets.reduce((a, s) => a + (Number(s.reps || 0) * Number(s.weight || 0)), 0));
        csv += [q(ex), q(w.muscle), q(_fmtDateMaybe(w.date)), maxW, totReps, sets.length, vol, w.isPR ? 'PR' : ''].join(',') + '\n';
      });
    });
    csv += '\n';
  }

  if (bwW.length) {
    csv += '=== BODYWEIGHT WORKOUTS ===\n';
    csv += 'Date,Time,Muscle Group,Exercise,Set #,Reps,Effort,Total Reps,PR?,Notes\n';
    const byMuscle = {};
    bwW.forEach(w => { (byMuscle[w.muscle || 'Other'] = byMuscle[w.muscle || 'Other'] || []).push(w); });
    Object.keys(byMuscle).sort().forEach(muscle => {
      [...byMuscle[muscle]].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(w => {
        const sets = Array.isArray(w.sets) ? w.sets : [];
        const totReps = w.totalReps || sets.reduce((a, s) => a + Number(s.r || s.reps || 0), 0);
        sets.forEach((s, i) => {
          csv += [
            q(_fmtDateMaybe(w.date)),
            q(tm(w.date)),
            q(muscle),
            q(w.exercise),
            i + 1,
            Number(s.r || s.reps || 0),
            q(s.e || s.effort || ''),
            i === 0 ? totReps : '',
            i === 0 && w.isPR ? 'PR' : '',
            i === 0 ? q(w.notes || '') : ''
          ].join(',') + '\n';
        });
      });
    });
    csv += '\n';
  }

  if (bwB.length) {
    csv += '=== BODY COMPOSITION HISTORY ===\n';
    csv += 'Date,Time,Body Weight,Unit,Body Fat %,Muscle Mass (kg),Weight Change,BF Change (%)\n';
    const sorted = [...bwB].sort((a,b) => new Date(a.date) - new Date(b.date));
    sorted.forEach((e, i) => {
      const prev = sorted[i - 1];
      const wtChg = prev && e.weight && prev.weight ? (e.weight - prev.weight).toFixed(1) : '';
      const bfChg = prev && e.bodyFat && prev.bodyFat ? (e.bodyFat - prev.bodyFat).toFixed(1) : '';
      csv += [
        q(_fmtDateMaybe(e.date)),
        q(tm(e.date)),
        e.weight ?? '',
        q(e.unit || 'kg'),
        e.bodyFat ?? '',
        e.muscleMass ?? '',
        wtChg,
        bfChg
      ].join(',') + '\n';
    });
    csv += '\n';
  }

  const prWgt = wgt.filter(w => w && w.isPR);
  const prBw = bwW.filter(w => w && w.isPR);
  if (prWgt.length || prBw.length) {
    csv += '=== PERSONAL RECORDS ===\n';
    csv += 'Date,Muscle Group,Exercise,Type,Max Weight / Max Reps,Unit\n';
    [...prWgt].sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(w => {
      const sets = Array.isArray(w.sets) ? w.sets : [];
      const maxW = sets.length ? Math.max(...sets.map(s => Number(s.weight || 0))) : 0;
      csv += [q(_fmtDateMaybe(w.date)), q(w.muscle), q(w.exercise), 'Weighted', maxW, q(sets[0]?.unit || 'kg')].join(',') + '\n';
    });
    [...prBw].sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(w => {
      const sets = Array.isArray(w.sets) ? w.sets : [];
      const maxR = sets.length ? Math.max(...sets.map(s => Number(s.r || s.reps || 0))) : 0;
      csv += [q(_fmtDateMaybe(w.date)), q(w.muscle || ''), q(w.exercise), 'Bodyweight', maxR, 'reps'].join(',') + '\n';
    });
    csv += '\n';
  }

  if (cardio.length) {
    csv += '=== CARDIO WORKOUTS ===\n';
    csv += 'Date,Activity,Category,Duration (min),Calories,HR Zone,Condition,XP Earned\n';
    [...cardio].sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0)).forEach((c) => {
      csv += [
        q(_fmtDateMaybe(c.date)),
        q(c.activity || c.type || ''),
        q(c.category || c.cat || ''),
        c.durationMins ?? c.duration ?? c.minutes ?? '',
        c.calories ?? c.kcal ?? '',
        c.hrZone ?? '',
        q(c.temp || c.condition || ''),
        c.xpEarned ?? ''
      ].join(',') + '\n';
    });
    csv += '\n';
  }

  if (meals && typeof meals === 'object' && !Array.isArray(meals) && Object.keys(meals).length) {
    csv += '=== NUTRITION MEALS ===\n';
    csv += 'Date,Meal Name,Calories,Protein (g),Carbs (g),Fat (g),Raw JSON\n';
    Object.keys(meals).sort().forEach((dateKey) => {
      const dayMeals = Array.isArray(meals[dateKey]) ? meals[dateKey] : [];
      if (!dayMeals.length) {
        csv += [q(_fmtDateMaybe(dateKey)), q(''), '', '', '', '', q('[]')].join(',') + '\n';
        return;
      }
      dayMeals.forEach((m) => {
        csv += [
          q(_fmtDateMaybe(dateKey)),
          q(m.name || m.label || ''),
          m.kcal ?? m.calories ?? '',
          m.p ?? m.protein ?? '',
          m.c ?? m.carbs ?? '',
          m.f ?? m.fat ?? '',
          q(_csvObj(m))
        ].join(',') + '\n';
      });
    });
    csv += '\n';
  }

  _appendKVSection('MEAL LIBRARY', mealLibrary);

  if (readiness && typeof readiness === 'object' && Object.keys(readiness).length) {
    csv += '=== READINESS HISTORY ===\n';
    csv += 'Date,Score,Energy,Total Sleep,Deep Sleep,REM Sleep,HRV,RHR,Raw JSON\n';
    Object.keys(readiness).sort().forEach((dateKey) => {
      const r = readiness[dateKey] || {};
      csv += [
        q(_fmtDateMaybe(dateKey)),
        r.score ?? '',
        r.energy ?? '',
        r.totalSleep ?? '',
        r.deepSleep ?? '',
        r.remSleep ?? '',
        r.hrv ?? '',
        r.rhr ?? '',
        q(_csvObj(r))
      ].join(',') + '\n';
    });
    csv += '\n';
  }

  _appendKVSection('CHECKINS (AGGREGATE)', checkins);
  _appendKVSection('WATER (AGGREGATE)', water);
  _appendKVSection('STEPS (AGGREGATE)', steps);
  _appendKVSection('CHECKINS DAILY KEYS', checkinsDaily);
  _appendKVSection('WATER DAILY KEYS', waterDaily);
  _appendKVSection('STEPS DAILY KEYS', stepsDaily);

  if (inbodyTests.length) {
    csv += '=== INBODY TESTS ===\n';
    csv += 'Date,Weight,Body Fat %,Muscle Mass,Visceral Fat,BMR,InBody Score,Raw JSON\n';
    [...inbodyTests].sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0)).forEach((t) => {
      csv += [
        q(_fmtDateMaybe(t.date)),
        t.weight ?? '',
        t.bodyFat ?? '',
        t.muscleMass ?? '',
        t.visceralFat ?? '',
        t.bmr ?? '',
        t.inbodyScore ?? '',
        q(_csvObj(t))
      ].join(',') + '\n';
    });
    csv += '\n';
  }

  if (measurements.length) {
    csv += '=== BODY MEASUREMENTS ===\n';
    csv += 'Date,Raw JSON\n';
    [...measurements].sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0)).forEach((m) => {
      csv += [q(_fmtDateMaybe(m.date)), q(_csvObj(m))].join(',') + '\n';
    });
    csv += '\n';
  }

  if (templatesData.length) {
    csv += '=== WORKOUT TEMPLATES ===\n';
    csv += 'Template ID,Name,Muscle,Exercises,Icon,Raw JSON\n';
    templatesData.forEach((t) => {
      csv += [q(t.id || ''), q(t.name || ''), q(t.muscle || ''), q(t.exercises || ''), q(t.icon || ''), q(_csvObj(t))].join(',') + '\n';
    });
    csv += '\n';
  }

  if (bwCustomExercises.length) {
    csv += '=== BODYWEIGHT CUSTOM EXERCISES ===\n';
    csv += 'ID,Name,Muscle,Type,Raw JSON\n';
    bwCustomExercises.forEach((e) => {
      csv += [q(e.id || ''), q(e.n || e.name || ''), q(e.muscle || ''), q(e.t || e.type || ''), q(_csvObj(e))].join(',') + '\n';
    });
    csv += '\n';
  }

  if (cardioCustomTypes.length) {
    csv += '=== CARDIO CUSTOM TYPES ===\n';
    csv += 'ID,Activity,Category,Raw JSON\n';
    cardioCustomTypes.forEach((e) => {
      csv += [q(e.id || ''), q(e.act || e.activity || ''), q(e.cat || e.category || ''), q(_csvObj(e))].join(',') + '\n';
    });
    csv += '\n';
  }

  _appendKVSection('PROFILE', profile);
  _appendKVSection('SETTINGS', settingsData);
  _appendKVSection('UI PREFERENCES', uiData);
  _appendKVSection('ALL FORGE STORAGE KEYS (FULL)', forgeAll);

  download('FORGE_full_export.csv', csv, 'text/csv');
  showToast('Full export downloaded!');
}
function buildBackupPayload() {
  const _lsGet = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const _lsRaw = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const _collectForgeAllRaw = () => {
    const out = {};
    try {
      Object.keys(localStorage).forEach((key) => {
        if (!key || !/^forge_/i.test(key)) return;
        const raw = localStorage.getItem(key);
        if (raw == null) return;
        out[key] = raw;
      });
    } catch (_e) {}
    return out;
  };
  const _collectPrefixed = (prefix) => {
    const out = {};
    try {
      Object.keys(localStorage).forEach((key) => {
        if (!key || key.indexOf(prefix) !== 0) return;
        const raw = localStorage.getItem(key);
        if (raw == null) return;
        try { out[key] = JSON.parse(raw); }
        catch { out[key] = raw; }
      });
    } catch (_e) {}
    return out;
  };
  const data = {
    exportDate: new Date().toISOString(),
    version: 5,
    summary: {
      totalWeightedWorkouts: (typeof workouts !== 'undefined' ? workouts : []).length,
      totalBWWorkouts: (typeof bwWorkouts !== 'undefined' ? bwWorkouts : []).length,
      totalCardioWorkouts: (typeof cardioLog !== 'undefined' ? cardioLog : (_lsGet('forge_cardio') || [])).length,
      totalBodyCompEntries: (typeof bodyWeight !== 'undefined' ? bodyWeight : []).length,
    },
    // Workout data
    workouts:    typeof workouts   !== 'undefined' ? workouts   : (_lsGet('forge_workouts') || []),
    bwWorkouts:  typeof bwWorkouts !== 'undefined' ? bwWorkouts : (_lsGet('forge_bw_workouts') || []),
    cardio:      typeof cardioLog  !== 'undefined' ? cardioLog  : (_lsGet('forge_cardio') || []),
    bodyWeight:  typeof bodyWeight !== 'undefined' ? bodyWeight : (_lsGet('forge_bodyweight') || []),
    templates:   typeof templates  !== 'undefined' ? templates  : (_lsGet('forge_templates') || []),
    bwCustomExercises: _lsGet('forge_bw_custom_exercises') || [],
    cardioCustomTypes: _lsGet('forge_cardio_custom_types') || [],
    settings:    typeof settings   !== 'undefined' ? settings   : (_lsGet('forge_settings') || {}),
    // Nutrition
    meals:       _lsGet('forge_meals') || [],
    meal_library: _lsGet('forge_meal_library') || {},
    // Health tracking
    readiness:   _lsGet('forge_readiness') || {},
    inbodyTests: _lsGet('forge_inbody_tests') || [],
    measurements: _lsGet('forge_measurements') || [],
    checkins:    _lsGet('forge_checkins') || {},
    water:       _lsGet('forge_water') || {},
    steps:       _lsGet('forge_steps') || {},
    // Daily-key variants (newer model)
    checkinsDaily: _collectPrefixed('forge_checkin_'),
    waterDaily:    _collectPrefixed('forge_water_'),
    stepsDaily:    _collectPrefixed('forge_steps_'),
    // Profile
    profile:     _lsGet('forge_profile') || {},
    // UI / prefs
    ui: {
      theme: _lsRaw('forge_theme') || '',
      accent: _lsRaw('forge_accent') || '',
      layout: _lsGet('forge_layout') || null,
      lang: _lsRaw('forge_lang') || '',
      stepGoal: _lsRaw('forge_step_goal') || ''
    },
    // Full-fidelity raw snapshot for all forge keys
    allForgeStorageRaw: _collectForgeAllRaw()
  };
  return data;
}

function exportJSON() {
  const data = buildBackupPayload();
  download('FORGE_backup.json', JSON.stringify(data, null, 2), 'application/json');
  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تنزيل النسخة الاحتياطية!' : 'Backup downloaded!');
}

function restoreBackupPayload(data, opts) {
  const options = opts || {};
  const skipToast = !!options.skipToast;
  try {
    const _lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

    // Workout data — update global vars + localStorage
    if (data.workouts)   { workouts   = data.workouts;   _lsSet('forge_workouts', data.workouts); }
    if (data.bwWorkouts) { bwWorkouts = data.bwWorkouts; _lsSet('forge_bw_workouts', data.bwWorkouts); }
    if (data.cardio)     { cardioLog  = data.cardio;     _lsSet('forge_cardio', data.cardio); }
    if (data.bodyWeight) { bodyWeight = data.bodyWeight; _lsSet('forge_bodyweight', data.bodyWeight); }
    if (data.templates)  { templates  = data.templates;  _lsSet('forge_templates', data.templates); }
    if (data.bwCustomExercises) {
      if (typeof _bwCustomExercises !== 'undefined') _bwCustomExercises = data.bwCustomExercises;
      _lsSet('forge_bw_custom_exercises', data.bwCustomExercises);
    }
    if (data.cardioCustomTypes) {
      if (typeof _cardioCustomTypes !== 'undefined') _cardioCustomTypes = data.cardioCustomTypes;
      _lsSet('forge_cardio_custom_types', data.cardioCustomTypes);
    }
    if (data.settings)   { settings   = data.settings;   _lsSet('forge_settings', data.settings); }

    // Nutrition
    if (data.meals)       _lsSet('forge_meals', data.meals);
    if (data.meal_library) _lsSet('forge_meal_library', data.meal_library);

    // Health tracking
    if (data.readiness)   _lsSet('forge_readiness', data.readiness);
    if (data.inbodyTests) _lsSet('forge_inbody_tests', data.inbodyTests);
    if (data.measurements) _lsSet('forge_measurements', data.measurements);
    if (data.checkins)   _lsSet('forge_checkins', data.checkins);
    if (data.water)      _lsSet('forge_water', data.water);
    if (data.steps)      _lsSet('forge_steps', data.steps);
    if (data.checkinsDaily && typeof data.checkinsDaily === 'object') {
      Object.entries(data.checkinsDaily).forEach(([k, v]) => _lsSet(k, v));
    }
    if (data.waterDaily && typeof data.waterDaily === 'object') {
      Object.entries(data.waterDaily).forEach(([k, v]) => _lsSet(k, v));
    }
    if (data.stepsDaily && typeof data.stepsDaily === 'object') {
      Object.entries(data.stepsDaily).forEach(([k, v]) => _lsSet(k, v));
    }

    // Profile
    if (data.profile && Object.keys(data.profile).length) _lsSet('forge_profile', data.profile);
    if (data.ui && typeof data.ui === 'object') {
      try {
        if (data.ui.theme !== undefined && data.ui.theme !== null) localStorage.setItem('forge_theme', String(data.ui.theme));
        if (data.ui.accent !== undefined && data.ui.accent !== null) localStorage.setItem('forge_accent', String(data.ui.accent));
        if (data.ui.layout !== undefined && data.ui.layout !== null) _lsSet('forge_layout', data.ui.layout);
        if (data.ui.lang !== undefined && data.ui.lang !== null) localStorage.setItem('forge_lang', String(data.ui.lang));
        if (data.ui.stepGoal !== undefined && data.ui.stepGoal !== null) localStorage.setItem('forge_step_goal', String(data.ui.stepGoal));
      } catch (_e) {}
    }
    if (data.allForgeStorageRaw && typeof data.allForgeStorageRaw === 'object') {
      try {
        Object.entries(data.allForgeStorageRaw).forEach(([key, raw]) => {
          if (!key || !/^forge_/i.test(key)) return;
          if (raw == null) return;
          localStorage.setItem(key, String(raw));
        });
      } catch (_e) {}
    }

    save(); updateStatBar(); postSaveHooks();
    if (!skipToast) showToast(typeof t==='function' && currentLang==='ar' ? 'تم استعادة النسخة الاحتياطية!' : 'Backup restored!');
    return true;
  } catch(err) {
    if (!skipToast) showToast('Invalid backup file!');
    return false;
  }
}

function importJSON(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let data = null;
    try { data = JSON.parse(e.target.result); }
    catch (_err) { showToast('Invalid backup file!'); return; }
    restoreBackupPayload(data);
  };
  reader.readAsText(file);
}

window.buildBackupPayload = buildBackupPayload;
window.restoreBackupPayload = restoreBackupPayload;

// ??? Strong / Hevy CSV import ?????????????????????????????????
function importStrongHevy(input) {
  const file = input.files[0]; if (!file) return;
  input.value = '';
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { showToast('Empty file!', 'error'); return; }

      // Parse CSV respecting quoted fields
      const parseRow = row => {
        const out = []; let cur = '', inQ = false;
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        out.push(cur.trim()); return out;
      };

      const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g,'_'));
      const rows = lines.slice(1).map(l => parseRow(l));

      // Detect format: Hevy has 'exercise_title', Strong has 'exercise_name'
      const isHevy   = headers.includes('exercise_title');
      const isStrong = headers.includes('exercise_name');
      if (!isHevy && !isStrong) { showToast('Unrecognised CSV format', 'error'); return; }

      const col = n => headers.indexOf(n);

      // Group rows into sessions keyed by (date + workout name + exercise)
      // Then group exercises by session into workout objects
      const sessionMap = new Map(); // key = "date|workoutName|exercise" ? sets[]

      rows.forEach(r => {
        let dateRaw, workoutName, exerciseName, weightKg, reps, setType;
        if (isHevy) {
          dateRaw     = r[col('start_time')]   || '';
          workoutName = r[col('title')]         || 'Imported';
          exerciseName= r[col('exercise_title')]|| '';
          weightKg    = parseFloat(r[col('weight_kg')]) || 0;
          reps        = parseInt(r[col('reps')])        || 0;
          setType     = (r[col('set_type')]||'normal').toLowerCase();
          if (setType === 'warmup') setType = 'warmup';
          else if (setType === 'dropset') setType = 'dropset';
          else setType = 'normal';
        } else { // Strong
          dateRaw     = r[col('date')]          || '';
          workoutName = r[col('workout_name')]  || 'Imported';
          exerciseName= r[col('exercise_name')] || '';
          weightKg    = parseFloat(r[col('weight')]) || 0;
          reps        = parseInt(r[col('reps')])      || 0;
          setType     = 'normal';
        }
        if (!exerciseName || !dateRaw) return;
        const dateStr = dateRaw.replace(' ','T').split('T')[0]; // YYYY-MM-DD
        const key = `${dateStr}|${workoutName}|${exerciseName}`;
        if (!sessionMap.has(key)) sessionMap.set(key, { dateStr, workoutName, exerciseName, sets: [] });
        sessionMap.get(key).sets.push({ reps, weight: weightKg, unit: 'kg', type: setType });
      });

      // Infer muscle from EXERCISE_DB or leave as 'Other'
      const _muscleFor = name => {
        if (typeof EXERCISE_DB !== 'undefined') {
          const q = name.toLowerCase();
          const match = EXERCISE_DB.find(e => e.n.toLowerCase() === q || q.includes(e.n.toLowerCase()) || e.n.toLowerCase().includes(q));
          if (match) return match.m;
        }
        return 'Other';
      };

      // Build workout records
      const imported = [];
      sessionMap.forEach(({ dateStr, exerciseName, sets }) => {
        if (!sets.length) return;
        const workSets = sets.filter(s => s.type !== 'warmup');
        const totalVolume = workSets.reduce((a, s) => a + s.reps * s.weight, 0);
        const muscle = _muscleFor(exerciseName);
        // Check PR against existing workouts
        const prevMax = workouts.filter(w => w.exercise === exerciseName)
          .flatMap(w => w.sets.filter(s=>s.type!=='warmup').map(s=>s.weight));
        const newMax  = workSets.length ? Math.max(...workSets.map(s=>s.weight)) : 0;
        const isPR    = workSets.length > 0 && (prevMax.length === 0 || newMax > Math.max(...prevMax));
        imported.push({
          id: Date.now() + Math.random(),
          date: dateStr + 'T12:00:00.000Z',
          muscle, exercise: exerciseName, sets, notes: '', angle: null, totalVolume, isPR, effort: null
        });
      });

      if (!imported.length) { showToast('No workouts found in file', 'warn'); return; }

      // Deduplicate: skip if same exercise+date already exists
      let added = 0;
      imported.forEach(imp => {
        const impDay = imp.date.slice(0,10);
        const dup = workouts.some(w => w.exercise === imp.exercise && w.date.slice(0,10) === impDay);
        if (!dup) { workouts.push(imp); added++; }
      });

      save(); updateStatBar(); postSaveHooks();
      showToast(`Imported ${added} workout${added!==1?'s':''} (${imported.length - added} skipped as duplicates)`);
    } catch(err) {
      console.error(err);
      showToast('Failed to parse CSV', 'error');
    }
  };
  reader.readAsText(file);
}

function importAppleHealth(input) {
  const file = input.files[0]; if (!file) return;
  input.value = '';
  showToast('Parsing Apple Health export�');
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(e.target.result, 'text/xml');
      if (doc.querySelector('parsererror')) { showToast('Invalid XML � is this export.xml?', 'error'); return; }

      let bwAdded = 0, stepsAdded = 0;

      // Body mass records
      doc.querySelectorAll('Record[type="HKQuantityTypeIdentifierBodyMass"]').forEach(r => {
        const val = parseFloat(r.getAttribute('value'));
        const rawDate = r.getAttribute('startDate') || r.getAttribute('creationDate') || '';
        if (!val || !rawDate) return;
        const dateStr = rawDate.slice(0, 10);
        const unit = (r.getAttribute('unit') || 'kg').toLowerCase().includes('lb') ? 'lbs' : 'kg';
        if (!bodyWeight.some(bw => bw.date === dateStr)) {
          bodyWeight.push({ date: dateStr, weight: val, unit });
          bwAdded++;
        }
      });

      // Step count records � aggregate by day
      const stepsMap = new Map();
      doc.querySelectorAll('Record[type="HKQuantityTypeIdentifierStepCount"]').forEach(r => {
        const val = parseInt(r.getAttribute('value')) || 0;
        const rawDate = r.getAttribute('startDate') || '';
        if (!val || !rawDate) return;
        const dateStr = rawDate.slice(0, 10);
        stepsMap.set(dateStr, (stepsMap.get(dateStr) || 0) + val);
      });
      stepsMap.forEach((steps, dateStr) => {
        const key = 'forge_steps_' + dateStr;
        if (!localStorage.getItem(key)) { localStorage.setItem(key, String(steps)); stepsAdded++; }
      });

      if (bwAdded > 0 || stepsAdded > 0) {
        bodyWeight.sort((a, b) => a.date.localeCompare(b.date));
        save();
        showToast(`Apple Health: +${bwAdded} weight entries, +${stepsAdded} step days`);
      } else {
        showToast('No new data found in export', 'warn');
      }
    } catch(err) {
      console.error(err);
      showToast('Failed to parse Apple Health XML', 'error');
    }
  };
  reader.readAsText(file);
}

