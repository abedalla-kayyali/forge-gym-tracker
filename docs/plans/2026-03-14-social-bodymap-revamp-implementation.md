# Social Body Map Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Social `Compare > Body` into a forged sci-fi anatomy board with stronger rivalry presentation and a better inspect experience.

**Architecture:** Keep the current compare snapshot data and rebuild only the `Compare > Body` presentation in `js/social-ui.js` and `css/main.css`. Upgrade the body map SVG, rivalry header, spotlight chips, and inspect sheet without changing the backend contract.

**Tech Stack:** Vanilla JS, HTML, CSS, inline SVG, existing Social compare state and modal infrastructure.

---

### Task 1: Add failing checks for body-map revamp hooks

**Files:**
- Modify: `smoke_check.js`

**Step 1: Add failing checks**

Assert presence of:
- rivalry header hook
- spotlight rail hook
- anatomy board markup hook

**Step 2: Run smoke check**

Run:
```bash
node smoke_check.js
```

Expected:
- FAIL with missing revamp hooks

### Task 2: Rebuild the body compare SVG renderer

**Files:**
- Modify: `js/social-ui.js`

**Step 1: Replace old body zone rectangles**

Implement stylized anatomy plates for:
- chest
- shoulders
- biceps / triceps / forearms
- core
- back / lower back
- glutes
- legs
- calves

**Step 2: Preserve click targets**

Each zone must still carry:
- `data-muscle`

**Step 3: Implement stateful rendering**

Map compare data to:
- fill intensity
- border glow
- dominant styling

### Task 3: Add rivalry header and spotlight rail

**Files:**
- Modify: `js/social-ui.js`
- Modify: `css/main.css`

**Step 1: Add rivalry header**

Render:
- title
- contested muscle
- coaching line

**Step 2: Add spotlight rail**

Render quick chips for:
- strongest lead
- weakest lane
- heaviest plate
- most recent plate

**Step 3: Make spotlight chips interactive**

Clicking a chip opens the corresponding muscle inspect modal.

### Task 4: Upgrade body compare styling

**Files:**
- Modify: `css/main.css`

**Step 1: Add forged anatomy board styles**

Create styling for:
- chassis frame
- neon glow
- spotlight chips
- rivalry header

**Step 2: Improve mobile layout**

Ensure:
- boards stack cleanly
- chips remain readable
- no clipping in modal

### Task 5: Upgrade inspect sheet styling

**Files:**
- Modify: `index.html`
- Modify: `css/main.css`
- Modify: `js/social-ui.js`

**Step 1: Improve inspect modal content structure**

Keep the same data, but render:
- stronger section headings
- lead badge
- clearer stat blocks

**Step 2: Verify the modal still opens from map taps**

### Task 6: Verify and release

**Files:**
- Modify: `js/config.js`

**Step 1: Run checks**

Run:
```bash
node smoke_check.js
node check_v3.js
```

Expected:
- both pass

**Step 2: Live browser verification**

Verify:
- body compare renders
- spotlight chips render
- muscle modal opens from body map
- cardio/bodyweight compare still work

**Step 3: Bump version and commit**

```bash
git add js/social-ui.js css/main.css index.html smoke_check.js js/config.js docs/plans/2026-03-14-social-bodymap-revamp-design.md docs/plans/2026-03-14-social-bodymap-revamp-implementation.md
git commit -m "feat: revamp social body compare"
```
