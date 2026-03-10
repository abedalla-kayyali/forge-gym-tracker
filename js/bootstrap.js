// FORGE Gym Tracker - lightweight runtime bootstrap hooks
// Extracted from small inline scripts in index.html.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('[FORGE SW] Registered:', reg.scope))
      .catch(() => console.log('[FORGE SW] Not available (local file mode)'));
  });
}

// Safety net: clear scroll lock if no overlay is actually visible.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const anyOpen = document.querySelector(
      '#wend-overlay[style*="flex"], .muscle-overlay.open, #muscle-detail-modal.open'
    );
    if (!anyOpen) document.body.classList.remove('scroll-locked');
  }
});
