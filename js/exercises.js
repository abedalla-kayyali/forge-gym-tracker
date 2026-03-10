// FORGE Gym Tracker — Exercise Database + Training Programs
// Auto-extracted from index.html — edit here for future exercise changes.

// ── EXERCISE LIBRARY ──
const EXERCISE_DB = [
  // CHEST
  {n:'Barbell Bench Press',m:'Chest',e:'barbell',t:'Lie flat, grip shoulder-width, lower to chest, drive up explosively'},
  {n:'Dumbbell Bench Press',m:'Chest',e:'dumbbell',t:'Lie flat, dumbbells at chest level, press up and together'},
  {n:'Incline Barbell Press',m:'Chest',e:'barbell',t:'30–45° incline targets upper chest — keep elbows slightly tucked'},
  {n:'Incline Dumbbell Press',m:'Chest',e:'dumbbell',t:'30–45° incline, neutral or pronated grip, full stretch at bottom'},
  {n:'Decline Bench Press',m:'Chest',e:'barbell',t:'Decline 15–30° targets lower chest, keep feet anchored'},
  {n:'Cable Fly',m:'Chest',e:'cable',t:'Arms wide, arc hands together at chest height, feel pec stretch'},
  {n:'Pec Deck / Machine Fly',m:'Chest',e:'machine',t:'Squeeze pecs hard at center, controlled return to stretch'},
  {n:'Push-Up',m:'Chest',e:'bodyweight',t:'Hands shoulder-width, lower chest to floor, full lockout at top'},
  {n:'Dip (Chest)',m:'Chest',e:'bodyweight',t:'Lean forward 30° to target chest more than triceps'},
  {n:'Landmine Press',m:'Chest',e:'barbell',t:'Single-arm press with barbell anchored — great for upper chest'},
  // BACK
  {n:'Barbell Deadlift',m:'Back',e:'barbell',t:'Hip hinge, flat back, bar over mid-foot, drive hips forward at lockout'},
  {n:'Pull-Up',m:'Back',e:'bodyweight',t:'Overhand grip, pull chest to bar, full extension at bottom'},
  {n:'Chin-Up',m:'Back',e:'bodyweight',t:'Underhand grip, elbows drive down and back, more bicep involvement'},
  {n:'Barbell Row',m:'Back',e:'barbell',t:'Hinge at hips, row bar to lower chest, elbows back at 45°'},
  {n:'Dumbbell Row',m:'Back',e:'dumbbell',t:'Knee and hand on bench, row to hip, keep shoulder down'},
  {n:'Seated Cable Row',m:'Back',e:'cable',t:'Sit upright, pull handle to lower abdomen, squeeze shoulder blades'},
  {n:'Lat Pulldown',m:'Back',e:'machine',t:'Wide overhand grip, pull bar to upper chest, lean slightly back'},
  {n:'T-Bar Row',m:'Back',e:'barbell',t:'Straddle the bar, pull to lower chest, keep back flat'},
  {n:'Face Pull',m:'Back',e:'cable',t:'Rope at head height, pull to face with elbows high — great for posture'},
  {n:'Romanian Deadlift',m:'Back',e:'barbell',t:'Hip hinge with soft knees, bar stays close to legs, feel hamstring stretch'},
  // SHOULDERS
  {n:'Barbell Overhead Press',m:'Shoulders',e:'barbell',t:'Press from front rack, bar moves in straight line overhead, lock out'},
  {n:'Dumbbell Shoulder Press',m:'Shoulders',e:'dumbbell',t:'Seated or standing, press overhead from ear level, full lockout'},
  {n:'Lateral Raise',m:'Shoulders',e:'dumbbell',t:'Slight forward lean, arms slightly bent, raise to shoulder height'},
  {n:'Front Raise',m:'Shoulders',e:'dumbbell',t:'Arms straight, raise to shoulder height in front, controlled down'},
  {n:'Arnold Press',m:'Shoulders',e:'dumbbell',t:'Rotate from neutral to pronated as you press — full shoulder activation'},
  {n:'Cable Lateral Raise',m:'Shoulders',e:'cable',t:'Low cable, raise arm to side for constant tension throughout range'},
  {n:'Upright Row',m:'Shoulders',e:'barbell',t:'Narrow grip, pull bar to chin, elbows lead throughout'},
  {n:'Machine Shoulder Press',m:'Shoulders',e:'machine',t:'Seated, press handles overhead, adjust seat for 90° at bottom'},
  {n:'Reverse Pec Deck',m:'Shoulders',e:'machine',t:'Face machine, arms wide — targets rear deltoids and upper back'},
  {n:'Band Pull-Apart',m:'Shoulders',e:'band',t:'Arms extended, pull band apart to chest, squeeze shoulder blades'},
  // BICEPS
  {n:'Barbell Curl',m:'Biceps',e:'barbell',t:'Elbows fixed at sides, curl to shoulder, squeeze hard at top'},
  {n:'Dumbbell Curl',m:'Biceps',e:'dumbbell',t:'Alternate or together — supinate wrist as you curl for full contraction'},
  {n:'Hammer Curl',m:'Biceps',e:'dumbbell',t:'Neutral grip throughout — targets brachialis and brachioradialis'},
  {n:'Preacher Curl',m:'Biceps',e:'barbell',t:'Arm against pad, strict curl, full extension at bottom'},
  {n:'Cable Curl',m:'Biceps',e:'cable',t:'Low pulley, constant tension through full range, no swinging'},
  {n:'Concentration Curl',m:'Biceps',e:'dumbbell',t:'Seated, elbow on inner thigh, curl slowly for peak contraction'},
  {n:'Incline Dumbbell Curl',m:'Biceps',e:'dumbbell',t:'Incline bench, arms hang behind body — great stretch at bottom'},
  // TRICEPS
  {n:'Skull Crusher',m:'Triceps',e:'barbell',t:'Bar to forehead, elbows fixed, extend to full lockout'},
  {n:'Tricep Pushdown',m:'Triceps',e:'cable',t:'Bar or rope, extend arms fully, elbows pinned at sides'},
  {n:'Overhead Tricep Extension',m:'Triceps',e:'dumbbell',t:'Arm behind head, extend fully — great long head stretch'},
  {n:'Close-Grip Bench Press',m:'Triceps',e:'barbell',t:'Narrow grip, lower to sternum, elbows tucked throughout'},
  {n:'Dip (Tricep)',m:'Triceps',e:'bodyweight',t:'Stay upright to target triceps — lower until upper arm is parallel'},
  {n:'Cable Overhead Extension',m:'Triceps',e:'cable',t:'Rope behind head, extend forward and down, squeeze at lockout'},
  // CORE
  {n:'Plank',m:'Core',e:'bodyweight',t:'Forearms on floor, straight line from head to heels, squeeze everything'},
  {n:'Crunch',m:'Core',e:'bodyweight',t:'Hands behind head, curl shoulders toward knees, don\'t pull neck'},
  {n:'Leg Raise',m:'Core',e:'bodyweight',t:'Lying flat, raise straight legs to 90°, lower slowly — don\'t arch back'},
  {n:'Russian Twist',m:'Core',e:'bodyweight',t:'Seated, lean back 45°, rotate torso side to side — add weight plate'},
  {n:'Ab Wheel Rollout',m:'Core',e:'bodyweight',t:'Kneel, roll forward until parallel with floor, pull back with abs'},
  {n:'Cable Crunch',m:'Core',e:'cable',t:'Kneel, pull rope to elbows, crunch down — focus on abs not hips'},
  {n:'Hanging Leg Raise',m:'Core',e:'bodyweight',t:'Hang from bar, raise legs to parallel or higher, controlled descent'},
  {n:'Pallof Press',m:'Core',e:'cable',t:'Stand sideways to cable, press straight out — resist rotation'},
  {n:'Dead Bug',m:'Core',e:'bodyweight',t:'Lie on back, extend opposite arm and leg while keeping low back flat'},
  {n:'Hollow Body Hold',m:'Core',e:'bodyweight',t:'Lower back pressed to floor, arms and legs extended — hold position'},
  // LEGS
  {n:'Barbell Back Squat',m:'Legs',e:'barbell',t:'Bar on upper back, squat below parallel, drive knees out over toes'},
  {n:'Front Squat',m:'Legs',e:'barbell',t:'Bar on front delts, upright torso — great quad development'},
  {n:'Goblet Squat',m:'Legs',e:'dumbbell',t:'Hold dumbbell at chest, squat deep, elbows track inside knees'},
  {n:'Leg Press',m:'Legs',e:'machine',t:'Feet shoulder-width, lower to 90°, never lock knees at top'},
  {n:'Hack Squat',m:'Legs',e:'machine',t:'Shoulder pads, feet forward on plate, squat deep for quad focus'},
  {n:'Bulgarian Split Squat',m:'Legs',e:'dumbbell',t:'Rear foot elevated on bench, lower front knee, keep torso upright'},
  {n:'Leg Extension',m:'Legs',e:'machine',t:'Extend legs fully, pause and squeeze quads at top, lower slowly'},
  {n:'Leg Curl (Lying)',m:'Legs',e:'machine',t:'Lie prone, curl heels toward glutes, pause at top contraction'},
  {n:'Leg Curl (Seated)',m:'Legs',e:'machine',t:'Seated version targets hamstrings with different stretch profile'},
  {n:'Calf Raise (Standing)',m:'Calves',e:'machine',t:'Full ROM — deep stretch at bottom, full plantarflexion at top'},
  {n:'Calf Raise (Seated)',m:'Calves',e:'machine',t:'Seated version targets soleus (deeper calf) more than gastrocnemius'},
  {n:'Lunges',m:'Legs',e:'dumbbell',t:'Step forward, lower back knee toward floor, push through front heel'},
  {n:'Walking Lunges',m:'Legs',e:'dumbbell',t:'Continuous forward lunges — great for coordination and quad burn'},
  // GLUTES
  {n:'Hip Thrust',m:'Glutes',e:'barbell',t:'Shoulders on bench, drive hips up, squeeze glutes hard at top'},
  {n:'Romanian Deadlift (DB)',m:'Glutes',e:'dumbbell',t:'Hip hinge, feel hamstring stretch, drive hips forward to stand'},
  {n:'Glute Bridge',m:'Glutes',e:'bodyweight',t:'Lie on back, feet flat, drive hips up squeezing glutes — add weight'},
  {n:'Cable Kickback',m:'Glutes',e:'cable',t:'Standing or on all fours, kick leg back with full hip extension'},
  {n:'Sumo Deadlift',m:'Glutes',e:'barbell',t:'Wide stance, toes out 45°, grip inside legs — great glute/adductor load'},
  {n:'Step-Up',m:'Glutes',e:'dumbbell',t:'Step onto bench or box, drive through heel, fully extend hip at top'},
  {n:'Abductor Machine',m:'Glutes',e:'machine',t:'Seated, push knees out against pads — targets glute med'},
  {n:'Donkey Kick',m:'Glutes',e:'bodyweight',t:'On all fours, kick heel toward ceiling — squeeze glute at top'},
  // TRAPS / UPPER BACK
  {n:'Barbell Shrug',m:'Traps',e:'barbell',t:'Hold bar at thighs, shrug shoulders straight up — no rolling'},
  {n:'Dumbbell Shrug',m:'Traps',e:'dumbbell',t:'Dumbbells at sides, shrug up and hold 1 second at top'},
  {n:'Behind-the-Back Shrug',m:'Traps',e:'barbell',t:'Bar behind glutes, shrug up — unique rear trap activation'},
  // LOWER BACK
  {n:'Back Extension',m:'Lower Back',e:'machine',t:'45° or flat bench, hinge at hips, extend to neutral spine'},
  {n:'Good Morning',m:'Lower Back',e:'barbell',t:'Bar on upper back, hinge forward keeping back flat, drive hips'},
  {n:'Hyperextension',m:'Lower Back',e:'bodyweight',t:'On GHD or 45° bench, extend until body is straight — don\'t hyperextend'},
  // FOREARMS
  {n:'Wrist Curl',m:'Forearms',e:'barbell',t:'Forearms on thighs, wrist curls with full range of motion'},
  {n:'Reverse Wrist Curl',m:'Forearms',e:'barbell',t:'Overhand grip, curl wrists up — targets extensors'},
  {n:'Farmer\'s Carry',m:'Forearms',e:'dumbbell',t:'Heavy dumbbells at sides, walk with upright posture — grip killer'},
];

const _EX_LIB_MUSCLES = ['All','Chest','Back','Shoulders','Biceps','Triceps','Core','Legs','Glutes','Calves','Traps','Lower Back','Forearms'];
let _exLibMuscle = 'All';

function openExLib() {
  _exLibMuscle = 'All';
  const srch = document.getElementById('ex-lib-search');
  if (srch) srch.value = '';
  renderExLibFilters();
  renderExLib();
  document.getElementById('ex-lib-modal').classList.add('open');
  setTimeout(() => { if (srch) srch.focus(); }, 300);
}

function closeExLib() {
  document.getElementById('ex-lib-modal').classList.remove('open');
}

function renderExLibFilters() {
  const fil = document.getElementById('ex-lib-filters');
  if (!fil) return;
  fil.innerHTML = _EX_LIB_MUSCLES.map(m =>
    `<button class="ex-lib-filter-pill${_exLibMuscle===m?' active':''}" onclick="_exLibMuscle='${m}';renderExLibFilters();renderExLib()">${m}</button>`
  ).join('');
}

function renderExLib() {
  const q = (document.getElementById('ex-lib-search')?.value || '').toLowerCase();
  let results = EXERCISE_DB;
  if (_exLibMuscle !== 'All') results = results.filter(e => e.m === _exLibMuscle);
  if (q) results = results.filter(e => e.n.toLowerCase().includes(q) || e.e.toLowerCase().includes(q) || e.m.toLowerCase().includes(q));
  const list = document.getElementById('ex-lib-list');
  if (!list) return;
  if (!results.length) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-family:\'DM Mono\',monospace;font-size:12px;">No exercises found</div>';
    return;
  }
  list.innerHTML = results.map(e =>
    `<div class="ex-lib-item" onclick="pickExLibExercise('${e.n.replace(/'/g,"\\'")}','${e.m}')">
      <div class="ex-lib-item-name">${e.n}</div>
      <div class="ex-lib-item-tags">
        <span class="ex-lib-tag">${e.m}</span>
        <span class="ex-lib-tag ex-lib-tag-eq">${e.e}</span>
      </div>
      <div class="ex-lib-item-tip">${e.t}</div>
    </div>`
  ).join('');
}

function pickExLibExercise(name, muscle) {
  const exInput = document.getElementById('exercise-name');
  if (exInput) exInput.value = name;
  closeExLib();
  closeAutocomplete();
  if (muscle && typeof selectMuscle === 'function') selectMuscle(muscle);
  if (typeof updateLastSessionHint === 'function') updateLastSessionHint();
  if (typeof updatePRPath === 'function') updatePRPath();
  if (typeof _loadGhostSets === 'function') _loadGhostSets(name);
  if (document.querySelectorAll('.set-row').length === 0 && typeof loadLastSessionSets === 'function') {
    loadLastSessionSets(name);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire SVG zone clicks → open overlay
  document.querySelectorAll('.body-zone').forEach(zone => {
    zone.addEventListener('click', () => selectMuscle(zone.dataset.muscle, false));
  });

  // Swipe-down to close muscle overlay
  const overlay = document.getElementById('muscle-overlay');
  let touchStartY = 0;
  overlay.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, {passive:true});
  overlay.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 0) overlay.style.transform = 'translateY(' + Math.min(dy * 0.5, 120) + 'px)';
  }, {passive:true});
  overlay.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    overlay.style.transform = '';
    if (dy > 80) closeMuscleOverlay();
  }, {passive:true});

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    // Close in priority order: confirm modal, muscle overlay, rest-fab panel, template modal, any open overlay
    const confirmOverlay = document.getElementById('confirm-modal');
    if (confirmOverlay && confirmOverlay.classList.contains('open')) { hideConfirm(); return; }
    const restPanel = document.getElementById('rest-fab-panel');
    if (restPanel && restPanel.classList.contains('open')) { restPanel.classList.remove('open'); return; }
    const templateModal = document.getElementById('template-modal');
    if (templateModal && templateModal.classList.contains('open')) { templateModal.classList.remove('open'); return; }
    // Close any other open modal overlays
    const openModal = document.querySelector('.modal-overlay.open, .modal.open');
    if (openModal) { openModal.classList.remove('open'); return; }
    // Fallback: close muscle overlay
    closeMuscleOverlay();
  });

  // Exercise name input
  const exInput = document.getElementById('exercise-name');
  if (exInput) {
    exInput.addEventListener('input', () => {
      const name = exInput.value.trim();
      showAutocomplete(name);
      updateLastSessionHint();
    });
    exInput.addEventListener('focus', () => {
      const name = exInput.value.trim();
      if (name) showAutocomplete(name);
    });
    exInput.addEventListener('blur', () => {
      // Small delay so mousedown on item fires first
      setTimeout(() => {
        closeAutocomplete();
        const name = exInput.value.trim();
        if (name) {
          const hasRecord = workouts.some(w => w.exercise.toLowerCase() === name.toLowerCase());
          if (hasRecord && document.querySelectorAll('.set-row').length === 0) {
            loadLastSessionSets(name);
          }
        }
      }, 180);
    });
    exInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAutocomplete();
    });
  }

  // ── New feature initialisation ──
  // Step tracker: render panel (functions defined later in script, use setTimeout to ensure they're ready)
  setTimeout(() => {
    if (typeof renderStepsPanel === 'function') renderStepsPanel();
    if (typeof applyLayout      === 'function') applyLayout();
    if (typeof _updateHdrStreak  === 'function') _updateHdrStreak();
    if (typeof _updateHdrStats   === 'function') _updateHdrStats();
    if (typeof _hdrRestRender    === 'function') _hdrRestRender();
    if (typeof renderMissions    === 'function') { try { renderMissions(); } catch(e) { console.warn('[FORGE] renderMissions init:', e); } }
    if (typeof _updateWaterGoal  === 'function') _updateWaterGoal();
    if (typeof _updateHdrWater   === 'function') _updateHdrWater();
    if (typeof _updateHdrSteps   === 'function') _updateHdrSteps();
    if (typeof _updateHdrCoach   === 'function') _updateHdrCoach();
    if (typeof _updateMascot     === 'function') _updateMascot();
    if (typeof renderCoach       === 'function') renderCoach();
    if (typeof _updateMuscleChipColors === 'function') _updateMuscleChipColors();
    if (typeof _applyRankSkin    === 'function') {
      const _initXP = (typeof calcXP === 'function') ? calcXP() : 0;
      const _initLvl = (typeof getCurrentLevel === 'function') ? getCurrentLevel(_initXP) : null;
      if (_initLvl) _applyRankSkin(_initLvl.name);
    }
  }, 0);
});

// ═══════════════════════════════════════════
//  SETS
// ═══════════════════════════════════════════
function _updateSetBadge(n) {
  const el = document.getElementById('set-count-badge');
  if (!el) return;
  const _sAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  el.textContent = n + (_sAr ? ' مجموعات' : ' SETS');
}
function addSet() {
  setCount++;
  _updateSetBadge(setCount);
  const prevRow = document.querySelector('.set-row:last-child');
  let prevReps = '', prevWeight = '', prevUnit = settings.defaultUnit || 'kg';
  if (prevRow) {
    prevReps   = prevRow.querySelector('.set-reps').value;
    prevWeight = prevRow.querySelector('.set-weight').value;
    prevUnit   = prevRow.querySelector('.set-unit-toggle')?.dataset?.unit || prevRow.querySelector('.set-unit')?.value || prevUnit;
  }
  const row = document.createElement('div');
  row.className = 'set-row'; row.id = 'set-' + setCount;
  row.innerHTML = `
    <div class="set-num" data-type="normal" onclick="cycleSetType(this)" title="Tap to change: Normal → Warmup → Dropset → AMRAP">${setCount}</div>
    <div class="stepper">
      <button class="step-dn" type="button" onclick="stepInput(this,-1,'reps')">−</button>
      <input type="number" min="0" inputmode="numeric" placeholder="10" class="set-reps" value="${prevReps}">
      <button class="step-up" type="button" onclick="stepInput(this,1,'reps')">+</button>
    </div>
    <div class="stepper">
      <button class="step-dn" type="button" onclick="stepInput(this,-1,'weight')">−</button>
      <input type="number" min="0" step="0.5" inputmode="decimal" placeholder="60" class="set-weight" value="${prevWeight}">
      <button class="step-up" type="button" onclick="stepInput(this,1,'weight')">+</button>
    </div>
    <button type="button" class="set-unit-toggle" data-unit="${prevUnit}" onclick="toggleSetUnit(this)">${prevUnit}</button>
    <button class="set-rpe-btn" data-rpe="" onclick="cycleRPE(this)" title="RPE (Rate of Perceived Exertion)">—</button>
    <button class="btn-icon" onclick="removeSet(${setCount})">×</button>
  `;
  document.getElementById('sets-container').appendChild(row);
  // Apply ghost placeholder if no previous row value was copied
  if (!prevReps && !prevWeight) {
    _applyGhostToRow(row, setCount - 1);
  }
  if (!('ontouchstart' in window)) row.querySelector('.set-reps').focus();
  if (typeof sndSetLog === 'function') sndSetLog();
  if (typeof hapSetLog === 'function') hapSetLog();
  updateRepeatBtn();
}

function removeSet(id) {
  const el = document.getElementById('set-' + id);
  if (el) el.remove();
  const rows = document.querySelectorAll('.set-row');
  setCount = rows.length;
  rows.forEach((r,i) => r.querySelector('.set-num').textContent = i+1);
  _updateSetBadge(setCount);
  updateRepeatBtn();
}

function cycleSetType(el) {
  const types = ['normal','warmup','dropset','amrap'];
  const cur = el.getAttribute('data-type') || 'normal';
  const next = types[(types.indexOf(cur) + 1) % types.length];
  el.setAttribute('data-type', next);
}

function stepInput(btn, delta, type) {
  const input = btn.parentElement.querySelector('input');
  if (!input) return;
  const current = parseFloat(input.value) || 0;
  if (type === 'weight') {
    const row = btn.closest('.set-row');
    const unit = row?.querySelector('.set-unit-toggle')?.dataset?.unit || row?.querySelector('.set-unit')?.value || 'kg';
    delta = Math.sign(delta) * (unit === 'lbs' ? 5 : 2.5);
  }
  const min = parseFloat(input.min) ?? 0;
  input.value = Math.max(min, current + delta);
}

function toggleSetUnit(btn) {
  const newUnit = btn.dataset.unit === 'kg' ? 'lbs' : 'kg';
  btn.dataset.unit = newUnit;
  btn.textContent = newUnit;
}

// ─── Numpad Picker ────────────────────────────────────────────
let _wpTarget   = null;  // the <input> we'll write back to
let _wpValue    = '';    // current string being built
let _wpIsWeight = false;

function openWheelPicker(input) {
  // Only show on touch devices
  if (!('ontouchstart' in window)) return false;
  _wpTarget   = input;
  _wpIsWeight = input.classList.contains('set-weight');
  const isReps  = input.classList.contains('set-reps');
  const isBwVal = input.classList.contains('bw-val-input');
  if (!_wpIsWeight && !isReps && !isBwVal) return false;

  // Seed display with current input value (strip trailing zeroes)
  const raw = parseFloat(input.value);
  _wpValue = (raw > 0) ? String(raw) : '';

  const row  = input.closest('.set-row');
  const unit = row?.querySelector('.set-unit-toggle')?.dataset?.unit
             || row?.querySelector('.set-unit')?.value
             || (typeof settings !== 'undefined' && settings?.defaultUnit)
             || 'kg';

  const bwType = (typeof _currentBwType !== 'undefined') ? _currentBwType : 'reps';
  const isHold = isBwVal && bwType === 'hold';

  if (_wpIsWeight) {
    document.getElementById('wp-title').textContent        = 'WEIGHT';
    document.getElementById('wp-display-unit').textContent = unit.toUpperCase();
  } else if (isHold) {
    document.getElementById('wp-title').textContent        = 'SECONDS';
    document.getElementById('wp-display-unit').textContent = '';
  } else {
    document.getElementById('wp-title').textContent        = 'REPS';
    document.getElementById('wp-display-unit').textContent = '';
  }

  // Decimal key only visible for weight
  document.getElementById('wp-key-dec').style.visibility = _wpIsWeight ? 'visible' : 'hidden';

  // Build preset chips
  const presetsEl = document.getElementById('wp-presets');
  if (_wpIsWeight) {
    const cur = parseFloat(input.value) || 0;
    presetsEl.innerHTML = [2.5,5,10,20].map(d =>
      `<button class="wp-preset wp-preset-delta" onclick="wpPresetDelta(${d},${cur})">+${d}</button>`
    ).join('');
  } else if (isHold) {
    presetsEl.innerHTML = [10,15,20,30,45,60].map(v =>
      `<button class="wp-preset" onclick="wpPreset(${v})">${v}s</button>`
    ).join('');
  } else {
    presetsEl.innerHTML = [5,6,8,10,12,15,20,25,30].map(v =>
      `<button class="wp-preset" onclick="wpPreset(${v})">${v}</button>`
    ).join('');
  }

  _wpRefreshDisplay();
  // Dismiss any visible toast so it can't intercept button taps
  if (typeof dismissToast === 'function') dismissToast();
  document.getElementById('wheel-picker-overlay').classList.add('open');
  return true;
}

function _wpRefreshDisplay() {
  const el = document.getElementById('wp-display-val');
  if (el) el.textContent = _wpValue || '0';
}

function wpKey(k) {
  if (k === 'del') {
    if (!_wpValue) return;
    _wpValue = _wpValue.slice(0, -1);
  } else if (k === '.') {
    if (!_wpIsWeight || _wpValue.includes('.')) return;
    _wpValue = (_wpValue || '0') + '.';
  } else {
    const [intPart] = (_wpValue || '').split('.');
    if (intPart.length >= 4) return;
    if (_wpValue === '0') _wpValue = k;
    else _wpValue += k;
  }
  _wpRefreshDisplay();
  // Haptic feedback
  if (typeof hapTap === 'function') hapTap();
  // Voice feedback — speak the current display value
  _wpSpeak(_wpValue || '0');
}

/* Speak via Web Speech API (respects soundOn) */
function _wpSpeak(text) {
  if (typeof soundOn !== 'undefined' && !soundOn) return;
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.volume = 0.9;
    utt.rate   = 1.3;
    utt.pitch  = 1;
    speechSynthesis.speak(utt);
  } catch (e) {}
}

function wpPreset(v) {
  _wpValue = String(v);
  _wpRefreshDisplay();
}

function wpPresetDelta(delta, base) {
  const result = (parseFloat(base) || 0) + delta;
  // Round to 1 decimal to avoid float noise
  _wpValue = String(Math.round(result * 10) / 10);
  _wpRefreshDisplay();
}

function closeWheelPicker() {
  document.getElementById('wheel-picker-overlay').classList.remove('open');
  _wpTarget = null;
}

function confirmWheelPicker() {
  if (!_wpTarget) { closeWheelPicker(); return; }
  const val = parseFloat(_wpValue) || 0;
  _wpTarget.value = _wpIsWeight ? val : Math.round(val);
  if (typeof hapSetLog === 'function') hapSetLog();
  _wpSpeak('confirmed');
  closeWheelPicker();
}

// Numpad key delegation — pointerdown fires before Android gesture detection
// and before any overlay element can intercept the event.
document.addEventListener('DOMContentLoaded', () => {
  const numpad = document.getElementById('wp-numpad');
  if (numpad) {
    numpad.addEventListener('pointerdown', e => {
      const btn = e.target.closest('[data-key]');
      if (!btn) return;
      e.preventDefault();  // block synthetic click / gesture detection
      e.stopPropagation();
      wpKey(btn.dataset.key);
      // visual active flash
      btn.classList.add('wp-active');
      setTimeout(() => btn.classList.remove('wp-active'), 120);
    }, { passive: false });
  }
});

// Hook inputs — tap-detection prevents picker opening during scroll gestures
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sets-container');
  if (!container) return;
  if (!('ontouchstart' in window)) return; // desktop: normal keyboard

  let _tapY = 0, _tapX = 0;

  // Record touch-start position
  container.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _tapY = e.touches[0].clientY;
      _tapX = e.touches[0].clientX;
    }
  }, { passive: true });

  // Only open picker when touch ended close to where it started (tap, not scroll)
  container.addEventListener('touchend', e => {
    const inp = e.target.closest('.set-weight, .set-reps');
    if (!inp) return;
    const dy = Math.abs(e.changedTouches[0].clientY - _tapY);
    const dx = Math.abs(e.changedTouches[0].clientX - _tapX);
    if (dy > 8 || dx > 8) return; // scroll/swipe — ignore
    e.preventDefault(); // block keyboard from appearing
    inp.blur();
    openWheelPicker(inp);
  }, { passive: false });
});

function updateRepeatBtn() {
  const btn = document.getElementById('btn-repeat-last');
  if (!btn) return;
  const hasSets = document.querySelectorAll('.set-row').length > 0;
  btn.style.display = (workouts.length > 0 && !hasSets) ? 'flex' : 'none';
}

function repeatLastWorkout() {
  if (!workouts.length) return;
  const last = workouts[workouts.length - 1];
  selectMuscle(last.muscle);
  document.getElementById('exercise-name').value = last.exercise;
  updateLastSessionHint();
  document.getElementById('sets-container').innerHTML = '';
  setCount = 0;
  _updateSetBadge(0);
  if (last.sets && last.sets.length) {
    last.sets.forEach(s => {
      addSet();
      const row = document.querySelector('.set-row:last-child');
      if (!row) return;
      row.querySelector('.set-reps').value = s.reps;
      row.querySelector('.set-weight').value = s.weight;
      const unitSel = row.querySelector('.set-unit');
      if (unitSel && s.unit) unitSel.value = s.unit;
      if (s.type && s.type !== 'normal') {
        const numEl = row.querySelector('.set-num');
        if (numEl) numEl.setAttribute('data-type', s.type);
      }
    });
  }
  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تحميل آخر تمرين!' : 'Last workout loaded', 'success');
  updateRepeatBtn();
}

// saveWorkout() is defined in the BODYWEIGHT/STEPS block below — it dispatches
// to _saveWeightedWorkout() or saveBwWorkout() based on current mode.

// (updateStatBar defined later with full gamification support)

function calcStreak() {
  if (!workouts.length) return 0;
  const days = [...new Set(workouts.map(w => new Date(w.date).toDateString()))].sort((a,b) => new Date(b)-new Date(a));
  let streak = 0, d = new Date();
  for (const day of days) {
    if (new Date(day).toDateString() === d.toDateString()) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

// ═══════════════════════════════════════════
//  BODY WEIGHT
// ═══════════════════════════════════════════
function logBodyWeight() {
  const val  = parseFloat(document.getElementById('bw-input').value);
  const unit = document.getElementById('bw-unit').value;
  if (!val || val < 20 || val > 500) { showToast('Enter a valid weight!'); return; }
  bodyWeight.push({ date: new Date().toISOString(), weight: val, unit });
  save();
  document.getElementById('bw-input').value = '';
  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تسجيل وزن الجسم!' : 'Body weight logged!');
  renderBWChart();
  renderBWHistory();
}

function renderBWChart() {
  if (bwChrt) bwChrt.destroy();
  const ctx  = document.getElementById('bw-chart').getContext('2d');
  const data = [...bodyWeight].slice(-30);
  if (!data.length) return;
  const grad = ctx.createLinearGradient(0,0,0,180);
  grad.addColorStop(0,'rgba(57,255,143,.25)'); grad.addColorStop(1,'rgba(57,255,143,0)');
  bwChrt = new Chart(ctx, {
    type:'line',
    data:{
      labels: data.map(d => new Date(d.date).toLocaleDateString('en-GB',{month:'short',day:'numeric'})),
      datasets:[{
        label:'Body Weight', data: data.map(d => d.weight),
        borderColor:'#39ff8f', borderWidth:2, backgroundColor:grad,
        fill:true, tension:.4, pointBackgroundColor:'#39ff8f', pointRadius:4, pointHoverRadius:7
      }]
    },
    options: mkChartOpts()
  });
}

function renderBWHistory() {
  const list = [...bodyWeight].reverse().slice(0,15);
  const el = document.getElementById('bw-history-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="empty-title">${t('bcomp.noEntries')}</div></div>`;
    return;
  }
  el.innerHTML = '<div style="padding:4px 0;">' + list.map((e,i) => {
    const prev = list[i+1];
    let dc = 'same', dt = '';
    if (prev) {
      const diff = (e.weight - prev.weight).toFixed(1);
      if (diff > 0) { dc = 'up'; dt = '+' + diff; }
      else if (diff < 0) { dc = 'down'; dt = diff; }
      else { dt = '—'; }
    }
    const bfStr = e.bodyFat    ? '<span style="color:#f39c12;"> · ' + e.bodyFat + '% BF</span>' : '';
    const mmStr = e.muscleMass ? '<span style="color:var(--green);"> · ' + e.muscleMass + 'kg MM</span>' : '';
    return '<div class="bw-row">'
      + '<div class="bw-date">' + new Date(e.date).toLocaleDateString('en-GB',{month:'short',day:'numeric'}) + '</div>'
      + '<div class="bw-val" style="flex:1;">' + e.weight + ' <span style="font-family:\'DM Mono\';font-size:10px;color:var(--text3);">' + e.unit + '</span>' + bfStr + mmStr + '</div>'
      + (prev ? '<div class="bw-delta ' + dc + '">' + dt + '</div>' : '')
      + '</div>';
  }).join('') + '</div>';
}

// ═══════════════════════════════════════════
//  WATER TRACKER
// ═══════════════════════════════════════════
function initWater() {
  const grid = document.getElementById('water-grid');
  if (!grid) return;
  const goal = _waterGoalCups || 8;
  grid.innerHTML = '';
  // Adjust grid columns to match goal
  grid.style.gridTemplateColumns = `repeat(${Math.min(goal,8)},1fr)`;
  for (let i = 0; i < goal; i++) {
    const cup = document.createElement('div');
    cup.className = 'water-cup' + (waterToday.includes(i) ? ' filled' : '');
    cup.onclick = () => toggleWater(i);
    grid.appendChild(cup);
  }
  const waterL = (goal * 0.25).toFixed(1);
  const badge = document.getElementById('water-badge');
  if (badge) badge.textContent = waterToday.length + ' / ' + goal + ' cups  (' + waterL + 'L goal)';
}

function toggleWater(i) {
  const goal = _waterGoalCups || 8;
  const wasAtGoal = waterToday.length >= goal;
  if (waterToday.includes(i)) waterToday = waterToday.filter(x => x !== i);
  else waterToday.push(i);
  save(); initWater();
  if (typeof _updateHdrWater === 'function') _updateHdrWater();
  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';
  const waterL = (goal * 0.25).toFixed(1);
  if (!wasAtGoal && waterToday.length >= goal) {
    _waterCelebration(waterL, isAr);
  }
}

// ═══════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════
// SVG icons that inherit currentColor (theme-aware)
const _SVG_PUSH = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M6 12h12"/><circle cx="6" cy="4" r="1.5"/><circle cx="18" cy="4" r="1.5"/><circle cx="6" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>`;
const _SVG_PULL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>`;
const _SVG_LEGS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c0 0 1 2 1 5s-2 6-2 9c0 1.5.5 3 2 4"/><path d="M16 3c0 0-1 2-1 5s2 6 2 9c0 1.5-.5 3-2 4"/><path d="M9 16c1 1.5 3 2 5 1"/></svg>`;
const DEFAULT_TEMPLATES = [
  {id:'t1', name:'Push Day', muscle:'Chest', exercises:'Bench Press, Incline DB Press, Cable Fly', icon:_SVG_PUSH},
  {id:'t2', name:'Pull Day', muscle:'Back',  exercises:'Deadlift, Bent Row, Lat Pulldown',         icon:_SVG_PULL},
  {id:'t3', name:'Leg Day',  muscle:'Legs',  exercises:'Squat, Romanian DL, Leg Press',            icon:_SVG_LEGS}
];

function renderTemplates() {
  const all = [...DEFAULT_TEMPLATES, ...templates];
  const list = document.getElementById('template-list');
  if (!list) return;
  list.innerHTML = all.map(t => `
    <button class="template-btn" onclick="loadTemplate('${t.id}','${t.muscle}','${t.exercises.split(',')[0].trim()}')">
      <div class="template-icon">${t.icon}</div>
      <div>
        <div class="template-name">${t.name}</div>
        <div class="template-sub">${t.exercises}</div>
      </div>
    </button>`).join('');
  renderTemplateStrip();
}

function renderTemplateStrip() {
  const wrap = document.getElementById('template-strip-wrap');
  const strip = document.getElementById('template-strip');
  if (!wrap || !strip) return;
  const all = [...DEFAULT_TEMPLATES, ...templates];
  if (!all.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  strip.innerHTML = all.map(t => {
    const firstEx = t.exercises.split(',')[0].trim();
    return `<button class="template-strip-pill" onclick="loadTemplate('${t.id}','${t.muscle}','${firstEx}')" title="${t.exercises}">
      <span class="template-strip-icon">${t.icon}</span>${t.name}
    </button>`;
  }).join('');
}

function loadTemplate(id, muscle, exercise) {
  const tmpl = [...DEFAULT_TEMPLATES, ...templates].find(t => t.id === id);
  if (!tmpl) return;
  selectMuscle(tmpl.muscle);
  document.getElementById('exercise-name').value = exercise;
  updateLastSessionHint();
  if (document.querySelectorAll('.set-row').length === 0) loadLastSessionSets(exercise);
  showToast(typeof t==='function' && currentLang==='ar' ? 'تم تحميل القالب!' : 'Template loaded!');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════
//  TRAINING PROGRAMS (PPL / 5/3/1 / 5×5)
// ═══════════════════════════════════════════
const TRAINING_PROGRAMS = [
  {
    id:'ppl', name:'Push / Pull / Legs', short:'PPL',
    desc:'6-day split · hypertrophy focus', color:'#e74c3c',
    days:[
      {label:'Push A',  muscle:'Chest',     exs:['Barbell Bench Press','Incline Barbell Press','Cable Fly'],        note:'3-4 × 8-12'},
      {label:'Pull A',  muscle:'Back',      exs:['Pull-Up','Barbell Row','Face Pull'],                             note:'3-4 × 8-12'},
      {label:'Legs A',  muscle:'Legs',      exs:['Barbell Back Squat','Leg Press','Leg Extension'],                note:'3-4 × 10-15'},
      {label:'Push B',  muscle:'Shoulders', exs:['Barbell Overhead Press','Lateral Raise','Dip (Chest)'],         note:'3-4 × 8-12'},
      {label:'Pull B',  muscle:'Back',      exs:['Barbell Deadlift','Lat Pulldown','Barbell Curl'],               note:'4 × 6-10'},
      {label:'Legs B',  muscle:'Legs',      exs:['Barbell Back Squat','Leg Curl (Lying)','Bulgarian Split Squat'],note:'3-4 × 10-15'},
      {label:'Rest',    muscle:null,        exs:[],                                                                note:'Active recovery'},
    ]
  },
  {
    id:'531', name:'Wendler 5/3/1', short:'5/3/1',
    desc:'4-day strength · progressive overload', color:'#e67e22',
    days:[
      {label:'Squat',    muscle:'Legs',      exs:['Barbell Back Squat','Leg Press','Leg Curl (Lying)'],          note:'5/3/1 + 5×10 FSL'},
      {label:'Bench',    muscle:'Chest',     exs:['Barbell Bench Press','Dumbbell Bench Press','Skull Crusher'],  note:'5/3/1 + 5×10 FSL'},
      {label:'Rest',     muscle:null,        exs:[],                                                              note:'Recovery'},
      {label:'Deadlift', muscle:'Back',      exs:['Barbell Deadlift','Barbell Row','Lat Pulldown'],             note:'5/3/1 (1×5 DL)'},
      {label:'OHP',      muscle:'Shoulders', exs:['Barbell Overhead Press','Lateral Raise','Barbell Curl'],     note:'5/3/1 + 5×10 FSL'},
      {label:'Rest',     muscle:null,        exs:[],                                                             note:'Recovery'},
      {label:'Rest',     muscle:null,        exs:[],                                                             note:'Recovery'},
    ]
  },
  {
    id:'sl5x5', name:'Stronglifts 5×5', short:'5×5',
    desc:'3-day full-body · beginner strength', color:'#2ecc71',
    days:[
      {label:'Workout A', muscle:'Chest', exs:['Barbell Back Squat','Barbell Bench Press','Barbell Row'],         note:'5 × 5 · +2.5kg/session'},
      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},
      {label:'Workout B', muscle:'Back', exs:['Barbell Back Squat','Barbell Overhead Press','Barbell Deadlift'], note:'5 × 5 · DL 1×5'},
      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},
      {label:'Workout A', muscle:'Chest',exs:['Barbell Back Squat','Barbell Bench Press','Barbell Row'],          note:'5 × 5 · +2.5kg/session'},
      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},
      {label:'Rest',      muscle:null,   exs:[],                                                                   note:'Rest'},
    ]
  }
];

// ── B1: RPE cycle function ──────────────────────────────────────
function cycleRPE(btn) {
  const vals = ['', '6', '7', '7.5', '8', '8.5', '9', '9.5', '10', 'F'];
  const cur = btn.dataset.rpe || '';
  const next = vals[(vals.indexOf(cur) + 1) % vals.length];
  btn.dataset.rpe = next;
  btn.textContent = next || '—';
  btn.classList.toggle('rpe-active', !!next);
}

// ── B2: Exercise swap alternatives ─────────────────────────────
const EXERCISE_SWAPS = {
  // CHEST
  'Barbell Bench Press':   ['Dumbbell Bench Press','Machine Chest Press','Push-Up','Dip (Chest)','Landmine Press'],
  'Dumbbell Bench Press':  ['Barbell Bench Press','Cable Fly','Pec Deck / Machine Fly','Push-Up'],
  'Incline Barbell Press': ['Incline Dumbbell Press','Cable Fly','Push-Up','Landmine Press'],
  'Incline Dumbbell Press':['Incline Barbell Press','Cable Fly','Pec Deck / Machine Fly'],
  'Push-Up':               ['Dumbbell Bench Press','Barbell Bench Press','Dip (Chest)','Cable Fly'],
  'Dip (Chest)':           ['Push-Up','Dumbbell Bench Press','Pec Deck / Machine Fly'],
  'Cable Fly':             ['Pec Deck / Machine Fly','Dumbbell Bench Press','Push-Up'],
  // BACK
  'Barbell Deadlift':      ['Romanian Deadlift','Trap Bar Deadlift','Dumbbell Row','Seated Cable Row'],
  'Pull-Up':               ['Lat Pulldown','Assisted Pull-Up','Chin-Up','Seated Cable Row'],
  'Chin-Up':               ['Pull-Up','Lat Pulldown','Dumbbell Row'],
  'Barbell Row':           ['Dumbbell Row','Seated Cable Row','T-Bar Row','Chest-Supported Row'],
  'Dumbbell Row':          ['Barbell Row','Seated Cable Row','T-Bar Row'],
  'Seated Cable Row':      ['Dumbbell Row','Barbell Row','Face Pull'],
  'Lat Pulldown':          ['Pull-Up','Chin-Up','Seated Cable Row'],
  // SHOULDERS
  'Barbell Overhead Press':['Dumbbell Shoulder Press','Seated Dumbbell Press','Arnold Press','Machine Shoulder Press'],
  'Dumbbell Shoulder Press':['Barbell Overhead Press','Arnold Press','Machine Shoulder Press'],
  'Lateral Raise':         ['Cable Lateral Raise','Machine Lateral Raise'],
  'Face Pull':             ['Rear Delt Fly','Reverse Cable Fly','Band Pull-Apart'],
  // LEGS
  'Barbell Back Squat':    ['Goblet Squat','Leg Press','Bulgarian Split Squat','Hack Squat'],
  'Barbell Front Squat':   ['Goblet Squat','Barbell Back Squat','Leg Press'],
  'Romanian Deadlift':     ['Dumbbell Romanian Deadlift','Barbell Deadlift','Leg Curl'],
  'Leg Press':             ['Barbell Back Squat','Hack Squat','Goblet Squat'],
  'Bulgarian Split Squat': ['Lunges','Leg Press','Goblet Squat'],
  'Barbell Hip Thrust':    ['Glute Bridge','Cable Kickback','Romanian Deadlift'],
  // ARMS
  'Barbell Curl':          ['Dumbbell Curl','EZ-Bar Curl','Cable Curl','Hammer Curl'],
  'Dumbbell Curl':         ['Barbell Curl','EZ-Bar Curl','Hammer Curl','Cable Curl'],
  'Skull Crusher':         ['Overhead Dumbbell Extension','Cable Tricep Pushdown','Dip (Tricep)','Close-Grip Bench Press'],
  'Cable Tricep Pushdown': ['Skull Crusher','Overhead Dumbbell Extension','Dip (Tricep)'],
  // CORE
  'Crunch':                ['Cable Crunch','Sit-Up','Leg Raise','Plank'],
  'Plank':                 ['Dead Bug','Hollow Body Hold','Ab Wheel Rollout'],
};

// ══════════════════════════════════════════
//  CALISTHENICS SKILL TREES
//  Progressive overload via leverage/variation
// ══════════════════════════════════════════
const CALISTHENICS_TREES = [
  {
    tree: "Push (Horizontal)", muscle: "Chest", icon: "🤸",
    levels: [
      { l: 1, n: "Wall Push-Up",    t: "reps", target: 20 },
      { l: 2, n: "Incline Push-Up", t: "reps", target: 15 },
      { l: 3, n: "Push-Up",         t: "reps", target: 20 },
      { l: 4, n: "Diamond Push-Up", t: "reps", target: 15 },
      { l: 5, n: "Archer Push-Up",  t: "reps", target: 10 },
      { l: 6, n: "One-Arm Push-Up", t: "reps", target: 5  }
    ]
  },
  {
    tree: "Pull (Vertical)", muscle: "Back", icon: "🏋️",
    levels: [
      { l: 1, n: "Dead Hang",       t: "hold", target: 30 },
      { l: 2, n: "Negative Pull-Up",t: "reps", target: 8  },
      { l: 3, n: "Pull-Up",         t: "reps", target: 12 },
      { l: 4, n: "L-Sit Pull-Up",   t: "reps", target: 8  },
      { l: 5, n: "Archer Pull-Up",  t: "reps", target: 6  },
      { l: 6, n: "Muscle-Up",       t: "reps", target: 3  }
    ]
  },
  {
    tree: "Dip (Vertical Push)", muscle: "Triceps", icon: "💪",
    levels: [
      { l: 1, n: "Bench Dip",          t: "reps", target: 20 },
      { l: 2, n: "Straight Bar Dip",   t: "reps", target: 15 },
      { l: 3, n: "Parallel Bar Dip",   t: "reps", target: 15 },
      { l: 4, n: "Ring Dip",           t: "reps", target: 10 }
    ]
  },
  {
    tree: "Front Lever", muscle: "Back", icon: "🦇",
    levels: [
      { l: 1, n: "Tuck Front Lever",       t: "hold", target: 20 },
      { l: 2, n: "Adv. Tuck Front Lever",  t: "hold", target: 15 },
      { l: 3, n: "Straddle Front Lever",   t: "hold", target: 10 },
      { l: 4, n: "Full Front Lever",       t: "hold", target: 5  }
    ]
  },
  {
    tree: "Planche", muscle: "Shoulders", icon: "🛸",
    levels: [
      { l: 1, n: "Plank Lean",         t: "hold", target: 30 },
      { l: 2, n: "Frog Stand",         t: "hold", target: 20 },
      { l: 3, n: "Tuck Planche",       t: "hold", target: 15 },
      { l: 4, n: "Adv. Tuck Planche",  t: "hold", target: 10 },
      { l: 5, n: "Straddle Planche",   t: "hold", target: 8  },
      { l: 6, n: "Full Planche",       t: "hold", target: 5  }
    ]
  },
  {
    tree: "Legs", muscle: "Legs", icon: "🦵",
    levels: [
      { l: 1, n: "Assisted Squat",       t: "reps", target: 20 },
      { l: 2, n: "Bodyweight Squat",     t: "reps", target: 30 },
      { l: 3, n: "Bulgarian Split Squat",t: "reps", target: 15 },
      { l: 4, n: "Assisted Pistol Squat",t: "reps", target: 10 },
      { l: 5, n: "Pistol Squat",         t: "reps", target: 5  }
    ]
  },
  {
    tree: "Core (Statics)", muscle: "Core", icon: "🔥",
    levels: [
      { l: 1, n: "Plank",        t: "hold", target: 60 },
      { l: 2, n: "Hollow Body",  t: "hold", target: 45 },
      { l: 3, n: "Tuck L-Sit",   t: "hold", target: 20 },
      { l: 4, n: "L-Sit",        t: "hold", target: 15 },
      { l: 5, n: "V-Sit",        t: "hold", target: 10 }
    ]
  }
];

// Flat BW_EXERCISES array generated from trees — keeps history backward-compatible
const BW_EXERCISES = [];
CALISTHENICS_TREES.forEach(tree => {
  tree.levels.forEach(lvl => {
    BW_EXERCISES.push({
      name: lvl.n, icon: tree.icon, muscle: tree.muscle,
      type: lvl.t, tree: tree.tree, level: lvl.l, target: lvl.target
    });
  });
});

// Tap detection for BW sets container (prevents picker opening mid-scroll)
document.addEventListener('DOMContentLoaded', () => {
  const bwContainer = document.getElementById('bw-sets-container');
  if (!bwContainer || !('ontouchstart' in window)) return;
  let _bwTapY = 0, _bwTapX = 0;
  bwContainer.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { _bwTapY = e.touches[0].clientY; _bwTapX = e.touches[0].clientX; }
  }, { passive: true });
  bwContainer.addEventListener('touchend', e => {
    const inp = e.target.closest('.bw-val-input');
    if (!inp) return;
    const dy = Math.abs(e.changedTouches[0].clientY - _bwTapY);
    const dx = Math.abs(e.changedTouches[0].clientX - _bwTapX);
    if (dy > 8 || dx > 8) return;
    e.preventDefault();
    inp.blur();
    openWheelPicker(inp);
  }, { passive: false });
});