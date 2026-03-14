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
  function _isAr() {
    return (typeof currentLang !== 'undefined') && currentLang === 'ar';
  }
  function _cx(en, ar) {
    return _isAr() ? ar : en;
  }

  function _normalizedCardio() {
    const raw = _arr(_cardioLogRef());
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
    return _arr(_workoutsRef()).map(w => ({
      date: _asDateKey(w?.date),
      totalVolume: _toNum(w?.totalVolume, 0),
      muscle: String(w?.muscle || ''),
      isPR: !!w?.isPR
    })).filter(e => !!e.date);
  }

  function _normalizedBw() {
    return _arr(_bwWorkoutsRef()).map(w => ({
      date: _asDateKey(w?.date),
      exercise: String(w?.exercise || ''),
      muscle: String(w?.muscle || ''),
      totalReps: _toNum(w?.totalReps, 0),
      sets: _arr(w?.sets)
    })).filter(e => !!e.date);
  }

  function _canonMuscleName(raw) {
    const m = String(raw || '').trim().toLowerCase();
    if (!m) return '';
    if (m.includes('chest') || m.includes('pec')) return 'Chest';
    if (m.includes('back') || m.includes('lat')) return 'Back';
    if (m.includes('shoulder') || m.includes('delt')) return 'Shoulders';
    if (m.includes('leg') || m.includes('quad') || m.includes('hamstring')) return 'Legs';
    if (m.includes('core') || m.includes('abs') || m.includes('abdom')) return 'Core';
    if (m.includes('bicep')) return 'Biceps';
    if (m.includes('tricep')) return 'Triceps';
    if (m.includes('forearm') || m.includes('grip')) return 'Forearms';
    if (m.includes('glute') || m.includes('hip')) return 'Glutes';
    if (m.includes('calf')) return 'Calves';
    return '';
  }

  function _mealsLogRef() {
    if (typeof mealsLog !== 'undefined' && mealsLog && typeof mealsLog === 'object') return mealsLog;
    return (window.mealsLog && typeof window.mealsLog === 'object') ? window.mealsLog : {};
  }
  function _workoutsRef() {
    if (typeof workouts !== 'undefined' && Array.isArray(workouts)) return workouts;
    return Array.isArray(window.workouts) ? window.workouts : [];
  }
  function _bwWorkoutsRef() {
    if (typeof bwWorkouts !== 'undefined' && Array.isArray(bwWorkouts)) return bwWorkouts;
    return Array.isArray(window.bwWorkouts) ? window.bwWorkouts : [];
  }
  function _cardioLogRef() {
    if (typeof cardioLog !== 'undefined' && Array.isArray(cardioLog)) return cardioLog;
    return Array.isArray(window.cardioLog) ? window.cardioLog : [];
  }

  function _nutritionTargets() {
    const wtRaw = _toNum(window.userProfile?.weight, 75);
    const wtKg = (window.userProfile?.bwUnit === 'lbs' || window.userProfile?.weightUnit === 'lbs') ? wtRaw * 0.453592 : wtRaw;
    const goal = window.userProfile?.goal || 'muscle';
    const pfMap = { muscle: 2.0, strength: 1.8, fat_loss: 2.2, endurance: 1.6, recomp: 2.2 };
    const proteinTarget = Math.max(90, Math.round(wtKg * (pfMap[goal] || 2.0)));
    const kcalTarget = Math.max(1500, Math.round((wtKg * 30) + (goal === 'fat_loss' ? -350 : goal === 'muscle' ? 250 : 0)));
    return { proteinTarget, kcalTarget };
  }

  function _nutritionTodayStats() {
    const mealsLog = _mealsLogRef();
    const todayKey = (typeof window._mealTodayKey === 'function') ? window._mealTodayKey() : _iso(new Date());
    const meals = _arr(mealsLog[todayKey]);
    const p = _sum(meals, m => _toNum(m?.p, 0));
    const kcal = _sum(meals, m => _toNum(m?.kcal, 0));
    const targets = _nutritionTargets();
    const proteinPct = Math.min(140, Math.round((p / Math.max(1, targets.proteinTarget)) * 100));
    const kcalPct = Math.min(140, Math.round((kcal / Math.max(1, targets.kcalTarget)) * 100));
    const proteinComponent = Math.max(0, 100 - Math.abs(100 - proteinPct));
    const kcalComponent = Math.max(0, 100 - Math.abs(100 - kcalPct));
    const score = Math.round((proteinComponent * 0.65) + (kcalComponent * 0.35));
    return {
      hasTodayMeals: meals.length > 0,
      mealCount: meals.length,
      p,
      kcal,
      proteinPct,
      kcalPct,
      score,
      proteinTarget: targets.proteinTarget,
      kcalTarget: targets.kcalTarget
    };
  }

  function _nutritionAdherence() {
    const mealsLog = _mealsLogRef();
    const todayKey = (typeof window._mealTodayKey === 'function') ? window._mealTodayKey() : _iso(new Date());
    const todayMeals = _arr(mealsLog[todayKey]);
    let usedKey = todayKey;
    let meals = todayMeals;
    if (!meals.length) {
      const keys = Object.keys(mealsLog || {})
        .filter(k => _arr(mealsLog[k]).length > 0)
        .sort();
      if (keys.length) {
        usedKey = keys[keys.length - 1];
        meals = _arr(mealsLog[usedKey]);
      } else {
        return { score: 45, proteinPct: 0, kcalPct: 0, note: _cx('No meals logged yet', '\u0644\u0627 \u062a\u0648\u062c\u062f \u0648\u062c\u0628\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u0628\u0639\u062f') };
      }
    }

    const p = _sum(meals, m => _toNum(m?.p, 0));
    const kcal = _sum(meals, m => _toNum(m?.kcal, 0));

    const targets = _nutritionTargets();
    const proteinTarget = targets.proteinTarget;
    const kcalTarget = targets.kcalTarget;

    const proteinPct = Math.min(140, Math.round((p / Math.max(1, proteinTarget)) * 100));
    const kcalPct = Math.min(140, Math.round((kcal / Math.max(1, kcalTarget)) * 100));
    const proteinComponent = Math.max(0, 100 - Math.abs(100 - proteinPct));
    const kcalComponent = Math.max(0, 100 - Math.abs(100 - kcalPct));
    const score = Math.round((proteinComponent * 0.65) + (kcalComponent * 0.35));

    const suffix = (usedKey !== todayKey) ? _cx(` (last logged ${usedKey})`, ` (\u0622\u062e\u0631 \u062a\u0633\u062c\u064a\u0644 ${usedKey})`) : '';
    return { score, proteinPct, kcalPct, note: `${p.toFixed(0)}g ${_cx('protein', '\u0628\u0631\u0648\u062a\u064a\u0646')} / ${kcal.toFixed(0)} ${_cx('kcal', '\u0633\u0639\u0631\u0629')}${suffix}` };
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
      message: score >= 75
        ? _cx('Ready for a productive session', '\u062c\u0627\u0647\u0632 \u0644\u062c\u0644\u0633\u0629 \u0642\u0648\u064a\u0629')
        : score >= 55
          ? _cx('Moderate readiness, warm up well', '\u062c\u0627\u0647\u0632\u064a\u0629 \u0645\u062a\u0648\u0633\u0637\u0629\u060c \u0631\u0643\u0651\u0632 \u0639\u0644\u0649 \u0627\u0644\u0625\u062d\u0645\u0627\u0621')
          : _cx('Recovery-focused day recommended', '\u064a\u064f\u0641\u0636\u0651\u0644 \u064a\u0648\u0645 \u062a\u0639\u0627\u0641\u064d')
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
    const balanceMuscles = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves'];
    const trained = new Set();
    weighted.forEach(w => {
      const c = _canonMuscleName(w.muscle);
      if (c) trained.add(c);
    });
    const balanceScore = Math.min(100, Math.round((trained.size / balanceMuscles.length) * 100));

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
      const lbl = new Date(d.key + 'T00:00:00').toLocaleDateString(_isAr() ? 'ar-SA' : 'en-US', { weekday: 'short' }).slice(0, 1);
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
  function _coachFocusNutritionLog() {
    const _toNutrition = () => {
      if (typeof window.switchView === 'function') {
        window.switchView('nutrition', document.getElementById('bnav-nutrition'));
        return;
      }
      if (typeof window.switchMainTab === 'function') {
        window.switchMainTab('nutrition');
      }
    };
    const _focusMealInput = () => {
      const nameInput = document.getElementById('meal-name-input');
      if (!nameInput) return false;
      try { nameInput.focus(); } catch (_e) {}
      try { nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_e) {}
      return true;
    };

    _toNutrition();
    if (typeof window.renderCoachNutrition === 'function') window.renderCoachNutrition();

    // Mobile can be slower to mount nutrition DOM; retry focus a few times.
    [120, 260, 520].forEach(ms => {
      setTimeout(() => {
        if (_focusMealInput()) return;
        if (typeof window.renderCoachNutrition === 'function') window.renderCoachNutrition();
        _focusMealInput();
      }, ms);
    });
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
        '<strong>' + _cx('Performance Snapshot', '\u0644\u0642\u0637\u0629 \u0627\u0644\u0623\u062f\u0627\u0621') + '</strong><br>' +
        _cx('Readiness', '\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629') + ' ' + s.readiness.score + '/100 | ' +
        _cx('Nutrition', '\u0627\u0644\u062a\u063a\u0630\u064a\u0629') + ' ' + s.nutrition.score + '/100 | ' +
        _cx('Active days (7d):', '\u0627\u0644\u0623\u064a\u0627\u0645 \u0627\u0644\u0646\u0634\u0637\u0629 (7 \u0623\u064a\u0627\u0645):') + ' ' + s.consistency.activeDays7 +
        '<div class="coach-mini-tags">' +
          '<span class="coach-mini-tag ' + (s.readiness.score >= 70 ? 'good' : s.readiness.score >= 55 ? 'warn' : 'alert') + '">' + _cx('Readiness', '\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629') + '</span>' +
          '<span class="coach-mini-tag ' + (s.nutrition.score >= 70 ? 'good' : s.nutrition.score >= 55 ? 'warn' : 'alert') + '">' + _cx('Nutrition', '\u0627\u0644\u062a\u063a\u0630\u064a\u0629') + '</span>' +
          '<span class="coach-mini-tag ' + ((cDiff >= 0 && wDiff >= 0) ? 'good' : 'warn') + '">' + _cx('Momentum', '\u0627\u0644\u0632\u062e\u0645') + '</span>' +
        '</div>' +
        '<div class="coach-kpi-grid" style="margin-top:10px;">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Cardio Trend (14d)', '\u0627\u062a\u062c\u0627\u0647 \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648 (14 \u064a\u0648\u0645)') + '</div><div class="coach-kpi-value">' + (cDiff >= 0 ? '+' : '') + cDiff + '</div><div class="coach-kpi-sub">' + _cx('minutes vs prior 14d', '\u062f\u0642\u0627\u0626\u0642 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0640 14 \u064a\u0648\u0645 \u0633\u0627\u0628\u0642\u0629') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Lift Volume Trend (14d)', '\u0627\u062a\u062c\u0627\u0647 \u062d\u062c\u0645 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 (14 \u064a\u0648\u0645)') + '</div><div class="coach-kpi-value">' + (wDiff >= 0 ? '+' : '') + Math.round(wDiff) + '</div><div class="coach-kpi-sub">' + _cx('volume vs prior 14d', '\u062d\u062c\u0645 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0640 14 \u064a\u0648\u0645 \u0633\u0627\u0628\u0642\u0629') + '</div></div>' +
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
        '<strong>' + _cx('Mode Launcher', '\u0645\u0634\u063a\u0644 \u0627\u0644\u0623\u0646\u0645\u0627\u0637') + '</strong><br>' +
        _cx('Pick your session type directly from Coach. Weekly mix:', '\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u062c\u0644\u0633\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u0645\u062f\u0631\u0628. \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u0633\u0628\u0648\u0639:') + ' ' +
        'W ' + s.weekly.weightedSessions + ' | BW ' + s.weekly.bwSessions + ' | ' + _cx('Cardio', '\u0643\u0627\u0631\u062f\u064a\u0648') + ' ' + s.weekly.cardioSessions +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachStartWeightedFromCoach()">' + _cx('Start Weighted', '\u0627\u0628\u062f\u0623 \u0623\u0648\u0632\u0627\u0646') + '</button>' +
          '<button class="coach-action-btn" onclick="_coachStartBodyweightFromCoach()">' + _cx('Start Bodyweight', '\u0627\u0628\u062f\u0623 \u0648\u0632\u0646 \u0627\u0644\u062c\u0633\u0645') + '</button>' +
        '</div>' +
        '<div class="coach-dual-actions" style="margin-top:8px;">' +
          '<button class="coach-action-btn" onclick="_coachStartCardioFromCoach()">' + _cx('Start Cardio', '\u0627\u0628\u062f\u0623 \u0643\u0627\u0631\u062f\u064a\u0648') + '</button>' +
          '<button class="coach-action-btn" onclick="_coachOpenCardioAnalytics()">' + _cx('Cardio Analytics', '\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648') + '</button>' +
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
        '<strong>' + _cx('Integrated Weekly Targets', '\u0623\u0647\u062f\u0627\u0641 \u0623\u0633\u0628\u0648\u0639\u064a\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629') + '</strong><br>' +
        '<div class="coach-kpi-grid" style="margin-top:10px;">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Weighted', '\u0623\u0648\u0632\u0627\u0646') + '</div><div class="coach-kpi-value">' + s.weekly.weightedSessions + '/' + wTarget + '</div><div class="coach-kpi-sub">' + wp + '% ' + _cx('complete', '\u0645\u0643\u062a\u0645\u0644') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Bodyweight', '\u0648\u0632\u0646 \u0627\u0644\u062c\u0633\u0645') + '</div><div class="coach-kpi-value">' + s.weekly.bwSessions + '/' + bwTarget + '</div><div class="coach-kpi-sub">' + bp + '% ' + _cx('complete', '\u0645\u0643\u062a\u0645\u0644') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Cardio', '\u0643\u0627\u0631\u062f\u064a\u0648') + '</div><div class="coach-kpi-value">' + s.weekly.cardioSessions + '/' + cTarget + '</div><div class="coach-kpi-sub">' + cp + '% ' + _cx('complete', '\u0645\u0643\u062a\u0645\u0644') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Cardio Minutes', '\u062f\u0642\u0627\u0626\u0642 \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648') + '</div><div class="coach-kpi-value">' + s.weekly.cardioMins + '</div><div class="coach-kpi-sub">' + _cx('target 120 min', '\u0627\u0644\u0647\u062f\u0641 120 \u062f\u0642\u064a\u0642\u0629') + '</div></div>' +
        '</div>' +
      '</div>';
    _replaceCoachInject(host, 'coach-integration-plan', card, 'prepend');
  }
  function _enhanceNutritionTab() {
    const host = document.getElementById('coach-tab-nutrition');
    if (!host) return;
    const s = buildCoachUnifiedState();
    const tn = _nutritionTodayStats();
    const p = tn.proteinPct || 0;
    const k = tn.kcalPct || 0;
    const proteinRemain = Math.max(0, Math.round((tn.proteinTarget || 0) - (tn.p || 0)));
    const kcalRemain = Math.max(0, Math.round((tn.kcalTarget || 0) - (tn.kcal || 0)));
    const guidance = tn.hasTodayMeals
      ? ((p < 85
          ? _cx('Increase protein feeding across next meals.', '\u0632\u0650\u062f \u0627\u0644\u0628\u0631\u0648\u062a\u064a\u0646 \u0641\u064a \u0627\u0644\u0648\u062c\u0628\u0627\u062a \u0627\u0644\u0642\u0627\u062f\u0645\u0629.')
          : _cx('Protein pacing is on track.', '\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0628\u0631\u0648\u062a\u064a\u0646 \u062c\u064a\u062f.')) + ' ' +
        (k < 80
          ? _cx('You are under target calories today.', '\u0633\u0639\u0631\u0627\u062a\u0643 \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u064a\u0648\u0645.')
          : k > 120
            ? _cx('You are above target calories today.', '\u0633\u0639\u0631\u0627\u062a\u0643 \u0623\u0639\u0644\u0649 \u0645\u0646 \u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u064a\u0648\u0645.')
            : _cx('Calories are in range.', '\u0633\u0639\u0631\u0627\u062a\u0643 \u0636\u0645\u0646 \u0627\u0644\u0646\u0637\u0627\u0642.')))
      : _cx('No meals logged today yet. Log your first meal to activate today actions.', '\u0644\u0627 \u062a\u0648\u062c\u062f \u0648\u062c\u0628\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u0627\u0644\u064a\u0648\u0645. \u0633\u062c\u0651\u0644 \u0623\u0648\u0644 \u0648\u062c\u0628\u0629 \u0644\u062a\u0641\u0639\u064a\u0644 \u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u064a\u0648\u0645.');
    const card =
      '<div class="coach-bubble coach-integration-nutrition">' +
        '<strong>' + _cx('Today Nutrition Actions', '\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u062a\u063a\u0630\u064a\u0629 \u0627\u0644\u064a\u0648\u0645') + '</strong>' +
        '<div class="coach-kpi-grid" style="margin-top:10px;">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Meals', '\u0648\u062c\u0628\u0627\u062a') + '</div><div class="coach-kpi-value">' + (tn.mealCount || 0) + '</div><div class="coach-kpi-sub">' + _cx('logged today', '\u0645\u0633\u062c\u0644\u0629 \u0627\u0644\u064a\u0648\u0645') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('protein', '\u0628\u0631\u0648\u062a\u064a\u0646') + '</div><div class="coach-kpi-value">' + Math.round(tn.p || 0) + 'g</div><div class="coach-kpi-sub">' + p + '% ' + _cx('of target', '\u0645\u0646 \u0627\u0644\u0647\u062f\u0641') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Calories', '\u0633\u0639\u0631\u0627\u062a') + '</div><div class="coach-kpi-value">' + Math.round(tn.kcal || 0) + '</div><div class="coach-kpi-sub">' + k + '% ' + _cx('of target', '\u0645\u0646 \u0627\u0644\u0647\u062f\u0641') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Readiness', '\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629') + '</div><div class="coach-kpi-value">' + s.readiness.score + '/100</div><div class="coach-kpi-sub">' + _cx('training context', '\u0633\u064a\u0627\u0642 \u0627\u0644\u062a\u062f\u0631\u064a\u0628') + '</div></div>' +
        '</div>' +
        '<div style="margin-top:10px;">' +
          '<div class="coach-kpi-sub" style="margin-bottom:5px;">' + _cx('Protein progress', '\u062a\u0642\u062f\u0651\u0645 \u0627\u0644\u0628\u0631\u0648\u062a\u064a\u0646') + ' (' + Math.round(tn.p || 0) + '/' + Math.round(tn.proteinTarget || 0) + 'g)</div>' +
          '<div style="height:7px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;"><div style="height:7px;background:linear-gradient(90deg,#4ade80,var(--accent));width:' + Math.min(100, p) + '%;"></div></div>' +
          '<div class="coach-kpi-sub" style="margin-top:8px;margin-bottom:5px;">' + _cx('Calorie progress', '\u062a\u0642\u062f\u0651\u0645 \u0627\u0644\u0633\u0639\u0631\u0627\u062a') + ' (' + Math.round(tn.kcal || 0) + '/' + Math.round(tn.kcalTarget || 0) + ')</div>' +
          '<div style="height:7px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;"><div style="height:7px;background:linear-gradient(90deg,#5b8dee,var(--accent));width:' + Math.min(100, k) + '%;"></div></div>' +
        '</div>' +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachFocusNutritionLog()">' + _cx('Log Meal', '\u0633\u062c\u0651\u0644 \u0648\u062c\u0628\u0629') + '</button>' +
          '<button class="coach-action-btn" onclick="switchView&&switchView(\'dashboard\',document.getElementById(\'bnav-dashboard\'));switchDashTab&&switchDashTab(\'nutrition\',document.querySelector(\'.dash-tab[data-tab=\\\'nutrition\\\']\'));">' + _cx('Open Nutrition Stats', '\u0627\u0641\u062a\u062d \u0625\u062d\u0635\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u063a\u0630\u064a\u0629') + '</button>' +
        '</div>' +
        '<div style="margin-top:8px;" class="coach-kpi-sub">' +
          _cx('Remaining today:', '\u0627\u0644\u0645\u062a\u0628\u0642\u064a \u0627\u0644\u064a\u0648\u0645:') + ' ' + proteinRemain + 'g ' + _cx('protein', '\u0628\u0631\u0648\u062a\u064a\u0646') + ' | ' + kcalRemain + ' ' + _cx('kcal', '\u0633\u0639\u0631\u0629') +
        '</div>' +
        '<div style="margin-top:6px;">' +
          guidance +
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
        '<strong>' + _cx('Calisthenics Weekly Focus', '\u062a\u0631\u0643\u064a\u0632 \u0627\u0644\u0643\u0627\u0644\u064a\u0633\u062b\u064a\u0646\u0643\u0633 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064a') + '</strong><br>' +
        _cx('BW sessions this week:', '\u062c\u0644\u0633\u0627\u062a \u0648\u0632\u0646 \u0627\u0644\u062c\u0633\u0645 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639:') + ' ' + s.weekly.bwSessions + '/' + goal + ' (' + pct + '%)' +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachStartBodyweightFromCoach()">' + _cx('Start BW Session', '\u0627\u0628\u062f\u0623 \u062c\u0644\u0633\u0629 \u0648\u0632\u0646 \u0627\u0644\u062c\u0633\u0645') + '</button>' +
          '<button class="coach-action-btn" onclick="_coachStartCardioFromCoach()">' + _cx('Add Cardio Finish', '\u0623\u0636\u0641 \u062e\u0627\u062a\u0645\u0629 \u0643\u0627\u0631\u062f\u064a\u0648') + '</button>' +
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
            '<div class="coach-cardio-kicker">' + _cx('CARDIO COACH', '\u0645\u062f\u0631\u0628 \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648') + '</div>' +
            '<div class="coach-cardio-title">' + _cx('No cardio data yet', '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0643\u0627\u0631\u062f\u064a\u0648 \u0628\u0639\u062f') + '</div>' +
            '<div class="coach-cardio-sub">' + _cx('Start one cardio session to unlock pacing, zone, and recovery guidance.', '\u0627\u0628\u062f\u0623 \u062c\u0644\u0633\u0629 \u0643\u0627\u0631\u062f\u064a\u0648 \u0648\u0627\u062d\u062f\u0629 \u0644\u0641\u062a\u062d \u062a\u0648\u062c\u064a\u0647 \u0627\u0644\u0625\u064a\u0642\u0627\u0639 \u0648\u0627\u0644\u0646\u0628\u0636 \u0648\u0627\u0644\u062a\u0639\u0627\u0641\u064a.') + '</div>' +
          '</div>' +
          '<button class="coach-action-btn primary" onclick="_coachStartCardioFromCoach()">' + _cx('Start Cardio Session', '\u0627\u0628\u062f\u0623 \u062c\u0644\u0633\u0629 \u0643\u0627\u0631\u062f\u064a\u0648') + '</button>' +
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
          '<div class="coach-cardio-kicker">' + _cx('CARDIO COACH', '\u0645\u062f\u0631\u0628 \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648') + '</div>' +
          '<div class="coach-cardio-title">' + s.weekly.cardioMins + ' ' + _cx('min this week', '\u062f\u0642\u064a\u0642\u0629 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639') + '</div>' +
          '<div class="coach-cardio-sub">' + _cx('Readiness:', '\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629:') + ' ' + s.readiness.message + '</div>' +
        '</div>' +
        '<div class="coach-kpi-grid">' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Current Streak', '\u0627\u0644\u062a\u062a\u0627\u0644\u064a \u0627\u0644\u062d\u0627\u0644\u064a') + '</div><div class="coach-kpi-value">' + streak + 'd</div><div class="coach-kpi-sub">' + _cx('consecutive cardio days', '\u0623\u064a\u0627\u0645 \u0643\u0627\u0631\u062f\u064a\u0648 \u0645\u062a\u062a\u0627\u0644\u064a\u0629') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Weekly Target', '\u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064a') + '</div><div class="coach-kpi-value">' + weekPct + '%</div><div class="coach-kpi-sub">' + s.weekly.cardioMins + ' / ' + weekTarget + ' ' + _cx('min', '\u062f\u0642\u064a\u0642\u0629') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Top Modality', '\u0623\u0643\u062b\u0631 \u0646\u0648\u0639 \u062a\u062f\u0631\u064a\u0628') + '</div><div class="coach-kpi-value">' + topAct + '</div><div class="coach-kpi-sub">' + (topActMap[topAct] || 0) + ' ' + _cx('sessions', '\u062c\u0644\u0633\u0627\u062a') + '</div></div>' +
          '<div class="coach-kpi-card"><div class="coach-kpi-label">' + _cx('Average Duration', '\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0645\u062f\u0629') + '</div><div class="coach-kpi-value">' + avgDur + 'm</div><div class="coach-kpi-sub">' + _cx('latest:', '\u0622\u062e\u0631 \u062a\u0633\u062c\u064a\u0644:') + ' ' + (latest ? latest.date : '--') + '</div></div>' +
        '</div>' +
        '<div class="coach-pulse-wrap">' +
          '<div class="coach-pulse-head">' + _cx('7-Day Cardio Pulse', '\u0646\u0628\u0636 \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648 \u0644\u0640 7 \u0623\u064a\u0627\u0645') + '</div>' +
          '<div class="coach-pulse-row">' + pulse + '</div>' +
        '</div>' +
        '<div class="coach-bubble">' +
          '<strong>' + _cx('Suggested next cardio:', '\u0627\u0642\u062a\u0631\u0627\u062d \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648 \u0627\u0644\u062a\u0627\u0644\u064a:') + '</strong><br>' +
          (s.readiness.score >= 70
            ? _cx('Do 25-35 min Zone 2 (steady pace) or one HIIT block (10-15 min).', '\u0646\u0641\u0651\u0630 25-35 \u062f\u0642\u064a\u0642\u0629 \u0645\u0646 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 2 (\u0648\u062a\u064a\u0631\u0629 \u062b\u0627\u0628\u062a\u0629) \u0623\u0648 \u0628\u0644\u0648\u0643 HIIT \u0648\u0627\u062d\u062f (10-15 \u062f\u0642\u064a\u0642\u0629).')
            : s.readiness.score >= 55
            ? _cx('Keep it moderate: 20-30 min low to mid intensity.', '\u062d\u0627\u0641\u0638 \u0639\u0644\u0649 \u0634\u062f\u0629 \u0645\u062a\u0648\u0633\u0637\u0629: 20-30 \u062f\u0642\u064a\u0642\u0629 \u0634\u062f\u0629 \u0645\u0646\u062e\u0641\u0636\u0629 \u0625\u0644\u0649 \u0645\u062a\u0648\u0633\u0637\u0629.')
            : _cx('Recovery cardio recommended: 15-20 min light walk or mobility flow.', '\u064a\u064f\u0646\u0635\u062d \u0628\u0643\u0627\u0631\u062f\u064a\u0648 \u062a\u0639\u0627\u0641\u064a: 15-20 \u062f\u0642\u064a\u0642\u0629 \u0645\u0634\u064a \u062e\u0641\u064a\u0641 \u0623\u0648 \u062d\u0631\u0643\u0629 \u0645\u0631\u0648\u0646\u0629.')) +
        '</div>' +
        '<div class="coach-dual-actions">' +
          '<button class="coach-action-btn primary" onclick="_coachStartCardioFromCoach()">' + _cx('Start Cardio', '\u0627\u0628\u062f\u0623 \u0643\u0627\u0631\u062f\u064a\u0648') + '</button>' +
          '<button class="coach-action-btn" onclick="_coachOpenCardioAnalytics()">' + _cx('Open Cardio Stats', '\u0627\u0641\u062a\u062d \u0625\u062d\u0635\u0627\u0621\u0627\u062a \u0627\u0644\u0643\u0627\u0631\u062f\u064a\u0648') + '</button>' +
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
        '<div class="ctoday-card-title">' + _cx('Daily Brief', '\u0627\u0644\u0645\u0644\u062e\u0635 \u0627\u0644\u064a\u0648\u0645\u064a') + '</div>' +
        '<div class="ctoday-plan-note"><strong>' + _cx('Readiness:', '\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629:') + '</strong> ' + s.readiness.score + '/100 - ' + s.readiness.message + '</div>' +
        '<div class="ctoday-plan-note"><strong>' + _cx('Today sessions:', '\u062c\u0644\u0633\u0627\u062a \u0627\u0644\u064a\u0648\u0645:') + '</strong> ' + sessionsToday + ' (W:' + Number(s.today.weighted) + ' BW:' + Number(s.today.bw) + ' C:' + Number(s.today.cardio) + ')</div>' +
        '<div class="ctoday-plan-note"><strong>' + _cx('Cardio week:', '\u0643\u0627\u0631\u062f\u064a\u0648 \u0627\u0644\u0623\u0633\u0628\u0648\u0639:') + '</strong> ' + s.weekly.cardioMins + ' ' + _cx('min', '\u062f\u0642\u064a\u0642\u0629') + '</div>' +
        '<div class="ctoday-plan-note"><strong>' + _cx('Nutrition:', '\u0627\u0644\u062a\u063a\u0630\u064a\u0629:') + '</strong> ' + s.nutrition.note + '</div>' +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="_coachStartWeightedFromCoach()">' + _cx('Weighted', '\u0623\u0648\u0632\u0627\u0646') + '</button>' +
          '<button class="coach-action-btn" onclick="_coachStartBodyweightFromCoach()">' + _cx('Bodyweight', '\u0648\u0632\u0646 \u0627\u0644\u062c\u0633\u0645') + '</button>' +
        '</div>' +
        '<div style="margin-top:8px;"><button class="coach-action-btn" style="width:100%;" onclick="_coachStartCardioFromCoach()">' + _cx('Cardio', '\u0643\u0627\u0631\u062f\u064a\u0648') + '</button></div>' +
      '</div>';
    const greeting = host.querySelector('.ctoday-greeting');
    if (greeting) greeting.insertAdjacentHTML('afterend', brief);
    else host.insertAdjacentHTML('afterbegin', brief);
    if (window.FORGE_DUELS && typeof window.FORGE_DUELS.renderInto === 'function') {
      try { window.FORGE_DUELS.renderInto(host); } catch (_e) {}
    }
  }
  window.buildCoachUnifiedState = buildCoachUnifiedState;
  window.calcTrainingScore = calcTrainingScoreUnified;
  window.renderCoachCardio = renderCoachCardio;
  window._coachStartCardioFromCoach = _coachStartCardioFromCoach;
  window._coachOpenCardioAnalytics = _coachOpenCardioAnalytics;
  window._coachStartWeightedFromCoach = _coachStartWeightedFromCoach;
  window._coachStartBodyweightFromCoach = _coachStartBodyweightFromCoach;
  window._coachFocusNutritionLog = _coachFocusNutritionLog;

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







