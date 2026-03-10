# Coding Conventions

**Analysis Date:** 2026-03-09

## Naming Patterns

**Files:**
- Lowercase filenames with descriptive nouns (`index.html`, `sw.js`, `main.css`)
- Feature sidecars in `js/` reflect domain (`exercises.js`, `i18n.js`)

**Functions:**
- Mostly `camelCase` (`renderDashboard`, `saveWorkout`, `applyTheme`)
- Internal/private-like helpers prefixed with underscore (`_lsGet`, `_idb`, `_updateHdrStats`)

**Variables:**
- Global mutable state in `let` variables at script scope (`workouts`, `settings`, `bwWorkouts`)
- Feature-local flags often prefixed `_` (`_sessionActive`, `_selectedEffort`, `_dashActiveTab`)

**Types:**
- No TypeScript types/interfaces detected; data contracts are implicit via object literals

## Code Style

**Formatting:**
- No formatter config detected
- Consistent semicolon usage and short guard clauses are common in `index.html`, `js/exercises.js`, `js/i18n.js`

**Linting:**
- No ESLint/Biome config detected
- Style enforced manually by authoring pattern

## Import Organization

**Order:**
1. External CDN resources in `<head>` (`Chart.js`, Google Fonts) in `index.html`
2. Local CSS in `<head>` (`css/main.css`)
3. Local JS sidecars + inline script blocks near end of `index.html`

**Path Aliases:**
- None detected (relative static paths only)

## Error Handling

**Patterns:**
- Defensive `try/catch` around storage parse/write operations (`_lsGet`, `save`, profile/checkin paths in `index.html`)
- Feature guards with `if (!el) return` and `typeof fn === 'function'` before optional cross-module calls

## Logging

**Framework:** Browser `console` and Node `console`

**Patterns:**
- Runtime warnings/info in app (`console.warn('[FORGE] ...')`) in `index.html`
- Service worker logs cache lifecycle in `sw.js`
- Dev server logs startup and icon-save results in `serve.js`

## Comments

**When to Comment:**
- Section banners and feature headers are heavily used to segment large files (especially `index.html`)
- Inline comments explain UX edge-case behavior (quota fallback, touch handling, modal lock safety)

**JSDoc/TSDoc:**
- Not used

## Function Design

**Size:** Mixed; many medium/large feature render functions live in `index.html`

**Parameters:** Primitive or small object args; functions often read globals directly

**Return Values:** UI mutators usually return void; computation helpers return derived arrays/numbers/strings

## Module Design

**Exports:** No ES module exports/imports; globals shared through script-tag order

**Barrel Files:** Not used

---

*Convention analysis: 2026-03-09*
