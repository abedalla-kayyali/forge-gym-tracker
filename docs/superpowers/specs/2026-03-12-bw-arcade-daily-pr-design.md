# Design: BW Arcade Daily Reset + Personal Best Scoreboard

**Date:** 2026-03-12
**Status:** Approved (v2 — post-review fixes)

## Problem

Three related gaps in the current BW arcade experience:

1. **No daily reset** — `pickBwExercise()` pre-fills sets from the last session *ever*, so the arcade never feels like a fresh daily challenge.
2. **No personal best display** — the arcade has no "record to beat" concept; users have no reason to push beyond their last session.
3. **Tree nodes don't show records** — the RPG tree shows unlock progress but hides the user's personal best per exercise, so browsing the tree isn't motivating.

## Goal

- **Daily session model:** arcade starts fresh each day; same-day sets accumulate as one session
- **PR strip:** arcade header shows `🏆 RECORD` (all-time best) and `⚡ TODAY` (today's best) side by side
- **Live PR detection:** logging a set that beats the all-time best (including current session high-water mark) fires `sndPR()` + `hapPR()` + flash animation — fires exactly once per new peak
- **Tree node PBs:** each done/current node shows `🏆 X reps` inline — the tree becomes a personal scoreboard
- **Compact chips:** muscle filter chips de-emphasised so the tree is the visual hero

## Architecture

No new storage keys. All data derived from the existing `bwWorkouts` array.

### New state variable in `js/bodyweight-mode.js`

```js
// In-session high-water mark — reset when a new exercise is selected
// Allows live RECORD / PR detection before the session is saved
let _bwSessionMax = 0;
```

### New helpers in `js/bodyweight-mode.js`

```js
// All-time best single set value for an exercise (saved history only)
function _getBwPR(name) {
  const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === name.toLowerCase());
  return history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
}

// Today's flat set array for an exercise (may span multiple saves in one day)
function _getBwTodaySets(name) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return (bwWorkouts || [])
    .filter(w => w.exercise.toLowerCase() === name.toLowerCase() && w.date.startsWith(today))
    .flatMap(w => w.sets);
}

// Today's best single set value (saved history; _bwSessionMax layered on top in _updateBwPrStrip)
function _getBwTodayMax(name) {
  const sets = _getBwTodaySets(name);
  return sets.length ? Math.max(...sets.map(s => s.reps || s.secs || 0)) : 0;
}

// Refresh PR strip UI — uses _bwSessionMax for optimistic live display
function _updateBwPrStrip(name) {
  const savedPR = _getBwPR(name);
  const pr      = Math.max(savedPR, _bwSessionMax);           // live RECORD
  const tod     = Math.max(_getBwTodayMax(name), _bwSessionMax); // live TODAY
  const lvl = CALISTHENICS_TREES.flatMap(t => t.levels).find(l => l.n.toLowerCase() === name.toLowerCase());
  const unit = (lvl && lvl.t === 'hold') ? 'secs' : 'reps';
  const recEl = document.getElementById('bw-record-val');
  const todEl = document.getElementById('bw-today-val');
  if (recEl) recEl.textContent = pr  > 0 ? `${pr} ${unit}`  : '—';
  if (todEl) todEl.textContent = tod > 0 ? `${tod} ${unit}` : '—';
}
```

### Files changed

| File | Change |
|------|--------|
| `index.html` | Add `#bw-pr-strip` between `bw-arcade-top` and `bw-arcade-middle` |
| `css/main.css` | Append PR strip styles, flash keyframe, compact chip patch |
| `js/bodyweight-mode.js` | `_bwSessionMax` var, helpers, daily pre-fill, live PR detection, node PB labels |

---

## Section 1: Compact Muscle Chips

The existing `.bw-filter-chip` rule must **not** be replaced — only augmented. Append these lines **after** the existing `.bw-filter-chip` rule in `css/main.css` (it currently sits around line 5787). This overrides only `font-size`, `padding`, `letter-spacing`, `opacity`, and `transition`:

```css
/* Compact chips — tree is the hero (patch appended after existing .bw-filter-chip rule) */
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

All other existing chip properties (`color`, `border`, `border-radius`, `cursor`, etc.) are inherited from the existing rule above — do not touch them.

---

## Section 2: Daily Session Model

### `pickBwExercise()` changes

Two things must happen in `pickBwExercise()`:

1. **Reset `_bwSessionMax`** to 0 at the very start of the function (before clearing dots).
2. **Replace the pre-fill block**: clear dots + use today's sets instead of all-time last session.

The existing pre-fill logic (the `bwPrev` block) occupies roughly lines 225–243 in `bodyweight-mode.js`. The implementer must:

1. Add `_bwSessionMax = 0;` as the first line inside `pickBwExercise()`.
2. Keep the existing dot-clear block (`bw-sets-container innerHTML = ''`, `bwSetCount = 0`) — it must run **before** the today-sets pre-fill below.
3. Replace only the `bwPrev` pre-fill block (the `if (bwPrev && bwPrev.exercise ...)` section) with:

```js
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
// _renderBwRepsVal() call at line ~233 remains in place after this block
```

The existing `_renderBwRepsVal()` call that follows the old pre-fill block must remain — it renders the stepper display after `_currentBwReps` is set.

The `last-session-hint` bar (shows previous saved session date + stats) remains unchanged.

### `setWorkoutMode()` strip reset

Inside the `if (!isWgt)` branch, directly after the existing `_setBwStep(1)` call, add:

```js
_bwSessionMax = 0;
_updateBwPrStrip('');
```

This clears the strip to `—` whenever the user enters BW mode (before an exercise is selected).

---

## Section 3: PR Strip HTML + CSS

### HTML

Inserted between `#bw-arcade-top` and `#bw-arcade-middle`:

```html
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
```

### CSS (append to end of `css/main.css`)

```css
/* PR strip */
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

/* Flash animation when PR is beaten */
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

### PR state table

RECORD is the live value: `Math.max(saved all-time best, _bwSessionMax)`. TODAY is `Math.max(saved today best, _bwSessionMax)`. Both update immediately after each set — no save required.

| Situation | RECORD | TODAY |
|-----------|--------|-------|
| No history, new session | `—` | `—` |
| History, no today sets | `25 reps` | `—` |
| Logged today (below record) | `25 reps` | `18 reps` |
| Logged set beats all-time record | `26 reps` + flash | `26 reps` |
| Second set in same session also above saved record | no new flash (already `_bwSessionMax` ≥ value) | updates if higher |

---

## Section 4: Live PR Detection in `addBwSet()`

### Placement

After `_addBwDot()` is called, **replace** the existing `sndSetLog()` + `hapSetLog()` calls with a conditional block so they do not double-fire on a PR:

```js
// PR check — fires at most once per new session peak
const exName = document.getElementById('exercise-name').value.trim();
const savedPR = _getBwPR(exName);
const isNewPR = exName && _currentBwReps > Math.max(savedPR, _bwSessionMax);

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
  // Normal set — fire standard feedback
  if (typeof sndSetLog === 'function') sndSetLog();
  if (typeof hapSetLog === 'function') hapSetLog();
}
_updateBwPrStrip(exName);
```

**Key change:** `sndSetLog()` + `hapSetLog()` are moved **inside the `else` branch** — they do NOT fire on a PR set. The PR sound replaces them. This avoids double audio/haptic.

**Session behaviour:** `_bwSessionMax` tracks the peak within the current session (reset to 0 in `pickBwExercise()`). PR fires exactly once per new personal peak — even across multiple sets in the same unsaved session.

---

## Section 5: Tree Node PB Labels

In `renderBwExercisePicker()`, change `pctLabel` construction:

```js
// Old:
const pctLabel = isDone
  ? `Best: ${maxVal} ${unit} ✓`
  : `Best: ${maxVal} ${unit} · ${pct}% to unlock (need ${lvl.target})`;

// New:
const pctLabel = maxVal > 0
  ? (isDone
      ? `🏆 ${maxVal} ${unit}  ·  ✓ Unlocked`
      : `🏆 ${maxVal} ${unit}  ·  ${pct}% to unlock (need ${lvl.target})`)
  : (isDone
      ? `✓ Unlocked`          // valid edge case: unlocked with no local history
      : `${pct}% to unlock (need ${lvl.target} ${unit})`);
```

No structural HTML change — just the label string. The `🏆` prefix makes each node a visible scoreboard entry at a glance. The `maxVal === 0 && isDone` case is intentional and valid (e.g., data imported from another device).

---

## Behaviour Summary

| Action | Result |
|--------|--------|
| Enter BW mode | Tree shows with PBs on each node, chips compact; strip resets to `—` |
| Tap muscle chip | Filters tree (step advance as before) |
| Tap exercise node | Arcade reveals; PR strip shows RECORD + TODAY; today's sets pre-filled; `_bwSessionMax` reset to 0 |
| Log a set (below record) | Dot added, sndSetLog + hapSetLog, TODAY val updates if new session max |
| Log a set (beats record) | Dot added, sndPR + hapPR (not sndSetLog), RECORD val flashes + updates immediately |
| Log another set same session above saved best | No new flash (session max already set); RECORD/TODAY update |
| New day | Arcade starts empty, RECORD shows old best, TODAY shows `—` |
| Switch to weighted mode | Strip resets to `—`; `_bwSessionMax` reset to 0 |
