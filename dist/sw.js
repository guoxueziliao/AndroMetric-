
const CACHE_NAME = 'hardness-diary-cache-v7';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // App dependencies from importmap
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^18.3.1',
  'https://aistudiocdn.com/react-dom@^18.3.1/',
  'https://aistudiocdn.com/react@^18.3.1/',
  'https://aistudiocdn.com/lucide-react@0.344.0',
  'https://aistudiocdn.com/chart.js@^4.4.3/+esm',
  'https://aistudiocdn.com/marked@^13.0.2',
  'https://aistudiocdn.com/react-chartjs-2@^5.3.1'
];

// Install event: caches the core assets.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use { cache: 'reload' } to bypass browser cache for dependencies during install
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
  );
  self.skipWaiting(); // Force activation
});

// Fetch event: Network First for local, Cache First for external
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === location.origin;

  // SPA Navigation Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Local Assets: Network First -> Cache
  // Ensures user gets latest version of app code when online
  if (isLocal) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Check for valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // External/CDN Assets: Cache First -> Network
  // Improves performance for libraries
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          networkResponse => {
            // Allow cors responses for CDNs
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            return networkResponse;
          }
        ).catch(err => console.error('Fetch failed for external asset:', err));
      })
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});
