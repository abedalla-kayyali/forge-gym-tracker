// FORGE Gym Tracker - dashboard and history rendering
// Extracted from index.html to reduce main script size and coupling.

let _calYear = new Date().getFullYear();
let _calMonth = new Date().getMonth(); // 0-indexed
let _calSelectedDate = null;
let _calMode = 'workout'; // active tracker tab
let _calDateFilter = null;

function _dhFixArText(s) {
  if (typeof s !== 'string') return s;
  if (typeof currentLang !== 'undefined' && currentLang === 'ar' && typeof window._forgeFixArabicText === 'function') {
    return window._forgeFixArabicText(s);
  }
  return s;
}
function _dhSetHtml(el, html) {
  if (!el) return;
  el.innerHTML = _dhFixArText(String(html || ''));
}

// â”€â”€ Helpers to build per-day data maps â”€â”€
function _buildWorkoutMap() {
  const allW = [
    ...(typeof workouts !== 'undefined' ? workouts : []),
    ...(typeof bwWorkouts !== 'undefined' ? bwWorkouts : [])
  ];
  const map = {};
  allW.forEach(w => {
    const d = new Date(w.date || w.id);
    if (isNaN(d)) return;
    const k = _isoKey(d);
    if (!map[k]) map[k] = { count: 0, vol: 0, muscles: new Set() };
    map[k].count++;
    map[k].vol += (w.totalVolume || 0);
    if (w.muscle) map[k].muscles.add(w.muscle);
  });
  return map;
}

function _buildStepsMap() {
  // stepsData keys are toDateString() e.g. "Mon Feb 17 2025"
  // Convert to YYYY-MM-DD for consistent lookup
  const sd = (typeof stepsData !== 'undefined') ? stepsData : {};
  const map = {};
  Object.entries(sd).forEach(([k, v]) => {
    const d = new Date(k);
    if (isNaN(d)) return;
    map[_isoKey(d)] = { steps: v.steps || 0, goal: v.goal || 10000 };
  });
  return map;
}

function _buildWaterMap() {
  // Water is stored per-day: forge_water_<toDateString()>
  // Scan all localStorage keys that start with forge_water_
  const map = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const lk = localStorage.key(i);
      if (!lk || !lk.startsWith('forge_water_')) continue;
      const dateStr = lk.replace('forge_water_', '');
      const d = new Date(dateStr);
      if (isNaN(d)) continue;
      const cups = JSON.parse(localStorage.getItem(lk) || '[]');
      map[_isoKey(d)] = { cups: Array.isArray(cups) ? cups.length : 0 };
    }
  } catch (e) {}
  return map;
}

// â”€â”€ Feature 2: Muscle Freshness â€” per-muscle last-trained date map â”€â”€
function _buildLastTrainedMap() {
  const w = (typeof workouts !== 'undefined') ? workouts : [];
  const map = {}; // muscle â†’ Date (most recent training date)
  w.forEach(x => {
    const d = new Date(x.date);
    if (isNaN(d) || !x.muscle) return;
    if (!map[x.muscle] || d > map[x.muscle]) map[x.muscle] = d;
  });
  return map;
}

// Returns freshness color for a muscle on a given Date
// green = 72h+ (fully recovered), amber = 48-72h, red = <48h (fatigued)
function _muscleFreshnessColor(muscle, onDate, lastTrainedMap) {
  const last = lastTrainedMap[muscle];
  if (!last) return '#2ecc71'; // never trained = fresh
  const hoursAgo = (onDate.getTime() - last.getTime()) / 3600000;
  if (hoursAgo >= 72) return '#2ecc71'; // green
  if (hoursAgo >= 48) return '#f39c12'; // amber
  return '#e74c3c'; // red â€” still recovering
}

function _buildWeightMap() {
  const bw = (typeof bodyWeight !== 'undefined') ? bodyWeight : [];
  const map = {};
  bw.forEach(e => {
    if (!e.date || !e.weight) return;
    const d = new Date(e.date);
    if (isNaN(d)) return;
    const k = _isoKey(d);
    // Keep only the last entry per day
    if (!map[k] || new Date(e.date) > new Date(map[k].date)) {
      map[k] = { weight: e.weight, unit: e.unit || 'kg', date: e.date };
    }
  });
  return map;
}

function _buildMealsMap() {
  const ml = (typeof mealsLog !== 'undefined' && mealsLog && typeof mealsLog === 'object') ? mealsLog : {};
  const map = {};
  Object.entries(ml).forEach(([k, arr]) => {
    if (!Array.isArray(arr) || !arr.length) return;
    let dayKey = k;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
      const d = new Date(k);
      if (isNaN(d)) return;
      dayKey = _isoKey(d);
    }
    const agg = arr.reduce((a, m) => {
      a.count += 1;
      a.kcal += (+m.kcal || 0);
      a.p += (+m.p || 0);
      a.c += (+m.c || 0);
      a.f += (+m.f || 0);
      return a;
    }, { count: 0, kcal: 0, p: 0, c: 0, f: 0 });
    if (!map[dayKey]) {
      map[dayKey] = agg;
    } else {
      map[dayKey].count += agg.count;
      map[dayKey].kcal += agg.kcal;
      map[dayKey].p += agg.p;
      map[dayKey].c += agg.c;
      map[dayKey].f += agg.f;
    }
  });
  return map;
}

function _isoKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _histSvgIcon(kind, cls = '') {
  const pathMap = {
    workout: '<path d="M6 5v14M18 5v14"/><path d="M2 9h4M18 9h4M2 15h4M18 15h4"/><rect x="6" y="8" width="12" height="8" rx="1"/>',
    steps: '<path d="M8 4v6M16 4v6"/><path d="M6 14c0 3 2 6 6 6s6-3 6-6"/><path d="M6 14h12"/>',
    water: '<path d="M12 3C9 7 6 10 6 14a6 6 0 0 0 12 0c0-4-3-7-6-11z"/>',
    weight: '<path d="M6 8h12l-1 10H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/><line x1="12" y1="11" x2="12" y2="14"/>',
    meals: '<path d="M8 3v8M12 3v8M10 3v8"/><path d="M16 3v7a2 2 0 0 0 2 2"/><line x1="7" y1="21" x2="7" y2="12"/><line x1="17" y1="21" x2="17" y2="12"/>',
    chest: '<path d="M6 5v14M18 5v14"/><path d="M6 9h12M6 15h12"/>',
    back: '<path d="M4 6s2-2 8-2 8 2 8 2"/><line x1="12" y1="4" x2="12" y2="20"/><path d="M4 18s2 2 8 2 8-2 8-2"/>',
    shoulders: '<path d="M12 8c-4 0-7 2-7 5s3 5 7 5 7-2 7-5-3-5-7-5z"/><path d="M12 5v3"/>',
    legs: '<path d="M10 3s0 4-2 8-2 8-2 9"/><path d="M14 3s0 4 2 8 2 8 2 9"/>',
    core: '<ellipse cx="12" cy="12" rx="4" ry="6"/><line x1="12" y1="6" x2="12" y2="18"/>',
    biceps: '<path d="M6 16c0-4 2-8 6-8s6 4 6 8"/>',
    triceps: '<path d="M8 6l-2 12M16 6l2 12M7 14h10"/>',
    forearms: '<path d="M6 8h12M6 12h12M6 16h8"/>',
    glutes: '<path d="M6 14c0-4 2-7 6-7s6 3 6 7c0 2-2 4-6 4s-6-2-6-4z"/>',
    calves: '<path d="M10 3l-2 10 2 8"/><path d="M14 3l2 10-2 8"/>',
    neck: '<path d="M12 3c-2 0-3 1-3 3v4c0 2 1 3 3 3s3-1 3-3V6c0-2-1-3-3-3z"/>',
    traps: '<path d="M4 8c2-3 5-5 8-5s6 2 8 5"/><path d="M4 8l-2 6h20l-2-6"/>',
    lowerback: '<path d="M6 12h12"/><path d="M8 8c0-2 1.5-4 4-4s4 2 4 4"/><path d="M6 16h12"/>',
    generic: '<circle cx="12" cy="12" r="5"/>',
    star: '<polygon points="12 3.5 14.9 9.3 21.2 10.2 16.6 14.6 17.7 20.9 12 17.9 6.3 20.9 7.4 14.6 2.8 10.2 9.1 9.3 12 3.5"/>',
    flame: '<path d="M12 3c3 4 5 6 5 10a5 5 0 1 1-10 0c0-2 1-4 3-6"/>',
    bolt: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
    trendup: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="21 12 21 7 16 7"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>'
  };
  const path = pathMap[kind] || pathMap.generic;
  return `<svg class="${cls}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function _histMuscleIcon(muscle, cls = 'hist-icon') {
  const keyMap = {
    Chest: 'chest',
    Back: 'back',
    Shoulders: 'shoulders',
    Legs: 'legs',
    Core: 'core',
    Biceps: 'biceps',
    Triceps: 'triceps',
    Forearms: 'forearms',
    Glutes: 'glutes',
    Calves: 'calves',
    Neck: 'neck',
    Traps: 'traps',
    'Lower Back': 'lowerback'
  };
  return _histSvgIcon(keyMap[muscle] || 'generic', cls);
}

function _calcStreakFromDateKeys(dateKeys) {
  if (!dateKeys || !dateKeys.length) return { current: 0, best: 0 };
  const unique = [...new Set(dateKeys)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00');
    const cur = new Date(unique[i] + 'T00:00:00');
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  const set = new Set(unique);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yday = new Date(today);
  yday.setDate(yday.getDate() - 1);
  let cursor = set.has(_isoKey(today)) ? today : (set.has(_isoKey(yday)) ? yday : null);
  let current = 0;
  while (cursor && set.has(_isoKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best: Math.max(best, current) };
}

// â”€â”€ Main calendar renderer â”€â”€
function renderWorkoutCalendar() {
  const wrap = document.getElementById('workout-calendar-wrap');
  if (!wrap) return;

  const isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const now = new Date();
  const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Build all tracker maps
  const wkMap = _buildWorkoutMap();
  const stMap = _buildStepsMap();
  const h2oMap = _buildWaterMap();
  const wtMap = _buildWeightMap();
  const mealMap = _buildMealsMap();
  const ltMap = _buildLastTrainedMap(); // Feature 2: per-muscle last-trained dates

  const year = _calYear; const month = _calMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const monthNames = isAr
    ? ['ظٹظ†ط§ظٹط±', 'ظپط¨ط±ط§ظٹط±', 'ظ…ط§ط±ط³', 'ط£ط¨ط±ظٹظ„', 'ظ…ط§ظٹظˆ', 'ظٹظˆظ†ظٹظˆ', 'ظٹظˆظ„ظٹظˆ', 'ط£ط؛ط³ط·ط³', 'ط³ط¨طھظ…ط¨ط±', 'ط£ظƒطھظˆط¨ط±', 'ظ†ظˆظپظ…ط¨ط±', 'ط¯ظٹط³ظ…ط¨ط±']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dowLabels = isAr
    ? ['ط£ط­', 'ط§ط«', 'ط«ظ„', 'ط£ط±', 'ط®ظ…', 'ط¬ظ…', 'ط³ط¨']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // â”€â”€ Tab labels â”€â”€
  const tabs = [
    { id: 'workout', icon: _histSvgIcon('workout', 'tab-ic'), label: isAr ? 'طھظ…ط±ظٹظ†' : 'Workout' },
    { id: 'steps', icon: _histSvgIcon('steps', 'tab-ic'), label: isAr ? 'ط®ط·ظˆط§طھ' : 'Steps' },
    { id: 'water', icon: _histSvgIcon('water', 'tab-ic'), label: isAr ? 'ظ…ط§ط،' : 'Water' },
    { id: 'weight', icon: _histSvgIcon('weight', 'tab-ic'), label: isAr ? 'ظˆط²ظ†' : 'Weight' }
  ];
  const tabsHtml = `<div class="cal-track-tabs">${tabs.map(tb =>
    `<button class="cal-track-tab${_calMode === tb.id ? ' active' : ''}" onclick="calSetMode('${tb.id}')">
      <span class="tab-icon">${tb.icon}</span>${tb.label}
    </button>`
  ).join('')}</div>`;

  // â”€â”€ Day cells â”€â”€
  let dayCells = '';
  for (let i = 0; i < startDow; i++) dayCells += '<div class="wk-cal-day empty"></div>';

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const key = _isoKey(dateObj);
    const isToday = dateObj.getTime() === todayObj.getTime();
    const isSel = _calSelectedDate === key;

    let extraClass = ''; let bgStyle = ''; let glowStyle = ''; let innerHtml = '';

    if (_calMode === 'workout') {
      const wk = wkMap[key];
      const isFuture = dateObj > todayObj;
      if (wk) {
        const c = wk.count >= 3 || wk.vol > 5000 ? '#00ff7f' : wk.count === 2 || wk.vol > 2000 ? '#00c863' : '#3a9e6a';
        extraClass = 'trained'; bgStyle = `background:${c};`;
        glowStyle = isToday ? `box-shadow:0 0 10px ${c}88;` : `box-shadow:0 0 6px ${c}55;`;
        const muscles = wk.muscles ? [...wk.muscles] : [];
        // Feature 2: show freshness color of trained muscles (how recovered they will be from this day forward)
        innerHtml = muscles.length
          ? `<div class="cal-muscle-chips">${muscles.slice(0, 2).map(m => {
            const fc = _muscleFreshnessColor(m, now, ltMap);
            return `<div class="cal-muscle-chip" style="border-color:${fc};color:${fc};">${m.slice(0, 5).toUpperCase()}</div>`;
          }).join('')}</div>`
          : '';
      } else if (isFuture) {
        // Feature 2: future rest day â€” show freshness forecast chips for muscles that need it
        extraClass = 'rest';
        const ALL_M = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves'];
        const freshChips = ALL_M
          .map(m => ({ m, c: _muscleFreshnessColor(m, dateObj, ltMap) }))
          .filter(x => x.c !== '#2ecc71'); // only show non-fresh muscles
        if (freshChips.length) {
          innerHtml = `<div class="cal-fresh-chips">${freshChips.slice(0, 4).map(x =>
            `<div class="cal-fresh-chip" title="${x.m}" style="background:${x.c};opacity:.7;"></div>`
          ).join('')}</div>`;
        }
      } else { extraClass = 'rest'; }
    } else if (_calMode === 'steps') {
      const st = stMap[key];
      if (st && st.steps > 0) {
        const pct = st.steps / (st.goal || 10000);
        extraClass = pct >= 1 ? 'steps-hit' : pct >= 0.5 ? 'steps-mid' : 'steps-low';
        const kSteps = (st.steps / 1000).toFixed(1);
        innerHtml = `<div style="font-family:'DM Mono',monospace;font-size:8px;color:${pct >= 1 ? '#fff' : 'rgba(243,156,18,.9)'};margin-top:2px;line-height:1;">${kSteps}k</div>`;
      } else { extraClass = 'rest'; }
    } else if (_calMode === 'water') {
      const h2o = h2oMap[key];
      const goal = (typeof _waterGoalCups !== 'undefined') ? _waterGoalCups : 8;
      if (h2o && h2o.cups > 0) {
        const pct = h2o.cups / goal;
        extraClass = pct >= 1 ? 'water-full' : pct >= 0.5 ? 'water-mid' : 'water-low';
        innerHtml = `<div style="font-family:'DM Mono',monospace;font-size:8px;color:${pct >= 1 ? '#fff' : 'rgba(52,152,219,.9)'};margin-top:2px;line-height:1;">${h2o.cups}/${goal}</div>`;
      } else { extraClass = 'rest'; }
    } else if (_calMode === 'weight') {
      const wt = wtMap[key];
      if (wt) {
        extraClass = 'bw-logged';
        innerHtml = `<div style="font-family:'DM Mono',monospace;font-size:7px;color:rgba(200,180,240,.95);margin-top:2px;line-height:1;">${wt.weight}${wt.unit}</div>`;
      } else { extraClass = 'rest'; }
    }

    // always show micro-dots for ALL trackers (overlay mode â€” show what was tracked that day)
    const dotWorkout = wkMap[key] ? `<div class="cal-day-dot workout" title="${wkMap[key].count} workout(s)"></div>` : '';
    const dotSteps = stMap[key] && stMap[key].steps > 0 ? `<div class="cal-day-dot steps"  title="${stMap[key].steps} steps"></div>` : '';
    const dotWater = h2oMap[key] && h2oMap[key].cups > 0 ? `<div class="cal-day-dot water" title="${h2oMap[key].cups} cups"></div>` : '';
    const dotWeight = wtMap[key] ? `<div class="cal-day-dot weight" title="${wtMap[key].weight} ${wtMap[key].unit}"></div>` : '';
    const dotMeals = mealMap[key] && mealMap[key].count > 0
      ? `<div class="cal-day-dot meal" title="${mealMap[key].count} meal(s), ${Math.round(mealMap[key].kcal)} kcal"></div>`
      : '';
    const dotsRow = (dotWorkout || dotSteps || dotWater || dotWeight || dotMeals)
      ? `<div class="cal-day-dots">${dotWorkout}${dotSteps}${dotWater}${dotWeight}${dotMeals}</div>` : '';

    const classes = ['wk-cal-day', extraClass, isToday ? 'today-marker' : '', isSel ? 'cal-selected' : ''].filter(Boolean).join(' ');
    dayCells += `<div class="${classes}" style="${bgStyle}${glowStyle}" onclick="calSelectDay('${key}')">
      <span class="cal-day-num">${d}</span>
      ${innerHtml}
      ${dotsRow}
      ${isToday ? '<div class="wk-cal-dot"></div>' : ''}
    </div>`;
  }

  const dowCells = dowLabels.map(l => `<div class="wk-cal-dow">${l}</div>`).join('');

  // â”€â”€ Selected day detail card â”€â”€
  let selDetail = '';
  if (_calSelectedDate) {
    const wk = wkMap[_calSelectedDate];
    const st = stMap[_calSelectedDate];
    const h2o = h2oMap[_calSelectedDate];
    const wt = wtMap[_calSelectedDate];
    const meal = mealMap[_calSelectedDate];
    const goal = (typeof _waterGoalCups !== 'undefined') ? _waterGoalCups : 8;
    const stGoal = st ? (st.goal || 10000) : 10000;

    const d = new Date(_calSelectedDate + 'T00:00:00');
    const dateLabel = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { weekday: 'long', month: 'long', day: 'numeric' });

    const cellWkt = wk
      ? `<div class="cal-ddc-label">${_histSvgIcon('workout')} ${isAr ? 'طھظ…ط±ظٹظ†' : 'Workout'}</div>
         <div class="cal-ddc-val">${wk.count}<span class="cal-ddc-unit">${isAr ? 'ط¬ظ„ط³ط©' : 'sess'}</span></div>
         <div class="cal-ddc-sub">${Math.round(wk.vol).toLocaleString()} kg vol</div>
         <div class="cal-ddc-bar"><div class="cal-ddc-bar-fill" style="width:100%;background:#2ecc71;"></div></div>`
      : `<div class="cal-ddc-label">${_histSvgIcon('workout')} ${isAr ? 'طھظ…ط±ظٹظ†' : 'Workout'}</div><div class="cal-ddc-empty">${isAr ? 'ط±ط§ط­ط©' : 'Rest day'}</div>`;

    const stPct = st && st.steps ? Math.min(100, Math.round(st.steps / stGoal * 100)) : 0;
    const cellSt = st && st.steps
      ? `<div class="cal-ddc-label">${_histSvgIcon('steps')} ${isAr ? 'ط®ط·ظˆط§طھ' : 'Steps'}</div>
         <div class="cal-ddc-val">${(st.steps / 1000).toFixed(1)}<span class="cal-ddc-unit">k</span></div>
         <div class="cal-ddc-sub">${stPct}% ${isAr ? 'ظ…ظ† ط§ظ„ظ‡ط¯ظپ' : 'of goal'}</div>
         <div class="cal-ddc-bar"><div class="cal-ddc-bar-fill" style="width:${stPct}%;background:#f39c12;"></div></div>`
      : `<div class="cal-ddc-label">${_histSvgIcon('steps')} ${isAr ? 'ط®ط·ظˆط§طھ' : 'Steps'}</div><div class="cal-ddc-empty">${isAr ? 'ظ„ط§ ط¨ظٹط§ظ†ط§طھ' : 'Not logged'}</div>`;

    const h2oPct = h2o ? Math.min(100, Math.round(h2o.cups / goal * 100)) : 0;
    const cellH2o = h2o && h2o.cups
      ? `<div class="cal-ddc-label">${_histSvgIcon('water')} ${isAr ? 'ظ…ط§ط،' : 'Water'}</div>
         <div class="cal-ddc-val">${h2o.cups}<span class="cal-ddc-unit">/${goal}</span></div>
         <div class="cal-ddc-sub">${h2oPct}% ${isAr ? 'ظ…ظ† ط§ظ„ظ‡ط¯ظپ' : 'of goal'}</div>
         <div class="cal-ddc-bar"><div class="cal-ddc-bar-fill" style="width:${h2oPct}%;background:#3498db;"></div></div>`
      : `<div class="cal-ddc-label">${_histSvgIcon('water')} ${isAr ? 'ظ…ط§ط،' : 'Water'}</div><div class="cal-ddc-empty">${isAr ? 'ظ„ط§ ط¨ظٹط§ظ†ط§طھ' : 'Not logged'}</div>`;

    const cellWt = wt
      ? `<div class="cal-ddc-label">${_histSvgIcon('weight')} ${isAr ? 'ط§ظ„ظˆط²ظ†' : 'Weight'}</div>
         <div class="cal-ddc-val">${wt.weight}<span class="cal-ddc-unit">${wt.unit}</span></div>
         <div class="cal-ddc-sub" style="margin-top:4px;">&nbsp;</div>
         <div class="cal-ddc-bar"><div class="cal-ddc-bar-fill" style="width:100%;background:#9b59b6;"></div></div>`
      : `<div class="cal-ddc-label">${_histSvgIcon('weight')} ${isAr ? 'ط§ظ„ظˆط²ظ†' : 'Weight'}</div><div class="cal-ddc-empty">${isAr ? 'ظ„ط§ ط¨ظٹط§ظ†ط§طھ' : 'Not logged'}</div>`;

    const cellMeal = meal && meal.count
      ? `<div class="cal-ddc-label">${_histSvgIcon('meals')} ${isAr ? 'ط§ظ„ظˆط¬ط¨ط§طھ' : 'Meals'}</div>
         <div class="cal-ddc-val">${meal.count}<span class="cal-ddc-unit">${isAr ? 'ظˆط¬ط¨ط©' : 'meal'}</span></div>
         <div class="cal-ddc-sub">${Math.round(meal.kcal)} ${isAr ? 'ط³ط¹ط±ط©' : 'kcal'} â€¢ ${Math.round(meal.p)}P ${Math.round(meal.c)}C ${Math.round(meal.f)}F</div>
         <div class="cal-ddc-bar"><div class="cal-ddc-bar-fill" style="width:${Math.min(100, meal.count * 25)}%;background:#e67e22;"></div></div>`
      : `<div class="cal-ddc-label">${_histSvgIcon('meals')} ${isAr ? 'ط§ظ„ظˆط¬ط¨ط§طھ' : 'Meals'}</div><div class="cal-ddc-empty">${isAr ? 'ظ„ط§ ط¨ظٹط§ظ†ط§طھ' : 'Not logged'}</div>`;

    selDetail = `<div class="cal-day-detail">
      <div class="cal-day-detail-header">${dateLabel}</div>
      <div class="cal-day-detail-body">
        <div class="cal-day-detail-cell">${cellWkt}</div>
        <div class="cal-day-detail-cell">${cellSt}</div>
        <div class="cal-day-detail-cell">${cellH2o}</div>
        <div class="cal-day-detail-cell">${cellWt}</div>
        <div class="cal-day-detail-cell">${cellMeal}</div>
      </div>
    </div>`;
  }

  // â”€â”€ Legend per mode â”€â”€
  const legends = {
    workout: `
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:#3a9e6a;"></div>${isAr ? 'طھط¯ط±ظٹط¨' : 'Trained'}</div>
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:#00c863;"></div>${isAr ? 'ط¬ظ„ط³طھط§ظ†' : '2+ sessions'}</div>
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:#00ff7f;"></div>${isAr ? 'ظ…ظƒط«ظپ' : 'Intense'}</div>`,
    steps: `
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(243,156,18,.3);"></div>${isAr ? 'ط¨ط¯ط§ظٹط©' : '< 50%'}</div>
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(243,156,18,.6);"></div>${isAr ? 'ظ†طµظپ' : '50â€“99%'}</div>
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(243,156,18,.9);"></div>${isAr ? 'ط§ظ„ظ‡ط¯ظپ' : 'Goal âœ“'}</div>`,
    water: `
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(52,152,219,.3);"></div>${isAr ? 'ظ‚ظ„ظٹظ„' : '< 50%'}</div>
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(52,152,219,.55);"></div>${isAr ? 'ظ…طھظˆط³ط·' : '50â€“99%'}</div>
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(52,152,219,.85);"></div>${isAr ? 'ظƒط§ظ…ظ„' : 'Full âœ“'}</div>`,
    weight: `
      <div class="wk-cal-legend-item"><div class="wk-cal-legend-dot" style="background:rgba(155,89,182,.5);"></div>${isAr ? 'ظ…ط³ط¬ظ„' : 'Logged'}</div>`
  };
  const microLegend = `
    <div class="wk-cal-legend-item" style="margin-top:8px;width:100%;padding-top:8px;border-top:1px solid var(--border);">
      <span style="color:var(--text3);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;margin-right:6px;">${isAr ? 'ظ†ظ‚ط§ط·:' : 'DOTS:'}</span>
      <span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px;"><div class="cal-day-dot workout" style="display:inline-block;"></div><span style="font-size:8px;">${isAr ? 'طھظ…ط±ظٹظ†' : 'Workout'}</span></span>
      <span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px;"><div class="cal-day-dot steps" style="display:inline-block;"></div><span style="font-size:8px;">${isAr ? 'ط®ط·ظˆط§طھ' : 'Steps'}</span></span>
      <span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px;"><div class="cal-day-dot water" style="display:inline-block;"></div><span style="font-size:8px;">${isAr ? 'ظ…ط§ط،' : 'Water'}</span></span>
      <span style="display:inline-flex;align-items:center;gap:3px;margin-right:6px;"><div class="cal-day-dot weight" style="display:inline-block;"></div><span style="font-size:8px;">${isAr ? 'ظˆط²ظ†' : 'Weight'}</span></span>
      <span style="display:inline-flex;align-items:center;gap:3px;"><div class="cal-day-dot meal" style="display:inline-block;"></div><span style="font-size:8px;">${isAr ? 'ظˆط¬ط¨ط§طھ' : 'Meals'}</span></span>
    </div>`;

  _dhSetHtml(wrap, `
    <div class="wk-cal-wrap">
      <div class="wk-cal-nav">
        <button class="wk-cal-btn" onclick="calNav(-1)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div class="wk-cal-month">${monthNames[month]} ${year}</div>
        <button class="wk-cal-btn" onclick="calNav(1)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      ${tabsHtml}
      <div class="wk-cal-grid">${dowCells}${dayCells}</div>
      ${selDetail}
      <div class="wk-cal-legend">${legends[_calMode] || ''}${microLegend}</div>
    </div>`);
}

function calSetMode(mode) {
  _calMode = mode;
  _calSelectedDate = null;
  renderWorkoutCalendar();
}

function calNav(dir) {
  _calMonth += dir;
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  _calSelectedDate = null;
  renderWorkoutCalendar();
}

function calSelectDay(dateKey) {
  _calSelectedDate = (_calSelectedDate === dateKey) ? null : dateKey;
  renderWorkoutCalendar();
  if (_calMode === 'workout') {
    // Filter the workout log below only when in workout mode
    if (_calSelectedDate) {
      const fl = document.getElementById('filter-exercise');
      if (fl) fl.value = '';
      _calDateFilter = _calSelectedDate;
    } else {
      _calDateFilter = null;
    }
    renderHistory();
  }
}

let _dashActiveTab = 'overview';
let _dashPeriod = '1M';

function _filterWorkoutsByPeriod(arr, period) {
  if (!period || period === 'ALL') return arr;
  const days = period === '7D' ? 7 : period === '1M' ? 30 : period === '3M' ? 90 : 180;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutStr = cutoff.toISOString().slice(0, 10);
  return arr.filter(w => (w.date || '').slice(0, 10) >= cutStr);
}

// Memoized period filter for the dashboard â€” reuses result across same-period renders
function _getPw() {
  const k = `${workouts.length}-${_dashPeriod}-${today()}`;
  if (_dashPwCache.key !== k) {
    _dashPwCache = { key: k, arr: _filterWorkoutsByPeriod(workouts, _dashPeriod) };
  }
  return _dashPwCache.arr;
}

function _setPeriod(period, btn) {
  _dashPeriod = period;
  const allPeriods = Array.from(document.querySelectorAll('.dash-period'));
  allPeriods.forEach(b => b.classList.remove('active'));
  const activeBtn = btn || allPeriods.find(b => b.dataset.period === period);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  const periodSelect = document.getElementById('dash-period-select');
  if (periodSelect && periodSelect.value !== period) periodSelect.value = period;
  renderDashboard();
}

// Overview Quick Snapshot â€” period-aware insights bar
function _renderOverviewSnapshot() {
  const _pw = _getPw();
  const isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';

  // Streak (consecutive days trained)
  const _streak = typeof calcStreak === 'function' ? calcStreak() : 0;
  const elStreak = document.getElementById('snap-streak');
  if (elStreak) {
    elStreak.textContent = _streak;
    elStreak.className = 'snap-val' + (_streak >= 3 ? ' snap-pos' : _streak > 0 ? '' : ' snap-neutral');
  }

  // Days since last session
  const elLast = document.getElementById('snap-last');
  if (elLast) {
    if (!workouts.length) {
      elLast.textContent = 'â€”';
      elLast.className = 'snap-val snap-neutral';
    } else {
      const _lastD = new Date(workouts[workouts.length - 1].date);
      const _dAgo = Math.floor((Date.now() - _lastD.getTime()) / 86400000);
      elLast.textContent = _dAgo === 0
        ? (isAr ? 'اليوم' : 'Today')
        : _dAgo === 1
          ? (isAr ? 'أمس' : 'Yest.')
          : (isAr ? `${_dAgo} يوم` : `${_dAgo}d ago`);
      elLast.className = 'snap-val' + (_dAgo <= 2 ? ' snap-pos' : _dAgo > 4 ? ' snap-neg' : '');
    }
  }

  // Volume trend vs previous period
  const elTrend = document.getElementById('snap-trend');
  if (elTrend) {
    if (_dashPeriod === 'ALL') {
      elTrend.textContent = workouts.length;
      elTrend.className = 'snap-val snap-neutral';
      const lbl = document.getElementById('snap-trend-lbl');
      if (lbl) lbl.textContent = isAr ? 'إجمالي الجلسات' : 'total sessions';
    } else {
      const _td = _dashPeriod === '7D' ? 7 : _dashPeriod === '1M' ? 30 : _dashPeriod === '3M' ? 90 : 180;
      const _pEnd = new Date(); _pEnd.setDate(_pEnd.getDate() - _td);
      const _pStart = new Date(_pEnd); _pStart.setDate(_pStart.getDate() - _td);
      const _prevPw2 = workouts.filter(w => {
        const d = (w.date || '').slice(0, 10);
        return d >= _pStart.toISOString().slice(0, 10) && d < _pEnd.toISOString().slice(0, 10);
      });
      const _curVol = _pw.reduce((a, w) => a + (w.totalVolume || 0), 0);
      const _prevVol2 = _prevPw2.reduce((a, w) => a + (w.totalVolume || 0), 0);
      if (_prevVol2 > 0) {
        const _d2 = Math.round(((_curVol - _prevVol2) / _prevVol2) * 100);
        const _s = _d2 >= 0 ? '+' : '';
        elTrend.textContent = _s + _d2 + '%';
        elTrend.className = 'snap-val' + (_d2 >= 0 ? ' snap-pos' : ' snap-neg');
      } else {
        elTrend.textContent = 'â€”';
        elTrend.className = 'snap-val snap-neutral';
      }
      const lbl2 = document.getElementById('snap-trend-lbl');
      if (lbl2) lbl2.textContent = isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period';
    }
  }

  // PRs set in current period
  const elPRs = document.getElementById('snap-prs');
  if (elPRs) {
    const _prCount = _pw.filter(w => w.isPR).length;
    elPRs.textContent = _prCount;
    elPRs.className = 'snap-val' + (_prCount > 0 ? ' snap-pos' : ' snap-neutral');
  }

  // Calisthenics snapshot row
  const _caliSnap = document.getElementById('cali-snapshot');
  const _bwW = (typeof bwWorkouts !== 'undefined') ? bwWorkouts : [];
  if (_caliSnap) {
    if (_bwW.length && typeof CALISTHENICS_TREES !== 'undefined') {
      _caliSnap.style.display = 'flex';
      let _totalUnlocked = 0; let _totalSkills = 0;
      CALISTHENICS_TREES.forEach(tree => {
        tree.levels.forEach(lvl => {
          _totalSkills++;
          const maxVal = _bwW.filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase())
            .reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
          if (maxVal >= lvl.target) _totalUnlocked++;
        });
      });
      const _caliPct = Math.round((_totalUnlocked / Math.max(_totalSkills, 1)) * 100);
      const _elSess = document.getElementById('snap-cali-sessions');
      const _elSkills = document.getElementById('snap-cali-skills');
      const _elPct = document.getElementById('snap-cali-pct');
      if (_elSess) { _elSess.textContent = _bwW.length; _elSess.className = 'snap-val snap-pos'; }
      if (_elSkills) { _elSkills.textContent = _totalUnlocked + '/' + _totalSkills; _elSkills.className = 'snap-val' + (_totalUnlocked > 0 ? ' snap-pos' : ' snap-neutral'); }
      if (_elPct) { _elPct.textContent = _caliPct + '%'; _elPct.className = 'snap-val' + (_caliPct >= 50 ? ' snap-pos' : _caliPct > 0 ? '' : ' snap-neutral'); }
    } else {
      _caliSnap.style.display = 'none';
    }
  }

  // Daily readiness ring (Whoop-style)
  const readinessLbl = document.getElementById('snap-readiness-lbl');
  if (readinessLbl) readinessLbl.textContent = isAr ? 'الجاهزية' : 'readiness';
  const ring = document.getElementById('snap-readiness-ring');
  const val = document.getElementById('snap-readiness-val');
  const readinessCard = document.getElementById('snap-readiness-card');
  if (readinessCard) {
    readinessCard.setAttribute('role', 'button');
    readinessCard.setAttribute('tabindex', '0');
    readinessCard.setAttribute('title', isAr ? 'عرض تفصيل الجاهزية' : 'Open readiness breakdown');
    const openBreakdown = () => {
      const progressBtn = document.querySelector('.dash-tab[data-tab="progress"]');
      if (typeof switchDashTab === 'function') switchDashTab('progress', progressBtn || null);
      if (typeof _renderProgressReadinessHub === 'function') _renderProgressReadinessHub();
      const hub = document.getElementById('progress-readiness-hub');
      if (hub) {
        try { hub.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_e) {}
      }
    };
    readinessCard.onclick = openBreakdown;
    readinessCard.onkeydown = (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        openBreakdown();
      }
    };
  }
  if (ring && val) {
    let r = 60;
    try {
      if (typeof window.buildCoachUnifiedState === 'function') {
        r = Math.max(0, Math.min(100, Number(window.buildCoachUnifiedState()?.readiness?.score || 60)));
      }
    } catch (_e) {}
    const ringColor = r >= 75 ? '#2ecc71' : (r >= 55 ? '#f39c12' : '#e74c3c');
    ring.style.setProperty('--pct', String(r));
    ring.style.setProperty('--ring-color', ringColor);
    val.textContent = String(Math.round(r));
  }

  // Update heatmap badge to show recovery context
  const _heatBadge = document.getElementById('heatmap-legend-badge');
  if (_heatBadge) _heatBadge.textContent = t('dash.recoveryStatus');
}

function switchDashTab(name, btn) {
  _dashActiveTab = name;
  const allTabs = Array.from(document.querySelectorAll('.dash-tab'));
  allTabs.forEach(b => b.classList.remove('active'));
  const activeBtn = btn || allTabs.find(b => b.dataset.tab === name);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  const tabSelect = document.getElementById('dash-tab-select');
  if (tabSelect && tabSelect.value !== name) tabSelect.value = name;
  // Show/hide panels by their data-dash-tab attribute
  document.querySelectorAll('#view-dashboard [data-dash-tab]').forEach(el => {
    el.style.display = el.dataset.dashTab === name ? '' : 'none';
  });
  // C2: Load photo gallery when body tab opens
  if (name === 'body' && typeof _renderPhotoGallery === 'function') _renderPhotoGallery();
  if (name === 'body' && typeof renderInBodyPanel === 'function') renderInBodyPanel();
  if (name === 'body' && typeof renderMeasurementsPanel === 'function') renderMeasurementsPanel();
  if (name === 'overview' && typeof renderGoalDashboard === 'function') renderGoalDashboard();
  if (name === 'overview' && typeof renderWeeklyReviewCard === 'function') renderWeeklyReviewCard();
  if (name === 'overview' && typeof renderDailyNonNegotiables === 'function') renderDailyNonNegotiables();
  // Render Calisthenics Journey when progress tab opens
  if (name === 'progress' && typeof renderCaliJourney === 'function') renderCaliJourney();
  // Render Calisthenics Dashboard when cali tab opens
  if (name === 'cali' && typeof renderCaliDash === 'function') renderCaliDash();
  if (name === 'nutrition' && typeof renderNutritionAnalyticsPanel === 'function') renderNutritionAnalyticsPanel();
  if (name === 'nutrition' && typeof renderWeeklyNutritionReport === 'function') renderWeeklyNutritionReport();
  if (name === 'nutrition' && typeof renderMacroTiming === 'function') renderMacroTiming();
  if (name === 'nutrition' && typeof renderAdaptiveTDEE === 'function') renderAdaptiveTDEE();
  if (name === 'progress' && typeof window.FORGE_OVERLOAD !== 'undefined') window.FORGE_OVERLOAD.renderOverloadScoreCard('overload-score-card');
  if (name === 'progress' && typeof renderVolumeLandmarks === 'function') renderVolumeLandmarks();
  if (name === 'cardio' && typeof renderCardioStatsPanel === 'function') renderCardioStatsPanel();
  if (name === 'progress') {
    _renderProgressReadinessHub();
    const tools = document.getElementById('progress-compact-tools');
    if (tools) tools.style.display = 'none';
    const view = document.getElementById('view-dashboard');
    if (view) view.classList.remove('progress-compact-mode');
    document.body.classList.remove('progress-compact-active');
  } else {
    _applyProgressAccordion();
  }
  if (name === 'overview') {
    _ensureOverviewAccordion();
    _applyOverviewAccordion();
  } else {
    _applyOverviewAccordion();
  }
}

function _renderProgressReadinessHub() {
  const view = document.getElementById('view-dashboard');
  if (!view) return;
  const tx = (en, ar) => ((typeof currentLang !== 'undefined' && currentLang === 'ar') ? ar : en);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const legacy = Array.from(view.querySelectorAll('.panel[data-dash-tab="progress"]')).filter(p => p.id !== 'progress-readiness-hub');

  let hub = document.getElementById('progress-readiness-hub');
  if (!hub) {
    hub = document.createElement('section');
    hub.id = 'progress-readiness-hub';
    hub.className = 'panel progress-readiness-hub';
    hub.dataset.dashTab = 'progress';
    const anchor = legacy[0];
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(hub, anchor);
    else view.appendChild(hub);
  }

  // Keep all existing progress panels visible; this hub is additive.
  legacy.forEach(p => { p.style.display = ''; });
  hub.style.display = '';

  const state = (typeof window.buildCoachUnifiedState === 'function')
    ? (window.buildCoachUnifiedState() || {})
    : {};
  const readiness = clamp(state.readiness?.score ?? 60, 0, 100);
  const checkin = clamp(state.readiness?.checkinScore ?? 60, 0, 100);
  const freshness = clamp(state.readiness?.freshnessScore ?? 60, 0, 100);
  const vol14 = clamp(state.trends?.weightedVol14 ?? 0, 0, 200000);
  const volPrev14 = clamp(state.trends?.weightedVolPrev14 ?? 0, 0, 200000);
  const cardio14 = clamp(state.trends?.cardioMins14 ?? 0, 0, 3000);
  const cardioPrev14 = clamp(state.trends?.cardioMinsPrev14 ?? 0, 0, 3000);
  const active7 = clamp(state.consistency?.activeDays7 ?? 0, 0, 7);
  const active28 = clamp(state.consistency?.activeDays28 ?? 0, 0, 28);
  const strain = clamp(Math.round(((vol14 / 12000) * 70) + ((cardio14 / 240) * 30)), 0, 100);
  const load = strain;
  const consistency = clamp(Math.round(((active7 / 5) * 72) + ((active28 / 18) * 28)), 0, 100);
  const cardioSupport = clamp(Math.round(((cardio14 / 180) * 70) + (cardio14 >= cardioPrev14 ? 22 : 10)), 0, 100);
  const weightedMomentum = volPrev14 > 0 ? ((vol14 - volPrev14) / volPrev14) * 100 : (vol14 > 0 ? 18 : 0);
  const cardioMomentum = cardioPrev14 > 0 ? ((cardio14 - cardioPrev14) / cardioPrev14) * 100 : (cardio14 > 0 ? 14 : 0);
  const momentum = clamp(Math.round(50 + (weightedMomentum * 0.35) + (cardioMomentum * 0.25)), 0, 100);
  const positiveBaseline = Math.round((checkin + freshness + consistency + cardioSupport + momentum + (100 - load)) / 6);
  const trendDelta = readiness - positiveBaseline;
  const ringColor = readiness >= 75 ? '#2ecc71' : (readiness >= 55 ? '#f39c12' : '#e74c3c');
  const readinessTone = readiness >= 85
    ? tx('Primed', 'جاهز بقوة')
    : readiness >= 70
      ? tx('Stable', 'مستقر')
      : readiness >= 55
        ? tx('Manage Load', 'اضبط الحمل')
        : tx('Recover First', 'استعد أولًا');
  const readinessChip = `${trendDelta >= 0 ? '+' : ''}${trendDelta} ${tx('vs baseline', 'مقارنة بالخط الأساسي')}`;
  const detailStatus = (score, invert) => {
    const val = invert ? 100 - score : score;
    if (val >= 75) return tx('Strong', 'قوي');
    if (val >= 55) return tx('Neutral', 'متوسط');
    return tx('Watch', 'انتبه');
  };
  const leadClass = (score, invert) => {
    const val = invert ? 100 - score : score;
    if (val >= 75) return 'good';
    if (val >= 55) return 'warn';
    return 'alert';
  };
  const metrics = [
    {
      key: 'checkin',
      label: tx('Check-in Quality', 'جودة التقييم اليومي'),
      score: checkin,
      invert: false,
      detail: tx(
        'Built from sleep, energy, and mood. Better sleep quality and stable pre-workout fueling move this up fastest.',
        'تعتمد على النوم والطاقة والمزاج. أسرع طريقة لرفعها هي نوم أفضل وتغذية ثابتة قبل التمرين.'
      ),
      why: tx(
        `Current check-in is ${checkin}/100 from your daily self-report.`,
        `التقييم الحالي ${checkin}/100 بناءً على تسجيلك اليومي.`
      ),
      next: tx(
        'Protect sleep, hydrate earlier, and avoid starting heavy sessions under-fueled.',
        'حافظ على النوم، وابدأ الترطيب مبكرًا، ولا تدخل جلسة ثقيلة دون طاقة كافية.'
      )
    },
    {
      key: 'freshness',
      label: tx('Freshness', 'الاستشفاء'),
      score: freshness,
      invert: false,
      detail: tx(
        'Tracks how fresh you are from recent work. Lower freshness means you should bias toward quality and technique today.',
        'تقيس مدى جاهزيتك من الحمل الأخير. انخفاضها يعني أن الأفضل اليوم هو الجودة والتقنية بدل الدفع الكامل.'
      ),
      why: tx(
        `Freshness sits at ${freshness}/100 based on recent session timing.`,
        `الاستشفاء عند ${freshness}/100 بناءً على توقيت الجلسات الأخيرة.`
      ),
      next: tx(
        'If this stays low, reduce session density or split heavy work more intelligently.',
        'إذا بقيت منخفضة، خفف كثافة الجلسات أو وزع العمل الثقيل بشكل أذكى.'
      )
    },
    {
      key: 'load',
      label: tx('Load Pressure', 'ضغط الحمل'),
      score: load,
      invert: true,
      detail: tx(
        'Derived from 14-day weighted volume and cardio minutes. Higher pressure is useful for growth, but it pushes readiness down.',
        'مستخرجة من حجم الأوزان ودقائق الكارديو خلال 14 يوم. ارتفاع الضغط مفيد للتطور لكنه يخفض الجاهزية.'
      ),
      why: tx(
        `Recent weighted load is ${vol14.toLocaleString()}kg and cardio support is ${cardio14}m over the last 14 days.`,
        `الحمل الحديث هو ${vol14.toLocaleString()} كجم مع ${cardio14} دقيقة كارديو خلال آخر 14 يومًا.`
      ),
      next: tx(
        'Use this to decide whether to push intensity or keep the day sharp and efficient.',
        'استخدمه لتحديد ما إذا كان اليوم مناسبًا للدفع أو الأفضل أن يكون حادًا وفعالًا فقط.'
      )
    },
    {
      key: 'consistency',
      label: tx('Consistency', 'الانتظام'),
      score: consistency,
      invert: false,
      detail: tx(
        'Built from active training days across the last week and month. Consistency stabilizes readiness even when sessions vary.',
        'تعتمد على أيام النشاط في الأسبوع والشهر. الانتظام يثبت الجاهزية حتى عند تغير نوع الجلسات.'
      ),
      why: tx(
        `You trained ${active7}/7 active days this week and ${active28}/28 over the last month.`,
        `تدرّبت ${active7}/7 أيام هذا الأسبوع و${active28}/28 خلال آخر شهر.`
      ),
      next: tx(
        'A stable 4 to 5 day rhythm lifts this faster than random heavy spikes.',
        'إيقاع ثابت من 4 إلى 5 أيام يرفع هذا المؤشر أسرع من الطفرات الثقيلة العشوائية.'
      )
    },
    {
      key: 'cardio',
      label: tx('Cardio Support', 'دعم الكارديو'),
      score: cardioSupport,
      invert: false,
      detail: tx(
        'Recent conditioning supports recovery quality and work capacity. This rises when cardio is present without overwhelming total load.',
        'الحالة القلبية الحديثة تدعم الاستشفاء والقدرة على العمل. ترتفع عندما يوجد كارديو منظم دون إفراط في الحمل.'
      ),
      why: tx(
        `Cardio support reflects ${cardio14} minutes in 14 days versus ${cardioPrev14} in the previous block.`,
        `يعكس هذا ${cardio14} دقيقة خلال 14 يومًا مقابل ${cardioPrev14} في الفترة السابقة.`
      ),
      next: tx(
        'Short steady sessions or recovery walks can lift readiness support without taxing strength progress.',
        'الجلسات الهادئة القصيرة أو المشي الاستشفائي يرفع الدعم دون أن يضر بتقدم القوة.'
      )
    },
    {
      key: 'momentum',
      label: tx('Momentum', 'الزخم'),
      score: momentum,
      invert: false,
      detail: tx(
        'Momentum compares this recent block against the previous one. Positive momentum means your recent rhythm is building forward.',
        'يقارن الزخم هذه الفترة بالفترة السابقة. الزخم الإيجابي يعني أن الإيقاع الحالي يتجه للأمام.'
      ),
      why: tx(
        `Weighted trend ${weightedMomentum >= 0 ? '+' : ''}${Math.round(weightedMomentum)}% and cardio trend ${cardioMomentum >= 0 ? '+' : ''}${Math.round(cardioMomentum)}%.`,
        `اتجاه الأوزان ${weightedMomentum >= 0 ? '+' : ''}${Math.round(weightedMomentum)}٪ واتجاه الكارديو ${cardioMomentum >= 0 ? '+' : ''}${Math.round(cardioMomentum)}٪.`
      ),
      next: tx(
        'Use positive momentum to push productive sessions. If momentum fades, tighten routine quality before adding more load.',
        'استغل الزخم الإيجابي لدفع جلسات منتجة. وإذا ضعف الزخم، حسّن انتظام الروتين قبل زيادة الحمل.'
      )
    }
  ];
  const weakestMetric = metrics
    .map((m) => ({ ...m, usableScore: m.invert ? 100 - m.score : m.score }))
    .sort((a, b) => a.usableScore - b.usableScore)[0];
  const strongestMetric = metrics
    .map((m) => ({ ...m, usableScore: m.invert ? 100 - m.score : m.score }))
    .sort((a, b) => b.usableScore - a.usableScore)[0];
  const insightItems = [
    strongestMetric
      ? tx(
          `${strongestMetric.label} is carrying today. Keep that rhythm stable.`,
          `مؤشر ${strongestMetric.label} هو أقوى داعم اليوم. حافظ على هذا الإيقاع.`
        )
      : '',
    load >= 72
      ? tx('Load pressure is elevated. A sharper, shorter session could protect tomorrow.', 'ضغط الحمل مرتفع. جلسة أقصر وأكثر دقة قد تحمي جاهزية الغد.')
      : tx('Load pressure is under control. This is a good window for quality output.', 'ضغط الحمل تحت السيطرة. هذه نافذة جيدة لإخراج قوي بجودة عالية.'),
    weakestMetric
      ? tx(
          `${weakestMetric.label} is the main limiter. Fix this first for the fastest readiness gain.`,
          `مؤشر ${weakestMetric.label} هو القيد الرئيسي الآن. إصلاحه أولًا يرفع الجاهزية أسرع.`
        )
      : ''
  ].filter(Boolean);

  hub.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">${tx('Readiness Breakdown', 'تفصيل الجاهزية')}</div>
      <div class="panel-sub">${tx('Interactive score composition', 'تفصيل تفاعلي لمكونات النتيجة')}</div>
    </div>
    <div class="prg-ready-dashboard">
      <div class="prg-ready-grid">
        <div class="prg-ready-ring" style="--pct:${readiness};--ring-color:${ringColor};">
          <div class="prg-ready-center">
            <div class="prg-ready-score">${readiness}</div>
            <div class="prg-ready-unit">/100</div>
          </div>
        </div>
        <div class="prg-ready-copy">
          <div class="prg-ready-kicker">${tx('Today Readiness', 'جاهزية اليوم')}</div>
          <div class="prg-ready-head">${readinessTone}</div>
          <div class="prg-ready-msg">${state.readiness?.message || tx('Train with intent and smart load control.', 'تدرّب بذكاء وتحكم في الحمل التدريبي.')}</div>
          <div class="prg-ready-tags">
            <span class="prg-tag ${readiness >= 75 ? 'good' : readiness >= 55 ? 'warn' : 'alert'}">${tx('Overall', 'الإجمالي')}</span>
            <span class="prg-tag ${checkin >= 70 ? 'good' : checkin >= 50 ? 'warn' : 'alert'}">${tx('Check-in', 'التقييم اليومي')}</span>
            <span class="prg-tag ${freshness >= 70 ? 'good' : freshness >= 50 ? 'warn' : 'alert'}">${tx('Recovery', 'التعافي')}</span>
            <span class="prg-trend-chip ${trendDelta >= 0 ? 'up' : 'down'}">${readinessChip}</span>
          </div>
        </div>
      </div>
      <div class="prg-ready-tile-grid">
        ${metrics.map((metric) => `
          <button class="prg-factor ${leadClass(metric.score, metric.invert)}" data-factor="${metric.key}">
            <span>${metric.label}</span>
            <strong>${metric.score}</strong>
            <small>${detailStatus(metric.score, metric.invert)}</small>
            <em><i style="width:${metric.score}%;"></i></em>
          </button>
        `).join('')}
      </div>
      <div class="prg-ready-contribs">
        <div class="prg-contrib-head">
          <span>${tx('Contribution Mix', 'مزيج المساهمة')}</span>
          <small>${tx('Gain and drain on readiness', 'ما يدعم أو يضغط الجاهزية')}</small>
        </div>
        <div class="prg-contrib-list">
          ${metrics.map((metric) => `
            <div class="prg-contrib ${metric.invert ? 'drain' : 'gain'}">
              <span>${metric.label}</span>
              <em><i style="width:${metric.invert ? metric.score : (metric.score)}%;"></i></em>
              <strong>${metric.invert ? tx('Drain', 'ضغط') : tx('Support', 'دعم')}</strong>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="prg-ready-insights">
        ${insightItems.map((line) => `<div class="prg-insight">${line}</div>`).join('')}
      </div>
    </div>
    <div class="prg-ready-detail" id="progress-readiness-details"></div>
  `;

  const details = hub.querySelector('#progress-readiness-details');
  const info = metrics.reduce((acc, metric) => {
    acc[metric.key] = metric;
    return acc;
  }, {});

  const paint = (key) => {
    const pack = info[key] || info.checkin;
    hub.querySelectorAll('.prg-factor').forEach(b => b.classList.toggle('active', b.dataset.factor === key));
    if (details) {
      details.innerHTML = `
        <div class="prg-ready-detail-top">
          <div>
            <strong>${pack.label}</strong>
            <small class="${leadClass(pack.score, pack.invert)}">${detailStatus(pack.score, pack.invert)}</small>
          </div>
          <div class="prg-ready-detail-score">${pack.score}</div>
        </div>
        <p>${pack.detail}</p>
        <div class="prg-ready-detail-meta">
          <div class="prg-ready-detail-card">
            <span>${tx('Why it sits here', 'لماذا هو عند هذا المستوى')}</span>
            <strong>${pack.why}</strong>
          </div>
          <div class="prg-ready-detail-card">
            <span>${tx('Next move', 'الخطوة التالية')}</span>
            <strong>${pack.next}</strong>
          </div>
        </div>
      `;
    }
  };
  hub.querySelectorAll('.prg-factor').forEach(btn => {
    btn.onclick = () => paint(btn.dataset.factor);
  });
  paint(weakestMetric?.key || 'checkin');
}

let _progressAccordionInit = false;
let _progressAccordionOpenIndex = 0;

function _getProgressPanels() {
  return Array.from(document.querySelectorAll('#view-dashboard .panel[data-dash-tab="progress"]'));
}

function _isProgressCompactMobile() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:700px)').matches;
}

function _ensureProgressAccordion() {
  const panels = _getProgressPanels();
  const isAr = (typeof currentLang !== 'undefined' && currentLang === 'ar');

  panels.forEach((panel, idx) => {
    const header = panel.querySelector('.panel-header');
    if (!header) return;
    let btn = header.querySelector('.prog-acc-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prog-acc-toggle';
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
      btn.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        _progressAccordionOpenIndex = (_progressAccordionOpenIndex === idx) ? -1 : idx;
        _applyProgressAccordion();
      };
      header.appendChild(btn);
    }
    const title = (header.querySelector('.panel-title')?.textContent || `Panel ${idx + 1}`).trim();
    btn.setAttribute('aria-label', (isAr ? 'فتح أو طي: ' : 'Expand or collapse: ') + title);
  });

  let tools = document.getElementById('progress-compact-tools');
  if (!tools) {
    tools = document.createElement('div');
    tools.id = 'progress-compact-tools';
    tools.className = 'progress-compact-tools';
    tools.innerHTML = `
      <select id="progress-compact-select" class="progress-compact-select" aria-label="Progress section"></select>
      <button type="button" id="progress-compact-collapse-btn" class="progress-compact-collapse-btn">Collapse</button>
    `;
    const periodStrip = document.getElementById('dash-period-strip');
    if (periodStrip && periodStrip.parentNode) {
      periodStrip.parentNode.insertBefore(tools, periodStrip.nextSibling);
    } else {
      const view = document.getElementById('view-dashboard');
      if (view) view.insertBefore(tools, view.firstChild);
    }
  }

  const sel = document.getElementById('progress-compact-select');
  if (sel) {
    sel.innerHTML = panels.map((panel, idx) => {
      const tEl = panel.querySelector('.panel-title');
      const title = (tEl ? tEl.textContent : '').trim() || `Panel ${idx + 1}`;
      return `<option value="${idx}">${title}</option>`;
    }).join('');
    sel.onchange = () => {
      _progressAccordionOpenIndex = parseInt(sel.value, 10);
      _applyProgressAccordion();
      const activePanel = panels[_progressAccordionOpenIndex];
      if (activePanel) activePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  const colBtn = document.getElementById('progress-compact-collapse-btn');
  if (colBtn) {
    colBtn.textContent = isAr ? 'طي الكل' : 'Collapse all';
    colBtn.onclick = () => {
      if (_progressAccordionOpenIndex === -1) _progressAccordionOpenIndex = 0;
      else _progressAccordionOpenIndex = -1;
      _applyProgressAccordion();
    };
  }

  if (!_progressAccordionInit) {
    window.addEventListener('resize', () => {
      if (_dashActiveTab === 'progress') _applyProgressAccordion();
    });
    _progressAccordionInit = true;
  }
}

function _applyProgressAccordion() {
  const view = document.getElementById('view-dashboard');
  if (!view) return;
  const panels = _getProgressPanels();
  const useCompact = _dashActiveTab === 'progress' && _isProgressCompactMobile();
  view.classList.toggle('progress-compact-mode', useCompact);
  document.body.classList.toggle('progress-compact-active', useCompact);

  const tools = document.getElementById('progress-compact-tools');
  if (tools) tools.style.display = useCompact ? 'flex' : 'none';

  if (!panels.length) return;
  if (_progressAccordionOpenIndex < -1 || _progressAccordionOpenIndex >= panels.length) _progressAccordionOpenIndex = 0;

  const sel = document.getElementById('progress-compact-select');
  if (sel && _progressAccordionOpenIndex >= 0) sel.value = String(_progressAccordionOpenIndex);

  const colBtn = document.getElementById('progress-compact-collapse-btn');
  const isAr = (typeof currentLang !== 'undefined' && currentLang === 'ar');
  if (colBtn) {
    colBtn.textContent = _progressAccordionOpenIndex === -1
      ? (isAr ? 'فتح الأول' : 'Open first')
      : (isAr ? 'طي الكل' : 'Collapse all');
  }

  panels.forEach((panel, idx) => {
    const btn = panel.querySelector('.prog-acc-toggle');
    const expanded = !useCompact || idx === _progressAccordionOpenIndex;
    panel.classList.toggle('progress-collapsed', !expanded);
    if (btn) {
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.style.display = useCompact ? 'inline-flex' : 'none';
    }
  });
}

let _overviewAccordionInit = false;
let _overviewAccordionOpenIndex = 0;

function _getOverviewPanels() {
  return Array.from(document.querySelectorAll('#view-dashboard .panel[data-dash-tab="overview"]'));
}

function _isOverviewCompactMobile() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:700px)').matches;
}

function _ensureOverviewAccordion() {
  const panels = _getOverviewPanels();
  const isAr = (typeof currentLang !== 'undefined' && currentLang === 'ar');

  panels.forEach((panel, idx) => {
    const header = panel.querySelector('.panel-header');
    if (!header) return;
    let btn = header.querySelector('.ov-acc-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ov-acc-toggle';
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
      btn.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        _overviewAccordionOpenIndex = (_overviewAccordionOpenIndex === idx) ? -1 : idx;
        _applyOverviewAccordion();
      };
      header.appendChild(btn);
    }
    const title = (header.querySelector('.panel-title')?.textContent || `Section ${idx + 1}`).trim();
    btn.setAttribute('aria-label', (isAr ? 'فتح أو طي: ' : 'Expand or collapse: ') + title);
  });

  let tools = document.getElementById('overview-compact-tools');
  if (!tools) {
    tools = document.createElement('div');
    tools.id = 'overview-compact-tools';
    tools.className = 'overview-compact-tools';
    tools.innerHTML = `
      <select id="overview-compact-select" class="overview-compact-select" aria-label="Overview section"></select>
      <button type="button" id="overview-compact-collapse-btn" class="overview-compact-collapse-btn">Collapse</button>
    `;
    const anchor =
      document.getElementById('overview-quick-actions') ||
      document.getElementById('overview-snapshot') ||
      document.getElementById('muscle-heatmap-panel');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(tools, anchor.nextSibling);
  }

  const sel = document.getElementById('overview-compact-select');
  if (sel) {
    sel.innerHTML = panels.map((panel, idx) => {
      const tEl = panel.querySelector('.panel-title');
      const title = (tEl ? tEl.textContent : '').trim() || `Section ${idx + 1}`;
      return `<option value="${idx}">${title}</option>`;
    }).join('');
    sel.onchange = () => {
      _overviewAccordionOpenIndex = parseInt(sel.value, 10);
      _applyOverviewAccordion();
      const activePanel = panels[_overviewAccordionOpenIndex];
      if (activePanel) activePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  const colBtn = document.getElementById('overview-compact-collapse-btn');
  if (colBtn) {
    colBtn.textContent = isAr ? 'طي الكل' : 'Collapse all';
    colBtn.onclick = () => {
      if (_overviewAccordionOpenIndex === -1) _overviewAccordionOpenIndex = 0;
      else _overviewAccordionOpenIndex = -1;
      _applyOverviewAccordion();
    };
  }

  if (!_overviewAccordionInit) {
    window.addEventListener('resize', () => {
      if (_dashActiveTab === 'overview') _applyOverviewAccordion();
    });
    _overviewAccordionInit = true;
  }
}

function _applyOverviewAccordion() {
  const view = document.getElementById('view-dashboard');
  if (!view) return;
  const panels = _getOverviewPanels();
  const useCompact = _dashActiveTab === 'overview' && _isOverviewCompactMobile();
  view.classList.toggle('overview-compact-mode', useCompact);

  const tools = document.getElementById('overview-compact-tools');
  if (tools) tools.style.display = useCompact ? 'flex' : 'none';

  if (!panels.length) return;
  if (_overviewAccordionOpenIndex < -1 || _overviewAccordionOpenIndex >= panels.length) _overviewAccordionOpenIndex = 0;

  const sel = document.getElementById('overview-compact-select');
  if (sel && _overviewAccordionOpenIndex >= 0) sel.value = String(_overviewAccordionOpenIndex);

  const colBtn = document.getElementById('overview-compact-collapse-btn');
  const isAr = (typeof currentLang !== 'undefined' && currentLang === 'ar');
  if (colBtn) {
    colBtn.textContent = _overviewAccordionOpenIndex === -1
      ? (isAr ? 'فتح الأول' : 'Open first')
      : (isAr ? 'طي الكل' : 'Collapse all');
  }

  panels.forEach((panel, idx) => {
    const btn = panel.querySelector('.ov-acc-toggle');
    const expanded = !useCompact || idx === _overviewAccordionOpenIndex;
    panel.classList.toggle('overview-collapsed', !expanded);
    if (btn) {
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.style.display = useCompact ? 'inline-flex' : 'none';
    }
  });
}

// â”€â”€ Muscle MVP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getLastWeekMVP() {
  if (!workouts.length) return null;
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0=Monâ€¦6=Sun
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - dow);
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);

  const vol = {};
  workouts.forEach(w => {
    const d = new Date(w.date || w.ts);
    if (d < lastMonday || d > lastSunday) return;
    const muscle = w.muscle || 'other';
    (w.sets || []).forEach(s => {
      vol[muscle] = (vol[muscle] || 0) + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
    });
  });
  if (!Object.keys(vol).length) return null;
  return Object.entries(vol).sort((a, b) => b[1] - a[1])[0][0];
}

function renderMVPZone() {
  document.querySelectorAll('.body-zone.mvp-zone').forEach(el => el.classList.remove('mvp-zone'));
  document.querySelectorAll('.mvp-badge').forEach(el => el.remove());
  const mvp = getLastWeekMVP();
  if (!mvp) return;
  document.querySelectorAll(`.body-zone[data-muscle="${mvp}"]`).forEach(el => el.classList.add('mvp-zone'));
  // Badge on muscle button if present
  const btn = document.querySelector(`.muscle-btn[data-group="${mvp}"], [data-muscle="${mvp}"] .muscle-label`);
  if (btn) {
    const badge = document.createElement('span');
    badge.className = 'mvp-badge';
    badge.textContent = 'ًںڈ† MVP';
    btn.appendChild(badge);
  }
}

// â”€â”€ Weak Point Blitz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BLITZ_EXERCISES = {
  Chest: { ex: 'Push-Ups', target: '3 أ— 15' },
  Back: { ex: 'Bodyweight Rows', target: '3 أ— 12' },
  Shoulders: { ex: 'Pike Push-Ups', target: '3 أ— 10' },
  Legs: { ex: 'Bodyweight Squats', target: '3 أ— 20' },
  Core: { ex: 'Plank Hold', target: '3 أ— 30s' },
  Biceps: { ex: 'Chin-Ups', target: '3 أ— 8' },
  Triceps: { ex: 'Diamond Push-Ups', target: '3 أ— 12' },
  Forearms: { ex: 'Dead Hangs', target: '3 أ— 20s' },
  Glutes: { ex: 'Hip Thrusts', target: '3 أ— 20' },
  Calves: { ex: 'Calf Raises', target: '50 reps' },
  Neck: { ex: 'Neck Circles', target: '3 أ— 10 each side' },
  Traps: { ex: 'Barbell Shrugs', target: '3 أ— 12' },
  'Lower Back': { ex: 'Superman Holds', target: '3 أ— 12' }
};

function getWeakMuscle() {
  const ALL = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves', 'Neck', 'Traps', 'Lower Back'];
  const w = getWorkouts();
  if (!w.length) return null;
  const counts = {};
  w.forEach(x => { counts[x.muscle] = (counts[x.muscle] || 0) + 1; });
  const maxC = Math.max(...ALL.map(m => counts[m] || 0), 1);
  const scores = {};
  ALL.forEach(m => { scores[m] = Math.round(((counts[m] || 0) / maxC) * 100); });
  const sorted = ALL.map(m => ({ muscle: m, score: scores[m] })).sort((a, b) => a.score - b.score);
  return sorted[0] && sorted[0].score < 40 ? sorted[0].muscle : null;
}

// â”€â”€ Rescue Mission (Feature 5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _RESCUE_REPS = {
  Chest: 45, Back: 36, Shoulders: 30, Legs: 60, Core: 90,
  Biceps: 24, Triceps: 36, Forearms: 60, Glutes: 60,
  Calves: 50, Neck: 30, Traps: 36, 'Lower Back': 36
};

function getRescueMission() {
  const ALL = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves', 'Neck', 'Traps', 'Lower Back'];
  const w = getWorkouts();
  if (!w.length) return null;

  // Find muscle not trained in 7+ days
  const now = Date.now();
  const DAY = 86400000;
  const lastTrained = {};
  w.forEach(x => {
    const t = new Date(x.date).getTime();
    if (!lastTrained[x.muscle] || t > lastTrained[x.muscle]) lastTrained[x.muscle] = t;
  });

  // Pick most neglected muscle (longest since trained, min 7 days)
  let worst = null; let worstDays = 0;
  ALL.forEach(m => {
    const last = lastTrained[m] || 0;
    const days = (now - last) / DAY;
    if (days >= 7 && days > worstDays) { worst = m; worstDays = days; }
  });
  if (!worst) return null;

  // Count reps done today for this muscle
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayReps = w.filter(x => x.muscle === worst && x.date && x.date.slice(0, 10) === todayStr)
    .reduce((sum, x) => sum + (x.sets || []).reduce((s, st) => s + (st.reps || 0), 0), 0);

  const target = _RESCUE_REPS[worst] || 30;
  const blitz = BLITZ_EXERCISES[worst] || { ex: worst, target: '3أ—12' };
  const done = todayReps >= target;

  return {
    muscle: worst,
    days: Math.floor(worstDays),
    ex: blitz.ex,
    blitzTarget: blitz.target,
    repTarget: target,
    repsDone: todayReps,
    pct: Math.min(1, todayReps / target),
    done
  };
}

function renderNeglectedZones() {
  document.querySelectorAll('.body-zone.zone-neglected').forEach(el => el.classList.remove('zone-neglected'));
  const weak = getWeakMuscle();
  if (!weak) return;
  document.querySelectorAll(`.body-zone[data-muscle="${weak}"]`).forEach(el => {
    if (!el.classList.contains('zone-selected')) el.classList.add('zone-neglected');
  });
}

// â”€â”€ Week vs Last Week Comparison â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderWeekComparison() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  const thisMonday = new Date(now); thisMonday.setDate(now.getDate() - dow); thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday); lastSunday.setDate(thisMonday.getDate() - 1); lastSunday.setHours(23, 59, 59, 999);

  function weekStats(from, to) {
    const ws = workouts.filter(w => { const d = new Date(w.date); return d >= from && d <= to; });
    const vol = ws.reduce((a, w) => a + (w.totalVolume || 0), 0);
    const sets = ws.reduce((a, w) => a + (w.sets || []).length, 0);
    return { sessions: ws.length, vol: Math.round(vol), sets };
  }
  const tw = weekStats(thisMonday, now);
  const lw = weekStats(lastMonday, lastSunday);

  const elTv = document.getElementById('wcmp-this-vol'); if (elTv) elTv.textContent = tw.vol ? tw.vol.toLocaleString() + ' kg' : 'â€”';
  const elTs = document.getElementById('wcmp-this-sess'); if (elTs) elTs.textContent = tw.sessions || '0';
  const elTst = document.getElementById('wcmp-this-sets'); if (elTst) elTst.textContent = tw.sets || '0';
  const elLv = document.getElementById('wcmp-last-vol'); if (elLv) elLv.textContent = lw.vol ? lw.vol.toLocaleString() + ' kg' : 'â€”';
  const elLs = document.getElementById('wcmp-last-sess'); if (elLs) elLs.textContent = lw.sessions || '0';
  const elLst = document.getElementById('wcmp-last-sets'); if (elLst) elLst.textContent = lw.sets || '0';

  const badge = document.getElementById('week-compare-badge');
  if (badge) {
    if (!lw.sessions) {
      badge.textContent = 'NEW';
      badge.style.background = 'var(--accent)';
      badge.style.color = '#000';
    } else if (tw.vol >= lw.vol) {
      badge.textContent = 'UP';
      badge.style.background = 'rgba(46,204,113,.2)';
      badge.style.color = '#2ecc71';
    } else {
      badge.textContent = 'DOWN';
      badge.style.background = 'rgba(231,76,60,.15)';
      badge.style.color = '#e74c3c';
    }
  }

  const deltas = document.getElementById('wcmp-deltas');
  if (deltas && lw.sessions) {
    const volDelta = lw.vol ? Math.round(((tw.vol - lw.vol) / lw.vol) * 100) : 0;
    const sessDelta = tw.sessions - lw.sessions;
    const sign = n => n >= 0 ? '+' : '';
    deltas.innerHTML = [
      { label: 'Volume', val: `${sign(volDelta)}${volDelta}%`, up: volDelta >= 0 },
      { label: 'Sessions', val: `${sign(sessDelta)}${sessDelta}`, up: sessDelta >= 0 }
    ].map(d => `<span class="week-delta-badge ${d.up ? 'up' : 'down'}">${d.label}: ${d.val}</span>`).join('');
  }
}

// â”€â”€ Muscle Recovery Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderRecoveryMap() {
  const grid = document.getElementById('recovery-map-grid');
  if (!grid) return;
  const ALL = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves', 'Neck', 'Traps', 'Lower Back'];
  const lastDate = {};
  workouts.forEach(w => {
    const d = new Date(w.date);
    if (!lastDate[w.muscle] || d > lastDate[w.muscle]) lastDate[w.muscle] = d;
  });
  const now = Date.now();
  grid.innerHTML = ALL.map(m => {
    const last = lastDate[m];
    if (!last) return `<div class="rcv-card never"><div class="rcv-card-name">${m}</div><div class="rcv-card-status" style="color:var(--text3);">Never</div></div>`;
    const hrs = (now - last.getTime()) / 3600000;
    let cls; let statusTxt;
    if (hrs < 24) { cls = 'tired'; statusTxt = `${Math.round(hrs)}h ago ًں”´`; } else if (hrs < 48) { cls = 'recovering'; statusTxt = `${Math.round(hrs)}h ago ًںں،`; } else { cls = 'fresh'; statusTxt = `${Math.round(hrs / 24)}d ago âœ…`; }
    return `<div class="rcv-card ${cls}"><div class="rcv-card-name">${m}</div><div class="rcv-card-status">${statusTxt}</div></div>`;
  }).join('');
}

// â”€â”€ Personal Best Board â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderPBBoard() {
  const board = document.getElementById('pb-board');
  if (!board) return;
  if (!workouts.length) { board.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:.8rem;">No workouts logged yet.</div>'; return; }
  const bests = {};
  workouts.forEach(w => {
    const maxW = Math.max(...(w.sets || []).map(s => parseFloat(s.weight) || 0));
    if (!maxW) return;
    if (!bests[w.muscle] || maxW > bests[w.muscle].weight) {
      bests[w.muscle] = { weight: maxW, exercise: w.exercise, date: w.date };
    }
  });
  const sorted = Object.entries(bests).sort((a, b) => b[1].weight - a[1].weight);
  if (!sorted.length) { board.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:.8rem;">Log weighted workouts to see your PRs here.</div>'; return; }
  board.innerHTML = sorted.map(([muscle, pb]) => {
    const d = new Date(pb.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return `<div class="pb-row">
      <span class="pb-muscle">${muscle}</span>
      <span class="pb-exercise">${pb.exercise}</span>
      <span class="pb-weight">${pb.weight}kg</span>
      <span class="pb-date">${d}</span>
    </div>`;
  }).join('');
}

const _STRENGTH_STD = {
  Chest: { ex: 'Bench Press', beginner: 0.5, intermediate: 1.0, advanced: 1.3, elite: 1.6 },
  Back: { ex: 'Deadlift', beginner: 0.8, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
  Shoulders: { ex: 'Overhead Press', beginner: 0.35, intermediate: 0.65, advanced: 0.9, elite: 1.1 },
  Legs: { ex: 'Squat', beginner: 0.6, intermediate: 1.25, advanced: 1.6, elite: 2.0 },
  Biceps: { ex: 'Barbell Curl', beginner: 0.25, intermediate: 0.5, advanced: 0.7, elite: 0.9 },
  Triceps: { ex: 'Tricep Pushdown', beginner: 0.2, intermediate: 0.4, advanced: 0.6, elite: 0.75 }
};

let _ssFilter = '';
function setSsFilter(m) {
  _ssFilter = (_ssFilter === m) ? '' : m;
  renderStrengthStandards();
}

function renderStrengthStandards() {
  const card = document.getElementById('strength-std-card');
  if (!card) return;
  const bw = bodyWeight.length ? bodyWeight[bodyWeight.length - 1].weight : 75;
  const bests = {};
  workouts.forEach(w => {
    const maxW = Math.max(...(w.sets || []).map(s => parseFloat(s.weight) || 0));
    if (!maxW) return;
    if (!bests[w.muscle] || maxW > bests[w.muscle]) bests[w.muscle] = maxW;
  });
  const _isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';
  const unit = _isAr ? 'ظƒط¬ظ…' : 'kg';
  const LVL_COLOR = { untrained: '#888', beginner: '#95a5a6', intermediate: '#3498db', advanced: '#2ecc71', elite: '#ffd700' };
  const LVL_LABEL = { untrained: 'Untrained', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', elite: 'Elite' };
  const ICONS = { Chest: 'ًںڈ‹ï¸ڈ', Back: 'ًں”™', Shoulders: 'ًں¤·', Legs: 'ًں¦µ', Biceps: 'ًں’ھ', Triceps: 'ًں’ھ' };

  // Muscle filter chips
  const chipsEl = document.getElementById('ss-muscle-chips');
  if (chipsEl) {
    chipsEl.innerHTML = Object.keys(_STRENGTH_STD).map(m =>
      `<button class="vol-muscle-chip${_ssFilter === m ? ' active' : ''}" onclick="setSsFilter('${m}')">${m}</button>`
    ).join('');
  }

  const entries = Object.entries(_STRENGTH_STD).filter(([m]) => !_ssFilter || m === _ssFilter);

  // Compute stats per muscle
  const stats = entries.map(([muscle, std]) => {
    const pr = bests[muscle] || 0;
    const ratio = pr > 0 ? pr / bw : 0;
    let level = 'untrained'; let pct = 0; let nextLevel = 'Beginner'; let nextGoalRatio = std.beginner;
    if (ratio >= std.elite) {
      level = 'elite'; pct = 100; nextLevel = 'Elite'; nextGoalRatio = std.elite;
    } else if (ratio >= std.advanced) {
      level = 'advanced'; pct = 75 + 25 * (ratio - std.advanced) / (std.elite - std.advanced);
      nextLevel = 'Elite'; nextGoalRatio = std.elite;
    } else if (ratio >= std.intermediate) {
      level = 'intermediate'; pct = 50 + 25 * (ratio - std.intermediate) / (std.advanced - std.intermediate);
      nextLevel = 'Advanced'; nextGoalRatio = std.advanced;
    } else if (ratio >= std.beginner) {
      level = 'beginner'; pct = 25 + 25 * (ratio - std.beginner) / (std.intermediate - std.beginner);
      nextLevel = 'Intermediate'; nextGoalRatio = std.intermediate;
    } else if (pr > 0) {
      level = 'untrained'; pct = 25 * (ratio / std.beginner);
      nextLevel = 'Beginner'; nextGoalRatio = std.beginner;
    }
    pct = Math.min(100, Math.max(0, pct));
    const nextGoalKg = (nextGoalRatio * bw).toFixed(1);
    const toGoKg = Math.max(0, nextGoalRatio * bw - pr).toFixed(1);
    return { muscle, std, pr, pct: Math.round(pct), level, nextLevel, nextGoalKg, toGoKg };
  });

  // Summary bar: overall level + tracked count
  const summaryEl = document.getElementById('ss-summary-bar');
  if (summaryEl) {
    const withData = stats.filter(s => s.pr > 0);
    if (withData.length) {
      const lvOrd = { untrained: 0, beginner: 1, intermediate: 2, advanced: 3, elite: 4 };
      const avg = withData.reduce((a, s) => a + lvOrd[s.level], 0) / withData.length;
      const overall = avg >= 3.5 ? 'elite' : avg >= 2.5 ? 'advanced' : avg >= 1.5 ? 'intermediate' : avg >= 0.5 ? 'beginner' : 'untrained';
      const avgPct = Math.round(withData.reduce((a, s) => a + s.pct, 0) / withData.length);
      const badge = document.getElementById('strength-std-badge');
      if (badge) badge.style.cssText = `color:${LVL_COLOR[overall]};border-color:${LVL_COLOR[overall]}44;background:${LVL_COLOR[overall]}15;`;
      if (badge) badge.textContent = LVL_LABEL[overall];
      summaryEl.innerHTML = `<div class="ss-summary-row"><span>${withData.length} of ${Object.keys(_STRENGTH_STD).length} exercises tracked</span><span>Avg: <strong style="color:${LVL_COLOR[overall]};">${avgPct}%</strong></span></div>`;
    } else {
      summaryEl.innerHTML = '';
    }
  }

  const rows = stats.map(({ muscle, std, pr, pct, level, nextLevel, nextGoalKg, toGoKg }) => {
    const color = LVL_COLOR[level];
    const icon = ICONS[muscle] || 'ًں’ھ';
    let insight = '';
    if (pr === 0) {
      insight = `Log <strong>${std.ex}</strong> to track your ${muscle} strength`;
    } else if (level === 'elite') {
      insight = 'ًںڈ† Elite strength â€” keep it up!';
    } else {
      insight = `<strong style="color:${color};">${toGoKg}${unit}</strong> more to reach <strong>${nextLevel}</strong> &nbsp;آ·&nbsp; goal: ${nextGoalKg}${unit}`;
    }
    return `<div class="ss-row">
      <div class="ss-row-top">
        <div class="ss-ex-info">
          <span class="ss-icon">${icon}</span>
          <div>
            <div class="ss-ex-name">${std.ex}</div>
            <div class="ss-muscle-tag">${muscle}</div>
          </div>
        </div>
        <div class="ss-row-right">
          <span class="ss-level-pill" style="color:${color};border-color:${color}33;background:${color}12;">${LVL_LABEL[level]}</span>
          ${pr > 0 ? `<div class="ss-pr-val">${pr}${unit} PR</div>` : ''}
        </div>
      </div>
      <div class="ss-bar-row">
        <div class="ss-bar-track">
          <div class="ss-bar-bg"><div class="ss-zone ss-z-beg"></div><div class="ss-zone ss-z-int"></div><div class="ss-zone ss-z-adv"></div><div class="ss-zone ss-z-eli"></div></div>
          <div class="ss-bar-fill-ov" style="width:${pct}%;background:${color};"></div>
        </div>
        <span class="ss-bar-pct-lbl" style="color:${color};">${pct}%</span>
      </div>
      <div class="ss-zone-ticks"><span class="ss-zt-beg">BEG</span><span class="ss-zt-int">INT</span><span class="ss-zt-adv">ADV</span><span class="ss-zt-eli">ELITE</span></div>
      <div class="ss-insight">${insight}</div>
    </div>`;
  }).join('');

  card.innerHTML = rows || '<div style="padding:12px;color:var(--text3);font-size:.8rem;text-align:center;">Log weighted workouts to unlock strength standards.</div>';
}

let velChart = null;

function _calcEpley1RM(weight, reps) {
  return reps <= 0 ? weight : weight * (1 + reps / 30);
}

function populateVelocitySelect() {
  const sel = document.getElementById('velocity-exercise-select');
  if (!sel) return;
  const cur = sel.value;
  const exercises = [...new Set(workouts.map(w => w.exercise))].sort();
  sel.innerHTML = '<option value="">â€” Select exercise â€”</option>' +
    exercises.map(ex => `<option value="${ex}"${ex === cur ? ' selected' : ''}>${ex}</option>`).join('');
}

function renderVelocityChart() {
  const sel = document.getElementById('velocity-exercise-select');
  const rangeEl = document.getElementById('velocity-range');
  const badge = document.getElementById('velocity-1rm-badge');
  const canvas = document.getElementById('velocity-chart');
  if (!sel || !canvas) return;

  const ex = sel.value;
  const days = parseInt(rangeEl ? rangeEl.value : '90');
  const cutoff = days > 0 ? Date.now() - days * 86400000 : 0;

  if (velChart) { velChart.destroy(); velChart = null; }
  const ctx = canvas.getContext('2d');

  const _empty = (msg) => {
    if (badge) badge.textContent = msg || '';
    velChart = new Chart(ctx, {
      type: 'line', data: { labels: ['â€”'], datasets: [{ data: [0], borderColor: '#2ecc71', borderWidth: 2, pointRadius: 0 }] },
      options: { ...mkChartOpts(), plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
  };

  if (!ex) { _empty('Select an exercise to see its 1RM trend'); return; }

  const sessions = workouts
    .filter(w => w.exercise === ex && new Date(w.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sessions.length) { _empty('No sessions in this range'); return; }

  const labels = []; const orm1Data = []; const volData = [];
  sessions.forEach(w => {
    const d = new Date(w.date);
    labels.push(d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));
    const best1RM = Math.max(...w.sets.map(s => _calcEpley1RM(s.weight, s.reps)));
    orm1Data.push(Math.round(best1RM * 10) / 10);
    volData.push(Math.round(w.totalVolume));
  });

  const latest = orm1Data[orm1Data.length - 1];
  const delta = Math.round((latest - orm1Data[0]) * 10) / 10;
  const sign = delta >= 0 ? '+' : '';
  if (badge) badge.innerHTML =
    `<span style="color:var(--green);">EST. 1RM: ${latest}kg</span>` +
    ` &nbsp;|&nbsp; <span style="color:${delta >= 0 ? '#2ecc71' : '#e74c3c'};">${sign}${delta}kg</span>` +
    ' since first session';

  const gradG = ctx.createLinearGradient(0, 0, 0, 220);
  gradG.addColorStop(0, 'rgba(57,255,143,.3)');
  gradG.addColorStop(1, 'rgba(57,255,143,0)');

  const opts = mkChartOpts();
  opts.plugins.legend = { display: true, labels: { color: '#4a6a4e', font: { family: 'DM Mono', size: 9 } } };
  opts.plugins.tooltip.callbacks = { label: c => ' ' + c.raw + (c.datasetIndex === 0 ? ' kg 1RM' : ' kg vol') };
  opts.scales.y = { ...opts.scales.y, position: 'left', title: { display: true, text: '1RM (kg)', color: '#39ff8f', font: { family: 'DM Mono', size: 9 } } };
  opts.scales.y1 = { position: 'right', grid: { drawOnChartArea: false, color: '#1e2e1f' }, ticks: { color: '#60a5fa', font: { family: 'DM Mono', size: 9 } }, beginAtZero: true, title: { display: true, text: 'Volume', color: '#60a5fa', font: { family: 'DM Mono', size: 9 } } };

  velChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels, datasets: [
        {
          label: '1RM Est.', data: orm1Data, borderColor: '#39ff8f', borderWidth: 2.5, backgroundColor: gradG,
          fill: true, tension: .4, pointBackgroundColor: '#39ff8f', pointBorderColor: '#080c09', pointRadius: 4, pointHoverRadius: 7, yAxisID: 'y'
        },
        {
          label: 'Volume', data: volData, borderColor: '#60a5fa', borderWidth: 1.5, backgroundColor: 'transparent',
          fill: false, tension: .4, pointRadius: 2, pointHoverRadius: 5, borderDash: [4, 3], yAxisID: 'y1'
        }
      ]
    },
    options: opts
  });
}

let _rmMuscle = ''; let _rmSearch = '';

function setRmMuscle(m) {
  _rmMuscle = (_rmMuscle === m) ? '' : m;
  _renderRoadmap();
}

function _renderRoadmap() {
  const searchEl = document.getElementById('rm-search');
  if (searchEl) _rmSearch = searchEl.value.trim().toLowerCase();

  // Build muscle chips
  const chipsEl = document.getElementById('rm-muscle-chips');
  if (chipsEl) {
    const muscles = [...new Set(workouts.map(w => w.muscle).filter(Boolean))].sort();
    chipsEl.innerHTML = [
      `<button class="vol-muscle-chip${!_rmMuscle ? ' vol-chip-active' : ''}" onclick="setRmMuscle('')">All</button>`,
      ...muscles.map(m => `<button class="vol-muscle-chip${_rmMuscle === m ? ' vol-chip-active' : ''}" onclick="setRmMuscle('${m}')">${m}</button>`)
    ].join('');
  }

  renderPRRoadmap();
}

function renderPRRoadmap() {
  const wrap = document.getElementById('pr-roadmap-wrap');
  if (!wrap) return;
  if (!workouts.length) {
    wrap.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-icon">ًں—؛ï¸ڈ</div><div class="empty-title">${t('hist.noWorkouts')}</div></div>`;
    return;
  }

  // Best weight ever per exercise + date of that PR
  const prs = {};
  workouts.forEach(w => {
    w.sets.forEach(s => {
      const wt = parseFloat(s.weight) || 0;
      if (!wt) return;
      if (!prs[w.exercise] || wt > prs[w.exercise].weight) prs[w.exercise] = { weight: wt, muscle: w.muscle, date: w.date };
    });
  });

  // Filter by muscle + search
  let entries = Object.entries(prs);
  if (_rmMuscle) entries = entries.filter(([, pr]) => pr.muscle === _rmMuscle);
  if (_rmSearch) entries = entries.filter(([ex]) => ex.toLowerCase().includes(_rmSearch));

  // Sort by weight desc, top 12
  const top = entries.sort((a, b) => b[1].weight - a[1].weight).slice(0, 12);

  // Update count badge
  const badge = document.getElementById('rm-count-badge');
  if (badge) badge.textContent = `${top.length} PR${top.length !== 1 ? 's' : ''}`;

  if (!top.length) {
    wrap.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text3);font-size:.8rem;">${_rmSearch || _rmMuscle ? 'No matches' : 'No weighted workouts yet.'}</div>`;
    return;
  }

  const now = Date.now();
  const MS_WEEK = 604800000;
  const unit = currentLang === 'ar' ? 'ظƒط¬ظ…' : 'kg';

  wrap.innerHTML = top.map(([ex, pr]) => {
    const history = workouts.filter(w => w.exercise === ex).sort((a, b) => new Date(a.date) - new Date(b.date));
    let weeklyGain = 1.25;
    if (history.length >= 3) {
      const maxW = h => Math.max(...h.sets.map(s => parseFloat(s.weight) || 0));
      const first = maxW(history[0]); const last = maxW(history[history.length - 1]);
      const spanWeeks = Math.max(1, (new Date(history[history.length - 1].date) - new Date(history[0].date)) / MS_WEEK);
      weeklyGain = Math.max(0.25, Math.min(5, (last - first) / spanWeeks));
    }

    const cur = pr.weight;
    const prDate = new Date(pr.date);
    const weeksSincePR = Math.floor((now - prDate.getTime()) / MS_WEEK);
    const progPct = Math.min(100, Math.round((weeksSincePR / 12) * 100));
    const prDateStr = prDate.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'short' });

    const milestones = [2, 4, 6, 8, 10, 12].map(w => ({
      week: w,
      target: Math.round((cur + weeklyGain * w) * 4) / 4,
      done: weeksSincePR >= w
    }));
    const nextIdx = milestones.findIndex(m => !m.done);

    return `<div class="roadmap-lift">
      <div class="roadmap-lift-name">
        ${MUSCLE_ICONS[pr.muscle] || 'ًں’ھ'} ${ex}
        <span class="rm-pr-badge">${cur}${unit}</span>
      </div>
      <div class="rm-pr-date">PR: ${prDateStr} آ· ${weeksSincePR > 0 ? weeksSincePR + 'w ago' : 'this week'}</div>
      <div class="roadmap-milestones">
        ${milestones.map((m, i) => `<div class="roadmap-ms${m.done ? ' done' : i === nextIdx ? ' next' : ''}">
          ${m.done ? 'âœ“' : 'W' + m.week}: ${m.target}${unit}</div>`).join('')}
      </div>
      <div class="roadmap-bar-wrap"><div class="roadmap-bar-fill" style="width:${progPct}%;"></div></div>
      <div class="roadmap-pace">+${weeklyGain.toFixed(2)} ${unit}/wk آ· 12W: ${Math.round((cur + weeklyGain * 12) * 4) / 4}${unit}</div>
    </div>`;
  }).join('');
}

function renderMuscleFreshness() {
  const wrap = document.getElementById('muscle-freshness-wrap');
  if (!wrap) return;
  const ltMap = _buildLastTrainedMap();
  const now = new Date();
  const ALL_M = ['Chest','Back','Shoulders','Legs','Core','Biceps','Triceps','Forearms','Glutes','Calves'];

  const rows = ALL_M.map(m => {
    const last = ltMap[m];
    if (!last) return { m, color: '#2ecc71', label: 'FRESH', hoursLeft: 0, hoursAgo: Infinity };
    const hoursAgo = (now - last) / 3600000;
    let color, label, hoursLeft;
    if (hoursAgo >= 72) {
      color = '#2ecc71'; label = 'FRESH'; hoursLeft = 0;
    } else if (hoursAgo >= 48) {
      color = '#f39c12'; label = 'RECOVERING'; hoursLeft = Math.ceil(72 - hoursAgo);
    } else {
      color = '#e74c3c'; label = 'FATIGUED'; hoursLeft = Math.ceil(72 - hoursAgo);
    }
    return { m, color, label, hoursLeft, hoursAgo };
  });

  // Sort: fatigued first, recovering second, fresh last; within same group by hoursLeft desc
  rows.sort((a, b) => {
    const order = { 'FATIGUED': 0, 'RECOVERING': 1, 'FRESH': 2 };
    if (order[a.label] !== order[b.label]) return order[a.label] - order[b.label];
    return b.hoursLeft - a.hoursLeft;
  });

  wrap.innerHTML = rows.map((r, i) => {
    const timeStr = r.hoursLeft > 0 ? `${r.hoursLeft}h to recover` : 'Ready to train';
    const barPct  = r.hoursAgo === Infinity ? 100 : Math.min(100, Math.round((r.hoursAgo / 72) * 100));
    const isLast  = i === rows.length - 1;
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 14px;${isLast?'':'border-bottom:1px solid var(--border);'}">
      <div style="width:8px;height:8px;border-radius:50%;background:${r.color};flex-shrink:0;box-shadow:0 0 5px ${r.color}55;"></div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;color:var(--text1);">${(typeof MUSCLE_ICONS!=='undefined'?MUSCLE_ICONS[r.m]:'')||'ًں’ھ'} ${r.m}</span>
          <span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:${r.color};font-weight:700;">${r.label}</span>
        </div>
        <div style="height:2px;background:var(--border2);border-radius:1px;overflow:hidden;margin-top:3px;">
          <div style="height:100%;width:${barPct}%;background:${r.color};border-radius:1px;transition:width .6s;opacity:.75;"></div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--text3);margin-top:2px;">${timeStr}</div>
      </div>
    </div>`;
  }).join('');
}

// â”€â”€ Volume Panel State + Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _volRange = '3m', _volMuscle = '';
let _nutCalChart = null, _nutMacroChart = null, _nutWeekChart = null, _nutScoreChart = null, _nutProteinChart = null;
let _nutChartModal = null, _nutChartModalTitle = null, _nutChartModalCanvas = null, _nutChartModalChart = null;
let _nutChartZoomRegistered = false;

function _cloneChartConfigValue(v) {
  if (Array.isArray(v)) return v.map(_cloneChartConfigValue);
  if (!v || typeof v !== 'object') return v;
  const out = {};
  Object.keys(v).forEach((k) => { out[k] = _cloneChartConfigValue(v[k]); });
  return out;
}

function _registerChartZoomPlugin() {
  if (_nutChartZoomRegistered || !window.Chart || typeof window.Chart.register !== 'function') return;
  const plugin = window.ChartZoom || window['chartjs-plugin-zoom'];
  if (!plugin) return;
  try {
    window.Chart.register(plugin);
    _nutChartZoomRegistered = true;
  } catch (_err) {}
}

function _ensureNutChartModal() {
  if (_nutChartModal) return;
  const modal = document.createElement('div');
  modal.className = 'nut-chart-modal';
  modal.innerHTML = `
    <div class="nut-chart-modal-backdrop" data-close="1"></div>
    <div class="nut-chart-modal-dialog" role="dialog" aria-modal="true" aria-label="Chart zoom view">
      <div class="nut-chart-modal-head">
        <div class="nut-chart-modal-title"></div>
        <div class="nut-chart-modal-actions">
          <button class="nut-chart-action" type="button" data-action="zoom-in">+</button>
          <button class="nut-chart-action" type="button" data-action="zoom-out">-</button>
          <button class="nut-chart-action" type="button" data-action="reset">Reset</button>
          <button class="nut-chart-action close" type="button" data-close="1">Close</button>
        </div>
      </div>
      <div class="nut-chart-modal-body"><canvas id="nut-chart-modal-canvas"></canvas></div>
      <div class="nut-chart-modal-hint">Pinch/wheel to zoom. Drag to pan.</div>
    </div>`;
  document.body.appendChild(modal);
  _nutChartModal = modal;
  _nutChartModalTitle = modal.querySelector('.nut-chart-modal-title');
  _nutChartModalCanvas = modal.querySelector('#nut-chart-modal-canvas');

  modal.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.close === '1') {
      _closeNutChartModal();
      return;
    }
    const action = target.dataset.action;
    if (!action || !_nutChartModalChart) return;
    if (action === 'zoom-in' && typeof _nutChartModalChart.zoom === 'function') _nutChartModalChart.zoom(1.2);
    if (action === 'zoom-out' && typeof _nutChartModalChart.zoom === 'function') _nutChartModalChart.zoom(0.85);
    if (action === 'reset' && typeof _nutChartModalChart.resetZoom === 'function') _nutChartModalChart.resetZoom();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && _nutChartModal?.classList.contains('show')) _closeNutChartModal();
  });
}

function _closeNutChartModal() {
  if (_nutChartModalChart) {
    _nutChartModalChart.destroy();
    _nutChartModalChart = null;
  }
  if (_nutChartModal) _nutChartModal.classList.remove('show');
}

function _openNutChartModal(sourceChart, titleText) {
  if (!sourceChart || !window.Chart) return;
  _registerChartZoomPlugin();
  _ensureNutChartModal();
  if (!_nutChartModal || !_nutChartModalCanvas || !_nutChartModalTitle) return;

  if (_nutChartModalChart) {
    _nutChartModalChart.destroy();
    _nutChartModalChart = null;
  }
  _nutChartModalTitle.textContent = titleText || 'Chart';

  const clonedData = _cloneChartConfigValue(sourceChart.config.data);
  const clonedOptions = _cloneChartConfigValue(sourceChart.config.options || {});
  clonedOptions.responsive = true;
  clonedOptions.maintainAspectRatio = false;
  clonedOptions.animation = false;
  clonedOptions.plugins = clonedOptions.plugins || {};
  clonedOptions.plugins.zoom = {
    pan: { enabled: true, mode: 'x', modifierKey: null },
    zoom: {
      wheel: { enabled: true },
      pinch: { enabled: true },
      drag: { enabled: false },
      mode: 'x'
    }
  };

  const clonedPlugins = Array.isArray(sourceChart.config.plugins)
    ? _cloneChartConfigValue(sourceChart.config.plugins)
    : [];

  _nutChartModalChart = new Chart(_nutChartModalCanvas.getContext('2d'), {
    type: sourceChart.config.type,
    data: clonedData,
    options: clonedOptions,
    plugins: clonedPlugins
  });
  _nutChartModal.classList.add('show');
}

function _bindNutritionChartExpanders() {
  const byId = {
    'nut-protein-chart': { title: 'Protein Trend (Daily g)', getChart: () => _nutProteinChart },
    'nut-cal-chart': { title: 'Calorie Trend', getChart: () => _nutCalChart },
    'nut-macro-chart': { title: 'Macro Split', getChart: () => _nutMacroChart },
    'nut-week-chart': { title: 'Weekly Calories', getChart: () => _nutWeekChart },
    'nut-score-chart': { title: 'Day Score', getChart: () => _nutScoreChart }
  };

  function _openById(id) {
    const def = byId[id];
    if (!def) return;
    const chart = def.getChart();
    if (!chart) {
      if (typeof showToast === 'function') showToast('Chart not ready yet', 'warn');
      return;
    }
    _openNutChartModal(chart, def.title);
  }

  document.querySelectorAll('.nut-chart-expand-btn').forEach((btn) => {
    if (!(btn instanceof HTMLElement) || btn.dataset.zoomBound === '1') return;
    btn.dataset.zoomBound = '1';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const id = btn.dataset.chart || '';
      _openById(id);
    });
  });

  const defs = [
    { id: 'nut-protein-chart', title: 'Protein Trend (Daily g)', getChart: () => _nutProteinChart },
    { id: 'nut-cal-chart', title: 'Calorie Trend', getChart: () => _nutCalChart },
    { id: 'nut-macro-chart', title: 'Macro Split', getChart: () => _nutMacroChart },
    { id: 'nut-week-chart', title: 'Weekly Calories', getChart: () => _nutWeekChart },
    { id: 'nut-score-chart', title: 'Day Score', getChart: () => _nutScoreChart }
  ];
  defs.forEach((def) => {
    const canvas = document.getElementById(def.id);
    if (!canvas || canvas.dataset.zoomBound === '1') return;
    canvas.dataset.zoomBound = '1';
    canvas.classList.add('nut-chart-tap-zoom');
    canvas.title = 'Tap to expand';
    const card = canvas.closest('.nut-chart-card');
    if (card && !card.querySelector('.nut-chart-tap-hint')) {
      const hint = document.createElement('div');
      hint.className = 'nut-chart-tap-hint';
      hint.textContent = 'Tap chart to expand';
      card.appendChild(hint);
    }
    const open = () => _openById(def.id);
    canvas.addEventListener('click', open);
    canvas.addEventListener('pointerup', open);
    canvas.addEventListener('touchend', open, { passive: true });
    canvas.addEventListener('dblclick', open);
  });
}

function _nutChartHead(labelHtml, chartId) {
  return `
    <div class="nut-chart-head">
      <div class="nut-chart-label">${labelHtml}</div>
      <button type="button" class="nut-chart-expand-btn" data-chart="${chartId}" aria-label="Expand chart">Expand</button>
    </div>`;
}

function _bindNutritionChartExpandersReliable() {
  _bindNutritionChartExpanders();
  setTimeout(_bindNutritionChartExpanders, 180);
  setTimeout(_bindNutritionChartExpanders, 420);
}

function setVolRange(r) {
  _volRange = r;
  document.querySelectorAll('.vol-pill').forEach(b =>
    b.classList.toggle('vol-pill-active', b.dataset.range === r));
  _renderVolPanel();
}

function setVolMuscle(m) {
  _volMuscle = m;
  document.querySelectorAll('.vol-muscle-chip').forEach(b =>
    b.classList.toggle('vol-chip-active', b.dataset.muscle === m));
  _renderVolPanel();
}

function buildVolumeData(range, muscle) {
  const cutoffs = { '4w':28, '3m':91, '6m':182, '1y':365 };
  const days = cutoffs[range] || 91;
  const cutoff = new Date(Date.now() - days * 86400000);
  let arr = workouts.filter(w => new Date(w.date) >= cutoff);
  if (muscle) arr = arr.filter(w => w.muscle === muscle);
  const useMonthly = days > 91;
  const buckets = {};
  arr.forEach(w => {
    const d = new Date(w.date);
    const key = useMonthly
      ? d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
      : (() => {
          const jan1 = new Date(d.getFullYear(),0,1);
          const wk = Math.ceil(((d-jan1)/86400000 + jan1.getDay()+1)/7);
          return d.getFullYear() + '-W' + String(wk).padStart(2,'0');
        })();
    buckets[key] = (buckets[key]||0) + (w.totalVolume||0);
  });
  const sorted = Object.keys(buckets).sort();
  const labels = sorted.map(k => {
    if (useMonthly) {
      const [y,m] = k.split('-');
      return new Date(+y,+m-1,1).toLocaleDateString('en-GB',{month:'short',year:'2-digit'});
    }
    return k;
  });
  return {
    labels, data: sorted.map(k => Math.round(buckets[k])),
    totalVol: arr.reduce((s,w) => s+(w.totalVolume||0), 0),
    sessionCount: arr.length
  };
}

function buildWeeklyVolume(arr) {
  // Legacy wrapper
  if (!arr) arr = workouts;
  const weeks = {};
  arr.forEach(w => {
    const d = new Date(w.date), jan1 = new Date(d.getFullYear(),0,1);
    const wk = Math.ceil(((d-jan1)/86400000 + jan1.getDay()+1)/7);
    const key = d.getFullYear() + '-W' + String(wk).padStart(2,'0');
    weeks[key] = (weeks[key]||0) + w.totalVolume;
  });
  const s = Object.keys(weeks).sort();
  return { labels: s, data: s.map(k => Math.round(weeks[k])) };
}

function _renderVolPanel() {
  const muscles = [...new Set(workouts.map(w => w.muscle))].filter(Boolean).sort();
  const chipsEl = document.getElementById('vol-muscle-chips');
  if (chipsEl) {
    const ar = (typeof currentLang !== 'undefined' && currentLang === 'ar');
    chipsEl.innerHTML = ['', ...muscles].map(m => `
      <button class="vol-muscle-chip${_volMuscle === m ? ' vol-chip-active' : ''}" data-muscle="${m}" onclick="setVolMuscle('${m}')">
        ${m ? (MUSCLE_ICONS[m]||'ًں’ھ')+' '+m : (ar?'ط§ظ„ظƒظ„':'All')}
      </button>`).join('');
  }
  const data = buildVolumeData(_volRange, _volMuscle);
  renderVolumeChart(data);
  const insight = document.getElementById('volume-insight');
  if (insight) {
    const ar = (typeof currentLang !== 'undefined' && currentLang === 'ar');
    const tot = Math.round(data.totalVol).toLocaleString();
    insight.textContent = ar
      ? `ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ: ${tot} ظƒط¬ظ… آ· ${data.sessionCount} ط¬ظ„ط³ط©`
      : `Total: ${tot} kg آ· ${data.sessionCount} sessions`;
  }
}

// â”€â”€ Deload Cycle Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _getWeekKey(d) {
  const dt = d || new Date();
  const jan1 = new Date(dt.getFullYear(), 0, 1);
  const wk = Math.ceil(((dt - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return dt.getFullYear() + '-W' + String(wk).padStart(2, '0');
}

function _updateWeeklyScoreLog() {
  const dl = _lsGet('forge_deload_data', {"weeklyScores":[],"active":false,"startDate":null});
  if (dl.active) return;
  const score = (typeof calcTrainingScore === 'function') ? calcTrainingScore().total : 0;
  const week = _getWeekKey();
  const ex = dl.weeklyScores.find(e => e.week === week);
  if (ex) ex.score = Math.max(ex.score, score);
  else dl.weeklyScores.push({ week, score });
  dl.weeklyScores = dl.weeklyScores.slice(-8);
  localStorage.setItem('forge_deload_data', JSON.stringify(dl));
}

function checkDeloadNeeded() {
  const dl = _lsGet('forge_deload_data', {"weeklyScores":[],"active":false,"startDate":null});
  if (dl.active) {
    const daysSince = Math.floor((Date.now() - dl.startDate) / 86400000);
    if (daysSince >= 7) {
      dl.active = false; dl.startDate = null;
      localStorage.setItem('forge_deload_data', JSON.stringify(dl));
      document.body.classList.remove('deload-active');
      setTimeout(() => showToast('ًںژ‰ Deload complete â€” recharged & ready!', 'success'), 400);
    }
    return dl.active;
  }
  const last4 = dl.weeklyScores.slice(-4);
  if (last4.length >= 4 && last4.every(e => e.score >= 90)) {
    dl.active = true; dl.startDate = Date.now();
    localStorage.setItem('forge_deload_data', JSON.stringify(dl));
    document.body.classList.add('deload-active');
    setTimeout(() => showToast('âڑ ï¸ڈ Deload Week triggered â€” reduce weights 40% for 7 days.', 'warn'), 600);
    return true;
  }
  return false;
}

function isDeloadActive() {
  try { return JSON.parse(localStorage.getItem('forge_deload_data') || '{}').active === true; }
  catch(e) { return false; }
}

function renderVolumeChart(d) {
  if (typeof Chart === 'undefined') {
    const el = document.getElementById('volume-chart');
    if (el) { const cx = el.getContext('2d'); cx.clearRect(0,0,el.width,el.height); cx.fillStyle='#666'; cx.font='13px sans-serif'; cx.textAlign='center'; cx.fillText('Charts unavailable offline', el.width/2, el.height/2 || 110); }
    return;
  }
  if (volChart) { volChart.destroy(); volChart = null; }
  const ctx = document.getElementById('volume-chart').getContext('2d');
  const grad = ctx.createLinearGradient(0,0,0,220);
  grad.addColorStop(0,'rgba(46,204,113,.35)'); grad.addColorStop(1,'rgba(46,204,113,0)');
  volChart = new Chart(ctx, {
    type:'line',
    data:{
      labels: d.labels.length ? d.labels : ['No data'],
      datasets:[{
        label:'Volume', data: d.data.length ? d.data : [0],
        borderColor:'#2ecc71', borderWidth:2.5, backgroundColor:grad,
        fill:true, tension:.4, pointBackgroundColor:'#39ff8f',
        pointBorderColor:'#080c09', pointRadius:4, pointHoverRadius:8
      }]
    },
    options: mkChartOpts()
  });
}

function _dashPeriodDays() {
  return _dashPeriod === '7D' ? 7 : _dashPeriod === '1M' ? 30 : _dashPeriod === '3M' ? 90 : _dashPeriod === '6M' ? 180 : 0;
}

function _calcNutritionTargetsForStats() {
  const bw = Array.isArray(bodyWeight) ? [...bodyWeight].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  const latestW = bw.find(e => Number.isFinite(parseFloat(e.weight))) || null;
  const latestBFEntry = bw.find(e => Number.isFinite(parseFloat(e.bodyFat))) || null;
  const isFemale = (userProfile?.gender || '') === 'female';
  const minCal = isFemale ? 1200 : 1500;
  const goal = userProfile?.goal || 'muscle';

  const wtRaw = latestW ? parseFloat(latestW.weight) : parseFloat(userProfile?.weight || 75);
  const wtKg = (latestW?.unit === 'lbs') ? wtRaw * 0.453592 : wtRaw;
  const curBF = latestBFEntry ? parseFloat(latestBFEntry.bodyFat) : null;

  const heightCm = userProfile?.height
    ? (userProfile.heightUnit === 'ft' ? parseFloat(userProfile.height) * 30.48 : parseFloat(userProfile.height))
    : 175;
  const age = userProfile?.dob ? Math.floor((Date.now() - new Date(userProfile.dob)) / 31557600000) : 25;
  const formulaBmr = 10 * wtKg + 6.25 * heightCm - 5 * age + (isFemale ? -161 : 5);
  const inbodyBmr = parseFloat(userProfile?.inbodyBmr || 0);
  const inbodyBmrDate = userProfile?.inbodyBmrDate ? new Date(userProfile.inbodyBmrDate) : null;
  const inbodyAgeDays = inbodyBmrDate ? Math.floor((Date.now() - inbodyBmrDate.getTime()) / 86400000) : null;
  const inbodyValid = inbodyBmr >= 800 && inbodyBmr <= 3500;
  const inbodyFresh = inbodyAgeDays === null || inbodyAgeDays <= 180;
  const bmrSourcePref = userProfile?.bmrSourcePref || 'auto';
  const useInbodyBmr = inbodyValid && (bmrSourcePref === 'inbody' || (bmrSourcePref === 'auto' && inbodyFresh));
  const bmr = useInbodyBmr ? inbodyBmr : formulaBmr;
  const activityFactor = Math.max(1.2, Math.min(1.9, parseFloat(userProfile?.activityFactor || 1.55)));
  const tdee = Math.round(bmr * activityFactor);

  const goalCalAdjust = { muscle: 250, strength: 150, fat_loss: -450, endurance: 100, recomp: 0 };
  const targetCal = Math.max(minCal, Math.round(tdee + (goalCalAdjust[goal] || 0)));

  const proteinFactor = (isFemale
    ? { muscle: 1.8, strength: 1.7, fat_loss: 2.0, endurance: 1.5, recomp: 2.0 }
    : { muscle: 2.0, strength: 1.8, fat_loss: 2.2, endurance: 1.6, recomp: 2.2 })[goal] || (isFemale ? 1.8 : 2.0);
  const lbmKg = curBF !== null ? wtKg * (1 - curBF / 100) : wtKg;
  const proteinRef = (goal === 'fat_loss' || goal === 'recomp') ? lbmKg : wtKg;
  const proteinG = Math.round(proteinRef * proteinFactor);
  const fatG = Math.max(Math.round(wtKg * (isFemale ? 1.0 : 0.8)), Math.round(targetCal * (isFemale ? 0.28 : 0.25) / 9));
  const carbG = Math.max(0, Math.round((targetCal - proteinG * 4 - fatG * 9) / 4));

  return { targetCal, proteinG, carbG, fatG, wtKg };
}

function _flattenMealsByPeriod() {
  const ml = (typeof mealsLog !== 'undefined' && mealsLog && typeof mealsLog === 'object') ? mealsLog : {};
  const days = _dashPeriodDays();
  const cutoff = new Date();
  if (days > 0) cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const dayMap = {};

  Object.entries(ml).forEach(([key, arr]) => {
    if (!Array.isArray(arr) || !arr.length) return;
    let dateKey = key;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const d = new Date(key);
      if (isNaN(d)) return;
      dateKey = _isoKey(d);
    }
    if (days > 0 && dateKey < cutoffKey) return;
    if (!dayMap[dateKey]) dayMap[dateKey] = [];
    dayMap[dateKey].push(...arr);
  });

  return dayMap;
}

function _calcMealRepeatStreaks(dayMap) {
  const byMeal = new Map(); // normalized name -> { label, days:Set<YYYY-MM-DD> }
  const dayKeys = Object.keys(dayMap || {});
  dayKeys.forEach((dayKey) => {
    const meals = Array.isArray(dayMap[dayKey]) ? dayMap[dayKey] : [];
    meals.forEach((m) => {
      const rawName = String(m?.name || '').trim();
      if (!rawName) return;
      const key = rawName.toLowerCase().replace(/\s+/g, ' ');
      if (!key) return;
      if (!byMeal.has(key)) byMeal.set(key, { label: rawName, days: new Set() });
      byMeal.get(key).days.add(dayKey);
    });
  });

  function _toDayNum(dateKey) {
    const ms = Date.parse(dateKey + 'T00:00:00');
    return Number.isFinite(ms) ? Math.floor(ms / 86400000) : NaN;
  }

  let best = { name: '', longest: 0, current: 0, lastDate: '' };
  byMeal.forEach((info) => {
    const nums = Array.from(info.days).map(_toDayNum).filter(Number.isFinite).sort((a, b) => a - b);
    if (!nums.length) return;

    let longest = 1;
    let run = 1;
    for (let i = 1; i < nums.length; i += 1) {
      if (nums[i] === nums[i - 1] + 1) run += 1;
      else run = 1;
      if (run > longest) longest = run;
    }

    let current = 1;
    for (let i = nums.length - 1; i > 0; i -= 1) {
      if (nums[i] === nums[i - 1] + 1) current += 1;
      else break;
    }

    const lastNum = nums[nums.length - 1];
    const lastDate = new Date(lastNum * 86400000).toISOString().slice(0, 10);
    if (
      longest > best.longest ||
      (longest === best.longest && current > best.current)
    ) {
      best = { name: info.label, longest, current, lastDate };
    }
  });

  return best;
}

function _mkNutChartOpts(overrides) {
  const base = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,.85)',
        titleFont: { family: "'DM Mono',monospace", size: 10 },
        bodyFont: { family: "'DM Mono',monospace", size: 10 },
        padding: 8, cornerRadius: 6
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b' } },
      y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b' } }
    }
  };
  if (!overrides) return base;
  if ('scales' in overrides) base.scales = overrides.scales;
  if ('plugins' in overrides) Object.assign(base.plugins, overrides.plugins);
  Object.keys(overrides).forEach(k => { if (k !== 'scales' && k !== 'plugins') base[k] = overrides[k]; });
  return base;
}

function _nutriIcon(name) {
  const paths = {
    meal: '<path d="M6 3v7M10 3v7M6 7h4M14 3v18M14 12h4a2 2 0 0 0 2-2V3"/>',
    chart: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"/>',
    trend: '<path d="M4 16l5-5 3 3 6-8"/><path d="M14 6h4v4"/>',
    macro: '<circle cx="12" cy="12" r="8"/><path d="M12 12V4"/><path d="M12 12l6 3"/>',
    week: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7 3.5v3M17 3.5v3M3.5 9.5h17"/>',
    score: '<path d="M12 3l7 4v5c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V7l7-4Z"/><path d="M9 12l2 2 4-4"/>',
    protein: '<path d="M6 13c0-3 2-5 6-6 0 4-1 6-4 8"/><path d="M8 13c1-1 3-2 5-2"/><path d="M15 6c2 1 3 3 3 5"/>',
    deficit: '<path d="M4 12h16"/><path d="M4 7h10"/><path d="M4 17h7"/>',
    streak: '<path d="M12 3c3 3 5 5 5 8a5 5 0 1 1-10 0c0-3 2-5 5-8Z"/>',
    best: '<path d="M12 4l2.2 4.4L19 9l-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L5 9l4.8-.6L12 4Z"/>',
    warn: '<path d="M12 3l9 16H3L12 3Z"/><path d="M12 9v4"/><path d="M12 16h.01"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.3 2.3 4.7-4.7"/>',
    balance: '<path d="M12 4v14"/><path d="M6 8h12"/><path d="M7 8l-3 5h6l-3-5Z"/><path d="M17 8l-3 5h6l-3-5Z"/>',
    day: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7 3.5v3M17 3.5v3M3.5 9.5h17"/><path d="M8 13h8"/>',
    timing: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    consistency: '<path d="M4 15l4-4 3 3 6-6"/><path d="M17 8h3v3"/>',
    repeat: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'
  };
  const shape = paths[name] || paths.chart;
  return `<span class="nutri-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shape}</svg></span>`;
}

function _renderNutTodayZone(zone, targets) {
  if (!zone) return;
  const todayKey = _isoKey(new Date());
  const ml = typeof mealsLog !== 'undefined' ? mealsLog : {};
  const todayMeals = Array.isArray(ml[todayKey]) ? ml[todayKey] : [];
  if (!todayMeals.length) {
    _dhSetHtml(zone, '<div class="nutri-premium-hero nut-today-card"><div class="nutri-premium-head"><span class="nutri-premium-kicker">Nutrition Status</span><span class="nutri-premium-live">Live</span></div><div class="nutri-premium-main"><div class="nutri-premium-scorecard"><div class="nutri-premium-score">0</div><div class="nutri-premium-score-label">Today Score</div></div><div class="nutri-premium-copy"><div class="nutri-premium-title">Start logging meals</div><div class="nutri-premium-sub">No meals logged today yet. Add the first meal to unlock live fueling guidance.</div><div class="nutri-premium-actionline"><span class="nutri-premium-badge neutral">Empty</span><a onclick="if(window._coachFocusNutritionLog){window._coachFocusNutritionLog();}else{if(window.switchView){window.switchView(\'nutrition\',document.getElementById(\'bnav-nutrition\'));}else if(window.switchMainTab){window.switchMainTab(\'nutrition\');}setTimeout(()=>{const n=document.getElementById(\'meal-name-input\');if(n){try{n.focus();}catch(e){} n.scrollIntoView({behavior:\'smooth\',block:\'center\'});}},220);}" style="cursor:pointer">Log your first meal</a></div></div></div></div>');
    return;
  }
  const s = todayMeals.reduce((a, m) => { a.kcal += (+m.kcal||0); a.p += (+m.p||0); a.c += (+m.c||0); a.f += (+m.f||0); return a; }, { kcal:0, p:0, c:0, f:0 });
  const pct = (v, t) => Math.min(100, Math.round(v / Math.max(t, 1) * 100));
  const remaining = Math.max(0, Math.round(targets.targetCal - s.kcal));
  const kcalPct = pct(s.kcal, targets.targetCal);
  const pPct = pct(s.p, targets.proteinG);
  const cPct = pct(s.c, targets.carbG);
  const fPct = pct(s.f, targets.fatG);
  const score = Math.round((kcalPct * 0.35) + (pPct * 0.4) + (cPct * 0.15) + (fPct * 0.1));
  const verdict = score >= 90 ? 'Strong fueling day' : score >= 75 ? 'Fueling on track' : score >= 55 ? 'Coverage needs work' : 'Underfueled day';
  const action = pPct < 90 ? 'Push protein in the next meal.' : remaining > 250 ? 'Calories are still under target.' : 'Hold the pace and close the day clean.';
  const tone = score >= 90 ? 'good' : score >= 70 ? 'info' : score >= 50 ? 'warn' : 'alert';
  _dhSetHtml(zone, `
<div class="nutri-premium-hero nut-today-card">
  <div class="nutri-premium-head">
    <span class="nutri-premium-kicker">Nutrition Status</span>
    <span class="nutri-premium-live">${todayMeals.length} meal${todayMeals.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="nutri-premium-main">
    <div class="nutri-premium-scorecard ${tone}">
      <div class="nutri-premium-score">${score}</div>
      <div class="nutri-premium-score-label">Today Score</div>
    </div>
    <div class="nutri-premium-copy">
      <div class="nutri-premium-title">${verdict}</div>
      <div class="nutri-premium-sub">${Math.round(s.kcal)} / ${Math.round(targets.targetCal)} kcal | ${Math.round(s.p)}g protein | ${Math.round(s.c)}g carbs | ${Math.round(s.f)}g fats</div>
      <div class="nutri-premium-actionline">
        <span class="nutri-premium-badge ${tone}">${remaining > 0 ? remaining + ' kcal left' : 'Goal reached'}</span>
        <span>${action}</span>
      </div>
    </div>
  </div>
  <div class="nutri-hero-progress">
    <div class="nutri-hero-track"><span style="width:${kcalPct}%;background:#5be4ff"></span><label>Calories ${kcalPct}%</label></div>
    <div class="nutri-hero-track"><span style="width:${pPct}%;background:#4ade80"></span><label>Protein ${pPct}%</label></div>
    <div class="nutri-hero-track"><span style="width:${cPct}%;background:#f3b34d"></span><label>Carbs ${cPct}%</label></div>
    <div class="nutri-hero-track"><span style="width:${fPct}%;background:#8fb2ff"></span><label>Fats ${fPct}%</label></div>
  </div>
</div>`);
}

function _renderCalorieTrendChart(daily, targetCal, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_nutCalChart) { _nutCalChart.destroy(); _nutCalChart = null; }
  if (daily.length < 3) { if (canvas.parentElement) canvas.parentElement.style.display = 'none'; return; }
  if (canvas.parentElement) canvas.parentElement.style.display = '';
  const labels = daily.map(d => { const p = d.key.split('-'); return p[2] + '/' + p[1]; });
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4ade80';
  _nutCalChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { data: daily.map(d => d.kcal), borderColor: accentColor, backgroundColor: accentColor + '26', fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
        { data: daily.map(() => targetCal), borderColor: 'rgba(255,80,80,.4)', borderDash: [4,3], borderWidth: 1, pointRadius: 0, fill: false }
      ]
    },
    options: _mkNutChartOpts({ scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b', maxTicksLimit: 7 } }, y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b' } } } })
  });
}

function _renderProteinTrendChart(daily, targetProtein, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_nutProteinChart) { _nutProteinChart.destroy(); _nutProteinChart = null; }
  if (daily.length < 3) { if (canvas.parentElement) canvas.parentElement.style.display = 'none'; return; }
  if (canvas.parentElement) canvas.parentElement.style.display = '';
  const labels = daily.map(d => { const p = d.key.split('-'); return p[2] + '/' + p[1]; });
  _nutProteinChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: daily.map(d => d.p),
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74,222,128,.20)',
          fill: true,
          tension: 0.28,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2.2
        },
        {
          data: daily.map(() => targetProtein),
          borderColor: 'rgba(230,184,74,.48)',
          borderDash: [5, 4],
          borderWidth: 1.4,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: _mkNutChartOpts({
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b', maxTicksLimit: 8 } },
        y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b', callback: v => v + 'g' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,.85)',
          bodyFont: { family: "'DM Mono',monospace", size: 10 },
          padding: 8,
          cornerRadius: 6,
          callbacks: { label: ctx => (ctx.datasetIndex === 0 ? 'Protein: ' : 'Target: ') + Math.round(ctx.parsed.y) + 'g' }
        }
      }
    })
  });
}

function _renderMacroDonutChart(avgP, avgC, avgF, compliance, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_nutMacroChart) { _nutMacroChart.destroy(); _nutMacroChart = null; }
  if (avgP + avgC + avgF < 1) return;
  const _comp = compliance;
  const centerPlugin = {
    id: 'nutCenterText',
    beforeDraw(chart) {
      if (!chart.chartArea) return;
      const { ctx, chartArea: { width, top, height } } = chart;
      ctx.save();
      ctx.font = "bold 20px 'Bebas Neue', sans-serif";
      ctx.fillStyle = '#c8dcc9';
      ctx.textAlign = 'center';
      ctx.fillText(_comp + '%', width / 2, top + height / 2 + 7);
      ctx.restore();
    }
  };
  _nutMacroChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{ data: [avgP, avgC, avgF], backgroundColor: ['#4ade80', '#e6b84a', '#5b8dee'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 }, cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,.85)', bodyFont: { family: "'DM Mono',monospace", size: 10 }, padding: 8, cornerRadius: 6, callbacks: { label: ctx => ' ' + ctx.label + ': ' + Math.round(ctx.parsed) + 'g' } } }
    },
    plugins: [centerPlugin]
  });
  const legendEl = document.getElementById(canvasId + '-legend');
  if (legendEl) legendEl.innerHTML = [['Protein','#4ade80',avgP],['Carbs','#e6b84a',avgC],['Fat','#5b8dee',avgF]].map(([n,c,v]) => `<span class="nut-macro-legend-item"><span class="nut-macro-legend-dot" style="background:${c}"></span>${Math.round(v)}g ${n}</span>`).join('');
}

function _renderWeeklyBarChart(targetCal, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_nutWeekChart) { _nutWeekChart.destroy(); _nutWeekChart = null; }
  const ml = typeof mealsLog !== 'undefined' ? mealsLog : {};
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    return { key: _isoKey(d), label: d.toLocaleDateString('en-GB', { weekday: 'short' }) };
  });
  const data = days.map(d => (Array.isArray(ml[d.key]) ? ml[d.key] : []).reduce((s, m) => s + (+m.kcal || 0), 0));
  const colors = data.map(v => { const r = v / Math.max(targetCal, 1); return r >= 0.8 ? '#4ade80' : r >= 0.5 ? '#e6b84a' : 'rgba(255,255,255,.12)'; });
  _nutWeekChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: days.map(d => d.label),
      datasets: [
        { type: 'bar', data, backgroundColor: colors, borderRadius: 4, borderWidth: 0 },
        { type: 'line', data: days.map(() => targetCal), borderColor: 'rgba(255,80,80,.4)', borderDash: [4,3], borderWidth: 1, pointRadius: 0, fill: false }
      ]
    },
    options: _mkNutChartOpts({ scales: { x: { grid: { display: false }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b' } }, y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b' } } } })
  });
}

function _renderDayScoreChart(dayScores, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_nutScoreChart) { _nutScoreChart.destroy(); _nutScoreChart = null; }
  if (!dayScores || !dayScores.length) return;
  const labels = dayScores.map(d => { const p = d.key.split('-'); return p[2] + '/' + p[1]; });
  const data = dayScores.map(d => Math.round((d.score || 0) * 100));
  const colors = data.map(v => v >= 70 ? '#4ade80' : v >= 40 ? '#e6b84a' : 'rgba(255,80,80,.45)');
  _nutScoreChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderWidth: 0 }] },
    options: _mkNutChartOpts({
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b', maxTicksLimit: 8 } },
        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { family: "'DM Mono',monospace", size: 8 }, color: '#6b7c6b', callback: v => v + '%' } }
      },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,.85)', bodyFont: { family: "'DM Mono',monospace", size: 10 }, padding: 8, cornerRadius: 6, callbacks: { label: ctx => 'Score: ' + ctx.parsed.y + '%' } } }
    })
  });
}

function renderNutritionAnalyticsPanel() {
  const bodyEl  = document.getElementById('nutrition-analytics-body');
  const insightsEl = document.getElementById('nutrition-insights-body');
  const badgeEl = document.getElementById('nutrition-analytics-badge');
  if (!bodyEl) return;

  const ar  = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const tx  = (en, arTxt) => ar ? arTxt : en;
  const esc = (v) => (window.FORGE_STORAGE?.esc ? window.FORGE_STORAGE.esc(v) : String(v || '').replace(/[&<>"']/g, ''));
  const pLabel = _dashPeriod === 'ALL' ? tx('ALL TIME','ظƒظ„ ط§ظ„ظˆظ‚طھ')
    : _dashPeriod === '7D' ? tx('LAST 7D','ط¢ط®ط± 7 ط£ظٹط§ظ…')
    : _dashPeriod === '1M' ? tx('LAST 30D','ط¢ط®ط± 30 ظٹظˆظ…')
    : _dashPeriod === '3M' ? tx('LAST 3M','ط¢ط®ط± 3 ط£ط´ظ‡ط±')
    : tx('LAST 6M','ط¢ط®ط± 6 ط£ط´ظ‡ط±');
  if (badgeEl) badgeEl.textContent = pLabel;

  const targets = _calcNutritionTargetsForStats();

  bodyEl.innerHTML = `
    <div class="nutri-control-shell">
      <div class="nutri-control-topline">
        <span class="nutri-control-kicker">${tx('Nutrition Control Center','مركز التحكم الغذائي')}</span>
        <span class="nutri-control-live">${tx('Live','مباشر')}</span>
      </div>
      <div id="nut-today-zone"></div>
      <div id="nut-stats-zone"></div>
      <div id="nut-charts-zone"></div>
    </div>`;

  // Zone 0: Today (always rendered, ignores period)
  _renderNutTodayZone(document.getElementById('nut-today-zone'), targets);

  const dayMap  = _flattenMealsByPeriod();
  const dayKeys = Object.keys(dayMap).sort();
  const mealRepeat = _calcMealRepeatStreaks(dayMap);

  if (!dayKeys.length) {
    const sz = document.getElementById('nut-stats-zone');
    const cz = document.getElementById('nut-charts-zone');
    if (sz) sz.innerHTML = '';
    if (cz) cz.innerHTML = '';
    if (insightsEl) _dhSetHtml(insightsEl, `<div class="empty-state"><div class="empty-icon">${_nutriIcon('chart')}</div><div class="empty-title">${tx('No nutrition trend data yet.','ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظƒط§ظپظٹط© ظ„ظ„ط§طھط¬ط§ظ‡ط§طھ ط¨ط¹ط¯.')}</div></div>`);
    return;
  }

  // Aggregate daily stats
  const daily = dayKeys.map(k => {
    const sums = (dayMap[k] || []).reduce((a, m) => {
      a.kcal += (+m.kcal||0); a.p += (+m.p||0); a.c += (+m.c||0); a.f += (+m.f||0); a.count += 1;
      return a;
    }, { kcal:0, p:0, c:0, f:0, count:0 });
    return { key: k, ...sums };
  });
  const nDays = Math.max(daily.length, 1);
  const tot   = daily.reduce((a, d) => { a.kcal+=d.kcal; a.p+=d.p; a.c+=d.c; a.f+=d.f; a.count+=d.count; return a; }, { kcal:0,p:0,c:0,f:0,count:0 });
  const avgKcal = tot.kcal / nDays, avgP = tot.p / nDays, avgC = tot.c / nDays, avgF = tot.f / nDays;

  const closeness = (v, t) => { const tt = Math.max(t,1); return Math.max(0, Math.min(1, 1 - Math.abs(v-tt)/tt)); };
  const dayScores = daily.map(d => ({ ...d, score: (closeness(d.kcal,targets.targetCal)+closeness(d.p,targets.proteinG)+closeness(d.c,targets.carbG)+closeness(d.f,targets.fatG))/4 }));
  const compliance = Math.round(dayScores.reduce((s,d) => s+d.score, 0) / nDays * 100);

  // v45 engagement stats
  const proteinDays   = daily.filter(d => d.p >= targets.proteinG * 0.9).length;
  const deficitDays   = daily.filter(d => d.kcal < targets.targetCal).length;
  const bestStreak    = (() => { const s=[...daily].sort((a,b)=>a.key<b.key?-1:1); let cur=0,max=0; s.forEach(d => { cur = d.p>=targets.proteinG*.9 ? cur+1 : 0; max=Math.max(max,cur); }); return max; })();
  const currentStreak = (() => {
    const ml = (typeof mealsLog !== 'undefined' && mealsLog && typeof mealsLog === 'object') ? mealsLog : {};
    let streak = 0;
    const today = new Date();
    const todayKey = _isoKey(today);
    const todayMeals = Array.isArray(ml[todayKey]) ? ml[todayKey] : [];
    const todayP = todayMeals.reduce((s,m) => s+(+m.p||0), 0);
    let startOffset = (todayMeals.length && todayP >= targets.proteinG*.9) ? 0 : 1;
    for (let i = startOffset; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate()-i);
      const key = _isoKey(d);
      const meals = Array.isArray(ml[key]) ? ml[key] : [];
      if (!meals.length) break;
      const p = meals.reduce((s,m) => s+(+m.p||0), 0);
      if (p < targets.proteinG*.9) break;
      streak++;
    }
    return streak;
  })();

  const calPct  = Math.min(100, Math.round(avgKcal / Math.max(targets.targetCal,1) * 100));
  const mkBar   = (pct, col) => `<div style="height:4px;background:var(--border2);border-radius:2px;margin-top:6px"><div style="height:4px;background:${col};border-radius:2px;width:${pct}%"></div></div>`;
  const macroCommandHtml = `
<div class="nutri-macro-command-row">
  <div class="nutri-command-card">
    <span>${tx('Protein','البروتين')}</span>
    <strong>${Math.round(avgP)}<small> / ${Math.round(targets.proteinG)}g</small></strong>
    <em>${proteinDays}/${nDays} ${tx('days on target','أيام على الهدف')}</em>
    <div class="nutri-command-bar"><div style="width:${Math.min(100, Math.round(avgP / Math.max(targets.proteinG,1) * 100))}%;background:#4ade80"></div></div>
  </div>
  <div class="nutri-command-card">
    <span>${tx('Calories','السعرات')}</span>
    <strong>${Math.round(avgKcal)}<small> / ${Math.round(targets.targetCal)}</small></strong>
    <em>${calPct}% ${tx('of target','من الهدف')}</em>
    <div class="nutri-command-bar"><div style="width:${calPct}%;background:#5be4ff"></div></div>
  </div>
  <div class="nutri-command-card">
    <span>${tx('Carbs','الكربوهيدرات')}</span>
    <strong>${Math.round(avgC)}<small> / ${Math.round(targets.carbG)}g</small></strong>
    <em>${Math.round(avgC / Math.max(targets.carbG,1) * 100)}% ${tx('fuel coverage','تغطية الوقود')}</em>
    <div class="nutri-command-bar"><div style="width:${Math.min(100, Math.round(avgC / Math.max(targets.carbG,1) * 100))}%;background:#f3b34d"></div></div>
  </div>
  <div class="nutri-command-card">
    <span>${tx('Fats','الدهون')}</span>
    <strong>${Math.round(avgF)}<small> / ${Math.round(targets.fatG)}g</small></strong>
    <em>${Math.round(avgF / Math.max(targets.fatG,1) * 100)}% ${tx('recovery base','قاعدة التعافي')}</em>
    <div class="nutri-command-bar"><div style="width:${Math.min(100, Math.round(avgF / Math.max(targets.fatG,1) * 100))}%;background:#8fb2ff"></div></div>
  </div>
</div>`;

  // Zone 1: Period stat cards
  const statsZone = document.getElementById('nut-stats-zone');
  if (statsZone) _dhSetHtml(statsZone, `
${macroCommandHtml}
<div class="nutri-period-block">
  <div class="nutri-period-title">${tx('Period Performance','أداء الفترة')}</div>
  <div class="stats-grid nutri-period-grid" style="margin-bottom:14px">
  <div class="sg-card">
    <div class="sg-label">${tx('Avg Calories','ظ…طھظˆط³ط· ط§ظ„ط³ط¹ط±ط§طھ')}</div>
    <div class="sg-val">${Math.round(avgKcal)}<span class="sg-unit"> / ${Math.round(targets.targetCal)}</span></div>
    ${mkBar(calPct,'var(--accent)')}
  </div>
  <div class="sg-card">
    <div class="sg-label">${tx('Macro Compliance','ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط§ظ„ظ…ط§ظƒط±ظˆ')}</div>
    <div class="sg-val">${compliance}<span class="sg-unit">%</span></div>
    ${mkBar(compliance,'var(--accent)')}
  </div>
  <div class="sg-card">
    <div class="sg-label">${tx('Logged Days','ط£ظٹط§ظ… ظ…ط³ط¬ظ„ط©')}</div>
    <div class="sg-val sg-neutral">${nDays}<span class="sg-unit">d</span></div>
    <div class="sg-sub">${tx('Meals:','ظˆط¬ط¨ط§طھ:')} ${tot.count}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">${tx('Avg Macros','ظ…طھظˆط³ط· ط§ظ„ظ…ط§ظƒط±ظˆ')}</div>
    <div class="sg-val sg-neutral" style="font-size:16px;line-height:1.5">${Math.round(avgP)}P / ${Math.round(avgC)}C / ${Math.round(avgF)}F</div>
    <div class="sg-sub">${tx('Targets:','ط£ظ‡ط¯ط§ظپ:')} ${Math.round(targets.proteinG)}P / ${Math.round(targets.carbG)}C / ${Math.round(targets.fatG)}F</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">${_nutriIcon('protein')} ${tx('Protein Days','ط£ظٹط§ظ… ط§ظ„ط¨ط±ظˆطھظٹظ†')}</div>
    <div class="sg-val sg-neutral">${proteinDays}<span class="sg-unit"> / ${nDays}</span></div>
    <div class="sg-sub">${nDays ? Math.round(proteinDays/nDays*100) : 0}% ${tx('of period','ظ…ظ† ط§ظ„ظپطھط±ط©')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">${_nutriIcon('deficit')} ${tx('Deficit Days','ط£ظٹط§ظ… ط§ظ„ط¹ط¬ط²')}</div>
    <div class="sg-val sg-neutral">${deficitDays}<span class="sg-unit"> / ${nDays}</span></div>
    <div class="sg-sub">${nDays ? Math.round(deficitDays/nDays*100) : 0}% ${tx('of period','ظ…ظ† ط§ظ„ظپطھط±ط©')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">${_nutriIcon('streak')} ${tx('Cur. Streak','ط§ظ„ط¥ظ†ط¬ط§ط² ط§ظ„ط­ط§ظ„ظٹ')}</div>
    <div class="sg-val${currentStreak >= 3 ? '' : ' sg-neutral'}"${currentStreak >= 3 ? ' style="color:#e6b84a"' : ''}>${currentStreak > 0 ? currentStreak + '<span class="sg-unit"> ' + tx('days','ط£ظٹط§ظ…') + '</span>' : '--'}</div>
    <div class="sg-sub">${currentStreak > 0 ? tx('protein goal','ظ‡ط¯ظپ ط§ظ„ط¨ط±ظˆطھظٹظ†') : tx('start your streak!','ط§ط¨ط¯ط£ ط¥ظ†ط¬ط§ط²ظƒ!')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">${_nutriIcon('best')} ${tx('Best Streak','ط£ظپط¶ظ„ ط¥ظ†ط¬ط§ط²')}</div>
    <div class="sg-val sg-neutral">${bestStreak}<span class="sg-unit"> ${tx('days','ط£ظٹط§ظ…')}</span></div>
    <div class="sg-sub">${tx('this period','ظ‡ط°ظ‡ ط§ظ„ظپطھط±ط©')}</div>
  </div>
  <div class="sg-card">
    <div class="sg-label">${_nutriIcon('repeat')} ${tx('Meal Repeat Streak','إنجاز تكرار الوجبة')}</div>
    <div class="sg-val sg-neutral">${mealRepeat.longest > 0 ? mealRepeat.longest : '--'}<span class="sg-unit">${mealRepeat.longest > 0 ? ' d' : ''}</span></div>
    <div class="sg-sub">${mealRepeat.name ? esc(mealRepeat.name) : tx('No repeated meals yet','لا توجد وجبة متكررة بعد')}</div>
  </div>
</div>
</div>`);

  // Zone 2: Charts HTML scaffold
  const chartsZone = document.getElementById('nut-charts-zone');
  if (chartsZone) _dhSetHtml(chartsZone, `
<div class="nut-charts-grid">
  <div class="nut-chart-card wide">
    ${_nutChartHead(`${_nutriIcon('protein')} ${tx('Protein Trend (Daily g)','اتجاه البروتين (غ يومي)')}`, 'nut-protein-chart')}
    <div style="height:150px"><canvas id="nut-protein-chart"></canvas></div>
  </div>
  <div class="nut-chart-card">
    ${_nutChartHead(`${_nutriIcon('trend')} ${tx('Calorie Trend','ظ…ظ†ط­ظ†ظ‰ ط§ظ„ط³ط¹ط±ط§طھ')}`, 'nut-cal-chart')}
    <div style="height:140px"><canvas id="nut-cal-chart"></canvas></div>
  </div>
  <div class="nut-chart-card">
    ${_nutChartHead(`${_nutriIcon('macro')} ${tx('Macro Split','طھظˆط²ظٹط¹ ط§ظ„ظ…ط§ظƒط±ظˆ')}`, 'nut-macro-chart')}
    <div style="height:140px"><canvas id="nut-macro-chart"></canvas></div>
    <div class="nut-macro-legend" id="nut-macro-chart-legend"></div>
  </div>
  <div class="nut-chart-card">
    ${_nutChartHead(`${_nutriIcon('week')} ${tx('Weekly Calories','ط§ظ„ط³ط¹ط±ط§طھ ط§ظ„ط£ط³ط¨ظˆط¹ظٹط©')}`, 'nut-week-chart')}
    <div style="height:140px"><canvas id="nut-week-chart"></canvas></div>
  </div>
  <div class="nut-chart-card">
    ${_nutChartHead(`${_nutriIcon('score')} ${tx('Day Score','ظ†ظ‚ط§ط· ط§ظ„ظٹظˆظ…')}`, 'nut-score-chart')}
    <div style="height:140px"><canvas id="nut-score-chart"></canvas></div>
  </div>
</div>`);

  // Init charts after DOM settles
  requestAnimationFrame(() => {
    _renderProteinTrendChart(daily, targets.proteinG, 'nut-protein-chart');
    _renderCalorieTrendChart(daily, targets.targetCal, 'nut-cal-chart');
    _renderMacroDonutChart(avgP, avgC, avgF, compliance, 'nut-macro-chart');
    _renderWeeklyBarChart(targets.targetCal, 'nut-week-chart');
    _renderDayScoreChart(dayScores, 'nut-score-chart');
    requestAnimationFrame(_bindNutritionChartExpandersReliable);
  });

  // Zone 3: Insights
  const underProteinDays = daily.filter(d => d.p < targets.proteinG * 0.9).length;
  const overCalDays  = daily.filter(d => d.kcal > targets.targetCal * 1.1).length;
  const lowCalDays   = daily.filter(d => d.kcal < targets.targetCal * 0.8).length;
  const sorted = [...dayScores].sort((a,b) => b.score-a.score);
  const bestDay  = sorted[0];
  const worstDay = sorted[sorted.length-1];
  const fmtDate  = k => { try { return new Date(k).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); } catch(e){ return k; } };

  const calTrend = (() => {
    if (daily.length < 4) return tx('Not enough data.','ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± ظƒط§ظپظٹط©.');
    const half = Math.floor(daily.length/2);
    const firstHalf = daily.slice(0,half).reduce((s,d)=>s+d.kcal,0)/half;
    const secHalf   = daily.slice(half).reduce((s,d)=>s+d.kcal,0)/(daily.length-half);
    const delta = secHalf - firstHalf;
    if (Math.abs(delta) < 50) return tx('Calories are relatively stable.','ط§ظ„ط³ط¹ط±ط§طھ ظ…ط³طھظ‚ط±ط© ظ†ط³ط¨ظٹط§ظ‹.');
    return delta > 0 ? tx('Calorie intake trending up.','ط§ظ„ط³ط¹ط±ط§طھ ظپظٹ طھط²ط§ظٹط¯.') : tx('Calorie intake trending down.','ط§ظ„ط³ط¹ط±ط§طھ ظپظٹ طھظ†ط§ظ‚طµ.');
  })();

  const allMeals = daily.flatMap(d => (dayMap[d.key]||[]).map(m=>({...m,dayKey:d.key})));
  const recoveryFuelDays = daily.filter(d => d.p >= targets.proteinG * 0.9 && d.kcal >= targets.targetCal * 0.85).length;
  const strongProteinDoseMeals = allMeals.filter(m => (+m.p || 0) >= 25).length;
  const proteinDosePct = allMeals.length ? Math.round((strongProteinDoseMeals / allMeals.length) * 100) : 0;
  const peakHour = (() => {
    if (!allMeals.length) return null;
    const hours = allMeals.map(m => { const d = new Date(m.ts||m.createdAtIso); return isNaN(d)?-1:d.getHours(); }).filter(h=>h>=0);
    if (!hours.length) return null;
    const cnt = {}; hours.forEach(h=>{cnt[h]=(cnt[h]||0)+1;});
    return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0];
  })();

  const insightCards = [
    {
      tone: underProteinDays > 0 ? 'warn' : 'good',
      icon: underProteinDays > 0 ? _nutriIcon('warn') : _nutriIcon('ok'),
      title: tx('Protein Consistency','انتظام البروتين'),
      body: underProteinDays > 0
        ? `${tx('Protein low on','بروتين منخفض في')} ${underProteinDays}/${nDays} ${tx('days','أيام')}`
        : tx('Protein target was hit on all logged days.','تم تحقيق هدف البروتين في كل الأيام المسجلة.')
    },
    {
      tone: (overCalDays + lowCalDays) > Math.ceil(nDays * 0.5) ? 'warn' : 'info',
      icon: _nutriIcon('balance'),
      title: tx('Calorie Balance','توازن السعرات'),
      body: `${tx('High-calorie days:','أيام عالية السعرات:')} ${overCalDays} • ${tx('Low-calorie days:','أيام منخفضة السعرات:')} ${lowCalDays}`
    },
    bestDay && worstDay ? {
      tone: 'info',
      icon: _nutriIcon('day'),
      title: tx('Best vs Needs Work','أفضل يوم مقابل يوم يحتاج تحسين'),
      body: `${tx('Best day:','أفضل يوم:')} ${fmtDate(bestDay.key)} (${Math.round(bestDay.score*100)}%) • ${tx('Needs work:','يحتاج تحسين:')} ${fmtDate(worstDay.key)} (${Math.round(worstDay.score*100)}%)`
    } : null,
    {
      tone: 'trend',
      icon: _nutriIcon('trend'),
      title: tx('Trend Signal','إشارة الاتجاه'),
      body: calTrend
    },
    {
      tone: recoveryFuelDays >= Math.ceil(nDays * 0.5) ? 'good' : 'warn',
      icon: _nutriIcon('score'),
      title: tx('Recovery Fueling','التغذية للاستشفاء'),
      body: `${tx('Recovery-ready days:','أيام جاهزة للاستشفاء:')} ${recoveryFuelDays}/${nDays}`
    },
    {
      tone: proteinDosePct >= 55 ? 'good' : 'info',
      icon: _nutriIcon('protein'),
      title: tx('Protein Dose Quality','جودة جرعات البروتين'),
      body: `${tx('Meals with 25g+ protein:','وجبات تحتوي 25غ+ بروتين:')} ${strongProteinDoseMeals}/${allMeals.length || 0} (${proteinDosePct}%)`
    },
    {
      tone: mealRepeat.longest >= 3 ? 'good' : 'info',
      icon: _nutriIcon('repeat'),
      title: tx('Meal Repeat Streak','إنجاز تكرار الوجبة'),
      body: mealRepeat.longest > 0
        ? `${tx('Best streak:','أفضل إنجاز:')} ${mealRepeat.longest} ${tx('days','أيام')} (${esc(mealRepeat.name)})`
        : tx('No consecutive repeated meal streak yet.','لا يوجد إنجاز تكرار متتالي للوجبات بعد.')
    }
  ].filter(Boolean);

  const quickSummaryHtml = `
<div class="nutri-insights-topline">
  <span class="nutri-control-kicker">${tx('Deep Nutrition View','الرؤية الغذائية العميقة')}</span>
  <span class="nutri-control-live">${tx('Period','الفترة')}</span>
</div>
<div class="nutri-pill-row nutri-quick-pills">
  <span class="nutri-pill">${_nutriIcon('protein')} ${tx('Protein hit','تحقيق البروتين')}: ${proteinDays}/${nDays}</span>
  <span class="nutri-pill">${_nutriIcon('streak')} ${tx('Current streak','الإنجاز الحالي')}: ${currentStreak || 0} ${tx('days','أيام')}</span>
  <span class="nutri-pill">${_nutriIcon('consistency')} ${tx('Compliance','الالتزام')}: ${compliance}%</span>
  <span class="nutri-pill">${_nutriIcon('repeat')} ${tx('Meal repeat','تكرار الوجبة')}: ${mealRepeat.current || 0} ${tx('days','أيام')}</span>
</div>`;

  const insightRowsHtml = `
<div class="nutri-insight-stack">
  ${insightCards.map(card => `
    <div class="nutri-insight-card ${card.tone}">
      <div class="nutri-insight-head">
        <span class="nutri-insight-icon">${card.icon}</span>
        <span class="nutri-insight-title">${card.title}</span>
      </div>
      <div class="nutri-insight-body">${card.body}</div>
    </div>
  `).join('')}
</div>`;

    const mealTimingHtml = `
<div class="nutri-deep-grid">
  <div class="nutri-deep-card">
    <div class="nutri-deep-title">${tx('Meal Timing','توقيت الوجبات')}</div>
    <div class="nutri-deep-line">
      <span>${tx('Most active meal hour','أكثر وقت لتناول الوجبات')}</span>
      <strong>${peakHour !== null ? peakHour+':00' : '—'}</strong>
    </div>
    <div class="nutri-deep-line">
      <span>${tx('Total meals in period','إجمالي الوجبات في الفترة')}</span>
      <strong>${tot.count}</strong>
    </div>
  </div>
  <div class="nutri-deep-card">
    <div class="nutri-deep-title">${tx('Logging Consistency','انتظام التسجيل')}</div>
    <div class="nutri-deep-line">
      <span>${tx('Days with meal logs','أيام بوجبات مسجلة')}</span>
      <strong>${nDays}</strong>
    </div>
    <div class="nutri-deep-line">
      <span>${tx('Consistency score','نقاط الانتظام')}</span>
      <strong>${Math.round(nDays / Math.max(daily.length,1) * 100)}%</strong>
    </div>
  </div>
  <div class="nutri-deep-card">
    <div class="nutri-deep-title">${tx('Athlete Focus','تركيز رياضي')}</div>
    <div class="nutri-deep-line">
      <span>${tx('Avg daily protein','متوسط البروتين اليومي')}</span>
      <strong>${Math.round(avgP)}g</strong>
    </div>
    <div class="nutri-deep-line">
      <span>${tx('Protein target','هدف البروتين')}</span>
      <strong>${Math.round(targets.proteinG)}g</strong>
    </div>
    <div class="nutri-deep-line">
      <span>${tx('Recovery-ready days','أيام جاهزة للاستشفاء')}</span>
      <strong>${recoveryFuelDays}/${nDays}</strong>
    </div>
    <div class="nutri-deep-line">
      <span>${tx('Top repeated meal','أكثر وجبة متكررة')}</span>
      <strong>${mealRepeat.name ? esc(mealRepeat.name) : '--'}</strong>
    </div>
  </div>
</div>`;

  if (insightsEl) _dhSetHtml(insightsEl, quickSummaryHtml + insightRowsHtml + mealTimingHtml);
}

function renderDashboard() {
  // Show/hide no-data banner
  const _ndb = document.getElementById('dash-nodata-banner');
  if (_ndb) _ndb.classList.toggle('show', workouts.length === 0);

  // Period-filtered workouts â€” used by charts below
  const _pw = _getPw();

  // â”€â”€ All-time weighted stats (v43 stats-grid) â”€â”€
  const totalSessions = workouts.length;
  const totalVol = workouts.reduce((a,w) => a+(w.totalVolume||0), 0);

  // Best lift â€” reuse existing _dashPRCache to avoid O(n) scan on every render
  if (!_dashPRCache) {
    _dashPRCache = { val: 0, ex: 'â€”' };
    workouts.forEach(w => (w.sets||[]).forEach(s => {
      if (s.weight > _dashPRCache.val) { _dashPRCache.val = s.weight; _dashPRCache.ex = w.exercise; }
    }));
  }

  const streak = calcStreak();
  const totalPRs = workouts.filter(w => w.isPR).length;
  const lastW = workouts.slice().sort((a,b) => new Date(b.date)-new Date(a.date))[0];
  const todayStr = new Date().toISOString().slice(0,10);
  const lastDateStr = lastW?.date ? lastW.date.slice(0,10) : null;
  const daysAgo = lastDateStr === null ? null
    : lastDateStr === todayStr ? 0
    : Math.floor((Date.now()-new Date(lastDateStr))/86400000);

  const _sgEl = id => document.getElementById(id);
  _sgEl('sg-sessions') && (_sgEl('sg-sessions').textContent = totalSessions);
  _sgEl('sg-volume') && (_sgEl('sg-volume').innerHTML = Math.round(totalVol).toLocaleString()+'<span class="sg-unit">kg</span>');
  _sgEl('sg-best-lift') && (_sgEl('sg-best-lift').textContent = _dashPRCache.val > 0 ? _dashPRCache.val+'kg' : 'â€”');
  _sgEl('sg-best-lift-sub') && (_sgEl('sg-best-lift-sub').textContent = _dashPRCache.ex);
  _sgEl('sg-streak') && (_sgEl('sg-streak').innerHTML = streak+'<span class="sg-unit">d</span>');
  _sgEl('sg-streak-sub') && (_sgEl('sg-streak-sub').textContent = streak>=7?'On fire! ًں”¥':streak>=3?'Building habit':'Train today!');
  _sgEl('sg-prs') && (_sgEl('sg-prs').textContent = totalPRs);
  _sgEl('sg-last-session') && (_sgEl('sg-last-session').textContent = daysAgo===null?'â€”':daysAgo===0?'Today':daysAgo+'d ago');
  _sgEl('sg-last-session-sub') && (_sgEl('sg-last-session-sub').textContent = lastDateStr ? new Date(lastDateStr).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : 'â€”');

  // â”€â”€ CALI row (v43) â”€â”€
  const bwAll = typeof bwWorkouts !== 'undefined' ? bwWorkouts : [];
  let _sgUnlocked = 0, _sgTotal = 0;
  if (bwAll.length && typeof CALISTHENICS_TREES !== 'undefined') {
    CALISTHENICS_TREES.forEach(tree => {
      tree.levels.forEach(lvl => {
        _sgTotal++;
        const maxVal = bwAll
          .filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase())
          .reduce((mx,w) => Math.max(mx, ...(w.sets||[]).map(s => s.reps||s.secs||0)), 0);
        if (maxVal >= lvl.target) _sgUnlocked++;
      });
    });
  }
  const journeyPct = _sgTotal > 0 ? Math.round((_sgUnlocked/_sgTotal)*100) : 0;
  _sgEl('sg-bw-sessions') && (_sgEl('sg-bw-sessions').textContent = bwAll.length);
  _sgEl('sg-skills') && (_sgEl('sg-skills').textContent = _sgUnlocked+'/'+_sgTotal);
  _sgEl('sg-journey-pct') && (_sgEl('sg-journey-pct').textContent = journeyPct+'%');
  const _jBar = document.getElementById('cali-journey-bar-fill');
  if (_jBar) _jBar.style.width = journeyPct+'%';

  _renderVolPanel();
  renderMuscleVol(_pw);
  renderBodyHeatmap(workouts); // recovery view â€” always all-time
  renderMuscleBalance(_pw);
  renderFreqChart(_pw);
  populateExerciseSelect();
  renderBcompChart(currentBcompChart);
  renderCompCards();
  renderFFMICards();
  renderBWHistory();
  initWater();
  renderMVPZone();
  renderNeglectedZones();
  if (typeof renderWeekComparison === 'function') renderWeekComparison();
  if (typeof renderRecoveryMap === 'function') renderRecoveryMap();
  if (typeof renderPBBoard === 'function') renderPBBoard();
  if (typeof renderStrengthStandards === 'function') renderStrengthStandards();
  if (typeof populateVelocitySelect === 'function') populateVelocitySelect();
  if (typeof renderVelocityChart === 'function') renderVelocityChart();
  if (typeof _renderRoadmap === 'function') _renderRoadmap();
  if (typeof renderMuscleFreshness === 'function') renderMuscleFreshness();
  if (typeof renderProgressHighlights === 'function') renderProgressHighlights();
  if (typeof renderNutritionAnalyticsPanel === 'function') renderNutritionAnalyticsPanel();
  // Render the quick snapshot bar (overview tab)
  if (typeof _renderOverviewSnapshot === 'function') _renderOverviewSnapshot();
  // Apply active tab filter
  switchDashTab(_dashActiveTab, document.querySelector('.dash-tab.active'));
  // Recomp rest-day mascot nudge
  if ((userProfile?.goal) === 'recomp' && typeof _getRecompDayType === 'function' && _getRecompDayType() === 'rest') {
    setTimeout(() => { if (typeof setMascotSay === 'function') setMascotSay('Rest day â€” fuel light, incinerate fat! ًں”¥', 7000); }, 600);
  }
}

function renderHistory() {
  renderWorkoutCalendar();
  const fm = document.getElementById('filter-muscle').value;
  const fe = document.getElementById('filter-exercise').value.toLowerCase();
  const so = document.getElementById('filter-sort').value;

  // Merge weighted + bodyweight workouts into one unified list
  const bwAll = (typeof bwWorkouts !== 'undefined' ? bwWorkouts : []).map(w => ({ ...w, type: 'bodyweight' }));
  const _dateMatch = w => {
    if (!_calDateFilter) return true;
    const d = new Date(w.date || w.id);
    if (isNaN(d)) return false;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key === _calDateFilter;
  };
  const filteredWgt = workouts.filter(w => (!fm || w.muscle === fm) && (!fe || w.exercise.toLowerCase().includes(fe)) && _dateMatch(w));
  const filteredBw = bwAll.filter(w => (!fm || w.muscle === fm) && (!fe || w.exercise.toLowerCase().includes(fe)) && _dateMatch(w));
  const filtered = [...filteredWgt, ...filteredBw];

  if (so === 'date-desc' || so === 'vol-desc') filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (so === 'date-asc') filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  const tFn = (typeof t === 'function') ? t : (k => k);
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  const dateLoc = lang === 'ar' ? 'ar-SA' : 'en-GB';
  const histCountBadge = document.getElementById('hist-count-badge');
  if (histCountBadge) histCountBadge.textContent = `${filtered.length} ${tFn('history.entries')}`;

  const sessionMap = {};
  const sessionOrder = [];
  filtered.forEach(w => {
    const key = (w.date || '').slice(0, 10);
    if (!sessionMap[key]) { sessionMap[key] = []; sessionOrder.push(key); }
    sessionMap[key].push(w);
  });
  const dateKeys = Object.keys(sessionMap);
  const streak = _calcStreakFromDateKeys(dateKeys);
  const totalVolume = filtered.reduce((a, w) => a + (w.type === 'bodyweight' ? 0 : (w.totalVolume || 0)), 0);
  const prCountTotal = filtered.filter(w => w.isPR).length;
  const xp = Math.round(totalVolume / 100) + (prCountTotal * 45) + (filtered.length * 12);
  const nextXp = Math.ceil((xp + 1) / 200) * 200;
  const lvl = Math.max(1, Math.floor(xp / 200) + 1);
  const lvlProgress = Math.min(100, Math.round(((xp % 200) / 200) * 100));
  const histInsight = document.getElementById('history-gamify-insights');
  if (histInsight) {
    histInsight.innerHTML = `
      <div class="hist-gamify-grid">
        <div class="hist-gamify-card streak">
          <div class="hist-gamify-top">${_histSvgIcon('flame')} <span>${tFn('history.gamify.currentStreak')}</span></div>
          <div class="hist-gamify-val">${streak.current}<small>${tFn('history.gamify.days')}</small></div>
          <div class="hist-gamify-sub">${tFn('history.gamify.best')}: ${streak.best} ${tFn('history.gamify.days')}</div>
        </div>
        <div class="hist-gamify-card pr">
          <div class="hist-gamify-top">${_histSvgIcon('star')} <span>${tFn('history.gamify.prHits')}</span></div>
          <div class="hist-gamify-val">${prCountTotal}<small>${tFn('history.gamify.records')}</small></div>
          <div class="hist-gamify-sub">${tFn('history.gamify.visibleSessions')}</div>
        </div>
        <div class="hist-gamify-card xp">
          <div class="hist-gamify-top">${_histSvgIcon('bolt')} <span>${tFn('history.gamify.level')}</span></div>
          <div class="hist-gamify-val">L${lvl}<small>XP</small></div>
          <div class="hist-gamify-sub">${xp}/${nextXp}</div>
          <div class="hist-gamify-bar"><span style="width:${lvlProgress}%"></span></div>
        </div>
        <div class="hist-gamify-card volume">
          <div class="hist-gamify-top">${_histSvgIcon('trendup')} <span>${tFn('history.gamify.volumeBank')}</span></div>
          <div class="hist-gamify-val">${Math.round(totalVolume).toLocaleString()}<small>kg</small></div>
          <div class="hist-gamify-sub">${dateKeys.length} ${tFn('history.gamify.activeDays')}</div>
        </div>
      </div>`;
  }
  if (!filtered.length) {
    _dhSetHtml(document.getElementById('history-list'), `<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div><div class="empty-title">${tFn('history.empty')}</div><div style="font-size:12px;color:var(--text3);margin-top:4px;">${tFn('history.emptyHint')}</div></div>`);
    return;
  }

  // Build exercise card HTML (reused inside each session)
  function _buildExCard(w) {
    const isBW = w.type === 'bodyweight';
    const dStr = new Date(w.date).toLocaleDateString(dateLoc, { weekday: 'short', month: 'short', day: 'numeric' });
    if (isBW) {
      const totalReps = w.totalReps || (w.sets || []).reduce((a, s) => a + (s.r || s.reps || 0), 0);
      const effortColorMap = { easy: '#3a9e6a', medium: '#f39c12', hard: '#e74c3c', failure: '#888' };
      const effortIcons = [...new Set((w.sets || []).map(s => effortColorMap[(s.e || s.effort || '').toLowerCase()]).filter(Boolean))].map(c => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin:1px;"></span>`).join('');
      const bdrDir = lang === 'ar' ? 'border-right' : 'border-left';
      return `<div class="hist-item" style="${bdrDir}:3px solid #3a9e6a;">
        <div class="hist-muscle-badge">${_histMuscleIcon(w.muscle)}</div>
        <div class="hist-info">
          <div class="hist-name">${w.exercise}${w.isPR ? ' <span class="pr-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;"><polyline points="6 9 12 4 18 9"/><path d="M6 9v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><line x1="12" y1="4" x2="12" y2="14"/></svg> ' + tFn('history.pr') + '</span>' : ''} <span style="font-size:9px;color:var(--text3);font-family:'DM Mono'">BW</span></div>
          <div class="hist-meta">${w.muscle || tFn('bw.title')} • ${dStr}${w.notes ? ' • ' + w.notes : ''}</div>
        </div>
        <div class="hist-stats">
          <div><div class="hist-stat-val">${(w.sets || []).length}</div><div class="hist-stat-lbl">${tFn('history.sets')}</div></div>
          <div><div class="hist-stat-val">${totalReps}</div><div class="hist-stat-lbl">${tFn('history.reps')}</div></div>
          <div style="font-size:14px;">${effortIcons}</div>
        </div>
      </div>`;
    }
    const maxW = Math.max(...w.sets.map(s => s.weight));
    const prev = workouts.filter(x => x.exercise === w.exercise && new Date(x.date) < new Date(w.date));
    let trendArrow = ''; let trendClass = 'same';
    if (prev.length) {
      const pm = Math.max(...prev[prev.length - 1].sets.map(s => s.weight));
      if (maxW > pm) { trendArrow = '↑'; trendClass = 'up'; } else if (maxW < pm) { trendArrow = '↓'; trendClass = 'down'; } else { trendArrow = '→'; trendClass = 'same'; }
    }
    const _eff = w.effort || null;
    const _qScore = (typeof calcQualityScore === 'function' && _eff) ? calcQualityScore(w) : null;
    const _qBadge = (_eff && _qScore !== null) ? `<span class="quality-badge ${_eff}">${_qScore}Q</span>` : '';
    return `<div class="hist-item">
      <div class="hist-muscle-badge">${_histMuscleIcon(w.muscle)}</div>
      <div class="hist-info">
        <div class="hist-name">${w.exercise}${w.isPR ? ' <span class="pr-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;"><polyline points="6 9 12 4 18 9"/><path d="M6 9v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><line x1="12" y1="4" x2="12" y2="14"/></svg> ' + tFn('history.pr') + '</span>' : ''}</div>
        <div class="hist-meta">${w.muscle} • ${dStr}${w.notes ? ' • ' + w.notes : ''}</div>
      </div>
      <div class="hist-stats">
        <div><div class="hist-stat-val">${w.sets.length}</div><div class="hist-stat-lbl">${tFn('history.sets')}</div></div>
        <div><div class="hist-stat-val">${maxW}</div><div class="hist-stat-lbl">Max ${tFn('lbl.kg')}</div></div>
        ${trendArrow ? `<div class="trend-arrow ${trendClass}">${trendArrow}</div>` : ''}
        ${_qBadge}
      </div>
    </div>`;
  }

  _dhSetHtml(document.getElementById('history-list'), sessionOrder.map(dateKey => {
    const items = sessionMap[dateKey];
    const d = new Date(dateKey + 'T12:00:00');
    const dateStr = d.toLocaleDateString(dateLoc, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const muscles = [...new Set(items.map(w => w.muscle).filter(Boolean))];
    const muscleChips = muscles.map(m => `<span class="session-muscle-chip">${_histMuscleIcon(m, 'session-chip-icon')} ${t('muscle.' + m.replace(/ /g, '')) || m}</span>`).join('');
    const totalSets = items.reduce((a, w) => a + (w.sets ? w.sets.length : 0), 0);
    const totalVol = items.reduce((a, w) => a + (w.type === 'bodyweight' ? 0 : (w.totalVolume || 0)), 0);
    const prCount = items.filter(w => w.isPR).length;
    const prBadge = prCount > 0 ? `<span class="session-pr-badge">${_histSvgIcon('star', 'session-pr-icon')} ${prCount} PR${prCount > 1 ? 's' : ''}</span>` : '';
    const volStr = totalVol > 0 ? `${Math.round(totalVol).toLocaleString()} kg • ` : '';
    const exerciseCards = items.map(_buildExCard).join('');
    return `<div class="session-card">
      <div class="session-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="session-date">${dateStr}</div>
        <div class="session-chips">${muscleChips}</div>
        <div class="session-summary">${volStr}${totalSets} sets${prBadge ? ' • ' : ' '}${prBadge}</div>
        <div class="session-arrow">${_histSvgIcon('chevron', 'session-arrow-icon')}</div>
      </div>
      <div class="session-exs">${exerciseCards}</div>
    </div>`;
  }).join(''));
}

function _setHistMuscle(muscle, btn) {
  document.querySelectorAll('.hist-muscle-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const sel = document.getElementById('filter-muscle');
  if (sel) sel.value = muscle;
  renderHistory();
}

function _cycleHistSort(btn) {
  const sel = document.getElementById('filter-sort');
  if (!sel) return;
  const vals = ['date-desc', 'date-asc', 'vol-desc'];
  const labels = ['New', 'Old', 'Vol'];
  const idx = (vals.indexOf(sel.value) + 1) % vals.length;
  sel.value = vals[idx];
  const lbl = document.getElementById('hist-sort-label');
  if (lbl) lbl.textContent = labels[idx];
  renderHistory();
}

function renderPRs() {
  // Weighted PRs (best weight per exercise)
  const prs = {};
  workouts.forEach(w => { w.sets.forEach(s => { if (!prs[w.exercise] || s.weight > prs[w.exercise].weight) prs[w.exercise] = { weight: s.weight, muscle: w.muscle, type: 'weighted' }; }); });
  const sorted = Object.entries(prs).sort((a, b) => b[1].weight - a[1].weight);

  // Bodyweight PRs (best rep count per exercise)
  const bwPrs = {};
  (typeof bwWorkouts !== 'undefined' ? bwWorkouts : []).forEach(w => {
    const maxR = Math.max(...(w.sets || []).map(s => s.r || s.reps || 0));
    if (!bwPrs[w.exercise] || maxR > bwPrs[w.exercise].reps) bwPrs[w.exercise] = { reps: maxR, muscle: w.muscle || 'Bodyweight' };
  });
  const bwSorted = Object.entries(bwPrs).sort((a, b) => b[1].reps - a[1].reps);

  const hasPRs = sorted.length || bwSorted.length;
  const tFnPR = (typeof t === 'function') ? t : (k => k);
  if (!hasPRs) {
    document.getElementById('pr-list').innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 4 18 9"/><path d="M6 9v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><line x1="12" y1="4" x2="12" y2="14"/></svg></div><div class="empty-title">${tFnPR('prs.empty')}</div><div style="font-size:12px;color:var(--text3);margin-top:4px;">${tFnPR('prs.emptyHint')}</div></div>`;
    return;
  }

  const wgtHTML = sorted.map(([ex, pr], i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:'Bebas Neue';font-size:18px;color:${i === 0 ? '#f39c12' : 'var(--green)'};width:20px;text-align:center;">${i === 0 ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 4 18 9"/><path d="M6 9v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><line x1="12" y1="4" x2="12" y2="14"/></svg>` : i + 1}</div>
        <div>
          <div style="font-family:'Barlow Condensed';font-size:14px;font-weight:700;color:var(--white);">${ex}</div>
          <div style="font-family:'DM Mono';font-size:9px;color:var(--text3);">${pr.muscle}</div>
        </div>
      </div>
      <div style="font-family:'Bebas Neue';font-size:24px;color:var(--green);">${pr.weight}<span style="font-size:12px;color:var(--text3);"> ${tFnPR('lbl.kg')}</span></div>
    </div>`).join('');

  const bwHTML = bwSorted.length ? `
    <div style="font-family:'Barlow Condensed',Cairo,sans-serif;font-size:11px;letter-spacing:2px;color:var(--text3);padding:10px 0 4px;">${tFnPR('prs.bodyweight')}</div>
    ` + bwSorted.map(([ex, pr], i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:'Bebas Neue';font-size:18px;color:${i === 0 ? '#3a9e6a' : 'var(--green)'};width:20px;text-align:center;">${i === 0 ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a9e6a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 4 18 9"/><path d="M6 9v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><line x1="12" y1="4" x2="12" y2="14"/></svg>` : i + 1}</div>
        <div>
          <div style="font-family:'Barlow Condensed';font-size:14px;font-weight:700;color:var(--white);">${ex}</div>
          <div style="font-family:'DM Mono';font-size:9px;color:var(--text3);">${pr.muscle}</div>
        </div>
      </div>
      <div style="font-family:'Bebas Neue';font-size:24px;color:#3a9e6a;">${pr.reps}<span style="font-size:12px;color:var(--text3);"> ${tFnPR('prs.reps')}</span></div>
    </div>`).join('') : '';

  document.getElementById('pr-list').innerHTML =
    (sorted.length ? `<div style="font-family:'Barlow Condensed',Cairo,sans-serif;font-size:11px;letter-spacing:2px;color:var(--text3);padding:4px 0 4px;">${tFnPR('prs.weighted')}</div>` + wgtHTML : '') +
    bwHTML;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY NUTRITION REPORT  (Pillar 4.4 / P1 · v176)
// 7-day macro heat calendar + week-over-week comparison
// ─────────────────────────────────────────────────────────────────────────────
function renderWeeklyNutritionReport() {
  const el = document.getElementById('weekly-nutrition-body');
  if (!el) return;

  // ── helpers ──────────────────────────────────────────────────────────────
  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  function _isoDate(daysAgo) {
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }
  function _dayName(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
  }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // ── load data ─────────────────────────────────────────────────────────────
  const mealsData  = _lsGet('forge_meals', {});
  const profile    = (typeof userProfile !== 'undefined' ? userProfile : null)
                     || _lsGet('forge_profile', {});

  // TDEE & targets (mirror renderCoachNutrition logic)
  const wtRaw = parseFloat(profile.weight || 70);
  const unit  = profile.weightUnit || 'kg';
  const wtKg  = unit === 'lbs' ? wtRaw * 0.4536 : wtRaw;
  const htCm  = parseFloat(profile.height || 170);
  const isFemale = (profile.gender || '') === 'female';
  const age   = profile.dob ? Math.floor((Date.now() - new Date(profile.dob)) / 31557600000) : 25;
  const formulaBmr = 10 * wtKg + 6.25 * htCm - 5 * age + (isFemale ? -161 : 5);
  const inbodyBmr  = parseFloat(profile.inbodyBmr || 0);
  const useInbody  = inbodyBmr >= 800 && inbodyBmr <= 3500;
  const bmr  = useInbody ? inbodyBmr : formulaBmr;
  const af   = Math.max(1.2, Math.min(1.9, parseFloat(profile.activityFactor || 1.55)));
  const tdee = Math.round(bmr * af);
  const goal = profile.goal || 'muscle';

  const custom = profile.customNutritionTargets;
  let proteinTarget = Math.round(wtKg * 1.8);
  let kcalTarget = goal === 'fat_loss' ? Math.round(tdee - 400) : goal === 'muscle' ? Math.round(tdee + 200) : tdee;
  if (custom?.enabled) {
    if (custom.p > 0)    proteinTarget = Math.round(custom.p);
    if (custom.kcal > 0) kcalTarget    = Math.round(custom.kcal);
  }

  // ── build 14-day window (this week = 0..6, prev week = 7..13) ────────────
  function _weekData(startDaysAgo) {
    let totalKcal = 0, totalProtein = 0, totalSurplus = 0;
    let loggedDays = 0;
    const days = [];
    for (let i = startDaysAgo + 6; i >= startDaysAgo; i--) {
      const dk = _isoDate(i);
      const meals = Array.isArray(mealsData[dk]) ? mealsData[dk] : [];
      const kcal = meals.reduce((s, m) => s + (parseFloat(m.kcal) || 0), 0);
      const prot = meals.reduce((s, m) => s + (parseFloat(m.p)   || 0), 0);
      const hasData = meals.length > 0;
      if (hasData) {
        totalKcal    += kcal;
        totalProtein += prot;
        totalSurplus += (kcal - tdee);
        loggedDays++;
      }
      days.push({ date: dk, kcal: hasData ? Math.round(kcal) : null, protein: hasData ? Math.round(prot) : null, hasData });
    }
    const avg = (v) => loggedDays ? Math.round(v / loggedDays) : null;
    return { days, avgKcal: avg(totalKcal), avgProtein: avg(totalProtein), avgSurplus: avg(totalSurplus), loggedDays };
  }

  const thisWeek = _weekData(0);
  const prevWeek = _weekData(7);
  const hasAny   = thisWeek.loggedDays > 0;

  if (!hasAny) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Log meals this week to see your report</div></div>';
    return;
  }

  // ── cell status helpers ───────────────────────────────────────────────────
  function _kcalStatus(kcal) {
    if (kcal === null) return 'wnr-na';
    const delta = kcal - kcalTarget;
    if (goal === 'fat_loss') {
      if (delta <= -200 && delta >= -700) return 'wnr-hit';
      if (delta <= 0)  return 'wnr-partial';
      return 'wnr-miss';
    }
    if (goal === 'muscle' || goal === 'strength') {
      if (delta >= 100 && delta <= 500) return 'wnr-hit';
      if (delta >= 0)  return 'wnr-partial';
      return 'wnr-miss';
    }
    // recomp / default: within ±200 of target
    return Math.abs(delta) <= 200 ? 'wnr-hit' : Math.abs(delta) <= 400 ? 'wnr-partial' : 'wnr-miss';
  }
  function _protStatus(prot) {
    if (prot === null) return 'wnr-na';
    const ratio = prot / proteinTarget;
    if (ratio >= 0.9)  return 'wnr-hit';
    if (ratio >= 0.7)  return 'wnr-partial';
    return 'wnr-miss';
  }

  // ── heat calendar HTML ────────────────────────────────────────────────────
  const calendarRows = thisWeek.days.map(d => {
    const ks = _kcalStatus(d.kcal);
    const ps = _protStatus(d.protein);
    return `
      <div class="wnr-cal-row">
        <span class="wnr-cal-day">${_esc(_dayName(d.date))}</span>
        <div class="wnr-cal-cells">
          <div class="wnr-cell ${ks}" title="Calories: ${d.kcal !== null ? d.kcal + ' kcal' : 'no data'}">
            <span class="wnr-cell-val">${d.kcal !== null ? d.kcal : '—'}</span>
            <span class="wnr-cell-lbl">kcal</span>
          </div>
          <div class="wnr-cell ${ps}" title="Protein: ${d.protein !== null ? d.protein + 'g' : 'no data'}">
            <span class="wnr-cell-val">${d.protein !== null ? d.protein + 'g' : '—'}</span>
            <span class="wnr-cell-lbl">prot</span>
          </div>
        </div>
      </div>`;
  }).join('');

  // ── week-over-week comparison ─────────────────────────────────────────────
  function _wowRow(label, thisVal, prevVal, unit, lowerIsBetter) {
    if (thisVal === null) return '';
    const sign = (n) => n > 0 ? '+' : '';
    const arrow = prevVal !== null
      ? (thisVal > prevVal ? (lowerIsBetter ? '↑' : '↑') : thisVal < prevVal ? (lowerIsBetter ? '↓' : '↓') : '→')
      : '';
    const arrowCls = prevVal === null ? '' : (thisVal > prevVal ? (lowerIsBetter ? 'wnr-down' : 'wnr-up') : thisVal < prevVal ? (lowerIsBetter ? 'wnr-up' : 'wnr-down') : 'wnr-neutral');
    const delta = prevVal !== null ? Math.round(thisVal - prevVal) : null;
    return `
      <div class="wnr-wow-row">
        <span class="wnr-wow-label">${_esc(label)}</span>
        <span class="wnr-wow-val">${thisVal}${unit}</span>
        ${delta !== null ? `<span class="wnr-wow-delta ${arrowCls}">${arrow} ${sign(delta)}${delta}${unit}</span>` : '<span class="wnr-wow-delta wnr-neutral">no prev data</span>'}
      </div>`;
  }

  const surplusLabel = goal === 'fat_loss' ? 'Avg deficit' : 'Avg surplus';
  const surplusSign  = thisWeek.avgSurplus !== null && thisWeek.avgSurplus > 0 ? '+' : '';

  el.innerHTML = `
    <div class="wnr-section-label">7-DAY MACRO CALENDAR</div>
    <div class="wnr-legend">
      <span class="wnr-dot wnr-hit"></span>On target
      <span class="wnr-dot wnr-partial"></span>Partial
      <span class="wnr-dot wnr-miss"></span>Off track
      <span class="wnr-dot wnr-na"></span>No data
    </div>
    <div class="wnr-calendar">${calendarRows}</div>
    <div class="wnr-section-label" style="margin-top:16px;">THIS WEEK vs LAST WEEK</div>
    <div class="wnr-wow-grid">
      ${_wowRow('Avg protein/day', thisWeek.avgProtein, prevWeek.avgProtein, 'g', false)}
      ${_wowRow('Avg calories/day', thisWeek.avgKcal, prevWeek.avgKcal, ' kcal', goal === 'fat_loss')}
      ${_wowRow(surplusLabel, thisWeek.avgSurplus, prevWeek.avgSurplus, ' kcal', goal === 'fat_loss')}
      <div class="wnr-wow-row">
        <span class="wnr-wow-label">Days logged</span>
        <span class="wnr-wow-val">${thisWeek.loggedDays}/7</span>
        ${prevWeek.loggedDays > 0 ? `<span class="wnr-wow-delta ${thisWeek.loggedDays >= prevWeek.loggedDays ? 'wnr-up' : 'wnr-down'}">${thisWeek.loggedDays >= prevWeek.loggedDays ? '↑' : '↓'} ${thisWeek.loggedDays - prevWeek.loggedDays > 0 ? '+' : ''}${thisWeek.loggedDays - prevWeek.loggedDays} days</span>` : '<span class="wnr-wow-delta wnr-neutral">—</span>'}
      </div>
    </div>
    <div class="wnr-targets-row">
      <span>Targets: <strong>${kcalTarget} kcal</strong> · <strong>${proteinTarget}g protein</strong> · TDEE ${tdee} kcal</span>
    </div>`;
}
window.renderWeeklyNutritionReport = renderWeeklyNutritionReport;

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME LANDMARKS  (MEV / MRV per muscle · Israetel model · P1 · v180)
// ─────────────────────────────────────────────────────────────────────────────
function renderVolumeLandmarks() {
  const el = document.getElementById('volume-landmarks-body');
  if (!el) return;

  // ── Israetel MEV/MRV landmarks (sets/week) ────────────────────────────────
  const LANDMARKS = [
    { muscle: 'Chest',      mev: 8,  mrv: 20 },
    { muscle: 'Back',       mev: 10, mrv: 25 },
    { muscle: 'Shoulders',  mev: 8,  mrv: 20 },
    { muscle: 'Biceps',     mev: 6,  mrv: 20 },
    { muscle: 'Triceps',    mev: 6,  mrv: 18 },
    { muscle: 'Legs',       mev: 8,  mrv: 20 },
    { muscle: 'Glutes',     mev: 4,  mrv: 16 },
    { muscle: 'Core',       mev: 0,  mrv: 16 },
  ];

  // ── Count working sets per muscle in last 7 days ──────────────────────────
  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  const allW = (typeof workouts !== 'undefined' ? workouts : null) || _lsGet('forge_workouts', []);
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const setsPerMuscle = {};
  allW.forEach(w => {
    if (!w.date || w.date < cutoff) return;
    const m = (w.muscle || '').trim();
    if (!m) return;
    const workingSets = Array.isArray(w.sets)
      ? w.sets.filter(s => s.type !== 'warmup').length
      : 0;
    setsPerMuscle[m] = (setsPerMuscle[m] || 0) + workingSets;
  });

  // ── Status helpers ────────────────────────────────────────────────────────
  function _status(sets, mev, mrv) {
    if (sets === 0) return 'vl-zero';
    if (mev === 0) return sets <= mrv ? 'vl-ok' : 'vl-over';  // Core: no MEV floor
    if (sets < mev) return 'vl-low';
    if (sets >= mrv) return 'vl-over';
    if (sets >= mrv * 0.85) return 'vl-warn';
    return 'vl-ok';
  }
  function _statusLabel(status) {
    return { 'vl-zero': 'No sets', 'vl-low': 'Below MEV', 'vl-ok': 'Effective', 'vl-warn': 'Near MRV', 'vl-over': 'Above MRV' }[status] || '';
  }

  // ── Bar position: map sets onto 0→MRV scale ───────────────────────────────
  function _barPct(sets, mrv) {
    return Math.min(100, Math.round((sets / Math.max(mrv, 1)) * 100));
  }
  function _mevPct(mev, mrv) {
    return Math.round((mev / Math.max(mrv, 1)) * 100);
  }

  const rows = LANDMARKS.map(({ muscle, mev, mrv }) => {
    const sets   = setsPerMuscle[muscle] || 0;
    const status = _status(sets, mev, mrv);
    const label  = _statusLabel(status);
    const barPct = _barPct(sets, mrv);
    const mevPct = _mevPct(mev, mrv);

    return `
      <div class="vl-row">
        <div class="vl-header-row">
          <span class="vl-muscle">${muscle}</span>
          <span class="vl-sets-count ${status}">${sets} <span class="vl-sets-unit">sets</span></span>
          <span class="vl-badge ${status}">${label}</span>
        </div>
        <div class="vl-bar-track">
          ${mev > 0 ? `<div class="vl-mev-line" style="left:${mevPct}%" title="MEV: ${mev} sets"></div>` : ''}
          <div class="vl-bar-fill ${status}" style="width:${barPct}%"></div>
        </div>
        <div class="vl-range-labels">
          <span>0</span>
          ${mev > 0 ? `<span class="vl-mev-label" style="left:${mevPct}%">MEV ${mev}</span>` : ''}
          <span>MRV ${mrv}</span>
        </div>
      </div>`;
  });

  const totalLogged = Object.keys(setsPerMuscle).length;
  const lowMuscles  = LANDMARKS.filter(({ muscle, mev }) => mev > 0 && (setsPerMuscle[muscle] || 0) < mev).map(l => l.muscle);
  const overMuscles = LANDMARKS.filter(({ muscle, mrv }) => (setsPerMuscle[muscle] || 0) >= mrv).map(l => l.muscle);

  const summaryHtml = (lowMuscles.length || overMuscles.length) ? `
    <div class="vl-summary">
      ${lowMuscles.length ? `<div class="vl-summary-item vl-low">⬇ Under-stimulated: <strong>${lowMuscles.join(', ')}</strong></div>` : ''}
      ${overMuscles.length ? `<div class="vl-summary-item vl-over">⬆ Overreach risk: <strong>${overMuscles.join(', ')}</strong></div>` : ''}
    </div>` : '';

  el.innerHTML = `
    <div class="vl-legend">
      <span class="vl-dot vl-low"></span>Below MEV
      <span class="vl-dot vl-ok"></span>Effective
      <span class="vl-dot vl-warn"></span>Near MRV
      <span class="vl-dot vl-over"></span>Above MRV
    </div>
    ${summaryHtml}
    <div class="vl-list">${rows.join('')}</div>
    <div class="vl-footnote">MEV = Minimum Effective Volume · MRV = Maximum Recoverable Volume · Israetel model</div>`;
}
window.renderVolumeLandmarks = renderVolumeLandmarks;

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY REVIEW CARD  (leading KPI hit rates · win/fix · weight projection · P1 · v181)
// ─────────────────────────────────────────────────────────────────────────────
function renderWeeklyReviewCard() {
  const el = document.getElementById('weekly-review-body');
  if (!el) return;

  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  const _meals    = (typeof mealsLog   !== 'undefined' ? mealsLog   : null) || _lsGet('forge_meals',      {});
  const _workouts = (typeof workouts   !== 'undefined' ? workouts   : null) || _lsGet('forge_workouts',   []);
  const _settings = (typeof settings   !== 'undefined' ? settings   : null) || _lsGet('forge_settings',   {});
  const _up       = (typeof userProfile!== 'undefined' ? userProfile: null) || _lsGet('forge_profile',    {});
  const _bw       = (typeof bodyWeight !== 'undefined' ? bodyWeight : null) || _lsGet('forge_bodyweight', []);

  function _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function _daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

  // Build 7-day nutrition window starting `startDaysAgo` days ago
  function _nutritionWindow(startDaysAgo) {
    const days = [];
    for (let i = startDaysAgo + 6; i >= startDaysAgo; i--) {
      const dk      = _dateKey(_daysAgo(i));
      const dayMeals = Array.isArray(_meals?.[dk]) ? _meals[dk] : [];
      const kcal    = dayMeals.reduce((s, m) => s + (parseFloat(m.kcal)    || 0), 0);
      const prot    = dayMeals.reduce((s, m) => s + (parseFloat(m.protein || m.p) || 0), 0);
      days.push({ dk, kcal, prot, logged: dayMeals.length > 0 });
    }
    return days;
  }

  // Count unique training days in a 7-day window
  function _trainingDays(startDaysAgo) {
    const fromKey = _dateKey(_daysAgo(startDaysAgo + 7));
    const toKey   = _dateKey(_daysAgo(startDaysAgo));
    return new Set(
      _workouts.filter(w => w.date > fromKey && w.date <= toKey).map(w => w.date)
    ).size;
  }

  // Compute BMR/TDEE the same way the nutrition coach does
  function _calcTDEE() {
    const p = _up;
    const wt = parseFloat(p.weight || 75);
    const ht = parseFloat(p.height || 175);
    const ag = parseFloat(p.age    || 25);
    const sx = (p.sex || 'male') === 'female';
    const bmr = sx ? (10*wt + 6.25*ht - 5*ag - 161) : (10*wt + 6.25*ht - 5*ag + 5);
    const afMap = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 };
    const af = afMap[p.activity || _settings.activityLevel] || 1.55;
    return Math.round(bmr * af);
  }

  const tdee = _calcTDEE();
  const goalType = _up.goal || _settings.goal || 'muscle';
  const goalCalAdjust = { fat_loss: -400, muscle: +200, recomp: 0, maintenance: 0 };
  const kcalTarget = Math.round(tdee + (goalCalAdjust[goalType] || 0));
  const protTarget = Math.round(parseFloat(_up.weight || 75) * 1.8);

  const thisWeek = _nutritionWindow(0);
  const prevWeek = _nutritionWindow(7);

  // Protein hit rate: days logged with prot ≥ 90% of target
  function _protHit(days) {
    const logged = days.filter(d => d.logged);
    if (!logged.length) return null;
    return Math.round((logged.filter(d => d.prot >= protTarget * 0.9).length / logged.length) * 100);
  }

  // Calorie hit rate: days within ±15% of target (only logged days)
  function _calHit(days) {
    const logged = days.filter(d => d.logged);
    if (!logged.length) return null;
    return Math.round((logged.filter(d => Math.abs(d.kcal - kcalTarget) / Math.max(kcalTarget, 1) <= 0.15).length / logged.length) * 100);
  }

  function _delta(a, b) {
    if (a === null || b === null) return null;
    return a - b;
  }
  function _arrow(delta) {
    if (delta === null) return '';
    if (delta > 0)  return '<span class="wrc-arrow wrc-up">▲</span>';
    if (delta < 0)  return '<span class="wrc-arrow wrc-down">▼</span>';
    return '<span class="wrc-arrow wrc-flat">—</span>';
  }
  function _pct(v) { return v === null ? '—' : `${v}%`; }

  const protThis  = _protHit(thisWeek),  protPrev  = _protHit(prevWeek);
  const calThis   = _calHit(thisWeek),   calPrev   = _calHit(prevWeek);
  const trainThis = _trainingDays(0),    trainPrev = _trainingDays(7);

  const kpis = [
    { label: 'Protein Target',  thisNum: protThis,  prevNum: protPrev,  thisStr: _pct(protThis),  prevStr: _pct(protPrev)  },
    { label: 'Calorie Target',  thisNum: calThis,   prevNum: calPrev,   thisStr: _pct(calThis),   prevStr: _pct(calPrev)   },
    { label: 'Training Days',   thisNum: trainThis, prevNum: trainPrev, thisStr: `${trainThis}d`, prevStr: `${trainPrev}d` },
  ];

  const kpiRows = kpis.map(k => {
    const d = _delta(k.thisNum, k.prevNum);
    return `
      <div class="wrc-kpi-row">
        <span class="wrc-kpi-label">${k.label}</span>
        <span class="wrc-kpi-this">${k.thisStr}</span>
        ${_arrow(d)}
        <span class="wrc-kpi-prev">${k.prevStr}</span>
      </div>`;
  }).join('');

  // ── Win & Fix ──────────────────────────────────────────────────────────────
  const scored = kpis.filter(k => k.thisNum !== null);
  let winHtml = '', fixHtml = '';
  if (scored.length) {
    const byThis = [...scored].sort((a, b) => b.thisNum - a.thisNum);
    const win = byThis[0];
    const fix = byThis[byThis.length - 1];
    const fixSuggestions = {
      'Protein Target': 'Prep a high-protein snack (cottage cheese, Greek yoghurt, or a shake) for the gap between meals.',
      'Calorie Target': 'Log meals before eating — pre-logging keeps you within target more consistently.',
      'Training Days':  'Schedule your next session now and set a phone reminder 30 min before.',
    };
    if (win.thisNum !== null) winHtml = `<div class="wrc-win"><span class="wrc-win-label">WIN</span><span class="wrc-win-text">${win.label} at <strong>${win.thisStr}</strong>${win.thisNum >= 80 ? ' — excellent!' : ' — solid effort.'}</span></div>`;
    if (fix.thisNum !== null && fix.thisNum < 70) fixHtml = `<div class="wrc-fix"><span class="wrc-fix-label">FIX</span><span class="wrc-fix-text">${fixSuggestions[fix.label] || `Focus on ${fix.label} next week.`}</span></div>`;
  }

  // ── Weight projection ──────────────────────────────────────────────────────
  let projHtml = '';
  const goalWeight = parseFloat(_up.targetWeight || _settings.targetWeight || 0);
  if (goalWeight > 0 && Array.isArray(_bw) && _bw.length >= 2) {
    const cutoff = _dateKey(_daysAgo(14));
    const recent = [..._bw].filter(e => (e.date || e.d || '') >= cutoff)
                           .sort((a, b) => (a.date || a.d || '') < (b.date || b.d || '') ? -1 : 1);
    if (recent.length >= 2) {
      const wFirst  = parseFloat(recent[0].weight || recent[0].w || 0);
      const wLast   = parseFloat(recent[recent.length - 1].weight || recent[recent.length - 1].w || 0);
      const spanDays = Math.max(1, recent.length - 1);
      const changePerWeek = ((wLast - wFirst) / spanDays) * 7;
      const delta = goalWeight - wLast;
      const unit  = _up.weightUnit || _settings.weightUnit || 'kg';
      // "Goal reached" only when current weight is actually at the goal (±0.5)
      const isAtGoal = Math.abs(wLast - goalWeight) <= 0.5;
      if (isAtGoal) {
        projHtml = `<div class="wrc-projection wrc-proj-done"><div class="wrc-proj-icon">🏆</div><div class="wrc-proj-text"><strong>Goal weight reached!</strong> Set a new target to keep progressing.</div></div>`;
      } else if (Math.abs(changePerWeek) >= 0.05) {
        // weeks > 0 means trending toward goal; weeks < 0 means trending away
        const weeks = delta / changePerWeek;
        if (weeks > 0 && weeks < 200) {
          projHtml = `
            <div class="wrc-projection">
              <div class="wrc-proj-icon">📈</div>
              <div class="wrc-proj-text">At current pace, goal weight in <strong>${Math.round(weeks)} weeks</strong></div>
              <div class="wrc-proj-detail">${wLast.toFixed(1)}${unit} → ${goalWeight}${unit} · ${changePerWeek > 0 ? '+' : ''}${changePerWeek.toFixed(2)}${unit}/wk</div>
            </div>`;
        } else {
          // Moving away from goal
          const dir = delta > 0 ? 'losing' : 'gaining';
          projHtml = `<div class="wrc-projection wrc-proj-flat"><div class="wrc-proj-icon">⚠️</div><div class="wrc-proj-text">Trending away from goal — currently ${dir} instead of ${delta > 0 ? 'gaining' : 'losing'}. Adjust intake.</div></div>`;
        }
      } else {
        projHtml = `<div class="wrc-projection wrc-proj-flat"><div class="wrc-proj-icon">⚖️</div><div class="wrc-proj-text">Weight stable — adjust intake to make progress toward <strong>${goalWeight}${unit}</strong></div></div>`;
      }
    }
  }

  // ── Date header ────────────────────────────────────────────────────────────
  const weekStart = _dateKey(_daysAgo(6));
  const weekEnd   = _dateKey(new Date());
  const badge = document.getElementById('weekly-review-badge');
  if (badge) badge.textContent = `${weekStart.slice(5)} → ${weekEnd.slice(5)}`;

  const hasData = scored.length > 0;
  el.innerHTML = hasData ? `
    <div class="wrc-wrap">
      <div class="wrc-kpi-header">
        <span></span><span class="wrc-col-label">This week</span>
        <span></span><span class="wrc-col-label">Last week</span>
      </div>
      ${kpiRows}
      <div class="wrc-divider"></div>
      ${winHtml}
      ${fixHtml}
      ${projHtml}
    </div>` : `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No data yet</div><div class="empty-sub">Log meals and workouts to see your weekly review.</div></div>`;
}
window.renderWeeklyReviewCard = renderWeeklyReviewCard;

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE TDEE REFINEMENT  (data-driven TDEE estimate · P1 · v182)
// ─────────────────────────────────────────────────────────────────────────────
function renderAdaptiveTDEE() {
  const el = document.getElementById('adaptive-tdee-body');
  if (!el) return;

  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  function _lsSave(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_e) {}
  }
  const _meals = (typeof mealsLog    !== 'undefined' ? mealsLog    : null) || _lsGet('forge_meals',      {});
  const _bw    = (typeof bodyWeight  !== 'undefined' ? bodyWeight  : null) || _lsGet('forge_bodyweight', []);
  const _up    = (typeof userProfile !== 'undefined' ? userProfile : null) || _lsGet('forge_profile',    {});
  const _sets  = (typeof settings    !== 'undefined' ? settings    : null) || _lsGet('forge_settings',   {});

  function _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function _daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

  // ── Formula TDEE ───────────────────────────────────────────────────────────
  function _formulaTDEE() {
    const p  = _up;
    const wt = parseFloat(p.weight || 75);
    const ht = parseFloat(p.height || 175);
    const ag = parseFloat(p.age    || 25);
    const sx = (p.sex || 'male') === 'female';
    const bmr = sx ? (10*wt + 6.25*ht - 5*ag - 161) : (10*wt + 6.25*ht - 5*ag + 5);
    const afMap = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 };
    const af = afMap[p.activity || _sets.activityLevel] || 1.55;
    return Math.round(bmr * af);
  }

  const formulaTDEE = _formulaTDEE();

  // ── Collect 28-day meal data ───────────────────────────────────────────────
  const WINDOW = 28;
  let totalKcal = 0, loggedDays = 0;
  for (let i = 0; i < WINDOW; i++) {
    const dk       = _dateKey(_daysAgo(i));
    const dayMeals = Array.isArray(_meals?.[dk]) ? _meals[dk] : [];
    if (dayMeals.length) {
      totalKcal += dayMeals.reduce((s, m) => s + (parseFloat(m.kcal) || 0), 0);
      loggedDays++;
    }
  }

  // Need at least 14 logged days for a useful estimate
  const MIN_DAYS = 14;
  if (loggedDays < MIN_DAYS) {
    const badge = document.getElementById('adaptive-tdee-badge');
    if (badge) badge.textContent = `${loggedDays}/28 DAYS`;
    el.innerHTML = `
      <div class="atdee-insufficient">
        <div class="atdee-progress-wrap">
          <div class="atdee-progress-bar" style="width:${Math.round(loggedDays/WINDOW*100)}%"></div>
        </div>
        <div class="atdee-progress-label">${loggedDays} / ${WINDOW} days logged</div>
        <div class="atdee-note">Log at least ${MIN_DAYS} days of meals to unlock your data-driven TDEE estimate.</div>
      </div>`;
    return;
  }

  const avgDailyKcal = Math.round(totalKcal / loggedDays);

  // ── 28-day weight change ───────────────────────────────────────────────────
  const cutoff28 = _dateKey(_daysAgo(WINDOW));
  const today    = _dateKey(new Date());
  const wEntries = [...(_bw || [])]
    .filter(e => (e.date || e.d || '') >= cutoff28 && (e.date || e.d || '') <= today)
    .sort((a, b) => (a.date || a.d || '') < (b.date || b.d || '') ? -1 : 1);

  let estimatedTDEE = null;
  let weightDelta   = null;
  let weightUnit    = _up.weightUnit || _sets.weightUnit || 'kg';
  let wSpanDays     = 0;

  if (wEntries.length >= 2) {
    const wFirst  = parseFloat(wEntries[0].weight || wEntries[0].w || 0);
    const wLast   = parseFloat(wEntries[wEntries.length - 1].weight || wEntries[wEntries.length - 1].w || 0);
    wSpanDays     = Math.max(1, wEntries.length - 1);
    const changePerDay = (wLast - wFirst) / wSpanDays;  // kg/day (or lbs/day)

    // Convert to kcal/day impact (7700 kcal ≈ 1 kg; 3500 kcal ≈ 1 lb)
    const kcalPerUnit = (weightUnit === 'lbs') ? 3500 : 7700;
    const kcalPerDay  = changePerDay * kcalPerUnit;

    estimatedTDEE = Math.round(avgDailyKcal - kcalPerDay);
    weightDelta   = Math.round((wLast - wFirst) * 10) / 10;
  }

  // ── Accuracy indicator ─────────────────────────────────────────────────────
  const confidence = loggedDays >= 21 ? 'High' : loggedDays >= 14 ? 'Moderate' : 'Low';
  const confClass  = loggedDays >= 21 ? 'atdee-high' : loggedDays >= 14 ? 'atdee-mod' : 'atdee-low';

  // ── Delta vs formula ───────────────────────────────────────────────────────
  let deltaHtml = '';
  let applyBtnHtml = '';
  if (estimatedTDEE !== null) {
    const diff = estimatedTDEE - formulaTDEE;
    const sign = diff > 0 ? '+' : '';
    const diffClass = Math.abs(diff) > 200 ? 'atdee-diff-large' : Math.abs(diff) > 100 ? 'atdee-diff-mid' : 'atdee-diff-small';
    deltaHtml = `
      <div class="atdee-compare">
        <div class="atdee-compare-row">
          <span class="atdee-compare-label">Data-driven estimate</span>
          <span class="atdee-compare-val atdee-accent">${estimatedTDEE} kcal</span>
        </div>
        <div class="atdee-compare-row">
          <span class="atdee-compare-label">Formula (Mifflin-St Jeor)</span>
          <span class="atdee-compare-val">${formulaTDEE} kcal</span>
        </div>
        <div class="atdee-diff-row ${diffClass}">
          Difference: <strong>${sign}${diff} kcal/day</strong>
          ${Math.abs(diff) > 100 ? ' — your metabolism differs from the formula' : ' — formula is accurate for you'}
        </div>
      </div>`;

    // Only offer update button if difference is meaningful (>100 kcal)
    if (Math.abs(diff) > 100) {
      const goalType   = _up.goal || _sets.goal || 'muscle';
      const calAdj     = { fat_loss: -400, muscle: +200, recomp: 0, maintenance: 0 };
      const newTarget  = estimatedTDEE + (calAdj[goalType] || 0);
      applyBtnHtml = `
        <button class="atdee-apply-btn" onclick="window._applyAdaptiveTDEE(${estimatedTDEE}, ${newTarget})">
          Apply: set calorie target to ${newTarget} kcal
        </button>`;
    }
  }

  // ── Weight context ─────────────────────────────────────────────────────────
  let weightHtml = '';
  if (wEntries.length >= 2 && weightDelta !== null) {
    const sign = weightDelta > 0 ? '+' : '';
    weightHtml = `<div class="atdee-weight-ctx">Weight change over ${wSpanDays} days: <strong>${sign}${weightDelta} ${weightUnit}</strong></div>`;
  } else {
    weightHtml = `<div class="atdee-weight-ctx atdee-no-bw">Add body weight logs to improve the estimate accuracy.</div>`;
  }

  const badge = document.getElementById('adaptive-tdee-badge');
  if (badge) badge.textContent = `${loggedDays} DAYS`;

  el.innerHTML = `
    <div class="atdee-wrap">
      <div class="atdee-headline">
        <span class="atdee-headline-label">Avg daily intake (${loggedDays} logged days)</span>
        <span class="atdee-headline-val">${avgDailyKcal} kcal</span>
      </div>
      ${weightHtml}
      ${deltaHtml}
      <div class="atdee-confidence ${confClass}">Confidence: <strong>${confidence}</strong> · ${loggedDays}/${WINDOW} days logged</div>
      ${applyBtnHtml}
    </div>`;
}

// Apply adaptive TDEE — updates customNutritionTargets with new calorie target
window._applyAdaptiveTDEE = function(estimatedTDEE, newKcalTarget) {
  const _up = (typeof userProfile !== 'undefined' ? userProfile : null);
  if (!_up) { if (typeof showToast === 'function') showToast('Profile not loaded', 'error'); return; }

  const existing = _up.customNutritionTargets || {};
  const protTarget = Math.round(parseFloat(_up.weight || 75) * 1.8);
  _up.customNutritionTargets = {
    ...existing,
    enabled: true,
    kcal: newKcalTarget,
    p: existing.p > 0 ? existing.p : protTarget,
    c: existing.c || 0,
    f: existing.f || 0,
    updatedAt: Date.now(),
    tdeeEstimate: estimatedTDEE,
  };
  // Persist via saveProfile if available, else localStorage
  if (typeof saveProfile === 'function') {
    try { saveProfile(); } catch (_e) {}
  }
  try { localStorage.setItem('forge_profile', JSON.stringify(_up)); } catch (_e) {}
  if (typeof showToast === 'function') showToast(`Calorie target updated to ${newKcalTarget} kcal`, 'success');
  renderAdaptiveTDEE();
};
window.renderAdaptiveTDEE = renderAdaptiveTDEE;

// ─────────────────────────────────────────────────────────────────────────────
// DAILY NON-NEGOTIABLES  (5-habit checklist · streak shields · P2 · v185)
// ─────────────────────────────────────────────────────────────────────────────
function renderDailyNonNegotiables() {
  const el = document.getElementById('dnn-body');
  if (!el) return;

  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  function _lsSave(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_e) {}
  }

  const _meals  = (typeof mealsLog    !== 'undefined' ? mealsLog    : null) || _lsGet('forge_meals',      {});
  const _bw     = (typeof bodyWeight  !== 'undefined' ? bodyWeight  : null) || _lsGet('forge_bodyweight', []);
  const _wrk    = (typeof workouts    !== 'undefined' ? workouts    : null) || _lsGet('forge_workouts',   []);
  const _up     = (typeof userProfile !== 'undefined' ? userProfile : null) || _lsGet('forge_profile',    {});
  const _sets   = (typeof settings    !== 'undefined' ? settings    : null) || _lsGet('forge_settings',   {});
  const _dnn    = _lsGet('forge_dnn', {});

  const today    = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const todayDNN = _dnn[todayKey] || {};

  // ── Weekend mode: Sat(6) or Sun(0) — gym session is optional ─────────────
  const isWeekend = [0, 6].includes(today.getDay());

  // ── Auto-detect habits ────────────────────────────────────────────────────
  const weightLogged = Array.isArray(_bw) && _bw.some(e => (e.date || e.d || '') === todayKey);

  const protTarget = Math.round(parseFloat(_up.weight || 75) * 1.8);
  const todayMeals = Array.isArray(_meals?.[todayKey]) ? _meals[todayKey] : [];
  const todayProt  = todayMeals.reduce((s, m) => s + (parseFloat(m.protein || m.p) || 0), 0);
  const proteinHit = protTarget > 0 && todayProt >= protTarget * 0.9;

  const sessionDone = Array.isArray(_wrk) && _wrk.some(w => w.date === todayKey);
  const sleepDone   = !!todayDNN.sleep;
  const stepsDone   = !!todayDNN.steps;

  const habits = [
    { id: 'weight', icon: '⚖️', label: 'Log weight',  done: weightLogged, auto: true,  required: true   },
    { id: 'protein',icon: '🥩', label: 'Hit protein', done: proteinHit,   auto: true,  required: true   },
    { id: 'session',icon: '💪', label: 'Train today', done: sessionDone,  auto: true,  required: !isWeekend },
    { id: 'sleep',  icon: '😴', label: '7h+ sleep',   done: sleepDone,    auto: false, required: true   },
    { id: 'steps',  icon: '👟', label: '8k+ steps',   done: stepsDone,    auto: false, required: true   },
  ];

  const required  = habits.filter(h => h.required);
  const doneCount = required.filter(h => h.done).length;
  const total     = required.length;
  const isPerfect = doneCount === total;

  // ── Perfect day: persist and toast ────────────────────────────────────────
  if (isPerfect && !todayDNN.perfectDay) {
    todayDNN.perfectDay = true;
    _dnn[todayKey] = todayDNN;
    _lsSave('forge_dnn', _dnn);
    if (typeof showToast === 'function') {
      const msg = isWeekend ? '🔥 Perfect weekend day! All non-negotiables hit!' : '🔥 Perfect day! All 5 Non-Negotiables hit!';
      setTimeout(() => showToast(msg, 'success'), 300);
    }
  }

  // ── Streak: consecutive perfect/shielded days ─────────────────────────────
  let streak = 0;
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (_dnn[dk]?.perfectDay) { streak++; } else { break; }
  }
  if (isPerfect) streak++;

  // ── Shields: earn 1 per 5 perfect days (max 3) ───────────────────────────
  let shields = Math.min(3, Math.max(0, parseInt(_dnn._shields || 0, 10)));
  const lastMilestone = parseInt(_dnn._shieldMilestone || 0, 10);
  const currentMilestone = Math.floor(streak / 5);
  if (currentMilestone > lastMilestone && shields < 3) {
    const earned = Math.min(3 - shields, currentMilestone - lastMilestone);
    shields = Math.min(3, shields + earned);
    _dnn._shields = shields;
    _dnn._shieldMilestone = currentMilestone;
    _lsSave('forge_dnn', _dnn);
    if (earned > 0 && typeof showToast === 'function') {
      setTimeout(() => showToast(`🛡️ Shield earned! ${shields} shield${shields !== 1 ? 's' : ''} available`, 'success'), 800);
    }
  }

  // ── Shield offer: yesterday was missed, shields available ─────────────────
  const yd = new Date(today); yd.setDate(yd.getDate() - 1);
  const ydKey = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
  const canUseShield = shields > 0 && !(_dnn[ydKey]?.perfectDay) && !(_dnn[ydKey]?.shielded);

  // ── Render ─────────────────────────────────────────────────────────────────
  const pillsHtml = habits.map(h => {
    const isOptional = !h.required;
    return `
      <div class="dnn-pill ${h.done ? 'dnn-done' : 'dnn-open'}${h.auto ? ' dnn-auto' : ''}${isOptional ? ' dnn-optional' : ''}"
           ${!h.auto ? `onclick="window._dnnToggle('${h.id}')"` : ''}
           title="${isOptional ? 'Weekend — optional' : h.auto ? 'Auto-tracked' : 'Tap to mark complete'}">
        <span class="dnn-pill-icon">${h.icon}</span>
        <span class="dnn-pill-label">${h.label}${isOptional ? '<br><span class="dnn-opt-tag">optional</span>' : ''}</span>
        <span class="dnn-pill-check">${h.done ? '✓' : ''}</span>
      </div>`;
  }).join('');

  const streakHtml = streak > 0
    ? `<div class="dnn-streak"><span class="dnn-streak-fire">🔥</span><span class="dnn-streak-val">${streak}</span><span class="dnn-streak-label">day streak</span></div>`
    : '';

  const shieldRow = `<div class="dnn-shield-row">${[0,1,2].map(i => `<span class="dnn-shield-icon ${i < shields ? 'dnn-shield-active' : 'dnn-shield-empty'}">🛡️</span>`).join('')}<span class="dnn-shield-label">${shields} shield${shields !== 1 ? 's' : ''}</span></div>`;

  const shieldOfferHtml = canUseShield
    ? `<button class="dnn-shield-btn" onclick="window._dnnUseShield()">🛡️ Use shield — protect yesterday's streak</button>`
    : '';

  const weekendBadge = isWeekend ? '<span class="dnn-weekend-badge">🏖️ Weekend Mode</span>' : '';

  const progressPct  = Math.round(doneCount / total * 100);
  const progressClass = isPerfect ? 'dnn-prog-perfect' : doneCount >= Math.ceil(total * 0.6) ? 'dnn-prog-good' : 'dnn-prog-low';

  const badge = document.getElementById('dnn-badge');
  if (badge) badge.textContent = `${doneCount}/${total} TODAY`;

  el.innerHTML = `
    <div class="dnn-wrap">
      <div class="dnn-progress-row">
        <div class="dnn-progress-track">
          <div class="dnn-progress-fill ${progressClass}" style="width:${progressPct}%"></div>
        </div>
        <span class="dnn-progress-label">${doneCount}/${total} ${isPerfect ? '🔥' : ''}</span>
        ${streakHtml}
      </div>
      ${weekendBadge}
      <div class="dnn-grid">${pillsHtml}</div>
      ${shieldRow}
      ${shieldOfferHtml}
      ${!habits[3].done || !habits[4].done ? `<div class="dnn-tap-hint">Tap 😴 / 👟 to mark when done</div>` : ''}
    </div>`;
}

// Toggle a manual DNN habit (sleep / steps)
window._dnnToggle = function(habitId) {
  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  function _lsSave(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_e) {}
  }
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const _dnn = _lsGet('forge_dnn', {});
  const todayDNN = _dnn[todayKey] || {};
  todayDNN[habitId] = !todayDNN[habitId];
  _dnn[todayKey] = todayDNN;
  _lsSave('forge_dnn', _dnn);
  renderDailyNonNegotiables();
};

// Use a streak shield to protect yesterday
window._dnnUseShield = function() {
  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  function _lsSave(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_e) {}
  }
  const _dnn = _lsGet('forge_dnn', {});
  const shields = Math.max(0, parseInt(_dnn._shields || 0, 10));
  if (shields <= 0) return;
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const ydKey = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
  _dnn[ydKey] = _dnn[ydKey] || {};
  _dnn[ydKey].shielded  = true;
  _dnn[ydKey].perfectDay = true;  // shield marks day as perfect for streak continuity
  _dnn._shields = shields - 1;
  _lsSave('forge_dnn', _dnn);
  if (typeof showToast === 'function') showToast(`🛡️ Shield used! Streak protected. ${shields - 1} shield${shields - 1 !== 1 ? 's' : ''} remaining`, 'success');
  renderDailyNonNegotiables();
};
window.renderDailyNonNegotiables = renderDailyNonNegotiables;

// ─────────────────────────────────────────────────────────────────────────────
// MACRO TIMING INTELLIGENCE  (morning protein · pre-WO carbs · post-WO protein · P2 · v184)
// ─────────────────────────────────────────────────────────────────────────────
function renderMacroTiming() {
  const el = document.getElementById('macro-timing-body');
  if (!el) return;

  function _lsGet(key, fb) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (_e) { return fb; }
  }
  const _meals = (typeof mealsLog   !== 'undefined' ? mealsLog   : null) || _lsGet('forge_meals',    {});
  const _wrk   = (typeof workouts   !== 'undefined' ? workouts   : null) || _lsGet('forge_workouts', []);
  const _up    = (typeof userProfile!== 'undefined' ? userProfile: null) || _lsGet('forge_profile',  {});

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const todayMeals = (Array.isArray(_meals?.[todayKey]) ? _meals[todayKey] : [])
    .slice()
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));  // oldest first

  const sessionToday = Array.isArray(_wrk) && _wrk.some(w => w.date === todayKey);

  // ── 1. Morning protein: 30g+ in first meal ────────────────────────────────
  let morningProtStatus = 'pending';
  let morningProtDetail = 'First meal not logged yet';
  if (todayMeals.length > 0) {
    const firstMeal = todayMeals[0];
    const firstProt = parseFloat(firstMeal.protein || firstMeal.p || 0);
    const firstTime = firstMeal.ts ? new Date(firstMeal.ts) : null;
    const firstHour = firstTime ? firstTime.getHours() : null;
    // "Morning" = before noon; after noon it's still first-meal check
    if (firstProt >= 30) {
      morningProtStatus = 'hit';
      morningProtDetail = `${Math.round(firstProt)}g protein in first meal${firstHour !== null ? ` (${String(firstHour).padStart(2,'0')}:${String(firstTime.getMinutes()).padStart(2,'0')})` : ''}`;
    } else {
      morningProtStatus = 'miss';
      morningProtDetail = `First meal: ${Math.round(firstProt)}g protein — aim for 30g+`;
    }
  }

  // ── 2. Pre-workout carbs: 30g+ carbs on a training day ────────────────────
  let preWoStatus = 'na';
  let preWoDetail = 'No session logged today';
  if (sessionToday) {
    const totalCarbs = todayMeals.reduce((s, m) => s + (parseFloat(m.carbs || m.c || 0)), 0);
    if (todayMeals.length === 0) {
      preWoStatus = 'pending';
      preWoDetail = 'Log meals to track pre-session carbs';
    } else if (totalCarbs >= 30) {
      preWoStatus = 'hit';
      preWoDetail = `${Math.round(totalCarbs)}g carbs logged today`;
    } else {
      preWoStatus = 'miss';
      preWoDetail = `Only ${Math.round(totalCarbs)}g carbs — aim for 30g+ before training`;
    }
  }

  // ── 3. Post-workout protein: 20g+ protein meal logged on training day ─────
  let postWoStatus = 'na';
  let postWoDetail = 'No session logged today';
  if (sessionToday) {
    const postMeal = todayMeals.find(m => parseFloat(m.protein || m.p || 0) >= 20);
    if (todayMeals.length === 0) {
      postWoStatus = 'pending';
      postWoDetail = 'Log a protein meal after your session';
    } else if (postMeal) {
      const prot = Math.round(parseFloat(postMeal.protein || postMeal.p || 0));
      postWoStatus = 'hit';
      postWoDetail = `${prot}g protein meal logged`;
    } else {
      const bestProt = Math.max(0, ...todayMeals.map(m => parseFloat(m.protein || m.p || 0)));
      postWoStatus = 'miss';
      postWoDetail = `Best meal: ${Math.round(bestProt)}g — aim for 20g+ post-session`;
    }
  }

  // ── 4. Calorie front-loading: 60%+ of daily kcal before 6pm ──────────────
  const hour = today.getHours();
  let frontloadStatus = 'na';
  let frontloadDetail = 'Early in the day';
  if (todayMeals.length > 0) {
    const totalKcal = todayMeals.reduce((s, m) => s + (parseFloat(m.kcal) || 0), 0);
    const earlyKcal = todayMeals
      .filter(m => m.ts && new Date(m.ts).getHours() < 18)
      .reduce((s, m) => s + (parseFloat(m.kcal) || 0), 0);
    if (hour >= 18) {
      const ratio = totalKcal > 0 ? earlyKcal / totalKcal : 0;
      if (ratio >= 0.6) {
        frontloadStatus = 'hit';
        frontloadDetail = `${Math.round(ratio * 100)}% of calories before 6pm`;
      } else {
        frontloadStatus = 'miss';
        frontloadDetail = `Only ${Math.round(ratio * 100)}% before 6pm — aim for 60%+`;
      }
    } else {
      frontloadStatus = 'pending';
      const pct = totalKcal > 0 ? Math.round(earlyKcal / totalKcal * 100) : 0;
      frontloadDetail = `${pct}% so far (evaluated after 6pm)`;
    }
  }

  // ── Render checks ─────────────────────────────────────────────────────────
  function _checkRow(icon, label, status, detail) {
    const cls = { hit: 'mti-hit', miss: 'mti-miss', pending: 'mti-pending', na: 'mti-na' }[status] || 'mti-na';
    const mark = status === 'hit' ? '✓' : status === 'miss' ? '✗' : status === 'pending' ? '◌' : '—';
    return `
      <div class="mti-row ${cls}">
        <span class="mti-check">${mark}</span>
        <span class="mti-icon">${icon}</span>
        <div class="mti-content">
          <span class="mti-label">${label}</span>
          <span class="mti-detail">${detail}</span>
        </div>
      </div>`;
  }

  const allHit = [morningProtStatus, preWoStatus, postWoStatus, frontloadStatus]
    .filter(s => s !== 'na').every(s => s === 'hit');

  el.innerHTML = `
    <div class="mti-wrap">
      ${_checkRow('☀️', 'Morning protein (30g+)', morningProtStatus, morningProtDetail)}
      ${_checkRow('🏋️', 'Pre-session carbs (30g+)', preWoStatus, preWoDetail)}
      ${_checkRow('🥛', 'Post-session protein (20g+)', postWoStatus, postWoDetail)}
      ${_checkRow('⏰', 'Front-load calories (60% before 6pm)', frontloadStatus, frontloadDetail)}
      ${allHit ? '<div class="mti-perfect">⚡ Macro timing optimized today!</div>' : ''}
      <div class="mti-footnote">Based on today\'s logged meals${sessionToday ? ' · session detected' : ''}</div>
    </div>`;
}
window.renderMacroTiming = renderMacroTiming;


