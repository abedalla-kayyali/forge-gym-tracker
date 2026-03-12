# Design: BW Arcade Daily Reset + Personal Best Scoreboard

**Date:** 2026-03-12
**Status:** Approved

## Problem

Three related gaps in the current BW arcade experience:

1. **No daily reset** — `pickBwExercise()` pre-fills sets from the last session *ever*, so the arcade never feels like a fresh daily challenge.
2. **No personal best display** — the arcade has no "record to beat" concept; users have no reason to push beyond their last session.
3. **Tree nodes don't show records** — the RPG tree shows unlock progress but hides the user's personal best per exercise, so browsing the tree isn't motivating.

## Goal

- **Daily session model:** arcade starts fresh each day; same-day sets accumulate as one session
- **PR strip:** arcade header shows `🏆 RECORD` (all-time best) and `⚡ TODAY` (today's best) side by side
- **Live PR detection:** logging a set that beats the all-time best fires `sndPR()` + `hapPR()` + flash animation
- **Tree node PBs:** each done/current node shows `🏆 X reps` inline — the tree becomes a personal scoreboard
- **Compact chips:** muscle filter chips de-emphasised so the tree is the visual hero

## Architecture

No new storage keys. All data derived from the existing `bwWorkouts` array.

### New helpers in `js/bodyweight-mode.js`

```js
// All-time best single set value for an exercise
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

// Today's best single set value
function _getBwTodayMax(name) {
  const sets = _getBwTodaySets(name);
  return sets.length ? Math.max(...sets.map(s => s.reps || s.secs || 0)) : 0;
}

// Refresh PR strip UI
function _updateBwPrStrip(name) {
  const pr  = _getBwPR(name);
  const tod = _getBwTodayMax(name);
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
| `css/main.css` | PR strip styles, flash keyframe, compact chip styles |
| `js/bodyweight-mode.js` | Helpers, daily pre-fill, live PR detection, node PB labels |

---

## Section 1: Compact Muscle Chips

Current `.bw-filter-chip` is prominent. New style: smaller font, reduced padding, muted colour until active.

```css
/* Compact chips — tree is the hero */
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

---

## Section 2: Daily Session Model

### `pickBwExercise()` pre-fill change

**Old:** find last session ever → pre-fill all its sets
**New:** find today's sets → pre-fill those; empty arcade if no today sets

```js
// Replace old bwPrev pre-fill block with:
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
```

The `last-session-hint` bar (shows previous saved session date + stats) remains unchanged — it still provides historical reference.

### `setWorkoutMode()` reset

Add `_updateBwPrStrip('')` call (clears strip to `—`) when switching mode.

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

### CSS

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

| Situation | RECORD | TODAY |
|-----------|--------|-------|
| No history | `—` | `—` |
| History, no today sets | `25 reps` | `—` |
| Logged today, below record | `25 reps` | `18 reps` |
| Today set beats record | `26 reps` + flash | `26 reps` |

---

## Section 4: Live PR Detection in `addBwSet()`

After `_addBwDot()` is called:

```js
// PR check
const exName = document.getElementById('exercise-name').value.trim();
const oldPR  = _getBwPR(exName);
if (exName && _currentBwReps > oldPR) {
  // New all-time record
  if (typeof sndPR  === 'function') sndPR();
  if (typeof hapPR  === 'function') hapPR();
  const recCell = document.getElementById('bw-record-cell');
  if (recCell) {
    recCell.classList.remove('bw-pr-new-record');
    void recCell.offsetWidth; // reflow to restart animation
    recCell.classList.add('bw-pr-new-record');
  }
} else {
  // Normal set — existing sndSetLog + hapSetLog already fire
}
_updateBwPrStrip(exName);
```

Note: `_getBwPR()` reads from `bwWorkouts` which is updated on *save*, not on `addBwSet()`. So during a session the PR comparison uses the **saved history** as baseline. The live PR fires correctly the first time the user surpasses their all-time saved best in the current session.

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
      ? `✓ Unlocked`
      : `${pct}% to unlock (need ${lvl.target} ${unit})`);
```

No structural HTML change — just the label string. The `🏆` prefix makes each node a visible scoreboard entry at a glance.

---

## Behaviour Summary

| Action | Result |
|--------|--------|
| Enter BW mode | Tree shows with PBs on each node, chips compact |
| Tap muscle chip | Filters tree (step advance as before) |
| Tap exercise node | Arcade reveals; PR strip shows record + today; today's sets pre-filled |
| Log a set (below record) | Dot added, sndSetLog + hapSetLog, TODAY val updates |
| Log a set (beats record) | Dot added, sndPR + hapPR, RECORD val flashes + updates |
| New day | Arcade starts empty, RECORD shows old best, TODAY shows `—` |
| Switch to weighted mode | PR strip resets to `—` |
