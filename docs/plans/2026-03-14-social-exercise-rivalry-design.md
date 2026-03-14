# Social Exercise Rivalry Design

## Goal

Make `Compare > Cardio` and `Compare > Bodyweight` feel competitive and fun by comparing exercise/activity-level performance instead of only category summaries.

Users should be able to see:
- who has the better bodyweight exercise record
- who has the better cardio activity record
- how much they need to beat the rival

The compare system must remain privacy-safe by publishing only aggregated per-exercise and per-activity records.

## Product Shape

### Bodyweight Compare

Current state:
- sessions
- skills done
- best reps
- best hold

New state:
- keep summary cards
- add `Exercise Rivalry` list

Each exercise row shows:
- exercise name
- your best
- rival best
- lead badge
- short catch-up delta

Examples:
- `Pull-Up: Rival 18 reps vs You 14`
- `Plank: You 180s vs Rival 120s`

### Cardio Compare

Current state:
- sessions 7d
- minutes 7d
- distance 7d
- top mode

New state:
- keep summary cards
- add `Activity Rivalry` list

Each activity row shows:
- activity name
- best single session
- weekly total
- lead badge

Examples:
- `Run: You 8.2 km vs Rival 6.5 km`
- `Bike: Rival 75 min vs You 42 min`

## Public Snapshot Model

Extend `duelPublicStats` with two new grouped objects.

### bodyweightExerciseSummary

Keyed by exercise name:
- `maxReps`
- `maxDurationSec`
- `sessions`
- `lastAt`

### cardioActivitySummary

Keyed by activity name:
- `bestMinutes`
- `bestDistanceKm`
- `weeklyMinutes`
- `weeklyDistanceKm`
- `sessions`
- `lastAt`

This stays aggregated and public-safe while providing real rivalry depth.

## UI

### Bodyweight Rivalry List

Inside `Compare > Bodyweight`:
- add a scrollable rivalry list below summary cards
- each row:
  - exercise name
  - your best
  - rival best
  - status chip:
    - `Lead`
    - `Even`
    - `Chase`

If an exercise uses holds:
- compare seconds

If an exercise uses reps:
- compare reps

If both exist:
- prefer the dominant type for that exercise

### Cardio Rivalry List

Inside `Compare > Cardio`:
- add a rivalry list below summary cards
- each row:
  - activity name
  - best single session
  - weekly total
  - lead chip

### Detail Sheets

Tap row to open detail sheet.

Bodyweight detail:
- exercise name
- your best reps/hold
- rival best reps/hold
- session counts
- last performed
- beat delta

Cardio detail:
- activity name
- best single session
- weekly totals
- session counts
- last performed
- beat delta

## Scope

Included:
- publish new public rivalry summaries
- cardio activity rivalry list
- bodyweight exercise rivalry list
- detail sheets for both

Not included:
- new backend tables
- push notifications
- social feed posts

## Verification

Required proof:
- static checks pass
- bodyweight rivalry rows render
- cardio rivalry rows render
- detail sheets open
- privacy toggle still hides the compare data
