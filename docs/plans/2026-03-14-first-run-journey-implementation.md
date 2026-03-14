# First-Run Journey Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the outdated startup onboarding/tour flow and replace it with non-blocking setup prompts inside normal app surfaces.

**Architecture:** Startup no longer launches onboarding or guide overlays. Existing profile/coach state becomes the source of truth for whether setup prompts should render. Legacy tour references are neutralized carefully so no startup hook or translation path breaks.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, existing FORGE local storage/profile helpers, Node-based smoke checks.

---

### Task 1: Audit startup entry points and add coverage notes

**Files:**
- Modify: `docs/plans/2026-03-14-first-run-journey-design.md`
- Inspect: `index.html`
- Inspect: `js/onboarding-controls.js`
- Inspect: `js/i18n.js`
- Inspect: `smoke_check.js`

**Step 1: Confirm startup hooks**

Check where onboarding, guide, or spotlight open automatically.

**Step 2: Record exact hooks in the design doc**

Document the startup functions/conditions that must be removed or neutralized.

**Step 3: Verify no code changes yet**

Run: `git diff -- docs/plans/2026-03-14-first-run-journey-design.md`
Expected: only documentation changes

**Step 4: Commit**

```bash
git add docs/plans/2026-03-14-first-run-journey-design.md
git commit -m "docs: note startup journey removal hooks"
```

### Task 2: Remove onboarding and legacy tour startup behavior

**Files:**
- Modify: `index.html`
- Modify: `js/onboarding-controls.js`
- Modify: `js/i18n.js`
- Test: `smoke_check.js`

**Step 1: Write/update failing smoke assertions**

Add checks ensuring startup no longer auto-opens onboarding/tour overlays and removed IDs/functions are not required at boot.

**Step 2: Run smoke check to confirm current mismatch**

Run: `node smoke_check.js`
Expected: FAIL on old onboarding/tour expectations or missing cleanup assertions

**Step 3: Implement minimal startup cleanup**

- Remove auto-show startup behavior for onboarding/tour/spotlight.
- Delete or neutralize unused first-run triggers.
- Keep harmless no-op compatibility wrappers only where necessary.

**Step 4: Run smoke check**

Run: `node smoke_check.js`
Expected: PASS

**Step 5: Commit**

```bash
git add index.html js/onboarding-controls.js js/i18n.js smoke_check.js
git commit -m "refactor: remove startup onboarding flow"
```

### Task 3: Add Profile setup prompt for missing name/goal

**Files:**
- Modify: `index.html`
- Modify: `js/profile-avatar.js`
- Modify: `css/main.css`
- Inspect: existing profile save helpers in `index.html`

**Step 1: Write/update smoke assertion for profile setup prompt markers**

Ensure the prompt container and save action markers exist.

**Step 2: Run smoke check to verify failure before implementation**

Run: `node smoke_check.js`
Expected: FAIL because prompt markup/logic is missing

**Step 3: Implement minimal prompt**

- Render only when name or goal is missing.
- Allow quick save using existing profile state.
- Hide automatically when setup is complete.

**Step 4: Run smoke check**

Run: `node smoke_check.js`
Expected: PASS

**Step 5: Commit**

```bash
git add index.html js/profile-avatar.js css/main.css smoke_check.js
git commit -m "feat: add progressive profile setup prompt"
```

### Task 4: Add Coach missing-goal fallback prompt

**Files:**
- Modify: `index.html`
- Modify: `js/coach-state.js`
- Modify: `css/main.css`
- Test: `smoke_check.js`

**Step 1: Write/update smoke assertion for Coach fallback prompt**

Add a simple string/marker assertion for the inline missing-goal prompt.

**Step 2: Run smoke check to verify failure before implementation**

Run: `node smoke_check.js`
Expected: FAIL because prompt is not yet present

**Step 3: Implement minimal Coach fallback**

- Render only when Coach needs goal context and goal is missing.
- Do not block the rest of the Coach view.
- Provide a clear setup action.

**Step 4: Run smoke and structural checks**

Run: `node smoke_check.js`
Expected: PASS

Run: `node check_v3.js`
Expected: `Failed: 0`

**Step 5: Commit**

```bash
git add index.html js/coach-state.js css/main.css smoke_check.js
git commit -m "feat: add coach goal fallback prompt"
```

### Task 5: Final verification and release prep

**Files:**
- Modify: `js/config.js`
- Inspect: `index.html`
- Inspect: `js/onboarding-controls.js`
- Inspect: `js/coach-state.js`
- Inspect: `smoke_check.js`

**Step 1: Run full verification**

Run: `node smoke_check.js`
Expected: PASS

Run: `node check_v3.js`
Expected: `Failed: 0`

**Step 2: Bump version/build label**

Update `js/config.js` with the next version and a build note describing first-run journey simplification.

**Step 3: Re-run verification**

Run: `node smoke_check.js`
Expected: PASS

Run: `node check_v3.js`
Expected: `Failed: 0`

**Step 4: Commit**

```bash
git add js/config.js
git commit -m "chore: bump version for first-run cleanup"
```
