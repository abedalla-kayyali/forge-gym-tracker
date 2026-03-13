# Cardio XP, Streaks, Badges & Stats Panel — Design Spec (v47)

## Problem
The Cardio·Rec logging mode (added in v46) has no motivation loop and no analytics visibility. Users log sessions but get no reward feedback, no streak tracking, and no way to review their cardio history.

## Solution
Two additions in one version bump:
1. **Gamification** — XP awarded on submit (shown in toast), persistent cardio streak banner on the log tab, 8 milestone badges.
2. **Cardio Stats Panel** — new "Cardio" tab in the Stats section with stat cards, 3 charts, and the badge trophy grid.

---

## Part 1: Gamification

### 1.1 XP Formula

Computed in `submitCardioLog()` immediately before saving the entry. Result stored in `entry.xpEarned`. Cardio XP feeds into the global XP total via `calcXP()` — see Architecture.

```
base    = Math.round(durationMins * 0.5)
mult    = { hiit: 1.5, cardio: 1.2, sports: 1.1, recovery: 1.0 }
bonus   = hrZone * 2          // no zone selected = 0; Z1=2, Z2=4, Z3=6, Z4=8, Z5=10
xpEarned = Math.round(base * mult[category]) + bonus
```

Note: `hrZone` in the entry is the integer 1–5 selected by the user, or 0 when no zone is chosen. There is no selectable "Z0" button — 0 is simply the default unset state.

Examples:
- 30 min Walk (cardio, no zone): `round(15 × 1.2) + 0` = **18 XP**
- 30 min HIIT at Z3: `round(15 × 1.5) + 6` = **29 XP**
- 60 min Yoga (sports, Z1): `round(30 × 1.1) + 2` = **35 XP**

### 1.2 Toast

Replace static `'Cardio logged! 🚀'` with:
```
`Cardio logged! +${xpEarned} XP 🚀`
```

### 1.3 Cardio Streak Banner

Shown at the top of `#cardio-zone`, always visible when in cardio mode.

**HTML** — insert as the first child of `#cardio-zone`, immediately after `<div id="cardio-zone" style="display:none">` and before the first `<div class="cardio-cat-block">`:
```html
<div id="cardio-streak-bar" class="cardio-streak-bar"></div>
```

**Render function** `_renderCardioStreakBar()` in `cardio-log.js`:
- Calls `_calcCardioStreak()` to get current streak count
- If streak === 0: `"Start your streak today 💪"`
- If streak >= 1: `"🔥 ${streak} day${streak > 1 ? 's' : ''} streak"`
- Called on `DOMContentLoaded` and after every successful `submitCardioLog()`

**`_calcCardioStreak()`** algorithm in `cardio-log.js` (global function — accessible from `cardio-stats.js` which loads after):
1. Get today's ISO key via `_isoKey(new Date())`
2. Build a Set of unique dates from `cardioLog`
3. If today is in the Set → start count at 1, walk back from yesterday; increment count for each consecutive day found in the Set
4. Else → return 0 immediately (today not yet logged; the streak is not shown as active until the user logs today — intentional design so the streak banner motivates logging)
5. Walk backwards from yesterday: for each prior day, if the date is in the Set increment count; stop at the first missing day
6. Return count

**Edge case note:** An existing N-day streak will display as 0 until the user logs on the current day. This is intentional — the streak banner serves as a call-to-action.

### 1.4 Badges

8 badges. Defined as a static array in `cardio-stats.js`. Computed on the fly from `cardioLog` — no extra localStorage key.

| id | Emoji | Name | Unlock Condition |
|----|-------|------|-----------------|
| `first_rep` | 🏁 | First Rep | `log.length >= 1` |
| `on_fire` | 🔥 | On Fire | current cardio streak >= 3 |
| `consistent` | 🌅 | Consistent | current cardio streak >= 7 |
| `iron_lungs` | 🏆 | Iron Lungs | current cardio streak >= 30 |
| `hiit_starter` | ⚡ | HIIT Starter | 5+ entries with `category === 'hiit'` |
| `endurance` | ⏱ | Endurance | any single entry with `durationMins >= 60` |
| `calorie_crusher` | 💪 | Calorie Crusher | sum of all `calories >= 5000` |
| `all_rounder` | 🧘 | All-Rounder | at least 1 entry in each of the 4 categories: `'cardio'`, `'hiit'`, `'sports'`, `'recovery'` |

**Streak badge behaviour:** `on_fire`, `consistent`, and `iron_lungs` reflect the **current live streak** — they unlock when the streak reaches the threshold and lock again if the streak is broken. This is intentional (they are motivational, not permanent achievements).

**`_calcCardioBadges(log)`** — pure function in `cardio-stats.js`:
- Takes full `cardioLog` array
- Returns `[{ id, emoji, name, unlocked: bool, unlockedDate: string|null }]`
- `unlockedDate` derivation:
  - `first_rep`: `log[0].date`
  - `endurance`: `.date` of the first entry where `durationMins >= 60`
  - `calorie_crusher`: `.date` of the entry that pushed cumulative calories over 5000
  - `hiit_starter`: `.date` of the 5th entry with `category === 'hiit'`
  - `on_fire` / `consistent` / `iron_lungs`: `_isoKey(new Date())` — always shows today's date (no persistent unlock date is stored; the badge is live)
  - `all_rounder`: `.date` of the last entry needed to complete all 4 categories

---

## Part 2: Cardio Stats Panel

### 2.1 Tab

Add a 7th tab button to `#dash-tab-strip` in `index.html` (append after the existing `?? Cali` button). Use class `dash-tab` — the same class used by all 6 existing tab buttons — so that `switchDashTab()` correctly removes the `active` class from it when switching away:
```html
<button class="dash-tab" onclick="switchDashTab('cardio', this)">Cardio</button>
```

Add matching panel div:
```html
<div data-dash-tab="cardio" style="display:none">
  <div id="cardio-stats-zone"></div>
</div>
```

Add one line in `switchDashTab()` in `dashboard-history.js`:
```js
if (name === 'cardio') renderCardioStatsPanel();
```

### 2.2 Period Filter

4 buttons rendered inside `#cardio-stats-zone` at the top of the panel. Use the existing `.dash-period` CSS class (already defined in `main.css`) for consistent styling:
```html
<div class="dash-period-strip">
  <button class="dash-period" onclick="_setCardioPeriod('7D',this)">7D</button>
  <button class="dash-period active" onclick="_setCardioPeriod('30D',this)">30D</button>
  <button class="dash-period" onclick="_setCardioPeriod('90D',this)">90D</button>
  <button class="dash-period" onclick="_setCardioPeriod('ALL',this)">All</button>
</div>
```
`_setCardioPeriod(period, btn)` — defined in `cardio-stats.js`:
- Stores period in module-level `let _cardioPeriod = '30D'`
- Removes `active` from all period buttons **scoped to the cardio strip only** (use `btn.closest('.dash-period-strip').querySelectorAll('.dash-period')` — do NOT use a page-wide query, which would conflict with the global `_setPeriod` progress period strip)
- Adds `active` to `btn`
- Calls `renderCardioStatsPanel()`

Default: `30D`.

### 2.3 Stat Cards

6 cards in `.stats-grid` (same `.sg-card` / `.sg-val` / `.sg-sub` pattern):

| Card | Value | Sub |
|------|-------|-----|
| 🏃 Sessions | count of entries in period | `logged days` |
| ⏱ Total Time | total mins ≥60 → `Xh Ym`; < 60 → `Ym` (omit `0h`) | `avg Y min/session` |
| 💪 Calories | total kcal (or `—` if no entry has calories > 0) | `avg Y kcal/session` (or `—` if none) |
| 🏆 Top Activity | most frequent `activity` name (or `—` if no entries in period) | `X times` |
| 🔥 Cur. Streak | `_calcCardioStreak()` (ignores period filter) | `consecutive days` |
| 🌟 Total XP | sum of `xpEarned` in period | `from cardio` |

### 2.4 Charts

Three Chart.js charts, stacked vertically, each in a `.nut-chart-card`-style wrapper.

**Chart 1 — Weekly Sessions (bar)**
- X: week labels (e.g. "Mar 3", "Mar 10")
- Y: session count per week
- Bar colour by dominant category that week (ties: pick first in this priority order: hiit > cardio > sports > recovery):
  - hiit=`#e6b84a`, cardio=`#39ff8f`, sports=`#4a9fe6`, recovery=`#4ae69f`

**Chart 2 — Duration Trend (line)**
- X: date labels formatted as "Mar 3" (daily for 7D/30D; weekly bucket start date for 90D/All)
- Y: total minutes per day/week
- Single line, colour `#39ff8f`, filled area (background alpha 0.15)

**Chart 3 — HR Zone Distribution (doughnut)**
- Segments: Z1–Z5 + "No Zone"
- Count of sessions per zone
- Colours: Z1=`#4ae69f`, Z2=`#4a9fe6`, Z3=`#e6b84a`, Z4=`#e6944a`, Z5=`#e64a4a`, No Zone=`#333` (fallback for `var(--border2)` which Chart.js cannot resolve)
- Centre label "HR Zones" — implemented via an inline Chart.js plugin registered only for this chart instance:
  ```js
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
  ```
  Pass `plugins: [_hrZoneCentrePlugin]` in the chart config (local registration, not `Chart.register()`).
- Hidden (chart + its wrapper) if all entries in the period have `hrZone === 0`; replace wrapper with `<p class="cardio-no-data">No HR zone data logged yet</p>`

### 2.5 Badge Trophy Grid

Below charts. Section heading "Achievements". 2-column grid of badge cards.

**Unlocked badge:** full emoji (large), name, unlock date in small text. Border: `1px solid var(--accent)`.
**Locked badge:** greyed emoji (opacity 0.25), name replaced with `???`, no date. Border: `1px solid var(--border2)`.

### 2.6 Empty State

If `cardioLog.length === 0`, render only:
```html
<div class="cardio-empty-state">
  No cardio logged yet — head to the Log tab to get started 🏃
</div>
```

---

## Architecture

### Files Modified

| File | Change |
|------|--------|
| `js/cardio-log.js` | Add `_calcCardioStreak()`, `_renderCardioStreakBar()`; update `submitCardioLog()` to compute XP, store in `entry.xpEarned`, update toast to `+${xpEarned} XP 🚀`, call `_renderCardioStreakBar()` and `updateXPBar()` |
| `js/xp-system.js` | Add one line to `calcXP()`: `xp += (typeof cardioLog !== 'undefined' ? cardioLog : []).reduce((a,e) => a + (e.xpEarned\|\|0), 0);` — so cardio XP is included in the global total automatically |
| `js/cardio-stats.js` | **NEW** — `renderCardioStatsPanel()`, `_setCardioPeriod()`, `_cardioPeriod` state, stat cards, 3 Chart.js charts, `_calcCardioBadges()`, badge grid |
| `index.html` | (1) Add `#cardio-streak-bar` as first child of `#cardio-zone`; (2) append `<button class="dash-tab" onclick="switchDashTab('cardio',this)">Cardio</button>` to `#dash-tab-strip`; (3) add cardio panel div after last `data-dash-tab` panel; (4) add `<script src="js/cardio-stats.js"></script>` immediately after `<script src="js/cardio-log.js"></script>` |
| `js/dashboard-history.js` | Add `if (name === 'cardio') renderCardioStatsPanel();` inside `switchDashTab()` |
| `css/main.css` | Append `.cardio-streak-bar`, `.cardio-no-data`, badge grid styles (`.cardio-badge-grid`, `.cardio-badge-card`) |
| `js/config.js` | `FORGE_VERSION = 'v47'`, `FORGE_BUILD = '2026-03-13 (cardio XP + stats)'` |
| `sw.js` | `CACHE_NAME = 'forge-v47'` |

### No Changes To
- `js/storage.js` — no new keys needed
- Any existing stats tabs — isolated to new panel

### Load Order Note
- `_isoKey()` is defined in `dashboard-history.js` (line 131). It is called by `_calcCardioStreak()` in `cardio-log.js`. `dashboard-history.js` already loads well before `cardio-log.js` in the existing script order — do not move `cardio-log.js` before it.
- `cardioLog` (global `let` in `cardio-log.js`) and `_calcCardioStreak()` are read by `cardio-stats.js`. Since no ES modules are used, all are plain globals.
- Required load order: `dashboard-history.js` → `cardio-log.js` → `cardio-stats.js`.

### Chart Lifecycle
Charts are stored in module-level variables (`_cardioChart1`, `_cardioChart2`, `_cardioChart3`). On each `renderCardioStatsPanel()` call, existing chart instances are `.destroy()`ed before recreation — same pattern as nutrition charts.

---

## Version
- `js/config.js`: `FORGE_VERSION = 'v47'`, `FORGE_BUILD = '2026-03-13 (cardio XP + stats)'`
- `sw.js`: `CACHE_NAME = 'forge-v47'`
