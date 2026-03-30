function closeSessionSummary() {
  const overlay = document.getElementById('wend-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.classList.remove('scroll-locked');
  }
  if (window._pendingSessionCheckin) {
    window._pendingSessionCheckin = false;
    if (typeof maybeShowCheckin === 'function') maybeShowCheckin();
  }
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function _sessionShareName() {
  return 'forge-session-' + new Date().toISOString().slice(0, 10) + '.png';
}

function _downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(url, '_blank', 'noopener');
    }
    URL.revokeObjectURL(url);
  }, 800);
}

function _canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function _getSessionShareCanvas() {
  const preview = document.getElementById('session-share-preview');
  if (preview && preview.width > 0 && preview.height > 0) return preview;
  return null;
}

function _sessionShareUserName() {
  try {
    if (typeof userProfile !== 'undefined' && userProfile && userProfile.name) {
      return String(userProfile.name).trim() || 'FORGE ATHLETE';
    }
  } catch (_) {}
  try {
    const p = JSON.parse(localStorage.getItem('forge_profile') || '{}');
    return (p && p.name ? String(p.name).trim() : '') || 'FORGE ATHLETE';
  } catch (_) {
    return 'FORGE ATHLETE';
  }
}

function _drawPill(ctx, x, y, w, h, label, value, accent) {
  ctx.fillStyle = 'rgba(13,24,18,.92)';
  _roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = accent ? 'rgba(57,255,143,.46)' : 'rgba(130,162,137,.24)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(161,192,168,.88)';
  ctx.font = '600 17px "DM Mono", monospace';
  ctx.fillText(label, x + 16, y + 35);

  ctx.fillStyle = accent ? '#54ffab' : '#f0faf2';
  ctx.font = '700 40px "Barlow Condensed", sans-serif';
  if (accent) { ctx.shadowColor = '#39ff8f'; ctx.shadowBlur = 14; }
  ctx.fillText(String(value), x + 16, y + 92);
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
}

function _wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(' ');
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function _fmtNum(n) {
  return Math.round(Number(n) || 0).toLocaleString();
}

function _fmtExerciseMeta(log) {
  if (!log) return '';

  if (log.mode === 'weighted') {
    const sets = Array.isArray(log.sets) ? log.sets : [];
    const work = sets.filter(s => s && s.type !== 'warmup');
    const use = work.length ? work : sets;
    const top = use.slice(0, 3).map(s => {
      const reps = Number(s.reps) || 0;
      const weight = Number(s.weight) || 0;
      const unit = s.unit || 'kg';
      return weight > 0 && reps > 0 ? (weight + unit + ' x ' + reps) : (reps > 0 ? (reps + ' reps') : (weight + unit));
    }).filter(Boolean).join(' | ');
    const setCount = use.length || sets.length;
    const volume = Number(log.volume) || 0;
    const volText = volume > 0 ? ('Vol ' + _fmtNum(volume)) : '';
    return [setCount + ' sets', top, volText].filter(Boolean).join(' | ');
  }

  if (log.mode === 'bodyweight') {
    const sets = Array.isArray(log.sets) ? log.sets : [];
    const top = sets.slice(0, 3).map(s => {
      if (Number(s.reps) > 0) return s.reps + ' reps';
      if (Number(s.secs) > 0) return s.secs + ' sec';
      return '';
    }).filter(Boolean).join(' | ');
    const reps = Number(log.totalReps) || 0;
    const repText = reps > 0 ? (reps + ' reps total') : '';
    return [sets.length + ' sets', top, repText].filter(Boolean).join(' | ');
  }

  const mins = Number(log.durationMins) || 0;
  const kcal = Number(log.calories) || 0;
  const zone = log.hrZone ? ('Zone ' + log.hrZone) : '';
  return [mins + ' min', kcal > 0 ? (kcal + ' kcal') : '', zone].filter(Boolean).join(' | ');
}
function _groupSessionLogs(logs) {
  const rows = Array.isArray(logs) ? logs : [];
  return [
    { key: 'weighted', label: 'WEIGHTED', rows: rows.filter((l) => l && l.mode === 'weighted') },
    { key: 'bodyweight', label: 'BODYWEIGHT', rows: rows.filter((l) => l && l.mode === 'bodyweight') },
    { key: 'cardio', label: 'CARDIO', rows: rows.filter((l) => l && l.mode === 'cardio') }
  ].filter((group) => group.rows.length);
}

function _svgMarkupToImage(svgMarkup) {
  return new Promise(resolve => {
    if (!svgMarkup) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
    img.src = encoded;
  });
}

async function _drawSessionShareCard(summaryOverride = null) {
  const s = summaryOverride || (typeof _lastSessionSummary !== 'undefined' && _lastSessionSummary) || null;
  if (!s) return null;

  const canvas = document.createElement('canvas');
  const W = 1080;
  const groupedLogs = _groupSessionLogs(s.logs);
  const totalRows = groupedLogs.reduce((sum, group) => sum + group.rows.length, 0);
  const sectionCount = groupedLogs.length || 1;
  const listBaseH = 120 + (sectionCount * 44) + (totalRows * 72);
  const H = Math.max(2000, 1380 + listBaseH + 70);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050d08');
  bg.addColorStop(0.5, '#0b1a12');
  bg.addColorStop(1, '#06110b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glowA = ctx.createRadialGradient(170, 170, 20, 170, 170, 420);
  glowA.addColorStop(0, 'rgba(84,255,171,.22)');
  glowA.addColorStop(1, 'rgba(84,255,171,0)');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, W, H);

  const glowB = ctx.createRadialGradient(W - 130, 410, 40, W - 130, 410, 420);
  glowB.addColorStop(0, 'rgba(78,197,255,.18)');
  glowB.addColorStop(1, 'rgba(78,197,255,0)');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, W, H);

  // Diagonal grid texture
  ctx.save();
  ctx.strokeStyle = 'rgba(84,255,171,0.02)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = -H; gx < W + H; gx += 12) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx + H, H);
  }
  ctx.stroke();
  ctx.restore();

  // Top accent bar — neon gradient across full width
  const _accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  _accentGrad.addColorStop(0,   'rgba(84,255,171,0)');
  _accentGrad.addColorStop(0.2, '#54ffab');
  _accentGrad.addColorStop(0.7, '#00c9b1');
  _accentGrad.addColorStop(1,   'rgba(84,255,171,0)');
  ctx.fillStyle = _accentGrad;
  ctx.fillRect(0, 0, W, 4);

  ctx.fillStyle = '#54ffab';
  ctx.font = '700 60px "Bebas Neue", sans-serif';
  ctx.fillText('FORGE SESSION', 70, 96);

  ctx.fillStyle = 'rgba(229,246,235,.9)';
  ctx.font = '700 48px "Barlow Condensed", sans-serif';
  ctx.fillText('PERFORMANCE POSTER', 70, 144);

  ctx.fillStyle = 'rgba(179,207,187,.88)';
  ctx.font = '500 22px "DM Mono", monospace';
  ctx.fillText((s.dateStr || '') + ' | ' + (s.timeStr || ''), 70, 179);

  const athleteName = _sessionShareUserName().toUpperCase();
  const streakVal = typeof calcStreak === 'function' ? calcStreak() : 0;

  // Session score (0–100 composite) + achievement tier
  const _sessionScore = Math.min(100,
    Math.min(40, Math.round((Number(s.totalVol) || 0) / 500)) +
    Math.min(30, (s.prCount || 0) * 6) +
    Math.min(20, streakVal * 2) +
    Math.min(10, Math.round(Math.min((s.totalSets || 0), 50) / 50 * 10))
  );
  const _tier = Number(s.totalVol) >= 10000 || (s.prCount || 0) >= 6
    ? { label: 'BEAST MODE', color: '#ff6b6b', glow: 'rgba(255,107,107,0.5)' }
    : Number(s.totalVol) >= 5000 || (s.prCount || 0) >= 3
    ? { label: 'ELITE',      color: '#ffd666', glow: 'rgba(255,214,102,0.5)' }
    : Number(s.totalVol) >= 2000 || (s.prCount || 0) >= 1
    ? { label: 'WARRIOR',    color: '#54ffab', glow: 'rgba(84,255,171,0.4)'  }
    : { label: 'GRINDER',    color: 'rgba(190,214,196,.75)', glow: 'rgba(84,255,171,0.2)' };

  // Score + tier panel (top-right)
  const _spX = 700, _spY = 52, _spW = 310, _spH = 124;
  ctx.save();
  ctx.shadowColor = _tier.glow;
  ctx.shadowBlur = 32;
  ctx.fillStyle = 'rgba(7,16,11,.9)';
  _roundRect(ctx, _spX, _spY, _spW, _spH, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = _tier.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  // Labels inside panel
  ctx.fillStyle = 'rgba(190,214,196,.55)';
  ctx.font = '500 11px "DM Mono", monospace';
  ctx.fillText('SESSION SCORE', _spX + 16, _spY + 20);
  ctx.fillStyle = 'rgba(190,214,196,.55)';
  ctx.fillText('ATHLETE: ' + athleteName, _spX + 16, _spY + 114);
  // Tier label with glow
  ctx.save();
  ctx.shadowColor = _tier.glow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = _tier.color;
  ctx.font = '700 34px "Bebas Neue", sans-serif';
  ctx.fillText(_tier.label, _spX + 16, _spY + 62);
  ctx.restore();
  // Score number (large, right-aligned inside panel)
  ctx.save();
  ctx.shadowColor = _tier.glow;
  ctx.shadowBlur = 22;
  ctx.fillStyle = _tier.color;
  ctx.font = '700 72px "Bebas Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(_sessionScore), _spX + _spW - 14, _spY + 108);
  ctx.textAlign = 'left';
  ctx.restore();
  const volumeVal = Number(s.totalVol) > 0 ? (_fmtNum(s.totalVol) + 'kg') : '-';
  const cards = [
    { label: 'DURATION', value: s.durStr || '00:00', accent: true },
    { label: 'SETS', value: s.totalSets || 0, accent: false },
    { label: 'VOLUME', value: volumeVal, accent: true },
    { label: 'PRS', value: s.prCount || 0, accent: (s.prCount || 0) > 0 },
    { label: 'STREAK', value: String(streakVal) + 'D', accent: false }
  ];

  const cardY = 214;
  const gap = 16;
  const cw = Math.floor((W - 140 - gap * 4) / 5);
  const ch = 128;
  for (let i = 0; i < cards.length; i++) {
    _drawPill(ctx, 70 + i * (cw + gap), cardY, cw, ch, cards[i].label, cards[i].value, cards[i].accent);
  }

  const leftX = 70;
  const leftY = 372;
  const leftW = 940;
  const leftH = 800;
  ctx.fillStyle = 'rgba(13,24,18,.92)';
  _roundRect(ctx, leftX, leftY, leftW, leftH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(84,255,171,.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glow orbs behind body figures for depth
  const svgW = 341, svgH = 700, svgGap = 20;
  const svgPadX = Math.floor((leftW - svgW * 2 - svgGap) / 2);
  const _orbY = leftY + 54 + svgH / 2;
  [leftX + svgPadX + svgW / 2, leftX + svgPadX + svgW + svgGap + svgW / 2].forEach(cx => {
    const orb = ctx.createRadialGradient(cx, _orbY, 40, cx, _orbY, 310);
    orb.addColorStop(0, 'rgba(84,255,171,0.10)');
    orb.addColorStop(0.5, 'rgba(84,255,171,0.04)');
    orb.addColorStop(1, 'rgba(84,255,171,0)');
    ctx.fillStyle = orb;
    ctx.fillRect(leftX, leftY, leftW, leftH);
  });

  ctx.fillStyle = '#54ffab';
  ctx.font = '600 20px "DM Mono", monospace';
  ctx.fillText('BODY MAP', leftX + 18, leftY + 34);

  if (typeof _buildSessionBodyMapSVG === 'function') {
    const muscles = new Set(Array.isArray(s.muscles) ? s.muscles : []);
    const frontSvg = _buildSessionBodyMapSVG(muscles, 'front') || '';
    const backSvg = _buildSessionBodyMapSVG(muscles, 'back') || '';
    const frontImg = await _svgMarkupToImage(frontSvg);
    const backImg = await _svgMarkupToImage(backSvg);
    if (frontImg) ctx.drawImage(frontImg, leftX + svgPadX, leftY + 54, svgW, svgH);
    if (backImg)  ctx.drawImage(backImg,  leftX + svgPadX + svgW + svgGap, leftY + 54, svgW, svgH);

    // FRONT / BACK labels — centered under each figure
    ctx.strokeStyle = 'rgba(84,255,171,0.3)';
    ctx.lineWidth = 1;
    const _fCx = leftX + svgPadX + svgW / 2;
    const _bCx = leftX + svgPadX + svgW + svgGap + svgW / 2;
    ctx.beginPath(); ctx.moveTo(_fCx - 30, leftY + 762); ctx.lineTo(_fCx + 30, leftY + 762); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(_bCx - 30, leftY + 762); ctx.lineTo(_bCx + 30, leftY + 762); ctx.stroke();
    ctx.fillStyle = 'rgba(190,214,196,.85)';
    ctx.font = '600 18px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT', _fCx, leftY + 780);
    ctx.fillText('BACK',  _bCx, leftY + 780);
    ctx.textAlign = 'left';

    // Muscles trained — centered at bottom of panel
    if (Array.isArray(s.muscles) && s.muscles.length) {
      ctx.fillStyle = 'rgba(190,214,196,.6)';
      ctx.font = '500 15px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.muscles.join(' · '), leftX + leftW / 2, leftY + leftH - 12);
      ctx.textAlign = 'left';
    }
  }

  // ── ANALYTICS STRIP (y=1188, h=176) ─────────────────────────────────────────
  const _aY = 1188, _aH = 176;

  // Volume by muscle
  const _volMap = {};
  (s.logs || []).forEach(l => { if (l && l.muscle) _volMap[l.muscle] = (_volMap[l.muscle] || 0) + (Number(l.volume) || 0); });
  const _volEntries = Object.entries(_volMap).sort((a, b) => b[1] - a[1]);
  const _volTotal = _volEntries.reduce((t, [, v]) => t + v, 0);

  // MVP lift (max weight × reps single set)
  let _mvpEx = '', _mvpW = 0, _mvpR = 0, _mvpScore = 0;
  (s.logs || []).forEach(l => {
    (Array.isArray(l.sets) ? l.sets : []).forEach(st => {
      const w = Number(st.weight) || 0, r = Number(st.reps) || 0;
      if (w * r > _mvpScore) { _mvpScore = w * r; _mvpEx = l.exercise || '?'; _mvpW = w; _mvpR = r; }
    });
  });

  // Best est. 1RM — Epley formula: w × (1 + r/30)
  let _bestOrm = 0, _bestOrmEx = '';
  (s.logs || []).forEach(l => {
    (Array.isArray(l.sets) ? l.sets : []).forEach(st => {
      const w = Number(st.weight) || 0, r = Number(st.reps) || 0;
      const orm = r > 0 ? Math.round(w * (1 + r / 30)) : 0;
      if (orm > _bestOrm) { _bestOrm = orm; _bestOrmEx = l.exercise || '?'; }
    });
  });

  // Workout density
  const _durMins = (() => { const ds = s.durStr || ''; if (!ds || ds === '--:--') return 0; const p = ds.split(':'); return (parseInt(p[0], 10) || 0) + (parseInt(p[1], 10) || 0) / 60; })();
  const _density = (_durMins > 0 && Number(s.totalVol) > 0) ? Math.round(Number(s.totalVol) / _durMins) : 0;

  // Fun weight equivalent
  const _funKg = Number(s.totalVol) || 0;
  const _funStr = _funKg >= 10000 ? `${(_funKg/6350).toFixed(1)} elephants` : _funKg >= 3000 ? `${(_funKg/1500).toFixed(1)} polar bears` : _funKg >= 500 ? `${(_funKg/80).toFixed(0)} people` : _funKg >= 100 ? `${(_funKg/10).toFixed(0)} bowling balls` : null;

  // Box 1 — Volume breakdown bars (x=70, w=420)
  ctx.fillStyle = 'rgba(13,24,18,.92)';
  _roundRect(ctx, 70, _aY, 420, _aH, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(84,255,171,.22)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#54ffab'; ctx.font = '600 15px "DM Mono", monospace';
  ctx.fillText('VOLUME BY MUSCLE', 86, _aY + 26);
  if (_volEntries.length > 0) {
    const _nb = Math.min(_volEntries.length, 6), _bh = 20, _bgap = 5;
    const _bmaxW = 420 - 16 - 84 - 38;
    let _by = _aY + 42;
    for (let _bi = 0; _bi < _nb; _bi++) {
      const [_bm, _bv] = _volEntries[_bi];
      const _bp = _volTotal > 0 ? _bv / _volTotal : 0;
      ctx.fillStyle = 'rgba(190,214,196,.8)'; ctx.font = '500 12px "DM Mono", monospace';
      ctx.textAlign = 'right'; ctx.fillText(_bm.slice(0, 10), 86 + 80, _by + _bh - 4); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(25,52,35,.9)'; _roundRect(ctx, 86 + 84, _by, _bmaxW, _bh, 4); ctx.fill();
      const _bfw = Math.max(6, _bp * _bmaxW);
      if (_bi === 0) { const _bg = ctx.createLinearGradient(86+84, 0, 86+84+_bfw, 0); _bg.addColorStop(0, '#39ff8f'); _bg.addColorStop(1, '#00c9b1'); ctx.fillStyle = _bg; }
      else ctx.fillStyle = `rgba(57,255,143,${Math.max(0.25, 0.55 - _bi * 0.07)})`;
      _roundRect(ctx, 86 + 84, _by, _bfw, _bh, 4); ctx.fill();
      ctx.fillStyle = 'rgba(190,214,196,.88)'; ctx.font = '600 11px "DM Mono", monospace';
      ctx.fillText(Math.round(_bp * 100) + '%', 86 + 84 + _bmaxW + 5, _by + _bh - 4);
      _by += _bh + _bgap;
    }
  }

  // Box 2 — MVP lift (x=506, w=240)
  ctx.fillStyle = 'rgba(13,24,18,.92)'; _roundRect(ctx, 506, _aY, 240, _aH, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,102,.28)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ffd666'; ctx.font = '600 15px "DM Mono", monospace'; ctx.fillText('MVP LIFT', 522, _aY + 26);
  if (_mvpEx) {
    ctx.fillStyle = 'rgba(190,214,196,.85)'; ctx.font = '500 13px "DM Mono", monospace';
    _wrapText(ctx, _mvpEx, 208).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 522, _aY + 50 + i * 17));
    ctx.fillStyle = '#39ff8f'; ctx.font = '700 32px "Barlow Condensed", sans-serif';
    ctx.fillText(_mvpW + 'kg × ' + _mvpR, 522, _aY + 106);
    ctx.fillStyle = 'rgba(190,214,196,.5)'; ctx.font = '500 12px "DM Mono", monospace';
    ctx.fillText('Heaviest Set', 522, _aY + 126);
  } else {
    ctx.fillStyle = 'rgba(190,214,196,.4)'; ctx.font = '500 13px "DM Mono", monospace';
    ctx.fillText('No weighted sets', 522, _aY + 70);
  }

  // Box 3 — Advanced stats: est. 1RM / density / fun weight (x=762, w=248)
  ctx.fillStyle = 'rgba(13,24,18,.92)'; _roundRect(ctx, 762, _aY, 248, _aH, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(78,197,255,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#4ec5ff'; ctx.font = '600 15px "DM Mono", monospace'; ctx.fillText('ADVANCED STATS', 778, _aY + 26);
  let _stY = _aY + 50;
  if (_bestOrm > 0) {
    ctx.fillStyle = 'rgba(190,214,196,.65)'; ctx.font = '500 12px "DM Mono", monospace';
    ctx.fillText('Est. 1RM · ' + _bestOrmEx.slice(0, 14), 778, _stY);
    ctx.fillStyle = '#f0faf2'; ctx.font = '700 26px "Barlow Condensed", sans-serif';
    ctx.fillText(_bestOrm + ' kg', 778, _stY + 24); _stY += 46;
  }
  if (_density > 0) {
    ctx.fillStyle = 'rgba(190,214,196,.65)'; ctx.font = '500 12px "DM Mono", monospace';
    ctx.fillText('Workout Density', 778, _stY);
    ctx.fillStyle = '#f0faf2'; ctx.font = '700 26px "Barlow Condensed", sans-serif';
    ctx.fillText(_density + ' kg/min', 778, _stY + 24); _stY += 46;
  }
  if (_funStr) {
    ctx.fillStyle = 'rgba(190,214,196,.65)'; ctx.font = '500 12px "DM Mono", monospace';
    ctx.fillText('You lifted ≈', 778, _stY);
    ctx.fillStyle = '#f0faf2'; ctx.font = '600 18px "Barlow Condensed", sans-serif';
    ctx.fillText(_funStr, 778, _stY + 22);
  }
  // ── END ANALYTICS STRIP ──────────────────────────────────────────────────────

  const listX = 70;
  const listY = 1380;
  const listW = W - 140;
  const listH = H - listY - 70;
  ctx.fillStyle = 'rgba(12,22,16,.94)';
  _roundRect(ctx, listX, listY, listW, listH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(84,255,171,.28)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#54ffab';
  ctx.font = '600 22px "DM Mono", monospace';
  ctx.fillText('SESSION BREAKDOWN', listX + 20, listY + 36);

  if (!groupedLogs.length) {
    ctx.fillStyle = 'rgba(236,246,239,.85)';
    ctx.font = '600 28px "Barlow Condensed", sans-serif';
    ctx.fillText('No exercise entries in this session', listX + 20, listY + 92);
  } else {
    let ry = listY + 82;
    let index = 1;
    groupedLogs.forEach((group) => {
      ctx.fillStyle = 'rgba(84,255,171,.16)';
      _roundRect(ctx, listX + 16, ry - 26, listW - 32, 34, 10);
      ctx.fill();
      ctx.fillStyle = '#9df8c8';
      ctx.font = '700 18px "DM Mono", monospace';
      ctx.fillText(group.label + ' | ' + group.rows.length, listX + 30, ry - 3);
      ry += 50;
      group.rows.forEach((l, rowIndex) => {
        const rowH = 61;
        ctx.fillStyle = rowIndex % 2 ? 'rgba(18,30,23,.78)' : 'rgba(15,26,20,.78)';
        _roundRect(ctx, listX + 16, ry - 34, listW - 32, rowH, 10);
        ctx.fill();

        const modeTag = l.mode === 'weighted' ? 'W' : (l.mode === 'bodyweight' ? 'BW' : 'CARDIO');
        const title = (l.exercise || l.activity || 'Entry') + (l.muscle ? (' | ' + l.muscle) : '');

        ctx.fillStyle = '#f1faf3';
        ctx.font = '700 25px "Barlow Condensed", sans-serif';
        ctx.fillText(index + '. ' + title, listX + 30, ry - 8);

        ctx.fillStyle = 'rgba(191,217,198,.9)';
        ctx.font = '500 17px "Barlow", sans-serif';
        const meta = _fmtExerciseMeta(l);
        const metaLines = _wrapText(ctx, meta, listW - 270);
        if (metaLines[0]) ctx.fillText(metaLines[0], listX + 30, ry + 14);

        ctx.fillStyle = 'rgba(84,255,171,.25)';
        _roundRect(ctx, listX + listW - 190, ry - 27, 75, 34, 9);
        ctx.fill();
        ctx.fillStyle = '#9df8c8';
        ctx.font = '700 16px "DM Mono", monospace';
        ctx.fillText(modeTag, listX + listW - 166, ry - 4);

        if (l.isPR) {
          ctx.fillStyle = 'rgba(255,214,102,.22)';
          _roundRect(ctx, listX + listW - 106, ry - 27, 82, 34, 9);
          ctx.fill();
          const _prGrad = ctx.createLinearGradient(listX + listW - 106, 0, listX + listW - 24, 0);
          _prGrad.addColorStop(0, '#ffd666');
          _prGrad.addColorStop(1, '#ffaa00');
          ctx.fillStyle = _prGrad;
          ctx.fillText('PR', listX + listW - 78, ry - 4);
        }

        ry += 70;
        index += 1;
      });
      ry += 8;
    });
  }

  // Separator rule
  ctx.strokeStyle = 'rgba(84,255,171,.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(70, H - 52); ctx.lineTo(W - 70, H - 52); ctx.stroke();
  // Footer text with diamond
  ctx.fillStyle = 'rgba(211,228,216,.58)';
  ctx.font = '500 18px "DM Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('\u25C6 Built with FORGE | #ForgeSession | ' + new Date().toISOString().slice(0, 10), W - 70, H - 28);
  ctx.textAlign = 'left';

  return canvas;
}

async function renderSessionSharePreview(summaryOverride = null) {
  const source = await _drawSessionShareCard(summaryOverride);
  const target = _getSessionShareCanvas();
  if (!source || !target) return null;
  const ctx = target.getContext('2d');
  if (!ctx) return null;
  target.width = source.width;
  target.height = source.height;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
  return target;
}

async function _ensureSessionShareCanvas(summaryOverride = null) {
  const rendered = await renderSessionSharePreview(summaryOverride);
  if (rendered) return rendered;
  return await _drawSessionShareCard(summaryOverride);
}

async function shareSession() {
  const canvas = await _ensureSessionShareCanvas();
  if (!canvas) {
    if (navigator.share) {
      navigator.share({ title: 'FORGE Session', text: _sessionShareText }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(_sessionShareText || 'FORGE session completed')
      .then(() => showToast('Copied session text', 'var(--accent)'))
      .catch(() => showToast('Session complete', 'var(--accent)'));
    return;
  }

  const blob = await _canvasToBlob(canvas);
  if (!blob) return;
  const file = new File([blob], _sessionShareName(), { type: 'image/png' });
  const canShareFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));

  if (navigator.share && canShareFile) {
    try {
      await navigator.share({
        title: 'FORGE Session',
        text: 'Session complete. Built with FORGE.',
        files: [file]
      });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }

  _downloadBlob(blob, _sessionShareName());
  if (typeof showToast === 'function') showToast('Session image downloaded', 'var(--accent)');
}

async function downloadSessionCard() {
  const canvas = await _ensureSessionShareCanvas();
  if (!canvas) {
    if (typeof showToast === 'function') showToast('No session data to export', 'var(--warn)');
    return;
  }
  const blob = await _canvasToBlob(canvas);
  if (!blob) return;
  _downloadBlob(blob, _sessionShareName());
  if (typeof showToast === 'function') showToast('Session image ready to save', 'var(--accent)');
}

function downloadShareCard() {
  const canvas = document.getElementById('share-canvas');
  if (!canvas) return;
  canvas.toBlob(blob => {
    if (!blob) return;
    _downloadBlob(blob, 'my-forge-' + new Date().toISOString().slice(0, 10) + '.png');
  }, 'image/png');
}

function _getSessionSummaryForDate(isoDate) {
  // 1. Check localStorage for a stored summary (most recent match wins)
  const prefix = 'forge_session_' + isoDate + '_';
  const matchingKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) matchingKeys.push(k);
  }
  if (matchingKeys.length) {
    matchingKeys.sort().reverse(); // descending → most recent first
    try { return JSON.parse(localStorage.getItem(matchingKeys[0])); } catch (e) {}
  }

  // 2. Reconstruct from workouts array (fallback for old sessions)
  const allW = typeof workouts !== 'undefined' ? workouts : [];
  const dayW = allW.filter(w => {
    const d = new Date(w.date || w.id);
    return !isNaN(d) && d.toISOString().slice(0, 10) === isoDate;
  });
  if (!dayW.length) return null;

  const muscles = [...new Set(dayW.map(w => w.muscle).filter(Boolean))];
  const logs = dayW.map(w => ({
    exercise: w.exercise || '',
    muscle: w.muscle || '',
    mode: 'weighted',
    sets: Array.isArray(w.sets) ? w.sets : [],
    volume: w.totalVolume || 0,
    isPR: !!(w.isPR || w.pr)
  }));
  const totalSets = dayW.reduce((a, w) => a + (Array.isArray(w.sets) ? w.sets.length : 0), 0);
  const totalVol  = dayW.reduce((a, w) => a + (w.totalVolume || 0), 0);
  const prCount   = dayW.filter(w => w.isPR || w.pr).length;
  const d = new Date(isoDate + 'T12:00:00');
  return {
    dateStr: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    timeStr: '--:--',
    durStr:  '--:--',
    muscles,
    logs,
    totalSets,
    totalVol,
    totalBwReps:      0,
    totalCardioMins:  0,
    prCount
  };
}

async function previewSessionFromHistory(isoDate) {
  const summary = _getSessionSummaryForDate(isoDate);
  if (!summary) {
    if (typeof showToast === 'function') showToast('No session data for this date', 'var(--warn)');
    return;
  }
  const canvas = await _drawSessionShareCard(summary);
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const existing = document.getElementById('forge-poster-preview-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'forge-poster-preview-modal';
  modal.innerHTML = `
    <div class="fpp-backdrop" onclick="document.getElementById('forge-poster-preview-modal').remove()"></div>
    <div class="fpp-sheet">
      <div class="fpp-toolbar">
        <span class="fpp-title">Session Poster</span>
        <button class="fpp-close" onclick="document.getElementById('forge-poster-preview-modal').remove()">&#x2715;</button>
      </div>
      <div class="fpp-img-wrap">
        <img class="fpp-img" src="${dataUrl}" alt="Session poster">
      </div>
      <div class="fpp-actions">
        <button class="fpp-download-btn" onclick="_forgePosterDownload('${isoDate}',document.querySelector('#forge-poster-preview-modal .fpp-img').src)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Poster
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function _forgePosterDownload(isoDate, dataUrl) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'forge-session-' + isoDate + '.png';
  a.click();
}

async function shareSessionFromHistory(isoDate) {
  const summary = _getSessionSummaryForDate(isoDate);
  if (!summary) {
    if (typeof showToast === 'function') showToast('No session data for this date', 'var(--warn)');
    return;
  }
  const canvas = await _drawSessionShareCard(summary);
  if (!canvas) return;
  const blob = await _canvasToBlob(canvas);
  if (!blob) return;
  const fname = 'forge-session-' + isoDate + '.png';
  const file = new File([blob], fname, { type: 'image/png' });
  const canShareFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  if (navigator.share && canShareFile) {
    try { await navigator.share({ title: 'FORGE Session', text: 'Session complete. Built with FORGE.', files: [file] }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  _downloadBlob(blob, fname);
  if (typeof showToast === 'function') showToast('Session poster ready', 'var(--accent)');
}
