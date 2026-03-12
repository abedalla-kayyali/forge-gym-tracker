# Nutrition Dashboard Charts & Insights — Design Spec (v44)

## Problem
Stats → Nutrition tab shows only 4 stat cards and text-only insight rows. No visual charts exist despite Chart.js 4.4.0 already being loaded. Users cannot quickly see calorie trends, macro balance, weekly patterns, or daily score history.

## Solution
Full 4-zone redesign of the Nutrition Analytics panel. All logic stays in `dashboard-history.js` using existing data helpers. No new files.

---

## Zone 0 — Today (always live, ignores period filter)

Reads `mealsLog[todayKey]` directly. Shows:
- Today's kcal consumed / target (Bebas Neue 34px accent)
- Calories remaining below
- Full-width kcal progress bar (6px, accent fill)
- 3 macro progress bars: P (green `#4ade80`), C (gold `#e6b84a`), F (blue `#5b8dee`) with `Xg / Yg` labels
- Meals-logged badge top-right
- Empty state: "Log your first meal today 🍽️" → link switches to Coach tab

Data source: `mealsLog[_isoKey(new Date())]` + `_calcNutritionTargetsForStats()`
`_renderNutTodayZone(zone, targets)` must guard against `undefined`/null: `const todayMeals = Array.isArray(mealsLog[todayKey]) ? mealsLog[todayKey] : [];` before summing macros. `mealsLog` accessed with `typeof mealsLog !== 'undefined'` guard (established pattern).

---

## Zone 1 — Period Stat Cards (respects period filter)

2×2 grid of existing stat cards:
1. **Avg Calories** — `avgKcal / targetCal` with progress bar
2. **Macro Compliance** — `compliance %` with progress bar
3. **Logged Days** — `nDays days`, meals count sub-label
4. **Avg Macros** — `117P / 29C / 59F` vs targets

Data source: `_flattenMealsByPeriod()` + `_calcNutritionTargetsForStats()`

---

## Zone 2 — Charts (2×2 grid)

### Chart 1: Calorie Trend (line)
- x: date labels from period, y: daily kcal
- Accent green line, 15% opacity fill under curve
- Dashed muted-red horizontal line at `targetCal`
- No point dots (only on hover)
- Hidden if < 3 data points

### Chart 2: Macro Split (doughnut)
- 3 segments: avg daily P / C / F in grams
- Colors: protein `#4ade80`, carbs `#e6b84a`, fat `#5b8dee`
- Center text: compliance % — implemented as an **inline Chart.js plugin** in the chart config `plugins` array (no external library needed): `{ id:'centerText', beforeDraw(chart){ const {ctx,chartArea:{width,top,height}}=chart; ctx.save(); ctx.font="bold 18px 'Bebas Neue'"; ctx.fillStyle='#c8dcc9'; ctx.textAlign='center'; ctx.fillText(compliance+'%', width/2, top+height/2+7); ctx.restore(); } }`
- Legend below canvas: `● P 117g · ● C 29g · ● F 59g`

### Chart 3: Weekly Calories (bar)
- Always last 7 calendar days (NOT period-filtered — most useful fixed)
- Data source: reads `mealsLog` directly inside helper body (NOT via `_flattenMealsByPeriod()`), with `typeof mealsLog !== 'undefined'` guard. Iterates last 7 `_isoKey` dates and sums kcal per day.
- Bar color per day: green ≥ 80% target, gold 50–79%, muted < 50%
- Dashed target line overlay (type `line` dataset)
- x: "Mon" / "Tue" short labels

### Chart 4: Day Score (bar)
- x: dates in current period, y: compliance score 0–100
- Bar color: green ≥ 70, gold 40–69, red/muted < 40
- Tooltip: `Score: X% · DD Mon`

### Chart instances
Declare at top of `dashboard-history.js`: `let _nutCalChart = null, _nutMacroChart = null, _nutWeekChart = null, _nutScoreChart = null;`
Destroy-before-recreate pattern. Note: `volChart`/`wgtChart` are declared in `index.html` (line 2388) — the new vars follow the same destroy-recreate behavior but are declared inside `dashboard-history.js` itself.
Shared options via `_mkNutChartOpts(extra)` helper (dark bg, DM Mono ticks, no legend).
`_mkNutChartOpts` calls `mkChartOpts()` (defined in `dashboard-weight-chart.js`) only inside its function body (at invocation time, not at parse/definition time) — safe because all charts render after full page load.

---

## Zone 3 — Insights (unchanged)

Existing text insight rows kept as-is:
- Protein consistency warning
- High/low calorie day counts
- Best/worst compliance day
- Calorie trend summary
- Meal timing card + logging consistency card (from `#nutrition-insights-body`)

---

## Architecture

**Files modified:**
| File | Change |
|------|--------|
| `css/main.css` | Append `.nut-today-*`, `.nut-charts-grid`, `.nut-chart-card`, `.nut-macro-legend` |
| `index.html` | Replace `#nutrition-analytics-body` inner HTML with 3 zone div scaffolds |
| `js/dashboard-history.js` | Add 5 helpers + rewrite `renderNutritionAnalyticsPanel()` |
| `js/config.js` | `FORGE_VERSION = 'v44'` |
| `sw.js` | `CACHE_NAME = 'forge-v44'` |

**Existing functions reused:**
- `_flattenMealsByPeriod()` — period-filtered meal map
- `_calcNutritionTargetsForStats()` — calorie + macro targets
- `_isoKey(date)` — YYYY-MM-DD string helper
- `mkChartOpts()` — base dark chart options (defined in `dashboard-weight-chart.js`). Used indirectly — only `_mkNutChartOpts` calls it, not the individual chart helpers directly.

**New helpers (all in `dashboard-history.js`):**
- `_mkNutChartOpts(extra)` — shared chart config
- `_renderNutTodayZone(zone, targets)` — Zone 0 HTML + bars
- `_renderCalorieTrendChart(daily, targetCal, canvasId)`
- `_renderMacroDonutChart(avgP, avgC, avgF, compliance, canvasId)`
- `_renderWeeklyBarChart(targetCal, canvasId)`
- `_renderDayScoreChart(dayScores, canvasId)`

---

## CSS Variables Used
`--card`, `--border2`, `--text3`, `--text1`, `--accent`
Chart macro colors hardcoded: `#4ade80` (P), `#e6b84a` (C), `#5b8dee` (F)

---

## Version
`v44` — `2026-03-12 (nutrition charts)` — `forge-v44`
