// FORGE Gym Tracker - active program panel helpers
// Extracted from index.html as part of modularization.

let _activeProg = (() => {
  try {
    const ai = localStorage.getItem('forge_ai_program');
    if (ai) return JSON.parse(ai);
    return JSON.parse(localStorage.getItem('forge_active_program') || 'null');
  } catch (e) { return null; }
})();

function _getProgramDayIndex() {
  if (!_activeProg) return 0;
  // AI programs have days directly; static programs looked up by id
  const prog = _activeProg.days
    ? _activeProg
    : TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog || !prog.days || !prog.days.length) return 0;
  const start = new Date(_activeProg.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.max(0, Math.floor((today - start) / 86400000));
  return diff % prog.days.length;
}

function renderProgramPanel() {
  // Always re-read from localStorage so activations done after page load are reflected
  try {
    const ai = localStorage.getItem('forge_ai_program');
    if (ai) _activeProg = JSON.parse(ai);
    else _activeProg = JSON.parse(localStorage.getItem('forge_active_program') || 'null');
  } catch (_) {}
  const body = document.getElementById('programs-panel-body');
  const badge = document.getElementById('prog-panel-badge');
  if (!body) return;
  if (!_activeProg) {
    if (badge) badge.style.display = 'none';
    if (typeof window.renderAIProgramGenerator === 'function') {
      window.renderAIProgramGenerator();
    }
    return;
  }
  if (badge) badge.style.display = '';
  // AI programs have days directly; static programs are found by id
  const prog = _activeProg.days
    ? _activeProg
    : TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) { _activeProg = null; renderProgramPanel(); return; }
  const dayIdx = _getProgramDayIndex();
  const rawDay = prog.days[dayIdx];
  const day = (typeof window._adaptDay === 'function') ? window._adaptDay(rawDay) : rawDay;
  const chips = prog.days.map((d, i) =>
    `<span class="prog-sched-chip${i === dayIdx ? ' today' : ''}${!d.muscle ? ' rest-chip' : ''}">${d.label}</span>`
  ).join('');
  const sessionHtml = !day.muscle
    ? `<div class="prog-rest-card"><div class="prog-rest-icon">🛌</div><div class="prog-rest-title">${t('program.restDay')}</div><div class="prog-rest-note">${day.note} — recharge for tomorrow</div></div>`
    : '<div class="prog-session-card">' +
      `<div class="prog-session-day">DAY ${dayIdx + 1} · ${prog.short}</div>` +
      `<div class="prog-session-title">${day.label}</div>` +
      `<div class="prog-session-ex">${day.exs.join(' · ')}</div>` +
      `<div class="prog-session-note">${day.note}</div>` +
      `<button class="prog-start-btn" onclick="startProgramWorkout()">${t('program.startSession')}</button>` +
      '</div>';
  body.innerHTML =
    '<div class="prog-today-wrap">' +
    `<div class="prog-today-hdr"><span class="prog-today-hdr-name">${prog.name}</span>` +
    `<button class="prog-change-btn" onclick="deactivateProgram()">${t('program.change')}</button></div>` +
    sessionHtml +
    `<div><div class="prog-sched-lbl">${t('program.schedule')}</div><div class="prog-sched">${chips}</div></div>` +
    '</div>';
}

function activateProgram(id) {
  const prog = TRAINING_PROGRAMS.find(p => p.id === id);
  if (!prog) return;
  const d = new Date();
  const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  _activeProg = { id, startDate: dateStr };
  localStorage.setItem('forge_active_program', JSON.stringify(_activeProg));
  showToast(prog.name + ' activated! 💪');
  renderProgramPanel();
  if (typeof renderCoachPlan === 'function') renderCoachPlan();
  if (typeof renderCoachTrain === 'function') renderCoachTrain();
}

function deactivateProgram() {
  _activeProg = null;
  localStorage.removeItem('forge_active_program');
  showToast('Program cleared.');
  renderProgramPanel();
  if (typeof renderCoachPlan === 'function') renderCoachPlan();
  if (typeof renderCoachTrain === 'function') renderCoachTrain();
}

function startProgramWorkout() {
  if (!_activeProg) return;
  // AI programs have days directly; static programs looked up by id
  const prog = _activeProg.days
    ? _activeProg
    : TRAINING_PROGRAMS.find(p => p.id === _activeProg.id);
  if (!prog) return;
  const rawDay = prog.days[_getProgramDayIndex()];
  const day = (typeof window._adaptDay === 'function') ? window._adaptDay(rawDay) : rawDay;
  if (!day.muscle) { showToast('Rest day — take it easy! 🛌'); return; }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const wv = document.getElementById('view-workout');
  if (wv) wv.classList.add('active');
  const nb = document.querySelector('.nav-btn[data-view="view-workout"]');
  if (nb) nb.classList.add('active');
  setTimeout(() => {
    selectMuscle(day.muscle);
    const exInp = document.getElementById('exercise-name');
    if (exInp) exInp.value = day.exs[0];
    updateLastSessionHint();
    loadLastSessionSets(day.exs[0]);
    if (typeof applyProgramAutoRegulation === 'function') {
      try { applyProgramAutoRegulation(day.exs[0]); } catch (_) {}
    }
    showToast(day.label + ' loaded!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 80);
}
