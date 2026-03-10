function shareSession() {
  if (navigator.share) {
    navigator.share({ title: 'FORGE Session', text: _sessionShareText }).catch(() => {});
  } else {
    navigator.clipboard.writeText(_sessionShareText).then(() => {
      showToast('Copied to clipboard!', 'var(--accent)');
    }).catch(() => showToast(_sessionShareText.split('\n')[0], 'var(--accent)'));
  }
}

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

function downloadShareCard() {
  const canvas = document.getElementById('share-canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'my-forge-' + new Date().toISOString().slice(0, 10) + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
