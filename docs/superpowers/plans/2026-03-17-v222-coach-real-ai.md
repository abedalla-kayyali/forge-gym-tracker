# v222 Coach Real AI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fake rule-based AI in the Coach section with real Claude streaming — Insights plateau hints (4A), session debrief card (5A), and coach bar real LLM (5B).

**Architecture:** Three independent changes across `coach-state.js`, `coach-triggers.js`, `index.html`, and `rag-search.js`. No new files. No new localStorage keys. Each chunk is independently testable. All LLM calls follow the auth pattern in `coach-triggers.js` (session token via `window._sb.auth.getSession()`, not anon key). Hook point for 5A is `_runPostSaveAsyncHooks()` in `index.html` (~line 8505), not `workout-save.js`.

**Tech Stack:** Vanilla JS, Supabase edge function (`forge-search`), SSE streaming, `window.FORGE_OVERLOAD.getPlateauLength` API from `overload-engine.js`, `window.FORGE_STORAGE.esc()` for XSS safety in `coach-state.js`.

**Spec:** `docs/superpowers/specs/2026-03-17-coach-enhancement-master.md`

---

## File Map

| File | Change | Purpose |
|------|--------|---------|
| `js/coach-state.js` | Modify `_enhanceInsightsTab()` ~line 473 | Add plateau hint cards using `window.FORGE_OVERLOAD.getPlateauLength` |
| `js/coach-triggers.js` | Add `generateSessionDebrief()` function | Post-workout 3-line LLM debrief card |
| `index.html` | Add debrief call in `_runPostSaveAsyncHooks()` ~line 8505 | Hook debrief into save flow |
| `js/rag-search.js` | Export `buildUserContext` to `window._forgeUserContext` | Expose user context for coach bar LLM calls |
| `index.html` | Modify `_askCoach(idx)` ~line 5301 | Replace rule branches with `forge-search` streaming; add `_askCoachFallback` |
| `js/config.js` | Bump v221 → v222 | Version tracking |
| `sw.js` | Bump forge-v221 → forge-v222 | Cache invalidation |

---

## Task 1: Insights Plateau Hints (4A)

**Files:**
- Modify: `js/coach-state.js` — `_enhanceInsightsTab()` function (~line 473)

### Step 1.1 — Read `_enhanceInsightsTab()` and confirm `window.FORGE_OVERLOAD` API
- [ ] Read `js/coach-state.js` lines 473–515 to understand current card structure and injection point
- [ ] Read `js/overload-engine.js` — confirm `window.FORGE_OVERLOAD.getPlateauLength(exerciseName)` exists and what it returns (integer: consecutive sessions at same weight)
- [ ] Read `js/coach-triggers.js` lines 130–155 — confirm the call pattern: `window.FORGE_OVERLOAD?.getPlateauLength?.(exerciseName)`
- Expected: `FORGE_OVERLOAD.getPlateauLength` is the correct namespace (not `window.getPlateauLength` or `window.overloadEngine`)

### Step 1.2 — Confirm XSS helper available in `coach-state.js` scope
- [ ] Check how other HTML strings in `coach-state.js` escape user data
- Expected: Use `window.FORGE_STORAGE?.esc?.(str) || str` pattern (not bare `_esc()` which is index.html scoped)

### Step 1.3 — Add plateau hint cards to `_enhanceInsightsTab()`
- [ ] In `js/coach-state.js`, inside `_enhanceInsightsTab()`, after the existing KPI card HTML, add:

```js
// Build plateau hint cards using overload engine
const _allExercises = [];
(window.workouts || []).forEach(w => {
  (w.exercises || []).forEach(ex => {
    if (ex.name && !_allExercises.includes(ex.name)) _allExercises.push(ex.name);
  });
});

const _esc2 = s => window.FORGE_STORAGE?.esc?.(s) || String(s).replace(/[<>"'&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c]));

const _plateauHints = [];
_allExercises.forEach(exName => {
  const len = window.FORGE_OVERLOAD?.getPlateauLength?.(exName) ?? 0;
  if (len >= 3) _plateauHints.push({ name: exName, sessions: len });
});
_plateauHints.sort((a, b) => b.sessions - a.sessions);
const _topPlateaus = _plateauHints.slice(0, 3);

const _plateauHtml = _topPlateaus.length
  ? `<div class="coach-plateau-hints" style="margin-top:10px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.08em;opacity:.5;margin-bottom:6px;">PLATEAU ALERTS</div>
      ${_topPlateaus.map(p => `
        <div class="coach-bubble warn" style="margin-bottom:6px;cursor:pointer;"
             onclick="window.FORGE_ASK?.openWithQuery('I have a plateau on ${_esc2(p.name)}, ${p.sessions} sessions at same weight. What should I change?')">
          <span style="font-size:13px;">&#x26A0;&#xFE0F;</span>
          <div>
            <div style="font-size:12px;font-weight:600;">${_esc2(p.name)} &mdash; ${p.sessions} sessions plateaued</div>
            <div style="font-size:11px;opacity:.6;">Tap to ask AI coach for a fix &rarr;</div>
          </div>
        </div>`).join('')}
    </div>`
  : '';
```

- [ ] Append `_plateauHtml` to the HTML string returned/injected by `_enhanceInsightsTab()`

### Step 1.4 — Verify in browser
- [ ] Open app → Coach → Insights tab
- [ ] Expected: Plateau cards appear for any exercise with 3+ same-weight sessions
- [ ] Expected: Tapping opens Ask FORGE with pre-filled query
- [ ] Expected: If no plateaus, section cleanly absent (no empty box)

### Step 1.5 — Commit
- [ ] Run `node check_v3.js` — expect `Inline OK: 1  External OK: 61  Failed: 0`
- [ ] `git add js/coach-state.js && git commit -m "feat: insights tab — plateau hint cards wired from overload engine (4A)"`

---

## Task 2: Session Debrief Card (5A)

**Files:**
- Modify: `js/coach-triggers.js` — add `generateSessionDebrief()` function
- Modify: `index.html` — add call in `_runPostSaveAsyncHooks()` ~line 8505

### Step 2.1 — Read `coach-triggers.js` auth + streaming pattern
- [ ] Read `js/coach-triggers.js` lines 1–100 fully
- Expected: Auth uses `window._sb?.auth?.getSession()` to get `access_token`; streaming uses inline `reader.read()` loop with SSE `data:` line parsing; display uses `_showInterceptCard(icon, html)` or similar helper
- Note the exact helper names used for: showing a card, updating card text during streaming, and the cooldown check pattern (`_cd` object or similar)

### Step 2.2 — Read `index.html` post-save async hooks location
- [ ] Read `index.html` — search for `_runPostSaveAsyncHooks` to find its definition (~line 8505)
- [ ] Also note how other async coach calls are dispatched there (setTimeout delays, existing calls)
- Expected: Find the function body and the pattern for adding a new delayed async call

### Step 2.3 — Compute `volumeDelta` for richer debrief
- [ ] In the hook in `index.html` (Step 2.5 below), compute volume delta before passing to debrief:
```js
// Compute volume delta vs same muscles last session
const _lastMatchIdx = (window.workouts || []).slice(0, -1).reverse().findIndex(w =>
  (w.exercises || []).some(e => _debriefMuscles.includes(e.muscle))
);
let _volDelta = null;
if (_lastMatchIdx >= 0) {
  const _prevW = (window.workouts || []).slice(0, -1).reverse()[_lastMatchIdx];
  const _prevVol = (_prevW.exercises || []).reduce((n, e) => n + (e.totalVolume || 0), 0);
  const _curVol = (_savedEx || []).reduce((n, e) => n + (e.totalVolume || 0), 0);
  if (_prevVol > 0) _volDelta = Math.round(((_curVol - _prevVol) / _prevVol) * 100);
}
```

### Step 2.4 — Add `generateSessionDebrief()` to `coach-triggers.js`
- [ ] Add the function after the last existing trigger function, before the `window.FORGE_COACH = {}` export block
- [ ] Follow the exact auth + streaming pattern found in Step 2.1 — do NOT use `SUPABASE_ANON` as the Bearer token
- [ ] Template:

```js
async function generateSessionDebrief(summary) {
  const dateKey = new Date().toDateString();
  const cdKey = 'session_debrief_' + dateKey;
  if (_cd[cdKey] && (Date.now() - _cd[cdKey]) < 86400000) return; // once per day
  _cd[cdKey] = Date.now();

  // Auth: get live session token (same pattern as other triggers)
  const session = await window._sb?.auth?.getSession?.();
  const token = session?.data?.session?.access_token;
  if (!token) return; // guests skip debrief

  const musclesStr = (summary?.muscles || []).join(', ') || 'unknown muscles';
  const setsStr = summary?.totalSets ?? '?';
  const volPart = summary?.volumeDelta != null
    ? `, ${summary.volumeDelta >= 0 ? '+' : ''}${summary.volumeDelta}% volume vs last session`
    : '';
  const goal = window.userProfile?.goal || 'muscle';

  const query = `Workout complete: ${setsStr} sets on ${musclesStr}${volPart}. Goal: ${goal}. Give a 3-line debrief: (1) what was accomplished, (2) overload verdict, (3) recovery recommendation. Max 120 words.`;

  // Show loading card — use the same display helper as other triggers
  // Replace _showInterceptCard with the actual helper name found in Step 2.1
  const card = _showInterceptCard('💬', '<em style="opacity:.5">Generating session debrief…</em>');
  if (!card) return;

  // Auto-dismiss on tap
  card.addEventListener('click', () => card.remove());

  try {
    const resp = await fetch(`${window.FORGE_CONFIG.SUPABASE_URL}/functions/v1/forge-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        coach_mode: true,
        coach_system: 'You are FORGE. Give a 3-line post-workout debrief. Line 1: accomplished. Line 2: overload verdict. Line 3: recovery. Max 120 words.',
        max_tokens: 150
      })
    });
    if (!resp.ok) { card.remove(); return; }

    // Stream tokens into card (follow exact streaming pattern from Step 2.1)
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '';
    card.textContent = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const ln of lines) {
        if (ln.startsWith('data:')) {
          try { const d = JSON.parse(ln.slice(5).trim()); if (d.token) { text += d.token; card.textContent = text; } } catch (_) {}
        }
      }
    }
    if (!text.trim()) card.remove();
    else setTimeout(() => card?.remove(), 30000); // auto-dismiss after 30s
  } catch (e) { card.remove(); }
}
```

- [ ] Add `generateSessionDebrief` to `window.FORGE_COACH` export object

### Step 2.5 — Hook into `_runPostSaveAsyncHooks()` in `index.html`
- [ ] Inside `_runPostSaveAsyncHooks()`, add after the existing async coach calls:

```js
// Session debrief (5A) — fires 2s after save to not compete with plateau tip
setTimeout(() => {
  if (typeof FORGE_COACH?.generateSessionDebrief === 'function') {
    const _savedEx = (window.workouts || []).slice(-1)[0]?.exercises || [];
    const _debriefMuscles = Array.from(new Set(_savedEx.map(e => e.muscle).filter(Boolean)));
    // Compute volumeDelta (see plan Task 2, Step 2.3)
    const _lastMatchIdx = (window.workouts || []).slice(0, -1).reverse()
      .findIndex(w => (w.exercises || []).some(e => _debriefMuscles.includes(e.muscle)));
    let _volDelta = null;
    if (_lastMatchIdx >= 0) {
      const _prevW = (window.workouts || []).slice(0, -1).reverse()[_lastMatchIdx];
      const _prevVol = (_prevW.exercises || []).reduce((n, e) => n + (e.totalVolume || 0), 0);
      const _curVol = _savedEx.reduce((n, e) => n + (e.totalVolume || 0), 0);
      if (_prevVol > 0) _volDelta = Math.round(((_curVol - _prevVol) / _prevVol) * 100);
    }
    FORGE_COACH.generateSessionDebrief({
      muscles: _debriefMuscles,
      totalSets: _savedEx.reduce((n, e) => n + (e.sets?.length || 0), 0),
      volumeDelta: _volDelta
    });
  }
}, 2000);
```

### Step 2.6 — Verify in browser (logged-in user only — debrief skips guests)
- [ ] Log in → log any workout (2-3 sets) → save
- [ ] Expected: 2 seconds after save, debrief card appears in Log tab
- [ ] Expected: Card streams 3-line response from Claude
- [ ] Expected: Card auto-dismisses after 30 seconds OR when tapped
- [ ] Expected: Save another workout same day → no second debrief card (cooldown)

### Step 2.7 — Commit
- [ ] Run `node check_v3.js` — expect clean pass
- [ ] `git add js/coach-triggers.js index.html && git commit -m "feat: session debrief card — LLM 3-line post-workout debrief with volume delta (5A)"`

---

## Task 3: Coach Bar Real LLM (5B)

**Files:**
- Modify: `js/rag-search.js` — export `buildUserContext` to `window._forgeUserContext`
- Modify: `index.html` — replace `_askCoach(idx)` + add `_askCoachFallback(idx, bubble)`

### Step 3.1 — Read `rag-search.js` to confirm `buildUserContext` location and file end
- [ ] Read `js/rag-search.js` — find `function buildUserContext()` (around line 109) and the bottom of the file
- Expected: File ends with `window.FORGE_ASK = { open, openWithQuery }` block

### Step 3.2 — Export `buildUserContext` to window
- [ ] In `js/rag-search.js`, add at the very bottom (after `window.FORGE_ASK = {...}`):

```js
// Expose user context builder for inline coach calls
window._forgeUserContext = buildUserContext;
```

### Step 3.3 — Read current `_askCoach(idx)` fully
- [ ] Read `index.html` lines 5286–5410 to see full current structure
- Expected:
  - `_renderAskChips()` at ~5286 renders 5 chip buttons calling `_askCoach(idx)`
  - `_askCoach(idx)` at ~5301 has 5 branches (0-4) each building HTML into a `.ask-answer` bubble
  - There is a `body.querySelectorAll('.ask-answer').forEach(e => e.remove())` clear-all line at the top of `_askCoach`
- Note the exact line numbers so you can replace the full function

### Step 3.4 — Add `_askCoachFallback(idx, bubble)` preserving old rule-based logic
- [ ] Extract the current `_askCoach(idx)` body (the 5-branch logic) into a new function `_askCoachFallback(idx, bubble)`:
  - Remove the "clear all `.ask-answer`" line from the fallback (caller controls the bubble)
  - Change all places that create/find the answer element to instead write directly to the `bubble` param passed in
  - Keep all existing rule-based answer HTML logic intact

### Step 3.5 — Replace `_askCoach(idx)` with real LLM + fallback
- [ ] Replace the full `_askCoach(idx)` function with:

```js
async function _askCoach(idx) {
  const questions = _ar
    ? ["ماذا أتمرن اليوم؟","هل عندي إفراط في التمرين؟","كيف توازني العضلي؟","كيف التقدم؟","كم أحتاج بروتين؟"]
    : ["What to train today?","Am I overtraining?","How's my balance?","How's my progress?","How much protein do I need?"];
  const q = questions[idx];
  if (!q) return;

  // Switch to Insights tab
  if (typeof coachSwitchTab === 'function') coachSwitchTab('insights');

  // Remove any existing answer bubbles (was previously a querySelectorAll clear)
  document.querySelectorAll('#coach-body .ask-answer').forEach(e => e.remove());

  // Create fresh answer bubble
  const wrap = document.getElementById('coach-body');
  if (!wrap) return;
  const bubble = document.createElement('div');
  bubble.className = 'coach-bubble ask-answer';
  bubble.innerHTML = `<span style="opacity:.5;font-size:12px;">${_esc(q)}&hellip;</span>`;
  wrap.prepend(bubble);

  const _fallback = () => _askCoachFallback(idx, bubble);

  // Get session token — guests fall back to rule-based
  const session = await window._sb?.auth?.getSession?.();
  const token = session?.data?.session?.access_token;
  if (!token) { _fallback(); return; }

  const ctx = typeof window._forgeUserContext === 'function' ? window._forgeUserContext() : '';

  try {
    const resp = await fetch(`${window.FORGE_CONFIG.SUPABASE_URL}/functions/v1/forge-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: q,
        user_context: ctx,
        coach_mode: true,
        coach_system: 'You are FORGE coach. Answer the athlete\'s question directly in 1-2 sentences. Reference their actual training data.',
        max_tokens: 150
      })
    });
    if (!resp.ok) { _fallback(); return; }

    bubble.innerHTML = '';
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const ln of lines) {
        if (ln.startsWith('data:')) {
          try { const d = JSON.parse(ln.slice(5).trim()); if (d.token) { text += d.token; bubble.textContent = text; } } catch (_) {}
        }
      }
    }
    if (!text.trim()) _fallback();
  } catch (e) { _fallback(); }
}
```

### Step 3.6 — Verify in browser (logged-in and guest)
- [ ] **Logged-in user:** Coach → Insights → tap "What to train today?" → streams real Claude answer
- [ ] **Guest user:** same tap → fallback rule-based answer appears (no crash, no blank bubble)
- [ ] All 5 chips tested
- [ ] Arabic mode: tap chips → same LLM flow works (questions in Arabic, same fetch)

### Step 3.7 — Commit
- [ ] Run `node check_v3.js` — expect clean pass
- [ ] `git add js/rag-search.js index.html && git commit -m "feat: coach bar real LLM — _askCoach streams Claude via forge-search, auth-gated, rule fallback (5B)"`

---

## Task 4: Version Bump & Final Validation

### Step 4.1 — Bump version
- [ ] `js/config.js`: `v221` → `v222`
  ```js
  window.FORGE_VERSION = 'v222';
  window.FORGE_BUILD   = '2026-03-17 (feat: coach real AI — insights plateau hints, session debrief, coach bar streams Claude)';
  ```
- [ ] `sw.js`: `forge-v221` → `forge-v222`

### Step 4.2 — Syntax check
- [ ] Run: `node check_v3.js`
- [ ] Expected: `Inline OK: 1  External OK: 61  Failed: 0`

### Step 4.3 — E2E verification
- [ ] App loads, guest mode works, version shows v222
- [ ] Coach → Insights: plateau cards for plateaued exercises, empty if none
- [ ] Coach → Insights: tap chip → LLM streams (logged-in) / rule answer (guest)
- [ ] Log workout → save → debrief card after 2s (logged-in only)

### Step 4.4 — Final commit and push
- [ ] `git add js/config.js sw.js`
- [ ] `git commit -m "feat: v222 — coach real AI (plateau hints 4A, session debrief 5A, coach bar LLM 5B)"`
- [ ] `git push`

### Step 4.5 — Update memory and NotebookLM
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
