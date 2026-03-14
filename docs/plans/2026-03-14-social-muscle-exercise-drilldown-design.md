# Social Muscle Exercise Drilldown Design

## Goal

Upgrade the Social body-map tap flow so each muscle opens a deeper competitive sheet instead of a shallow summary. The new drilldown should show aggregated exercise-level rivalry for the selected muscle without exposing raw workout logs.

## User Outcome

When a user taps a muscle in `Social -> Compare -> Body`, they should immediately understand:

- who leads that muscle overall
- which exercises define that rivalry
- each side's max weight per exercise
- when each side last trained that exercise
- how often each side has trained it

This should feel competitive and actionable, not like a static stats dump.

## Scope

In scope:

- publish aggregated public `muscleExerciseSummary`
- enhance the existing Social muscle compare modal
- render exercise leaderboard rows for the tapped muscle
- keep privacy rules unchanged

Out of scope:

- raw workout history feeds
- rep-by-rep or set-by-set exposure
- direct links into full friend workout logs

## Data Model

Add `muscleExerciseSummary` to `duelPublicStats`.

Shape:

```js
muscleExerciseSummary: {
  Chest: {
    "Bench Press": {
      maxWeight: 100,
      sessions: 12,
      lastAt: "2026-03-13"
    }
  }
}
```

Rules:

- weighted workouts only
- grouped by normalized muscle, then exercise name
- max weight is the highest single weight seen on that exercise
- sessions counts workout rows for that exercise and muscle
- `lastAt` is the latest date seen

## UX

The existing muscle modal becomes a `muscle showdown` sheet with 3 layers.

### 1. Verdict

Short competitive sentence:

- `You own chest power`
- `Rival owns legs power`
- `Back is contested`

### 2. Totals

Keep the current high-level comparison:

- max load
- session count
- last trained

### 3. Exercise Leaderboard

Show 3-6 top exercises for the selected muscle.

Each row shows:

- exercise name
- lead badge
- your max vs rival max
- your last trained vs rival last trained
- session counts
- short chase/protect tip

Sorting:

1. biggest max-weight gap first
2. then latest training recency

## Privacy

This remains aggregated and public-safe.

- no raw logs
- no set details
- no rep history
- no timestamps beyond last trained date

If sharing is disabled, the existing hidden-stats state remains unchanged.

## Technical Plan

- extend public stats builder in `js/duels.js`
- upgrade `openMuscleCompare()` in `js/social-ui.js`
- add leaderboard rows to the existing modal body
- style rows in `css/main.css`

## Verification

- smoke checks must assert `muscleExerciseSummary` is published
- Social body compare modal must still open from body-map taps
- leaderboard rows should render when exercise data exists
- hidden-stats behavior must remain unchanged
