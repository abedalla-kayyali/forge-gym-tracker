# Retention Results Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship Phase 1 adaptation features in Coach Today: adaptive daily plan, next-win guidance, consistency safety net, and basic plateau detection.

**Architecture:** Add deterministic helper functions near existing Coach Today logic in `index.html`, persist lightweight state in localStorage, and render 2 new cards in the Today tab without changing navigation flow. Keep beginner-first with one clear CTA per card.

**Tech Stack:** Vanilla JS in `index.html`, localStorage, existing FORGE state (`workouts`, `bwWorkouts`, `userProfile`, render hooks).

---

### Task 1: Add deterministic adaptation engine helpers

**Files:**
- Modify: `index.html` (near `renderCoachToday` helpers)

**Steps:**
1. Add localStorage key constants and safe read/write helpers for:
- `forge_adaptive_plan`
- `forge_plateau_state`
- `forge_consistency_state`
- `forge_next_win`
2. Add deterministic calculators:
- `_calcConsistencyState()`
- `_detectPlateaus()`
- `_buildAdaptivePlan()`
- `_buildNextWin()`
3. Keep outputs pure-object to simplify rendering.

### Task 2: Render new cards in Coach Today

**Files:**
- Modify: `index.html` (inside `renderCoachToday`)

**Steps:**
1. Build `adaptCard` (Today Plan + rationale + primary CTA).
2. Build `nextWinCard` (primary + secondary).
3. Build `safetyNetCard` when inactivity >= 2 days with minimum-session CTA.
4. Insert cards into Today layout after greeting/check-in and before body stats.

### Task 3: Wire actions and persistence

**Files:**
- Modify: `index.html`

**Steps:**
1. Add action handlers:
- `_ctodayStartAdaptiveMuscle(muscle)`
- `_ctodayStartMinimumSession()`
- `_ctodayApplyRescue(exercise)`
2. Save freshly computed state from `renderCoachToday`.
3. Ensure `postSaveHooks()` path keeps cards up to date.

### Task 4: Verify and regressions

**Files:**
- Modify: none or minor fixes

**Steps:**
1. Run `node check_v3.js`.
2. Run `node smoke_check.js`.
3. Run `cmd /c run_check.bat`.
4. Fix any issues and re-run until green.
