/**
 * service-worker.js
 * CarIQ PWA Service Worker
 *
 * Strategy: Cache-First for static assets, Network-First for API calls
 *
 * Cache-First: HTML, CSS, JS, images → serve from cache instantly,
 *              update cache in background
 * Network-First: API calls → try network first, fallback to cache
 *              if offline
 *
 * This allows CarIQ to work on showroom floors with poor WiFi.
 */

const CACHE_NAME     = 'cariq-v1.0.1';
const API_CACHE_NAME = 'cariq-api-v1.0.1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/home.html',
  '/customers.html',
  '/leads.html',
  '/transactions.html',
  '/dashboard.html',
  '/login.html',
  '/register.html',
  '/dealer.html',
  '/analyst.html',
  '/reports.html',
  '/offline.html',
  '/style.css',
  '/app.js',
  '/socket-client.js',
  '/manifest.json',
];

// API endpoints to cache for offline use
const CACHE_API_PATTERNS = [
  '/api/vehicles',
  '/api/customers/count',
  '/api/leads/count',
  '/health',
];

// ── Install Event ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing CarIQ Service Worker v1.0.1');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(
          STATIC_ASSETS.filter(url => {
            try { new URL(url, self.location.origin); return true; }
            catch { return false; }
          })
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install error:', err))
  );
});

// ── Activate Event ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating CarIQ Service Worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      self.clients.claim(),
    ])
  );
});

// ── Fetch Event ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url         = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (socket.io CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // API calls — Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets — Cache First
  event.respondWith(cacheFirstStrategy(request));
});

// ── Cache First Strategy ──────────────────────────────────────
async function cacheFirstStrategy(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      // Return cached version, update in background
      updateCacheInBackground(request);
      return cached;
    }

    // Not in cache — fetch from network
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;

  } catch (err) {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // For HTML pages — return offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

// ── Network First Strategy ────────────────────────────────────
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (response.ok) {
      const shouldCache = CACHE_API_PATTERNS.some(pattern =>
        request.url.includes(pattern)
      );
      if (shouldCache) {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, response.clone());
      }
    }
    return response;

  } catch (err) {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving API from cache (offline):', request.url);
      return cached;
    }

    // Return offline JSON for API calls
    return new Response(
      JSON.stringify({
        success: false,
        error:   'You are offline. Please check your connection.',
        offline: true,
      }),
      {
        status:  503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ── Background Cache Update ───────────────────────────────────
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch {
    // Silently fail background updates
  }
}

// ── Push Notification Handler ─────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body:    data.body || 'CarIQ Alert',
    icon:    '/icons/icon-192.svg',
    badge:   '/icons/icon-72.svg',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/dashboard.html' },
    actions: [
      { action: 'view',   title: '👁️ View' },
      { action: 'dismiss',title: '✕ Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CarIQ', options)
  );
});

// ── Notification Click Handler ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ── Sync Handler (Background Sync) ───────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-leads') {
    event.waitUntil(syncPendingLeads());
  }
});

async function syncPendingLeads() {
  console.log('[SW] Background sync: syncing pending leads');
  // In production: read from IndexedDB and POST to API
}

console.log('[SW] CarIQ Service Worker loaded v1.0.1');