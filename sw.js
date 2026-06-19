const CACHE = 'dimitra-iqos-log-v5';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const wantsHtml = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');
  if (wantsHtml) {
    event.respondWith(fetch(event.request).then(resp => {
      const copy = resp.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return resp;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return resp;
  })));
});
