const CACHE_NAME = 'county-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force activate immediately (don't wait for old SW to finish)
  self.skipWaiting();
});

// Activate event - clean ALL old caches aggressively
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - network first with SPA navigation fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests - always go to network
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  // Skip tRPC requests
  if (url.pathname.startsWith('/trpc/')) return;

  // NAVIGATION REQUESTS (page loads, refreshes, direct URL access)
  // Always try network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: return cached index.html for ALL navigation requests
          // This ensures SPA routing works offline
          return caches.match('/').then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              '<!DOCTYPE html><html><body><h1>Offline</h1><p>County membutuhkan koneksi internet. Silakan coba lagi.</p></body></html>',
              { status: 503, headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }

  // STATIC ASSETS (JS, CSS, images, fonts)
  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
