# Stats Overview UX Enhancement — Design Spec
**Date:** 2026-03-12
**Version:** v43

---

## Goal
Full UX overhaul of the Stats → Overview section. Replace the cramped 4-column strip and period filter with a clean, gamified 2×3 stat grid showing all-time metrics. Improve the CALI row in-place.

---

## Scope

### In scope
- Remove period filter tabs (7D / 1M / 3M / 6M / ALL)
- Replace `.stats-bar` with `.stats-grid` (2 col × 3 row)
- Improve CALI row styling + add Journey % progress bar
- Update `renderDashboard()` to populate new elements

### Out of scope
- Charts, graphs, sparklines
- Body composition stats (separate tab)
- BW/Cali tab redesign

---

## The 6 Stat Cards (all all-time)

| ID | Icon | Label | Value source | Sub-text |
|---|---|---|---|---|
| `sg-sessions` | 🏋️ | TOTAL SESSIONS | `workouts.length` | "All time" |
| `sg-volume` | ⚡ | TOTAL VOLUME | `sum(w.totalVolume)` rounded, with unit | "kg lifted" |
| `sg-best-lift` | 🏆 | BEST LIFT | max single set weight | exercise name |
| `sg-streak` | 🔥 | DAY STREAK | `calcStreak()` | motivational message |
| `sg-prs` | 🎯 | TOTAL PRs | `workouts.filter(w=>w.isPR).length` | "Personal records" |
| `sg-last-session` | 📅 | LAST SESSION | most recent workout date | "X days ago" or "Today" |

Accent color (`var(--accent)`) on: Sessions, Volume, Streak values.
Neutral (`var(--text1)`) on: Best Lift, PRs, Last Session values.

---

## CALI Row

Keep 3-metric layout. Add Journey % mini progress bar.

```
🤸 CALI  |  12 BW sessions  |  5/24 skills  |  ████░░░ 21% JOURNEY
```

- Journey bar: `4px` height, `var(--accent)` fill, `var(--border2)` track
- New elements: `#cali-journey-bar-fill` (width driven by JS)
- Skills label: `unlocked/total` format

---

## HTML Changes (`index.html`)

1. **Delete** period filter row (div containing 7D/1M/3M/6M/ALL buttons) under `data-dash-tab="overview"`
2. **Replace** `.stats-bar` div (lines ~1171–1176) with:

```html
<div class="stats-grid" data-dash-tab="overview">
  <div class="sg-card">
    <div class="sg-label">🏋️ Total Sessions</div>
    <div class="sg-val" id="sg-sessions">0</div>
    <div class="sg-sub" id="sg-sessions-sub">All time</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">⚡ Total Volume</div>
    <div class="sg-val" id="sg-volume">0<span class="sg-unit">kg</span></div>
    <div class="sg-sub">kg lifted</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">🏆 Best Lift</div>
    <div class="sg-val sg-neutral" id="sg-best-lift">—</div>
    <div class="sg-sub" id="sg-best-lift-sub">—</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">🔥 Day Streak</div>
    <div class="sg-val" id="sg-streak">0<span class="sg-unit">d</span></div>
    <div class="sg-sub" id="sg-streak-sub">Train today!</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">🎯 Total PRs</div>
    <div class="sg-val sg-neutral" id="sg-prs">0</div>
    <div class="sg-sub">Personal records</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">📅 Last Session</div>
    <div class="sg-val sg-neutral" id="sg-last-session">—</div>
    <div class="sg-sub" id="sg-last-session-sub">—</div>
  </div>
</div>
```

3. **Update** CALI row (lines ~1184–1189): add journey bar, update IDs to `sg-bw-sessions`, `sg-skills`, `sg-journey-pct`, add `#cali-journey-bar-fill`.

---

## CSS Additions (`css/main.css`)

Append after existing `.bw-stats-bar` rules:

```css
/* ── STATS GRID (v43) ── */
.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 14px 14px; }
.sg-card { background:var(--card); border:1px solid var(--border2); border-radius:12px; padding:12px 14px; }
.sg-label { font-family:'DM Mono',monospace; font-size:8px; letter-spacing:1.5px; color:var(--text3); text-transform:uppercase; margin-bottom:4px; }
.sg-val { font-family:'Bebas Neue',sans-serif; font-size:32px; line-height:1.1; color:var(--accent); }
.sg-val.sg-neutral { color:var(--text1); }
.sg-unit { font-size:14px; opacity:.6; margin-left:2px; }
.sg-sub { font-size:10px; color:var(--text3); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* CALI journey bar */
.cali-journey-bar-wrap { flex:1; height:4px; background:var(--border2); border-radius:2px; margin:0 8px; }
.cali-journey-bar-fill { height:4px; background:var(--accent); border-radius:2px; transition:width .4s ease; }
```

---

## JS Changes (`js/dashboard-history.js` — `renderDashboard()`)

Remove the period-filtered stat card block. Replace with all-time logic:

```js
// ── All-time weighted stats ──
const totalSessions = workouts.length;
const totalVol = workouts.reduce((a,w) => a+(w.totalVolume||0), 0);
let bestLift = 0, bestLiftEx = '—';
workouts.forEach(w => w.sets.forEach(s => { if(s.weight > bestLift){ bestLift=s.weight; bestLiftEx=w.exercise; } }));
const streak = calcStreak();
const totalPRs = workouts.filter(w=>w.isPR).length;
const lastW = workouts.slice().sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
const daysAgo = lastW ? Math.floor((Date.now()-new Date(lastW.date))/86400000) : null;

_el('sg-sessions').textContent = totalSessions;
_el('sg-volume').innerHTML = Math.round(totalVol).toLocaleString() + '<span class="sg-unit">kg</span>';
_el('sg-best-lift').textContent = bestLift > 0 ? bestLift+'kg' : '—';
_el('sg-best-lift-sub').textContent = bestLiftEx;
_el('sg-streak').innerHTML = streak + '<span class="sg-unit">d</span>';
_el('sg-streak-sub').textContent = streak>=7?'On fire! 🔥':streak>=3?'Building habit':'Train today!';
_el('sg-prs').textContent = totalPRs;
_el('sg-last-session').textContent = daysAgo===null?'—':daysAgo===0?'Today':daysAgo+'d ago';
_el('sg-last-session-sub').textContent = lastW ? new Date(lastW.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—';

// ── CALI row ──
const bwAll = typeof bwWorkouts!=='undefined'?bwWorkouts:[];
const skillsUnlocked = /* existing totalUnlocked calc */ 0;
const skillsTotal = /* existing totalSkills calc */ 0;
const journeyPct = skillsTotal>0?Math.round((skillsUnlocked/skillsTotal)*100):0;
_el('sg-bw-sessions').textContent = bwAll.length;
_el('sg-skills').textContent = skillsUnlocked+'/'+skillsTotal;
_el('sg-journey-pct').textContent = journeyPct+'%';
const jBar = document.getElementById('cali-journey-bar-fill');
if(jBar) jBar.style.width = journeyPct+'%';
```

Note: `_el(id)` = `document.getElementById(id)`. Skills unlocked/total reuse the existing computation already in `renderDashboard()` / `renderCaliDash()`.

---

## Version Bump
- `FORGE_VERSION` → `'v43'`
- `FORGE_BUILD` → `'2026-03-12 (stats grid ux)'`
- Cache name → `'forge-v43'`

---

## Acceptance Criteria
- [ ] Period filter tabs no longer visible on Stats → Overview
- [ ] 2×3 grid renders 6 cards with correct all-time values
- [ ] Accent color on Sessions, Volume, Streak; neutral on the rest
- [ ] CALI row shows BW sessions, skills X/Y, journey % + filled progress bar
- [ ] No JS errors in console
- [ ] SW cache bumped to forge-v43
