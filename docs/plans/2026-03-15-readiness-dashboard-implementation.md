# Readiness Dashboard Revamp Implementation

## Task 1: Add failing checks

Update `smoke_check.js` to require the new readiness dashboard hooks:

- hero dashboard shell
- decomposition tile grid
- contribution rail
- insight rail

## Task 2: Add readiness derivations

File:

- `js/dashboard-history.js`

Work:

- derive consistency from active days signals
- derive cardio support from cardio trend/volume
- derive momentum from weighted/cardio directional trend
- keep load pressure based on recent weighted/cardio strain

## Task 3: Rebuild readiness renderer

Files:

- `js/dashboard-history.js`
- `css/main.css`

Work:

- larger hero score layout
- premium decomposition tiles
- contribution bars
- richer detail panel
- coach insight rail

## Task 4: Tune mobile presentation

Files:

- `css/main.css`

Work:

- clean mobile stacking
- two-column metric tiles
- stronger readability for the hero and detail panel

## Task 5: Verify and prepare release

Commands:

- `node smoke_check.js`
- `node check_v3.js`

Then:

- summarize the changes and verification results
