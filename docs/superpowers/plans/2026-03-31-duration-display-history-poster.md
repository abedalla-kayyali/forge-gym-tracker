# Duration Display — History & Poster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display per-exercise `durationSecs` in the session poster exercise rows, the muscle history panel, and the full History tab exercise cards.

**Architecture:** Three surgical edits — `_fmtExerciseMeta` in `share-helpers.js` appends formatted duration to the meta string; `renderMuscleHistory` and `mhShowAll` in `index.html` add a duration tag to each session header; `_buildExCard` in `dashboard-history.js` adds a duration stat block. All surfaces guard on `durationSecs > 0` for backward compatibility. CSS for the new `.mh-session-dur` class appended to `css/main.css`.

**Tech Stack:** Vanilla JS, inline HTML templates, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-31-duration-display-history-poster-design.md`

---

## File Map

| File | Change |
|---|---|
| `js/share-helpers.js` | Add `durStr` to `_fmtExerciseMeta` return value (weighted + BW branches) |
| `index.html` | Add `durTag` to session header in `renderMuscleHistory` (~line 3964) and `mhShowAll` (~line 4020) |
| `js/dashboard-history.js` | Add `durStat` block to `.hist-stats` in `_buildExCard` (BW + weighted paths) |
| `css/main.css` | Append `.mh-session-dur` rule |

---

## Task 1: Poster — `_fmtExerciseMeta` in `share-helpers.js`

**Files:**
- Modify: `js/share-helpers.js` (lines 114–154 — `_fmtExerciseMeta`)

This is a vanilla JS project with no automated test suite. Verification is by loading `index.html` in a browser and inspecting output.

- [ ] **Step 1: Add `durStr` to the weighted branch of `_fmtExerciseMeta`**

  In `js/share-helpers.js`, find the weighted branch of `_fmtExerciseMeta` (around line 133–135). Currently:
  ```js
      const setCount = use.length || sets.length;
      const setsStr = grouped.map(g => g.count > 1 ? (g.count + '× ' + g.label) : g.label).join(' | ');
      return [setCount + ' sets', setsStr].filter(Boolean).join(' | ');
  ```
  Replace the return statement with:
  ```js
      const setCount = use.length || sets.length;
      const setsStr = grouped.map(g => g.count > 1 ? (g.count + '× ' + g.label) : g.label).join(' | ');
      const durStr = log.durationSecs > 0
        ? Math.floor(log.durationSecs / 60) + ':' + String(log.durationSecs % 60).padStart(2, '0')
        : null;
      return [setCount + ' sets', setsStr, durStr].filter(Boolean).join(' | ');
  ```

- [ ] **Step 2: Add `durStr` to the bodyweight branch of `_fmtExerciseMeta`**

  In the bodyweight branch (around line 140–148). Currently:
  ```js
      const reps = Number(log.totalReps) || 0;
      const repText = reps > 0 ? (reps + ' reps total') : '';
      return [sets.length + ' sets', top, repText].filter(Boolean).join(' | ');
  ```
  Replace the return statement with:
  ```js
      const reps = Number(log.totalReps) || 0;
      const repText = reps > 0 ? (reps + ' reps total') : '';
      const durStr = log.durationSecs > 0
        ? Math.floor(log.durationSecs / 60) + ':' + String(log.durationSecs % 60).padStart(2, '0')
        : null;
      return [sets.length + ' sets', top, repText, durStr].filter(Boolean).join(' | ');
  ```

- [ ] **Step 3: Verify in browser**

  1. Log a weighted exercise (with timer running — add a set, wait 5s, press LOG WORKOUT).
  2. Open the session poster. The exercise row meta line should end with `| 0:05` (or similar).
  3. For an old entry with no `durationSecs`: meta line should show as before, no trailing `| `.
  4. No console errors.

- [ ] **Step 4: Commit**

  ```bash
  git add js/share-helpers.js
  git commit -m "feat(duration): show per-exercise duration in poster meta line"
  ```

---

## Task 2: Muscle history panel — `renderMuscleHistory` + `mhShowAll` + CSS

**Files:**
- Modify: `index.html` (two locations: `renderMuscleHistory` shown.forEach ~line 3957; `mhShowAll` exSessions.forEach ~line 4014)
- Modify: `css/main.css` (append at end)

> **Critical:** This change must be applied in **both** `renderMuscleHistory` and `mhShowAll`. They are separate functions with duplicate HTML templates. Missing one means "Show All" sessions display no duration.

- [ ] **Step 1: Add `durTag` to `renderMuscleHistory` shown.forEach**

  In `index.html`, find the `shown.forEach` loop inside `renderMuscleHistory` (around line 3957). Each iteration builds a `.mh-session` card. Find this part of the template (around line 3964–3968):
  ```js
        const dateStr = new Date(w.date).toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
        const vol = Math.round(w.totalVolume);
        const maxW = Math.max(...w.sets.map(s => s.weight));
        const unit = w.sets[0]?.unit || 'kg';
        html += `<div class="mh-session">
          <div class="mh-session-header">
            <span class="mh-session-date">...</span>
            <div style="display:flex;align-items:center;gap:8px;">
              ${w.isPR ? '<span class="mh-session-pr">...</span>' : ''}
              <span class="mh-session-vol">Vol: ${vol}${unit}</span>
            </div>
          </div>
  ```
  Add `durTag` computation immediately after the `unit` declaration:
  ```js
        const durTag = (w.durationSecs > 0)
          ? `<span class="mh-session-dur">⏱ ${Math.floor(w.durationSecs / 60)}:${String(w.durationSecs % 60).padStart(2, '0')}</span>`
          : '';
  ```
  Then append `${durTag}` inside the flex div, after the vol span:
  ```html
              <span class="mh-session-vol">Vol: ${vol}${unit}</span>
              ${durTag}
  ```

- [ ] **Step 2: Apply identical change to `mhShowAll`**

  In `index.html`, find the `exSessions.forEach` loop inside `mhShowAll` (around line 4014). It has the same template structure. Apply the exact same `durTag` addition:

  Add after `const unit = w.sets[0]?.unit || 'kg';`:
  ```js
      const durTag = (w.durationSecs > 0)
        ? `<span class="mh-session-dur">⏱ ${Math.floor(w.durationSecs / 60)}:${String(w.durationSecs % 60).padStart(2, '0')}</span>`
        : '';
  ```
  And append `${durTag}` inside the flex div after the vol span:
  ```html
          <span class="mh-session-vol">Vol: ${vol}${unit}</span>
          ${durTag}
  ```

- [ ] **Step 3: Append `.mh-session-dur` CSS to `css/main.css`**

  Append to the very end of `css/main.css`:
  ```css
  .mh-session-dur {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    color: rgba(84,255,171,0.75);
    letter-spacing: 0.04em;
  }
  ```

- [ ] **Step 4: Verify in browser**

  1. Tap a muscle group that has history — the muscle history panel opens.
  2. A session logged with the timer should show `⏱ 1:23` (or whatever the duration was) next to the Vol badge.
  3. Old sessions without `durationSecs` show no duration tag.
  4. Click "SHOW ALL" — duration tags should also appear in the expanded view.
  5. No console errors.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html css/main.css
  git commit -m "feat(duration): show per-exercise duration in muscle history panel"
  ```

---

## Task 3: History tab — `_buildExCard` in `dashboard-history.js`

**Files:**
- Modify: `js/dashboard-history.js` (lines 3127–3170 — `_buildExCard` function)

> **Critical:** `_buildExCard` has two separate code paths — one for bodyweight (`isBW` branch, lines ~3130–3146) and one for weighted (lines ~3148–3170). `durStat` must be added to **both** `.hist-stats` divs.

- [ ] **Step 1: Compute `durStat` and add to both paths in `_buildExCard`**

  In `js/dashboard-history.js`, find `function _buildExCard(w)` (around line 3127). At the very top of the function body (before the `isBW` check), add:
  ```js
    const durStat = (w.durationSecs > 0)
      ? `<div><div class="hist-stat-val">${Math.floor(w.durationSecs / 60)}:${String(w.durationSecs % 60).padStart(2, '0')}</div><div class="hist-stat-lbl">Time</div></div>`
      : '';
  ```

- [ ] **Step 2: Inject `durStat` into the BW `.hist-stats` div**

  Find the BW return template's `.hist-stats` div (around line 3141–3145):
  ```html
        <div class="hist-stats">
          <div><div class="hist-stat-val">${(w.sets || []).length}</div><div class="hist-stat-lbl">${tFn('history.sets')}</div></div>
          <div><div class="hist-stat-val">${totalReps}</div><div class="hist-stat-lbl">${tFn('history.reps')}</div></div>
          <div style="font-size:14px;">${effortIcons}</div>
        </div>
  ```
  Add `${durStat}` before the closing `</div>`:
  ```html
        <div class="hist-stats">
          <div><div class="hist-stat-val">${(w.sets || []).length}</div><div class="hist-stat-lbl">${tFn('history.sets')}</div></div>
          <div><div class="hist-stat-val">${totalReps}</div><div class="hist-stat-lbl">${tFn('history.reps')}</div></div>
          <div style="font-size:14px;">${effortIcons}</div>
          ${durStat}
        </div>
  ```

- [ ] **Step 3: Inject `durStat` into the weighted `.hist-stats` div**

  Find the weighted return template's `.hist-stats` div (around line 3164–3169):
  ```html
        <div class="hist-stats">
          <div><div class="hist-stat-val">${w.sets.length}</div><div class="hist-stat-lbl">${tFn('history.sets')}</div></div>
          <div><div class="hist-stat-val">${maxW}</div><div class="hist-stat-lbl">Max ${tFn('lbl.kg')}</div></div>
          ${trendArrow ? `<div class="trend-arrow ${trendClass}">${trendArrow}</div>` : ''}
          ${_qBadge}
        </div>
  ```
  Add `${durStat}` after `${_qBadge}` before the closing `</div>`:
  ```html
        <div class="hist-stats">
          <div><div class="hist-stat-val">${w.sets.length}</div><div class="hist-stat-lbl">${tFn('history.sets')}</div></div>
          <div><div class="hist-stat-val">${maxW}</div><div class="hist-stat-lbl">Max ${tFn('lbl.kg')}</div></div>
          ${trendArrow ? `<div class="trend-arrow ${trendClass}">${trendArrow}</div>` : ''}
          ${_qBadge}
          ${durStat}
        </div>
  ```

- [ ] **Step 4: Verify in browser**

  1. Open the History tab.
  2. Expand a session that was logged with the timer. Exercise cards should show a `Time` stat block (e.g., `1:23` / `Time`) alongside Sets and Max Weight.
  3. Bodyweight exercise cards should also show the `Time` block.
  4. Old entries without `durationSecs` show no `Time` block.
  5. No console errors.

- [ ] **Step 5: Commit**

  ```bash
  git add js/dashboard-history.js
  git commit -m "feat(duration): show per-exercise duration in History tab exercise cards"
  ```

---

## Task 4: Version bump and push

**Files:**
- Modify: `js/config.js`
- Modify: `sw.js`

- [ ] **Step 1: Bump version in `js/config.js`**

  Change:
  ```js
  window.FORGE_VERSION = 'v249';
  window.FORGE_BUILD   = '2026-03-31 (feat: per-exercise duration timer)';
  ```
  To:
  ```js
  window.FORGE_VERSION = 'v250';
  window.FORGE_BUILD   = '2026-03-31 (feat: duration display in history and poster)';
  ```

- [ ] **Step 2: Bump cache name in `sw.js`**

  Change:
  ```js
  const CACHE_NAME = 'forge-v249';
  ```
  To:
  ```js
  const CACHE_NAME = 'forge-v250';
  ```

- [ ] **Step 3: Commit and push**

  ```bash
  git add js/config.js sw.js
  git commit -m "chore(v250): bump version — duration display in history and poster"
  git push
  ```
