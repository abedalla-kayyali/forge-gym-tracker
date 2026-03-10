// FORGE Gym Tracker - recovery heatmap + plate calculator
// Extracted from index.html as part of modularization.

let _recoveryMode = false;
let _recoveryInterval = null;

function toggleRecoveryHeatmap() {
  _recoveryMode = !_recoveryMode;
  const btn = document.getElementById('recovery-btn');
  const legend = document.getElementById('recovery-legend');
  if (_recoveryMode) {
    btn.classList.add('active');
    legend.classList.add('show');
    renderRecoveryHeatmap();
    _recoveryInterval = setInterval(renderRecoveryHeatmap, 60000);
  } else {
    btn.classList.remove('active');
    legend.classList.remove('show');
    clearInterval(_recoveryInterval);
    // Remove all recovery classes
    document.querySelectorAll('.body-zone').forEach(z => {
      z.classList.remove('recovery-fresh', 'recovery-mid', 'recovery-almost', 'recovery-good');
    });
    // Re-apply selection if any
    if (selectedMuscle) {
      document.querySelectorAll('.body-zone').forEach(z => {
        z.classList.toggle('zone-selected', z.dataset.muscle === selectedMuscle);
      });
    }
  }
}

function renderRecoveryHeatmap() {
  if (!_recoveryMode) return;
  const RECOVERY_HOURS = 48; // full recovery window
  const now = Date.now();
  // Find last workout date per muscle
  const lastWorked = {};
  workouts.forEach(w => {
    const ms = new Date(w.date).getTime();
    if (!lastWorked[w.muscle] || ms > lastWorked[w.muscle]) lastWorked[w.muscle] = ms;
  });
  document.querySelectorAll('.body-zone').forEach(z => {
    const muscle = z.dataset.muscle;
    z.classList.remove('recovery-fresh', 'recovery-mid', 'recovery-almost', 'recovery-good', 'zone-selected');
    if (!lastWorked[muscle]) return; // never trained — no color
    const hoursAgo = (now - lastWorked[muscle]) / 3600000;
    if (hoursAgo < 24) z.classList.add('recovery-fresh');
    else if (hoursAgo < 36) z.classList.add('recovery-mid');
    else if (hoursAgo < RECOVERY_HOURS) z.classList.add('recovery-almost');
    else z.classList.add('recovery-good');
  });
}

const PLATE_COLOURS = {
  25: '#3498db', 20: '#e74c3c', 15: '#f1c40f', 10: '#27ae60',
  5: '#ffffff', 2.5: '#e67e22', 1.25: '#9b59b6', 1: '#95a5a6', 0.5: '#bdc3c7'
};
const PLATE_HEIGHTS = {
  25: 44, 20: 40, 15: 36, 10: 30, 5: 24, 2.5: 20, 1.25: 16, 1: 14, 0.5: 12
};

function openPlateCalc() {
  // Pre-fill unit from last set row or default
  const lastUnit = document.querySelector('.set-unit-toggle')?.dataset?.unit || document.querySelector('.set-unit')?.value || settings.defaultUnit || 'kg';
  const pcUnit = document.getElementById('pc-unit');
  if (pcUnit) pcUnit.value = lastUnit;
  const pcBarUnit = document.getElementById('pc-bar-unit');
  if (pcBarUnit) pcBarUnit.textContent = lastUnit;
  // Pre-fill target from last weight input if present
  const lastWeight = document.querySelector('.set-weight')?.value;
  const pcTarget = document.getElementById('pc-target');
  if (pcTarget && lastWeight) pcTarget.value = lastWeight;
  // Set default bar weight
  const pcBar = document.getElementById('pc-bar');
  if (pcBar && !pcBar.value) pcBar.value = lastUnit === 'lbs' ? '45' : '20';
  document.getElementById('plate-calc-modal').classList.add('open');
  calcPlates();
}

function closePlateCalc() {
  document.getElementById('plate-calc-modal').classList.remove('open');
}

function calcPlates() {
  const target = parseFloat(document.getElementById('pc-target')?.value) || 0;
  const bar = parseFloat(document.getElementById('pc-bar')?.value) || 0;
  const unit = document.getElementById('pc-unit')?.value || 'kg';
  document.getElementById('pc-bar-unit').textContent = unit;

  const visual = document.getElementById('plate-visual');
  const summary = document.getElementById('plate-calc-summary');

  if (target <= 0 || target <= bar) {
    visual.innerHTML = `<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);">${target > 0 && target <= bar ? 'Target must exceed bar weight' : 'Enter a weight above'}</span>`;
    summary.style.display = 'none';
    return;
  }

  const halfLoad = (target - bar) / 2;
  const plates = unit === 'lbs'
    ? [45, 35, 25, 10, 5, 2.5, 1.25]
    : [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5];

  let remaining = halfLoad;
  const chosen = [];
  for (const p of plates) {
    while (remaining >= p - 0.001) {
      chosen.push(p);
      remaining -= p;
    }
  }

  if (remaining > 0.05) {
    visual.innerHTML = `<span style="font-family:'DM Mono',monospace;font-size:11px;color:#e74c3c;">Cannot make exact weight with standard plates</span>`;
    summary.style.display = 'none';
    return;
  }

  // Build visual
  let html = '<div class="plate-bar-item"><div class="plate-barbell"></div></div>';
  chosen.forEach(p => {
    const col = PLATE_COLOURS[p] || '#888';
    const h = PLATE_HEIGHTS[p] || 20;
    html += `<div class="plate-bar-item">
      <div class="plate-disk" style="width:22px;height:${h}px;background:${col};">${p}</div>
    </div>`;
  });
  visual.innerHTML = html;

  // Summary
  const counts = {};
  chosen.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  const lines = Object.entries(counts).map(([p, n]) => `${n}× ${p}${unit} plate`).join(' · ');
  summary.style.display = 'block';
  summary.innerHTML = `<div class="plate-calc-summary-line">Per side: ${lines}</div>
    <div class="plate-calc-summary-line" style="color:var(--text3);">Total: ${target}${unit} &nbsp;|&nbsp; Bar: ${bar}${unit} &nbsp;|&nbsp; Each side: ${halfLoad}${unit}</div>`;
}
