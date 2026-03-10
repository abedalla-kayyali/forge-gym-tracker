// FORGE Gym Tracker - calisthenics dashboards and muscle drill-down
// Extracted from index.html as part of modularization.

function renderCaliDash() {
  const el = document.getElementById('cali-dash-panel');
  if (!el) return;
  const bwW = (typeof bwWorkouts !== 'undefined') ? bwWorkouts : [];

  if (!bwW.length || typeof CALISTHENICS_TREES === 'undefined') {
    el.innerHTML = `<div class="empty-state" style="padding:40px 20px 80px;">
      <div class="empty-icon">🤸</div>
      <div class="empty-title">No BW sessions yet</div>
      <div class="empty-sub">Switch to Bodyweight mode and log your first calisthenics session to unlock your journey.</div>
    </div>`;
    return;
  }

  // Compute tree progress
  let totalUnlocked = 0;
  let totalSkills = 0;
  const treeProgress = CALISTHENICS_TREES.map(tree => {
    let unlockedLvl = 0;
    const levelData = tree.levels.map(lvl => {
      totalSkills++;
      const hist = bwW.filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase());
      const maxVal = hist.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
      const done = maxVal >= lvl.target;
      if (done) { unlockedLvl = Math.max(unlockedLvl, lvl.l); totalUnlocked++; }
      const lastSess = hist.length ? hist.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
      const daysSince = lastSess ? Math.floor((Date.now() - new Date(lastSess.date)) / 86400000) : null;
      return { ...lvl, done, maxVal, daysSince };
    });
    const pct = Math.round((unlockedLvl / tree.levels.length) * 100);
    const curSkill = levelData.find(l => l.l === unlockedLvl) || null;
    const nextSkill = levelData.find(l => l.l === unlockedLvl + 1) || null;
    const isActive = unlockedLvl > 0;
    const recentDays = levelData.map(l => l.daysSince).filter(d => d !== null);
    const daysSinceLast = recentDays.length ? Math.min(...recentDays) : null;
    return { ...tree, unlockedLvl, pct, curSkill, nextSkill, isActive, levelData, daysSinceLast };
  });
  const activeTrees = treeProgress.filter(t => t.isActive);
  const dormantTrees = treeProgress.filter(t => !t.isActive);
  const totalPct = Math.round((totalUnlocked / Math.max(totalSkills, 1)) * 100);

  // BW streak
  const bwDates = [...new Set(bwW.map(w => w.date.slice(0, 10)))].sort((a, b) => a < b ? 1 : -1);
  let bwStreak = 0;
  for (let i = 0; i < bwDates.length; i++) {
    const diff = Math.floor((Date.now() - new Date(bwDates[i]).getTime()) / 86400000);
    if (diff === i || diff === i + 1) bwStreak++; else break;
  }

  // BW PRs
  const prMap = {};
  bwW.forEach(w => {
    const best = Math.max(...w.sets.map(s => s.reps || s.secs || 0));
    if (!prMap[w.exercise] || best > prMap[w.exercise].best) prMap[w.exercise] = { best, date: w.date };
  });
  const prEntries = Object.entries(prMap).sort((a, b) => b[1].best - a[1].best);

  // A. Hero stats
  const heroHtml = `<div class="cali-hero">
    <div class="cali-hero-stat"><div class="cali-h-val">${bwW.length}</div><div class="cali-h-lbl">Sessions</div></div>
    <div class="cali-h-sep"></div>
    <div class="cali-hero-stat"><div class="cali-h-val">${bwStreak}<span class="cali-h-of">d</span></div><div class="cali-h-lbl">🔥 BW Streak</div></div>
    <div class="cali-h-sep"></div>
    <div class="cali-hero-stat"><div class="cali-h-val">${totalUnlocked}<span class="cali-h-of">/${totalSkills}</span></div><div class="cali-h-lbl">Skills</div></div>
    <div class="cali-h-sep"></div>
    <div class="cali-hero-stat"><div class="cali-h-val">${totalPct}<span class="cali-h-of">%</span></div><div class="cali-h-lbl">🌳 Journey</div></div>
  </div>`;

  // B. 30-day BW heatmap
  const heatDays = 30;
  let heatCells = '';
  for (let i = heatDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const count = bwW.filter(w => w.date.slice(0, 10) === ds).length;
    const cls = count === 0 ? '' : count === 1 ? 'cali-hday-1' : 'cali-hday-2';
    heatCells += `<div class="cali-hday ${cls}" title="${ds}: ${count} session(s)"></div>`;
  }
  const heatHtml = `<div class="panel"><div class="panel-header"><span class="panel-title">📅 30-Day Activity</span><span class="panel-badge">${bwW.filter(w => { const d = new Date(); d.setDate(d.getDate() - 30); return new Date(w.date) >= d; }).length} sessions</span></div>
    <div class="cali-heatmap" style="padding:12px 14px 14px;">${heatCells}</div></div>`;

  // C. Active tree cards
  let treeCardsHtml = '';
  if (activeTrees.length) {
    treeCardsHtml = activeTrees.map(tree => {
      const fr = tree.daysSinceLast;
      const frLabel = fr === null ? 'Never' : fr === 0 ? 'Today' : fr === 1 ? 'Yesterday' : fr + 'd ago';
      const frCls = fr === null ? 'cali-stale' : fr <= 2 ? 'cali-fresh' : fr > 7 ? 'cali-stale' : '';
      const nextTarget = tree.nextSkill ? `▶ <strong>${window.FORGE_STORAGE.esc(tree.nextSkill.n)}</strong> — target: ${tree.nextSkill.target} reps` : `<span style="color:#f39c12;">🏆 Tree Complete!</span>`;
      return `<div class="cali-tree-card">
        <div class="cali-tc-header">
          <span class="cali-tc-icon">${tree.icon}</span>
          <span class="cali-tc-name">${window.FORGE_STORAGE.esc(tree.tree)}</span>
          <span class="cali-tc-freshness ${frCls}">${frLabel}</span>
        </div>
        <div class="cali-tc-progress">
          <div class="cali-tc-bar-wrap"><div class="cali-tc-bar-fill" style="width:${tree.pct}%"></div></div>
          <span class="cali-tc-pct">${tree.pct}%</span>
        </div>
        <div class="cali-tc-skills">
          ${tree.curSkill ? `<div class="cali-tc-cur">✓ ${window.FORGE_STORAGE.esc(tree.curSkill.n)} <span class="cali-tc-target">(${tree.curSkill.target} reps)</span></div>` : ''}
          <div class="cali-tc-next">${nextTarget}</div>
        </div>
      </div>`;
    }).join('');
  }

  // D. Next Targets (skills closest to unlocking)
  const pending = [];
  treeProgress.forEach(tree => tree.levelData.forEach(lvl => {
    if (!lvl.done) {
      const pct = lvl.maxVal > 0 ? Math.round((lvl.maxVal / lvl.target) * 100) : 0;
      pending.push({ tree: tree.tree, icon: tree.icon, name: lvl.n, current: lvl.maxVal, target: lvl.target, pct });
    }
  }));
  pending.sort((a, b) => b.pct - a.pct);
  const nextTargetsHtml = pending.slice(0, 5).map(p => `
    <div class="cali-target-row">
      <span class="cali-target-icon">${p.icon}</span>
      <div class="cali-target-info">
        <div class="cali-target-name">${window.FORGE_STORAGE.esc(p.name)}</div>
        <div class="cali-target-bar-wrap"><div class="cali-target-bar-fill" style="width:${p.pct}%"></div></div>
      </div>
      <div class="cali-target-vals">
        <span class="cali-target-cur">${p.current}</span><span class="cali-target-sep">/</span><span class="cali-target-tgt">${p.target}</span>
      </div>
    </div>`).join('') || '<div class="cali-empty-msg">All skills in progress!</div>';

  // E. Recent sessions
  const recent = bwW.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const recentHtml = recent.map(w => {
    const best = Math.max(...w.sets.map(s => s.reps || s.secs || 0));
    const dateStr = new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return `<div class="cali-sess-row">
      <div class="cali-sess-date">${dateStr}</div>
      <div class="cali-sess-name">${window.FORGE_STORAGE.esc(w.exercise)}</div>
      <div class="cali-sess-best">${best}<span class="cali-sess-unit"> reps</span>${w.isPR ? ' 🏆' : ''}</div>
    </div>`;
  }).join('');

  // F. Personal Records
  const prsHtml = prEntries.slice(0, 8).map(([name, data]) => {
    const dateStr = new Date(data.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return `<div class="cali-pr-row">
      <div class="cali-pr-name">${window.FORGE_STORAGE.esc(name)}</div>
      <div class="cali-pr-val">${data.best} <span class="cali-pr-unit">reps</span></div>
      <div class="cali-pr-date">${dateStr}</div>
    </div>`;
  }).join('');

  // G. Dormant trees
  const dormantHtml = dormantTrees.length ? dormantTrees.map(t =>
    `<div class="cali-dormant-item"><span>${t.icon}</span><div class="cali-dormant-name">${window.FORGE_STORAGE.esc(t.tree)}</div></div>`
  ).join('') : '';

  // H. Cali Balance Radar
  const _cbMusc = [];
  const _cbSeen = new Set();
  CALISTHENICS_TREES.forEach(t => { if (!_cbSeen.has(t.muscle)) { _cbSeen.add(t.muscle); _cbMusc.push(t.muscle); } });
  const _cbMC = { Chest: '#2ecc71', Back: '#3498db', Triceps: '#e74c3c', Shoulders: '#9b59b6', Legs: '#f1c40f', Core: '#1abc9c' };
  const _cbCnt = {};
  _cbMusc.forEach(m => { _cbCnt[m] = 0; });
  bwW.forEach(w => { if (Object.prototype.hasOwnProperty.call(_cbCnt, w.muscle)) _cbCnt[w.muscle]++; });
  const _cbMaxC = Math.max(..._cbMusc.map(m => _cbCnt[m]), 1);
  const _cbFreq = {};
  _cbMusc.forEach(m => { _cbFreq[m] = Math.round((_cbCnt[m] / _cbMaxC) * 100); });
  const _cbSkill = {};
  _cbMusc.forEach(m => {
    const _ts = treeProgress.filter(t => t.muscle === m);
    _cbSkill[m] = _ts.length ? Math.round(_ts.reduce((s, t) => s + t.pct, 0) / _ts.length) : 0;
  });
  const _cbTrained = _cbMusc.filter(m => _cbCnt[m] > 0);
  const _cbCov = Math.round((_cbTrained.length / _cbMusc.length) * 100);
  const _cbAvg = Math.round(_cbMusc.reduce((s, m) => s + _cbFreq[m], 0) / _cbMusc.length);
  const _cbBal = Math.round(_cbCov * 0.5 + _cbAvg * 0.5);
  const _cbWeak = _cbMusc.filter(m => _cbFreq[m] < 35).sort((a, b) => _cbFreq[a] - _cbFreq[b]);
  const _cbMsg = _cbBal >= 80 ? 'Excellent cali balance!' : _cbBal >= 60 ? 'Good balance. Push weaker muscles.' : _cbBal >= 40 ? 'Some imbalances detected.' : 'Focus on neglected muscle groups.';
  const _cbRC = _cbBal >= 75 ? '#2ecc71' : _cbBal >= 50 ? '#f39c12' : '#e74c3c';
  const _cbCirc = 2 * Math.PI * 20;
  const _cbDsh = (_cbBal / 100) * _cbCirc;
  const _cbOverHtml = `<div class="mb-overall"><div class="mb-overall-ring"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="5"/><circle cx="26" cy="26" r="20" fill="none" stroke="${_cbRC}" stroke-width="5" stroke-dasharray="${_cbDsh.toFixed(1)} ${_cbCirc.toFixed(1)}" stroke-linecap="round" style="transition:stroke-dasharray .8s ease;filter:drop-shadow(0 0 4px ${_cbRC})"/></svg><div class="mb-overall-ring-val" style="color:${_cbRC}">${_cbBal}</div></div><div class="mb-overall-text"><div class="mb-overall-label">CALI BALANCE</div><div class="mb-overall-msg">${_cbMsg}</div><div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--text3);margin-top:4px;">${_cbTrained.length}/${_cbMusc.length} muscle groups</div></div></div>`;
  const _cbInsHtml = _cbWeak.length ? `<div class="mb-insights-bar"><div class="mb-insight"><span class="mb-insight-icon">⚡</span><span class="mb-insight-text">Needs more cali work: <strong>${_cbWeak.join(' · ')}</strong></span></div></div>` : '';
  const _cbCx = 150;
  const _cbCy = 150;
  const _cbRad = 108;
  const _cbN = _cbMusc.length;
  const _cbPt = (i, f) => {
    const a = (2 * Math.PI * i / _cbN) - Math.PI / 2;
    return [_cbCx + _cbRad * f * Math.cos(a), _cbCy + _cbRad * f * Math.sin(a)];
  };
  const _cbPts = fr => fr.map((f, i) => _cbPt(i, f).join(',')).join(' ');
  const _cbGrids = [25, 50, 75, 100].map((v, ri) => {
    const f = v / 100;
    const pts = _cbMusc.map((_, i) => _cbPt(i, f).join(',')).join(' ');
    const [lx, ly] = _cbPt(0, f);
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,${ri === 3 ? 0.12 : 0.06})" stroke-width="${ri === 3 ? 1 : 0.7}" ${v < 100 ? 'stroke-dasharray="3,3"' : ''}/><text x="${(lx + 4).toFixed(1)}" y="${(ly - 3).toFixed(1)}" font-family="'DM Mono',monospace" font-size="7" fill="rgba(255,255,255,.22)" text-anchor="start">${v}</text>`;
  }).join('');
  const _cbAxes = _cbMusc.map((_, i) => {
    const [x2, y2] = _cbPt(i, 1);
    return `<line x1="${_cbCx}" y1="${_cbCy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,.1)" stroke-width=".8"/>`;
  }).join('');
  const _cbFF = _cbMusc.map(m => _cbFreq[m] / 100);
  const _cbSF = _cbMusc.map(m => _cbSkill[m] / 100);
  const _cbLpad = 22;
  const _cbMGs = _cbMusc.map((m, i) => {
    const ang = (2 * Math.PI * i / _cbN) - Math.PI / 2;
    const col = _cbMC[m] || '#7f8c8d';
    const sc = _cbFreq[m];
    const [fx, fy] = _cbPt(i, _cbFF[i]);
    const [sx, sy] = _cbPt(i, _cbSF[i]);
    const fdot = _cbFF[i] > 0 ? `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="3.5" fill="${col}" stroke="#0d1410" stroke-width="1.5" style="filter:drop-shadow(0 0 3px ${col})"/>` : '';
    const sdot = _cbSF[i] > 0 ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2.5" fill="#fb923c" stroke="#0d1410" stroke-width="1.5"/>` : '';
    const lx = _cbCx + (_cbRad + _cbLpad) * Math.cos(ang);
    const ly = _cbCy + (_cbRad + _cbLpad) * Math.sin(ang);
    const anch = Math.abs(lx - _cbCx) < 5 ? 'middle' : lx < _cbCx ? 'end' : 'start';
    return `<g onclick="caliMuscTap('${m}')" style="cursor:pointer">${fdot}${sdot}<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="20" fill="transparent"/><text x="${lx.toFixed(1)}" y="${(ly - 4).toFixed(1)}" text-anchor="${anch}" font-family="'DM Mono',monospace" font-size="9.5" font-weight="700" fill="${sc > 0 ? col : 'rgba(255,255,255,.2)'}" letter-spacing=".8">${m.toUpperCase()}</text><text x="${lx.toFixed(1)}" y="${(ly + 7).toFixed(1)}" text-anchor="${anch}" font-family="'DM Mono',monospace" font-size="8" fill="${sc > 0 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.12)'}">${sc}</text></g>`;
  }).join('');
  const _cbCtr = `<text x="${_cbCx}" y="${_cbCy - 6}" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="28" fill="rgba(255,255,255,.9)" style="filter:drop-shadow(0 0 8px rgba(46,204,113,.5))">${_cbBal}</text><text x="${_cbCx}" y="${_cbCy + 9}" text-anchor="middle" font-family="'DM Mono',monospace" font-size="7.5" fill="rgba(255,255,255,.3)" letter-spacing="1.5">BALANCE</text>`;
  window._caliMbData = { muscles: _cbMusc, colors: _cbMC, counts: _cbCnt, freqScores: _cbFreq, skillScores: _cbSkill, treeProgress, bwW };
  const caliRadarHtml = `<div class="panel" style="margin-bottom:12px;"><div class="panel-header"><span class="panel-title">⚖️ Cali Balance</span><span class="panel-badge">${_cbBal}/100</span></div><div style="padding:10px 12px 16px;">${_cbOverHtml}${_cbInsHtml}<div class="mb-radar-wrap" style="margin-top:8px;"><div class="mb-radar-legend"><span class="mb-legend-dot" style="background:#39ff8f;box-shadow:0 0 5px #39ff8f88"></span><span class="mb-legend-lbl">FREQUENCY</span><span class="mb-legend-dot" style="background:#fb923c;box-shadow:0 0 5px #fb923c88;margin-left:10px"></span><span class="mb-legend-lbl">SKILL LEVEL</span></div><svg viewBox="0 0 300 300" width="100%" style="max-width:340px;overflow:visible;display:block;margin:0 auto"><defs><radialGradient id="caliRBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(46,204,113,.06)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient></defs><circle cx="${_cbCx}" cy="${_cbCy}" r="${_cbRad}" fill="url(#caliRBg)"/>${_cbGrids}${_cbAxes}<polygon points="${_cbPts(_cbSF)}" fill="rgba(251,146,60,.08)" stroke="#fb923c" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="4,3" style="filter:drop-shadow(0 0 3px rgba(251,146,60,.25))"/><polygon points="${_cbPts(_cbFF)}" fill="rgba(57,255,143,.1)" stroke="#39ff8f" stroke-width="2" stroke-linejoin="round" style="filter:drop-shadow(0 0 5px rgba(57,255,143,.35))"/>${_cbMGs}${_cbCtr}</svg></div><div id="cali-balance-detail" style="margin-top:10px;"></div></div></div>`;

  el.innerHTML = `
    ${heroHtml}
    ${caliRadarHtml}
    ${heatHtml}
    ${activeTrees.length ? `<div class="panel"><div class="panel-header"><span class="panel-title">🌳 Skill Trees</span><span class="panel-badge">${activeTrees.length} active</span></div><div style="padding:10px 12px 14px;">${treeCardsHtml}</div></div>` : ''}
    ${pending.length ? `<div class="panel"><div class="panel-header"><span class="panel-title">🎯 Next Targets</span><span class="panel-badge">closest to unlock</span></div><div style="padding:10px 12px 14px;">${nextTargetsHtml}</div></div>` : ''}
    ${recentHtml ? `<div class="panel"><div class="panel-header"><span class="panel-title">🕐 Recent Sessions</span></div><div style="padding:8px 12px 14px;">${recentHtml}</div></div>` : ''}
    ${prsHtml ? `<div class="panel"><div class="panel-header"><span class="panel-title">🏆 Personal Records</span><span class="panel-badge">${prEntries.length} exercises</span></div><div style="padding:8px 12px 14px;">${prsHtml}</div></div>` : ''}
    ${dormantHtml ? `<div class="panel"><div class="panel-header"><span class="panel-title">💤 Dormant Trees</span><span class="panel-badge">${dormantTrees.length} to explore</span></div><div class="cali-dormant-grid" style="padding:10px 12px 14px;">${dormantHtml}</div></div>` : ''}
    <div style="height:20px;"></div>
  `;
}

function caliMuscTap(m) {
  const d = window._caliMbData;
  if (!d) return;
  const strip = document.getElementById('cali-balance-detail');
  if (!strip) return;

  const col = d.colors[m] || '#2ecc71';
  const cnt = d.counts[m] || 0;
  const sc = d.freqScores[m] || 0;
  const skillSc = d.skillScores[m] || 0;
  const muscleTrees = d.treeProgress.filter(t => t.muscle === m);
  const allSess = d.bwW.filter(w => w.muscle === m).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Last trained
  let lastStr = 'Never trained';
  if (allSess.length) {
    const diff = Math.floor((Date.now() - new Date(allSess[0].date).getTime()) / 86400000);
    lastStr = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : diff < 30 ? Math.floor(diff / 7) + 'w ago' : new Date(allSess[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  const grade = sc >= 80 ? 'S' : sc >= 60 ? 'A' : sc >= 40 ? 'B' : sc >= 20 ? 'C' : cnt > 0 ? 'D' : '—';
  const gradeColor = sc >= 80 ? '#39ff8f' : sc >= 60 ? '#f39c12' : sc >= 40 ? '#60a5fa' : sc >= 20 ? '#e74c3c' : 'var(--text3)';
  const rec = sc >= 80 ? '💪 Dominant — keep it up!' : sc >= 60 ? '✅ Well balanced — good work' : sc >= 30 ? '⚡ Needs more attention' : cnt > 0 ? '⚠️ Rarely trained — add to your routine' : '❌ Not yet trained — start today!';
  const bestPerf = allSess.length ? Math.max(...allSess.map(w => Math.max(...w.sets.map(s => s.reps || s.secs || 0)))) : 0;

  // Exercise skill rows per tree
  const exercisesHtml = muscleTrees.map(tree => {
    const rows = tree.levelData.map(lvl => {
      const pct = lvl.maxVal > 0 ? Math.min(100, Math.round((lvl.maxVal / lvl.target) * 100)) : 0;
      const icon = lvl.done ? '✅' : pct > 0 ? '🔄' : '🔒';
      return `<div class="cmtap-ex-row">
        <span class="cmtap-ex-icon">${icon}</span>
        <div class="cmtap-ex-info">
          <div class="cmtap-ex-name">${window.FORGE_STORAGE.esc(lvl.n)}</div>
          <div class="cmtap-ex-bar-wrap"><div class="cmtap-ex-bar-fill" style="width:${pct}%;background:${lvl.done ? col : 'rgba(255,255,255,.25)'}"></div></div>
        </div>
        <div class="cmtap-ex-vals">${lvl.maxVal > 0 ? lvl.maxVal : '—'}<span class="cmtap-ex-sep">/</span><span class="cmtap-ex-tgt">${lvl.target}${lvl.t === 'hold' ? 's' : ''}</span></div>
      </div>`;
    }).join('');
    return `<div class="cmtap-tree-section">
      <div class="cmtap-tree-hdr">${tree.icon} ${window.FORGE_STORAGE.esc(tree.tree)} <span class="cmtap-tree-pct" style="color:${col}">${tree.pct}%</span></div>
      ${rows}
    </div>`;
  }).join('') || '<div class="cmtap-empty">No sessions logged for this muscle yet.</div>';

  strip.innerHTML = `<div class="cmtap-card" style="border-color:${col}55;">
    <div class="cmtap-header">
      <span class="cmtap-name" style="color:${col}">${m}</span>
      <span class="cmtap-grade" style="color:${gradeColor}">${grade}</span>
    </div>
    <div class="cmtap-rec">${rec}</div>
    <div class="cmtap-stats">
      <div class="cmtap-stat"><span class="cmtap-stat-lbl">Sessions</span><span class="cmtap-stat-val" style="color:${col}">${cnt || '—'}</span></div>
      <div class="cmtap-stat"><span class="cmtap-stat-lbl">Freq</span><span class="cmtap-stat-val">${sc}%</span></div>
      <div class="cmtap-stat"><span class="cmtap-stat-lbl">Skill</span><span class="cmtap-stat-val" style="color:#fb923c">${skillSc}%</span></div>
      <div class="cmtap-stat"><span class="cmtap-stat-lbl">Best</span><span class="cmtap-stat-val" style="color:${col}">${bestPerf || '—'}</span></div>
    </div>
    <div class="cmtap-last">↻ Last: ${lastStr}</div>
    <div class="cmtap-exercises">${exercisesHtml}</div>
  </div>`;

  strip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderCaliJourney() {
  const body = document.getElementById('cali-journey-body');
  const badge = document.getElementById('cali-journey-badge');
  if (!body) return;
  if (typeof CALISTHENICS_TREES === 'undefined') return;

  const bwW = (typeof bwWorkouts !== 'undefined') ? bwWorkouts : [];
  let totalUnlocked = 0;
  let totalSkills = 0;

  const treeHTML = CALISTHENICS_TREES.map(tree => {
    let unlockedLvl = 0;
    const levelData = tree.levels.map(lvl => {
      totalSkills++;
      const hist = bwW.filter(w => w.exercise.toLowerCase() === lvl.n.toLowerCase());
      const maxVal = hist.reduce((mx, w) => Math.max(mx, ...w.sets.map(s => s.reps || s.secs || 0)), 0);
      const done = maxVal >= lvl.target;
      if (done) { unlockedLvl = Math.max(unlockedLvl, lvl.l); totalUnlocked++; }
      return { ...lvl, done, maxVal };
    });

    const pct = Math.round((unlockedLvl / tree.levels.length) * 100);
    const curSkill = levelData.find(l => l.l === unlockedLvl) || null;
    const nextSkill = levelData.find(l => l.l === unlockedLvl + 1) || null;
    const isActive = unlockedLvl > 0;

    const dots = levelData.map((l, i) =>
      (i > 0 ? '<div class="cj-dot-connector"></div>' : '') +
      `<div class="cj-dot${l.done ? ' unlocked' : ''}" title="${l.n}: best ${l.maxVal}/${l.target}${l.t === 'hold' ? 's' : ' reps'}"></div>`
    ).join('');

    const nextHtml = nextSkill
      ? `<div class="cj-next">📈 Next: <strong>${window.FORGE_STORAGE.esc(nextSkill.n)}</strong> · ${nextSkill.target} ${nextSkill.t === 'hold' ? 'secs hold' : 'reps'}</div>`
      : (isActive ? '<div class="cj-next" style="color:var(--green)">🏆 Tree Complete!</div>' : '');

    return `
      <div class="cj-tree${isActive ? ' active' : ' dormant'}">
        <div class="cj-tree-hdr">
          <span class="cj-icon">${tree.icon}</span>
          <div class="cj-tree-info">
            <div class="cj-tree-name">${window.FORGE_STORAGE.esc(tree.tree)}</div>
            <div class="cj-tree-status">${isActive && curSkill ? window.FORGE_STORAGE.esc(curSkill.n) : 'Not started — tap BW tab'}</div>
          </div>
          <span class="cj-pct${pct >= 100 ? ' pct-done' : ''}">${pct}%</span>
        </div>
        <div class="cj-bar-track"><div class="cj-bar-fill" style="width:${pct}%"></div></div>
        <div class="cj-dots">${dots}</div>
        ${nextHtml}
      </div>`;
  }).join('');

  if (badge) badge.textContent = totalUnlocked + ' / ' + totalSkills + ' SKILLS';
  body.innerHTML = treeHTML;
}
