const CACHE = 'nightcrew-shell-v2';
// '/' bewusst nicht vorab cachen: für nicht eingeloggte Besucher ist das ein Redirect
// auf /login, und das Cachen einer Redirect-Response wirft in Safari denselben Fehler
// wie im fetch-Handler unten (siehe Kommentar dort).
const SHELL = ['/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Seiten-Navigationen (inkl. Redirects wie /login -> /auth/callback) nie abfangen:
  // Safari lehnt eine vom Service Worker zurückgegebene Redirect-Response für
  // Navigationen strikt ab ("Response served by service worker has redirections").
  if (event.request.mode === 'navigate') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
