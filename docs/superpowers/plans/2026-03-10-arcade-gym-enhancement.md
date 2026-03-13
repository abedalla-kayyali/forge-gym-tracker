# Arcade Gym UI/UX Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gamified arcade layer to FORGE — purple/gold skin, combo counter, session energy meter, Boss Fight PR mode, end-of-session star rating, and session start ceremony — all without touching the data model or adding new files.

**Architecture:** Additive changes only. New CSS lives in `css/main.css` (arcade skin + new component classes). New JS functions appended to existing modules. HTML snippets added to `index.html`. No new files created.

**Tech Stack:** Vanilla JS, Web Audio API, Vibration API, CSS custom properties, CSS animations.

---

## Chunk 1: Foundations — Arcade Skin CSS + Sound/Haptic Functions

### Task 1: Arcade Skin CSS (`css/main.css`)

**Files:**
- Modify: `css/main.css` (append after existing skin rules ~line 436)

**What:** Add `body.skin-arcade` CSS block with the purple/gold palette from the design spec. This is purely additive — no existing rules change.

- [ ] **Step 1: Read current skin section of main.css**

Read `css/main.css` lines 425–445 to find the exact insertion point after `body.skin-legend` rules.

- [ ] **Step 2: Append arcade skin CSS block**

After the last `body.skin-legend` rule, append:

```css
/* ── Arcade Skin (purple/gold) — unlocked at Diamond rank ── */
body.skin-arcade {
  --accent:   #a855f7;
  --bg:       #0a0618;
  --bg2:      #0f0820;
  --bg3:      #100825;
  --panel:    #100825;
  --panel2:   #130a2e;
  --border:   #2d1a5e;
  --border2:  #3d2070;
  --green:    #a855f7;
  --green2:   #7c3aed;
  --green3:   #4c1d95;
  --green-dim:#1e0a3c;
  --text:     #e9d5ff;
  --text2:    #c084fc;
  --text3:    #9333ea;
  --gold:     #fbbf24;
}

/* Combo strip styles */
.combo-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0 0;
  padding: 6px 12px;
  background: linear-gradient(90deg, rgba(251,191,36,.12), rgba(251,191,36,.04));
  border: 1px solid rgba(251,191,36,.25);
  border-radius: 8px;
  transition: background .3s, border-color .3s;
}
.combo-strip-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.combo-strip-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #fbbf24;
  text-transform: uppercase;
}
.combo-strip-count {
  font-size: 18px;
  font-weight: 900;
  color: #fbbf24;
  font-variant-numeric: tabular-nums;
}
.combo-strip-glow {
  background: linear-gradient(90deg, rgba(251,191,36,.22), rgba(251,191,36,.08));
  border-color: rgba(251,191,36,.5);
  box-shadow: 0 0 12px rgba(251,191,36,.2);
}
.combo-strip-fire {
  background: linear-gradient(90deg, rgba(251,191,36,.35), rgba(239,68,68,.15));
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251,191,36,.35);
}
@keyframes comboPulse {
  0%,100% { opacity:1; }
  50% { opacity:.6; }
}
.combo-fire-anim {
  animation: comboPulse .6s ease-in-out infinite;
}

/* Session energy bar */
#session-energy-bar {
  height: 3px;
  position: relative;
  overflow: visible;
  background: rgba(255,255,255,.06);
}
#session-energy-fill {
  height: 100%;
  border-radius: 0 2px 2px 0;
  transition: width .6s ease, background .6s ease;
}
#session-energy-label {
  position: absolute;
  right: 6px;
  top: 4px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #888;
  pointer-events: none;
}
.energy-warm  #session-energy-fill { background: #7c3aed; }
.energy-zone  #session-energy-fill { background: #a855f7; }
.energy-beast #session-energy-fill { background: linear-gradient(90deg, #a855f7, #fbbf24); }
.energy-fire  #session-energy-fill { background: #fbbf24; animation: comboPulse .8s ease-in-out infinite; }
.energy-warm  #session-energy-label { color: #7c3aed; }
.energy-zone  #session-energy-label { color: #a855f7; }
.energy-beast #session-energy-label { color: #c084fc; }
.energy-fire  #session-energy-label { color: #fbbf24; }

/* Boss fight card */
.boss-fight-card {
  border-color: #fbbf24 !important;
  animation: bossFlash .5s ease-in-out infinite alternate;
}
@keyframes bossFlash {
  from { border-color: #fbbf24; box-shadow: 0 0 8px rgba(251,191,36,.3); }
  to   { border-color: #ef4444; box-shadow: 0 0 16px rgba(239,68,68,.4); }
}
.boss-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1a0800;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 6px;
  margin-left: 6px;
  text-transform: uppercase;
}
.boss-defeated-badge {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

/* End-of-session star rating */
.wend-stars {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 8px 0 4px;
}
.wend-star {
  font-size: 28px;
  opacity: 0;
  transform: scale(0.4);
  transition: none;
}
.wend-star.revealed {
  animation: starPop .4s cubic-bezier(.36,.07,.19,.97) forwards;
}
@keyframes starPop {
  0%   { opacity:0; transform:scale(0.4) rotate(-20deg); }
  60%  { opacity:1; transform:scale(1.25) rotate(8deg); }
  80%  { transform:scale(0.92) rotate(-3deg); }
  100% { opacity:1; transform:scale(1) rotate(0deg); }
}
.wend-star-summary {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text2, #888);
  text-align: center;
  margin-bottom: 10px;
  text-transform: uppercase;
}

/* Session start ceremony overlay */
#session-start-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(10,6,24,.96), rgba(26,8,64,.96));
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
}
#session-start-overlay.active {
  opacity: 1;
  pointer-events: all;
}
#session-countdown-num {
  font-size: 72px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -2px;
  text-shadow: 0 0 40px rgba(168,85,247,.8), 0 0 80px rgba(168,85,247,.4);
  animation: none;
}
#session-countdown-num.pop {
  animation: countdownPop .28s cubic-bezier(.36,.07,.19,.97) forwards;
}
@keyframes countdownPop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
```

- [ ] **Step 3: Verify no syntax errors**

Read back the appended CSS block and verify curly brace balance.

- [ ] **Step 4: Commit**

```bash
git add "css/main.css"
git commit -m "feat: add arcade skin CSS + combo/energy/boss/star/ceremony styles"
```

---

### Task 2: New Sound Functions (`js/fx-sound.js`)

**Files:**
- Modify: `js/fx-sound.js` (append 6 new functions before the final IIFE)

**What:** Add `sndSessionStart`, `sndSessionEnd`, `sndCombo(level)`, `sndComboBreak`, `sndBossMode`, `sndStars(n)` following the existing `_note()` helper pattern.

- [ ] **Step 1: Read current end of fx-sound.js**

Read `js/fx-sound.js` to confirm the last line is the closing `})();` of the `initSoundBtn` IIFE (~line 227).

- [ ] **Step 2: Append the 6 new sound functions**

Insert before the final `})();` (or append after it):

```js
/* ── Arcade Gym Sound Extensions ── */

/* sndSessionStart — rising power-up chord */
function sndSessionStart() {
  if (!soundOn) return;
  _note(261.63, 'sawtooth', 0.18, 0.001, 0,    0.3);
  _note(329.63, 'sawtooth', 0.14, 0.001, 0.15, 0.3);
  _note(523.25, 'sine',     0.20, 0.001, 0.3,  0.5);
  _note(659.25, 'sine',     0.12, 0.001, 0.45, 0.45);
  _note(783.99, 'sine',     0.08, 0.001, 0.6,  0.4);
}

/* sndSessionEnd — epic victory fanfare */
function sndSessionEnd() {
  if (!soundOn) return;
  const prog = [[392,0],[523,0.18],[659,0.36],[784,0.54]];
  prog.forEach(([f,t]) => {
    _note(f,   'sawtooth', 0.22, 0.001, t, 0.32);
    _note(f*2, 'sine',     0.10, 0.001, t, 0.40);
  });
  [523.25,659.25,783.99,1046.5].forEach(f => _note(f,'sine',0.12,0.001,0.9,0.35));
}

/* sndCombo — escalating combo sound, level 1/2/3 */
function sndCombo(level) {
  if (!soundOn) return;
  if (level === 1) {
    _note(880, 'sine', 0.18, 0.001, 0, 0.14);
  } else if (level === 2) {
    _note(880, 'sine',  0.18, 0.001, 0,    0.12);
    _note(990, 'sine',  0.16, 0.001, 0.12, 0.12);
    _note(220, 'sine',  0.20, 0.001, 0,    0.25);
  } else {
    [880,1108,1320,1568,2093].forEach((f,i) => _note(f,'sine',0.16,0.001,i*0.07,0.20));
  }
}

/* sndComboBreak — deflating break */
function sndComboBreak() {
  if (!soundOn) return;
  const ctx = _ctx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

/* sndBossMode — tension build for PR attempt */
function sndBossMode() {
  if (!soundOn) return;
  _note(80,  'sawtooth', 0.22, 0.001, 0,    0.6);
  _note(160, 'sawtooth', 0.10, 0.001, 0.1,  0.5);
  [0, 0.2, 0.4].forEach(t => _note(440, 'sine', 0.12, 0.001, t, 0.12));
}

/* sndStars — n chimes (1/2/3) */
function sndStars(n) {
  if (!soundOn) return;
  const chimes = [783.99, 1046.5, 1318.51];
  for (let i = 0; i < n; i++) {
    _note(chimes[i], 'sine', 0.22, 0.001, i * 0.22, 0.28);
    if (i === 2) {
      _note(1568, 'sine', 0.14, 0.001, i * 0.22 + 0.1, 0.4);
      _note(2093, 'sine', 0.08, 0.001, i * 0.22 + 0.18, 0.4);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add "js/fx-sound.js"
git commit -m "feat: add 6 arcade sound functions (session, combo, boss, stars)"
```

---

### Task 3: New Haptic Functions (`js/fx-haptic.js`)

**Files:**
- Modify: `js/fx-haptic.js` (append 5 new functions at end of file)

- [ ] **Step 1: Read current end of fx-haptic.js**

Read `js/fx-haptic.js` to confirm ending (~line 55).

- [ ] **Step 2: Append the 5 new haptic functions**

```js
/* ── Arcade Gym Haptic Extensions ── */

/* hapCombo — escalating combo pulses */
function hapCombo(level) {
  if (level === 1) _vib([20]);
  else if (level === 2) _vib([30,20,50]);
  else _vib([50,30,80,30,120]);
}

/* hapComboBreak — short deflation */
function hapComboBreak() { _vib([15,10,15]); }

/* hapBossMode — tension rumble */
function hapBossMode() { _vib([40,20,40,20,80]); }

/* hapSessionStart — startup pulse */
function hapSessionStart() { _vib([30,20,30,20,60]); }

/* hapStars — one pulse per star */
function hapStars(n) {
  const pattern = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) pattern.push(100); // gap
    pattern.push(40, 30);
  }
  _vib(pattern);
}
```

- [ ] **Step 3: Commit**

```bash
git add "js/fx-haptic.js"
git commit -m "feat: add 5 arcade haptic functions (combo, boss, session, stars)"
```

---

## Chunk 2: Arcade Skin Activation + Combo Counter

### Task 4: Arcade Skin Activation (`js/xp-system.js`)

**Files:**
- Modify: `js/xp-system.js` (update `LEVEL_SKINS` object)

**What:** Map DIAMOND rank to `skin-arcade` instead of `skin-diamond`. Also applies to OBSIDIAN, TITAN, WARLORD, MASTER (all currently mapped to `skin-diamond`).

- [ ] **Step 1: Read the LEVEL_SKINS block in xp-system.js**

Read lines 22–47 to see the current mappings.

- [ ] **Step 2: Update DIAMOND and above ranks**

Change:
```js
  DIAMOND: 'skin-diamond',
  OBSIDIAN: 'skin-diamond',
  TITAN: 'skin-diamond',
  WARLORD: 'skin-diamond',
  MASTER: 'skin-diamond',
```
to:
```js
  DIAMOND: 'skin-arcade',
  OBSIDIAN: 'skin-arcade',
  TITAN: 'skin-arcade',
  WARLORD: 'skin-arcade',
  MASTER: 'skin-arcade',
```

- [ ] **Step 3: Verify**

Read back lines 22–47 to confirm edit applied correctly.

- [ ] **Step 4: Commit**

```bash
git add "js/xp-system.js"
git commit -m "feat: activate skin-arcade for Diamond+ ranks"
```

---

### Task 5: HTML — New UI Elements (`index.html`)

**Files:**
- Modify: `index.html`

**What:** Add 3 new HTML elements:
1. `#session-energy-bar` — 3px bar below app header
2. `#combo-strip` — gold strip above exercise card in Log tab
3. `#session-start-overlay` — fullscreen ceremony overlay

**Note:** `index.html` is large. Read each insertion area before editing.

#### Sub-task 5a: Session energy bar below header

- [ ] **Step 1: Find the app header**

Grep for `id="app-header"` or the `<header` tag in index.html to find the insertion point.

- [ ] **Step 2: Insert energy bar immediately after the header element**

```html
<!-- SESSION ENERGY BAR — 3px bar, only visible during active session -->
<div id="session-energy-bar" style="display:none">
  <div id="session-energy-fill"></div>
  <span id="session-energy-label">WARMING UP</span>
</div>
```

#### Sub-task 5b: Combo strip above exercise card

- [ ] **Step 3: Find the exercise card / sets container in the Log tab**

Grep for `id="sets-container"` or the exercise form wrapper.

- [ ] **Step 4: Insert combo strip immediately before the exercise form**

```html
<!-- COMBO STRIP — gold streak strip, hidden until combo ≥ 2 -->
<div id="combo-strip" class="combo-strip" style="display:none">
  <div class="combo-strip-left">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    <span class="combo-strip-label">COMBO STREAK</span>
  </div>
  <span class="combo-strip-count" id="combo-count">x2</span>
</div>
```

#### Sub-task 5c: Session start overlay

- [ ] **Step 5: Find the wend-overlay in index.html (already at end)**

Grep for `id="wend-overlay"` to find the line. Insert the ceremony overlay near it (before `#wend-overlay`).

- [ ] **Step 6: Insert session start overlay**

```html
<!-- SESSION START CEREMONY — skippable countdown overlay -->
<div id="session-start-overlay" onclick="_skipSessionCeremony()">
  <div id="session-countdown-num">3</div>
</div>
```

- [ ] **Step 7: Commit**

```bash
git add "index.html"
git commit -m "feat: add energy bar, combo strip, and session ceremony overlay HTML"
```

---

### Task 6: Combo Counter Logic (`js/exercises.js`)

**Files:**
- Modify: `js/exercises.js`

**What:** Add combo counter state variables and helper functions at the top of the file (or near `addSet()`). Hook into `addSet()`.

**Key locations:**
- `addSet()` is at line 264 in `exercises.js`
- `sndSetLog()` + `hapSetLog()` are already called at lines 298–299

- [ ] **Step 1: Read exercises.js lines 1–30**

Find the top of the file to add state variables.

- [ ] **Step 2: Add combo state variables near the top of exercises.js**

After existing variable declarations (look for `let setCount` or similar), add:

```js
/* ── Arcade Combo Counter ── */
let _comboCount = 0;
let _comboTimer = null;
let _bestCombo  = 0;
```

- [ ] **Step 3: Add combo helper functions**

After the state variables, add:

```js
function _updateComboStrip() {
  const strip = document.getElementById('combo-strip');
  const countEl = document.getElementById('combo-count');
  if (!strip || !countEl) return;

  if (_comboCount < 2) {
    strip.style.display = 'none';
    strip.classList.remove('combo-strip-glow','combo-strip-fire','combo-fire-anim');
    return;
  }

  strip.style.display = 'flex';
  countEl.textContent = 'x' + _comboCount;

  strip.classList.remove('combo-strip-glow','combo-strip-fire','combo-fire-anim');

  if (_comboCount >= 10) {
    strip.classList.add('combo-strip-fire','combo-fire-anim');
    countEl.textContent = 'x' + _comboCount + ' 🔥';
  } else if (_comboCount >= 5) {
    strip.classList.add('combo-strip-glow');
  }
}

function _breakCombo() {
  if (_comboCount >= 2) {
    if (typeof sndComboBreak === 'function') sndComboBreak();
    if (typeof hapComboBreak === 'function') hapComboBreak();
  }
  _comboCount = 0;
  _updateComboStrip();
}

function _incrementCombo() {
  clearTimeout(_comboTimer);
  _comboCount++;
  if (_comboCount > _bestCombo) _bestCombo = _comboCount;

  // Escalation tiers
  if (_comboCount >= 10) {
    if (typeof sndCombo === 'function') sndCombo(3);
    if (typeof hapCombo === 'function') hapCombo(3);
  } else if (_comboCount >= 5) {
    if (typeof sndCombo === 'function') sndCombo(2);
    if (typeof hapCombo === 'function') hapCombo(2);
  } else if (_comboCount >= 3) {
    if (typeof sndCombo === 'function') sndCombo(1);
    if (typeof hapCombo === 'function') hapCombo(1);
  } else if (_comboCount === 2) {
    if (typeof hapTap === 'function') hapTap();
  }

  _updateComboStrip();
  _comboTimer = setTimeout(_breakCombo, 90000); // 90-second window
}

function resetCombo() {
  clearTimeout(_comboTimer);
  _comboCount = 0;
  _bestCombo  = 0;
  _updateComboStrip();
}
```

- [ ] **Step 4: Hook _incrementCombo into addSet()**

At the end of `addSet()`, after the existing `hapSetLog()` call (line 299), add:

```js
  if (typeof _sessionActive !== 'undefined' && _sessionActive) {
    _incrementCombo();
  }
```

- [ ] **Step 5: Verify by reading addSet() after edit**

Read lines 264–305 to confirm the hook is in place.

- [ ] **Step 6: Commit**

```bash
git add "js/exercises.js"
git commit -m "feat: add combo counter logic to exercises.js"
```

---

## Chunk 3: Session Energy Meter + Boss Fight

### Task 7: Session Energy Meter Logic (`js/exercises.js`)

**Files:**
- Modify: `js/exercises.js` (append energy meter helpers)

**What:** Add `_sessionEnergy` state + `_updateEnergyMeter()` + `_addEnergy(n)`. Hook into `addSet()` (already opened in Task 6). Hook into PR detection in `workout-save.js`.

- [ ] **Step 1: Add energy state variables near combo state variables**

After the combo variables added in Task 6, also add:

```js
/* ── Session Energy Meter ── */
let _sessionEnergy = 0;
let _energyMilestones = [25, 50, 75, 100];
let _energyMilestonesHit = new Set();
```

- [ ] **Step 2: Add energy helper functions**

```js
function _updateEnergyMeter() {
  const bar   = document.getElementById('session-energy-bar');
  const fill  = document.getElementById('session-energy-fill');
  const label = document.getElementById('session-energy-label');
  if (!bar || !fill || !label) return;

  fill.style.width = _sessionEnergy + '%';

  bar.classList.remove('energy-warm','energy-zone','energy-beast','energy-fire');
  if (_sessionEnergy > 90) {
    bar.classList.add('energy-fire');
    label.textContent = 'ON FIRE';
  } else if (_sessionEnergy > 60) {
    bar.classList.add('energy-beast');
    label.textContent = 'BEAST MODE';
  } else if (_sessionEnergy > 30) {
    bar.classList.add('energy-zone');
    label.textContent = 'IN THE ZONE';
  } else {
    bar.classList.add('energy-warm');
    label.textContent = 'WARMING UP';
  }
}

function _addEnergy(n) {
  const bar = document.getElementById('session-energy-bar');
  if (!bar || bar.style.display === 'none') return;
  _sessionEnergy = Math.min(100, _sessionEnergy + n);
  _updateEnergyMeter();
  // Check milestones
  _energyMilestones.forEach(m => {
    if (_sessionEnergy >= m && !_energyMilestonesHit.has(m)) {
      _energyMilestonesHit.add(m);
      if (typeof sndMilestone === 'function') sndMilestone();
    }
  });
}

function _resetEnergy() {
  _sessionEnergy = 0;
  _energyMilestonesHit = new Set();
  _updateEnergyMeter();
}
```

- [ ] **Step 3: Hook _addEnergy into addSet() in exercises.js**

After the `_incrementCombo()` hook added in Task 6, also call:

```js
  _addEnergy(5);
```

(So every set logged adds 5% energy.)

- [ ] **Step 4: Commit**

```bash
git add "js/exercises.js"
git commit -m "feat: add session energy meter logic"
```

---

### Task 8: Energy Meter — PR energy bonus (`js/workout-save.js`)

**Files:**
- Modify: `js/workout-save.js`

**What:** When a PR is detected (both weighted and bodyweight), call `_addEnergy(10)` and `_addEnergy(3)` for combo milestones. The PR detection for weighted workouts is at ~line 90; for BW at ~line 197.

- [ ] **Step 1: Read workout-save.js lines 85–165**

Confirm the exact lines where `if (isPR)` blocks are for weighted workouts.

- [ ] **Step 2: Add energy bonus in weighted PR block**

In the `if (isPR)` block (~line 142), after existing `hapPR()` call, add:

```js
      if (typeof _addEnergy === 'function') _addEnergy(10);
```

- [ ] **Step 3: Read workout-save.js lines 190–260**

Confirm the BW `if (isPR)` block location (~line 245).

- [ ] **Step 4: Add energy bonus in BW PR block**

In the BW `if (isPR)` block (~line 245), after existing `hapPR()` call, add:

```js
      if (typeof _addEnergy === 'function') _addEnergy(10);
```

- [ ] **Step 5: Add combo milestone energy in _incrementCombo (back in exercises.js)**

After the `_updateComboStrip()` call in `_incrementCombo`, when combo reaches a tier milestone (3, 5, 10), also call `_addEnergy(3)`:

```js
  // Energy bonus on combo milestone
  if (_comboCount === 3 || _comboCount === 5 || _comboCount === 10) {
    _addEnergy(3);
  }
```

- [ ] **Step 6: Commit**

```bash
git add "js/workout-save.js" "js/exercises.js"
git commit -m "feat: add PR energy bonus and combo milestone energy"
```

---

### Task 9: Boss Fight PR Mode (`js/workout-save.js` + `js/exercises.js`)

**Files:**
- Modify: `js/workout-save.js` (Boss detected on save, badge on confirmed PR)
- Modify: `js/exercises.js` (optional: pre-detect on weight input change)

**What:** When a workout is saved and it IS a PR, show the Boss Defeated badge on the exercise card header and fire boss-defeated effects. Pre-fight detection (before logging) is a nice-to-have; the essential flow is: PR confirmed → badge + effects.

**Simplified approach (reliable):** Detect boss fight AFTER save, inside the `if (isPR)` block.

- [ ] **Step 1: Add boss fight CSS class to exercise card on PR confirm**

In `workout-save.js`, inside the weighted `if (isPR)` block (after `hapPR()` call), add:

```js
      // Boss Fight — PR confirmed
      const _exCard = document.querySelector('.exercise-card, #exercise-card, .log-card');
      if (_exCard) {
        _exCard.classList.add('boss-fight-card');
        // Inject boss badge into card header
        const _hdr = _exCard.querySelector('.exercise-name, .ex-name, h3');
        if (_hdr && !_hdr.querySelector('.boss-badge')) {
          const _badge = document.createElement('span');
          _badge.className = 'boss-badge boss-defeated-badge';
          _badge.textContent = '⚔ BOSS DEFEATED!';
          _hdr.appendChild(_badge);
        }
        if (typeof sndBossMode === 'function') sndBossMode();
        if (typeof hapBossMode === 'function') hapBossMode();
        // Clear boss state after 4s
        setTimeout(() => {
          _exCard.classList.remove('boss-fight-card');
          const _b = _exCard.querySelector('.boss-badge');
          if (_b) _b.remove();
        }, 4000);
      }
```

- [ ] **Step 2: Repeat for BW PR block**

Apply the same boss-fight badge logic in the BW `if (isPR)` block.

- [ ] **Step 3: Find the correct exercise card selector**

Read `index.html` lines around the exercise form to find the exact selector (grep for `.log-card` or `.exercise-card` or the form id).

- [ ] **Step 4: Update selector if needed**

Use the correct id/class found in Step 3.

- [ ] **Step 5: Commit**

```bash
git add "js/workout-save.js"
git commit -m "feat: add Boss Fight badge on PR confirmation"
```

---

## Chunk 4: Star Rating + Session Start Ceremony

### Task 10: End-of-Session Star Rating (`js/workout-save.js` + `index.html`)

**Files:**
- Modify: `js/workout-save.js` (star calculation + render after existing save logic)
- Modify: `index.html` (wend-title and wend-sub areas already exist)

**What:** After the existing `_showSessionSummary()` function renders the overlay, inject star rating HTML into `#wend-title`. Calculate stars based on session data.

**Star scoring:**
- 1 star: any completed session
- 2 stars: volume ≥ 80% of previous session average OR 1+ PR
- 3 stars: volume ≥ prev session average AND 1+ PR AND best combo ≥ 3

- [ ] **Step 1: Read _showSessionSummary in index.html lines 2550–2600**

Find where `#wend-title` is set and where the overlay is shown.

- [ ] **Step 2: Find how _sessionWkLogs is accessible from workout-save.js**

Grep for `_sessionWkLogs` in both files. It's defined in index.html (global scope) so accessible from workout-save.js.

- [ ] **Step 3: Add star rating function to workout-save.js**

Append at the end of `workout-save.js`:

```js
/* ── Arcade Star Rating ── */
function _showSessionStars() {
  const logs = (typeof _sessionWkLogs !== 'undefined') ? _sessionWkLogs : [];
  if (!logs.length) return;

  const totalVol   = logs.reduce((a,l) => a + (l.volume||0), 0);
  const prCount    = logs.filter(l => l.isPR).length;
  const bestCombo  = (typeof _bestCombo !== 'undefined') ? _bestCombo : 0;

  // Calculate previous session average volume from stored workouts
  const prevWorkouts = (typeof workouts !== 'undefined') ? workouts : [];
  let prevAvgVol = 0;
  if (prevWorkouts.length >= 2) {
    const prevVols = prevWorkouts.slice(-5).map(w => w.totalVolume || 0);
    prevAvgVol = prevVols.reduce((a,v)=>a+v,0) / prevVols.length;
  }

  let stars = 1;
  const meetsVolumeThreshold = prevAvgVol > 0 && totalVol >= prevAvgVol * 0.8;
  if (meetsVolumeThreshold || prCount > 0) stars = 2;
  if ((prevAvgVol === 0 || totalVol >= prevAvgVol) && prCount > 0 && bestCombo >= 3) stars = 3;

  // Build summary line
  const totalSets = logs.reduce((a,l)=>a+(l.sets?l.sets.length:0),0);
  const energyPct = (typeof _sessionEnergy !== 'undefined') ? Math.round(_sessionEnergy) : 0;
  const summaryParts = [totalSets + ' SETS'];
  if (bestCombo >= 2) summaryParts.push('BEST COMBO x' + bestCombo);
  if (prCount > 0) summaryParts.push(prCount + ' PR');
  summaryParts.push(energyPct + '% ENERGY');

  // Render into wend-title area
  const titleEl = document.getElementById('wend-title');
  if (!titleEl) return;
  titleEl.innerHTML =
    '<div class="wend-stars">' +
    [1,2,3].map((n,i) => `<div class="wend-star" id="wend-star-${i+1}">⭐</div>`).join('') +
    '</div>';

  const subEl = document.getElementById('wend-sub');
  if (subEl) {
    const oldSub = subEl.textContent || '';
    subEl.innerHTML = '<div class="wend-star-summary">' + summaryParts.join(' · ') + '</div>' +
      '<div>' + oldSub + '</div>';
  }

  // Animate stars with delay
  if (typeof sndStars === 'function') sndStars(stars);
  if (typeof hapStars === 'function') hapStars(stars);
  for (let i = 0; i < stars; i++) {
    setTimeout(() => {
      const el = document.getElementById('wend-star-' + (i+1));
      if (el) el.classList.add('revealed');
    }, i * 420);
  }
}
```

- [ ] **Step 4: Call _showSessionStars() after overlay is shown**

Find where `overlay.style.display = 'flex'` is set in `_showSessionSummary()` in `index.html` (~line 2597). After that line, add a call:

```js
  if (typeof _showSessionStars === 'function') setTimeout(_showSessionStars, 100);
```

- [ ] **Step 5: Commit**

```bash
git add "js/workout-save.js" "index.html"
git commit -m "feat: add end-of-session star rating with animated reveal"
```

---

### Task 11: Session Start Ceremony (`index.html` + `js/exercises.js`)

**Files:**
- Modify: `index.html` — call ceremony from `startWorkoutSession()`
- Modify: `js/exercises.js` — add ceremony function + energy/combo init on session start

**What:** When `startWorkoutSession()` is called, play a 1.5s countdown overlay (3→2→1→FORGE!), fire `sndSessionStart()` + `hapSessionStart()`, then initialize energy bar and reset combo. Overlay is skippable by tap.

- [ ] **Step 1: Read startWorkoutSession() in index.html (~line 2460)**

Read lines 2460–2486 to understand the full current function.

- [ ] **Step 2: Add session ceremony function in exercises.js**

At the end of `exercises.js`, append:

```js
/* ── Session Start Ceremony ── */
let _ceremonyCancelled = false;

function _skipSessionCeremony() {
  _ceremonyCancelled = true;
  const overlay = document.getElementById('session-start-overlay');
  if (overlay) overlay.classList.remove('active');
  _initSessionArcade();
}

function _initSessionArcade() {
  // Show energy bar, reset all arcade state
  const bar = document.getElementById('session-energy-bar');
  if (bar) bar.style.display = '';
  _resetEnergy();
  resetCombo();
}

function playSessionCeremony() {
  _ceremonyCancelled = false;
  const overlay = document.getElementById('session-start-overlay');
  const num     = document.getElementById('session-countdown-num');
  if (!overlay || !num) {
    _initSessionArcade();
    return;
  }

  if (typeof sndSessionStart === 'function') sndSessionStart();
  if (typeof hapSessionStart === 'function') hapSessionStart();

  overlay.classList.add('active');
  const steps = ['3','2','1','FORGE!'];
  let i = 0;

  function _nextStep() {
    if (_ceremonyCancelled) return;
    if (i >= steps.length) {
      overlay.classList.remove('active');
      _initSessionArcade();
      return;
    }
    num.textContent = steps[i];
    num.classList.remove('pop');
    void num.offsetWidth; // reflow to restart animation
    num.classList.add('pop');
    if (typeof hapTap === 'function') hapTap();
    i++;
    setTimeout(_nextStep, i < steps.length ? 380 : 500);
  }
  _nextStep();
}
```

- [ ] **Step 3: Hook playSessionCeremony into startWorkoutSession()**

In `index.html`, inside `startWorkoutSession()` (after the existing state setup lines), add at the end of the function:

```js
  if (typeof playSessionCeremony === 'function') playSessionCeremony();
```

- [ ] **Step 4: Hook session end into endWorkoutSession()**

In `index.html`, find `endWorkoutSession()` (~line 2488). After the existing session-close logic (when session is confirmed ended, not just the first tap warning), add:

```js
  // Hide energy bar and play session end sound
  const _ebar = document.getElementById('session-energy-bar');
  if (_ebar) _ebar.style.display = 'none';
  if (typeof sndSessionEnd === 'function') sndSessionEnd();
```

- [ ] **Step 5: Read endWorkoutSession() carefully**

Read lines 2488–2540 to find the exact point where session ends (after second-tap confirmation). Insert only in the confirmed-end path, not the first-tap warning path.

- [ ] **Step 6: Commit**

```bash
git add "js/exercises.js" "index.html"
git commit -m "feat: add session start ceremony and session end sound"
```

---

## Chunk 5: Version Bump + Cache + Final Wiring

### Task 12: Version Bump

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1: Bump FORGE_VERSION to v36 in config.js**

Change:
```js
window.FORGE_VERSION = 'v35';
window.FORGE_BUILD   = '2026-03-10 (cache forge-v35)';
```
to:
```js
window.FORGE_VERSION = 'v36';
window.FORGE_BUILD   = '2026-03-10 (cache forge-v36)';
```

- [ ] **Step 2: Bump CACHE_NAME to forge-v36 in sw.js**

Change:
```js
const CACHE_NAME = 'forge-v35';
```
to:
```js
const CACHE_NAME = 'forge-v36';
```

- [ ] **Step 3: Commit**

```bash
git add "js/config.js" "sw.js"
git commit -m "chore: bump version to v36 for arcade gym release"
```

---

### Task 13: Smoke Test Checklist

Manual verification steps (no automated test runner):

- [ ] **Step 1: Open app in browser, confirm no JS console errors**

- [ ] **Step 2: Verify skin-arcade activates**

In browser console: `document.body.classList.add('skin-arcade')` — page should turn purple/dark.

- [ ] **Step 3: Test combo counter**

In console: `_comboCount=0; _incrementCombo(); _incrementCombo(); _incrementCombo();` — combo strip should appear showing "x3".

- [ ] **Step 4: Test energy meter**

In console: `document.getElementById('session-energy-bar').style.display=''; _addEnergy(35);` — bar should be purple labeled "IN THE ZONE".

- [ ] **Step 5: Test session ceremony**

In console: `playSessionCeremony();` — countdown overlay should appear and dismiss.

- [ ] **Step 6: Test star rating**

End a real session with a PR logged, verify star overlay appears.

- [ ] **Step 7: Test sounds**

In console: `sndSessionStart(); sndCombo(3); sndBossMode(); sndStars(3);`

- [ ] **Step 8: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: post-smoke-test corrections"
```

---

## Implementation Notes

### Finding the right selectors in index.html

`index.html` is large (~8500 lines). When editing:
- Use `Grep` with the element id/class before `Edit` to find exact line numbers
- Read a small window (±20 lines) around the insertion point before editing
- Prefer appending to end of functions rather than inserting mid-function

### Arcade skin is additive

`body.skin-arcade` overrides CSS custom properties. Nothing else changes. If a user is below Diamond rank, `skin-arcade` never applies and all existing styles work exactly as before.

### Energy meter visibility

The energy bar `#session-energy-bar` starts `display:none`. It is shown by `_initSessionArcade()` (called from ceremony or skipped ceremony). It is hidden again when the session ends. Between sessions it's invisible.

### Combo timer

The 90-second timer in `_incrementCombo()` is `clearTimeout`'d on each new set, so it only fires if 90 seconds pass with no sets logged. This resets the combo naturally without needing explicit reset on session end (though `resetCombo()` is called from `_initSessionArcade()` to clean state at session start).

### Boss Fight simplified

The design spec mentions pre-detecting PR attempts via the weight picker. This is complex and unreliable. The implementation plan uses post-save detection (inside the confirmed `if (isPR)` block) which is reliable and covers 100% of PRs. The visual effect (4-second boss badge) fires immediately after save confirmation — still feels exciting.
