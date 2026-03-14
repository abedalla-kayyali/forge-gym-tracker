# Social Muscle Exercise Drilldown Implementation

## Task 1: Add failing checks

- extend `smoke_check.js`
- require `muscleExerciseSummary` in `js/duels.js`
- require muscle compare leaderboard hook(s) in `js/social-ui.js`

## Task 2: Publish muscle exercise summary

File:

- `js/duels.js`

Work:

- add helper to build weighted exercise summaries by muscle
- include `muscleExerciseSummary` in `_buildPublicStats()`
- keep field absent only when sharing is disabled

## Task 3: Upgrade Social muscle modal

File:

- `js/social-ui.js`

Work:

- read `muscleExerciseSummary` from local and friend compare snapshots
- enhance `openMuscleCompare()` to:
  - compute verdict copy
  - build leaderboard rows for selected muscle
  - render max, recency, and session counts for each exercise
  - show chase/protect tip per row

## Task 4: Style leaderboard rows

File:

- `css/main.css`

Work:

- add compact leaderboard row styles
- match current forged Social visuals
- keep mobile readable

## Task 5: Verify and ship

Commands:

- `node smoke_check.js`
- `node check_v3.js`

Then:

- bump `js/config.js`
- commit
- push
- verify public `js/config.js` flipped live
