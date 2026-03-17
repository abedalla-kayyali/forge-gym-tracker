# Progress Proof Card — Design Spec
**Date:** 2026-03-17
**Version target:** v224
**Status:** Approved for implementation

---

## Overview

A shareable 1080×1350px Canvas image card that tells the user's progress story over their active mesocycle (or last 30 days as fallback). Goal-aware hero stats, body comp bars, top lift improvements, and a "Built with FORGE · #ForgeProof" watermark. Viral acquisition flywheel — every share is a FORGE ad.

---

## Data Layer

All data read from localStorage at render time. No new sync or server calls required.

| Stat | Source | Fallback |
|---|---|---|
| Time window | `forge_mesocycle.startDate` + `phase` | Last 30 days |
| Weight Δ | `forge_profile` weight entries, first vs latest in window | Hidden if <2 entries |
| BF% Δ | `forge_inbody_tests`, first vs latest in window | Hidden if no InBody data |
| SMM Δ | `forge_inbody_tests`, first vs latest in window | Hidden if no InBody data |
| Top PR gain | `forge_workouts` — biggest (current best − window-start best) per exercise | Hidden if none |
| Sessions count | `forge_workouts` filtered to window date range | Always shown |
| Current streak | `calcStreak()` | Always shown |
| Goal / phase label | `forge_mesocycle.phase` or `userProfile.goal` | "FORGE ATHLETE" |

### Hero Stat Selection (goal-aware)

| Goal | Hero A | Hero B |
|---|---|---|
| `fat_loss` | Weight Δ | BF% Δ |
| `muscle_gain` | Top PR gain | SMM Δ |
| `recomp` / default | Weight Δ | Top PR gain |

Hero stats render at 96px font in accent green (`#54ffab`). All other stats use standard pill size.

---

## Card Layout (1080×1350px)

```
┌─────────────────────────────────────────────┐
│  FORGE PROGRESS PROOF          [NAME]        │
│  [Phase label] · [N weeks]     [goal badge]  │
│  ─────────────────────────────────────────── │
│  [HERO STAT A]      [HERO STAT B]            │
│  (96px accent green, large delta values)     │
│  ─────────────────────────────────────────── │
│  [SESSIONS] [STREAK] [TOP PR] [WEIGHT Δ]     │  stat pills row
│  ─────────────────────────────────────────── │
│  BF% ████████░░ -1.8%   SMM ██████░░ +1.2kg │  body comp bars (InBody only)
│  ─────────────────────────────────────────── │
│  TOP LIFT IMPROVEMENT                        │
│  Squat  95kg → 115kg  +21%  ★ PR            │
│  Bench  70kg → 82.5kg +18%                  │
│  ─────────────────────────────────────────── │
│       Built with FORGE · #ForgeProof        │
└─────────────────────────────────────────────┘
```

- Background: same dark gradient as session card (`#050d08` → `#0b1a12`) with two radial accent glows
- Body comp bars section: only rendered if InBody data exists in window
- Top lifts section: up to 3 exercises sorted by % gain, requires ≥1 workout in window
- Stat pills row: reuses `_drawPill()` from `share-helpers.js`
- `_roundRect()` and `_canvasToBlob()` reused from `share-helpers.js` via globals

---

## Trigger Points

### 1. Progress Tab — On-Demand
- "Share Progress" button added to Monthly Report section header
- Calls `window.shareProgressProofCard()`

### 2. Sunday Weekly Prompt
- Checked in `window._progressCardInit()`, called on Progress tab open
- Conditions: day === Sunday AND ≥1 workout logged this week AND `forge_progress_card_last_sunday` !== current Sunday ISO date
- Shows toast: "🏆 Share your week?" with tap action opening the preview modal
- Throttled: sets `forge_progress_card_last_sunday` = today's ISO date on show

### 3. Card Preview Modal
- Renders card into `<canvas id="progress-proof-preview">` before sharing
- Uses same `wend-overlay` modal pattern as session share card
- Two buttons: **Share** (Web Share API with PNG file → download fallback) + **Download**

---

## File Structure

### New file: `js/progress-proof-card.js`
- IIFE, ~300 lines
- No external dependencies beyond globals from `share-helpers.js` and localStorage
- Exports:
  - `window.shareProgressProofCard()` — render + share via Web Share API
  - `window.downloadProgressProofCard()` — render + download PNG
  - `window._progressCardInit()` — Sunday prompt check

### `index.html` changes
- `<script src="js/progress-proof-card.js">` loaded after `share-helpers.js`
- "Share Progress" button in Monthly Report section
- `<canvas id="progress-proof-preview">` inside share modal

### `dashboard-history.js` change
- Add `if (typeof window._progressCardInit === 'function') window._progressCardInit();` alongside existing `renderMonthlyReport()` call on Progress tab open

### New localStorage key
- `forge_progress_card_last_sunday` — ISO date string, Sunday throttle only

---

## Constraints

- Vanilla JS IIFE only — no new dependencies
- All globals follow existing FORGE patterns (`let` globals, never `window.userProfile`)
- XSS: all user data rendered to Canvas via `ctx.fillText()` — no innerHTML
- `share-helpers.js` is not modified — only consumed via globals
- Version bump to v224 on completion
