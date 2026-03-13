// FORGE Gym Tracker — Service Worker
// Bump version to force cache refresh after updates
const CACHE_NAME = 'forge-v61';

const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './css/main.css',
  './js/config.js',
  './js/supabase-client.js',
  './js/auth-ui.js',
  './js/sync.js',
  './js/exercises.js',
  './js/i18n.js',
  './js/fx-haptic.js'
];

// CDN assets to cache opportunistically on install.
// These are network-only at runtime but cached here so they survive offline
// after the first online load. Use Promise.allSettled so one failure doesn't
// block the rest of the install.
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

// ── INSTALL: pre-cache core files + CDN assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[FORGE SW] Caching core assets');
      const corePromise = Promise.allSettled(CORE_ASSETS.map(url => cache.add(url)));
      // Cache CDN assets (Chart.js) so charts work offline after first load.
      // allSettled so a CDN timeout doesn't break the install.
      const cdnPromise  = Promise.allSettled(CDN_ASSETS.map(url =>
        fetch(url, { cache: 'reload' }).then(r => { if (r.ok) cache.put(url, r); })
      ));
      return Promise.all([corePromise, cdnPromise]);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean up old caches, then reload all open clients ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => {
            console.log('[FORGE SW] Removing old cache:', k);
            return caches.delete(k);
          })
        )
      )
      .then(() => self.clients.claim())
      .then(() =>
        // Force every open window to reload so it picks up the fresh cache.
        // This breaks the "old bootstrap.js doesn't reload on controllerchange"
        // deadlock — the SW itself triggers the reload after taking control.
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clients => {
            clients.forEach(client => {
              console.log('[FORGE SW] Reloading client:', client.url);
              client.navigate(client.url);
            });
          })
      )
  );
});

// ── FETCH: cache-first for same-origin, network-only for CDN ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // External CDN resources: network-first, fall back to cache (Chart.js), then 503.
  // Chart.js is pre-cached on install so it works offline after first load.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fonts and other uncached CDN resources degrade gracefully offline
          return new Response('', { status: 503 });
        })
      )
    );
    return;
  }

  // For same-origin files: cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // If fetch fails and nothing in cache, return a minimal offline shell
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
