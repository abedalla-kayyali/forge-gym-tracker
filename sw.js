// FORGE Gym Tracker - Service Worker
// Bump version to force cache refresh after updates
const CACHE_NAME = 'forge-v187';

const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './css/main.css',
  './js/config.js',
  './js/bootstrap.js',
  './js/coach-state.js',
  './js/dashboard-history.js',
  './js/social-ui.js',
  './js/supabase-client.js',
  './js/auth-ui.js',
  './js/sync.js',
  './js/exercises.js',
  './js/workout-save.js',
  './js/i18n.js',
  './js/fx-haptic.js',
  './js/inbody-log.js',
  './js/body-measurements.js',
  './js/overload-engine.js',
  './js/goal-dashboard.js',
  './data/form-inspector-media.json'
];

// CDN assets to cache opportunistically on install.
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];
const FREE_EXERCISE_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FREE_EXERCISE_MEDIA_PATH = '/yuhonas/free-exercise-db/main/exercises/';
const WORKOUT_DATA_CACHE = 'forge-workout-data-v1';
const WORKOUT_MEDIA_CACHE = 'forge-workout-media-v1';

// INSTALL: pre-cache core files + CDN assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[FORGE SW] Caching core assets');
      const corePromise = Promise.allSettled(CORE_ASSETS.map(url => cache.add(url)));
      const cdnPromise = Promise.allSettled(
        CDN_ASSETS.map(url =>
          fetch(url, { cache: 'reload' }).then(r => {
            if (r.ok) cache.put(url, r);
          })
        )
      );
      return Promise.all([corePromise, cdnPromise]);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: clean up old caches, claim clients, reload windows
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)
            .map(k => {
              console.log('[FORGE SW] Removing old cache:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
            console.log('[FORGE SW] Reloading client:', client.url);
            client.navigate(client.url);
          });
        })
      )
  );
});

// FETCH strategy:
// - Network-first for app shell and version-critical assets to avoid stale lock.
// - Cache-first for other same-origin files.
// - Network-first with cache fallback for external CDN.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Food search — always network-only, return empty results when offline
  if (url.pathname.includes('/functions/v1/food-search')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ results: [] }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }
  const accept = event.request.headers.get('accept') || '';
  const isNavigation = event.request.mode === 'navigate' || accept.includes('text/html');
  const path = url.pathname || '';
  const isAppCodeAsset =
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.html') ||
    path.endsWith('.json');
  if (event.request.url === FREE_EXERCISE_JSON_URL) {
    event.respondWith(
      caches.open(WORKOUT_DATA_CACHE).then(cache => {
        const cachedResponse = cache.match(event.request);
        const networkResponse = fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);
        return cachedResponse.then(res => res || networkResponse).then(res => res || new Response('', { status: 503 }));
      })
    );
    return;
  }
  if (url.origin === 'https://raw.githubusercontent.com' && url.pathname.startsWith(FREE_EXERCISE_MEDIA_PATH)) {
    event.respondWith(
      caches.open(WORKOUT_MEDIA_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  const isCriticalAsset =
    path.endsWith('/index.html') ||
    path.endsWith('/manifest.json') ||
    path.endsWith('/js/config.js') ||
    path.endsWith('/js/coach-state.js') ||
    path.endsWith('/js/dashboard-history.js') ||
    path.endsWith('/js/social-ui.js') ||
    path.endsWith('/js/bootstrap.js') ||
    path.endsWith('/sw.js');

  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(cached => cached || new Response('', { status: 503 }))
      )
    );
    return;
  }

  if (isNavigation || isCriticalAsset || isAppCodeAsset) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(cached => {
            if (cached) return cached;
            if (isNavigation) return caches.match('./index.html');
            return new Response('', { status: 503 });
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => new Response('', { status: 503 }));
    })
  );
});
