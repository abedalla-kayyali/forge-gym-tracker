# Architecture

**Analysis Date:** 2026-03-09

## Pattern Overview

**Overall:** Monolithic client-side PWA with modular data/i18n sidecar files

**Key Characteristics:**
- Single-page app shell and most behavior live in `index.html`
- Global function orchestration with direct DOM mutation and inline `onclick` handlers
- Local-first persistence using `localStorage` with IndexedDB backup in `index.html`

## Layers

**Presentation Layer:**
- Purpose: Render views, cards, modals, charts, and interaction surfaces
- Location: `index.html`, `css/main.css`
- Contains: View containers (`#view-log`, `#view-dashboard`, `#view-history`, `#view-coach`, `#view-more`), modal markup, component styles
- Depends on: Application state globals and Chart.js
- Used by: User interactions from touch/click/keyboard

**Domain Logic Layer:**
- Purpose: Workout logging, PR detection, scoring, missions, coach logic, analytics computation
- Location: Script blocks in `index.html` (functions such as `saveWorkout`, `renderDashboard`, `renderCoach`, `updateStatBar`)
- Contains: Calculation helpers, aggregators, feature-specific rendering functions
- Depends on: Persistence layer and UI nodes
- Used by: View switching and post-save hooks

**Data/Content Layer:**
- Purpose: Exercise catalog and translations
- Location: `js/exercises.js`, `js/i18n.js`
- Contains: `EXERCISE_DB`, training programs, language dictionaries and translation application
- Depends on: DOM and globally declared app helpers
- Used by: Autocomplete, overlays, labels, localized UI text

**Persistence Layer:**
- Purpose: Store workouts/settings and recover from storage pressure
- Location: `_lsGet`, `save`, and `_idb` in `index.html`
- Contains: `localStorage` read/write, IndexedDB mirror/restore for critical keys
- Depends on: Browser storage APIs
- Used by: Nearly all feature modules

**Offline/Delivery Layer:**
- Purpose: PWA installability, offline caching, local static serving
- Location: `manifest.json`, `sw.js`, `serve.js`
- Contains: Asset caching strategy, icon metadata, static file server
- Depends on: Browser SW APIs and Node `http/fs/path`
- Used by: App startup and install flow

## Data Flow

**Workout Logging Flow:**

1. User selects muscle/exercise and adds set rows in `index.html` UI.
2. `saveWorkout()` routes to `_saveWeightedWorkout()` or `saveBwWorkout()` in `index.html`.
3. Entry is normalized and appended to arrays (`workouts` or `bwWorkouts`) then persisted via `save()` or `saveBwData()` in `index.html`.
4. Post-save hooks trigger mission, coach, XP, charts, and header updates.

**Startup Initialization Flow:**

1. App loads static HTML/CSS/JS from `index.html`, `js/exercises.js`, `js/i18n.js`.
2. Global state hydrates from `localStorage` via `_lsGet` in `index.html`.
3. DOMContentLoaded hooks initialize sections, event handlers, and renderers in `index.html` and `js/exercises.js`.
4. Service worker is registered on window load in `index.html`; language/mobile fixes apply from `js/i18n.js`.

**State Management:**
- Mutable global arrays/objects (`workouts`, `bodyWeight`, `templates`, `settings`, `userProfile`, `bwWorkouts`) in `index.html`
- Localized helpers for cached derived data (`_dashPRCache`, `_dashPwCache`) in `index.html`

## Key Abstractions

**Workout Entity:**
- Purpose: Represents weighted or bodyweight training logs
- Examples: Saved in `forge_workouts` and `forge_bw_workouts` via `index.html`
- Pattern: Plain object records pushed into in-memory arrays then persisted

**Render-by-Feature Functions:**
- Purpose: Keep features separate inside one large script
- Examples: `renderDashboard`, `renderHistory`, `renderCoach`, `renderWorkoutCalendar` in `index.html`
- Pattern: Pull from global state and repaint specific DOM sections

**Storage Fallback Adapter (`_idb`):**
- Purpose: Increase reliability when `localStorage` quota is exceeded
- Examples: `_idb.put`, `_idb.restoreToLS` in `index.html`
- Pattern: Fire-and-forget mirror with async restore path

## Entry Points

**Main App Document:**
- Location: `index.html`
- Triggers: Browser navigation to root/start URL
- Responsibilities: Define UI tree, initialize state, wire interactions, render all views

**Exercise Module:**
- Location: `js/exercises.js`
- Triggers: Script tag load before main logic
- Responsibilities: Provide exercise data and helper UI routines (library picker, sets tooling)

**Language Module:**
- Location: `js/i18n.js`
- Triggers: Script tag near end of `index.html`
- Responsibilities: Translation dictionary, language toggling, mobile-specific interaction fixes

**Service Worker:**
- Location: `sw.js`
- Triggers: `navigator.serviceWorker.register('sw.js')` in `index.html`
- Responsibilities: Cache core assets, clean old caches, cache-first for same-origin requests

## Error Handling

**Strategy:** Fail-soft with `try/catch`, guards, and non-blocking initialization

**Patterns:**
- Storage read guard `_lsGet` returns fallback when JSON is corrupt in `index.html`
- Optional feature calls via `typeof fn === 'function'` checks across modules in `index.html`
- SW/network fallback returns cached `index.html` for failed HTML requests in `sw.js`

## Cross-Cutting Concerns

**Logging:** `console.log` and `console.warn` only (no external observability), e.g. storage and mission init warnings in `index.html`
**Validation:** Input guardrails in save handlers (`_saveWeightedWorkout`, `saveBwWorkout`, `logBodyWeight`) in `index.html`
**Authentication:** Not applicable (offline/local-first app with no user auth backend detected)

---

*Architecture analysis: 2026-03-09*
