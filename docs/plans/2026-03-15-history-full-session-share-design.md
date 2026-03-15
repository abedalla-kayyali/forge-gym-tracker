# History Full Session Share Design

## Goal

Upgrade the History section so each session can be opened in full detail and shared with the exact logged contents instead of a collapsed summary.

## Problem

The current History UI shows high-level day cards, but it does not expose a premium drilldown or a trustworthy share flow for exact session details.

Current limitations:

1. users cannot easily inspect all logged exercises and sets from a session in one place
2. sharing from history is too shallow for real workout receipts
3. session shares risk dropping important detail if they rely on collapsed summaries instead of the underlying logs

## Outcome

The user should be able to:

- open any logged history session
- inspect the full session contents
- share the exact session details in a premium format

## Scope

In scope:

- add a session detail sheet from History
- render full exercise and set breakdown from stored logs
- add `Share Session` using the exact detail payload
- support weighted, bodyweight, and cardio entries when present

Out of scope:

- editing sets directly from the history sheet
- CSV/Excel export in this slice
- changing how sessions are stored

## Detail View

The history session detail sheet should show:

- date
- muscle or focus tags
- PR count
- totals strip:
  - exercises
  - sets
  - reps
  - volume
  - duration when available
- exercise list

Each exercise block should show:

- exercise name
- exercise type badge if useful
- full set list

### Weighted
- Set 1: 60kg x 10
- Set 2: 70kg x 8

### Bodyweight
- Set 1: 15 reps
- Set 2: 30 sec

### Cardio
- activity
- duration
- distance when present

## Share Output

The share card should be built from the exact session detail payload.

Layout:

- header
  - date
  - session focus
  - PR badges
- totals strip
- grouped exercise blocks with all sets
- footer branding

The share card should expand dynamically for longer sessions instead of truncating details.

## UX Notes

- the sheet should have a reliable close affordance
- the share action should be visible near the top and bottom if the session is long
- mobile readability is critical because this is where users will share from most often
