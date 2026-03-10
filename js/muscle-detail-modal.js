// FORGE Gym Tracker - muscle detail modal and share card
// Extracted from index.html as part of modularization.

let _mdcCurrentMuscle = null;

// Emoji map for each muscle group
const MUSCLE_EMOJI = {
  Chest: '🫁', Back: '🦴', Shoulders: '🔱', Biceps: '💪', Triceps: '💪',
  Core: '🎯', Legs: '🦵', Glutes: '🍑', Calves: '🦵', Forearms: '🦾',
  Traps: '🏔️', 'Lower Back': '⚡'
};
const MUSCLE_GRAD = {
  Chest: 'linear-gradient(135deg,#2ecc71,#27ae60)',
  Back: 'linear-gradient(135deg,#3498db,#2980b9)',
  Shoulders: 'linear-gradient(135deg,#9b59b6,#8e44ad)',
  Biceps: 'linear-gradient(135deg,#e67e22,#d35400)',
  Triceps: 'linear-gradient(135deg,#e74c3c,#c0392b)',
  Core: 'linear-gradient(135deg,#f1c40f,#f39c12)',
  Legs: 'linear-gradient(135deg,#1abc9c,#16a085)',
  Glutes: 'linear-gradient(135deg,#e91e63,#c2185b)',
  Calves: 'linear-gradient(135deg,#00bcd4,#0097a7)',
  Forearms: 'linear-gradient(135deg,#ff9800,#f57c00)',
  Traps: 'linear-gradient(135deg,#607d8b,#455a64)',
  'Lower Back': 'linear-gradient(135deg,#673ab7,#512da8)'
};

function _openMuscleDetail(muscle) {
  _mdcCurrentMuscle = muscle;
  const modal = document.getElementById('muscle-detail-modal');
  if (!modal) return;

  // Get all sessions for this muscle, newest first
  const sessions = (workouts || [])
    .filter(w => w.muscle === muscle)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const lastSession = sessions[0] || null;
  const prevSession = sessions[1] || null;

  // Header: icon + name + status badge
  const icon = document.getElementById('mdc-icon');
  const nameEl = document.getElementById('mdc-name');
  const badge = document.getElementById('mdc-badge');
  if (icon) {
    icon.textContent = MUSCLE_EMOJI[muscle] || '💪';
    icon.style.background = MUSCLE_GRAD[muscle] || 'var(--accent)';
  }
  if (nameEl) nameEl.textContent = muscle.toUpperCase();

  // Recovery status from heatmap heat colors
  let statusText = 'Never Trained';
  let statusStyle = 'background:rgba(255,255,255,.08);color:var(--text3)';
  if (lastSession) {
    const d = Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000);
    if (d <= 1) { statusText = t('recovery.tier1'); statusStyle = 'background:#e74c3c33;color:#e74c3c'; }
    else if (d <= 3) { statusText = t('recovery.tier2'); statusStyle = 'background:#e67e2233;color:#e67e22'; }
    else if (d <= 6) { statusText = t('recovery.tier3'); statusStyle = 'background:#f1c40f33;color:#f1c40f'; }
    else if (d <= 13) { statusText = t('recovery.tier4'); statusStyle = 'background:#2ecc7133;color:#2ecc71'; }
    else { statusText = t('recovery.tier5'); statusStyle = 'background:rgba(255,255,255,.08);color:var(--text3)'; }
  }
  if (badge) { badge.textContent = statusText; badge.style.cssText = statusStyle; }

  // Date row
  const dateEl = document.getElementById('mdc-date');
  if (dateEl) {
    if (!lastSession) {
      dateEl.innerHTML = '📅 No sessions logged yet — start training!';
    } else {
      const d = new Date(lastSession.date);
      const dStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const tStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      dateEl.innerHTML = `📅 ${dStr} &nbsp;⏱ ${tStr} &nbsp;•&nbsp; ${sessions.length} total session${sessions.length !== 1 ? 's' : ''}`;
    }
  }

  // Exercises for last session
  const exEl = document.getElementById('mdc-exercises');
  if (exEl) {
    if (!lastSession) {
      exEl.innerHTML = '<div style="color:var(--text3);font-family:Barlow Condensed,sans-serif;font-size:14px;padding:12px 0;">No workout data yet</div>';
    } else {
      // Group sets by exercise for this session (same date+muscle)
      const sessionDate = (lastSession.date || '').slice(0, 10);
      const sessionExercises = sessions.filter(w => (w.date || '').slice(0, 10) === sessionDate);

      if (sessionExercises.length > 0) {
        exEl.innerHTML = sessionExercises.map(w => {
          const sets = (w.sets || []);
          const bestSet = sets.reduce((best, s) => (s.weight > (best.weight || 0) ? s : best), sets[0] || {});
          const setsSummary = sets.length > 0
            ? `${sets.length}×${bestSet.reps || '?'} @ ${bestSet.weight || '?'}${bestSet.unit || 'kg'}`
            : 'No sets';
          const isPR = w.isPR;
          return `
            <div class="mdc-ex-row">
              <div class="mdc-ex-icon">🏋️</div>
              <div class="mdc-ex-name">${window.FORGE_STORAGE.esc(w.exercise || 'Unknown')}</div>
              <div class="mdc-ex-detail">${setsSummary}</div>
              ${isPR ? '<div class="mdc-pr-badge">⭐ PR</div>' : ''}
            </div>`;
        }).join('');
      } else {
        exEl.innerHTML = `
          <div class="mdc-ex-row">
            <div class="mdc-ex-icon">🏋️</div>
            <div class="mdc-ex-name">${window.FORGE_STORAGE.esc(lastSession.exercise || 'Unknown')}</div>
            <div class="mdc-ex-detail">${(lastSession.sets || []).length} sets</div>
            ${lastSession.isPR ? '<div class="mdc-pr-badge">⭐ PR</div>' : ''}
          </div>`;
      }
    }
  }

  // Stats row: volume, sets, exercises
  const sessionDate2 = lastSession ? (lastSession.date || '').slice(0, 10) : null;
  const sessionExs2 = sessionDate2 ? sessions.filter(w => (w.date || '').slice(0, 10) === sessionDate2) : (lastSession ? [lastSession] : []);
  const totalVol = sessionExs2.reduce((a, w) => a + (w.totalVolume || 0), 0);
  const totalSets = sessionExs2.reduce((a, w) => a + (w.sets || []).length, 0);
  const totalExs = [...new Set(sessionExs2.map(w => w.exercise))].length || (lastSession ? 1 : 0);

  const volEl = document.getElementById('mdc-vol');
  const setsEl = document.getElementById('mdc-sets');
  const excEl = document.getElementById('mdc-excount');
  if (volEl) volEl.textContent = totalVol > 0 ? (totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + 't' : totalVol.toLocaleString() + 'kg') : '—';
  if (setsEl) setsEl.textContent = totalSets > 0 ? totalSets : '—';
  if (excEl) excEl.textContent = totalExs > 0 ? totalExs : '—';

  // Volume delta vs previous session
  const deltaEl = document.getElementById('mdc-delta');
  if (deltaEl) {
    if (prevSession && totalVol > 0) {
      const prevDate = (prevSession.date || '').slice(0, 10);
      const prevExs = sessions.filter(w => (w.date || '').slice(0, 10) === prevDate);
      const prevVol = prevExs.reduce((a, w) => a + (w.totalVolume || 0), 0);
      if (prevVol > 0) {
        const pct = Math.round(((totalVol - prevVol) / prevVol) * 100);
        const sign = pct >= 0 ? '+' : '';
        const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same';
        const arrow = pct > 0 ? '📈' : pct < 0 ? '📉' : '➡️';
        deltaEl.className = `mdc-delta ${cls}`;
        deltaEl.textContent = `${arrow} ${sign}${pct}% vs previous session (${prevVol.toLocaleString()}kg)`;
      } else { deltaEl.textContent = ''; }
    } else { deltaEl.textContent = ''; }
  }

  // Train Now button label
  const trainBtn = document.getElementById('mdc-train-btn');
  if (trainBtn) trainBtn.textContent = `🔥 TRAIN ${muscle.toUpperCase()} NOW`;

  // Show modal
  modal.classList.add('open');
  document.body.classList.add('scroll-locked');
}

function _closeMuscleDetail() {
  const modal = document.getElementById('muscle-detail-modal');
  if (modal) modal.classList.remove('open');
  document.body.classList.remove('scroll-locked');
  _mdcCurrentMuscle = null;
}

function _mdcTrainNow() {
  _closeMuscleDetail();
  const muscle = _mdcCurrentMuscle || (document.getElementById('mdc-name') || {}).textContent || '';
  const muscleTitle = muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase();
  // Pre-select the muscle in the log view
  if (typeof selectMuscle === 'function') selectMuscle(muscleTitle);
  if (typeof showView === 'function') showView('log');
}

function _buildShareText(muscle) {
  const sessions = (workouts || [])
    .filter(w => w.muscle === muscle)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const lastSession = sessions[0];
  if (!lastSession) return `⚡ FORGE GYM\n\nI haven't trained ${muscle} yet — about to fix that! 💪\n\nTrack your gains: FORGE Gym Tracker`;

  const d = new Date(lastSession.date);
  const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const sessionDate = (lastSession.date || '').slice(0, 10);
  const sessionExs = sessions.filter(w => (w.date || '').slice(0, 10) === sessionDate);
  const totalVol = sessionExs.reduce((a, w) => a + (w.totalVolume || 0), 0);
  const totalSets = sessionExs.reduce((a, w) => a + (w.sets || []).length, 0);
  const hasPR = sessionExs.some(w => w.isPR);

  const exerciseLines = sessionExs.map(w => {
    const sets = (w.sets || []);
    const bestSet = sets.reduce((b, s) => (s.weight > (b.weight || 0) ? s : b), sets[0] || {});
    const pr = w.isPR ? ' ⭐PR' : '';
    return `💪 ${w.exercise || 'Exercise'} · ${sets.length}×${bestSet.reps || '?'} @ ${bestSet.weight || '?'}${bestSet.unit || 'kg'}${pr}`;
  }).join('\n');

  const volStr = totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + 't' : totalVol.toLocaleString() + 'kg';

  return [
    `⚡ FORGE GYM — ${muscle.toUpperCase()} SESSION`,
    `📅 ${dateStr}`,
    `─────────────────`,
    exerciseLines,
    `─────────────────`,
    `📊 Vol: ${volStr} · ${totalSets} sets`,
    hasPR ? `🏆 NEW PERSONAL RECORD!` : '',
    `─────────────────`,
    `Can you beat this? Track with FORGE 💪`
  ].filter(Boolean).join('\n');
}

function _shareMuscleCard() {
  const muscle = _mdcCurrentMuscle;
  if (!muscle) return;
  const text = _buildShareText(muscle);

  if (navigator.share) {
    navigator.share({ title: `FORGE — ${muscle} Session`, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      // Brief toast feedback
      const btn = document.querySelector('.mdc-share-btn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ COPIED!';
        btn.style.background = 'rgba(46,204,113,.15)';
        btn.style.color = '#2ecc71';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
          btn.style.color = '';
        }, 2000);
      }
    }).catch(() => {
      alert(text);
    });
  }
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') _closeMuscleDetail();
});
