// FORGE Gym Tracker - body composition charts and progress photos
// Extracted from index.html for modularity while preserving global APIs.

// C2: Progress Photos
const _photoDb = (() => {
  let _db = null;
  function _open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((res, rej) => {
      const req = indexedDB.open('forge-photos-v1', 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('photos', { keyPath: 'id' });
      req.onsuccess = e => { _db = e.target.result; res(_db); };
      req.onerror = rej;
    });
  }
  return {
    save: async photo => { const d = await _open(); d.transaction('photos', 'readwrite').objectStore('photos').put(photo); },
    getAll: async () => {
      const d = await _open();
      return new Promise((res, rej) => {
        const r = d.transaction('photos', 'readonly').objectStore('photos').getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = rej;
      });
    },
    delete: async id => { const d = await _open(); d.transaction('photos', 'readwrite').objectStore('photos').delete(id); }
  };
})();

function addProgressPhoto() {
  const inp = document.getElementById('photo-file-input');
  if (inp) inp.click();
}

function _onPhotoSelected(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      // Compress to max 480px wide, JPEG 0.7
      const MAX = 480;
      let w = img.width;
      let h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      const data = c.toDataURL('image/jpeg', 0.7);
      const photo = { id: Date.now(), date: new Date().toISOString().split('T')[0], data };
      _photoDb.save(photo).then(() => _renderPhotoGallery());
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function _renderPhotoGallery() {
  _photoDb.getAll().then(photos => {
    const grid = document.getElementById('photo-gallery-grid');
    const empty = document.getElementById('photo-gallery-empty');
    if (!grid) return;
    if (!photos || !photos.length) {
      grid.style.display = 'none';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    grid.style.display = '';
    photos.sort((a, b) => b.id - a.id);
    grid.innerHTML = photos.map(p => `
      <div class="photo-thumb" onclick="_photoFullView(${p.id})">
        <img src="${p.data}" alt="Progress ${p.date}" loading="lazy">
        <div class="photo-date">${window.FORGE_STORAGE.esc(p.date)}</div>
        <button class="photo-del-btn" onclick="event.stopPropagation();_deletePhoto(${p.id})" title="Delete">&times;</button>
      </div>`).join('');
  }).catch(() => {});
}

function _photoFullView(id) {
  _photoDb.getAll().then(photos => {
    const p = photos.find(x => x.id === id);
    if (!p) return;
    let ov = document.getElementById('photo-fullview');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'photo-fullview';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;';
    ov.innerHTML = `<img src="${p.data}" style="max-width:92vw;max-height:80vh;border-radius:10px;object-fit:contain;"><div style="color:#ccc;font-family:DM Mono,monospace;font-size:12px;">${window.FORGE_STORAGE.esc(p.date)}</div>`;
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  });
}

function _deletePhoto(id) {
  const _ar = typeof currentLang !== 'undefined' && currentLang === 'ar';
  if (!confirm(_ar ? 'حذف هذه الصورة؟' : 'Delete this photo?')) return;
  _photoDb.delete(id).then(() => _renderPhotoGallery());
}

// BODY COMPOSITION (body fat + muscle mass)
let currentBcompChart = 'weight';

function logBodyWeight() {
  const val = parseFloat(document.getElementById('bw-input').value);
  const unit = document.getElementById('bw-unit').value;
  const bf = parseFloat(document.getElementById('bf-input')?.value) || null;
  const mm = parseFloat(document.getElementById('mm-input')?.value) || null;

  if (!val || val < 20 || val > 500) { showToast('Enter a valid weight!'); return; }
  const entry = { date: new Date().toISOString(), weight: val, unit };
  if (bf !== null && bf > 0) entry.bodyFat = bf;
  if (mm !== null && mm > 0) entry.muscleMass = mm;

  bodyWeight.push(entry);
  save();

  document.getElementById('bw-input').value = '';
  const bfInput = document.getElementById('bf-input');
  const mmInput = document.getElementById('mm-input');
  if (bfInput) bfInput.value = '';
  if (mmInput) mmInput.value = '';

  showToast(typeof t === 'function' && currentLang === 'ar' ? 'تم تسجيل تكوين الجسم!' : 'Body composition logged!');
  syncMmUnit();
  renderBcompChart(currentBcompChart);
  renderBWHistory();
  renderCompCards();
  renderFFMICards();
  _updateHdrStats();
}

// Wrapper used by stats-tab log button - also collapses form and refreshes
function logBodyWeightAndRefresh() {
  logBodyWeight();
  const wrap = document.getElementById('bcomp-form-wrap');
  const btn = document.getElementById('bcomp-toggle-btn');
  if (wrap) wrap.classList.remove('open');
  if (btn) btn.classList.remove('open');
}

function toggleBcompForm() {
  const wrap = document.getElementById('bcomp-form-wrap');
  const btn = document.getElementById('bcomp-toggle-btn');
  if (!wrap) return;
  const isOpen = wrap.classList.toggle('open');
  if (btn) btn.classList.toggle('open', isOpen);
  if (isOpen) setTimeout(() => document.getElementById('bw-input')?.focus(), 200);
}

function syncMmUnit() {
  const unit = document.getElementById('bw-unit')?.value || 'kg';
  const lbl = document.getElementById('mm-unit-lbl');
  if (lbl) lbl.textContent = unit;
}

function switchBcompChart(type, btn) {
  currentBcompChart = type;
  document.querySelectorAll('.bcomp-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBcompChart(type);
}

function renderBcompChart(type) {
  // Destroy old chart instance before creating new
  if (bwChrt) { bwChrt.destroy(); bwChrt = null; }
  const ctx = document.getElementById('bw-chart');
  if (!ctx) return;
  const c = ctx.getContext('2d');
  const data = [...bodyWeight].slice(-30);
  if (!data.length) return;

  let values;
  let color;
  let label;
  if (type === 'weight') {
    values = data.map(d => d.weight);
    color = '#39ff8f';
    label = 'Body Weight';
  } else if (type === 'bodyfat') {
    const filtered = data.filter(d => d.bodyFat);
    if (!filtered.length) { showToast('ℹ️ No body fat data yet'); return; }
    values = filtered.map(d => d.bodyFat);
    color = '#f39c12';
    label = 'Body Fat %';
    data.length = 0;
    data.push(...filtered);
  } else {
    const filtered = data.filter(d => d.muscleMass);
    if (!filtered.length) { showToast('ℹ️ No muscle mass data yet'); return; }
    values = filtered.map(d => d.muscleMass);
    color = '#2ecc71';
    label = 'Muscle Mass';
    data.length = 0;
    data.push(...filtered);
  }

  const grad = c.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, hexToRgba(color, 0.25));
  grad.addColorStop(1, hexToRgba(color, 0));
  bwChrt = new Chart(c, {
    type: 'line',
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })),
      datasets: [{
        label, data: values,
        borderColor: color, borderWidth: 2, backgroundColor: grad,
        fill: true, tension: 0.4, pointBackgroundColor: color, pointRadius: 4, pointHoverRadius: 7
      }]
    },
    options: mkChartOpts()
  });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Keep renderBWChart as alias for backward compatibility
function renderBWChart() { renderBcompChart(currentBcompChart); }
