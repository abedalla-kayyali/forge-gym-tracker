# History Full Session Share Implementation

## Task 1: Add failing checks

Update `smoke_check.js` to require:

- history session detail open hook
- history full session share hook
- session detail modal or sheet hook

## Task 2: Add history session drilldown

Files:

- `js/dashboard-history.js`
- `index.html`
- `css/main.css`

Work:

- open a session detail sheet from History cards
- render exact exercise and set breakdown
- show session totals and PR markers

## Task 3: Add full-detail session sharing

Files:

- `js/dashboard-history.js`
- `js/share-helpers.js`

Work:

- build session share payload from the detail sheet source data
- support weighted, bodyweight, and cardio entries
- make the share output expand dynamically for long sessions

## Task 4: Tune mobile UX

Files:

- `css/main.css`

Work:

- readable stacked session rows
- sticky sheet header
- clear share button placement

## Task 5: Verify

Commands:

- `node smoke_check.js`
- `node check_v3.js`

Then summarize the implementation and any remaining gaps.
