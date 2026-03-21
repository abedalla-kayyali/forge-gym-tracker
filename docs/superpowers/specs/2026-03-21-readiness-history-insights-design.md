# Readiness History, Insights & Charts — Design Spec
**Date:** 2026-03-21
**Status:** Approved by user

---

## Overview

Build a dedicated **Readiness** view in FORGE that computes a daily readiness score (0–100) from six wellness inputs, stores a daily snapshot on check-in completion, displays history charts, per-metric breakdowns, and per-metric coaching insights.

---

## Score Formula

Readiness score is computed as a weighted average of six normalized inputs, producing a value from 0–100.

| Input | Weight | Source | Notes |
|---|---|---|---|
| Sleep quality (1–5) | 25% | Daily check-in `sleep` field | Normalized: `(val/5) * 100` |
| Energy (1–5) | 20% | Daily check-in `energy` field | Normalized: `(val/5) * 100` |
| Mood (1–5) | 15% | Daily check-in `mood` field | Normalized: `(val/5) * 100` |
| HRV (ms) | 20% | `forge_hrv` log or settings baseline | `clamp((hrv / avg7hrv) * 50, 0, 100)` where avg7 = mean of last 7 HRV entries |
| Resting Heart Rate (bpm) | 10% | `forge_rhr` log or settings baseline | `clamp(((220 - rhr) / 170) * 100, 0, 100)` — 50 bpm → 100, 90 bpm → ~76, inverted |
| Training load (last 7 days) | 10% | `forge_workouts` total sets×reps×weight (kg) sum | `clamp(100 - (load7 / 50000) * 100, 0, 100)` — 0 load → 100, 50,000+ → 0 |

### Missing Data Fallbacks
- **HRV missing** (no `forge_hrv` entries AND no settings baseline): redistribute its 20% weight equally across sleep (now 33%), energy (now 27%), mood (now 20%). Mark snapshot as `"partial": true`.
- **RHR missing**: same redistribution of its 10%. Mark as partial.
- **HRV avg7 cold-start** (fewer than 7 entries): use available entries (min 1). If zero entries, fall back to settings baseline HRV value. If none, redistribute weight as above.
- **Training load missing** (`forge_workouts` empty): assume 0 load → training load component = 100 (full score for that input).

### Score Zones
Zone boundaries use `>=` for lower bound, `<` for upper (except Peak which is `<= 100`):
| Score | Zone | Label | Color |
|---|---|---|---|
| 80–100 | Peak | "Push Hard Today" | Green |
| 60–79 | Good | "Train Normally" | Blue |
| 40–59 | Caution | "Train Light" | Yellow/Amber |
| 0–39 | Rest | "Rest Day" | Red |

---

## Data Model

### Storage Key: `forge_readiness`
Array of daily snapshot objects stored in localStorage.

```json
[
  {
    "date": "2026-03-21",
    "score": 74,
    "zone": "good",
    "inputs": {
      "sleep": 4,
      "energy": 3,
      "mood": 4,
      "hrv": 62,
      "rhr": 58,
      "trainingLoad": 12500
    },
    "insights": [
      "Your HRV is slightly below your 7-day average — avoid max effort sets today.",
      "Sleep quality was good — you should have solid focus and coordination.",
      "Training load has been high this week — consider a deload tomorrow."
    ]
  }
]
```

### Storage Limits
- `forge_readiness` is capped at **365 entries**. On write, if length exceeds 365, trim oldest entries first.

### Snapshot Trigger
- Computed and stored when the user **completes** the daily check-in (not on skip).
- One entry per date (key: `YYYY-MM-DD`) — if check-in is re-done same day, overwrite existing entry.

---

## Dedicated Readiness View

**Navigation:** New tab in the main nav bar, icon: pulse/wave SVG (⚡ emoji fallback). View ID: `#view-readiness`.

### Section 1 — Today's Score
- Large circular ring/gauge showing score (0–100)
- Zone label beneath ("Push Hard Today", etc.)
- Date stamp
- If no check-in today: prompt card "Complete today's check-in to see your readiness score"

### Section 2 — Per-Metric Breakdown
- Uses existing `.readiness-grid` / `.readiness-item` CSS
- Six cards: Sleep, Energy, Mood, HRV, RHR, Training Load
- Each card: icon, label, value, color state (good/warn/bad), one-line coaching tip
- Coaching tips are pre-written per metric × zone. Matrix (18 strings):

| Metric | Peak (80+) | Good (60–79) | Caution (40–59) | Rest (0–39) |
|---|---|---|---|---|
| Sleep | "Well rested — your recovery is fueling performance." | "Decent sleep — you're good to train." | "Sleep was subpar — warm up longer and avoid PRs." | "Poor sleep — prioritize rest over intensity today." |
| Energy | "High energy — great day to push limits." | "Solid energy — train as planned." | "Low energy — keep effort moderate." | "Drained — consider a walk instead of a workout." |
| Mood | "Great mindset — channel it into your session." | "Good mood — consistency is paying off." | "Off day mentally — short focused sessions work best." | "Low mood — light movement can help, but don't force it." |
| HRV | "HRV is elevated — your nervous system is primed." | "HRV is normal — no adjustments needed." | "HRV is below average — reduce intensity by 10–20%." | "HRV is very low — active recovery only." |
| RHR | "Low resting HR — cardiovascular recovery is strong." | "RHR is normal — no concern." | "RHR elevated — monitor for fatigue or illness." | "RHR significantly high — rest and hydrate." |
| Training Load | "Low weekly load — room to push harder." | "Balanced load — keep your current rhythm." | "Load is accumulating — plan a lighter session." | "High load this week — a rest day will improve next session." |

### Section 3 — 7-Day Trend Chart
- Chart.js line chart
- X-axis: last 7 days (date labels)
- Y-axis: 0–100
- Color-banded background: green (80+), blue (60–79), amber (40–59), red (0–39)
- Single line: daily readiness score with dots

### Section 4 — 30-Day History Chart
- Chart.js bar chart
- X-axis: last 30 days
- Bars colored by zone
- Hover tooltip: score + zone label

### Section 5 — Insights Panel
- Auto-generated 2–3 text insights based on trends across the last 7 days
- Insight types:
  - HRV trend (3+ consecutive days declining → fatigue warning)
  - Sleep consistency (variance > 1 point avg → consistency tip)
  - Training load accumulation (high load 5+ days → deload suggestion)
  - Score trajectory (improving 3+ days → positive reinforcement)
  - Missing data nudge (HRV/RHR not logged → prompt to log for better accuracy)

---

## Implementation Boundaries

- **`js/readiness.js`** — score calculation, snapshot storage, insight generation
- **`index.html`** — view markup (`#view-readiness`), nav tab addition
- **`css/main.css`** — any new styles (charts, insight cards, ring gauge)
- No new dependencies — uses Chart.js already loaded

---

## Out of Scope
- AI/LLM-generated coaching (static rule-based only)
- Integration with wearable APIs
- Adaptive workout plan modifications (future phase)
