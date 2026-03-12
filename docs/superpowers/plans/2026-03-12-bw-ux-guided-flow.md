# BW UX Guided Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide BW users through a clear ① MUSCLE → ② EXERCISE → ③ LOG SETS flow, hide the arcade zone until an exercise is picked, highlight the selected exercise node, and add sound + haptic feedback on pick.

**Architecture:** CSS-only step strip with three `.bw-step` elements driven by a `_bwStep` state variable in `bodyweight-mode.js`. Arcade zone (`#bw-sets-section`) stays hidden on BW mode entry and is revealed inside `pickBwExercise()`. Selected node highlight reuses the existing `currentEx` variable already computed in `renderBwExercisePicker()`.

**Tech Stack:** Vanilla JS, CSS custom properties, Web Audio API (`fx-sound.js`), Vibration API (`fx-haptic.js`)

---

## Chunk 1: CSS — Step Strip + Selected Node Highlight

**Files:**
- Modify: `css/main.css` (append after line 6093)

### Task 1: Add step strip CSS

- [ ] **Step 1: Append step strip styles to `css/main.css`**

Add the following block at the very end of `css/main.css` (after the existing `#section-bodymap.bw-mode-hidden` block):

```css
/* BW guided-flow step indicator */
.bw-step-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0 14px;
}
.bw-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  opacity: .35;
  transition: opacity .2s ease, color .2s ease;
}
.bw-step.active {
  opacity: 1;
}
.bw-step.done {
  opacity: .75;
}
.bw-step-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px;
  line-height: 1;
  color: var(--text3);
  transition: color .2s ease;
}
.bw-step.active .bw-step-num {
  color: var(--accent);
  font-size: 18px;
}
.bw-step.done .bw-step-num {
  color: var(--green);
}
.bw-step-lbl {
  font-family: 'DM Mono', monospace;
  font-size: 7px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
}
.bw-step.active .bw-step-lbl {
  color: var(--accent);
}
.bw-step.done .bw-step-lbl {
  color: var(--green);
}
.bw-step-arrow {
  font-size: 10px;
  color: var(--border2);
  letter-spacing: -2px;
  flex-shrink: 0;
}

/* Selected exercise node highlight */
.bw-rpg-node.selected {
  border-left: 3px solid var(--accent);
  background: rgba(57,255,143,.10);
  box-shadow: 0 0 10px rgba(57,255,143,.08);
}
```

- [ ] **Step 2: Verify CSS appended correctly**

Run in preview console:
```js
document.querySelector('.bw-step-strip')
```
Expected: `null` (HTML not added yet — just confirms CSS doesn't crash)

- [ ] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "style: add bw step strip and selected node highlight CSS"
```

---

## Chunk 2: HTML — Step Strip in BW Picker

**Files:**
- Modify: `index.html` lines 881–895 (inside `#bw-exercise-picker`)

### Task 2: Insert step strip HTML

- [ ] **Step 1: Locate insertion point in `index.html`**

Current block (line 881):
```html
        <div id="bw-exercise-picker" style="display:none;">
          <!-- Muscle filter chips -->
          <div class="bw-muscle-filter" id="bw-muscle-filter">
```

- [ ] **Step 2: Insert step strip between opening div and muscle filter**

Replace:
```html
        <div id="bw-exercise-picker" style="display:none;">
          <!-- Muscle filter chips -->
          <div class="bw-muscle-filter" id="bw-muscle-filter">
```

With:
```html
        <div id="bw-exercise-picker" style="display:none;">
          <!-- BW guided-flow step indicator -->
          <div class="bw-step-strip" id="bw-step-strip">
            <div class="bw-step active" id="bw-step-1">
              <span class="bw-step-num">①</span>
              <span class="bw-step-lbl">MUSCLE</span>
            </div>
            <div class="bw-step-arrow">──</div>
            <div class="bw-step" id="bw-step-2">
              <span class="bw-step-num">②</span>
              <span class="bw-step-lbl">EXERCISE</span>
            </div>
            <div class="bw-step-arrow">──</div>
            <div class="bw-step" id="bw-step-3">
              <span class="bw-step-num">③</span>
              <span class="bw-step-lbl">LOG SETS</span>
            </div>
          </div>
          <!-- Muscle filter chips -->
          <div class="bw-muscle-filter" id="bw-muscle-filter">
```

- [ ] **Step 3: Verify strip renders in preview**

Switch to BW mode in preview and run:
```js
setWorkoutMode('bodyweight');
document.getElementById('bw-step-1').classList.contains('active')
```
Expected: `true`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add bw step strip HTML to exercise picker"
```

---

## Chunk 3: JS — State Machine, Arcade Hide/Show, Highlight, Feedback

**Files:**
- Modify: `js/bodyweight-mode.js`

### Task 3: Add `_bwStep` variable and `_setBwStep()` helper

- [ ] **Step 1: Add `_bwStep` variable after existing variable declarations**

Current line 10 area:
```js
let _currentBwReps = 10; // tracks reps stepper value
```

Add after it:
```js
let _bwStep = 1; // 1=pick muscle, 2=pick exercise, 3=log sets
```

- [ ] **Step 2: Add `_setBwStep()` helper function after `setWorkoutMode()` (after line 82)**

Add immediately after the closing `}` of `setWorkoutMode()`:

```js
function _setBwStep(n) {
  _bwStep = n;
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`bw-step-${i}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < n)       el.classList.add('done');
    else if (i === n) el.classList.add('active');
    const numEl = el.querySelector('.bw-step-num');
    if (numEl) numEl.textContent = i < n ? '✓' : ['①','②','③'][i - 1];
  });
}
```

- [ ] **Step 3: Verify `_setBwStep` works in preview**

```js
setWorkoutMode('bodyweight');
_setBwStep(2);
document.getElementById('bw-step-1').classList.contains('done') &&
document.getElementById('bw-step-2').classList.contains('active')
```
Expected: `true`

### Task 4: Wire step transitions + arcade hide into `setWorkoutMode()`

- [ ] **Step 1: Change `setWorkoutMode()` — keep arcade hidden on BW entry and reset step**

Current line 21:
```js
  document.getElementById('bw-sets-section').style.display = isWgt ? 'none' : '';
```

Replace with:
```js
  document.getElementById('bw-sets-section').style.display = 'none';
```

(Both weighted and BW entry keep arcade hidden; `pickBwExercise()` reveals it.)

- [ ] **Step 2: Add `_setBwStep(1)` call in the BW branch of `setWorkoutMode()`**

Current BW branch starts at `if (!isWgt) {` (around line 51). Add `_setBwStep(1);` as the first line inside that block:

```js
  if (!isWgt) {
    _setBwStep(1);
    renderBwExercisePicker();
    // ... rest unchanged
```

- [ ] **Step 3: Verify arcade is hidden on BW entry**

```js
setWorkoutMode('bodyweight');
document.getElementById('bw-sets-section').style.display
```
Expected: `"none"`

### Task 5: Wire step 1→2 transition into `setBwFilter()`

- [ ] **Step 1: Add `_setBwStep(2)` guard to `setBwFilter()`**

Current `setBwFilter()` (line 84):
```js
function setBwFilter(btn, muscle) {
  _bwFilterMuscle = muscle;
  document.querySelectorAll('.bw-filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBwExercisePicker();
}
```

Replace with:
```js
function setBwFilter(btn, muscle) {
  _bwFilterMuscle = muscle;
  document.querySelectorAll('.bw-filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (_bwStep < 2) _setBwStep(2);
  renderBwExercisePicker();
}
```

- [ ] **Step 2: Verify step advances on chip tap**

```js
setWorkoutMode('bodyweight');
setBwFilter(null, 'Chest');
document.getElementById('bw-step-2').classList.contains('active')
```
Expected: `true`

### Task 6: Wire step 3, arcade reveal, sound + haptic into `pickBwExercise()`

- [ ] **Step 1: Add step advance, arcade reveal + scroll, sound + haptic to `pickBwExercise()`**

Current `pickBwExercise()` starts at line 177. After the opening two lines that set `exercise-name` and `selectedMuscle`, and before `_currentBwType = type || 'reps';`, there is no feedback. Add the following block right after `_updateBwArcadeHeader(name);` (around line 188):

```js
  // Step 3: advance indicator
  _setBwStep(3);

  // Sound + haptic feedback
  if (typeof sndTap === 'function') sndTap();
  if (typeof hapTap === 'function') hapTap();

  // Reveal arcade zone + scroll into view
  const arcadeZone = document.getElementById('bw-sets-section');
  if (arcadeZone) {
    arcadeZone.style.display = '';
    setTimeout(() => arcadeZone.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
```

- [ ] **Step 2: Verify arcade shows and step 3 activates after exercise pick**

```js
setWorkoutMode('bodyweight');
pickBwExercise('Wall Push-Up', 'Chest', 'reps');
document.getElementById('bw-step-3').classList.contains('active') &&
document.getElementById('bw-sets-section').style.display !== 'none'
```
Expected: `true`

### Task 7: Add selected node highlight in `renderBwExercisePicker()`

- [ ] **Step 1: Use existing `currentEx` to set `isSelected` per node**

In `renderBwExercisePicker()`, inside `tree.levels.forEach`, the node class line currently reads:

```js
      html += `<div class="bw-rpg-node ${nodeClass}"
```

Replace with:

```js
      const isSelected = isClickable && lvl.n.toLowerCase() === currentEx;
      html += `<div class="bw-rpg-node ${nodeClass}${isSelected ? ' selected' : ''}"
```

(Note: `currentEx` is already computed at line 95 as `document.getElementById('exercise-name').value.trim().toLowerCase()`)

- [ ] **Step 2: Verify selected class appears after picking**

```js
setWorkoutMode('bodyweight');
pickBwExercise('Wall Push-Up', 'Chest', 'reps');
document.querySelector('.bw-rpg-node.selected') !== null
```
Expected: `true`

- [ ] **Step 3: Verify selected class disappears on mode reset**

```js
setWorkoutMode('weighted');
setWorkoutMode('bodyweight');
document.querySelector('.bw-rpg-node.selected')
```
Expected: `null`

- [ ] **Step 4: Commit all JS changes**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: BW guided flow — step indicator, arcade hide/show, selection highlight, sound+haptic"
```

---

## Chunk 4: Version Bump + Push

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

### Task 8: Bump to v41

- [ ] **Step 1: Update `js/config.js`**

```js
window.FORGE_VERSION = 'v41';
window.FORGE_BUILD   = '2026-03-12 (cache forge-v41)';
```

- [ ] **Step 2: Update `sw.js`**

```js
const CACHE_NAME = 'forge-v41';
```

- [ ] **Step 3: Verify version string in preview**

```js
window.FORGE_VERSION
```
Expected: `"v41"`

- [ ] **Step 4: Commit and push**

```bash
git add js/config.js sw.js
git commit -m "chore: bump version to v41"
git push origin master
```
