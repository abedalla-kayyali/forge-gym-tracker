'use strict';
// FORGE Meal Templates — save any filled meal form as a reusable quick-add template.
// Storage: forge_meal_library = { [id]: { id, name, kcal, p, c, f, savedAt } }

(function () {

  const KEY = 'forge_meal_library';

  function _lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
  }
  function _lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }
  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Read / write library ─────────────────────────────────────────────────────
  function _getLibrary() { return _lsGet(KEY, {}); }

  function _saveLibrary(lib) { _lsSet(KEY, lib); }

  // ── Save current meal form as template ───────────────────────────────────────
  window._mtSaveAsTemplate = function () {
    const name  = document.getElementById('meal-name-input')?.value?.trim();
    const kcal  = parseFloat(document.getElementById('meal-kcal-input')?.value) || 0;
    const p     = parseFloat(document.getElementById('meal-p-input')?.value)    || 0;
    const c     = parseFloat(document.getElementById('meal-c-input')?.value)    || 0;
    const f     = parseFloat(document.getElementById('meal-f-input')?.value)    || 0;

    if (!name) { if (typeof showToast === 'function') showToast('Enter a meal name first'); return; }
    if (!kcal && !p && !c && !f) { if (typeof showToast === 'function') showToast('Fill in macros first'); return; }

    const lib = _getLibrary();
    const id  = 'tmpl_' + Date.now();
    lib[id] = { id, name, kcal: Math.round(kcal), p: +p.toFixed(1), c: +c.toFixed(1), f: +f.toFixed(1), savedAt: new Date().toISOString() };
    _saveLibrary(lib);
    if (typeof showToast === 'function') showToast('"' + name + '" saved as template ✓');
    _renderMiniChips();
    renderMealTemplatesPanel();
  };

  // ── Apply template → fill meal form ─────────────────────────────────────────
  window._mtApplyTemplate = function (id) {
    const tmpl = _getLibrary()[id];
    if (!tmpl) return;
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val; };
    set('meal-name-input', tmpl.name);
    set('meal-kcal-input', tmpl.kcal);
    set('meal-p-input',    tmpl.p);
    set('meal-c-input',    tmpl.c);
    set('meal-f-input',    tmpl.f);
    // Reset qty to 100g default
    set('meal-qty-input', 100);
    if (typeof showToast === 'function') showToast('"' + tmpl.name + '" loaded');
    if (window.fx) { fx.sound('sndFoodPick'); fx.haptic('hapTap'); }
    else if (typeof sndFoodPick === 'function') sndFoodPick();
    // Scroll up to form
    const form = document.getElementById('meal-name-input');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Delete template ──────────────────────────────────────────────────────────
  window._mtDeleteTemplate = function (id) {
    const lib = _getLibrary();
    if (!lib[id]) return;
    const name = lib[id].name;
    delete lib[id];
    _saveLibrary(lib);
    if (typeof showToast === 'function') showToast('"' + name + '" removed');
    _renderMiniChips();
    renderMealTemplatesPanel();
  };

  // ── Render inline mini chips row (in meal form) ─────────────────────────
  function _renderMiniChips() {
    const row = document.getElementById('meal-templates-chips');
    if (!row) return;
    const lib = _getLibrary();
    const items = Object.values(lib)
      .filter(i => i.id && i.id.startsWith('tmpl_') && i.kcal != null)
      .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    if (items.length === 0) { row.innerHTML = ''; return; }
    row.innerHTML = '<div class="mt-chips-label">Quick-add:</div>' +
      items.map(t =>
        `<span class="mt-chip template-chip template-chip-hidden" onclick="window._mtApplyTemplate('${_esc(t.id)}')" title="${_esc(t.kcal)} kcal · ${_esc(t.p)}g P">${_esc(t.name)}</span>`
      ).join('');
    // v241: stagger chip reveal
    row.querySelectorAll('.template-chip-hidden').forEach(function(chip, i) {
      setTimeout(function() { chip.classList.remove('template-chip-hidden'); }, i * 50);
    });
  }

  // ── Render templates panel ───────────────────────────────────────────────────
  function renderMealTemplatesPanel() {
    const body = document.getElementById('meal-templates-body');
    if (!body) return;

    const lib = _getLibrary();
    // Only show entries created by this system (have tmpl_ id and our flat macro shape)
    const items = Object.values(lib)
      .filter(i => i.id && i.id.startsWith('tmpl_') && i.kcal != null)
      .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));

    if (items.length === 0) {
      body.innerHTML = `<div class="mt-empty">
        <div class="mt-empty-icon">🥗</div>
        <div class="mt-empty-title">No templates yet</div>
        <div class="mt-empty-hint">Fill the meal form above and tap <strong>Save as Template</strong></div>
      </div>`;
      return;
    }

    const cards = items.map(t => `
      <div class="mt-card">
        <div class="mt-card-info">
          <div class="mt-card-name">${_esc(t.name)}</div>
          <div class="mt-card-macros">
            <span class="mt-macro mt-kcal">${t.kcal} kcal</span>
            <span class="mt-macro mt-p">${t.p}g P</span>
            <span class="mt-macro mt-c">${t.c}g C</span>
            <span class="mt-macro mt-f">${t.f}g F</span>
          </div>
        </div>
        <div class="mt-card-actions">
          <button class="mt-apply-btn" onclick="window._mtApplyTemplate('${_esc(t.id)}')" type="button">USE</button>
          <button class="mt-delete-btn" onclick="window._mtDeleteTemplate('${_esc(t.id)}')" type="button">✕</button>
        </div>
      </div>`).join('');

    body.innerHTML = cards;
  }
  window.renderMealTemplatesPanel = renderMealTemplatesPanel;
  window.renderMealTemplateChips = _renderMiniChips;

  // Render chips once on load (in case nutrition form is already in DOM)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _renderMiniChips);
  } else {
    _renderMiniChips();
  }

})();
