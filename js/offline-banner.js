// FORGE Offline Banner
// Subtle status pill that surfaces three states:
//   1) Device is offline (navigator.offline)
//   2) User is in cached-login mode (offline auth verified but Supabase unreachable)
//   3) Sync queue has pending writes (drains when service returns)
// Disappears when fully online + queue empty. Auto-shows a brief "✓ Synced"
// flash after the last queued item drains.

(function () {
  'use strict';

  const SYNC_QUEUE_KEY = 'forge_sync_queue_v1';
  const OFFLINE_USER_KEY = 'forge_offline_user';

  const banner = document.createElement('div');
  banner.id = 'forge-offline-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.style.cssText = [
    'position:fixed',
    'top:calc(env(safe-area-inset-top,0px) + 8px)',
    'left:50%',
    'transform:translateX(-50%) translateY(-160%)',
    'z-index:10001',
    'pointer-events:none',
    'background:rgba(14,18,15,0.94)',
    'border:1px solid rgba(255,170,60,0.5)',
    'color:#ffd089',
    'padding:6px 14px',
    'border-radius:999px',
    'font-family:"DM Mono",monospace',
    'font-size:0.7rem',
    'letter-spacing:1.2px',
    'text-transform:uppercase',
    'box-shadow:0 4px 14px rgba(0,0,0,0.45)',
    '-webkit-backdrop-filter:blur(8px)',
    'backdrop-filter:blur(8px)',
    'transition:transform .32s cubic-bezier(.22,1,.36,1), opacity .25s, border-color .25s, color .25s, background-color .25s',
    'opacity:0',
    'white-space:nowrap',
    'max-width:92vw',
    'overflow:hidden',
    'text-overflow:ellipsis'
  ].join(';');

  function mount() {
    if (!banner.parentNode) document.body.appendChild(banner);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mount(); update(); }, { once: true });
  } else {
    mount();
  }

  let lastShownText = '';
  let lastQueue = 0;
  let flashTimer = null;

  function getQueueSize() {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? (JSON.parse(raw).length || 0) : 0;
    } catch { return 0; }
  }

  function getOfflineUser() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_USER_KEY) || 'null'); }
    catch { return null; }
  }

  function setStyle(border, color) {
    banner.style.borderColor = border;
    banner.style.color = color;
  }

  function show(text, border, color) {
    setStyle(border, color);
    if (text !== lastShownText) {
      banner.textContent = text;
      lastShownText = text;
    }
    banner.style.transform = 'translateX(-50%) translateY(0)';
    banner.style.opacity = '1';
  }

  function hide() {
    banner.style.transform = 'translateX(-50%) translateY(-160%)';
    banner.style.opacity = '0';
    lastShownText = '';
  }

  function update() {
    if (!banner.parentNode) mount();
    const online = navigator.onLine;
    const queue = getQueueSize();
    const offlineUser = getOfflineUser();

    // Detect "queue just emptied while online" → brief success flash
    if (online && lastQueue > 0 && queue === 0 && !offlineUser) {
      if (flashTimer) clearTimeout(flashTimer);
      show('✓ Synced', 'rgba(57,255,143,0.55)', '#9cf2bf');
      flashTimer = setTimeout(() => { hide(); flashTimer = null; }, 1800);
      lastQueue = 0;
      return;
    }
    lastQueue = queue;

    if (!online) {
      show('Offline — saving locally', 'rgba(255,170,60,0.55)', '#ffd089');
      return;
    }
    if (offlineUser) {
      show('Cached login — sync paused', 'rgba(255,170,60,0.5)', '#ffd089');
      return;
    }
    if (queue > 0) {
      show(`Syncing ${queue} item${queue > 1 ? 's' : ''}…`, 'rgba(57,255,143,0.45)', '#9cf2bf');
      return;
    }
    if (!flashTimer) hide();
  }

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  window.addEventListener('forge:offline-auth', update);
  window.addEventListener('forge:sync-queue-changed', update);
  window.addEventListener('forge:sync-drained', update);
  // Backstop in case any source forgets to emit
  setInterval(update, 5000);
})();
