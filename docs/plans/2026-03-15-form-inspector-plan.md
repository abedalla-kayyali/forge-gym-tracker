I'm using the writing-plans skill to create the implementation plan.

# Form Inspector + Free Exercise DB Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich the Form Inspector with detailed cues, hybrid video/GIF media, and expanded bodyweight options by merging the curated catalog with the Free Exercise DB while keeping the experience fast for offline PWA users.

**Architecture:** Load the static Free Exercise DB JSON once at startup, normalize it into a shared `EXERCISE_STORE`, let the existing `EXERCISE_DB` and calisthenics data read from that store (with manual overrides preserved), and let the Service Worker cache the feed plus any remote GIF assets so the modal stays responsive in offline gyms.

**Tech Stack:** Vanilla JS (`js/exercises.js`, `sw.js`), modal markup in `index.html`, Service Worker caching APIs, lightweight fetch-from-JSON logic, DOM updates.

---

### Task 1: Initialize the Free Exercise DB loader

**Files:**
- Modify: `js/exercises.js` (top area around `const EXERCISE_DB` and helper exports).

**Step 1: Add the store scaffolding**

```js
const FREE_EXERCISE_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const EXERCISE_STORE = { raw: [], byName: new Map() };
```

Document that `EXERCISE_DB` remains available for existing flows but now proxies `EXERCISE_STORE` after normalization. No tests yet; logging `EXERCISE_STORE.raw.length` in console ensures the loader runs.

**Step 2: Implement `fetchWorkouts()`**

Fetch the JSON, normalize each entry (`name`, `muscle`, `equipment`, `instructions`, `images`, `primaryMuscles`, infer mechanic), push into `EXERCISE_STORE.raw`, and populate `byName` for O(1)` lookups`. After normalization call `getMergedExerciseCatalog()` to rehydrate `EXERCISE_DB`. When fetching fails, log and keep previous data.

**Step 3: Wire initialization**

Update the bootstrapping code (e.g., DOMContentLoaded handler in `js/exercises.js`) to `await fetchWorkouts()` before enabling the library or showing the modal. If no automated test exists, manually verify by opening the dev console; expect `EXERCISE_STORE.raw.length >= 800`.

**Step 4: Commit**

```bash
git add js/exercises.js
git commit -m "feat: add free exercise db loader"
```

### Task 2: Enhance the Form Inspector modal

**Files:**
- Modify: `index.html` (modal markup), `js/exercises.js` (open/close helpers and badge/step rendering), `data/form-inspector-media.json` (optional fallback entries).

**Step 1: Media selection logic**

- Update `openFormInspector()` to run on both Exercise Library and active logging view.
- Use the store entry to show badges for `primaryMuscles`, `equipment`, and a mechanic tag derived from the data.
- If `exercise.vid` exists, keep the `<video>` block and load the CDN video; if not, look up `exercise.images?.[0]` (prefixed with GitHub raw URL) and show via `<img>`. Include a badge (“Technique video”/“GIF”) so users know media exists; hide the media container if neither asset exists.

**Step 2: Steps & CTA**

- Render `instructions` (slice to 3-4 cues) or the fallback `tip`. Ensure the numbered list exists inside the modal and `form-steps-list` updates cleanly.
- Keep the `SELECT EXERCISE` button calling `pickExLibExercise(exercise.name, exercise.muscle)` and closing the modal.

**Step 3: Manual verification**

Reload the app, open the modal for an exercise with `vid`, one with only a Free Exercise DB GIF, and one with neither; confirm DOM updates and console shows no ReferenceError (e.g., `video` variable should originate from `document.getElementById`). Document missing data if any.

**Step 4: Commit**

```bash
git add index.html js/exercises.js data/form-inspector-media.json
git commit -m "feat: upgrade form inspector UI"
```

### Task 3: Grow calisthenics/bodyweight entries

**Files:**
- Modify: `js/exercises.js` (sections defining `CALISTHENICS_TREES`, `BW_EXERCISES`, and `CALISTHENICS_WALKTHROUGH`).

**Step 1: Filter bodyweight roster**

- After `fetchWorkouts()` resolves, compute `const BODYWEIGHT_EXERCISES = EXERCISE_STORE.raw.filter(ex => ex.equipment === 'body only');`
- Use this dataset to rebuild the calisthenics arcade and/or tree structure, ensuring each node passes the exact exercise name into `openFormInspector`.

**Step 2: Verify cross-references**

- Test that tapping the “View Technique” button inside the bodyweight zones opens the inspector with the matching metadata; names must match (case sensitive). If necessary map synonyms (e.g., “Bench Press” vs “Barbell Bench Press”).

**Step 3: Commit**

```bash
git add js/exercises.js
git commit -m "feat: refresh calisthenics catalog"
```

### Task 4: Improve service worker caching

**Files:**
- Modify: `sw.js`.

**Step 1: Cache JSON feed**

- In the fetch listener add a branch for `FREE_EXERCISE_JSON_URL` (or general `exercises.json`). Respond with cached copy (SWR) and update `caches.open('workout-data-v1')`.

**Step 2: Cache GIF/video assets**

- Add logic for requests to `raw.githubusercontent.com` paths that include `/exercises/`. Use cache-first: check `caches.match`, and if missing fetch + `cache.put`.

**Step 3: Verify offline behavior**

- Open devtools, update “Offline” mode, reload (after fetching some media). Confirm the JSON and GIFs are served from the cache (Network tab shows 200 or (from service worker), not blocked). Log steps taken in project notes.

**Step 4: Commit**

```bash
git add sw.js
git commit -m "chore: cache exercise media in sw"
```

### Task 5: Housekeeping and fallback polish

**Files:**
- Modify: `data/form-inspector-media.json`, optional docs/attribution, CSS if needed for badges.

**Step 1: Determine fallback entries**

- Remove entries covered by the Free Exercise DB; keep only ones still missing (`Exercise DB name -> custom GIF/video`). Normalize names to match store lookups.

**Step 2: Update copy**

- Add UI copy referencing the new source (e.g., “Technique reference powered by Free Exercise DB”). Ensure any new badges align with `css/main.css`.

**Step 3: Final smoke test**

- Walk through a typical bodyweight workout, open multiple inspectors, and ensure there are no console errors or missing badges. Capture video/test notes for later QA.

**Step 4: Commit**

```bash
git add data/form-inspector-media.json css/main.css
git commit -m "chore: document form inspector media fallbacks"
```

---

Plan complete and saved to `docs/plans/2026-03-15-form-inspector-plan.md`. Two execution options:

1. Subagent-Driven (this session) - dispatch a fresh `superpowers:subagent-driven-development` agent per task and review changes between commits, fast iteration.
2. Parallel Session (separate) - open a new session with `superpowers:executing-plans`, run the tasks there, and checkpoint back when each task completes.

Which approach?	
