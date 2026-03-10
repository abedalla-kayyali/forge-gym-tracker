// FORGE Gym Tracker - bodyweight exercise mode helpers
// Extracted from index.html as part of modularization.

// BW_EXERCISES is generated from CALISTHENICS_TREES in js/exercises.js
let workoutMode = 'weighted'; // 'weighted' | 'bodyweight'
let bwSetCount = 0;
let _currentBwType = 'reps'; // 'reps' | 'hold' (isometric seconds)

function setWorkoutMode(mode) {
  workoutMode = mode;
  const isWgt = mode === 'weighted';

  document.getElementById('mode-btn-weighted').classList.toggle('active', isWgt);
  document.getElementById('mode-btn-bodyweight').classList.toggle('active', !isWgt);

  // Toggle UI sections
  document.getElementById('weighted-sets-section').style.display = isWgt ? '' : 'none';
  document.getElementById('bw-sets-section').style.display = isWgt ? 'none' : '';
  document.getElementById('bw-exercise-picker').style.display = isWgt ? 'none' : '';
  document.getElementById('bw-stats-area').style.display = isWgt ? 'none' : '';

  // Body map: always visible
  const bodyMapSection = document.getElementById('section-bodymap');
  const bodyTapHint = document.getElementById('body-tap-hint-el');
  if (bodyMapSection) bodyMapSection.style.display = '';
  if (bodyTapHint) bodyTapHint.style.display = '';

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
    renderBwExercisePicker();
    renderBwStats();
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

let _bwPickerShowAll = false;
function renderBwExercisePicker() {
  const wrap = document.getElementById('bw-exercise-picker');
  const grid = document.getElementById('bw-exercises-grid');
  if (!grid) return;
  const currentEx = document.getElementById('exercise-name').value.trim();
  const isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';

  // Update label
  const labelEl = wrap ? wrap.querySelector('label') : null;
  if (labelEl) {
    if (selectedMuscle && !_bwPickerShowAll) {
      labelEl.innerHTML = `${isAr ? 'مسارات' : 'Skill Trees'} — <span style="color:var(--green);font-weight:700;">${selectedMuscle.toUpperCase()}</span> &nbsp;<button onclick="_bwPickerShowAll=true;renderBwExercisePicker();" style="background:none;border:none;color:var(--accent);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;cursor:pointer;padding:0;">${isAr ? '(الكل)' : '(all)'}</button>`;
    } else if (selectedMuscle && _bwPickerShowAll) {
      labelEl.innerHTML = `${isAr ? 'كل المسارات' : 'All Skill Trees'} &nbsp;<button onclick="_bwPickerShowAll=false;renderBwExercisePicker();" style="background:none;border:none;color:var(--accent);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;cursor:pointer;padding:0;">${isAr ? '(فلتر)' : '(filter)'}</button>`;
    } else {
      labelEl.innerHTML = isAr ? 'مسارات الكاليستينيكس' : 'Calisthenics Skill Trees';
    }
  }

  // Filter trees by selected muscle (unless show-all)
  const trees = (selectedMuscle && !_bwPickerShowAll)
    ? CALISTHENICS_TREES.filter(t => t.muscle === selectedMuscle)
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

    html += `<div class="cali-tree">
      <div class="cali-tree-header">${tree.icon} ${tree.tree}</div>
      <div class="cali-nodes">`;

    tree.levels.forEach((lvl, i) => {
      const isLocked = lvl.l > unlockedLvl;
      const isActive = currentEx.toLowerCase() === lvl.n.toLowerCase();
      const targetLbl = lvl.t === 'hold' ? `${lvl.target}s hold` : `${lvl.target} reps`;
      html += `<div class="cali-node${isLocked ? ' locked' : ''}${isActive ? ' active' : ''}"
                   onclick="pickBwExercise('${lvl.n.replace(/'/g, '\\\'')}','${tree.muscle}','${lvl.t}')">
        <div class="cali-node-lvl">${isLocked ? '🔒' : '🔓'} LVL ${lvl.l}</div>
        <div class="cali-node-name">${lvl.n}</div>
        <div class="cali-node-target">🎯 ${targetLbl}</div>
      </div>`;
      if (i < tree.levels.length - 1) html += '<div class="cali-connector"></div>';
    });

    html += '</div></div>';
  });

  grid.innerHTML = html;
  grid.className = 'cali-trees-container';
}

function pickBwExercise(name, muscle, type) {
  document.getElementById('exercise-name').value = name;
  selectedMuscle = muscle;
  _currentBwType = type || 'reps';

  // Update column header: REPS vs SECS
  const isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const hdr = document.getElementById('bw-val-header');
  if (hdr) hdr.textContent = _currentBwType === 'hold' ? (isAr ? 'ثوانٍ' : 'SECS') : (isAr ? 'تكرار' : 'REPS');

  renderBwExercisePicker();
  renderBwLastSession(name);
  renderBwStats();

  // Pre-fill sets from last session, or add one blank set
  const bwPrev = (bwWorkouts || []).slice().reverse().find(w => w.exercise.toLowerCase() === name.toLowerCase());
  if (bwPrev && document.querySelectorAll('#bw-sets-container .bw-set-row').length === 0) {
    bwSetCount = 0;
    document.getElementById('bw-sets-container').innerHTML = '';
    bwPrev.sets.forEach(s => addBwSet(s.reps || s.secs, s.effort));
  } else if (document.querySelectorAll('#bw-sets-container .bw-set-row').length === 0) {
    addBwSet();
  }
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

function addBwSet(val, effort) {
  bwSetCount++;
  _updateSetBadge(bwSetCount);
  const container = document.getElementById('bw-sets-container');
  const row = document.createElement('div');
  row.className = 'bw-set-row';
  row.id = 'bw-set-' + bwSetCount;
  const prevRow = container.querySelector('.bw-set-row:last-child');
  const prevVal = val !== undefined ? val : (prevRow ? prevRow.querySelector('.bw-val-input').value : '');
  const prevEff = effort !== undefined ? effort : (prevRow ? prevRow.querySelector('.bw-effort').value : 'medium');
  const isHold = _currentBwType === 'hold';
  const ph = isHold ? '20' : '10';
  const unitLbl = isHold ? 'sec' : 'rep';
  row.innerHTML = `
    <div class="set-num">${bwSetCount}</div>
    <div style="position:relative;display:flex;align-items:center;">
      <input type="number" min="1" inputmode="numeric" placeholder="${ph}" class="bw-val-input" value="${prevVal}" style="padding-right:30px;">
      <span style="position:absolute;right:10px;font-size:10px;color:var(--text3);pointer-events:none;font-family:'DM Mono',monospace;">${unitLbl}</span>
    </div>
    <select class="bw-effort" style="padding:8px 4px;font-size:13px;">
      <option value="easy" ${prevEff === 'easy' ? 'selected' : ''}>Easy</option>
      <option value="medium" ${!prevEff || prevEff === 'medium' ? 'selected' : ''}>Medium</option>
      <option value="hard" ${prevEff === 'hard' ? 'selected' : ''}>Hard</option>
      <option value="fail" ${prevEff === 'fail' ? 'selected' : ''}>Failure</option>
    </select>
    <button class="btn-icon" onclick="removeBwSet(${bwSetCount})">×</button>
  `;
  container.appendChild(row);
  const inp = row.querySelector('.bw-val-input');
  if (!('ontouchstart' in window)) inp.focus();
  if (typeof sndSetLog === 'function') sndSetLog();
  if (typeof hapSetLog === 'function') hapSetLog();
}

function removeBwSet(id) {
  const el = document.getElementById('bw-set-' + id);
  if (el) el.remove();
  const rows = document.querySelectorAll('#bw-sets-container .bw-set-row');
  bwSetCount = rows.length;
  rows.forEach((r, i) => { r.querySelector('.set-num').textContent = i + 1; });
  _updateSetBadge(bwSetCount);
}

function renderBwStats() {
  const statsArea = document.getElementById('bw-stats-area');
  const statsStrip = document.getElementById('bw-stats-strip');
  if (!statsStrip) return;
  const name = document.getElementById('exercise-name').value.trim();
  const sessions = (bwWorkouts || []).filter(w => !name || w.exercise.toLowerCase() === name.toLowerCase());
  if (!sessions.length) { statsArea.style.display = 'none'; return; }
  statsArea.style.display = '';
  const totalRepsAll = sessions.reduce((a, w) => a + w.sets.reduce((b, s) => b + (s.reps || s.secs || 0), 0), 0);
  const maxEver = Math.max(...sessions.flatMap(w => w.sets.map(s => s.reps || s.secs || 0)));
  const totalSessions = sessions.length;
  statsStrip.innerHTML = `
    <div class="bw-stat-card"><div class="bw-stat-val">${totalSessions}</div><div class="bw-stat-lbl">${t('bw.stat.sessions')}</div></div>
    <div class="bw-stat-card"><div class="bw-stat-val">${totalRepsAll}</div><div class="bw-stat-lbl">${t('bw.stat.totalReps')}</div></div>
    <div class="bw-stat-card"><div class="bw-stat-val">${maxEver}</div><div class="bw-stat-lbl">${t('bw.stat.bestSet')}</div></div>
  `;
}
