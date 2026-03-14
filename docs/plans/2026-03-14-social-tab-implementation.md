# Social Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a first-class `Social` tab for friends, compare, duels, and in-app social feedback using the existing duel backend and public profile snapshots.

**Architecture:** Replace the current modal-first duel UX with a dedicated bottom-nav destination that renders four subviews (`Hub`, `Friends`, `Compare`, `Duels`). Reuse the repaired `js/duels.js` data logic, extend public social snapshots, and layer new UI, notifications, and sound/haptic feedback on top without introducing a backend rewrite.

**Tech Stack:** Vanilla JS, existing FORGE HTML/CSS architecture, Supabase client, localStorage cache, existing `fx-sound.js` / `fx-haptic.js` hooks.

---

### Task 1: Map the current social surface and add failing structural checks

**Files:**
- Modify: `smoke_check.js`
- Inspect: `index.html`
- Inspect: `js/duels.js`
- Inspect: `css/main.css`

**Step 1: Write the failing structural checks**

Add checks for planned anchors/snippets:
- `id="social-view"`
- `id="social-tab-hub"`
- `id="social-tab-friends"`
- `id="social-tab-compare"`
- `id="social-tab-duels"`
- `window.FORGE_SOCIAL`

**Step 2: Run check to verify it fails**

Run: `node smoke_check.js`
Expected: FAIL because social tab markup/module does not exist yet.

**Step 3: Commit the failing-test checkpoint**

```bash
git add smoke_check.js
git commit -m "test: require social tab structure"
```

### Task 2: Add bottom-nav entry and Social view shell

**Files:**
- Modify: `index.html`
- Modify: `css/main.css`
- Test: `smoke_check.js`

**Step 1: Add the new bottom navigation item**

Add a new bottom-nav icon/button for `Social` next to the existing primary destinations. Ensure it follows the existing nav button structure.

**Step 2: Add the Social view shell**

Create a top-level view container with:
- hero/header region
- segmented sub-tab bar
- content mounts for `Hub`, `Friends`, `Compare`, `Duels`

**Step 3: Add minimal CSS for layout**

Implement mobile-safe layout, sticky sub-tab rail, spacing, and empty-state scaffolding.

**Step 4: Update smoke checks**

Confirm the new Social shell snippets exist.

**Step 5: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 6: Commit**

```bash
git add index.html css/main.css smoke_check.js
git commit -m "feat: add social tab shell"
```

### Task 3: Create Social controller module

**Files:**
- Create: `js/social-ui.js`
- Modify: `index.html`
- Test: `smoke_check.js`

**Step 1: Write the failing structural check**

Add a smoke check for:
- `<script src="js/social-ui.js"></script>`
- `window.FORGE_SOCIAL`

**Step 2: Create the module skeleton**

Implement:
- `window.FORGE_SOCIAL.init()`
- `window.FORGE_SOCIAL.open(tab)`
- `window.FORGE_SOCIAL.refresh()`
- internal state for current sub-tab and selected friend

**Step 3: Wire script include and boot**

Load the script in `index.html` and initialize it safely after app boot.

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/social-ui.js index.html smoke_check.js
git commit -m "feat: add social tab controller"
```

### Task 4: Move friend discovery UI into Social > Friends

**Files:**
- Modify: `js/duels.js`
- Modify: `js/social-ui.js`
- Modify: `index.html`
- Modify: `css/main.css`
- Test: `smoke_check.js`

**Step 1: Extract/reuse friend search rendering hooks**

Make the current duel friend search usable from a dedicated Social surface instead of only the modal.

**Step 2: Build the Friends subview**

Render:
- search input
- search button
- QR/code actions
- list of existing friends
- add/remove actions

**Step 3: Keep the modal path backward compatible**

Do not break current modal helper paths while moving the UX center to Social.

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/duels.js js/social-ui.js index.html css/main.css smoke_check.js
git commit -m "feat: add social friends surface"
```

### Task 5: Add Compare subview and public snapshot cards

**Files:**
- Modify: `js/duels.js`
- Modify: `js/social-ui.js`
- Modify: `css/main.css`
- Test: `smoke_check.js`

**Step 1: Define compare snapshot shape**

Use current public data and add safe reads for:
- workouts
- cardio
- streak
- readiness
- balance
- last active
- strongest area

**Step 2: Render Compare UI**

Create friend selector + side-by-side stat cards.

**Step 3: Add lead/trail summary copy**

Examples:
- `You lead in weekly sessions`
- `Catch up in cardio this week`

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/duels.js js/social-ui.js css/main.css smoke_check.js
git commit -m "feat: add social compare view"
```

### Task 6: Build Social Hub and invite rail

**Files:**
- Modify: `js/social-ui.js`
- Modify: `js/duels.js`
- Modify: `css/main.css`

**Step 1: Render active duel card in Social Hub**

Show:
- opponent
- progress bars
- lead state
- time left
- quick actions

**Step 2: Render pending invites rail**

Cards with accept/decline actions.

**Step 3: Add quick action row**

Buttons:
- `Add Friend`
- `Share Code`
- `Scan QR`
- `Start Duel`

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/social-ui.js js/duels.js css/main.css
git commit -m "feat: add social hub and invites"
```

### Task 7: Build Duels subview with cleaner creation flow

**Files:**
- Modify: `js/social-ui.js`
- Modify: `js/duels.js`
- Modify: `css/main.css`

**Step 1: Add duel creation sheet or inline form**

Allow friend selection and duel type selection:
- workouts
- cardio
- muscle

**Step 2: Add duel history block**

Render completed/declined/cancelled duels cleanly.

**Step 3: Ensure actions reuse existing duel logic**

Avoid duplicating backend sync logic.

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/social-ui.js js/duels.js css/main.css
git commit -m "feat: add social duels view"
```

### Task 8: Add in-app social notifications

**Files:**
- Modify: `js/social-ui.js`
- Modify: `js/duels.js`
- Modify: `css/main.css`
- Inspect: existing toast logic in `index.html` / shared helpers

**Step 1: Define notification types**

Support:
- invite received
- duel accepted
- duel progress update
- duel completed
- friend added

**Step 2: Add notification renderer**

Use lightweight in-app banners/toasts, not OS push.

**Step 3: Trigger notifications from duel state transitions**

Compare previous state vs refreshed state and emit only meaningful changes.

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/social-ui.js js/duels.js css/main.css
git commit -m "feat: add in-app social notifications"
```

### Task 9: Add social sound and haptic feedback

**Files:**
- Modify: `js/fx-sound.js`
- Modify: `js/fx-haptic.js`
- Modify: `js/social-ui.js`
- Modify: `js/duels.js`
- Test: `smoke_check.js`

**Step 1: Add dedicated social FX helpers**

Examples:
- `sndSocialInvite()`
- `sndSocialAccept()`
- `sndSocialLead()`
- `sndSocialWin()`
- matching haptics

**Step 2: Trigger them at the right moments**

Only on high-value actions or status changes.

**Step 3: Respect settings gates**

Do not bypass current sound/haptic toggles.

**Step 4: Add smoke checks for new helpers**

**Step 5: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 6: Commit**

```bash
git add js/fx-sound.js js/fx-haptic.js js/social-ui.js js/duels.js smoke_check.js
git commit -m "feat: add social sound and haptics"
```

### Task 10: Extend public social snapshot fields

**Files:**
- Modify: `js/duels.js`
- Inspect: any profile/rank/xp/readiness helpers used elsewhere
- Test: `smoke_check.js`

**Step 1: Add safe field collection to public publish payload**

Populate where available:
- rank
- xp
- streak
- readiness
- balanceScore
- lastActiveAt
- strongestArea

**Step 2: Keep publish backward compatible**

Do not break current `profiles_public` rows if some fields are missing.

**Step 3: Use the new fields in compare/friend cards**

**Step 4: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 5: Commit**

```bash
git add js/duels.js smoke_check.js
 git commit -m "feat: enrich public social snapshots"
```

### Task 11: Remove or minimize old Coach social card

**Files:**
- Modify: `js/duels.js`
- Modify: `js/coach-state.js` or relevant Coach host rendering if needed
- Modify: `css/main.css`

**Step 1: Reduce Coach social surface**

Keep only a compact pointer or insight, not the full duel center.

**Step 2: Ensure primary social actions now point to the Social tab**

**Step 3: Run verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`

Expected: PASS

**Step 4: Commit**

```bash
git add js/duels.js js/coach-state.js css/main.css
 git commit -m "refactor: move social primary UX out of coach"
```

### Task 12: End-to-end browser verification with real accounts

**Files:**
- Reuse temp Playwright script in `%TEMP%`
- Optionally update script for Social tab selectors

**Step 1: Verify social search/add flow**

Use the real-account test flow and confirm:
- search returns friend
- add persists
- remove works

**Step 2: Verify compare view renders**

Check side-by-side stats for both accounts.

**Step 3: Verify duel creation/accept flow**

Create a duel from one account and accept from the other.

**Step 4: Verify notification/FX triggers**

At minimum verify DOM notifications. Sound/haptics may need manual phone confirmation.

**Step 5: Commit if script adjustments were needed**

```bash
git add <updated test helper if tracked>
git commit -m "test: verify social flow end to end"
```

### Task 13: Release prep

**Files:**
- Modify: `js/config.js`
- Review: `git status`

**Step 1: Bump version/build**

Update `FORGE_VERSION` and `FORGE_BUILD` for the social release.

**Step 2: Run final verification**

Run:
- `node smoke_check.js`
- `node check_v3.js`
- real-browser social test

**Step 3: Commit**

```bash
git add js/config.js
 git commit -m "chore: bump version for social tab release"
```

**Step 4: Push**

```bash
git push origin master
```
