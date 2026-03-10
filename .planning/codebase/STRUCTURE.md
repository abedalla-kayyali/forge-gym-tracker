# Codebase Structure

**Analysis Date:** 2026-03-09

## Directory Layout

```
[project-root]/
|-- index.html                # Main SPA markup + core app logic
|-- css/main.css              # Full style system and theme variables
|-- js/exercises.js           # Exercise DB + set/selector helpers
|-- js/i18n.js                # EN/AR dictionary + language/mobile glue
|-- sw.js                     # Service worker cache lifecycle
|-- manifest.json             # PWA manifest metadata
|-- serve.js                  # Local static server (Node)
|-- icons/                    # App icons + icon generation helper
`-- FORGE_APP_REFERENCE.md    # Internal architectural reference
```

## Directory Purposes

**`css/`:**
- Purpose: Centralized styling for all components and themes
- Contains: `main.css`
- Key files: `css/main.css`

**`js/`:**
- Purpose: Sidecar modules extracted from the original monolith
- Contains: Exercise catalog/program data and translation/mobile logic
- Key files: `js/exercises.js`, `js/i18n.js`

**`icons/`:**
- Purpose: PWA icon assets and generator helper page
- Contains: SVG/PNG icons and `generate_icons.html`
- Key files: `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg`

**`.claude/`:**
- Purpose: Local editor/agent settings
- Contains: launch and local settings JSON
- Key files: `.claude/launch.json`, `.claude/settings.local.json`

## Key File Locations

**Entry Points:**
- `index.html`: Main app shell and functional entry point
- `serve.js`: Local dev runtime entry point

**Configuration:**
- `manifest.json`: PWA settings, name, icons, theme/background colors
- `sw.js`: Offline caching behavior and cache version

**Core Logic:**
- `index.html`: Workout save flows, dashboard/coach rendering, stats, history, themes
- `js/exercises.js`: Exercise selection and set-entry UX helpers
- `js/i18n.js`: Translation application and mobile UX patches

**Testing:**
- Not detected (no `tests/`, no `*.test.*`, no test config files)

## Naming Conventions

**Files:**
- Lowercase with hyphen/flat naming for root scripts (`serve.js`, `sw.js`)
- Sidecar JS modules use semantic names (`exercises.js`, `i18n.js`)

**Directories:**
- Simple lowercase category folders (`css`, `js`, `icons`)

## Where to Add New Code

**New Feature:**
- Primary code: `index.html` (unless extracting a focused module into `js/`)
- Tests: Not applicable currently; if introduced, create a new dedicated `tests/` directory

**New Component/Module:**
- Implementation: Add sidecar module in `js/` and include via script tag in `index.html`

**Utilities:**
- Shared helpers: Top-level helper section in `index.html` or dedicated `js/` utility file if reuse is high

## Special Directories

**`.planning/codebase/`:**
- Purpose: Generated architecture mapping documents
- Generated: Yes
- Committed: Project-dependent (currently no git repository initialized)

---

*Structure analysis: 2026-03-09*
