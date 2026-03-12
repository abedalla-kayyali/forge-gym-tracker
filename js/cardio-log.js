// FORGE Gym Tracker - Cardio / Recovery logging (v46)

'use strict';

// ── Globals ───────────────────────────────────────────────────────────────────
let cardioLog          = _lsGet(STORAGE_KEYS.CARDIO, []);
let _selectedCardioAct = null; // { cat, act }
let _selectedHRZone    = 0;

// ── Activity selection ────────────────────────────────────────────────────────
function selectCardioActivity(btn) {
  document.querySelectorAll('.cardio-act-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _selectedCardioAct = { cat: btn.dataset.cat, act: btn.dataset.act };
  document.getElementById('cardio-form-title').textContent = btn.dataset.act;
  document.getElementById('cardio-form').style.display = '';
}

function selectHRZone(zone) {
  _selectedHRZone = (_selectedHRZone === zone) ? 0 : zone; // toggle off if re-tapped
  document.querySelectorAll('.cardio-hz-btn').forEach(b =>
    b.classList.toggle('active', +b.dataset.zone === _selectedHRZone));
}

// ── Submit ────────────────────────────────────────────────────────────────────
function submitCardioLog() {
  if (!_selectedCardioAct) return;
  const dur = parseInt(document.getElementById('cardio-dur-input').value, 10) || 0;
  if (!dur) { showToast('Enter duration'); return; }
  const cal  = parseInt(document.getElementById('cardio-cal-input').value, 10) || 0;
  const cond = document.getElementById('cardio-cond-select').value;

  const entry = {
    id:           Date.now(),
    date:         _isoKey(new Date()),
    category:     _selectedCardioAct.cat,
    activity:     _selectedCardioAct.act,
    durationMins: dur,
    calories:     cal,
    hrZone:       _selectedHRZone,
    temp:         cond,
    xpEarned:     0
  };

  cardioLog.push(entry);
  localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(cardioLog));

  // Reset form
  document.getElementById('cardio-dur-input').value  = '';
  document.getElementById('cardio-cal-input').value  = '';
  document.getElementById('cardio-cond-select').value = '';
  selectHRZone(0);
  document.querySelectorAll('.cardio-act-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cardio-form').style.display = 'none';
  _selectedCardioAct = null;

  renderCardioRecentLog();
  showToast('Cardio logged! \uD83D\uDE80');
}

// ── Recent log ────────────────────────────────────────────────────────────────
function renderCardioRecentLog() {
  const wrap = document.getElementById('cardio-recent-wrap');
  const el   = document.getElementById('cardio-recent-log');
  if (!wrap || !el) return;
  const last5 = [...cardioLog].reverse().slice(0, 5);
  if (!last5.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  el.innerHTML = last5.map(e =>
    '<div class="cardio-log-row">' +
      '<span class="cardio-log-act">' + e.activity + '</span>' +
      '<span class="cardio-log-meta">' + e.durationMins + ' min' +
        (e.calories ? ' \u00B7 ' + e.calories + ' kcal' : '') +
        (e.hrZone   ? ' \u00B7 Z' + e.hrZone : '') +
      '</span>' +
      '<span class="cardio-log-date">' + e.date + '</span>' +
    '</div>'
  ).join('');
}

document.addEventListener('DOMContentLoaded', renderCardioRecentLog);
