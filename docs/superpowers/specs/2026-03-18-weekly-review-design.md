# Weekly Review Card — Design Spec
**Date:** 2026-03-18
**Version target:** v231
**Status:** Approved for implementation

---

## Overview

A permanent panel in the Progress tab that shows the user's leading KPI performance for the current week vs last week, a forward projection toward their goal, and data-driven "1 win + 1 fix" coaching insights with specific numbers and actionable advice.

---

## Data Layer

### Time Windows
- **This week:** Monday 00:00 to today (or Sunday 23:59 if full week complete)
- **Last week:** Previous Mon–Sun
- Week boundaries use local date arithmetic (no UTC conversion)

### Leading KPIs

| KPI | Source | Hit condition |
|---|---|---|
| Protein days | `forge_meals` (`mealsLog` let global or localStorage) | Day protein ≥ 90% of `Math.round(userProfile.weight * 1.8)` |
| Training sessions | `forge_workouts` (`workouts` let global or localStorage) | Count of workouts with date in window |
| Sleep 7h+ days | `forge_readiness` (localStorage) | `totalSleep >= 7` |
| Steps goal days | `forge_steps` (localStorage, `stepsData` let global) | `steps >= goal` for that day's entry |
| Overload % | `window.FORGE_OVERLOAD.getMuscleOverloadScore(null)` (all muscles) | Score value 0–100 |

### Weight Projection
Source: `forge_bodyweight` (`bodyWeight` let global or localStorage).
- Collect entries from last 14 days, sort by date
- Linear regression on (dayIndex, weight) pairs → weekly rate (kg/wk)
- Weeks to goal = `(currentWeight - goalWeight) / Math.abs(weeklyRate)` rounded
- `goalWeight` from `userProfile.goalWeight`; `goal` from `userProfile.goal` (`fat_loss` / `muscle_gain` / `recomp`)
- Hide projection if < 4 entries in last 14 days

### Win/Fix Selection
Score each KPI as a percentage (0–100):
- Protein, sleep, steps: `(hitDays / 7) * 100`
- Training: `(sessions / targetSessions) * 100` where targetSessions = 4 (or 3 on recomp)
- Overload: score value directly

Rank by score. **Highest = win. Lowest = fix.**
If week has < 3 days elapsed, skip win/fix (not enough data).

---

## Insight Text Templates

### Win templates
| KPI | Template |
|---|---|
| Protein | `"You hit your protein target X/7 days — averaging Yg vs Zg goal. That's the foundation of your progress."` |
| Training | `"X sessions this week — your best in N weeks. Your body is responding, keep the momentum."` |
| Sleep | `"X nights of 7h+ sleep this week. Recovery is your secret weapon — protect it."` |
| Steps | `"You hit your steps goal X/7 days this week. Active lifestyle compounds your results."` |
| Overload | `"X% overload score — you beat or matched your last session on most exercises. That's the stimulus for growth."` |

### Fix templates
| KPI | Template |
|---|---|
| Protein | `"You hit protein X/7 days (avg Yg vs Zg target). Pre-log your meals in the morning to stay on track."` |
| Training | `"Only X sessions this week vs Y target. One missed session compounds — block your next workout now."` |
| Sleep | `"You averaged Xh sleep this week (Y/7 nights hit 7h). Try a consistent 10:30pm bedtime."` |
| Steps | `"You hit your steps goal X/7 days (avg Y vs Z goal). A 20-min walk after dinner adds ~2,500 steps."` |
| Overload | `"X% overload score this week. Push slightly harder on your top sets — even +1 rep counts."` |

---

## Projection Text

| Goal | Condition | Text |
|---|---|---|
| `fat_loss` | Has trend + goal weight | `"At your current pace (−Xkg/wk), you'll reach Ykg in ~Z weeks"` |
| `muscle_gain` | Has training + overload data | `"You're training Xx/week with Y% overload — consistent stimulus for lean mass gain"` |
| `recomp` | Has weight trend | `"Weight trend: Xkg/wk. Strength trend: overload at Y% — recomp on track"` |
| Any | < 4 weight entries | `"Log your weight daily this week to unlock your projection"` |

---

## Canvas Layout

Panel in Progress tab (`data-dash-tab="progress"`), after the Monthly Report section.

```
┌─────────────────────────────────────────┐
│ WEEKLY REVIEW          Week of Mar 10   │  ← panel-header style
├─────────────────────────────────────────┤
│ 📈 PROJECTION line                      │  ← wr-projection div
│─────────────────────────────────────────│
│ THIS WEEK vs LAST WEEK                  │  ← wr-kpi-grid
│ 💪 Training    4 sessions  ↑ +1        │
│ 🥩 Protein     3/7 days    ↓ −2        │
│ 😴 Sleep 7h+   5/7 days    → same      │
│ 👟 Steps goal  4/7 days    ↑ +2        │
│ 📊 Overload    72%         ↑ +8%       │
│─────────────────────────────────────────│
│ 🏆 WIN THIS WEEK                        │  ← wr-win div
│ [insight text]                          │
│─────────────────────────────────────────│
│ 🔧 FIX THIS WEEK                        │  ← wr-fix div
│ [insight text]                          │
└─────────────────────────────────────────┘
```

Empty state (< 3 days of data): `"Log data for a full week to unlock your weekly review."`

---

## File Structure

### New file: `js/weekly-review.js`
IIFE, ~220 lines. Reads globals: `bodyWeight`, `workouts`, `mealsLog`, `userProfile`, `stepsData`. Uses localStorage fallbacks for all. Reads `forge_readiness`, `forge_steps` from localStorage directly.

Exports to `window`:
- `window.renderWeeklyReview()` — main render function, idempotent

### `index.html` changes
1. `<div id="weekly-review-card" data-dash-tab="progress">` panel after Monthly Report section
2. `<script src="js/weekly-review.js">` after `goal-dashboard.js`

### `js/dashboard-history.js` change
In the tab-open handler where `name === 'progress'`:
```js
if (typeof window.renderWeeklyReview === 'function') window.renderWeeklyReview();
```

### Version bump
`js/config.js`: `v230` → `v231`

---

## localStorage Keys Read (no new keys written)
- `forge_meals` — protein data
- `forge_workouts` — session count
- `forge_readiness` — sleep data
- `forge_steps` — steps data
- `forge_bodyweight` — weight projection
- `forge_profile` — goal, goalWeight, weight

---

## Constraints
- Vanilla JS IIFE only — no new dependencies
- All let globals accessed directly (never `window.workouts` etc.)
- XSS: all user data via `textContent` or escaped before innerHTML
- `FORGE_OVERLOAD` consumed via `window.FORGE_OVERLOAD` (already window-exported)
- No new localStorage keys written
