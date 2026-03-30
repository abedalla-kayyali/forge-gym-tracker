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
  const H = Math.max(1350, 824 + listBaseH + 70);
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
  ctx.fillStyle = 'rgba(221,240,227,.92)';
  ctx.font = '700 24px "Barlow Condensed", sans-serif';
  ctx.fillText('ATHLETE: ' + athleteName, 720, 96);

  const streakVal = typeof calcStreak === 'function' ? calcStreak() : 0;
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
  const leftW = 360;
  const leftH = 420;
  ctx.fillStyle = 'rgba(13,24,18,.92)';
  _roundRect(ctx, leftX, leftY, leftW, leftH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(84,255,171,.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#54ffab';
  ctx.font = '600 20px "DM Mono", monospace';
  ctx.fillText('BODY MAP', leftX + 18, leftY + 34);

  if (typeof _buildSessionBodyMapSVG === 'function') {
    const muscles = new Set(Array.isArray(s.muscles) ? s.muscles : []);
    const frontSvg = _buildSessionBodyMapSVG(muscles, 'front') || '';
    const backSvg = _buildSessionBodyMapSVG(muscles, 'back') || '';
    const frontImg = await _svgMarkupToImage(frontSvg);
    const backImg = await _svgMarkupToImage(backSvg);
    if (frontImg) ctx.drawImage(frontImg, leftX + 18, leftY + 46, 160, 320);
    if (backImg)  ctx.drawImage(backImg,  leftX + 192, leftY + 46, 160, 320);

    ctx.strokeStyle = 'rgba(84,255,171,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(leftX + 18, leftY + 378); ctx.lineTo(leftX + 58, leftY + 378); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(leftX + 192, leftY + 378); ctx.lineTo(leftX + 232, leftY + 378); ctx.stroke();

    ctx.fillStyle = 'rgba(190,214,196,.85)';
    ctx.font = '600 16px "DM Mono", monospace';
    ctx.fillText('FRONT', leftX + 28, leftY + 393);
    ctx.fillText('BACK', leftX + 202, leftY + 393);
  }

  const rightX = 450;
  const rightY = 372;
  const rightW = 600;
  const rightH = 420;
  ctx.fillStyle = 'rgba(13,24,18,.92)';
  _roundRect(ctx, rightX, rightY, rightW, rightH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(84,255,171,.28)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#54ffab';
  ctx.font = '600 20px "DM Mono", monospace';
  ctx.fillText('SESSION OUTPUT', rightX + 20, rightY + 34);

  const out = [];
  if (Number(s.totalVol) > 0) out.push('Weighted volume: ' + _fmtNum(s.totalVol));
  if (Number(s.totalBwReps) > 0) out.push('Bodyweight reps: ' + _fmtNum(s.totalBwReps));
  if (Number(s.totalCardioMins) > 0) out.push('Cardio: ' + _fmtNum(s.totalCardioMins) + ' min');
  if (!out.length) out.push('No measurable output captured');
  ctx.fillStyle = '#f0faf2';
  ctx.font = '600 30px "Barlow Condensed", sans-serif';
  let yy = rightY + 74;
  for (let i = 0; i < out.length && i < 3; i++) {
    ctx.fillText(out[i], rightX + 20, yy);
    yy += 36;
  }

  const musclesText = (Array.isArray(s.muscles) && s.muscles.length)
    ? s.muscles.join(', ')
    : 'No specific muscles tracked';
  ctx.fillStyle = '#9df8c8';
  ctx.font = '700 18px "DM Mono", monospace';
  ctx.fillText('MUSCLES TRAINED', rightX + 20, rightY + 171);
  ctx.fillStyle = 'rgba(190,214,196,.88)';
  ctx.font = '500 18px "Barlow", sans-serif';
  const wrappedMuscles = _wrapText(ctx, musclesText, rightW - 40);
  let my = rightY + 196;
  for (let i = 0; i < wrappedMuscles.length && i < 3; i++) {
    ctx.fillText(wrappedMuscles[i], rightX + 20, my);
    my += 24;
  }

  const prItems = (s.logs || []).filter(l => l && l.isPR).map(l => l.exercise || l.activity || 'PR');
  if ((s.prCount || 0) > 0) {
    ctx.shadowColor = 'rgba(255,180,0,0.5)';
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = (s.prCount || 0) > 0 ? 'rgba(255,214,102,.18)' : 'rgba(44,58,47,.85)';
  _roundRect(ctx, rightX + 18, rightY + 288, rightW - 36, 112, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = (s.prCount || 0) > 0 ? 'rgba(255,214,102,.45)' : 'rgba(90,110,96,.28)';
  ctx.stroke();

  ctx.fillStyle = (s.prCount || 0) > 0 ? '#ffd666' : 'rgba(190,214,196,.74)';
  ctx.font = '600 18px "DM Mono", monospace';
  ctx.fillText((s.prCount || 0) > 0 ? ('PR HITS | ' + s.prCount) : 'PR HITS | 0', rightX + 34, rightY + 320);

  ctx.fillStyle = 'rgba(239,247,241,.95)';
  ctx.font = '600 23px "Barlow Condensed", sans-serif';
  const prRawText = prItems.length ? prItems.join(' | ') : 'No PR this session';
  const prWrapped = _wrapText(ctx, prRawText, rightW - 68);
  let prY = rightY + 352;
  for (let pi = 0; pi < Math.min(prWrapped.length, 3); pi++) {
    ctx.fillText(prWrapped[pi], rightX + 34, prY);
    prY += 26;
  }

  const listX = 70;
  const listY = 824;
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
