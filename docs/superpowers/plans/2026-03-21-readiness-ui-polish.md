# Readiness UI Polish & Production Readiness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Readiness view production-ready by matching the Dashboard card system, fixing the broken button, adding a localhost seed script, and wiring readiness data into the existing backup/restore flow.

**Architecture:** Four independent fixes applied to the existing `feature/readiness-history-insights` worktree. HTML structure in `index.html`, styles in `css/main.css`, backup logic in `js/data-transfer.js`, seed script as a new standalone Node.js file.

**Tech Stack:** Vanilla HTML/CSS/JS, Node.js (seed script only, no npm deps), Chart.js already loaded.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `index.html` | Modify | Wrap readiness sections in `.panel`, fix button class + onclick, update section header markup |
| `css/main.css` | Modify | Add ring glow style, update metric grid, remove now-redundant custom panel styles |
| `js/data-transfer.js` | Modify | Add `readinessLog` to export + import |
| `scripts/seed-readiness.js` | Create | Console-paste seed generator for 30 days of test data |

---

## Important Codebase Facts

- **Working directory:** `C:/Users/USER/Desktop/Claude/Forg-Cali-os-18-main - codex 2 - Claude 2 - Nutrion/.worktrees/readiness-feature`
- **Panel card pattern:** `.panel` class (`background:var(--panel); border:1px solid var(--border2); border-radius:12px; overflow:hidden; margin-bottom:14px`) — defined at `css/main.css` line 4772
- **Panel header:** `.panel-header` div containing `.panel-title` (Barlow Condensed, 13px, uppercase) — line 4774
- **Section label:** `.wnr-section-label` (DM Mono, 9px, uppercase, `var(--text3)`) — line 22926
- **Button:** `.btn-primary` — already defined in app
- **Check-in card selector:** `.ctoday-card` — confirmed at `index.html` line 5971
- **Readiness view:** `#view-readiness` exists in `index.html` (added in previous task)
- **Data-transfer export:** `exportJSON()` function at `js/data-transfer.js` line 181; local `_lsGet` defined at line 182
- **Data-transfer import:** restore block starts at line ~224 with pattern `if (data.X) _lsSet('forge_X', data.X)`
- **No test suite** — this is a browser app. Verification is manual (open in browser at `http://localhost:8765`)

---

## Task 1: Visual Polish — Wrap Sections in `.panel` Cards

**Files:**
- Modify: `index.html` (the `#view-readiness` div)
- Modify: `css/main.css` (ring glow + metric grid update)

- [ ] **Step 1: Read the current `#view-readiness` HTML**

Find `id="view-readiness"` in `index.html`. Read the full div to understand the current structure before editing.

- [ ] **Step 2: Replace the view's inner HTML structure**

The current structure has bare sections. Replace with `.panel`-wrapped sections. Find the entire `<div id="view-readiness" class="view">` and replace its content with:

```html
<div id="view-readiness" class="view">

  <!-- Section 1: Today's Score -->
  <div class="panel" style="margin:14px 14px 0;">
    <div class="panel-header">
      <span class="panel-title">Daily Readiness</span>
    </div>
    <div class="readiness-score-section" id="readiness-score-section">
      <div class="readiness-ring-wrap">
        <div class="readiness-ring" id="readiness-ring">
          <span class="readiness-ring-val" id="readiness-ring-val">--</span>
        </div>
        <div class="readiness-zone-label" id="readiness-zone-label"></div>
        <div class="readiness-date-label" id="readiness-date-label"></div>
      </div>
      <div class="readiness-no-checkin" id="readiness-no-checkin" style="display:none">
        <p>No check-in yet today.</p>
        <button class="btn-primary" onclick="switchView('log', document.getElementById('bnav-log')); setTimeout(()=>{ const ci = document.querySelector('.ctoday-card'); if(ci) ci.scrollIntoView({behavior:'smooth'}); }, 300)">
          Start Today's Check-in
        </button>
      </div>
    </div>
  </div>

  <!-- Section 2: Per-Metric Breakdown -->
  <div class="panel" style="margin:14px 14px 0;" id="readiness-breakdown-panel">
    <div class="panel-header">
      <span class="panel-title">Metric Breakdown</span>
    </div>
    <div class="readiness-grid" id="readiness-breakdown-grid"></div>
  </div>

  <!-- Section 3: 7-Day Trend -->
  <div class="panel" style="margin:14px 14px 0;">
    <div class="panel-header">
      <span class="panel-title">7-Day Trend</span>
    </div>
    <div style="padding:0 14px 14px;">
      <canvas id="readiness-trend-chart" height="180"></canvas>
    </div>
  </div>

  <!-- Section 4: 30-Day History -->
  <div class="panel" style="margin:14px 14px 0;">
    <div class="panel-header">
      <span class="panel-title">30-Day History</span>
    </div>
    <div style="padding:0 14px 14px;">
      <canvas id="readiness-history-chart" height="180"></canvas>
    </div>
  </div>

  <!-- Section 5: Insights -->
  <div class="panel" style="margin:14px 14px 32px;" id="readiness-insights-panel">
    <div class="panel-header">
      <span class="panel-title">Insights</span>
    </div>
    <div class="readiness-insights" id="readiness-insights"></div>
  </div>

</div>
```

- [ ] **Step 3: Update CSS — add ring glow and fix metric grid**

Add/replace these rules in `css/main.css` in the `/* READINESS VIEW */` block (near the end of the file):

Replace `.readiness-ring` with:
```css
.readiness-ring {
  --rd-ring-color: #3b82f6;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid var(--rd-ring-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.4s, box-shadow 0.4s;
  box-shadow: 0 0 32px 4px color-mix(in srgb, var(--rd-ring-color) 30%, transparent);
}
```

Replace `.readiness-grid` with:
```css
.readiness-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 14px 14px;
}
```

Replace `.readiness-item` with:
```css
.readiness-item {
  background: var(--panel2, rgba(255,255,255,0.04));
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto auto;
  gap: 2px 8px;
}
```

Add `.readiness-score-section` update:
```css
.readiness-score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px 16px;
  gap: 12px;
}
```

Add `.readiness-insights` update:
```css
.readiness-insights {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

- [ ] **Step 4: Verify in browser**

Start server: `node serve.js`
Open `http://localhost:8765` → tap Readiness tab.
Confirm: sections appear as cards matching the Dashboard style, ring is centered with glow, metric grid is 2 columns.

- [ ] **Step 5: Commit**

```bash
git add index.html css/main.css
git commit -m "feat(readiness): apply dashboard panel card system and ring glow"
```

---

## Task 2: Fix the "Start Today's Check-in" Button

> **Note:** This is already included in the HTML replacement in Task 1 Step 2. If Task 1 is complete, verify this fix is live and skip to Step 3 (commit is already done).

**Files:**
- Modify: `index.html` (only if Task 1 was not yet done)

- [ ] **Step 1: Verify the button is correct**

In `index.html`, search for `readiness-no-checkin`. Confirm the button inside it:
- Has class `btn-primary`
- Has `onclick` that calls `switchView('log', document.getElementById('bnav-log'))`
- Has the `setTimeout` scroll to `.ctoday-card`
- Label reads "Start Today's Check-in"

- [ ] **Step 2: Test the button**

1. Open the app, navigate to Readiness tab
2. If no check-in today, the button should be visible
3. Tap it — should switch to the Log tab with `bnav-log` active
4. After ~300ms, page should scroll to the daily check-in card

- [ ] **Step 3: Commit if any changes were needed**

```bash
git add index.html
git commit -m "fix(readiness): button uses btn-primary and correctly redirects to Log tab"
```

---

## Task 3: Seed Script — 30 Days of Test Data

**Files:**
- Create: `scripts/seed-readiness.js`

- [ ] **Step 1: Create the seed script**

Create `scripts/seed-readiness.js` with this exact content:

```js
// scripts/seed-readiness.js
// Generates a localStorage console command to seed 30 days of readiness test data.
// Usage: node scripts/seed-readiness.js
// Then paste the output into browser DevTools console at http://localhost:8765

const today = new Date();
const entries = [];

// Realistic score patterns for 30 days
const scorePattern = [
  72, 68, 75, 81, 55, 43, 60,  // week 1: good stretch, dip, recovery
  65, 71, 78, 83, 88, 74, 42,  // week 2: building peak, crash
  58, 63, 69, 73, 76, 80, 85,  // week 3: steady climb
  70, 65, 72, 68, 77, 82, 74   // week 4: stable good
];

function zoneFor(score) {
  if (score >= 80) return 'peak';
  if (score >= 60) return 'good';
  if (score >= 40) return 'caution';
  return 'rest';
}

for (let i = 29; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(today.getDate() - i);
  const dateStr = d.toISOString().slice(0, 10);
  const score = scorePattern[29 - i];
  const zone = zoneFor(score);
  const isRecent = i < 7; // last 7 days have full biometrics

  entries.push({
    date: dateStr,
    score,
    zone,
    partial: !isRecent,
    inputs: {
      sleep: Math.min(5, Math.max(1, Math.round(score / 20))),
      energy: Math.min(5, Math.max(1, Math.round((score - 5) / 19))),
      mood: Math.min(5, Math.max(1, Math.round((score + 5) / 21))),
      hrv: isRecent ? Math.round(52 + (score - 40) * 0.35) : null,
      rhr: isRecent ? Math.round(64 - (score - 40) * 0.15) : null,
      trainingLoad: zone === 'rest' ? 0 : Math.round(8000 + (100 - score) * 250)
    }
  });
}

const cmd = `localStorage.setItem('forge_readiness_log', '${JSON.stringify(entries).replace(/'/g, "\\'")}'); console.log('✅ Seeded ${entries.length} readiness entries. Refresh the page.');`;

console.log('\n=== PASTE THIS INTO BROWSER DEVTOOLS CONSOLE ===\n');
console.log(cmd);
console.log('\n=================================================\n');
```

- [ ] **Step 2: Run and verify output**

```bash
node scripts/seed-readiness.js
```

Expected: prints a `localStorage.setItem(...)` command between the `===` banners. No errors.

- [ ] **Step 3: Test the seed in browser**

1. Start server: `node serve.js`
2. Open `http://localhost:8765`
3. Open DevTools → Console (`F12`)
4. Paste the output from Step 2
5. Refresh the page
6. Navigate to Readiness tab
7. Confirm: both charts show 30 days of colored bars/line, insights panel shows trend insights (score improved 3 days, etc.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-readiness.js
git commit -m "feat(readiness): add localhost seed script for 30 days of test data"
```

---

## Task 4: Backup/Restore — Add to data-transfer.js

**Files:**
- Modify: `js/data-transfer.js`

- [ ] **Step 1: Read the export block**

Read lines 181–215 of `js/data-transfer.js`. Find the object returned by `exportJSON()`. It looks like:

```js
{
  workouts: ...,
  bwWorkouts: ...,
  ...
  profile: _lsGet('forge_profile') || {}
}
```

- [ ] **Step 2: Add readinessLog to the export object**

Add one line after the `profile` entry (last entry before closing `}`):

```js
readinessLog: _lsGet('forge_readiness_log') || [],
```

The export object should now end with:
```js
    profile:     _lsGet('forge_profile') || {},
    readinessLog: _lsGet('forge_readiness_log') || []
```

Note: remove the trailing comma from `profile` line and don't add one after `readinessLog`.

- [ ] **Step 3: Read the import/restore block**

Read lines 215–255 of `js/data-transfer.js`. Find the block of `if (data.X)` statements. It looks like:

```js
if (data.workouts)   { workouts = data.workouts; _lsSet('forge_workouts', data.workouts); }
if (data.bwWorkouts) { ... }
...
if (data.profile && Object.keys(data.profile).length) _lsSet('forge_profile', data.profile);
```

- [ ] **Step 4: Add readinessLog to the import handler**

Add after the `profile` restore line:

```js
if (data.readinessLog && Array.isArray(data.readinessLog)) _lsSet('forge_readiness_log', data.readinessLog);
```

The `Array.isArray` check prevents bad data from corrupting the log on import.

- [ ] **Step 5: Verify by manual export/import test**

1. Open `http://localhost:8765`
2. Seed data (Task 3) if not already done
3. Go to Settings → Export — download the JSON
4. Open the downloaded JSON file — confirm `readinessLog` key is present with entries
5. Clear `forge_readiness_log` from DevTools localStorage
6. Go to Settings → Import — import the same JSON
7. Navigate to Readiness tab — confirm data is restored and charts show again

- [ ] **Step 6: Commit**

```bash
git add js/data-transfer.js
git commit -m "feat(readiness): include forge_readiness_log in backup export and import"
```
