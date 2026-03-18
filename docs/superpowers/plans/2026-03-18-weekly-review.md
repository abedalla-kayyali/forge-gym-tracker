# Weekly Review Card Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a permanent Weekly Review panel to the Progress tab showing leading KPI performance vs last week, a forward projection toward goal, and data-driven "1 win + 1 fix" coaching insights.

**Architecture:** New IIFE `js/weekly-review.js` handles all data computation and rendering. Reads `let` globals (`bodyWeight`, `workouts`, `mealsLog`, `userProfile`, `stepsData`) with localStorage fallbacks. Wired into the Progress tab open handler in `dashboard-history.js`. Container div added to `index.html` before the Monthly Report panel.

**Tech Stack:** Vanilla JS IIFE, localStorage, `window.FORGE_OVERLOAD` API

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `js/weekly-review.js` | Full IIFE — data helpers, render function |
| Modify | `index.html` | Add panel HTML before monthly-report-panel (~line 1143) |
| Modify | `js/dashboard-history.js` | Add render call at line ~720 |
| Modify | `js/config.js` | Version bump v230 → v231 |

---

## Task 1: Data helpers

**Files:**
- Create: `js/weekly-review.js`

- [x] **Step 1: Create the IIFE shell with week-bounds helper**

Create `js/weekly-review.js`:

```js
'use strict';
// FORGE Weekly Review Card
// Permanent Progress tab panel — leading KPI hit rate this week vs last,
// weight projection, and data-driven win/fix coaching insight.

(function () {
  // ── Helpers ────────────────────────────────────────────────────────────────
  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Returns { weekStart: Date, weekEnd: Date } for Mon–Sun containing `date`
  function _weekBounds(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun 1=Mon … 6=Sat
    const diffToMon = (day === 0) ? -6 : 1 - day;
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMon, 0, 0, 0, 0);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6, 23, 59, 59, 999);
    return { weekStart: mon, weekEnd: sun };
  }

  // Returns ISO date string YYYY-MM-DD for a Date in local time
  function _isoDate(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // Returns all ISO dates in a Mon–Sun week as array of strings
  function _weekDates(weekStart) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      return _isoDate(d);
    });
  }
```

- [x] **Step 2: Add protein days helper**

Append inside the IIFE:

```js
  // ── KPI helpers ────────────────────────────────────────────────────────────

  function _getProteinTarget() {
    const up = (typeof userProfile !== 'undefined' ? userProfile : null) || _lsGet('forge_profile', {});
    return Math.round(parseFloat(up.weight || 75) * 1.8);
  }

  function _proteinDaysInWeek(dates) {
    const meals = (typeof mealsLog !== 'undefined' ? mealsLog : null) || _lsGet('forge_meals', {});
    const target = _getProteinTarget();
    if (target <= 0) return 0;
    return dates.filter(d => {
      const dayMeals = Array.isArray(meals[d]) ? meals[d] : [];
      const prot = dayMeals.reduce((s, m) => s + (parseFloat(m.protein || m.p) || 0), 0);
      return prot >= target * 0.9;
    }).length;
  }

  function _trainingSessionsInWeek(dates) {
    const wkts = (typeof workouts !== 'undefined' ? workouts : null) || _lsGet('forge_workouts', []);
    const set = new Set(dates);
    return (Array.isArray(wkts) ? wkts : [])
      .filter(w => set.has((w.date || '').slice(0, 10))).length;
  }

  function _sleepDaysInWeek(dates) {
    const rdy = _lsGet('forge_readiness', {});
    return dates.filter(d => parseFloat((rdy[d] || {}).totalSleep) >= 7).length;
  }

  function _stepsDaysInWeek(dates) {
    const sd = (typeof stepsData !== 'undefined' ? stepsData : null) || _lsGet('forge_steps', {});
    return dates.filter(d => {
      const entry = sd[new Date(d + 'T00:00:00').toDateString()];
      if (!entry) return false;
      const steps = typeof entry === 'number' ? entry : (entry.steps || 0);
      const goal  = typeof entry === 'number' ? 10000 : (entry.goal || 10000);
      return steps >= goal;
    }).length;
  }
```

- [x] **Step 3: Add weight projection helper**

Append inside the IIFE:

```js
  // ── Weight projection ──────────────────────────────────────────────────────
  function _getWeightProjection() {
    const bw = (typeof bodyWeight !== 'undefined' ? bodyWeight : null) || _lsGet('forge_bodyweight', []);
    const up = (typeof userProfile !== 'undefined' ? userProfile : null) || _lsGet('forge_profile', {});
    const cutoff = _isoDate(new Date(Date.now() - 14 * 86400000));
    const entries = (Array.isArray(bw) ? bw : [])
      .filter(e => e && e.date && e.weight && e.date.slice(0, 10) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (entries.length < 4) return { type: 'no_data' };

    // Linear regression: x = day index, y = weight
    const n = entries.length;
    const base = new Date(entries[0].date).getTime();
    const xs = entries.map(e => (new Date(e.date).getTime() - base) / 86400000);
    const ys = entries.map(e => Number(e.weight));
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    const slope = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0) /
                  xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
    const weeklyRate = slope * 7; // kg per week

    const currentWeight = ys[ys.length - 1];
    const unit = entries[0].unit || 'kg';
    const goalWeight = parseFloat(up.goalWeight);
    const goal = up.goal || 'recomp';

    if (Math.abs(weeklyRate) < 0.05) {
      return { type: 'stable', currentWeight, unit };
    }

    if (goal === 'fat_loss' && goalWeight && currentWeight > goalWeight) {
      if (weeklyRate >= 0) return { type: 'wrong_direction', goal, weeklyRate: Math.round(weeklyRate * 10) / 10, unit };
      const weeks = Math.round((currentWeight - goalWeight) / Math.abs(weeklyRate));
      return { type: 'on_track', goal, weeklyRate: Math.round(weeklyRate * 10) / 10, goalWeight, weeks, unit };
    }

    if (goal === 'muscle_gain' && goalWeight && currentWeight < goalWeight) {
      if (weeklyRate <= 0) return { type: 'wrong_direction', goal, weeklyRate: Math.round(weeklyRate * 10) / 10, unit };
      const weeks = Math.round((goalWeight - currentWeight) / weeklyRate);
      return { type: 'on_track', goal, weeklyRate: Math.round(weeklyRate * 10) / 10, goalWeight, weeks, unit };
    }

    return { type: 'trend', weeklyRate: Math.round(weeklyRate * 10) / 10, unit };
  }
```

- [x] **Step 4: Add win/fix selection helper**

Append inside the IIFE:

```js
  // ── Win / Fix selection ────────────────────────────────────────────────────
  function _buildKPIs(thisWeekDates, elapsed) {
    const up = (typeof userProfile !== 'undefined' ? userProfile : null) || _lsGet('forge_profile', {});
    const goal = up.goal || 'recomp';
    const targetSessions = goal === 'recomp' ? 3 : 4;
    const protTarget = _getProteinTarget();
    const avgProt = (function () {
      const meals = (typeof mealsLog !== 'undefined' ? mealsLog : null) || _lsGet('forge_meals', {});
      const total = thisWeekDates.filter(d => Array.isArray(meals[d]) && meals[d].length > 0)
        .reduce((s, d) => {
          const dayMeals = Array.isArray(meals[d]) ? meals[d] : [];
          return s + dayMeals.reduce((ms, m) => ms + (parseFloat(m.protein || m.p) || 0), 0);
        }, 0);
      const loggedDays = thisWeekDates.filter(d => {
        const meals2 = (typeof mealsLog !== 'undefined' ? mealsLog : null) || _lsGet('forge_meals', {});
        return Array.isArray(meals2[d]) && meals2[d].length > 0;
      }).length;
      return loggedDays > 0 ? Math.round(total / loggedDays) : 0;
    })();

    const avgSleep = (function () {
      const rdy = _lsGet('forge_readiness', {});
      const vals = thisWeekDates.map(d => parseFloat((rdy[d] || {}).totalSleep) || 0).filter(v => v > 0);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    })();

    const avgSteps = (function () {
      const sd = (typeof stepsData !== 'undefined' ? stepsData : null) || _lsGet('forge_steps', {});
      const vals = thisWeekDates.map(d => {
        const entry = sd[new Date(d + 'T00:00:00').toDateString()];
        if (!entry) return 0;
        return typeof entry === 'number' ? entry : (entry.steps || 0);
      }).filter(v => v > 0);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    })();

    const stepGoal = (function () {
      const sd = (typeof stepsData !== 'undefined' ? stepsData : null) || _lsGet('forge_steps', {});
      for (const d of [...thisWeekDates].reverse()) {
        const entry = sd[new Date(d + 'T00:00:00').toDateString()];
        if (entry && typeof entry === 'object' && entry.goal) return entry.goal;
      }
      return 10000;
    })();

    const overloadScore = (typeof window.FORGE_OVERLOAD !== 'undefined')
      ? window.FORGE_OVERLOAD.getMuscleOverloadScore(null)
      : null;

    const protDays    = _proteinDaysInWeek(thisWeekDates);
    const sessions    = _trainingSessionsInWeek(thisWeekDates);
    const sleepDays   = _sleepDaysInWeek(thisWeekDates);
    const stepsDays   = _stepsDaysInWeek(thisWeekDates);

    return [
      {
        id: 'protein', icon: '🥩', label: 'Protein',
        display: `${protDays}/${elapsed} days`,
        score: Math.round((protDays / elapsed) * 100),
        winText: `You hit your protein target ${protDays}/${elapsed} days — averaging ${avgProt}g vs ${protTarget}g goal. That's the foundation of your progress.`,
        fixText: `You hit protein ${protDays}/${elapsed} days (avg ${avgProt}g vs ${protTarget}g target). Pre-log your meals in the morning to stay on track.`
      },
      {
        id: 'training', icon: '💪', label: 'Training',
        display: `${sessions} sessions`,
        score: Math.round((sessions / targetSessions) * 100),
        winText: `${sessions} sessions this week — strong output. Your body is responding, keep the momentum.`,
        fixText: `Only ${sessions} sessions this week vs ${targetSessions} target. One missed session compounds — block your next workout now.`
      },
      {
        id: 'sleep', icon: '😴', label: 'Sleep 7h+',
        display: `${sleepDays}/${elapsed} days`,
        score: Math.round((sleepDays / elapsed) * 100),
        winText: `${sleepDays} nights of 7h+ sleep this week (avg ${avgSleep}h). Recovery is your secret weapon — protect it.`,
        fixText: `You averaged ${avgSleep}h sleep this week (${sleepDays}/${elapsed} nights hit 7h). Try a consistent 10:30pm bedtime.`
      },
      {
        id: 'steps', icon: '👟', label: 'Steps goal',
        display: `${stepsDays}/${elapsed} days`,
        score: Math.round((stepsDays / elapsed) * 100),
        winText: `You hit your steps goal ${stepsDays}/${elapsed} days. Active lifestyle compounds your results.`,
        fixText: `You hit your steps goal ${stepsDays}/${elapsed} days (avg ${avgSteps.toLocaleString()} vs ${stepGoal.toLocaleString()} goal). A 20-min walk after dinner adds ~2,500 steps.`
      },
      overloadScore !== null ? {
        id: 'overload', icon: '📊', label: 'Overload',
        display: `${overloadScore}%`,
        score: overloadScore,
        winText: `${overloadScore}% overload score — you beat or matched your last session on most exercises. That's the stimulus for growth.`,
        fixText: `${overloadScore}% overload score this week. Push slightly harder on your top sets — even +1 rep counts.`
      } : null
    ].filter(Boolean);
  }
```

- [x] **Step 5: Commit data helpers**

```bash
git add js/weekly-review.js
git commit -m "feat: weekly-review data helpers (week bounds, KPI calc, projection)"
```

---

## Task 2: Render function

**Files:**
- Modify: `js/weekly-review.js`

- [x] **Step 1: Add projection HTML helper**

Append inside the IIFE:

```js
  // ── Renderers ──────────────────────────────────────────────────────────────

  function _projectionHtml(proj) {
    if (!proj || proj.type === 'no_data') {
      return `<div class="wr-projection wr-proj-empty">Log your weight daily this week to unlock your projection.</div>`;
    }
    if (proj.type === 'stable') {
      return `<div class="wr-projection">📈 Weight holding steady at ${proj.currentWeight}${proj.unit} — adjust calories to resume progress.</div>`;
    }
    if (proj.type === 'wrong_direction') {
      const dir = proj.goal === 'fat_loss' ? 'gaining' : 'losing';
      return `<div class="wr-projection wr-proj-warn">⚠️ Weight trending the wrong way (${proj.weeklyRate > 0 ? '+' : ''}${proj.weeklyRate}${proj.unit}/wk). Adjust your ${proj.goal === 'fat_loss' ? 'calorie intake' : 'surplus'} this week.</div>`;
    }
    if (proj.type === 'on_track') {
      const dir = proj.weeklyRate < 0 ? '' : '+';
      return `<div class="wr-projection">📈 At your current pace (${proj.weeklyRate > 0 ? '+' : ''}${proj.weeklyRate}${proj.unit}/wk), you'll reach ${proj.goalWeight}${proj.unit} in ~${proj.weeks} week${proj.weeks !== 1 ? 's' : ''}.</div>`;
    }
    // type === 'trend'
    const dir = proj.weeklyRate >= 0 ? '+' : '';
    return `<div class="wr-projection">📈 Weight trend: ${dir}${proj.weeklyRate}${proj.unit}/week.</div>`;
  }
```

- [x] **Step 2: Add KPI grid and win/fix HTML helpers**

Append inside the IIFE:

```js
  function _kpiRowHtml(kpi, lastWeekScore) {
    const delta = lastWeekScore !== null ? kpi.score - lastWeekScore : null;
    let arrow = '';
    if (delta !== null) {
      if (delta > 5)       arrow = `<span class="wr-delta wr-up">↑ +${Math.round(delta)}%</span>`;
      else if (delta < -5) arrow = `<span class="wr-delta wr-down">↓ ${Math.round(delta)}%</span>`;
      else                 arrow = `<span class="wr-delta wr-flat">→ same</span>`;
    }
    const cls = kpi.score >= 70 ? 'wr-good' : kpi.score >= 50 ? 'wr-ok' : 'wr-low';
    return `
      <div class="wr-kpi-row">
        <span class="wr-kpi-icon">${_esc(kpi.icon)}</span>
        <span class="wr-kpi-label">${_esc(kpi.label)}</span>
        <span class="wr-kpi-val ${cls}">${_esc(kpi.display)}</span>
        ${arrow}
      </div>`;
  }

  function _winFixHtml(win, fix) {
    return `
      <div class="wr-insight wr-win">
        <div class="wr-insight-title">🏆 WIN THIS WEEK</div>
        <div class="wr-insight-body">${_esc(win.winText)}</div>
      </div>
      <div class="wr-insight wr-fix">
        <div class="wr-insight-title">🔧 FIX THIS WEEK</div>
        <div class="wr-insight-body">${_esc(fix.fixText)}</div>
      </div>`;
  }
```

- [x] **Step 3: Add main renderWeeklyReview function**

Append inside the IIFE:

```js
  // ── Main render ────────────────────────────────────────────────────────────
  function renderWeeklyReview() {
    const el = document.getElementById('weekly-review-card');
    if (!el) return;

    const now = new Date();
    const { weekStart, weekEnd } = _weekBounds(now);
    const thisWeekDates = _weekDates(weekStart);

    // Days elapsed in current week (min 1 to avoid division by zero)
    const elapsed = Math.min(7, Math.max(1, Math.floor((now - weekStart) / 86400000) + 1));

    // Need at least 3 days of the week to show meaningful data
    if (elapsed < 3) {
      el.innerHTML = `<div class="wr-empty">Come back after Wednesday — your weekly review will be ready then.</div>`;
      return;
    }

    const lastWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7);
    const lastWeekDates = _weekDates(lastWeekStart);

    const kpis     = _buildKPIs(thisWeekDates, elapsed);
    const kpisLast = _buildKPIs(lastWeekDates, 7);
    const lastMap  = Object.fromEntries(kpisLast.map(k => [k.id, k.score]));

    const proj = _getWeightProjection();

    // Win = highest score KPI, Fix = lowest score KPI
    const sorted = [...kpis].sort((a, b) => b.score - a.score);
    const win = sorted[0];
    const fix = sorted[sorted.length - 1];

    const weekLabel = weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

    el.innerHTML = `
      <div class="wr-wrap">
        <div class="wr-header">
          <span class="wr-title">THIS WEEK</span>
          <span class="wr-week-label">Week of ${_esc(weekLabel)}</span>
        </div>
        ${_projectionHtml(proj)}
        <div class="wr-divider"></div>
        <div class="wr-section-label">THIS WEEK vs LAST WEEK</div>
        <div class="wr-kpi-grid">
          ${kpis.map(k => _kpiRowHtml(k, lastMap[k.id] !== undefined ? lastMap[k.id] : null)).join('')}
        </div>
        <div class="wr-divider"></div>
        ${win && fix && win.id !== fix.id ? _winFixHtml(win, fix) : ''}
      </div>`;
  }

  // ── Global API ──────────────────────────────────────────────────────────────
  window.renderWeeklyReview = renderWeeklyReview;

})();
```

- [x] **Step 4: Commit render function**

```bash
git add js/weekly-review.js
git commit -m "feat: weekly-review render function — projection, KPI grid, win/fix"
```

---

## Task 3: Wire into index.html and dashboard-history.js

**Files:**
- Modify: `index.html` (around line 1143 — before `monthly-report-panel`)
- Modify: `js/dashboard-history.js` (around line 720)

- [x] **Step 1: Add panel HTML to index.html**

In `index.html`, find this comment (around line 1143):
```html
    <!-- MONTHLY PROGRESS REPORT -->
    <div class="panel" data-dash-tab="progress" id="monthly-report-panel">
```

Insert BEFORE it:
```html
    <!-- WEEKLY REVIEW CARD -->
    <div class="panel" data-dash-tab="progress" id="weekly-review-panel">
      <div class="panel-header">
        <span class="panel-title" data-i18n="panel.weeklyReview">Weekly Review</span>
        <span class="panel-badge">7 DAYS</span>
      </div>
      <div id="weekly-review-card" style="padding:4px 14px 14px;">
        <div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Log data for a full week to unlock your weekly review.</div></div>
      </div>
    </div>
```

- [x] **Step 2: Add script tag to index.html**

Find:
```html
<script src="js/goal-dashboard.js"></script>
```

Add after it:
```html
<script src="js/weekly-review.js"></script>
```

- [x] **Step 3: Add render call to dashboard-history.js**

Find (around line 720):
```js
  if (name === 'progress' && typeof renderMonthlyReport === 'function') renderMonthlyReport();
```

Add after it:
```js
  if (name === 'progress' && typeof window.renderWeeklyReview === 'function') window.renderWeeklyReview();
```

- [x] **Step 4: Add CSS to css/main.css**

Append to `css/main.css`:

```css
/* ── Weekly Review Card ──────────────────────────────────────── */
.wr-wrap{padding:2px 0;}
.wr-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.wr-title{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1.5px;color:var(--white);}
.wr-week-label{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);letter-spacing:.5px;}
.wr-projection{font-family:'DM Mono',monospace;font-size:12px;color:var(--text2);padding:8px 12px;background:var(--bg3);border-radius:8px;margin-bottom:10px;line-height:1.5;}
.wr-proj-warn{color:#ffb800;background:rgba(255,184,0,.08);}
.wr-proj-empty{color:var(--text3);}
.wr-divider{height:1px;background:var(--border);margin:10px 0;}
.wr-section-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;color:var(--text3);text-transform:uppercase;margin-bottom:8px;}
.wr-kpi-grid{display:flex;flex-direction:column;gap:6px;}
.wr-kpi-row{display:flex;align-items:center;gap:8px;}
.wr-kpi-icon{font-size:14px;width:20px;text-align:center;}
.wr-kpi-label{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);flex:1;}
.wr-kpi-val{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:600;min-width:80px;text-align:right;}
.wr-good{color:#54ffab;}
.wr-ok{color:#ffb800;}
.wr-low{color:#ff6b6b;}
.wr-delta{font-family:'DM Mono',monospace;font-size:10px;min-width:52px;text-align:right;}
.wr-up{color:#54ffab;}
.wr-flat{color:var(--text3);}
.wr-down{color:#ff6b6b;}
.wr-insight{padding:10px 12px;border-radius:8px;margin-top:8px;}
.wr-win{background:rgba(57,255,143,.06);border:1px solid rgba(57,255,143,.18);}
.wr-fix{background:rgba(255,184,0,.06);border:1px solid rgba(255,184,0,.18);}
.wr-insight-title{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:5px;color:var(--text2);}
.wr-insight-body{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);line-height:1.6;}
.wr-empty{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);text-align:center;padding:18px 0;}
```

- [x] **Step 5: Commit wiring**

```bash
git add index.html js/dashboard-history.js css/main.css
git commit -m "feat: wire weekly-review panel into Progress tab"
```

---

## Task 4: Version bump

**Files:**
- Modify: `js/config.js`

- [x] **Step 1: Update version**

In `js/config.js`, change:
```js
window.FORGE_VERSION = 'v230';
window.FORGE_BUILD   = '2026-03-17 (feat: v230 — steps habit manual toggle + step count indicator)';
```
To:
```js
window.FORGE_VERSION = 'v231';
window.FORGE_BUILD   = '2026-03-18 (feat: v231 — Weekly Review Card in Progress tab)';
```

- [x] **Step 2: Commit and push**

```bash
git add js/config.js
git commit -m "feat: v231 — Weekly Review Card — KPI grid, projection, win/fix insights"
git push
```

---

## Manual Testing Checklist

After implementation, verify in the browser:

- [x] Progress tab shows "Weekly Review" panel above Monthly Report
- [x] With < 3 days elapsed: shows "Come back after Wednesday" message
- [x] With data: projection line shows weight trend or "no data" message
- [x] KPI grid shows 4–5 rows with correct hit counts
- [x] Delta arrows show ↑/↓/→ vs last week when last week data exists
- [x] Win insight highlights the highest-scoring KPI
- [x] Fix insight highlights the lowest-scoring KPI with specific numbers
- [x] Panel re-renders each time Progress tab is opened
