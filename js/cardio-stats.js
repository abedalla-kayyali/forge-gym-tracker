'use strict';

let _cardioPeriod = '30D';
let _cardioChart1 = null;
let _cardioChart2 = null;
let _cardioChart3 = null;

function _cs(en, ar) {
  return (typeof currentLang !== 'undefined' && currentLang === 'ar') ? ar : en;
}

function _cardioLocale() {
  return (typeof currentLang !== 'undefined' && currentLang === 'ar') ? 'ar-SA' : 'en-US';
}

function _statsIconSVG(name) {
  const map = {
    sessions: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
    time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    calories: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 3-6 6-10z"/></svg>',
    activity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h4l2-4 4 8 2-4h6"/></svg>',
    streak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    xp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.4 4.8L20 8.7l-4 3.9.9 5.4L12 15.7 7.1 18l.9-5.4-4-3.9 5.6-.9z"/></svg>',
    consistency: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h4l2-4 4 8 2-4h4"/></svg>',
    intensity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    momentum: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16c2.5-3 5-5 8-5s5.5 2 8 5"/><path d="M12 11V5"/></svg>',
    variety: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/></svg>',
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

function _cardioCategoryLabel(cat) {
  const key = String(cat || '').toLowerCase();
  if (key === 'hiit') return 'HIIT';
  if (key === 'sports') return _cs('Sports', 'رياضة');
  if (key === 'recovery') return _cs('Recovery', 'تعافي');
  return _cs('Cardio', 'كارديو');
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

function _fmtCardioDate(isoKey) {
  const d = new Date(String(isoKey || '') + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(isoKey || '');
  return d.toLocaleDateString(_cardioLocale(), { month: 'short', day: 'numeric' });
}

function _fmtDurationMins(totalMins) {
  const mins = Math.max(0, parseInt(totalMins, 10) || 0);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return _cs(`${h}h ${m}m`, `${h}س ${m}د`);
  }
  return _cs(`${mins}m`, `${mins}د`);
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
        '<div class="cardio-empty-title">' + _cs('No cardio sessions yet', 'لا توجد جلسات كارديو بعد') + '</div>' +
        '<div class="cardio-empty-sub">' + _cs('Log your first session in Cardio mode to unlock analytics.', 'سجل أول جلسة كارديو لفتح التحليلات.') + '</div>' +
      '</div>';
    return;
  }

  const filtered = _cardioFilteredLog(all);
  zone.innerHTML =
    '<div class="cardio-stats-shell">' +
      '<div class="cardio-stats-head">' +
        '<div class="cardio-head-kicker">' + _cs('ARCADE PERFORMANCE', 'أداء الكارديو التفاعلي') + '</div>' +
        '<div class="cardio-head-title">' + _cs('Cardio Intelligence Deck', 'لوحة ذكاء الكارديو') + '</div>' +
        '<div class="cardio-period-strip">' +
          `<button class="cardio-period-btn${_cardioPeriod === '7D' ? ' active' : ''}" onclick="_setCardioPeriod('7D',this)">7D</button>` +
          `<button class="cardio-period-btn${_cardioPeriod === '30D' ? ' active' : ''}" onclick="_setCardioPeriod('30D',this)">30D</button>` +
          `<button class="cardio-period-btn${_cardioPeriod === '90D' ? ' active' : ''}" onclick="_setCardioPeriod('90D',this)">90D</button>` +
          `<button class="cardio-period-btn${_cardioPeriod === 'ALL' ? ' active' : ''}" onclick="_setCardioPeriod('ALL',this)">ALL</button>` +
        '</div>' +
      '</div>' +
      '<div class="cardio-kpi-grid" id="cardio-sg"></div>' +
      '<div class="cardio-insight-grid" id="cardio-insights-zone"></div>' +
      '<div class="cardio-chart-deck" id="cardio-charts-zone"></div>' +
      '<div class="cardio-ach-head">' + _cs('Achievements', 'الإنجازات') + '</div>' +
      '<div id="cardio-badge-grid-zone"></div>' +
    '</div>';

  _renderCardioStatCards(filtered);
  _renderCardioInsights(filtered, all);
  _renderCardioCharts(filtered);
  _renderCardioBadgeGrid(_calcCardioBadges(all));
}

function _renderCardioStatCards(filtered) {
  const sg = document.getElementById('cardio-sg');
  if (!sg) return;

  const sessions = filtered.length;
  const totalMins = filtered.reduce((a, e) => a + (e.durationMins || 0), 0);
  const avgMin = sessions ? Math.round(totalMins / sessions) : 0;

  const calsFiltered = filtered.filter(e => (e.calories || 0) > 0);
  const totalCal = calsFiltered.reduce((a, e) => a + (e.calories || 0), 0);
  const calStr = calsFiltered.length ? totalCal.toLocaleString() : '-';
  const calSub = calsFiltered.length
    ? `${_cs('avg', 'متوسط')} ${Math.round(totalCal / Math.max(calsFiltered.length, 1))} ${_cs('kcal/session', 'سعرة/جلسة')}`
    : _cs('optional input', 'إدخال اختياري');

  const actCount = {};
  filtered.forEach(e => { actCount[e.activity] = (actCount[e.activity] || 0) + 1; });
  const topAct = Object.keys(actCount).sort((a, b) => actCount[b] - actCount[a])[0] || '-';
  const topActTimes = topAct !== '-' ? `${actCount[topAct]} ${_cs('sessions', 'جلسات')}` : _cs('no activity yet', 'لا يوجد نشاط بعد');

  const streak = typeof _calcCardioStreak === 'function' ? _calcCardioStreak() : 0;
  const totalXP = filtered.reduce((a, e) => a + (e.xpEarned || 0), 0);

  sg.innerHTML = [
    ['sessions', _cs('Sessions', 'الجلسات'), sessions, _cs('logged sessions', 'جلسات مسجلة')],
    ['time', _cs('Total Time', 'إجمالي الوقت'), _fmtDurationMins(totalMins), `${_cs('avg', 'متوسط')} ${avgMin} ${_cs('min/session', 'د/جلسة')}`],
    ['calories', _cs('Calories', 'السعرات'), calStr, calSub],
    ['activity', _cs('Top Activity', 'أكثر نشاط'), topAct, topActTimes],
    ['streak', _cs('Current Streak', 'السلسلة الحالية'), streak, _cs('consecutive days', 'أيام متتالية')],
    ['xp', _cs('Total XP', 'إجمالي النقاط'), totalXP, _cs('cardio only', 'كارديو فقط')]
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

function _renderCardioInsights(filtered, all) {
  const zone = document.getElementById('cardio-insights-zone');
  if (!zone) return;

  if (!filtered.length) {
    zone.innerHTML = '<div class="cardio-no-data">' + _cs('No sessions in this selected period.', 'لا توجد جلسات في الفترة المختارة.') + '</div>';
    return;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msDay = 86400000;

  const minsLast7 = all
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return !Number.isNaN(d.getTime()) && ((today.getTime() - d.getTime()) / msDay) <= 6;
    })
    .reduce((sum, e) => sum + (e.durationMins || 0), 0);

  const targetWeekly = 150;
  const weeklyPct = Math.min(999, Math.round((minsLast7 / Math.max(targetWeekly, 1)) * 100));

  const zoneEntries = filtered.filter(e => e.hrZone >= 1 && e.hrZone <= 5);
  const hardEntries = zoneEntries.filter(e => e.hrZone >= 3).length;
  const highIntensityPct = zoneEntries.length ? Math.round((hardEntries / zoneEntries.length) * 100) : 0;

  const recent14 = all.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    const delta = (today.getTime() - d.getTime()) / msDay;
    return delta >= 0 && delta < 14;
  }).reduce((sum, e) => sum + (e.durationMins || 0), 0);

  const prior14 = all.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    const delta = (today.getTime() - d.getTime()) / msDay;
    return delta >= 14 && delta < 28;
  }).reduce((sum, e) => sum + (e.durationMins || 0), 0);

  const momentumDelta = recent14 - prior14;
  const momentumLabel = momentumDelta > 0
    ? _cs(`+${momentumDelta} min vs last 2 weeks`, `+${momentumDelta} د مقارنة بالأسبوعين السابقين`)
    : momentumDelta < 0
    ? _cs(`${momentumDelta} min vs last 2 weeks`, `${momentumDelta} د مقارنة بالأسبوعين السابقين`)
    : _cs('Stable vs previous 2 weeks', 'ثابت مقارنة بالأسبوعين السابقين');

  const categorySet = new Set(filtered.map(e => e.category));
  const varietyScore = Math.min(100, Math.round((categorySet.size / 4) * 100));

  let tip = _cs('Keep your rhythm. Add one light recovery day this week.', 'حافظ على النسق. أضف يوم تعافٍ خفيف هذا الأسبوع.');
  if (minsLast7 < 90) {
    tip = _cs('You are under target. Add 3 sessions of 25-30 min to rebuild consistency.', 'أنت أقل من الهدف. أضف 3 جلسات (25-30 دقيقة) لاستعادة الانتظام.');
  } else if (zoneEntries.length >= 3 && highIntensityPct < 20) {
    tip = _cs('Intensity is low. Add one Z3+ interval session for cardio progression.', 'الشدة منخفضة. أضف جلسة فترات Z3+ لتحسين تطور الكارديو.');
  } else if (varietyScore < 50) {
    tip = _cs('Variety is limited. Rotate categories to reduce boredom and plateaus.', 'التنوع منخفض. بدّل بين الفئات لتجنب الملل والثبات.');
  }

  const cards = [
    {
      icon: 'consistency',
      label: _cs('Weekly Consistency', 'الالتزام الأسبوعي'),
      value: `${weeklyPct}%`,
      sub: _cs(`${minsLast7}/${targetWeekly} min this week`, `${minsLast7}/${targetWeekly} دقيقة هذا الأسبوع`)
    },
    {
      icon: 'intensity',
      label: _cs('Intensity Mix', 'مزيج الشدة'),
      value: zoneEntries.length ? `${highIntensityPct}%` : '--',
      sub: zoneEntries.length
        ? _cs('share of sessions in Z3-Z5', 'نسبة الجلسات في Z3-Z5')
        : _cs('log HR zone to unlock', 'سجل نطاق النبض لتفعيل المؤشر')
    },
    {
      icon: 'momentum',
      label: _cs('Momentum', 'الزخم'),
      value: _fmtDurationMins(recent14),
      sub: momentumLabel
    },
    {
      icon: 'variety',
      label: _cs('Variety Score', 'درجة التنوع'),
      value: `${varietyScore}%`,
      sub: _cs(`${categorySet.size} categories active`, `${categorySet.size} فئات نشطة`)
    }
  ];

  zone.innerHTML = cards.map(c =>
    '<div class="cardio-insight-card">' +
      `<div class="cardio-insight-icon">${_statsIconSVG(c.icon)}</div>` +
      '<div class="cardio-insight-main">' +
        `<div class="cardio-insight-label">${c.label}</div>` +
        `<div class="cardio-insight-value">${c.value}</div>` +
        `<div class="cardio-insight-sub">${c.sub}</div>` +
      '</div>' +
    '</div>'
  ).join('') +
  `<div class="cardio-coach-tip"><strong>${_cs('Coach Tip', 'نصيحة المدرب')}:</strong> ${tip}</div>`;
}

function _chartThemeOptions() {
  const style = getComputedStyle(document.body);
  const sub = (style.getPropertyValue('--text3') || '#8ac7ad').trim();
  const grid = 'rgba(90, 255, 170, 0.14)';
  return {
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
    zone.innerHTML = '<div class="cardio-no-data">' + _cs('No workouts in this selected period.', 'لا توجد تمارين في الفترة المختارة.') + '</div>';
    return;
  }
  if (typeof Chart === 'undefined') {
    zone.innerHTML = '<div class="cardio-no-data">' + _cs('Charts unavailable (Chart.js missing).', 'الرسوم غير متاحة (Chart.js غير موجود).') + '</div>';
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
  const wkFormatted = wkLabels.map(_fmtCardioDate);

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
  const durLabels = durKeys.map(_fmtCardioDate);

  const zoneCount = [0, 0, 0, 0, 0, 0];
  filtered.forEach(e => {
    const z = e.hrZone || 0;
    zoneCount[z >= 1 && z <= 5 ? z : 0]++;
  });
  const allNoZone = filtered.every(e => !e.hrZone);

  zone.innerHTML =
    '<div class="cardio-chart-card">' +
      '<div class="cardio-chart-label">' + _cs('Weekly Sessions', 'الجلسات الأسبوعية') + '</div>' +
      '<div class="cardio-chart-wrap"><canvas id="cc1"></canvas></div>' +
    '</div>' +
    '<div class="cardio-chart-card">' +
      '<div class="cardio-chart-label">' + _cs('Duration Trend', 'اتجاه مدة التمرين') + '</div>' +
      '<div class="cardio-chart-wrap"><canvas id="cc2"></canvas></div>' +
    '</div>' +
    (allNoZone
      ? '<div class="cardio-no-data">' + _cs('No HR zone data logged yet.', 'لا توجد بيانات نطاق نبض مسجلة بعد.') + '</div>'
      : '<div class="cardio-chart-card"><div class="cardio-chart-label">' + _cs('HR Zone Distribution', 'توزيع نطاقات النبض') + '</div><div class="cardio-chart-wrap"><canvas id="cc3"></canvas></div></div>');

  const theme = _chartThemeOptions();

  _cardioChart1 = new Chart(document.getElementById('cc1'), {
    type: 'bar',
    data: {
      labels: wkFormatted,
      datasets: [{ data: wkCounts, backgroundColor: wkColors, borderRadius: 8, borderSkipped: false }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label: (ctx) => `${ctx.raw} ${_cs('sessions', 'جلسات')}`
          }
        }
      },
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
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label: (ctx) => `${ctx.raw} ${_cs('min', 'د')}`
          }
        }
      },
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
        labels: [_cs('No Zone', 'بدون نطاق'), 'Z1', 'Z2', 'Z3', 'Z4', 'Z5'],
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
        plugins: {
          legend: { position: 'right', labels: { color: theme.sub, boxWidth: 10, boxHeight: 10 } },
          tooltip: {
            ...theme.tooltip,
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw} ${_cs('sessions', 'جلسات')}`
            }
          }
        }
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
    { id: 'first_rep', icon: 'first_rep', name: _cs('First Rep', 'أول جلسة'), unlocked: sortedLog.length >= 1, unlockedDate: sortedLog.length ? sortedLog[0].date : null, hint: _cs('Log first session', 'سجل أول جلسة') },
    { id: 'on_fire', icon: 'on_fire', name: _cs('On Fire', 'مشتعل'), unlocked: streak >= 3, unlockedDate: streak >= 3 ? today : null, hint: _cs('3-day streak', 'سلسلة 3 أيام') },
    { id: 'consistent', icon: 'consistent', name: _cs('Consistent', 'منتظم'), unlocked: streak >= 7, unlockedDate: streak >= 7 ? today : null, hint: _cs('7-day streak', 'سلسلة 7 أيام') },
    { id: 'iron_lungs', icon: 'iron_lungs', name: _cs('Iron Lungs', 'لياقة حديدية'), unlocked: streak >= 30, unlockedDate: streak >= 30 ? today : null, hint: _cs('30-day streak', 'سلسلة 30 يومًا') },
    { id: 'hiit_starter', icon: 'hiit_starter', name: _cs('HIIT Starter', 'بداية HIIT'), unlocked: hiitEntries.length >= 5, unlockedDate: hiitEntries.length >= 5 ? hiitEntries[4].date : null, hint: _cs('5 HIIT sessions', '5 جلسات HIIT') },
    { id: 'endurance', icon: 'endurance', name: _cs('Endurance', 'تحمل'), unlocked: !!enduranceEntry, unlockedDate: enduranceEntry ? enduranceEntry.date : null, hint: _cs('60+ minute session', 'جلسة 60+ دقيقة') },
    { id: 'calorie_crusher', icon: 'calorie_crusher', name: _cs('Calorie Crusher', 'ساحق السعرات'), unlocked: cumCal >= 5000, unlockedDate: calCrusherDate, hint: _cs('Burn 5000 kcal total', 'احرق 5000 سعرة إجمالًا') },
    { id: 'all_rounder', icon: 'all_rounder', name: _cs('All-Rounder', 'شامل'), unlocked: catsSeen.size === 4, unlockedDate: allRounderDate, hint: _cs('Train all 4 categories', 'تمرن في كل الفئات الأربع') }
  ];
}

function _renderCardioBadgeGrid(badges) {
  const zone = document.getElementById('cardio-badge-grid-zone');
  if (!zone) return;
  zone.innerHTML = '<div class="cardio-badge-grid">' + badges.map(b =>
    `<div class="cardio-badge-card${b.unlocked ? ' unlocked' : ' locked'}">` +
      `<div class="cardio-badge-emoji">${_statsIconSVG(b.icon)}</div>` +
      `<div class="cardio-badge-name">${b.unlocked ? b.name : _cs('Locked', 'مقفل')}</div>` +
      `<div class="cardio-badge-hint">${b.unlocked ? _cs('Unlocked', 'تم الفتح') : b.hint}</div>` +
      (b.unlocked && b.unlockedDate ? `<div class="cardio-badge-date">${_fmtCardioDate(b.unlockedDate)}</div>` : '') +
    '</div>'
  ).join('') + '</div>';
}
