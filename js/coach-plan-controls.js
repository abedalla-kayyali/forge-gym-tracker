function cplanSetView(v) {
  _cplanView = v;
  renderCoachPlan();
}

function cplanToggleDay(i) {
  _cplanExpandDay = _cplanExpandDay === i ? -1 : i;
  renderCoachPlan();
}

function _arTodayCheckin() {
  try {
    if (typeof getTodayCheckin === 'function') return getTodayCheckin();
  } catch (_) {}
  return null;
}

function _arParseRpe(rpe) {
  if (rpe == null) return null;
  const s = String(rpe).trim().toUpperCase();
  if (!s) return null;
  if (s === 'F') return 10;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function _arHasRecentFailureRpe(exerciseName, lookbackDays) {
  const rows = (typeof workouts !== 'undefined' && Array.isArray(workouts)) ? workouts : [];
  if (!rows.length || !exerciseName) return false;
  const cutoffMs = Date.now() - (Math.max(1, lookbackDays || 7) * 86400000);
  const exLower = String(exerciseName).trim().toLowerCase();
  return rows.some(w => {
    if (!w || String(w.exercise || '').trim().toLowerCase() !== exLower) return false;
    const d = new Date(w.date || 0).getTime();
    if (!Number.isFinite(d) || d < cutoffMs) return false;
    const sets = Array.isArray(w.sets) ? w.sets : [];
    return sets.some(s => (_arParseRpe(s && s.rpe) || 0) >= 10);
  });
}

function _arRoundByUnit(val, unit) {
  const step = String(unit || 'kg').toLowerCase() === 'lbs' ? 5 : 2.5;
  return Math.max(0, Math.round((Number(val) || 0) / step) * step);
}

function _arApplyWeightMultiplier(multiplier) {
  const rows = document.querySelectorAll('#sets-container .set-row');
  rows.forEach(row => {
    const numEl = row.querySelector('.set-num');
    if (numEl && (numEl.dataset.type || 'normal') === 'warmup') return;
    const wtEl = row.querySelector('.set-weight');
    if (!wtEl) return;
    const unitBtn = row.querySelector('.set-unit-toggle');
    const unitSel = row.querySelector('.set-unit');
    const unit = unitBtn?.dataset?.unit || unitSel?.value || 'kg';

    const base = Number(wtEl.value || wtEl.placeholder || 0);
    if (!Number.isFinite(base) || base <= 0) return;
    const adj = _arRoundByUnit(base * multiplier, unit);
    if (String(wtEl.value || '').trim()) wtEl.value = String(adj);
    else wtEl.placeholder = String(adj);
  });
}

function _arApplyTargetRpe(targetRpe) {
  if (!targetRpe) return;
  const rows = document.querySelectorAll('#sets-container .set-row');
  rows.forEach(row => {
    const numEl = row.querySelector('.set-num');
    if (numEl && (numEl.dataset.type || 'normal') === 'warmup') return;
    const btn = row.querySelector('.set-rpe-btn');
    if (!btn) return;
    btn.dataset.rpe = String(targetRpe);
    btn.textContent = String(targetRpe);
    btn.classList.add('rpe-active');
  });
}

function _arBuildDecision(mainExercise) {
  const ci = _arTodayCheckin();
  const lowRecovery = !!(ci && !ci.skipped && Number(ci.sleep || 0) <= 2 && Number(ci.energy || 0) <= 2);
  const failureLastWeek = _arHasRecentFailureRpe(mainExercise, 7);
  return {
    lowRecovery,
    failureLastWeek,
    weightMultiplier: lowRecovery ? 0.90 : 1,
    targetRpe: failureLastWeek ? 8 : null
  };
}

function _arToastDecision(decision) {
  if (typeof showToast !== 'function') return;
  const bits = [];
  if (decision.lowRecovery) bits.push('Auto-reg: -10% load (low sleep + low energy)');
  if (decision.targetRpe) bits.push('Auto-reg: target RPE 8 (last week reached failure)');
  if (!bits.length) return;
  showToast(bits.join(' | '), 'var(--accent)');
}

window.applyProgramAutoRegulation = function (mainExercise) {
  const decision = _arBuildDecision(mainExercise || '');
  if (decision.weightMultiplier < 1) _arApplyWeightMultiplier(decision.weightMultiplier);
  if (decision.targetRpe) _arApplyTargetRpe(decision.targetRpe);
  _arToastDecision(decision);
  return decision;
};
