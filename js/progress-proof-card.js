(function () {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────

  function _lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (_) { return fallback; }
  }

  // ── data layer ───────────────────────────────────────────────────────────

  function _getWindow() {
    const meso = _lsGet('forge_mesocycle', {});
    const windowStart = meso.startDate || new Date(Date.now() - 30 * 86400000).toISOString();
    const nWeeks = Math.max(1, Math.ceil((Date.now() - new Date(windowStart)) / (7 * 86400000)));
    const phaseLabel = (meso.phase || (typeof userProfile !== 'undefined' && userProfile && userProfile.goal) || 'FORGE').toUpperCase();
    return { windowStart, nWeeks, phaseLabel };
  }

  function _getWeightDelta(windowStart) {
    const bw = (typeof bodyWeight !== 'undefined' ? bodyWeight : [])
      .filter(e => e && e.date && e.weight && e.date >= windowStart)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (bw.length < 2) return null;
    const delta = Number(bw[bw.length - 1].weight) - Number(bw[0].weight);
    const unit = bw[0].unit || 'kg';
    return { delta: Math.round(delta * 10) / 10, unit, current: Number(bw[bw.length - 1].weight) };
  }

  function _getInBodyDelta(windowStart) {
    const tests = _lsGet('forge_inbody_tests', [])
      .filter(t => t && t.date && t.date >= windowStart)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (tests.length < 2) return null;
    const first = tests[0], last = tests[tests.length - 1];
    return {
      bfDelta: last.bf != null && first.bf != null ? Math.round((last.bf - first.bf) * 10) / 10 : null,
      smmDelta: last.smm != null && first.smm != null ? Math.round((last.smm - first.smm) * 10) / 10 : null
    };
  }

  function _getTopPRGains(windowStart) {
    const wos = (typeof workouts !== 'undefined' ? workouts : _lsGet('forge_workouts', []));
    const before = wos.filter(w => w && w.date && w.date < windowStart);
    const inWin  = wos.filter(w => w && w.date && w.date >= windowStart);

    const bestMap = (list) => {
      const m = {};
      list.forEach(w => {
        (w.logs || []).forEach(l => {
          if (l.mode !== 'weighted' || !l.exercise) return;
          const top = Math.max(...(l.sets || []).map(s => Number(s.weight) || 0).filter(v => v > 0));
          if (top > 0 && (m[l.exercise] == null || top > m[l.exercise])) m[l.exercise] = top;
        });
      });
      return m;
    };

    const beforeBest = bestMap(before);
    const winBest    = bestMap(inWin);

    return Object.keys(winBest)
      .filter(ex => beforeBest[ex] != null && winBest[ex] > beforeBest[ex])
      .map(ex => ({
        exercise: ex,
        before: beforeBest[ex],
        after: winBest[ex],
        gain: winBest[ex] - beforeBest[ex],
        pct: Math.round((winBest[ex] - beforeBest[ex]) / beforeBest[ex] * 100)
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }

  function _getSessionCount(windowStart) {
    const wos = (typeof workouts !== 'undefined' ? workouts : _lsGet('forge_workouts', []));
    return wos.filter(w => w && w.date && w.date >= windowStart).length;
  }

  function _getGoal() {
    try { return (typeof userProfile !== 'undefined' && userProfile && userProfile.goal) || 'default'; }
    catch (_) { return 'default'; }
  }

  // ── exports (data layer only for now) ────────────────────────────────────
  window._pcGetWindow       = _getWindow;
  window._pcGetWeightDelta  = _getWeightDelta;
  window._pcGetInBodyDelta  = _getInBodyDelta;
  window._pcGetTopPRGains   = _getTopPRGains;
  window._pcGetSessionCount = _getSessionCount;
  window._pcGetGoal         = _getGoal;

}());
