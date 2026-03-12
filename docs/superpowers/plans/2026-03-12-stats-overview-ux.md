# Stats Overview UX Enhancement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped 4-col stats strip + period filter on the Stats → Overview tab with a clean 2×3 stat grid (all-time metrics) and an improved CALI row with a Journey % progress bar.

**Architecture:** HTML swap (`.stats-bar` → `.stats-grid`, CALI row), CSS additions, and JS rewrite of the stat-card block in `renderDashboard()`. Period filter is preserved for the Progress tab via `data-dash-tab="progress"` attribute.

**Tech Stack:** Vanilla JS, CSS custom properties, no build step. Single HTML file + external JS/CSS.

**Spec:** `docs/superpowers/specs/2026-03-12-stats-overview-ux-design.md`

---

## Chunk 1: CSS + HTML

### Task 1: Add stats-grid CSS

**Files:**
- Modify: `css/main.css` (append at end)

- [ ] **Step 1: Append CSS block**

Open `css/main.css` and append at the very end:

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

- [ ] **Step 2: Verify no syntax errors**

Open the app in a browser (or run `cat css/main.css | tail -20` to confirm appended correctly). No visible CSS errors expected.

- [ ] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "feat(css): add stats-grid and cali journey bar styles (v43)"
```

---

### Task 2: Update period filter + replace stats-bar HTML

**Files:**
- Modify: `index.html` (lines 1077, 1171–1189)

**Context:** `switchDashTab(name)` in `dashboard-history.js` shows/hides elements by matching `data-dash-tab` attribute against the active tab name. Adding `data-dash-tab="progress"` to `#dash-period-strip` makes it automatically hide on Overview and show on Progress — no JS changes needed.

- [ ] **Step 1: Add `data-dash-tab="progress"` to the period strip**

In `index.html` line 1077, replace:
```html
    <div class="dash-period-strip" id="dash-period-strip">
```
with:
```html
    <div class="dash-period-strip" id="dash-period-strip" data-dash-tab="progress">
```

- [ ] **Step 2: Replace the weighted `.stats-bar` div**

In `index.html`, replace lines 1171–1176 (the entire `.stats-bar` div — from `<div class="stats-bar" data-dash-tab="overview">` through its closing `</div>`):

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

- [ ] **Step 3: Replace the BW `.stats-bar.bw-stats-bar` div**

In `index.html`, replace lines 1184–1189 (the entire `.stats-bar.bw-stats-bar` div — from `<div class="stats-bar bw-stats-bar" data-dash-tab="overview">` through its closing `</div>`):

```html
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

- [ ] **Step 4: Verify HTML in browser**

Open the Stats → Overview tab. You should see:
- Period filter strip (7D/1M/3M/6M/ALL) is **gone** from Overview
- 6 placeholder cards in a 2-col grid with value "0" or "—"
- CALI row shows 3 cards with a Journey progress bar at 0%
- Switching to Progress tab: period filter strip **reappears** ✅

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(html): stats-grid 2x3 + cali journey bar, hide period filter on overview"
```

---

## Chunk 2: JS + Version Bump

### Task 3: Update renderDashboard() to populate new stat cards

**Files:**
- Modify: `js/dashboard-history.js` (function `renderDashboard`, starting line 1512)

**Context:** `renderDashboard()` currently writes to `dash-total-vol`, `dash-sessions`, `dash-sets`, `dash-pr`, `dash-pr-exercise`, `dash-vol-delta`, `dash-bw-sessions`, `dash-bw-sets`, `dash-bw-top-ex`, `dash-bw-streak`. These IDs no longer exist in the HTML. Those write calls must be replaced with the new IDs.

`_dashPRCache` is an existing module-level variable (defined above `renderDashboard`) — keep it, just update the lookup loop to guard `w.sets` with `|| []`.

- [ ] **Step 1: Remove old period-filtered stat card block**

In `renderDashboard()`, delete the entire block that:
1. Calls `_getPw()` and assigns `_pw`
2. Computes `totalVol`, `totalSets` from `_pw`
3. Writes to `dash-total-vol`, `dash-sessions`, `dash-sets`, `dash-pr`, `dash-pr-exercise`, `dash-vol-delta`
4. Writes to `dash-bw-sessions`, `dash-bw-sets`, `dash-bw-top-ex`, `dash-bw-top-ex-sets`, `dash-bw-streak`, `dash-bw-streak-unit`

Keep everything else in `renderDashboard()` (charts, heatmap, snapshot, etc.) untouched.

- [ ] **Step 2: Insert new all-time stat block**

Immediately after the `renderDashboard()` opening + `_ndb` no-data banner block, insert:

```js
  // ── All-time weighted stats (v43 stats-grid) ──
  const totalSessions = workouts.length;
  const totalVol = workouts.reduce((a,w) => a+(w.totalVolume||0), 0);

  // Best lift — reuse existing _dashPRCache to avoid O(n) scan on every render
  if (!_dashPRCache) {
    _dashPRCache = { val: 0, ex: '—' };
    workouts.forEach(w => (w.sets||[]).forEach(s => {
      if (s.weight > _dashPRCache.val) { _dashPRCache.val = s.weight; _dashPRCache.ex = w.exercise; }
    }));
  }

  const streak = calcStreak();
  const totalPRs = workouts.filter(w => w.isPR).length;
  const lastW = workouts.slice().sort((a,b) => new Date(b.date)-new Date(a.date))[0];
  const todayStr = new Date().toISOString().slice(0,10);
  const lastDateStr = lastW ? lastW.date.slice(0,10) : null;
  const daysAgo = lastDateStr === null ? null
    : lastDateStr === todayStr ? 0
    : Math.floor((Date.now()-new Date(lastDateStr))/86400000);

  const _sgEl = id => document.getElementById(id);
  _sgEl('sg-sessions') && (_sgEl('sg-sessions').textContent = totalSessions);
  _sgEl('sg-volume') && (_sgEl('sg-volume').innerHTML = Math.round(totalVol).toLocaleString()+'<span class="sg-unit">kg</span>');
  _sgEl('sg-best-lift') && (_sgEl('sg-best-lift').textContent = _dashPRCache.val > 0 ? _dashPRCache.val+'kg' : '—');
  _sgEl('sg-best-lift-sub') && (_sgEl('sg-best-lift-sub').textContent = _dashPRCache.ex);
  _sgEl('sg-streak') && (_sgEl('sg-streak').innerHTML = streak+'<span class="sg-unit">d</span>');
  _sgEl('sg-streak-sub') && (_sgEl('sg-streak-sub').textContent = streak>=7?'On fire! 🔥':streak>=3?'Building habit':'Train today!');
  _sgEl('sg-prs') && (_sgEl('sg-prs').textContent = totalPRs);
  _sgEl('sg-last-session') && (_sgEl('sg-last-session').textContent = daysAgo===null?'—':daysAgo===0?'Today':daysAgo+'d ago');
  _sgEl('sg-last-session-sub') && (_sgEl('sg-last-session-sub').textContent = lastDateStr ? new Date(lastDateStr).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—');

  // ── CALI row (v43) ──
  const bwAll = typeof bwWorkouts !== 'undefined' ? bwWorkouts : [];
  let _sgUnlocked = 0, _sgTotal = 0;
  if (bwAll.length && typeof CALISTHENICS_TREES !== 'undefined') {
    CALISTHENICS_TREES.forEach(tree => {
      tree.levels.forEach(lvl => {
        _sgTotal++;
        const maxVal = bwAll
          .filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase())
          .reduce((mx,w) => Math.max(mx, ...(w.sets||[]).map(s => s.reps||s.secs||0)), 0);
        if (maxVal >= lvl.target) _sgUnlocked++;
      });
    });
  }
  const journeyPct = _sgTotal > 0 ? Math.round((_sgUnlocked/_sgTotal)*100) : 0;
  _sgEl('sg-bw-sessions') && (_sgEl('sg-bw-sessions').textContent = bwAll.length);
  _sgEl('sg-skills') && (_sgEl('sg-skills').textContent = _sgUnlocked+'/'+_sgTotal);
  _sgEl('sg-journey-pct') && (_sgEl('sg-journey-pct').textContent = journeyPct+'%');
  const _jBar = document.getElementById('cali-journey-bar-fill');
  if (_jBar) _jBar.style.width = journeyPct+'%';
```

- [ ] **Step 3: Verify in browser**

Open Stats → Overview. With workout data loaded:
- Total Sessions shows correct count ✅
- Total Volume shows formatted number + "kg" ✅
- Best Lift shows heaviest set weight + exercise name below ✅
- Day Streak shows current streak + motivational sub-text ✅
- Total PRs shows correct count ✅
- Last Session shows "Today" / "Xd ago" + formatted date ✅
- CALI row: BW sessions count, skills X/Y, journey % with filled bar ✅
- No console errors (`F12 → Console`) ✅

- [ ] **Step 4: Commit**

```bash
git add js/dashboard-history.js
git commit -m "feat(js): renderDashboard all-time stats-grid + cali journey bar"
```

---

### Task 4: Version bump to v43

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1: Update config.js**

In `js/config.js`, update:
```js
const FORGE_VERSION = 'v43';
const FORGE_BUILD   = '2026-03-12 (stats grid ux)';
```

- [ ] **Step 2: Update sw.js cache name**

In `sw.js`, update:
```js
const CACHE_NAME = 'forge-v43';
```

- [ ] **Step 3: Commit and push**

```bash
git add js/config.js sw.js
git commit -m "chore: bump to v43 (stats grid ux)"
git push
```

---

## Acceptance Checklist

- [ ] Period filter hidden on Overview tab, visible on Progress tab
- [ ] 6-card 2×3 grid renders with correct all-time values
- [ ] Accent color (`var(--accent)`) on Sessions, Volume, Streak values
- [ ] Neutral color (`var(--text1)`) on Best Lift, PRs, Last Session values
- [ ] Last Session shows "Today" when most recent workout is today
- [ ] CALI row: BW sessions + skills X/Y + journey % + progress bar width correct
- [ ] No JS errors in console on load or tab switch
- [ ] SW cache is `forge-v43`
