# BW Arcade Daily Reset + Personal Best Scoreboard — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily-reset arcade model with a live RECORD/TODAY PR strip and `🏆` personal-best labels on every skill-tree node, so users have a score to beat every day.

**Architecture:** All data derived from the existing `bwWorkouts` localStorage array — no new storage keys. A new module-level `_bwSessionMax` variable tracks the in-session high-water mark so RECORD/TODAY update live before the workout is saved. CSS and HTML changes are additive patches; JS changes target four focused edit sites in `bodyweight-mode.js`.

**Tech Stack:** Vanilla JS ES5-style global functions, plain CSS variables (`var(--accent)` etc.), no build step. Manual browser verification replaces automated tests (no test framework exists in this project).

**Spec:** `docs/superpowers/specs/2026-03-12-bw-arcade-daily-pr-design.md`

---

## Chunk 1: CSS + HTML

### Task 1: Compact chip patch + PR strip CSS

**Files:**
- Modify: `css/main.css` — two append sites

This task is purely additive CSS. We append two blocks: one compact-chip patch immediately after the existing `.bw-filter-chip.active` rule (~line 5796), and one PR strip + flash block at the very end of the file (currently line 6156).

---

**Sub-task 1a — Compact chip patch**

- [ ] **Step 1: Locate existing chip rules**

Open `css/main.css`. Confirm:
- `.bw-filter-chip` block ends at approximately line 5793 (closing `}`)
- `.bw-filter-chip.active` block ends at approximately line 5796

- [ ] **Step 2: Append compact-chip override immediately after line 5796**

The patch reduces size and mutes inactive chips via `opacity`. Insert after the closing `}` of `.bw-filter-chip.active`:

```css
/* Compact chips — tree is the hero (patch; inherits color/border/radius from rules above) */
.bw-filter-chip {
  font-size: 9px;
  padding: 3px 8px;
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity .15s ease;
}
.bw-filter-chip.active {
  opacity: 1;
}
```

Use the Edit tool with:
```
old_string:
.bw-filter-chip.active {
  border-color: var(--green); color: var(--accent); background: var(--green-dim);
}

/* ── BW RPG SKILL TREE ── */

new_string:
.bw-filter-chip.active {
  border-color: var(--green); color: var(--accent); background: var(--green-dim);
}
/* Compact chips — tree is the hero (patch; inherits color/border/radius from rules above) */
.bw-filter-chip {
  font-size: 9px;
  padding: 3px 8px;
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity .15s ease;
}
.bw-filter-chip.active {
  opacity: 1;
}

/* ── BW RPG SKILL TREE ── */
```

- [ ] **Step 3: Verify in browser**

Open the app → switch to Bodyweight mode → confirm muscle chips are visibly smaller/muted; active chip is full opacity after clicking.

---

**Sub-task 1b — PR strip + flash CSS**

- [ ] **Step 4: Append PR strip styles to end of `css/main.css`**

Append after the last line of the file (currently 6156). Use the Edit tool `append` mode or the Write tool with the exact block:

```css

/* ── BW PR STRIP ── */
.bw-pr-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 6px 0 8px;
  border-bottom: 1px solid var(--border2);
  margin-bottom: 8px;
}
.bw-pr-cell {
  display: flex;
  align-items: center;
  gap: 5px;
}
.bw-pr-icon {
  font-size: 13px;
}
.bw-pr-label {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text3);
}
.bw-pr-val {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  line-height: 1;
  color: var(--accent);
  min-width: 40px;
}
.bw-pr-divider {
  color: var(--border2);
  font-size: 18px;
}
@keyframes bwPrFlash {
  0%   { background: transparent; }
  20%  { background: rgba(57,255,143,.25); box-shadow: 0 0 14px rgba(57,255,143,.35); }
  100% { background: transparent; }
}
.bw-pr-new-record {
  animation: bwPrFlash 0.8s ease-out forwards;
  border-radius: 6px;
  padding: 2px 6px;
}
```

- [ ] **Step 5: Commit**

```bash
git add css/main.css
git commit -m "style: compact bw chips + PR strip + flash animation"
```

---

### Task 2: PR strip HTML insertion

**Files:**
- Modify: `index.html` — insert 14 lines between lines 971 and 972

The PR strip goes between the `bw-arcade-top` div (exercise name + subtitle) and the `bw-arcade-middle` div (progress ring + set timeline). Currently `bw-arcade-top` closes at line 971 and `bw-arcade-middle` opens at line 973.

- [ ] **Step 1: Locate insertion point in `index.html`**

Open `index.html`. Confirm the target lines:
```
971:            </div>
972:            <!-- Middle: progress ring + set dot timeline -->
973:            <div class="bw-arcade-middle">
```

- [ ] **Step 2: Insert PR strip HTML**

Use the Edit tool:

```
old_string:
            </div>
            <!-- Middle: progress ring + set dot timeline -->
            <div class="bw-arcade-middle">

new_string:
            </div>
            <!-- PR strip: all-time record + today best -->
            <div class="bw-pr-strip" id="bw-pr-strip">
              <div class="bw-pr-cell" id="bw-record-cell">
                <span class="bw-pr-icon">🏆</span>
                <span class="bw-pr-label">RECORD</span>
                <span class="bw-pr-val" id="bw-record-val">—</span>
              </div>
              <div class="bw-pr-divider">·</div>
              <div class="bw-pr-cell" id="bw-today-cell">
                <span class="bw-pr-icon">⚡</span>
                <span class="bw-pr-label">TODAY</span>
                <span class="bw-pr-val" id="bw-today-val">—</span>
              </div>
            </div>
            <!-- Middle: progress ring + set dot timeline -->
            <div class="bw-arcade-middle">
```

- [ ] **Step 3: Verify in browser**

Open app → Bodyweight mode → click any exercise node → confirm PR strip appears between the exercise name/subtitle and the progress ring. Both RECORD and TODAY should show `—` initially.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add bw PR strip HTML between arcade-top and arcade-middle"
```

---

## Chunk 2: JavaScript

### Task 3: `_bwSessionMax` state variable + four helper functions

**Files:**
- Modify: `js/bodyweight-mode.js` — two insertion sites

**Site A:** Add `let _bwSessionMax = 0;` after the existing `let _bwStep = 1;` declaration at line 11.

**Site B:** Add four helper functions (`_getBwPR`, `_getBwTodaySets`, `_getBwTodayMax`, `_updateBwPrStrip`) after the `_setBwStep()` function which ends at line 97.

---

- [ ] **Step 1: Add `_bwSessionMax` declaration**

Open `js/bodyweight-mode.js`. Use the Edit tool:

```
old_string:
let _bwStep = 1; // 1=pick muscle, 2=pick exercise, 3=log sets

new_string:
let _bwStep = 1; // 1=pick muscle, 2=pick exercise, 3=log sets
let _bwSessionMax = 0; // in-session high-water mark; reset when new exercise selected
```

- [ ] **Step 2: Add four PR helper functions after `_setBwStep()`**

After the closing `}` of `_setBwStep()` at line 97, insert:

```
old_string:
function setBwFilter(btn, muscle) {

new_string:
// ── PR HELPERS ──────────────────────────────────────────────────────────────

// All-time best single set value for an exercise (saved history only)
function _getBwPR(name) {
  if (!name) return 0;
  const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === name.toLowerCase());
  return history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
}

// Today's flat set array for an exercise (may span multiple saves in one day)
function _getBwTodaySets(name) {
  if (!name) return [];
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return (bwWorkouts || [])
    .filter(w => w.exercise.toLowerCase() === name.toLowerCase() && w.date.startsWith(today))
    .flatMap(w => w.sets);
}

// Today's best single set value (saved history; _bwSessionMax layered in _updateBwPrStrip)
function _getBwTodayMax(name) {
  if (!name) return 0;
  const sets = _getBwTodaySets(name);
  return sets.length ? Math.max(...sets.map(s => s.reps || s.secs || 0)) : 0;
}

// Refresh PR strip UI — uses _bwSessionMax for live display before save
function _updateBwPrStrip(name) {
  const savedPR = _getBwPR(name);
  const pr      = Math.max(savedPR, _bwSessionMax);              // live RECORD
  const tod     = Math.max(_getBwTodayMax(name), _bwSessionMax); // live TODAY
  const lvl = CALISTHENICS_TREES.flatMap(t => t.levels)
    .find(l => l.n.toLowerCase() === (name || '').toLowerCase());
  const unit = (lvl && lvl.t === 'hold') ? 'secs' : 'reps';
  const recEl = document.getElementById('bw-record-val');
  const todEl = document.getElementById('bw-today-val');
  if (recEl) recEl.textContent = pr  > 0 ? `${pr} ${unit}`  : '—';
  if (todEl) todEl.textContent = tod > 0 ? `${tod} ${unit}` : '—';
}

function setBwFilter(btn, muscle) {
```

- [ ] **Step 3: Verify helpers exist in browser console**

Open the app in DevTools. In the Console run:
```js
typeof _getBwPR
typeof _getBwTodaySets
typeof _getBwTodayMax
typeof _updateBwPrStrip
typeof _bwSessionMax
```
Expected: all return `"function"` (first four) and `"number"` (last one).

- [ ] **Step 4: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: add _bwSessionMax var + four PR helper functions"
```

---

### Task 4: `setWorkoutMode()` — strip reset on BW entry

**Files:**
- Modify: `js/bodyweight-mode.js` — lines 52–53

Inside the `if (!isWgt)` branch, directly after `_setBwStep(1)`, add the two reset calls. This clears the PR strip to `—` every time the user enters BW mode, before an exercise is selected.

- [ ] **Step 1: Add reset calls after `_setBwStep(1)`**

In `js/bodyweight-mode.js`, current code at line 52–54:
```js
  if (!isWgt) {
    _setBwStep(1);
    renderBwExercisePicker();
```

Use the Edit tool:
```
old_string:
  if (!isWgt) {
    _setBwStep(1);
    renderBwExercisePicker();

new_string:
  if (!isWgt) {
    _setBwStep(1);
    _bwSessionMax = 0;
    _updateBwPrStrip('');
    renderBwExercisePicker();
```

- [ ] **Step 2: Verify in browser**

Open app → switch to BW mode → confirm PR strip shows `🏆 RECORD —` and `⚡ TODAY —`. Switch to Weighted mode → switch back to BW mode → strip still shows `—`.

- [ ] **Step 3: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: reset PR strip and session max when entering BW mode"
```

---

### Task 5: `pickBwExercise()` — daily pre-fill + session reset

**Files:**
- Modify: `js/bodyweight-mode.js` — lines 194–247

**What changes:**
1. `_bwSessionMax = 0;` added as first line inside the function body (line 195).
2. The old `bwPrev` pre-fill block (lines 225–243) replaced with a today-sets pre-fill block.
3. `_updateBwPrStrip(name)` called at the end (after `_updateBwRing(name)`).

**Exact old code to replace (lines 225–247):**
```js
  // Pre-fill reps from last session, or use default
  const bwPrev = (bwWorkouts || []).slice().reverse().find(w => w.exercise.toLowerCase() === name.toLowerCase());
  if (bwPrev && bwPrev.sets.length) {
    const lastSet = bwPrev.sets[bwPrev.sets.length - 1];
    _currentBwReps = lastSet.reps || lastSet.secs || 10;
  } else {
    _currentBwReps = _currentBwType === 'hold' ? 20 : 10;
  }
  _renderBwRepsVal();

  // Clear existing sets if switching exercises
  document.getElementById('bw-sets-container').innerHTML = '';
  bwSetCount = 0;
  _updateSetBadge(0);

  // If coming from a previous session, pre-fill sets
  if (bwPrev && document.querySelectorAll('#bw-sets-container .bw-dot-row').length === 0) {
    bwPrev.sets.forEach(s => _addBwDot(s.reps || s.secs, s.effort));
  }

  _renderBwActiveDot();
  _updateBwRing(name);
}
```

---

- [ ] **Step 1: Add `_bwSessionMax = 0;` as first line inside `pickBwExercise()`**

Use the Edit tool:
```
old_string:
function pickBwExercise(name, muscle, type) {
  document.getElementById('exercise-name').value = name;

new_string:
function pickBwExercise(name, muscle, type) {
  _bwSessionMax = 0; // reset in-session high-water mark for new exercise
  document.getElementById('exercise-name').value = name;
```

- [ ] **Step 2: Replace the bwPrev pre-fill block with today-sets pre-fill**

Use the Edit tool:
```
old_string:
  // Pre-fill reps from last session, or use default
  const bwPrev = (bwWorkouts || []).slice().reverse().find(w => w.exercise.toLowerCase() === name.toLowerCase());
  if (bwPrev && bwPrev.sets.length) {
    const lastSet = bwPrev.sets[bwPrev.sets.length - 1];
    _currentBwReps = lastSet.reps || lastSet.secs || 10;
  } else {
    _currentBwReps = _currentBwType === 'hold' ? 20 : 10;
  }
  _renderBwRepsVal();

  // Clear existing sets if switching exercises
  document.getElementById('bw-sets-container').innerHTML = '';
  bwSetCount = 0;
  _updateSetBadge(0);

  // If coming from a previous session, pre-fill sets
  if (bwPrev && document.querySelectorAll('#bw-sets-container .bw-dot-row').length === 0) {
    bwPrev.sets.forEach(s => _addBwDot(s.reps || s.secs, s.effort));
  }

  _renderBwActiveDot();
  _updateBwRing(name);
}

new_string:
  // Clear existing sets before pre-fill
  document.getElementById('bw-sets-container').innerHTML = '';
  bwSetCount = 0;
  _updateSetBadge(0);

  // Daily pre-fill: show today's sets; start fresh if new day
  const todaySets = _getBwTodaySets(name);
  if (todaySets.length) {
    todaySets.forEach(s => _addBwDot(s.reps || s.secs, s.effort));
    bwSetCount = todaySets.length;
    _updateSetBadge(bwSetCount);
    // Pre-fill reps stepper from last today set
    const lastSet = todaySets[todaySets.length - 1];
    _currentBwReps = lastSet.reps || lastSet.secs || 10;
  } else {
    _currentBwReps = _currentBwType === 'hold' ? 20 : 10;
  }
  _renderBwRepsVal();

  _renderBwActiveDot();
  _updateBwRing(name);
  _updateBwPrStrip(name); // show RECORD + TODAY in arcade header
}
```

- [ ] **Step 3: Verify in browser — new day scenario**

Open DevTools Console. Run:
```js
// Simulate "no today sets" by checking what _getBwTodaySets returns for an exercise
_getBwTodaySets('Push-Ups')
```
Expected: `[]` if no Push-Ups logged today. Click the Push-Ups node — arcade should appear empty (no pre-filled dots), with reps defaulting to 10. PR strip RECORD should show all-time best if history exists, TODAY should show `—`.

- [ ] **Step 4: Verify — same-day scenario**

If you have saved a workout today for any exercise, check that clicking that exercise pre-fills today's sets and the PR strip shows RECORD + TODAY correctly.

- [ ] **Step 5: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: daily pre-fill in pickBwExercise + PR strip update on exercise select"
```

---

### Task 6: `addBwSet()` — live PR detection

**Files:**
- Modify: `js/bodyweight-mode.js` — lines 339–346 (`addBwSet()` function)

**What changes:** Replace the unconditional `sndSetLog()` + `hapSetLog()` calls with a PR-detection branch. On a PR (new session peak), fire `sndPR` + `hapPR` + flash animation. On a normal set, fire `sndSetLog` + `hapSetLog`. Call `_updateBwPrStrip(exName)` at the end of both branches.

**Current code (lines 339–346):**
```js
function addBwSet() {
  bwSetCount++;
  _updateSetBadge(bwSetCount);
  _addBwDot(_currentBwReps, _currentBwEffort);
  _renderBwActiveDot();
  if (typeof sndSetLog === 'function') sndSetLog();
  if (typeof hapSetLog === 'function') hapSetLog();
}
```

---

- [ ] **Step 1: Replace `addBwSet()` with PR-detecting version**

Use the Edit tool:
```
old_string:
function addBwSet() {
  bwSetCount++;
  _updateSetBadge(bwSetCount);
  _addBwDot(_currentBwReps, _currentBwEffort);
  _renderBwActiveDot();
  if (typeof sndSetLog === 'function') sndSetLog();
  if (typeof hapSetLog === 'function') hapSetLog();
}

new_string:
function addBwSet() {
  bwSetCount++;
  _updateSetBadge(bwSetCount);
  _addBwDot(_currentBwReps, _currentBwEffort);
  _renderBwActiveDot();

  // PR check — fires at most once per new session peak
  const exName  = (document.getElementById('exercise-name') || {}).value || '';
  const savedPR = _getBwPR(exName.trim());
  const isNewPR = exName.trim() && _currentBwReps > Math.max(savedPR, _bwSessionMax);

  if (isNewPR) {
    _bwSessionMax = _currentBwReps; // update high-water mark
    if (typeof sndPR  === 'function') sndPR();
    if (typeof hapPR  === 'function') hapPR();
    const recCell = document.getElementById('bw-record-cell');
    if (recCell) {
      recCell.classList.remove('bw-pr-new-record');
      void recCell.offsetWidth; // reflow to restart animation
      recCell.classList.add('bw-pr-new-record');
    }
  } else {
    // Normal set — standard audio + haptic
    if (typeof sndSetLog === 'function') sndSetLog();
    if (typeof hapSetLog === 'function') hapSetLog();
  }
  _updateBwPrStrip(exName.trim());
}
```

- [ ] **Step 2: Verify PR flash in browser**

Open app → BW mode → select an exercise. Log sets by pressing the LOG button:
- First set (assume below all-time record): dot appears, normal sound, TODAY updates.
- Log a set higher than all-time record: RECORD cell flashes green, PR sound plays, RECORD value updates immediately.
- Log another set at same value: no new flash (session max gate prevents it).
- Log a set even higher: flash fires again (new peak).

Also verify in Console:
```js
_bwSessionMax // should equal the highest reps logged this session
```

- [ ] **Step 3: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: live PR detection in addBwSet — flash + sndPR, no double audio"
```

---

### Task 7: `renderBwExercisePicker()` — `🏆` PB node labels

**Files:**
- Modify: `js/bodyweight-mode.js` — lines 159–161

Replace the old `Best: X reps ✓` / `Best: X reps · N%...` label strings with the `🏆` prefix format. The change is the `pctLabel` assignment only — no structural HTML changes.

**Current code (lines 159–161):**
```js
        const pctLabel = isDone
          ? `Best: ${maxVal} ${unit} ✓`
          : `Best: ${maxVal} ${unit} · ${pct}% to unlock (need ${lvl.target})`;
```

---

- [ ] **Step 1: Replace `pctLabel` construction**

Use the Edit tool:
```
old_string:
        const pctLabel = isDone
          ? `Best: ${maxVal} ${unit} ✓`
          : `Best: ${maxVal} ${unit} · ${pct}% to unlock (need ${lvl.target})`;

new_string:
        const pctLabel = maxVal > 0
          ? (isDone
              ? `🏆 ${maxVal} ${unit}  ·  ✓ Unlocked`
              : `🏆 ${maxVal} ${unit}  ·  ${pct}% to unlock (need ${lvl.target})`)
          : (isDone
              ? `✓ Unlocked`          // valid edge case: unlocked with no local history
              : `${pct}% to unlock (need ${lvl.target} ${unit})`);
```

- [ ] **Step 2: Verify in browser**

Open app → BW mode. Nodes for exercises you have history on should show `🏆 25 reps  ·  ✓ Unlocked` (done nodes) or `🏆 18 reps  ·  72% to unlock (need 25)` (current node). Nodes with no history show the plain `N% to unlock` text.

- [ ] **Step 3: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: bw tree nodes show 🏆 personal best labels"
```

---

### Task 8: Version bump to v42

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1: Update `js/config.js`**

Use the Edit tool:
```
old_string: window.FORGE_VERSION = 'v41';
new_string: window.FORGE_VERSION = 'v42';
```
```
old_string: window.FORGE_BUILD = '2026-03-12 (cache forge-v41)';
new_string: window.FORGE_BUILD = '2026-03-12 (cache forge-v42)';
```

- [ ] **Step 2: Update `sw.js`**

Use the Edit tool:
```
old_string: const CACHE_NAME = 'forge-v41';
new_string: const CACHE_NAME = 'forge-v42';
```

- [ ] **Step 3: Commit + push**

```bash
git add js/config.js sw.js
git commit -m "chore: bump version to v42 — BW arcade daily PR scoreboard"
git push origin master
```

- [ ] **Step 4: Full end-to-end smoke test in browser**

1. Open app on mobile or DevTools mobile emulation
2. Switch to Bodyweight mode — confirm: step indicator reset, PR strip shows `—`/`—`, chips are compact/muted
3. Tap a muscle chip — confirm step 2 activates, tree filters
4. Tap an exercise node — confirm: step 3 activates, arcade reveals, PR strip populates, today's sets pre-filled (or empty if new day)
5. Log a set below record — normal dot + sound; TODAY updates
6. Log a set above all-time record — PR flash on RECORD cell, PR sound, RECORD updates immediately
7. Log another set same value — no new flash
8. Navigate away and back to BW mode — PR strip resets to `—`
9. Switch to Weighted mode then back to BW — PR strip resets

---

## Summary of all edits

| File | Lines changed | What |
|------|--------------|------|
| `css/main.css` | After ~5796 + end of file | Compact chip patch + PR strip + flash keyframe |
| `index.html` | After line 971 | 14-line `#bw-pr-strip` HTML block |
| `js/bodyweight-mode.js` | Line 11 | `let _bwSessionMax = 0;` |
| `js/bodyweight-mode.js` | After line 97 | 4 PR helper functions |
| `js/bodyweight-mode.js` | Line 52 block | `_bwSessionMax=0; _updateBwPrStrip('')` reset |
| `js/bodyweight-mode.js` | Lines 195, 225–247 | `pickBwExercise()` session reset + daily pre-fill |
| `js/bodyweight-mode.js` | Lines 339–346 | `addBwSet()` PR detection branch |
| `js/bodyweight-mode.js` | Lines 159–161 | `pctLabel` trophy format |
| `js/config.js` | 2 lines | v41 → v42 |
| `sw.js` | 1 line | forge-v41 → forge-v42 |
