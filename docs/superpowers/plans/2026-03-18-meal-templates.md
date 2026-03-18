# Plan: Meal Plan Quick-Add Templates

## Goal
Let users save any filled meal form as a reusable template and apply it in one tap. Reduces meal logging friction to near-zero for repeat meals.

## Storage
- Key: `forge_meal_library` (already synced via sync.js + data-transfer.js)
- Shape: `{ [id]: { id, name, kcal, p, c, f, savedAt } }`
- IDs: `tmpl_<timestamp>`

## Files to Create / Modify
1. **`js/meal-templates.js`** — new IIFE (save / apply / delete / render panel)
2. **`index.html`** — add "Save as Template" button after "Add Meal" btn (line ~8130); add panel HTML in nutrition section (after weekly-nutrition-panel ~line 1191); add `<script>` tag
3. **`js/dashboard-history.js`** — line ~713 add render hook for nutrition tab open
4. **`css/main.css`** — template panel styles

## Implementation Checklist
- [x] Write `js/meal-templates.js`
- [x] Add panel HTML to `index.html`
- [x] Add "Save as Template" button to meal form
- [x] Add tab hook in `dashboard-history.js`
- [x] Add CSS to `css/main.css`
- [x] Add `<script src="js/meal-templates.js">` to `index.html`

## Status: COMPLETE ✅
