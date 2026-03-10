// FORGE Gym Tracker - workout save pipeline and bodyweight save flow
// Extracted from index.html to reduce main-script coupling.

// ═══════════════════════════════════════════
//  BODYWEIGHT WORKOUTS DATA
// ═══════════════════════════════════════════
let bwWorkouts = _lsGet(STORAGE_KEYS.BW_WORKOUTS, []);

function saveBwData() {
  localStorage.setItem(STORAGE_KEYS.BW_WORKOUTS, JSON.stringify(bwWorkouts));
}

// ── Volume Quality Scoring (Feature 3) ─────────────────────
let _selectedEffort = 'medium';

function selectEffort(btn) {
  document.querySelectorAll('#effort-selector .effort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _selectedEffort = btn.dataset.effort;
}

function calcQualityScore(workout) {
  if (!workout || !workout.totalVolume) return null;
  const multiplier = { easy: 0.6, medium: 1.0, hard: 1.4, failure: 1.6 }[workout.effort || 'medium'] || 1.0;
  // Personal max volume for that muscle over last 30 sessions
  const recentVols = getWorkouts()
    .filter(w => w.muscle === workout.muscle && w.totalVolume)
    .slice(-30)
    .map(w => w.totalVolume);
  const maxVol = recentVols.length ? Math.max(...recentVols) : workout.totalVolume;
  const raw = (workout.totalVolume / maxVol) * multiplier * 100;
  return Math.min(100, Math.round(raw));
}

function _resetEffortSelector() {
  _selectedEffort = 'medium';
  document.querySelectorAll('#effort-selector .effort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.effort === 'medium');
  });
}

// Override saveWorkout to handle bodyweight mode
function saveWorkout() {
  if (workoutMode === 'bodyweight') {
    saveBwWorkout();
    return;
  }
  _saveWeightedWorkout();
}

function _saveWeightedWorkout() {
  const name = document.getElementById('exercise-name').value.trim();
  if (!selectedMuscle) { showToast('Select a muscle group first!'); return; }
  if (!name) { showToast('Enter an exercise name!'); return; }
  const rows = document.querySelectorAll('.set-row');
  if (!rows.length) { showToast('Add at least one set!'); return; }
  const sets = []; let valid = true;
  rows.forEach(r => {
    const repsEl = r.querySelector('.set-reps');
    const weightEl = r.querySelector('.set-weight');
    const reps = parseFloat(repsEl.value !== '' ? repsEl.value : repsEl.placeholder);
    const weight = parseFloat(weightEl.value !== '' ? weightEl.value : weightEl.placeholder);
    const unit = r.querySelector('.set-unit-toggle')?.dataset?.unit || r.querySelector('.set-unit')?.value || settings.defaultUnit || 'kg';
    const type = r.querySelector('.set-num')?.getAttribute('data-type') || 'normal';
    const rpe = r.querySelector('.set-rpe-btn')?.dataset.rpe || null;
    if (!reps || !weight) { valid = false; return; }
    const _setObj = { reps, weight, unit, type };
    if (rpe) _setObj.rpe = rpe;
    sets.push(_setObj);
  });
  if (!valid) { showToast('Fill in all set values!'); return; }

  // ── Stagnation Break gate ──
  if (!_stagnationConfirmed && typeof _checkStagnation === 'function' && _checkStagnation(sets)) {
    const so = document.getElementById('stagnation-overlay');
    if (so) { so.style.display = 'flex'; return; }
  }
  _stagnationConfirmed = false;

  // Show daily wellness check-in on first save of the day
  if (typeof maybeShowCheckin === 'function') maybeShowCheckin();

  const btn = document.getElementById('save-btn');
  btn.classList.add('loading'); btn.textContent = 'Saving…';

  setTimeout(() => {
    const workSets = sets.filter(s => s.type !== 'warmup');
    const prevMax = workouts.filter(w => w.exercise === name).flatMap(w => w.sets.filter(s => s.type !== 'warmup').map(s => s.weight));
    const newMax = workSets.length ? Math.max(...workSets.map(s => s.weight)) : 0;
    const isPR = workSets.length > 0 && (prevMax.length === 0 || newMax > Math.max(...prevMax));

    const _wkEntry = {
      id: Date.now(), date: new Date().toISOString(),
      muscle: selectedMuscle, exercise: name, sets, notes: '',
      angle: (typeof selectedAngle !== 'undefined' ? selectedAngle : null),
      totalVolume: sets.filter(s => s.type !== 'warmup').reduce((a, s) => a + s.reps * s.weight, 0), isPR,
      effort: _selectedEffort
    };
    workouts.push(_wkEntry);
    // Capture into active session
    if (_sessionActive) {
      if (selectedMuscle) _sessionWkMuscles.add(selectedMuscle);
      const workSetsOnly = sets.filter(s => s.type !== 'warmup');
      _sessionWkLogs.push({
        muscle: selectedMuscle,
        exercise: name,
        sets: workSetsOnly.map(s => ({ reps: s.reps, weight: s.weight, unit: s.unit || 'kg' })),
        volume: _wkEntry.totalVolume,
        isPR: isPR
      });
    }
    save();

    document.getElementById('exercise-name').value = '';
    if (typeof _resetEffortSelector === 'function') _resetEffortSelector();
    document.getElementById('sets-container').innerHTML = '';
    document.getElementById('last-session-hint').style.display = 'none';
    closeAutocomplete();
    setCount = 0;
    _ghostSets = [];
    _updateSetBadge(0);
    updateRepeatBtn();
    const _prBanner = document.getElementById('pr-path-banner');
    if (_prBanner) _prBanner.classList.remove('show');
    // Keep selectedMuscle — user stays on the same muscle group to log more exercises
    // Re-apply zone highlights and refresh history so the panel stays live
    if (selectedMuscle) {
      document.querySelectorAll('.body-zone').forEach(z => {
        z.classList.toggle('zone-selected', z.dataset.muscle === selectedMuscle);
      });
      if (typeof renderMuscleHistory === 'function') renderMuscleHistory(selectedMuscle);
    }
    _updateMuscleTargetLabel();
    updateStatBar();
    postSaveHooks();
    _updateSaveBtnState();
    _checkEndSessionNudge();

    btn.classList.remove('loading');
    btn.innerHTML = '<svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' + (typeof t === 'function' && currentLang === 'ar' ? 'تسجيل التمرين' : 'Log Workout');

    if (isPR) {
      showToast(typeof t === 'function' ? (currentLang === 'ar' ? 'رقم قياسي جديد! تم تسجيل التمرين' : 'NEW PR! Workout logged!') : 'NEW PR! Workout logged!');
      if (typeof hapPR === 'function') hapPR();
      if (typeof _addEnergy === 'function') _addEnergy(10);
      (function() {
        var _exCard = document.getElementById('form-panel') || document.querySelector('.exercise-card') || document.getElementById('log-form');
        if (_exCard) {
          _exCard.classList.add('boss-fight-card');
          var _hdr = _exCard.querySelector('h3, .form-title, .exercise-name');
          if (_hdr && !_hdr.querySelector('.boss-badge')) {
            var _badge = document.createElement('span');
            _badge.className = 'boss-badge boss-defeated-badge';
            _badge.textContent = '\u2694 BOSS DEFEATED!';
            _hdr.appendChild(_badge);
          }
          setTimeout(function() {
            _exCard.classList.remove('boss-fight-card');
            var _b = _exCard.querySelector('.boss-badge');
            if (_b) _b.remove();
          }, 4000);
        }
      })();
      if (typeof flashPR === 'function') flashPR();
      if (typeof sndPR === 'function') sndPR();
      if (typeof burstPR === 'function') burstPR(btn);
      // JIT: first PR hit
      if (typeof showJit === 'function') {
        setTimeout(() => showJit('pr-first', document.getElementById('save-btn'), '🏆 First PR! Visit the Stats tab to see your full PR history.'), 1200);
      }
    } else {
      showToast(typeof t === 'function' && currentLang === 'ar' ? 'تم تسجيل التمرين!' : 'Workout logged!');
      if (typeof hapSave === 'function') hapSave();
      if (typeof flashSave === 'function') flashSave();
      if (typeof sndSave === 'function') sndSave();
      if (typeof burstSave === 'function') burstSave();
    }
    // A2: Auto-rest trigger
    if (settings.autoRest && !_hdrRestRunning) {
      hdrSetRest(_hdrRestTarget || 90);
      hdrRestToggle();
    }
    startTimer();
  }, 80);
}

function saveBwWorkout() {
  const name = document.getElementById('exercise-name').value.trim();
  if (!name) { showToast('Enter or pick an exercise!'); return; }

  const rows = document.querySelectorAll('#bw-sets-container .bw-set-row');
  if (!rows.length) { showToast('Add at least one set!'); return; }

  const sets = [];
  rows.forEach(r => {
    const val = parseInt(r.querySelector('.bw-val-input').value);
    const effort = r.querySelector('.bw-effort').value;
    if (val > 0) {
      if (_currentBwType === 'hold') sets.push({ secs: val, effort });
      else sets.push({ reps: val, effort });
    }
  });
  if (!sets.length) { showToast('Enter values!'); return; }

  const btn = document.getElementById('save-btn');
  btn.classList.add('loading'); btn.textContent = 'Saving…';

  setTimeout(() => {
    const bwEx = BW_EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase());
    const muscle = bwEx ? bwEx.muscle : (selectedMuscle || 'Core');

    // PR: max value in a single set (works for both reps and secs)
    const prevSessions = bwWorkouts.filter(w => w.exercise.toLowerCase() === name.toLowerCase());
    const prevMaxVal = prevSessions.length ? Math.max(...prevSessions.flatMap(w => w.sets.map(s => s.reps || s.secs || 0))) : 0;
    const newMaxVal = Math.max(...sets.map(s => s.reps || s.secs || 0));
    const isPR = newMaxVal > prevMaxVal;

    // Skill Unlock: detect threshold crossing
    const _suBwEx = (typeof BW_EXERCISES !== 'undefined')
      ? BW_EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase()) : null;
    const _skillJustUnlocked = _suBwEx && newMaxVal >= _suBwEx.target && prevMaxVal < _suBwEx.target;

    const totalReps = sets.reduce((a, s) => a + (s.reps || s.secs || 0), 0);

    bwWorkouts.push({
      id: Date.now(), date: new Date().toISOString(),
      exercise: name, muscle, sets, notes: '',
      totalReps, isPR, type: 'bodyweight', bwType: _currentBwType
    });
    saveBwData();

    // Fire Skill Unlock overlay if threshold was just crossed
    if (_skillJustUnlocked && _suBwEx) {
      const _suTree = (typeof CALISTHENICS_TREES !== 'undefined')
        ? CALISTHENICS_TREES.find(tr => tr.tree === _suBwEx.tree) : null;
      const _suNextLvl = _suTree ? _suTree.levels.find(l => l.l === _suBwEx.level + 1) : null;
      setTimeout(() => _showSkillUnlock(name, _suTree?.icon || '🏆', _suNextLvl), 650);
    }

    // Reset form (keep muscle selected — user stays on same group to log more)
    document.getElementById('exercise-name').value = '';
    document.getElementById('bw-sets-container').innerHTML = '';
    document.getElementById('last-session-hint').style.display = 'none';
    bwSetCount = 0;
    _updateSetBadge(0);
    renderBwExercisePicker();
    renderBwStats();
    // Re-apply zone highlight and refresh history for the kept muscle
    if (selectedMuscle) {
      document.querySelectorAll('.body-zone').forEach(z => {
        z.classList.toggle('zone-selected', z.dataset.muscle === selectedMuscle);
      });
      if (typeof renderMuscleHistory === 'function') renderMuscleHistory(selectedMuscle);
    }
    _updateMuscleTargetLabel();
    updateStatBar();
    if (typeof _updateMuscleChipColors === 'function') _updateMuscleChipColors();
    postSaveHooks();

    btn.classList.remove('loading');
    btn.innerHTML = '<svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' + (typeof t === 'function' && currentLang === 'ar' ? 'تسجيل التمرين' : 'Log Workout');

    const _prUnit = _currentBwType === 'hold' ? 'secs' : 'reps';
    if (isPR) {
      showToast(typeof t === 'function' && currentLang === 'ar' ? `رقم قياسي! ${newMaxVal} — رقم جديد!` : `BW PR! ${newMaxVal} ${_prUnit} — new record!`);
      if (typeof hapPR === 'function') hapPR();
      if (typeof _addEnergy === 'function') _addEnergy(10);
      (function() {
        var _exCard = document.getElementById('form-panel') || document.querySelector('.exercise-card') || document.getElementById('log-form');
        if (_exCard) {
          _exCard.classList.add('boss-fight-card');
          var _hdr = _exCard.querySelector('h3, .form-title, .exercise-name');
          if (_hdr && !_hdr.querySelector('.boss-badge')) {
            var _badge = document.createElement('span');
            _badge.className = 'boss-badge boss-defeated-badge';
            _badge.textContent = '\u2694 BOSS DEFEATED!';
            _hdr.appendChild(_badge);
          }
          setTimeout(function() {
            _exCard.classList.remove('boss-fight-card');
            var _b = _exCard.querySelector('.boss-badge');
            if (_b) _b.remove();
          }, 4000);
        }
      })();
      if (typeof flashPR === 'function') flashPR();
      if (typeof sndPR === 'function') sndPR();
    } else {
      showToast(typeof t === 'function' && currentLang === 'ar' ? `${name} — ${totalReps} إجمالي` : `${name} logged! ${totalReps} total ${_prUnit}`);
      if (typeof hapSave === 'function') hapSave();
      if (typeof flashSave === 'function') flashSave();
      if (typeof sndSave === 'function') sndSave();
    }
    startTimer();
  }, 300);
}

/* ── Arcade Star Rating ── */
function _showSessionStars() {
  var logs = (typeof _sessionWkLogs !== 'undefined') ? _sessionWkLogs : [];
  if (!logs.length) return;

  var totalVol  = logs.reduce(function(a,l){ return a+(l.volume||0); }, 0);
  var prCount   = logs.filter(function(l){ return l.isPR; }).length;
  var bestCombo = (typeof _bestCombo !== 'undefined') ? _bestCombo : 0;

  var prevWorkouts = (typeof workouts !== 'undefined') ? workouts : [];
  var prevAvgVol = 0;
  if (prevWorkouts.length >= 2) {
    var recent = prevWorkouts.slice(-5);
    prevAvgVol = recent.reduce(function(a,w){ return a+(w.totalVolume||0); },0) / recent.length;
  }

  var stars = 1;
  var meetsVolume = prevAvgVol > 0 && totalVol >= prevAvgVol * 0.8;
  if (meetsVolume || prCount > 0) stars = 2;
  if ((prevAvgVol === 0 || totalVol >= prevAvgVol) && prCount > 0 && bestCombo >= 3) stars = 3;

  var totalSets = logs.reduce(function(a,l){ return a+(l.sets?l.sets.length:0); },0);
  var energyPct = (typeof _sessionEnergy !== 'undefined') ? Math.round(_sessionEnergy) : 0;
  var parts = [totalSets + ' SETS'];
  if (bestCombo >= 2) parts.push('BEST COMBO x' + bestCombo);
  if (prCount > 0) parts.push(prCount + ' PR');
  parts.push(energyPct + '% ENERGY');

  var titleEl = document.getElementById('wend-title');
  if (!titleEl) return;
  titleEl.innerHTML =
    '<div class="wend-stars">' +
    [1,2,3].map(function(n,i){ return '<div class="wend-star" id="wend-star-'+(i+1)+'">&#11088;</div>'; }).join('') +
    '</div>';

  var subEl = document.getElementById('wend-sub');
  if (subEl) {
    var oldText = subEl.textContent || '';
    subEl.innerHTML = '<div class="wend-star-summary">' + parts.join(' &middot; ') + '</div><div>' + oldText + '</div>';
  }

  if (typeof sndStars === 'function') sndStars(stars);
  if (typeof hapStars === 'function') hapStars(stars);
  for (var i = 0; i < stars; i++) {
    (function(idx) {
      setTimeout(function() {
        var el = document.getElementById('wend-star-' + (idx+1));
        if (el) el.classList.add('revealed');
      }, idx * 420);
    })(i);
  }
}
