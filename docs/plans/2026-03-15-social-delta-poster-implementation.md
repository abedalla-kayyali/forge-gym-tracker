# Social Delta And Session Poster Implementation

## Task 1: Add failing checks

Update `smoke_check.js` to:

- fail if `js/share-helpers.js` still contains `slice(0, 6)`
- require grouped poster hook(s)
- require Social delta hook(s)

## Task 2: Implement Social delta chips

Files:

- `js/social-ui.js`
- `css/main.css`

Work:

- add helper functions that compute delta labels for:
  - bodyweight rivalry
  - cardio rivalry
  - muscle exercise leaderboard
- render short delta chips in rivalry rows
- add subtle entry animation styles

## Task 3: Fix poster completeness

File:

- `js/share-helpers.js`

Work:

- group logs by mode
- remove log truncation
- render grouped section headers
- compute dynamic canvas height from total rows
- keep preview and export path identical

## Task 4: Verify and ship

Commands:

- `node smoke_check.js`
- `node check_v3.js`

Then:

- bump `js/config.js`
- commit
- push
- verify public `js/config.js`
