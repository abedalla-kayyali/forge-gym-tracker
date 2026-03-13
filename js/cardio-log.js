// FORGE Gym Tracker - Cardio / Recovery logging (v46)

'use strict';

// ── Globals ───────────────────────────────────────────────────────────────────
let cardioLog          = _lsGet(STORAGE_KEYS.CARDIO, []);
let _selectedCardioAct = null; // { cat, act }
let _selectedHRZone    = 0;

const _cardioCategoryIcon = {
  cardio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h4l2-4 4 8 2-4h6"/></svg>',
  hiit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
  sports: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/></svg>',
  recovery: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 3-6 6-10z"/></svg>'
};

function _activityIconSVG(cat) {
  return _cardioCategoryIcon[cat] || _cardioCategoryIcon.cardio;
}

function _initCardioLogShell() {
  const zone = document.getElementById('cardio-zone');
  if (!zone || zone.dataset.arcadeInit === '1') return;
  zone.dataset.arcadeInit = '1';
  zone.classList.add('cardio-log-shell');

  const form = document.getElementById('cardio-form');
  if (form) form.classList.add('cardio-mission-card');
  const recent = document.getElementById('cardio-recent-wrap');
  if (recent) recent.classList.add('cardio-recent-shell');

  zone.querySelectorAll('.cardio-cat-label').forEach(label => {
    const raw = label.textContent || '';
    const txt = raw.replace(/[^\x20-\x7E]/g, '').trim() || raw.replace(/\s+/g, ' ').trim();
    const parent = label.closest('.cardio-cat-block');
    const cat = parent ? parent.querySelector('.cardio-act-btn')?.dataset?.cat : '';
    label.innerHTML =
      '<span class="cardio-label-icon">' + _activityIconSVG(cat) + '</span>' +
      '<span class="cardio-label-text">' + txt + '</span>';
  });

  zone.querySelectorAll('.cardio-act-btn').forEach(btn => {
    if (btn.dataset.uiInit === '1') return;
    btn.dataset.uiInit = '1';
    const label = btn.dataset.act || btn.textContent.replace(/[^\x20-\x7E]/g, '').trim();
    const cat = btn.dataset.cat || 'cardio';
    btn.innerHTML =
      '<span class="cardio-btn-icon">' + _activityIconSVG(cat) + '</span>' +
      '<span class="cardio-btn-label">' + label + '</span>' +
      '<span class="cardio-streak-chip" data-chip-for="' + label + '">--</span>';
  });
}

// ── Activity selection ────────────────────────────────────────────────────────
function selectCardioActivity(btn) {
  _initCardioLogShell();
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
  const _mult = { hiit: 1.5, cardio: 1.2, sports: 1.1, recovery: 1.0 };
  const _base = Math.round(dur * 0.5);
  const _bonus = _selectedHRZone * 2;
  const xpEarned = Math.round(_base * (_mult[_selectedCardioAct.cat] || 1.0)) + _bonus;

  const entry = {
    id:           Date.now(),
    date:         _isoKey(new Date()),
    category:     _selectedCardioAct.cat,
    activity:     _selectedCardioAct.act,
    durationMins: dur,
    calories:     cal,
    hrZone:       _selectedHRZone,
    temp:         cond,
    xpEarned:     xpEarned
  };

  cardioLog.push(entry);
  localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(cardioLog));
  if (typeof _sessionActive !== 'undefined' && _sessionActive) {
    if (typeof _sessionWkMuscles !== 'undefined') _sessionWkMuscles.add('Cardio');
    if (typeof _sessionWkLogs !== 'undefined') {
      _sessionWkLogs.push({
        mode: 'cardio',
        muscle: 'Cardio',
        activity: _selectedCardioAct.act,
        exercise: _selectedCardioAct.act,
        durationMins: dur,
        calories: cal,
        hrZone: _selectedHRZone,
        sets: [],
        volume: 0,
        isPR: false
      });
    }
    if (typeof _updateSessionCard === 'function') _updateSessionCard();
    if (typeof _checkEndSessionNudge === 'function') _checkEndSessionNudge();
  }

  // Reset form
  document.getElementById('cardio-dur-input').value  = '';
  document.getElementById('cardio-cal-input').value  = '';
  document.getElementById('cardio-cond-select').value = '';
  selectHRZone(0);
  document.querySelectorAll('.cardio-act-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cardio-form').style.display = 'none';
  _selectedCardioAct = null;

  renderCardioRecentLog();
  _renderCardioStreakBar();
  _renderCardioActivityStreaks();
  showToast(`Cardio logged! +${xpEarned} XP \uD83D\uDE80`);
  if (typeof updateXPBar === 'function') updateXPBar();
}

// ── Recent log ────────────────────────────────────────────────────────────────
function _calcCardioStreak() {
  const todayKey = _isoKey(new Date());
  const dateSet = new Set((Array.isArray(cardioLog) ? cardioLog : []).map(e => {
    const raw = e && (e.date || e.day || e.dateKey || e.createdAt || e.ts);
    if (!raw) return '';
    const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '' : _isoKey(d);
  }).filter(Boolean));
  if (!dateSet.has(todayKey)) return 0;
  let count = 1;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (dateSet.has(_isoKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function _renderCardioStreakBar() {
  const el = document.getElementById('cardio-streak-bar');
  if (!el) return;
  _initCardioLogShell();
  const sessions = Array.isArray(cardioLog) ? cardioLog.length : 0;
  const totalMins = (Array.isArray(cardioLog) ? cardioLog : []).reduce((a, e) => a + (Number(e.durationMins || e.duration || 0) || 0), 0);
  const streak = _calcCardioStreak();
  const streakText = streak === 0
    ? 'Start your streak today'
    : `${streak} day${streak > 1 ? 's' : ''} streak active`;
  el.innerHTML =
    '<div class="cardio-streak-kicker">ARCADE CARDIO</div>' +
    `<div class="cardio-streak-main">\uD83D\uDD25 ${streakText}</div>` +
    `<div class="cardio-streak-sub">${sessions} missions logged · ${totalMins} total mins</div>`;
}

function _normalizeCardioDate(raw) {
  if (!raw) return '';
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '' : _isoKey(d);
}

function _calcActivityStreak(activityName) {
  if (!activityName) return 0;
  const target = String(activityName).toLowerCase();
  const daySet = new Set((Array.isArray(cardioLog) ? cardioLog : []).map(e => {
    const act = String(e?.activity || e?.act || e?.name || '').toLowerCase();
    if (act !== target) return '';
    return _normalizeCardioDate(e?.date || e?.day || e?.dateKey || e?.createdAt || e?.ts);
  }).filter(Boolean));
  if (!daySet.size) return 0;
  const today = _isoKey(new Date());
  if (!daySet.has(today)) return 0;
  let count = 1;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (daySet.has(_isoKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function _renderCardioActivityStreaks() {
  _initCardioLogShell();
  document.querySelectorAll('.cardio-act-btn').forEach(btn => {
    const chip = btn.querySelector('.cardio-streak-chip');
    if (!chip) return;
    const label = btn.dataset.act || chip.dataset.chipFor || '';
    const streak = _calcActivityStreak(label);
    if (streak > 0) {
      chip.textContent = `\uD83D\uDD25 ${streak}d`;
      chip.classList.add('active');
    } else {
      chip.textContent = '0d';
      chip.classList.remove('active');
    }
  });
}

function renderCardioRecentLog() {
  _initCardioLogShell();
  const wrap = document.getElementById('cardio-recent-wrap');
  const el   = document.getElementById('cardio-recent-log');
  if (!wrap || !el) return;
  const last5 = [...cardioLog].reverse().slice(0, 5);
  if (!last5.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  el.innerHTML = last5.map(e =>
    ((dur, kcal, zone, date) =>
    '<div class="cardio-log-row">' +
      '<span class="cardio-log-dot"></span>' +
      '<span class="cardio-log-main">' +
        '<span class="cardio-log-act">' + e.activity + '</span>' +
        '<span class="cardio-log-meta">' + dur + ' min' +
          (kcal ? ' · ' + kcal + ' kcal' : '') +
          (zone ? ' · Z' + zone : '') +
        '</span>' +
      '</span>' +
      '<span class="cardio-log-date">' + date + '</span>' +
    '</div>'
    )(Number(e.durationMins || e.duration || e.mins || 0), Number(e.calories || e.cal || e.kcal || 0), Number(e.hrZone || e.zone || 0), e.date || e.day || '')
  ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderCardioRecentLog();
  _renderCardioStreakBar();
  _renderCardioActivityStreaks();
});
