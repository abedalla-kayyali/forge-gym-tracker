// FORGE Gym Tracker - steps tracker, health import, and pedometer
// Extracted from index.html as part of modularization.

let stepsData = _lsGet('forge_steps', {});
// stepsData = { 'Mon Feb 17 2025': { steps: 8500, goal: 10000 }, ... }
function _sh(en, ar) {
  return (typeof currentLang !== 'undefined' && currentLang === 'ar') ? ar : en;
}

const STEP_DEFAULTS = { goal: 10000, xpPer1k: 2 };

function todayStepsKey() { return today(); }

function getTodaySteps() {
  const key = todayStepsKey();
  return stepsData[key] || { steps: 0, goal: STEP_DEFAULTS.goal };
}

function saveSteps() {
  localStorage.setItem('forge_steps', JSON.stringify(stepsData));
}

// Step milestone system
const STEP_MILESTONES = [
  { at: 1000, emoji: '👟', xp: 5, en: ['First 1K! You\'re moving!', '1,000 steps in — let\'s keep it going!', 'Step 1K done. Body activated!'], ar: ['أول ١٠٠٠ خطوة! تحركت!', '١٠٠٠ خطوة — استمر!', 'جسمك بدأ يتحرك!'] },
  { at: 2000, emoji: '⚡', xp: 5, en: ['2K steps! You\'re on fire!', '2,000 steps — momentum is building!', 'That\'s 2K! Keep the engine running!'], ar: ['٢٠٠٠ خطوة! رائع!', 'الزخم يتصاعد — ٢ألف!', 'المحرك يعمل — استمر!'] },
  { at: 3000, emoji: '🔥', xp: 5, en: ['3K! You\'re making it happen!', 'Solid 3,000 steps. Don\'t stop!', '3K locked in. Who\'s stopping you?'], ar: ['٣٠٠٠ خطوة! ممتاز!', '٣ آلاف — لا تتوقف!', '٣ آلاف مسجلة. من يوقفك؟'] },
  { at: 5000, emoji: '💪', xp: 10, en: ['HALFWAY! 5,000 steps — crushing it!', '5K milestone hit! You\'re halfway there!', 'Half the goal done. The rest is easy!'], ar: ['نصف الطريق! ٥٠٠٠ خطوة!', '٥ آلاف — أنت في المنتصف!', 'النصف منجز. الباقي سهل!'] },
  { at: 7500, emoji: '🚀', xp: 10, en: ['7,500! Almost at the goal!', 'Three-quarters there! 7.5K steps!', 'You\'re SO close — 7,500 steps done!'], ar: ['٧٥٠٠ خطوة! أنت قريب!', 'ثلاثة أرباع الطريق!', 'قريب جداً — ٧٥٠٠ خطوة!'] },
  { at: 10000, emoji: '🏆', xp: 20, en: ['GOAL CRUSHED! 10,000 STEPS! LEGEND!', '10K DONE! You\'re an absolute machine!', 'DAILY GOAL HIT! 🏆 Warrior status!'], ar: ['تم الهدف! ١٠٠٠٠ خطوة! أسطورة!', '١٠ آلاف! أنت آلة حقيقية!', 'الهدف اليومي محقق! 🏆 مقاتل!'] },
  { at: 12500, emoji: '🌟', xp: 15, en: ['12.5K! You went BEYOND the goal!', 'Extra miles! 12,500 steps — superhuman!', 'Goal was 10K. You hit 12.5K. Elite!'], ar: ['١٢٥٠٠! تجاوزت الهدف!', '١٢٥٠٠ خطوة — خارق!', 'الهدف ١٠٠٠٠ وأنت بلغت ١٢٥٠٠!'] },
  { at: 15000, emoji: '🦁', xp: 20, en: ['15,000 STEPS! Absolute beast mode!', 'BEAST! 15K — you\'re built different!', '15K steps? You don\'t stop do you!'], ar: ['١٥٠٠٠ خطوة! وحش حقيقي!', 'وحش! ١٥ ألف — أنت مختلف!', '١٥ ألف؟ لا تتعب أبداً!'] },
  { at: 20000, emoji: '🏅', xp: 30, en: ['20,000 STEPS! Hall of Fame material!', '20K! You just entered LEGEND territory!', 'TWO GOALS IN ONE DAY! 20K madness!'], ar: ['٢٠٠٠٠ خطوة! قاعة المشاهير!', '٢٠ ألف! دخلت أرض الأساطير!', 'هدفين في يوم واحد! ٢٠ ألف!'] }
];

let _stepMilestoneTimer = null;

function _showStepMilestone(milestone, isAr) {
  const existing = document.getElementById('step-milestone-toast');
  if (existing) existing.remove();

  const msgArr = isAr ? milestone.ar : milestone.en;
  const msg = msgArr[Math.floor(Math.random() * msgArr.length)];

  const el = document.createElement('div');
  el.className = 'step-milestone-toast';
  el.id = 'step-milestone-toast';
  el.innerHTML = `
    <span class="smt-badge">${milestone.emoji}</span>
    <div class="smt-title">${milestone.at >= 1000 ? (milestone.at / 1000) + 'K ' : milestone.at + ' '}${isAr ? 'خطوة!' : 'STEPS!'}</div>
    <div class="smt-sub">${msg}</div>
    <span class="smt-xp">+${milestone.xp} XP</span>
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });

  if (_stepMilestoneTimer) clearTimeout(_stepMilestoneTimer);
  _stepMilestoneTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 3500);

  const pill = document.getElementById('hdr-steps-pill');
  if (pill) {
    pill.classList.remove('step-btn-pumped', 'goal-hit');
    void pill.offsetWidth;
    pill.classList.add(milestone.at >= 10000 ? 'goal-hit' : 'step-btn-pumped');
    setTimeout(() => pill.classList.remove('step-btn-pumped'), 400);
  }

  if (milestone.at >= 10000 && typeof sndStepGoal === 'function') sndStepGoal();
  else if (typeof sndStep === 'function') sndStep();

  if (milestone.at >= 10000 && typeof hapStepGoal === 'function') hapStepGoal();
  else if (typeof hapStep === 'function') hapStep();
}

function logSteps(amount, btnEl) {
  const key = todayStepsKey();
  if (!stepsData[key]) stepsData[key] = { steps: 0, goal: STEP_DEFAULTS.goal };
  const prevSteps = stepsData[key].steps;
  stepsData[key].steps = Math.max(0, prevSteps + amount);
  const newSteps = stepsData[key].steps;
  // Fasted morning steps tracking
  const _hrNow = new Date().getHours();
  const _noWorkoutToday = !getWorkouts().some(w => new Date(w.date).toDateString() === new Date().toDateString());
  if (_hrNow < 9 || _noWorkoutToday) {
    stepsData[key].morningSteps = Math.min((stepsData[key].morningSteps || 0) + amount, stepsData[key].steps);
  }
  saveSteps();
  renderStepsPanel();
  postSaveHooks();
  if (typeof renderDailyNonNegotiables === 'function') renderDailyNonNegotiables();

  // Sound + visual FX — called here (inside onclick gesture) so iOS allows audio
  if (typeof window._lfStepFX === 'function') window._lfStepFX(amount, btnEl);

  if (btnEl) {
    btnEl.classList.remove('step-btn-pumped');
    void btnEl.offsetWidth;
    btnEl.classList.add('step-btn-pumped');
    setTimeout(() => btnEl.classList.remove('step-btn-pumped'), 400);
  }

  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';
  const hit = STEP_MILESTONES.filter(m => prevSteps < m.at && newSteps >= m.at);
  if (hit.length > 0) {
    _showStepMilestone(hit[hit.length - 1], isAr);
  } else {
    const goal = stepsData[key].goal || STEP_DEFAULTS.goal;
    const pct = Math.min(100, Math.round((newSteps / goal) * 100));
    const rem = Math.max(0, goal - newSteps);
    const nextMilestone = STEP_MILESTONES.find(m => m.at > newSteps);
    const toNext = nextMilestone ? (nextMilestone.at - newSteps) : 0;

    let msg;
    if (isAr) {
      msg = rem > 0
        ? `+${amount.toLocaleString()} خطوة! ${pct}% · ${toNext > 0 ? toNext.toLocaleString() + ' للمرحلة التالية' : ''}`
        : `+${amount.toLocaleString()} خطوة مسجلة!`;
    } else {
      msg = rem > 0
        ? `+${amount.toLocaleString()} steps! ${pct}% done${toNext > 0 ? ' · ' + toNext.toLocaleString() + ' to next milestone' : ''}`
        : `+${amount.toLocaleString()} steps logged!`;
    }
    showToast(msg);
  }
}

function setStepsGoal(newGoal) {
  const key = todayStepsKey();
  if (!stepsData[key]) stepsData[key] = { steps: 0, goal: STEP_DEFAULTS.goal };
  stepsData[key].goal = newGoal;
  saveSteps();
  renderStepsPanel();
}

function renderStepsPanel() {
  const el = document.getElementById('steps-panel');
  if (!el) return;
  const ts = getTodaySteps();
  const steps = ts.steps ?? 0;
  const goal = ts.goal || STEP_DEFAULTS.goal;
  const pct = Math.min(100, Math.round((steps / goal) * 100));
  const remaining = Math.max(0, goal - steps);

  let stepStreak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toDateString();
    if (stepsData[k] && stepsData[k].steps >= (stepsData[k].goal || STEP_DEFAULTS.goal)) stepStreak++;
    else if (i > 0) break;
  }

  const kcal = Math.round(steps * 0.04);
  const km   = (steps * 0.00075).toFixed(1);
  const _lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  const isAr  = _lang === 'ar';
  const phWord = isAr ? 'خطوات للإضافة...' : 'Custom steps…';
  const _fatBurnZone = new Date().getHours() < 9 &&
    !getWorkouts().some(w => new Date(w.date).toDateString() === new Date().toDateString());

  // SVG ring: r=50 → circumference ≈ 314.16
  const circ   = 314.16;
  const offset = (circ * (1 - pct / 100)).toFixed(2);
  const fmtSteps = steps >= 10000
    ? (steps / 1000).toFixed(0) + 'K'
    : steps >= 1000 ? (steps / 1000).toFixed(1).replace('.0', '') + 'K'
    : steps.toLocaleString();

  el.innerHTML = `
    <div class="sp-card">

      <div class="sp-header">
        <div class="sp-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><path d="M7.5 18c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/><path d="M15 6l-4 6 4 4-5 6"/><path d="M9 6l1 4-3 2 1 6"/></svg>
          ${isAr ? 'خطوات اليوم' : "TODAY'S STEPS"}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${stepStreak > 0 ? `<div class="sp-streak">🔥 ${stepStreak}${isAr ? 'ي' : 'd'}</div>` : ''}
          ${_fatBurnZone ? '<div class="sp-fat-burn-badge">🔥 2× XP</div>' : ''}
        </div>
      </div>

      <div class="sp-ring-wrap">
        <svg class="sp-ring-svg" viewBox="0 0 120 120" fill="none">
          <circle class="sp-ring-bg" cx="60" cy="60" r="50"/>
          <circle class="sp-ring-fill${pct >= 100 ? ' sp-ring-done' : ''}" cx="60" cy="60" r="50"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="sp-ring-inner">
          <div class="sp-big-num">${fmtSteps}</div>
          <div class="sp-big-label">${isAr ? 'خطوة' : 'STEPS'}</div>
          <div class="sp-big-pct${pct >= 100 ? ' sp-big-pct-done' : ''}">${pct}%</div>
        </div>
      </div>

      <div class="sp-stat-row">
        <div class="sp-stat">
          <div class="sp-stat-val">${remaining > 0 ? (remaining >= 1000 ? (remaining/1000).toFixed(1).replace('.0','')+'K' : remaining.toLocaleString()) : '✓'}</div>
          <div class="sp-stat-key">${isAr ? 'متبقي' : 'TO GO'}</div>
        </div>
        <div class="sp-stat">
          <div class="sp-stat-val">~${km}</div>
          <div class="sp-stat-key">${isAr ? 'كم' : 'KM'}</div>
        </div>
        <div class="sp-stat">
          <div class="sp-stat-val">${kcal}</div>
          <div class="sp-stat-key">${isAr ? 'سعرة' : 'KCAL'}</div>
        </div>
        <div class="sp-stat sp-stat-goal" onclick="openGoalSetter()">
          <div class="sp-stat-val">${goal >= 1000 ? (goal/1000).toFixed(0)+'K' : goal}</div>
          <div class="sp-stat-key">${isAr ? 'الهدف ✎' : 'GOAL ✎'}</div>
        </div>
      </div>

      <div class="sp-quick-row">
        <button onclick="logSteps(1000,this)"  class="step-quick-btn sp-qa"            data-amt="1000">+1K</button>
        <button onclick="logSteps(2000,this)"  class="step-quick-btn sp-qa"            data-amt="2000">+2K</button>
        <button onclick="logSteps(5000,this)"  class="step-quick-btn sp-qa"            data-amt="5000">+5K</button>
        <button onclick="logSteps(10000,this)" class="step-quick-btn sp-qa sp-qa-big"  data-amt="10000">+10K</button>
      </div>

      <div class="sp-custom-trigger">
        <button class="sp-custom-btn steps-add-btn" onclick="openStepsInput()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          ${isAr ? 'أدخل عدد مخصص' : 'ENTER CUSTOM STEPS'}
        </button>
      </div>
      <div class="sp-input-row steps-input-row" id="steps-input-row" style="display:none;">
        <input type="number" id="steps-input" min="0" inputmode="numeric" placeholder="${phWord}" class="sp-input">
        <button class="sp-log-btn steps-log-btn" onclick="submitStepsInput()">${isAr ? 'سجّل' : 'LOG'}</button>
      </div>

      ${_renderStepsHistory(_lang)}
    </div>
  `;
  if (typeof _updateHdrSteps === 'function') _updateHdrSteps();
}

function _renderStepsHistory(_lang) {
  const isAr = _lang === 'ar';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const data = stepsData[key] || { steps: 0, goal: STEP_DEFAULTS.goal };
    const dayNames = isAr
      ? ['أحد', 'اثن', 'ثلا', 'أرب', 'خمس', 'جمع', 'سبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.push({ label: dayNames[d.getDay()], steps: data.steps, isToday: i === 0, goal: data.goal || STEP_DEFAULTS.goal });
  }
  const maxSteps = Math.max(...days.map(d => d.steps), 1);

  const bars = days.map(d => {
    const barH  = Math.max(3, Math.round((d.steps / maxSteps) * 56));
    const cls   = d.isToday ? 'sp-bar-today' : d.steps >= d.goal ? 'sp-bar-goal' : 'sp-bar-miss';
    const val   = d.steps > 0 ? (d.steps >= 1000 ? (d.steps/1000).toFixed(1).replace('.0','')+'k' : d.steps) : '';
    return `<div class="sp-bar-col">
      <div class="sp-bar-val">${val}</div>
      <div class="sp-bar-track"><div class="sp-bar ${cls}" style="height:${barH}px;"></div></div>
      <div class="sp-bar-day${d.isToday ? ' sp-bar-day-today' : ''}">${d.label}</div>
    </div>`;
  }).join('');

  return `<div class="sp-history">
    <div class="sp-hist-title">${isAr ? '٧ أيام' : '7-DAY HISTORY'}</div>
    <div class="sp-hist-bars">${bars}</div>
  </div>`;
}

function openStepsInput() {
  const row = document.getElementById('steps-input-row');
  if (!row) return;
  row.style.display = row.style.display === 'none' ? '' : 'none';
  if (row.style.display !== 'none') {
    const inp = document.getElementById('steps-input');
    if (inp) { inp.value = ''; inp.focus(); }
  }
}

function submitStepsInput() {
  const inp = document.getElementById('steps-input');
  const val = parseInt(inp?.value);
  if (!val || val < 0) { showToast(_sh('Enter a valid step count!', 'أدخل عدد خطوات صحيح')); return; }
  logSteps(val);
  const row = document.getElementById('steps-input-row');
  if (row) row.style.display = 'none';
}

function openGoalSetter() {
  const goal = prompt(_sh('Set daily step goal:', 'حدد هدف الخطوات اليومي:'), getTodaySteps().goal || STEP_DEFAULTS.goal);
  const parsed = parseInt(goal);
  if (parsed && parsed > 0) {
    setStepsGoal(parsed);
  showToast(_sh(`Step goal set to ${parsed.toLocaleString()}!`, `تم تعيين هدف الخطوات إلى ${parsed.toLocaleString()}`));
  }
}

// XP from steps
function calcStepXP() {
  let xp = 0;
  Object.values(stepsData).forEach(d => {
    xp += Math.floor((d.steps || 0) / 1000) * STEP_DEFAULTS.xpPer1k;
    if (d.steps >= (d.goal || STEP_DEFAULTS.goal)) xp += 10;
    xp += Math.floor((d.morningSteps || 0) / 1000) * (STEP_DEFAULTS.xpPer1k || 2);
  });
  return xp;
}

// HEALTH DATA IMPORT
let _activeHealthSource = null;
let _pedometerActive = false;
let _pedometerSteps = 0;
let _pedometerLastAcc = null;

function selectHealthSource(source) {
  _activeHealthSource = source;
  ['huawei', 'gfit', 'samsung'].forEach(s => {
    const btn = document.getElementById('hs-' + s);
    if (btn) btn.style.borderColor = (s === source) ? 'var(--accent)' : '';
  });
  const names = { huawei: 'Huawei Health', gfit: 'Google Fit', samsung: 'Samsung Health' };
  _healthStatus(names[source] + ' selected — tap below to load your export file', false);
}

function _healthStatus(msg, connected) {
  const dot = document.getElementById('health-dot');
  const text = document.getElementById('health-status-text');
  if (dot) dot.className = 'health-dot' + (connected ? ' connected' : '');
  if (text) text.textContent = msg;
}

function importHealthFile(input) {
  const file = input.files[0];
  if (!file) return;
  _healthStatus('Reading ' + file.name + '…', false);
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const raw = e.target.result;
      let imported = 0;
      if (file.name.endsWith('.json')) {
        imported = _parseHealthJson(raw);
      } else if (file.name.endsWith('.csv')) {
        imported = _parseHealthCsv(raw);
      } else {
        _healthStatus('Unsupported format — use JSON or CSV export.', false);
        return;
      }
      if (imported > 0) {
        saveSteps();
        renderStepsPanel();
        _healthStatus('✅ Imported ' + imported + ' days of health data!', true);
      showToast(_sh('Health data imported: ' + imported + ' days', 'تم استيراد بيانات الصحة: ' + imported + ' يوم'), 'success');
      } else {
      _healthStatus(_sh('No recognisable data found in file.', 'لم يتم العثور على بيانات قابلة للقراءة في الملف.'), false);
      }
    } catch (err) {
      _healthStatus('Parse error: ' + err.message, false);
    }
    input.value = '';
  };
  reader.readAsText(file);
}

function _parseHealthJson(raw) {
  let count = 0;
  const obj = JSON.parse(raw);
  const arr = Array.isArray(obj) ? obj : (obj.data || obj.steps || obj.activities || []);
  arr.forEach(item => {
    const steps = parseInt(item.steps || item.step_count || item.value || 0);
    if (!steps) return;
    const rawDate = item.date || item.startTime || item.start_time || item.dateTime || '';
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (isNaN(d)) return;
    const key = d.toDateString();
    if (!stepsData[key]) stepsData[key] = { steps: 0, goal: STEP_DEFAULTS.goal };
    if (steps > stepsData[key].steps) { stepsData[key].steps = steps; count++; }
  });
  return count;
}

function _parseHealthCsv(raw) {
  let count = 0;
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return 0;
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
  const stepsIdx = headers.findIndex(h => h.includes('step'));
  if (dateIdx < 0 || stepsIdx < 0) return 0;
  lines.slice(1).forEach(line => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
    const steps = parseInt(cols[stepsIdx]);
    if (!steps || isNaN(steps)) return;
    const d = new Date(cols[dateIdx]);
    if (isNaN(d)) return;
    const key = d.toDateString();
    if (!stepsData[key]) stepsData[key] = { steps: 0, goal: STEP_DEFAULTS.goal };
    if (steps > stepsData[key].steps) { stepsData[key].steps = steps; count++; }
  });
  return count;
}

function togglePedometer() {
  const btn = document.getElementById('pedometer-toggle-btn');
  const info = document.getElementById('pedometer-info');
  if (_pedometerActive) {
    _pedometerActive = false;
    if (window._pedometerListener) {
      window.removeEventListener('devicemotion', window._pedometerListener);
      window._pedometerListener = null;
    }
  if (btn) { btn.textContent = _sh('Start Pedometer', 'بدء عداد الخطوات'); btn.style.background = 'var(--accent)'; }
    if (info) info.textContent = 'Pedometer stopped. Steps recorded: ' + _pedometerSteps;
    if (_pedometerSteps > 0) {
      logSteps(_pedometerSteps);
      _pedometerSteps = 0;
    }
    return;
  }
  if (typeof DeviceMotionEvent === 'undefined') {
    showToast(_sh('Motion sensor not available on this device.', 'مستشعر الحركة غير متاح على هذا الجهاز.'), 'warn');
    return;
  }
  const start = () => {
    _pedometerActive = true;
    _pedometerSteps = 0;
    _pedometerLastAcc = null;
    let _stepBuffer = 0;
    const THRESHOLD = 1.2;
    window._pedometerListener = evt => {
      const acc = evt.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      if (_pedometerLastAcc !== null) {
        const delta = Math.abs(mag - _pedometerLastAcc);
        if (delta > THRESHOLD) {
          _stepBuffer++;
          if (_stepBuffer >= 2) { _pedometerSteps++; _stepBuffer = 0; }
          if (info) info.textContent = '👟 Steps this session: ' + _pedometerSteps;
        }
      }
      _pedometerLastAcc = mag;
    };
    window.addEventListener('devicemotion', window._pedometerListener);
    if (btn) { btn.textContent = '⏹ Stop Pedometer'; btn.style.background = 'var(--danger)'; }
    if (info) info.textContent = '🟢 Pedometer active — walk with phone in pocket.';
  };
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(r => { if (r === 'granted') start(); else showToast(_sh('Motion permission denied.', 'تم رفض صلاحية الحركة.'), 'warn'); })
      .catch(() => showToast(_sh('Could not request permission.', 'تعذر طلب الصلاحية.'), 'warn'));
  } else {
    start();
  }
}
