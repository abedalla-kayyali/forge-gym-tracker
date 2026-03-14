function exportCSV() {
  const wgt = typeof workouts    !== 'undefined' ? workouts    : [];
  const bwW = typeof bwWorkouts  !== 'undefined' ? bwWorkouts  : [];
  const bwB = typeof bodyWeight  !== 'undefined' ? bodyWeight  : [];
  const hasData = wgt.length || bwW.length || bwB.length;
  if (!hasData) { showToast('No data to export!'); return; }

  const q  = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const dt = iso => new Date(iso).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'numeric' });
  const tm = iso => new Date(iso).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  let csv = '';

  // ?? SECTION 1: SUMMARY ??????????????????????????????????????????????????
  csv += '=== FORGE GYM � FULL EXPORT ===\n';
  csv += `Exported:,${q(new Date().toLocaleString('en-GB'))}\n`;
  csv += `Weighted Workouts:,${wgt.length}\n`;
  csv += `Bodyweight Workouts:,${bwW.length}\n`;
  csv += `Body Comp Entries:,${bwB.length}\n`;

  // PR count
  const prCount = wgt.filter(w => w.isPR).length + bwW.filter(w => w.isPR).length;
  csv += `Personal Records:,${prCount}\n`;

  // Total volume
  const totalVol = wgt.reduce((a,w) => a + (w.totalVolume||0), 0);
  csv += `Total Volume Lifted:,${Math.round(totalVol)} kg\n`;

  // Date range
  const allDates = [...wgt, ...bwW].map(w => w.date).filter(Boolean).sort();
  if (allDates.length) {
    csv += `First Session:,${q(dt(allDates[0]))}\n`;
    csv += `Latest Session:,${q(dt(allDates[allDates.length-1]))}\n`;
  }
  csv += '\n';

  // ?? SECTION 2: WEIGHTED WORKOUTS (grouped by muscle ? exercise) ?????????
  if (wgt.length) {
    csv += '=== WEIGHTED WORKOUTS ===\n';
    csv += 'Date,Time,Muscle Group,Exercise Type,Exercise,Set #,Reps,Weight,Unit,Set Volume (kg),Session Volume (kg),PR?,Notes\n';

    // Group by muscle
    const byMuscle = {};
    wgt.forEach(w => { (byMuscle[w.muscle] = byMuscle[w.muscle] || []).push(w); });

    const MUSCLE_ORDER = ['Chest','Back','Shoulders','Biceps','Triceps','Forearms','Legs','Glutes','Core','Calves'];
    const muscleOrder = [...MUSCLE_ORDER, ...Object.keys(byMuscle).filter(m => !MUSCLE_ORDER.includes(m))];

    muscleOrder.forEach(muscle => {
      if (!byMuscle[muscle]) return;
      // Sort sessions by date
      const sessions = [...byMuscle[muscle]].sort((a,b) => new Date(a.date)-new Date(b.date));
      sessions.forEach(w => {
        const sessionVol = Math.round(w.totalVolume || w.sets.reduce((a,s)=>a+(s.reps*s.weight),0));
        // Guess exercise type from exercise name
        const exLower = w.exercise.toLowerCase();
        const exType = exLower.includes('press') ? 'Press' :
                       exLower.includes('curl')  ? 'Curl'  :
                       exLower.includes('row')   ? 'Row'   :
                       exLower.includes('squat') ? 'Squat' :
                       exLower.includes('deadlift') ? 'Deadlift' :
                       exLower.includes('fly') || exLower.includes('flye') ? 'Fly' :
                       exLower.includes('pull') ? 'Pull'  :
                       exLower.includes('push') ? 'Push'  :
                       exLower.includes('raise') ? 'Raise' :
                       exLower.includes('extension') ? 'Extension' :
                       exLower.includes('kickback') ? 'Kickback' :
                       exLower.includes('dip')  ? 'Dip'   : 'Other';
        w.sets.forEach((s, i) => {
          const setVol = Math.round(s.reps * s.weight);
          csv += [
            q(dt(w.date)),
            q(tm(w.date)),
            q(muscle),
            q(exType),
            q(w.exercise),
            i + 1,
            s.reps,
            s.weight,
            q(s.unit || 'kg'),
            setVol,
            i === 0 ? sessionVol : '',   // only show session vol on first set row
            i === 0 && w.isPR ? 'PR' : '',
            i === 0 ? q(w.notes || '') : ''
          ].join(',') + '\n';
        });
      });
    });
    csv += '\n';

    // ?? PER-EXERCISE PROGRESS HISTORY ??????????????????????????????????
    csv += '=== EXERCISE PROGRESS HISTORY ===\n';
    csv += 'Exercise,Muscle Group,Date,Max Weight (kg),Total Reps,Sets,Session Volume (kg),PR?\n';
    const byExercise = {};
    wgt.forEach(w => {
      (byExercise[w.exercise] = byExercise[w.exercise] || []).push(w);
    });
    Object.keys(byExercise).sort().forEach(ex => {
      const sessions = [...byExercise[ex]].sort((a,b) => new Date(a.date)-new Date(b.date));
      sessions.forEach(w => {
        const maxW   = Math.max(...w.sets.map(s => s.weight));
        const totReps = w.sets.reduce((a,s) => a + s.reps, 0);
        const vol    = Math.round(w.totalVolume || w.sets.reduce((a,s)=>a+(s.reps*s.weight),0));
        csv += [q(ex), q(w.muscle), q(dt(w.date)), maxW, totReps, w.sets.length, vol, w.isPR ? 'PR' : ''].join(',') + '\n';
      });
    });
    csv += '\n';
  }

  // ?? SECTION 3: BODYWEIGHT WORKOUTS ??????????????????????????????????????
  if (bwW.length) {
    csv += '=== BODYWEIGHT WORKOUTS ===\n';
    csv += 'Date,Time,Muscle Group,Exercise,Set #,Reps,Effort,Total Reps,PR?,Notes\n';
    const byMuscle = {};
    bwW.forEach(w => { (byMuscle[w.muscle||'Other'] = byMuscle[w.muscle||'Other'] || []).push(w); });
    Object.keys(byMuscle).sort().forEach(muscle => {
      [...byMuscle[muscle]].sort((a,b) => new Date(a.date)-new Date(b.date)).forEach(w => {
        const totReps = w.totalReps || w.sets.reduce((a,s)=>a+(s.r||s.reps||0),0);
        (w.sets||[]).forEach((s,i) => {
          csv += [
            q(dt(w.date)),
            q(tm(w.date)),
            q(muscle),
            q(w.exercise),
            i + 1,
            s.r || s.reps || 0,
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

  // ?? SECTION 4: BODY COMPOSITION HISTORY ?????????????????????????????????
  if (bwB.length) {
    csv += '=== BODY COMPOSITION HISTORY ===\n';
    csv += 'Date,Time,Body Weight,Unit,Body Fat %,Muscle Mass (kg),Weight Change,BF Change (%)\n';
    const sorted = [...bwB].sort((a,b) => new Date(a.date)-new Date(b.date));
    sorted.forEach((e, i) => {
      const prev = sorted[i-1];
      const wtChg = prev && e.weight && prev.weight ? (e.weight - prev.weight).toFixed(1) : '';
      const bfChg = prev && e.bodyFat && prev.bodyFat ? (e.bodyFat - prev.bodyFat).toFixed(1) : '';
      csv += [
        q(dt(e.date)),
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

  // ?? SECTION 5: PERSONAL RECORDS ?????????????????????????????????????????
  const prWgt = wgt.filter(w => w.isPR);
  const prBw  = bwW.filter(w => w.isPR);
  if (prWgt.length || prBw.length) {
    csv += '=== PERSONAL RECORDS ===\n';
    csv += 'Date,Muscle Group,Exercise,Type,Max Weight / Max Reps,Unit\n';
    [...prWgt].sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(w => {
      const maxW = Math.max(...w.sets.map(s=>s.weight));
      csv += [q(dt(w.date)), q(w.muscle), q(w.exercise), 'Weighted', maxW, q(w.sets[0]?.unit||'kg')].join(',') + '\n';
    });
    [...prBw].sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(w => {
      const maxR = Math.max(...(w.sets||[]).map(s=>s.r||s.reps||0));
      csv += [q(dt(w.date)), q(w.muscle||''), q(w.exercise), 'Bodyweight', maxR, 'reps'].join(',') + '\n';
    });
  }

  download('FORGE_full_export.csv', csv, 'text/csv');
  showToast('Full export downloaded!');
}

function exportJSON() {
  const _lsGet = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const data = {
    exportDate: new Date().toISOString(),
    version: 2,
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
    settings:    typeof settings   !== 'undefined' ? settings   : (_lsGet('forge_settings') || {}),
    // Nutrition
    meals:       _lsGet('forge_meals') || [],
    meal_library: _lsGet('forge_meal_library') || {},
    // Health tracking
    checkins:    _lsGet('forge_checkins') || {},
    water:       _lsGet('forge_water') || {},
    steps:       _lsGet('forge_steps') || {},
    // Profile
    profile:     _lsGet('forge_profile') || {}
  };
  download('FORGE_backup.json', JSON.stringify(data, null, 2), 'application/json');
  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تنزيل النسخة الاحتياطية!' : 'Backup downloaded!');
}

function importJSON(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const _lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

      // Workout data — update global vars + localStorage
      if (data.workouts)   { workouts   = data.workouts;   _lsSet('forge_workouts', data.workouts); }
      if (data.bwWorkouts) { bwWorkouts = data.bwWorkouts; _lsSet('forge_bw_workouts', data.bwWorkouts); }
      if (data.cardio)     { cardioLog  = data.cardio;     _lsSet('forge_cardio', data.cardio); }
      if (data.bodyWeight) { bodyWeight = data.bodyWeight; _lsSet('forge_bodyweight', data.bodyWeight); }
      if (data.templates)  { templates  = data.templates;  _lsSet('forge_templates', data.templates); }
      if (data.settings)   { settings   = data.settings;   _lsSet('forge_settings', data.settings); }

      // Nutrition
      if (data.meals)       _lsSet('forge_meals', data.meals);
      if (data.meal_library) _lsSet('forge_meal_library', data.meal_library);

      // Health tracking
      if (data.checkins)   _lsSet('forge_checkins', data.checkins);
      if (data.water)      _lsSet('forge_water', data.water);
      if (data.steps)      _lsSet('forge_steps', data.steps);

      // Profile
      if (data.profile && Object.keys(data.profile).length) _lsSet('forge_profile', data.profile);

      save(); updateStatBar(); postSaveHooks();
      showToast(typeof t==='function' && currentLang==='ar' ? 'تم استعادة النسخة الاحتياطية!' : 'Backup restored!');
    } catch(err) { showToast('Invalid backup file!'); }
  };
  reader.readAsText(file);
}

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
