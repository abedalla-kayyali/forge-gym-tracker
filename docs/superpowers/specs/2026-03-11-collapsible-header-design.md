# Collapsible Header & Mission Banner — Design Spec
**Date:** 2026-03-11
**Status:** Approved

## Problem

The app header is very tall on mobile (~160px+), containing: logo row, XP bar, mascot strip, status bar (streak/water/steps), and coach ticker. The Mission Banner adds another sticky row below it. By the time the user sees "START SESSION" they've already scrolled past a wall of chrome. Gym users need screen space for workout logging.

## Goal

Collapse the header and mission banner by default. Always show a slim ~40px strip at the top. Full header reveals on tap.

## Design

### Slim Strip (always visible)
- Height: ~40px
- **Left side:**
  - Idle state: `FORGE // Gym OS` (small text, matches existing logo style)
  - Active session: `● 00:45` (green pulse dot + live timer from `#sh-timer-big`)
- **Right side:** `▾` chevron button (44×44px tap target)
- Background: `var(--bg)`, border-bottom: `1px solid var(--border2)`

### Collapsible Zone
- Wraps all header content below the top logo row:
  - XP bar (`div.xp-bar-wrap`)
  - Mascot strip (`div.mascot-strip`)
  - Status bar (`div.hdr-status-bar`)
  - Coach ticker (`div.hdr-coach-ticker`)
- Also wraps `#mission-banner` (moved inside collapsible zone — no longer a separate sticky element)
- CSS: `max-height: 0; overflow: hidden` by default
- Expanded: `max-height: 600px` via `.header-expanded` class on `<header>`
- Transition: `max-height 0.3s ease`

### Chevron
- Default: points down `▾`
- Expanded: rotates 180° (points up)
- Toggle: one `onclick` adds/removes `.header-expanded` on `<header>`

### Session State Sync
- On `startWorkoutSession()`: update slim strip timer text
- On `endWorkoutSession()`: reset slim strip to idle state
- Timer in slim strip reads from existing `#session-time` value (or mirrors it)

## Implementation Scope

### Files to change
1. **`index.html`**
   - Restructure `<header>` to separate slim strip from collapsible zone
   - Move `#mission-banner` inside the collapsible zone
2. **`css/main.css`**
   - Add `.header-slim-strip` styles
   - Add `.header-collapse-zone` styles (max-height transition)
   - Add `header.header-expanded .header-collapse-zone` expanded state
   - Add chevron rotation rule
3. **`js/auth-ui.js`** (or inline script)
   - `toggleHeader()` function — toggles `.header-expanded`
   - `syncHeaderSessionState()` — updates slim strip timer/idle text, called from `startWorkoutSession` / `endWorkoutSession` / session tick

## Out of Scope
- No changes to header content (XP, mascot, missions remain unchanged)
- No swipe gesture (deliberate tap preferred for gym use)
- No changes to bottom nav or view layout
