# Social Premium Compare Design

## Goal

Replace the current Social compare presentation with a clearer, more premium system:

- capsule-style body compare board matching the weighted log page pattern
- luxury rivalry tables instead of stacked cards
- consistent drilldown sheet with reliable close behavior

## Problem

The current Social compare flow has three UX weaknesses:

1. the body compare visual is decorative but not the clearest control surface
2. cardio and bodyweight comparisons still rely too heavily on stacked cards
3. drilldown exit behavior is inconsistent and can feel trapped

## Outcome

The user should be able to:

- scan the rivalry quickly
- choose a muscle from a clean capsule board
- read a proper comparison table
- close the drilldown reliably from anywhere

## Scope

In scope:

- replace Social body board with capsule-muscle board
- add `Show Body` and `Focus Mode`
- convert body/cardio/bodyweight drilldowns to premium tables
- unify close behavior for all compare sheets

Out of scope:

- backend schema changes
- changing duel logic
- adding new compare metrics

## Body Compare

### Control Surface

Use the same capsule muscle selector pattern as the weighted log page.

Modes:

- `Show Body`
  - capsule muscles over a subtle body shell
- `Focus Mode`
  - capsule muscles only
  - cleaner on mobile

### Drilldown

Selecting a muscle opens a premium table with:

- `Exercise`
- `You`
- `Rival`
- `Last`
- `Sessions`
- `Delta`

Rows sort by biggest competitive weight gap first.

## Cardio Compare

Use a premium rivalry table with:

- `Activity`
- `Best Session`
- `Weekly Total`
- `Last`
- `Lead`
- `Delta`

## Bodyweight Compare

Use a premium rivalry table with:

- `Exercise`
- `Best Reps`
- `Best Hold`
- `Last`
- `Lead`
- `Delta`

## Visual Direction

- dark luxury dashboard
- steel/glass panels
- strong row spacing
- sticky table headers
- compact, readable values
- clear contrast on mobile

## Close Behavior

All compare drilldowns use one consistent sheet:

- sticky top bar
- title
- subtitle
- always-visible SVG close button
- content scrolls below the header

This solves the current trap issue.

## Technical Plan

- `js/social-ui.js`
  - replace body board rendering
  - add body shell toggle state
  - render premium tables
  - unify modal open/close flow
- `index.html`
  - update compare sheet shell if needed
- `css/main.css`
  - add premium table styles
  - add capsule board styles
  - strengthen sheet close/header behavior

## Verification

- body compare loads capsule board
- body shell can be hidden
- body/cardio/bodyweight tables render
- close button is always visible and works
- smoke and structural checks pass
