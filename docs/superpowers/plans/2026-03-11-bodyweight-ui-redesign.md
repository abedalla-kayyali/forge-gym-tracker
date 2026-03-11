# Bodyweight Workout UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bodyweight mode UI with a vertical RPG skill tree picker and an arcade-style session logging zone.

**Architecture:** Three files change — `index.html` for new HTML structure, `js/bodyweight-mode.js` for all BW logic (tree rendering, arcade zone, set management), and `css/main.css` for new styles. The weighted workout mode is untouched.

**Tech Stack:** Vanilla JS, HTML5, CSS3. No build step. No test framework — verification is done by opening `index.html` in a browser and exercising the UI manually.

---

## Chunk 1: HTML Structure

### Task 1: Replace BW exercise picker HTML

**Files:**
- Modify: `index.html` lines 873–876 (the `#bw-exercise-picker` div)

The old picker is a flat grid. Replace with a vertical RPG tree container and a muscle filter chip row.

- [ ] **Step 1: Open `index.html` and find the `#bw-exercise-picker` div (around line 873)**

It currently looks like:
```html
<div id="bw-exercise-picker" style="display:none;">
  <label ...>Quick Select</label>
  <div class="bw-exercises-grid" id="bw-exercises-grid"></div>
</div>
```

- [ ] **Step 2: Replace it with the new RPG tree structure**

```html
<div id="bw-exercise-picker" style="display:none;">
  <!-- Muscle filter chips -->
  <div class="bw-muscle-filter" id="bw-muscle-filter">
    <button class="bw-filter-chip active" data-muscle="" onclick="setBwFilter(this,'')">All</button>
    <button class="bw-filter-chip" data-muscle="Chest" onclick="setBwFilter(this,'Chest')">Chest</button>
    <button class="bw-filter-chip" data-muscle="Back" onclick="setBwFilter(this,'Back')">Back</button>
    <button class="bw-filter-chip" data-muscle="Core" onclick="setBwFilter(this,'Core')">Core</button>
    <button class="bw-filter-chip" data-muscle="Legs" onclick="setBwFilter(this,'Legs')">Legs</button>
    <button class="bw-filter-chip" data-muscle="Shoulders" onclick="setBwFilter(this,'Shoulders')">Shoulders</button>
    <button class="bw-filter-chip" data-muscle="Triceps" onclick="setBwFilter(this,'Triceps')">Triceps</button>
  </div>
  <!-- RPG skill trees rendered here by JS -->
  <div id="bw-rpg-trees"></div>
</div>
```

- [ ] **Step 3: Verify the old `#bw-exercises-grid` reference no longer exists in index.html**

Search the file for `bw-exercises-grid` — expected result is **zero matches**. The ID `wgt-muscle-history-grid` is a different element for weighted mode and is fine. If `bw-exercises-grid` appears anywhere, remove it.

Also add a step to remove the `_bwPickerShowAll` variable: search `bodyweight-mode.js` for `_bwPickerShowAll` and delete any declaration and usage — it belongs to the old picker and is dead code after this rewrite.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: replace BW picker HTML with RPG tree container"
```

---

### Task 2: Replace BW sets section HTML with arcade zone

**Files:**
- Modify: `index.html` lines 930–936 (the `#bw-sets-section` div)

The old sets section has a grid header + plain rows. Replace with an arcade zone div that JS will populate.

- [ ] **Step 1: Find `#bw-sets-section` in `index.html` (around line 930)**

It currently looks like:
```html
<div id="bw-sets-section" class="form-group" style="display:none;">
  <div class="sets-header" style="grid-template-columns:36px 1fr 1fr 34px;">
    <span>SET</span><span id="bw-val-header">REPS</span><span>EFFORT</span><span></span>
  </div>
  <div id="bw-sets-container"></div>
  <button class="btn btn-add" onclick="addBwSet()">+ Add Set</button>
</div>
```

- [ ] **Step 2: Replace it with the arcade zone**

```html
<div id="bw-sets-section" style="display:none;">
  <div id="bw-arcade-zone" class="bw-arcade-zone">
    <!-- Top: exercise name + level subtitle -->
    <div class="bw-arcade-top">
      <div class="bw-arcade-ex-name" id="bw-arcade-ex-name">—</div>
      <div class="bw-arcade-ex-sub" id="bw-arcade-ex-sub"></div>
    </div>
    <!-- Middle: progress ring + set dot timeline -->
    <div class="bw-arcade-middle">
      <div class="bw-ring-wrap">
        <svg class="bw-ring" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="bwRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:var(--green)"/>
              <stop offset="100%" style="stop-color:var(--accent)"/>
            </linearGradient>
          </defs>
          <circle class="bw-ring-bg" cx="40" cy="40" r="35"/>
          <circle class="bw-ring-progress" id="bw-ring-progress" cx="40" cy="40" r="35"/>
        </svg>
        <div class="bw-ring-center">
          <div class="bw-ring-pct" id="bw-ring-pct">0%</div>
          <div class="bw-ring-lbl">unlock</div>
        </div>
      </div>
      <div class="bw-sets-dots" id="bw-sets-container"></div>
    </div>
    <!-- Reps stepper -->
    <div class="bw-reps-area">
      <div class="bw-reps-stepper">
        <button class="bw-reps-btn" onclick="adjustBwReps(-1)">−</button>
        <div class="bw-reps-val" id="bw-reps-val">10</div>
        <button class="bw-reps-btn" onclick="adjustBwReps(1)">+</button>
      </div>
      <div class="bw-reps-unit" id="bw-reps-unit">reps</div>
      <button class="bw-ditto-btn" onclick="bwDitto()">↩ Ditto</button>
    </div>
    <!-- Effort buttons -->
    <div class="bw-effort-area">
      <div class="bw-effort-label">How did it feel?</div>
      <div class="bw-effort-buttons">
        <button class="bw-eff-btn bw-eff-easy" data-effort="easy"   onclick="selectBwEffort(this)">😌 Easy</button>
        <button class="bw-eff-btn bw-eff-med  active" data-effort="medium" onclick="selectBwEffort(this)">😤 Med</button>
        <button class="bw-eff-btn bw-eff-hard" data-effort="hard"   onclick="selectBwEffort(this)">🔥 Hard</button>
        <button class="bw-eff-btn bw-eff-fail" data-effort="failure" onclick="selectBwEffort(this)">💀 Fail</button>
      </div>
    </div>
    <!-- Log set button -->
    <button class="bw-log-btn" onclick="addBwSet()">⚡ LOG SET</button>
  </div>
</div>
```

- [ ] **Step 3: Remove `#bw-stats-area` block (lines 939–941) from index.html**

The stats are now shown inside the progress ring — the old strip is no longer needed:
```html
<!-- DELETE this block: -->
<div id="bw-stats-area" style="display:none;">
  <div class="bw-stats-strip" id="bw-stats-strip"></div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: replace BW sets section with arcade zone HTML"
```

---

## Chunk 2: CSS Styles

### Task 3: Add RPG tree styles to main.css

**Files:**
- Modify: `css/main.css` — add after existing `.cali-trees-container` block (around line 5718)

- [ ] **Step 1: Find the end of the existing cali-tree CSS block in `css/main.css`**

Search for `.cali-connector` — the new styles go after this block.

- [ ] **Step 2: Add muscle filter chip styles**

```css
/* ── BW MUSCLE FILTER CHIPS ── */
.bw-muscle-filter {
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
}
.bw-filter-chip {
  padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border2);
  color: var(--text3); font-family: 'DM Mono', monospace; font-size: 9px;
  letter-spacing: 1px; text-transform: uppercase; cursor: pointer;
  background: none; transition: all .15s;
  -webkit-tap-highlight-color: transparent;
}
.bw-filter-chip.active {
  border-color: var(--green); color: var(--accent); background: var(--green-dim);
}
```

- [ ] **Step 3: Add RPG tree node styles**

```css
/* ── BW RPG SKILL TREE ── */
.bw-rpg-tree { display: flex; flex-direction: column; margin-bottom: 18px; }

.bw-tree-section-label {
  display: flex; align-items: center; gap: 8px;
  font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px;
  text-transform: uppercase; color: var(--green);
  padding: 8px 0; border-bottom: 1px solid var(--border2); margin-bottom: 10px;
}
.bw-tree-section-icon { font-size: 18px; line-height: 1; }

.bw-rpg-connector { width: 2px; height: 8px; margin-left: 19px; }
.bw-rpg-connector.green { background: linear-gradient(180deg, var(--green), var(--border2)); }
.bw-rpg-connector.dim  { background: var(--bg3); }

.bw-rpg-node {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; border-radius: 12px; cursor: pointer;
  transition: all .2s; border: 1.5px solid transparent;
  -webkit-tap-highlight-color: transparent;
}
.bw-rpg-node:active { transform: scale(.98); }
.bw-rpg-node.done    { background: rgba(46,204,113,.05); border-color: rgba(46,204,113,.2); }
.bw-rpg-node.current { background: rgba(57,255,143,.08); border-color: var(--accent); box-shadow: 0 0 16px var(--green-glow); }
.bw-rpg-node.next-up { background: var(--bg); border: 1.5px dashed var(--border2); }
.bw-rpg-node.locked  { background: var(--bg); border-color: var(--border); opacity: .35; pointer-events: none; }

.bw-rpg-icon { font-size: 20px; line-height: 1; flex-shrink: 0; margin-top: 3px; }
.bw-rpg-info { flex: 1; min-width: 0; }
.bw-rpg-lvl  { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 3px; }
.bw-rpg-lvl.done    { color: var(--green); }
.bw-rpg-lvl.current { color: var(--accent); }
.bw-rpg-lvl.next-up { color: var(--text3); }
.bw-rpg-lvl.locked  { color: var(--border2); }
.bw-rpg-name { font-family: 'Bebas Neue', sans-serif; font-size: 17px; letter-spacing: 1px; color: var(--white); margin-bottom: 5px; line-height: 1; }
.bw-rpg-node.locked .bw-rpg-name { color: var(--border2); }
.bw-rpg-bar-wrap { height: 4px; background: var(--bg3); border-radius: 2px; overflow: hidden; margin-bottom: 3px; }
.bw-rpg-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--green), var(--accent)); }
.bw-rpg-pct    { font-family: 'DM Mono', monospace; font-size: 8px; color: var(--text3); }
.bw-rpg-target { font-family: 'DM Mono', monospace; font-size: 8px; color: var(--text3); }
.bw-rpg-badge  { flex-shrink: 0; font-size: 18px; margin-top: 2px; }
```

- [ ] **Step 4: Commit**

```bash
git add css/main.css
git commit -m "style: add RPG skill tree styles for BW mode"
```

---

### Task 4: Add arcade zone styles to main.css

**Files:**
- Modify: `css/main.css` — add after the RPG tree styles from Task 3

- [ ] **Step 1: Add the arcade zone container and top bar styles**

```css
/* ── BW ARCADE ZONE ── */
.bw-arcade-zone {
  background: var(--bg); border: 1.5px solid var(--accent);
  border-radius: 16px; overflow: hidden; margin-top: 14px;
  box-shadow: 0 0 30px var(--green-glow);
}
.bw-arcade-top {
  background: linear-gradient(135deg, var(--bg), var(--bg2));
  padding: 14px 16px; border-bottom: 1px solid var(--border2);
}
.bw-arcade-ex-name {
  font-family: 'Bebas Neue', sans-serif; font-size: 28px;
  letter-spacing: 2px; color: var(--accent); line-height: 1;
  text-transform: uppercase;
}
.bw-arcade-ex-sub {
  font-family: 'DM Mono', monospace; font-size: 9px;
  color: var(--text3); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px;
}
```

- [ ] **Step 2: Add progress ring styles**

```css
/* progress ring */
.bw-arcade-middle {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border-bottom: 1px solid var(--border2);
}
.bw-ring-wrap { flex-shrink: 0; position: relative; width: 80px; height: 80px; }
svg.bw-ring   { width: 80px; height: 80px; transform: rotate(-90deg); }
.bw-ring-bg   { fill: none; stroke: var(--bg3); stroke-width: 7; }
.bw-ring-progress {
  fill: none; stroke: url(#bwRingGrad); stroke-width: 7; stroke-linecap: round;
  stroke-dasharray: 220; stroke-dashoffset: 220;
  transition: stroke-dashoffset .6s ease;
}
.bw-ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.bw-ring-pct { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: var(--accent); line-height: 1; }
.bw-ring-lbl { font-family: 'DM Mono', monospace; font-size: 7px; color: var(--text3); letter-spacing: 1px; text-transform: uppercase; margin-top: 1px; }
```

- [ ] **Step 3: Add set dots timeline styles**

```css
/* set dots timeline */
.bw-sets-dots { flex: 1; }
.bw-sets-dots-title { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-bottom: 8px; }
.bw-dot-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.bw-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.bw-dot.done   { background: var(--green); box-shadow: 0 0 4px var(--green-glow); }
.bw-dot.active { background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: bwDotPulse .8s ease-in-out infinite; }
.bw-dot.empty  { background: transparent; border: 1.5px solid var(--border2); }
@keyframes bwDotPulse {
  0%, 100% { box-shadow: 0 0 6px var(--accent); }
  50%       { box-shadow: 0 0 14px var(--accent); }
}
.bw-dot-info   { font-family: 'Bebas Neue', sans-serif; font-size: 15px; color: var(--white); }
.bw-dot-sub    { font-family: 'DM Mono', monospace; font-size: 8px; color: var(--text3); margin-left: auto; }
.bw-dot-sub.easy { color: var(--green); }
.bw-dot-sub.medium { color: #f39c12; }
.bw-dot-sub.hard   { color: #e74c3c; }
.bw-dot-sub.failure { color: #8e44ad; }
.bw-add-dot-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.bw-add-dot    { width: 10px; height: 10px; border-radius: 50%; border: 1.5px dashed var(--border2); flex-shrink: 0; }
.bw-add-lbl    { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--border2); cursor: pointer; }
```

- [ ] **Step 4: Add reps stepper styles**

```css
/* reps stepper */
.bw-reps-area {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-bottom: 1px solid var(--border2);
}
.bw-reps-stepper { display: flex; align-items: center; }
.bw-reps-btn {
  width: 44px; height: 44px; background: var(--bg3); border: 1px solid var(--border2);
  color: var(--green); font-size: 22px; font-family: 'Bebas Neue', sans-serif;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background .15s; -webkit-tap-highlight-color: transparent;
}
.bw-reps-btn:first-child { border-radius: 10px 0 0 10px; }
.bw-reps-btn:last-child  { border-radius: 0 10px 10px 0; }
.bw-reps-btn:active { background: var(--green-dim); }
.bw-reps-val {
  font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: var(--accent);
  min-width: 60px; text-align: center; background: var(--bg);
  border-top: 1px solid var(--border2); border-bottom: 1px solid var(--border2);
  line-height: 44px; height: 44px; user-select: none;
}
.bw-reps-unit { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }
.bw-ditto-btn {
  margin-left: auto; background: var(--bg3); border: 1px solid var(--green3);
  color: var(--green); border-radius: 8px; padding: 6px 12px;
  font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1px; cursor: pointer;
}
```

- [ ] **Step 5: Add effort buttons and log button styles**

```css
/* effort buttons */
.bw-effort-area { padding: 12px 16px 14px; }
.bw-effort-label { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-bottom: 8px; }
.bw-effort-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.bw-eff-btn {
  padding: 12px 4px; border-radius: 10px; border: 1.5px solid;
  font-family: 'DM Mono', monospace; font-size: 10px; text-align: center;
  letter-spacing: 1px; text-transform: uppercase; font-weight: 700; cursor: pointer;
  transition: all .15s; line-height: 1.4; background: none;
  -webkit-tap-highlight-color: transparent;
}
.bw-eff-easy { border-color: var(--green);  color: var(--green); }
.bw-eff-med  { border-color: #f39c12; color: #f39c12; }
.bw-eff-hard { border-color: #e74c3c; color: #e74c3c; }
.bw-eff-fail { border-color: #8e44ad; color: #8e44ad; }
.bw-eff-btn.active { opacity: 1; }
.bw-eff-easy.active { background: rgba(46,204,113,.15); box-shadow: 0 0 10px var(--green-glow); }
.bw-eff-med.active  { background: rgba(243,156,18,.15); box-shadow: 0 0 10px rgba(243,156,18,.3); }
.bw-eff-hard.active { background: rgba(231,76,60,.15);  box-shadow: 0 0 10px rgba(231,76,60,.3); }
.bw-eff-fail.active { background: rgba(142,68,173,.15); box-shadow: 0 0 10px rgba(142,68,173,.3); }

/* log set button */
.bw-log-btn {
  display: flex; width: calc(100% - 32px); margin: 0 16px 16px;
  background: linear-gradient(135deg, var(--green), #27ae60);
  border: none; border-radius: 12px; padding: 14px;
  align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; font-size: 18px;
  letter-spacing: 2px; color: var(--bg);
  -webkit-tap-highlight-color: transparent;
}
.bw-log-btn:active { transform: scale(.98); }
```

- [ ] **Step 6: Remove old BW set-row and stats-strip styles**

Find and delete these old CSS blocks from `css/main.css`:
- `.bw-set-row { ... }` and all sub-rules (`.bw-set-row .set-num`, `.bw-set-row input`)
- `.bw-exercises-grid { ... }` and `.bw-ex-btn { ... }` blocks
- `.bw-stats-strip { ... }` and `.bw-stat-card`, `.bw-stat-val`, `.bw-stat-lbl`

- [ ] **Step 7: Commit**

```bash
git add css/main.css
git commit -m "style: add arcade zone styles, remove old BW set-row styles"
```

---

## Chunk 3: JavaScript Logic

### Task 5: Rewrite renderBwExercisePicker() and add filter logic

**Files:**
- Modify: `js/bodyweight-mode.js`

- [ ] **Step 1: Add a module-level filter variable at the top of `bodyweight-mode.js`**

After the existing `let _currentBwType = 'reps';` line, add:
```js
let _bwFilterMuscle = ''; // active muscle filter for RPG tree
let _currentBwEffort = 'medium'; // tracks active effort button
let _currentBwReps = 10; // tracks reps stepper value
```

- [ ] **Step 2: Add the `setBwFilter()` function**

```js
function setBwFilter(btn, muscle) {
  _bwFilterMuscle = muscle;
  document.querySelectorAll('.bw-filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBwExercisePicker();
}
```

- [ ] **Step 3: Rewrite `renderBwExercisePicker()` entirely**

Replace the existing function with:

```js
function renderBwExercisePicker() {
  const wrap = document.getElementById('bw-rpg-trees');
  if (!wrap) return;

  const currentEx = document.getElementById('exercise-name').value.trim().toLowerCase();

  // Filter trees by muscle chip selection
  const trees = _bwFilterMuscle
    ? CALISTHENICS_TREES.filter(t => t.muscle === _bwFilterMuscle)
    : CALISTHENICS_TREES;
  const treesToRender = trees.length ? trees : CALISTHENICS_TREES;

  let html = '';
  treesToRender.forEach(tree => {
    // Calculate highest unlocked level from history
    let unlockedLvl = 1;
    tree.levels.forEach(lvl => {
      const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase());
      const maxVal = history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
      if (maxVal >= lvl.target) unlockedLvl = Math.max(unlockedLvl, lvl.l + 1);
    });

    html += `<div class="bw-rpg-tree">
      <div class="bw-tree-section-label">
        <span class="bw-tree-section-icon">${tree.icon}</span>
        ${tree.tree.toUpperCase()}
      </div>`;

    tree.levels.forEach((lvl, i) => {
      // Classify node state by level number vs highest unlocked level
      const isDone    = lvl.l < unlockedLvl;
      const isCurrent = lvl.l === unlockedLvl;
      const isNextUp  = lvl.l === unlockedLvl + 1; // first locked level, show as "next up"
      const isLocked  = lvl.l > unlockedLvl + 1;   // deeper locked levels

      // Determine node state
      let nodeClass = 'locked', lvlClass = 'locked', badge = '🔒';
      if (isDone) {
        nodeClass = 'done'; lvlClass = 'done'; badge = '✅';
      } else if (isCurrent) {
        nodeClass = 'current'; lvlClass = 'current'; badge = '🎯';
      } else if (isNextUp) {
        nodeClass = 'next-up'; lvlClass = 'next-up'; badge = '🔒';
      }

      // Progress bar (only for done + current)
      let barHtml = '';
      if (isDone || isCurrent) {
        const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase());
        const maxVal = history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
        const pct = Math.min(100, Math.round((maxVal / lvl.target) * 100));
        const unit = lvl.t === 'hold' ? 'secs' : 'reps';
        const pctLabel = isDone
          ? `Best: ${maxVal} ${unit} ✓`
          : `Best: ${maxVal} ${unit} · ${pct}% to unlock (need ${lvl.target})`;
        barHtml = `
          <div class="bw-rpg-bar-wrap"><div class="bw-rpg-bar-fill" style="width:${pct}%"></div></div>
          <div class="bw-rpg-pct">${pctLabel}</div>`;
      } else if (nodeClass === 'next-up') {
        const unit = lvl.t === 'hold' ? 'secs hold' : 'reps';
        barHtml = `<div class="bw-rpg-target">Unlock by hitting ${lvl.target} ${unit} on previous level</div>`;
      }

      // Connector between nodes
      const connectorClass = (isDone) ? 'green' : 'dim';
      if (i > 0) html += `<div class="bw-rpg-connector ${connectorClass}"></div>`;

      const isClickable = isDone || isCurrent;
      html += `<div class="bw-rpg-node ${nodeClass}"
                    ${isClickable ? `onclick="pickBwExercise('${lvl.n.replace(/'/g,"\\'")}','${tree.muscle}','${lvl.t}')"` : ''}>
        <div class="bw-rpg-icon">${tree.icon}</div>
        <div class="bw-rpg-info">
          <div class="bw-rpg-lvl ${lvlClass}">LVL ${lvl.l} · ${nodeClass.replace('-',' ').toUpperCase()}</div>
          <div class="bw-rpg-name">${lvl.n}</div>
          ${barHtml}
        </div>
        <div class="bw-rpg-badge">${badge}</div>
      </div>`;
    });

    html += '</div>'; // end bw-rpg-tree
  });

  wrap.innerHTML = html;
}
```

- [ ] **Step 4: Verify in browser — switch to BW mode, check tree renders with done/current/next/locked states**

Open `index.html` → tap "Bodyweight" mode toggle → confirm the RPG tree appears with proper node states and filter chips work.

- [ ] **Step 5: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: rewrite BW exercise picker as vertical RPG skill tree"
```

---

### Task 6: Rewrite pickBwExercise() to update arcade zone header + ring

**Files:**
- Modify: `js/bodyweight-mode.js`

- [ ] **Step 1: Rewrite `pickBwExercise()` to update the arcade zone header and ring**

Replace the existing function:

```js
function pickBwExercise(name, muscle, type) {
  document.getElementById('exercise-name').value = name;
  selectedMuscle = muscle;
  _currentBwType = type || 'reps';

  // Update reps unit label
  const unit = _currentBwType === 'hold' ? 'secs' : 'reps';
  const unitEl = document.getElementById('bw-reps-unit');
  if (unitEl) unitEl.textContent = unit;

  // Update arcade header
  _updateBwArcadeHeader(name);

  // Re-render tree (highlights selected node)
  renderBwExercisePicker();
  renderBwLastSession(name);

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

- [ ] **Step 2: Add `_updateBwArcadeHeader()` helper**

```js
function _updateBwArcadeHeader(name) {
  const nameEl = document.getElementById('bw-arcade-ex-name');
  const subEl  = document.getElementById('bw-arcade-ex-sub');
  if (!nameEl || !subEl) return;

  nameEl.textContent = name.toUpperCase();

  // Find tree + level for this exercise
  let subtitle = '';
  CALISTHENICS_TREES.forEach(tree => {
    tree.levels.forEach((lvl, i) => {
      if (lvl.n.toLowerCase() === name.toLowerCase()) {
        const nextLvl = tree.levels[i + 1];
        const unit = lvl.t === 'hold' ? 'secs hold' : 'reps';
        if (nextLvl) {
          subtitle = `LVL ${lvl.l} · TARGET ${lvl.target} ${unit} TO UNLOCK ${nextLvl.n.toUpperCase()}`;
        } else {
          subtitle = `LVL ${lvl.l} · MASTER LEVEL · TARGET ${lvl.target} ${unit}`;
        }
      }
    });
  });
  subEl.textContent = subtitle;
}
```

- [ ] **Step 3: Add `_updateBwRing()` helper**

```js
function _updateBwRing(name) {
  const ringEl = document.getElementById('bw-ring-progress');
  const pctEl  = document.getElementById('bw-ring-pct');
  if (!ringEl || !pctEl) return;

  const CIRCUMFERENCE = 220;
  let pct = 0;

  CALISTHENICS_TREES.forEach(tree => {
    tree.levels.forEach(lvl => {
      if (lvl.n.toLowerCase() === name.toLowerCase()) {
        const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === name.toLowerCase());
        const maxVal = history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
        pct = Math.min(100, Math.round((maxVal / lvl.target) * 100));
      }
    });
  });

  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct / 100);
  ringEl.style.strokeDashoffset = offset;
  pctEl.textContent = pct + '%';
}
```

- [ ] **Step 4: Verify — pick an exercise in the tree, confirm arcade header updates with correct name + subtitle, ring shows correct %**

- [ ] **Step 5: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: update arcade header and progress ring on BW exercise selection"
```

---

### Task 7: Rewrite addBwSet() to use dot timeline + reps stepper

**Files:**
- Modify: `js/bodyweight-mode.js`

- [ ] **Step 1: Add reps stepper helpers**

```js
function adjustBwReps(delta) {
  _currentBwReps = Math.max(1, _currentBwReps + delta);
  _renderBwRepsVal();
}

function _renderBwRepsVal() {
  const el = document.getElementById('bw-reps-val');
  if (el) el.textContent = _currentBwReps;
}

function bwDitto() {
  // Copy reps from last completed dot
  const dots = document.querySelectorAll('#bw-sets-container .bw-dot-row');
  if (!dots.length) return;
  const lastDot = dots[dots.length - 1];
  const infoEl = lastDot.querySelector('.bw-dot-info');
  if (infoEl) {
    const val = parseInt(infoEl.dataset.val, 10);
    if (!isNaN(val)) { _currentBwReps = val; _renderBwRepsVal(); }
  }
}
```

- [ ] **Step 2: Add `selectBwEffort()` function**

```js
function selectBwEffort(btn) {
  document.querySelectorAll('.bw-eff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _currentBwEffort = btn.dataset.effort;
}
```

- [ ] **Step 3: Rewrite `addBwSet()` to log the current reps + effort as a dot**

```js
function addBwSet() {
  bwSetCount++;
  _updateSetBadge(bwSetCount);
  _addBwDot(_currentBwReps, _currentBwEffort);
  _renderBwActiveDot();
  if (typeof sndSetLog === 'function') sndSetLog();
  if (typeof hapSetLog === 'function') hapSetLog();
}

function _addBwDot(val, effort) {
  const container = document.getElementById('bw-sets-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'bw-dot-row';
  const effortLabel = { easy: 'Easy', medium: 'Med', hard: 'Hard', failure: 'Fail' }[effort] || 'Med';
  const effortClass = effort || 'medium';
  const unit = _currentBwType === 'hold' ? 'secs' : 'reps';
  row.innerHTML = `
    <div class="bw-dot done"></div>
    <div class="bw-dot-info" data-val="${val}">${val} ${unit}</div>
    <div class="bw-dot-sub ${effortClass}">${effortLabel}</div>
  `;
  // Insert before the active placeholder (if any)
  const activePlaceholder = container.querySelector('.bw-active-placeholder');
  if (activePlaceholder) container.insertBefore(row, activePlaceholder);
  else container.appendChild(row);
}

function _renderBwActiveDot() {
  const container = document.getElementById('bw-sets-container');
  if (!container) return;
  // Remove old active placeholder
  const old = container.querySelector('.bw-active-placeholder');
  if (old) old.remove();

  const ph = document.createElement('div');
  ph.className = 'bw-active-placeholder';
  ph.innerHTML = `
    <div class="bw-dot-row">
      <div class="bw-dot active"></div>
      <div class="bw-dot-info" style="color:var(--accent)">Set ${bwSetCount + 1}</div>
      <div class="bw-dot-sub" style="color:var(--accent)">logging...</div>
    </div>
    <div class="bw-add-dot-row">
      <div class="bw-add-dot"></div>
      <div class="bw-add-lbl" onclick="addBwSet()">+ add set</div>
    </div>
  `;
  container.appendChild(ph);
}
```

- [ ] **Step 4: Remove old `removeBwSet()` function**

The dot timeline doesn't support removing individual sets (kept simple). Delete the `removeBwSet()` function entirely from `bodyweight-mode.js`.

- [ ] **Step 5: Verify — tap LOG SET, confirm a green dot appears, active dot moves down, set badge increments**

Open in browser → BW mode → pick an exercise → adjust reps with − / + → tap LOG SET → dots render correctly.

- [ ] **Step 6: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: rewrite BW set logging with dot timeline and reps stepper"
```

---

### Task 8: Update setWorkoutMode() for new HTML IDs + remove renderBwStats()

**Files:**
- Modify: `js/bodyweight-mode.js`

- [ ] **Step 1: Update `setWorkoutMode()` to handle the removed `#bw-stats-area`**

In `setWorkoutMode()`, find and remove this line:
```js
document.getElementById('bw-stats-area').style.display = isWgt ? 'none' : '';
```
The stats area div was deleted from HTML in Task 2, so this reference will throw. Remove it.

- [ ] **Step 2: In `setWorkoutMode()`, initialize the arcade zone when entering BW mode**

After the existing `renderBwExercisePicker()` call in the `if (!isWgt)` branch, add:
```js
// Reset arcade zone
document.getElementById('bw-arcade-ex-name').textContent = '—';
document.getElementById('bw-arcade-ex-sub').textContent = '';
document.getElementById('bw-ring-progress').style.strokeDashoffset = '220';
document.getElementById('bw-ring-pct').textContent = '0%';
_currentBwReps = 10;
_currentBwEffort = 'medium';
_renderBwRepsVal();
// Reset effort button active state
document.querySelectorAll('.bw-eff-btn').forEach(b => b.classList.remove('active'));
const medBtn = document.querySelector('.bw-eff-med');
if (medBtn) medBtn.classList.add('active');
_renderBwActiveDot();
```

- [ ] **Step 3: Remove `renderBwStats()` function entirely from `bodyweight-mode.js`**

The stats strip is gone. Delete the whole `renderBwStats()` function and any calls to it.

- [ ] **Step 4: Search `index.html` and `bodyweight-mode.js` for any remaining references to `bw-stats-area`, `bw-stats-strip`, `bw-stat-card`, `renderBwStats`, `bw-val-header`**

Remove or update any orphaned references.

- [ ] **Step 5: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: update setWorkoutMode to initialize arcade zone, remove stats strip"
```

---

### Task 9: Integrate with saveWorkout() — collect BW sets data from dots

**Files:**
- Modify: `index.html` (the `saveWorkout` function, around line 8148–8170)

- [ ] **Step 1: Find the BW set collection code in `index.html` (around line 8148 — note: line numbers shift after Chunk 1 edits, search by content not line number)**

It currently reads:
```js
const bwRows = document.querySelectorAll('#bw-sets-container .bw-set-row');
```

- [ ] **Step 2: Update to read from dot rows instead**

Replace the bw rows collection block with:
```js
const bwRows = document.querySelectorAll('#bw-sets-container .bw-dot-row');
const bwSets = Array.from(bwRows).map(row => {
  const infoEl = row.querySelector('.bw-dot-info');
  const subEl  = row.querySelector('.bw-dot-sub');
  const val = parseInt(infoEl ? infoEl.dataset.val : '0', 10) || 0;
  const effortClass = subEl ? [...subEl.classList].find(c => ['easy','medium','hard','failure'].includes(c)) : 'medium';
  return _currentBwType === 'hold'
    ? { secs: val, effort: effortClass || 'medium' }
    : { reps: val, effort: effortClass || 'medium' };
});
```

- [ ] **Step 3: Verify the rest of the saveWorkout BW branch still works** — it uses `bwSets` to build the workout object. Confirm it saves to localStorage and clears on success.

- [ ] **Step 4: Test full flow in browser**
  1. Start session
  2. Switch to BW mode
  3. Pick Push-Up from RPG tree
  4. Adjust reps with stepper
  5. Select effort
  6. Tap LOG SET x3
  7. Tap "Log Workout" (save)
  8. Reopen — confirm push-up history is in bwWorkouts and progress bar updates

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: update saveWorkout to collect BW sets from dot timeline"
```

---

## Chunk 4: Polish + RTL

### Task 10: RTL support and final polish

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1: Add RTL overrides for the new BW components**

```css
html[dir="rtl"] .bw-muscle-filter { flex-direction: row-reverse; }
html[dir="rtl"] .bw-arcade-middle { flex-direction: row-reverse; }
html[dir="rtl"] .bw-dot-row       { flex-direction: row-reverse; }
html[dir="rtl"] .bw-reps-area     { flex-direction: row-reverse; }
html[dir="rtl"] .bw-reps-stepper  { flex-direction: row-reverse; }
html[dir="rtl"] .bw-reps-btn:first-child { border-radius: 0 10px 10px 0; }
html[dir="rtl"] .bw-reps-btn:last-child  { border-radius: 10px 0 0 10px; }
```

- [ ] **Step 2: Bump the app version in `js/config.js`**

First check the current value — open `js/config.js` and search for the version constant. Only increment if it is still at `v37`. If already at `v38` or higher, skip this step.

- [ ] **Step 3: Update service worker cache version in `sw.js`**

First check the current `CACHE_NAME` value in `sw.js`. Only increment if it has not already been bumped for this feature. If already updated, skip this step.

- [ ] **Step 4: Final smoke test**
  - [ ] Switch to AR language, confirm BW mode layout mirrors correctly
  - [ ] Switch to weighted mode, confirm no BW elements visible
  - [ ] Switch back to BW mode, confirm tree + arcade zone appear fresh
  - [ ] Complete a full BW session, confirm save works

- [ ] **Step 5: Commit**

```bash
git add css/main.css js/config.js sw.js
git commit -m "feat: BW arcade mode — RTL support, bump version to v38"
```
