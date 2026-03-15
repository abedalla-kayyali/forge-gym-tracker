# Social Premium Compare Implementation

## Task 1: Add failing checks

Update `smoke_check.js` to require:

- Social premium table hook
- capsule body board hook
- focus-mode toggle hook
- unified compare sheet close hook

## Task 2: Replace body compare board

File:

- `js/social-ui.js`

Work:

- replace forged anatomy board rendering with capsule-muscle board
- add compare state for body shell mode
- render `Show Body` and `Focus Mode` controls

## Task 3: Convert compare drilldowns to premium tables

Files:

- `js/social-ui.js`
- `css/main.css`

Work:

- muscle exercise table
- cardio rivalry table
- bodyweight rivalry table
- luxury visual styling

## Task 4: Unify sheet close behavior

Files:

- `index.html`
- `js/social-ui.js`
- `css/main.css`

Work:

- sticky compare sheet header
- always-visible close button
- consistent open/close functions

## Task 5: Verify and ship

Commands:

- `node smoke_check.js`
- `node check_v3.js`

Then:

- bump `js/config.js`
- commit
- push
- verify public `js/config.js`
