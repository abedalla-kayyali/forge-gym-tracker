# Form Inspector & Free Exercise Data Design

## Goal

Define how the Form Inspector/UI flows, exercise data source, and offline caching behavior work together so the PWA delivers rich technique references without bloating the initial download.

## Context

- The exercise library and form inspector currently rely on a hand-curated `EXERCISE_DB` with short tips plus a lightweight `form-inspector-media.json` that maps a few GIF URLs. We want to expand the catalog, power the modal with real step-by-step instructions, and keep the app fast and offline-first.
- The Free Exercise DB (yuhonas/free-exercise-db) exposes a static `exercises.json` bundle that already labels every exercise with equipment, primary muscles, instructions, and image filenames (hosted via raw.githubusercontent.com). This makes it ideal for adoption without a backend.

## Design Sections

### 1. Data-loading & caching

- Fetch `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json` at runtime when the app loads. Parse it into the current `EXERCISE_DB` shape (`name`, `muscle`, `equipment`, `tip`) but keep the richer metadata (`primaryMuscles`, `instructions`, `images`), storing everything in a shared cache object (e.g., `EXERCISE_STORE`) that the library, form inspector, and calisthenics flows can query.
- Service worker: treat the JSON feed as a `stale-while-revalidate` resource. When `fetchWorkouts()` runs, respond with cached data immediately while fetching the latest copy to update the cache. The offline experience is prioritized because the JSON is cached; subsequent visits reuse it.
- Already cached image URLs (GIFs hosted on raw.githubusercontent.com) should be stored by the SW using a cache-first policy, so once a user opens a technique reference the visuals load instantly even without connectivity.
- Provide a lightweight fallback for the handful of exercises missing a GIF (use the prior `form-inspector-media.json` mapping if necessary).

### 2. Form Inspector UX

- The modal keeps its structure: top visual, badge strip, numbered list, select button. Instead of `data/form-inspector-media.json`, the GIF is resolved from the exercise data (`images[0]`). Show a placeholder if no image exists.
- Extend the badge strip to show muscle, equipment, mechanic (if available from the metadata), and primary muscles; ensure styling handles 2-3 badges gracefully.
- Steps: render either the `instructions` array (joined as sentences) or, for the original exercises, keep the short tip string as a fallback.
- Ensure the select button still invokes `pickExLibExercise` with the exercise name/muscle, and the modal closes cleanly.
- Wire any existing calisthenics info buttons to `openFormInspector` so they reuse the same modal and minimize duplicate assets.

### 3. Calisthenics + Bodyweight depth

- Replace the current `CALISTHENICS_TREES`/`BW_EXERCISES` entries with the subset of bodyweight exercises from the Free Exercise DB (filter by `equipment === 'body only'`). This adds more progressions and keeps the dataset unified.
- When building the trees, prefer the exercise `name` and include the `primaryMuscles` or `target` data in badge tooltips or subtext so users see context.
- Keep the arcade UI referencing the same names used in the form inspector so the info modal always finds the right metadata.

### 4. Implementation considerations

- Running the fetch once and storing it in a module-level cache (with `await fetchWorkouts()` used early in the app startup) ensures the rest of the app reuses the data without needing multiple requests.
- We should still allow `EXERCISE_DB` overrides from the community list (`getMergedExerciseCatalog`), so the merge should happen after we load and parse the JSON.
- Any feature that needs help text (e.g., the "Form" button next to the exercise input or the callouts inside the bodyweight arcade) should display a loading state until the JSON has finished loading.

### Open questions

- Do we keep `form-inspector-media.json` as a manual override map for missing GIFs, or remove it entirely once the JSON includes all needed visuals?
- Are there exercises in the Free DB that use equipment names or muscle labels we need to normalize for the existing UI filters?
