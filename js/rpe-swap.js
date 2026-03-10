// FORGE Gym Tracker - RPE column toggle + exercise swap helpers
// Extracted from index.html as part of modularization.

function _toggleRPECols() {
  const on = !!(typeof settings !== 'undefined' && settings.showRPE);
  const container = document.getElementById('sets-container');
  const header = document.getElementById('weighted-sets-header');
  const rpeHdr = document.getElementById('rpe-header');
  if (container) container.classList.toggle('rpe-mode', on);
  if (header) header.classList.toggle('rpe-mode', on);
  if (rpeHdr) rpeHdr.style.display = on ? '' : 'none';
}

function _updateSwapBtn(val) {
  const btn = document.getElementById('swap-btn');
  if (!btn) return;
  btn.style.display = (val && val.trim().length > 1) ? '' : 'none';
}

function openSwapModal() {
  const name = (document.getElementById('exercise-name')?.value || '').trim();
  if (!name) return;
  // Look up in EXERCISE_SWAPS (defined in exercises.js)
  const swaps = (typeof EXERCISE_SWAPS !== 'undefined') ? EXERCISE_SWAPS : {};
  // Case-insensitive lookup
  const key = Object.keys(swaps).find(k => k.toLowerCase() === name.toLowerCase());
  const alts = key ? swaps[key] : [];
  // Also find same-muscle exercises from EXERCISE_DB as fallback
  let extras = [];
  if (typeof EXERCISE_DB !== 'undefined') {
    const thisEx = EXERCISE_DB.find(e => e.n.toLowerCase() === name.toLowerCase());
    if (thisEx) {
      extras = EXERCISE_DB.filter(e => e.m === thisEx.m && e.n !== thisEx.n).map(e => e.n).slice(0, 6);
    }
  }
  const suggestions = alts.length ? alts : extras;
  const _ar = typeof currentLang !== 'undefined' && currentLang === 'ar';
  // Build modal
  let existing = document.getElementById('swap-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'swap-modal';
  modal.className = 'swap-modal-overlay';
  modal.innerHTML = `
    <div class="swap-modal-sheet" onclick="event.stopPropagation()">
      <div class="swap-modal-handle"></div>
      <div class="swap-modal-title">${_ar ? 'تمارين بديلة لـ' : "Can't do"} <em>${name}</em>?</div>
      <div class="swap-modal-sub" data-i18n="swap.sub">${_ar ? 'اختر بديلاً لنفس المجموعة العضلية:' : 'Pick an alternative for the same muscle:'}</div>
      ${suggestions.length
        ? suggestions.map(s => `<button class="swap-option-btn" onclick="applySwap('${s.replace(/'/g, '\\\'')}')"><span class="swap-option-name">${s}</span><span class="swap-arrow">→</span></button>`).join('')
        : `<div class="swap-no-alts">${_ar ? 'لا توجد بدائل مسجّلة' : 'No alternatives on file yet'}</div>`}
      <button class="swap-cancel-btn" onclick="document.getElementById('swap-modal').remove()" data-i18n="swap.cancel">${_ar ? 'إلغاء' : 'Cancel'}</button>
    </div>`;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('swap-modal-visible'));
}

function applySwap(name) {
  const inp = document.getElementById('exercise-name');
  if (inp) { inp.value = name; inp.dispatchEvent(new Event('input')); }
  const m = document.getElementById('swap-modal');
  if (m) m.remove();
  const _ar = typeof currentLang !== 'undefined' && currentLang === 'ar';
  showToast(_ar ? `تم استبدال التمرين بـ ${name}` : `Swapped to ${name}`);
}
