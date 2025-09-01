const CACHE_NAME = 'sew-checkliste-v1';
const ASSETS = ['./','./index.html','./style.css','./script.js','./manifest.json','./assets/icon-192.png','./assets/icon-512.png','./data/sew.json','./data/sew-n.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => { const copy = resp.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy)); return resp; })));
  }
});