// FORGE Gym Tracker - muscle detail overlay interactions
// Extracted from index.html to keep the main script focused.

let overlayMuscle = '';
function _mo(en, ar) {
  return (typeof currentLang !== 'undefined' && currentLang === 'ar') ? ar : en;
}

function openMuscleOverlay(muscle) {
  overlayMuscle = muscle;
  const overlay = document.getElementById('muscle-overlay');

  // Header
  document.getElementById('mo-icon').innerHTML = MUSCLE_ICONS[muscle] || MUSCLE_ICONS.Chest;
  document.getElementById('mo-name').textContent = muscle.toUpperCase();

  // Stats strip
  const sessions = workouts.filter(w => w.muscle === muscle);
  const totalVol = sessions.reduce((a, w) => a + w.totalVolume, 0);
  const allWeights = sessions.flatMap(w => w.sets.map(s => s.weight));
  const pr = allWeights.length ? Math.max(...allWeights) : null;
  const lastDate = sessions.length
    ? new Date(Math.max(...sessions.map(w => new Date(w.date))))
    : null;

  document.getElementById('mo-sub').textContent = _mo(
    sessions.length + ' session' + (sessions.length !== 1 ? 's' : '') + ' logged',
    sessions.length + ' جلسة مسجلة'
  );
  document.getElementById('mo-stat-sessions').textContent = sessions.length;
  document.getElementById('mo-stat-vol').textContent = Math.round(totalVol) + (sessions[0]?.sets[0]?.unit || 'kg');
  document.getElementById('mo-stat-pr').textContent = pr ? pr + (sessions.slice(-1)[0]?.sets[0]?.unit || 'kg') : '—';
  document.getElementById('mo-stat-last').textContent = lastDate
    ? lastDate.toLocaleDateString((typeof currentLang !== 'undefined' && currentLang === 'ar') ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'short' })
    : '—';

  // Reset to history tab
  moSwitchTab('history', overlay.querySelector('.mo-tab'));
  renderOverlayHistory(muscle);

  overlay.classList.add('open');
  document.body.classList.add('scroll-locked');
}

function closeMuscleOverlay() {
  document.getElementById('muscle-overlay').classList.remove('open');
  document.body.classList.remove('scroll-locked');
}

function moSwitchTab(tab, btn) {
  document.querySelectorAll('.mo-content').forEach(el => { el.style.display = 'none'; });
  document.querySelectorAll('.mo-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('mo-tab-' + tab).style.display = 'block';
  if (btn) btn.classList.add('active');

  if (tab === 'tips') renderOverlayTips(overlayMuscle);
  if (tab === 'exercises') renderOverlayExercises(overlayMuscle);
}

function renderOverlayHistory(muscle) {
  const list = document.getElementById('mo-history-list');
  const sessions = [...workouts]
    .filter(w => w.muscle === muscle)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!sessions.length) {
    list.innerHTML = '<div class="mo-empty"><div class="mo-empty-icon">' + (MUSCLE_ICONS[muscle] || '💪') + '</div>' + _mo('No ' + muscle + ' workouts yet.<br>Select this muscle and log your first set!', 'لا توجد تمارين ' + muscle + ' بعد.<br>اختر هذه العضلة وسجّل أول مجموعة!') + '</div>';
    return;
  }

  // Group by exercise
  const byEx = new Map();
  sessions.forEach(w => {
    if (!byEx.has(w.exercise)) byEx.set(w.exercise, []);
    byEx.get(w.exercise).push(w);
  });

  let html = '';
  byEx.forEach((exSessions, exName) => {
    const shown = exSessions.slice(0, 3);
    html += '<div class="mo-history-exercise">';
    html += '<div class="mo-ex-title-bar"><span class="mo-ex-title-name">' + exName + '</span><span class="mo-ex-title-count">' + _mo(exSessions.length + ' SESSION' + (exSessions.length !== 1 ? 'S' : ''), exSessions.length + ' جلسة') + '</span></div>';
    shown.forEach(w => {
      const dateStr = new Date(w.date).toLocaleDateString((typeof currentLang !== 'undefined' && currentLang === 'ar') ? 'ar-SA' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const vol = Math.round(w.totalVolume);
      const unit = w.sets[0]?.unit || 'kg';
      html += '<div class="mo-session-card">';
      html += '<div class="mo-session-meta"><span class="mo-session-date"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;opacity:.7;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + dateStr + '</span>';
      html += '<div style="display:flex;align-items:center;gap:8px;">';
      if (w.isPR) html += '<span class="mo-session-pr"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> PR</span>';
      html += '<span class="mo-session-vol">' + _mo('Vol:', 'الحجم:') + ' ' + vol + unit + '</span></div></div>';
      html += `<div class="mo-sets-grid-hdr"><span>${t('mo.sets.num')}</span><span>${t('mo.sets.reps')}</span><span>${t('mo.sets.weight')}</span><span>${t('mo.sets.vol')}</span></div>`;
      html += '<div class="mo-sets-grid">';
      w.sets.forEach((s, i) => {
        html += '<div class="mo-set-num">' + (i + 1) + '</div>';
        html += '<div class="mo-set-val">' + s.reps + '</div>';
        html += '<div class="mo-set-val">' + s.weight + s.unit + '</div>';
        html += '<div class="mo-set-val">' + Math.round(s.reps * s.weight) + '</div>';
      });
      html += '</div>';
      if (w.notes) html += '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--text3);margin-top:8px;">' + w.notes + '</div>';
      html += '</div>';
    });
    if (exSessions.length > 3) {
      html += '<button class="mo-show-more" data-ex="' + exName.replace(/"/g, '&quot;') + '" onclick="moShowAllSessions(this)">▼ ' + _mo('Show all ' + exSessions.length + ' sessions', 'عرض كل ' + exSessions.length + ' جلسات') + '</button>';
    }
    html += '</div>';
  });
  list.innerHTML = html;
}

function moShowAllSessions(btn) {
  const exName = btn.dataset.ex;
  const exSessions = [...workouts].filter(w => w.exercise === exName).sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = btn.closest('.mo-history-exercise');
  const titleBar = container.querySelector('.mo-ex-title-bar');
  let html = '';
  exSessions.forEach(w => {
    const dateStr = new Date(w.date).toLocaleDateString((typeof currentLang !== 'undefined' && currentLang === 'ar') ? 'ar-SA' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const vol = Math.round(w.totalVolume);
    const unit = w.sets[0]?.unit || 'kg';
    html += '<div class="mo-session-card">';
    html += '<div class="mo-session-meta"><span class="mo-session-date"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;opacity:.7;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + dateStr + '</span>';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    if (w.isPR) html += '<span class="mo-session-pr"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> PR</span>';
    html += '<span class="mo-session-vol">' + _mo('Vol:', 'الحجم:') + ' ' + vol + unit + '</span></div></div>';
    html += `<div class="mo-sets-grid-hdr"><span>${t('mo.sets.num')}</span><span>${t('mo.sets.reps')}</span><span>${t('mo.sets.weight')}</span><span>${t('mo.sets.vol')}</span></div>`;
    html += '<div class="mo-sets-grid">';
    w.sets.forEach((s, i) => {
      html += '<div class="mo-set-num">' + (i + 1) + '</div>';
      html += '<div class="mo-set-val">' + s.reps + '</div>';
      html += '<div class="mo-set-val">' + s.weight + s.unit + '</div>';
      html += '<div class="mo-set-val">' + Math.round(s.reps * s.weight) + '</div>';
    });
    html += '</div>';
    if (w.notes) html += '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--text3);margin-top:8px;">' + w.notes + '</div>';
    html += '</div>';
  });
  container.innerHTML = '';
  container.appendChild(titleBar);
  container.insertAdjacentHTML('beforeend', html);
}

function renderOverlayTips(muscle) {
  const tips = TIPS[muscle] || [
    { icon: '🎯', title: _mo('Progressive Overload', 'زيادة تدريجية'), text: _mo('Add 2.5-5 kg every 2 weeks. Small gains compound into massive results.', 'أضف 2.5-5 كجم كل أسبوعين. الزيادات الصغيرة تصنع نتيجة كبيرة.') },
    { icon: '⏱️', title: _mo('Use the Rest Timer', 'استخدم مؤقت الراحة'), text: _mo('Consistent rest periods (60-120s) improve performance across sets.', 'الراحة المنتظمة (60-120 ثانية) تحسن الأداء بين المجموعات.') }
  ];
  document.getElementById('mo-tips-list').innerHTML = tips.map(tip =>
    '<div class="tip-card"><div class="tip-icon">' + tip.icon + '</div><div><div class="tip-title">' + tip.title + '</div><div class="tip-text">' + tip.text + '</div></div></div>'
  ).join('');
}

function renderOverlayExercises(muscle) {
  const sessions = workouts.filter(w => w.muscle === muscle);
  if (!sessions.length) {
    document.getElementById('mo-exercises-list').innerHTML = '<div class="mo-empty"><div class="mo-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>' + _mo('No exercises logged yet.', 'لا توجد تمارين مسجلة بعد.') + '</div>';
    return;
  }
  // Group by exercise, get PR and session count
  const exMap = {};
  sessions.forEach(w => {
    if (!exMap[w.exercise]) exMap[w.exercise] = { sessions: 0, pr: 0, unit: 'kg' };
    exMap[w.exercise].sessions++;
    const maxW = Math.max(...w.sets.map(s => s.weight));
    if (maxW > exMap[w.exercise].pr) {
      exMap[w.exercise].pr = maxW;
      exMap[w.exercise].unit = w.sets[0]?.unit || 'kg';
    }
  });
  const sorted = Object.entries(exMap).sort((a, b) => b[1].sessions - a[1].sessions);
  document.getElementById('mo-exercises-list').innerHTML = sorted.map(([name, data]) =>
    '<div class="mo-ex-item"><div><div class="mo-ex-name">' + name + '</div><div class="mo-ex-stats">' + _mo(data.sessions + ' sessions · PR: ' + data.pr + data.unit, data.sessions + ' جلسات | رقم قياسي: ' + data.pr + data.unit) + '</div></div><div class="mo-ex-pr">' + data.pr + '<span style="font-size:10px;color:var(--text3);"> ' + data.unit + '</span></div></div>'
  ).join('');
}

function startWorkoutFromOverlay() {
  closeMuscleOverlay();
  // Select this muscle + switch to log tab (fromOverlay=true skips re-opening overlay)
  selectMuscle(overlayMuscle, true);
  switchView('log', document.getElementById('bnav-log'));
  // Hide muscle history panel - user is now entering an exercise, not browsing history
  const mhPanel = document.getElementById('muscle-history-panel');
  if (mhPanel) mhPanel.style.display = 'none';
  setTimeout(() => {
    const exInput = document.getElementById('exercise-name');
    if (exInput) exInput.focus();
  }, 400);
}
