'use strict';

let _cardioPeriod = '30D';
let _cardioChart1 = null;
let _cardioChart2 = null;
let _cardioChart3 = null;

function _statsIconSVG(name) {
  const map = {
    sessions: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
    time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    calories: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 3-6 6-10z"/></svg>',
    activity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h4l2-4 4 8 2-4h6"/></svg>',
    streak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    xp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.4 4.8L20 8.7l-4 3.9.9 5.4L12 15.7 7.1 18l.9-5.4-4-3.9 5.6-.9z"/></svg>',
    first_rep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M8 9v6M16 9v6"/></svg>',
    on_fire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 3-6 6-10z"/></svg>',
    consistent: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/></svg>',
    iron_lungs: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    hiit_starter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    endurance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c3-5 6-7 8-7s5 2 8 7"/><path d="M9 14 11 9l2 6 2-3"/></svg>',
    calorie_crusher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 3-6 6-10z"/></svg>',
    all_rounder: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/></svg>'
  };
  return map[name] || map.activity;
}

function _readCardioLog() {
  if (typeof cardioLog !== 'undefined' && Array.isArray(cardioLog)) return cardioLog;
  try {
    const raw = localStorage.getItem((typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.CARDIO) ? STORAGE_KEYS.CARDIO : 'forge_cardio');
    return raw ? JSON.parse(raw) : [];
  } catch (_err) {
    return [];
  }
}

function _toIsoDateKey(value) {
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return _isoKey(d);
}

function _normalizeCardioEntry(e) {
  const date = _toIsoDateKey(e?.date || e?.day || e?.dateKey || e?.createdAt || e?.ts || '');
  const duration = Number(e?.durationMins ?? e?.duration ?? e?.mins ?? 0) || 0;
  return {
    date,
    category: String(e?.category || e?.cat || e?.type || 'cardio').toLowerCase(),
    activity: String(e?.activity || e?.act || e?.name || '-'),
    durationMins: duration,
    calories: Number(e?.calories ?? e?.cal ?? e?.kcal ?? 0) || 0,
    hrZone: Number(e?.hrZone ?? e?.zone ?? 0) || 0,
    xpEarned: Number(e?.xpEarned ?? e?.xp ?? 0) || 0
  };
}

function _getNormalizedCardioLog() {
  return _readCardioLog().map(_normalizeCardioEntry).filter(e => !!e.date);
}

function _setCardioPeriod(period, btn) {
  _cardioPeriod = period;
  if (btn) {
    const strip = btn.closest('.cardio-period-strip');
    if (strip) strip.querySelectorAll('.cardio-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderCardioStatsPanel();
}

function _cardioFilteredLog(all) {
  if (_cardioPeriod === 'ALL') return all;
  const days = _cardioPeriod === '7D' ? 7 : _cardioPeriod === '30D' ? 30 : 90;
  const cutoff = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffMs = cutoff.getTime();
  return all.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return !Number.isNaN(d.getTime()) && d.getTime() >= cutoffMs;
  });
}

function renderCardioStatsPanel() {
  const zone = document.getElementById('cardio-stats-zone');
  if (!zone) return;

  [_cardioChart1, _cardioChart2, _cardioChart3].forEach(c => { if (c) c.destroy(); });
  _cardioChart1 = _cardioChart2 = _cardioChart3 = null;

  const all = _getNormalizedCardioLog();
  if (!all.length) {
    zone.innerHTML =
      '<div class="cardio-empty-panel">' +
        '<div class="cardio-empty-title">No cardio missions yet</div>' +
        '<div class="cardio-empty-sub">Log your first session in Cardio mode to unlock analytics.</div>' +
      '</div>';
    return;
  }

  const filtered = _cardioFilteredLog(all);
  zone.innerHTML =
    '<div class="cardio-stats-shell">' +
      '<div class="cardio-stats-head">' +
        '<div class="cardio-head-kicker">ARCADE PERFORMANCE</div>' +
        '<div class="cardio-head-title">Cardio Intelligence Deck</div>' +
        '<div class="cardio-period-strip">' +
          `<button class="cardio-period-btn${_cardioPeriod === '7D' ? ' active' : ''}" onclick="_setCardioPeriod('7D',this)">7D</button>` +
          `<button class="cardio-period-btn${_cardioPeriod === '30D' ? ' active' : ''}" onclick="_setCardioPeriod('30D',this)">30D</button>` +
          `<button class="cardio-period-btn${_cardioPeriod === '90D' ? ' active' : ''}" onclick="_setCardioPeriod('90D',this)">90D</button>` +
          `<button class="cardio-period-btn${_cardioPeriod === 'ALL' ? ' active' : ''}" onclick="_setCardioPeriod('ALL',this)">ALL</button>` +
        '</div>' +
      '</div>' +
      '<div class="cardio-kpi-grid" id="cardio-sg"></div>' +
      '<div class="cardio-chart-deck" id="cardio-charts-zone"></div>' +
      '<div class="cardio-ach-head">Achievements</div>' +
      '<div id="cardio-badge-grid-zone"></div>' +
    '</div>';

  _renderCardioStatCards(filtered);
  _renderCardioCharts(filtered);
  _renderCardioBadgeGrid(_calcCardioBadges(all));
}

function _renderCardioStatCards(filtered) {
  const sg = document.getElementById('cardio-sg');
  if (!sg) return;

  const sessions = filtered.length;
  const totalMins = filtered.reduce((a, e) => a + (e.durationMins || 0), 0);
  const timeStr = totalMins >= 60 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : `${totalMins}m`;
  const avgMin = sessions ? Math.round(totalMins / sessions) : 0;

  const calsFiltered = filtered.filter(e => (e.calories || 0) > 0);
  const totalCal = calsFiltered.reduce((a, e) => a + (e.calories || 0), 0);
  const calStr = calsFiltered.length ? totalCal.toLocaleString() : '-';
  const calSub = calsFiltered.length ? `avg ${Math.round(totalCal / sessions)} kcal/session` : 'optional input';

  const actCount = {};
  filtered.forEach(e => { actCount[e.activity] = (actCount[e.activity] || 0) + 1; });
  const topAct = Object.keys(actCount).sort((a, b) => actCount[b] - actCount[a])[0] || '-';
  const topActTimes = topAct !== '-' ? `${actCount[topAct]} sessions` : 'no activity yet';

  const streak = typeof _calcCardioStreak === 'function' ? _calcCardioStreak() : 0;
  const totalXP = filtered.reduce((a, e) => a + (e.xpEarned || 0), 0);

  sg.innerHTML = [
    ['sessions', 'Sessions', sessions, 'logged days'],
    ['time', 'Total Time', timeStr, `avg ${avgMin} min/session`],
    ['calories', 'Calories', calStr, calSub],
    ['activity', 'Top Activity', topAct, topActTimes],
    ['streak', 'Current Streak', streak, 'consecutive days'],
    ['xp', 'Total XP', totalXP, 'cardio only']
  ].map(([icon, label, val, sub]) =>
    '<div class="cardio-kpi-card">' +
      `<div class="cardio-kpi-icon">${_statsIconSVG(icon)}</div>` +
      '<div class="cardio-kpi-main">' +
        `<div class="cardio-kpi-label">${label}</div>` +
        `<div class="cardio-kpi-value">${val}</div>` +
        `<div class="cardio-kpi-sub">${sub}</div>` +
      '</div>' +
    '</div>'
  ).join('');
}

function _chartThemeOptions() {
  const style = getComputedStyle(document.body);
  const text = (style.getPropertyValue('--text1') || '#d7ffe8').trim();
  const sub = (style.getPropertyValue('--text3') || '#8ac7ad').trim();
  const grid = 'rgba(90, 255, 170, 0.14)';
  return {
    text,
    sub,
    grid,
    tooltip: {
      backgroundColor: '#081713',
      titleColor: '#c7ffe6',
      bodyColor: '#d8fff1',
      borderColor: 'rgba(57,255,143,.35)',
      borderWidth: 1,
      padding: 10,
      displayColors: false
    }
  };
}

function _renderCardioCharts(filtered) {
  const zone = document.getElementById('cardio-charts-zone');
  if (!zone) return;
  if (!filtered.length) {
    zone.innerHTML = '<div class="cardio-no-data">No workouts in this selected period.</div>';
    return;
  }
  if (typeof Chart === 'undefined') {
    zone.innerHTML = '<div class="cardio-no-data">Charts unavailable (Chart.js missing).</div>';
    return;
  }

  const CAT_COL = { hiit: '#ffd34d', cardio: '#43ff99', sports: '#56c7ff', recovery: '#8affda' };
  const catPriority = ['hiit', 'cardio', 'sports', 'recovery'];
  const weekMap = {};
  filtered.forEach(e => {
    const d = new Date(e.date + 'T00:00:00');
    const sun = new Date(d);
    sun.setDate(d.getDate() - d.getDay());
    const wk = _isoKey(sun);
    if (!weekMap[wk]) weekMap[wk] = { count: 0, cats: {} };
    weekMap[wk].count++;
    const cat = e.category || 'cardio';
    weekMap[wk].cats[cat] = (weekMap[wk].cats[cat] || 0) + 1;
  });

  const wkLabels = Object.keys(weekMap).sort();
  const wkCounts = wkLabels.map(k => weekMap[k].count);
  const wkColors = wkLabels.map(k => {
    const cats = weekMap[k].cats;
    const maxVal = Math.max(...catPriority.map(c => cats[c] || 0));
    const dom = catPriority.find(c => (cats[c] || 0) === maxVal);
    return CAT_COL[dom] || '#43ff99';
  });
  const wkFormatted = wkLabels.map(k => {
    const d = new Date(k + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const isWeekly = _cardioPeriod === '90D' || _cardioPeriod === 'ALL';
  const durMap = {};
  filtered.forEach(e => {
    let key = e.date;
    if (isWeekly) {
      const d = new Date(e.date + 'T00:00:00');
      const sun = new Date(d);
      sun.setDate(d.getDate() - d.getDay());
      key = _isoKey(sun);
    }
    durMap[key] = (durMap[key] || 0) + (e.durationMins || 0);
  });

  const durKeys = Object.keys(durMap).sort();
  const durVals = durKeys.map(k => durMap[k]);
  const durLabels = durKeys.map(k => {
    const d = new Date(k + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const zoneCount = [0, 0, 0, 0, 0, 0];
  filtered.forEach(e => {
    const z = e.hrZone || 0;
    zoneCount[z >= 1 && z <= 5 ? z : 0]++;
  });
  const allNoZone = filtered.every(e => !e.hrZone);

  zone.innerHTML =
    '<div class="cardio-chart-card">' +
      '<div class="cardio-chart-label">Weekly Sessions</div>' +
      '<div class="cardio-chart-wrap"><canvas id="cc1"></canvas></div>' +
    '</div>' +
    '<div class="cardio-chart-card">' +
      '<div class="cardio-chart-label">Duration Trend</div>' +
      '<div class="cardio-chart-wrap"><canvas id="cc2"></canvas></div>' +
    '</div>' +
    (allNoZone
      ? '<div class="cardio-no-data">No HR zone data logged yet.</div>'
      : '<div class="cardio-chart-card"><div class="cardio-chart-label">HR Zone Distribution</div><div class="cardio-chart-wrap"><canvas id="cc3"></canvas></div></div>');

  const theme = _chartThemeOptions();

  _cardioChart1 = new Chart(document.getElementById('cc1'), {
    type: 'bar',
    data: {
      labels: wkFormatted,
      datasets: [{ data: wkCounts, backgroundColor: wkColors, borderRadius: 8, borderSkipped: false }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: theme.tooltip },
      scales: {
        x: { ticks: { color: theme.sub }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1, color: theme.sub }, grid: { color: theme.grid } }
      }
    }
  });

  _cardioChart2 = new Chart(document.getElementById('cc2'), {
    type: 'line',
    data: {
      labels: durLabels,
      datasets: [{
        data: durVals,
        borderColor: '#43ff99',
        borderWidth: 3,
        backgroundColor: 'rgba(67,255,153,0.14)',
        pointBackgroundColor: '#b8ffd8',
        pointBorderColor: '#43ff99',
        pointRadius: 3,
        fill: true,
        tension: 0.28
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: theme.tooltip },
      scales: {
        x: { ticks: { color: theme.sub }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: theme.sub }, grid: { color: theme.grid } }
      }
    }
  });

  if (!allNoZone) {
    _cardioChart3 = new Chart(document.getElementById('cc3'), {
      type: 'doughnut',
      data: {
        labels: ['No Zone', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5'],
        datasets: [{
          data: zoneCount,
          borderWidth: 1,
          borderColor: '#07110f',
          backgroundColor: ['#22312c', '#8affda', '#56c7ff', '#ffd34d', '#ff9958', '#ff5e70']
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'right', labels: { color: theme.sub, boxWidth: 10, boxHeight: 10 } }, tooltip: theme.tooltip }
      }
    });
  }
}

function _calcCardioBadges(log) {
  const sortedLog = [...log].sort((a, b) => a.date.localeCompare(b.date));
  const streak = typeof _calcCardioStreak === 'function' ? _calcCardioStreak() : 0;
  const today = _isoKey(new Date());

  let cumCal = 0;
  let calCrusherDate = null;
  for (const e of sortedLog) {
    cumCal += e.calories || 0;
    if (cumCal >= 5000 && !calCrusherDate) calCrusherDate = e.date;
  }

  const catsSeen = new Set();
  let allRounderDate = null;
  for (const e of sortedLog) {
    catsSeen.add(e.category);
    if (catsSeen.size === 4 && !allRounderDate) allRounderDate = e.date;
  }

  const hiitEntries = sortedLog.filter(e => e.category === 'hiit');
  const enduranceEntry = sortedLog.find(e => (e.durationMins || 0) >= 60);

  return [
    { id: 'first_rep', icon: 'first_rep', name: 'First Rep', unlocked: sortedLog.length >= 1, unlockedDate: sortedLog.length ? sortedLog[0].date : null, hint: 'Log first session' },
    { id: 'on_fire', icon: 'on_fire', name: 'On Fire', unlocked: streak >= 3, unlockedDate: streak >= 3 ? today : null, hint: '3-day streak' },
    { id: 'consistent', icon: 'consistent', name: 'Consistent', unlocked: streak >= 7, unlockedDate: streak >= 7 ? today : null, hint: '7-day streak' },
    { id: 'iron_lungs', icon: 'iron_lungs', name: 'Iron Lungs', unlocked: streak >= 30, unlockedDate: streak >= 30 ? today : null, hint: '30-day streak' },
    { id: 'hiit_starter', icon: 'hiit_starter', name: 'HIIT Starter', unlocked: hiitEntries.length >= 5, unlockedDate: hiitEntries.length >= 5 ? hiitEntries[4].date : null, hint: '5 HIIT sessions' },
    { id: 'endurance', icon: 'endurance', name: 'Endurance', unlocked: !!enduranceEntry, unlockedDate: enduranceEntry ? enduranceEntry.date : null, hint: '60+ minute session' },
    { id: 'calorie_crusher', icon: 'calorie_crusher', name: 'Calorie Crusher', unlocked: cumCal >= 5000, unlockedDate: calCrusherDate, hint: 'Burn 5000 kcal total' },
    { id: 'all_rounder', icon: 'all_rounder', name: 'All-Rounder', unlocked: catsSeen.size === 4, unlockedDate: allRounderDate, hint: 'Train all 4 categories' }
  ];
}

function _renderCardioBadgeGrid(badges) {
  const zone = document.getElementById('cardio-badge-grid-zone');
  if (!zone) return;
  zone.innerHTML = '<div class="cardio-badge-grid">' + badges.map(b =>
    `<div class="cardio-badge-card${b.unlocked ? ' unlocked' : ' locked'}">` +
      `<div class="cardio-badge-emoji">${_statsIconSVG(b.icon)}</div>` +
      `<div class="cardio-badge-name">${b.unlocked ? b.name : '???'}</div>` +
      `<div class="cardio-badge-hint">${b.unlocked ? 'Unlocked' : b.hint}</div>` +
      (b.unlocked && b.unlockedDate ? `<div class="cardio-badge-date">${b.unlockedDate}</div>` : '') +
    '</div>'
  ).join('') + '</div>';
}
