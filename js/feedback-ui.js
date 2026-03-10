// FORGE Gym Tracker - toast and confirm modal helpers
// Extracted from index.html as part of modularization.

let _toastTimer = null;
function showToast(msg, type) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  // type: 'success'|'warn'|'error' or legacy raw CSS color string
  let icon = '';
  let bg = '';
  let fg = '';
  if (!type || type === 'success') {
    icon = '✓ ';
    bg = '';
    fg = '';
  } else if (type === 'warn') {
    icon = '⚠ ';
    bg = 'var(--warn)';
    fg = '#000';
  } else if (type === 'error') {
    icon = '✕ ';
    bg = 'var(--danger)';
    fg = '#fff';
  } else {
    // legacy: raw color value passed directly
    icon = '';
    bg = type;
    fg = '#fff';
  }
  toastEl.textContent = icon + msg;
  toastEl.style.background = bg;
  toastEl.style.color = fg;
  toastEl.classList.remove('show', 'dismiss');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('show'), 5000);
}

function dismissToast() {
  const toastEl = document.getElementById('toast');
  if (!toastEl || !toastEl.classList.contains('show')) return;
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  toastEl.classList.remove('show');
  toastEl.classList.add('dismiss');
  // Soft dismiss pop sound
  if (typeof soundOn !== 'undefined' && soundOn) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }
  setTimeout(() => toastEl.classList.remove('dismiss'), 250);
}

let _confirmCallback = null;
function showConfirm(title, msg, onConfirm) {
  const overlay = document.getElementById('confirm-modal');
  if (!overlay) { if (onConfirm && confirm(msg)) onConfirm(); return; }
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  const okBtn = document.getElementById('confirm-btn-ok');
  _confirmCallback = onConfirm;
  okBtn.onclick = () => { hideConfirm(); if (_confirmCallback) _confirmCallback(); };
  overlay.classList.add('open');
}

function hideConfirm() {
  const overlay = document.getElementById('confirm-modal');
  if (overlay) overlay.classList.remove('open');
  _confirmCallback = null;
}

function _confirmOverlayClick(e) {
  if (e.target === document.getElementById('confirm-modal')) hideConfirm();
}
