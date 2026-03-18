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
        if (!db.objectStoreNames.contains('photos')) { resolve([]); return; }
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
    if (!bar || !_before || !_after) return;
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
      afterImg.style.clipPath = '';
      divider.style.display = 'none';
      afterSlot.onclick = () => window._pcOpenPicker('after');
    } else {
      slots.classList.add('slider-mode');
      afterImg.style.clipPath = 'inset(0 50% 0 0)';
      divider.style.display = 'block';
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

    // Remove old listeners by cloning the divider
    const newDivider = divider.cloneNode(true);
    divider.parentNode.replaceChild(newDivider, divider);

    newDivider.addEventListener('mousedown', (e) => { _dragging = true; e.preventDefault(); });
    newDivider.addEventListener('touchstart', () => { _dragging = true; }, { passive: true });

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
  function _updateCompareBtn() {
    _loadPhotos().then(photos => {
      const btn = document.getElementById('photo-compare-btn');
      if (btn) btn.style.display = photos.length >= 2 ? '' : 'none';
    });
  }
  window._pcUpdateCompareBtn = _updateCompareBtn;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _updateCompareBtn);
  } else {
    _updateCompareBtn();
  }

  console.log('[FORGE] Photo compare loaded');
})();
