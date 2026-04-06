const CACHE_NAME = 'weekly-shop-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
];

// Next.js static assets often match these patterns
const NEXT_STATIC_PATTERNS = [
  /\/_next\/static\/.*/,
  /\/_next\/image\/.*/,
  /\/_next\/data\/.*/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache, adding static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

function isNextStatic(url) {
  return NEXT_STATIC_PATTERNS.some(pattern => pattern.test(url));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API requests and non-GET requests
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  // Handle Navigation Requests (HTML) - Network First, then Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/') || caches.match(request);
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Google Fonts) - Stale-While-Revalidate
  if (isNextStatic(url.pathname) || url.origin === location.origin || url.origin.includes('gstatic.com') || url.origin.includes('googleapis.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Push Notification Logic
self.addEventListener('push', (event) => {
    let data = { title: 'Weekly Shop', body: 'New update!' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch {
        data = { title: 'Weekly Shop', body: event.data.text() };
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
