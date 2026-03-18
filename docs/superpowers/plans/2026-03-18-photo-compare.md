# Progress Photo Comparison Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fullscreen Before/After photo comparison overlay to the FORGE Body tab, with side-by-side and slider modes plus weight/BF% delta stats.

**Architecture:** Self-contained IIFE in `js/photo-compare.js` exposes `window.openPhotoCompare()`. Reads from existing `forge-photos-v1` IndexedDB and localStorage. No new storage keys or edge functions. Overlay follows existing pattern (position:fixed, display:none, z-index:9970).

**Tech Stack:** Vanilla JS, CSS clip-path for slider, IndexedDB via existing `forge-photos-v1` store, localStorage for stats.

**Spec:** `docs/superpowers/specs/2026-03-18-photo-compare-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `js/photo-compare.js` | **Create** | All comparison logic: open/close, photo loading, side-by-side render, slider drag, picker, stats |
| `index.html` line 1054 | **Modify** | Add "⚡ Compare" button to `progress-photos-panel` header |
| `index.html` line 2187 | **Modify** | Add `photo-compare-overlay` div before `deload-overlay` |
| `index.html` line 2312 | **Modify** | Add `<script src="js/photo-compare.js">` after `bodycomp-photos.js` |
| `css/main.css` | **Modify** | Add overlay + slider + picker + delta bar styles at end of file |

---

## Task 1: CSS — overlay skeleton

**Files:**
- Modify: `css/main.css` (append at end)

- [ ] **Step 1: Append styles to `css/main.css`**

```css
/* ── Photo Compare Overlay ──────────────────────────────────────────────── */
#photo-compare-overlay{position:fixed;inset:0;background:#000;z-index:9970;display:none;flex-direction:column;overflow:hidden;}
.pc-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,0,0,.7);flex-shrink:0;}
.pc-close-btn{font-size:20px;background:none;border:none;color:#fff;cursor:pointer;padding:4px 8px;}
.pc-title{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;color:#fff;}
.pc-mode-toggle{display:flex;gap:4px;}
.pc-mode-btn{font-family:'DM Mono',monospace;font-size:11px;padding:5px 10px;border:1px solid rgba(255,255,255,.3);border-radius:6px;background:transparent;color:rgba(255,255,255,.6);cursor:pointer;}
.pc-mode-btn.active{background:var(--accent);border-color:var(--accent);color:#000;}
/* Photo slots */
.pc-slots{display:flex;flex:1;overflow:hidden;position:relative;}
.pc-slot{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;position:relative;cursor:pointer;overflow:hidden;}
.pc-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.pc-slot-label{position:relative;z-index:2;background:rgba(0,0,0,.6);padding:6px 10px;text-align:center;width:100%;}
.pc-slot-tag{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:2px;color:var(--accent);}
.pc-slot-date{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.7);}
.pc-slot-stat{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.6);}
.pc-divider{position:absolute;top:0;bottom:0;width:2px;background:#fff;left:50%;z-index:10;cursor:ew-resize;}
.pc-divider-handle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;color:#000;}
/* Slider mode */
.pc-slots.slider-mode .pc-slot:last-child{position:absolute;inset:0;flex:none;width:100%;}
/* Delta bar */
.pc-delta-bar{display:flex;gap:12px;align-items:center;justify-content:center;padding:8px 14px;background:rgba(0,0,0,.7);flex-shrink:0;flex-wrap:wrap;}
.pc-delta-item{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.7);}
.pc-delta-item.good{color:#4ade80;}
.pc-delta-item.bad{color:#f87171;}
/* Picker */
.pc-picker{position:absolute;inset:0;background:rgba(0,0,0,.92);z-index:20;display:flex;flex-direction:column;overflow:hidden;}
.pc-picker-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;flex-shrink:0;}
.pc-picker-title{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#fff;}
.pc-picker-cancel{font-family:'DM Mono',monospace;font-size:11px;padding:5px 12px;border:1px solid rgba(255,255,255,.3);border-radius:6px;background:transparent;color:rgba(255,255,255,.6);cursor:pointer;}
.pc-picker-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px;overflow-y:auto;flex:1;}
.pc-picker-thumb{aspect-ratio:1;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid transparent;}
.pc-picker-thumb:hover,.pc-picker-thumb.selected{border-color:var(--accent);}
```

- [ ] **Step 2: Verify styles exist in file**

```bash
grep -c "pc-header\|pc-slots\|pc-delta-bar\|pc-picker" css/main.css
```
Expected: 4 (one match per selector group)

---

## Task 2: HTML — overlay div + Compare button + script tag

**Files:**
- Modify: `index.html` lines 1054, 2187, 2312

- [ ] **Step 1: Add "⚡ Compare" button in photo gallery header (line 1054)**

Find:
```html
        <button class="panel-badge" onclick="addProgressPhoto()" style="cursor:pointer;border:none;background:var(--accent);color:#fff;border-radius:6px;padding:3px 10px;font-size:10px;letter-spacing:.5px;" data-i18n="photos.add">+ ADD</button>
```

Replace with:
```html
        <button class="panel-badge" onclick="addProgressPhoto()" style="cursor:pointer;border:none;background:var(--accent);color:#fff;border-radius:6px;padding:3px 10px;font-size:10px;letter-spacing:.5px;" data-i18n="photos.add">+ ADD</button>
        <button id="photo-compare-btn" class="panel-badge" onclick="window.openPhotoCompare()" style="display:none;cursor:pointer;border:none;background:transparent;border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:3px 10px;font-size:10px;letter-spacing:.5px;margin-left:6px;">⚡ Compare</button>
```

- [ ] **Step 2: Add overlay HTML before deload-overlay (line ~2187)**

Find:
```html
<div id="deload-overlay"
```

Insert before it:
```html
<!-- PHOTO COMPARE OVERLAY -->
<div id="photo-compare-overlay">
  <div class="pc-header">
    <button class="pc-close-btn" onclick="window._pcClose()">✕</button>
    <span class="pc-title">COMPARE</span>
    <div class="pc-mode-toggle">
      <button class="pc-mode-btn active" id="pc-btn-side" onclick="window._pcSetMode('side')">≡</button>
      <button class="pc-mode-btn" id="pc-btn-slider" onclick="window._pcSetMode('slider')">◫</button>
    </div>
  </div>
  <div class="pc-slots" id="pc-slots">
    <div class="pc-slot" id="pc-slot-before" onclick="window._pcOpenPicker('before')">
      <img id="pc-img-before" src="" alt="Before">
      <div class="pc-slot-label">
        <div class="pc-slot-tag">BEFORE</div>
        <div class="pc-slot-date" id="pc-date-before"></div>
        <div class="pc-slot-stat" id="pc-stat-before"></div>
      </div>
    </div>
    <div class="pc-slot" id="pc-slot-after" onclick="window._pcOpenPicker('after')">
      <img id="pc-img-after" src="" alt="After">
      <div class="pc-slot-label">
        <div class="pc-slot-tag">AFTER</div>
        <div class="pc-slot-date" id="pc-date-after"></div>
        <div class="pc-slot-stat" id="pc-stat-after"></div>
      </div>
    </div>
    <div class="pc-divider" id="pc-divider" style="display:none;">
      <div class="pc-divider-handle">⇔</div>
    </div>
  </div>
  <div class="pc-delta-bar" id="pc-delta-bar"></div>
  <!-- Picker panel (shown in pick mode) -->
  <div class="pc-picker" id="pc-picker" style="display:none;">
    <div class="pc-picker-header">
      <span class="pc-picker-title">SELECT PHOTO</span>
      <button class="pc-picker-cancel" onclick="window._pcClosePicker()">✕ Cancel</button>
    </div>
    <div class="pc-picker-grid" id="pc-picker-grid"></div>
  </div>
</div>

<div id="deload-overlay"
```

- [ ] **Step 3: Add script tag after bodycomp-photos.js**

Find:
```html
<script src="js/bodycomp-photos.js"></script>
```

Replace with:
```html
<script src="js/bodycomp-photos.js"></script>
<script src="js/photo-compare.js"></script>
```

- [ ] **Step 4: Verify HTML changes**

```bash
grep -n "photo-compare-overlay\|photo-compare-btn\|photo-compare.js" index.html
```
Expected: 3 lines found

---

## Task 3: Core JS — photo loading + open/close

**Files:**
- Create: `js/photo-compare.js`

- [ ] **Step 1: Create `js/photo-compare.js` with IIFE skeleton + helpers**

```js
'use strict';
// FORGE Progress Photo Comparison
// Exposes: window.openPhotoCompare(), window._pcClose()
// window._pcSetMode(mode), window._pcOpenPicker(slot), window._pcClosePicker()

(function () {

  // ── State ──────────────────────────────────────────────────────────────────
  let _photos = [];        // all photos sorted oldest→newest
  let _before = null;      // { id, date, data }
  let _after  = null;
  let _mode   = 'side';    // 'side' | 'slider'
  let _pickSlot = null;    // 'before' | 'after' — which slot is being picked
  let _dragging = false;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
  }

  function _fmtDate(dateStr) {
    // dateStr: "YYYY-MM-DD" or ISO
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function _daysBetween(dateA, dateB) {
    const a = new Date(dateA), b = new Date(dateB);
    return Math.round(Math.abs(b - a) / 86400000);
  }

  // ── Read all photos from IndexedDB ────────────────────────────────────────
  function _loadPhotos() {
    return new Promise((resolve) => {
      const req = indexedDB.open('forge-photos-v1');
      req.onerror = () => resolve([]);
      req.onsuccess = (e) => {
        const db = e.target.result;
        const store = db.transaction('photos', 'readonly').objectStore('photos');
        const all = [];
        store.openCursor().onsuccess = (ev) => {
          const cursor = ev.target.result;
          if (cursor) { all.push(cursor.value); cursor.continue(); }
          else resolve(all.sort((a, b) => a.id - b.id)); // oldest first
        };
      };
      req.onupgradeneeded = () => resolve([]);
    });
  }

  // ── Stats: nearest bodyweight / InBody entry within 7 days ───────────────
  function _nearestWeight(photoDate) {
    const entries = _lsGet('forge_bodyweight', []);
    const target = new Date(photoDate).getTime();
    const WINDOW = 7 * 86400000;
    let best = null, bestDiff = Infinity;
    for (const e of entries) {
      const diff = Math.abs(new Date(e.date).getTime() - target);
      if (diff < WINDOW && diff < bestDiff) { bestDiff = diff; best = e; }
    }
    return best;
  }

  function _nearestBF(photoDate) {
    const entries = _lsGet('forge_inbody_tests', []);
    const target = new Date(photoDate).getTime();
    const WINDOW = 7 * 86400000;
    let best = null, bestDiff = Infinity;
    for (const e of entries) {
      const diff = Math.abs(new Date(e.date).getTime() - target);
      if (diff < WINDOW && diff < bestDiff) { bestDiff = diff; best = e; }
    }
    return best;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function _renderSlot(slot, photo) {
    const img  = document.getElementById(`pc-img-${slot}`);
    const date = document.getElementById(`pc-date-${slot}`);
    const stat = document.getElementById(`pc-stat-${slot}`);
    if (!img) return;
    img.src = photo.data;
    date.textContent = _fmtDate(photo.date);
    const w = _nearestWeight(photo.date);
    const b = _nearestBF(photo.date);
    const parts = [];
    if (w) parts.push(`${w.weight}${w.unit || 'kg'}`);
    if (b) parts.push(`${b.bf}% BF`);
    stat.textContent = parts.join(' · ') || '';
  }

  function _renderDelta() {
    const bar = document.getElementById('pc-delta-bar');
    if (!bar) return;
    const days = _daysBetween(_before.date, _after.date);
    const wB = _nearestWeight(_before.date);
    const wA = _nearestWeight(_after.date);
    const bB = _nearestBF(_before.date);
    const bA = _nearestBF(_after.date);

    const daysHtml = `<span class="pc-delta-item">📅 ${days} days</span>`;
    let weightHtml = `<span class="pc-delta-item">⚖ —</span>`;
    if (wB && wA) {
      const delta = (wA.weight - wB.weight).toFixed(1);
      const cls = parseFloat(delta) <= 0 ? 'good' : 'bad';
      weightHtml = `<span class="pc-delta-item ${cls}">⚖ ${parseFloat(delta) > 0 ? '+' : ''}${delta}${wA.unit || 'kg'}</span>`;
    }
    let bfHtml = `<span class="pc-delta-item">🔥 —</span>`;
    if (bB && bA) {
      const delta = (bA.bf - bB.bf).toFixed(1);
      const cls = parseFloat(delta) <= 0 ? 'good' : 'bad';
      bfHtml = `<span class="pc-delta-item ${cls}">🔥 ${parseFloat(delta) > 0 ? '+' : ''}${delta}% BF</span>`;
    }
    bar.innerHTML = daysHtml + weightHtml + bfHtml;
  }

  function _render() {
    if (!_before || !_after) return;
    _renderSlot('before', _before);
    _renderSlot('after', _after);
    _renderDelta();
    _applyMode();
  }

  // ── Mode ───────────────────────────────────────────────────────────────────
  function _applyMode() {
    const slots = document.getElementById('pc-slots');
    const divider = document.getElementById('pc-divider');
    const afterSlot = document.getElementById('pc-slot-after');
    const afterImg  = document.getElementById('pc-img-after');

    document.getElementById('pc-btn-side')?.classList.toggle('active', _mode === 'side');
    document.getElementById('pc-btn-slider')?.classList.toggle('active', _mode === 'slider');

    if (_mode === 'side') {
      slots.classList.remove('slider-mode');
      afterSlot.style.clipPath = '';
      afterImg.style.clipPath  = '';
      divider.style.display = 'none';
      afterSlot.onclick = () => window._pcOpenPicker('after');
    } else {
      slots.classList.add('slider-mode');
      afterImg.style.clipPath = 'inset(0 50% 0 0)';
      divider.style.display = 'block';
      // Disable slot tap in slider mode (tap is for dragging)
      afterSlot.onclick = null;
      _initSliderDrag();
    }
  }

  window._pcSetMode = function (mode) { _mode = mode; _applyMode(); };

  // ── Slider drag ────────────────────────────────────────────────────────────
  function _initSliderDrag() {
    const slots   = document.getElementById('pc-slots');
    const divider = document.getElementById('pc-divider');
    const afterImg = document.getElementById('pc-img-after');

    function _setPosition(clientX) {
      const rect = slots.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const right = (100 - pct).toFixed(1);
      afterImg.style.clipPath = `inset(0 ${right}% 0 0)`;
      divider.style.left = pct + '%';
    }

    // Remove old listeners by cloning
    const newDivider = divider.cloneNode(true);
    divider.parentNode.replaceChild(newDivider, divider);

    newDivider.addEventListener('mousedown', (e) => { _dragging = true; e.preventDefault(); });
    newDivider.addEventListener('touchstart', (e) => { _dragging = true; }, { passive: true });

    slots.addEventListener('mousemove', (e) => { if (_dragging) _setPosition(e.clientX); });
    slots.addEventListener('touchmove', (e) => {
      if (_dragging) { e.preventDefault(); _setPosition(e.touches[0].clientX); }
    }, { passive: false });

    const stopDrag = () => { _dragging = false; };
    slots.addEventListener('mouseup', stopDrag);
    slots.addEventListener('touchend', stopDrag);
  }

  // ── Picker ─────────────────────────────────────────────────────────────────
  window._pcOpenPicker = function (slot) {
    _pickSlot = slot;
    const grid = document.getElementById('pc-picker-grid');
    grid.innerHTML = _photos.map(p => {
      const isCurrent = (slot === 'before' ? _before : _after)?.id === p.id;
      return `<img class="pc-picker-thumb${isCurrent ? ' selected' : ''}"
        src="${p.data}" data-id="${p.id}"
        onclick="window._pcPickPhoto(${p.id})">`;
    }).join('');
    document.getElementById('pc-picker').style.display = 'flex';
  };

  window._pcClosePicker = function () {
    document.getElementById('pc-picker').style.display = 'none';
    _pickSlot = null;
  };

  window._pcPickPhoto = function (id) {
    const photo = _photos.find(p => p.id === id);
    if (!photo) return;
    const other = _pickSlot === 'before' ? _after : _before;
    if (other && other.id === id) {
      if (typeof showToast === 'function') showToast('Select a different photo');
      return;
    }
    if (_pickSlot === 'before') _before = photo;
    else _after = photo;
    window._pcClosePicker();
    _render();
  };

  // ── Open / Close ───────────────────────────────────────────────────────────
  window.openPhotoCompare = async function () {
    _photos = await _loadPhotos();
    if (_photos.length < 2) return;
    _before = _photos[0];
    _after  = _photos[_photos.length - 1];
    _mode   = 'side';
    const overlay = document.getElementById('photo-compare-overlay');
    if (overlay) { overlay.style.display = 'flex'; }
    _render();
  };

  window._pcClose = function () {
    const overlay = document.getElementById('photo-compare-overlay');
    if (overlay) overlay.style.display = 'none';
    _dragging = false;
  };

  // ── Compare button visibility ──────────────────────────────────────────────
  // Called by _renderPhotoGallery in bodycomp-photos.js (or we patch it here)
  function _updateCompareBtn() {
    _loadPhotos().then(photos => {
      const btn = document.getElementById('photo-compare-btn');
      if (btn) btn.style.display = photos.length >= 2 ? '' : 'none';
    });
  }
  window._pcUpdateCompareBtn = _updateCompareBtn;

  // Auto-run on load (body tab may already have photos)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _updateCompareBtn);
  } else {
    _updateCompareBtn();
  }

  console.log('[FORGE] Photo compare loaded');
})();
```

- [ ] **Step 2: Verify file created**

```bash
wc -l js/photo-compare.js
```
Expected: ~170+ lines

---

## Task 4: Wire compare button refresh into photo gallery

The Compare button needs to refresh its visibility when photos are added/deleted. Find where `_renderPhotoGallery` is called in `js/bodycomp-photos.js` and add the hook.

**Files:**
- Modify: `js/bodycomp-photos.js`

- [ ] **Step 1: Find `_renderPhotoGallery` function end in `bodycomp-photos.js`**

```bash
grep -n "_renderPhotoGallery\|addProgressPhoto\|_deletePhoto" js/bodycomp-photos.js | head -15
```

- [ ] **Step 2: After every gallery render call, add compare button update**

Find the line where `_renderPhotoGallery()` is called after adding or deleting a photo (typically inside `_onPhotoSelected` and `_deletePhoto`). After each such call, add:

```js
if (typeof window._pcUpdateCompareBtn === 'function') window._pcUpdateCompareBtn();
```

Add this after each of the existing `_renderPhotoGallery()` calls in the file.

- [ ] **Step 3: Verify**

```bash
grep -n "_pcUpdateCompareBtn" js/bodycomp-photos.js
```
Expected: 2+ matches (one per render call)

---

## Task 5: End-to-end verification

- [ ] **Step 1: Commit current state**

```bash
git add js/photo-compare.js js/bodycomp-photos.js index.html css/main.css
git commit -m "feat: progress photo comparison overlay — side-by-side + slider (v234)"
```

- [ ] **Step 2: Push and wait for deploy (~90s)**

```bash
git push origin master
sleep 90
```

- [ ] **Step 3: Browser verify — overlay loads**

Open app → Body tab → add 2+ photos → verify "⚡ Compare" button appears.
Click it → overlay opens with Before (oldest) and After (latest) auto-selected.

- [ ] **Step 4: Browser verify — side-by-side**

Both photos visible 50/50. Labels show BEFORE / AFTER + dates + weight/BF stats (or `—`). Delta bar shows days elapsed + weight delta (green if negative) + BF delta.

- [ ] **Step 5: Browser verify — slider mode**

Click ◫ toggle → divider appears at 50%. Drag divider left/right → After photo reveals/hides correctly via clip-path. Page does not scroll while dragging on mobile.

- [ ] **Step 6: Browser verify — photo picker**

Tap BEFORE slot → picker opens with all photos. Tap a thumbnail → Before updates, picker closes. Tap ✕ Cancel → picker closes with no change. Try to pick same photo for both slots → toast fires, change rejected.

- [ ] **Step 7: Browser verify — edge cases**

With 1 photo → Compare button hidden. With 0 photos → Compare button hidden.

- [ ] **Step 8: Update memory**

Update `memory/project_forge_6features_shipped.md` with v234 Photo Compare status.

---

## Quick reference

| Element | ID / class |
|---------|-----------|
| Overlay | `#photo-compare-overlay` |
| Before img | `#pc-img-before` |
| After img | `#pc-img-after` |
| Slider divider | `#pc-divider` |
| Picker panel | `#pc-picker` |
| Picker grid | `#pc-picker-grid` |
| Delta bar | `#pc-delta-bar` |
| Compare btn | `#photo-compare-btn` |
| Mode buttons | `#pc-btn-side`, `#pc-btn-slider` |
