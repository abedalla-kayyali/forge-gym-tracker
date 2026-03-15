# Premium Stats Nutrition Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign `Stats -> Nutrition` into a premium food-control console without changing the underlying nutrition calculations or interactions.

**Architecture:** Keep the existing data flow in `renderCoachNutrition()` and the nutrition analytics renderers intact, but reorganize the output into a clearer hero-led hierarchy and refresh the shared styling in `css/main.css`. This is a presentation-first change with regression checks added through the existing smoke/static scripts.

**Tech Stack:** Plain HTML templates in `index.html`, vanilla JS render logic, shared CSS in `css/main.css`, Node smoke verification.

---

### Task 1: Document the approved redesign context

**Files:**
- Create: `docs/plans/2026-03-15-premium-stats-nutrition-design.md`
- Create: `docs/plans/2026-03-15-premium-stats-nutrition-implementation.md`

**Step 1: Capture the approved design**

Write the premium nutrition design covering:
- hero control card
- macro command row
- habit + adherence boards
- deep insight layer
- no logic changes

**Step 2: Save the implementation plan**

Write this plan with exact file targets and verification commands.

**Step 3: Commit docs later with feature work**

Do not create a docs-only commit for this slice unless requested.

### Task 2: Restructure the nutrition render output

**Files:**
- Modify: `index.html:6800-7270`

**Step 1: Keep the existing calculations untouched**

Do not rewrite:
- macro target math
- adherence math
- habit tracker data prep
- custom target save actions

**Step 2: Introduce a premium hero shell**

Refactor the nutrition HTML output so the top of the screen includes:
- hero nutrition score card
- verdict/subline
- live badge / current state
- action summary

**Step 3: Convert macro summary into a command row**

Reorganize the current macro surfaces into a clearer macro tile band:
- protein
- calories
- carbs
- fats

**Step 4: Keep habit tracker below the hero**

Retain the current day-grid and KPI behavior, but place it after the hero + macro row.

**Step 5: Keep custom targets and meal surfaces functional**

Do not remove or disable:
- custom targets UI
- saved meal/day interactions
- metric switching

### Task 3: Upgrade the nutrition visual system

**Files:**
- Modify: `css/main.css:5627-6305`
- Modify: `css/main.css:9564-9640` if needed for shared nutrition chart/icon harmony

**Step 1: Add a premium nutrition shell**

Create styles for:
- nutrition hero panel
- verdict/meta rows
- premium macro tiles
- refined tracker container
- stronger deep-insight cards

**Step 2: Improve hierarchy and spacing**

Ensure:
- hero is dominant
- macros are second
- habit tracker and deep analysis are clearly secondary
- mobile spacing remains readable

**Step 3: Preserve existing mobile behavior**

Update current responsive rules rather than adding a conflicting second system.

### Task 4: Add regression coverage for the new nutrition shell

**Files:**
- Modify: `smoke_check.js`

**Step 1: Add shell presence checks**

Require strings for the new nutrition premium shell, for example:
- `nutri-premium-hero`
- `nutri-macro-command-row`
- `nutri-control-shell`

**Step 2: Keep prior readiness/social checks unchanged**

Do not weaken existing smoke coverage.

### Task 5: Verify the redesign

**Files:**
- Modify: `index.html`
- Modify: `css/main.css`
- Modify: `smoke_check.js`

**Step 1: Run smoke verification**

Run:
```bash
node smoke_check.js
```
Expected: `[smoke] All checks passed.`

**Step 2: Run static verification**

Run:
```bash
node check_v3.js
```
Expected: `Failed: 0`

**Step 3: Review diff for scope**

Run:
```bash
git diff -- index.html css/main.css smoke_check.js
```
Expected: nutrition-focused render/style changes only.

### Task 6: Commit and release

**Files:**
- Modify: `js/config.js`

**Step 1: Bump version/build**

Update:
- `window.FORGE_VERSION`
- `window.FORGE_BUILD`

**Step 2: Commit the feature**

```bash
git add index.html css/main.css smoke_check.js js/config.js docs/plans/2026-03-15-premium-stats-nutrition-design.md docs/plans/2026-03-15-premium-stats-nutrition-implementation.md
git commit -m "feat: redesign premium stats nutrition"
```

**Step 3: Push after verification**

```bash
git push origin master
```
