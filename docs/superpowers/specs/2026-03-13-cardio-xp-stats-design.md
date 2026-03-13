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

Computed in `submitCardioLog()` immediately before saving the entry. Result stored in `entry.xpEarned` and passed to the existing global `addXP(n)`.

```
base    = Math.round(durationMins * 0.5)
mult    = { hiit: 1.5, cardio: 1.2, sports: 1.1, recovery: 1.0 }
bonus   = hrZone * 2          // Z0=0, Z1=2, Z2=4, Z3=6, Z4=8, Z5=10
xpEarned = Math.round(base * mult[category]) + bonus
```

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

**HTML** (inside `#cardio-zone`, before activity grid):
```html
<div id="cardio-streak-bar" class="cardio-streak-bar"></div>
```

**Render function** `_renderCardioStreakBar()` in `cardio-log.js`:
- Calls `_calcCardioStreak()` to get current streak count
- If streak === 0: `"Start your streak today 💪"`
- If streak >= 1: `"🔥 ${streak} day${streak > 1 ? 's' : ''} streak"`
- Called on `DOMContentLoaded` and after every successful `submitCardioLog()`

**`_calcCardioStreak()`** algorithm in `cardio-log.js`:
1. Get today's ISO key via `_isoKey(new Date())`
2. Build a Set of unique dates from `cardioLog`
3. If today is in the Set → start count at 1, walk back from yesterday
4. Else → start count at 0, walk back from yesterday (don't break a streak before the day ends)
5. Walk backwards: stop at first date not in the Set
6. Return count

### 1.4 Badges

8 badges. Defined as a static array in `cardio-stats.js`. Computed on the fly from `cardioLog` — no extra localStorage key.

| id | Emoji | Name | Unlock Condition |
|----|-------|------|-----------------|
| `first_rep` | 🏁 | First Rep | `log.length >= 1` |
| `on_fire` | 🔥 | On Fire | cardio streak >= 3 |
| `consistent` | 🌅 | Consistent | cardio streak >= 7 |
| `iron_lungs` | 🏆 | Iron Lungs | cardio streak >= 30 |
| `hiit_starter` | ⚡ | HIIT Starter | 5+ entries with `category === 'hiit'` |
| `endurance` | ⏱ | Endurance | any single entry with `durationMins >= 60` |
| `calorie_crusher` | 🔥 | Calorie Crusher | sum of all `calories >= 5000` |
| `all_rounder` | 🧘 | All-Rounder | at least 1 entry in each of the 4 categories |

**`_calcCardioBadges(log)`** — pure function in `cardio-stats.js`:
- Takes full `cardioLog` array
- Returns `[{ id, emoji, name, unlocked: bool, unlockedDate: string|null }]`
- `unlockedDate`: for threshold badges (first_rep, endurance, calorie_crusher), derive from the entry that crossed the threshold; for streak/count badges, use today's date when unlocked

---

## Part 2: Cardio Stats Panel

### 2.1 Tab

Add a 7th tab button to `#dash-tab-strip` in `index.html`:
```html
<button class="dash-tab-btn" onclick="switchDashTab('cardio', this)">Cardio</button>
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

4 buttons: `7D · 30D · 90D · All` — same `.period-btn` / `.active` pattern as existing tabs.
Default: `30D`.
Each click re-runs `renderCardioStatsPanel()` with updated period.

### 2.3 Stat Cards

6 cards in `.stats-grid` (same `.sg-card` / `.sg-val` / `.sg-sub` pattern):

| Card | Value | Sub |
|------|-------|-----|
| 🏃 Sessions | count of entries in period | `logged days` |
| ⏱ Total Time | `Xh Ym` formatted | `avg Y min/session` |
| 🔥 Calories | total kcal (or `—` if none logged) | `avg Y kcal/session` |
| 🏆 Top Activity | most frequent `activity` name | `X times` |
| 🔥 Cur. Streak | `_calcCardioStreak()` (ignores period) | `consecutive days` |
| 🌟 Total XP | sum of `xpEarned` in period | `from cardio` |

### 2.4 Charts

Three Chart.js charts, stacked vertically, each in a `.nut-chart-card`-style wrapper.

**Chart 1 — Weekly Sessions (bar)**
- X: week labels (e.g. "Mar 3", "Mar 10")
- Y: session count per week
- Bar colour by dominant category that week: hiit=#e6b84a, cardio=accent, sports=#4a9fe6, recovery=#4ae69f

**Chart 2 — Duration Trend (line)**
- X: date labels (daily for 7D/30D, weekly for 90D/All)
- Y: total minutes per day/week
- Single line, accent colour, filled area

**Chart 3 — HR Zone Distribution (doughnut)**
- Segments: Z1–Z5 + "No Zone"
- Count of sessions per zone
- Colours: Z1=#4ae69f, Z2=#4a9fe6, Z3=#e6b84a, Z4=#e6944a, Z5=#e64a4a, No Zone=var(--border2)
- Center label: "HR Zones"
- Hidden if no sessions have HR zone data

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
| `js/cardio-log.js` | Add `_calcCardioStreak()`, `_renderCardioStreakBar()`; update `submitCardioLog()` to compute XP, call `addXP()`, update toast, call `_renderCardioStreakBar()` |
| `js/cardio-stats.js` | **NEW** — `renderCardioStatsPanel()`, period filter state, stat cards, 3 Chart.js charts, `_calcCardioBadges()`, badge grid |
| `index.html` | Add `#cardio-streak-bar` div inside `#cardio-zone`; add Cardio tab button + panel div in stats section; add `<script src="js/cardio-stats.js">` |
| `js/dashboard-history.js` | Add `if (name === 'cardio') renderCardioStatsPanel();` inside `switchDashTab()` |
| `css/main.css` | Append `.cardio-streak-bar`, cardio stats panel, badge grid styles |
| `js/config.js` | `FORGE_VERSION = 'v47'`, `FORGE_BUILD = '2026-03-13 (cardio XP + stats)'` |
| `sw.js` | `CACHE_NAME = 'forge-v47'` |

### No Changes To
- `xp-system.js` — `addXP(n)` is called as-is
- `js/storage.js` — no new keys needed
- Any existing stats tabs — isolated to new panel

### Chart Lifecycle
Charts are stored in module-level variables (`_cardioChart1`, `_cardioChart2`, `_cardioChart3`). On each `renderCardioStatsPanel()` call, existing chart instances are `.destroy()`ed before recreation — same pattern as nutrition charts.

---

## Version
- `js/config.js`: `FORGE_VERSION = 'v47'`, `FORGE_BUILD = '2026-03-13 (cardio XP + stats)'`
- `sw.js`: `CACHE_NAME = 'forge-v47'`
