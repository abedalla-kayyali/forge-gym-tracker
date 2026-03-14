function renderMuscleBalance(arr) {
  if (!arr) arr = workouts;
  const wrap = document.getElementById('muscle-balance-body');
  const badge = document.getElementById('balance-overall-badge');
  if (!wrap) return;

  const ALL = FORGE_BALANCE_ALL;
  const PAIRS = FORGE_BALANCE_PAIRS;
  const MUSCLE_COLORS = FORGE_BALANCE_COLORS;
  const base = _forgeBalanceBase(arr);
  const counts = base.counts;
  const vols = base.vols;
  const scores = base.scores;
  const trained = base.trained;
  const overallScore = base.overallScore;

  const total = arr.length;
  if (!total) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">??</div><div class="empty-title">${t('balance.empty')}</div></div>`;
    if (badge) badge.textContent = '--';
    return;
  }

  // ?? Insights ??
  const _isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const weakMuscles = ALL.filter(m => scores[m] < 35).sort((a,b) => scores[a]-scores[b]).slice(0,3);
  const pairAlertsInsight = PAIRS.map(([a,b]) => {
    const diff = Math.abs(scores[a]-scores[b]);
    if (diff < 30) return null;
    const stronger = scores[a] > scores[b] ? a : b;
    const weaker   = scores[a] > scores[b] ? b : a;
    return { stronger, weaker, diff };
  }).filter(Boolean);
  const insightsHtml = (weakMuscles.length || pairAlertsInsight.length) ? `
    <div class="mb-insights-bar">
      ${weakMuscles.length ? `<div class="mb-insight">
        <span class="mb-insight-icon">!</span>
        <span class="mb-insight-text">Needs more work: <strong>${weakMuscles.map(m => t('muscle.' + m)).join(' · ')}</strong></span>
      </div>` : ''}
      ${pairAlertsInsight.map(p => `<div class="mb-insight warn">
        <span class="mb-insight-icon">!!</span>
        <span class="mb-insight-text">${t('muscle.' + p.stronger)} overtrained vs ${t('muscle.' + p.weaker)} <strong>(${p.diff}pt gap)</strong></span>
      </div>`).join('')}
    </div>` : '';

  if (badge) {
    badge.textContent = overallScore + '/100';
    badge.style.background = overallScore >= 75 ? 'rgba(46,204,113,.2)' : overallScore >= 50 ? 'rgba(243,156,18,.2)' : 'rgba(231,76,60,.2)';
    badge.style.color = overallScore >= 75 ? 'var(--green)' : overallScore >= 50 ? 'var(--warn)' : '#e74c3c';
    badge.style.border = '1px solid ' + (overallScore >= 75 ? 'rgba(46,204,113,.3)' : overallScore >= 50 ? 'rgba(243,156,18,.3)' : 'rgba(231,76,60,.3)');
    badge.style.borderRadius = '6px';
    badge.style.padding = '2px 7px';
  }

  const msg = overallScore >= 80
    ? t('balance.msg.excellent')
    : overallScore >= 60
    ? t('balance.msg.good')
    : overallScore >= 40
    ? t('balance.msg.some')
    : t('balance.msg.focus');

  const r = 20, circ = 2 * Math.PI * r;
  const dash = (overallScore / 100) * circ;
  const ringColor = overallScore >= 75 ? '#2ecc71' : overallScore >= 50 ? '#f39c12' : '#e74c3c';

  const overallHtml = `
    <div class="mb-overall">
      <div class="mb-overall-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="5"/>
          <circle cx="26" cy="26" r="${r}" fill="none" stroke="${ringColor}" stroke-width="5"
            stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
            stroke-linecap="round" style="transition:stroke-dasharray .8s ease;filter:drop-shadow(0 0 4px ${ringColor})"/>
        </svg>
        <div class="mb-overall-ring-val" style="color:${ringColor}">${overallScore}</div>
      </div>
      <div class="mb-overall-text">
        <div class="mb-overall-label">${t('balance.score')}</div>
        <div class="mb-overall-msg">${msg}</div>
        <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--text3);margin-top:4px;">${trained.length}/${ALL.length} ${t('balance.trained')}</div>
      </div>
    </div>`;

  // Last hit date per muscle
  const lastHit = {};
  workouts.forEach(w => {
    if (!lastHit[w.muscle] || w.date > lastHit[w.muscle]) lastHit[w.muscle] = w.date;
  });
  function fmtLastHit(iso) {
    if (!iso) return null;
    const d = new Date(iso), now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7)  return diffDays + t('time.dAgo');
    if (diffDays < 30) return Math.floor(diffDays/7) + t('time.wAgo');
    const locale = currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return d.toLocaleDateString(locale, { day:'numeric', month:'short' });
  }

  // Max weight per muscle (normalised 0-100)
  const maxWeights = {};
  workouts.forEach(w => {
    const mw = Math.max(...(w.sets||[]).map(s => parseFloat(s.weight)||0));
    if (!maxWeights[w.muscle] || mw > maxWeights[w.muscle]) maxWeights[w.muscle] = mw;
  });
  const globalMaxW = Math.max(...ALL.map(m => maxWeights[m]||0), 1);
  const strengthScores = {};
  ALL.forEach(m => { strengthScores[m] = Math.round(((maxWeights[m]||0) / globalMaxW) * 100); });

  // ?? Radar chart ??
  const cx = 150, cy = 150, R = 108, n = ALL.length;
  const ptAt = (i, frac) => {
    const ang = (2 * Math.PI * i / n) - Math.PI / 2;
    return [cx + R * frac * Math.cos(ang), cy + R * frac * Math.sin(ang)];
  };
  const polyPts = (fracs) => fracs.map((f,i) => ptAt(i,f).join(',')).join(' ');

  // Grid rings with numeric labels
  const RING_VALS = [25, 50, 75, 100];
  const gridRings = RING_VALS.map((v,ri) => {
    const f = v / 100;
    const pts = ALL.map((_,i) => ptAt(i,f).join(',')).join(' ');
    // label at top axis (i=0)
    const [lx, ly] = ptAt(0, f);
    const isDashed = v < 100;
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,${ri===3?.12:.06})"
        stroke-width="${ri===3?1:.7}" ${isDashed?'stroke-dasharray="3,3"':''}/>
      <text x="${(lx+4).toFixed(1)}" y="${(ly-3).toFixed(1)}"
        font-family="'DM Mono',monospace" font-size="7" fill="rgba(255,255,255,.22)" text-anchor="start">${v}</text>`;
  }).join('');

  // Axis lines with tick marks
  const axisLines = ALL.map((_,i) => {
    const [x1,y1] = ptAt(i, 0);
    const [x2,y2] = ptAt(i, 1);
    return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="rgba(255,255,255,.1)" stroke-width=".8"/>`;
  }).join('');

  // Frequency polygon (green)
  const freqFracs = ALL.map(m => scores[m] / 100);
  const freqPoly  = polyPts(freqFracs);

  // Strength polygon (orange)
  const strFracs = ALL.map(m => strengthScores[m] / 100);
  const strPoly  = polyPts(strFracs);

  // Clickable muscle groups (freq dot + str dot + label + invisible hit target)
  const LABEL_PAD = 22;
  const muscleGroups = ALL.map((m, i) => {
    const ang = (2 * Math.PI * i / n) - Math.PI / 2;
    const col = MUSCLE_COLORS[m] || '#7f8c8d';
    const sc  = scores[m];
    const trained = sc > 0;
    const [fx, fy] = ptAt(i, freqFracs[i]);
    const fdot = freqFracs[i] > 0
      ? `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="3.5" fill="${col}" stroke="#0d1410" stroke-width="1.5" style="filter:drop-shadow(0 0 3px ${col})"/>`
      : '';
    const [sx, sy] = ptAt(i, strFracs[i]);
    const sdot = strFracs[i] > 0
      ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2.5" fill="#fb923c" stroke="#0d1410" stroke-width="1.5"/>`
      : '';
    const lx = cx + (R + LABEL_PAD) * Math.cos(ang);
    const ly = cy + (R + LABEL_PAD) * Math.sin(ang);
    const anchor = Math.abs(lx - cx) < 5 ? 'middle' : lx < cx ? 'end' : 'start';
    const mLabel = t('muscle.' + m);
    return `<g onclick="mbTap('${m}')" style="cursor:pointer">
      <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="22" fill="transparent"/>
      ${fdot}${sdot}
      <text x="${lx.toFixed(1)}" y="${(ly - 4).toFixed(1)}" text-anchor="${anchor}"
        font-family="'DM Mono',monospace" font-size="9.5" font-weight="700"
        fill="${trained ? col : 'rgba(255,255,255,.2)'}" letter-spacing=".8">${mLabel}</text>
      <text x="${lx.toFixed(1)}" y="${(ly + 7).toFixed(1)}" text-anchor="${anchor}"
        font-family="'DM Mono',monospace" font-size="8"
        fill="${trained ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.12)'}">${sc}</text>
    </g>`;
  }).join('');

  // Centre score
  const centreHtml = `
    <text x="${cx}" y="${cy - 6}" text-anchor="middle"
      font-family="'Bebas Neue',sans-serif" font-size="28" fill="rgba(255,255,255,.9)"
      style="filter:drop-shadow(0 0 8px rgba(46,204,113,.5))">${overallScore}</text>
    <text x="${cx}" y="${cy + 9}" text-anchor="middle"
      font-family="'DM Mono',monospace" font-size="7.5" fill="rgba(255,255,255,.3)" letter-spacing="1.5">${t('balance.center')}</text>`;

  const radarHtml = `
    <div class="mb-radar-wrap">
      <div class="mb-radar-legend">
        <span class="mb-legend-dot" style="background:#39ff8f;box-shadow:0 0 5px #39ff8f88"></span>
        <span class="mb-legend-lbl">${t('balance.frequency')}</span>
        <span class="mb-legend-dot" style="background:#fb923c;box-shadow:0 0 5px #fb923c88;margin-left:10px"></span>
        <span class="mb-legend-lbl">${t('balance.strength')}</span>
      </div>
      <svg viewBox="0 0 300 300" width="100%" style="max-width:340px;overflow:visible;display:block;margin:0 auto">
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(46,204,113,.04)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#radarBg)"/>
        ${gridRings}
        ${axisLines}
        <!-- Strength polygon -->
        <polygon points="${strPoly}"
          fill="rgba(251,146,60,.08)" stroke="#fb923c" stroke-width="1.5"
          stroke-linejoin="round" stroke-dasharray="4,3"
          style="filter:drop-shadow(0 0 3px rgba(251,146,60,.25))"/>
        <!-- Frequency polygon -->
        <polygon points="${freqPoly}"
          fill="rgba(57,255,143,.1)" stroke="#39ff8f" stroke-width="2"
          stroke-linejoin="round"
          style="filter:drop-shadow(0 0 5px rgba(57,255,143,.35))"/>
        ${muscleGroups}
        ${centreHtml}
      </svg>
    </div>`;

  // Build per-muscle detail stats
  const muscleSets = {}, muscleExCounts = {}, musclePR = {};
  workouts.forEach(w => {
    if (!muscleSets[w.muscle]) muscleSets[w.muscle] = 0;
    muscleSets[w.muscle] += (w.sets || []).length;
    if (!muscleExCounts[w.muscle]) muscleExCounts[w.muscle] = {};
    muscleExCounts[w.muscle][w.exercise] = (muscleExCounts[w.muscle][w.exercise] || 0) + 1;
    const mw = Math.max(...(w.sets||[]).map(s => parseFloat(s.weight)||0));
    if (!musclePR[w.muscle] || mw > musclePR[w.muscle].weight) {
      musclePR[w.muscle] = { weight: mw, unit: (w.sets||[])[0]?.unit || 'kg', exercise: w.exercise };
    }
  });

  const _cAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const _lbl = (en, ar) => _cAr ? ar : en;

  const cardsHtml = ALL.map(m => {
    const sc = scores[m];
    const col = MUSCLE_COLORS[m] || '#2ecc71';
    const freq = counts[m] || 0;
    const vol  = vols[m]   || 0;
    const grade = sc >= 80 ? 'S' : sc >= 60 ? 'A' : sc >= 40 ? 'B' : sc >= 20 ? 'C' : freq > 0 ? 'D' : '--';
    const gradeColor = sc >= 80 ? '#39ff8f' : sc >= 60 ? '#f39c12' : sc >= 40 ? '#60a5fa' : sc >= 20 ? '#e74c3c' : 'var(--text3)';
    const last = fmtLastHit(lastHit[m]);
    const lastHtml = last
      ? `<span class="mb-card-last" style="color:${col}aa">? ${last}</span>`
      : `<span class="mb-card-last" style="opacity:.3">${t('balance.notTrained')}</span>`;

    // Summary stats
    const totalSets = muscleSets[m] || 0;
    const volStr = vol >= 1000 ? (vol/1000).toFixed(1)+'t' : Math.round(vol)+'kg';
    const pr = musclePR[m];
    const prStr = pr && pr.weight > 0 ? `${pr.weight} ${pr.unit}` : '--';

    // Top exercise for this muscle
    let topEx = '--';
    if (muscleExCounts[m]) {
      const sorted = Object.entries(muscleExCounts[m]).sort((a,b) => b[1]-a[1]);
      if (sorted.length) topEx = sorted[0][0];
    }

    const summaryHtml = freq > 0 ? `
      <div class="mb-card-summary">
        <div class="mb-card-stat-row">
          <span class="mb-card-stat-lbl">${_lbl('Sessions','�������')}</span>
          <span class="mb-card-stat-val accent">${freq}</span>
        </div>
        <div class="mb-card-stat-row">
          <span class="mb-card-stat-lbl">${_lbl('Total Sets','������ ���������')}</span>
          <span class="mb-card-stat-val">${totalSets}</span>
        </div>
        <div class="mb-card-stat-row">
          <span class="mb-card-stat-lbl">${_lbl('Volume','�����')}</span>
          <span class="mb-card-stat-val">${volStr}</span>
        </div>
        <div class="mb-card-stat-row">
          <span class="mb-card-stat-lbl">${_lbl('Best Weight','���� ���')}</span>
          <span class="mb-card-stat-val accent">${prStr}</span>
        </div>
        <div class="mb-card-top-ex">? ${topEx}</div>
      </div>` : '';

    const expandHint = freq > 0
      ? `<span class="mb-card-expand-hint">${_lbl('tap for details ?','���� �������� ?')}</span>`
      : '';
    return `<div class="mb-card" style="--mb-color:${col}" onclick="this.classList.toggle('expanded')">
      <div class="mb-card-top">
        <span class="mb-card-name">${t('muscle.' + m)}</span>
        <span class="mb-card-score" style="color:${gradeColor}">${grade}</span>
      </div>
      <div class="mb-card-bar-wrap">
        <div class="mb-card-bar" style="width:${sc}%;background:${col};box-shadow:0 0 6px ${col}55;"></div>
      </div>
      <div class="mb-card-meta-row">
        <span class="mb-card-meta">${freq} ${_lbl('sessions','����')} - ${volStr} ${_lbl('vol','���')}</span>
        ${lastHtml}
      </div>
      ${expandHint}
      ${summaryHtml}
    </div>`;
  }).join('');

  window._mbAllData = { scores, strengthScores, counts, vols, muscleSets, musclePR, muscleExCounts, lastHit, ALL, MUSCLE_COLORS };
  wrap.innerHTML = overallHtml + insightsHtml + radarHtml +
    '<div class="mb-detail-strip-wrap"><div id="mb-detail-strip"></div></div>' +
    '<div class="mb-grid">' + cardsHtml + '</div>';
}

function mbTap(m) {
  const d = window._mbAllData;
  if (!d) return;
  const strip = document.getElementById('mb-detail-strip');
  if (!strip) return;

  const _isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const sc = d.scores[m] || 0;
  const freq = d.counts[m] || 0;
  const vol  = d.vols[m] || 0;
  const col  = d.MUSCLE_COLORS[m] || '#2ecc71';
  const grade = sc >= 80 ? 'S' : sc >= 60 ? 'A' : sc >= 40 ? 'B' : sc >= 20 ? 'C' : freq > 0 ? 'D' : '--';
  const gradeColor = sc >= 80 ? '#39ff8f' : sc >= 60 ? '#f39c12' : sc >= 40 ? '#60a5fa' : sc >= 20 ? '#e74c3c' : 'var(--text3)';
  const volStr = vol >= 1000 ? (vol/1000).toFixed(1)+'t' : Math.round(vol)+'kg';
  const pr = d.musclePR[m];
  const prStr = pr && pr.weight > 0 ? `${pr.weight} ${pr.unit||'kg'}` : '--';
  const totalSets = d.muscleSets[m] || 0;

  let topEx = '--';
  if (d.muscleExCounts[m]) {
    const sorted = Object.entries(d.muscleExCounts[m]).sort((a,b) => b[1]-a[1]);
    if (sorted.length) topEx = sorted[0][0];
  }

  // Last trained
  const lastIso = d.lastHit[m];
  let lastStr = _isAr ? '�� �������' : 'Never trained';
  if (lastIso) {
    const diff = Math.floor((Date.now() - new Date(lastIso).getTime()) / 86400000);
    if (diff === 0) lastStr = t('time.today');
    else if (diff === 1) lastStr = t('time.yesterday');
    else if (diff < 7)  lastStr = diff + t('time.dAgo');
    else if (diff < 30) lastStr = Math.floor(diff/7) + t('time.wAgo');
    else lastStr = new Date(lastIso).toLocaleDateString(_isAr ? 'ar-EG' : 'en-GB', { day:'numeric', month:'short' });
  }

  // Recommendation
  const rec = sc >= 80 ? (_isAr ? '??����� ������ � �����!' : '🔥 Dominant - keep it up!')
    : sc >= 60 ? (_isAr ? '? ������ � ���� ���' : '💪 Well balanced - good work')
    : sc >= 30 ? (_isAr ? '? ����� ������ �� �������' : '? Needs more attention')
    : freq > 0 ? (_isAr ? '?? ������ �� ������� � ���� �������' : '📌 Rarely trained - add to your routine')
    : (_isAr ? '? �� ������� ���' : '🚀 Not yet trained - start today!');

  const mLabel = t('muscle.' + m);

  strip.innerHTML = `<div class="mb-detail-card" style="border-color:${col}55">
    <div class="mb-detail-header">
      <span class="mb-detail-name" style="color:${col}">${MUSCLE_ICONS[m]||'🏋️'} ${mLabel}</span>
      <span class="mb-detail-grade" style="color:${gradeColor}">${grade}</span>
    </div>
    <div class="mb-detail-rec">${rec}</div>
    <div class="mb-detail-stats">
      <div class="mb-ds"><span class="mb-ds-lbl">${_isAr?'�����':'Sessions'}</span><span class="mb-ds-val" style="color:${col}">${freq||'--'}</span></div>
      <div class="mb-ds"><span class="mb-ds-lbl">${_isAr?'�������':'Sets'}</span><span class="mb-ds-val">${totalSets||'--'}</span></div>
      <div class="mb-ds"><span class="mb-ds-lbl">${_isAr?'�����':'Volume'}</span><span class="mb-ds-val">${freq?volStr:'--'}</span></div>
      <div class="mb-ds"><span class="mb-ds-lbl">${_isAr?'����':'Best'}</span><span class="mb-ds-val" style="color:${col}">${prStr}</span></div>
    </div>
    <div class="mb-detail-bottom">
      <span class="mb-detail-ex">? ${topEx}</span>
      <span class="mb-detail-last">? ${lastStr}</span>
    </div>
  </div>`;

  // Scroll detail into view on mobile
  strip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}





const FORGE_BALANCE_ALL = ['Chest','Back','Shoulders','Legs','Core','Biceps','Triceps','Forearms','Glutes','Calves'];
const FORGE_BALANCE_PAIRS = [['Chest','Back'],['Biceps','Triceps'],['Legs','Glutes']];
const FORGE_BALANCE_COLORS = {
  Chest:'#2ecc71', Back:'#3498db', Shoulders:'#9b59b6',
  Biceps:'#e67e22', Triceps:'#e74c3c', Forearms:'#d35400',
  Legs:'#f1c40f', Core:'#1abc9c', Glutes:'#e91e8c', Calves:'#00bcd4'
};

function _forgeBalanceBase(arr) {
  const src = Array.isArray(arr) ? arr : ((typeof workouts !== 'undefined' && Array.isArray(workouts)) ? workouts : []);
  const counts = {};
  const vols = {};
  src.forEach((w) => {
    const muscle = w && w.muscle;
    if (!muscle) return;
    counts[muscle] = (counts[muscle] || 0) + 1;
    vols[muscle] = (vols[muscle] || 0) + (Number(w.totalVolume) || 0);
  });
  const maxCount = Math.max(...FORGE_BALANCE_ALL.map((m) => counts[m] || 0), 1);
  const scores = {};
  FORGE_BALANCE_ALL.forEach((m) => {
    scores[m] = Math.round(((counts[m] || 0) / maxCount) * 100);
  });
  let pairPenalty = 0;
  FORGE_BALANCE_PAIRS.forEach(([a, b]) => {
    pairPenalty += Math.abs((scores[a] || 0) - (scores[b] || 0)) * 0.15;
  });
  const trained = FORGE_BALANCE_ALL.filter((m) => counts[m]);
  const coverageScore = Math.round((trained.length / FORGE_BALANCE_ALL.length) * 100);
  const avgIndividual = Math.round(FORGE_BALANCE_ALL.reduce((sum, m) => sum + (scores[m] || 0), 0) / FORGE_BALANCE_ALL.length);
  const overallScore = Math.max(0, Math.min(100, Math.round((coverageScore * 0.5 + avgIndividual * 0.5) - pairPenalty)));
  return { arr: src, counts, vols, scores, trained, overallScore };
}

window.getBalanceRegionSummary = function getBalanceRegionSummary(arr) {
  const base = _forgeBalanceBase(arr);
  const score = (name) => (base.scores[name] || 0) / 100;
  const avg = (...vals) => vals.reduce((sum, val) => sum + val, 0) / Math.max(vals.length, 1);
  return {
    chest: avg(score('Chest')),
    back: avg(score('Back')),
    shoulders: avg(score('Shoulders')),
    arms: avg(score('Biceps'), score('Triceps'), score('Forearms')),
    core: avg(score('Core')),
    legs: avg(score('Legs'), score('Glutes'), score('Calves')),
    posterior: avg(score('Back'), score('Glutes'), score('Calves')),
    overall: (base.overallScore || 0) / 100,
    trainedCount: base.trained.length,
    muscleScores: { ...base.scores }
  };
};
