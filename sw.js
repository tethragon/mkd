/**
 * ============================================================================
 *                 SERVICE WORKER - ΕΚΠΑΙΔΕΥΤΙΚΗ ΕΦΑΡΜΟΓΗ ΜΚΔ
 * ============================================================================
 * Παρέχει δυνατότητα πλήρους λειτουργίας της εφαρμογής εκτός σύνδεσης (Offline).
 * Επίσημο URL φιλοξενίας: https://tethragon.github.io/mkd/
 * ============================================================================
 */

const CACHE_NAME = 'mkd-pwa-v2.3.0';

// Αρχεία για προ-αποθήκευση στην τοπική μνήμη (Cache)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

// Εγκατάσταση Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Ενεργοποίηση και διαγραφή παλαιών εκδόσεων cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Ανάκτηση πόρων (Cache First με Network Update & Offline Navigation Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Επιστροφή από cache και ανανέωση στο παρασκήνιο αν υπάρχει σύνδεση
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Εκτός σύνδεσης
        });
        return cachedResponse;
      }

      // Ανάκτηση από το δίκτυο
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
