const CACHE = 'eco-track-v4';
const SHELL = [
  '/favicon.svg',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      // Precacheamos solo assets estáticos. NO el shell HTML: en dev/redeploy
      // el HTML referencia chunks con hash que cambian, y servir un shell
      // rancio rompe la navegación con ERR_FAILED.
      caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {}),
    ]),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Borra cualquier caché de versiones anteriores.
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
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

  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // Network-first: siempre intentamos la red para no servir HTML rancio.
    // Cache solo como fallback offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached ?? new Response('Sin conexión', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            }))),
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? fetchPromise;
    }),
  );
});
