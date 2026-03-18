# AI Program Generator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static TRAINING_PROGRAMS grid with an AI-powered split builder that generates personalized exercise programs via Claude.

**Architecture:** New IIFE `js/ai-program-generator.js` handles split builder UI, context building, LLM call (via existing `forge-search` Edge Function), response parsing, preview, and activate/deactivate. `js/program-panel.js` is updated to read `forge_ai_program` first and delegate no-program rendering to the generator. CSS appended to `css/main.css`.

**Tech Stack:** Vanilla JS IIFE, Supabase Edge Function (`forge-search`), SSE streaming, localStorage

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `js/ai-program-generator.js` | Full IIFE — split builder, LLM call, preview, activate |
| Modify | `js/program-panel.js` | Init reads `forge_ai_program` first; delegates no-program state to generator; adapts AI day shape |
| Modify | `index.html` line 2262 | Add `<script src="js/ai-program-generator.js">` after `program-panel.js` |
| Modify | `css/main.css` | Append all `apg-*` CSS classes |
| Modify | `js/config.js` | Version bump v231 → v232 |

---

## Task 1: Create `js/ai-program-generator.js`

**Files:**
- Create: `js/ai-program-generator.js`

- [ ] **Step 1: Create the file with this exact content**

```js
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
          max_tokens: 800
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
    const jsonStr = m?.[1]?.trim();
    if (!jsonStr) return null;
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
      return null;
    }
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

    // Auth gate shown inside split builder — generate action also checks token
    const isGuest = !window._forgeUser;

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
        ${isGuest
          ? '<div class="apg-auth-gate">Sign in to generate your AI program.</div>'
          : `<button class="apg-generate-btn"${anyEmpty ? ' disabled' : ''} onclick="window._apgGenerate()">GENERATE MY PROGRAM →</button>`
        }
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
    if (_currentProgram) _aiProgramActivate(_currentProgram);
  };

  // ── Main entry point ───────────────────────────────────────────────────────
  function renderAIProgramGenerator() {
    _prefillFromSplit();
    _renderSplitBuilder();
  }
  window.renderAIProgramGenerator = renderAIProgramGenerator;

})();
```

- [ ] **Step 2: Commit**

```bash
cd "C:\Users\USER\Desktop\Claude\Forg-Cali-os-18-main - codex 2 - Claude 2 - Nutrion"
git add js/ai-program-generator.js
git commit -m "feat: ai-program-generator IIFE — split builder, LLM call, preview, activate"
```

---

## Task 2: Modify `js/program-panel.js`

**Files:**
- Modify: `js/program-panel.js`

The current file has 107 lines. Make these three targeted changes:

- [ ] **Step 1: Fix `_getProgramDayIndex()` to support AI programs**

Find lines 8–18 (current content):
```js
function _getProgramDayIndex() {
  if (!_activeProg) return 0;
  const prog = TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) return 0;
  const start = new Date(_activeProg.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.max(0, Math.floor((today - start) / 86400000));
  return diff % prog.days.length;
}
```

Replace with:
```js
function _getProgramDayIndex() {
  if (!_activeProg) return 0;
  // AI programs have days directly; static programs looked up by id
  const prog = _activeProg.days
    ? _activeProg
    : TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog || !prog.days || !prog.days.length) return 0;
  const start = new Date(_activeProg.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.max(0, Math.floor((today - start) / 86400000));
  return diff % prog.days.length;
}
```

- [ ] **Step 2: Fix `startProgramWorkout()` to support AI programs**

Find lines 83–88 (current content):
```js
function startProgramWorkout() {
  if (!_activeProg) return;
  const prog = TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) return;
  const day = prog.days[_getProgramDayIndex()];
```

Replace with:
```js
function startProgramWorkout() {
  if (!_activeProg) return;
  // AI programs have days directly; static programs looked up by id
  const prog = _activeProg.days
    ? _activeProg
    : TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) return;
  const rawDay = prog.days[_getProgramDayIndex()];
  const day = (typeof window._adaptDay === 'function') ? window._adaptDay(rawDay) : rawDay;
```

Then find and remove the original `const day = prog.days[_getProgramDayIndex()];` line that now comes directly after the replacement (it will be a duplicate — delete it).

- [ ] **Step 4: Update `_activeProg` init to read `forge_ai_program` first**

Find lines 4–6 (current content):
```js
let _activeProg = (() => {
  try { return JSON.parse(localStorage.getItem('forge_active_program') || 'null'); } catch (e) { return null; }
})();
```

Replace with:
```js
let _activeProg = (() => {
  try {
    const ai = localStorage.getItem('forge_ai_program');
    if (ai) return JSON.parse(ai);
    return JSON.parse(localStorage.getItem('forge_active_program') || 'null');
  } catch (e) { return null; }
})();
```

- [ ] **Step 5: Update `renderProgramPanel()` — delegate no-program state + adapt AI days**

Find lines 20–34 (current content):
```js
function renderProgramPanel() {
  const body = document.getElementById('programs-panel-body');
  const badge = document.getElementById('prog-panel-badge');
  if (!body) return;
  if (!_activeProg) {
    if (badge) badge.style.display = 'none';
    body.innerHTML = '<div class="prog-grid">' + TRAINING_PROGRAMS.map(p =>
      `<div class="prog-card" onclick="activateProgram('${p.id}')">` +
      `<div class="prog-card-short" style="color:${p.color}">${p.short}</div>` +
      `<div class="prog-card-name">${p.name}</div>` +
      `<div class="prog-card-desc">${p.desc}</div>` +
      '<button class="prog-card-btn">Activate</button></div>'
    ).join('') + '</div>';
    return;
  }
```

Replace with:
```js
function renderProgramPanel() {
  const body = document.getElementById('programs-panel-body');
  const badge = document.getElementById('prog-panel-badge');
  if (!body) return;
  if (!_activeProg) {
    if (badge) badge.style.display = 'none';
    if (typeof window.renderAIProgramGenerator === 'function') {
      window.renderAIProgramGenerator();
    }
    return;
  }
```

- [ ] **Step 6: Adapt AI program days when rendering active program**

Find lines 36–39 (current content):
```js
  if (badge) badge.style.display = '';
  const prog = TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) { _activeProg = null; renderProgramPanel(); return; }
  const dayIdx = _getProgramDayIndex();
  const day = prog.days[dayIdx];
```

Replace with:
```js
  if (badge) badge.style.display = '';
  // AI programs have days directly; static programs are found by id
  const prog = _activeProg.days
    ? _activeProg
    : TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) { _activeProg = null; renderProgramPanel(); return; }
  const dayIdx = _getProgramDayIndex();
  const rawDay = prog.days[dayIdx];
  const day = (typeof window._adaptDay === 'function') ? window._adaptDay(rawDay) : rawDay;
```

- [ ] **Step 7: Update `deactivateProgram()` to also clear `forge_ai_program`**

Find lines 74–81 (current content):
```js
function deactivateProgram() {
  _activeProg = null;
  localStorage.removeItem('forge_active_program');
  showToast('Program cleared.');
  renderProgramPanel();
  if (typeof renderCoachPlan === 'function') renderCoachPlan();
  if (typeof renderCoachTrain === 'function') renderCoachTrain();
}
```

Replace with:
```js
function deactivateProgram() {
  _activeProg = null;
  localStorage.removeItem('forge_active_program');
  localStorage.removeItem('forge_ai_program');
  showToast('Program cleared.');
  renderProgramPanel();
  if (typeof renderCoachPlan === 'function') renderCoachPlan();
  if (typeof renderCoachTrain === 'function') renderCoachTrain();
}
```

- [ ] **Step 8: Commit**

```bash
git add js/program-panel.js
git commit -m "feat: program-panel reads forge_ai_program first, delegates to AI generator"
```

---

## Task 3: Wire `index.html` + add CSS

**Files:**
- Modify: `index.html` (line 2262)
- Modify: `css/main.css` (append to end)

- [ ] **Step 1: Add script tag to `index.html`**

Find (line 2262):
```html
<script src="js/program-panel.js"></script>
```

Add immediately after:
```html
<script src="js/ai-program-generator.js"></script>
```

- [ ] **Step 2: Append CSS to `css/main.css`**

Append to the very end of `css/main.css`:

```css

/* ── AI Program Generator ────────────────────────────────────── */
.apg-wrap{padding:4px 0 8px;}
.apg-section-title{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;}
.apg-day-count-row{display:flex;gap:8px;margin-bottom:4px;}
.apg-day-count-btn{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;width:44px;height:44px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);cursor:pointer;}
.apg-day-count-btn.active{background:var(--accent);color:#000;border-color:var(--accent);}
.apg-day-slot{margin-bottom:12px;}
.apg-day-slot-label{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);margin-bottom:6px;}
.apg-muscle-chips{display:flex;flex-wrap:wrap;gap:6px;}
.apg-chip{font-family:'DM Mono',monospace;font-size:10px;padding:4px 10px;border-radius:20px;border:1px solid var(--border);background:var(--bg3);color:var(--text3);cursor:pointer;user-select:none;}
.apg-chip.selected{background:var(--accent);color:#000;border-color:var(--accent);}
.apg-generate-btn{width:100%;margin-top:16px;padding:14px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;background:var(--accent);color:#000;border:none;border-radius:10px;cursor:pointer;}
.apg-generate-btn:disabled{opacity:.35;cursor:not-allowed;}
.apg-generating{display:flex;align-items:center;gap:10px;font-family:'DM Mono',monospace;font-size:12px;color:var(--text2);padding:24px 0;}
.apg-spinner{width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:apg-spin .7s linear infinite;flex-shrink:0;}
@keyframes apg-spin{to{transform:rotate(360deg)}}
.apg-preview-name{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--white);margin-bottom:10px;}
.apg-day-strip{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.apg-day-strip-chip{font-family:'DM Mono',monospace;font-size:10px;padding:3px 10px;border-radius:20px;background:var(--bg3);color:var(--text3);border:1px solid var(--border);}
.apg-day-card{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;}
.apg-day-card-label{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:var(--white);margin-bottom:6px;letter-spacing:.5px;}
.apg-exercise-list{display:flex;flex-direction:column;gap:4px;}
.apg-exercise-row{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);}
.apg-refine-row{display:flex;gap:8px;margin-top:14px;align-items:center;}
.apg-refine-input{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);}
.apg-regen-btn{font-family:'DM Mono',monospace;font-size:11px;padding:10px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);cursor:pointer;white-space:nowrap;}
.apg-activate-btn{width:100%;margin-top:10px;padding:14px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;background:var(--accent);color:#000;border:none;border-radius:10px;cursor:pointer;}
.apg-auth-gate{font-family:'DM Mono',monospace;font-size:12px;color:var(--text3);text-align:center;padding:24px 0;}
.apg-error-msg{font-family:'DM Mono',monospace;font-size:11px;color:#ff6b6b;margin-top:6px;}
```

- [ ] **Step 3: Commit**

```bash
git add index.html css/main.css
git commit -m "feat: wire ai-program-generator into index.html and main.css"
```

---

## Task 4: Version bump

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Update version**

Find:
```js
window.FORGE_VERSION = 'v231';
window.FORGE_BUILD   = '2026-03-18 (feat: v231 — Weekly Review Card in Progress tab)';
```

Replace with:
```js
window.FORGE_VERSION = 'v232';
window.FORGE_BUILD   = '2026-03-18 (feat: v232 — AI Program Generator with custom split builder)';
```

- [ ] **Step 2: Commit and push**

```bash
git add js/config.js
git commit -m "feat: v232 — AI Program Generator — custom split, LLM exercises, preview + activate"
git push
```

---

## Post-Shipping Fixes (2026-03-18)

All 4 tasks shipped. Several E2E bugs found and fixed:

1. **"Sign in" shown for logged-in users** — SW serving old JS. Fixed by clearing SW/caches.
2. **"Couldn't generate program"** — `forge-search` was hard-capping `max_tokens` at 500, truncating JSON. Fixed: raised cap to 2000.
3. **JSON corruption on Day 3/4** — Haiku produces malformed JSON for multi-day output. Fixed: switched from 1 call (4 days) → 2 parallel half-calls → **1 call per day in parallel** (`Promise.all`), each with `max_tokens:400` and assistant prefill `\`\`\`json\n[`.
4. **5 JSON repair patterns** added to `_parseDayResponse`: bare exercise name, merged reps, dropped muscles array, unclosed reps, missing open quote.
5. **`forge-search` redeployed** with `prefill` param support (assistant message appended) and `max_tokens` cap 2000.

## Manual Testing Checklist

After implementation, verify in the browser:

- [x] Programs tab with no active program shows split builder (not old template grid)
- [x] Day count buttons [3][4][5][6] switch the number of day slots
- [x] Tapping muscle chips toggles selection (green = selected)
- [x] GENERATE button is disabled when any day has 0 muscles
- [x] GENERATE button triggers spinner + "Building your program…"
- [x] After generation: program name, day strip, day cards with exercises all show correctly
- [x] Exercise rows show "name · sets×reps" format
- [x] Refinement input + REGENERATE sends note to LLM and re-renders preview
- [x] ACTIVATE saves to localStorage `forge_ai_program` and shows confirmation screen
- [x] VIEW ACTIVE PROGRAM shows day label, exercises, weekly schedule strip
- [x] No undefined in DAY label (prog.short optional) or notes (day.note optional)
- [x] START SESSION button loads exercises into workout logger (muscle capitalization fix needed — _adaptDay now capitalizes)
- [x] "Change program" / deactivate clears `forge_ai_program` and returns to split builder
- [x] Guest user (not signed in) sees auth gate message
