# FORGE: Bug Fixes + XSS Audit + Adaptive Coaching Phase 1

Date: 2026-03-10
Status: Approved
Owner: Engineering

---

## Scope

Three independent workstreams to be executed in order:

1. Quick fixes (corrupted SVG, dead code cleanup, credential comment)
2. XSS audit (verify _esc() coverage across all innerHTML assignments)
3. Adaptive Coaching Phase 1 (from approved design: 2026-03-09-retention-results-feature-design.md)

---

## Section 1: Quick Fixes

### 1.1 Corrupted SVG Icon
- Replace `icons/icon.svg` (currently 6 bytes of binary garbage) with a valid FORGE-branded SVG
- Must be well-formed XML with viewBox, works as maskable PWA icon

### 1.2 Duplicate PORT in serve.js
- Remove the dead duplicate `const PORT` declaration near line 64 of `serve.js`

### 1.3 Supabase Credentials Comment
- Add a comment in `js/config.js` clarifying that Supabase anon keys are safe to ship client-side by design (RLS enforced server-side)
- No restructuring needed — this is correct usage per Supabase architecture

---

## Section 2: XSS Audit

- Search all `innerHTML` assignments in `index.html` and `js/*.js`
- For any assignment that uses user-controlled data (exercise names, workout notes, profile name, custom labels, imported data), wrap the value with `_esc()` from `js/storage.js`
- Leave static/hardcoded HTML untouched
- Verify no double-escaping of already-escaped values

---

## Section 3: Adaptive Coaching Phase 1

Per the approved implementation plan: `docs/plans/2026-03-09-retention-results-phase1-implementation-plan.md`

### Task 1: Adaptation Engine Helpers
Add to `index.html` near `renderCoachToday`:
- localStorage key constants: `forge_adaptive_plan`, `forge_plateau_state`, `forge_consistency_state`, `forge_next_win`
- Safe read/write helpers for each key
- Calculator functions:
  - `_calcConsistencyState()` — missed days, momentum state
  - `_detectPlateaus()` — per exercise, 3+ sessions, no progress in 21 days
  - `_buildAdaptivePlan()` — target muscles, exercises, intensity, rationale
  - `_buildNextWin()` — primary + secondary goal with current/target metrics

### Task 2: Coach Today Cards
Add to `renderCoachToday` in `index.html`:
- `adaptCard` — Today Plan + rationale + Start CTA
- `nextWinCard` — primary + secondary next win
- `safetyNetCard` — shown when inactivity >= 2 days, minimum-session CTA
- Insert after greeting/check-in, before body stats

### Task 3: Actions + Persistence
- `_ctodayStartAdaptiveMuscle(muscle)` — starts session for recommended muscle
- `_ctodayStartMinimumSession()` — starts 15-min fallback session
- `_ctodayApplyRescue(exercise)` — applies plateau rescue plan
- Save computed state in `renderCoachToday`
- `postSaveHooks()` triggers card re-render

### Task 4: Verification
- Run `node check_v3.js`
- Run `node smoke_check.js`
- Run `cmd /c run_check.bat`
- Fix any failures and re-run until green

---

## Constraints

- Vanilla JS only — no new dependencies
- All changes in `index.html` (and `serve.js`, `js/config.js`, `icons/icon.svg`)
- Do not change navigation flow or existing card structure
- Beginner-first: one clear CTA per card
- Keep outputs from calculators as plain objects
