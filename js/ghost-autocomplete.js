// Ghost data stored per exercise name while user is on that exercise
let _ghostSets = [];  // array of {reps, weight, unit}

// Delta display — shows +/- against ghost value in real time
function _formatDelta(current, ghost, unit) {
  const c = parseFloat(current);
  const g = parseFloat(ghost);
  if (!Number.isFinite(c) || !Number.isFinite(g)) return '';
  const diff = +(c - g).toFixed(2);
  if (diff === 0) return `<span class="gd-equal">= ${g}${unit || ''}</span>`;
  const sign = diff > 0 ? '+' : '';
  const cls = diff > 0 ? 'gd-up' : 'gd-down';
  return `<span class="${cls}">${sign}${diff}${unit || ''}</span>`;
}

function _updateRowDelta(row, idx) {
  const ghost = _ghostSets[idx];
  if (!ghost) return;
  const weightEl = row.querySelector('.set-weight');
  const repsEl   = row.querySelector('.set-reps');
  let deltaEl    = row.querySelector('.ghost-delta');

  if (!deltaEl) {
    deltaEl = document.createElement('div');
    deltaEl.className = 'ghost-delta';
    row.appendChild(deltaEl);
  }

  const unit = row.querySelector('.set-unit-toggle')?.dataset?.unit || 'kg';
  const wDelta = _formatDelta(weightEl?.value, ghost.weight, unit);
  const rDelta = _formatDelta(repsEl?.value, ghost.reps, '');

  if (!weightEl?.value && !repsEl?.value) {
    deltaEl.innerHTML = `<span class="gd-ghost">Ghost: ${ghost.weight ?? '?'}${unit} × ${ghost.reps ?? '?'}</span>`;
  } else {
    deltaEl.innerHTML = [wDelta, rDelta].filter(Boolean).join(' ');
  }
}

function _checkAndCelebrateBeat(row, idx) {
  const ghost = _ghostSets[idx];
  if (!ghost) return;
  const weightEl = row.querySelector('.set-weight');
  const repsEl   = row.querySelector('.set-reps');
  const wVal = parseFloat(weightEl?.value);
  const rVal = parseFloat(repsEl?.value);
  const gW   = parseFloat(ghost.weight);
  const gR   = parseFloat(ghost.reps);
  const beatWeight = Number.isFinite(wVal) && Number.isFinite(gW) && wVal > gW;
  const beatReps   = Number.isFinite(rVal) && Number.isFinite(gR) && rVal > gR && wVal >= gW;

  if (beatWeight || beatReps) {
    const numBadge = row.querySelector('.set-num');
    if (numBadge && !numBadge.classList.contains('ghost-beaten')) {
      numBadge.classList.add('ghost-beaten');
      if (typeof hapTap === 'function') hapTap();
    }
  }
}

function _loadGhostSets(exerciseName) {
  if (!exerciseName) { _ghostSets = []; return; }
  const prev = [...workouts].reverse().find(w => w.exercise.toLowerCase() === exerciseName.toLowerCase());
  _ghostSets = prev ? prev.sets : [];
}

// Stagnation break guard for repeated identical sessions
let _stagnationConfirmed = false;

function _checkStagnation(sets) {
  if (!_ghostSets || !_ghostSets.length || sets.length !== _ghostSets.length) return false;
  return sets.every((s, i) => {
    const g = _ghostSets[i];
    return g && parseFloat(s.weight) === parseFloat(g.weight) && parseInt(s.reps) === parseInt(g.reps);
  });
}

function stagnationBeat() {
  document.getElementById('stagnation-overlay').style.display = 'none';
}

function stagnationSaveAnyway() {
  document.getElementById('stagnation-overlay').style.display = 'none';
  _stagnationConfirmed = true;
  _saveWeightedWorkout(); // retry — gate bypassed
}

function _applyGhostToRow(row, idx) {
  const ghost = _ghostSets[idx];
  if (!ghost) return;
  const repsEl = row.querySelector('.set-reps');
  const weightEl = row.querySelector('.set-weight');
  if (repsEl && !repsEl.value) {
    repsEl.placeholder = ghost.reps;
    repsEl.classList.add('ghost-placeholder');
    repsEl.addEventListener('focus', function () { this.classList.remove('ghost-placeholder'); }, { once: true });
  }
  if (weightEl && !weightEl.value) {
    weightEl.placeholder = ghost.weight;
    weightEl.classList.add('ghost-placeholder');
    weightEl.addEventListener('focus', function () { this.classList.remove('ghost-placeholder'); }, { once: true });
  }

  // Initial delta display
  _updateRowDelta(row, idx);

  // Live update on input — guard against double-attach on re-renders
  const _wEl = row.querySelector('.set-weight');
  const _rEl = row.querySelector('.set-reps');
  [_rEl, _wEl].forEach(inp => {
    if (inp && !inp.dataset.ghostWired) {
      inp.dataset.ghostWired = '1';
      inp.addEventListener('input', () => {
        _updateRowDelta(row, idx);
        _checkAndCelebrateBeat(row, idx);
      });
    }
  });
}

function loadLastSessionSets(exerciseName) {
  const prev = [...workouts].reverse().find(w => w.exercise.toLowerCase() === exerciseName.toLowerCase());
  if (!prev || !prev.sets.length) return;
  // Store ghost data for this exercise
  _ghostSets = prev.sets;
  // Clear existing sets
  document.getElementById('sets-container').innerHTML = '';
  setCount = 0;
  // Re-populate with ghost placeholder rows (not pre-filled values)
  prev.sets.forEach((s, idx) => {
    setCount++;
    _updateSetBadge(setCount);
    const row = document.createElement('div');
    row.className = 'set-row'; row.id = 'set-' + setCount;
    const unit = s.unit || settings.defaultUnit || 'kg';
    row.innerHTML = `
      <div class="set-num" data-type="${s.type || 'normal'}" onclick="cycleSetType(this)" title="Tap to change: Normal → Warmup → Dropset → AMRAP">${setCount}</div>
      <input type="number" min="0" inputmode="numeric" placeholder="${s.reps}" class="set-reps ghost-placeholder">
      <input type="number" min="0" step="0.5" inputmode="decimal" placeholder="${s.weight}" class="set-weight ghost-placeholder">
      <button type="button" class="set-unit-toggle" data-unit="${unit}" onclick="toggleSetUnit(this)">${unit}</button>
      <button class="btn-icon" onclick="removeSet(${setCount})">×</button>
    `;
    document.getElementById('sets-container').appendChild(row);
    // Remove ghost style on focus
    row.querySelectorAll('.ghost-placeholder').forEach(inp => {
      inp.addEventListener('focus', function () { this.classList.remove('ghost-placeholder'); }, { once: true });
    });
    _updateRowDelta(row, idx);
    row.querySelectorAll('input.set-weight, input.set-reps').forEach(inp => {
      inp.addEventListener('input', () => {
        _updateRowDelta(row, idx);
        _checkAndCelebrateBeat(row, idx);
      });
    });
  });
  // Show ghost badge above the sets
  const container = document.getElementById('sets-container');
  const badge = document.createElement('div');
  badge.className = 'ghost-badge';
  badge.textContent = '👻 LAST SESSION — type to overwrite';
  container.insertBefore(badge, container.firstChild);
}

// Exercise autocomplete + last-session auto-fill
function pickExercise(name) {
  const exInput = document.getElementById('exercise-name');
  exInput.value = name;
  closeAutocomplete();
  updateLastSessionHint();
  updatePRPath();
  _loadGhostSets(name);
  // Auto-select muscle from last session if none chosen yet
  if (!selectedMuscle) {
    const prev = [...workouts].reverse().find(w => w.exercise.toLowerCase() === name.toLowerCase());
    if (prev) selectMuscle(prev.muscle);
  }
  // Load last session sets if field is empty
  if (document.querySelectorAll('.set-row').length === 0) {
    loadLastSessionSets(name);
  }
}

function showAutocomplete(query) {
  const ac = document.getElementById('exercise-autocomplete');
  if (!query) { closeAutocomplete(); return; }
  const q = query.toLowerCase();
  // Gather unique exercises with their last-used muscle, sorted by recency
  const seen = new Map();
  [...workouts].reverse().forEach(w => {
    const key = w.exercise.toLowerCase();
    if (!seen.has(key)) seen.set(key, { name: w.exercise, muscle: w.muscle });
  });
  // Also add matching exercises from DB not already in history
  const exerciseCatalog = (typeof _exerciseCatalog === 'function') ? _exerciseCatalog() : (typeof EXERCISE_DB !== 'undefined' ? EXERCISE_DB : []);
  if (Array.isArray(exerciseCatalog)) {
    exerciseCatalog.filter(e => e.n.toLowerCase().includes(q)).forEach(e => {
      const key = e.n.toLowerCase();
      if (!seen.has(key)) seen.set(key, { name: e.n, muscle: e.m });
    });
  }
  const matches = [...seen.values()].filter(e => e.name.toLowerCase().includes(q)).slice(0, 8);
  if (!matches.length) {
    ac.innerHTML = (typeof _exerciseAddCta === 'function')
      ? _exerciseAddCta(query, 'autocomplete')
      : '';
    ac.classList.add('ex-ac-add-mode');
    ac.style.display = ac.innerHTML ? 'block' : 'none';
    return;
  }
  ac.classList.remove('ex-ac-add-mode');
  ac.innerHTML = matches.map(e =>
    `<div class="ex-ac-item" onmousedown="pickExercise('${e.name.replace(/'/g, "\\'")}')">
       <span>${e.name}</span>
       <span class="ac-muscle">${e.muscle.toUpperCase()}</span>
     </div>`
  ).join('');
  ac.style.display = 'block';
}

function closeAutocomplete() {
  const ac = document.getElementById('exercise-autocomplete');
  if (ac) { ac.style.display = 'none'; ac.classList.remove('ex-ac-add-mode'); }
}

// Close the regular suggestions dropdown when tapping outside.
// In add-form mode we NEVER auto-close — the user intentionally opened
// the form and must dismiss it via the × button, submitting, or clearing
// the exercise-name input.
(function () {
  function _outsideTap(e) {
    var ac  = document.getElementById('exercise-autocomplete');
    var inp = document.getElementById('exercise-name');
    if (!ac || ac.style.display === 'none') return;
    // Add-form is open — never close on outside tap
    if (ac.classList.contains('ex-ac-add-mode')) return;
    var t = e.target;
    if (ac.contains(t) || t === inp) return;
    setTimeout(function () {
      if (!ac || ac.style.display === 'none') return;
      if (ac.classList.contains('ex-ac-add-mode')) return;
      ac.style.display = 'none';
    }, 50);
  }
  document.addEventListener('touchstart', _outsideTap, { passive: true });
  document.addEventListener('mousedown',  _outsideTap);
}());

