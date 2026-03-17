// FORGE RAG Search — client-side integration
// Converts localStorage data to text, sends to forge-ingest Edge Function,
// queries forge-search Edge Function, renders results in modal.

(function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────

  const INGEST_FN  = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-ingest';
  const SEARCH_FN  = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search';
  const INGEST_KEY = 'forge_rag_last_ingest';   // localStorage: last full ingest timestamp
  const BATCH_SIZE = 5;                         // items per ingest batch (keep small — edge fn AI inference is slow)

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

    el.innerHTML = ctx.suggestions.map(s =>
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
      #rag-modal { display:none; position:fixed; inset:0; z-index:9999; }
      #rag-modal.open { display:flex; align-items:flex-end; justify-content:center; }
      .rag-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.65); backdrop-filter:blur(4px); }
      .rag-sheet {
        position:relative; width:100%; max-width:480px;
        background:var(--panel); border-radius:20px 20px 0 0;
        padding:20px 16px calc(16px + env(safe-area-inset-bottom,0px));
        max-height:85vh; display:flex; flex-direction:column; gap:12px;
        animation: ragSlideUp .25s ease;
      }
      @keyframes ragSlideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      .rag-header { display:flex; align-items:center; justify-content:space-between; }
      .rag-title { font-size:1.1rem; font-weight:700; color:var(--accent); letter-spacing:.05em; }
      .rag-context-label {
        font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
        background:var(--green-dim); color:var(--accent); border-radius:6px;
        padding:2px 8px; align-items:center;
      }
      .rag-close { background:none; border:none; color:var(--text2); padding:4px; cursor:pointer; border-radius:8px; display:flex; }
      .rag-close:active { background:var(--border); }
      .rag-clear { background:none; border:none; color:var(--text3); padding:4px; cursor:pointer; border-radius:8px; display:flex; transition:color .15s; }
      .rag-clear:active { color:var(--accent); }
      .rag-input-row { display:flex; gap:8px; }
      .rag-input {
        flex:1; background:var(--bg3); border:1px solid var(--border2); border-radius:10px;
        color:var(--text); font-size:.95rem; padding:10px 14px; outline:none;
        transition:border-color .2s;
      }
      .rag-input:focus { border-color:var(--accent); }
      .rag-btn-primary {
        background:var(--accent); color:#000; border:none; border-radius:10px;
        padding:10px 14px; cursor:pointer; display:flex; align-items:center;
        font-weight:700; transition:opacity .15s;
      }
      .rag-btn-primary:active { opacity:.8; }
      .rag-btn-primary:disabled { opacity:.45; cursor:not-allowed; }
      .rag-status { font-size:.8rem; color:var(--text2); text-align:center; }
      .rag-results { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px; min-height:0; }
      .rag-card {
        background:var(--bg3); border:1px solid var(--border); border-radius:12px;
        padding:12px; display:flex; flex-direction:column; gap:4px;
      }
      .rag-card-meta { display:flex; align-items:center; gap:8px; }
      .rag-card-type {
        font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
        background:var(--green-dim); color:var(--accent); border-radius:6px; padding:2px 7px;
      }
      .rag-card-date { font-size:.75rem; color:var(--text2); }
      .rag-card-sim { font-size:.7rem; color:var(--text3); margin-left:auto; }
      .rag-card-content { font-size:.82rem; color:var(--text); line-height:1.5; }
      .rag-footer { display:flex; align-items:center; gap:10px; border-top:1px solid var(--border); padding-top:10px; }
      .rag-btn-secondary {
        background:none; border:1px solid var(--border2); border-radius:8px;
        color:var(--text2); font-size:.78rem; padding:6px 12px; cursor:pointer; transition:border-color .2s;
      }
      .rag-btn-secondary:active { border-color:var(--accent); color:var(--accent); }
      .rag-btn-secondary:disabled { opacity:.4; cursor:not-allowed; }
      .rag-index-status { font-size:.75rem; color:var(--text2); flex:1; }
      .rag-btn-stale { border-color:var(--accent) !important; color:var(--accent) !important; }
      .rag-filters { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; }
      .rag-filters::-webkit-scrollbar { display:none; }
      .rag-filter {
        background:none; border:1px solid var(--border2); border-radius:20px;
        color:var(--text2); font-size:.75rem; padding:4px 12px;
        cursor:pointer; white-space:nowrap; transition:all .15s; flex-shrink:0;
      }
      .rag-filter.active { background:var(--accent); border-color:var(--accent); color:#000; font-weight:700; }
      .rag-suggestions { display:flex; flex-wrap:wrap; gap:6px; }
      .rag-chip {
        background:var(--bg3); border:1px solid var(--border2); border-radius:20px;
        color:var(--text2); font-size:.75rem; padding:5px 12px;
        cursor:pointer; transition:border-color .15s, color .15s; white-space:nowrap;
      }
      .rag-chip:active { border-color:var(--accent); color:var(--accent); }
      .rag-skeleton {
        background:var(--bg3); border:1px solid var(--border);
        border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px;
      }
      .rag-skel-line {
        height:10px; border-radius:6px; width:100%;
        background:linear-gradient(90deg,var(--border) 25%,var(--border2) 50%,var(--border) 75%);
        background-size:200% 100%; animation:ragShimmer 1.4s infinite;
      }
      .rag-skel-line.short { width:35%; }
      .rag-skel-line.medium { width:65%; }
      @keyframes ragShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      .rag-onboarding { text-align:center; padding:24px 16px; display:flex; flex-direction:column; align-items:center; gap:8px; }
      .rag-onboard-icon { font-size:2rem; }
      .rag-onboard-title { font-size:1rem; font-weight:700; color:var(--text); }
      .rag-onboard-body { font-size:.82rem; color:var(--text2); line-height:1.5; max-width:280px; }
      .rag-answer {
        background:var(--panel); border:1px solid var(--accent);
        border-radius:12px; padding:14px 16px;
        font-size:.88rem; color:var(--text); line-height:1.6;
        white-space:pre-wrap;
      }
      .rag-answer-streaming::after {
        content: '▋'; color:var(--accent);
        animation: ragBlink .7s step-end infinite;
      }
      @keyframes ragBlink { 50% { opacity:0; } }
      #rag-fab-wrap {
        position:fixed; left:16px; top:calc(16px + env(safe-area-inset-top,0px));
        display:flex; align-items:center; gap:8px; z-index:1000;
      }
      #rag-fab {
        width:46px; height:46px; border-radius:50%;
        background:var(--accent); color:#000;
        border:none; cursor:pointer; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 16px rgba(57,255,143,.3);
        transition:transform .15s;
      }
      #rag-fab:active { transform:scale(.92); }
      .rag-fab-pill {
        background:var(--panel); border:1px solid var(--accent);
        color:var(--accent); font-size:.7rem; font-weight:700;
        padding:4px 10px; border-radius:20px;
        white-space:nowrap; letter-spacing:.04em;
        opacity:0; transition:opacity .4s ease;
        pointer-events:none;
      }
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
      renderSuggestions();
      setTimeout(() => document.getElementById('rag-input')?.focus(), 300);
    }
  }

  function closeModal() {
    document.getElementById('rag-modal')?.classList.remove('open');
  }

  function showStatus(msg) {
    const el = document.getElementById('rag-status');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function renderAnswer(answer) {
    const container = document.getElementById('rag-results');
    if (!container || !answer) return;
    const el = document.createElement('div');
    el.className = 'rag-answer';
    el.textContent = answer;
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
      cardio: 'Cardio', bw_workout: 'Bodyweight', unknown: '?',
    };
    const wrap = document.createElement('div');
    wrap.innerHTML = results.map(r => {
      const sim = Math.round((r.similarity || 0) * 100);
      const label = TYPE_LABELS[r.type] || r.type;
      return `
        <div class="rag-card">
          <div class="rag-card-meta">
            <span class="rag-card-type">${label}</span>
            <span class="rag-card-date">${r.date || ''}</span>
            <span class="rag-card-sim">${sim}% match</span>
          </div>
          <div class="rag-card-content">${r.content || ''}</div>
        </div>`;
    }).join('');
    container.appendChild(wrap);
  }

  async function handleSearch() {
    const input = document.getElementById('rag-input');
    const btn   = document.getElementById('rag-search-btn');
    const query = input?.value?.trim();
    if (!query) return;
    btn.disabled = true;
    showStatus('');
    document.getElementById('rag-suggestions').style.display = 'none';
    const resultsContainer = document.getElementById('rag-results');
    showSkeleton();

    // Answer card — appended after first token arrives (clears skeleton then)
    const answerEl = document.createElement('div');
    answerEl.className = 'rag-answer rag-answer-streaming';
    let firstToken = true;

    try {
      await searchQuery(
        query,
        activeFilter || null,
        (token) => {
          if (firstToken) {
            resultsContainer.innerHTML = ''; // clear skeleton
            resultsContainer.appendChild(answerEl);
            firstToken = false;
          }
          answerEl.textContent += token;
        },
        (results) => { renderResults(results); },
        conversationHistory
      );
      answerEl.classList.remove('rag-answer-streaming');
      if (firstToken) resultsContainer.innerHTML = ''; // clear skeleton if no tokens
      if (!answerEl.textContent.trim()) {
        answerEl.remove();
      } else {
        // Save exchange to history (max 3 pairs = 6 messages)
        conversationHistory.push({ role: 'user', content: query });
        conversationHistory.push({ role: 'assistant', content: answerEl.textContent });
        if (conversationHistory.length > 6) conversationHistory.splice(0, 2);
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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

  // ─── Init ────────────────────────────────────────────────────────────────

  function init() {
    // Only show if Supabase is configured
    if (!window.FORGE_CONFIG?.SUPABASE_URL || window.FORGE_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT')) return;
    createModal();
    createFab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
