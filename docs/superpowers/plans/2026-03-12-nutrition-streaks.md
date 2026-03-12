# Nutrition Streaks & Engagement Stats Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 engagement stat cards (Protein Days, Deficit Days, Current Streak, Best Streak) to the Nutrition tab's stats grid, bumping the app to v45.

**Architecture:** Pure JS addition inside `renderNutritionAnalyticsPanel()` in `dashboard-history.js` — compute 4 new values from existing `daily` array and `mealsLog` global, then append 4 new `.sg-card` elements to the existing `stats-grid` template string. No new files, no CSS changes.

**Tech Stack:** Vanilla JS ES6, no build step, no test runner — verification is manual browser inspection via DevTools console.

---

## Codebase Context (read before touching anything)

- **`js/dashboard-history.js`** — contains `renderNutritionAnalyticsPanel()` at line 1516. The stats-grid HTML template is at lines 1569–1591. The closing `</div>` for the `stats-grid` wrapper is at line 1591 (`</div>\``) — this must be relocated to after the 4 new cards.
- **`mealsLog`** — global `{dateKey: [mealObjects]}`, each meal has `.p`, `.kcal`, `.c`, `.f`. Key format: `YYYY-MM-DD` (local time, from `_isoKey(date)`).
- **`daily`** — period-filtered array already computed by line 1555; shape: `[{key, kcal, p, c, f, count}]`.
- **`targets`** — `{targetCal, proteinG, carbG, fatG}` from `_calcNutritionTargetsForStats()`.
- **`nDays`** — already `Math.max(daily.length, 1)` at line 1556. Use this directly.
- **`_isoKey(date)`** — returns `YYYY-MM-DD` string in local time.
- **Protein threshold** — `>= targets.proteinG * 0.9` (≥90%, matches existing `underProteinDays` at line 1625).
- **Streak amber color** — `#e6b84a` (already used in codebase; do NOT use a CSS variable — hardcode it).
- **`tx(en, ar)`** — i18n helper used throughout; use it for all user-visible label strings.

---

## Chunk 1: JS — Engagement Stats + Cards

### Task 1: Add 4 computations + 4 stat cards

**Files:**
- Modify: `js/dashboard-history.js` (lines 1562–1591)

No automated tests exist in this project. Verification is via browser console after the change.

- [ ] **Step 1: Locate insertion point**

Open `js/dashboard-history.js`. Find line 1562:
```js
const compliance = Math.round(dayScores.reduce((s,d) => s+d.score, 0) / nDays * 100);
```
The 4 new computations go **immediately after** this line (before line 1564 `const calPct`).

- [ ] **Step 2: Insert the 4 new computations**

After the `compliance` line, add:

```js
// v45 engagement stats
const proteinDays   = daily.filter(d => d.p >= targets.proteinG * 0.9).length;
const deficitDays   = daily.filter(d => d.kcal < targets.targetCal).length;
const bestStreak    = (() => { let cur=0,max=0; daily.forEach(d => { cur = d.p>=targets.proteinG*.9 ? cur+1 : 0; max=Math.max(max,cur); }); return max; })();
const currentStreak = (() => {
  const ml = (typeof mealsLog !== 'undefined' && mealsLog && typeof mealsLog === 'object') ? mealsLog : {};
  let streak = 0;
  const today = new Date();
  const todayKey = _isoKey(today);
  const todayMeals = Array.isArray(ml[todayKey]) ? ml[todayKey] : [];
  const todayP = todayMeals.reduce((s,m) => s+(+m.p||0), 0);
  let startOffset = (todayMeals.length && todayP >= targets.proteinG*.9) ? 0 : 1;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate()-i);
    const key = _isoKey(d);
    const meals = Array.isArray(ml[key]) ? ml[key] : [];
    if (!meals.length) break;
    const p = meals.reduce((s,m) => s+(+m.p||0), 0);
    if (p < targets.proteinG*.9) break;
    streak++;
  }
  return streak;
})();
```

- [ ] **Step 3: Append 4 new cards to `statsZone.innerHTML` — relocate closing `</div>`**

Find the current end of the `statsZone.innerHTML` template string (around line 1590):
```js
  <div class="sg-card">
    <div class="sg-label">${tx('Avg Macros','متوسط الماكرو')}</div>
    <div class="sg-val sg-neutral" style="font-size:16px;line-height:1.5">${Math.round(avgP)}P / ${Math.round(avgC)}C / ${Math.round(avgF)}F</div>
    <div class="sg-sub">${tx('Targets:','أهداف:')} ${Math.round(targets.proteinG)}P / ${Math.round(targets.carbG)}C / ${Math.round(targets.fatG)}F</div>
  </div>
</div>`;
```

Replace that closing `</div>\`` (the `stats-grid` closing tag + backtick) with the 4 new cards followed by the closing tag:

```js
  <div class="sg-card">
    <div class="sg-label">${tx('Avg Macros','متوسط الماكرو')}</div>
    <div class="sg-val sg-neutral" style="font-size:16px;line-height:1.5">${Math.round(avgP)}P / ${Math.round(avgC)}C / ${Math.round(avgF)}F</div>
    <div class="sg-sub">${tx('Targets:','أهداف:')} ${Math.round(targets.proteinG)}P / ${Math.round(targets.carbG)}C / ${Math.round(targets.fatG)}F</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">🥩 ${tx('Protein Days','أيام البروتين')}</div>
    <div class="sg-val sg-neutral">${proteinDays}<span class="sg-unit"> / ${nDays}</span></div>
    <div class="sg-sub">${nDays ? Math.round(proteinDays/nDays*100) : 0}% ${tx('of period','من الفترة')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">📉 ${tx('Deficit Days','أيام العجز')}</div>
    <div class="sg-val sg-neutral">${deficitDays}<span class="sg-unit"> / ${nDays}</span></div>
    <div class="sg-sub">${nDays ? Math.round(deficitDays/nDays*100) : 0}% ${tx('of period','من الفترة')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">🔥 ${tx('Cur. Streak','الإنجاز الحالي')}</div>
    <div class="sg-val${currentStreak >= 3 ? '' : ' sg-neutral'}"${currentStreak >= 3 ? ' style="color:#e6b84a"' : ''}>${currentStreak > 0 ? currentStreak + '<span class="sg-unit"> ' + tx('days','أيام') + '</span>' : '—'}</div>
    <div class="sg-sub">${currentStreak > 0 ? tx('protein goal','هدف البروتين') : tx('start your streak!','ابدأ إنجازك!')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">🏆 ${tx('Best Streak','أفضل إنجاز')}</div>
    <div class="sg-val sg-neutral">${bestStreak}<span class="sg-unit"> ${tx('days','أيام')}</span></div>
    <div class="sg-sub">${tx('this period','هذه الفترة')}</div>
  </div>
</div>`;
```

- [ ] **Step 4: Verify in browser console**

Open the app, go to Stats → Nutrition tab. Open DevTools console and run:

```js
// Should log 4 numbers without errors
const t = window._calcNutritionTargetsForStats ? window._calcNutritionTargetsForStats() : null;
console.log('targets:', t);
// Then switch period filter and back — no JS errors should appear
```

Also visually confirm:
- Stats grid shows 8 cards (2 columns × 4 rows)
- Protein Days shows `X / Y` format
- Deficit Days shows `X / Y` format
- Current Streak shows amber color if ≥ 3 days, or `—` if 0
- Best Streak shows a number

- [ ] **Step 5: Commit**

```bash
git add js/dashboard-history.js
git commit -m "feat(js): add protein days, deficit days, streak cards (v45)"
```

---

## Chunk 2: Version Bump

### Task 2: Bump to v45

**Files:**
- Modify: `js/config.js` (lines 8–9)
- Modify: `sw.js` (line 3)

- [ ] **Step 1: Update `js/config.js`**

Find:
```js
window.FORGE_VERSION = 'v44';
window.FORGE_BUILD   = '2026-03-12 (nutrition charts)';
```

Replace with:
```js
window.FORGE_VERSION = 'v45';
window.FORGE_BUILD   = '2026-03-12 (nutrition streaks)';
```

- [ ] **Step 2: Update `sw.js`**

Find:
```js
const CACHE_NAME = 'forge-v44';
```

Replace with:
```js
const CACHE_NAME = 'forge-v45';
```

- [ ] **Step 3: Verify**

Hard-refresh the app (Ctrl+Shift+R). Open DevTools → Application → Service Workers. Confirm the new SW with `forge-v45` cache activates. No console errors.

- [ ] **Step 4: Commit and push**

```bash
git add js/config.js sw.js
git commit -m "chore: bump to v45 (nutrition streaks)"
git push
```

---

## Verification Checklist

After both tasks complete:

1. Stats → Nutrition tab renders 8 stat cards (no layout breakage)
2. Protein Days card: shows logged days ≥ 90% protein / total logged days
3. Deficit Days card: shows logged days below kcal target / total logged days
4. Current Streak: reads `mealsLog` directly (changing period filter does NOT change streak)
5. Current Streak: amber `#e6b84a` when ≥ 3 days; neutral when < 3; `—` when 0
6. Best Streak: changes when period filter changes (uses `daily`)
7. No JS console errors on tab switch or period change
8. SW cache name is `forge-v45`
