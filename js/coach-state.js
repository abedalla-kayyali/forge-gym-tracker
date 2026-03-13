'use strict';

(function () {
  function _arr(v) { return Array.isArray(v) ? v : []; }
  function _toNum(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function _iso(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const da = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }
  function _dayMs(iso) {
    if (!iso) return NaN;
    const d = new Date(iso + 'T00:00:00');
    return d.getTime();
  }
  function _daysAgo(iso) {
    const ms = _dayMs(iso);
    if (!Number.isFinite(ms)) return 999;
    const now = new Date();
    const todayMs = _dayMs(_iso(now));
    return Math.max(0, Math.floor((todayMs - ms) / 86400000));
  }
  function _asDateKey(v) {
    if (!v) return '';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return _iso(v);
  }
  function _startOfWeek() {
    const n = new Date();
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function _sum(arr, fn) {
    return arr.reduce((acc, item) => acc + (fn ? fn(item) : item), 0);
  }
  function _avg(arr) {
    if (!arr.length) return 0;
    return _sum(arr) / arr.length;
  }
  function _safeDate(v) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function _sessionDays(entries) {
    return new Set(entries.map(e => e.date).filter(Boolean));
  }

  function _normalizedCardio() {
    const raw = _arr(window.cardioLog);
    return raw.map(e => {
      const date = _asDateKey(e?.date || e?.day || e?.dateKey || e?.createdAt || e?.ts);
      return {
        date,
        durationMins: _toNum(e?.durationMins ?? e?.duration ?? e?.mins, 0),
        calories: _toNum(e?.calories ?? e?.cal ?? e?.kcal, 0),
        xp: _toNum(e?.xpEarned ?? e?.xp, 0),
        category: String(e?.category || e?.cat || 'cardio').toLowerCase(),
        activity: String(e?.activity || e?.act || e?.name || 'Cardio')
      };
    }).filter(e => !!e.date);
  }

  function _normalizedWeighted() {
    return _arr(window.workouts).map(w => ({
      date: _asDateKey(w?.date),
      totalVolume: _toNum(w?.totalVolume, 0),
      muscle: String(w?.muscle || ''),
      isPR: !!w?.isPR
    })).filter(e => !!e.date);
  }

  function _normalizedBw() {
    return _arr(window.bwWorkouts).map(w => ({
      date: _asDateKey(w?.date),
      exercise: String(w?.exercise || ''),
      totalReps: _toNum(w?.totalReps, 0),
      sets: _arr(w?.sets)
    })).filter(e => !!e.date);
  }

  function _nutritionAdherence() {
    const mealsLog = window.mealsLog || {};
    const todayKey = (typeof window._mealTodayKey === 'function') ? window._mealTodayKey() : _iso(new Date());
    const todayMeals = _arr(mealsLog[todayKey]);
    if (!todayMeals.length) return { score: 45, proteinPct: 0, kcalPct: 0, note: 'No meals logged yet' };

    const p = _sum(todayMeals, m => _toNum(m?.p, 0));
    const kcal = _sum(todayMeals, m => _toNum(m?.kcal, 0));

    const wtRaw = _toNum(window.userProfile?.weight, 75);
    const wtKg = (window.userProfile?.bwUnit === 'lbs' || window.userProfile?.weightUnit === 'lbs') ? wtRaw * 0.453592 : wtRaw;
    const goal = window.userProfile?.goal || 'muscle';
    const pfMap = { muscle: 2.0, strength: 1.8, fat_loss: 2.2, endurance: 1.6, recomp: 2.2 };
    const proteinTarget = Math.max(90, Math.round(wtKg * (pfMap[goal] || 2.0)));
    const kcalTarget = Math.max(1500, Math.round((wtKg * 30) + (goal === 'fat_loss' ? -350 : goal === 'muscle' ? 250 : 0)));

    const proteinPct = Math.min(140, Math.round((p / Math.max(1, proteinTarget)) * 100));
    const kcalPct = Math.min(140, Math.round((kcal / Math.max(1, kcalTarget)) * 100));
    const proteinComponent = Math.max(0, 100 - Math.abs(100 - proteinPct));
    const kcalComponent = Math.max(0, 100 - Math.abs(100 - kcalPct));
    const score = Math.round((proteinComponent * 0.65) + (kcalComponent * 0.35));

    return { score, proteinPct, kcalPct, note: `${p.toFixed(0)}g protein / ${kcal.toFixed(0)} kcal` };
  }

  function _readinessScore(lastWeightedDate, lastCardioDate) {
    const ci = (typeof window.getTodayCheckin === 'function') ? window.getTodayCheckin() : null;
    let sleep = _toNum(ci?.sleep, 3);
    let energy = _toNum(ci?.energy, 3);
    let mood = _toNum(ci?.mood, 3);
    if (ci?.skipped) { sleep = 3; energy = 3; mood = 3; }
    const checkinScore = Math.round((((sleep + energy + mood) / 15) * 100));

    const daysW = _daysAgo(lastWeightedDate || '');
    const daysC = _daysAgo(lastCardioDate || '');
    const fresh = Math.min(daysW, daysC);
    const freshnessScore = fresh <= 1 ? 85 : fresh <= 3 ? 70 : fresh <= 5 ? 55 : 40;
    const score = Math.round((checkinScore * 0.68) + (freshnessScore * 0.32));

    return {
      score,
      checkinScore,
      freshnessScore,
      message: score >= 75 ? 'Ready for a productive session' : score >= 55 ? 'Moderate readiness, warm up well' : 'Recovery-focused day recommended'
    };
  }

  function buildCoachUnifiedState() {
    const weighted = _normalizedWeighted();
    const bw = _normalizedBw();
    const cardio = _normalizedCardio();
    const weekStart = _startOfWeek().getTime();
    const now = Date.now();
    const d28 = now - (28 * 86400000);
    const d14 = now - (14 * 86400000);
    const d7 = now - (7 * 86400000);

    const weightedWeek = weighted.filter(w => _dayMs(w.date) >= weekStart);
    const bwWeek = bw.filter(w => _dayMs(w.date) >= weekStart);
    const cardioWeek = cardio.filter(c => _dayMs(c.date) >= weekStart);

    const weighted28 = weighted.filter(w => _dayMs(w.date) >= d28);
    const bw28 = bw.filter(w => _dayMs(w.date) >= d28);
    const cardio28 = cardio.filter(w => _dayMs(w.date) >= d28);

    const cardio14 = cardio.filter(c => _dayMs(c.date) >= d14);
    const cardioPrev14 = cardio.filter(c => {
      const ms = _dayMs(c.date);
      return ms < d14 && ms >= (d14 - 14 * 86400000);
    });

    const weighted14 = weighted.filter(w => _dayMs(w.date) >= d14);
    const weightedPrev14 = weighted.filter(w => {
      const ms = _dayMs(w.date);
      return ms < d14 && ms >= (d14 - 14 * 86400000);
    });

    const cardioMinsWeek = _sum(cardioWeek, c => c.durationMins);
    const cardioMins14 = _sum(cardio14, c => c.durationMins);
    const cardioMinsPrev14 = _sum(cardioPrev14, c => c.durationMins);
    const weightedVol14 = _sum(weighted14, w => w.totalVolume);
    const weightedVolPrev14 = _sum(weightedPrev14, w => w.totalVolume);

    const allSessionDays28 = new Set([
      ..._sessionDays(weighted28),
      ..._sessionDays(bw28),
      ..._sessionDays(cardio28)
    ]);
    const activeDays7 = allSessionDays28.size
      ? Array.from(allSessionDays28).filter(k => _dayMs(k) >= d7).length
      : 0;

    const todayKey = _iso(new Date());
    const today = {
      weighted: weighted.some(w => w.date === todayKey),
      bw: bw.some(w => w.date === todayKey),
      cardio: cardio.some(c => c.date === todayKey)
    };

    const lastWeighted = weighted.length ? weighted[weighted.length - 1].date : '';
    const lastCardio = cardio.length ? cardio[cardio.length - 1].date : '';
    const lastAny = [lastWeighted, lastCardio, (bw.length ? bw[bw.length - 1].date : '')].filter(Boolean).sort().pop() || '';

    const nutrition = _nutritionAdherence();
    const readiness = _readinessScore(lastWeighted, lastCardio);

    return {
      todayKey,
      today,
      weighted,
      bw,
      cardio,
      weekly: {
        weightedSessions: weightedWeek.length,
        bwSessions: bwWeek.length,
        cardioSessions: cardioWeek.length,
        cardioMins: cardioMinsWeek
      },
      trends: {
        cardioMins14,
        cardioMinsPrev14,
        weightedVol14,
        weightedVolPrev14
      },
      consistency: {
        activeDays7,
        activeDays28: allSessionDays28.size
      },
      last: { weighted: lastWeighted, cardio: lastCardio, any: lastAny },
      nutrition,
      readiness
    };
  }

  function calcTrainingScoreUnified() {
    const state = buildCoachUnifiedState();
    const weighted = state.weighted;
    const allMuscles = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves'];
    const trained = new Set(weighted.map(w => w.muscle).filter(Boolean));
    const muscleCoverage = Math.round((trained.size / allMuscles.length) * 100);

    const hasW = state.weighted.length >= 2;
    const hasB = state.bw.length >= 2;
    const hasC = state.cardio.length >= 2;
    const modalityCoverage = Math.round(((Number(hasW) + Number(hasB) + Number(hasC)) / 3) * 100);
    const balanceScore = Math.round((muscleCoverage * 0.78) + (modalityCoverage * 0.22));

    const consistencyScore = Math.min(100, Math.round((state.consistency.activeDays28 / 20) * 100));

    let volumeWeighted = 60;
    if (state.trends.weightedVolPrev14 > 0) {
      volumeWeighted = Math.min(100, Math.round((state.trends.weightedVol14 / state.trends.weightedVolPrev14) * 60));
    }
    let cardioVolume = 60;
    if (state.trends.cardioMinsPrev14 > 0) {
      cardioVolume = Math.min(100, Math.round((state.trends.cardioMins14 / state.trends.cardioMinsPrev14) * 60));
    } else if (state.trends.cardioMins14 > 0) {
      cardioVolume = 78;
    }
    const volumeScore = Math.round((volumeWeighted * 0.68) + (cardioVolume * 0.32));

    const liftStreak = (typeof window.calcStreak === 'function') ? _toNum(window.calcStreak(), 0) : 0;
    const cardioStreak = (typeof window._calcCardioStreak === 'function') ? _toNum(window._calcCardioStreak(), 0) : 0;
    const streakDays = Math.max(liftStreak, cardioStreak);
    const streakScore = Math.min(100, Math.round((streakDays * 12) + (state.consistency.activeDays7 * 3)));

    const nutritionScore = _toNum(state.nutrition.score, 55);
    const readinessScore = _toNum(state.readiness.score, 60);

    const total = Math.min(100, Math.round(
      (balanceScore * 0.26) +
      (consistencyScore * 0.24) +
      (volumeScore * 0.20) +
      (streakScore * 0.12) +
      (nutritionScore * 0.10) +
      (readinessScore * 0.08)
    ));

    return {
      total,
      balance: balanceScore,
      consistency: consistencyScore,
      volume: volumeScore,
      streak: streakScore,
      nutrition: nutritionScore,
      readiness: readinessScore,
      cardio: Math.min(100, Math.round((cardioVolume * 0.7) + (Math.min(100, state.weekly.cardioMins) * 0.3)))
    };
  }

  function _coachStartCardioFromCoach() {
    if (typeof window.switchView === 'function') {
      window.switchView('log', document.getElementById('bnav-log'));
    }
    if (typeof window.setWorkoutMode === 'function') {
      window.setWorkoutMode('cardio');
    }
    setTimeout(() => {
      const zone = document.getElementById('cardio-zone');
      if (zone) zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function _coachOpenCardioAnalytics() {
    if (typeof window.switchView === 'function') {
      window.switchView('dashboard', document.getElementById('bnav-dashboard'));
    }
    if (typeof window.switchDashTab === 'function') {
      const btn = document.querySelector('.dash-tab[data-tab="cardio"]');
      window.switchDashTab('cardio', btn || null);
    }
  }

  function _coachBuild7DayCardioPulse(entries) {
    const byDay = {};
    entries.forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + (e.durationMins || 0); });
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = _iso(d);
      days.push({ key, mins: byDay[key] || 0 });
    }
    const max = Math.max(1, ...days.map(d => d.mins));
    return days.map(d => {
      const h = Math.max(8, Math.round((d.mins / max) * 42));
      const lbl = new Date(d.key + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
      return '<div class="coach-pulse-col" title="' + d.key + ': ' + d.mins + ' min">' +
        '<div class="coach-pulse-bar" style="height:' + h + 'px;"></div>' +
        '<div class="coach-pulse-day">' + lbl + '</div>' +
      '</div>';
    }).join('');
  }

  function _coachStartWeightedFromCoach() {
    if (typeof window.switchView === 'function') window.switchView('log', document.getElementById('bnav-log'));
    if (typeof window.setWorkoutMode === 'function') window.setWorkoutMode('weighted');
  }

  function _coachStartBodyweightFromCoach() {
    if (typeof window.switchView === 'function') window.switchView('log', document.getElementById('bnav-log'));
    if (typeof window.setWorkoutMode === 'function') window.setWorkoutMode('bodyweight');
  }

  function _replaceCoachInject(host, cls, html, mode) {
    if (!host) return;
    const old = host.querySelector('.' + cls);
    if (old) old.remove();
    if (mode === 'append') host.insertAdjacentHTML('beforeend', html);
    else host.insertAdjacentHTML('afterbegin', html);
  }

  function _enhanceInsightsTab() {
    const host = document.getElementById('coach-tab-insights');
    if (!host) return;
    const s = buildCoachUnifiedState();
    const cDiff = s.trends.cardioMins14 - s.trends.cardioMinsPrev14;
    const wDiff = s.trends.weightedVol14 - s.trends.weightedVolPrev14;
    const card =
      '<div class="coach-bubble coach-integration-insights">' +
        '<strong>Performance Snapshot</strong><br>' +
        'Readiness ' + s.readiness.score + '/100 · Nutrition ' + s.nutrition.score + '/100 · Active days(7d): ' + s.consistency.activeDays7 +
        '<div class="coach-mini-tags">' +
          '<span class="coach-mini-tag ' + (s.readiness.score >= 70 ? 'good' : s.readiness.score >= 55 ? 'warn' : 'alert') + '">Readiness</span>' +
          '<span class="coach-mini-tag ' + (s.nutrition.score >= 70 ? 'good' : s.nutrition.score >= 55 ? 'warn' : 'alert') + '">Nutrition</span>' +
          '<span class="coach-mini-tag ' + ((cDiff >= 0 && wDiff >= 0) ? 'good' : 'warn') + '">Momentum</span>' +
        '</div>' +
        '<div class="coach-kpi-grid" style="margin-top:10px;">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Cardio Trend (14d)</div><div class="coach-kpi-value">' + (cDiff >= 0 ? '+' : '') + cDiff + '</div><div class="coach-kpi-sub">minutes vs prior 14d</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Lift Volume Trend (14d)</div><div class="coach-kpi-value">' + (wDiff >= 0 ? '+' : '') + Math.round(wDiff) + '</div><div class="coach-kpi-sub">volume vs prior 14d</div></div>' +
        '</div>' +
      '</div>';
    const wrap = host.querySelector('.coach-chat-wrap');
    if (!wrap) return;
    const old = host.querySelector('.coach-integration-insights');
    if (old) old.remove();
    wrap.insertAdjacentHTML('afterbegin', card);
  }

  function _enhanceTrainTab() {
    const host = document.getElementById('coach-tab-train');
    if (!host) return;
    const s = buildCoachUnifiedState();
    const card =
      '<div class="coach-bubble coach-integration-train">' +
        '<strong>Mode Launcher</strong><br>' +
        'Pick your session type directly from Coach. Weekly mix: W ' + s.weekly.weightedSessions + ' · BW ' + s.weekly.bwSessions + ' · Cardio ' + s.weekly.cardioSessions +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachStartWeightedFromCoach()">Start Weighted</button>' +
          '<button class="coach-action-btn" onclick="_coachStartBodyweightFromCoach()">Start Bodyweight</button>' +
        '</div>' +
        '<div class="coach-dual-actions" style="margin-top:8px;">' +
          '<button class="coach-action-btn" onclick="_coachStartCardioFromCoach()">Start Cardio</button>' +
          '<button class="coach-action-btn" onclick="_coachOpenCardioAnalytics()">Cardio Analytics</button>' +
        '</div>' +
      '</div>';
    _replaceCoachInject(host, 'coach-integration-train', card, 'prepend');
  }

  function _enhancePlanTab() {
    const host = document.getElementById('coach-tab-plan');
    if (!host) return;
    const s = buildCoachUnifiedState();
    const wTarget = 4;
    const bwTarget = 2;
    const cTarget = 3;
    const wp = Math.min(100, Math.round((s.weekly.weightedSessions / wTarget) * 100));
    const bp = Math.min(100, Math.round((s.weekly.bwSessions / bwTarget) * 100));
    const cp = Math.min(100, Math.round((s.weekly.cardioSessions / cTarget) * 100));
    const card =
      '<div class="coach-bubble coach-integration-plan">' +
        '<strong>Integrated Weekly Targets</strong><br>' +
        '<div class="coach-kpi-grid" style="margin-top:10px;">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Weighted</div><div class="coach-kpi-value">' + s.weekly.weightedSessions + '/' + wTarget + '</div><div class="coach-kpi-sub">' + wp + '% complete</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Bodyweight</div><div class="coach-kpi-value">' + s.weekly.bwSessions + '/' + bwTarget + '</div><div class="coach-kpi-sub">' + bp + '% complete</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Cardio</div><div class="coach-kpi-value">' + s.weekly.cardioSessions + '/' + cTarget + '</div><div class="coach-kpi-sub">' + cp + '% complete</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Cardio Minutes</div><div class="coach-kpi-value">' + s.weekly.cardioMins + '</div><div class="coach-kpi-sub">target 120 min</div></div>' +
        '</div>' +
      '</div>';
    _replaceCoachInject(host, 'coach-integration-plan', card, 'prepend');
  }

  function _enhanceNutritionTab() {
    const host = document.getElementById('coach-tab-nutrition');
    if (!host) return;
    const s = buildCoachUnifiedState();
    const p = s.nutrition.proteinPct || 0;
    const k = s.nutrition.kcalPct || 0;
    const card =
      '<div class="coach-bubble coach-integration-nutrition">' +
        '<strong>Today Nutrition Actions</strong><br>' +
        'Protein ' + p + '% · Calories ' + k + '% · Readiness ' + s.readiness.score + '/100' +
        '<div style="margin-top:8px;">' +
          (p < 85 ? 'Increase protein feeding across next meals.' : 'Protein pacing is on track.') + ' ' +
          (k < 80 ? 'You are under target calories today.' : k > 120 ? 'You are above target calories today.' : 'Calories are in range.') +
        '</div>' +
      '</div>';
    _replaceCoachInject(host, 'coach-integration-nutrition', card, 'prepend');
  }

  function _enhanceCaliTab() {
    const host = document.getElementById('coach-tab-cali');
    if (!host) return;
    const s = buildCoachUnifiedState();
    const goal = 2;
    const pct = Math.min(100, Math.round((s.weekly.bwSessions / goal) * 100));
    const card =
      '<div class="coach-bubble coach-integration-cali">' +
        '<strong>Calisthenics Weekly Focus</strong><br>' +
        'BW sessions this week: ' + s.weekly.bwSessions + '/' + goal + ' (' + pct + '%)' +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachStartBodyweightFromCoach()">Start BW Session</button>' +
          '<button class="coach-action-btn" onclick="_coachStartCardioFromCoach()">Add Cardio Finish</button>' +
        '</div>' +
      '</div>';
    _replaceCoachInject(host, 'coach-integration-cali', card, 'prepend');
  }

  function renderCoachCardio() {
    const el = document.getElementById('coach-tab-cardio');
    if (!el) return;

    const s = buildCoachUnifiedState();
    const cardio = s.cardio;
    if (!cardio.length) {
      el.innerHTML =
        '<div class="coach-cardio-wrap">' +
          '<div class="coach-cardio-head">' +
            '<div class="coach-cardio-kicker">CARDIO COACH</div>' +
            '<div class="coach-cardio-title">No cardio data yet</div>' +
            '<div class="coach-cardio-sub">Start one cardio session to unlock pacing, zone, and recovery guidance.</div>' +
          '</div>' +
          '<button class="coach-action-btn primary" onclick="_coachStartCardioFromCoach()">Start Cardio Session</button>' +
        '</div>';
      return;
    }

    const topActMap = {};
    cardio.forEach(c => { topActMap[c.activity] = (topActMap[c.activity] || 0) + 1; });
    const topAct = Object.keys(topActMap).sort((a, b) => topActMap[b] - topActMap[a])[0] || '--';
    const avgDur = cardio.length ? Math.round(_avg(cardio.map(c => c.durationMins || 0))) : 0;
    const streak = (typeof window._calcCardioStreak === 'function') ? _toNum(window._calcCardioStreak(), 0) : 0;
    const weekTarget = 120;
    const weekPct = Math.min(100, Math.round((s.weekly.cardioMins / weekTarget) * 100));
    const latest = cardio.slice().sort((a, b) => _dayMs(b.date) - _dayMs(a.date))[0];
    const pulse = _coachBuild7DayCardioPulse(cardio);

    el.innerHTML =
      '<div class="coach-cardio-wrap">' +
        '<div class="coach-cardio-head">' +
          '<div class="coach-cardio-kicker">CARDIO COACH</div>' +
          '<div class="coach-cardio-title">' + s.weekly.cardioMins + ' min this week</div>' +
          '<div class="coach-cardio-sub">Readiness: ' + s.readiness.message + '</div>' +
        '</div>' +
        '<div class="coach-kpi-grid">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Current Streak</div><div class="coach-kpi-value">' + streak + 'd</div><div class="coach-kpi-sub">consecutive cardio days</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Weekly Target</div><div class="coach-kpi-value">' + weekPct + '%</div><div class="coach-kpi-sub">' + s.weekly.cardioMins + ' / ' + weekTarget + ' min</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Top Modality</div><div class="coach-kpi-value">' + topAct + '</div><div class="coach-kpi-sub">' + (topActMap[topAct] || 0) + ' sessions</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">Average Duration</div><div class="coach-kpi-value">' + avgDur + 'm</div><div class="coach-kpi-sub">latest: ' + (latest ? latest.date : '--') + '</div></div>' +
        '</div>' +
        '<div class="coach-pulse-wrap">' +
          '<div class="coach-pulse-head">7-Day Cardio Pulse</div>' +
          '<div class="coach-pulse-row">' + pulse + '</div>' +
        '</div>' +
        '<div class="coach-bubble">' +
          '<strong>Suggested next cardio:</strong><br>' +
          (s.readiness.score >= 70
            ? 'Do 25-35 min Zone 2 (steady pace) or one HIIT block (10-15 min).'
            : s.readiness.score >= 55
            ? 'Keep it moderate: 20-30 min low to mid intensity.'
            : 'Recovery cardio recommended: 15-20 min light walk or mobility flow.') +
        '</div>' +
        '<div class="coach-dual-actions">' +
          '<button class="coach-action-btn primary" onclick="_coachStartCardioFromCoach()">Start Cardio</button>' +
          '<button class="coach-action-btn" onclick="_coachOpenCardioAnalytics()">Open Cardio Stats</button>' +
        '</div>' +
      '</div>';
  }

  function _injectTodayBriefCard() {
    const host = document.querySelector('#coach-tab-today .ctoday-wrap');
    if (!host) return;
    const old = host.querySelector('.ctoday-brief-card');
    if (old) old.remove();

    const s = buildCoachUnifiedState();
    const sessionsToday = Number(s.today.weighted) + Number(s.today.bw) + Number(s.today.cardio);
    const brief =
      '<div class="ctoday-card ctoday-brief-card">' +
        '<div class="ctoday-card-title">Daily Brief</div>' +
        '<div class="ctoday-plan-note"><strong>Readiness:</strong> ' + s.readiness.score + '/100 - ' + s.readiness.message + '</div>' +
        '<div class="ctoday-plan-note"><strong>Today sessions:</strong> ' + sessionsToday + ' (W:' + Number(s.today.weighted) + ' BW:' + Number(s.today.bw) + ' C:' + Number(s.today.cardio) + ')</div>' +
        '<div class="ctoday-plan-note"><strong>Cardio week:</strong> ' + s.weekly.cardioMins + ' min</div>' +
        '<div class="ctoday-plan-note"><strong>Nutrition:</strong> ' + s.nutrition.note + '</div>' +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachStartWeightedFromCoach()">Weighted</button>' +
          '<button class="coach-action-btn" onclick="_coachStartBodyweightFromCoach()">Bodyweight</button>' +
        '</div>' +
        '<div style="margin-top:8px;"><button class="coach-action-btn" style="width:100%;" onclick="_coachStartCardioFromCoach()">Cardio</button></div>' +
      '</div>';
    const greeting = host.querySelector('.ctoday-greeting');
    if (greeting) greeting.insertAdjacentHTML('afterend', brief);
    else host.insertAdjacentHTML('afterbegin', brief);
  }

  window.buildCoachUnifiedState = buildCoachUnifiedState;
  window.calcTrainingScore = calcTrainingScoreUnified;
  window.renderCoachCardio = renderCoachCardio;
  window._coachStartCardioFromCoach = _coachStartCardioFromCoach;
  window._coachOpenCardioAnalytics = _coachOpenCardioAnalytics;
  window._coachStartWeightedFromCoach = _coachStartWeightedFromCoach;
  window._coachStartBodyweightFromCoach = _coachStartBodyweightFromCoach;

  const _origRenderCoachToday = window.renderCoachToday;
  const _origRenderCoachTrain = window.renderCoachTrain;
  const _origRenderCoachPlan = window.renderCoachPlan;
  const _origRenderCoachNutrition = window.renderCoachNutrition;
  const _origRenderCoachCali = window.renderCoachCali;
  const _origRenderCoach = window.renderCoach;

  if (typeof _origRenderCoachToday === 'function') {
    window.renderCoachToday = function () {
      _origRenderCoachToday();
      _injectTodayBriefCard();
    };
  }
  if (typeof _origRenderCoachTrain === 'function') {
    window.renderCoachTrain = function () {
      _origRenderCoachTrain();
      _enhanceTrainTab();
    };
  }
  if (typeof _origRenderCoachPlan === 'function') {
    window.renderCoachPlan = function () {
      _origRenderCoachPlan();
      _enhancePlanTab();
    };
  }
  if (typeof _origRenderCoachNutrition === 'function') {
    window.renderCoachNutrition = function () {
      _origRenderCoachNutrition();
      _enhanceNutritionTab();
    };
  }
  if (typeof _origRenderCoachCali === 'function') {
    window.renderCoachCali = function () {
      _origRenderCoachCali();
      _enhanceCaliTab();
    };
  }
  if (typeof _origRenderCoach === 'function') {
    window.renderCoach = function () {
      _origRenderCoach();
      _enhanceInsightsTab();
    };
  }

  window.coachSwitchTab = function (tab, btn) {
    ['today', 'train', 'insights', 'plan', 'nutrition', 'cali', 'cardio'].forEach(t => {
      const el = document.getElementById('coach-tab-' + t);
      if (el) el.style.display = (t === tab ? '' : 'none');
    });
    document.querySelectorAll('.coach-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (tab === 'today' && typeof window.renderCoachToday === 'function') window.renderCoachToday();
    if (tab === 'train' && typeof window.renderCoachTrain === 'function') window.renderCoachTrain();
    if (tab === 'insights') {
      if (typeof window.renderCoach === 'function') window.renderCoach();
      if (typeof window.updateTips === 'function') window.updateTips();
    }
    if (tab === 'cardio' && typeof window.renderCoachCardio === 'function') window.renderCoachCardio();
    if (tab === 'plan' && typeof window.renderCoachPlan === 'function') window.renderCoachPlan();
    if (tab === 'nutrition' && typeof window.renderCoachNutrition === 'function') window.renderCoachNutrition();
    if (tab === 'cali' && typeof window.renderCoachCali === 'function') window.renderCoachCali();
  };

  document.addEventListener('DOMContentLoaded', function () {
    try {
      if (typeof window.renderCoachToday === 'function') window.renderCoachToday();
    } catch (_) {}
  });
})();
