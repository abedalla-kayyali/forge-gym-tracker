# Design: Hide Muscle Group in Bodyweight Mode

**Date:** 2026-03-11
**Status:** Approved

## Problem

The Muscle Group section (muscle chips + body map) is always visible regardless of workout mode. In Bodyweight mode the user already selects muscles via the BW exercise picker's built-in filter chips — showing the Muscle Group section is redundant and clutters the journey.

## Goal

- Weighted mode: Muscle Group section visible (current behaviour)
- Bodyweight mode: Muscle Group section hidden, view auto-scrolls to BW exercise picker

## Design

### CSS (`css/main.css`)

Add base transition to `#section-bodymap` and a collapse class:

```css
#section-bodymap {
  transition: max-height .3s ease, opacity .2s ease, margin .3s ease;
}

#section-bodymap.bw-mode-hidden {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-bottom: 0;
  transition: max-height .3s ease, opacity .2s ease, margin .3s ease;
  pointer-events: none;
}
```

Same `max-height` pattern used by the collapsible header (v39).

### JS (`js/bodyweight-mode.js`) — `setWorkoutMode()`

Replace the "Body map: always visible" block:

```js
// Muscle group: weighted only
const bodyMapSection = document.getElementById('section-bodymap');
if (bodyMapSection) {
  bodyMapSection.classList.toggle('bw-mode-hidden', !isWgt);
}

// Auto-scroll to BW picker after fade-out
if (!isWgt) {
  setTimeout(() => {
    const picker = document.getElementById('bw-exercise-picker');
    if (picker) picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 280);
}
```

Remove the now-unused `bodyTapHint` lines from the same block.

## Behaviour

| Action | Result |
|--------|--------|
| Tap BODYWEIGHT | Muscle chips fade+collapse (300ms) → smooth scroll to exercise picker |
| Tap WEIGHTED | Muscle chips fade back in, picker hidden |

## Files Changed

- `css/main.css` — 2 new rules on `#section-bodymap`
- `js/bodyweight-mode.js` — replace body map visibility block in `setWorkoutMode()`
