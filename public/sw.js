const CACHE = 'apollo11-v4';
const base = self.registration.scope;
const shellUrl = (path) => new URL(path, base).href;
const APP_SHELL = [
  shellUrl('./'),
  shellUrl('./index.html'),
  shellUrl('./manifest.webmanifest'),
  shellUrl('./icon.svg'),
  shellUrl('./icon-192.png'),
  shellUrl('./icon-512.png')
];

async function cacheBuiltAssets(cache) {
  try {
    const response = await fetch(shellUrl('./index.html'), { cache: 'no-store' });
    if (!response.ok) return;
    const html = await response.clone().text();
    await cache.put(shellUrl('./index.html'), response);
    const discovered = [...html.matchAll(/(?:src|href)=["']\.\/([^"']+)["']/g)]
      .map((match) => shellUrl(`./${match[1]}`));
    const unique = [...new Set(discovered)];
    if (unique.length) await cache.addAll(unique);
  } catch {
    // The shell still installs; discovered build assets will be cached at first use.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await cacheBuiltAssets(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === location.origin;
  const nasaModelAsset = requestUrl.hostname === 'raw.githubusercontent.com';

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request);
        if (network.ok) void caches.open(CACHE).then((cache) => cache.put(shellUrl('./index.html'), network.clone()));
        return network;
      } catch {
        return (await caches.match(shellUrl('./index.html'))) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if ((response.ok || response.type === 'opaque') && (sameOrigin || nasaModelAsset)) {
        void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
