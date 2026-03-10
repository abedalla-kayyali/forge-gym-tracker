function renderFreqChart(arr) {
  if (!arr) arr = workouts;
  const wrap = document.getElementById('freq-chart-wrap');
  if (!wrap) return;

  const counts = {};
  arr.forEach(w => { counts[w.muscle] = (counts[w.muscle] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;

  const MUSCLE_COLORS = {
    Chest: '#2ecc71', Back: '#3498db', Shoulders: '#9b59b6',
    Biceps: '#e67e22', Triceps: '#e74c3c', Legs: '#f1c40f',
    Core: '#1abc9c', Glutes: '#e91e8c', Calves: '#00bcd4',
    Forearms: '#d35400', Traps: '#8e44ad', 'Lower Back': '#16a085'
  };

  if (!sorted.length) {
    wrap.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text3);font-size:.8rem;">${t('balance.empty')}</div>`;
    return;
  }

  const sessLabel = typeof t === 'function' ? t('dash.statSessions') : 'sessions';
  wrap.innerHTML = sorted.map(([m, count]) => {
    const pct = Math.round((count / total) * 100);
    const color = MUSCLE_COLORS[m] || '#7f8c8d';
    const label = (typeof t === 'function') ? t('muscle.' + m) : m;
    return `<div class="freq-row">
      <div class="freq-row-top">
        <span class="freq-label">${MUSCLE_ICONS[m] || '🏋️'} ${label}</span>
        <span class="freq-count">${count} <span style="color:var(--text3);font-size:9px;">${sessLabel}</span></span>
      </div>
      <div class="freq-bar-track">
        <div class="freq-bar-fill" style="width:${pct}%;background:${color};"></div>
        <span class="freq-pct">${pct}%</span>
      </div>
    </div>`;
  }).join('');
}
