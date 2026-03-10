# Arcade Gym UI/UX Enhancement — Design Spec

**Goal:** Transform FORGE into a gamified arcade gym experience with a new unlockable purple/gold skin, full sound/haptic coverage, combo counter, session energy meter, Boss Fight PR mode, star rating, and session start ceremony.

**Architecture:** Additive layer on top of existing app — no data model changes, no new files except CSS additions. All new mechanics live in existing JS modules. Arcade skin is a new CSS class (`skin-arcade`) in the existing rank skin system.

**Tech Stack:** Vanilla JS, Web Audio API (existing), Vibration API (existing), CSS custom properties, CSS animations.

---

## Section 1: Arcade Skin (Purple/Gold)

- New CSS class `body.skin-arcade` added to `css/main.css`
- Unlocked at Diamond rank (existing XP system)
- `js/ui-layout-theme.js` updated to apply `skin-arcade` when rank is Diamond+

**Palette:**
```css
body.skin-arcade {
  --accent:   #a855f7;   /* purple */
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
  --gold:     #fbbf24;   /* new variable for combo/reward moments */
}
```

---

## Section 2: New Sound & Haptic Functions

### fx-sound.js additions

| Function | Description | Synth recipe |
|---|---|---|
| `sndSessionStart()` | Rising power-up chord | 3-note ascending sawtooth + sine, 0.8s |
| `sndSessionEnd()` | Epic victory fanfare | 4-beat chord progression, 1.2s |
| `sndCombo(level)` | Escalating combo sound (1/2/3) | level 1: single ping 880Hz; level 2: double ping + 220Hz bass; level 3: full chime burst 5 notes |
| `sndComboBreak()` | Deflating break sound | 440→110Hz descending sine, 0.3s |
| `sndBossMode()` | Tension build for PR attempt | Low growl 80Hz + pulse 440Hz, 0.6s |
| `sndStars(n)` | Star reveal (1/2/3) | n chimes, each 200ms apart, final chord on 3 |

### fx-haptic.js additions

| Function | Pattern |
|---|---|
| `hapCombo(level)` | level 1: [20]; level 2: [30,20,50]; level 3: [50,30,80,30,120] |
| `hapComboBreak()` | [15, 10, 15] |
| `hapBossMode()` | [40, 20, 40, 20, 80] |
| `hapSessionStart()` | [30, 20, 30, 20, 60] |
| `hapStars(n)` | n × [40, 30] with 100ms gaps |

---

## Section 3: Combo Counter (Inline Strip)

**Location:** Inline gold strip above the exercise card in the Log tab. Hidden when combo < 2.

**Logic (in `js/exercises.js`):**
- `_comboCount` — integer, session-scoped
- `_comboTimer` — setTimeout ref, 90-second reset window
- `_bestCombo` — tracks session best for end summary
- Every `addSet()` call: clear timer, increment `_comboCount`, restart 90s timer
- Timer expiry: call `_breakCombo()`
- `resetCombo()` called on session end

**Escalation tiers:**
| Combo | Strip style | Sound | Haptic |
|---|---|---|---|
| x2 | Gold dim, no pulse | — | `hapTap()` |
| x3 | Gold, subtle pulse | `sndCombo(1)` | `hapCombo(1)` |
| x5 | Gold bright + glow | `sndCombo(2)` | `hapCombo(2)` |
| x10+ | "ON FIRE" + flame anim | `sndCombo(3)` | `hapCombo(3)` |

**HTML (index.html):**
```html
<div id="combo-strip" class="combo-strip" style="display:none">
  <div class="combo-strip-left">
    <svg ...><!-- lightning bolt --></svg>
    <span class="combo-strip-label">COMBO STREAK</span>
  </div>
  <span class="combo-strip-count" id="combo-count">x2</span>
</div>
```

**CSS classes:** `.combo-strip`, `.combo-strip-glow`, `.combo-strip-fire`, `.combo-fire-anim`

---

## Section 4: Session Energy Meter

**Location:** Thin 3px bar immediately below the app header, only visible during active session.

**Logic (in `js/exercises.js`):**
- `_sessionEnergy` — float 0–100
- +5 per set logged, +10 per PR, +3 per combo milestone, capped at 100
- `_updateEnergyMeter()` updates bar width + class + label

**States:**
| % | CSS class | Label | Bar color |
|---|---|---|---|
| 0–30 | `energy-warm` | WARMING UP | `#7c3aed` |
| 31–60 | `energy-zone` | IN THE ZONE | `#a855f7` |
| 61–90 | `energy-beast` | BEAST MODE | gradient purple→gold |
| 91–100 | `energy-fire` | ON FIRE | `#fbbf24` pulsing |

Milestone sounds (`sndMilestone()`) fire at 25, 50, 75, 100%.

**HTML:**
```html
<div id="session-energy-bar" style="display:none">
  <div id="session-energy-fill"></div>
  <span id="session-energy-label">WARMING UP</span>
</div>
```

---

## Section 5: Boss Fight PR Mode

**Trigger:** In `addSet()` — after logging, check if new set is a PR. Detected BEFORE logging by comparing input values against `bestLifts`.

**Detection:** When user opens wheel picker for a weight input, compare tentative value against stored PR. If it would be a new PR equivalent (same or more reps at higher weight), set `_bossActive = true`.

**Visual sequence:**
1. Exercise card border cycles gold→red→gold (CSS animation `bossFlash`, 0.5s)
2. Boss badge appears inside card header: `⚔ BOSS FIGHT — PR ATTEMPT`
3. `sndBossMode()` + `hapBossMode()` fire
4. On PR confirmed: `sndPR()` + `hapPR()` + existing screen flash + new "BOSS DEFEATED" badge swap + gold particle burst

**CSS:** `.boss-fight-card`, `.boss-badge`, `.boss-defeated-badge`, `@keyframes bossFlash`

---

## Section 6: End-of-Session Star Rating

**Location:** Top of existing `#wend-overlay` — replaces "SESSION COMPLETE" text with star display.

**Scoring:**
- 1 star: any completed session
- 2 stars: volume ≥ 80% of previous session average OR 1+ PR
- 3 stars: volume ≥ previous session average AND 1+ PR AND best combo ≥ x3

**Animation:** Stars reveal sequentially with 400ms gap each, using existing `ach-pop` keyframe.

**Sound/haptic:** `sndStars(n)` + `hapStars(n)` — one chime/pulse per star.

**New summary line below stars:**
```
3 SETS · BEST COMBO x8 · 1 PR · 87% ENERGY
```

**Implementation:** `js/workout-save.js` — after existing save logic, calculate stars, render into `#wend-title` area.

---

## Section 7: Session Start Ceremony

**Trigger:** `startSession()` call (when first exercise logged or explicit start button tapped).

**Sequence (1.5s, skippable):**
1. Purple/gold gradient overlay fades in (0.2s)
2. Countdown: "3" → "2" → "1" → "FORGE!" — each with `numPop` animation + `hapTap()`
3. `sndSessionStart()` plays across countdown
4. Overlay fades out, energy meter initializes at 0%, combo resets

**Skip:** `touchstart` anywhere on overlay cancels countdown and jumps straight to workout.

**HTML:** `<div id="session-start-overlay">` with `<div id="session-countdown-num">` inner element.

**CSS:** `#session-start-overlay`, `@keyframes countdownPop`

---

## Files Changed

| File | Changes |
|---|---|
| `css/main.css` | Arcade skin vars, combo strip, energy bar, boss fight, star styles, session ceremony |
| `js/fx-sound.js` | 6 new sound functions |
| `js/fx-haptic.js` | 5 new haptic functions |
| `js/exercises.js` | Combo counter logic, energy meter logic, boss fight detection, session ceremony trigger |
| `js/workout-save.js` | Star rating calculation, new end-screen render |
| `js/ui-layout-theme.js` | skin-arcade applied at Diamond rank |
| `index.html` | Combo strip HTML, energy bar HTML, boss badge HTML, session ceremony overlay HTML |
| `sw.js` | Cache bump |
| `js/config.js` | Version bump |
