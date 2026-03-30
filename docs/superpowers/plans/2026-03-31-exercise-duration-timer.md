# Exercise Duration Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track how long the user spends logging each exercise — from first set added to LOG WORKOUT pressed — and save that duration for history and analytics.

**Architecture:** Two module-level globals mirror the existing `_sessionActive` / `_sessionWkStart` pattern. A MutationObserver (matching the existing `_wireSaveBtnObserver` pattern) watches `#sets-container` to start the timer on the first set. Timer stops and saves `durationSecs` inside both save function `setTimeout` callbacks. A live `#ex-timer-display` element above the LOG WORKOUT button shows elapsed time in MM:SS.

**Tech Stack:** Vanilla JS (index.html inline script), CSS (css/main.css), js/workout-save.js

**Spec:** `docs/superpowers/specs/2026-03-31-exercise-duration-timer-design.md`

---

## File Map

| File | Change |
|---|---|
| `index.html` | Add 2 globals (~line 2505), add `_updateExTimerDisplay` + `_resetExTimer` functions, add timer MutationObserver IIFE, add `#ex-timer-display` HTML (~line 811), call `_resetExTimer()` at end of `selectMuscle` (~line 3829) |
| `js/workout-save.js` | Add `durationSecs` to `_wkEntry` + `_sessionWkLogs` push + `_resetExTimer()` call inside the `setTimeout` callback of `_saveWeightedWorkout` (~line 96); same inside `saveBwWorkout` setTimeout (~line 284) |
| `css/main.css` | Append `.ex-timer`, `.ex-timer__label`, `.ex-timer__value` rules at end of file |

---

## Task 1: Globals, helpers, and CSS foundations

**Files:**
- Modify: `index.html` (around line 2505 — session timer globals block)
- Modify: `css/main.css` (append to end)

No automated tests exist in this vanilla JS project. Verification is by loading `index.html` in a browser and checking console for errors and DOM for the expected elements/styles.

- [ ] **Step 1: Add the two timer globals to `index.html`**

  Find this block (around line 2504–2505):
  ```js
  let _sessionActive = false;
  let _sessionWkStart = null;
  ```
  Insert two new lines immediately after:
  ```js
  let _exTimerStart    = null;   // Date.now() when first set is added
  let _exTimerInterval = null;   // setInterval handle for live display
  ```

- [ ] **Step 2: Add `_updateExTimerDisplay` and `_resetExTimer` functions to `index.html`**

  Find the block that contains `function startWorkoutSession()` (around line 2749). Add the two new helper functions **before** `startWorkoutSession`:

  ```js
  function _updateExTimerDisplay() {
    if (!_exTimerStart) return;
    const elapsed = Math.floor((Date.now() - _exTimerStart) / 1000);
    const mm = Math.floor(elapsed / 60);
    const ss = String(elapsed % 60).padStart(2, '0');
    const el = document.getElementById('ex-timer-value');
    if (el) el.textContent = mm + ':' + ss;
  }

  function _resetExTimer() {
    clearInterval(_exTimerInterval);
    _exTimerStart = null;
    _exTimerInterval = null;
    const disp = document.getElementById('ex-timer-display');
    if (disp) disp.style.display = 'none';
    const val = document.getElementById('ex-timer-value');
    if (val) val.textContent = '0:00';
  }
  ```

- [ ] **Step 3: Append CSS to `css/main.css`**

  Append to the very end of `css/main.css`:

  ```css
  /* ── Exercise Duration Timer ── */
  .ex-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    margin-bottom: 10px;
    background: rgba(84,255,171,0.06);
    border: 1px solid rgba(84,255,171,0.25);
    border-radius: 10px;
  }
  .ex-timer__label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: rgba(84,255,171,0.65);
    letter-spacing: 0.08em;
  }
  .ex-timer__value {
    font-family: 'DM Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    color: #54ffab;
    letter-spacing: 0.04em;
  }
  ```

- [ ] **Step 4: Verify in browser**

  Open `index.html`. Open DevTools console. Run:
  ```js
  typeof _exTimerStart    // should log: "object" (null is object)
  typeof _exTimerInterval // should log: "object"
  typeof _resetExTimer    // should log: "function"
  typeof _updateExTimerDisplay // should log: "function"
  ```
  No console errors expected.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html css/main.css
  git commit -m "feat(ex-timer): add globals, helper functions, and CSS"
  ```

---

## Task 2: HTML display element + MutationObserver wire-up

**Files:**
- Modify: `index.html` (line 812 — before `#save-sticky`; and after line 9804 — after `_wireSaveBtnObserver` IIFE)

- [ ] **Step 1: Insert `#ex-timer-display` HTML above the LOG WORKOUT button**

  Find this exact line in `index.html` (around line 812):
  ```html
  <div class="save-sticky" id="save-sticky"><button class="btn btn-primary" id="save-btn"
  ```
  Insert the following **immediately before** that line:
  ```html
  <div id="ex-timer-display" class="ex-timer" style="display:none">
    <span class="ex-timer__label">EXERCISE TIME</span>
    <span id="ex-timer-value" class="ex-timer__value">0:00</span>
  </div>
  ```

- [ ] **Step 2: Add MutationObserver IIFE to start timer on first set**

  The `addSet` function is not directly accessible as a top-level declaration (it is encapsulated in an IIFE). The established codebase pattern for reacting to set-container DOM changes is MutationObserver — see the existing `_wireSaveBtnObserver` IIFE at line 9782 which uses the identical approach. We follow that pattern here.

  The observer only fires when child nodes are **added** (not on reset, since `innerHTML = ''` triggers a remove mutation, not add). When `_resetExTimer()` clears `_exTimerStart`, subsequent add mutations will correctly restart the timer. The IIFE runs once at page load — there is no re-render path that would re-execute it, so double-registration is not possible.

  Find this comment block in `index.html` (around line 9806):
  ```js
  // ???????????????????????????????????????????
  //  END-SESSION NUDGE (pulse after 3+ exercises)
  ```
  Insert the following **immediately before** that comment:

  ```js
  // Wire exercise timer: start on first set added to #sets-container
  (function _wireExTimer() {
    function _attach() {
      const container = document.getElementById('sets-container');
      if (!container) { setTimeout(_attach, 1000); return; }
      const obs = new MutationObserver(mutations => {
        // Only fire on node additions (not on innerHTML clear / removals)
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (!hasNewNodes) return;
        // Only start the timer once; subsequent sets are no-ops
        if (!_exTimerStart) {
          _exTimerStart = Date.now();
          _exTimerInterval = setInterval(_updateExTimerDisplay, 1000);
          const disp = document.getElementById('ex-timer-display');
          if (disp) disp.style.display = 'flex';
        }
      });
      obs.observe(container, { childList: true });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _attach);
    } else {
      _attach();
    }
  })();
  ```

- [ ] **Step 3: Verify in browser**

  1. Open `index.html`, go to the workout tab.
  2. Select a muscle group and an exercise.
  3. Press `+ Add Set` — the green `EXERCISE TIME` timer should appear above the LOG WORKOUT button and start ticking (e.g., 0:01, 0:02…).
  4. Press `+ Add Set` again — timer should NOT reset; it keeps running.
  5. No console errors.

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat(ex-timer): show live timer above LOG WORKOUT on first set added"
  ```

---

## Task 3: Save `durationSecs` in `_saveWeightedWorkout`

**Files:**
- Modify: `js/workout-save.js` (inside the `setTimeout` callback starting at line 96)

> **Critical:** All changes must go **inside** the existing `setTimeout(() => {` callback. The `durationSecs` computation and `_resetExTimer()` call must be inside this callback, not after it.

- [ ] **Step 1: Add `durationSecs` to `_wkEntry` in `workout-save.js`**

  Inside the `setTimeout` callback (around line 96), find the `_wkEntry` object literal (line 102):
  ```js
  const _wkEntry = {
    id: _forgeRecordId('wk'), date: new Date().toISOString(),
    muscle: selectedMuscle, exercise: name, sets, notes: '',
    angle: (typeof selectedAngle !== 'undefined' ? selectedAngle : null),
    totalVolume: sets.filter(s => s.type !== 'warmup').reduce((a, s) => a + s.reps * s.weight, 0), isPR,
    effort: _selectedEffort
  };
  ```
  Add the `durationSecs` computation **immediately before** `const _wkEntry`:
  ```js
  const durationSecs = _exTimerStart
    ? Math.round((Date.now() - _exTimerStart) / 1000)
    : 0;
  ```
  Then add `durationSecs` to `_wkEntry`:
  ```js
  const _wkEntry = {
    id: _forgeRecordId('wk'), date: new Date().toISOString(),
    muscle: selectedMuscle, exercise: name, sets, notes: '',
    angle: (typeof selectedAngle !== 'undefined' ? selectedAngle : null),
    totalVolume: sets.filter(s => s.type !== 'warmup').reduce((a, s) => a + s.reps * s.weight, 0), isPR,
    effort: _selectedEffort,
    durationSecs
  };
  ```

- [ ] **Step 2: Add `durationSecs` to the `_sessionWkLogs.push` call**

  Find the `_sessionWkLogs.push` call (inside the `if (_sessionActive)` block, around line 114):
  ```js
  _sessionWkLogs.push({
    mode: 'weighted',
    muscle: selectedMuscle,
    exercise: name,
    sets: workSetsOnly.map(s => ({ reps: s.reps, weight: s.weight, unit: s.unit || 'kg' })),
    volume: _wkEntry.totalVolume,
    isPR: isPR
  });
  ```
  Add `durationSecs` to this object:
  ```js
  _sessionWkLogs.push({
    mode: 'weighted',
    muscle: selectedMuscle,
    exercise: name,
    sets: workSetsOnly.map(s => ({ reps: s.reps, weight: s.weight, unit: s.unit || 'kg' })),
    volume: _wkEntry.totalVolume,
    isPR: isPR,
    durationSecs
  });
  ```
  Note: This push only executes when `_sessionActive` is true — `durationSecs` is only written to `_sessionWkLogs` during an active session. This is correct.

- [ ] **Step 3: Call `_resetExTimer()` after `save()` inside the `setTimeout` callback**

  Find `save();` inside the callback (around line 123). Add `_resetExTimer()` on the next line:
  ```js
  save();
  _resetExTimer();
  ```

- [ ] **Step 4: Verify in browser**

  1. Open `index.html`, start a session.
  2. Add a set to a weighted exercise — timer starts.
  3. Wait ~5 seconds, then press LOG WORKOUT.
  4. Timer display should disappear and show `0:00`.
  5. In DevTools console run: `workouts[workouts.length-1].durationSecs` — should be ~5 (seconds elapsed).
  6. No console errors.

- [ ] **Step 5: Commit**

  ```bash
  git add js/workout-save.js
  git commit -m "feat(ex-timer): save durationSecs in _saveWeightedWorkout"
  ```

---

## Task 4: Save `durationSecs` in `saveBwWorkout`

**Files:**
- Modify: `js/workout-save.js` (inside the `setTimeout` callback starting at line 284)

> **Note:** `saveBwWorkout` wraps its logic in a `setTimeout` callback at line 284 — the same pattern as `_saveWeightedWorkout`. All changes must go **inside** that callback. The spec previously stated `saveBwWorkout` is synchronous; the live code shows otherwise. The spec has been corrected.

- [ ] **Step 1: Add `durationSecs` computation inside the `setTimeout` callback**

  Inside the `setTimeout` callback of `saveBwWorkout` (around line 284), immediately before the `bwWorkouts.push(...)` call (around line 301), add:
  ```js
  const durationSecs = _exTimerStart
    ? Math.round((Date.now() - _exTimerStart) / 1000)
    : 0;
  ```

- [ ] **Step 2: Add `durationSecs` to `bwWorkouts.push`**

  Find the `bwWorkouts.push` call (around line 301):
  ```js
  bwWorkouts.push({
    id: _forgeRecordId('bwk'), date: new Date().toISOString(),
    exercise: name, muscle, sets, notes: '',
    totalReps, isPR, type: 'bodyweight', bwType: _currentBwType
  });
  ```
  Add `durationSecs`:
  ```js
  bwWorkouts.push({
    id: _forgeRecordId('bwk'), date: new Date().toISOString(),
    exercise: name, muscle, sets, notes: '',
    totalReps, isPR, type: 'bodyweight', bwType: _currentBwType,
    durationSecs
  });
  ```

- [ ] **Step 3: Add `durationSecs` to `_sessionWkLogs.push` in `saveBwWorkout`**

  Find the `_sessionWkLogs.push` inside the `if (_sessionActive)` block (around line 308):
  ```js
  _sessionWkLogs.push({
    mode: 'bodyweight',
    muscle,
    exercise: name,
    sets: sets.map(s => ({ reps: s.reps || 0, secs: s.secs || 0 })),
    totalReps,
    volume: 0,
    isPR
  });
  ```
  Add `durationSecs`:
  ```js
  _sessionWkLogs.push({
    mode: 'bodyweight',
    muscle,
    exercise: name,
    sets: sets.map(s => ({ reps: s.reps || 0, secs: s.secs || 0 })),
    totalReps,
    volume: 0,
    isPR,
    durationSecs
  });
  ```

- [ ] **Step 4: Call `_resetExTimer()` after `saveBwData()` inside the callback**

  Find `saveBwData();` inside the callback (around line 320). Add `_resetExTimer()` on the next line:
  ```js
  saveBwData();
  _resetExTimer();
  ```

- [ ] **Step 5: Verify in browser**

  1. Switch to Bodyweight mode, add a set — timer starts.
  2. Wait ~5 seconds, press LOG WORKOUT.
  3. Timer should hide and reset.
  4. In console: `bwWorkouts[bwWorkouts.length-1].durationSecs` — should be ~5.
  5. No console errors.

- [ ] **Step 6: Commit**

  ```bash
  git add js/workout-save.js
  git commit -m "feat(ex-timer): save durationSecs in saveBwWorkout"
  ```

---

## Task 5: Reset timer when user changes muscle group

**Files:**
- Modify: `index.html` (end of `selectMuscle` function, around line 3829)

- [ ] **Step 1: Call `_resetExTimer()` at the end of `selectMuscle`**

  Find the closing `}` of `selectMuscle` (around line 3829):
  ```js
  document.querySelectorAll('.muscle-chip:not(.muscle-chip-map)').forEach(c => {
    c.classList.toggle('active', (c.dataset.muscle || c.textContent.trim()) === muscle);
  });
  }
  ```
  Add `_resetExTimer()` immediately before the closing `}`:
  ```js
  document.querySelectorAll('.muscle-chip:not(.muscle-chip-map)').forEach(c => {
    c.classList.toggle('active', (c.dataset.muscle || c.textContent.trim()) === muscle);
  });
  _resetExTimer();
  }
  ```

- [ ] **Step 2: Verify in browser**

  1. Select a muscle, add a set — timer starts.
  2. Click a different muscle group — timer should immediately disappear and reset to `0:00`.
  3. Add a set to the new exercise — timer starts fresh.
  4. No console errors.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat(ex-timer): reset timer when muscle group changes"
  ```

---

## Task 6: Version bump and final push

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1: Bump version in `js/config.js`**

  Change:
  ```js
  window.FORGE_VERSION = 'v248';
  window.FORGE_BUILD   = '2026-03-31 (feat: poster — clean data, grouped sets, PR context, no W badge)';
  ```
  To:
  ```js
  window.FORGE_VERSION = 'v249';
  window.FORGE_BUILD   = '2026-03-31 (feat: per-exercise duration timer)';
  ```

- [ ] **Step 2: Bump cache name in `sw.js`**

  Change:
  ```js
  const CACHE_NAME = 'forge-v248';
  ```
  To:
  ```js
  const CACHE_NAME = 'forge-v249';
  ```

- [ ] **Step 3: Commit and push**

  ```bash
  git add js/config.js sw.js
  git commit -m "chore(v249): bump version — per-exercise duration timer"
  git push
  ```

- [ ] **Step 4: Smoke test the full flow**

  1. Hard-refresh the deployed app (clear cache or use DevTools → Network → Disable cache).
  2. Start a session, select a muscle, add sets to an exercise — timer appears and counts up.
  3. Press LOG WORKOUT — timer resets, `workouts` entry has `durationSecs > 0`.
  4. Immediately add sets to another exercise — new timer starts from 0.
  5. Change muscle mid-exercise — timer resets.
  6. Log bodyweight exercise — `bwWorkouts` entry has `durationSecs > 0`.
