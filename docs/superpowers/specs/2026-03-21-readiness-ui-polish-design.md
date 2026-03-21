# Readiness UI Polish & Production Readiness — Design Spec
**Date:** 2026-03-21
**Status:** Approved by user

---

## Overview

Four targeted fixes to make the Readiness view production-ready:
1. Visual polish — match Dashboard `.panel` card system
2. Button fix — correct redirect to Log tab
3. Localhost seed script — 30 days of realistic test data
4. Backup/restore — add `forge_readiness_log` to existing data-transfer export/import

---

## Fix 1: Visual Polish — Match Dashboard Card System

### Card Wrapping
Every section in `#view-readiness` gets wrapped in a `.panel` container:
- `.readiness-score-section` → inside `.panel`
- `.readiness-breakdown-grid` → inside `.panel`
- Each chart section → inside `.panel`
- `.readiness-insights` → inside `.panel`

### Section Headers
Replace custom `.readiness-chart-title` h3 elements with `<div class="wnr-section-label">` (confirmed existing class in `css/main.css` line 22926: DM Mono, 9px, uppercase, letter-spacing 2px, color `var(--text3)`). Use inside `.panel-header` div for chart sections.

### Score Ring Enhancement
Add a soft radial glow behind the ring using the zone color via CSS custom property `--rd-ring-color`. Style: `box-shadow: 0 0 32px 4px var(--rd-ring-color, #3b82f6)` at 30% opacity. Matches the glow effect on dashboard stat rings.

### Metric Breakdown Grid
Update grid layout to match dashboard stat grid: `grid-template-columns: repeat(2, 1fr)` with `gap: 12px`. Each `.readiness-item` uses `.panel` inner card styling with `padding: 12px 14px`.

### No-Checkin State
Style the empty state with a centered icon (💤), a heading, and the button — matching the dashboard empty state pattern (centered flex column, muted icon, subtle text).

---

## Fix 2: Button Redirect Fix

**File:** `index.html` — the `#view-readiness` div

**Current (broken):**
```html
<button onclick="switchView('log', document.getElementById('bnav-log'))">Go to Check-in</button>
```

**Fixed:**
```html
<button class="btn-primary" onclick="switchView('log', document.getElementById('bnav-log')); setTimeout(()=>{ const ci = document.querySelector('.ctoday-card'); if(ci) ci.scrollIntoView({behavior:'smooth'}); }, 300)">
  Start Today's Check-in
</button>
```

This:
1. Correctly switches to the Log tab and activates `bnav-log` (confirmed: `id="bnav-log"` exists in nav)
2. Uses `.btn-primary` to match app button style
3. Scrolls to `.ctoday-card` (confirmed selector at `index.html` line 5971) after tab switch
4. Renames label from "Go to Check-in" to "Start Today's Check-in" (more actionable)
5. `setTimeout(300ms)` gives the view time to render before scrolling

---

## Fix 3: Localhost Seed Script

**File:** `scripts/seed-readiness.js`

A Node.js script that outputs a `localStorage` injection snippet. Since it's a browser app, the script generates a ready-to-paste browser console command.

**Usage:**
```bash
node scripts/seed-readiness.js
```
Outputs a single `localStorage.setItem('forge_readiness_log', JSON.stringify([...]))` command. User pastes it into browser DevTools console (`F12 → Console`) while on `http://localhost:8765`, then refreshes.

**No npm dependencies required** — uses only Node.js built-ins (`process.stdout`).

**Data shape:** 30 daily entries with:
- Scores ranging 42–91 (realistic variation, not uniform)
- Zones distributed: ~40% good, ~25% peak, ~25% caution, ~10% rest
- `partial: true` for older entries (no HRV/RHR), `partial: false` for last 7 (has biometrics)
- `inputs.trainingLoad` varies realistically (rest days = 0, hard days = 18000–32000)
- `inputs.hrv` ranges 52–78ms; `inputs.rhr` ranges 52–64bpm for recent entries

**Note:** Script is localhost/dev only. No production path touches it.

---

## Fix 4: Backup/Restore — data-transfer.js

**File:** `js/data-transfer.js`

### Export
In `exportJSON()` function (line 181 of `js/data-transfer.js`), add to the exported object alongside existing keys:
```js
readinessLog: _lsGet('forge_readiness_log') || [],
```
The local `_lsGet` is defined at line 182 as `key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }`.

### Import/Restore
In the import handler (around line 224, after `if (data.workouts) ...`), add:
```js
if (data.readinessLog) _lsSet('forge_readiness_log', data.readinessLog);
```
`_lsSet` is the existing helper used for all other restore operations in the same block.

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | Wrap view sections in `.panel`, fix button class + onclick, update section header classes, improve no-checkin state |
| `css/main.css` | Add ring glow style, update metric grid layout, remove redundant custom panel styles now covered by `.panel` |
| `js/data-transfer.js` | Add `readinessLog` to export + import |
| `scripts/seed-readiness.js` | New file — console injection generator |

---

## Out of Scope
- Animated score transitions
- Dark/light theme variants (inherits from existing CSS variables)
- HRV/RHR inline logging from the readiness view
