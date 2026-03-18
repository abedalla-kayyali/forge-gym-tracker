# Design Spec: Progress Photo Comparison

**Date:** 2026-03-18
**Feature:** Before/After photo comparison overlay for the Body tab
**Status:** Approved by user

---

## Goal

Let users compare any two progress photos side-by-side or with a swipe slider, with automatic weight and BF% delta stats pulled from existing data.

---

## Architecture

### New files
- `js/photo-compare.js` — self-contained IIFE, exposes `window.openPhotoCompare()`

### Modified files
- `index.html` — add `<div id="photo-compare-overlay">` + "Compare" button in photo gallery header + `<script>` tag
- `css/main.css` — comparison overlay styles

### No new storage keys, no new edge functions
Reads from existing:
- `forge-photos-v1` IndexedDB (photos)
- `forge_bodyweight` localStorage (weight entries)
- `forge_inbody_tests` localStorage (BF% entries)

---

## UI

### Overlay layout
```
┌─────────────────────────────────────┐
│  ✕          COMPARE          [≡|◫]  │  ← close + mode toggle
├──────────────┬──────────────────────┤
│  BEFORE      │  AFTER               │
│  [photo]     │  [photo]             │  ← tap either to swap
│  Mar 1       │  Mar 18              │
│  78kg · 22%  │  75kg · 19%         │
├──────────────┴──────────────────────┤
│  📅 17 days  ⚖ -3kg  🔥 -3% BF    │  ← delta bar
└─────────────────────────────────────┘
```

### Mode toggle
- **Side-by-side** (default): two `<img>` elements each taking 50% width, `object-fit: cover`
- **Slider**: After photo sits on top with `clip-path: inset(0 X% 0 0)` where X is controlled by drag position. Draggable vertical divider line.
  - `mousemove` / `touchmove` listeners registered with `{ passive: false }` so `e.preventDefault()` can block page scroll on mobile without throwing a passive-listener console error.

### Photo picker
Tapping a Before/After slot enters "pick mode": gallery thumbnails shown in a scrollable grid below the comparison. Tapping a thumbnail replaces that slot and exits pick mode. Tapping outside the thumbnail grid (or tapping a "✕ Cancel" button shown at the top of the picker) exits pick mode without changing the selection.

---

## Default photo selection

- **Before**: oldest photo by `id` (timestamp) in `forge-photos-v1`
- **After**: latest photo by `id`
- Auto-selected on open; user can swap either slot

---

## Stats logic

For each selected photo, find the nearest data point within ±7 days:

| Stat | Source | Display |
|------|---------|---------|
| Weight | `forge_bodyweight` entry nearest photo date | `75 kg` |
| BF% | `forge_inbody_tests` entry nearest photo date | `19%` |

**`forge_bodyweight` shape** (array in localStorage):
```js
[{ date: "2026-03-18T...", weight: 75.5, unit: "kg", bodyFat: 19.2, muscleMass: 36 }, ...]
```
Nearest-date lookup: `Math.abs(new Date(entry.date) - photoDate)` → pick minimum within 7 × 86400000 ms.

**`forge_inbody_tests` shape** (array in localStorage):
```js
[{ id: "abc123", date: "2026-03-18", bf: 19.2, smm: 36.0, weight: 75.5, ... }, ...]
```
Use `entry.bf` for BF%. Date field is `"YYYY-MM-DD"` string.

**Overlay z-index:** `9970` — below `confirm-overlay` (9990) and `deload-overlay` (9990) so those can appear on top if needed.

Delta bar shows: `After − Before` for each stat. Negative weight/BF = green (good). Positive = red.

If no data within 7 days → show `—` for that stat.

---

## Edge cases

| Situation | Behaviour |
|-----------|-----------|
| 0 photos | Compare button hidden |
| 1 photo | Compare button hidden |
| Same photo selected for both slots | Toast: "Select a different photo"; reject swap |
| No bodyweight data near photo date | Show `—` for weight stat |
| No InBody data near photo date | Show `—` for BF% stat |
| Mobile drag (slider mode) | `touchmove` with `e.preventDefault()` to block page scroll |

---

## Trigger

"⚡ Compare" button added to `progress-photos-panel` panel header. Only visible when photo count ≥ 2. Calls `window.openPhotoCompare()`.

---

## Out of scope

- Saving/exporting the comparison as an image
- Comparing more than 2 photos at once
- Animating between before/after
