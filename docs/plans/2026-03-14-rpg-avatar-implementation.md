# Dynamic RPG Visual Avatars Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a profile avatar system that combines existing rank progression with muscle-balance-derived armor slots.

**Architecture:** Add a small avatar pipeline that derives a pure `avatarState` object from existing XP rank data and a new exported regional-balance summary. Render that state into a layered SVG card in the profile area, keeping derivation, rendering, translations, and styling isolated so the feature can evolve without entangling dashboard logic.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, existing i18n system, existing XP and balance modules.

---

### Task 1: Map the current balance and profile integration points

**Files:**
- Modify: `docs/plans/2026-03-14-rpg-avatar-implementation.md`
- Inspect: `js/dashboard-balance.js`
- Inspect: `js/xp-system.js`
- Inspect: `index.html`

**Step 1: Document the current sources**

Record:
- Where the profile avatar currently renders
- Which function provides current rank data
- Which function currently computes or renders muscle balance

**Step 2: Verify the balance module can expose data without DOM scraping**

Run a code review on `js/dashboard-balance.js` and identify whether a pure regional summary helper already exists.

Expected:
- Either a reusable balance function exists
- Or a new helper must be added without changing current UI behavior

**Step 3: Commit**

```bash
git add docs/plans/2026-03-14-rpg-avatar-implementation.md
git commit -m "docs: annotate avatar integration points"
```

### Task 2: Add failing tests or a minimal verification harness for avatar derivation

**Files:**
- Create: `js/profile-avatar.js`
- Create: `docs/plans/avatar-state-cases.md`
- Inspect: existing test setup, if any

**Step 1: Decide verification strategy**

If there is no test runner, create a small documented verification matrix in `docs/plans/avatar-state-cases.md` with concrete input and expected slot outputs.

Include cases for:
- No training data
- Balanced beginner
- Strong legs, weak upper body
- Strong upper body, skipped legs
- High rank with weak balance

**Step 2: Write the failing derivation interface**

Define the intended public functions in `js/profile-avatar.js`:

```js
window.buildProfileAvatarState = function buildProfileAvatarState(rankData, balanceData) {
  throw new Error('not implemented');
};

window.renderProfileAvatarCard = function renderProfileAvatarCard() {
  throw new Error('not implemented');
};
```

**Step 3: Run manual verification**

Load the app and confirm the new module fails only at the declared not-implemented boundary.

Expected:
- No unrelated runtime errors
- Clear failure location for the avatar feature only

**Step 4: Commit**

```bash
git add js/profile-avatar.js docs/plans/avatar-state-cases.md
git commit -m "test: define avatar state contract"
```

### Task 3: Export a pure regional balance summary

**Files:**
- Modify: `js/dashboard-balance.js`

**Step 1: Write the pure helper**

Add an exported function that returns normalized region scores:

```js
window.getBalanceRegionSummary = function getBalanceRegionSummary() {
  return {
    chest: 0,
    back: 0,
    shoulders: 0,
    arms: 0,
    core: 0,
    legs: 0,
    posterior: 0
  };
};
```

**Step 2: Reuse existing balance logic**

Derive the summary from the same underlying workout data used by the balance UI. Do not parse HTML and do not duplicate unrelated presentation logic.

**Step 3: Verify no regression**

Run the app and confirm the current muscle balance panel still renders exactly as before.

Expected:
- Existing balance UI still works
- `window.getBalanceRegionSummary()` returns data in the console

**Step 4: Commit**

```bash
git add js/dashboard-balance.js
git commit -m "feat: expose balance region summary"
```

### Task 4: Build the avatar state derivation

**Files:**
- Modify: `js/profile-avatar.js`
- Inspect: `js/xp-system.js`

**Step 1: Read rank data from existing XP logic**

Use existing rank helpers instead of duplicating thresholds.

Extract:
- rank name
- rank icon if useful
- rank theme tier

**Step 2: Map region scores to gear slots**

Implement deterministic thresholds such as:

```js
function slotTier(score) {
  if (score >= 0.85) return 'mythic';
  if (score >= 0.65) return 'elite';
  if (score >= 0.4) return 'basic';
  return 'none';
}
```

**Step 3: Build the insight generator**

Generate a single short message from the strongest positive or weakest missing slot.

Examples:
- `Balanced lower body: Titan Greaves equipped`
- `Leg day is lagging. Greaves locked`

**Step 4: Verify with the case matrix**

Check the output against `docs/plans/avatar-state-cases.md`.

Expected:
- Each scenario maps to predictable slots and message output

**Step 5: Commit**

```bash
git add js/profile-avatar.js
git commit -m "feat: derive avatar state from rank and balance"
```

### Task 5: Add the profile avatar card markup

**Files:**
- Modify: `index.html`

**Step 1: Add the card container**

Insert a dedicated avatar card near the top of the profile panel with:
- Title
- Subtitle or insight line
- SVG mount point
- Optional small chip for rank theme

**Step 2: Use stable IDs**

Add IDs such as:
- `profile-avatar-card`
- `profile-avatar-stage`
- `profile-avatar-insight`
- `profile-avatar-theme-badge`

**Step 3: Verify layout stability**

Load the More/Profile view and confirm the new card does not break the existing field layout on mobile.

Expected:
- Card appears before profile fields
- No overlap, clipping, or horizontal scroll

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add profile avatar card shell"
```

### Task 6: Render the layered SVG avatar

**Files:**
- Modify: `js/profile-avatar.js`

**Step 1: Write the base SVG renderer**

Render a complete silhouette even when all balance slots are `none`.

**Step 2: Add gear layers**

Render slot-specific layers for:
- shoulders
- back
- torso
- arms
- legs

Use class-based theming so the same SVG structure can support multiple rank themes.

**Step 3: Keep the art maintainable**

Prefer simple geometric shapes and named layer groups over large opaque path blobs.

**Step 4: Verify visual states**

Manually verify:
- no data
- balanced athlete
- leg-dominant athlete
- upper-body dominant athlete

Expected:
- Distinct visual differences
- No malformed rendering

**Step 5: Commit**

```bash
git add js/profile-avatar.js
git commit -m "feat: render layered profile avatar"
```

### Task 7: Style the avatar card for mobile and desktop

**Files:**
- Modify: `index.html`
- Modify: existing CSS location used by the app

**Step 1: Add card styles**

Style the avatar as a premium RPG profile card that still matches the current app language.

Include:
- clear stage framing
- readable insight text
- compact mobile spacing
- theme-driven accents

**Step 2: Add slot and theme classes**

Use CSS classes for:
- rank tier
- gear rarity
- RTL support

**Step 3: Verify responsiveness**

Check the More/Profile screen at mobile width and desktop width.

Expected:
- No cropped avatar
- No text collision in Arabic

**Step 4: Commit**

```bash
git add index.html
git commit -m "style: add RPG avatar profile card styles"
```

### Task 8: Wire avatar refresh into existing profile lifecycle

**Files:**
- Modify: `index.html`
- Modify: `js/profile-avatar.js`
- Inspect: any existing `renderProfile()` logic

**Step 1: Hook into profile rendering**

Call `renderProfileAvatarCard()` from the existing profile render path.

**Step 2: Refresh on training changes**

Ensure the avatar updates after workout saves or dashboard refreshes where balance data changes.

**Step 3: Avoid duplicated work**

Do not trigger excessive rerenders. Keep the hook inside existing render flows.

**Step 4: Verify lifecycle**

Expected:
- Avatar updates after new training data
- Avatar updates after language switch
- Avatar still renders after login refresh

**Step 5: Commit**

```bash
git add index.html js/profile-avatar.js
git commit -m "feat: wire profile avatar into render lifecycle"
```

### Task 9: Add translations for avatar labels and insight text

**Files:**
- Modify: `js/i18n.js`
- Modify: `js/profile-avatar.js`

**Step 1: Add translation keys**

Add keys for:
- avatar title
- avatar subtitle
- rank theme labels
- gear unlock names
- missing-slot messages

**Step 2: Remove hard-coded English from the renderer**

Every visible label or message must use the translation system.

**Step 3: Verify English and Arabic**

Expected:
- No encoded characters
- RTL layout still reads cleanly

**Step 4: Commit**

```bash
git add js/i18n.js js/profile-avatar.js
git commit -m "feat: translate profile avatar system"
```

### Task 10: Run final regression verification

**Files:**
- Inspect: `index.html`
- Inspect: `js/dashboard-balance.js`
- Inspect: `js/profile-avatar.js`
- Inspect: `js/i18n.js`

**Step 1: Verify profile**

Check:
- Profile loads
- Avatar renders
- Existing profile fields still save

**Step 2: Verify balance**

Check:
- Muscle balance panel still works
- No console errors from new helper export

**Step 3: Verify localization**

Check:
- English renders correctly
- Arabic renders correctly
- No broken symbols

**Step 4: Verify persistence**

Check:
- Refresh page
- Log out and back in
- Ensure avatar rebuilds from stored data

**Step 5: Commit**

```bash
git add index.html js/dashboard-balance.js js/profile-avatar.js js/i18n.js
git commit -m "feat: add dynamic RPG profile avatars"
```

### Task 11: Add avatar interaction feedback

**Files:**
- Modify: `js/profile-avatar.js`
- Modify: `css/main.css`
- Inspect: `js/fx-sound.js`

**Step 1: Add slot interaction states**

Each slot card in the avatar modal should support:
- tap highlight
- temporary pulse class
- stronger visual emphasis for `elite` and `mythic`

**Step 2: Reuse existing sound controls**

Add avatar-specific sound helpers by extending the current FX sound layer or by using existing milestone-like cues.

Required events:
- modal open
- slot tap
- new upgrade event

**Step 3: Track last known avatar state**

Persist or cache the last rendered slot tiers so the system can detect when a slot tier has improved after training.

**Step 4: Verify**

Expected:
- slot tap gives visible feedback
- sounds respect the user sound toggle
- newly upgraded slots trigger stronger celebration only once

**Step 5: Commit**

```bash
git add js/profile-avatar.js css/main.css js/fx-sound.js
git commit -m "feat: add avatar interaction feedback"
```

### Task 12: Add avatar share sheet with dual poster modes

**Files:**
- Modify: `index.html`
- Modify: `js/profile-avatar.js`
- Modify: `css/main.css`

**Step 1: Add share modal markup**

Add a dedicated avatar share bottom sheet with:
- poster mode toggle
- preview mount
- download action
- native share action

**Step 2: Support two poster modes**

Render:
- `showcase`
- `proof`

The selected mode must update the on-screen preview immediately.

**Step 3: Use real name by default**

Read the profile name from existing profile data and include it in both poster modes.

**Step 4: Verify**

Expected:
- modal opens from the avatar gear sheet
- mode toggle switches preview
- real name appears correctly

**Step 5: Commit**

```bash
git add index.html js/profile-avatar.js css/main.css
git commit -m "feat: add avatar share sheet"
```

### Task 13: Render share poster and export exact preview match

**Files:**
- Modify: `js/profile-avatar.js`
- Inspect: existing share/export helpers

**Step 1: Build poster renderer**

Use a single render pipeline for:
- preview
- download
- native share

Do not create separate visual logic for preview and export.

**Step 2: Implement poster content**

`showcase` mode includes:
- large forged muscle-map silhouette
- name
- rank
- theme
- highlighted forged regions
- small RPG identity chip
- short social line

`proof` mode includes:
- forged muscle-map silhouette
- balance percent
- strongest region
- weakest region
- slot tier summary
- date stamp

**Step 3: Wire actions**

Add:
- download image
- native share image

**Step 4: Verify**

Expected:
- exported image matches preview
- mobile share path still works
- no broken layout in either mode

**Step 5: Commit**

```bash
git add js/profile-avatar.js
git commit -m "feat: render shareable avatar posters"
```

### Task 13B: Add forged muscle-map progression renderer for sharing

**Files:**
- Modify: `js/profile-avatar.js`
- Inspect: current body-map / muscle overlay SVG sources
- Modify: `css/main.css` if preview styling needs support

**Step 1: Define progression tiers**

Implement share-side region tiers:
- cold iron
- bronze
- molten
- forge energy
- radiant plasma

These tiers should derive from real muscle totals, not static rank.

**Step 2: Render a dedicated forged silhouette**

Build a share-safe SVG body silhouette with region fills and glow logic.

The output must work as:
- in-app preview
- exported image source

**Step 3: Add inactivity/degradation cues**

Where data exists, support dimmed or reduced-intensity styling for neglected regions.

**Step 4: Compose with RPG identity chip**

Add a smaller RPG avatar/rank chip on the poster, but keep the forged silhouette as the main hero.

**Step 5: Verify**

Expected:
- forged body is the dominant poster visual
- tier progression is obvious
- exported poster still matches preview

**Step 6: Commit**

```bash
git add js/profile-avatar.js css/main.css
git commit -m "feat: add forged muscle-map poster renderer"
```

### Task 14: Final avatar-phase verification

**Files:**
- Inspect: `js/profile-avatar.js`
- Inspect: `css/main.css`
- Inspect: `index.html`
- Inspect: `js/fx-sound.js`

**Step 1: Verify interaction**

Check:
- avatar card opens modal
- slot taps animate
- modal open sound works

**Step 2: Verify upgrade feedback**

Check:
- improved slot tier triggers one-time stronger feedback
- no repeated celebration on every render

**Step 3: Verify sharing**

Check:
- showcase poster renders
- proof poster renders
- download/share actions work
- preview matches export

**Step 4: Verify localization and mobile**

Check:
- English and Arabic labels still fit
- bottom sheets remain usable on phone width

**Step 5: Commit**

```bash
git add index.html js/profile-avatar.js css/main.css js/fx-sound.js
git commit -m "feat: add interactive and shareable avatar system"
```
