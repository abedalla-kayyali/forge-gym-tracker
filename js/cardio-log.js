// FORGE Gym Tracker - Cardio / Recovery logging (v46)

'use strict';

// ── Globals ───────────────────────────────────────────────────────────────────
let cardioLog          = _lsGet(STORAGE_KEYS.CARDIO, []);
let _selectedCardioAct = null; // { cat, act }
let _selectedHRZone    = 0;
let _cardioFilterCat   = '';
let _cardioSearchQuery = '';
function _cl(en, ar) {
  return (typeof currentLang !== 'undefined' && currentLang === 'ar') ? ar : en;
}

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

  const streakBar = document.getElementById('cardio-streak-bar');
  if (streakBar && !document.getElementById('cardio-filter-tools')) {
    const tools = document.createElement('div');
    tools.id = 'cardio-filter-tools';
    tools.className = 'cardio-filter-tools';
    tools.innerHTML =
      '<div class="cardio-search-wrap">' +
        '<input class="cardio-search-input" type="text" placeholder="' + _cl('Search workout name...', 'ابحث باسم التمرين...') + '" oninput="setCardioSearchQuery(this.value)">' +
      '</div>' +
      '<div class="cardio-filter-row">' +
        '<button type="button" class="cardio-filter-chip active" data-cat="" onclick="setCardioFilterCategory(\'\',this)">' + _cl('All', 'الكل') + '</button>' +
        '<button type="button" class="cardio-filter-chip" data-cat="cardio" onclick="setCardioFilterCategory(\'cardio\',this)">' + _cl('Cardio', 'كارديو') + '</button>' +
        '<button type="button" class="cardio-filter-chip" data-cat="hiit" onclick="setCardioFilterCategory(\'hiit\',this)">HIIT</button>' +
        '<button type="button" class="cardio-filter-chip" data-cat="sports" onclick="setCardioFilterCategory(\'sports\',this)">' + _cl('Sports', 'رياضة') + '</button>' +
        '<button type="button" class="cardio-filter-chip" data-cat="recovery" onclick="setCardioFilterCategory(\'recovery\',this)">' + _cl('Recovery', 'تعافي') + '</button>' +
      '</div>' +
      '<div class="cardio-gated-msg" id="cardio-gated-msg"></div>';
    streakBar.insertAdjacentElement('afterend', tools);
  }

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

  _applyCardioActivityFilter();
}

function setCardioSearchQuery(val) {
  _cardioSearchQuery = String(val || '').trim();
  _applyCardioActivityFilter();
}

function setCardioFilterCategory(cat, btn) {
  _cardioFilterCat = String(cat || '').trim().toLowerCase();
  document.querySelectorAll('#cardio-filter-tools .cardio-filter-chip').forEach(chip => chip.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _applyCardioActivityFilter();
}

function _resolveCardioBlockCat(block) {
  if (!block) return '';
  if (block.id === 'cardio-custom-block') return 'custom';
  const firstBtn = block.querySelector('.cardio-act-btn');
  return String(firstBtn?.dataset?.cat || '').toLowerCase();
}

function _applyCardioActivityFilter() {
  const zone = document.getElementById('cardio-zone');
  if (!zone) return;
  const query = _cardioSearchQuery.toLowerCase();
  const hasCategory = Boolean(_cardioFilterCat);
  const hasQuery = Boolean(query);
  const hasCriteria = hasCategory || hasQuery;
  const blocks = Array.from(zone.querySelectorAll('.cardio-cat-block'));
  let visibleCount = 0;

  blocks.forEach(block => {
    const cards = Array.from(block.querySelectorAll('.cardio-act-btn'));
    let cardVisible = 0;

    cards.forEach(card => {
      const act = String(card.dataset.act || card.textContent || '').toLowerCase();
      const cardCat = String(card.dataset.cat || '').toLowerCase();
      const qMatch = !hasQuery || act.includes(query);
      const catMatch = !hasCategory || cardCat === _cardioFilterCat;
      const showCard = hasCriteria && catMatch && qMatch;
      card.style.display = showCard ? '' : 'none';
      if (showCard) cardVisible++;
    });

    block.style.display = (hasCriteria && cardVisible > 0) ? '' : 'none';
    if (block.style.display !== 'none') visibleCount++;
  });

  const gatedMsg = document.getElementById('cardio-gated-msg');
  if (gatedMsg) {
    if (!hasCriteria) {
      gatedMsg.style.display = '';
      gatedMsg.innerHTML = _cl('Pick a category or type a workout name to reveal cards', 'اختر فئة أو اكتب اسم تمرين لإظهار البطاقات');
    } else if (visibleCount === 0 && hasQuery) {
      const suggestedCat = ['cardio', 'hiit', 'sports', 'recovery'].includes(_cardioFilterCat) ? _cardioFilterCat : 'cardio';
      gatedMsg.style.display = '';
      gatedMsg.innerHTML =
        '<div class="cardio-gated-title">' + _cl('Workout not found', 'التمرين غير موجود') + '</div>' +
        '<div class="cardio-gated-sub">' + _cl('Add "', 'أضف "') + _esc(_cardioSearchQuery) + _cl('" for future use', '" للاستخدام لاحقًا') + '</div>' +
        '<div class="cardio-add-inline">' +
          '<select id="cardio-add-cat" class="cardio-add-select">' +
            '<option value="cardio"' + (suggestedCat === 'cardio' ? ' selected' : '') + '>' + _cl('Cardio', 'كارديو') + '</option>' +
            '<option value="hiit"' + (suggestedCat === 'hiit' ? ' selected' : '') + '>HIIT</option>' +
            '<option value="sports"' + (suggestedCat === 'sports' ? ' selected' : '') + '>' + _cl('Sports', 'رياضة') + '</option>' +
            '<option value="recovery"' + (suggestedCat === 'recovery' ? ' selected' : '') + '>' + _cl('Recovery', 'تعافي') + '</option>' +
          '</select>' +
          '<button type="button" class="cardio-add-inline-btn" onclick="addCardioFromSearch()">+ ' + _cl('Add Workout', 'إضافة تمرين') + '</button>' +
        '</div>';
    } else if (visibleCount === 0) {
      gatedMsg.style.display = '';
      gatedMsg.innerHTML = _cl('No workouts in this category', 'لا توجد تمارين في هذه الفئة');
    } else {
      gatedMsg.style.display = 'none';
      gatedMsg.innerHTML = '';
    }
  }

  const form = document.getElementById('cardio-form');
  if (form && !hasCriteria) form.style.display = 'none';
}

function _cardioActivityExists(name, cat) {
  const target = String(name || '').trim().toLowerCase();
  const targetCat = String(cat || '').trim().toLowerCase();
  if (!target || !targetCat) return false;
  return Array.from(document.querySelectorAll('#cardio-zone .cardio-act-btn')).some(btn =>
    String(btn.dataset.act || '').trim().toLowerCase() === target &&
    String(btn.dataset.cat || '').trim().toLowerCase() === targetCat
  );
}

function addCardioFromSearch() {
  const act = String(_cardioSearchQuery || '').trim();
  if (!act) { showToast(_cl('Type workout name first', 'اكتب اسم التمرين أولًا')); return; }
  const catEl = document.getElementById('cardio-add-cat');
  const catRaw = String(catEl?.value || _cardioFilterCat || 'cardio').toLowerCase();
  const cat = ['cardio', 'hiit', 'sports', 'recovery'].includes(catRaw) ? catRaw : 'cardio';
  if (_cardioActivityExists(act, cat)) { showToast(_cl('Workout already exists', 'التمرين موجود مسبقًا')); return; }
  _cardioCustomTypes.push({ id: 'cc_' + Date.now(), act, cat });
  _saveCardioCustomTypes();
  _renderCardioCustomCards();
  _renderCardioActivityStreaks();

  _cardioSearchQuery = '';
  const searchInput = document.querySelector('#cardio-filter-tools .cardio-search-input');
  if (searchInput) searchInput.value = '';
  const catBtn = document.querySelector('#cardio-filter-tools .cardio-filter-chip[data-cat="' + cat + '"]');
  setCardioFilterCategory(cat, catBtn);

  const freshBtn = Array.from(document.querySelectorAll('#cardio-zone .cardio-act-btn')).find(btn =>
    String(btn.dataset.act || '').trim().toLowerCase() === act.toLowerCase() &&
    String(btn.dataset.cat || '').trim().toLowerCase() === cat
  );
  if (freshBtn) selectCardioActivity(freshBtn);
  showToast(_cl('Workout added to your cards', 'تمت إضافة التمرين إلى بطاقاتك'));
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
  if (!dur) { showToast(_cl('Enter duration', 'أدخل المدة')); return; }
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
  if (typeof save === 'function') save();
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
  showToast(_cl(`Cardio logged! +${xpEarned} XP`, `تم تسجيل الكارديو! +${xpEarned} نقطة`));
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
  const latest = (Array.isArray(cardioLog) ? cardioLog : []).slice().sort((a, b) =>
    new Date(b?.date || 0) - new Date(a?.date || 0)
  )[0] || null;
  const latestName = latest ? _esc(String(latest.activity || _cl('Workout', 'تمرين'))) : '--';
  const latestDate = latest ? new Date(latest.date).toLocaleDateString((typeof currentLang !== 'undefined' && currentLang === 'ar') ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'short' }) : '--';
  const streak = _calcCardioStreak();
  const streakText = streak === 0
    ? _cl('Start your streak today', 'ابدأ تتاليك اليوم')
    : _cl(`${streak} day${streak > 1 ? 's' : ''} streak active`, `تتالي نشط: ${streak} يوم`);
  el.innerHTML =
    '<div class="cardio-streak-kicker">' + _cl('ARCADE CARDIO', 'كارديو أركيد') + '</div>' +
    `<div class="cardio-streak-main">${streakText}</div>` +
    `<div class="cardio-streak-sub">${sessions} ${_cl('sessions logged', 'جلسات مسجلة')} | ${totalMins} ${_cl('total mins', 'إجمالي دقائق')}</div>` +
    `<div class="cardio-streak-latest">${_cl('Latest:', 'الأحدث:')} ${latestName} | ${latestDate}</div>`;
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
      chip.textContent = `${streak}d`;
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
        '<span class="cardio-log-meta">' + dur + ' ' + _cl('min', 'دقيقة') +
          (kcal ? ' | ' + kcal + ' ' + _cl('kcal', 'سعرة') : '') +
          (zone ? ' | Z' + zone : '') +
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

// Custom cardio activity cards (persisted)
const _CARDIO_CUSTOM_KEY = 'forge_cardio_custom_types';
let _cardioCustomTypes = _lsGet(_CARDIO_CUSTOM_KEY, []);

function _saveCardioCustomTypes() {
  localStorage.setItem(_CARDIO_CUSTOM_KEY, JSON.stringify(_cardioCustomTypes));
}

function addCustomCardioType() {
  const act = (prompt(_cl('New cardio activity name (example: Ski Erg, Padel, Dance)', 'اسم نشاط كارديو جديد (مثال: Ski Erg, Padel, Dance)')) || '').trim();
  if (!act) return;
  const catRaw = (prompt(_cl('Category: cardio / hiit / sports / recovery', 'الفئة: cardio / hiit / sports / recovery'), 'cardio') || 'cardio').trim().toLowerCase();
  const cat = ['cardio', 'hiit', 'sports', 'recovery'].includes(catRaw) ? catRaw : 'cardio';
  const exists = _cardioCustomTypes.some(x =>
    String(x?.act || '').toLowerCase() === act.toLowerCase() && String(x?.cat || '') === cat
  );
  if (exists) { showToast(_cl('Card already exists', 'البطاقة موجودة مسبقًا')); return; }
  _cardioCustomTypes.push({ id: 'cc_' + Date.now(), act, cat });
  _saveCardioCustomTypes();
  _renderCardioCustomCards();
  _renderCardioActivityStreaks();
  showToast(_cl('Custom cardio card added', 'تمت إضافة بطاقة كارديو مخصصة'));
}

function _renderCardioCustomCards() {
  const wrap = document.getElementById('cardio-custom-grid');
  if (!wrap) return;
  if (!_cardioCustomTypes.length) {
    wrap.innerHTML = '<div class="cardio-custom-empty">' + _cl('No custom cards yet', 'لا توجد بطاقات مخصصة بعد') + '</div>';
    return;
  }
  wrap.innerHTML = _cardioCustomTypes.map(c => {
    const act = _esc(c.act || '');
    const cat = _esc(c.cat || 'cardio');
    const icon = _activityIconSVG(c.cat || 'cardio');
    return '<button class="cardio-act-btn cardio-act-btn-custom" data-cat="' + cat + '" data-act="' + act + '" onclick="selectCardioActivity(this)">' +
      '<span class="cardio-btn-icon">' + icon + '</span>' +
      '<span class="cardio-btn-label">' + act + '</span>' +
      '<span class="cardio-streak-chip" data-chip-for="' + act + '">0d</span>' +
    '</button>';
  }).join('');
  _applyCardioActivityFilter();
}

function _ensureCardioCustomUi() {
  const zone = document.getElementById('cardio-zone');
  if (!zone || document.getElementById('cardio-custom-block')) return;
  const targetBefore = document.getElementById('cardio-form');
  const block = document.createElement('div');
  block.id = 'cardio-custom-block';
  block.className = 'cardio-cat-block cardio-custom-block';
  block.innerHTML =
    '<div class="cardio-cat-label">' + _cl('CUSTOM WORKOUT TYPES', 'أنواع تمارين مخصصة') + '</div>' +
    '<button class="cardio-add-custom-btn" type="button" onclick="addCustomCardioType()">+ ' + _cl('Add Custom Card', 'إضافة بطاقة مخصصة') + '</button>' +
    '<div id="cardio-custom-grid" class="cardio-grid cardio-custom-grid"></div>';
  if (targetBefore && targetBefore.parentNode === zone) zone.insertBefore(block, targetBefore);
  else zone.appendChild(block);
  _renderCardioCustomCards();
}

const _origInitCardioLogShell = _initCardioLogShell;
_initCardioLogShell = function patchedInitCardioLogShell() {
  _origInitCardioLogShell();
  _ensureCardioCustomUi();
  _applyCardioActivityFilter();
};
