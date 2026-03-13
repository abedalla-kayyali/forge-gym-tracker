// FORGE Gym Tracker - bodyweight exercise mode helpers
// Extracted from index.html as part of modularization.

// BW_EXERCISES is generated from CALISTHENICS_TREES in js/exercises.js
let workoutMode = 'weighted'; // 'weighted' | 'bodyweight'
let bwSetCount = 0;
let _currentBwType = 'reps'; // 'reps' | 'hold' (isometric seconds)
let _bwFilterMuscle = ''; // active muscle filter for RPG tree
let _currentBwEffort = 'medium'; // tracks active effort button
let _currentBwReps = 10; // tracks reps stepper value
let _bwStep = 1; // 1=pick muscle, 2=pick exercise, 3=log sets
let _bwSessionMax = 0; // in-session high-water mark; reset when new exercise selected
let _bwSearchQuery = ''; // bodyweight picker search text

function setWorkoutMode(mode) {
  workoutMode = mode;
  const isWgt = mode === 'weighted';

  document.getElementById('mode-btn-weighted').classList.toggle('active', isWgt);
  document.getElementById('mode-btn-bodyweight').classList.toggle('active', mode === 'bodyweight');
  document.getElementById('mode-btn-cardio').classList.toggle('active', mode === 'cardio');

  // Toggle UI sections
  document.getElementById('weighted-sets-section').style.display = isWgt ? '' : 'none';
  document.getElementById('bw-sets-section').style.display = 'none';
  document.getElementById('bw-exercise-picker').style.display = mode === 'bodyweight' ? '' : 'none';
  document.getElementById('cardio-zone').style.display = mode === 'cardio' ? '' : 'none';
  const effortGroup = document.getElementById('session-effort-group');
  if (effortGroup) effortGroup.style.display = isWgt ? '' : 'none';
  const saveSticky = document.getElementById('save-sticky');
  if (saveSticky) saveSticky.style.display = isWgt ? '' : 'none';

  // Muscle group: weighted only
  const bodyMapSection = document.getElementById('section-bodymap');
  if (bodyMapSection) bodyMapSection.classList.toggle('bw-mode-hidden', !isWgt);

  // Auto-scroll to BW picker after fade-out completes
  if (!isWgt) {
    setTimeout(() => {
      if (workoutMode !== 'bodyweight') return;
      const picker = document.getElementById('bw-exercise-picker');
      if (picker) picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 280);
  }

  // Show/hide weighted muscle history quick-select
  const wgtHist = document.getElementById('wgt-muscle-history');
  if (wgtHist) wgtHist.style.display = isWgt ? '' : 'none';

  // Update panel title + placeholder
  const _modeAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  document.getElementById('exercise-panel-title').textContent = isWgt
    ? (_modeAr ? 'إدخال التمرين' : 'Exercise Entry')
    : (_modeAr ? 'تمرين وزن الجسم' : 'Bodyweight Exercise');
  const exInput = document.getElementById('exercise-name');
  if (exInput) exInput.placeholder = isWgt
    ? (_modeAr ? 'مثال: ضغط الصدر، القرفصاء…' : 'e.g. Bench Press, Squat…')
    : (_modeAr ? 'مثال: ضغط، بيربي…' : 'e.g. Push-Ups, Burpees…');

  if (!isWgt) {
    _setBwStep(1);
    _bwSessionMax = 0;
    _updateBwPrStrip('');
    renderBwExercisePicker();
    // Reset arcade zone
    document.getElementById('bw-arcade-ex-name').textContent = '—';
    document.getElementById('bw-arcade-ex-sub').textContent = '';
    document.getElementById('bw-ring-progress').style.strokeDashoffset = '220';
    document.getElementById('bw-ring-pct').textContent = '0%';
    _currentBwReps = 10;
    _currentBwEffort = 'medium';
    _renderBwRepsVal();
    // Reset effort button active state
    document.querySelectorAll('.bw-eff-btn').forEach(b => b.classList.remove('active'));
    const medBtn = document.querySelector('.bw-eff-med');
    if (medBtn) medBtn.classList.add('active');
    _renderBwActiveDot();
    // Clear weighted sets
    document.getElementById('sets-container').innerHTML = '';
    setCount = 0;
    _updateSetBadge(0);
    selectedMuscle = '';
  } else {
    // Clear BW sets
    document.getElementById('bw-sets-container').innerHTML = '';
    bwSetCount = 0;
    _updateSetBadge(0);
    selectedMuscle = '';
  }
  // Reset exercise name
  document.getElementById('exercise-name').value = '';
  document.getElementById('last-session-hint').style.display = 'none';
  _updateMuscleTargetLabel();
}

function _setBwStep(n) {
  _bwStep = n;
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`bw-step-${i}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < n)       el.classList.add('done');
    else if (i === n) el.classList.add('active');
    const numEl = el.querySelector('.bw-step-num');
    if (numEl) numEl.textContent = i < n ? 'OK' : String(i);
  });
}

// ── PR HELPERS ──────────────────────────────────────────────────────────────

// All-time best single set value for an exercise (saved history only)
function _getBwPR(name) {
  if (!name) return 0;
  const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === name.toLowerCase());
  return history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
}

// Today's flat set array for an exercise (may span multiple saves in one day)
function _getBwTodaySets(name) {
  if (!name) return [];
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return (bwWorkouts || [])
    .filter(w => w.exercise.toLowerCase() === name.toLowerCase() && w.date.startsWith(today))
    .flatMap(w => w.sets);
}

// Today's best single set value (saved history; _bwSessionMax layered in _updateBwPrStrip)
function _getBwTodayMax(name) {
  if (!name) return 0;
  const sets = _getBwTodaySets(name);
  return sets.length ? Math.max(...sets.map(s => s.reps || s.secs || 0)) : 0;
}

// Refresh PR strip UI — uses _bwSessionMax for live display before save
function _updateBwPrStrip(name) {
  const savedPR = _getBwPR(name);
  const pr      = Math.max(savedPR, _bwSessionMax);              // live RECORD
  const tod     = Math.max(_getBwTodayMax(name), _bwSessionMax); // live TODAY
  const lvl = CALISTHENICS_TREES.flatMap(t => t.levels)
    .find(l => l.n.toLowerCase() === (name || '').toLowerCase());
  const unit = (lvl && lvl.t === 'hold') ? 'secs' : 'reps';
  const recEl = document.getElementById('bw-record-val');
  const todEl = document.getElementById('bw-today-val');
  if (recEl) recEl.textContent = pr  > 0 ? `${pr} ${unit}`  : '—';
  if (todEl) todEl.textContent = tod > 0 ? `${tod} ${unit}` : '—';
}

function _bwNormalizeDate(raw) {
  if (!raw) return '';
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '' : _isoKey(d);
}

function _bwExerciseStreakDays(name) {
  if (!name) return 0;
  const target = String(name).toLowerCase();
  const daySet = new Set((bwWorkouts || []).map(w => {
    const ex = String(w?.exercise || '').toLowerCase();
    if (ex !== target) return '';
    return _bwNormalizeDate(w?.date);
  }).filter(Boolean));
  if (!daySet.size) return 0;
  const todayKey = _isoKey(new Date());
  if (!daySet.has(todayKey)) return 0;
  let count = 1;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (daySet.has(_isoKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function setBwFilter(btn, muscle) {
  _bwFilterMuscle = muscle;
  document.querySelectorAll('.bw-filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (_bwStep < 2) _setBwStep(2);
  renderBwExercisePicker();
}

function renderBwExercisePicker() {
  const wrap = document.getElementById('bw-rpg-trees');
  if (!wrap) return;

  const currentEx = document.getElementById('exercise-name').value.trim().toLowerCase();

  // Filter trees by muscle chip selection (case-sensitive — matches CALISTHENICS_TREES muscle values)
  const trees = _bwFilterMuscle
    ? CALISTHENICS_TREES.filter(t => t.muscle === _bwFilterMuscle)
    : CALISTHENICS_TREES;
  const treesToRender = trees.length ? trees : CALISTHENICS_TREES;

  let html = '';
  treesToRender.forEach(tree => {
    // Calculate highest unlocked level from history
    let unlockedLvl = 1;
    tree.levels.forEach(lvl => {
      const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase());
      const maxVal = history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
      if (maxVal >= lvl.target) unlockedLvl = Math.max(unlockedLvl, lvl.l + 1);
    });

    html += `<div class="bw-rpg-tree">
      <div class="bw-tree-section-label">
        <span class="bw-tree-section-icon">${tree.icon}</span>
        ${tree.tree.toUpperCase()}
      </div>`;

    tree.levels.forEach((lvl, i) => {
      const streakDays = _bwExerciseStreakDays(lvl.n);
      // Classify node state by level number vs highest unlocked level
      const isDone    = lvl.l < unlockedLvl;
      const isCurrent = lvl.l === unlockedLvl;
      const isNextUp  = lvl.l === unlockedLvl + 1; // first locked level, show as "next up"
      const isLocked  = lvl.l > unlockedLvl + 1;   // deeper locked levels

      // Determine node state
      let nodeClass = 'locked', lvlClass = 'locked', badge = 'LOCK';
      if (isDone) {
        nodeClass = 'done'; lvlClass = 'done'; badge = 'DONE';
      } else if (isCurrent) {
        nodeClass = 'current'; lvlClass = 'current'; badge = 'LIVE';
      } else if (isNextUp) {
        nodeClass = 'next-up'; lvlClass = 'next-up'; badge = 'NEXT';
      }

      // Progress bar (only for done + current)
      let barHtml = '';
      if (isDone || isCurrent) {
        const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase());
        const maxVal = history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
        const pct = Math.min(100, Math.round((maxVal / lvl.target) * 100));
        const unit = lvl.t === 'hold' ? 'secs' : 'reps';
        const pctLabel = maxVal > 0
          ? (isDone
              ? `${maxVal} ${unit} - Unlocked`
              : `${maxVal} ${unit} - ${pct}% to unlock (need ${lvl.target})`)
          : (isDone
              ? `✓ Unlocked`          // valid edge case: unlocked with no local history
              : `${pct}% to unlock (need ${lvl.target} ${unit})`);
        barHtml = `
          <div class="bw-rpg-bar-wrap"><div class="bw-rpg-bar-fill" style="width:${pct}%"></div></div>
          <div class="bw-rpg-pct">${pctLabel}</div>`;
      } else if (isNextUp) {
        const unit = lvl.t === 'hold' ? 'secs hold' : 'reps';
        barHtml = `<div class="bw-rpg-target">Unlock by hitting ${lvl.target} ${unit} on previous level</div>`;
      }

      // Connector between nodes
      const connectorClass = isDone ? 'green' : 'dim';
      if (i > 0) html += `<div class="bw-rpg-connector ${connectorClass}"></div>`;

      const isClickable = isDone || isCurrent;
      const isSelected = isClickable && lvl.n.toLowerCase() === currentEx;
      html += `<div class="bw-rpg-node ${nodeClass}${isSelected ? ' selected' : ''}"
                    ${isClickable ? `onclick="pickBwExercise('${lvl.n.replace(/'/g,"\\'")}','${tree.muscle}','${lvl.t}')"` : ''}>
        <div class="bw-rpg-icon">${tree.icon}</div>
        <div class="bw-rpg-info">
          <div class="bw-rpg-lvl ${lvlClass}">LVL ${lvl.l} · ${nodeClass.replace('-',' ').toUpperCase()}</div>
          <div class="bw-rpg-name-row">
            <div class="bw-rpg-name">${lvl.n}</div>
            <div class="bw-rpg-streak${streakDays > 0 ? ' active' : ''}">${streakDays > 0 ? `${streakDays}d` : '0d'}</div>
          </div>
          ${barHtml}
        </div>
        <div class="bw-rpg-badge bw-rpg-badge-text">${badge}</div>
      </div>`;
    });

    html += '</div>'; // end bw-rpg-tree
  });

  wrap.innerHTML = html;
}

function pickBwExercise(name, muscle, type) {
  _bwSessionMax = 0; // reset in-session high-water mark for new exercise
  document.getElementById('exercise-name').value = name;
  selectedMuscle = muscle;
  _currentBwType = type || 'reps';

  // Update reps unit label
  const unit = _currentBwType === 'hold' ? 'secs' : 'reps';
  const unitEl = document.getElementById('bw-reps-unit');
  if (unitEl) unitEl.textContent = unit;

  // Update arcade header
  _updateBwArcadeHeader(name);

  // Step 3: advance indicator
  _setBwStep(3);

  // Sound + haptic feedback
  if (typeof sndTap === 'function') sndTap();
  if (typeof hapTap === 'function') hapTap();

  // Reveal arcade zone + scroll into view
  const arcadeZone = document.getElementById('bw-sets-section');
  if (arcadeZone) {
    arcadeZone.style.display = '';
    setTimeout(() => arcadeZone.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  // Re-render tree (highlights selected node)
  renderBwExercisePicker();
  renderBwLastSession(name);

  // Clear existing sets before pre-fill
  document.getElementById('bw-sets-container').innerHTML = '';
  bwSetCount = 0;
  _updateSetBadge(0);

  // Daily pre-fill: show today's sets; start fresh if new day
  const todaySets = _getBwTodaySets(name);
  if (todaySets.length) {
    todaySets.forEach(s => _addBwDot(s.reps || s.secs, s.effort));
    bwSetCount = todaySets.length;
    _updateSetBadge(bwSetCount);
    // Pre-fill reps stepper from last today set
    const lastSet = todaySets[todaySets.length - 1];
    _currentBwReps = lastSet.reps || lastSet.secs || 10;
  } else {
    _currentBwReps = _currentBwType === 'hold' ? 20 : 10;
  }
  _renderBwRepsVal();

  _renderBwActiveDot();
  _updateBwRing(name);
  _updateBwPrStrip(name); // show RECORD + TODAY in arcade header
}

function _updateBwArcadeHeader(name) {
  const nameEl = document.getElementById('bw-arcade-ex-name');
  const subEl  = document.getElementById('bw-arcade-ex-sub');
  if (!nameEl || !subEl) return;

  nameEl.textContent = name.toUpperCase();

  // Find tree + level for this exercise
  let subtitle = '';
  CALISTHENICS_TREES.forEach(tree => {
    tree.levels.forEach((lvl, i) => {
      if (lvl.n.toLowerCase() === name.toLowerCase()) {
        const nextLvl = tree.levels[i + 1];
        const unit = lvl.t === 'hold' ? 'secs hold' : 'reps';
        if (nextLvl) {
          subtitle = `LVL ${lvl.l} · TARGET ${lvl.target} ${unit} TO UNLOCK ${nextLvl.n.toUpperCase()}`;
        } else {
          subtitle = `LVL ${lvl.l} · MASTER LEVEL · TARGET ${lvl.target} ${unit}`;
        }
      }
    });
  });
  subEl.textContent = subtitle;
}

function _updateBwRing(name) {
  const ringEl = document.getElementById('bw-ring-progress');
  const pctEl  = document.getElementById('bw-ring-pct');
  if (!ringEl || !pctEl) return;

  const CIRCUMFERENCE = 220;
  let pct = 0;

  CALISTHENICS_TREES.forEach(tree => {
    tree.levels.forEach(lvl => {
      if (lvl.n.toLowerCase() === name.toLowerCase()) {
        const history = (bwWorkouts || []).filter(w => w.exercise.toLowerCase() === name.toLowerCase());
        const maxVal = history.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
        pct = Math.min(100, Math.round((maxVal / lvl.target) * 100));
      }
    });
  });

  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct / 100);
  ringEl.style.strokeDashoffset = offset;
  pctEl.textContent = pct + '%';
}

function renderBwLastSession(name) {
  const prev = (bwWorkouts || []).slice().reverse().find(w => w.exercise.toLowerCase() === name.toLowerCase());
  const hint = document.getElementById('last-session-hint');
  if (!prev || !settings.showHint) { hint.style.display = 'none'; return; }
  const d = new Date(prev.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  const prevBwType = prev.bwType || 'reps';
  const unit = prevBwType === 'hold' ? 'secs' : 'reps';
  const totalVal = prev.sets.reduce((a, s) => a + (s.reps || s.secs || 0), 0);
  const maxVal = Math.max(...prev.sets.map(s => s.reps || s.secs || 0));
  hint.style.display = 'block';
  document.getElementById('last-session-content').innerHTML =
    `<b>${d}</b> &nbsp; ${prev.sets.length} sets · ${totalVal} total ${unit} · Max ${maxVal} ${unit}/set`;
}

function adjustBwReps(delta) {
  _currentBwReps = Math.max(1, _currentBwReps + delta);
  _renderBwRepsVal();
}

function _renderBwRepsVal() {
  const el = document.getElementById('bw-reps-val');
  if (el) el.textContent = _currentBwReps;
}

function _ensureBwNumpadInput() {
  let input = document.getElementById('bw-reps-picker-input');
  if (input) return input;
  input = document.createElement('input');
  input.id = 'bw-reps-picker-input';
  input.type = 'number';
  input.className = 'bw-val-input';
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  input.style.position = 'absolute';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  const host = document.getElementById('bw-sets-section') || document.body;
  host.appendChild(input);
  return input;
}

function openBwRepsPicker() {
  if (typeof openWheelPicker !== 'function') return;
  const input = _ensureBwNumpadInput();
  input.value = String(_currentBwReps || 0);
  openWheelPicker(input);
}

function onBwNumpadConfirm(rawVal) {
  const nextVal = Math.max(1, parseInt(rawVal, 10) || 0);
  _currentBwReps = nextVal;
  _renderBwRepsVal();
}

function bwDitto() {
  // Copy reps from last completed dot (reads data-val attribute set by _addBwDot)
  const dots = document.querySelectorAll('#bw-sets-container .bw-dot-row');
  if (!dots.length) return;
  const lastDot = dots[dots.length - 1];
  const infoEl = lastDot.querySelector('.bw-dot-info');
  if (infoEl) {
    const val = parseInt(infoEl.dataset.val, 10);
    if (!isNaN(val)) { _currentBwReps = val; _renderBwRepsVal(); }
  }
}

function selectBwEffort(btn) {
  document.querySelectorAll('.bw-eff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _currentBwEffort = btn.dataset.effort;
}

function addBwSet() {
  bwSetCount++;
  _updateSetBadge(bwSetCount);
  _addBwDot(_currentBwReps, _currentBwEffort);
  _renderBwActiveDot();

  // PR check — fires at most once per new session peak
  const exName  = (document.getElementById('exercise-name') || {}).value || '';
  const savedPR = _getBwPR(exName.trim());
  const isNewPR = exName.trim() && _currentBwReps > Math.max(savedPR, _bwSessionMax);

  if (isNewPR) {
    _bwSessionMax = _currentBwReps; // update high-water mark
    if (typeof sndPR  === 'function') sndPR();
    if (typeof hapPR  === 'function') hapPR();
    const recCell = document.getElementById('bw-record-cell');
    if (recCell) {
      recCell.classList.remove('bw-pr-new-record');
      void recCell.offsetWidth; // reflow to restart animation
      recCell.classList.add('bw-pr-new-record');
    }
  } else {
    // Normal set — standard audio + haptic
    if (typeof sndSetLog === 'function') sndSetLog();
    if (typeof hapSetLog === 'function') hapSetLog();
  }
  _updateBwPrStrip(exName.trim());
  renderBwExercisePicker();
}

function _addBwDot(val, effort) {
  const container = document.getElementById('bw-sets-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'bw-dot-row';
  const effortLabel = { easy: 'Easy', medium: 'Med', hard: 'Hard', failure: 'Fail' }[effort] || 'Med';
  const effortClass = effort || 'medium';
  const unit = _currentBwType === 'hold' ? 'secs' : 'reps';
  row.innerHTML = `
    <div class="bw-dot done"></div>
    <div class="bw-dot-info" data-val="${val}">${val} ${unit}</div>
    <div class="bw-dot-sub ${effortClass}">${effortLabel}</div>
    <button type="button" class="bw-dot-del" onclick="removeBwSet(this)" aria-label="Delete set">x</button>
  `;
  // Insert before the active placeholder (if any)
  const activePlaceholder = container.querySelector('.bw-active-placeholder');
  if (activePlaceholder) container.insertBefore(row, activePlaceholder);
  else container.appendChild(row);
}

function removeBwSet(btn) {
  const row = btn && btn.closest ? btn.closest('.bw-dot-row') : null;
  if (!row) return;
  row.remove();
  bwSetCount = Math.max(0, bwSetCount - 1);
  _updateSetBadge(bwSetCount);
  const exName = ((document.getElementById('exercise-name') || {}).value || '').trim();
  const vals = Array.from(document.querySelectorAll('#bw-sets-container .bw-dot-info[data-val]'))
    .map(el => parseInt(el.dataset.val, 10))
    .filter(v => Number.isFinite(v) && v > 0);
  _bwSessionMax = vals.length ? Math.max(...vals) : 0;
  _renderBwActiveDot();
  if (exName) {
    _updateBwPrStrip(exName);
    _updateBwRing(exName);
  }
  renderBwExercisePicker();
}

function _renderBwActiveDot() {
  const container = document.getElementById('bw-sets-container');
  if (!container) return;
  // Remove old active placeholder
  const old = container.querySelector('.bw-active-placeholder');
  if (old) old.remove();

  const ph = document.createElement('div');
  ph.className = 'bw-active-placeholder';
  ph.innerHTML = `
    <div class="bw-dot-row">
      <div class="bw-dot active"></div>
      <div class="bw-dot-info" style="color:var(--accent)">Set ${bwSetCount + 1}</div>
      <div class="bw-dot-sub" style="color:var(--accent)">logging...</div>
    </div>
    <div class="bw-add-dot-row">
      <div class="bw-add-dot"></div>
      <div class="bw-add-lbl" onclick="addBwSet()">+ add set</div>
    </div>
  `;
  container.appendChild(ph);
}

// Clean log mode UX override: keep page minimal until user picks a workout type.
(function () {
  function _setLogModeSelectionState(selected) {
    const logView = document.getElementById('view-log');
    const prompt = document.getElementById('log-mode-prompt');
    if (logView) {
      logView.classList.toggle('mode-unselected', !selected);
      if (!selected) logView.classList.remove('bw-clean-mode');
    }
    if (prompt) prompt.style.display = selected ? 'none' : '';
  }

  function _hideModeSpecificSections() {
    const weighted = document.getElementById('weighted-sets-section');
    const bwSets = document.getElementById('bw-sets-section');
    const bwPicker = document.getElementById('bw-exercise-picker');
    const cardio = document.getElementById('cardio-zone');
    if (weighted) weighted.style.display = 'none';
    if (bwSets) bwSets.style.display = 'none';
    if (bwPicker) bwPicker.style.display = 'none';
    if (cardio) cardio.style.display = 'none';
    const effortGroup = document.getElementById('session-effort-group');
    if (effortGroup) effortGroup.style.display = 'none';
    const saveSticky = document.getElementById('save-sticky');
    if (saveSticky) saveSticky.style.display = 'none';

    const bodyMap = document.getElementById('section-bodymap');
    if (bodyMap) bodyMap.classList.add('bw-mode-hidden');

    const exInput = document.getElementById('exercise-name');
    const exInputGroup = exInput ? exInput.closest('.form-group') : null;
    if (exInputGroup) exInputGroup.style.display = 'none';
  }

  const _origSetWorkoutMode = window.setWorkoutMode;
  if (typeof _origSetWorkoutMode === 'function') {
    window.setWorkoutMode = function patchedSetWorkoutMode(mode) {
      _origSetWorkoutMode(mode);
      _setLogModeSelectionState(true);

      const logView = document.getElementById('view-log');
      if (logView) logView.classList.toggle('bw-clean-mode', mode === 'bodyweight');

      const exInput = document.getElementById('exercise-name');
      const exInputGroup = exInput ? exInput.closest('.form-group') : null;
      if (exInputGroup) exInputGroup.style.display = mode === 'weighted' ? '' : 'none';
    };
  }

  function resetWorkoutModeSelection() {
    _setLogModeSelectionState(false);
    const btnW = document.getElementById('mode-btn-weighted');
    const btnB = document.getElementById('mode-btn-bodyweight');
    const btnC = document.getElementById('mode-btn-cardio');
    if (btnW) btnW.classList.remove('active');
    if (btnB) btnB.classList.remove('active');
    if (btnC) btnC.classList.remove('active');
    _hideModeSpecificSections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resetWorkoutModeSelection);
  } else {
    resetWorkoutModeSelection();
  }
})();
// Bodyweight card-style picker + custom cards (persisted)
const _BW_CUSTOM_KEY = 'forge_bw_custom_exercises';
let _bwCustomExercises = _lsGet(_BW_CUSTOM_KEY, []);

function _saveBwCustomExercises() {
  localStorage.setItem(_BW_CUSTOM_KEY, JSON.stringify(_bwCustomExercises));
}

function addCustomBwExercise() {
  const name = (prompt('New bodyweight exercise name (example: Wall Sit, Hollow Hold)') || '').trim();
  if (!name) return;
  const muscle = (prompt('Primary muscle (example: Core, Legs, Chest)', 'Core') || 'Core').trim() || 'Core';
  const typeRaw = (prompt('Type: reps or hold', 'reps') || 'reps').trim().toLowerCase();
  const t = typeRaw === 'hold' ? 'hold' : 'reps';
  const exists = _bwCustomExercises.some(x => String(x?.n || '').toLowerCase() === name.toLowerCase());
  if (exists) { showToast('Exercise already exists'); return; }
  _bwCustomExercises.push({ id: 'bwc_' + Date.now(), n: name, muscle, t });
  _saveBwCustomExercises();
  renderBwExercisePicker();
  showToast('Custom bodyweight card added');
}

function _bwExerciseExists(name) {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return false;
  const baseExists = CALISTHENICS_TREES.flatMap(tree => tree.levels).some(lvl =>
    String(lvl?.n || '').trim().toLowerCase() === target
  );
  if (baseExists) return true;
  return _bwCustomExercises.some(x => String(x?.n || '').trim().toLowerCase() === target);
}

function addBwFromSearch() {
  const name = String(_bwSearchQuery || '').trim();
  if (!name) { showToast('Type workout name first'); return; }
  if (_bwExerciseExists(name)) { showToast('Exercise already exists'); return; }
  const muscleEl = document.getElementById('bw-add-muscle');
  const typeEl = document.getElementById('bw-add-type');
  const muscle = String(muscleEl?.value || _bwFilterMuscle || 'Core').trim() || 'Core';
  const tRaw = String(typeEl?.value || 'reps').toLowerCase();
  const t = tRaw === 'hold' ? 'hold' : 'reps';
  _bwCustomExercises.push({ id: 'bwc_' + Date.now(), n: name, muscle, t });
  _saveBwCustomExercises();

  _bwSearchQuery = '';
  const input = document.querySelector('#bw-rpg-trees .bw-search-input');
  if (input) input.value = '';
  _bwFilterMuscle = muscle;
  document.querySelectorAll('.bw-filter-chip').forEach(chip => {
    chip.classList.toggle('active', String(chip.dataset.muscle || '').toLowerCase() === muscle.toLowerCase());
  });
  renderBwExercisePicker();
  pickBwExercise(name, muscle, t);
  showToast('Custom bodyweight card added');
}

function setBwSearchQuery(val) {
  _bwSearchQuery = String(val || '').trim();
  if (_bwSearchQuery && _bwStep < 2) _setBwStep(2);
  renderBwExercisePicker();
  // Keep typing flow stable: picker re-renders on each key, so restore focus/caret.
  const q = _bwSearchQuery;
  requestAnimationFrame(() => {
    const input = document.querySelector('#bw-rpg-trees .bw-search-input');
    if (!input) return;
    input.focus();
    const pos = q.length;
    try { input.setSelectionRange(pos, pos); } catch (_) {}
  });
}

function _calcBwDayStreak() {
  const all = Array.isArray(bwWorkouts) ? bwWorkouts : [];
  const daySet = new Set(all.map(w => _bwNormalizeDate(w?.date)).filter(Boolean));
  if (!daySet.size) return 0;
  const today = _isoKey(new Date());
  if (!daySet.has(today)) return 0;
  let count = 1;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (daySet.has(_isoKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function _calcBwBestDayStreak() {
  const all = Array.isArray(bwWorkouts) ? bwWorkouts : [];
  const uniq = Array.from(new Set(all.map(w => _bwNormalizeDate(w?.date)).filter(Boolean))).sort();
  if (!uniq.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = new Date(uniq[i - 1] + 'T00:00:00');
    const cur = new Date(uniq[i] + 'T00:00:00');
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
}

function _bwMuscleIconSvg(muscleRaw) {
  const muscle = String(muscleRaw || '').toLowerCase();
  if (muscle.includes('core')) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8h6M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }
  if (muscle.includes('leg') || muscle.includes('calf')) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h4l-1 7 3 4v7h-4v-5l-3-4zM13 3h2l2 7v11h-3v-8l-2-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
  if (muscle.includes('back')) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c2 0 3 2 3 4v2l2 2v8h-2v-7l-3-2-3 2v7H7v-8l2-2V7c0-2 1-4 3-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
  if (muscle.includes('shoulder') || muscle.includes('chest') || muscle.includes('triceps') || muscle.includes('biceps')) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10c0-3 2-5 6-5s6 2 6 5v7h-3v-5h-6v5H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="7" r="1.4" fill="currentColor"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 4v10l-7 4-7-4V7z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v8M8.5 10l3.5 2 3.5-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function _bwTypeIconSvg(type) {
  if (type === 'hold') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4l2.8 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h3l2-3h6l2 3h3v4h-3l-2 3H9l-2-3H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="12" r="1.3" fill="currentColor"/><circle cx="17" cy="12" r="1.3" fill="currentColor"/></svg>';
}

function renderBwExercisePicker() {
  const wrap = document.getElementById('bw-rpg-trees');
  if (!wrap) return;

  const currentEx = (document.getElementById('exercise-name').value || '').trim().toLowerCase();
  const base = CALISTHENICS_TREES.flatMap(tree =>
    tree.levels.map(lvl => ({
      n: lvl.n,
      muscle: tree.muscle,
      t: lvl.t,
      tree: tree.tree
    }))
  );
  const all = base.concat(_bwCustomExercises.map(x => ({
    n: x.n,
    muscle: x.muscle || 'Core',
    t: x.t === 'hold' ? 'hold' : 'reps',
    tree: 'Custom'
  })));

  const query = String(_bwSearchQuery || '').toLowerCase();
  const hasFilter = Boolean(_bwFilterMuscle);
  const hasSearch = Boolean(query);
  const hasCriteria = hasFilter || hasSearch;
  const filtered = all.filter(x => {
    const muscleOk = hasFilter ? String(x.muscle || '').toLowerCase() === _bwFilterMuscle.toLowerCase() : true;
    const queryOk = hasSearch ? String(x.n || '').toLowerCase().includes(query) : true;
    return muscleOk && queryOk;
  });

  const cards = filtered.map(ex => {
    const rawName = String(ex.n || 'Exercise');
    const rawMuscle = String(ex.muscle || 'Core');
    const name = _esc(rawName);
    const muscle = _esc(rawMuscle);
    const type = ex.t === 'hold' ? 'hold' : 'reps';
    const streak = _bwExerciseStreakDays(rawName);
    const maxVal = _getBwPR(rawName);
    const selected = currentEx === rawName.toLowerCase();
    const kind = type === 'hold' ? 'HOLD' : 'REPS';
    const maxUnit = type === 'hold' ? 's' : 'r';
    const maxTxt = maxVal > 0 ? (maxVal + maxUnit) : '--';
    const muscleIcon = _bwMuscleIconSvg(rawMuscle);
    const typeIcon = _bwTypeIconSvg(type);
    return '<button class="bw-card-btn' + (selected ? ' active' : '') + '" data-name="' + name + '" data-muscle="' + muscle + '" data-type="' + type + '">' +
      '<span class="bw-card-icon-wrap">' +
        '<span class="bw-card-icon bw-card-icon-muscle">' + muscleIcon + '</span>' +
      '</span>' +
      '<span class="bw-card-main">' +
        '<span class="bw-card-name-row">' +
          '<span class="bw-card-name">' + name + '</span>' +
          '<span class="bw-card-type-icon" title="' + kind + '">' + typeIcon + '</span>' +
        '</span>' +
        '<span class="bw-card-muscle-row">' +
          '<span class="bw-card-muscle">' + muscle + '</span>' +
          '<span class="bw-card-signal"></span>' +
          '<span class="bw-card-live">LIVE</span>' +
        '</span>' +
      '</span>' +
      '<span class="bw-card-meta">' +
        '<span class="bw-card-kind">' + kind + '</span>' +
        '<span class="bw-card-max' + (maxVal > 0 ? ' active' : '') + '">MAX ' + maxTxt + '</span>' +
        '<span class="bw-card-streak' + (streak > 0 ? ' active' : '') + '">' + (streak > 0 ? (streak + 'd') : '0d') + '</span>' +
      '</span>' +
    '</button>';
  }).join('');

  const bwStreak = _calcBwDayStreak();
  const bwBest = _calcBwBestDayStreak();
  const sessions = (Array.isArray(bwWorkouts) ? bwWorkouts.length : 0);
  const todayKey = _isoKey(new Date());
  const todaySessions = (Array.isArray(bwWorkouts) ? bwWorkouts : []).filter(w => _bwNormalizeDate(w?.date) === todayKey).length;
  const uniqueMoves = new Set((Array.isArray(bwWorkouts) ? bwWorkouts : []).map(w => String(w?.exercise || '').trim().toLowerCase()).filter(Boolean)).size;
  const latestBw = (Array.isArray(bwWorkouts) ? bwWorkouts : []).slice().sort((a, b) =>
    new Date(b?.date || 0) - new Date(a?.date || 0)
  )[0] || null;
  const latestBwDate = latestBw ? new Date(latestBw.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--';
  const latestBwName = latestBw ? _esc(String(latestBw.exercise || 'Workout')) : '--';
  const streakText = bwStreak === 0
    ? 'Start your bodyweight streak today'
    : (bwStreak + ' day' + (bwStreak > 1 ? 's' : '') + ' streak active');

  const searchVal = _esc(_bwSearchQuery || '');
  const suggestedMuscle = _esc(_bwFilterMuscle || 'Core');
  const notFoundHtml = hasSearch
    ? (
      '<div class="bw-card-empty bw-card-empty-gated">' +
        '<div class="bw-gated-title">Workout not found</div>' +
        '<div class="bw-gated-sub">Add "' + _esc(_bwSearchQuery) + '" for future use</div>' +
        '<div class="bw-add-inline">' +
          '<select id="bw-add-muscle" class="bw-add-select">' +
            '<option value="Chest"' + (suggestedMuscle === 'Chest' ? ' selected' : '') + '>Chest</option>' +
            '<option value="Back"' + (suggestedMuscle === 'Back' ? ' selected' : '') + '>Back</option>' +
            '<option value="Core"' + (suggestedMuscle === 'Core' ? ' selected' : '') + '>Core</option>' +
            '<option value="Legs"' + (suggestedMuscle === 'Legs' ? ' selected' : '') + '>Legs</option>' +
            '<option value="Shoulders"' + (suggestedMuscle === 'Shoulders' ? ' selected' : '') + '>Shoulders</option>' +
            '<option value="Triceps"' + (suggestedMuscle === 'Triceps' ? ' selected' : '') + '>Triceps</option>' +
          '</select>' +
          '<select id="bw-add-type" class="bw-add-select bw-add-type">' +
            '<option value="reps">Reps</option>' +
            '<option value="hold">Hold</option>' +
          '</select>' +
          '<button type="button" class="bw-add-inline-btn" onclick="addBwFromSearch()">+ Add Workout</button>' +
        '</div>' +
      '</div>'
    )
    : '<div class="bw-card-empty">No exercises in this filter</div>';
  const listHtml = !hasCriteria
    ? '<div class="bw-card-empty bw-card-empty-gated">Pick a muscle or type a workout name to reveal cards</div>'
    : (cards || notFoundHtml);

  wrap.innerHTML =
    '<div class="bw-streak-bar">' +
      '<div class="bw-streak-kicker">BODYWEIGHT STREAK</div>' +
      '<div class="bw-streak-main">' + streakText + '</div>' +
      '<div class="bw-streak-sub">' + sessions + ' sessions logged</div>' +
      '<div class="bw-streak-latest">Latest: ' + latestBwName + ' · ' + latestBwDate + '</div>' +
      '<div class="bw-insight-row">' +
        '<div class="bw-insight-chip"><span class="bw-insight-lbl">TODAY</span><span class="bw-insight-val">' + todaySessions + '</span></div>' +
        '<div class="bw-insight-chip"><span class="bw-insight-lbl">MOVES</span><span class="bw-insight-val">' + uniqueMoves + '</span></div>' +
        '<div class="bw-insight-chip"><span class="bw-insight-lbl">BEST STREAK</span><span class="bw-insight-val">' + bwBest + 'd</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="bw-card-tools">' +
      '<div class="bw-search-wrap">' +
        '<input class="bw-search-input" type="text" value="' + searchVal + '" placeholder="Search workout name..." oninput="setBwSearchQuery(this.value)">' +
      '</div>' +
      '<button class="bw-add-custom-btn" type="button" onclick="addCustomBwExercise()">+ Add Custom Card</button>' +
    '</div>' +
    '<div class="bw-card-grid">' + listHtml + '</div>';

  wrap.querySelectorAll('.bw-card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name') || '';
      const muscle = btn.getAttribute('data-muscle') || 'Core';
      const type = btn.getAttribute('data-type') || 'reps';
      pickBwExercise(name, muscle, type);
    });
  });
}

(function initBwRepsTapTarget() {
  function bind() {
    const valEl = document.getElementById('bw-reps-val');
    if (!valEl || valEl.dataset.pickerBound === '1') return;
    valEl.dataset.pickerBound = '1';
    valEl.title = 'Tap to open numpad';
    valEl.addEventListener('click', () => openBwRepsPicker());
    _ensureBwNumpadInput();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
