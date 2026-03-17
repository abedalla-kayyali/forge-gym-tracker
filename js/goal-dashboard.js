'use strict';
// FORGE Goal Dashboard — "Am I on Track?"
// Renders leading + lagging KPIs per user goal.
// Reads: workouts, mealsLog, bodyWeight, checkins, InBody, measurements, cardio, steps, TDEE.

(function () {

  // ── Data helpers ──────────────────────────────────────────────────────────

  // userProfile is a `let` in index.html — not a window property.
  // Access it as a direct global with a localStorage fallback.
  function _profile() {
    try {
      return (typeof userProfile !== 'undefined' ? userProfile : null)
        || JSON.parse(localStorage.getItem('forge_profile') || '{}');
    } catch (_e) { return {}; }
  }

  function _lsGet(key, fallback) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
    catch (_e) { return fallback; }
  }

  function _isoToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // All workout sessions (weight training)
  function _workouts() {
    return _lsGet('forge_workouts', []);
  }

  // mealsLog is { 'YYYY-MM-DD': [{kcal,p,c,f,...}] }
  function _mealsLog() {
    return _lsGet('forge_meals', {});
  }

  // Body weight entries: [{date:'YYYY-MM-DD', weight:number, unit:'kg'|'lbs'}]
  function _bwLog() {
    return _lsGet('forge_bodyweight', []);
  }

  // Cardio sessions: [{date, durationMins, ...}]
  function _cardioLog() {
    return _lsGet('forge_cardio', []);
  }

  // Steps: { 'YYYY-MM-DD': number }
  function _stepsLog() {
    return _lsGet('forge_steps', {});
  }

  // InBody tests
  function _inbodyTests() {
    if (typeof window._inbodyGetTests === 'function') return window._inbodyGetTests();
    return _lsGet('forge_inbody_tests', []);
  }

  // Measurements
  function _measurements() {
    if (typeof window._measGetEntries === 'function') return window._measGetEntries();
    return _lsGet('forge_measurements', []);
  }

  // Checkin for a date: key = 'forge_checkin_' + new Date(date).toDateString()
  function _checkin(isoDate) {
    try {
      const d = new Date(isoDate + 'T12:00:00');
      return _lsGet('forge_checkin_' + d.toDateString(), null);
    } catch (_e) { return null; }
  }

  // Compute TDEE from profile (same logic as nutrition panel)
  function _tdee() {
    const p = _profile() || {};
    const wt = parseFloat(p.weight || 70);
    const ht = parseFloat(p.height || 170);
    const age = parseFloat(p.age || 25);
    const sex = p.sex || p.gender || 'male';
    const af  = parseFloat(p.activityFactor || 1.55);
    // Harris-Benedict BMR
    const bmr = sex === 'female'
      ? 447.593 + 9.247 * wt + 3.098 * ht - 4.330 * age
      : 88.362  + 13.397 * wt + 4.799 * ht - 5.677 * age;
    const inbodyBmr = parseFloat(p.inbodyBmr || 0);
    const inbodyDate = p.inbodyBmrDate ? new Date(p.inbodyBmrDate) : null;
    const inbodyAgeDays = inbodyDate ? Math.floor((Date.now() - inbodyDate.getTime()) / 86400000) : null;
    const useInbody = inbodyBmr >= 800 && (inbodyAgeDays === null || inbodyAgeDays <= 180);
    const effectiveBmr = useInbody ? inbodyBmr : bmr;
    return Math.round(effectiveBmr * Math.max(1.2, Math.min(2.5, af)));
  }

  // Protein target g/day
  function _proteinTarget() {
    const p = _profile() || {};
    const custom = p.customNutritionTargets;
    if (custom?.enabled && custom?.p > 0) return Math.round(custom.p);
    // Estimate from bodyweight: 1.8g/kg
    const wt = parseFloat(p.weight || 70);
    const unit = p.weightUnit || 'kg';
    const kg = unit === 'lbs' ? wt * 0.4536 : wt;
    return Math.round(kg * 1.8);
  }

  // Calorie target
  function _kcalTarget() {
    const p = _profile() || {};
    const custom = p.customNutritionTargets;
    if (custom?.enabled && custom?.kcal > 0) return Math.round(custom.kcal);
    const goal = p.goal || 'muscle';
    const tdee = _tdee();
    if (goal === 'fat_loss')  return Math.round(tdee - 400);
    if (goal === 'muscle')    return Math.round(tdee + 200);
    return tdee;
  }

  // ── KPI calculations ──────────────────────────────────────────────────────

  // Weight change over last 30 days (kg)
  function _weightChange30d() {
    const log = _bwLog().filter(e => e.weight).sort((a, b) => a.date < b.date ? -1 : 1);
    const cutoff = _daysAgo(30);
    const recent = log.filter(e => e.date >= cutoff);
    const before = log.filter(e => e.date < cutoff);
    if (!recent.length) return null;
    const latest = recent[recent.length - 1];
    const base   = before.length ? before[before.length - 1] : recent[0];
    const toKg   = e => (e.unit === 'lbs' ? e.weight * 0.4536 : e.weight);
    return { delta: toKg(latest) - toKg(base), unit: 'kg', latest: toKg(latest) };
  }

  // Current BW in kg
  function _currentBwKg() {
    const log = _bwLog().filter(e => e.weight).sort((a, b) => a.date < b.date ? -1 : 1);
    if (!log.length) return null;
    const e = log[log.length - 1];
    return e.unit === 'lbs' ? e.weight * 0.4536 : e.weight;
  }

  // InBody latest vs 30d ago: { bfDelta, smmDelta, latestBf, latestSmm }
  function _inbodyDelta30d() {
    const tests = _inbodyTests().sort((a, b) => a.date < b.date ? -1 : 1);
    if (!tests.length) return null;
    const latest = tests[tests.length - 1];
    const cutoff = _daysAgo(30);
    const base   = tests.filter(t => t.date <= cutoff).pop() || (tests.length >= 2 ? tests[tests.length - 2] : null);
    return {
      latestBf:  latest.bf  != null ? +latest.bf  : null,
      latestSmm: latest.smm != null ? +latest.smm : null,
      bfDelta:   (base && base.bf  != null && latest.bf  != null) ? +(latest.bf  - base.bf).toFixed(1)  : null,
      smmDelta:  (base && base.smm != null && latest.smm != null) ? +(latest.smm - base.smm).toFixed(1) : null,
    };
  }

  // Strength PRs set this month (exercises where top weight this month > ever before)
  function _prsThisMonth() {
    const allW = _workouts();
    const cutoff = _daysAgo(30);
    const recent = allW.filter(w => w.date >= cutoff);
    const older  = allW.filter(w => w.date <  cutoff);

    const topWeight = (sessions) => {
      const byEx = {};
      sessions.forEach(w => {
        const key = (w.exercise || '').toLowerCase();
        const top = Math.max(0, ...((w.sets || []).map(s => +s.weight || 0)));
        if (top > 0) byEx[key] = Math.max(byEx[key] || 0, top);
      });
      return byEx;
    };

    const recentTop = topWeight(recent);
    const olderTop  = topWeight(older);
    let count = 0;
    Object.entries(recentTop).forEach(([ex, top]) => {
      const prev = olderTop[ex] || 0;
      if (top > prev) count++;
    });
    return count;
  }

  // Strength retention: % of exercises where this month top >= 90% of all-time top
  function _strengthRetention() {
    const allW = _workouts();
    const cutoff = _daysAgo(30);

    const topByEx = {};
    const recentTopByEx = {};
    allW.forEach(w => {
      const key = (w.exercise || '').toLowerCase();
      const top = Math.max(0, ...((w.sets || []).map(s => +s.weight || 0)));
      if (top > 0) {
        topByEx[key] = Math.max(topByEx[key] || 0, top);
        if (w.date >= cutoff) recentTopByEx[key] = Math.max(recentTopByEx[key] || 0, top);
      }
    });

    const exercises = Object.keys(topByEx).filter(k => topByEx[k] > 0);
    if (!exercises.length) return null;
    const retained = exercises.filter(k => recentTopByEx[k] && recentTopByEx[k] >= topByEx[k] * 0.90);
    return Math.round((retained.length / exercises.length) * 100);
  }

  // Waist change 30d (cm)
  function _waistDelta30d() {
    const entries = _measurements().sort((a, b) => a.date < b.date ? -1 : 1);
    const cutoff  = _daysAgo(30);
    const recent  = entries.filter(e => e.waist && e.date >= cutoff);
    const base    = entries.filter(e => e.waist && e.date <  cutoff);
    if (!recent.length) return null;
    const latest  = recent[recent.length - 1];
    const ref     = base.length ? base[base.length - 1] : (recent.length >= 2 ? recent[0] : null);
    if (!ref) return null;
    return +(+latest.waist - +ref.waist).toFixed(1);
  }

  // Training days in last 7 days
  function _trainingDays7d() {
    const cutoff = _daysAgo(7);
    const days = new Set(_workouts().filter(w => w.date >= cutoff && w.date <= _isoToday()).map(w => w.date));
    return days.size;
  }

  // Training days in last 30 days
  function _trainingDays30d() {
    const cutoff = _daysAgo(30);
    const days = new Set(_workouts().filter(w => w.date >= cutoff && w.date <= _isoToday()).map(w => w.date));
    return days.size;
  }

  // Protein target hit: days in last 7 where logged protein >= target
  function _proteinHit7d() {
    const log     = _mealsLog();
    const target  = _proteinTarget();
    const cutoff  = _daysAgo(7);
    let hit = 0, total = 0;
    for (let i = 0; i < 7; i++) {
      const d = _daysAgo(i);
      if (d < cutoff) break;
      const meals = log[d] || [];
      if (!meals.length) continue;
      total++;
      const proteinSum = meals.reduce((s, m) => s + (parseFloat(m.p) || 0), 0);
      if (proteinSum >= target * 0.9) hit++; // 90% counts as hit
    }
    return { hit, total };
  }

  // Overload score (28-day, whole body) — from overload engine
  function _overloadScore() {
    if (!window.FORGE_OVERLOAD) return null;
    const muscles = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Glutes'];
    const scores  = muscles.map(m => window.FORGE_OVERLOAD.getMuscleOverloadScore(m)).filter(s => s !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Avg sleep score last 7 days (1-5 stars)
  function _avgSleep7d() {
    let sum = 0, count = 0;
    for (let i = 0; i < 7; i++) {
      const ci = _checkin(_daysAgo(i));
      if (ci && !ci.skipped && ci.sleep) { sum += ci.sleep; count++; }
    }
    return count ? (sum / count).toFixed(1) : null;
  }

  // Avg daily calorie surplus/deficit last 7 days
  function _avgCalBalance7d() {
    const log   = _mealsLog();
    const kcalT = _kcalTarget();
    let sum = 0, days = 0;
    for (let i = 0; i < 7; i++) {
      const d     = _daysAgo(i);
      const meals = log[d] || [];
      if (!meals.length) continue;
      const logged = meals.reduce((s, m) => s + (parseFloat(m.kcal) || 0), 0);
      sum += logged - kcalT;
      days++;
    }
    return days ? Math.round(sum / days) : null;
  }

  // Avg daily calorie deficit last 7 days (for fat loss — positive = deficit)
  function _avgKcalLogged7d() {
    const log = _mealsLog();
    let sum = 0, days = 0;
    for (let i = 0; i < 7; i++) {
      const d     = _daysAgo(i);
      const meals = log[d] || [];
      if (!meals.length) continue;
      sum += meals.reduce((s, m) => s + (parseFloat(m.kcal) || 0), 0);
      days++;
    }
    return days ? Math.round(sum / days) : null;
  }

  // Cardio mins last 7 days
  function _cardioMins7d() {
    const cutoff = _daysAgo(7);
    return _cardioLog()
      .filter(s => s.date >= cutoff)
      .reduce((sum, s) => sum + (parseFloat(s.durationMins || s.duration || s.mins || 0)), 0);
  }

  // Avg steps last 7 days
  function _avgSteps7d() {
    const steps  = _stepsLog();
    let sum = 0, count = 0;
    for (let i = 0; i < 7; i++) {
      const d = _daysAgo(i);
      if (steps[d] != null && steps[d] > 0) { sum += steps[d]; count++; }
    }
    return count ? Math.round(sum / count) : null;
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _statusIcon(pass, warn) {
    if (pass  === true)  return '<span class="gd-ok">✅</span>';
    if (warn  === true)  return '<span class="gd-warn">⚠️</span>';
    return '<span class="gd-na">—</span>';
  }

  function _kpiRow(label, value, status, note) {
    return `
      <div class="gd-kpi-row">
        <span class="gd-kpi-label">${_esc(label)}</span>
        <span class="gd-kpi-value">${value ?? '—'}</span>
        <span class="gd-kpi-status">${status || ''}</span>
        ${note ? `<span class="gd-kpi-note">${_esc(note)}</span>` : ''}
      </div>`;
  }

  function _sign(n) { return n > 0 ? '+' : ''; }

  // ── Goal-specific render ──────────────────────────────────────────────────

  function _renderMuscleGain() {
    const wt30      = _weightChange30d();
    const ib        = _inbodyDelta30d();
    const prs       = _prsThisMonth();
    const trainDays = _trainingDays7d();
    const protHit   = _proteinHit7d();
    const olScore   = _overloadScore();
    const sleep     = _avgSleep7d();
    const calBal    = _avgCalBalance7d();

    // Lagging KPIs — past 30 days
    const wOk = wt30 && wt30.delta >= 0.3 && wt30.delta <= 1.5;
    const wWarn = wt30 && (wt30.delta < 0.3 || wt30.delta > 1.5);

    const lagging = `
      <div class="gd-section-title">OUTCOMES — LAST 30 DAYS</div>
      <div class="gd-kpi-list">
        ${_kpiRow(
          'Weight trend',
          wt30 ? `${_sign(wt30.delta)}${wt30.delta.toFixed(1)} kg` : null,
          wt30 ? _statusIcon(wOk, wWarn) : _statusIcon(false,false),
          'target: +0.3–1.5 kg/mo'
        )}
        ${ib ? _kpiRow(
          'Muscle (SMM)',
          ib.smmDelta != null ? `${_sign(ib.smmDelta)}${ib.smmDelta} kg` : `${ib.latestSmm != null ? ib.latestSmm + ' kg' : null}`,
          ib.smmDelta != null ? _statusIcon(ib.smmDelta >= 0, ib.smmDelta < 0) : _statusIcon(false, false),
          'vs 30d ago (InBody)'
        ) : _kpiRow('Muscle (SMM)', null, '<span class="gd-na">Add InBody test</span>', '')}
        ${ib ? _kpiRow(
          'Body Fat %',
          ib.bfDelta != null ? `${_sign(ib.bfDelta)}${ib.bfDelta}%` : `${ib.latestBf != null ? ib.latestBf + '%' : null}`,
          ib.bfDelta != null ? _statusIcon(ib.bfDelta <= 0.5, ib.bfDelta > 0.5) : '',
          'vs 30d ago'
        ) : ''}
        ${_kpiRow(
          'Strength PRs',
          prs > 0 ? `${prs} new PR${prs > 1 ? 's' : ''}` : '0 new PRs',
          prs >= 2 ? _statusIcon(true) : prs >= 1 ? _statusIcon(false, true) : _statusIcon(false, true),
          'exercises where you hit a new max'
        )}
      </div>`;

    // Leading KPIs — last 7 days
    const trainOk  = trainDays >= 3;
    const trainWarn = trainDays < 3;
    const protOk   = protHit.total > 0 && (protHit.hit / protHit.total) >= 0.7;
    const protWarn = protHit.total > 0 && (protHit.hit / protHit.total) < 0.7;
    const olOk     = olScore != null && olScore >= 70;
    const olWarn   = olScore != null && olScore < 70;
    const sleepOk  = sleep != null && parseFloat(sleep) >= 3.5;
    const sleepWarn = sleep != null && parseFloat(sleep) < 3.5;
    const calOk    = calBal != null && calBal >= 100 && calBal <= 400;
    const calWarn  = calBal != null && (calBal < 50 || calBal > 500);

    const leading = `
      <div class="gd-section-title" style="margin-top:14px;">BEHAVIORS — THIS WEEK</div>
      <div class="gd-kpi-list">
        ${_kpiRow('Training days', `${trainDays}/7`, _statusIcon(trainOk, trainWarn), 'target: 3–5×/week')}
        ${_kpiRow(
          'Protein hit',
          protHit.total ? `${protHit.hit}/${protHit.total} days` : null,
          protHit.total ? _statusIcon(protOk, protWarn) : '',
          `target: ${_proteinTarget()}g/day`
        )}
        ${_kpiRow(
          'Overload score',
          olScore != null ? `${olScore}%` : null,
          olScore != null ? _statusIcon(olOk, olWarn) : '',
          'target: 70%+ (28-day)'
        )}
        ${_kpiRow(
          'Sleep quality',
          sleep ? `${sleep}/5` : null,
          sleep ? _statusIcon(sleepOk, sleepWarn) : '',
          'avg nightly score'
        )}
        ${_kpiRow(
          'Calorie surplus',
          calBal != null ? `${_sign(calBal)}${calBal} kcal/day` : null,
          calBal != null ? _statusIcon(calOk, calWarn) : '',
          'target: +150–400 kcal'
        )}
      </div>`;

    return lagging + leading;
  }

  function _renderFatLoss() {
    const wt30     = _weightChange30d();
    const ib       = _inbodyDelta30d();
    const waist    = _waistDelta30d();
    const strRet   = _strengthRetention();
    const trainDays = _trainingDays7d();
    const protHit  = _proteinHit7d();
    const cardio   = _cardioMins7d();
    const steps    = _avgSteps7d();
    const sleep    = _avgSleep7d();
    const avgKcal  = _avgKcalLogged7d();
    const tdee     = _tdee();
    const deficit  = avgKcal != null ? tdee - avgKcal : null;

    const wOk  = wt30 && wt30.delta >= -4 && wt30.delta <= -0.5;
    const wWarn = wt30 && (wt30.delta > 0 || wt30.delta < -4);

    const lagging = `
      <div class="gd-section-title">OUTCOMES — LAST 30 DAYS</div>
      <div class="gd-kpi-list">
        ${_kpiRow(
          'Weight trend',
          wt30 ? `${_sign(wt30.delta)}${wt30.delta.toFixed(1)} kg` : null,
          wt30 ? _statusIcon(wOk, wWarn) : '',
          'target: -0.5–1 kg/wk'
        )}
        ${ib ? _kpiRow(
          'Body Fat %',
          ib.bfDelta != null ? `${_sign(ib.bfDelta)}${ib.bfDelta}%` : `${ib.latestBf != null ? ib.latestBf + '%' : null}`,
          ib.bfDelta != null ? _statusIcon(ib.bfDelta < 0, ib.bfDelta >= 0) : '',
          'vs 30d ago (InBody)'
        ) : _kpiRow('Body Fat %', null, '<span class="gd-na">Add InBody test</span>', '')}
        ${waist != null ? _kpiRow(
          'Waist',
          `${_sign(waist)}${waist} cm`,
          _statusIcon(waist <= -0.5, waist > 0),
          'vs 30d ago'
        ) : ''}
        ${strRet != null ? _kpiRow(
          'Strength retention',
          `${strRet}%`,
          _statusIcon(strRet >= 85, strRet < 85),
          'target: ≥85% — not losing muscle'
        ) : ''}
      </div>`;

    const defOk  = deficit != null && deficit >= 250 && deficit <= 600;
    const defWarn = deficit != null && (deficit < 100 || deficit > 700);
    const protOk  = protHit.total > 0 && (protHit.hit / protHit.total) >= 0.7;
    const protWarn = protHit.total > 0 && (protHit.hit / protHit.total) < 0.7;
    const carOk   = cardio >= 90;
    const carWarn = cardio > 0 && cardio < 90;
    const stpOk   = steps != null && steps >= 8000;
    const stpWarn = steps != null && steps < 8000;
    const trainOk = trainDays >= 3;
    const sleepOk = sleep != null && parseFloat(sleep) >= 3.5;
    const sleepWarn = sleep != null && parseFloat(sleep) < 3.5;

    const leading = `
      <div class="gd-section-title" style="margin-top:14px;">BEHAVIORS — THIS WEEK</div>
      <div class="gd-kpi-list">
        ${_kpiRow(
          'Calorie deficit',
          deficit != null ? `−${Math.abs(deficit)} kcal/day avg` : null,
          deficit != null ? _statusIcon(defOk, defWarn) : '',
          'target: 250–600 kcal below TDEE'
        )}
        ${_kpiRow(
          'Protein hit',
          protHit.total ? `${protHit.hit}/${protHit.total} days` : null,
          protHit.total ? _statusIcon(protOk, protWarn) : '',
          `${_proteinTarget()}g/day target — muscle-sparing`
        )}
        ${_kpiRow(
          'Cardio mins',
          `${Math.round(cardio)} min`,
          _statusIcon(carOk, carWarn),
          'target: 90+ min/week'
        )}
        ${_kpiRow('Training days', `${trainDays}/7`, _statusIcon(trainOk, !trainOk), 'target: 3–4×/week')}
        ${steps != null ? _kpiRow(
          'Avg steps',
          `${(steps / 1000).toFixed(1)}k/day`,
          _statusIcon(stpOk, stpWarn),
          'target: 8,000+ steps'
        ) : ''}
        ${_kpiRow('Sleep quality', sleep ? `${sleep}/5` : null, sleep ? _statusIcon(sleepOk, sleepWarn) : '', 'avg nightly score')}
      </div>`;

    return lagging + leading;
  }

  function _renderRecomp() {
    // Recomp = try to lose fat AND gain muscle simultaneously
    const wt30      = _weightChange30d();
    const ib        = _inbodyDelta30d();
    const waist     = _waistDelta30d();
    const trainDays = _trainingDays7d();
    const protHit   = _proteinHit7d();
    const olScore   = _overloadScore();
    const sleep     = _avgSleep7d();
    const calBal    = _avgCalBalance7d();

    const lagging = `
      <div class="gd-section-title">OUTCOMES — LAST 30 DAYS</div>
      <div class="gd-kpi-list">
        ${_kpiRow(
          'Weight (stable)',
          wt30 ? `${_sign(wt30.delta)}${wt30.delta.toFixed(1)} kg` : null,
          wt30 ? _statusIcon(Math.abs(wt30.delta) <= 1, Math.abs(wt30.delta) > 1) : '',
          'target: ±1 kg (recomp = weight stable)'
        )}
        ${ib ? _kpiRow(
          'Fat loss (BF%)',
          ib.bfDelta != null ? `${_sign(ib.bfDelta)}${ib.bfDelta}%` : null,
          ib.bfDelta != null ? _statusIcon(ib.bfDelta <= 0, ib.bfDelta > 0.5) : '',
          'target: decreasing'
        ) : _kpiRow('Body Fat %', null, '<span class="gd-na">Add InBody test</span>', '')}
        ${ib?.smmDelta != null ? _kpiRow(
          'Muscle gain (SMM)',
          `${_sign(ib.smmDelta)}${ib.smmDelta} kg`,
          _statusIcon(ib.smmDelta >= 0, ib.smmDelta < 0),
          'target: stable or increasing'
        ) : ''}
        ${waist != null ? _kpiRow(
          'Waist',
          `${_sign(waist)}${waist} cm`,
          _statusIcon(waist <= 0, waist > 0.5),
          'should trend down'
        ) : ''}
      </div>`;

    const calOk  = calBal != null && calBal >= -100 && calBal <= 100;
    const calWarn = calBal != null && Math.abs(calBal) > 200;
    const protOk  = protHit.total > 0 && (protHit.hit / protHit.total) >= 0.8;
    const olOk    = olScore != null && olScore >= 70;
    const sleepOk = sleep != null && parseFloat(sleep) >= 3.5;

    const leading = `
      <div class="gd-section-title" style="margin-top:14px;">BEHAVIORS — THIS WEEK</div>
      <div class="gd-kpi-list">
        ${_kpiRow('Training days', `${trainDays}/7`, _statusIcon(trainDays >= 4, trainDays < 4), 'target: 4×/week')}
        ${_kpiRow(
          'Protein hit',
          protHit.total ? `${protHit.hit}/${protHit.total} days` : null,
          protHit.total ? _statusIcon(protOk, !protOk) : '',
          `${_proteinTarget()}g/day — critical for recomp`
        )}
        ${_kpiRow(
          'Overload score',
          olScore != null ? `${olScore}%` : null,
          olScore != null ? _statusIcon(olOk, !olOk) : '',
          'target: 70%+ (stimulus for muscle)'
        )}
        ${_kpiRow(
          'Calorie balance',
          calBal != null ? `${_sign(calBal)}${calBal} kcal/day` : null,
          calBal != null ? _statusIcon(calOk, calWarn) : '',
          'target: ±100 kcal (maintenance)'
        )}
        ${_kpiRow('Sleep quality', sleep ? `${sleep}/5` : null, sleep ? _statusIcon(sleepOk, !sleepOk) : '', 'critical for recomp')}
      </div>`;

    return lagging + leading;
  }

  // ── Momentum score (% of leading KPIs hit) ───────────────────────────────
  function _momentumScore(goal) {
    const checks = [];
    const trainDays = _trainingDays7d();
    const protHit   = _proteinHit7d();
    const olScore   = _overloadScore();
    const sleep     = _avgSleep7d();
    const calBal    = _avgCalBalance7d();
    const avgKcal   = _avgKcalLogged7d();
    const deficit   = avgKcal != null ? _tdee() - avgKcal : null;
    const cardio    = _cardioMins7d();
    const steps     = _avgSteps7d();

    if (goal === 'muscle' || goal === 'strength') {
      checks.push(trainDays >= 3);
      checks.push(protHit.total > 0 && (protHit.hit / protHit.total) >= 0.7);
      if (olScore != null) checks.push(olScore >= 70);
      if (sleep != null)   checks.push(parseFloat(sleep) >= 3.5);
      if (calBal != null)  checks.push(calBal >= 100 && calBal <= 500);
    } else if (goal === 'fat_loss') {
      checks.push(trainDays >= 3);
      checks.push(protHit.total > 0 && (protHit.hit / protHit.total) >= 0.7);
      if (deficit != null) checks.push(deficit >= 200 && deficit <= 700);
      if (cardio > 0)      checks.push(cardio >= 90);
      if (steps != null)   checks.push(steps >= 7000);
      if (sleep != null)   checks.push(parseFloat(sleep) >= 3.5);
    } else { // recomp / endurance / default
      checks.push(trainDays >= 3);
      checks.push(protHit.total > 0 && (protHit.hit / protHit.total) >= 0.75);
      if (olScore != null) checks.push(olScore >= 65);
      if (sleep != null)   checks.push(parseFloat(sleep) >= 3.5);
      if (calBal != null)  checks.push(Math.abs(calBal) <= 200);
    }

    if (!checks.length) return null;
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  // ── Main render ───────────────────────────────────────────────────────────
  function renderGoalDashboard() {
    const el = document.getElementById('goal-dashboard-body');
    if (!el) return;

    const goal = (_profile()?.goal || 'muscle');
    const goalLabels = {
      muscle:    { en: 'Muscle Gain',   icon: '💪' },
      fat_loss:  { en: 'Fat Loss',      icon: '🔥' },
      recomp:    { en: 'Recomp',        icon: '⚡' },
      strength:  { en: 'Strength',      icon: '🏋️' },
      endurance: { en: 'Endurance',     icon: '🏃' }
    };
    const gl = goalLabels[goal] || goalLabels.muscle;
    const score = _momentumScore(goal);

    const scoreCls = score == null ? '' : score >= 80 ? 'gd-score-green' : score >= 60 ? 'gd-score-yellow' : 'gd-score-red';
    const scoreMsg = score == null ? '' : score >= 80 ? "You're crushing it. Keep this up."
      : score >= 60 ? "Good — a few things slipping. Check ⚠️ items below."
      : "Progress at risk. Fix the ⚠️ items this week.";

    const goalBadgeEl = document.getElementById('goal-dashboard-badge');
    if (goalBadgeEl) goalBadgeEl.textContent = gl.en.toUpperCase();

    let kpiHtml;
    if (goal === 'fat_loss')  kpiHtml = _renderFatLoss();
    else if (goal === 'recomp' || goal === 'endurance') kpiHtml = _renderRecomp();
    else kpiHtml = _renderMuscleGain(); // muscle + strength

    el.innerHTML = `
      ${score != null ? `
      <div class="gd-momentum-bar${score >= 80 ? ' gd-bar-green' : score >= 60 ? ' gd-bar-yellow' : ' gd-bar-red'}">
        <div class="gd-momentum-score ${scoreCls}">${score}<span class="gd-momentum-pct">%</span></div>
        <div class="gd-momentum-info">
          <div class="gd-momentum-label">Weekly Momentum Score</div>
          <div class="gd-momentum-msg">${_esc(scoreMsg)}</div>
        </div>
      </div>` : ''}
      <div class="gd-goal-label">${_esc(gl.icon)} ${_esc(gl.en)} — leading &amp; lagging KPIs</div>
      ${kpiHtml}
      <div class="gd-footer">
        Lagging = outcomes (slow to change). Leading = behaviors (you control these now).
      </div>
    `;
  }

  // ── Global API ────────────────────────────────────────────────────────────
  window.renderGoalDashboard = renderGoalDashboard;

  // Re-render when relevant data updates
  ['forge:inbody-updated', 'forge:measurements-updated'].forEach(ev => {
    window.addEventListener(ev, () => {
      if (document.getElementById('goal-dashboard-body')) renderGoalDashboard();
    });
  });

  // Render on page load (overview is the default tab)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(renderGoalDashboard, 600));
  } else {
    setTimeout(renderGoalDashboard, 600);
  }
})();
