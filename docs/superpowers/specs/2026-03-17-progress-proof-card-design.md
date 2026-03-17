# Progress Proof Card — Design Spec
**Date:** 2026-03-17
**Version target:** v224
**Status:** Approved for implementation

---

## Overview

A shareable 1080×1350px Canvas image card that tells the user's progress story over their active mesocycle (or last 30 days as fallback). Goal-aware hero stats, body comp bars, top lift improvements, and a "Built with FORGE · #ForgeProof" watermark. Viral acquisition flywheel — every share is a FORGE ad.

---

## Data Layer

### Weight history
Source: `bodyWeight` (`let` global array). Entry shape: `{ date: ISO string, weight: number, unit: 'kg'|'lbs' }`.
Filter entries where `new Date(entry.date) >= windowStart`. First entry in window = start weight, last = current weight. Weight Δ = current − start. Hidden if fewer than 2 entries in window.

### Body composition
Source: `forge_inbody_tests` (localStorage). Entry shape: `{ date: ISO string, bf: number, smm: number, ... }`.
Filter by `entry.date >= windowStart ISO string`. First = baseline, last = current. BF% Δ and SMM Δ computed. Hidden if fewer than 2 tests in window (need before + after to produce a valid delta).

### Top PR gains
Source: `forge_workouts` (let global). Each workout: `{ date: ISO string, logs: [{ exercise, mode, sets: [{ weight, reps }], isPR }] }`.
Algorithm (weighted mode only):
1. For each exercise, find `bestBefore` = max `set.weight` across all workouts with `date < windowStart`
2. Find `bestInWindow` = max `set.weight` across workouts with `date >= windowStart`
3. If both exist and `bestInWindow > bestBefore`: gain = `bestInWindow − bestBefore`, pct = `Math.round((bestInWindow − bestBefore) / bestBefore * 100)`
4. Sort by pct descending, show top 3. Hidden section if no gains found.

### Sessions count
`forge_workouts.filter(w => w.date >= windowStart).length`

### Streak
`calcStreak()` global function.

### Time window
`forge_mesocycle` (localStorage): `{ phase, startDate: ISO string, durationWeeks }`.
- `windowStart` = `forge_mesocycle.startDate` if set, else `new Date(Date.now() - 30*86400000).toISOString()`
- `nWeeks` = `Math.ceil((Date.now() - new Date(windowStart)) / (7*86400000))`
- Phase label = `forge_mesocycle.phase` (e.g. "Hypertrophy") or `userProfile.goal` or `"FORGE"`

### Hero stat selection (goal-aware)

| Goal | Hero A | Hero B |
|---|---|---|
| `fat_loss` | Weight Δ | BF% Δ |
| `muscle_gain` | Top PR gain (exercise + kg) | SMM Δ |
| `recomp` / default | Weight Δ | Top PR gain |

Fallback when hero data unavailable: if either hero stat has no data, promote next available stat from: Weight Δ → BF% Δ → SMM Δ → Top PR → Sessions. If both heroes are unavailable, render SESSIONS (large) as Hero A and STREAK as Hero B.

---

## Canvas Layout — Pixel Coordinates

Canvas: W=1080, H=1350. Horizontal padding: 70px both sides (content width = 940px).

| Zone | Y start | Y end | Content |
|---|---|---|---|
| Header | 0 | 180 | Title, athlete name, phase + weeks |
| Hero stats | 190 | 420 | Two large stat boxes side by side |
| Stat pills | 440 | 570 | 4 pills row (or 3 if Weight Δ hidden) |
| Body comp bars | 590 | 740 | BF% + SMM bars (InBody only, else skip) |
| Top lifts | 760 | 1000 | Up to 3 exercise rows |
| Spacer / overflow | 1000 | 1300 | Background only |
| Watermark | 1310 | 1350 | "Built with FORGE · #ForgeProof" right-aligned |

### Zone detail

**Header (y=0–180)**
- "FORGE PROGRESS PROOF": `700 60px "Bebas Neue"`, color `#54ffab`, x=70, y=96
- Athlete name (right-aligned): `700 24px "Barlow Condensed"`, x=W-70, y=96, textAlign=right
- Phase + weeks: `500 22px "DM Mono"`, color `rgba(179,207,187,.88)`, x=70, y=144 → e.g. "HYPERTROPHY · 8 WEEKS"
- Divider line: `strokeStyle rgba(84,255,171,.2)`, y=170, x=70 to x=1010

**Hero stats (y=190–420)**
Two boxes side by side, each w=450 h=210, gap=40, x start=70
- Box fill: `rgba(13,24,18,.92)`, border `rgba(57,255,143,.46)`, radius=18
- Label: `600 18px "DM Mono"`, color `rgba(161,192,168,.88)`, y+38
- Value: `700 96px "Barlow Condensed"`, color `#54ffab`, y+150
- Unit/sub: `500 22px "DM Mono"`, color `rgba(179,207,187,.8)`, y+188

**Stat pills row (y=440–570)**
Reuse `_drawPill(ctx, x, y, w, h, label, value, accent)` from `share-helpers.js`.
Pill h=120. Always-shown pills: SESSIONS, STREAK. Optional: TOP PR (if data), WEIGHT Δ (if data).
- 4 pills: cw = Math.floor((940 − 3*16)/4) each, gap=16, x start=70
- 3 pills (Weight Δ hidden): cw = Math.floor((940 − 2*16)/3)

**Body comp bars (y=590–740)** — skip entire zone if no InBody data
Section label: `600 18px "DM Mono"`, color `#54ffab`, x=70, y=618
Two bars stacked, each row h=52:
- Row 1 (BF%): label x=70, bar x=220, bar w=600, bar h=24, y=640
- Row 2 (SMM): label x=70, bar x=220, bar w=600, bar h=24, y=700
Bar track: `rgba(30,48,36,.9)`, radius=12. Fill width = `Math.min(Math.abs(delta)/maxDelta, 1) * 600` where maxDelta=5 for BF%, 3 for SMM.
Fill color: improvement (BF% down, SMM up) = `#54ffab`; regression = `#ff6b6b`.
Delta label right of bar: `700 20px "Barlow Condensed"`.

**Top lifts (y=760–1000)** — skip if no PR gains
Section label: `600 18px "DM Mono"`, color `#54ffab`, x=70, y=790
Each row h=70, up to 3 rows:
- Exercise name: `700 28px "Barlow Condensed"`, color `#f0faf2`, x=70
- Before→after: `500 20px "DM Mono"`, color `rgba(179,207,187,.88)`, x=70, y+22
- Pct badge (right): `700 22px "Barlow Condensed"`, color `#54ffab`, right-aligned x=1010

**Watermark (y=1310)**
`500 18px "DM Mono"`, color `rgba(211,228,216,.58)`, textAlign=right, x=W-70, y=1335
Text: `"Built with FORGE · #ForgeProof · " + YYYY-MM-DD`

---

## Trigger Points

### 1. Progress tab — on-demand
- "Share Progress" button added alongside Monthly Report section header
- `onclick="window.shareProgressProofCard && window.shareProgressProofCard()"`

### 2. Sunday weekly prompt
- Called from `window._progressCardInit()` on Progress tab open
- Conditions (ALL must be true):
  - `new Date().getDay() === 0` (Sunday)
  - At least 1 workout in current week (Mon–Sun)
  - `localStorage.getItem('forge_progress_card_last_sunday') !== new Date().toISOString().slice(0,10)`
- Action: `showToast('🏆 Share your week?', 'var(--accent)')` — toast has tap action calling `openProgressProofModal()`
- On show: `localStorage.setItem('forge_progress_card_last_sunday', new Date().toISOString().slice(0,10))`

### 3. Preview modal
New `<div id="progress-proof-overlay">` added to `index.html` after `wend-overlay`. Same CSS classes: `wend-overlay`, `wend-card`. Separate from session card overlay to avoid state conflicts.

HTML structure:
```html
<div id="progress-proof-overlay" class="wend-overlay" style="display:none;"
     onclick="if(event.target===this)closeProgressProofModal()">
  <div class="wend-card">
    <div class="wend-handle"></div>
    <div class="wend-header">
      <div class="wend-title">PROGRESS PROOF</div>
    </div>
    <div class="wend-share-preview-wrap">
      <canvas id="progress-proof-preview" width="1080" height="1350"></canvas>
    </div>
    <div class="wend-footer">
      <button class="btn-wend-share" onclick="window.shareProgressProofCard()">SHARE</button>
      <button class="btn-wend-download" onclick="window.downloadProgressProofCard()">DOWNLOAD</button>
      <button class="btn-wend-close" onclick="closeProgressProofModal()">CLOSE</button>
    </div>
  </div>
</div>
```

`openProgressProofModal()` and `closeProgressProofModal()` defined in `progress-proof-card.js`:
- Open: waits for `document.fonts.ready` then renders card into `#progress-proof-preview`, sets overlay `display:block`, adds `scroll-locked` to body. Font guard ensures Bebas Neue / Barlow Condensed / DM Mono are loaded before first `ctx.fillText()` call.
- Close: sets overlay `display:none`, removes `scroll-locked`

---

## File Structure

### New file: `js/progress-proof-card.js`
IIFE, ~300 lines. Reads globals: `bodyWeight`, `userProfile`, `calcStreak`, `showToast`, `_drawPill`, `_roundRect`, `_canvasToBlob`, `_downloadBlob`. No `window.X` for let globals per codebase convention.

Exports to `window`:
- `window.shareProgressProofCard()` — render → Web Share API (PNG file) → download fallback
- `window.downloadProgressProofCard()` — render → download PNG
- `window._progressCardInit()` — Sunday prompt check (called on Progress tab open)
- `window.openProgressProofModal()` — render into preview canvas + show overlay
- `window.closeProgressProofModal()` — hide overlay

### `index.html` changes
1. `<script src="js/progress-proof-card.js">` after `share-helpers.js`
2. `progress-proof-overlay` modal div (HTML above) after `wend-overlay` closing tag
3. "Share Progress" button in Monthly Report section header

### `dashboard-history.js` change
In the Progress tab open handler (line ~720), alongside `renderMonthlyReport()`:
```js
if (typeof window._progressCardInit === 'function') window._progressCardInit();
```

### Version bump
Update `APP_VERSION` in `js/config.js` (or the version string constant used for v223) from `v223` to `v224`.

---

## New localStorage Key
- `forge_progress_card_last_sunday` — `YYYY-MM-DD` ISO date string. Sunday throttle only. Never synced.

---

## Constraints
- Vanilla JS IIFE only — no new dependencies
- All let globals accessed directly (never `window.userProfile`, `window.workouts`, etc.)
- XSS: all user data rendered via `ctx.fillText()` — no innerHTML with user data
- `share-helpers.js` not modified — Canvas helpers consumed via globals only
- Version bump to v224 on completion
