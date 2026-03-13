# Cardio Arcade UI/UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver an Arcade Energy redesign for Cardio Log and Cardio Stats with stronger chart and achievement UX while preserving logic and compatibility.

**Architecture:** Keep existing cardio data flow and tab hooks. Refactor rendered HTML shells and CSS for both cardio zones. Strengthen chart config/theme and normalize cardio entries before stats rendering.

**Tech Stack:** Vanilla JS, Chart.js 4.x, CSS custom properties, existing FORGE globals/localStorage.

---

### Task 1: Redesign Cardio Log Shell

**Files:**
- Modify: `js/cardio-log.js`
- Modify: `css/main.css`

**Step 1: Add log-shell setup helper**
- Create `_initCardioLogShell()` to add structural classes/hero wrappers and ensure idempotency.

**Step 2: Call shell init on load and after key actions**
- Trigger from `DOMContentLoaded` and after submit.

**Step 3: Upgrade streak banner content model**
- Include stronger copy + optional subtext for motivation.

**Step 4: Verify in browser manually**
- Cardio zone visually upgrades without changing logging behavior.

### Task 2: Redesign Cardio Stats Shell

**Files:**
- Modify: `js/cardio-stats.js`
- Modify: `css/main.css`

**Step 1: Replace stats HTML shell markup**
- Render hero/KPI/chart/achievement sections with dedicated classes.

**Step 2: Improve KPI card layout**
- Add icon lane + label/value/subtext hierarchy classes.

**Step 3: Improve empty/no-data states**
- Distinct all-data empty state and period-empty state blocks.

**Step 4: Verify in browser manually**
- Stats tab hierarchy is visually stronger and consistent.

### Task 3: Upgrade Chart UX

**Files:**
- Modify: `js/cardio-stats.js`
- Modify: `css/main.css`

**Step 1: Add shared chart theme options**
- Improve grid/ticks/tooltip/title readability and consistency.

**Step 2: Strengthen chart card visuals**
- HUD card borders, glow, spacing, fixed responsive heights.

**Step 3: Verify interaction**
- Period switching re-renders charts cleanly, no console errors.

### Task 4: Upgrade Achievements UX

**Files:**
- Modify: `js/cardio-stats.js`
- Modify: `css/main.css`

**Step 1: Redesign badge tile markup**
- Add lock state hint text and collectible style classes.

**Step 2: Redesign locked/unlocked visuals**
- Locked fog effect, unlocked glow ring, hover micro-motion.

**Step 3: Verify with sample data**
- Unlock states are visually obvious and readable.

### Task 5: Regression/Safety Verification

**Files:**
- Modify: none expected (unless bugfix)

**Step 1: Run checks**
- `node smoke_check.js`
- syntax check for updated JS.

**Step 2: Manual checks**
- Log cardio entry, verify stats update, achievements update, charts render.

**Step 3: Commit**
- `git add` updated files and commit with a UI/UX-focused message.
