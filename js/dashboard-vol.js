function renderMuscleVol(arr) {
  if (!arr) arr = workouts;
  const totals = {};
  arr.forEach(w => { totals[w.muscle] = (totals[w.muscle] || 0) + w.totalVolume; });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const maxVol = sorted[0]?.[1] || 1;
  if (!sorted.length) {
    document.getElementById('vol-list').innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><div class="empty-title">${t('balance.empty')}</div></div>`;
    return;
  }
  document.getElementById('vol-list').innerHTML = sorted.map(([m, v]) => `
    <div class="vol-item">
      <div class="vol-row"><span class="vol-name">${MUSCLE_ICONS[m] || MUSCLE_ICONS['Chest']} ${(typeof t === 'function') ? t('muscle.' + m) : m}</span><span class="vol-val">${Math.round(v)} kg</span></div>
      <div class="prog-bar-wrap"><div class="prog-bar-fill" style="width:${(v / maxVol * 100).toFixed(1)}%"></div></div>
    </div>`).join('');
}
