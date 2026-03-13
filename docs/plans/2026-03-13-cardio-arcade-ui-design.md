# Cardio Arcade UI/UX Redesign (v47.1) Design

**Date:** 2026-03-13
**Status:** Approved

## Goal
Redesign the Cardio Log and Cardio Stats experiences with an "Arcade Energy" aesthetic and balanced motion, while preserving existing data/storage logic and compatibility with legacy entries.

## Scope
- Cardio Log zone visual and interaction redesign.
- Cardio Stats tab visual redesign (KPI cards, charts deck, achievements gallery).
- Chart readability and hierarchy improvements.
- No backend or storage schema changes.

## Architecture
- Keep existing data entry points and globals (`cardioLog`, `submitCardioLog`, `renderCardioStatsPanel`).
- Use normalized cardio data for robust stats rendering.
- Split Cardio Stats rendering into shell + cards + charts + badges helpers.
- Style-led redesign via CSS classes and richer UI container markup in rendered HTML.

## UX Direction
- Theme: neon arcade HUD on dark panels.
- Motion: balanced (150-250ms transitions, subtle glow/pulse, no heavy effects).
- Readability: higher contrast labels, larger metric hierarchy, stronger empty/no-data states.

## Cardio Log Design
- Hero streak banner with subtle glow and progression framing.
- Category blocks become visual cards with stronger spacing and depth.
- Mission-style form container with clearer input hierarchy and CTA emphasis.
- Recent feed redesigned for scanability.

## Cardio Stats Design
- KPI header cards with stronger typographic hierarchy.
- Three chart cards with consistent arcade frame and visual language.
- Achievements area redesigned to collectible-tile feel with locked/unlocked states.

## State Handling
- Empty all-time cardio log: motivational empty state.
- Empty selected period: explicit “no workouts in period” card.
- No HR zone: chart replaced with informative text panel.
- Legacy entries: normalized before rendering.

## Testing Expectations
- Existing cardio history appears in stats.
- Charts render and period switches update immediately.
- Achievements unlock with normalized data.
- Mobile layout remains usable and legible.
