// FORGE Gym Tracker - steps tracker, health import, and pedometer
// Extracted from index.html as part of modularization.

let stepsData = _lsGet('forge_steps', {});
// stepsData = { 'Mon Feb 17 2025': { steps: 8500, goal: 10000 }, ... }

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
  const steps = ts.steps;
  const goal = ts.goal || STEP_DEFAULTS.goal;
  const pct = Math.min(100, Math.round((steps / goal) * 100));
  const remaining = Math.max(0, goal - steps);

  // Last 7 days streak
  let stepStreak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toDateString();
    if (stepsData[k] && stepsData[k].steps >= (stepsData[k].goal || STEP_DEFAULTS.goal)) stepStreak++;
    else if (i > 0) break;
  }

  const kcal = Math.round(steps * 0.04);
  const km = (steps * 0.00075).toFixed(1);

  const _lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  const stepsWord = _lang === 'ar' ? 'خطوة' : 'steps';
  const goalWord = _lang === 'ar' ? 'الهدف' : 'Goal';
  const complWord = _lang === 'ar' ? 'مكتمل' : 'complete';
  const toGoWord = _lang === 'ar' ? 'متبقية' : 'to go';
  const streakWord = _lang === 'ar' ? 'يوم' : 'd';
  const logWord = _lang === 'ar' ? 'تسجيل' : 'Log';
  const logBtnWord = _lang === 'ar' ? 'سجّل' : 'LOG';
  const _stepsSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px;"><path d="M13 4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><path d="M7.5 18c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/><path d="M15 6l-4 6 4 4-5 6"/><path d="M9 6l1 4-3 2 1 6"/></svg>`;
  const _gearSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  const _fireSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;"><path d="M12 2c0 0-7 6.5-7 12a7 7 0 0 0 14 0c0-5.5-7-12-7-12z"/><path d="M9.5 14.5c.5 1.5 2.5 2.5 4 1.5"/></svg>`;
  const goalBtnWord = _lang === 'ar' ? `${_gearSVG} الهدف` : `${_gearSVG} Goal`;
  const titleWord = _lang === 'ar' ? `${_stepsSVG} خطوات اليوم` : `${_stepsSVG} TODAY'S STEPS`;
  const phWord = _lang === 'ar' ? 'خطوات للإضافة...' : 'Steps to add…';
  const _fatBurnZone = new Date().getHours() < 9 &&
    !getWorkouts().some(w => new Date(w.date).toDateString() === new Date().toDateString());

  el.innerHTML = `
    <div class="steps-header">
      <div class="steps-title">${titleWord}</div>
      <button class="steps-add-btn" onclick="openStepsInput()">+ ${logWord}</button>
    </div>
    <div class="steps-big-number">${steps.toLocaleString()}<span>${stepsWord}</span></div>
    <div class="steps-goal-label">${goalWord}: ${goal.toLocaleString()} · ${pct}% ${complWord}</div>
    ${_fatBurnZone ? '<div><span class="fat-burn-badge">🔥 FAT BURN ZONE — 2× XP</span></div>' : ''}
    <div class="steps-bar-wrap">
      <div class="steps-bar-fill" style="width:${pct}%;"></div>
    </div>
    <div class="steps-sub-row">
      <span class="steps-sub-stat"><b>${remaining.toLocaleString()}</b> ${toGoWord}</span>
      <span class="steps-sub-stat"><b>~${km}</b> km</span>
      <span class="steps-sub-stat"><b>${kcal}</b> kcal</span>
      ${stepStreak > 0 ? `<span class="steps-sub-stat">${_fireSVG}<b>${stepStreak}${streakWord}</b> streak</span>` : ''}
    </div>
    <div class="steps-input-row" id="steps-input-row" style="display:none;">
      <input type="number" id="steps-input" min="0" inputmode="numeric" placeholder="${phWord}">
      <button class="steps-log-btn" onclick="submitStepsInput()">${logBtnWord}</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
      <button onclick="logSteps(1000,this)" class="step-quick-btn" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 5px;color:var(--accent);font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer;min-height:40px;transition:background .15s,border-color .15s;">+1K</button>
      <button onclick="logSteps(2000,this)" class="step-quick-btn" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 5px;color:var(--text2);font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer;min-height:40px;transition:background .15s,border-color .15s;">+2K</button>
      <button onclick="logSteps(5000,this)" class="step-quick-btn" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 5px;color:var(--text2);font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer;min-height:40px;transition:background .15s,border-color .15s;">+5K</button>
      <button onclick="logSteps(10000,this)" class="step-quick-btn" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 5px;color:var(--text2);font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer;min-height:40px;transition:background .15s,border-color .15s;">+10K</button>
      <button onclick="openGoalSetter()" style="flex:0 0 auto;background:var(--panel);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text3);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;min-height:40px;">${goalBtnWord}</button>
    </div>
    ${_renderStepsHistory(_lang)}
  `;
  if (typeof _updateHdrSteps === 'function') _updateHdrSteps();
}

function _renderStepsHistory(_lang) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const data = stepsData[key] || { steps: 0, goal: STEP_DEFAULTS.goal };
    const dayGoal = data.goal || STEP_DEFAULTS.goal;
    const pct = Math.min(100, Math.round((data.steps / dayGoal) * 100));
    const dayNames = _lang === 'ar'
      ? ['أحد', 'اثن', 'ثلا', 'أرب', 'خمس', 'جمع', 'سبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.push({ label: dayNames[d.getDay()], steps: data.steps, pct, isToday: i === 0, goal: dayGoal });
  }
  const maxSteps = Math.max(...days.map(d => d.steps), 1);
  const histWord = _lang === 'ar' ? '٧ أيام' : '7-DAY HISTORY';

  const bars = days.map(d => {
    const barH = Math.max(4, Math.round((d.steps / maxSteps) * 52));
    const reached = d.steps >= d.goal;
    const barColor = d.isToday
      ? 'var(--accent)'
      : reached ? 'var(--green)' : 'var(--border2)';
    const glowStyle = d.isToday
      ? 'filter:drop-shadow(0 0 5px var(--accent));'
      : reached ? 'filter:drop-shadow(0 0 4px var(--green3));' : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;">
      <div style="font-family:'DM Mono',monospace;font-size:7px;color:${d.steps > 0 ? 'var(--text2)' : 'var(--text3)'};letter-spacing:.5px;">${d.steps > 0 ? (d.steps >= 1000 ? (d.steps / 1000).toFixed(1) + 'k' : d.steps) : ''}</div>
      <div style="width:100%;height:60px;display:flex;align-items:flex-end;justify-content:center;">
        <div style="width:70%;height:${barH}px;background:${barColor};border-radius:3px 3px 2px 2px;transition:height .4s cubic-bezier(.4,0,.2,1);${glowStyle}${d.isToday ? 'border:1px solid var(--accent);' : ''}"></div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:${d.isToday ? 'var(--accent)' : 'var(--text3)'};font-weight:${d.isToday ? '700' : '400'};">${d.label}</div>
    </div>`;
  }).join('');

  return `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--text3);margin-bottom:8px;text-transform:uppercase;">${histWord}</div>
    <div style="display:flex;gap:4px;align-items:flex-end;">${bars}</div>
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
  if (!val || val < 0) { showToast('Enter a valid step count!'); return; }
  logSteps(val);
  const row = document.getElementById('steps-input-row');
  if (row) row.style.display = 'none';
}

function openGoalSetter() {
  const goal = prompt('Set daily step goal:', getTodaySteps().goal || STEP_DEFAULTS.goal);
  const parsed = parseInt(goal);
  if (parsed && parsed > 0) {
    setStepsGoal(parsed);
    showToast(typeof t === 'function' && currentLang === 'ar' ? `هدف الخطوات: ${parsed.toLocaleString()}` : `Step goal set to ${parsed.toLocaleString()}!`);
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
        showToast('Health data imported: ' + imported + ' days', 'success');
      } else {
        _healthStatus('No recognisable data found in file.', false);
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
    if (btn) { btn.textContent = '▶ Start Pedometer'; btn.style.background = 'var(--accent)'; }
    if (info) info.textContent = 'Pedometer stopped. Steps recorded: ' + _pedometerSteps;
    if (_pedometerSteps > 0) {
      logSteps(_pedometerSteps);
      _pedometerSteps = 0;
    }
    return;
  }
  if (typeof DeviceMotionEvent === 'undefined') {
    showToast('Motion sensor not available on this device.', 'warn');
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
      .then(r => { if (r === 'granted') start(); else showToast('Motion permission denied.', 'warn'); })
      .catch(() => showToast('Could not request permission.', 'warn'));
  } else {
    start();
  }
}
