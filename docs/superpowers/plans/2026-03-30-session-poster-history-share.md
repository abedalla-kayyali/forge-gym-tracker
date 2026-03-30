# Session Poster Premium Enhancement & History Share — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the post-session performance poster with premium visuals, persist session summaries to localStorage, and add a "Share Poster" button to each date group in the History tab.

**Architecture:** `index.html` gains session summary persistence + premium body map SVG; `js/share-helpers.js` gains optional `summaryOverride` param propagated through the generation chain plus two new history functions; `js/dashboard-history.js` adds a share button to each session-card header.

**Tech Stack:** Vanilla JS, Canvas 2D API, inline SVG with radialGradient, localStorage

---

## File Map

| File | Change |
|------|--------|
| `index.html:2828–2857` | Replace `_buildSessionBodyMapSVG` — add radial gradient glow, 3-layer paths |
| `index.html:2895–2934` | After `_lastSessionSummary` assignment: persist to localStorage + prune |
| `js/share-helpers.js:168` | `_drawSessionShareCard(summaryOverride=null)` — param + premium canvas |
| `js/share-helpers.js:407` | `renderSessionSharePreview(summaryOverride=null)` — pass-through |
| `js/share-helpers.js:420` | `_ensureSessionShareCanvas(summaryOverride=null)` — pass-through |
| `js/share-helpers.js` (append) | Add `_getSessionSummaryForDate` + `shareSessionFromHistory` |
| `js/dashboard-history.js:3186–3193` | Add share button inside `.session-header` |
| `css/main.css` (append) | Add `.hist-share-btn` rule |

---

## Task 1: Persist session summary to localStorage

**Files:**
- Modify: `index.html:2884–2934`

After `_lastSessionSummary = { ... }` is assigned (line 2884–2895), add storage + pruning code before the existing `renderSessionSharePreview` call.

- [ ] **Step 1: Add localStorage save + prune after `_lastSessionSummary` assignment**

In `index.html`, find the block ending with `prCount` (around line 2895). The code currently looks like:
```js
  _lastSessionSummary = {
    dateStr,
    timeStr,
    durStr,
    muscles: [...muscles],
    logs: [...logs],
    totalSets,
    totalVol,
    totalBwReps,
    totalCardioMins,
    prCount
  };
```

Immediately after that closing `};`, add:
```js
  // Persist session summary for history share
  try {
    const _ssNow = new Date();
    const _ssHH = String(_ssNow.getHours()).padStart(2, '0');
    const _ssMM = String(_ssNow.getMinutes()).padStart(2, '0');
    const _ssDateKey = _ssNow.toISOString().slice(0, 10);
    const _ssStoreKey = 'forge_session_' + _ssDateKey + '_' + _ssHH + '-' + _ssMM;
    localStorage.setItem(_ssStoreKey, JSON.stringify(_lastSessionSummary));
    // Prune: keep only 60 most recent session summaries
    const _ssAllKeys = [];
    for (let _i = 0; _i < localStorage.length; _i++) {
      const _k = localStorage.key(_i);
      if (_k && _k.startsWith('forge_session_')) _ssAllKeys.push(_k);
    }
    if (_ssAllKeys.length > 60) {
      _ssAllKeys.sort();
      _ssAllKeys.slice(0, _ssAllKeys.length - 60).forEach(_k => localStorage.removeItem(_k));
    }
  } catch (e) {}
```

- [ ] **Step 2: Manual verify**

Open the app in a browser. Start a session, log one exercise, end the session.
Open DevTools → Application → Local Storage.
Confirm a key like `forge_session_2026-03-30_19-32` exists with a valid JSON object containing `durStr`, `muscles`, `logs`, `prCount`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: persist session summary to localStorage on session end"
```

---

## Task 2: Premium body map SVG

**Files:**
- Modify: `index.html:2828–2857`

Replace `_buildSessionBodyMapSVG` with a version that renders each active muscle as 3 stacked paths (outer glow → gradient fill → inner highlight) and improves the head silhouette.

- [ ] **Step 1: Replace `_buildSessionBodyMapSVG` in `index.html`**

Find the function (lines 2828–2857). Replace the entire function body with:

```js
function _buildSessionBodyMapSVG(muscles, side) {
  const FRONT_ZONES = [
    ['Traps',     'M68 68 Q60 68 55 70 L63 90 Q63 76 68 68 Z M132 68 Q140 68 145 70 L137 90 Q137 76 132 68 Z'],
    ['Chest',     'M68 68 Q64 72 63 88 L63 120 Q75 128 100 130 Q125 128 137 120 L137 88 Q136 72 132 68 Q118 62 100 61 Q82 62 68 68 Z'],
    ['Shoulders', 'M55 68 Q44 72 42 86 Q40 100 48 108 Q55 115 63 110 L63 88 Q62 74 68 68 Z M145 68 Q156 72 158 86 Q160 100 152 108 Q145 115 137 110 L137 88 Q138 74 132 68 Z'],
    ['Biceps',    'M42 108 Q36 114 35 130 Q34 146 40 152 Q47 157 55 152 Q62 147 63 132 L63 110 Q55 115 48 108 Z M158 108 Q164 114 165 130 Q166 146 160 152 Q153 157 145 152 Q138 147 137 132 L137 110 Q145 115 152 108 Z'],
    ['Triceps',   'M40 152 Q34 157 33 168 Q33 178 38 182 Q44 186 52 183 Q58 180 59 170 Q60 160 55 156 Q48 155 40 152 Z M160 152 Q166 157 167 168 Q167 178 162 182 Q156 186 148 183 Q142 180 141 170 Q140 160 145 156 Q152 155 160 152 Z'],
    ['Forearms',  'M33 180 Q31 192 31 206 Q32 218 38 224 Q45 228 52 224 Q58 220 59 208 Q59 196 59 184 Q52 186 44 184 Q38 183 33 180 Z M167 180 Q169 192 169 206 Q168 218 162 224 Q155 228 148 224 Q142 220 141 208 Q141 196 141 184 Q148 186 156 184 Q162 183 167 180 Z'],
    ['Core',      'M64 120 Q65 150 66 170 L134 170 Q135 150 136 120 Q125 128 100 130 Q75 128 64 120 Z'],
    ['Legs',      'M60 172 L60 174 Q58 202 57 232 Q55 258 57 280 Q61 294 73 296 Q85 298 87 282 Q91 258 91 232 L91 172 Z M140 172 L140 174 Q142 202 143 232 Q145 258 143 280 Q139 294 127 296 Q115 298 113 282 Q109 258 109 232 L109 172 Z'],
    ['Calves',    'M57 294 Q54 314 56 334 Q58 352 65 366 Q70 376 77 376 Q84 376 86 366 Q90 350 90 332 Q90 312 87 296 Q85 298 73 296 Q61 294 57 294 Z M143 294 Q146 314 144 334 Q142 352 135 366 Q130 376 123 376 Q116 376 114 366 Q110 350 110 332 Q110 312 113 296 Q115 298 127 296 Q139 294 143 294 Z']
  ];
  const BACK_ZONES = [
    ['Traps',      'M68 68 Q82 62 100 61 Q118 62 132 68 L134 90 Q100 95 66 90 Z'],
    ['Back',       'M66 90 L134 90 L136 172 L64 172 Z'],
    ['Shoulders',  'M55 68 Q44 72 42 86 Q40 100 48 108 L63 110 L63 88 Q62 74 68 68 Z M145 68 Q156 72 158 86 Q160 100 152 108 L137 110 L137 88 Q138 74 132 68 Z'],
    ['Triceps',    'M42 108 Q36 114 35 130 Q34 146 40 152 Q47 157 55 152 Q62 147 63 132 L63 110 Z M158 108 Q164 114 165 130 Q166 146 160 152 Q153 157 145 152 Q138 147 137 132 L137 110 Z'],
    ['Lower Back', 'M68 160 L132 160 L132 190 L68 190 Z'],
    ['Glutes',     'M64 170 L136 170 L136 230 Q100 238 64 230 Z'],
    ['Legs',       'M64 230 Q60 260 58 290 L92 290 Q91 260 91 230 Z M136 230 Q140 260 142 290 L108 290 Q109 260 109 230 Z'],
    ['Calves',     'M58 290 Q54 320 57 350 Q62 370 77 372 Q90 370 92 348 Q92 318 92 290 Z M142 290 Q146 320 143 350 Q138 370 123 372 Q110 370 108 348 Q108 318 108 290 Z']
  ];
  const zones = side === 'back' ? BACK_ZONES : FRONT_ZONES;

  // Build unique gradient defs per muscle per side (avoid ID collisions in DOM)
  const gradId = (name) => 'bm-rg-' + side + '-' + name.replace(/ /g, '-').toLowerCase();
  const activeMuscles = zones.filter(([name]) => muscles.has(name));

  const defs = activeMuscles.length ? `<defs>${activeMuscles.map(([name]) => {
    const id = gradId(name);
    return `<radialGradient id="${id}" cx="50%" cy="40%" r="60%" fx="50%" fy="35%">` +
      `<stop offset="0%" stop-color="#39ff8f" stop-opacity="1"/>` +
      `<stop offset="60%" stop-color="#1adb6e" stop-opacity="0.85"/>` +
      `<stop offset="100%" stop-color="#0d4a2a" stop-opacity="0.7"/>` +
      `</radialGradient>`;
  }).join('')}</defs>` : '';

  const paths = zones.map(([name, d]) => {
    const active = muscles.has(name);
    if (!active) {
      return `<path d="${d}" fill="#162a1c" stroke="#1e3a24" stroke-width=".8" opacity=".55"/>`;
    }
    const id = gradId(name);
    // Layer 1: outer glow
    const glow = `<path d="${d}" fill="none" stroke="rgba(57,255,143,0.45)" stroke-width="4" opacity=".6"/>`;
    // Layer 2: gradient fill
    const fill = `<path d="${d}" fill="url(#${id})" stroke="rgba(57,255,143,0.7)" stroke-width="1" opacity=".92"/>`;
    // Layer 3: inner highlight
    const highlight = `<path d="${d}" fill="none" stroke="rgba(200,255,220,0.35)" stroke-width=".6" opacity=".8"/>`;
    return glow + fill + highlight;
  }).join('');

  // Premium head + neck silhouette
  const sil = `<ellipse cx="100" cy="30" rx="19" ry="23" fill="#162a1c" stroke="#223d28" stroke-width=".8" opacity=".6"/>` +
    `<rect x="91" y="50" width="18" height="14" rx="4" fill="#162a1c" stroke="#223d28" stroke-width=".8" opacity=".6"/>`;

  return `<svg viewBox="0 0 200 410" width="90" height="185" xmlns="http://www.w3.org/2000/svg">${defs}${sil}${paths}</svg>`;
}
```

- [ ] **Step 2: Manual verify**

End a session with Chest + Triceps exercises. In the workout summary overlay, the BODY MAP should show:
- Chest region with a bright green radial glow (bright center, darker edge)
- Triceps highlighted front + back
- Inactive muscles in darker `#162a1c` (slightly more visible than before)
- Smoother head/neck silhouette

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: premium body map SVG with radial gradient glow and 3-layer muscle paths"
```

---

## Task 3: Decouple `_drawSessionShareCard` from global — add `summaryOverride`

**Files:**
- Modify: `js/share-helpers.js:168`, `js/share-helpers.js:407`, `js/share-helpers.js:420`

Add the `summaryOverride = null` parameter to all three canvas generation functions and propagate it through the call chain.

- [ ] **Step 1: Update `_drawSessionShareCard` signature (line 168)**

Change:
```js
async function _drawSessionShareCard() {
  const s = (typeof _lastSessionSummary !== 'undefined' && _lastSessionSummary) || null;
```
To:
```js
async function _drawSessionShareCard(summaryOverride = null) {
  const s = summaryOverride || (typeof _lastSessionSummary !== 'undefined' && _lastSessionSummary) || null;
```

- [ ] **Step 2: Update `renderSessionSharePreview` signature (line 407)**

Find `async function renderSessionSharePreview()`. Change to:
```js
async function renderSessionSharePreview(summaryOverride = null) {
  const source = await _drawSessionShareCard(summaryOverride);
```
(The rest of the function body is unchanged — it draws source onto the target canvas.)

- [ ] **Step 3: Update `_ensureSessionShareCanvas` signature (line 420)**

Find `async function _ensureSessionShareCanvas()`. Change to:
```js
async function _ensureSessionShareCanvas(summaryOverride = null) {
  const rendered = await renderSessionSharePreview(summaryOverride);
  if (rendered) return rendered;
  return await _drawSessionShareCard(summaryOverride);
}
```

- [ ] **Step 4: Manual verify**

End a session and click Share / Download. Confirm the poster still generates correctly (no regression — existing callers pass no argument and the default `null` falls through to `_lastSessionSummary`).

- [ ] **Step 5: Commit**

```bash
git add js/share-helpers.js
git commit -m "refactor: add summaryOverride param to poster generation chain"
```

---

## Task 4: Premium canvas poster styling

**Files:**
- Modify: `js/share-helpers.js:168–406` (the body of `_drawSessionShareCard`)

Five targeted enhancements inside `_drawSessionShareCard`. Edit each section by finding the relevant existing code and modifying it.

- [ ] **Step 1: Diagonal grid texture overlay (after background fill)**

After the two `ctx.fillRect(0, 0, W, H)` glow calls (around line ~220), add:
```js
  // Diagonal grid texture
  ctx.save();
  ctx.strokeStyle = 'rgba(84,255,171,0.02)';
  ctx.lineWidth = 1;
  for (let gx = -H; gx < W + H; gx += 12) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + H, H); ctx.stroke();
  }
  ctx.restore();
```

- [ ] **Step 2: Stats card accent glow (DURATION and VOLUME)**

Find the stats card drawing loop. It iterates over `cards` array and calls `ctx.fillText` for the value. After setting `ctx.fillStyle` for accent values, add shadow before the value text and reset after:

```js
  // Inside the cards.forEach loop, before drawing card value text:
  if (card.accent) {
    ctx.shadowColor = '#39ff8f';
    ctx.shadowBlur = 14;
  }
  ctx.fillText(card.value, ...);  // existing line
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
```

- [ ] **Step 3: Enlarge body map SVGs and update panel layout**

Find these lines (around 238–268) and update them:
```js
  // Change leftW from 320 to 360
  const leftW = 360;   // was 320

  // Change rightX from 410 to 450
  const rightX = 450;  // was 410

  // Change SVG render sizes from 130×300 to 160×370
  if (frontImg) ctx.drawImage(frontImg, leftX + 18, leftY + 46, 160, 320);  // was 130,300
  if (backImg)  ctx.drawImage(backImg,  leftX + 192, leftY + 46, 160, 320); // was 170,56,130,300

  // Add rule lines before FRONT / BACK labels
  ctx.strokeStyle = 'rgba(84,255,171,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(leftX + 18, leftY + 375); ctx.lineTo(leftX + 18 + 40, leftY + 375); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(leftX + 192, leftY + 375); ctx.lineTo(leftX + 192 + 40, leftY + 375); ctx.stroke();

  ctx.fillText('FRONT', leftX + 28, leftY + 390);   // adjusted x
  ctx.fillText('BACK',  leftX + 202, leftY + 390);  // adjusted x
```

- [ ] **Step 4: PR Hits amber glow + uncapped exercise names**

Find the PR Hits box drawing code (around line 313–325). Before `_roundRect` for the PR box, add the glow shadow when `prCount > 0`:
```js
  if ((s.prCount || 0) > 0) {
    ctx.shadowColor = 'rgba(255,180,0,0.5)';
    ctx.shadowBlur = 22;
  }
  _roundRect(ctx, rightX + 18, rightY + 288, rightW - 36, 112, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
```

Remove the existing `prItems.slice(0, 3)` cap — change to show all PR names (wrapped by `_wrapText`):
```js
  // Find: const prText = prItems.length ? prItems.slice(0, 3).join(' | ') : 'No PR this session';
  // Replace with:
  const prText = prItems.length ? prItems.join(' | ') : 'No PR this session';
```

- [ ] **Step 5: PR badge gradient + footer separator + diamond**

**PR badge** — find the `ctx.fillStyle = 'rgba(255,214,102,.22)'` / `'#ffd666'` block for the PR tag in session breakdown (around line 355–365). Replace the flat gold fill with a gradient:
```js
  // Replace the flat ctx.fillStyle = '#ffd666' for 'PR' text with:
  const _prGrad = ctx.createLinearGradient(listX + listW - 106, 0, listX + listW - 24, 0);
  _prGrad.addColorStop(0, '#ffd666');
  _prGrad.addColorStop(1, '#ffaa00');
  ctx.fillStyle = _prGrad;
```

**Footer** — find `ctx.fillText('Built with FORGE...` near the bottom. Before it, add:
```js
  // Separator rule
  ctx.strokeStyle = 'rgba(84,255,171,.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(70, H - 52); ctx.lineTo(W - 70, H - 52); ctx.stroke();

  // Diamond mark + text (replace existing fillText)
  ctx.fillStyle = 'rgba(211,228,216,.58)';
  ctx.font = '500 18px "DM Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('◆ Built with FORGE | #ForgeSession | ' + new Date().toISOString().slice(0, 10), W - 70, H - 28);
  ctx.textAlign = 'left';
  // Remove or comment out the old fillText line for the footer
```

- [ ] **Step 6: Manual verify**

End a session with at least 1 PR. Share/download the poster. Confirm:
- Faint diagonal lines visible across the background
- DURATION value has a green glow
- Body map SVGs are larger
- PR Hits box has an amber glow behind it
- Footer has the diamond mark and separator line

- [ ] **Step 7: Commit**

```bash
git add js/share-helpers.js
git commit -m "feat: premium canvas poster — grid texture, glow, enlarged body map, amber PR glow"
```

---

## Task 5: Add history session resolution + `shareSessionFromHistory`

**Files:**
- Modify: `js/share-helpers.js` (append to end of file, before or after `downloadShareCard`)

- [ ] **Step 1: Append `_getSessionSummaryForDate` to `share-helpers.js`**

```js
function _getSessionSummaryForDate(isoDate) {
  // 1. Check localStorage for a stored summary (most recent match wins)
  const prefix = 'forge_session_' + isoDate + '_';
  const matchingKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) matchingKeys.push(k);
  }
  if (matchingKeys.length) {
    matchingKeys.sort().reverse(); // descending → most recent first
    try { return JSON.parse(localStorage.getItem(matchingKeys[0])); } catch (e) {}
  }

  // 2. Reconstruct from workouts array (fallback for old sessions)
  const allW = typeof workouts !== 'undefined' ? workouts : [];
  const dayW = allW.filter(w => {
    const d = new Date(w.date || w.id);
    return !isNaN(d) && d.toISOString().slice(0, 10) === isoDate;
  });
  if (!dayW.length) return null;

  const muscles = [...new Set(dayW.map(w => w.muscle).filter(Boolean))];
  const logs = dayW.map(w => ({
    exercise: w.exercise || '',
    muscle: w.muscle || '',
    mode: 'weighted',
    sets: Array.isArray(w.sets) ? w.sets : [],
    volume: w.totalVolume || 0,
    isPR: !!(w.isPR || w.pr)
  }));
  const totalSets = dayW.reduce((a, w) => a + (Array.isArray(w.sets) ? w.sets.length : 0), 0);
  const totalVol  = dayW.reduce((a, w) => a + (w.totalVolume || 0), 0);
  const prCount   = dayW.filter(w => w.isPR || w.pr).length;
  const d = new Date(isoDate + 'T12:00:00');
  return {
    dateStr: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    timeStr: '--:--',
    durStr:  '--:--',
    muscles,
    logs,
    totalSets,
    totalVol,
    totalBwReps:      0,
    totalCardioMins:  0,
    prCount
  };
}
```

- [ ] **Step 2: Append `shareSessionFromHistory` to `share-helpers.js`**

```js
async function shareSessionFromHistory(isoDate) {
  const summary = _getSessionSummaryForDate(isoDate);
  if (!summary) {
    if (typeof showToast === 'function') showToast('No session data for this date', 'var(--warn)');
    return;
  }
  const canvas = await _drawSessionShareCard(summary);
  if (!canvas) return;
  const blob = await _canvasToBlob(canvas);
  if (!blob) return;
  const fname = 'forge-session-' + isoDate + '.png';
  const file = new File([blob], fname, { type: 'image/png' });
  const canShareFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  if (navigator.share && canShareFile) {
    try { await navigator.share({ title: 'FORGE Session', text: 'Session complete. Built with FORGE.', files: [file] }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  _downloadBlob(blob, fname);
  if (typeof showToast === 'function') showToast('Session poster ready', 'var(--accent)');
}
```

- [ ] **Step 3: Manual verify**

Open DevTools console and run:
```js
const s = _getSessionSummaryForDate('2026-03-24'); // use a date you have history for
console.log(s);
```
Confirm the returned object has `muscles`, `logs`, `totalVol`, `prCount` populated.

- [ ] **Step 4: Commit**

```bash
git add js/share-helpers.js
git commit -m "feat: add _getSessionSummaryForDate + shareSessionFromHistory for history poster sharing"
```

---

## Task 6: History share button in date group header

**Files:**
- Modify: `js/dashboard-history.js:3185–3193`

- [ ] **Step 1: Add share button inside `.session-header`**

Find the session card HTML template (around line 3185). The current header is:
```js
    return `<div class="session-card">
      <div class="session-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="session-date">${dateStr}</div>
        <div class="session-chips">${muscleChips}</div>
        <div class="session-summary">${volStr}${totalSets} sets${prBadge ? ' • ' : ' '}${prBadge}</div>
        <div class="session-arrow">${_histSvgIcon('chevron', 'session-arrow-icon')}</div>
      </div>
      <div class="session-exs">${exerciseCards}</div>
    </div>`;
```

Replace the `<div class="session-arrow">` line and add the share button before it:
```js
    return `<div class="session-card">
      <div class="session-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="session-date">${dateStr}</div>
        <div class="session-chips">${muscleChips}</div>
        <div class="session-summary">${volStr}${totalSets} sets${prBadge ? ' • ' : ' '}${prBadge}</div>
        <button class="hist-share-btn" type="button" onclick="event.stopPropagation();shareSessionFromHistory('${dateKey}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share</button>
        <div class="session-arrow">${_histSvgIcon('chevron', 'session-arrow-icon')}</div>
      </div>
      <div class="session-exs">${exerciseCards}</div>
    </div>`;
```

Key detail: `event.stopPropagation()` prevents the header's toggle-open click from firing when the share button is clicked.

- [ ] **Step 2: Manual verify**

Open the History tab. Each session date group header should show a small "Share" button aligned right of the session summary. Click it — the card should NOT toggle open/closed. A poster should download or share.

- [ ] **Step 3: Commit**

```bash
git add js/dashboard-history.js
git commit -m "feat: add Share Poster button to history session date group headers"
```

---

## Task 7: CSS for `.hist-share-btn`

**Files:**
- Modify: `css/main.css` (append)

- [ ] **Step 1: Append `.hist-share-btn` rule to `css/main.css`**

```css
/* History session share button */
.hist-share-btn {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: 1px solid rgba(84,255,171,.35);
  border-radius: 7px;
  padding: 5px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
}
.hist-share-btn:hover { background: rgba(84,255,171,.08); border-color: rgba(84,255,171,.6); }
.hist-share-btn:active { opacity: .7; }
```

- [ ] **Step 2: Manual verify**

In the History tab, the Share button should match the `.hist-sort-btn` style: DM Mono font, green border, transparent background, no overflow. On hover it should show a subtle green tint.

- [ ] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "feat: add .hist-share-btn CSS rule"
```

---

## Task 8: Full end-to-end verify

- [ ] **Step 1: Post-session share (regression check)**
  - End a session. The workout summary overlay appears with the premium body map.
  - Active muscles show radial glow. Inactive muscles are visible but dark.
  - Click "Share" → poster downloads/shares. Confirm premium styling: diagonal texture, accent glow on DURATION/VOLUME, amber PR Hits glow (if PRs hit), diamond footer.

- [ ] **Step 2: History share — stored session**
  - Navigate to History tab.
  - Find today's session date group header. Click "Share".
  - Confirm poster shows correct `durStr` (e.g. `67:44`) — data came from localStorage.

- [ ] **Step 3: History share — reconstructed session (old data)**
  - Find a date group from before this feature was deployed (no stored summary).
  - Click "Share". Confirm poster generates with `durStr: --:--` and correct exercises, muscles, volume.

- [ ] **Step 4: Two sessions same day**
  - Check localStorage for any date with two `forge_session_` keys. Confirm the "Share" button returns the most recent one (latest HH-MM suffix).

- [ ] **Step 5: No data edge case**
  - In console: `shareSessionFromHistory('1990-01-01')`.
  - Confirm toast "No session data for this date" appears and no crash.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(v243): premium session poster + history share — glow body map, localStorage persistence, per-session Share button in History"
```
