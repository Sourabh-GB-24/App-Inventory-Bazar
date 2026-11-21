const CACHE_NAME = 'freshcart-offline-v11';
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        CORE_ASSETS.map(async url => {
          try {
            const req = new Request(url, { cache: 'reload' });
            const res = await fetch(req);
            if (res && res.ok) await cache.put(url, res);
          } catch (e) {}
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const reqUrl = new URL(event.request.url);
  if (reqUrl.origin !== self.location.origin) return;

  // Navigation requests (opening app from Safari or Home Screen): serve cached shell immediately, update in background
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached =
          (await cache.match(event.request, { ignoreSearch: true })) ||
          (await cache.match('./index.html', { ignoreSearch: true })) ||
          (await cache.match('./', { ignoreSearch: true }));

        const networkFetch = fetch(event.request).then(res => {
          if (res && res.ok) {
            cache.put('./index.html', res.clone());
            cache.put('./', res.clone());
          }
          return res;
        }).catch(() => null);

        if (cached) {
          event.waitUntil(networkFetch);
          return cached;
        }
        return (await networkFetch) || Response.error();
      })
    );
    return;
  }

  // Static assets (manifest, icons, sw): cache-first with ignoreSearch
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }));
    })
  );
});
