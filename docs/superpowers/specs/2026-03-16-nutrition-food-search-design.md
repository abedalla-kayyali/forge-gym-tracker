# Nutrition Food Search — Design Spec
**Date:** 2026-03-16  **Status:** Approved (v2 — post spec-review)

---

## Problem
The nutrition section requires users to manually type macro values for every meal. Users need to search a food by name, pick a portion size, and have macros auto-filled.

## Solution
Add live food search to the existing meal form in `renderCoachNutrition()`, backed by USDA FoodData Central (primary) + Open Food Facts (fallback), proxied via a Supabase Edge Function so no API key is exposed to clients.

---

## Architecture

```
User types in #meal-name-input
        ↓
  Debounce 350ms, AbortController cancels previous request
        ↓
  GET https://mnqetnzdgtbeysqnmbkx.supabase.co/functions/v1/food-search?q=<query>&max=8
  Header: Authorization: Bearer <SUPABASE_ANON_KEY>
        ↓
  Edge Function: USDA FoodData Central → normalise → if 0 results → Open Food Facts → normalise
        ↓
  { results: NormalisedFood[] } returned
        ↓
  #meal-search-results dropdown renders (max 6 shown, rest trimmed client-side)
        ↓
  User taps a result → _foodSearchSelect(food) called
        ↓
  meal-name-input.value = food.name
  meal-qty-input repurposed as grams input (label changes to "g")
  _scaleMacros(food.per100g, qty) writes into meal-kcal/p/c/f-input
        ↓
  User edits qty → oninput re-runs _scaleMacros → macro inputs update live
        ↓
  User taps Add Meal → _cnAddMeal() runs unchanged, reads from same inputs
```

---

## Key Integration Points (resolving spec-review blockers)

### Template injection (Blocker 1)
All new HTML is added **inside** the `renderCoachNutrition()` template string (around lines 7316-7331 of index.html). Event listeners for search use `oninput=` / `onclick=` inline attributes (consistent with existing codebase pattern). No static HTML is added outside the template.

### Element IDs — real IDs used throughout (Blocker 2)
| New element | ID | Purpose |
|---|---|---|
| Search input | `meal-name-input` | **Same ID kept** — `_cnAddMeal()` reads this for the meal name. The input becomes a search field. |
| Dropdown | `meal-search-results` | Absolutely-positioned results list |
| Selected food state | `window._selectedFood` | In-memory object holding current food's `per100g` + `serving` data |

`meal-qty-input` keeps its ID — it's repurposed as the "grams" field. `_cnAddMeal()` reads it for `qty` (the gram amount). Since macros are already pre-filled to match this quantity, `qty` is only used internally by `_cnAddMeal` for its own record — no conflict.

### qty input flow (Blocker 3)
`meal-qty-input` is renamed visually (label → "g") and its `oninput` calls `_foodSearchScaleOnQtyChange()` which runs `_scaleMacros` and updates macro inputs live. `_cnAddMeal()` reads `meal-qty-input` value as-is (number of grams logged). No second qty input introduced.

### Macro field write path (Blocker 6)
`_scaleMacros()` writes directly into the existing `meal-kcal-input`, `meal-p-input`, `meal-c-input`, `meal-f-input` fields. User can still override manually after the auto-fill. `_cnAddMeal()` reads these fields as always — zero changes to `_cnAddMeal`.

### `_cnEstimateMealForm` coexistence (Minor 12)
`_cnEstimateMealForm()` reads `meal-name-input` (now the search field) — this still works because selecting a food sets `meal-name-input.value` to the food name. The Estimate button remains available as a fallback for foods not found in search.

### Saved meals datalist coexistence (Minor 13)
The `<datalist id="meal-saved-list">` remains attached to `meal-name-input`. Saved meal chips still work: `_cnApplySavedMeal()` sets `meal-name-input.value` directly, which is unchanged. The datalist autocomplete suggestions will appear alongside the food-search dropdown — they are separate browser mechanisms that do not conflict.

### Post-add reset (Minor 17)
After `_cnAddMeal()` succeeds, `renderCoachNutrition()` is called (existing behaviour), which re-renders the entire form — this naturally resets `window._selectedFood = null`, hides the dropdown, and resets all inputs. No additional reset logic needed.

---

## Supabase Edge Function: `food-search`
**File:** `supabase/functions/food-search/index.ts`
**URL:** `https://mnqetnzdgtbeysqnmbkx.supabase.co/functions/v1/food-search`

```typescript
// Pseudocode — full TS in implementation
Deno.serve(async (req) => {
  // CORS headers for the PWA origin
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) return json({ results: [] });

  // 1. Try USDA
  const usdaKey = Deno.env.get('USDA_API_KEY');
  const usdaRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=8&api_key=${usdaKey}`)
    .catch(() => null);
  const usdaFoods = usdaRes?.ok ? normaliseUSDA(await usdaRes.json()) : [];

  // 2. Fallback to Open Food Facts if USDA empty
  const foods = usdaFoods.length
    ? usdaFoods
    : await fetchOFF(q);

  return json({ results: foods.slice(0, 8) });
});
```

**Normalised food schema:**
```typescript
interface NormalisedFood {
  id: string;
  name: string;
  brand: string | null;
  per100g: { kcal: number; p: number; c: number; f: number }; // p/c/f matches _cnAddMeal keys
  serving: { weight: number; label: string } | null;
}
```

**Auth:** Edge function is public (no JWT check) — the anon key in the `Authorization` header is used for Supabase routing only. This is acceptable: the function calls external APIs with a server-side key, not user data.

**Rate limiting:** USDA free key allows 1,000 req/hour. Client debounce (350ms) + min 2-char query limits abuse. Sufficient for a personal/small-team app. If needed in future, add Supabase's built-in rate limiting middleware.

**CORS:** Add `Access-Control-Allow-Origin: *` header so the PWA can call it from any origin (PWA may run from file:// or localhost during dev).

---

## Client-side: New JS Functions (all global, in index.html script block)

```javascript
// State
let _selectedFood = null;       // NormalisedFood | null
let _foodSearchController = null; // AbortController

// Called oninput on meal-name-input (debounced)
async function _foodSearch(query) { ... }

// Renders dropdown from results array
function _foodSearchRenderResults(foods) { ... }

// Called onclick on a result row
function _foodSearchSelect(food) {
  _selectedFood = food;
  document.getElementById('meal-name-input').value = food.name;
  _foodSearchRenderResults([]); // close dropdown
  _foodSearchScaleOnQtyChange();
}

// Called oninput on meal-qty-input when a food is selected
function _foodSearchScaleOnQtyChange() {
  if (!_selectedFood) return;
  const qty = parseFloat(document.getElementById('meal-qty-input')?.value) || 100;
  const unit = document.getElementById('meal-portion-unit')?.value || 'g';
  const sw = _selectedFood.serving?.weight || 100;
  const grams = unit === 'serving' ? qty * sw : qty;
  const f = grams / 100;
  const { per100g } = _selectedFood;
  document.getElementById('meal-kcal-input').value = Math.round(per100g.kcal * f);
  document.getElementById('meal-p-input').value    = (per100g.p * f).toFixed(1);
  document.getElementById('meal-c-input').value    = (per100g.c * f).toFixed(1);
  document.getElementById('meal-f-input').value    = (per100g.f * f).toFixed(1);
}

// Clears food search state when user types freely (not selecting from list)
function _foodSearchClear() {
  _selectedFood = null;
}
```

---

## Template Changes in `renderCoachNutrition()` (lines ~7316-7331)

**Before:**
```html
<input id="meal-name-input" class="meal-input" type="text" list="meal-saved-list" placeholder="Meal name...">
<datalist id="meal-saved-list">...</datalist>
<input id="meal-qty-input" class="meal-input meal-qty" type="number" ...>
```

**After:**
```html
<div class="meal-search-wrap">
  <input id="meal-name-input" class="meal-input" type="text" list="meal-saved-list"
    placeholder="Search food or type meal name..."
    oninput="_foodSearchDebounce(this.value); _foodSearchClear();"
    autocomplete="off">
  <datalist id="meal-saved-list">...</datalist>
  <div id="meal-search-results" class="meal-search-results" style="display:none"></div>
</div>
<div class="meal-qty-row">
  <input id="meal-qty-input" class="meal-input meal-qty" type="number" step="1" min="1" value="100"
    placeholder="g" oninput="_foodSearchScaleOnQtyChange()">
  <select id="meal-portion-unit" class="meal-portion-unit" onchange="_foodSearchScaleOnQtyChange()">
    <option value="g">g</option>
    <option value="serving">serving</option>
  </select>
</div>
```

---

## CSS additions (css/main.css)
```css
.meal-search-wrap { position: relative; }
.meal-search-results {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
  background: var(--panel); border: 1px solid var(--border2);
  border-radius: 0 0 12px 12px; max-height: 260px; overflow-y: auto;
}
.meal-search-result { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid var(--border1); }
.meal-search-result:active { background: rgba(255,255,255,.06); }
.meal-search-result-name { font-size: 13px; color: var(--text1); }
.meal-search-result-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
.meal-search-spinner { padding: 12px; text-align: center; color: var(--text3); font-size: 12px; }
.meal-qty-row { display: flex; gap: 6px; align-items: center; }
.meal-portion-unit { background: var(--panel); border: 1px solid var(--border2); color: var(--text1);
  border-radius: 8px; padding: 8px; font-size: 13px; }
```

---

## Service Worker (Minor 14)
The SW's existing external-origin handler (network-first) will attempt to cache food-search responses. To prevent stale food data being served offline, add the Edge Function URL to the `isCriticalAsset` bypass — or better, add a URL check that returns 503 immediately for food-search when offline:

```javascript
// In sw.js fetch handler, before other checks:
if (url.pathname.includes('/functions/v1/food-search')) {
  event.respondWith(
    fetch(event.request).catch(() => new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' }
    }))
  );
  return;
}
```

---

## i18n (Minor 16)
New strings to add to `js/i18n.js`:
| Key | English | Arabic |
|---|---|---|
| `food.searchPlaceholder` | Search food or type meal name… | ابحث عن طعام أو اكتب اسم الوجبة |
| `food.noResults` | No results — try a different name | لا نتائج — جرب اسماً آخر |
| `food.searchError` | Search unavailable — enter macros manually | البحث غير متاح — أدخل القيم يدوياً |
| `food.per100g` | per 100g | لكل 100غ |

---

## Config
```javascript
// js/config.js — add to FORGE_CONFIG:
FOOD_SEARCH_URL: 'https://mnqetnzdgtbeysqnmbkx.supabase.co/functions/v1/food-search'
```

---

## Files to Create / Modify
| File | Change |
|---|---|
| `supabase/functions/food-search/index.ts` | **Create** — Edge Function (USDA + OFF fallback) |
| `index.html` — `renderCoachNutrition()` | **Modify** — replace meal name input section with search wrap + qty row |
| `index.html` — script block | **Add** — `_foodSearch`, `_foodSearchDebounce`, `_foodSearchSelect`, `_foodSearchScaleOnQtyChange`, `_foodSearchClear`, `_foodSearchRenderResults` |
| `js/config.js` | **Modify** — add `FOOD_SEARCH_URL`, bump to v143 |
| `js/i18n.js` | **Modify** — add 4 new i18n keys |
| `css/main.css` | **Modify** — add food search dropdown + qty row styles |
| `sw.js` | **Modify** — add food-search bypass + bump to forge-v143 |

---

## One-time Setup (developer)
1. Register free USDA API key: https://api.data.gov/signup (instant, no approval needed)
2. `supabase secrets set USDA_API_KEY=<your_key>`
3. `supabase functions deploy food-search`

---

## Success Criteria
1. Type "oats" → dropdown appears within ~700ms with ≥1 result showing kcal + protein
2. Tap result → macro fields auto-fill for 100g default
3. Change qty to 80 → macro fields update live, values are 0.8× the 100g values
4. Tap Add Meal → meal logged with correct macros
5. Kill network → search shows empty results, manual entry still works
6. No API key visible in any client-side JS or HTML
