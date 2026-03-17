# v222 Coach Real AI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fake rule-based AI in the Coach section with real Claude streaming — Insights plateau hints (4A), session debrief card (5A), and coach bar real LLM (5B).

**Architecture:** Three independent changes in `coach-state.js`, `coach-triggers.js`, `index.html`, and `rag-search.js`. No new files. No new localStorage keys. Each chunk is independently testable. All LLM calls use the existing `forge-search` Supabase edge function pattern from `coach-triggers.js`.

**Tech Stack:** Vanilla JS, Supabase edge function (`forge-search`), Server-Sent Events (SSE) streaming, existing `overload-engine.js` plateau API, existing `coach-triggers.js` cooldown + display pattern.

**Spec:** `docs/superpowers/specs/2026-03-17-coach-enhancement-master.md`

---

## File Map

| File | Change | Purpose |
|------|--------|---------|
| `js/coach-state.js` | Modify `_enhanceInsightsTab()` ~line 473 | Add plateau hint cards below existing KPI cards |
| `js/coach-triggers.js` | Add `generateSessionDebrief()` function | Post-workout 3-line LLM debrief card |
| `js/workout-save.js` | Add call to `FORGE_COACH.generateSessionDebrief()` | Hook debrief into save flow |
| `js/rag-search.js` | Export `buildUserContext` to `window._forgeUserContext` | Expose user context for coach bar LLM calls |
| `index.html` | Modify `_askCoach(idx)` ~line 5301 | Replace rule branches with `forge-search` streaming call |
| `js/config.js` | Bump version v221 → v222 | Version tracking |
| `sw.js` | Bump cache forge-v221 → forge-v222 | Cache invalidation |

---

## Task 1: Insights Plateau Hints (4A)

**Files:**
- Modify: `js/coach-state.js` — `_enhanceInsightsTab()` function (~line 473)

### Step 1.1 — Read the current `_enhanceInsightsTab()` implementation
- [ ] Read `js/coach-state.js` lines 473–515 to understand current card structure
- Expected: See readiness score + nutrition score + 14d trend cards being injected

### Step 1.2 — Read `overload-engine.js` plateau API
- [ ] Read `js/overload-engine.js` — find `getPlateauLength`, `getOverloadContext`, or similar exports
- Expected: Find function signature and what it returns (number of plateau sessions)

### Step 1.3 — Add plateau hint cards to `_enhanceInsightsTab()`
- [ ] In `js/coach-state.js`, inside `_enhanceInsightsTab()`, after the existing KPI card HTML, add:

```js
// Build plateau hint cards
const _allExercises = [];
(window.workouts || []).forEach(w => {
  (w.exercises || []).forEach(ex => {
    if (ex.name && !_allExercises.includes(ex.name)) _allExercises.push(ex.name);
  });
});

const _plateauHints = [];
_allExercises.forEach(exName => {
  const len = typeof window.getPlateauLength === 'function'
    ? window.getPlateauLength(exName)
    : (typeof window.overloadEngine?.getPlateauLength === 'function'
        ? window.overloadEngine.getPlateauLength(exName)
        : 0);
  if (len >= 3) _plateauHints.push({ name: exName, sessions: len });
});
// Sort worst offenders first, cap at 3
_plateauHints.sort((a, b) => b.sessions - a.sessions);
const _topPlateaus = _plateauHints.slice(0, 3);

const _plateauHtml = _topPlateaus.length
  ? `<div class="coach-plateau-hints" style="margin-top:10px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.08em;opacity:.5;margin-bottom:6px;">PLATEAU ALERTS</div>
      ${_topPlateaus.map(p => `
        <div class="coach-bubble warn" style="margin-bottom:6px;cursor:pointer;"
             onclick="window.FORGE_ASK?.openWithQuery('I have a plateau on ${_esc(p.name)}, ${p.sessions} sessions at same weight. What should I change?')">
          <span style="font-size:13px;">⚠️</span>
          <div>
            <div style="font-size:12px;font-weight:600;">${_esc(p.name)} — ${p.sessions} sessions plateaued</div>
            <div style="font-size:11px;opacity:.6;">Tap to ask AI coach for a fix →</div>
          </div>
        </div>`).join('')}
    </div>`
  : '';
```

- [ ] Append `_plateauHtml` to the card HTML string returned/injected by `_enhanceInsightsTab()`

### Step 1.4 — Verify in browser
- [ ] Open app → Coach → Insights tab
- [ ] Expected: If workouts exist with repeated weights, plateau cards appear below KPI cards
- [ ] Expected: Tapping a plateau card opens Ask FORGE with pre-filled query
- [ ] Expected: If no plateaus, section is cleanly absent (no empty box)

### Step 1.5 — Commit
- [ ] Run `node check_v3.js` — expect `Inline OK: 1  External OK: 61  Failed: 0`
- [ ] `git add js/coach-state.js && git commit -m "feat: insights tab — plateau hint cards wired from overload engine (4A)"`

---

## Task 2: Session Debrief Card (5A)

**Files:**
- Modify: `js/coach-triggers.js` — add `generateSessionDebrief()` after existing triggers
- Modify: `js/workout-save.js` — call `FORGE_COACH.generateSessionDebrief()` after save

### Step 2.1 — Read `workout-save.js` save hook points
- [ ] Read `js/workout-save.js` — find where `FORGE_COACH.checkPlateau()` is called
- Expected: Find the post-save block that fires coach triggers, understand `workoutSummary` data available

### Step 2.2 — Read `coach-triggers.js` existing trigger pattern
- [ ] Read `js/coach-triggers.js` lines 1–100 — understand cooldown key pattern, intercept card display, SSE streaming flow
- Expected: See `_cooldown(key)` check → fetch forge-search → stream tokens → `_showIntercept(icon, html)` or similar display

### Step 2.3 — Add `generateSessionDebrief()` to `coach-triggers.js`
- [ ] Add after the last existing trigger function (before closing `window.FORGE_COACH = {` exports):

```js
async function generateSessionDebrief(summary) {
  const dateKey = new Date().toDateString();
  const cdKey = 'session_debrief_' + dateKey;
  if (_cooldown(cdKey)) return;
  _setCooldown(cdKey);

  // Build summary string from workout data
  const musclesStr = (summary?.muscles || []).join(', ') || 'unknown muscles';
  const setsStr = summary?.totalSets || '?';
  const volDelta = summary?.volumeDelta != null
    ? (summary.volumeDelta >= 0 ? `+${summary.volumeDelta}%` : `${summary.volumeDelta}%`) + ' vs last session'
    : '';
  const goal = window.userProfile?.goal || 'muscle';

  const query = `Workout complete: ${setsStr} sets on ${musclesStr}${volDelta ? ', ' + volDelta : ''}. Goal: ${goal}. Give a 3-line debrief: (1) what was accomplished, (2) overload verdict, (3) recovery recommendation. Be direct, max 120 words.`;

  // Show loading card
  const card = _showIntercept('💬', '<em>Generating session debrief…</em>');

  try {
    const ctx = typeof window._forgeUserContext === 'function' ? window._forgeUserContext() : '';
    const resp = await fetch(`${window.FORGE_CONFIG.SUPABASE_URL}/functions/v1/forge-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.FORGE_CONFIG.SUPABASE_ANON}`
      },
      body: JSON.stringify({
        query,
        user_context: ctx,
        coach_mode: true,
        coach_system: 'You are FORGE, a direct elite coach. Give a 3-line post-workout debrief. Line 1: what was done. Line 2: overload verdict. Line 3: recovery recommendation. Max 120 words total.',
        max_tokens: 150
      })
    });
    if (!resp.ok) { _removeIntercept(card); return; }
    await _streamToCard(resp, card);
  } catch (e) {
    _removeIntercept(card);
  }
}
```

- [ ] Add `generateSessionDebrief` to the `window.FORGE_COACH` export object at bottom of file

### Step 2.4 — Read `coach-triggers.js` to find `_showIntercept`, `_removeIntercept`, `_streamToCard` helpers
- [ ] Check if these helpers exist or if the pattern is different (may be inline in each trigger)
- [ ] Adapt Step 2.3 code to match actual helper function names/patterns in the file

### Step 2.5 — Call debrief from `workout-save.js`
- [ ] In `workout-save.js`, after the `FORGE_COACH.checkPlateau()` call, add:

```js
if (typeof FORGE_COACH?.generateSessionDebrief === 'function') {
  // Build lightweight summary for debrief
  const _debriefSummary = {
    muscles: Array.from(new Set((savedWorkout?.exercises || []).map(e => e.muscle).filter(Boolean))),
    totalSets: (savedWorkout?.exercises || []).reduce((n, e) => n + (e.sets?.length || 0), 0),
    volumeDelta: null // TODO: compute vs last session if available
  };
  FORGE_COACH.generateSessionDebrief(_debriefSummary);
}
```

### Step 2.6 — Verify in browser
- [ ] Log a workout (any 2-3 sets) → Save
- [ ] Expected: Debrief card appears in Log tab with 3-line coach response
- [ ] Expected: Tapping the card dismisses it (or it auto-dismisses after 30s)
- [ ] Expected: Saving another workout same day does NOT show a second debrief (cooldown)

### Step 2.7 — Commit
- [ ] Run `node check_v3.js` — expect clean pass
- [ ] `git add js/coach-triggers.js js/workout-save.js && git commit -m "feat: session debrief card — LLM 3-line post-workout debrief after save (5A)"`

---

## Task 3: Coach Bar Real LLM (5B)

**Files:**
- Modify: `js/rag-search.js` — export `buildUserContext` to `window._forgeUserContext`
- Modify: `index.html` — replace `_askCoach(idx)` rule branches with `forge-search` streaming call

### Step 3.1 — Read `rag-search.js` to find `buildUserContext` definition and file end
- [ ] Read `js/rag-search.js` — find `function buildUserContext()` and find the bottom of the file
- Expected: `buildUserContext` is a local function around line 109–258; file ends with `window.FORGE_ASK = {...}`

### Step 3.2 — Export `buildUserContext` to window
- [ ] In `js/rag-search.js`, at the very bottom (after `window.FORGE_ASK = {...}`), add:

```js
// Expose user context builder for inline coach calls
window._forgeUserContext = buildUserContext;
```

### Step 3.3 — Read current `_askCoach(idx)` in `index.html`
- [ ] Read `index.html` lines 5286–5410 to understand full current structure
- Expected: `_renderAskChips()` renders 5 question buttons; `_askCoach(idx)` has 5 branches (idx 0-4) rendering static HTML into `.coach-bubble.ask-answer`

### Step 3.4 — Replace `_askCoach(idx)` with real LLM call
- [ ] In `index.html`, replace the entire `_askCoach(idx)` function body with:

```js
function _askCoach(idx) {
  const questions = _ar
    ? ["ماذا أتمرن اليوم؟","هل عندي إفراط في التمرين؟","كيف توازني العضلي؟","كيف التقدم؟","كم أحتاج بروتين؟"]
    : ["What to train today?","Am I overtraining?","How's my balance?","How's my progress?","How much protein do I need?"];
  const q = questions[idx];
  if (!q) return;

  // Switch to Insights tab to show answer
  if (typeof coachSwitchTab === 'function') coachSwitchTab('insights');

  // Find or create answer bubble
  let bubble = document.querySelector('.coach-bubble.ask-answer');
  if (!bubble) {
    const wrap = document.getElementById('coach-body');
    if (!wrap) return;
    bubble = document.createElement('div');
    bubble.className = 'coach-bubble ask-answer';
    wrap.prepend(bubble);
  }
  bubble.innerHTML = `<span style="opacity:.5;font-size:12px;">Asking coach: "${_esc(q)}"…</span>`;
  bubble.style.display = 'block';

  // Try real LLM; fall back to rule-based on failure
  const _fallback = () => _askCoachFallback(idx, bubble);

  if (!window.FORGE_CONFIG?.SUPABASE_URL) { _fallback(); return; }

  const ctx = typeof window._forgeUserContext === 'function' ? window._forgeUserContext() : '';

  fetch(`${window.FORGE_CONFIG.SUPABASE_URL}/functions/v1/forge-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${window.FORGE_CONFIG.SUPABASE_ANON}`
    },
    body: JSON.stringify({
      query: q,
      user_context: ctx,
      coach_mode: true,
      coach_system: 'You are FORGE coach. Answer the athlete\'s question directly and concisely. Max 2 sentences. Use their actual data.',
      max_tokens: 150
    })
  }).then(async resp => {
    if (!resp.ok) { _fallback(); return; }
    bubble.innerHTML = '';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.token) { text += d.token; bubble.textContent = text; }
          } catch (_) {}
        }
      }
    }
    if (!text.trim()) _fallback();
  }).catch(() => _fallback());
}
```

### Step 3.5 — Add `_askCoachFallback(idx, bubble)` with old rule-based logic
- [ ] Rename current `_askCoach(idx)` body to `_askCoachFallback(idx, bubble)` so existing rule-based answers still work as offline fallback
- [ ] The fallback function writes its answer HTML into `bubble.innerHTML` instead of finding/creating the element

### Step 3.6 — Verify in browser
- [ ] Coach → Insights tab → tap any chip (e.g., "What to train today?")
- [ ] Expected: "Asking coach…" loading text appears, then streams real LLM answer
- [ ] Expected: Answer is 1-2 sentences, direct, references actual training data
- [ ] Expected: Offline / API error → fallback rule-based answer shown instead
- [ ] Test all 5 chips work

### Step 3.7 — Commit
- [ ] Run `node check_v3.js` — expect clean pass
- [ ] `git add js/rag-search.js index.html && git commit -m "feat: coach bar real LLM — _askCoach streams Claude via forge-search, rule fallback retained (5B)"`

---

## Task 4: Version Bump & Final Validation

### Step 4.1 — Bump version
- [ ] In `js/config.js`: `v221` → `v222`, update FORGE_BUILD string:
  ```
  '2026-03-17 (feat: coach real AI — insights plateau hints, session debrief, coach bar streams Claude)'
  ```
- [ ] In `sw.js`: `forge-v221` → `forge-v222`

### Step 4.2 — Run syntax check
- [ ] Run: `node check_v3.js`
- [ ] Expected output: `Inline OK: 1  External OK: 61  Failed: 0`

### Step 4.3 — Full E2E verification
- [ ] Load app → Continue as Guest
- [ ] Coach → Insights → plateau cards visible (if workouts exist with plateaus)
- [ ] Coach → Insights → tap a chip → real LLM answer streams in
- [ ] Log → log any workout → save → debrief card appears
- [ ] Version shows `v222` in footer

### Step 4.4 — Final commit and push
- [ ] `git add js/config.js sw.js`
- [ ] ```bash
  git commit -m "feat: v222 — coach real AI (insights plateau hints 4A, session debrief 5A, coach bar LLM 5B)"
  ```
- [ ] `git push`

### Step 4.5 — Update NotebookLM and memory
- [ ] Add v222 changelog to NotebookLM notebook `7c996554-2fb9-43e9-9e48-dea7816233fe`
- [ ] Update `memory/project_forge_roadmap.md` with v222 entry

---

## Upcoming Plans (reference)

| Version | Plan File | Status |
|---------|-----------|--------|
| v223 | `2026-03-17-phase1-recovery-heatmap-macro-steering.md` | Ready to execute |
| v224 | `2026-03-17-phase2-ghost-mode-adaptive-timer.md` | Ready to execute |
| v225 | `2026-03-17-phase3-voice-to-log-rag-form-check.md` | Ready to execute |
| v226 | TBD — 4B-F + 5C-D | Needs plan |
