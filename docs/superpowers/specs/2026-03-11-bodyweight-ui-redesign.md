# Bodyweight Workout UI Redesign

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Full redesign of bodyweight mode — skill tree picker + session logging UI

---

## Overview

Replace the existing bodyweight workout UI (horizontal scroll cali-tree nodes + plain dropdown effort select) with two upgraded sections: a vertical RPG-style skill tree and an arcade-style session logging zone.

---

## Section 1: Skill Tree (Vertical RPG Path)

### Muscle Filter Chips
- Row of chips at the top: All, Chest, Back, Core, Legs, Arms
- Replaces the existing "(all)" / "(filter)" text buttons
- Active chip highlighted in green

### Tree Groups
- Each calisthenics tree (Push-Up, Pull-Up, Dip, etc.) shown as a labelled section with icon + tree name
- Section label: icon + tree name in monospace uppercase

### RPG Nodes (vertical list)
Each exercise in a tree is a node with one of four states:

| State | Style |
|-------|-------|
| **done** | Green border, faint green bg, progress bar 100%, ✅ badge |
| **current** | Neon green border, glow, progress bar at actual %, 🎯 badge |
| **next-up** | Dashed border, dim bg, shows unlock requirement text |
| **locked** | 40% opacity, no interaction |

- Nodes connected by a 2px vertical line (green between done→current, dim elsewhere)
- Progress bar shows `bestReps / targetReps` percentage
- Label: `Best: X reps · Y% to unlock (need Z)`
- Tapping a node (done or current) selects it and opens the arcade session below

---

## Section 2: Arcade Session Zone

Shown below the tree when an exercise is selected. Styled with neon green border + glow.

### Header
- Exercise name in large Impact font, neon green
- Subtitle: `LVL X · TARGET Y REPS TO UNLOCK [NEXT EXERCISE]`

### Progress Ring + Set Dots
- Left: SVG progress ring (green gradient) showing `bestReps / targetReps %` toward unlock
- Right: Set dot timeline
  - Filled green dot = completed set (shows reps + effort label)
  - Pulsing glow dot = current active set
  - Dashed circle = "+ add set" tap target

### Reps Stepper
- `−` button | large reps number | `+` button
- Unit label (reps / secs for holds)
- "↩ Ditto" button copies previous set value

### Effort Buttons
- 4 large tap buttons in a grid: Easy 😌 / Med 😤 / Hard 🔥 / Fail 💀
- Color-coded: green / orange / red / purple
- Replaces the `<select>` dropdown

### Log Set Button
- Full-width green gradient button: "⚡ LOG SET"
- Logs the current set (reps + effort) and advances the dot timeline

---

## Files to Change

| File | Changes |
|------|---------|
| `js/bodyweight-mode.js` | Rewrite `renderBwExercisePicker()`, `addBwSet()`, `renderBwStats()` |
| `css/main.css` | Add RPG node styles, arcade zone styles, replace `.bw-set-row` + `.bw-effort` |
| `index.html` | Update BW section HTML structure |

---

## Out of Scope
- Weighted workout mode (unchanged)
- Dashboard / history analytics (unchanged)
- Skill unlock overlay animation (already exists, keep as-is)
