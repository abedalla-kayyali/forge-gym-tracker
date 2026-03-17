# Progress Proof Card Implementation Plan

> **Status: COMPLETE as of v224 (2026-03-17)**

**Goal:** Build a shareable 1080×1350px Canvas progress card that shows goal-aware stats (weight Δ, BF%, PRs, sessions, streak) over the user's active mesocycle window, triggered from the Progress tab and Sunday prompt.

**Architecture:** New IIFE `js/progress-proof-card.js` handles all data computation, Canvas drawing, modal open/close, share, and download. Reuses Canvas helpers (`_drawPill`, `_roundRect`, `_canvasToBlob`, `_downloadBlob`) from `share-helpers.js` via globals. Modal is a separate `progress-proof-overlay` div in `index.html` — independent of the session card modal.

**Tech Stack:** Vanilla JS IIFE, HTML5 Canvas API, Web Share API, localStorage, `document.fonts.ready`

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `js/progress-proof-card.js` | Full IIFE — data helpers, Canvas draw, modal, share/download, Sunday prompt |
| Modify | `index.html` | Add `<script>` tag, modal HTML, "Share Progress" button |
| Modify | `js/dashboard-history.js` | Call `_progressCardInit()` on Progress tab open |
| Modify | `js/config.js` | Version bump v223 → v224 |

---

## Task 1: Data helpers

**Files:**
- Create: `js/progress-proof-card.js`

- [ ] **Step 1: Create the IIFE shell**

Create `js/progress-proof-card.js` with this skeleton:

```js
(function () {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────

  function _lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (_) { return fallback; }
  }

  // ── data layer ───────────────────────────────────────────────────────────

  function _getWindow() {
    const meso = _lsGet('forge_mesocycle', {});
    const windowStart = meso.startDate || new Date(Date.now() - 30 * 86400000).toISOString();
    const nWeeks = Math.max(1, Math.ceil((Date.now() - new Date(windowStart)) / (7 * 86400000)));
    const phaseLabel = (meso.phase || (typeof userProfile !== 'undefined' && userProfile && userProfile.goal) || 'FORGE').toUpperCase();
    return { windowStart, nWeeks, phaseLabel };
  }

  function _getWeightDelta(windowStart) {
    const bw = (typeof bodyWeight !== 'undefined' ? bodyWeight : [])
      .filter(e => e && e.date && e.weight && e.date >= windowStart)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (bw.length < 2) return null;
    const delta = Number(bw[bw.length - 1].weight) - Number(bw[0].weight);
    const unit = bw[0].unit || 'kg';
    return { delta: Math.round(delta * 10) / 10, unit, current: Number(bw[bw.length - 1].weight) };
  }

  function _getInBodyDelta(windowStart) {
    const tests = _lsGet('forge_inbody_tests', [])
      .filter(t => t && t.date && t.date >= windowStart)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (tests.length < 2) return null;
    const first = tests[0], last = tests[tests.length - 1];
    return {
      bfDelta: last.bf != null && first.bf != null ? Math.round((last.bf - first.bf) * 10) / 10 : null,
      smmDelta: last.smm != null && first.smm != null ? Math.round((last.smm - first.smm) * 10) / 10 : null
    };
  }

  function _getTopPRGains(windowStart) {
    const wos = (typeof workouts !== 'undefined' ? workouts : _lsGet('forge_workouts', []));
    const before = wos.filter(w => w && w.date && w.date < windowStart);
    const inWin  = wos.filter(w => w && w.date && w.date >= windowStart);

    const bestMap = (list) => {
      const m = {};
      list.forEach(w => {
        (w.logs || []).forEach(l => {
          if (l.mode !== 'weighted' || !l.exercise) return;
          const top = Math.max(...(l.sets || []).map(s => Number(s.weight) || 0).filter(v => v > 0));
          if (top > 0 && (m[l.exercise] == null || top > m[l.exercise])) m[l.exercise] = top;
        });
      });
      return m;
    };

    const beforeBest = bestMap(before);
    const winBest    = bestMap(inWin);

    return Object.keys(winBest)
      .filter(ex => beforeBest[ex] != null && winBest[ex] > beforeBest[ex])
      .map(ex => ({
        exercise: ex,
        before: beforeBest[ex],
        after: winBest[ex],
        gain: winBest[ex] - beforeBest[ex],
        pct: Math.round((winBest[ex] - beforeBest[ex]) / beforeBest[ex] * 100)
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }

  function _getSessionCount(windowStart) {
    const wos = (typeof workouts !== 'undefined' ? workouts : _lsGet('forge_workouts', []));
    return wos.filter(w => w && w.date && w.date >= windowStart).length;
  }

  function _getGoal() {
    try { return (typeof userProfile !== 'undefined' && userProfile && userProfile.goal) || 'default'; }
    catch (_) { return 'default'; }
  }

  // ── exports (data layer only for now) ────────────────────────────────────
  window._pcGetWindow       = _getWindow;
  window._pcGetWeightDelta  = _getWeightDelta;
  window._pcGetInBodyDelta  = _getInBodyDelta;
  window._pcGetTopPRGains   = _getTopPRGains;
  window._pcGetSessionCount = _getSessionCount;

}());
```

- [ ] **Step 2: Verify data helpers in browser console**

Open app in browser. Open DevTools console. Run:
```js
const w = _pcGetWindow();
console.log(w); // { windowStart, nWeeks, phaseLabel }
console.log(_pcGetWeightDelta(w.windowStart));   // null or { delta, unit, current }
console.log(_pcGetInBodyDelta(w.windowStart));    // null or { bfDelta, smmDelta }
console.log(_pcGetTopPRGains(w.windowStart));     // array of { exercise, before, after, gain, pct }
console.log(_pcGetSessionCount(w.windowStart));   // number
```
Expected: no errors, correct shapes returned.

- [ ] **Step 3: Commit**

```bash
git add js/progress-proof-card.js
git commit -m "feat: progress-proof-card data helpers"
```

---

## Task 2: Canvas draw function

**Files:**
- Modify: `js/progress-proof-card.js`

- [ ] **Step 1: Add hero stat resolver**

Inside the IIFE, after `_getGoal`, add:

```js
function _resolveHeroes(goal, weightD, inBodyD, prGains, windowStart) {
  const statPool = [];
  if (weightD)               statPool.push({ label: 'WEIGHT', value: (weightD.delta > 0 ? '+' : '') + weightD.delta + weightD.unit, accent: true });
  if (inBodyD && inBodyD.bfDelta != null) statPool.push({ label: 'BODY FAT', value: (inBodyD.bfDelta > 0 ? '+' : '') + inBodyD.bfDelta + '%', accent: inBodyD.bfDelta < 0 });
  if (inBodyD && inBodyD.smmDelta != null) statPool.push({ label: 'MUSCLE', value: (inBodyD.smmDelta > 0 ? '+' : '') + inBodyD.smmDelta + 'kg', accent: inBodyD.smmDelta > 0 });
  if (prGains.length)        statPool.push({ label: 'TOP PR', value: '+' + prGains[0].gain + 'kg', accent: true });

  const byKey = {};
  statPool.forEach(s => { byKey[s.label] = s; });

  let heroA, heroB;
  if (goal === 'fat_loss') {
    heroA = byKey['WEIGHT'];
    heroB = byKey['BODY FAT'];
  } else if (goal === 'muscle_gain') {
    heroA = byKey['TOP PR'];
    heroB = byKey['MUSCLE'];
  } else {
    heroA = byKey['WEIGHT'];
    heroB = byKey['TOP PR'];
  }

  // fallback chain
  const fallbackOrder = ['WEIGHT', 'BODY FAT', 'MUSCLE', 'TOP PR'];
  if (!heroA) heroA = fallbackOrder.map(k => byKey[k]).find(Boolean) || null;
  if (!heroB) heroB = fallbackOrder.map(k => byKey[k]).find(s => s !== heroA).find(Boolean) || null;

  return [
    heroA || { label: 'SESSIONS', value: String(window._pcGetSessionCount ? window._pcGetSessionCount(windowStart) : 0), accent: true },
    heroB || { label: 'STREAK',   value: (typeof calcStreak === 'function' ? calcStreak() : 0) + 'D', accent: false }
  ];
}
```

- [ ] **Step 2: Add the Canvas draw function**

After `_resolveHeroes`, add:

```js
async function _drawProgressProofCard() {
  const { windowStart, nWeeks, phaseLabel } = _getWindow();
  const weightD   = _getWeightDelta(windowStart);
  const inBodyD   = _getInBodyDelta(windowStart);
  const prGains   = _getTopPRGains(windowStart);
  const sessions  = _getSessionCount(windowStart);
  const streak    = typeof calcStreak === 'function' ? calcStreak() : 0;
  const goal      = _getGoal();
  const heroes    = _resolveHeroes(goal, weightD, inBodyD, prGains, windowStart);

  const athleteName = (() => {
    try { return ((typeof userProfile !== 'undefined' && userProfile && userProfile.name) || '').toUpperCase() || 'FORGE ATHLETE'; }
    catch (_) { return 'FORGE ATHLETE'; }
  })();

  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050d08'); bg.addColorStop(0.5, '#0b1a12'); bg.addColorStop(1, '#06110b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glowA = ctx.createRadialGradient(170, 170, 20, 170, 170, 420);
  glowA.addColorStop(0, 'rgba(84,255,171,.18)'); glowA.addColorStop(1, 'rgba(84,255,171,0)');
  ctx.fillStyle = glowA; ctx.fillRect(0, 0, W, H);
  const glowB = ctx.createRadialGradient(W - 130, 500, 40, W - 130, 500, 380);
  glowB.addColorStop(0, 'rgba(78,197,255,.14)'); glowB.addColorStop(1, 'rgba(78,197,255,0)');
  ctx.fillStyle = glowB; ctx.fillRect(0, 0, W, H);

  // ── ZONE 1: header (y=0–180) ─────────────────────────────────────────────
  ctx.fillStyle = '#54ffab'; ctx.font = '700 60px "Bebas Neue", sans-serif';
  ctx.fillText('FORGE PROGRESS PROOF', 70, 96);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(221,240,227,.92)';
  ctx.font = '700 24px "Barlow Condensed", sans-serif';
  ctx.fillText(athleteName, W - 70, 96); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(179,207,187,.88)'; ctx.font = '500 22px "DM Mono", monospace';
  ctx.fillText(phaseLabel + ' · ' + nWeeks + ' WEEK' + (nWeeks !== 1 ? 'S' : ''), 70, 144);
  ctx.strokeStyle = 'rgba(84,255,171,.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(70, 166); ctx.lineTo(1010, 166); ctx.stroke();

  // ── ZONE 2: hero stats (y=190–420) ──────────────────────────────────────
  const heroBoxW = 450, heroBoxH = 210, heroGap = 40;
  heroes.forEach((hero, i) => {
    const hx = 70 + i * (heroBoxW + heroGap), hy = 190;
    ctx.fillStyle = 'rgba(13,24,18,.92)';
    if (typeof _roundRect === 'function') { _roundRect(ctx, hx, hy, heroBoxW, heroBoxH, 18); ctx.fill(); }
    ctx.strokeStyle = hero.accent ? 'rgba(57,255,143,.46)' : 'rgba(130,162,137,.24)';
    ctx.lineWidth = 2;
    if (typeof _roundRect === 'function') { _roundRect(ctx, hx, hy, heroBoxW, heroBoxH, 18); ctx.stroke(); }
    ctx.fillStyle = 'rgba(161,192,168,.88)'; ctx.font = '600 18px "DM Mono", monospace';
    ctx.fillText(hero.label, hx + 24, hy + 38);
    ctx.fillStyle = hero.accent ? '#54ffab' : '#f0faf2';
    ctx.font = '700 96px "Barlow Condensed", sans-serif';
    ctx.fillText(hero.value, hx + 24, hy + 150);
  });

  // ── ZONE 3: stat pills (y=440–570) ──────────────────────────────────────
  if (typeof _drawPill === 'function') {
    const pills = [
      { label: 'SESSIONS', value: sessions, accent: false },
      { label: 'STREAK',   value: streak + 'D', accent: false }
    ];
    if (prGains.length) pills.push({ label: 'TOP PR', value: '+' + prGains[0].gain + 'kg', accent: true });
    if (weightD)        pills.push({ label: 'WEIGHT', value: (weightD.delta > 0 ? '+' : '') + weightD.delta + weightD.unit, accent: weightD.delta < 0 });
    const pillH = 120, gap = 16;
    const pillW = Math.floor((940 - gap * (pills.length - 1)) / pills.length);
    pills.forEach((p, i) => _drawPill(ctx, 70 + i * (pillW + gap), 440, pillW, pillH, p.label, p.value, p.accent));
  }

  // ── ZONE 4: body comp bars (y=590–740) ───────────────────────────────────
  if (inBodyD && (inBodyD.bfDelta != null || inBodyD.smmDelta != null)) {
    ctx.fillStyle = '#54ffab'; ctx.font = '600 18px "DM Mono", monospace';
    ctx.fillText('BODY COMPOSITION', 70, 618);
    const barRows = [];
    if (inBodyD.bfDelta != null) barRows.push({ label: 'BF%', delta: inBodyD.bfDelta, max: 5, goodIfNeg: true });
    if (inBodyD.smmDelta != null) barRows.push({ label: 'SMM', delta: inBodyD.smmDelta, max: 3, goodIfNeg: false, unit: 'kg' });
    barRows.forEach((row, i) => {
      const by = 640 + i * 60;
      ctx.fillStyle = 'rgba(161,192,168,.88)'; ctx.font = '600 17px "DM Mono", monospace';
      ctx.fillText(row.label, 70, by + 18);
      const trackX = 220, trackY = by, trackW = 600, trackH = 24;
      ctx.fillStyle = 'rgba(30,48,36,.9)';
      if (typeof _roundRect === 'function') { _roundRect(ctx, trackX, trackY, trackW, trackH, 12); ctx.fill(); }
      const fillW = Math.min(Math.abs(row.delta) / row.max, 1) * trackW;
      const isGood = row.goodIfNeg ? row.delta < 0 : row.delta > 0;
      ctx.fillStyle = isGood ? '#54ffab' : '#ff6b6b';
      if (typeof _roundRect === 'function') { _roundRect(ctx, trackX, trackY, fillW, trackH, 12); ctx.fill(); }
      const sign = row.delta > 0 ? '+' : '';
      ctx.fillStyle = isGood ? '#54ffab' : '#ff6b6b';
      ctx.font = '700 20px "Barlow Condensed", sans-serif';
      ctx.fillText(sign + row.delta + (row.unit || '%'), trackX + trackW + 14, by + 18);
    });
  }

  // ── ZONE 5: top lifts (y=760–1000) ──────────────────────────────────────
  if (prGains.length) {
    ctx.fillStyle = '#54ffab'; ctx.font = '600 18px "DM Mono", monospace';
    ctx.fillText('TOP LIFT IMPROVEMENTS', 70, 790);
    prGains.forEach((pr, i) => {
      const ly = 820 + i * 70;
      ctx.fillStyle = '#f0faf2'; ctx.font = '700 28px "Barlow Condensed", sans-serif';
      ctx.fillText(pr.exercise.toUpperCase(), 70, ly);
      ctx.fillStyle = 'rgba(179,207,187,.88)'; ctx.font = '500 20px "DM Mono", monospace';
      ctx.fillText(pr.before + 'kg → ' + pr.after + 'kg', 70, ly + 26);
      ctx.fillStyle = '#54ffab'; ctx.font = '700 22px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('+' + pr.pct + '%', 1010, ly);
      ctx.textAlign = 'left';
    });
  }

  // ── watermark ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(211,228,216,.58)'; ctx.font = '500 18px "DM Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Built with FORGE · #ForgeProof · ' + new Date().toISOString().slice(0, 10), W - 70, 1335);
  ctx.textAlign = 'left';

  return canvas;
}
```

- [ ] **Step 3: Verify card renders without errors**

In browser console:
```js
_drawProgressProofCard().then(c => { if (c) document.body.appendChild(c); console.log('Canvas:', c?.width, c?.height); });
```
Expected: 1080×1350 canvas appended to body, no console errors, background gradient visible.

- [ ] **Step 4: Commit**

```bash
git add js/progress-proof-card.js
git commit -m "feat: progress-proof-card canvas draw function"
```

---

## Task 3: Modal, share, and download

**Files:**
- Modify: `js/progress-proof-card.js`
- Modify: `index.html`

- [ ] **Step 1: Add modal HTML to index.html**

Find the closing `</div>` of `wend-overlay` (line ~10109 in index.html). Add immediately after:

```html
<!-- Progress Proof Card Modal -->
<div id="progress-proof-overlay" class="wend-overlay" style="display:none;"
     onclick="if(event.target===this)closeProgressProofModal()">
  <div class="wend-card">
    <div class="wend-handle"></div>
    <div class="wend-header">
      <div class="wend-title">PROGRESS PROOF</div>
      <div class="wend-sub">Your progress, share-ready</div>
    </div>
    <div class="wend-share-preview-wrap">
      <canvas id="progress-proof-preview" width="1080" height="1350"></canvas>
    </div>
    <div class="wend-footer">
      <button class="btn-wend-share" onclick="window.shareProgressProofCard && window.shareProgressProofCard()">SHARE</button>
      <button class="btn-wend-download" onclick="window.downloadProgressProofCard && window.downloadProgressProofCard()">DOWNLOAD</button>
      <button class="btn-wend-close" onclick="closeProgressProofModal()">CLOSE</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add modal open/close + share/download to progress-proof-card.js**

Inside the IIFE, after `_drawProgressProofCard`, add:

```js
function openProgressProofModal() {
  const overlay = document.getElementById('progress-proof-overlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  document.body.classList.add('scroll-locked');
  const preview = document.getElementById('progress-proof-preview');
  if (!preview) return;
  document.fonts.ready.then(async () => {
    const source = await _drawProgressProofCard();
    if (!source) return;
    preview.width  = source.width;
    preview.height = source.height;
    const ctx = preview.getContext('2d');
    if (ctx) ctx.drawImage(source, 0, 0);
  });
}

function closeProgressProofModal() {
  const overlay = document.getElementById('progress-proof-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('scroll-locked');
}

async function shareProgressProofCard() {
  const canvas = await (async () => {
    const preview = document.getElementById('progress-proof-preview');
    if (preview && preview.width > 0 && preview.height > 0) return preview;
    return await _drawProgressProofCard();
  })();
  if (!canvas) return;
  const blob = typeof _canvasToBlob === 'function' ? await _canvasToBlob(canvas) : await new Promise(r => canvas.toBlob(r, 'image/png'));
  if (!blob) return;
  const filename = 'forge-progress-' + new Date().toISOString().slice(0, 10) + '.png';
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: 'FORGE Progress', text: 'My progress. Built with FORGE.', files: [file] });
      return;
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  if (typeof _downloadBlob === 'function') _downloadBlob(blob, filename);
  if (typeof showToast === 'function') showToast('Progress image downloaded', 'var(--accent)');
}

async function downloadProgressProofCard() {
  const canvas = await _drawProgressProofCard();
  if (!canvas) return;
  const blob = typeof _canvasToBlob === 'function' ? await _canvasToBlob(canvas) : await new Promise(r => canvas.toBlob(r, 'image/png'));
  if (!blob) return;
  const filename = 'forge-progress-' + new Date().toISOString().slice(0, 10) + '.png';
  if (typeof _downloadBlob === 'function') _downloadBlob(blob, filename);
  if (typeof showToast === 'function') showToast('Progress image saved', 'var(--accent)');
}

// exports
window.openProgressProofModal   = openProgressProofModal;
window.closeProgressProofModal  = closeProgressProofModal;
window.shareProgressProofCard   = shareProgressProofCard;
window.downloadProgressProofCard = downloadProgressProofCard;
```

- [ ] **Step 3: Verify modal opens and card renders**

In browser console:
```js
openProgressProofModal();
```
Expected: modal slides up, card renders into preview canvas. SHARE / DOWNLOAD / CLOSE buttons visible.

Test CLOSE:
```js
closeProgressProofModal();
```
Expected: modal hides, scroll-locked removed from body.

- [ ] **Step 4: Commit**

```bash
git add js/progress-proof-card.js index.html
git commit -m "feat: progress-proof-card modal, share, download"
```

---

## Task 4: Sunday prompt + init

**Files:**
- Modify: `js/progress-proof-card.js`

- [ ] **Step 1: Add `_progressCardInit` to the IIFE**

Inside the IIFE, after the exports block, add:

```js
function _progressCardInit() {
  const today = new Date();
  if (today.getDay() !== 0) return; // Sunday only
  const todayKey = today.toISOString().slice(0, 10);
  if (localStorage.getItem('forge_progress_card_last_sunday') === todayKey) return;

  // Check ≥1 workout this week (Mon–Sun)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // back to Monday
  weekStart.setHours(0, 0, 0, 0);
  const wos = (typeof workouts !== 'undefined' ? workouts : _lsGet('forge_workouts', []));
  const thisWeek = wos.filter(w => w && w.date && new Date(w.date) >= weekStart);
  if (!thisWeek.length) return;

  localStorage.setItem('forge_progress_card_last_sunday', todayKey);
  setTimeout(() => {
    if (typeof showToast === 'function') {
      showToast('🏆 Share your week?', 'var(--accent)');
    }
    // attach tap handler to last toast shown
    setTimeout(() => {
      const toasts = document.querySelectorAll('.toast, .snack, [class*="toast"]');
      const last = toasts[toasts.length - 1];
      if (last && !last._pcBound) {
        last._pcBound = true;
        last.style.cursor = 'pointer';
        last.addEventListener('click', () => openProgressProofModal());
      }
    }, 100);
  }, 1500);
}

window._progressCardInit = _progressCardInit;
```

- [ ] **Step 2: Verify Sunday prompt logic**

In browser console (force Sunday check by temporarily overriding):
```js
// Temporarily clear the throttle key
localStorage.removeItem('forge_progress_card_last_sunday');
// Manually trigger (will skip day check, call internal logic)
_progressCardInit();
```
If today is not Sunday, the function will return early — that's correct. To test the toast branch, run:
```js
// Force it: Sunday = 0
const _origGetDay = Date.prototype.getDay;
Date.prototype.getDay = () => 0;
localStorage.removeItem('forge_progress_card_last_sunday');
_progressCardInit();
Date.prototype.getDay = _origGetDay;
```
Expected: toast "🏆 Share your week?" appears after ~1.5s if workouts exist. Tapping opens modal.

- [ ] **Step 3: Commit**

```bash
git add js/progress-proof-card.js
git commit -m "feat: progress-proof-card Sunday prompt and init"
```

---

## Task 5: Wire into index.html and dashboard-history.js

**Files:**
- Modify: `index.html`
- Modify: `js/dashboard-history.js`

- [ ] **Step 1: Add script tag to index.html**

Find the `<script src="js/share-helpers.js">` tag. Add immediately after:

```html
<script src="js/progress-proof-card.js"></script>
```

- [ ] **Step 2: Add "Share Progress" button in Monthly Report section**

Search index.html for `id="monthly-report-body"` or the Monthly Report section header. Find the monthly report title element. Add a share button next to it:

```html
<button class="btn-wend-share" style="font-size:13px;padding:6px 14px;margin-left:10px;"
        onclick="openProgressProofModal && openProgressProofModal()">
  📊 SHARE PROGRESS
</button>
```

- [ ] **Step 3: Wire `_progressCardInit` in dashboard-history.js**

Find line ~720 in `js/dashboard-history.js`:
```js
if (name === 'progress' && typeof renderMonthlyReport === 'function') renderMonthlyReport();
```

Change to:
```js
if (name === 'progress' && typeof renderMonthlyReport === 'function') renderMonthlyReport();
if (name === 'progress' && typeof window._progressCardInit === 'function') window._progressCardInit();
```

- [ ] **Step 4: Verify end-to-end in browser**

1. Open app → navigate to Progress tab
2. Confirm no console errors on tab open
3. Find "SHARE PROGRESS" button in Monthly Report section — click it
4. Confirm modal opens with rendered card
5. Confirm DOWNLOAD button saves a PNG file named `forge-progress-YYYY-MM-DD.png`

- [ ] **Step 5: Commit**

```bash
git add index.html js/dashboard-history.js
git commit -m "feat: wire progress-proof-card into Progress tab and Monthly Report"
```

---

## Task 6: Version bump

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Bump version**

In `js/config.js`, update:

```js
window.FORGE_VERSION = 'v224';
window.FORGE_BUILD   = '2026-03-17 (feat: v224 — Progress Proof Card shareable canvas)';
```

- [ ] **Step 2: Verify version shows in app**

Open app → Settings or About section → confirm "v224" displayed.

- [ ] **Step 3: Final commit**

```bash
git add js/config.js
git commit -m "feat: v224 — Progress Proof Card shareable canvas"
```
