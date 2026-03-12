# Stats Overview UX Enhancement — Design Spec
**Date:** 2026-03-12
**Version:** v43

---

## Goal
Full UX overhaul of the Stats → Overview section. Replace the cramped 4-column strip and period filter with a clean, gamified 2×3 stat grid showing all-time metrics. Improve the CALI row in-place.

---

## Scope

### In scope
- Hide `#dash-period-strip` on the Overview tab only (keep it for Progress/other tabs)
- Replace `.stats-bar` with `.stats-grid` (2 col × 3 row)
- Improve CALI row styling + add Journey % progress bar
- Update `renderDashboard()` to populate new elements

### Out of scope
- Charts, graphs, sparklines
- Body composition stats (separate tab)
- BW/Cali tab redesign

### Period filter note
`_dashPeriod`, `_setPeriod()`, `_getPw()`, and `_dashPeriodDays()` remain untouched — they are used by the Progress tab's volume chart and other sub-renderers. Only `#dash-period-strip` is hidden when the Overview tab is active. This is done by adding `data-dash-tab="overview"` to the strip's parent OR by adding a CSS rule that hides it when the overview tab is selected. Implementer must verify which `switchDashTab()` mechanism is simplest and use that.

---

## The 6 Stat Cards (all all-time)

| DOM ID | Icon | Label | Value source | Sub-text |
|---|---|---|---|---|
| `sg-sessions` | 🏋️ | TOTAL SESSIONS | `workouts.length` | "All time" |
| `sg-volume` | ⚡ | TOTAL VOLUME | `sum(w.totalVolume)` rounded | "kg lifted" |
| `sg-best-lift` | 🏆 | BEST LIFT | max single set weight (see cache note) | exercise name |
| `sg-streak` | 🔥 | DAY STREAK | `calcStreak()` | motivational message |
| `sg-prs` | 🎯 | TOTAL PRs | `workouts.filter(w=>w.isPR).length` | "Personal records" |
| `sg-last-session` | 📅 | LAST SESSION | most recent workout date | "X days ago" or "Today" |

Accent color (`var(--accent)`) on: Sessions, Volume, Streak values.
Neutral (`var(--text1)`) on: Best Lift, PRs, Last Session values.

---

## CALI Row

Replace the existing `.bw-stats-bar` content entirely. New structure:

```html
<!-- BODYWEIGHT WORKOUT STATS -->
<div class="view-section-header" data-dash-tab="overview">
  <span class="vsh-icon"><!-- existing cali svg --></span>
  <span class="vsh-title" data-i18n="dash.bwSection">Bodyweight</span>
  <span class="vsh-line"></span>
</div>
<div class="stats-bar bw-stats-bar" data-dash-tab="overview">
  <div class="stat-card bw-card">
    <div class="stat-label">BW Sessions</div>
    <div class="stat-value" id="sg-bw-sessions">0</div>
    <div class="stat-delta neutral">All time</div>
  </div>
  <div class="stat-card bw-card">
    <div class="stat-label">Skills Done</div>
    <div class="stat-value" id="sg-skills">0/0</div>
    <div class="stat-delta neutral">Unlocked</div>
  </div>
  <div class="stat-card bw-card" style="flex:2;">
    <div class="stat-label">Journey</div>
    <div class="stat-value" id="sg-journey-pct">0%</div>
    <div class="cali-journey-bar-wrap">
      <div class="cali-journey-bar-fill" id="cali-journey-bar-fill" style="width:0%"></div>
    </div>
  </div>
</div>
```

**JS write calls to update in `renderDashboard()`:** The old `elBwSess` / `dash-bw-sessions`, `elBwSets` / `dash-bw-sets`, `elBwTopEx` / `dash-bw-top-ex`, `elBwStreak` / `dash-bw-streak` write calls must all be replaced with the new IDs `sg-bw-sessions`, `sg-skills`, `sg-journey-pct` + journey bar width. The `dash-bw-sets`, `dash-bw-top-ex`, `dash-bw-streak` stat cards are removed from HTML, so their JS writes must also be removed to avoid silent `null` getElementById calls.

---

## HTML Changes (`index.html`)

1. **Hide period filter on overview:** Add `data-dash-tab="progress"` to `#dash-period-strip` (or equivalent mechanism so `switchDashTab('overview')` hides it and `switchDashTab('progress')` shows it). Do NOT delete the element.

2. **Replace** `.stats-bar` div (weighted lifting 4-col strip, lines ~1171–1176) with the `.stats-grid` HTML:

```html
<div class="stats-grid" data-dash-tab="overview">
  <div class="sg-card">
    <div class="sg-label">🏋️ Total Sessions</div>
    <div class="sg-val" id="sg-sessions">0</div>
    <div class="sg-sub">All time</div>
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

3. **Replace** `.bw-stats-bar` div (lines ~1184–1189) with the CALI row HTML shown above.

---

## CSS Additions (`css/main.css`)

Append after existing `.bw-stats-bar` rules:

```css
/* ── STATS GRID (v43) ── */
.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 14px 14px; margin-bottom:20px; }
.sg-card { background:var(--card); border:1px solid var(--border2); border-radius:12px; padding:12px 14px; }
.sg-label { font-family:'DM Mono',monospace; font-size:8px; letter-spacing:1.5px; color:var(--text3); text-transform:uppercase; margin-bottom:4px; }
.sg-val { font-family:'Bebas Neue',sans-serif; font-size:32px; line-height:1.1; color:var(--accent); }
.sg-val.sg-neutral { color:var(--text1); }
.sg-unit { font-size:14px; opacity:.6; margin-left:2px; }
.sg-sub { font-size:10px; color:var(--text3); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* CALI journey bar */
.cali-journey-bar-wrap { width:100%; height:4px; background:var(--border2); border-radius:2px; margin-top:6px; }
.cali-journey-bar-fill { height:4px; background:var(--accent); border-radius:2px; transition:width .4s ease; }
```

Note: `margin-bottom:20px` on `.stats-grid` preserves the spacing that `.stats-bar` previously provided via its own margin rule.

---

## JS Changes (`js/dashboard-history.js` — `renderDashboard()`)

Remove the old period-filtered stat card block (lines that write to `dash-total-vol`, `dash-sessions`, `dash-sets`, `dash-pr`, `dash-pr-exercise`, `dash-vol-delta`, `dash-bw-sessions`, `dash-bw-sets`, `dash-bw-top-ex`, `dash-bw-streak`). Replace with:

```js
// ── All-time weighted stats ──
const totalSessions = workouts.length;
const totalVol = workouts.reduce((a,w) => a+(w.totalVolume||0), 0);

// Best lift — keep _dashPRCache to avoid O(n) loop on every render
if (!_dashPRCache) {
  _dashPRCache = { val: 0, ex: '—' };
  workouts.forEach(w => (w.sets||[]).forEach(s => {
    if (s.weight > _dashPRCache.val) { _dashPRCache.val = s.weight; _dashPRCache.ex = w.exercise; }
  }));
}

const streak = calcStreak();
const totalPRs = workouts.filter(w=>w.isPR).length;
const lastW = workouts.slice().sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
const todayStr = new Date().toISOString().slice(0,10);
const lastDateStr = lastW ? lastW.date.slice(0,10) : null;
const daysAgo = lastDateStr === null ? null
  : lastDateStr === todayStr ? 0
  : Math.floor((Date.now()-new Date(lastDateStr))/86400000);

document.getElementById('sg-sessions').textContent = totalSessions;
document.getElementById('sg-volume').innerHTML = Math.round(totalVol).toLocaleString()+'<span class="sg-unit">kg</span>';
document.getElementById('sg-best-lift').textContent = _dashPRCache.val > 0 ? _dashPRCache.val+'kg' : '—';
document.getElementById('sg-best-lift-sub').textContent = _dashPRCache.ex;
document.getElementById('sg-streak').innerHTML = streak+'<span class="sg-unit">d</span>';
document.getElementById('sg-streak-sub').textContent = streak>=7?'On fire! 🔥':streak>=3?'Building habit':'Train today!';
document.getElementById('sg-prs').textContent = totalPRs;
document.getElementById('sg-last-session').textContent = daysAgo===null?'—':daysAgo===0?'Today':daysAgo+'d ago';
document.getElementById('sg-last-session-sub').textContent = lastDateStr ? new Date(lastDateStr).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—';

// ── CALI row ──
const bwAll = typeof bwWorkouts!=='undefined'?bwWorkouts:[];
// Skills unlocked: same loop used in _renderOverviewSnapshot (lines ~498-506)
let _sgUnlocked=0, _sgTotal=0;
if (bwAll.length && typeof CALISTHENICS_TREES!=='undefined') {
  CALISTHENICS_TREES.forEach(tree => {
    tree.levels.forEach(lvl => {
      _sgTotal++;
      const maxVal = bwAll.filter(w=>w.exercise.toLowerCase()===lvl.n.toLowerCase())
        .reduce((mx,w)=>Math.max(mx,...(w.sets||[]).map(s=>s.reps||s.secs||0)),0);
      if (maxVal>=lvl.target) _sgUnlocked++;
    });
  });
}
const journeyPct = _sgTotal>0 ? Math.round((_sgUnlocked/_sgTotal)*100) : 0;
document.getElementById('sg-bw-sessions').textContent = bwAll.length;
document.getElementById('sg-skills').textContent = _sgUnlocked+'/'+_sgTotal;
document.getElementById('sg-journey-pct').textContent = journeyPct+'%';
const jBar = document.getElementById('cali-journey-bar-fill');
if (jBar) jBar.style.width = journeyPct+'%';
```

---

## Version Bump
- `FORGE_VERSION` → `'v43'`
- `FORGE_BUILD` → `'2026-03-12 (stats grid ux)'`
- Cache name → `'forge-v43'`

---

## Acceptance Criteria
- [ ] `#dash-period-strip` hidden on Overview tab, visible on Progress tab
- [ ] 2×3 grid renders 6 cards with correct all-time values
- [ ] Accent color on Sessions, Volume, Streak; `var(--text1)` on Best Lift, PRs, Last Session
- [ ] Last Session shows "Today" when workout is from today (string comparison, not ms arithmetic)
- [ ] CALI row shows BW sessions, skills X/Y, journey % + filled progress bar
- [ ] Old IDs (`dash-bw-sessions`, `dash-bw-sets`, `dash-bw-top-ex`, `dash-bw-streak`) removed from both HTML and JS
- [ ] No JS errors in console on load or on tab switch
- [ ] SW cache bumped to forge-v43
