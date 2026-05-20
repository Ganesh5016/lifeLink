// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || 'your-api-key',
  authDomain: self.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: self.FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '123456',
  appId: self.FIREBASE_APP_ID || 'your-app-id',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const { title, body, image } = payload.notification || {};
  const { type, requestId } = payload.data || {};

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image,
    vibrate: type === 'emergency' ? [200, 100, 200, 100, 200] : [200],
    tag: requestId || 'lifelink-notification',
    renotify: true,
    requireInteraction: type === 'emergency',
    actions: type === 'emergency' ? [
      { action: 'accept', title: '✅ Accept Request' },
      { action: 'view', title: '👁 View Details' },
    ] : [
      { action: 'view', title: '👁 View' },
    ],
    data: payload.data,
  };

  self.registration.showNotification(title || 'LifeLink', options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action } = event;
  const { requestId, type } = event.notification.data || {};

  let url = '/dashboard';
  if (action === 'accept' && requestId) {
    url = `/dashboard/requests/${requestId}?action=accept`;
  } else if (requestId) {
    url = `/dashboard/requests/${requestId}`;
  } else if (type === 'chat_message') {
    url = '/dashboard/chat';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(url);
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Cache strategy for offline support
const CACHE_NAME = 'lifelink-v1';
const STATIC_ASSETS = ['/', '/login', '/emergency', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return; // Don't cache API calls

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('/offline.html'));
    })
  );
});
