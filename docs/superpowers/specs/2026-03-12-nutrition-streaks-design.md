# Nutrition Streaks & Engagement Stats — Design Spec (v45)

## Problem
The Stats → Nutrition tab has 4 period stat cards (Avg Cal, Compliance, Logged Days, Avg Macros) but no engagement hooks. Users have no streak motivation, no clear visibility into protein goal adherence over time, and no calorie deficit tracking.

## Solution
Append 4 new stat cards to the existing 2×2 `stats-grid` (making it 2×4). All logic added inline in `renderNutritionAnalyticsPanel()` in `dashboard-history.js`. No new files, no CSS changes.

---

## New Stat Cards

### Card 5: 🥩 Protein Days
- **Value:** `X / Y` where X = days meeting protein goal, Y = nDays in period
- **Sub-label:** percentage of period (e.g. "60% of period")
- **Threshold:** `dailyProtein >= targets.proteinG * 0.9` (≥90% of goal — matches existing `underProteinDays` threshold)
- **Data source:** `daily` array (period-filtered)

### Card 6: 📉 Deficit Days
- **Value:** `X / Y` where X = days below calorie target, Y = nDays in period
- **Sub-label:** percentage of period (e.g. "40% of period")
- **Threshold:** `dailyKcal < targets.targetCal` (any amount below target)
- **Data source:** `daily` array (period-filtered)

### Card 7: 🔥 Current Streak
- **Value:** `X days` (number of consecutive days hitting protein goal up to and including today or yesterday)
- **Sub-label:** "protein goal" always; if streak = 0 → value shows "—" + sub "start your streak!"
- **Color:** value renders in `#e6b84a` (existing gold/amber) when streak ≥ 3; default `sg-val sg-neutral` when < 3
- **Data source:** reads `mealsLog` **directly** (NOT period-filtered — a 15-day streak shouldn't show as 7 in 7D view)
- **Algorithm:**
  1. Start from today's ISO key (`_isoKey(new Date())`)
  2. If today has meals and protein ≥ 90% → count it, move to yesterday
  3. If today has NO meals → skip today (don't break streak before dinner), start from yesterday
  4. Walk backwards: stop at first day where `!Array.isArray(ml[key]) || !ml[key].length` OR `dailyProtein < targets.proteinG * 0.9`
  5. Guard: `typeof mealsLog !== 'undefined'`

### Card 8: 🏆 Best Streak
- **Value:** `X days`
- **Sub-label:** "this period"
- **Data source:** `daily` array (period-filtered)
- **Algorithm:** scan `daily` sorted by date; maintain a running count and max count; increment when protein ≥ 90%, reset to 0 otherwise

---

## Layout

```
┌─────────────────┬─────────────────┐
│  Avg Calories   │ Macro Compliance │  (existing)
├─────────────────┼─────────────────┤
│  Logged Days    │   Avg Macros     │  (existing)
├─────────────────┼─────────────────┤
│ 🥩 Protein Days │ 📉 Deficit Days  │  (new)
│  18 / 30        │  12 / 30         │
│  60% of period  │  40% of period   │
├─────────────────┼─────────────────┤
│ 🔥 Cur. Streak  │ 🏆 Best Streak   │  (new)
│  5 days (amber) │  9 days          │
│  protein goal   │  this period     │
└─────────────────┴─────────────────┘
```

---

## Architecture

**Files modified:**
| File | Change |
|------|--------|
| `js/dashboard-history.js` | Add streak computations + 4 new cards in `statsZone.innerHTML` |
| `js/config.js` | `FORGE_VERSION = 'v45'` |
| `sw.js` | `CACHE_NAME = 'forge-v45'` |

**No CSS changes** — all new cards use existing `.sg-card`, `.sg-label`, `.sg-val`, `.sg-val.sg-neutral`, `.sg-unit`, `.sg-sub` classes.

**No HTML changes** — stat cards are dynamically generated into `#nut-stats-zone`.

### Implementation location
All 4 new computations added inside `renderNutritionAnalyticsPanel()` immediately after the existing `compliance` calculation:

```js
// New engagement stats
const proteinDays  = daily.filter(d => d.p >= targets.proteinG * 0.9).length;
const deficitDays  = daily.filter(d => d.kcal < targets.targetCal).length;
const bestStreak   = (() => { let cur=0,max=0; daily.forEach(d => { cur = d.p>=targets.proteinG*.9 ? cur+1 : 0; max=Math.max(max,cur); }); return max; })();
const currentStreak = (() => {
  const ml = typeof mealsLog !== 'undefined' ? mealsLog : {};
  let streak = 0;
  const today = new Date();
  const todayKey = _isoKey(today);
  const todayMeals = Array.isArray(ml[todayKey]) ? ml[todayKey] : [];
  const todayP = todayMeals.reduce((s,m)=>s+(+m.p||0),0);
  let startOffset = (todayMeals.length && todayP >= targets.proteinG*.9) ? 0 : 1;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate()-i);
    const key = _isoKey(d);
    const meals = Array.isArray(ml[key]) ? ml[key] : [];
    if (!meals.length) break;
    const p = meals.reduce((s,m)=>s+(+m.p||0),0);
    if (p < targets.proteinG*.9) break;
    streak++;
  }
  return streak;
})();
```

The 4 new cards are appended to the end of the `statsZone.innerHTML` template string (inside the existing `<div class="stats-grid">` wrapper).

---

## Version
`v45` — `2026-03-12 (nutrition streaks)` — `forge-v45`
