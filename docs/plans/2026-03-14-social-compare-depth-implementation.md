# Social Compare Depth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add deep Social compare with body-map muscle summaries, cardio compare, and bodyweight compare using aggregated public snapshots only.

**Architecture:** Extend `duelPublicStats` publishing in `js/duels.js`, then upgrade `js/social-ui.js` to render secondary compare tabs, body-map compare cards, and a muscle detail sheet. Keep all compare reads on public aggregated snapshot data, not private logs.

**Tech Stack:** Vanilla JS, HTML, CSS, Supabase public profile snapshots, existing Social tab infrastructure, existing body-map SVG conventions.

---

### Task 1: Add failing regression checks for deep compare surface

**Files:**
- Modify: `smoke_check.js`

**Step 1: Write the failing checks**

Add smoke assertions for:
- compare secondary tabs
- muscle summary publishing keys
- cardio/bodyweight summary publishing keys
- compare detail sheet markup hook

**Step 2: Run the smoke check to verify it fails**

Run:
```bash
node smoke_check.js
```

Expected:
- FAIL with missing compare-depth snippets

**Step 3: Commit after green later**

Do not commit in this task. This task only creates the failing check.

### Task 2: Publish richer public compare summaries

**Files:**
- Modify: `js/duels.js`
- Test: `smoke_check.js`

**Step 1: Implement muscle summary builder**

Compute per-muscle aggregated public fields from weighted workouts:
- `maxWeight`
- `sessions`
- `lastTrainedAt`

Use existing workout muscle naming already used by the app.

**Step 2: Implement cardio summary builder**

Publish:
- `sessions7d`
- `minutes7d`
- `distance7d`
- `lastCardioAt`
- `topMode`

**Step 3: Implement bodyweight summary builder**

Publish:
- `sessions7d`
- `skillsDone`
- `bestReps`
- `bestDurationSec`
- `lastBodyweightAt`

**Step 4: Attach summaries to `duelPublicStats`**

Mirror them to both:
- `profiles_public.duel_public_stats`
- `profiles.data.duelPublicStats`

**Step 5: Run smoke check**

Run:
```bash
node smoke_check.js
```

Expected:
- compare data-key checks pass

### Task 3: Add compare sub-view state and shell

**Files:**
- Modify: `js/social-ui.js`
- Modify: `index.html`
- Modify: `css/main.css`

**Step 1: Add compare sub-tab state**

Inside Social compare state, add:
- `compareView`

Supported values:
- `overview`
- `body`
- `cardio`
- `bodyweight`

Default:
- `body`

**Step 2: Add compare sub-tab controls**

Render segmented buttons inside the compare panel.

**Step 3: Add compare detail modal shell**

Add modal markup hook in `index.html` for muscle compare details.

**Step 4: Add styling**

Add styles for:
- compare sub-tabs
- body compare layout
- metric cards
- compare detail modal

**Step 5: Run static verification**

Run:
```bash
node check_v3.js
```

Expected:
- `Failed: 0`

### Task 4: Render body-map compare

**Files:**
- Modify: `js/social-ui.js`
- Modify: `css/main.css`

**Step 1: Build compare-friendly local muscle summary reader**

Read your own aggregated muscle summary from current arrays using the same summary shape as public stats.

**Step 2: Build rival muscle summary reader**

Read friend `muscleSummary` from public snapshot.

**Step 3: Render side-by-side body maps**

Use consistent body zones and highlight logic for:
- `You`
- `Rival`

**Step 4: Add body rivalry summary strip**

Show 1-2 short callouts for lead/trail muscles.

**Step 5: Run smoke + static checks**

Run:
```bash
node smoke_check.js
node check_v3.js
```

Expected:
- both pass

### Task 5: Implement muscle detail compare sheet

**Files:**
- Modify: `js/social-ui.js`
- Modify: `index.html`
- Modify: `css/main.css`

**Step 1: Add click handlers on body zones**

Clicking a muscle should open the compare detail modal.

**Step 2: Render aggregated detail content**

Show:
- max load
- last trained
- sessions
- lead verdict
- catch-up tip

**Step 3: Handle no-weight cases**

If no max load exists:
- hide fake weight values
- show sessions and recency only

**Step 4: Run static verification**

Run:
```bash
node check_v3.js
```

Expected:
- `Failed: 0`

### Task 6: Render cardio compare

**Files:**
- Modify: `js/social-ui.js`
- Modify: `css/main.css`

**Step 1: Build local cardio summary**

Match the public snapshot shape.

**Step 2: Render cardio metric cards**

Show:
- sessions 7d
- minutes 7d
- distance 7d
- last cardio
- top mode

**Step 3: Add rivalry verdict line**

Use simple comparative copy based on volume/consistency.

**Step 4: Run smoke check**

Run:
```bash
node smoke_check.js
```

Expected:
- pass

### Task 7: Render bodyweight compare

**Files:**
- Modify: `js/social-ui.js`
- Modify: `css/main.css`

**Step 1: Build local bodyweight summary**

Match the public snapshot shape.

**Step 2: Render bodyweight metric cards**

Show:
- sessions 7d
- skills done
- best reps
- best hold
- last session

**Step 3: Add rivalry verdict line**

Summarize who leads on consistency vs skill output.

**Step 4: Run static verification**

Run:
```bash
node check_v3.js
```

Expected:
- `Failed: 0`

### Task 8: End-to-end verify with real accounts

**Files:**
- No production file changes required unless bugs are found

**Step 1: Verify live build version**

Check deployed `js/config.js` after push.

**Step 2: Verify compare with real accounts**

Using the existing two test accounts:
- open Social compare
- verify body compare
- verify muscle sheet opens
- verify cardio compare
- verify bodyweight compare

**Step 3: Fix any runtime defect**

If real-browser verification fails, debug root cause before any additional changes.

### Task 9: Version bump and release

**Files:**
- Modify: `js/config.js`

**Step 1: Bump version/build label**

Update version for the compare-depth release.

**Step 2: Run final verification**

Run:
```bash
node smoke_check.js
node check_v3.js
```

Expected:
- both pass

**Step 3: Commit**

```bash
git add js/duels.js js/social-ui.js index.html css/main.css smoke_check.js js/config.js docs/plans/2026-03-14-social-compare-depth-design.md docs/plans/2026-03-14-social-compare-depth-implementation.md
git commit -m "feat: deepen social compare"
```
