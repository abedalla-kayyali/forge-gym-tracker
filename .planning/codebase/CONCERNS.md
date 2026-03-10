# Codebase Concerns

**Analysis Date:** 2026-03-09

## Tech Debt

**Monolithic Main Script:**
- Issue: Very large inline JS surface in one file increases coupling and merge-risk.
- Files: `index.html`
- Impact: Harder debugging, onboarding, and safe refactoring; unrelated features can break together.
- Fix approach: Continue extracting focused modules from `index.html` into `js/` with explicit initialization order.

**Global Mutable State Graph:**
- Issue: Many cross-feature globals (`workouts`, `settings`, `_session...`, chart refs) are shared implicitly.
- Files: `index.html`, `js/exercises.js`, `js/i18n.js`
- Impact: Side effects are hard to trace; regressions appear from distant edits.
- Fix approach: Introduce scoped state objects per domain and pass dependencies explicitly.

## Known Bugs

**Potential Encoding Artifacts in Source Text:**
- Symptoms: Some comments/strings display mojibake-like characters in extracted files.
- Files: `js/exercises.js`, `js/i18n.js`, `sw.js`, `FORGE_APP_REFERENCE.md`
- Trigger: Opening files with mismatched encoding or after extraction/format conversion.
- Workaround: Normalize UTF-8 encoding and re-save affected files with a single editor encoding policy.

## Security Considerations

**Open CORS + Local Write Endpoint in Dev Server:**
- Risk: `serve.js` allows broad CORS and writes icon files via unauthenticated POST.
- Files: `serve.js`
- Current mitigation: Intended for local development only.
- Recommendations: Restrict origin/method in dev server or gate endpoint behind explicit dev flag.

## Performance Bottlenecks

**Repeated Full Re-renders on Save and Tab Switch:**
- Problem: Multiple expensive render functions run after each save (`renderCoach`, dashboard sections, charts).
- Files: `index.html`
- Cause: Centralized `postSaveHooks()` fan-out and non-memoized render passes.
- Improvement path: Incremental updates per affected panel and cache invalidation by feature key.

**Large DOM + Inline Handlers:**
- Problem: A very large `index.html` with many modal/view nodes can increase parse and layout cost.
- Files: `index.html`
- Cause: Single document includes all views and overlays eagerly.
- Improvement path: Lazy-render rarely used overlays/panels and move handlers to delegated listeners.

## Fragile Areas

**Script-Order Dependencies Across Globals:**
- Files: `index.html`, `js/exercises.js`, `js/i18n.js`
- Why fragile: Several functions rely on globals existing by load order (`t`, `selectMuscle`, `render...` checks).
- Safe modification: Keep script include order stable and add explicit boot function boundaries.
- Test coverage: No automated tests; must verify key flows manually after edits.

**Persistence Key Contracts:**
- Files: `index.html`, `FORGE_APP_REFERENCE.md`
- Why fragile: Many features depend on exact `localStorage` key names and payload shapes.
- Safe modification: Add migration helpers before changing schema or key names.
- Test coverage: No schema validation tests present.

## Scaling Limits

**Device-Local Data Growth:**
- Current capacity: Browser storage quotas only; no server-side offload.
- Limit: Large workout/photo history may hit storage limits on mobile browsers.
- Scaling path: Add chunked export/import and optional cloud sync backend.

## Dependencies at Risk

**CDN-only Chart.js:**
- Risk: App analytics features depend on external CDN availability.
- Impact: Charts fail when CDN blocked/offline before cache warmup.
- Migration plan: Vendor a local Chart.js fallback file and prefer same-origin load.

## Missing Critical Features

**No Automated Regression Safety Net:**
- Problem: No unit/integration/e2e tests.
- Blocks: Confident large refactors and fast release cadence.

**No Data Migration Versioning:**
- Problem: Storage schemas are implicit and mutable.
- Blocks: Safe backward-compatible evolution of stored records.

## Test Coverage Gaps

**Critical Save Flows Untested:**
- What's not tested: Weighted/bodyweight save flows, PR logic, and post-save hook fan-out.
- Files: `index.html`
- Risk: Core logging can regress silently.
- Priority: High

**Offline/Install Path Untested:**
- What's not tested: Service worker updates, offline fallback, install banner behavior.
- Files: `sw.js`, `index.html`, `js/i18n.js`
- Risk: PWA regressions on real devices.
- Priority: High

**Import/Export Parsers Untested:**
- What's not tested: JSON/CSV importers and health source parsing.
- Files: `index.html`
- Risk: Data loss or malformed imports.
- Priority: Medium

---

*Concerns audit: 2026-03-09*
