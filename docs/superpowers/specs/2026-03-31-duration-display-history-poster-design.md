# Duration Display — History & Poster Design Spec

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display per-exercise `durationSecs` (already persisted in `workouts[]`, `bwWorkouts[]`, and `_sessionWkLogs[]`) in the session poster exercise rows, the muscle history panel, and the full History tab exercise cards.

**Architecture:** Three targeted edits — one in `share-helpers.js` (`_fmtExerciseMeta`), one in `index.html` (`renderMuscleHistory` + `mhShowAll`), one in `dashboard-history.js` (`_buildExCard`). No new data fetching, no schema changes. Backward-compatible: `durationSecs = 0` or missing → silent no-op.

**Tech Stack:** Vanilla JS (index.html, dashboard-history.js, share-helpers.js)

---

## 1. Duration Format

All three surfaces use the same inline format:

```
M:SS   (e.g. 1:23, 0:45, 12:03)
```

Computed as:
```js
Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0')
```

Only render when `durationSecs > 0`. Entries with `durationSecs = 0` or missing (logged before the timer was introduced) are silently skipped — no "N/A", no empty space.

---

## 2. Poster — `_fmtExerciseMeta` (`js/share-helpers.js`)

**Current output (weighted):**
```
"3 sets | 80kg × 10 | 70kg × 8"
```

**New output when durationSecs > 0:**
```
"3 sets | 80kg × 10 | 70kg × 8 | 1:23"
```

**Change:** Append the formatted duration string as the last element in the `filter(Boolean).join(' | ')` array for both the `weighted` and `bodyweight` branches of `_fmtExerciseMeta`.

### Weighted branch (currently line ~135):
```js
// Before:
return [setCount + ' sets', setsStr].filter(Boolean).join(' | ');

// After:
const durStr = log.durationSecs > 0
  ? Math.floor(log.durationSecs / 60) + ':' + String(log.durationSecs % 60).padStart(2, '0')
  : null;
return [setCount + ' sets', setsStr, durStr].filter(Boolean).join(' | ');
```

### Bodyweight branch (currently line ~147):
```js
// Before:
return [sets.length + ' sets', top, repText].filter(Boolean).join(' | ');

// After:
const durStr = log.durationSecs > 0
  ? Math.floor(log.durationSecs / 60) + ':' + String(log.durationSecs % 60).padStart(2, '0')
  : null;
return [sets.length + ' sets', top, repText, durStr].filter(Boolean).join(' | ');
```

> **Note:** `log` objects in `_fmtExerciseMeta` come from `_sessionWkLogs[]` for the poster, and from `workouts[]` / `bwWorkouts[]` for any other caller. All three arrays now carry `durationSecs`.

---

## 3. Muscle History Panel — `index.html`

`renderMuscleHistory` (line ~3957) and `mhShowAll` (line ~4014) both render `.mh-session` cards with this header structure:

```html
<div class="mh-session-header">
  <span class="mh-session-date">...</span>
  <div style="display:flex;align-items:center;gap:8px;">
    ${w.isPR ? '<span class="mh-session-pr">...</span>' : ''}
    <span class="mh-session-vol">Vol: ${vol}${unit}</span>
  </div>
</div>
```

**Change:** Compute `durTag` before the template literal and append it inside the flex div, after the vol span:

```js
const durTag = (w.durationSecs > 0)
  ? `<span class="mh-session-dur">⏱ ${Math.floor(w.durationSecs / 60)}:${String(w.durationSecs % 60).padStart(2, '0')}</span>`
  : '';
```

Updated flex div:
```html
<div style="display:flex;align-items:center;gap:8px;">
  ${w.isPR ? '<span class="mh-session-pr">...</span>' : ''}
  <span class="mh-session-vol">Vol: ${vol}${unit}</span>
  ${durTag}
</div>
```

This change must be applied in **both** `renderMuscleHistory` (the `shown.forEach` loop, around line 3964) and `mhShowAll` (the `exSessions.forEach` loop, around line 4020).

### CSS for `.mh-session-dur` (append to `css/main.css`):
```css
.mh-session-dur {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: rgba(84,255,171,0.75);
  letter-spacing: 0.04em;
}
```

---

## 4. Full History Tab — `_buildExCard` (`js/dashboard-history.js`)

`_buildExCard(w)` builds `.hist-item` cards. `w` is a `workouts[]` or `bwWorkouts[]` entry — both now carry `durationSecs`.

**Change:** Compute `durStat` before both the BW and weighted template literals, and inject it into `.hist-stats` before the closing `</div>`.

```js
const durStat = (w.durationSecs > 0)
  ? `<div><div class="hist-stat-val">${Math.floor(w.durationSecs / 60)}:${String(w.durationSecs % 60).padStart(2, '0')}</div><div class="hist-stat-lbl">Time</div></div>`
  : '';
```

**BW path** (currently ends `.hist-stats` at line ~3144):
```html
<div class="hist-stats">
  <div>...</div>  <!-- sets -->
  <div>...</div>  <!-- reps -->
  <div style="font-size:14px;">${effortIcons}</div>
  ${durStat}
</div>
```

**Weighted path** (currently ends `.hist-stats` at line ~3168):
```html
<div class="hist-stats">
  <div>...</div>  <!-- sets -->
  <div>...</div>  <!-- maxW -->
  ${trendArrow ? `<div class="trend-arrow ${trendClass}">${trendArrow}</div>` : ''}
  ${_qBadge}
  ${durStat}
</div>
```

---

## 5. Out of Scope

- Session-level total duration aggregation across exercises
- Duration displayed in the poster's top stat bar (already shows session-level `durStr`)
- Duration editing or manual override
- Sorting / filtering history by duration
