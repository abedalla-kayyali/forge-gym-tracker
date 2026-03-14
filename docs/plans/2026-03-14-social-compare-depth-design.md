# Social Compare Depth Design

## Goal

Upgrade the Social `Compare` experience so users can compare:
- full-body muscle summaries through a clickable body map
- aggregated max load per muscle
- last-trained timing per muscle
- cardio summaries
- bodyweight summaries

The compare layer must stay privacy-safe by publishing only aggregated public stats, never raw exercise logs.

## Product Shape

The `Social` tab keeps its current four surfaces:
- `Hub`
- `Friends`
- `Compare`
- `Duels`

Only `Compare` changes in this slice.

The compare screen becomes a layered rivalry dashboard:

1. `Overview`
- current head-to-head cards remain
- sessions, volume, streak, readiness, and balance stay visible

2. `Body`
- side-by-side mini body maps for `You` and `Rival`
- body-map intensity reflects training presence / load summary
- tapping a muscle opens a compare detail sheet

3. `Cardio`
- compares conditioning summaries

4. `Bodyweight`
- compares bodyweight/calistenics summaries

## Public Snapshot Model

The existing `duelPublicStats` payload in `js/duels.js` is extended with three grouped summaries.

### muscleSummary

Per-muscle aggregated fields:
- `maxWeight`
- `sessions`
- `lastTrainedAt`

This is based on weighted workout history. If a muscle has no weighted max, the UI falls back to sessions and recency only.

### cardioSummary

Aggregated cardio fields:
- `sessions7d`
- `minutes7d`
- `distance7d`
- `lastCardioAt`
- `topMode`

### bodyweightSummary

Aggregated bodyweight fields:
- `sessions7d`
- `skillsDone`
- `bestReps`
- `bestDurationSec`
- `lastBodyweightAt`

This keeps the payload compact and query-safe while making compare meaningfully deeper.

## Compare UX

### Compare View Tabs

Inside Social `Compare`, add a secondary segmented switch:
- `Overview`
- `Body`
- `Cardio`
- `Bodyweight`

Default tab:
- `Body`

Reason:
- the body-map compare is the standout feature
- it makes the social rivalry feel deeper immediately

### Body Compare

Render side-by-side mini body maps:
- left: `You`
- right: `Rival`

Muscle rendering logic:
- highlighted if the user has meaningful activity for that muscle
- stronger highlight if max load or session density is higher

Below the maps:
- short rivalry callout
- example: `Chest: Rival leads load | Legs: You lead consistency`

### Muscle Detail Sheet

Tapping any muscle opens a compare sheet with:
- muscle name
- your max load
- rival max load
- your last trained timing
- rival last trained timing
- your session count
- rival session count
- a lead verdict
- a catch-up coaching hint

Example:
- `Chest`
- `You: 85kg max`
- `Rival: 100kg max`
- `You trained 5d ago`
- `Rival trained 2d ago`
- `Lead: Rival`
- `Catch-up tip: add 2 chest sessions this week`

### Cardio Compare

Cards:
- `Sessions 7d`
- `Minutes 7d`
- `Distance 7d`
- `Last cardio`
- `Top mode`

Plus one rivalry line:
- `You win on consistency`
- `Rival wins on endurance volume`

### Bodyweight Compare

Cards:
- `Sessions 7d`
- `Skills done`
- `Best reps`
- `Best hold`
- `Last session`

This gives a full-spectrum compare:
- strength
- conditioning
- skill/endurance

## Architecture

### Data Publish

Extend `js/duels.js` publish logic:
- compute aggregated summaries from local workout arrays
- publish into `profile.duelPublicStats`
- mirror to:
  - `profiles_public.duel_public_stats`
  - `profiles.data.duelPublicStats`

### UI Render

Upgrade `js/social-ui.js`:
- richer friend snapshot reader
- compare sub-tab state
- body map render helpers
- muscle detail modal open/close functions

### Markup / Styling

Add compare detail modal and segmented controls in:
- `index.html`
- `css/main.css`

Reuse existing body-map zone naming where possible so the compare map aligns with the rest of the app.

## Constraints

- No raw per-set or per-exercise logs exposed publicly
- No cross-user private table reads beyond existing public snapshot access
- Works on mobile first
- Arabic-safe text later, but this slice should avoid introducing broken encoded strings

## Verification

Required proof:
- static checks pass
- public stats publish still works
- compare screen renders for a real friend
- body map opens muscle detail sheet
- cardio compare renders
- bodyweight compare renders

Live verification should use the same two real test accounts already used for Social.
