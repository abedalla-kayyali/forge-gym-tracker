# Social Delta And Session Poster Design

## Goal

Ship two related improvements:

1. make Social compare rows more competitive with explicit delta chips
2. fix the session share poster so it includes every workout logged in the session

## Problem

### Social compare

Current rivalry rows show who leads, but they do not clearly show the gap. Users should instantly understand:

- how many reps behind they are
- how many seconds behind they are
- how many kg behind they are
- how many minutes or km they need to beat

### Session poster

The share poster currently drops workouts for longer sessions. The root cause is in `js/share-helpers.js`, where the session poster renderer truncates logs with `slice(0, 6)`.

That makes the poster untrustworthy because the in-app session contains more entries than the exported image.

## Scope

In scope:

- add rivalry delta chips to cardio/bodyweight/exercise compare rows
- add subtle animated reveal for rivalry rows
- rebuild the session poster exercise list as grouped sections:
  - Weighted
  - Bodyweight
  - Cardio
- render every session log entry in the poster
- make the poster height dynamic so no entries are silently dropped

Out of scope:

- changing session log capture logic
- changing the summary overlay flow
- redesigning the full poster visual language from scratch

## UX

### Social compare

Each rivalry row should show:

- exercise or activity name
- lead badge
- primary values
- delta chip

Examples:

- `+2 reps`
- `+40s`
- `+10kg`
- `+0.8km`
- `+15m week`

The delta chip should be short and readable on mobile.

### Session poster

The poster should present session logs in grouped sections:

- `WEIGHTED`
- `BODYWEIGHT`
- `CARDIO`

Each section includes all entries in that mode. If a section has no entries, it is omitted.

The canvas height must expand to fit the total row count.

## Technical Plan

- add grouped poster helpers in `js/share-helpers.js`
- remove the hard slice limit from poster rendering
- compute dynamic poster height from section count and row count
- add delta helper logic to `js/social-ui.js`
- add delta chip styles in `css/main.css`

## Verification

- smoke checks must fail if poster still contains `slice(0, 6)`
- smoke checks must require Social rivalry delta hook
- `check_v3.js` must stay clean
- public version bump required
