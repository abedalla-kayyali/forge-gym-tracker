# Cardio XP + Stats (v47) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XP gamification (formula, streak banner, 8 badges) to cardio logging and a new Cardio analytics tab with 6 stat cards, 3 Chart.js charts, and a badge trophy grid.

**Architecture:** All vanilla JS globals. `_calcCardioStreak()` lives in `cardio-log.js` (loads first) so `cardio-stats.js` can call it. `calcXP()` in `xp-system.js` accumulates cardio XP via a one-line reduce. `cardio-stats.js` renders the stats panel on tab activation via a hook in `switchDashTab()`.

**Tech Stack:** Vanilla JS (no build, no ES modules), Chart.js 4.4.0, localStorage via `lsGet`/`localStorage.setItem`, `_isoKey()` from `dashboard-history.js`

---

## Chunk 1: Gamification (Tasks 1–4)

### Task 1 — XP formula + toast (`js/cardio-log.js`)

**Files:**
- Modify: `js/cardio-log.js`

`submitCardioLog()` currently has `xpEarned: 0` and a static toast. Replace both.

- [ ] **Step 1:** Open `js/cardio-log.js`. In `submitCardioLog()`, before the `entry` object construction, insert:

```js
  const _mult = { hiit: 1.5, cardio: 1.2, sports: 1.1, recovery: 1.0 };
  const _base = Math.round(dur * 0.5);
  const _bonus = _selectedHRZone * 2;
  const xpEarned = Math.round(_base * (_mult[_selectedCardioAct.cat] || 1.0)) + _bonus;
```

- [ ] **Step 2:** In the `entry` object, change `xpEarned: 0` → `xpEarned: xpEarned`.

- [ ] **Step 3:** Change the static toast to:
```js
  showToast(`Cardio logged! +${xpEarned} XP 🚀`);
```

- [ ] **Step 4:** After `showToast(...)`, add:
```js
  _renderCardioStreakBar();
  if (typeof updateXPBar === 'function') updateXPBar();
```

- [ ] **Step 5:** Verify in browser DevTools:
  - Log 30 min Walk (cardio, no zone) → toast: `+18 XP`
  - Log 30 min HIIT at Z3 → toast: `+29 XP`
  - Log 60 min Yoga (sports, Z1) → toast: `+35 XP`

- [ ] **Step 6:** Commit:
```bash
git add js/cardio-log.js
git commit -m "feat(cardio): XP formula + dynamic toast"
```

---

### Task 2 — Streak functions (`js/cardio-log.js`)

**Files:**
- Modify: `js/cardio-log.js`

- [ ] **Step 1:** Add `_calcCardioStreak()` as a plain global function (before `renderCardioRecentLog()`):

```js
function _calcCardioStreak() {
  const todayKey = _isoKey(new Date());
  const dateSet = new Set(cardioLog.map(e => e.date));
  if (!dateSet.has(todayKey)) return 0;
  let count = 1;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (dateSet.has(_isoKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
```

- [ ] **Step 2:** Add `_renderCardioStreakBar()` immediately after:

```js
function _renderCardioStreakBar() {
  const el = document.getElementById('cardio-streak-bar');
  if (!el) return;
  const streak = _calcCardioStreak();
  el.textContent = streak === 0
    ? 'Start your streak today 💪'
    : `🔥 ${streak} day${streak > 1 ? 's' : ''} streak`;
}
```

- [ ] **Step 3:** Inside `_initCardioLog()`, add `_renderCardioStreakBar();` after the existing `renderCardioRecentLog();` call.

- [ ] **Step 4:** Verify in browser console:
  - No entry today → `_calcCardioStreak()` returns `0`; banner shows "Start your streak today 💪"
  - Log a cardio entry → banner updates to "🔥 1 day streak"

- [ ] **Step 5:** Commit:
```bash
git add js/cardio-log.js
git commit -m "feat(cardio): streak calculation + banner render"
```

---

### Task 3 — Cardio XP in global total (`js/xp-system.js`)

**Files:**
- Modify: `js/xp-system.js`

- [ ] **Step 1:** Open `js/xp-system.js`. Find `calcXP()`. Locate the last `xp +=` line before `return xp;`. Add immediately after:

```js
  // Cardio XP
  xp += (typeof cardioLog !== 'undefined' ? cardioLog : []).reduce((a, e) => a + (e.xpEarned || 0), 0);
```

- [ ] **Step 2:** Verify in DevTools console: log several cardio entries, call `calcXP()` — value should include cardio XP.

- [ ] **Step 3:** Commit:
```bash
git add js/xp-system.js
git commit -m "feat(xp): include cardio xpEarned in calcXP total"
```

---

### Task 4 — Streak bar HTML (`index.html`)

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Find `<div id="cardio-zone"` (line ~1035). Immediately after its opening tag, before the first `<div class="cardio-cat-block">`, insert:

```html
    <div id="cardio-streak-bar" class="cardio-streak-bar"></div>
```

- [ ] **Step 2:** Verify in browser: switch to Cardio·Rec mode → streak bar renders at top of cardio zone.

- [ ] **Step 3:** Commit:
```bash
git add index.html
git commit -m "feat(html): add cardio-streak-bar as first child of cardio-zone"
```

---

## Chunk 2: Stats panel shell (Tasks 5–7)

### Task 5 — Tab button + panel div (`index.html`)

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Find the last `<button class="dash-tab` in `#dash-tab-strip` (the `🤸 Cali` button, line ~1170). Append immediately after:

```html
<button class="dash-tab" onclick="switchDashTab('cardio', this)">Cardio</button>
```

- [ ] **Step 2:** Find `<div id="cali-dash-panel" data-dash-tab="cali" style="display:none;"></div>` (line ~1227). Append after it:

```html
<div data-dash-tab="cardio" style="display:none">
  <div id="cardio-stats-zone"></div>
</div>
```

- [ ] **Step 3:** Verify: open Stats tab → 7th pill "Cardio" appears. Clicking it hides other panels (content empty for now — expected).

- [ ] **Step 4:** Commit:
```bash
git add index.html
git commit -m "feat(html): Cardio tab button + stats panel div"
```

---

### Task 6 — Script tag (`index.html`)

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Find `<script src="js/cardio-log.js"></script>`. Add immediately after:

```html
<script src="js/cardio-stats.js"></script>
```

- [ ] **Step 2:** Commit:
```bash
git add index.html
git commit -m "feat(html): load cardio-stats.js after cardio-log.js"
```

---

### Task 7 — `switchDashTab()` hook (`js/dashboard-history.js`)

**Files:**
- Modify: `js/dashboard-history.js`

- [ ] **Step 1:** Find `switchDashTab()`. Locate:
```js
if (name === 'nutrition' && typeof renderNutritionAnalyticsPanel === 'function') renderNutritionAnalyticsPanel();
```
Add immediately after:
```js
if (name === 'cardio' && typeof renderCardioStatsPanel === 'function') renderCardioStatsPanel();
```

- [ ] **Step 2:** Commit:
```bash
git add js/dashboard-history.js
git commit -m "feat(dashboard): call renderCardioStatsPanel on cardio tab"
```

---

## Chunk 3: `cardio-stats.js` — new file (Tasks 8–10)

### Task 8 — Module shell + period filter + stat cards (`js/cardio-stats.js`)

**Files:**
- Create: `js/cardio-stats.js`

- [ ] **Step 1:** Create `js/cardio-stats.js` with module state + period filter:

```js
'use strict';

// ── Module state ──────────────────────────────────────────────────────────────
let _cardioPeriod = '30D';
let _cardioChart1 = null, _cardioChart2 = null, _cardioChart3 = null;

// ── Period helpers ────────────────────────────────────────────────────────────
function _setCardioPeriod(period, btn) {
  _cardioPeriod = period;
  btn.closest('.dash-period-strip').querySelectorAll('.dash-period')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCardioStatsPanel();
}

function _cardioFilteredLog() {
  const all = typeof cardioLog !== 'undefined' ? cardioLog : [];
  if (_cardioPeriod === 'ALL') return all;
  const days = _cardioPeriod === '7D' ? 7 : _cardioPeriod === '30D' ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = _isoKey(cutoff);
  return all.filter(e => e.date >= cutoffKey);
}
```

- [ ] **Step 2:** Append `renderCardioStatsPanel()`:

```js
// ── Main render ───────────────────────────────────────────────────────────────
function renderCardioStatsPanel() {
  const zone = document.getElementById('cardio-stats-zone');
  if (!zone) return;

  [_cardioChart1, _cardioChart2, _cardioChart3].forEach(c => { if (c) c.destroy(); });
  _cardioChart1 = _cardioChart2 = _cardioChart3 = null;

  const all = typeof cardioLog !== 'undefined' ? cardioLog : [];
  if (!all.length) {
    zone.innerHTML = '<div class="cardio-empty-state">No cardio logged yet — head to the Log tab to get started 🏃</div>';
    return;
  }

  const filtered = _cardioFilteredLog();
  zone.innerHTML = `
    <div class="dash-period-strip">
      <button class="dash-period${_cardioPeriod==='7D'?' active':''}" onclick="_setCardioPeriod('7D',this)">7D</button>
      <button class="dash-period${_cardioPeriod==='30D'?' active':''}" onclick="_setCardioPeriod('30D',this)">30D</button>
      <button class="dash-period${_cardioPeriod==='90D'?' active':''}" onclick="_setCardioPeriod('90D',this)">90D</button>
      <button class="dash-period${_cardioPeriod==='ALL'?' active':''}" onclick="_setCardioPeriod('ALL',this)">All</button>
    </div>
    <div class="stats-grid" id="cardio-sg"></div>
    <div id="cardio-charts-zone"></div>
    <div class="cardio-achievements-title">Achievements</div>
    <div id="cardio-badge-grid-zone"></div>`;

  _renderCardioStatCards(filtered);
  _renderCardioCharts(filtered);
  _renderCardioBadgeGrid(_calcCardioBadges(all));
}
```

- [ ] **Step 3:** Append `_renderCardioStatCards(filtered)`:

```js
// ── Stat cards ────────────────────────────────────────────────────────────────
function _renderCardioStatCards(filtered) {
  const sg = document.getElementById('cardio-sg');
  if (!sg) return;

  const sessions = filtered.length;
  const totalMins = filtered.reduce((a, e) => a + (e.durationMins || 0), 0);
  const timeStr = totalMins >= 60
    ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
    : `${totalMins}m`;
  const avgMin = sessions ? Math.round(totalMins / sessions) : 0;

  const calsFiltered = filtered.filter(e => e.calories > 0);
  const totalCal = calsFiltered.reduce((a, e) => a + e.calories, 0);
  const calStr  = calsFiltered.length ? totalCal.toLocaleString() : '—';
  const calSub  = calsFiltered.length ? `avg ${Math.round(totalCal / sessions)} kcal/session` : '—';

  const actCount = {};
  filtered.forEach(e => { actCount[e.activity] = (actCount[e.activity] || 0) + 1; });
  const topAct = Object.keys(actCount).sort((a, b) => actCount[b] - actCount[a])[0] || '—';
  const topActTimes = topAct !== '—' ? `${actCount[topAct]} times` : '—';

  const streak = typeof _calcCardioStreak === 'function' ? _calcCardioStreak() : 0;
  const totalXP = filtered.reduce((a, e) => a + (e.xpEarned || 0), 0);

  sg.innerHTML = [
    ['🏃 Sessions',     sessions,  'logged days'],
    ['⏱ Total Time',    timeStr,   `avg ${avgMin} min/session`],
    ['💪 Calories',     calStr,    calSub],
    ['🏆 Top Activity', topAct,    topActTimes],
    ['🔥 Cur. Streak',  streak,    'consecutive days'],
    ['🌟 Total XP',     totalXP,   'from cardio'],
  ].map(([label, val, sub]) =>
    `<div class="sg-card"><div class="sg-label">${label}</div><div class="sg-val">${val}</div><div class="sg-sub">${sub}</div></div>`
  ).join('');
}
```

- [ ] **Step 4:** Verify in browser: open Stats → Cardio tab. With entries present, 6 stat cards render. Period filter works.

- [ ] **Step 5:** Commit:
```bash
git add js/cardio-stats.js
git commit -m "feat(cardio-stats): module shell, period filter, stat cards"
```

---

### Task 9 — Chart.js charts (`js/cardio-stats.js`)

**Files:**
- Modify: `js/cardio-stats.js`

- [ ] **Step 1:** Append `_renderCardioCharts(filtered)`:

```js
// ── Charts ────────────────────────────────────────────────────────────────────
function _renderCardioCharts(filtered) {
  const zone = document.getElementById('cardio-charts-zone');
  if (!zone) return;

  // Chart 1 — Weekly Sessions
  const CAT_COL = { hiit:'#e6b84a', cardio:'#39ff8f', sports:'#4a9fe6', recovery:'#4ae69f' };
  const catPriority = ['hiit','cardio','sports','recovery'];
  const weekMap = {};
  filtered.forEach(e => {
    const d = new Date(e.date + 'T00:00:00');
    const sun = new Date(d); sun.setDate(d.getDate() - d.getDay());
    const wk = _isoKey(sun);
    if (!weekMap[wk]) weekMap[wk] = { count: 0, cats: {} };
    weekMap[wk].count++;
    weekMap[wk].cats[e.category] = (weekMap[wk].cats[e.category] || 0) + 1;
  });
  const wkLabels = Object.keys(weekMap).sort();
  const wkCounts = wkLabels.map(k => weekMap[k].count);
  const wkColors = wkLabels.map(k => {
    const cats = weekMap[k].cats;
    const maxVal = Math.max(...catPriority.map(c => cats[c] || 0));
    const dom = catPriority.find(c => (cats[c] || 0) === maxVal);
    return CAT_COL[dom] || '#39ff8f';
  });
  const wkFormatted = wkLabels.map(k => {
    const d = new Date(k + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  });

  // Chart 2 — Duration Trend
  const isWeekly = (_cardioPeriod === '90D' || _cardioPeriod === 'ALL');
  const durMap = {};
  filtered.forEach(e => {
    let key = e.date;
    if (isWeekly) {
      const d = new Date(e.date + 'T00:00:00');
      const sun = new Date(d); sun.setDate(d.getDate() - d.getDay());
      key = _isoKey(sun);
    }
    durMap[key] = (durMap[key] || 0) + (e.durationMins || 0);
  });
  const durKeys   = Object.keys(durMap).sort();
  const durVals   = durKeys.map(k => durMap[k]);
  const durLabels = durKeys.map(k => {
    const d = new Date(k + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  });

  // Chart 3 — HR Zone Distribution
  const zoneCount = [0, 0, 0, 0, 0, 0]; // [NoZone, Z1..Z5]
  filtered.forEach(e => {
    const z = e.hrZone || 0;
    zoneCount[z >= 1 && z <= 5 ? z : 0]++;
  });
  const allNoZone = filtered.every(e => !e.hrZone);

  const _hrZoneCentrePlugin = {
    id: 'hrZoneCentre',
    beforeDraw(chart) {
      const { ctx, chartArea: { width, height, left, top } } = chart;
      ctx.save();
      ctx.font = '600 11px DM Mono, monospace';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HR Zones', left + width / 2, top + height / 2);
      ctx.restore();
    }
  };

  zone.innerHTML = `
    <div class="nut-chart-card">
      <div class="nut-chart-label">Weekly Sessions</div>
      <div style="height:140px"><canvas id="cc1"></canvas></div>
    </div>
    <div class="nut-chart-card">
      <div class="nut-chart-label">Duration Trend</div>
      <div style="height:140px"><canvas id="cc2"></canvas></div>
    </div>
    ${allNoZone
      ? '<p class="cardio-no-data">No HR zone data logged yet</p>'
      : `<div class="nut-chart-card">
           <div class="nut-chart-label">HR Zone Distribution</div>
           <div style="height:140px"><canvas id="cc3"></canvas></div>
         </div>`}`;

  _cardioChart1 = new Chart(document.getElementById('cc1'), {
    type: 'bar',
    data: { labels: wkFormatted, datasets: [{ data: wkCounts, backgroundColor: wkColors, borderRadius: 4 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  _cardioChart2 = new Chart(document.getElementById('cc2'), {
    type: 'line',
    data: { labels: durLabels, datasets: [{ data: durVals, borderColor: '#39ff8f',
      backgroundColor: 'rgba(57,255,143,0.15)', fill: true, tension: 0.3, pointRadius: 2 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  if (!allNoZone) {
    _cardioChart3 = new Chart(document.getElementById('cc3'), {
      type: 'doughnut',
      data: {
        labels: ['No Zone','Z1','Z2','Z3','Z4','Z5'],
        datasets: [{ data: zoneCount,
          backgroundColor: ['#333','#4ae69f','#4a9fe6','#e6b84a','#e6944a','#e64a4a'] }]
      },
      options: { plugins: { legend: { position: 'right' } } },
      plugins: [_hrZoneCentrePlugin]
    });
  }
}
```

- [ ] **Step 2:** Verify in browser:
  - Three charts render on Cardio tab
  - Period filter rebuilds charts without console errors
  - All entries with no HR zone → doughnut replaced with "No HR zone data logged yet"

- [ ] **Step 3:** Commit:
```bash
git add js/cardio-stats.js
git commit -m "feat(cardio-stats): 3 Chart.js charts (bar, line, doughnut)"
```

---

### Task 10 — Badges (`js/cardio-stats.js`)

**Files:**
- Modify: `js/cardio-stats.js`

- [ ] **Step 1:** Append `_calcCardioBadges(log)`:

```js
// ── Badges ────────────────────────────────────────────────────────────────────
function _calcCardioBadges(log) {
  const streak = typeof _calcCardioStreak === 'function' ? _calcCardioStreak() : 0;
  const today  = _isoKey(new Date());

  let cumCal = 0, calCrusherDate = null;
  for (const e of log) {
    cumCal += e.calories || 0;
    if (cumCal >= 5000 && !calCrusherDate) calCrusherDate = e.date;
  }

  const catsSeen = new Set();
  let allRounderDate = null;
  for (const e of log) {
    catsSeen.add(e.category);
    if (catsSeen.size === 4 && !allRounderDate) allRounderDate = e.date;
  }

  const hiitEntries    = log.filter(e => e.category === 'hiit');
  const enduranceEntry = log.find(e => e.durationMins >= 60);

  return [
    { id:'first_rep',       emoji:'🏁', name:'First Rep',       unlocked: log.length >= 1,        unlockedDate: log.length ? log[0].date : null },
    { id:'on_fire',         emoji:'🔥', name:'On Fire',          unlocked: streak >= 3,             unlockedDate: streak >= 3  ? today : null },
    { id:'consistent',      emoji:'🌅', name:'Consistent',       unlocked: streak >= 7,             unlockedDate: streak >= 7  ? today : null },
    { id:'iron_lungs',      emoji:'🏆', name:'Iron Lungs',       unlocked: streak >= 30,            unlockedDate: streak >= 30 ? today : null },
    { id:'hiit_starter',    emoji:'⚡', name:'HIIT Starter',     unlocked: hiitEntries.length >= 5, unlockedDate: hiitEntries.length >= 5 ? hiitEntries[4].date : null },
    { id:'endurance',       emoji:'⏱', name:'Endurance',         unlocked: !!enduranceEntry,        unlockedDate: enduranceEntry ? enduranceEntry.date : null },
    { id:'calorie_crusher', emoji:'💪', name:'Calorie Crusher',  unlocked: cumCal >= 5000,          unlockedDate: calCrusherDate },
    { id:'all_rounder',     emoji:'🧘', name:'All-Rounder',      unlocked: catsSeen.size === 4,     unlockedDate: allRounderDate },
  ];
}
```

- [ ] **Step 2:** Append `_renderCardioBadgeGrid(badges)`:

```js
function _renderCardioBadgeGrid(badges) {
  const zone = document.getElementById('cardio-badge-grid-zone');
  if (!zone) return;
  zone.innerHTML = '<div class="cardio-badge-grid">' + badges.map(b => `
    <div class="cardio-badge-card${b.unlocked ? ' unlocked' : ''}">
      <div class="cardio-badge-emoji" style="opacity:${b.unlocked ? 1 : 0.25}">${b.emoji}</div>
      <div class="cardio-badge-name">${b.unlocked ? b.name : '???'}</div>
      ${b.unlocked && b.unlockedDate ? `<div class="cardio-badge-date">${b.unlockedDate}</div>` : ''}
    </div>`).join('') + '</div>';
}
```

- [ ] **Step 3:** Verify in browser:
  - 8 badge cards render under "Achievements"
  - Locked badges show `???` and greyed emoji (opacity 0.25)
  - `first_rep` (🏁) unlocks when any entry exists
  - `endurance` unlocks after logging a 60+ min session

- [ ] **Step 4:** Commit:
```bash
git add js/cardio-stats.js
git commit -m "feat(cardio-stats): _calcCardioBadges + badge trophy grid"
```

---

## Chunk 4: CSS + Version Bump (Tasks 11–12)

### Task 11 — CSS additions (`css/main.css`)

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1:** Append to end of `css/main.css`:

```css
/* ── CARDIO STATS (v47) ── */
.cardio-streak-bar { font-family:'DM Mono',monospace; font-size:11px; color:var(--accent);
  text-align:center; padding:8px 14px 4px; letter-spacing:.5px; }
.cardio-empty-state { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3);
  text-align:center; padding:40px 20px; }
.cardio-no-data { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3);
  text-align:center; padding:12px; margin:0 14px; }
.cardio-achievements-title { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:1.5px;
  color:var(--text3); text-transform:uppercase; margin:12px 14px 6px; }
.cardio-badge-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:0 14px 16px; }
.cardio-badge-card { background:var(--card); border:1px solid var(--border2);
  border-radius:10px; padding:10px; text-align:center; }
.cardio-badge-card.unlocked { border-color:var(--accent); }
.cardio-badge-emoji { font-size:28px; margin-bottom:4px; }
.cardio-badge-name { font-family:'DM Mono',monospace; font-size:10px; color:var(--text1); }
.cardio-badge-date { font-family:'DM Mono',monospace; font-size:9px; color:var(--text3);
  opacity:.6; margin-top:2px; }
```

- [ ] **Step 2:** Verify visual styling — badge grid, streak bar, and empty state look consistent with app theme (dark background, DM Mono font, accent colour borders).

- [ ] **Step 3:** Commit:
```bash
git add css/main.css
git commit -m "feat(css): cardio stats styles — streak bar, badges, empty state (v47)"
```

---

### Task 12 — Version bump + push

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1:** In `js/config.js`, update:
```js
FORGE_VERSION = 'v47'
FORGE_BUILD   = '2026-03-13 (cardio XP + stats)'
```

- [ ] **Step 2:** In `sw.js`, update:
```js
CACHE_NAME = 'forge-v47'
```

- [ ] **Step 3:** Full verification before push:
  - [ ] Log a cardio entry → toast shows `+N XP 🚀` with correct value
  - [ ] Streak banner updates after logging
  - [ ] Global XP bar increases after cardio log
  - [ ] Stats → Cardio tab shows 6 stat cards, 3 charts, 8 badges
  - [ ] Period filter (7D/30D/90D/All) correctly filters stat cards + charts
  - [ ] Period button active state updates (no bleed into Progress tab period buttons)
  - [ ] With zero entries: empty state message only, no JS errors
  - [ ] All entries no HR zone: doughnut replaced with text message
  - [ ] No console errors on any tab

- [ ] **Step 4:** Commit and push:
```bash
git add js/config.js sw.js
git commit -m "chore: bump to v47 (cardio XP + stats)"
git push
```
