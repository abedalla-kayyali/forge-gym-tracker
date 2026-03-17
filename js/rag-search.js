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

  async function searchQuery(query, typeFilter) {
    const authHeader = await getAuthHeader();
    if (!authHeader) throw new Error('Not signed in');
    const res = await fetch(SEARCH_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader,
                 'apikey': window.FORGE_CONFIG?.SUPABASE_ANON },
      body: JSON.stringify({ query, n_results: 8, type_filter: typeFilter || null }),
    });
    if (!res.ok) throw new Error(`search ${res.status}`);
    return res.json();
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

  // ─── Auto-ingest: called after save() for the latest workout ─────────────

  window._ragAutoIngest = async function () {
    if (!window._sb || !window.FORGE_CONFIG?.SUPABASE_URL) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      // Only ingest the most recent workout/bw workout (just added)
      const workouts = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      const latest = Array.isArray(workouts) ? workouts[workouts.length - 1] : null;
      if (!latest?.id) return;
      const item = {
        id: `workout_${latest.id}`,
        type: 'workout',
        date: latest.date ? latest.date.slice(0, 10) : '',
        content: workoutToDoc(latest),
        metadata: { muscle: latest.muscle || '', exercise: latest.exercise || '',
                    is_pr: String(!!latest.isPR), volume: latest.totalVolume || 0 },
      };
      await ingestBatch([item], authHeader);
    } catch (e) {
      console.debug('[FORGE RAG] auto-ingest skipped:', e.message);
    }
  };

  // ─── Modal UI ─────────────────────────────────────────────────────────────

  function createModal() {
    const el = document.createElement('div');
    el.id = 'rag-modal';
    el.innerHTML = `
      <div class="rag-backdrop" id="rag-backdrop"></div>
      <div class="rag-sheet">
        <div class="rag-header">
          <span class="rag-title">Ask FORGE</span>
          <button class="rag-close" id="rag-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="rag-input-row">
          <input id="rag-input" type="text" class="rag-input" placeholder="e.g. best chest session, protein this week..." autocomplete="off" />
          <button id="rag-search-btn" class="rag-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
        <div id="rag-status" class="rag-status" style="display:none;"></div>
        <div id="rag-results" class="rag-results"></div>
        <div class="rag-footer">
          <button id="rag-index-btn" class="rag-btn-secondary">Index my data</button>
          <span id="rag-index-status" class="rag-index-status"></span>
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
      .rag-close { background:none; border:none; color:var(--text2); padding:4px; cursor:pointer; border-radius:8px; display:flex; }
      .rag-close:active { background:var(--border); }
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
      .rag-answer {
        background:var(--panel); border:1px solid var(--accent);
        border-radius:12px; padding:14px 16px;
        font-size:.88rem; color:var(--text); line-height:1.6;
        white-space:pre-wrap;
      }
      #rag-fab {
        position:fixed; right:16px; bottom:calc(74px + env(safe-area-inset-bottom,0px));
        width:46px; height:46px; border-radius:50%;
        background:var(--accent); color:#000;
        border:none; cursor:pointer; z-index:1000;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 16px rgba(57,255,143,.3);
        transition:transform .15s, opacity .15s;
      }
      #rag-fab:active { transform:scale(.92); }
    `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById('rag-backdrop').addEventListener('click', closeModal);
    document.getElementById('rag-close').addEventListener('click', closeModal);
    document.getElementById('rag-search-btn').addEventListener('click', handleSearch);
    document.getElementById('rag-index-btn').addEventListener('click', handleIndex);
    document.getElementById('rag-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  function openModal() {
    const modal = document.getElementById('rag-modal');
    if (modal) {
      modal.classList.add('open');
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
      container.innerHTML = '<p style="color:var(--text2);font-size:.85rem;text-align:center;padding:20px 0;">No results found. Try indexing your data first.</p>';
      return;
    }
    const TYPE_LABELS = {
      workout: 'Workout', bodyweight: 'Weight', meal: 'Meal',
      cardio: 'Cardio', bw_workout: 'Bodyweight', unknown: '?',
    };
    container.innerHTML = results.map(r => {
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
  }

  async function handleSearch() {
    const input = document.getElementById('rag-input');
    const btn   = document.getElementById('rag-search-btn');
    const query = input?.value?.trim();
    if (!query) return;
    btn.disabled = true;
    showStatus('Thinking...');
    document.getElementById('rag-results').innerHTML = '';
    try {
      const { answer, results, error } = await searchQuery(query, null);
      if (error) throw new Error(error);
      showStatus('');
      renderAnswer(answer);
      renderResults(results);
    } catch (e) {
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
      const { total, indexed } = await runFullIngest((done, total) => {
        if (status) status.textContent = `Indexing... ${done}/${total}`;
      });
      if (status) status.textContent = `Indexed ${total} entries.`;
      setTimeout(() => { if (status) status.textContent = ''; }, 4000);
    } catch (e) {
      if (status) status.textContent = 'Error: ' + (e.message || 'failed');
    } finally {
      btn.disabled = false;
    }
  }

  // ─── FAB button ──────────────────────────────────────────────────────────

  function createFab() {
    const fab = document.createElement('button');
    fab.id = 'rag-fab';
    fab.setAttribute('aria-label', 'Ask FORGE');
    fab.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    fab.addEventListener('click', openModal);
    document.body.appendChild(fab);
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
