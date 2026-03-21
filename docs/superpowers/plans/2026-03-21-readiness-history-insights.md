# Readiness History, Insights & Charts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated Readiness tab in FORGE that computes a daily 0–100 score from 6 wellness inputs, stores history, and renders charts + per-metric coaching insights.

**Architecture:** Score is computed at check-in completion and stored to `forge_readiness_log` (array, capped 365). A new `js/readiness.js` module handles all calculation, storage, insight generation, and chart rendering. The view is wired into the existing `switchView` nav pattern.

**Tech Stack:** Vanilla JS, Chart.js v4 (already loaded), localStorage, existing `.bnav-btn` / `.view` HTML patterns.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `js/readiness.js` | **Create** | Score calc, storage, insight engine, chart rendering, view render |
| `index.html` | **Modify** | Nav button, `#view-readiness` div, `<script>` tag, check-in save hook |
| `css/main.css` | **Modify** | Ring gauge, insight cards, any gaps in existing readiness CSS |

---

## Important Codebase Facts

- **Nav pattern:** `<button class="bnav-btn" id="bnav-X" onclick="switchView('X',this)">` → maps to `<div id="view-X" class="view">`
- **Check-in save:** triggered around line 8739 using `_ciKey()` = `'forge_checkin_' + new Date().toDateString()`
- **Wellness data (HRV/RHR/sleep hours):** stored in `forge_readiness` (existing key, DO NOT overwrite) — access via `JSON.parse(localStorage.getItem('forge_readiness') || '{}')`
- **New history key:** `forge_readiness_log` — array of daily snapshots (distinct from existing `forge_readiness`)
- **Workouts:** `JSON.parse(localStorage.getItem('forge_workouts') || '[]')`
- **Check-in data:** `JSON.parse(localStorage.getItem('forge_checkin_' + new Date().toDateString()) || '{}')`
- **Settings/baseline:** `JSON.parse(localStorage.getItem('forge_settings') || '{}')`

---

## Task 1: Core Score Calculator (`js/readiness.js`)

**Files:**
- Create: `js/readiness.js`

- [ ] **Step 1: Create the file with the score calculation function**

```js
// js/readiness.js
(function() {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────────────

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  // ── Data accessors ────────────────────────────────────────────────────────

  function getCheckin() {
    try { return JSON.parse(localStorage.getItem('forge_checkin_' + new Date().toDateString()) || '{}'); }
    catch(e) { return {}; }
  }

  function getWellnessLog() {
    // existing forge_readiness stores {hrv, rhr, totalSleep, ...}
    try { return JSON.parse(localStorage.getItem('forge_readiness') || '{}'); }
    catch(e) { return {}; }
  }

  function getSettings() {
    try { return JSON.parse(localStorage.getItem('forge_settings') || '{}'); }
    catch(e) { return {}; }
  }

  function getWorkouts() {
    try { return JSON.parse(localStorage.getItem('forge_workouts') || '[]'); }
    catch(e) { return []; }
  }

  function getReadinessLog() {
    try { return JSON.parse(localStorage.getItem('forge_readiness_log') || '[]'); }
    catch(e) { return []; }
  }

  function saveReadinessLog(log) {
    // cap at 365 entries, oldest first
    const trimmed = log.slice(-365);
    localStorage.setItem('forge_readiness_log', JSON.stringify(trimmed));
  }

  // ── Normalization formulas ────────────────────────────────────────────────

  function normalizeCheckinStar(val) {
    // val is 0-5 stars; 0 means not rated → return null
    if (!val || val < 1) return null;
    return (val / 5) * 100;
  }

  function normalizeHRV(hrv, avg7) {
    // hrv and avg7 in ms; avg7 = 7-day personal average
    if (!hrv || !avg7) return null;
    return clamp((hrv / avg7) * 50, 0, 100);
  }

  function normalizeRHR(rhr) {
    // lower rhr = better; 50bpm → 100, 90bpm → ~76
    if (!rhr) return null;
    return clamp(((220 - rhr) / 170) * 100, 0, 100);
  }

  function normalizeTrainingLoad(load7) {
    // load7 = sum of sets*reps*weight(kg) over last 7 calendar days
    // 0 → 100, 50000+ → 0
    return clamp(100 - (load7 / 50000) * 100, 0, 100);
  }

  // ── Training load calculation ─────────────────────────────────────────────

  function calcLoad7() {
    const workouts = getWorkouts();
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let total = 0;
    workouts.forEach(w => {
      if (!w.ts || w.ts < cutoff) return;
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          const reps = parseFloat(s.reps) || 0;
          const weight = parseFloat(s.weight) || 0;
          total += reps * weight;
        });
      });
    });
    return total;
  }

  // ── HRV 7-day average ─────────────────────────────────────────────────────

  function calcHRVAvg7() {
    // Read from readiness log — each entry may have inputs.hrv
    const log = getReadinessLog();
    const recent = log.slice(-7).map(e => e.inputs && e.inputs.hrv).filter(v => v > 0);
    if (recent.length === 0) return null;
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  // ── Score computation ─────────────────────────────────────────────────────

  /**
   * Compute readiness score (0–100) and per-metric breakdown.
   * Returns { score, zone, partial, components }
   */
  function computeScore() {
    const checkin = getCheckin();
    const well = getWellnessLog();
    const settings = getSettings();
    const load7 = calcLoad7();
    const hrv7avg = calcHRVAvg7();

    // Raw values
    const sleepStar = checkin.sleep || 0;        // 0-5
    const energyStar = checkin.energy || 0;       // 0-5
    const moodStar = checkin.mood || 0;           // 0-5
    const hrv = well.hrv || settings.baselineHRV || null;
    const rhr = well.rhr || settings.baselineRHR || null;

    // Normalized 0-100 components (null = missing)
    const sleepN = normalizeCheckinStar(sleepStar);
    const energyN = normalizeCheckinStar(energyStar);
    const moodN = normalizeCheckinStar(moodStar);
    const hrvAvg = hrv7avg || (hrv ? hrv : null);
    const hrvN = normalizeHRV(hrv, hrvAvg);
    const rhrN = normalizeRHR(rhr);
    const loadN = normalizeTrainingLoad(load7);

    // Base weights
    let weights = { sleep: 25, energy: 20, mood: 15, hrv: 20, rhr: 10, load: 10 };
    let partial = false;
    let missing = [];

    if (hrvN === null) { missing.push('hrv'); partial = true; }
    if (rhrN === null) { missing.push('rhr'); partial = true; }

    // Redistribute missing weights to sleep/energy/mood proportionally
    if (missing.length > 0) {
      let freed = missing.reduce((s, k) => s + weights[k], 0);
      const subjTotal = weights.sleep + weights.energy + weights.mood;
      missing.forEach(k => { weights[k] = 0; });
      weights.sleep  += (weights.sleep  / subjTotal) * freed;
      weights.energy += (weights.energy / subjTotal) * freed;
      weights.mood   += (weights.mood   / subjTotal) * freed;
    }

    const vals = { sleep: sleepN, energy: energyN, mood: moodN, hrv: hrvN, rhr: rhrN, load: loadN };
    let totalWeight = 0, weightedSum = 0;
    Object.keys(vals).forEach(k => {
      if (vals[k] !== null) {
        weightedSum += vals[k] * weights[k];
        totalWeight += weights[k];
      }
    });

    const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const zone = scoreZone(score);

    return {
      score,
      zone,
      partial,
      inputs: { sleep: sleepStar, energy: energyStar, mood: moodStar, hrv, rhr, trainingLoad: load7 },
      normalized: vals
    };
  }

  function scoreZone(score) {
    if (score >= 80) return 'peak';
    if (score >= 60) return 'good';
    if (score >= 40) return 'caution';
    return 'rest';
  }

  // ── Public API (attached to window) ──────────────────────────────────────

  window.Readiness = {
    computeScore,
    getReadinessLog,
    saveReadinessLog,
    scoreZone,
    todayISO
  };
})();
```

- [ ] **Step 2: Verify file saved correctly**

Open `js/readiness.js` and confirm the IIFE structure is intact with `window.Readiness` at the bottom.

- [ ] **Step 3: Commit**

```bash
git add js/readiness.js
git commit -m "feat(readiness): add score calculation engine with 6-input formula"
```

---

## Task 2: View HTML + Nav Button + Script Tag

**Files:**
- Modify: `index.html`

> **Must be done before Task 3** so `window.Readiness` is available when testing the check-in hook.

- [ ] **Step 1: Add the nav button**

Find the nav section (around line 2174, the `bnav-more` button). Add a new readiness button before it:

```html
<button class="bnav-btn" id="bnav-readiness" onclick="switchView('readiness',this)">
  <span class="bnav-icon">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  </span>
  <span class="bnav-label" data-i18n="nav.readiness">Readiness</span>
</button>
```

- [ ] **Step 2: Add the view div**

After `<div id="view-social" class="view">` (around line 2052), add:

```html
<div id="view-readiness" class="view">
  <div class="view-header">
    <h2 class="view-title" data-i18n="readiness.title">Daily Readiness</h2>
  </div>

  <!-- Section 1: Today's Score -->
  <div class="readiness-score-section" id="readiness-score-section">
    <div class="readiness-ring-wrap">
      <div class="readiness-ring" id="readiness-ring">
        <span class="readiness-ring-val" id="readiness-ring-val">--</span>
      </div>
      <div class="readiness-zone-label" id="readiness-zone-label"></div>
      <div class="readiness-date-label" id="readiness-date-label"></div>
    </div>
    <div class="readiness-no-checkin" id="readiness-no-checkin" style="display:none">
      <p>Complete today's check-in to see your readiness score.</p>
      <button onclick="switchView('log', document.getElementById('bnav-log'))">Go to Check-in</button>
    </div>
  </div>

  <!-- Section 2: Per-Metric Breakdown -->
  <div class="readiness-grid" id="readiness-breakdown-grid"></div>

  <!-- Section 3: 7-Day Trend -->
  <div class="readiness-chart-section">
    <h3 class="readiness-chart-title">7-Day Trend</h3>
    <canvas id="readiness-trend-chart" height="180"></canvas>
  </div>

  <!-- Section 4: 30-Day History -->
  <div class="readiness-chart-section">
    <h3 class="readiness-chart-title">30-Day History</h3>
    <canvas id="readiness-history-chart" height="180"></canvas>
  </div>

  <!-- Section 5: Insights -->
  <div class="readiness-insights" id="readiness-insights"></div>
</div>
```

- [ ] **Step 3: Add the script tag**

Near the other `<script src="js/...">` tags at the bottom of `<body>`, add:

```html
<script src="js/readiness.js"></script>
```

- [ ] **Step 4: Verify the app loads with no console errors**

Open in browser, check console is clean, and confirm the Readiness nav button appears and clicking it shows the (empty) view.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(readiness): add dedicated view and nav button"
```

---

## Task 3: Snapshot Save — Hook into Check-in Completion

**Files:**
- Modify: `index.html` (around line 8739 where `_ciKey()` is defined)

- [ ] **Step 1: Find the check-in save block**

Search for `_ciKey` in `index.html` — it's around line 8739. The save function uses `localStorage.setItem(_ciKey(), ...)`. Find the line that calls the save and any post-save hooks (look for `_runPostSaveSyncHooks` or similar).

- [ ] **Step 2: Add the readiness snapshot call after check-in save**

After the existing check-in localStorage write, add:

```js
// Compute and persist daily readiness snapshot
if (typeof window.Readiness !== 'undefined') {
  (function() {
    const snap = window.Readiness.computeScore();
    const log = window.Readiness.getReadinessLog();
    const today = window.Readiness.todayISO();
    const idx = log.findIndex(e => e.date === today);
    const entry = { date: today, score: snap.score, zone: snap.zone, partial: snap.partial, inputs: snap.inputs };
    if (idx >= 0) { log[idx] = entry; } else { log.push(entry); }
    window.Readiness.saveReadinessLog(log);
  })();
}
```

- [ ] **Step 3: Verify no syntax errors**

Open the app in browser (or run `node -e "require('fs').readFileSync('index.html','utf8')"` to check it's valid UTF-8). Check browser console for errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(readiness): persist snapshot to forge_readiness_log on check-in save"
```

---

## Task 3: Insight Generator

**Files:**
- Modify: `js/readiness.js`

- [ ] **Step 1: Add insight generation function to readiness.js**

Add before the `window.Readiness` export:

```js
// ── Coaching tip matrix ───────────────────────────────────────────────────

const TIPS = {
  sleep: {
    peak:    'Well rested — your recovery is fueling performance.',
    good:    'Decent sleep — you\'re good to train.',
    caution: 'Sleep was subpar — warm up longer and avoid PRs.',
    rest:    'Poor sleep — prioritize rest over intensity today.'
  },
  energy: {
    peak:    'High energy — great day to push limits.',
    good:    'Solid energy — train as planned.',
    caution: 'Low energy — keep effort moderate.',
    rest:    'Drained — consider a walk instead of a workout.'
  },
  mood: {
    peak:    'Great mindset — channel it into your session.',
    good:    'Good mood — consistency is paying off.',
    caution: 'Off day mentally — short focused sessions work best.',
    rest:    'Low mood — light movement can help, but don\'t force it.'
  },
  hrv: {
    peak:    'HRV is elevated — your nervous system is primed.',
    good:    'HRV is normal — no adjustments needed.',
    caution: 'HRV is below average — reduce intensity by 10–20%.',
    rest:    'HRV is very low — active recovery only.'
  },
  rhr: {
    peak:    'Low resting HR — cardiovascular recovery is strong.',
    good:    'RHR is normal — no concern.',
    caution: 'RHR elevated — monitor for fatigue or illness.',
    rest:    'RHR significantly high — rest and hydrate.'
  },
  load: {
    peak:    'Low weekly load — room to push harder.',
    good:    'Balanced load — keep your current rhythm.',
    caution: 'Load is accumulating — plan a lighter session.',
    rest:    'High load this week — a rest day will improve next session.'
  }
};

function metricZone(normalizedVal) {
  if (normalizedVal === null) return null;
  return scoreZone(normalizedVal);
}

/**
 * Generate per-metric coaching tips for today's snapshot.
 * Returns { sleep, energy, mood, hrv, rhr, load } — each a string or null.
 */
function generateMetricTips(normalized) {
  const tips = {};
  Object.keys(TIPS).forEach(metric => {
    const key = metric === 'load' ? 'load' : metric;
    const normVal = normalized[key === 'load' ? 'load' : key];
    const zone = metricZone(normVal);
    tips[metric] = zone ? TIPS[metric][zone] : null;
  });
  return tips;
}

/**
 * Generate 2–3 trend insights from the last 7 readiness log entries.
 * Returns array of insight strings.
 */
function generateTrendInsights(log) {
  const insights = [];
  const recent = log.slice(-7);
  if (recent.length < 2) return insights;

  // HRV declining 3+ consecutive days
  const hrvVals = recent.map(e => e.inputs && e.inputs.hrv).filter(v => v > 0);
  if (hrvVals.length >= 3) {
    const last3 = hrvVals.slice(-3);
    if (last3[2] < last3[1] && last3[1] < last3[0]) {
      insights.push('Your HRV has declined 3 days in a row — consider reducing intensity or adding extra recovery.');
    }
  }

  // High training load 5+ of last 7 days
  const highLoad = recent.filter(e => {
    const n = normalizeTrainingLoad(e.inputs && e.inputs.trainingLoad || 0);
    return n < 40;
  });
  if (highLoad.length >= 5) {
    insights.push('Training load has been very high this week — a deload day tomorrow will improve your next session.');
  }

  // Score improving 3+ consecutive days
  if (recent.length >= 3) {
    const last3scores = recent.slice(-3).map(e => e.score);
    if (last3scores[2] > last3scores[1] && last3scores[1] > last3scores[0]) {
      insights.push('Your readiness has improved 3 days in a row — your recovery strategy is working!');
    }
  }

  // Missing HRV/RHR nudge
  const well = getWellnessLog();
  if (!well.hrv || !well.rhr) {
    insights.push('Log your HRV and Resting HR in the wellness section for a more accurate readiness score.');
  }

  return insights.slice(0, 3);
}
```

- [ ] **Step 2: Expose new functions in window.Readiness**

Update the export at the bottom of the file:

```js
window.Readiness = {
  computeScore,
  getReadinessLog,
  saveReadinessLog,
  scoreZone,
  todayISO,
  generateMetricTips,
  generateTrendInsights
};
```

- [ ] **Step 3: Commit**

```bash
git add js/readiness.js
git commit -m "feat(readiness): add per-metric coaching tips and 7-day trend insight generator"
```

---

## Task 4: View Renderer

**Files:**
- Modify: `js/readiness.js`

- [ ] **Step 1: Add the render function**

Add to `js/readiness.js`, before the `window.Readiness` export:

```js
// ── Zone display helpers ──────────────────────────────────────────────────

const ZONE_META = {
  peak:    { label: 'Push Hard Today', color: '#22c55e' },
  good:    { label: 'Train Normally',  color: '#3b82f6' },
  caution: { label: 'Train Light',     color: '#f59e0b' },
  rest:    { label: 'Rest Day',        color: '#ef4444' }
};

const METRIC_ICONS = {
  sleep: '💤', energy: '⚡', mood: '😊', hrv: '💓', rhr: '❤️', load: '🏋️'
};

const METRIC_LABELS = {
  sleep: 'Sleep', energy: 'Energy', mood: 'Mood',
  hrv: 'HRV', rhr: 'Resting HR', load: 'Training Load'
};

// ── Chart instances (prevent duplicate creation) ──────────────────────────
let _trendChart = null;
let _histChart  = null;

// ── Main render ───────────────────────────────────────────────────────────

function renderReadinessView() {
  const log = getReadinessLog();
  const todayKey = todayISO();
  const todayEntry = log.find(e => e.date === todayKey);
  const hasCheckin = !!todayEntry;

  // Section 1: Score ring
  const ring = document.getElementById('readiness-ring');
  const ringVal = document.getElementById('readiness-ring-val');
  const zoneLabel = document.getElementById('readiness-zone-label');
  const dateLabel = document.getElementById('readiness-date-label');
  const noCheckin = document.getElementById('readiness-no-checkin');
  const scoreSection = document.getElementById('readiness-score-section');

  if (!hasCheckin) {
    if (ring) ring.style.display = 'none';
    if (noCheckin) noCheckin.style.display = '';
  } else {
    if (ring) ring.style.display = '';
    if (noCheckin) noCheckin.style.display = 'none';
    const zm = ZONE_META[todayEntry.zone] || ZONE_META.good;
    if (ring) ring.style.setProperty('--rd-ring-color', zm.color);
    if (ringVal) ringVal.textContent = todayEntry.score;
    if (zoneLabel) zoneLabel.textContent = zm.label;
    if (dateLabel) dateLabel.textContent = new Date().toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
  }

  // Section 2: Per-metric breakdown
  const grid = document.getElementById('readiness-breakdown-grid');
  if (grid && hasCheckin) {
    const snap = computeScore(); // recompute for normalized values
    const tips = generateMetricTips(snap.normalized);
    grid.innerHTML = Object.keys(METRIC_ICONS).map(metric => {
      const normVal = snap.normalized[metric === 'load' ? 'load' : metric];
      const zone = normVal !== null ? scoreZone(normVal) : null;
      const colorClass = zone ? `readiness-val--${zone}` : '';
      const displayVal = metric === 'hrv' ? (snap.inputs.hrv ? snap.inputs.hrv + ' ms' : '—')
                       : metric === 'rhr' ? (snap.inputs.rhr ? snap.inputs.rhr + ' bpm' : '—')
                       : metric === 'load' ? Math.round(snap.inputs.trainingLoad || 0).toLocaleString()
                       : (snap.inputs[metric] || 0) + '★';
      return `<div class="readiness-item">
        <span class="readiness-icon">${METRIC_ICONS[metric]}</span>
        <span class="readiness-label">${METRIC_LABELS[metric]}</span>
        <span class="readiness-val ${colorClass}">${displayVal}</span>
        <span class="readiness-tip">${tips[metric] || ''}</span>
      </div>`;
    }).join('');
  }

  // Section 3: 7-day trend chart
  renderTrendChart(log);

  // Section 4: 30-day history chart
  renderHistoryChart(log);

  // Section 5: Insights
  const insightsEl = document.getElementById('readiness-insights');
  if (insightsEl) {
    const insights = generateTrendInsights(log);
    insightsEl.innerHTML = insights.length === 0
      ? '<p class="readiness-insight-empty">Complete a few more check-ins to see trend insights.</p>'
      : insights.map(i => `<div class="readiness-insight-card">${i}</div>`).join('');
  }
}

// ── Chart renderers ───────────────────────────────────────────────────────

function renderTrendChart(log) {
  const canvas = document.getElementById('readiness-trend-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = log.find(e => e.date === key);
    last7.push({ label: d.toLocaleDateString(undefined, { weekday:'short' }), score: entry ? entry.score : null });
  }

  if (_trendChart) { _trendChart.destroy(); _trendChart = null; }

  _trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: last7.map(d => d.label),
      datasets: [{
        data: last7.map(d => d.score),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        pointBackgroundColor: last7.map(d => {
          if (d.score === null) return 'transparent';
          return ZONE_META[scoreZone(d.score)].color;
        }),
        pointRadius: 5,
        tension: 0.3,
        spanGaps: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderHistoryChart(log) {
  const canvas = document.getElementById('readiness-history-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = log.find(e => e.date === key);
    last30.push({ label: d.toLocaleDateString(undefined, { month:'short', day:'numeric' }), score: entry ? entry.score : null, zone: entry ? entry.zone : null });
  }

  if (_histChart) { _histChart.destroy(); _histChart = null; }

  _histChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: last30.map(d => d.label),
      datasets: [{
        data: last30.map(d => d.score),
        backgroundColor: last30.map(d => d.zone ? ZONE_META[d.zone].color + 'cc' : 'rgba(255,255,255,0.1)'),
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = last30[ctx.dataIndex];
              return d.score !== null ? `Score: ${d.score} — ${ZONE_META[d.zone]?.label || ''}` : 'No data';
            }
          }
        }
      }
    }
  });
}
```

- [ ] **Step 2: Update `window.Readiness` export and hook into `switchView`**

Replace the `window.Readiness` export block at the bottom of `js/readiness.js` with:

```js
window.Readiness = {
  computeScore,
  getReadinessLog,
  saveReadinessLog,
  scoreZone,
  todayISO,
  generateMetricTips,
  generateTrendInsights,
  renderReadinessView
};
```

Then find the `switchView` function in `index.html` (around line 3415). After the view switch logic, add a call to render the readiness view when it's activated:

```js
// Inside switchView, after the views are toggled:
if (name === 'readiness' && typeof window.Readiness !== 'undefined') {
  window.Readiness.renderReadinessView();
}
```

- [ ] **Step 3: Test in browser**

1. Complete a check-in (energy/sleep/mood stars)
2. Switch to the Readiness view
3. Confirm score ring shows, breakdown grid shows 6 metrics, both charts render
4. Check console for errors

- [ ] **Step 4: Commit**

```bash
git add js/readiness.js index.html
git commit -m "feat(readiness): add full view renderer with ring, breakdown, 7d/30d charts, insights"
```

---

## Task 5: CSS — Ring Gauge + Insight Cards

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1: Add styles at the end of main.css**

```css
/* ── Readiness View ──────────────────────────────────────────────────────── */
.readiness-score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 8px;
}

.readiness-ring-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.readiness-ring {
  --rd-ring-color: #3b82f6;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid var(--rd-ring-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.4s;
}

.readiness-ring-val {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.readiness-zone-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary, #aaa);
}

.readiness-date-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #aaa);
}

.readiness-no-checkin {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary, #aaa);
}

.readiness-chart-section {
  padding: 16px;
}

.readiness-chart-title {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  color: var(--text-secondary, #aaa);
}

/* Per-metric tip inside readiness-item */
.readiness-tip {
  font-size: 0.7rem;
  color: var(--text-secondary, #aaa);
  grid-column: 1 / -1;
  padding: 2px 0 6px;
  line-height: 1.4;
}

/* Zone color modifiers for readiness-val */
.readiness-val--peak    { color: #22c55e; }
.readiness-val--good    { color: #3b82f6; }
.readiness-val--caution { color: #f59e0b; }
.readiness-val--rest    { color: #ef4444; }

/* Insights panel */
.readiness-insights {
  padding: 0 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.readiness-insight-card {
  background: rgba(255,255,255,0.05);
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary, #fff);
}

.readiness-insight-empty {
  color: var(--text-secondary, #aaa);
  font-size: 0.85rem;
  text-align: center;
}
```

- [ ] **Step 2: Test visual quality in browser**

Check all 5 sections look correct. Verify ring color changes per zone, metric cards show tip text, both charts are readable.

- [ ] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "feat(readiness): add ring gauge, insight card, and metric tip styles"
```

---

## Task 6: Final Integration Test

- [ ] **Step 1: End-to-end flow test**

1. Clear `forge_readiness_log` from localStorage (DevTools → Application → Storage)
2. Complete a full check-in (energy 4, sleep 3, mood 5)
3. Navigate to Readiness view
4. Verify: score appears, ring color matches zone, all 6 metric cards show, charts render with today's dot, insights panel shows nudge to log HRV/RHR
5. Log HRV/RHR in the wellness section
6. Re-complete check-in → verify score updates

- [ ] **Step 2: Cold-start test (new user, no history)**

1. Clear all `forge_*` localStorage keys
2. Open app fresh, complete check-in
3. Verify: partial readiness score computed (no HRV/RHR), `partial: true` in stored entry, charts show single data point

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(readiness): complete readiness history, charts, and insights system"
```
