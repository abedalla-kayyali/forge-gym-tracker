# Stats Page Redesign — Design Spec

**Date:** 2026-04-17  
**Status:** Approved  
**Scope:** `src/pages/StatsPage.tsx` + inline sub-components only. No store/data changes.

---

## Design System

**Style:** Whoop / Athletic Analytics  
**Palette:** Existing FORGE dark tokens (`forge-green`, `forge-gold`, `forge-ember`, `forge-dim`, `card-elevated`)  
**Typography:** Existing `font-display`, `font-condensed`, `kpi-lg`, `kpi-md`, `label-cap` classes  
**New visual patterns:** Activity rings (SVG), composition donut (SVG), weekly dot strip, delta pills

---

## Tab Structure (unchanged)

5 tabs: **Overview · Progress · Muscles · Body · Cali**

Cali tab is **not touched** — unchanged from current implementation.

---

## Overview Tab

### Hero — Activity Rings

Three SVG rings rendered in a single card, side by side:

| Ring | Metric | Color |
|------|--------|-------|
| Sessions | Count this month vs monthly target (default 12) | `forge-green` |
| Streak | Days / 7 as percentage | `forge-ember` (#f59e0b) |
| Volume | Total kg this month vs monthly best | `#6366f1` (indigo) |

Each ring: 60×60px SVG, `stroke-dasharray` driven by percentage, `-90deg` rotation, label + value below.  
Status line below each ring (e.g. "3 this month", "keep going", "42,300 kg").

### Weekly Training Strip

Below rings: a card showing 7 dots (Mon–Sun) for the **current week**.  
- Trained day → `forge-green` filled dot  
- Rest day → dimmed border-only dot  
- Today → `forge-green` with glow pulse

### Latest PR Pill

Single gold pill showing the most recent PR: exercise name + weight/reps.

### Remaining sections (unchanged order)

1. `XPBar` — keep as-is
2. `StepsPanel` — keep as-is
3. `DashboardSection` "Muscle Freshness" → `MuscleHeatmap` — keep as-is
4. `DashboardSection` "Recent Workouts" → `WorkoutHistory` — keep as-is

---

## Progress Tab

### Period Pills

`TabPills` with 7D / 1M / 3M / 6M / ALL — local to this tab, existing behavior.

### KPI Grid (2×2)

Four cells: **Sessions**, **Volume (kg)**, **PRs**, **Cardio (min)**  
Each cell adds a **delta pill** vs the previous equivalent period:
- Positive delta → `forge-green` with `↑`
- Negative delta → `#EF4444` with `↓`
- Zero → muted, no arrow

Delta calculation: compare selected period window vs the window immediately before it.

### Weekly Volume Bars

New inline bar chart (no external charting lib required — pure CSS flex bars): one bar per week within the selected period, height proportional to total volume that week. Built directly in `StatsPage.tsx` using a `useMemo` that groups workout volume by ISO week. The existing `VolumeChart` component groups by exercise, not week, so it is not used here.

### Progressive Overload Section

Title: "Progressive Overload"  
For each of the top 5 exercises by volume in the period:
- Exercise name (left, 60px wide)
- Horizontal progress bar (flex-1): fill width = relative to max weight in the set; color green if improved vs prior period, red if regressed
- Delta value on right: `+8 kg` (green) or `−2 kg` (red)

Data: compare max weight per exercise in current period vs same exercise in previous period.  
Only show exercises with at least 2 entries across both periods.

### PR Board

`PRBoard` component — keep as-is, placed below overload section.

---

## Muscles Tab

### Body Map (top)

`DashboardSection` "Muscle Status" wrapping the full `MuscleHeatmap` component — **no changes** to `MuscleHeatmap.tsx` or `BodyMap.tsx`. The existing SVG with freshness tints is the visual.

### Volume by Muscle (horizontal bars)

Below the body map: sorted horizontal bars for each muscle group, showing total volume (kg) in the last 30 days. Sorted descending by volume.

Fields per row:
- Muscle name (capitalize, 60px)
- Bar (flex-1, `forge-green`)
- Volume value right-aligned (e.g. "18,400 kg" → "18.4k")

### Balance Chart

`BalanceChart` component — keep as-is, placed last.

> **Removed from Muscles tab:** The duplicate `VolumeChart` that was also in this tab (volume is now shown as horizontal bars above).

---

## Body Tab

### Weight Hero Card

Full-width card with:
- Label: "Current Weight" (muted, uppercase, small)
- Large number: current weight in kg (`kpi-lg`, `forge-green`)
- Delta pill: weight change vs previous measurement entry — green if down, red if up

Data source: `useBodyStore` measurements sorted by date descending; `sorted[0]` = current, `sorted[1]` = previous. No new store fields required.

**If no measurements:** show empty state with Ruler icon (existing pattern).

### InBody Composition Donut

Segmented SVG ring (72×72px) showing body composition breakdown:
- Muscle mass → `forge-green` segment
- Fat mass → `#EF4444` segment  
- Water → `#6366f1` segment
- Remaining → `#1a1a1a` (background arc)

Center of donut: fat % value + "Fat" label.

Right side legend: 4 rows (Muscle, Fat Mass, Fat %, Water, BMI) with:
- Colored dot
- Label
- Value + delta vs previous InBody scan (colored arrow)

`isLowerBetter` logic kept from existing `InBodyCard` for delta colors.  
**If no InBody data:** existing empty state card.

### Measurements Grid

3-column grid, one cell per defined measurement field (chest, waist, hips, shoulders, neck, arms, thighs, calves).  
Each cell:
- Label (9px uppercase muted)
- Value in cm (`kpi-lg`, `forge-green`)
- Delta vs previous entry (color-coded, ±X.X format)

This replaces the existing `MeasurementsGrid` but keeps the same logic — just tighter styling (8px padding, smaller font hierarchy matching the new aesthetic).

**If no measurements:** existing empty state card.

---

## Components Added / Changed

| Component | Action |
|-----------|--------|
| `ActivityRings` | New inline component in `StatsPage.tsx` |
| `WeeklyDotStrip` | New inline component in `StatsPage.tsx` |
| `LatestPRPill` | New inline component in `StatsPage.tsx` |
| `ProgressOverloadSection` | New inline component in `StatsPage.tsx` |
| `WeightHeroCard` | New inline component in `StatsPage.tsx` |
| `CompositionDonut` | New inline component in `StatsPage.tsx` |
| `MeasurementsGrid` | Replaced inline — same logic, new styling |
| `InBodyCard` | Replaced inline — donut replaces grid |
| `KpiBigCell` | Keep — add delta prop |
| `MuscleHeatmap` | Unchanged |
| `BodyMap` | Unchanged |
| `PRBoard`, `WorkoutHistory`, `StepsPanel`, `XPBar` | Unchanged |
| `VolumeChart`, `FreqChart`, `BalanceChart` | Unchanged |

---

## Data Requirements

All data comes from existing stores — no new stores or API calls:
- `useWorkoutStore` — weighted workouts
- `useBwWorkoutStore` — bodyweight workouts
- `useCardioStore` — cardio entries
- `useBodyStore` — measurements + inbody scans

**New derived calculations (all inside `useMemo`):**
- Ring percentages (sessions/target, streak/7, volume/monthlyBest)
- Current week training days set
- Period delta for KPIs (current window vs prior window of same length)
- Progressive overload delta per exercise (max weight current vs prior period)
- Volume by muscle (30d, summed from all workout types)
- Weight goal progress (% toward goal)
- Composition donut segment sizes from InBody values

---

## What Is Not Changing

- Tab structure and count (5 tabs)
- Cali tab — fully untouched
- All store interfaces and schemas
- `BodyMap.tsx`, `MuscleHeatmap.tsx`
- `PRBoard`, `WorkoutHistory`, `StepsPanel`, `XPBar`
- Routing, navigation, page entry animation
