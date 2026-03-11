# Design: BW Guided Flow, Step Indicator, Selection Highlight & Feedback

**Date:** 2026-03-11
**Status:** Approved

## Problem

Three related UX issues in Bodyweight mode:

1. **No guided flow** — The arcade LOG SET zone appears immediately on BW mode switch (showing "—") even before the user picks anything. Users scroll aimlessly trying to figure out what to do.
2. **No selection highlight** — `renderBwExercisePicker()` computes `currentEx` but never applies a visual selected state to the active node.
3. **No feedback on exercise pick** — `pickBwExercise()` fires silently with no sound or haptic.

## Goal

- **Step indicator** guides user through: ① MUSCLE → ② EXERCISE → ③ LOG SETS
- **Arcade zone hidden** until an exercise is picked; auto-reveals + scrolls into view on pick
- **Selected node highlighted** in the RPG tree when an exercise is active
- **Sound + haptic** fires on every exercise pick

## Design

### Step Indicator (HTML + CSS)

Add a slim strip inside `#bw-exercise-picker`, above the muscle filter chips:

```html
<div class="bw-step-strip" id="bw-step-strip">
  <div class="bw-step" id="bw-step-1">
    <span class="bw-step-num">①</span>
    <span class="bw-step-lbl">MUSCLE</span>
  </div>
  <div class="bw-step-arrow">——</div>
  <div class="bw-step" id="bw-step-2">
    <span class="bw-step-num">②</span>
    <span class="bw-step-lbl">EXERCISE</span>
  </div>
  <div class="bw-step-arrow">——</div>
  <div class="bw-step" id="bw-step-3">
    <span class="bw-step-num">③</span>
    <span class="bw-step-lbl">LOG SETS</span>
  </div>
</div>
```

Step states (CSS classes on `.bw-step`):
- Default (inactive): `--text3` color, small
- `.active`: `--accent` color, slightly larger font-weight
- `.done`: `--green` color, number replaced by `✓`

### Step State Machine (JS)

New variable in `bodyweight-mode.js`:
```js
let _bwStep = 1; // 1 | 2 | 3
```

New helper:
```js
function _setBwStep(n) {
  _bwStep = n;
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`bw-step-${i}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < n)      el.classList.add('done');
    else if (i === n) el.classList.add('active');
    // set checkmark for done steps
    const numEl = el.querySelector('.bw-step-num');
    if (numEl) numEl.textContent = i < n ? '✓' : `${'①②③'[i-1]}`;
  });
}
```

Transitions:
| Event | Call |
|-------|------|
| `setWorkoutMode('bodyweight')` | `_setBwStep(1)` |
| `setBwFilter()` (any chip tap) | `_setBwStep(2)` if `_bwStep === 1` |
| `pickBwExercise()` | `_setBwStep(3)` |

### Arcade Hide/Show

**`setWorkoutMode()`** — keep `#bw-sets-section` hidden when entering BW mode:
```js
document.getElementById('bw-sets-section').style.display = 'none'; // was: isWgt ? 'none' : ''
```
(Weighted path already sets it to `'none'`, unchanged.)

**`pickBwExercise()`** — show + scroll after exercise is selected:
```js
const arcadeZone = document.getElementById('bw-sets-section');
if (arcadeZone) {
  arcadeZone.style.display = '';
  setTimeout(() => arcadeZone.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}
```
60ms delay ensures the display change has painted before scroll fires.

### Selected Node Highlight

In `renderBwExercisePicker()`, `currentEx` is already computed but unused. Fix:

```js
const isSelected = lvl.n.toLowerCase() === currentEx;
```

Add `selected` to node class when true:
```js
html += `<div class="bw-rpg-node ${nodeClass}${isSelected ? ' selected' : ''}" ...>`;
```

CSS:
```css
.bw-rpg-node.selected {
  border-left: 3px solid var(--accent);
  background: var(--accent-dim, rgba(var(--accent-rgb, 0,200,150), 0.08));
}
```

### Sound + Haptic on Pick

In `pickBwExercise()`, add after the existing arcade header update:
```js
if (typeof sndTap === 'function') sndTap();
if (typeof hapTap === 'function') hapTap();
```

## Behaviour Summary

| Action | Result |
|--------|--------|
| Enter BW mode | Step 1 active, arcade hidden |
| Tap muscle chip | Step 1 → done, Step 2 active |
| Tap exercise card | Step 2 → done, Step 3 active; `sndTap` + `hapTap`; arcade reveals + scrolls into view; node highlighted |
| Switch back to Weighted | Arcade hides, step strip resets |

## Files Changed

- `index.html` — add `#bw-step-strip` HTML inside `#bw-exercise-picker`
- `css/main.css` — step strip styles + `.bw-rpg-node.selected` style
- `js/bodyweight-mode.js` — `_bwStep`, `_setBwStep()`, update `setWorkoutMode()`, `setBwFilter()`, `pickBwExercise()`, `renderBwExercisePicker()`
