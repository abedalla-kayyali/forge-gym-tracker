# BW Muscle Group Hide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the Muscle Group section when Bodyweight mode is active and auto-scroll to the BW exercise picker.

**Architecture:** CSS `max-height`/`opacity` transition class toggled by `setWorkoutMode()` in `bodyweight-mode.js`. Same pattern as the collapsible header (v39). Auto-scroll fires 280ms after mode switch to land after the CSS fade-out completes.

**Tech Stack:** Vanilla JS, CSS transitions, no build step.

---

## Chunk 1: CSS collapse class

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1: Add base transition + collapse class to `#section-bodymap`**

Find the end of the existing `#section-bodymap` rule (or add after the last `.mission-banner` rule). Append:

```css
/* Muscle group: hidden in BW mode */
#section-bodymap {
  transition: max-height .3s ease, opacity .2s ease, margin .3s ease;
}
#section-bodymap.bw-mode-hidden {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-bottom: 0;
  pointer-events: none;
  transition: max-height .3s ease, opacity .2s ease, margin .3s ease;
}
```

- [ ] **Step 2: Verify smoke check passes**

```bash
node smoke_check.js
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "style: add bw-mode-hidden collapse class for section-bodymap"
```

---

## Chunk 2: JS mode switch

**Files:**
- Modify: `js/bodyweight-mode.js` lines 24–28

- [ ] **Step 1: Replace the "Body map: always visible" block**

Current code in `setWorkoutMode()` (lines 24–28):
```js
  // Body map: always visible
  const bodyMapSection = document.getElementById('section-bodymap');
  const bodyTapHint = document.getElementById('body-tap-hint-el');
  if (bodyMapSection) bodyMapSection.style.display = '';
  if (bodyTapHint) bodyTapHint.style.display = '';
```

Replace with:
```js
  // Muscle group: weighted only
  const bodyMapSection = document.getElementById('section-bodymap');
  if (bodyMapSection) bodyMapSection.classList.toggle('bw-mode-hidden', !isWgt);

  // Auto-scroll to BW picker after fade-out completes
  if (!isWgt) {
    setTimeout(() => {
      const picker = document.getElementById('bw-exercise-picker');
      if (picker) picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 280);
  }
```

- [ ] **Step 2: Verify smoke check passes**

```bash
node smoke_check.js
```
Expected: no errors.

- [ ] **Step 3: Start dev server and verify manually**

```bash
# server should already be running on port 8766
```

Open app → tap **BODYWEIGHT**:
- Muscle Group section fades + collapses
- View smoothly scrolls to exercise picker

Tap **WEIGHTED**:
- Muscle Group section fades back in
- No auto-scroll

- [ ] **Step 4: Commit**

```bash
git add js/bodyweight-mode.js
git commit -m "feat: hide muscle group section in BW mode, auto-scroll to exercise picker"
```

---

## Chunk 3: Push + version bump

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1: Bump cache version**

In `js/config.js`:
```js
window.FORGE_VERSION = 'v40';
window.FORGE_BUILD   = '2026-03-11 (cache forge-v40)';
```

In `sw.js`:
```js
const CACHE_NAME = 'forge-v40';
```

- [ ] **Step 2: Commit and push**

```bash
git add js/config.js sw.js
git commit -m "chore: bump version to v40"
git push origin master
```
