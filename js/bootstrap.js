// FORGE Gym Tracker - lightweight runtime bootstrap hooks
// Extracted from small inline scripts in index.html.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(reg => {
        console.log('[FORGE SW] Registered:', reg.scope);
        // Force an immediate update check so new versions are picked up
        // without waiting for the browser's 24-hour polling interval.
        reg.update();

        // When a new SW finishes installing, skip waiting so it activates now.
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed and an old one was in control — reload to apply.
              console.log('[FORGE SW] New version detected — reloading');
              window.location.reload();
            }
          });
        });
      })
      .catch(() => console.log('[FORGE SW] Not available (local file mode)'));

    // Also reload if the controller changes mid-session (skipWaiting fired).
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
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
