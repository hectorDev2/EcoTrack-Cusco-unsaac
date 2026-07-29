const CACHE = 'eco-track-v3';
const SHELL = [
  '/',
  '/auth/login',
  '/favicon.svg',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      caches.open(CACHE).then((cache) => cache.addAll(SHELL)),
    ]),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.delete('eco-track-v1'),
      caches.delete('eco-track-v2'),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.searchParams.has('_rsc')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return (cached ?? fetchPromise).catch(() => {
        // Offline fallback: devolver la página principal cacheada
        return caches.match('/').then((fallback) => fallback ?? new Response('Sin conexión', { status: 503 }));
      });
    }),
  );
});
