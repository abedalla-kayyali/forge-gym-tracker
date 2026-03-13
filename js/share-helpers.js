function closeSessionSummary() {
  const overlay = document.getElementById('wend-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.classList.remove('scroll-locked');
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

  // iOS Safari often ignores `download`, so open in new tab for long-press save.
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

function _drawSessionShareCard() {
  const s = (typeof _lastSessionSummary !== 'undefined' && _lastSessionSummary) || null;
  if (!s) return null;

  const canvas = document.createElement('canvas');
  const W = 1080, H = 1350; // social-friendly portrait format
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#07110b');
  bg.addColorStop(0.65, '#0b1a10');
  bg.addColorStop(1, '#060d08');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient glow
  const glow = ctx.createRadialGradient(W * 0.2, H * 0.2, 20, W * 0.2, H * 0.2, 380);
  glow.addColorStop(0, 'rgba(57,255,143,.22)');
  glow.addColorStop(1, 'rgba(57,255,143,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#39ff8f';
  ctx.font = '700 44px "Bebas Neue", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('FORGE SESSION COMPLETE', 72, 110);

  ctx.fillStyle = 'rgba(234,244,235,.72)';
  ctx.font = '500 24px "DM Mono", monospace';
  ctx.fillText((s.dateStr || '') + '  آ·  ' + (s.timeStr || ''), 72, 154);

  const streakVal = (typeof calcStreak === 'function') ? calcStreak() : 0;
  const cards = [
    { label: 'DURATION', value: s.durStr || '00:00' },
    { label: 'ENTRIES', value: String((s.logs || []).length) },
    { label: 'SETS', value: String(s.totalSets || 0) },
    { label: 'PRS', value: String(s.prCount || 0) },
    { label: 'STREAK', value: String(streakVal) + 'D' }
  ];

  let x = 72;
  const y = 200;
  const cw = 188;
  const ch = 140;
  cards.forEach(card => {
    ctx.fillStyle = 'rgba(20,30,22,.95)';
    _roundRect(ctx, x, y, cw, ch, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,143,.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(122,158,126,.95)';
    ctx.font = '500 18px "DM Mono", monospace';
    ctx.fillText(card.label, x + 18, y + 40);
    ctx.fillStyle = '#eaf4eb';
    ctx.font = '700 42px "Barlow Condensed", sans-serif';
    ctx.fillText(card.value, x + 18, y + 98);
    x += cw + 20;
  });

  const lines = [];
  if (s.totalVol > 0) lines.push('Weighted Volume: ' + Math.round(s.totalVol).toLocaleString() + ' kg');
  if (s.totalBwReps > 0) lines.push('Bodyweight Reps: ' + s.totalBwReps);
  if (s.totalCardioMins > 0) lines.push('Cardio Time: ' + s.totalCardioMins + ' min');
  if (!lines.length) lines.push('No measurable output captured');

  const muscles = (s.muscles && s.muscles.length) ? s.muscles.join(', ') : 'No specific muscles tracked';

  ctx.fillStyle = 'rgba(20,30,22,.94)';
  _roundRect(ctx, 72, 380, W - 144, 190, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,143,.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#39ff8f';
  ctx.font = '600 22px "DM Mono", monospace';
  ctx.fillText('SESSION OUTPUT', 100, 424);
  ctx.fillStyle = '#c8dcc9';
  ctx.font = '500 28px "Barlow", sans-serif';
  ctx.fillText(lines.join('  آ·  '), 100, 470);
  ctx.fillStyle = 'rgba(234,244,235,.78)';
  ctx.font = '500 22px "Barlow", sans-serif';
  ctx.fillText('Muscles: ' + muscles, 100, 512);

  const top = (s.logs || []).slice(0, 6);
  ctx.fillStyle = 'rgba(20,30,22,.94)';
  _roundRect(ctx, 72, 610, W - 144, 590, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,143,.16)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#39ff8f';
  ctx.font = '600 22px "DM Mono", monospace';
  ctx.fillText('SESSION BREAKDOWN', 100, 654);
  ctx.fillStyle = 'rgba(234,244,235,.9)';
  ctx.font = '600 28px "Barlow Condensed", sans-serif';
  if (!top.length) {
    ctx.fillText('No entries logged in this session', 100, 704);
  } else {
    let yy = 706;
    top.forEach((l, idx) => {
      const tag = l.mode === 'weighted' ? 'W' : l.mode === 'bodyweight' ? 'BW' : 'CARDIO';
      const title = (idx + 1) + '. ' + (l.exercise || l.activity || 'Entry');
      let meta = '';
      if (l.mode === 'weighted') {
        meta = ((l.sets || []).length) + ' sets';
        if (l.volume > 0) meta += '  آ·  ' + Math.round(l.volume).toLocaleString() + ' kg';
      } else if (l.mode === 'bodyweight') {
        meta = ((l.sets || []).length) + ' sets';
        if (l.totalReps > 0) meta += '  آ·  ' + l.totalReps + ' reps';
      } else {
        meta = (l.durationMins || 0) + ' min';
        if (l.calories) meta += '  آ·  ' + l.calories + ' kcal';
      }
      if (l.isPR) meta += '  آ·  PR';

      ctx.fillStyle = 'rgba(234,244,235,.95)';
      ctx.font = '600 28px "Barlow Condensed", sans-serif';
      ctx.fillText(title + ' [' + tag + ']', 100, yy);
      ctx.fillStyle = 'rgba(200,220,201,.7)';
      ctx.font = '500 20px "Barlow", sans-serif';
      ctx.fillText(meta, 100, yy + 30);
      yy += 78;
    });
  }

  ctx.fillStyle = 'rgba(234,244,235,.55)';
  ctx.font = '500 18px "DM Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Built with FORGE  ·  #ForgeSession  ·  ' + new Date().toISOString().slice(0, 10), W - 72, H - 40);
  ctx.textAlign = 'left';

  return canvas;
}

function renderSessionSharePreview() {
  const source = _drawSessionShareCard();
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

async function shareSession() {
  const canvas = renderSessionSharePreview() || _drawSessionShareCard();
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
  const canvas = renderSessionSharePreview() || _drawSessionShareCard();
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

