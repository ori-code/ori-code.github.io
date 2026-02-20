const CACHE_NAME = 'achordim-v47';
const PADS_CACHE = 'achordim-pads-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles-bw.css',
  './app.js',
  './auth.js',
  './theme.js',
  './firebase-config.js',
  './chordpro-parser.js',
  './live-mode.js',
  './metronome.js',
  './midi-controller.js',
  './pad-player.js',
  './session-manager.js',
  './session-ui.js',
  './song-library.js',
  './song-search-filter.js',
  './subscription.js',
  './paypal-subscription.js',
  './offline-store.js',
  './js/translations.js',
  './js/localization.js',
  './achordim-icon-app.svg',
  './achordim-icon.svg',
  './achordim-logo.svg',
  './achordim-logo-full.svg',
  './manifest.json'
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches (preserve pads cache)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== PADS_CACHE)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API/Firebase, cache-first for app shell and pads
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Cache-first for pad audio (large MP3 files, never change)
  // Uses separate cache so pads survive app version bumps
  if (url.pathname.includes('/pads/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(PADS_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Network-first for Firebase, CDN scripts, and API calls
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cdnjs') ||
    url.hostname.includes('paypal')
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for local app files
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          // Return cache, but also update in background
          fetch(event.request).then(response => {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
          }).catch(() => {});
          return cached;
        }
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
  );
});
