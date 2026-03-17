// FORGE Gym Tracker - recovery heatmap + plate calculator
// Extracted from index.html as part of modularization.

// MRV defaults (sets/week) — user can override via forge_mrv_config in localStorage
const DEFAULT_MRV = {
  chest: 20, back: 22, legs: 24, shoulders: 16,
  biceps: 14, triceps: 14, core: 20, glutes: 20,
  calves: 20, hamstrings: 18, quads: 20, traps: 14
};

// Recovery window (hours) based on muscle type
const RECOVERY_WINDOW = {
  // Compound-dominant muscles get 72h
  chest: 72, back: 72, legs: 72, glutes: 72, hamstrings: 72, quads: 72,
  // Isolation-dominant get 48h
  shoulders: 48, biceps: 48, triceps: 48, core: 48, calves: 48, traps: 48
};

function _getMrvConfig() {
  try { return JSON.parse(localStorage.getItem('forge_mrv_config') || '{}'); } catch { return {}; }
}

function _getWeeklyVolume(muscle) {
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const ws = (typeof workouts !== 'undefined' ? workouts : [])
    .filter(w => w.muscle?.toLowerCase() === muscle?.toLowerCase() && w.date >= cutoff);
  // Count working sets (not warmup)
  return ws.reduce((sum, w) => sum + (w.sets?.filter(s => s.type !== 'warmup').length || 0), 0);
}

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
  const now = Date.now();
  const mrvConfig = _getMrvConfig();

  // Readiness multiplier: if readiness < 50%, extend recovery times by 20%
  let readinessMult = 1.0;
  try {
    const rd = JSON.parse(localStorage.getItem('forge_readiness_today') || '{}');
    if (rd.score && rd.score < 50) readinessMult = 1.2;
  } catch {}

  // Find last workout per muscle
  const lastWorked = {};
  (typeof workouts !== 'undefined' ? workouts : []).forEach(w => {
    const ms = new Date(w.date).getTime();
    const key = (w.muscle || '').toLowerCase();
    if (!lastWorked[key] || ms > lastWorked[key].ms) {
      lastWorked[key] = { ms, date: w.date };
    }
  });

  document.querySelectorAll('.body-zone').forEach(z => {
    const muscle = (z.dataset.muscle || '').toLowerCase();
    z.classList.remove('recovery-fresh', 'recovery-mid', 'recovery-almost', 'recovery-good', 'zone-selected');
    if (!lastWorked[muscle]) return;

    const hoursAgo = (now - lastWorked[muscle].ms) / 3600000;
    const window_ = (RECOVERY_WINDOW[muscle] || 48) * readinessMult;
    const mrv = mrvConfig[muscle] || DEFAULT_MRV[muscle] || 20;
    const weeklyVol = _getWeeklyVolume(muscle);
    const overreached = weeklyVol >= mrv;

    if (overreached || hoursAgo < window_ * 0.33) {
      z.classList.add('recovery-fresh');       // red — still recovering / overreached
    } else if (hoursAgo < window_ * 0.66) {
      z.classList.add('recovery-mid');         // orange
    } else if (hoursAgo < window_) {
      z.classList.add('recovery-almost');      // yellow
    } else {
      z.classList.add('recovery-good');        // green — fully recovered
    }
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
