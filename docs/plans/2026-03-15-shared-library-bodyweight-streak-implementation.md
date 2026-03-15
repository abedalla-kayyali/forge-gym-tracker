# Shared Library And Bodyweight Streak Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand weighted workout coverage, add shared global missing-item creation for weighted exercises and meals, and add a richer bodyweight in-session set streak loop with sound feedback.

**Architecture:** Keep the static weighted exercise database as the built-in base layer, then merge a shared Supabase-backed community catalog on top for weighted exercises and meals. Bodyweight streak work stays session-scoped in the bodyweight mode module and does not change the long-term workout storage model in phase 1.

**Tech Stack:** Vanilla JS, HTML, CSS, Supabase JS client, localStorage-backed app state, existing FORGE sound/haptic helpers.

---

### Task 1: Inspect current weighted search and locate meal library source

**Files:**
- Modify: `docs/plans/2026-03-15-shared-library-bodyweight-streak-design.md` only if findings force design correction
- Read: `js/exercises.js`
- Read: `js/bodyweight-mode.js`
- Read: `index.html`
- Read: meal-library source file(s) once located

**Step 1: Confirm weighted exercise picker entry points**

Run:
```powershell
Select-String -Path js/exercises.js,index.html -Pattern "exercise-name|showAutocomplete|openExLib|pickExLibExercise|No exercises found" -Context 0,6
```
Expected: clear list of picker/search entry points and miss-state surfaces.

**Step 2: Locate the meal library source**

Run:
```powershell
Get-ChildItem js -Recurse | Select-String -Pattern "mealLibrary|forge_meals|Add meal|meal search|meal library" | Select-Object -First 80
```
Expected: exact file handling meal search/add flows.

**Step 3: Record findings before code**

Write down exact files to modify for weighted community add flow and meal community add flow.

**Step 4: Commit checkpoint if design changed**

```bash
git add docs/plans/2026-03-15-shared-library-bodyweight-streak-design.md
git commit -m "docs: refine shared library design inputs"
```
Only if the design doc needed correction.

### Task 2: Add failing smoke checks for new shared-library hooks

**Files:**
- Modify: `smoke_check.js`

**Step 1: Write failing checks**

Add smoke assertions for:
- weighted shared library fetch/create hook presence
- meal shared library fetch/create hook presence
- bodyweight streak hook presence
- miss-state add CTA hook presence

Example checks to add:
```js
if (!exerciseCode.includes('communityExercises')) fail('Missing shared exercise catalog hook');
if (!mealCode.includes('communityMeals')) fail('Missing shared meal catalog hook');
if (!bodyweightCode.includes('bw-set-streak')) fail('Missing bodyweight set streak hook');
```

**Step 2: Run smoke to verify failure**

Run:
```powershell
node smoke_check.js
```
Expected: fail on the newly added checks.

**Step 3: Commit failing-test checkpoint**

```bash
git add smoke_check.js
git commit -m "test: add shared library and bodyweight streak smoke coverage"
```

### Task 3: Expand the built-in weighted exercise catalog

**Files:**
- Modify: `js/exercises.js`
- Test: `smoke_check.js`

**Step 1: Add missing common exercises**

Expand `EXERCISE_DB` with more coverage for:
- calves
- traps
- lower back
- glutes
- forearms
- rear delts
- adductors/abductors where relevant
- commercial gym machine and cable variants

**Step 2: Keep data normalized**

Ensure entries use the existing object shape:
```js
{n:'Exercise Name',m:'Muscle',e:'equipment',t:'tip text'}
```

**Step 3: Run smoke and syntax verification**

Run:
```powershell
node smoke_check.js
node check_v3.js
```
Expected: pass or continue failing only on not-yet-implemented shared hooks.

**Step 4: Commit**

```bash
git add js/exercises.js smoke_check.js
git commit -m "feat: expand weighted exercise coverage"
```

### Task 4: Add shared community exercises data layer

**Files:**
- Modify: `js/exercises.js`
- Modify: `js/sync.js` or Supabase helper file if shared fetch helpers belong there
- Read: existing Supabase client file(s)
- Test: `smoke_check.js`

**Step 1: Add normalization helper**

Implement a small helper like:
```js
function normalizeCommunityNameKey(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');
}
```

**Step 2: Add fetch helper**

Implement shared exercise fetch helper that loads `community_exercises` and returns rows mapped into the same shape as `EXERCISE_DB`.

**Step 3: Add create/upsert helper**

Implement shared exercise create helper that:
- builds `name_key`
- upserts on `name_key`
- returns the saved/matched row

**Step 4: Add graceful fallback**

If Supabase table is missing or request fails:
- log warning
- return built-in catalog only
- do not break search UI

**Step 5: Run smoke**

Run:
```powershell
node smoke_check.js
```
Expected: shared exercise hooks now satisfy the new checks.

**Step 6: Commit**

```bash
git add js/exercises.js js/sync.js smoke_check.js
git commit -m "feat: add shared community exercise catalog"
```
Adjust file list to actual touched files.

### Task 5: Wire weighted miss-state add flow

**Files:**
- Modify: `js/exercises.js`
- Modify: `index.html` if modal/CTA markup is needed
- Modify: `css/main.css` for add-state styling
- Test: `smoke_check.js`

**Step 1: Add `Workout not found? Add it` UI**

When weighted search returns no result, render an add CTA instead of only empty text.

**Step 2: Add simple exercise-create sheet or inline form**

Collect:
- name
- muscle
- equipment
- optional tip

**Step 3: Save and auto-select**

On successful create/upsert:
- refresh merged exercise list
- auto-fill `exercise-name`
- select the new exercise immediately

**Step 4: Verify no regression in weighted picker**

Run:
```powershell
node smoke_check.js
node check_v3.js
```
Expected: pass.

**Step 5: Commit**

```bash
git add js/exercises.js index.html css/main.css smoke_check.js
git commit -m "feat: add weighted community exercise creation"
```

### Task 6: Add shared community meals data layer

**Files:**
- Modify: meal-library source file(s) found in Task 1
- Modify: Supabase helper file if needed
- Test: `smoke_check.js`

**Step 1: Add meal normalization helper**

Use the same `name_key` pattern as exercises, but only for exact-near duplicate prevention.

**Step 2: Add fetch helper for `community_meals`**

Return rows in the same format the meal picker already expects.

**Step 3: Add create/upsert helper**

Capture:
- name
- category
- calories
- protein
- carbs
- fat

**Step 4: Add graceful fallback**

If shared table is unavailable, meal search still works against the local library.

**Step 5: Run smoke**

Run:
```powershell
node smoke_check.js
```
Expected: meal shared-library hooks satisfy new checks.

**Step 6: Commit**

```bash
git add <meal-files> smoke_check.js
git commit -m "feat: add shared community meal catalog"
```

### Task 7: Wire meal miss-state add flow

**Files:**
- Modify: meal-library source file(s)
- Modify: `index.html` if needed
- Modify: `css/main.css` if needed

**Step 1: Add `Add meal` CTA on no-result state**

Use the current meal logging surface instead of a separate detached modal if possible.

**Step 2: Save and auto-select**

After create/upsert:
- refresh meal search source
- auto-fill selected meal
- keep the user in the logging flow

**Step 3: Run verification**

Run:
```powershell
node smoke_check.js
node check_v3.js
```
Expected: pass.

**Step 4: Commit**

```bash
git add <meal-files> index.html css/main.css
git commit -m "feat: add shared community meal creation"
```

### Task 8: Add failing bodyweight streak smoke coverage details

**Files:**
- Modify: `smoke_check.js`
- Modify: `js/bodyweight-mode.js` later

**Step 1: Extend smoke checks**

Require presence of bodyweight streak UI/state hooks such as:
- current set streak state
- best run state
- milestone feedback hook

**Step 2: Run smoke to verify failure**

Run:
```powershell
node smoke_check.js
```
Expected: fail until the bodyweight streak implementation lands.

**Step 3: Commit**

```bash
git add smoke_check.js
git commit -m "test: add bodyweight streak smoke coverage"
```

### Task 9: Implement bodyweight live set streak state

**Files:**
- Modify: `js/bodyweight-mode.js`
- Modify: `index.html`
- Modify: `css/main.css`
- Read: `js/fx-sound.js`
- Read: `js/fx-haptic.js`

**Step 1: Add bodyweight streak state**

Add minimal session-scoped state, for example:
```js
let _bwSetStreak = 0;
let _bwBestRun = 0;
let _bwLastExerciseForStreak = '';
```

**Step 2: Increment/reset correctly**

Increment when a set is added for the same selected bodyweight exercise.
Reset when:
- exercise changes
- bodyweight set list is cleared
- mode changes away from bodyweight

**Step 3: Add UI strip**

Render:
- current streak
- best run
- milestone chip

**Step 4: Keep it local to bodyweight session**

Do not persist this to workout history yet.

**Step 5: Run verification**

Run:
```powershell
node smoke_check.js
node check_v3.js
```
Expected: pass.

**Step 6: Commit**

```bash
git add js/bodyweight-mode.js index.html css/main.css smoke_check.js
git commit -m "feat: add bodyweight live set streak"
```

### Task 10: Add bodyweight streak sound and milestone feedback

**Files:**
- Modify: `js/bodyweight-mode.js`
- Modify: `js/fx-sound.js` only if a dedicated helper is truly needed
- Modify: `css/main.css`

**Step 1: Reuse existing sound setting**

Hook into existing sound helpers instead of introducing a separate toggle.

**Step 2: Add milestone logic**

Milestones:
- 3
- 5
- 8+

Behavior:
- normal set add uses lightweight feedback
- milestone adds trigger stronger feedback

**Step 3: Add small visual celebration**

Examples:
- pulse the streak chip
- show `3-set run`, `5-set run`, `8-set run`

**Step 4: Run verification**

Run:
```powershell
node smoke_check.js
node check_v3.js
```
Expected: pass.

**Step 5: Commit**

```bash
git add js/bodyweight-mode.js js/fx-sound.js css/main.css
git commit -m "feat: add bodyweight streak milestones"
```
Adjust file list if no sound helper file changes are needed.

### Task 11: Add Supabase SQL setup docs for shared catalogs

**Files:**
- Create: `docs/supabase/2026-03-15_shared_catalog_setup.sql`
- Modify: `docs/plans/2026-03-15-shared-library-bodyweight-streak-design.md` if needed

**Step 1: Write SQL for `community_exercises` and `community_meals`**

Include:
- create table
- unique `name_key`
- indexes
- RLS
- authenticated read
- authenticated insert/update with sane policy

**Step 2: Document failure mode**

Note that app code degrades gracefully if tables are not yet installed.

**Step 3: Commit**

```bash
git add docs/supabase/2026-03-15_shared_catalog_setup.sql docs/plans/2026-03-15-shared-library-bodyweight-streak-design.md
git commit -m "docs: add shared catalog supabase setup"
```

### Task 12: End-to-end verification

**Files:**
- Verify touched files only

**Step 1: Run local checks**

Run:
```powershell
node smoke_check.js
node check_v3.js
```
Expected: both pass.

**Step 2: Run browser validation**

Validate these flows:
- weighted exercise miss -> add -> auto-select
- meal miss -> add -> auto-select
- second account can see added exercise/meal after refresh
- bodyweight set streak increments and milestone feedback triggers

Use existing Playwright workflow and temporary scripts in `%TEMP%`.

**Step 3: Bump version**

Update `js/config.js` with next version and build label.

**Step 4: Commit final release step**

```bash
git add js/config.js
git commit -m "chore: bump version for shared libraries and bodyweight streak"
```

**Step 5: Push**

```bash
git push origin master
```

**Step 6: Verify live build**

Run:
```powershell
curl.exe -L --silent --show-error https://abedalla-kayyali.github.io/forge-gym-tracker/js/config.js | Select-String -Pattern "FORGE_VERSION|FORGE_BUILD"
```
Expected: live site shows the new version/build.
