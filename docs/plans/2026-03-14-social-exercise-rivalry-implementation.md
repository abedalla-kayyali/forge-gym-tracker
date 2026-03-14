# Social Exercise Rivalry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add exercise-level rivalry to Social compare for bodyweight and cardio using aggregated public summaries only.

**Architecture:** Extend `duelPublicStats` with bodyweight exercise summaries and cardio activity summaries, then render rivalry lists and detail sheets in `js/social-ui.js`. Keep privacy control and existing compare summaries intact.

**Tech Stack:** Vanilla JS, HTML, CSS, Supabase public profile snapshots, current Social compare system.

---

### Task 1: Add failing checks for rivalry summary hooks

**Files:**
- Modify: `smoke_check.js`

**Step 1: Add smoke assertions**

Check for:
- `bodyweightExerciseSummary`
- `cardioActivitySummary`
- rivalry list render hooks
- rivalry detail sheet hooks

**Step 2: Run smoke check**

Run:
```bash
node smoke_check.js
```

Expected:
- FAIL with missing rivalry hooks

### Task 2: Publish bodyweight exercise summaries

**Files:**
- Modify: `js/duels.js`

**Step 1: Build per-exercise summary**

For each bodyweight exercise publish:
- `maxReps`
- `maxDurationSec`
- `sessions`
- `lastAt`

**Step 2: Attach to `duelPublicStats`**

Use:
- `bodyweightExerciseSummary`

### Task 3: Publish cardio activity summaries

**Files:**
- Modify: `js/duels.js`

**Step 1: Build per-activity summary**

For each cardio activity publish:
- `bestMinutes`
- `bestDistanceKm`
- `weeklyMinutes`
- `weeklyDistanceKm`
- `sessions`
- `lastAt`

**Step 2: Attach to `duelPublicStats`**

Use:
- `cardioActivitySummary`

### Task 4: Render bodyweight exercise rivalry list

**Files:**
- Modify: `js/social-ui.js`
- Modify: `css/main.css`

**Step 1: Build merged exercise rivalry rows**

Compare your summary vs rival summary per exercise.

**Step 2: Render rivalry list**

Show:
- exercise
- your best
- rival best
- lead badge

**Step 3: Add bodyweight row detail sheet**

Tap row opens detail.

### Task 5: Render cardio activity rivalry list

**Files:**
- Modify: `js/social-ui.js`
- Modify: `css/main.css`

**Step 1: Build merged activity rivalry rows**

Compare:
- best single session
- weekly totals

**Step 2: Render rivalry list**

Show:
- activity
- best single session
- weekly total
- lead badge

**Step 3: Add cardio row detail sheet**

Tap row opens detail.

### Task 6: Add markup hooks for rivalry detail sheets

**Files:**
- Modify: `index.html`

**Step 1: Add cardio rivalry modal**

**Step 2: Add bodyweight rivalry modal**

### Task 7: Verify and release

**Files:**
- Modify: `js/config.js`

**Step 1: Run checks**

Run:
```bash
node smoke_check.js
node check_v3.js
```

Expected:
- both pass

**Step 2: Live verification**

Verify:
- bodyweight rivalry rows appear
- cardio rivalry rows appear
- detail sheets open
- privacy hidden state still works

**Step 3: Commit**

```bash
git add js/duels.js js/social-ui.js css/main.css index.html smoke_check.js js/config.js docs/plans/2026-03-14-social-exercise-rivalry-design.md docs/plans/2026-03-14-social-exercise-rivalry-implementation.md
git commit -m "feat: add social exercise rivalry"
```
