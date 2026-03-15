# Social Compare Sorting And Arabic Safety Implementation

## Task 1: Add failing checks

Update `smoke_check.js` to require:

- Social compare sort-bar hook
- Social compare localized label hook

## Task 2: Add localized compare labels

File:

- `js/social-ui.js`

Work:

- add a contained localization map/helper for compare-specific UI
- localize:
  - headers
  - lead labels
  - empty states
  - fallback date text
  - delta units

## Task 3: Add sort state and sort bars

File:

- `js/social-ui.js`

Work:

- add sort state for:
  - body
  - cardio
  - bodyweight
- add compact sort-bar renderer
- apply sorting to premium table rows

## Task 4: Verify and ship

Commands:

- `node smoke_check.js`
- `node check_v3.js`

Then:

- bump `js/config.js`
- commit
- push
- verify public `js/config.js`
