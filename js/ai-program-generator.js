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

  // ── Context builder ────────────────────────────────────────────────────────
  function _buildProgramContext(splitDays, refinementNote) {
    const up = (typeof userProfile !== 'undefined' ? userProfile : null) || _lsGet('forge_profile', {});
    const meso = _lsGet('forge_mesocycle', {});
    const wkts = (typeof workouts !== 'undefined' ? workouts : null) || _lsGet('forge_workouts', []);

    const recentEx = [...new Set(
      (Array.isArray(wkts) ? wkts : []).slice(-20).map(w => w.exercise).filter(Boolean)
    )].slice(0, 15).join(', ') || 'none';

    const lagging = [];
    if (typeof window.FORGE_OVERLOAD !== 'undefined') {
      ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core'].forEach(m => {
        const s = window.FORGE_OVERLOAD.getMuscleOverloadScore(m);
        if (s !== null && s < 50) lagging.push(m);
      });
    }

    const inbody = _lsGet('forge_inbody', []);
    const lastIb = Array.isArray(inbody) && inbody.length > 0 ? inbody[inbody.length - 1] : null;

    const lines = [
      'You are a personal training coach. Generate a weekly training program.',
      '',
      `User profile: goal=${up.goal || 'recomp'}, weight=${up.weight || '?'}kg, age=${up.age || '?'}, gender=${up.gender || 'unknown'}`,
    ];
    if (meso.phase) lines.push(`Current phase: ${meso.phase}${meso.durationWeeks ? ' (' + meso.durationWeeks + ' weeks)' : ''}`);
    if (lastIb) lines.push(`Body composition: BF%=${lastIb.bf || '?'}, SMM=${lastIb.smm || '?'}kg`);
    if (lagging.length) lines.push(`Lagging muscles (overload <50%): ${lagging.join(', ')}`);
    lines.push(`Recent exercises: ${recentEx}`);
    lines.push('');
    lines.push('Training days requested:');
    splitDays.forEach((day, i) => {
      lines.push(`Day ${i + 1}: ${day.muscles.join(', ')}`);
    });
    lines.push('');
    lines.push('Return ONLY a JSON code block. No explanation. Format:');
    lines.push('```json');
    lines.push('{"name":"Program name (max 5 words)","days":[{"label":"Push Day","muscles":["chest","triceps"],"exercises":[{"name":"Bench Press","sets":4,"reps":"8-10"},{"name":"Incline DB Press","sets":3,"reps":"10-12"}]}]}');
    lines.push('```');
    lines.push('Provide 4-6 exercises per day. Prioritize lagging muscles. Use exercises the user has logged before where appropriate.');
    if (refinementNote && refinementNote.trim()) {
      lines.push(`User refinement note: ${refinementNote.trim()}`);
    }
    return lines.join('\n');
  }

  // ── LLM call (SSE buffered decode — same pattern as coach-triggers.js) ──────
  async function _callProgramLLM(prompt) {
    const session = await window._sb?.auth?.getSession?.();
    const token = session?.data?.session?.access_token;
    if (!token) return null;

    try {
      const resp = await fetch(SEARCH_FN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: prompt,
          type_filter: null,
          coach_mode: true,
          coach_system: 'You are a personal training program generator. Return only valid JSON in a code block.',
          max_tokens: 1500
        })
      });
      if (!resp.ok) return null;

      const reader = resp.body?.getReader();
      if (!reader) return null;
      let text = '', buf = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const ln of lines) {
          if (!ln.startsWith('data: ')) continue;
          const raw = ln.slice(6).trim();
          if (raw === '[DONE]') break;
          try { text += JSON.parse(raw)?.token || ''; } catch {}
        }
      }
      return text.trim() || null;
    } catch (e) {
      console.warn('[ai-program-generator] LLM call failed:', e);
      return null;
    }
  }

  // ── Response parser ────────────────────────────────────────────────────────
  function _parseProgramResponse(raw, expectedDays) {
    if (!raw) return null;
    const m = raw.match(/```json\s*([\s\S]*?)```/);
    let jsonStr = m?.[1]?.trim();
    if (!jsonStr) return null;
    for (let pass = 0; pass < 2; pass++) {
      try {
        const r = JSON.parse(jsonStr);
        if (typeof r.name !== 'string') return null;
        if (!Array.isArray(r.days) || r.days.length !== expectedDays) return null;
        for (const d of r.days) {
          if (!d.label || !Array.isArray(d.muscles) || !Array.isArray(d.exercises) || d.exercises.length < 1) return null;
          for (const ex of d.exercises) {
            if (!ex.name || !ex.sets || !ex.reps) return null;
          }
        }
        return r;
      } catch {
        if (pass === 0) {
          // Repair: LLM sometimes omits opening quote — e.g. "name": Fly" → "name": "Fly"
          // Only target known string fields to avoid corrupting valid values inside strings
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
    const prompt = _buildProgramContext(splitDays, refinementNote || '');
    const raw = await _callProgramLLM(prompt);
    const program = _parseProgramResponse(raw, _dayCount);
    if (!program) {
      body.innerHTML = `<div class="apg-wrap">
        <div class="apg-error-msg">Couldn't generate program — try again.</div>
        <button class="apg-regen-btn" style="margin-top:12px;" onclick="window._apgGenerate()">↺ TRY AGAIN</button>
        <button class="apg-regen-btn" style="margin-top:8px;" onclick="window.renderAIProgramGenerator()">← BACK</button>
      </div>`;
      return;
    }
    _renderProgramPreview(program);
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
