// FORGE RAG Search — client-side integration
// Converts localStorage data to text, sends to forge-ingest Edge Function,
// queries forge-search Edge Function, renders results in modal.

(function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────

  const INGEST_FN  = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-ingest';
  const SEARCH_FN  = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search';
  const INGEST_KEY     = 'forge_rag_last_ingest';   // localStorage: last full ingest timestamp
  const INGEST_VER_KEY = 'forge_rag_version';       // localStorage: RAG schema version
  const RAG_VERSION    = '2';                        // bump when ingest schema changes (e.g. form_cues added)
  const BATCH_SIZE     = 5;                          // items per ingest batch (keep small — edge fn AI inference is slow)

  const MUSCLE_LABELS = {
    chest:'Chest', back:'Back', shoulders:'Shoulders', biceps:'Biceps',
    triceps:'Triceps', legs:'Legs', glutes:'Glutes', abs:'Abs',
    calves:'Calves', forearms:'Forearms', traps:'Traps', lats:'Lats',
    hamstrings:'Hamstrings', quads:'Quads',
  };

  // ─── Text conversion (mirrors ingest.py logic) ───────────────────────────

  function fmtDate(isoStr) {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return isoStr; }
  }

  function fmtSets(sets) {
    if (!Array.isArray(sets)) return 'no set data';
    return sets.map((s, i) => {
      if (!s || typeof s !== 'object') return null;
      const label = `Set ${i + 1}${s.type === 'warmup' ? ' (warmup)' : s.type === 'drop' ? ' (drop)' : ''}`;
      return `${label}: ${s.reps} reps x ${s.weight}${s.unit || 'kg'}${s.rpe ? ` @ RPE ${s.rpe}` : ''}`;
    }).filter(Boolean).join('; ') || 'no set data';
  }

  function workoutToDoc(w) {
    const date = fmtDate(w.date);
    const muscle = MUSCLE_LABELS[w.muscle?.toLowerCase()] || w.muscle || '';
    const parts = [`On ${date}, logged ${w.exercise || 'exercise'}`];
    if (muscle) parts[0] += ` (${muscle}${w.angle ? ', ' + w.angle : ''})`;
    parts.push(fmtSets(w.sets));
    if (w.totalVolume) {
      const unit = w.sets?.[0]?.unit || 'kg';
      parts.push(`Total volume: ${Math.round(w.totalVolume).toLocaleString()}${unit}`);
    }
    if (w.isPR) parts.push('Personal record (PR) achieved!');
    if (w.effort) parts.push(`Effort: ${w.effort}`);
    if (w.notes) parts.push(`Notes: ${w.notes}`);
    return parts.join('. ') + '.';
  }

  function bodyweightToDoc(e) {
    const date = fmtDate(e.date);
    const parts = [`On ${date}`];
    if (e.weight) parts.push(`body weight: ${e.weight}${e.unit || 'kg'}`);
    if (e.bodyFat) parts.push(`body fat: ${e.bodyFat}%`);
    if (e.muscleMass) parts.push(`muscle mass: ${e.muscleMass}kg`);
    return parts.join(', ') + '.';
  }

  function mealToDoc(meal, dateKey) {
    const date = fmtDate(dateKey + 'T00:00:00');
    const name = meal.name || meal.label || 'meal';
    const parts = [`On ${date}, logged meal: ${name}`];
    const nutrition = [];
    if (meal.kcal || meal.calories) nutrition.push(`${meal.kcal || meal.calories} calories`);
    if (meal.p || meal.protein)     nutrition.push(`${meal.p || meal.protein}g protein`);
    if (meal.c || meal.carbs)       nutrition.push(`${meal.c || meal.carbs}g carbs`);
    if (meal.f || meal.fat)         nutrition.push(`${meal.f || meal.fat}g fat`);
    if (nutrition.length) parts.push(nutrition.join(', '));
    return parts.join('. ') + '.';
  }

  function cardioToDoc(c) {
    const date = fmtDate(c.date);
    const activity = c.type || c.activity || c.name || 'cardio';
    const parts = [`On ${date}, cardio session: ${activity}`];
    if (c.duration || c.minutes) parts.push(`${c.duration || c.minutes} minutes`);
    if (c.distance) parts.push(`${c.distance}${c.distanceUnit || 'km'}`);
    if (c.calories || c.kcal) parts.push(`${c.calories || c.kcal} calories burned`);
    if (c.notes) parts.push(`Notes: ${c.notes}`);
    return parts.join('. ') + '.';
  }

  function bwWorkoutToDoc(w) {
    const date = fmtDate(w.date);
    const muscle = MUSCLE_LABELS[w.muscle?.toLowerCase()] || w.muscle || '';
    const parts = [`On ${date}, bodyweight exercise: ${w.exercise || w.name || 'exercise'}`];
    if (muscle) parts[0] += ` (${muscle})`;
    if (Array.isArray(w.sets) && w.sets.length) {
      const setStrs = w.sets.map((s, i) => {
        if (typeof s === 'object') return `Set ${i+1}: ${s.reps} reps`;
        return `Set ${i+1}: ${s} reps`;
      });
      parts.push(setStrs.join('; '));
    }
    if (w.notes) parts.push(`Notes: ${w.notes}`);
    return parts.join('. ') + '.';
  }

  // ─── User profile context (injected into every Claude call) ─────────────

  function buildUserContext() {
    const lines = [];
    try {
      // Profile & Goals
      const p = JSON.parse(localStorage.getItem('forge_profile') || '{}');
      if (p.name)   lines.push(`Name: ${p.name}`);
      if (p.gender) lines.push(`Gender: ${p.gender}`);
      if (p.age || p.dob) lines.push(`Age: ${p.age || ''}`);
      if (p.height) lines.push(`Height: ${p.height}${p.heightUnit || 'cm'}`);
      if (p.goal)   lines.push(`Primary goal: ${p.goal}`);
      if (p.targetWeight)     lines.push(`Target weight: ${p.targetWeight}${p.targetWeightUnit || 'kg'}`);
      if (p.targetBodyFat)    lines.push(`Target body fat: ${p.targetBodyFat}%`);
      if (p.targetMuscleMass) lines.push(`Target muscle mass: ${p.targetMuscleMass}kg`);
      if (p.targetMuscle)     lines.push(`Target muscle focus: ${p.targetMuscle}`);
      if (p.activityLevel)    lines.push(`Activity level: ${p.activityLevel}`);
      if (p.inbodyBmr)        lines.push(`BMR (InBody): ${p.inbodyBmr} kcal`);
    } catch {}

    try {
      // Latest bodyweight
      const bw = JSON.parse(localStorage.getItem('forge_bodyweight') || '[]');
      const latest = Array.isArray(bw) ? bw[bw.length - 1] : null;
      if (latest?.weight) lines.push(`Current weight: ${latest.weight}${latest.unit || 'kg'} (${latest.date?.slice(0,10) || 'recent'})`);
      if (latest?.bodyFat)    lines.push(`Current body fat: ${latest.bodyFat}%`);
      if (latest?.muscleMass) lines.push(`Current muscle mass: ${latest.muscleMass}kg`);
    } catch {}

    try {
      // Latest InBody test
      const tests = JSON.parse(localStorage.getItem('forge_inbody_tests') || '[]');
      const ib = Array.isArray(tests) ? tests[tests.length - 1] : null;
      if (ib) {
        const ibParts = [`InBody test (${ib.date?.slice(0,10) || 'recent'}):`];
        if (ib.weight)      ibParts.push(`weight ${ib.weight}kg`);
        if (ib.muscleMass)  ibParts.push(`muscle ${ib.muscleMass}kg`);
        if (ib.bodyFat)     ibParts.push(`fat ${ib.bodyFat}%`);
        if (ib.visceralFat) ibParts.push(`visceral fat level ${ib.visceralFat}`);
        if (ib.bmr)         ibParts.push(`BMR ${ib.bmr}kcal`);
        if (ib.inbodyScore) ibParts.push(`InBody score ${ib.inbodyScore}`);
        lines.push(ibParts.join(' '));
      }
    } catch {}

    try {
      // Latest body measurements
      const meas = JSON.parse(localStorage.getItem('forge_measurements') || '[]');
      const latest = Array.isArray(meas) ? meas[meas.length - 1] : null;
      if (latest) {
        const parts = [`Body measurements (${latest.date?.slice(0,10) || 'recent'}):`];
        const keys = ['waist','hips','chest','shoulders','leftArm','rightArm','neck','leftThigh','rightThigh','calves'];
        keys.forEach(k => { if (latest[k]) parts.push(`${k} ${latest[k]}cm`); });
        if (parts.length > 1) lines.push(parts.join(', '));
      }
    } catch {}

    try {
      // Mesocycle / training phase
      const meso = JSON.parse(localStorage.getItem('forge_mesocycle') || 'null');
      if (meso?.name) {
        const mesoParts = [`Current training phase: ${meso.name}`];
        if (meso.goal)         mesoParts.push(`goal: ${meso.goal}`);
        if (meso.currentWeek && meso.durationWeeks) mesoParts.push(`week ${meso.currentWeek}/${meso.durationWeeks}`);
        if (meso.startDate)    mesoParts.push(`started ${meso.startDate?.slice(0,10)}`);
        lines.push(mesoParts.join(', '));
      }
    } catch {}

    try {
      // Weekly training split
      const split = JSON.parse(localStorage.getItem('forge_split') || '{}');
      if (split && typeof split === 'object') {
        const days = ['mon','tue','wed','thu','fri','sat','sun'];
        const splitParts = days.map(d => split[d] ? `${d}: ${Array.isArray(split[d]) ? split[d].join('+') : split[d]}` : null).filter(Boolean);
        if (splitParts.length) lines.push(`Weekly split: ${splitParts.join(' | ')}`);
      }
    } catch {}

    try {
      // Workout stats summary
      const workouts = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      if (Array.isArray(workouts) && workouts.length) {
        const now = Date.now();
        const thisWeek = workouts.filter(w => w.date && (now - new Date(w.date).getTime()) < 7*86400000);
        const thisMonth = workouts.filter(w => w.date && (now - new Date(w.date).getTime()) < 30*86400000);
        const prs = workouts.filter(w => w.isPR);
        lines.push(`Total workouts logged: ${workouts.length}`);
        lines.push(`Workouts this week: ${thisWeek.length}, this month: ${thisMonth.length}`);
        if (prs.length) lines.push(`Total PRs achieved: ${prs.length}`);
        // Most trained muscles this month
        const muscleCounts = {};
        thisMonth.forEach(w => { if (w.muscle) muscleCounts[w.muscle] = (muscleCounts[w.muscle] || 0) + 1; });
        const topMuscles = Object.entries(muscleCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([m,c])=>`${m}(${c}x)`).join(', ');
        if (topMuscles) lines.push(`Most trained this month: ${topMuscles}`);
      }
    } catch {}

    try {
      // Nutrition summary (last 7 days)
      const meals = JSON.parse(localStorage.getItem('forge_meals') || '{}');
      if (meals && typeof meals === 'object') {
        const now = new Date();
        let totalKcal = 0, totalProtein = 0, days = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0,10);
          const dayMeals = meals[key];
          if (Array.isArray(dayMeals) && dayMeals.length) {
            dayMeals.forEach(m => {
              totalKcal    += +(m.kcal || m.calories || 0);
              totalProtein += +(m.p || m.protein || 0);
            });
            days++;
          }
        }
        if (days > 0) {
          lines.push(`Avg daily calories (last ${days} days): ${Math.round(totalKcal/days)} kcal`);
          lines.push(`Avg daily protein (last ${days} days): ${Math.round(totalProtein/days)}g`);
        }
      }
    } catch {}

    try {
      // Achievements
      const ach = JSON.parse(localStorage.getItem('forge_achievements') || '[]');
      if (Array.isArray(ach) && ach.length) lines.push(`Achievements unlocked: ${ach.length}`);
    } catch {}

    try {
      // Today's nutrition (actual intake today)
      const meals = JSON.parse(localStorage.getItem('forge_meals') || '{}');
      const todayKey = new Date().toISOString().slice(0,10);
      const todayMeals = meals[todayKey];
      if (Array.isArray(todayMeals) && todayMeals.length) {
        let kcal = 0, protein = 0;
        todayMeals.forEach(m => { kcal += +(m.kcal || m.calories || 0); protein += +(m.p || m.protein || 0); });
        lines.push(`Today's nutrition: ${Math.round(kcal)} kcal, ${Math.round(protein)}g protein`);
      }
    } catch {}

    try {
      // Daily readiness score
      const todayKey = new Date().toISOString().slice(0,10);
      const rdy = JSON.parse(localStorage.getItem('forge_readiness') || '{}');
      const rdyToday = rdy[todayKey];
      if (rdyToday) {
        const parts = [];
        if (rdyToday.score != null) parts.push(`readiness score: ${rdyToday.score}/100`);
        if (rdyToday.totalSleep != null) parts.push(`sleep: ${rdyToday.totalSleep}h`);
        if (rdyToday.hrv != null) parts.push(`HRV: ${rdyToday.hrv}ms`);
        if (rdyToday.rhr != null) parts.push(`resting HR: ${rdyToday.rhr}bpm`);
        if (parts.length) lines.push(`Today's readiness: ${parts.join(', ')}`);
      }
    } catch {}

    try {
      // Body weight trend (last 4 entries)
      const bw = JSON.parse(localStorage.getItem('forge_bodyweight') || '[]');
      if (Array.isArray(bw) && bw.length >= 2) {
        const recent = bw.slice(-4);
        const first = recent[0].weight, last = recent[recent.length-1].weight;
        if (first && last) {
          const diff = +(last - first).toFixed(1);
          const trend = diff > 0.3 ? `gaining (${diff > 0 ? '+' : ''}${diff}kg)` : diff < -0.3 ? `losing (${diff}kg)` : 'stable';
          lines.push(`Weight trend (last ${recent.length} logs): ${trend}, current ${last}${bw[bw.length-1].unit||'kg'}`);
        }
      }
    } catch {}

    try {
      // Today's planned training from weekly split + muscle recovery
      const split = JSON.parse(localStorage.getItem('forge_split') || '{}');
      const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
      const todayKey = dayNames[new Date().getDay()];
      const todayPlan = split[todayKey];
      if (todayPlan) {
        const muscles = Array.isArray(todayPlan) ? todayPlan.join(' + ') : todayPlan;
        lines.push(`Today's planned training (${todayKey}): ${muscles}`);
      } else if (Object.keys(split).length) {
        lines.push(`Today (${todayKey}): rest day per split`);
      }
      const workoutsForRecovery = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      const muscleDatesR = {};
      workoutsForRecovery.forEach(w => {
        if (w.muscle && w.date) {
          const t = new Date(w.date).getTime();
          if (!muscleDatesR[w.muscle] || t > muscleDatesR[w.muscle]) muscleDatesR[w.muscle] = t;
        }
      });
      const recoveryStatus = Object.entries(muscleDatesR)
        .map(([m, t]) => {
          const d = Math.floor((Date.now() - t) / 86400000);
          return `${m}: ${d === 0 ? 'trained today' : d === 1 ? '1 day rest' : `${d} days rest`}`;
        })
        .slice(0, 10).join(', ');
      if (recoveryStatus) lines.push(`Muscle recovery status: ${recoveryStatus}`);
    } catch {}

    return lines.length ? lines.join('\n') : '';
  }

  // ─── Build all ingest items from localStorage ─────────────────────────────

  function buildAllItems() {
    const items = [];

    // Workouts
    try {
      const workouts = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      (Array.isArray(workouts) ? workouts : []).forEach(w => {
        if (!w?.id) return;
        items.push({
          id: `workout_${w.id}`,
          type: 'workout',
          date: w.date ? w.date.slice(0, 10) : '',
          content: workoutToDoc(w),
          metadata: { muscle: w.muscle || '', exercise: w.exercise || '', is_pr: String(!!w.isPR), volume: w.totalVolume || 0 },
        });
      });
    } catch {}

    // Bodyweight
    try {
      const bw = JSON.parse(localStorage.getItem('forge_bodyweight') || '[]');
      (Array.isArray(bw) ? bw : []).forEach((e, i) => {
        if (!e?.weight && !e?.bodyFat && !e?.muscleMass) return;
        const dateKey = e.date ? e.date.slice(0, 10) : `idx${i}`;
        items.push({
          id: `bw_${dateKey.replace(/-/g, '')}_${i}`,
          type: 'bodyweight',
          date: dateKey,
          content: bodyweightToDoc(e),
          metadata: { weight: e.weight || 0, body_fat: e.bodyFat || 0 },
        });
      });
    } catch {}

    // Meals
    try {
      const meals = JSON.parse(localStorage.getItem('forge_meals') || '{}');
      if (meals && typeof meals === 'object') {
        Object.entries(meals).forEach(([dateKey, dayMeals]) => {
          if (!Array.isArray(dayMeals)) return;
          dayMeals.forEach((meal, i) => {
            if (!meal || typeof meal !== 'object') return;
            items.push({
              id: `meal_${dateKey.replace(/-/g, '')}_${i}`,
              type: 'meal',
              date: dateKey,
              content: mealToDoc(meal, dateKey),
              metadata: { meal_name: meal.name || '', kcal: meal.kcal || 0, protein: meal.p || meal.protein || 0 },
            });
          });
        });
      }
    } catch {}

    // Cardio
    try {
      const cardio = JSON.parse(localStorage.getItem('forge_cardio') || '[]');
      (Array.isArray(cardio) ? cardio : []).forEach((c, i) => {
        if (!c) return;
        const dateKey = c.date ? c.date.slice(0, 10) : `idx${i}`;
        items.push({
          id: `cardio_${dateKey.replace(/-/g, '')}_${i}`,
          type: 'cardio',
          date: dateKey,
          content: cardioToDoc(c),
          metadata: { activity: c.type || '', duration: c.duration || 0 },
        });
      });
    } catch {}

    // Bodyweight workouts
    try {
      const bwwk = JSON.parse(localStorage.getItem('forge_bw_workouts') || '[]');
      (Array.isArray(bwwk) ? bwwk : []).forEach((w, i) => {
        if (!w) return;
        const dateKey = w.date ? w.date.slice(0, 10) : `idx${i}`;
        items.push({
          id: `bwwk_${dateKey.replace(/-/g, '')}_${i}`,
          type: 'bw_workout',
          date: dateKey,
          content: bwWorkoutToDoc(w),
          metadata: { exercise: w.exercise || '', muscle: w.muscle || '' },
        });
      });
    } catch {}

    // InBody tests
    try {
      const tests = JSON.parse(localStorage.getItem('forge_inbody_tests') || '[]');
      (Array.isArray(tests) ? tests : []).forEach((t, i) => {
        if (!t) return;
        const dateKey = t.date ? t.date.slice(0, 10) : `idx${i}`;
        const parts = [`InBody test on ${fmtDate(t.date)}`];
        if (t.weight)       parts.push(`weight: ${t.weight}kg`);
        if (t.muscleMass)   parts.push(`muscle mass: ${t.muscleMass}kg`);
        if (t.bodyFat)      parts.push(`body fat: ${t.bodyFat}%`);
        if (t.visceralFat)  parts.push(`visceral fat level: ${t.visceralFat}`);
        if (t.bmr)          parts.push(`BMR: ${t.bmr} kcal`);
        if (t.inbodyScore)  parts.push(`InBody score: ${t.inbodyScore}`);
        items.push({
          id: `inbody_${dateKey.replace(/-/g, '')}_${i}`,
          type: 'inbody',
          date: dateKey,
          content: parts.join(', ') + '.',
          metadata: { weight: t.weight || 0, body_fat: t.bodyFat || 0, muscle_mass: t.muscleMass || 0 },
        });
      });
    } catch {}

    // Body measurements
    try {
      const meas = JSON.parse(localStorage.getItem('forge_measurements') || '[]');
      (Array.isArray(meas) ? meas : []).forEach((m, i) => {
        if (!m) return;
        const dateKey = m.date ? m.date.slice(0, 10) : `idx${i}`;
        const keys = ['waist','hips','chest','shoulders','leftArm','rightArm','neck','leftThigh','rightThigh','calves'];
        const vals = keys.filter(k => m[k]).map(k => `${k}: ${m[k]}cm`);
        if (!vals.length) return;
        items.push({
          id: `meas_${dateKey.replace(/-/g, '')}_${i}`,
          type: 'measurement',
          date: dateKey,
          content: `Body measurements on ${fmtDate(m.date)}: ${vals.join(', ')}.`,
          metadata: { waist: m.waist || 0, chest: m.chest || 0 },
        });
      });
    } catch {}

    // Form cues — ingest EXERCISE_DB tips into vector DB
    try {
      const exDB = (typeof EXERCISE_DB !== 'undefined' ? EXERCISE_DB : []);
      exDB.forEach(ex => {
        if (!ex?.n || !ex?.t) return;
        items.push({
          id: `form_${ex.n.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          type: 'form_cue',
          date: '2026-01-01',
          content: `${ex.n} (${ex.m || 'general'}) form tip: ${ex.t}`,
          metadata: {
            exercise: ex.n,
            muscle: ex.m || '',
            equipment: ex.e || '',
            media_key: ex.mediaKey || ''
          }
        });
      });
    } catch {}

    return items;
  }

  // ─── API helpers ─────────────────────────────────────────────────────────

  async function getAuthHeader() {
    if (!window._sb) return null;
    const { data: { session } } = await window._sb.auth.getSession();
    if (!session?.access_token) return null;
    return `Bearer ${session.access_token}`;
  }

  async function ingestBatch(items, authHeader) {
    const res = await fetch(INGEST_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader,
                 'apikey': window.FORGE_CONFIG?.SUPABASE_ANON },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`ingest ${res.status}`);
    return res.json();
  }

  async function searchQuery(query, typeFilter, onToken, onResults, history = []) {
    const authHeader = await getAuthHeader();
    if (!authHeader) throw new Error('Not signed in');
    const res = await fetch(SEARCH_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader,
                 'apikey': window.FORGE_CONFIG?.SUPABASE_ANON },
      body: JSON.stringify({
        query,
        n_results: 8,
        type_filter: typeFilter || null,
        history,
        client_date: new Date().toISOString(),
        client_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_context: buildUserContext(),
      }),
    });
    if (!res.ok) throw new Error(`search ${res.status}`);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let eventType = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (line.startsWith('event:')) { eventType = line.slice(6).trim(); continue; }
        if (line.startsWith('data:')) {
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (eventType === 'meta') onResults && onResults(payload.results);
            else if (eventType === 'token') onToken && onToken(payload.token);
          } catch { /* skip */ }
        }
        if (line === '') eventType = '';
      }
    }
  }

  // ─── Full bulk ingest ─────────────────────────────────────────────────────

  async function runFullIngest(onProgress) {
    const authHeader = await getAuthHeader();
    if (!authHeader) throw new Error('Not signed in');
    const items = buildAllItems();
    if (items.length === 0) return { total: 0, indexed: 0 };
    let indexed = 0;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const result = await ingestBatch(batch, authHeader);
      indexed += result.indexed || 0;
      onProgress && onProgress(Math.min(i + BATCH_SIZE, items.length), items.length);
    }
    localStorage.setItem(INGEST_KEY, Date.now().toString());
    localStorage.setItem(INGEST_VER_KEY, RAG_VERSION);
    return { total: items.length, indexed };
  }

  // ─── Auto-ingest: called after save() — picks up latest of ALL data types ──

  window._ragAutoIngest = async function () {
    if (!window._sb || !window.FORGE_CONFIG?.SUPABASE_URL) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const items = [];

      // Latest weighted workout
      const workouts = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      const latestW = Array.isArray(workouts) ? workouts[workouts.length - 1] : null;
      if (latestW?.id) items.push({
        id: `workout_${latestW.id}`,
        type: 'workout',
        date: latestW.date ? latestW.date.slice(0, 10) : '',
        content: workoutToDoc(latestW),
        metadata: { muscle: latestW.muscle || '', exercise: latestW.exercise || '',
                    is_pr: String(!!latestW.isPR), volume: latestW.totalVolume || 0 },
      });

      // Latest bodyweight entry
      const bw = JSON.parse(localStorage.getItem('forge_bodyweight') || '[]');
      const latestBW = Array.isArray(bw) ? bw[bw.length - 1] : null;
      if (latestBW?.date) items.push({
        id: `bw_${latestBW.date.slice(0,10).replace(/-/g,'')}`,
        type: 'bodyweight',
        date: latestBW.date.slice(0, 10),
        content: bodyweightToDoc(latestBW),
        metadata: { weight: latestBW.weight || 0, body_fat: latestBW.bodyFat || 0 },
      });

      // Latest cardio entry
      const cardio = JSON.parse(localStorage.getItem('forge_cardio') || '[]');
      const latestC = Array.isArray(cardio) ? cardio[cardio.length - 1] : null;
      if (latestC) {
        const dateKey = latestC.date ? latestC.date.slice(0, 10) : 'unknown';
        items.push({
          id: `cardio_${dateKey.replace(/-/g,'')}_last`,
          type: 'cardio',
          date: dateKey,
          content: cardioToDoc(latestC),
          metadata: { activity: latestC.type || '', duration: latestC.duration || 0 },
        });
      }

      // Latest meals for today
      const meals = JSON.parse(localStorage.getItem('forge_meals') || '{}');
      const today = new Date().toISOString().slice(0, 10);
      const todayMeals = Array.isArray(meals[today]) ? meals[today] : [];
      todayMeals.forEach((meal, i) => {
        if (!meal) return;
        items.push({
          id: `meal_${today.replace(/-/g,'')}_${i}`,
          type: 'meal',
          date: today,
          content: mealToDoc(meal, today),
          metadata: { meal_name: meal.name || '', kcal: meal.kcal || 0, protein: meal.p || meal.protein || 0 },
        });
      });

      // Latest bw workout
      const bwwk = JSON.parse(localStorage.getItem('forge_bw_workouts') || '[]');
      const latestBWW = Array.isArray(bwwk) ? bwwk[bwwk.length - 1] : null;
      if (latestBWW) {
        const dateKey = latestBWW.date ? latestBWW.date.slice(0, 10) : 'unknown';
        items.push({
          id: `bwwk_${dateKey.replace(/-/g,'')}_last`,
          type: 'bw_workout',
          date: dateKey,
          content: bwWorkoutToDoc(latestBWW),
          metadata: { exercise: latestBWW.exercise || '', muscle: latestBWW.muscle || '' },
        });
      }

      if (items.length === 0) return;
      await ingestBatch(items, authHeader);
      console.debug('[FORGE RAG] auto-ingested', items.length, 'items');
    } catch (e) {
      console.debug('[FORGE RAG] auto-ingest skipped:', e.message);
    }
  };

  // ─── Modal UI ─────────────────────────────────────────────────────────────

  let activeFilter = '';
  let conversationHistory = [];

  // ─── Page context detection ───────────────────────────────────────────────

  const PAGE_CONTEXT = {
    log: {
      label: 'Workout Log',
      placeholder: 'e.g. what muscle should I train today?',
      suggestions: [
        "What muscle haven't I hit in a while?",
        'Best chest session ever?',
        'What weight did I last bench?',
        'How many sets did I do last leg day?',
        'Any PRs recently?',
        'What should I train today?',
      ],
    },
    'dashboard/overview': {
      label: 'Overview',
      placeholder: 'e.g. most trained muscle this month?',
      suggestions: [
        'Most trained muscle this month?',
        'Best workout week ever?',
        'Total volume this week?',
        'How many sessions this month?',
        'Strongest lift overall?',
        'What was my best month?',
      ],
    },
    'dashboard/nutrition': {
      label: 'Nutrition Stats',
      placeholder: 'e.g. average protein this week?',
      suggestions: [
        'Average daily protein this week?',
        'Best calorie day this month?',
        'Highest protein meal ever?',
        'Carbs vs fat balance this week?',
        'Did I hit my protein goal today?',
        'Lowest calorie day this month?',
      ],
    },
    'dashboard/progress': {
      label: 'Progress',
      placeholder: 'e.g. how has my squat improved?',
      suggestions: [
        'How has my squat progressed?',
        'Bench press improvement this month?',
        'Volume trend over last 4 weeks?',
        'When did I hit my deadlift PR?',
        'Strength progress on shoulders?',
        'Best progress month overall?',
      ],
    },
    'dashboard/muscles': {
      label: 'Muscle Stats',
      placeholder: 'e.g. which muscle am I neglecting?',
      suggestions: [
        'Which muscle am I neglecting?',
        'Best chest exercise by volume?',
        'How often do I train legs?',
        'Back volume this month?',
        'Most worked muscle ever?',
        'Shoulders vs chest volume?',
      ],
    },
    'dashboard/body': {
      label: 'Body Stats',
      placeholder: 'e.g. weight trend this month?',
      suggestions: [
        'Weight trend this month?',
        'Lowest weight recorded?',
        'Body fat change over time?',
        'When was my heaviest weight?',
        'Muscle mass progress?',
        'Weight this week vs last month?',
      ],
    },
    'dashboard/cardio': {
      label: 'Cardio Stats',
      placeholder: 'e.g. total cardio this month?',
      suggestions: [
        'Total cardio sessions this month?',
        'Best running session ever?',
        'Average cardio duration?',
        'Most calories burned in one session?',
        'Cardio frequency this week?',
        'Longest distance run?',
      ],
    },
    history: {
      label: 'History',
      placeholder: 'e.g. what did I train last week?',
      suggestions: [
        'What did I train last week?',
        'How many sessions this month?',
        'Last time I trained back?',
        'Workouts this week?',
        'Most recent PR?',
        'Busiest training week?',
      ],
    },
    nutrition: {
      label: 'Nutrition',
      placeholder: 'e.g. how much protein today?',
      suggestions: [
        'How much protein did I eat today?',
        'Calories today vs yesterday?',
        'Best protein day this week?',
        'What meals did I log today?',
        'Average calories this week?',
        'Did I hit my macros today?',
      ],
    },
    coach: {
      label: 'Coach',
      placeholder: 'e.g. what should I focus on this week?',
      suggestions: [
        'What should I focus on this week?',
        'Am I overtraining any muscle?',
        'How is my recovery looking?',
        'Which lift needs most work?',
        'Training consistency this month?',
        'Best week for effort?',
      ],
    },
    default: {
      label: null,
      placeholder: 'e.g. best chest session, protein this week...',
      suggestions: [
        'Best bench press ever?',
        'How has my squat progressed?',
        'Protein intake this week',
        'Last chest workout',
        'Heaviest deadlift?',
        'Cardio sessions this month',
      ],
    },
  };

  function buildPersonalizedChips(contextKey) {
    const base = (PAGE_CONTEXT[contextKey] || PAGE_CONTEXT.default).suggestions.slice();
    try {
      const workouts = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      const now = Date.now();
      if (workouts.length) {
        const muscleDates = {};
        workouts.forEach(w => {
          if (w.muscle && w.date) {
            const t = new Date(w.date).getTime();
            if (!muscleDates[w.muscle] || t > muscleDates[w.muscle]) muscleDates[w.muscle] = t;
          }
        });
        const neglected = Object.entries(muscleDates).sort((a,b) => a[1] - b[1])[0];
        if (neglected) base[0] = `When did I last train ${neglected[0]}?`;
        const recentPR = workouts.filter(w => w.isPR && w.exercise)
          .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
        if (recentPR) base[1] = `How is my ${recentPR.exercise} progressing?`;
        const trainedToday = workouts.some(w => w.date && (now - new Date(w.date).getTime()) < 86400000);
        if (!trainedToday) base[2] = 'What should I train today?';
      }
    } catch {}
    try {
      const meals = JSON.parse(localStorage.getItem('forge_meals') || '{}');
      const today = new Date().toISOString().slice(0, 10);
      const todayMeals = meals[today] || [];
      const todayProtein = todayMeals.reduce((s,m) => s + +(m.p || m.protein || 0), 0);
      if (todayProtein > 0 && todayProtein < 120) base[3] = 'Did I hit my protein target today?';
    } catch {}
    return base.slice(0, 6);
  }

  function getPageContext() {
    const activeNav = document.querySelector('.bnav-btn.active');
    const view = activeNav?.id?.replace('bnav-', '') || 'default';
    if (view === 'dashboard') {
      const subTab = document.querySelector('.dash-tab.active')?.dataset?.tab || 'overview';
      return PAGE_CONTEXT[`dashboard/${subTab}`] || PAGE_CONTEXT['dashboard/overview'];
    }
    return PAGE_CONTEXT[view] || PAGE_CONTEXT.default;
  }

  function renderSuggestions() {
    const ctx = getPageContext();
    const el  = document.getElementById('rag-suggestions');
    const inp = document.getElementById('rag-input');
    const lbl = document.getElementById('rag-context-label');
    if (!el) return;

    // Update placeholder and context label
    if (inp) inp.placeholder = ctx.placeholder;
    if (lbl) {
      if (ctx.label) { lbl.textContent = ctx.label; lbl.style.display = 'inline-flex'; }
      else lbl.style.display = 'none';
    }

    const ctxKey = (() => {
      const activeNav = document.querySelector('.bnav-btn.active');
      const view = activeNav?.id?.replace('bnav-', '') || 'default';
      if (view === 'dashboard') {
        const subTab = document.querySelector('.dash-tab.active')?.dataset?.tab || 'overview';
        return `dashboard/${subTab}`;
      }
      return view;
    })();
    const chips = buildPersonalizedChips(ctxKey);
    el.innerHTML = chips.map(s =>
      `<button class="rag-chip" data-query="${s}">${s}</button>`
    ).join('');
    el.querySelectorAll('.rag-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('rag-input');
        if (input) input.value = btn.dataset.query;
        el.style.display = 'none';
        handleSearch();
      });
    });
    el.style.display = 'flex';
  }

  function showSkeleton() {
    const container = document.getElementById('rag-results');
    if (!container) return;
    container.innerHTML = Array(3).fill(`
      <div class="rag-skeleton">
        <div class="rag-skel-line short"></div>
        <div class="rag-skel-line"></div>
        <div class="rag-skel-line medium"></div>
      </div>
    `).join('');
  }

  function renderOnboarding() {
    const ts = localStorage.getItem(INGEST_KEY);
    if (ts) return;
    const container = document.getElementById('rag-results');
    if (!container) return;
    container.innerHTML = `
      <div class="rag-onboarding">
        <div class="rag-onboard-icon">🔍</div>
        <div class="rag-onboard-title">Ask FORGE anything</div>
        <div class="rag-onboard-body">Search your training history in plain English — best bench press, protein last week, how has my squat progressed.</div>
        <div class="rag-onboard-body" style="margin-top:6px;">Tap <strong>Index my data</strong> below to get started.</div>
      </div>
    `;
  }

  function showWeeklyReport(stats) {
    const container = document.getElementById('rag-results');
    if (!container) return;
    const { thisWeek, lastWeek, prs, avgKcal, avgProtein, weightDelta } = stats;
    const trend = thisWeek > lastWeek ? '↑' : thisWeek < lastWeek ? '↓' : '=';
    const weightStr = weightDelta !== null ? (weightDelta > 0 ? `+${weightDelta}kg` : `${weightDelta}kg`) : null;
    const card = document.createElement('div');
    card.className = 'rag-weekly-report';
    const statItems = [
      `<div class="rag-weekly-stat"><span class="rag-weekly-val">${thisWeek} ${trend}</span><span class="rag-weekly-lbl">Sessions</span></div>`,
      prs > 0 ? `<div class="rag-weekly-stat"><span class="rag-weekly-val">${prs} 🏆</span><span class="rag-weekly-lbl">PRs</span></div>` : '',
      avgKcal ? `<div class="rag-weekly-stat"><span class="rag-weekly-val">${avgKcal}</span><span class="rag-weekly-lbl">Avg kcal</span></div>` : '',
      avgProtein ? `<div class="rag-weekly-stat"><span class="rag-weekly-val">${avgProtein}g</span><span class="rag-weekly-lbl">Protein</span></div>` : '',
      weightStr ? `<div class="rag-weekly-stat"><span class="rag-weekly-val">${weightStr}</span><span class="rag-weekly-lbl">Weight</span></div>` : '',
    ].filter(Boolean).join('');
    card.innerHTML = `
      <div class="rag-weekly-header">📊 Weekly Report</div>
      <div class="rag-weekly-grid">${statItems}</div>
      <button class="rag-chip" id="rag-weekly-ask">Ask FORGE for weekly advice →</button>`;
    card.querySelector('#rag-weekly-ask').addEventListener('click', () => {
      const input = document.getElementById('rag-input');
      if (input) input.value = 'Based on my weekly stats, what should I focus on this week?';
      card.remove();
      handleSearch();
    });
    container.appendChild(card);
  }

  function checkWeeklyReport() {
    const WEEKLY_KEY = 'forge_last_weekly_report';
    // Show once per calendar week (Mon–Sun)
    const now = new Date();
    const daysSinceMon = (now.getDay() + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMon);
    weekStart.setHours(0, 0, 0, 0);
    const last = localStorage.getItem(WEEKLY_KEY);
    if (last && Number(last) >= weekStart.getTime()) return;
    try {
      const workouts = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      const bw       = JSON.parse(localStorage.getItem('forge_bodyweight') || '[]');
      const meals    = JSON.parse(localStorage.getItem('forge_meals') || '{}');
      const nowMs = Date.now();
      const weekMs = 7 * 86400000;
      const thisWeek = workouts.filter(w => w.date && (nowMs - new Date(w.date).getTime()) < weekMs);
      if (thisWeek.length === 0) return;
      const lastWeek = workouts.filter(w => {
        const age = nowMs - new Date(w.date || 0).getTime();
        return w.date && age >= weekMs && age < 2 * weekMs;
      });
      const prs = thisWeek.filter(w => w.isPR).length;
      let totalKcal = 0, totalProtein = 0, nutritionDays = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(nowMs); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayMeals = meals[key];
        if (Array.isArray(dayMeals) && dayMeals.length) {
          dayMeals.forEach(m => { totalKcal += +(m.kcal||m.calories||0); totalProtein += +(m.p||m.protein||0); });
          nutritionDays++;
        }
      }
      const sortedBW    = [...bw].filter(e => e.date).sort((a,b) => new Date(b.date) - new Date(a.date));
      const currentW    = sortedBW[0]?.weight;
      const prevW       = sortedBW.find(e => (nowMs - new Date(e.date).getTime()) >= weekMs)?.weight;
      const weightDelta = currentW && prevW ? parseFloat((currentW - prevW).toFixed(1)) : null;
      // Mark shown AFTER we know we have data to display
      localStorage.setItem(WEEKLY_KEY, Date.now().toString());
      showWeeklyReport({
        thisWeek: thisWeek.length, lastWeek: lastWeek.length, prs,
        avgKcal:    nutritionDays > 0 ? Math.round(totalKcal / nutritionDays) : null,
        avgProtein: nutritionDays > 0 ? Math.round(totalProtein / nutritionDays) : null,
        weightDelta,
      });
    } catch {}
  }

  function renderSaved() {
    const container = document.getElementById('rag-results');
    if (!container) return;
    container.innerHTML = '';
    document.getElementById('rag-suggestions').style.display = 'none';
    try {
      const saved = JSON.parse(localStorage.getItem('forge_saved_answers') || '[]');
      if (saved.length === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'color:var(--text2);font-size:.85rem;text-align:center;padding:24px 0;font-family:inherit;';
        p.textContent = 'No saved answers yet. Tap Save on any answer to keep it here.';
        container.appendChild(p);
        return;
      }
      saved.forEach(item => {
        const card = document.createElement('div');
        card.className = 'rag-saved-card';
        card.innerHTML = `
          <div class="rag-saved-question">${item.question}</div>
          <div class="rag-answer" style="margin-top:4px;font-size:.85rem;">${renderMarkdown(item.answer)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:.7rem;color:var(--text3,#4a5e4a);">${item.date || ''}</span>
            <button class="rag-unsave-btn" data-id="${item.id}">Remove</button>
          </div>`;
        card.querySelector('.rag-unsave-btn').addEventListener('click', (e) => {
          try {
            const s = JSON.parse(localStorage.getItem('forge_saved_answers') || '[]');
            localStorage.setItem('forge_saved_answers', JSON.stringify(s.filter(x => x.id !== Number(e.target.dataset.id))));
          } catch {}
          card.remove();
        });
        container.appendChild(card);
      });
    } catch {}
  }

  function createModal() {
    const el = document.createElement('div');
    el.id = 'rag-modal';
    el.innerHTML = `
      <div class="rag-backdrop" id="rag-backdrop"></div>
      <div class="rag-sheet">
        <div class="rag-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="rag-title">Ask FORGE</span>
            <span class="rag-context-label" id="rag-context-label" style="display:none;"></span>
          </div>
          <div style="display:flex;gap:4px;align-items:center;">
            <button class="rag-clear" id="rag-saved-btn" title="Saved answers" aria-label="Saved answers">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            <button class="rag-clear" id="rag-clear" title="New conversation" aria-label="New conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            </button>
            <button class="rag-close" id="rag-close" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="rag-input-row">
          <input id="rag-input" type="text" class="rag-input" placeholder="e.g. best chest session, protein this week..." autocomplete="off" />
          <button id="rag-mic-btn" class="rag-mic-btn" aria-label="Voice input" title="Speak your question">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <button id="rag-search-btn" class="rag-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
        <div class="rag-filters" id="rag-filters">
          <button class="rag-filter active" data-type="">All</button>
          <button class="rag-filter" data-type="workout">Workouts</button>
          <button class="rag-filter" data-type="meal">Meals</button>
          <button class="rag-filter" data-type="cardio">Cardio</button>
          <button class="rag-filter" data-type="bodyweight">Body</button>
          <button class="rag-filter" data-type="form_cue">Form</button>
        </div>
        <div id="rag-suggestions" class="rag-suggestions"></div>
        <div id="rag-status" class="rag-status" style="display:none;"></div>
        <div id="rag-results" class="rag-results"></div>
        <div class="rag-footer">
          <button id="rag-index-btn" class="rag-btn-secondary">Index my data</button>
          <span id="rag-index-status" class="rag-index-status" id="rag-last-indexed"></span>
        </div>
      </div>
    `;
    document.body.appendChild(el);

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #rag-modal { display:none; position:fixed; inset:0; z-index:9999; font-family:inherit; }
      #rag-modal.open { display:flex; align-items:flex-end; justify-content:center; }
      .rag-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.82); backdrop-filter:blur(12px); }
      .rag-sheet {
        position:relative; width:100%; max-width:480px;
        background:linear-gradient(170deg,#131f14 0%,#0d1710 100%);
        border-radius:28px 28px 0 0;
        padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));
        max-height:90vh; display:flex; flex-direction:column; gap:12px;
        animation:ragSlideUp .32s cubic-bezier(.22,.68,0,1.15);
        box-shadow:0 -12px 60px rgba(0,0,0,.65), 0 -1px 0 rgba(57,255,143,.07);
      }
      @keyframes ragSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes ragFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

      /* Handle bar */
      .rag-sheet::before {
        content:''; position:absolute; top:12px; left:50%; transform:translateX(-50%);
        width:36px; height:3px; background:rgba(57,255,143,.2); border-radius:2px;
      }

      .rag-header { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
      .rag-title { font-size:1.1rem; font-weight:800; letter-spacing:.02em; background:linear-gradient(90deg,#39ff8f,#2dd97a); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      .rag-context-label {
        font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em;
        background:rgba(57,255,143,.1); color:var(--accent,#39ff8f);
        border:1px solid rgba(57,255,143,.2); border-radius:20px;
        padding:2px 9px; line-height:1.6;
      }
      .rag-close,.rag-clear {
        background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); color:var(--text2,#8a9e8a);
        padding:7px; cursor:pointer; border-radius:10px; display:flex; transition:all .15s;
      }
      .rag-close:active,.rag-clear:active { background:rgba(57,255,143,.1); border-color:rgba(57,255,143,.3); color:var(--accent,#39ff8f); }

      /* Search input */
      .rag-input-row { display:flex; gap:8px; }
      .rag-input {
        flex:1; background:rgba(0,0,0,.35); border:1.5px solid rgba(255,255,255,.07);
        border-radius:18px; color:var(--text,#e8f4e8); font-size:.95rem; font-family:inherit;
        padding:13px 17px; outline:none; transition:border-color .2s, box-shadow .2s, background .2s;
      }
      .rag-input:focus { border-color:rgba(57,255,143,.5); box-shadow:0 0 0 3px rgba(57,255,143,.08); background:rgba(0,0,0,.5); }
      .rag-input::placeholder { color:rgba(138,158,138,.45); }
      .rag-btn-primary {
        width:50px; height:50px; background:var(--accent,#39ff8f); color:#000; border:none; border-radius:16px;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        font-weight:800; transition:transform .1s, box-shadow .15s; flex-shrink:0;
        box-shadow:0 4px 16px rgba(57,255,143,.25);
      }
      .rag-btn-primary:active { transform:scale(.91); box-shadow:0 2px 6px rgba(57,255,143,.15); }
      .rag-btn-primary:disabled { opacity:.4; cursor:not-allowed; transform:none; box-shadow:none; }
      .rag-mic-btn {
        width:50px; height:50px; background:rgba(255,255,255,.03); border:1.5px solid rgba(255,255,255,.08); border-radius:16px;
        color:var(--text2,#8a9e8a); cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition:all .15s; flex-shrink:0;
      }
      .rag-mic-btn:active { border-color:var(--accent,#39ff8f); color:var(--accent,#39ff8f); }
      .rag-mic-active { border-color:var(--accent,#39ff8f) !important; color:var(--accent,#39ff8f) !important; background:rgba(57,255,143,.08) !important; animation:ragMicPulse 1.2s ease-in-out infinite; }
      @keyframes ragMicPulse { 0%,100%{box-shadow:0 0 0 0 rgba(57,255,143,.25)} 50%{box-shadow:0 0 0 7px rgba(57,255,143,0)} }

      /* Type filters */
      .rag-filters { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; }
      .rag-filters::-webkit-scrollbar { display:none; }
      .rag-filter {
        background:rgba(255,255,255,.03); border:1.5px solid rgba(255,255,255,.07); border-radius:22px;
        color:rgba(138,158,138,.7); font-size:.73rem; font-family:inherit; font-weight:600;
        padding:6px 15px; cursor:pointer; white-space:nowrap; transition:all .15s; flex-shrink:0;
      }
      .rag-filter.active { background:var(--accent,#39ff8f); border-color:var(--accent,#39ff8f); color:#000; }
      .rag-filter:not(.active):active { border-color:rgba(57,255,143,.4); color:var(--accent,#39ff8f); }

      /* Suggestion chips */
      .rag-suggestions { display:flex; flex-wrap:wrap; gap:6px; }
      .rag-chip {
        background:rgba(255,255,255,.03); border:1.5px solid rgba(255,255,255,.07);
        border-radius:22px; color:rgba(138,158,138,.8); font-size:.74rem; font-family:inherit;
        font-weight:500; padding:6px 14px; cursor:pointer;
        transition:border-color .15s, color .15s, background .15s; white-space:nowrap;
      }
      .rag-chip:active { border-color:rgba(57,255,143,.4); color:var(--accent,#39ff8f); background:rgba(57,255,143,.05); }
      .rag-save-btn {
        display:inline-flex; align-items:center; gap:5px; margin-top:12px;
        background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:9px;
        color:rgba(138,158,138,.6); font-size:.71rem; font-family:inherit; font-weight:600;
        padding:5px 11px; cursor:pointer; transition:all .15s;
      }
      .rag-save-btn:active { border-color:rgba(57,255,143,.4); color:var(--accent,#39ff8f); }
      .rag-save-btn:disabled { cursor:default; }
      .rag-saved-card { background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.06); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; }
      .rag-saved-question { display:inline-flex; align-items:center; gap:5px; font-size:.7rem; font-weight:600; color:rgba(57,255,143,.7); background:rgba(57,255,143,.07); border:1px solid rgba(57,255,143,.15); border-radius:8px; padding:4px 10px; width:fit-content; }
      .rag-unsave-btn { background:none; border:none; color:rgba(138,158,138,.45); font-size:.72rem; font-family:inherit; cursor:pointer; padding:2px 0; transition:color .15s; }
      .rag-unsave-btn:active { color:#ff5555; }
      .rag-weekly-report { background:linear-gradient(145deg,rgba(57,255,143,.07) 0%,rgba(57,255,143,.02) 100%); border:1px solid rgba(57,255,143,.18); border-radius:20px; padding:16px; display:flex; flex-direction:column; gap:12px; }
      .rag-weekly-header { font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:var(--accent,#39ff8f); opacity:.8; }
      .rag-weekly-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(72px,1fr)); gap:8px; }
      .rag-weekly-stat { display:flex; flex-direction:column; align-items:center; gap:3px; background:rgba(0,0,0,.2); border:1px solid rgba(57,255,143,.1); border-radius:12px; padding:10px 6px; }
      .rag-weekly-val { font-size:1.05rem; font-weight:800; color:var(--text,#e8f4e8); }
      .rag-weekly-lbl { font-size:.64rem; color:var(--text2,#8a9e8a); text-align:center; }
      .rag-followup-row { display:flex; flex-wrap:wrap; gap:6px; padding-top:4px; align-items:center; }
      .rag-followup-label { font-size:.64rem; color:rgba(138,158,138,.4); font-weight:600; letter-spacing:.04em; white-space:nowrap; }
      .rag-followup-chip { font-size:.71rem !important; border-color:rgba(57,255,143,.15) !important; color:rgba(138,158,138,.6) !important; }
      .rag-followup-chip:active { color:var(--accent,#39ff8f) !important; border-color:rgba(57,255,143,.4) !important; background:rgba(57,255,143,.05) !important; }

      /* Sources toggle */
      .rag-sources-toggle { display:flex; align-items:center; gap:6px; background:none; border:none; color:rgba(138,158,138,.45); font-size:.72rem; font-family:inherit; font-weight:600; cursor:pointer; padding:2px 0; letter-spacing:.02em; transition:color .15s; }
      .rag-sources-toggle:active { color:var(--accent,#39ff8f); }
      .rag-sources-body { display:flex; flex-direction:column; gap:8px; margin-top:6px; }

      /* Status */
      .rag-status { font-size:.8rem; color:var(--text2,#8a9e8a); text-align:center; font-family:inherit; }

      /* Results */
      .rag-results { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:10px; min-height:0; padding-right:2px; }
      .rag-results::-webkit-scrollbar { width:2px; }
      .rag-results::-webkit-scrollbar-thumb { background:rgba(57,255,143,.15); border-radius:2px; }

      /* Answer card */
      .rag-answer {
        background:linear-gradient(150deg,rgba(57,255,143,.09) 0%,rgba(57,255,143,.03) 55%,rgba(0,0,0,.15) 100%);
        border:1px solid rgba(57,255,143,.22); border-radius:20px;
        padding:18px 20px; font-size:.9rem; font-family:inherit;
        color:var(--text,#e8f4e8); line-height:1.75; position:relative; overflow:hidden;
        animation:ragFadeIn .35s ease;
      }
      .rag-answer::before {
        content:''; position:absolute; top:0; left:20px; right:20px; height:1px;
        background:linear-gradient(90deg,transparent,rgba(57,255,143,.35),transparent);
      }
      .rag-ai-badge {
        display:inline-flex; align-items:center; gap:4px; float:right; margin:0 0 8px 10px;
        font-size:.6rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em;
        color:rgba(57,255,143,.6); background:rgba(57,255,143,.08); border:1px solid rgba(57,255,143,.15);
        border-radius:6px; padding:2px 7px; font-family:inherit;
      }
      .rag-answer strong { color:var(--accent,#39ff8f); font-weight:700; }
      .rag-answer em { color:var(--text2,#8a9e8a); font-style:italic; }
      .rag-answer ul { margin:8px 0 8px 4px; padding:0; list-style:none; display:flex; flex-direction:column; gap:5px; }
      .rag-answer li { padding-left:15px; position:relative; }
      .rag-answer li::before { content:'·'; position:absolute; left:0; color:var(--accent,#39ff8f); font-weight:900; font-size:1.1em; }
      .rag-answer p { margin:0; }
      .rag-md-heading { font-size:.8rem; font-weight:800; color:var(--accent,#39ff8f); text-transform:uppercase; letter-spacing:.07em; margin:10px 0 4px; display:block; }
      .rag-answer-streaming { border-color:rgba(57,255,143,.4); }
      .rag-answer-streaming::after { content:'▋'; color:var(--accent,#39ff8f); animation:ragBlink .7s step-end infinite; }
      @keyframes ragBlink { 50%{opacity:0} }

      /* Match cards */
      .rag-card {
        background:rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.05);
        border-radius:14px; padding:12px 14px; display:flex; flex-direction:column; gap:6px;
        transition:border-color .15s;
      }
      .rag-card:active { border-color:rgba(57,255,143,.2); }
      .rag-card-meta { display:flex; align-items:center; gap:8px; }
      .rag-card-type {
        font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em;
        background:rgba(57,255,143,.08); color:rgba(57,255,143,.8);
        border-radius:6px; padding:3px 8px;
      }
      .rag-card-date { font-size:.73rem; color:rgba(138,158,138,.6); font-weight:500; }
      .rag-card-sim { font-size:.66rem; color:rgba(138,158,138,.35); margin-left:auto; }
      .rag-card-content { font-size:.82rem; color:rgba(138,158,138,.65); line-height:1.55; font-family:inherit; }

      /* Skeleton */
      .rag-skeleton { background:rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.04); border-radius:14px; padding:13px; display:flex; flex-direction:column; gap:9px; }
      .rag-skel-line {
        height:8px; border-radius:5px; width:100%;
        background:linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.03) 75%);
        background-size:200% 100%; animation:ragShimmer 1.4s infinite;
      }
      .rag-skel-line.short{width:30%} .rag-skel-line.medium{width:60%}
      @keyframes ragShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

      /* Onboarding */
      .rag-onboarding { text-align:center; padding:32px 16px; display:flex; flex-direction:column; align-items:center; gap:12px; }
      .rag-onboard-icon { font-size:2.6rem; }
      .rag-onboard-title { font-size:1.05rem; font-weight:800; color:var(--text,#e8f4e8); }
      .rag-onboard-body { font-size:.83rem; color:rgba(138,158,138,.65); line-height:1.65; max-width:260px; font-family:inherit; }

      /* Footer */
      .rag-footer { display:flex; align-items:center; gap:10px; border-top:1px solid rgba(255,255,255,.04); padding-top:12px; }
      .rag-btn-secondary {
        background:rgba(255,255,255,.03); border:1.5px solid rgba(255,255,255,.08); border-radius:12px;
        color:rgba(138,158,138,.7); font-size:.78rem; font-family:inherit; font-weight:600;
        padding:7px 14px; cursor:pointer; transition:all .15s; white-space:nowrap;
      }
      .rag-btn-secondary:active { border-color:rgba(57,255,143,.4); color:var(--accent,#39ff8f); background:rgba(57,255,143,.05); }
      .rag-btn-secondary:disabled { opacity:.3; cursor:not-allowed; }
      .rag-index-status { font-size:.74rem; color:rgba(138,158,138,.5); flex:1; font-family:inherit; }
      .rag-btn-stale { border-color:rgba(57,255,143,.5) !important; color:var(--accent,#39ff8f) !important; }
      #rag-fab-wrap {
        position:fixed; left:16px;
        bottom:calc(72px + env(safe-area-inset-bottom,0px));
        display:flex; flex-direction:column; align-items:center; gap:6px; z-index:1000;
      }
      #rag-fab {
        width:52px; height:52px; border-radius:16px;
        background:var(--accent); color:#000;
        border:none; cursor:pointer; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 20px rgba(57,255,143,.3), 0 0 0 1px rgba(57,255,143,.1);
        transition:transform .15s, box-shadow .15s;
      }
      #rag-fab:active { transform:scale(.91); box-shadow:0 2px 8px rgba(57,255,143,.15); }
      .rag-fab-pill {
        background:rgba(13,23,16,.95); border:1px solid rgba(57,255,143,.3);
        color:var(--accent); font-size:.66rem; font-weight:700;
        padding:3px 10px; border-radius:20px;
        white-space:nowrap; letter-spacing:.05em;
        opacity:0; transition:opacity .4s ease;
        pointer-events:none; order:-1;
        backdrop-filter:blur(8px);
      }

      /* ── Premium FX ──────────────────────────────────────────────── */

      /* FAB: pulsing halo ring */
      #rag-fab { position:relative; overflow:visible; }
      #rag-fab::before {
        content:''; position:absolute; inset:-7px; border-radius:22px;
        box-shadow:0 0 0 0 rgba(57,255,143,.55);
        animation:ragFabHalo 2.8s ease-in-out infinite;
        pointer-events:none;
      }
      @keyframes ragFabHalo {
        0%   { box-shadow:0 0 0 0   rgba(57,255,143,.55); }
        60%  { box-shadow:0 0 0 14px rgba(57,255,143,0);  }
        100% { box-shadow:0 0 0 0   rgba(57,255,143,0);   }
      }

      /* FAB: sparkle slowly orbits */
      #rag-fab svg path { animation:ragSparkSpin 7s linear infinite; transform-origin:20.5px 4px; }
      @keyframes ragSparkSpin { to { transform:rotate(360deg); } }

      /* Input: animated gradient border on focus */
      .rag-input:focus {
        border-color:transparent !important;
        background:
          linear-gradient(#0d1710,#0d1710) padding-box,
          linear-gradient(90deg,#39ff8f,#2dd97a,#00e5ff,#39ff8f) border-box !important;
        background-size:auto, 300% auto !important;
        animation:ragInputFlow 2s linear infinite !important;
        box-shadow:0 0 0 3px rgba(57,255,143,.07) !important;
      }
      @keyframes ragInputFlow { 0%{background-position:auto,0% 50%} 100%{background-position:auto,300% 50%} }

      /* Search button ripple */
      @keyframes ragRipple { to{transform:scale(2.8);opacity:0} }

      /* Streaming answer: gradient left-border pulse */
      .rag-answer-streaming {
        border-left:2px solid transparent !important;
        border-image:linear-gradient(180deg,#39ff8f 0%,#2dd97a 50%,#00e5ff 100%) 1 !important;
        animation:ragFadeIn .35s ease, ragStreamPulse 1.8s ease-in-out infinite !important;
      }
      @keyframes ragStreamPulse { 0%,100%{opacity:1} 50%{opacity:.82} }

      /* Answer: green flash when stream completes */
      @keyframes ragAnswerFlash {
        0%   { box-shadow:0 0 0   rgba(57,255,143,0), inset 0 0 0   rgba(57,255,143,0); }
        25%  { box-shadow:0 0 28px rgba(57,255,143,.35), inset 0 0 20px rgba(57,255,143,.12); }
        100% { box-shadow:0 0 0   rgba(57,255,143,0), inset 0 0 0   rgba(57,255,143,0); }
      }
      .rag-answer-flash { animation:ragAnswerFlash .9s ease-out forwards !important; }

      /* Sheet: very subtle background breathing */
      .rag-sheet { animation:ragSlideUp .32s cubic-bezier(.22,.68,0,1.15), ragBgBreath 9s ease-in-out .4s infinite !important; }
      @keyframes ragBgBreath {
        0%,100%{ background:linear-gradient(170deg,#131f14 0%,#0d1710 100%); }
        50%    { background:linear-gradient(170deg,#162818 0%,#0f1e13 100%); }
      }

      /* Chips: staggered entrance */
      .rag-chip { animation:ragFadeIn .32s ease both; }
      .rag-chip:nth-child(1){animation-delay:.00s} .rag-chip:nth-child(2){animation-delay:.05s}
      .rag-chip:nth-child(3){animation-delay:.10s} .rag-chip:nth-child(4){animation-delay:.15s}
      .rag-chip:nth-child(5){animation-delay:.20s} .rag-chip:nth-child(6){animation-delay:.25s}

      /* FORGE AI badge: shimmer sweep */
      .rag-ai-badge {
        background-size:200% auto !important;
        background-image:linear-gradient(90deg,rgba(57,255,143,.08) 0%,rgba(57,255,143,.18) 50%,rgba(57,255,143,.08) 100%) !important;
        animation:ragBadgeShimmer 3s linear infinite;
      }
      @keyframes ragBadgeShimmer { 0%{background-position:200%} 100%{background-position:-200%} }
    `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById('rag-backdrop').addEventListener('click', closeModal);
    document.getElementById('rag-close').addEventListener('click', closeModal);
    document.getElementById('rag-clear').addEventListener('click', () => {
      conversationHistory = [];
      document.getElementById('rag-input').value = '';
      document.getElementById('rag-results').innerHTML = '';
      renderOnboarding();
      renderSuggestions();
    });
    document.getElementById('rag-saved-btn').addEventListener('click', renderSaved);
    document.getElementById('rag-search-btn').addEventListener('click', handleSearch);
    document.getElementById('rag-index-btn').addEventListener('click', handleIndex);
    document.getElementById('rag-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('rag-filters').addEventListener('click', (e) => {
      const btn = e.target.closest('.rag-filter');
      if (!btn) return;
      document.querySelectorAll('.rag-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.type;
      const q = document.getElementById('rag-input')?.value?.trim();
      if (q) handleSearch();
    });
  }

  function updateIndexStatus() {
    const ts = localStorage.getItem(INGEST_KEY);
    const btn = document.getElementById('rag-index-btn');
    const status = document.getElementById('rag-index-status');
    if (!status || !btn) return;
    if (!ts) {
      status.textContent = 'Not indexed yet';
      btn.classList.add('rag-btn-stale');
      return;
    }
    const days = Math.floor((Date.now() - Number(ts)) / 86400000);
    if (days === 0) status.textContent = 'Indexed today';
    else if (days === 1) status.textContent = 'Indexed yesterday';
    else status.textContent = `Indexed ${days} days ago`;
    btn.classList.toggle('rag-btn-stale', days >= 7);
  }

  function openModal() {
    const modal = document.getElementById('rag-modal');
    if (modal) {
      modal.classList.add('open');
      updateIndexStatus();
      renderOnboarding();
      checkWeeklyReport();
      renderSuggestions();
      setTimeout(() => document.getElementById('rag-input')?.focus(), 300);
      // FX
      playSound('open');
      const fab = document.getElementById('rag-fab');
      if (fab) spawnParticles(fab, 10);
    }
  }

  function closeModal() {
    const modal = document.getElementById('rag-modal');
    if (!modal) return;
    modal.classList.remove('open');
    // Reset any keyboard-shrink inline styles
    modal.style.top    = '';
    modal.style.bottom = '';
    modal.style.height = '';
    const sheet = modal.querySelector('.rag-sheet');
    if (sheet) sheet.style.maxHeight = '';
  }

  function showStatus(msg) {
    const el = document.getElementById('rag-status');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function renderMarkdown(text) {
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/^#{1,3} (.+)$/gm, '<p class="rag-md-heading">$1</p>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]+?<\/li>)(\n|$)/g, (m, li) => li)
      .replace(/(<li>.*<\/li>)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function renderAnswer(answer) {
    const container = document.getElementById('rag-results');
    if (!container || !answer) return;
    const el = document.createElement('div');
    el.className = 'rag-answer';
    el.innerHTML = renderMarkdown(answer);
    container.appendChild(el);
  }

  function renderResults(results) {
    const container = document.getElementById('rag-results');
    if (!container) return;
    if (!results || results.length === 0) {
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--text2);font-size:.85rem;text-align:center;padding:20px 0;';
      p.textContent = 'No results found. Try indexing your data first.';
      container.appendChild(p);
      return;
    }
    const TYPE_LABELS = {
      workout: 'Workout', bodyweight: 'Weight', meal: 'Meal',
      cardio: 'Cardio', bw_workout: 'Bodyweight',
      inbody: 'InBody', measurement: 'Measurements', unknown: '?',
    };
    const wrap = document.createElement('div');
    const cardsHtml = results.map(r => {
      const sim = Math.round((r.similarity || 0) * 100);
      const label = TYPE_LABELS[r.type] || r.type;
      return `
        <div class="rag-card">
          <div class="rag-card-meta">
            <span class="rag-card-type">${label}</span>
            <span class="rag-card-date">${r.date || ''}</span>
            <span class="rag-card-sim">${sim}%</span>
          </div>
          <div class="rag-card-content">${r.content || ''}</div>
        </div>`;
    }).join('');
    wrap.innerHTML = `
      <button class="rag-sources-toggle" id="rag-src-toggle">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        Sources (${results.length})
      </button>
      <div class="rag-sources-body" id="rag-src-body" style="display:none;">${cardsHtml}</div>`;
    wrap.querySelector('#rag-src-toggle').addEventListener('click', (e) => {
      const body = wrap.querySelector('#rag-src-body');
      const btn  = wrap.querySelector('#rag-src-toggle');
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'flex';
      btn.querySelector('svg').style.transform = open ? '' : 'rotate(180deg)';
    });
    container.appendChild(wrap);
  }

  function renderFollowUpChips(query) {
    const container = document.getElementById('rag-results');
    if (!container) return;
    const q = query.toLowerCase();
    let chips;
    if (q.includes('goal') || q.includes('target') || q.includes('close')) {
      chips = ['What should I fix first?', 'How is my nutrition tracking?', 'Am I on track this week?'];
    } else if (q.includes('protein') || q.includes('calor') || q.includes('nutrit') || q.includes('macro')) {
      chips = ['Am I close to my calorie goal?', 'How does this compare to my target?', 'What should I eat more of?'];
    } else if (q.includes('train') || q.includes('workout') || q.includes('session') || q.includes('today')) {
      chips = ['How is my recovery looking?', 'What muscle should I hit next?', 'Am I overtraining anything?'];
    } else if (q.includes('progress') || q.includes('improv') || q.includes('pr') || q.includes('record')) {
      chips = ['Which lift needs most work?', 'How has my volume changed?', 'What should I focus on next?'];
    } else if (q.includes('weight') || q.includes('fat') || q.includes('body') || q.includes('muscle')) {
      chips = ['Am I close to my goal weight?', 'How is my body fat trending?', 'How is my muscle mass changing?'];
    } else {
      chips = ['What should I prioritize this week?', 'How does this compare to last month?', 'What would you recommend?'];
    }
    const row = document.createElement('div');
    row.className = 'rag-followup-row';
    row.innerHTML = '<span class="rag-followup-label">Ask next:</span>' +
      chips.map(c => `<button class="rag-chip rag-followup-chip" data-query="${c}">${c}</button>`).join('');
    row.querySelectorAll('.rag-followup-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('rag-input');
        if (input) input.value = btn.dataset.query;
        row.remove();
        handleSearch();
      });
    });
    container.appendChild(row);
  }

  async function handleSearch() {
    const input = document.getElementById('rag-input');
    const btn   = document.getElementById('rag-search-btn');
    const query = input?.value?.trim();
    if (!query) return;
    btn.disabled = true;
    addRipple(btn);
    playSound('send');
    showStatus('');
    document.getElementById('rag-suggestions').style.display = 'none';
    const resultsContainer = document.getElementById('rag-results');
    showSkeleton();

    // Answer card — shown immediately, raw text during stream, markdown on done
    const answerEl = document.createElement('div');
    answerEl.className = 'rag-answer rag-answer-streaming';
    const aiBadge = document.createElement('span');
    aiBadge.className = 'rag-ai-badge';
    aiBadge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/></svg>FORGE AI`;
    answerEl.appendChild(aiBadge);
    let firstToken = true;
    let rawText = '';

    try {
      await searchQuery(
        query,
        activeFilter || null,
        (token) => {
          if (firstToken) {
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(answerEl);
            firstToken = false;
          }
          rawText += token;
          // Show plain text while streaming (cursor renders via ::after)
          answerEl.textContent = rawText;
        },
        (results) => { renderResults(results); },
        conversationHistory
      );
      // Stream done — render markdown properly
      answerEl.classList.remove('rag-answer-streaming');
      if (firstToken) resultsContainer.innerHTML = '';
      if (!rawText.trim()) {
        answerEl.remove();
      } else {
        answerEl.innerHTML = renderMarkdown(rawText);
        // FX: flash glow + particles + chime when answer arrives
        answerEl.classList.add('rag-answer-flash');
        playSound('done');
        spawnParticles(answerEl, 8);
        conversationHistory.push({ role: 'user', content: query });
        conversationHistory.push({ role: 'assistant', content: rawText });
        if (conversationHistory.length > 6) conversationHistory.splice(0, 2);
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'rag-save-btn';
        saveBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Save`;
        saveBtn.addEventListener('click', () => {
          try {
            const saved = JSON.parse(localStorage.getItem('forge_saved_answers') || '[]');
            saved.unshift({ id: Date.now(), question: query, answer: rawText, date: new Date().toISOString().slice(0,10) });
            if (saved.length > 50) saved.pop();
            localStorage.setItem('forge_saved_answers', JSON.stringify(saved));
          } catch {}
          saveBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Saved`;
          saveBtn.disabled = true;
          saveBtn.style.color = 'var(--accent,#39ff8f)';
          playSound('save');
          spawnParticles(saveBtn, 6);
        });
        answerEl.appendChild(saveBtn);
        renderFollowUpChips(query);
      }
    } catch (e) {
      resultsContainer.innerHTML = '';
      showStatus('Search failed: ' + (e.message || 'unknown error'));
    } finally {
      btn.disabled = false;
    }
  }

  async function handleIndex() {
    const btn    = document.getElementById('rag-index-btn');
    const status = document.getElementById('rag-index-status');
    btn.disabled = true;
    try {
      const { total, indexed } = await runFullIngest((done, tot) => {
        if (status) status.textContent = `Indexing... ${done}/${tot}`;
      });
      if (status) status.textContent = `Done — ${total} entries indexed.`;
      updateIndexStatus();
      setTimeout(() => updateIndexStatus(), 3000);
    } catch (e) {
      if (status) status.textContent = 'Error: ' + (e.message || 'failed');
    } finally {
      btn.disabled = false;
    }
  }

  // ─── Voice input ─────────────────────────────────────────────────────────

  function setupVoiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = document.getElementById('rag-mic-btn');
    if (!SR || !micBtn) { micBtn && (micBtn.style.display = 'none'); return; }
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';
    let listening = false;
    micBtn.addEventListener('click', () => {
      if (listening) { recog.stop(); return; }
      try { recog.start(); } catch {}
    });
    recog.onstart = () => { listening = true; micBtn.classList.add('rag-mic-active'); };
    recog.onend   = () => { listening = false; micBtn.classList.remove('rag-mic-active'); };
    recog.onerror = () => { listening = false; micBtn.classList.remove('rag-mic-active'); };
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      const input = document.getElementById('rag-input');
      if (input && transcript) { input.value = transcript; handleSearch(); }
    };
  }

  // ─── FAB button ──────────────────────────────────────────────────────────

  function updateFabLabel() {
    const pill = document.getElementById('rag-fab-pill');
    if (!pill) return;
    const ctx = getPageContext();
    if (ctx.label) {
      pill.textContent = ctx.label;
      pill.style.opacity = '1';
      setTimeout(() => { pill.style.opacity = '0'; }, 2500);
    } else {
      pill.style.opacity = '0';
    }
  }

  function createFab() {
    // Wrapper so pill sits beside FAB
    const wrap = document.createElement('div');
    wrap.id = 'rag-fab-wrap';
    wrap.innerHTML = `
      <span id="rag-fab-pill" class="rag-fab-pill"></span>
      <button id="rag-fab" aria-label="Ask FORGE">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <!-- dumbbell -->
          <rect x="1.5" y="9.5" width="3.5" height="5" rx="1"/>
          <rect x="5" y="10.5" width="2" height="3" rx=".5"/>
          <rect x="7" y="11" width="10" height="2" rx=".5"/>
          <rect x="17" y="10.5" width="2" height="3" rx=".5"/>
          <rect x="19" y="9.5" width="3.5" height="5" rx="1"/>
          <!-- sparkle top-right -->
          <path d="M20.5 1 L21.1 3.4 L23.5 4 L21.1 4.6 L20.5 7 L19.9 4.6 L17.5 4 L19.9 3.4 Z" opacity=".9"/>
        </svg>
      </button>
    `;
    document.body.appendChild(wrap);
    document.getElementById('rag-fab').addEventListener('click', openModal);

    // Watch for page changes via MutationObserver on bottom nav
    const nav = document.querySelector('.bottom-nav');
    if (nav) {
      new MutationObserver(updateFabLabel).observe(nav, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  }

  // ─── Premium FX ──────────────────────────────────────────────────────────

  let _audioCtx = null;
  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return _audioCtx;
  }

  // playSound('open' | 'send' | 'done' | 'save') — all via Web Audio API, no files
  function playSound(type) {
    try {
      const ctx = _getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      // Each note: {f=freq Hz, t=offset s, d=duration s, v=peak volume}
      const SEQ = {
        open: [{f:523,t:0,d:.09,v:.06},{f:659,t:.1,d:.09,v:.06},{f:784,t:.2,d:.14,v:.07}],
        send: [{f:660,t:0,d:.05,v:.05},{f:495,t:.06,d:.07,v:.04}],
        done: [{f:784,t:0,d:.13,v:.07},{f:1047,t:.2,d:.22,v:.07}],
        save: [{f:880,t:0,d:.11,v:.06}],
      };
      (SEQ[type] || []).forEach(({f,t,d,v}) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(v, now + t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.06);
      });
    } catch {}
  }

  // Burst N tiny green particles from the bounding rect centre of `el`
  function spawnParticles(el, count) {
    count = count || 10;
    try {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        const size = 3 + Math.random() * 4;
        p.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border-radius:50%;'
          + 'left:' + cx + 'px;top:' + cy + 'px;'
          + 'width:' + size + 'px;height:' + size + 'px;'
          + 'background:' + (Math.random() > .3 ? '#39ff8f' : (Math.random() > .5 ? '#fff' : '#00e5ff')) + ';'
          + 'transform:translate(-50%,-50%);';
        document.body.appendChild(p);
        const angle  = (Math.PI * 2 * i / count) + (Math.random() * .6 - .3);
        const dist   = 28 + Math.random() * 52;
        const tx     = Math.cos(angle) * dist;
        const ty     = Math.sin(angle) * dist - 18;
        const dur    = 480 + Math.random() * 280;
        const anim   = p.animate([
          { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
          { transform:'translate(calc(-50% + ' + tx + 'px),calc(-50% + ' + ty + 'px)) scale(0)', opacity:0 }
        ], { duration:dur, easing:'cubic-bezier(.22,.68,0,1)', fill:'forwards' });
        anim.onfinish = () => p.remove();
      }
    } catch {}
  }

  // Material-style ripple on a button element
  function addRipple(btn) {
    try {
      const r = document.createElement('span');
      r.style.cssText = 'position:absolute;border-radius:50%;background:rgba(0,0,0,.18);'
        + 'width:100%;padding-bottom:100%;top:0;left:0;transform:scale(0);opacity:1;'
        + 'pointer-events:none;animation:ragRipple .42s ease-out forwards;';
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(r);
      setTimeout(() => r.remove(), 500);
    } catch {}
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  function init() {
    // Only show if Supabase is configured
    if (!window.FORGE_CONFIG?.SUPABASE_URL || window.FORGE_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT')) return;
    createModal();
    createFab();
    setupVoiceInput();

    // Mobile keyboard fix: keep sheet visible above the on-screen keyboard.
    // Covers both iOS (visualViewport shrinks) and Android adjustResize (window resizes).
    const _initH = window.innerHeight;
    function _onKbResize() {
      const modal = document.getElementById('rag-modal');
      if (!modal || !modal.classList.contains('open')) return;
      // Prefer visualViewport (iOS + modern Android); fall back to window.innerHeight
      const availH   = window.visualViewport ? window.visualViewport.height   : window.innerHeight;
      const offsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
      const sheet = modal.querySelector('.rag-sheet');
      if (availH < _initH - 100) {
        // Keyboard is open — pin modal to visible viewport
        modal.style.top    = offsetTop + 'px';
        modal.style.bottom = 'auto';           // override inset:0's bottom:0
        modal.style.height = availH + 'px';
        if (sheet) sheet.style.maxHeight = (availH - 12) + 'px';
      } else {
        // Keyboard closed — restore defaults
        modal.style.top    = '';
        modal.style.bottom = '';
        modal.style.height = '';
        if (sheet) sheet.style.maxHeight = '';
      }
    }
    window.addEventListener('resize', _onKbResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', _onKbResize);
      window.visualViewport.addEventListener('scroll', _onKbResize);
    }
    // Auto re-index if stale (>3 days), never indexed, or RAG schema version changed
    const lastIngest = localStorage.getItem(INGEST_KEY);
    const storedVer  = localStorage.getItem(INGEST_VER_KEY);
    if (storedVer !== RAG_VERSION) localStorage.removeItem(INGEST_KEY); // force re-index on schema bump
    const freshIngest = localStorage.getItem(INGEST_KEY);
    const daysSince = freshIngest ? (Date.now() - Number(freshIngest)) / 86400000 : Infinity;
    if (daysSince > 3) {
      setTimeout(async () => {
        if (!window._sb || !(await getAuthHeader())) return;
        try {
          await runFullIngest(() => {});
          console.debug('[FORGE RAG] auto re-indexed (stale)');
        } catch (e) {
          console.debug('[FORGE RAG] auto re-index failed:', e.message);
        }
      }, 6000);
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  window.FORGE_ASK = {
    open: openModal,
    openWithQuery: function (q) {
      openModal();
      setTimeout(() => {
        const inp = document.getElementById('rag-input');
        if (inp) { inp.value = q; handleSearch(); }
      }, 420);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose user context builder for inline coach calls
  window._forgeUserContext = buildUserContext;
})();
