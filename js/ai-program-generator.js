'use strict';
// FORGE AI Program Generator
// Replaces static TRAINING_PROGRAMS grid with LLM-powered custom split builder.
// Users define muscle combos per day → Claude generates exercises → preview → activate.

(function () {

  const SEARCH_FN = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search';

  const MUSCLES = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Legs', 'Glutes', 'Calves', 'Core', 'Traps',
    'Hamstrings', 'Quads', 'Forearms'
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _isoToday() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ── Shape adapter: AI program day → program-panel-compatible shape ──────────
  // Exported so program-panel.js can call window._adaptDay(day)
  function _adaptDay(day) {
    return Object.assign({}, day, {
      exs:    day.exs    || (day.exercises || []).map(e => e.name),
      muscle: day.muscle || (day.muscles   || [])[0] || ''
    });
  }
  window._adaptDay = _adaptDay;

  // ── Single-day prompt builder ──────────────────────────────────────────────
  // One LLM call per day — smallest possible output for maximum JSON reliability.
  function _buildDayPrompt(muscles, refinementNote) {
    const lines = [
      'Generate exercises for 1 training day.',
      `Muscles: ${muscles.join(', ')}`,
      'Return ONLY a JSON array with exactly 1 element:',
      '```json',
      '[{"label":"Push Day","muscles":["chest","triceps"],"exercises":[{"name":"Bench Press","sets":4,"reps":"8-10"},{"name":"Overhead Press","sets":3,"reps":"8-12"},{"name":"Tricep Dips","sets":3,"reps":"10-12"}]}]',
      '```',
      'STRICT: Exactly 3 exercises. Each has ONLY "name","sets","reps". No other fields.',
    ];
    if (refinementNote && refinementNote.trim()) lines.push(`Note: ${refinementNote.trim()}`);
    return lines.join('\n');
  }

  // ── SSE reader helper ──────────────────────────────────────────────────────
  async function _readSSE(resp) {
    const reader = resp.body?.getReader();
    if (!reader) return '';
    let text = '', buf = '';
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const ln of lines) {
        if (!ln.startsWith('data: ')) continue;
        try { text += JSON.parse(ln.slice(6).trim())?.token || ''; } catch {}
      }
    }
    return text;
  }

  // ── Single-day LLM call — returns one day object or null ──────────────────
  const _DAY_PREFILL = '```json\n[';

  async function _callDayLLM(muscles, token, refinementNote) {
    const prompt = _buildDayPrompt(muscles, refinementNote);
    try {
      const resp = await fetch(SEARCH_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: prompt,
          type_filter: null,
          coach_mode: true,
          coach_system: 'Complete the 1-element JSON array: [{"label":"...","muscles":[...],"exercises":[{"name":"...","sets":N,"reps":"..."}]}]. NO extra fields.',
          max_tokens: 400,
          prefill: _DAY_PREFILL
        })
      });
      if (!resp.ok) return null;
      const text = await _readSSE(resp);
      return _parseDayResponse((_DAY_PREFILL + text).trim());
    } catch (e) {
      console.warn('[ai-program-generator] day LLM call failed:', e);
      return null;
    }
  }

  // ── Single-day response parser ─────────────────────────────────────────────
  function _parseDayResponse(raw) {
    if (!raw) return null;
    const m = raw.match(/```json\s*([\s\S]*?)```/);
    let jsonStr = m?.[1]?.trim();
    if (!jsonStr) return null;
    for (let pass = 0; pass < 2; pass++) {
      try {
        const arr = JSON.parse(jsonStr);
        const d = Array.isArray(arr) ? arr[0] : null;
        if (!d?.label || !Array.isArray(d.muscles) || !Array.isArray(d.exercises) || d.exercises.length < 1) return null;
        for (const ex of d.exercises) { if (!ex.name || !ex.sets || !ex.reps) return null; }
        return d;
      } catch {
        if (pass === 0) {
          // Repair 1: muscles array dropped — "muscles":"exercises"
          jsonStr = jsonStr.replace(/"muscles"\s*:\s*"exercises"/g, '"muscles": [], "exercises"');
          // Repair 2: bare exercise name after closing brace
          jsonStr = jsonStr.replace(/}\s*,\s*\n(\s*)([A-Z][^"{\n,]{1,60})",/g, '},\n$1{"name": "$2",');
          // Repair 3: reps merged with exercise name — "reps": "8-BicepCurl"
          jsonStr = jsonStr.replace(/"reps":\s*"(\d+)-([A-Z][^"]+)"/g, '"reps": "$1-12"');
          // Repair 4: unclosed reps with embedded newline
          jsonStr = jsonStr.replace(/"reps":\s*"([0-9][^"\n]{0,8})\n/g, '"reps": "$1",\n');
          // Repair 5: missing opening quote on known string fields
          jsonStr = jsonStr.replace(/"(name|reps|label)":\s*([A-Za-z(][^,}\]\n"]*?)"/g, '"$1": "$2"');
        }
      }
    }
    return null;
  }

  // ── Activate / Deactivate ──────────────────────────────────────────────────
  function _aiProgramActivate(program) {
    program.startDate = _isoToday();
    program.generatedAt = _isoToday();
    localStorage.setItem('forge_ai_program', JSON.stringify(program));
    if (typeof renderProgramPanel === 'function') renderProgramPanel();
  }
  window._aiProgramActivate = _aiProgramActivate;

  function _aiProgramDeactivate() {
    localStorage.removeItem('forge_ai_program');
    if (typeof renderProgramPanel === 'function') renderProgramPanel();
  }
  window._aiProgramDeactivate = _aiProgramDeactivate;

  // ── Split builder state ────────────────────────────────────────────────────
  let _dayCount = 4;
  let _dayMuscles = [[], [], [], [], [], []];
  let _currentProgram = null;

  function _prefillFromSplit() {
    const split = _lsGet('forge_split', {});
    const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const nonRest = ORDER.filter(d => split[d] && split[d] !== 'Rest');
    if (nonRest.length >= 3) _dayCount = Math.min(6, Math.max(3, nonRest.length));
  }

  // ── Render split builder ───────────────────────────────────────────────────
  function _renderSplitBuilder() {
    const body = document.getElementById('programs-panel-body');
    if (!body) return;

    const dayCountBtns = [3, 4, 5, 6].map(n =>
      `<button class="apg-day-count-btn${_dayCount === n ? ' active' : ''}" onclick="window._apgSetDayCount(${n})">${n}</button>`
    ).join('');

    const daySlots = Array.from({ length: _dayCount }, (_, i) => {
      const chips = MUSCLES.map(m =>
        `<span class="apg-chip${(_dayMuscles[i] || []).includes(m) ? ' selected' : ''}" onclick="window._apgToggleMuscle(${i},'${_esc(m)}')">${_esc(m)}</span>`
      ).join('');
      return `<div class="apg-day-slot">
        <div class="apg-day-slot-label">Day ${i + 1}</div>
        <div class="apg-muscle-chips">${chips}</div>
      </div>`;
    }).join('');

    const anyEmpty = Array.from({ length: _dayCount }, (_, i) => (_dayMuscles[i] || []).length === 0).some(Boolean);

    body.innerHTML = `
      <div class="apg-wrap">
        <div class="apg-section-title">How many training days?</div>
        <div class="apg-day-count-row">${dayCountBtns}</div>
        <div class="apg-section-title" style="margin-top:14px;">Select muscles for each day</div>
        ${daySlots}
        ${anyEmpty ? '<div class="apg-error-msg">Select muscles for each day</div>' : ''}
        <button class="apg-generate-btn"${anyEmpty ? ' disabled' : ''} onclick="window._apgGenerate()">GENERATE MY PROGRAM →</button>
      </div>`;
  }

  // ── Render preview ─────────────────────────────────────────────────────────
  function _renderProgramPreview(program) {
    const body = document.getElementById('programs-panel-body');
    if (!body) return;
    _currentProgram = program;

    const daycards = program.days.map(day => {
      const exRows = day.exercises.map(ex =>
        `<div class="apg-exercise-row">${_esc(ex.name)} · ${_esc(String(ex.sets))}×${_esc(String(ex.reps))}</div>`
      ).join('');
      return `<div class="apg-day-card">
        <div class="apg-day-card-label">${_esc(day.label)}</div>
        <div class="apg-exercise-list">${exRows}</div>
      </div>`;
    }).join('');

    const dayStrip = program.days.map((_, i) =>
      `<span class="apg-day-strip-chip">Day ${i + 1}</span>`
    ).join('');

    body.innerHTML = `
      <div class="apg-wrap">
        <div class="apg-preview-name">${_esc(program.name)}</div>
        <div class="apg-day-strip">${dayStrip}</div>
        ${daycards}
        <div class="apg-refine-row">
          <input class="apg-refine-input" id="apg-refine" type="text" placeholder="e.g. make it 4 days, no leg press" />
          <button class="apg-regen-btn" onclick="window._apgRegenerate()">↺ REGENERATE</button>
        </div>
        <button class="apg-activate-btn" onclick="window._apgActivate()">✓ ACTIVATE PROGRAM</button>
      </div>`;
  }

  // ── Interactive handlers ───────────────────────────────────────────────────
  window._apgSetDayCount = function (n) {
    _dayCount = n;
    _renderSplitBuilder();
  };

  window._apgToggleMuscle = function (dayIdx, muscle) {
    if (!_dayMuscles[dayIdx]) _dayMuscles[dayIdx] = [];
    const idx = _dayMuscles[dayIdx].indexOf(muscle);
    if (idx >= 0) _dayMuscles[dayIdx].splice(idx, 1);
    else _dayMuscles[dayIdx].push(muscle);
    _renderSplitBuilder();
  };

  window._apgGenerate = async function (refinementNote) {
    const body = document.getElementById('programs-panel-body');
    if (!body) return;

    // Auth check — must have a Supabase session
    const session = await window._sb?.auth?.getSession?.();
    const token = session?.data?.session?.access_token;
    if (!token) {
      body.innerHTML = `<div class="apg-wrap">
        <div class="apg-auth-gate">Sign in to generate your AI program.</div>
        <button class="apg-regen-btn" style="margin-top:12px;" onclick="window.renderAIProgramGenerator()">← BACK</button>
      </div>`;
      return;
    }

    const splitDays = Array.from({ length: _dayCount }, (_, i) => ({ muscles: _dayMuscles[i] || [] }));
    body.innerHTML = '<div class="apg-wrap"><div class="apg-generating"><span class="apg-spinner"></span>Building your program…</div></div>';
    const note = refinementNote || '';

    // Generate all days in parallel — 1 LLM call per day, smallest possible output
    let days = await Promise.all(
      splitDays.map(d => _callDayLLM(d.muscles, token, note))
    );

    // Retry only the failed days, in parallel
    const failedIdx = days.map((d, i) => d ? null : i).filter(i => i !== null);
    if (failedIdx.length > 0) {
      const retries = await Promise.all(failedIdx.map(i => _callDayLLM(splitDays[i].muscles, token, note)));
      failedIdx.forEach((idx, j) => { if (retries[j]) days[idx] = retries[j]; });
    }

    if (days.some(d => !d)) {
      body.innerHTML = `<div class="apg-wrap">
        <div class="apg-error-msg">Couldn't generate program — try again.</div>
        <button class="apg-regen-btn" style="margin-top:12px;" onclick="window._apgGenerate()">↺ TRY AGAIN</button>
        <button class="apg-regen-btn" style="margin-top:8px;" onclick="window.renderAIProgramGenerator()">← BACK</button>
      </div>`;
      return;
    }

    const allDays = days;
    // Derive program name from muscle groups (no extra LLM call needed)
    const topMuscles = splitDays.map(d => d.muscles[0] || '').filter(Boolean);
    const progName = topMuscles.length >= 4
      ? topMuscles.slice(0, 2).join(' & ') + ' Split'
      : topMuscles.join(' & ') + ' Program';

    _renderProgramPreview({ name: progName, days: allDays });
  };

  window._apgRegenerate = function () {
    const note = document.getElementById('apg-refine')?.value || '';
    window._apgGenerate(note);
  };

  window._apgActivate = function () {
    if (!_currentProgram) return;
    _aiProgramActivate(_currentProgram);
    // Show confirmation with where it takes effect
    const body = document.getElementById('programs-panel-body');
    if (!body) return;
    body.innerHTML = `
      <div class="apg-wrap">
        <div class="apg-preview-name" style="color:var(--accent);">✓ Program Activated</div>
        <div class="apg-section-title" style="margin-top:8px;margin-bottom:12px;">Your program is now live in:</div>
        <div class="apg-day-card" style="margin-bottom:8px;">
          <div class="apg-day-card-label">📋 Log Tab → Today's Session</div>
          <div class="apg-exercise-row">Shows today's exercises at the top of the Log tab</div>
        </div>
        <div class="apg-day-card" style="margin-bottom:8px;">
          <div class="apg-day-card-label">🏋 Coach → Train → Today's Session</div>
          <div class="apg-exercise-row">Coach Train tab shows today's day with START SESSION button</div>
        </div>
        <div class="apg-day-card" style="margin-bottom:16px;">
          <div class="apg-day-card-label">📅 Programs panel (here)</div>
          <div class="apg-exercise-row">Returns here to show your active program schedule</div>
        </div>
        <button class="apg-activate-btn" onclick="if(typeof renderProgramPanel==='function')renderProgramPanel()">VIEW ACTIVE PROGRAM →</button>
        <button class="apg-regen-btn" style="width:100%;margin-top:8px;" onclick="window._aiProgramDeactivate()">✕ Deactivate</button>
      </div>`;
  };

  // ── Main entry point ───────────────────────────────────────────────────────
  function renderAIProgramGenerator() {
    _prefillFromSplit();
    _renderSplitBuilder();
  }
  window.renderAIProgramGenerator = renderAIProgramGenerator;

})();
