# Social Compare Sorting And Arabic Safety Design

## Goal

Improve the new Social premium compare tables with:

- compact sort bars above each table
- Arabic-safe labels, empty states, and status copy

## Problem

The premium compare tables are visually improved, but two usability issues remain:

1. users cannot quickly reorder the tables around the metric they care about
2. the new compare surface is not yet localized cleanly for Arabic

## Outcome

Users should be able to:

- sort body/cardio/bodyweight rivalry tables from a compact control row
- see readable Arabic copy across table labels and compare states

## Scope

In scope:

- one compact sort bar above each premium compare table
- sort state stored in Social UI state
- localized labels for:
  - table headers
  - sort labels
  - lead labels
  - empty states
  - date fallback strings
  - delta units

Out of scope:

- global i18n refactor
- server-side sorting
- filtering or pagination

## UX

### Sort bars

Each compare table gets a compact control row:

- `Sort by`
- pill buttons relevant to that table

Body:

- `Delta`
- `Last`
- `Sessions`
- `Max`

Cardio:

- `Delta`
- `Best`
- `Weekly`
- `Last`

Bodyweight:

- `Delta`
- `Reps`
- `Hold`
- `Last`

Default:

- `Delta`

### Arabic safety

Localize the Social compare surface within `js/social-ui.js` using a contained label map instead of scattered inline strings.

This covers:

- headings
- labels
- empty states
- `YOU / RIVAL / EVEN`
- units and delta text
- day text like `Today` and `1d ago`

## Technical Plan

- add sort state to Social UI
- add localized string helper for Social compare
- add sort bar renderer
- update row builders to support sort modes
- keep current backend/data model unchanged

## Verification

- smoke checks stay green
- `check_v3.js` stays green
- Arabic mode renders readable compare labels
- sort pills change row ordering
