// Service Worker for Hardness Diary PWA
// Optimized for mobile with offline-first strategy

const CACHE_VERSION = 'v8';
const CACHE_NAME = `hardness-diary-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;
const DATA_CACHE = `${CACHE_NAME}-data`;

// Core app assets - must be available offline
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// External dependencies to cache
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com'
];

// IndexedDB setup for dynamic caching
const DB_NAME = 'HardnessDiarySW';
const DB_VERSION = 1;

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        return caches.open(STATIC_CACHE);
      })
      .then((cache) => {
        // Cache external assets with CORS mode
        const externalRequests = EXTERNAL_ASSETS.map(url => {
          return fetch(url, { mode: 'cors', cache: 'reload' })
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch(err => console.warn('[SW] Failed to cache external:', url, err));
        });
        return Promise.allSettled(externalRequests);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('hardness-diary-') && !name.includes(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome extensions and non-http requests
  if (!url.protocol.startsWith('http')) return;
  
  // Strategy 1: Network First for API/data requests
  if (url.pathname.startsWith('/api/') || request.headers.get('Accept')?.includes('application/json')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }
  
  // Strategy 2: Cache First for images
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
  
  // Strategy 3: Stale While Revalidate for static assets
  if (url.pathname.match(/\.(js|css|woff|woff2)$/)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Strategy 4: Network First with offline fallback for navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
        .catch(() => new Response('Offline - App not cached', { status: 503 }))
    );
    return;
  }
  
  // Strategy 5: Cache First for external CDN resources
  if (EXTERNAL_ASSETS.some(asset => url.href.includes(asset))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Default: Network First
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// Network First strategy - tries network, falls back to cache
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First strategy - returns cache if available
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Refresh cache in background for next time
    caches.open(cacheName).then(cache => {
      fetch(request).then(response => {
        if (response.ok) cache.put(request, response);
      }).catch(() => {});
    });
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a fallback image if available
    if (request.destination === 'image') {
      return caches.match('/icons/icon-192x192.png');
    }
    throw error;
  }
}

// Stale While Revalidate - return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncLogs());
  }
});

async function syncLogs() {
  console.log('[SW] Background sync triggered');
  // Logic for syncing pending logs when back online
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      timestamp: Date.now()
    });
  });
}

// Push notifications (placeholder for future)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '硬度日记', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Message handling from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(DATA_CACHE).then(cache => {
        return Promise.all(
          urls.map(url => fetch(url).then(res => cache.put(url, res)))
        );
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(syncLogs());
  }
});

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
