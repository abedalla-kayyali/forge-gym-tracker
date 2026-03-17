'use strict';
// FORGE Progressive Overload Engine
// Compares current exercise session against previous session.
// Shows overload context, calculates overload streak, detects plateaus.

(function () {
  // ── Helpers ────────────────────────────────────────────────────────────────
  function _workouts() {
    // workouts is a let in index.html — accessible as direct global, not window property
    try { return (typeof workouts !== 'undefined' ? workouts : null) || JSON.parse(localStorage.getItem('forge_workouts') || '[]'); }
    catch (_e) { return []; }
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Get all sessions for a given exercise name, sorted oldest→newest
  function _sessionsForExercise(name) {
    if (!name) return [];
    const lower = name.toLowerCase().trim();
    return [..._workouts()]
      .filter(w => (w.exercise || '').toLowerCase().trim() === lower)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  // Calculate total volume for a session (sum of weight × reps)
  function _sessionVolume(w) {
    if (!w || !Array.isArray(w.sets)) return 0;
    return w.sets.reduce((sum, s) => sum + ((+s.weight || 0) * (+s.reps || 0)), 0);
  }

  // Best set = highest weight × reps single-set performance
  function _bestSet(w) {
    if (!w || !Array.isArray(w.sets) || !w.sets.length) return null;
    return w.sets.reduce((best, s) => {
      const score = (+s.weight || 0) * (+s.reps || 0);
      const bScore = (+best.weight || 0) * (+best.reps || 0);
      return score > bScore ? s : best;
    }, w.sets[0]);
  }

  // Top set = heaviest weight lifted
  function _topWeight(w) {
    if (!w || !Array.isArray(w.sets) || !w.sets.length) return 0;
    return Math.max(...w.sets.map(s => +s.weight || 0));
  }

  // ── Overload streak ────────────────────────────────────────────────────────
  // Returns number of consecutive sessions where volume improved vs previous
  function getOverloadStreak(name) {
    const sessions = _sessionsForExercise(name);
    if (sessions.length < 2) return 0;
    let streak = 0;
    for (let i = sessions.length - 1; i >= 1; i--) {
      const curr = _sessionVolume(sessions[i]);
      const prev = _sessionVolume(sessions[i - 1]);
      if (curr > prev) streak++;
      else break;
    }
    return streak;
  }

  // ── Plateau detection ──────────────────────────────────────────────────────
  // Returns plateau length (0 = no plateau) — how many consecutive sessions with no progress
  function getPlateauLength(name) {
    const sessions = _sessionsForExercise(name);
    if (sessions.length < 3) return 0;
    let plateau = 0;
    for (let i = sessions.length - 1; i >= 1; i--) {
      const curr = _topWeight(sessions[i]);
      const prev = _topWeight(sessions[i - 1]);
      if (curr <= prev) plateau++;
      else break;
    }
    return plateau;
  }

  // ── Per-exercise overload comparison ──────────────────────────────────────
  function getOverloadContext(name) {
    const sessions = _sessionsForExercise(name);
    if (sessions.length < 1) return null;

    const last = sessions[sessions.length - 1];
    const prev = sessions.length >= 2 ? sessions[sessions.length - 2] : null;

    const lastVol  = _sessionVolume(last);
    const prevVol  = prev ? _sessionVolume(prev) : null;
    const lastTop  = _topWeight(last);
    const prevTop  = prev ? _topWeight(prev) : null;
    const streak   = getOverloadStreak(name);
    const plateau  = getPlateauLength(name);

    return {
      lastSession: last,
      prevSession: prev,
      lastVolume:  lastVol,
      prevVolume:  prevVol,
      lastTopWeight: lastTop,
      prevTopWeight: prevTop,
      overloadStreak: streak,
      plateauLength: plateau,
      volDelta: prevVol != null ? lastVol - prevVol : null,
      weightDelta: prevTop != null ? lastTop - prevTop : null
    };
  }

  // ── Overload Score for a muscle group (leading KPI) ────────────────────────
  // % of sessions in last 28 days where user beat or matched previous session
  function getMuscleOverloadScore(muscle) {
    const cutoff = new Date(Date.now() - 28 * 86400000).toISOString();
    const all = _workouts().filter(w => {
      if (muscle && (w.muscle || '').toLowerCase() !== muscle.toLowerCase()) return false;
      return w.date >= cutoff;
    });

    // Group by exercise
    const exMap = {};
    all.forEach(w => {
      const key = (w.exercise || '').toLowerCase();
      if (!exMap[key]) exMap[key] = [];
      exMap[key].push(w);
    });

    let total = 0, beat = 0;
    Object.values(exMap).forEach(sessions => {
      const sorted = sessions.sort((a, b) => a.date < b.date ? -1 : 1);
      for (let i = 1; i < sorted.length; i++) {
        total++;
        if (_sessionVolume(sorted[i]) >= _sessionVolume(sorted[i - 1])) beat++;
      }
    });

    return total === 0 ? null : Math.round((beat / total) * 100);
  }

  // ── Render enhanced last-session hint ─────────────────────────────────────
  function renderOverloadHint(name) {
    const container = document.getElementById('last-session-hint');
    const contentEl = document.getElementById('last-session-content');
    if (!container) return;

    const _cfg = (typeof settings !== 'undefined' ? settings : {});
    if (_cfg.showHint === false) { container.style.display = 'none'; return; }
    if (!name) { container.style.display = 'none'; return; }

    const ctx = getOverloadContext(name);
    if (!ctx || !ctx.lastSession) { container.style.display = 'none'; return; }

    const last = ctx.lastSession;
    const d = new Date(last.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const unit = (last.sets?.[0]?.unit) || _cfg.defaultUnit || 'kg';

    // Sets display — OPT-1: show RPE tag per set
    const setsText = (last.sets || [])
      .map((s, i) => {
        const rpeTag = s.rpe ? `<span class="ol-rpe-tag">@${s.rpe === 'F' ? 'Fail' : 'RPE' + s.rpe}</span>` : '';
        return `<span class="ol-set-chip${s.rpe ? ' ol-set-has-rpe' : ''}">S${i + 1}: ${s.reps}×${s.weight}${s.unit || unit}${rpeTag}</span>`;
      })
      .join('');

    // OPT-1: Compute RIR from highest RPE of working sets
    const _rpeToNum = r => (r === 'F' || r === 'f') ? 10 : (parseFloat(r) || 0);
    const _workingSets = (last.sets || []).filter(s => s.type !== 'warmup' && s.rpe);
    let _rir = null;
    if (_workingSets.length > 0) {
      const _maxRpe = Math.max(..._workingSets.map(s => _rpeToNum(s.rpe)));
      _rir = Math.round((10 - _maxRpe) * 2) / 2; // e.g. RPE8 → RIR2
      if (_rir < 0) _rir = 0;
    }

    // Overload status
    let statusHtml = '';
    if (ctx.volDelta !== null) {
      if (ctx.volDelta > 0) {
        statusHtml = `<span class="ol-status ol-up">↑ +${ctx.volDelta.toFixed(0)} kg vol</span>`;
      } else if (ctx.volDelta === 0) {
        statusHtml = `<span class="ol-status ol-flat">→ Same volume</span>`;
      } else {
        statusHtml = `<span class="ol-status ol-down">↓ ${ctx.volDelta.toFixed(0)} kg vol</span>`;
      }
    }

    // Streak badge
    let streakHtml = '';
    if (ctx.overloadStreak >= 2) {
      streakHtml = `<span class="ol-streak-badge">🔥 ${ctx.overloadStreak} session streak</span>`;
    }

    // Plateau warning — OPT-2: 1-tap action buttons
    let plateauHtml = '';
    if (ctx.plateauLength >= 3) {
      const _pUnit = (last.sets?.[0]?.unit) || _cfg.defaultUnit || 'kg';
      const _topW  = ctx.lastTopWeight || 0;
      const _safeName = (name || '').replace(/'/g, "\\'");
      plateauHtml = `
        <div class="ol-plateau-warn">
          <div class="ol-plateau-title">⚠️ Plateau — ${ctx.plateauLength} sessions without progress</div>
          <div class="ol-plateau-actions">
            <button class="ol-plateau-btn" onclick="window._plateauDeload(${_topW},'${_pUnit}')">⬇️ Deload 10%</button>
            <button class="ol-plateau-btn" onclick="window._plateauSwapExercise('${_safeName}')">🔄 Swap Exercise</button>
            <button class="ol-plateau-btn" onclick="window._plateauRepRange()">📊 Change Rep Range</button>
          </div>
        </div>`;
    }

    // Target for next session — OPT-1: RIR-aware increment
    let targetHtml = '';
    if (ctx.lastTopWeight > 0) {
      let _inc, _rirBadge = '';
      if (_rir === null) {
        _inc = unit === 'lbs' ? 5 : 2.5;
      } else if (_rir === 0) {
        _inc = 0;
        _rirBadge = `<span class="ol-rir-badge ol-rir-max">RIR 0 — maintain weight</span>`;
      } else if (_rir <= 2) {
        _inc = unit === 'lbs' ? 5 : 2.5;
        _rirBadge = `<span class="ol-rir-badge ol-rir-close">RIR ${_rir} — ready to increase</span>`;
      } else {
        _inc = unit === 'lbs' ? 10 : 5;
        _rirBadge = `<span class="ol-rir-badge ol-rir-easy">RIR ${_rir} — push harder</span>`;
      }
      const suggestWeight = ctx.lastTopWeight + _inc;
      targetHtml = `<div class="ol-target">🎯 Target today: <strong>${suggestWeight}${unit}</strong> ${_rirBadge}</div>`;
    }

    if (contentEl) {
      contentEl.innerHTML = `
        <div class="ol-header">
          <span class="ol-date">${d}</span>
          ${statusHtml}
          ${streakHtml}
        </div>
        <div class="ol-sets-row">${setsText}</div>
        ${targetHtml}
        ${plateauHtml}
      `;
    }
    container.style.display = 'block';
  }

  // ── Dashboard Overload Score Card (used in Body / Progress tab) ────────────
  function renderOverloadScoreCard(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const muscles = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Glutes'];
    const rows = muscles.map(m => {
      const score = getMuscleOverloadScore(m);
      if (score === null) return null;
      const bar = Math.min(100, score);
      const cls = score >= 70 ? 'ol-score-good' : score >= 50 ? 'ol-score-ok' : 'ol-score-low';
      return `
        <div class="ol-muscle-row">
          <span class="ol-muscle-name">${_esc(m)}</span>
          <div class="ol-score-bar-wrap">
            <div class="ol-score-bar-fill ${cls}" style="width:${bar}%"></div>
          </div>
          <span class="ol-score-pct ${cls}">${score}%</span>
        </div>`;
    }).filter(Boolean);

    if (!rows.length) {
      el.innerHTML = '<div class="ol-empty">Log at least 2 sessions per muscle to see overload scores.</div>';
      return;
    }

    const overall = muscles
      .map(m => getMuscleOverloadScore(m))
      .filter(s => s !== null);
    const avg = overall.length ? Math.round(overall.reduce((a, b) => a + b, 0) / overall.length) : null;

    el.innerHTML = `
      <div class="ol-overall-score">
        <span class="ol-overall-val ${avg >= 70 ? 'ol-score-good' : avg >= 50 ? 'ol-score-ok' : 'ol-score-low'}">${avg ?? '—'}%</span>
        <span class="ol-overall-lbl">28-day Overload Score</span>
        <span class="ol-overall-target">Target: 70%+</span>
      </div>
      <div class="ol-muscle-list">${rows.join('')}</div>
    `;
  }

  // ── OPT-2: Plateau 1-tap action handlers ──────────────────────────────────
  window._plateauDeload = function(topWeight, unit) {
    const u = unit || 'kg';
    const deloadW = u === 'lbs'
      ? Math.round(topWeight * 0.9 / 2.5) * 2.5
      : Math.round(topWeight * 0.9 * 2) / 2;
    // Fill all weight inputs currently visible in the active exercise panel
    document.querySelectorAll('.set-weight, input[data-field="weight"]').forEach(inp => {
      inp.value = deloadW;
    });
    if (typeof showToast === 'function') showToast(`Deload set to ${deloadW}${u} — aim for 15–20 reps`, 'info');
  };

  window._plateauSwapExercise = function(exerciseName) {
    const swaps = (typeof EXERCISE_SWAPS !== 'undefined' ? EXERCISE_SWAPS : {});
    // Case-insensitive lookup
    const key = Object.keys(swaps).find(k => k.toLowerCase() === (exerciseName || '').toLowerCase());
    const alts = key ? swaps[key] : [];
    if (alts && alts.length) {
      const pick = alts[0];
      const nameInput = document.getElementById('exercise-name');
      if (nameInput) { nameInput.value = pick; nameInput.dispatchEvent(new Event('input')); }
      if (typeof showToast === 'function') showToast(`Swapped to "${pick}" for 3–4 weeks`, 'info');
    } else {
      if (typeof showToast === 'function') showToast('Try: a dumbbell, cable, or machine variation of this movement', 'info');
    }
  };

  window._plateauRepRange = function() {
    const tips = [
      '3×8 → try 4×6 (strength focus)',
      '3×10 → try 3×15 (metabolic stress)',
      '4×8 → try 5×5 (neural drive)',
      'Drop set: last set reduce weight 20% and go to failure'
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    if (typeof showToast === 'function') showToast(`Rep range tip: ${tip}`, 'info');
  };

  // ── Global API ─────────────────────────────────────────────────────────────
  window.FORGE_OVERLOAD = {
    getOverloadContext,
    getOverloadStreak,
    getPlateauLength,
    getMuscleOverloadScore,
    renderOverloadHint,
    renderOverloadScoreCard
  };

  // Hook into existing updateLastSessionHint — override it
  window._origUpdateLastSessionHint = window.updateLastSessionHint;
  window.updateLastSessionHint = function () {
    const name = document.getElementById('exercise-name')?.value?.trim();
    renderOverloadHint(name);
  };
})();
