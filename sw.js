const CACHE='windawai-v1';
const ASSETS=['./','./index.html','./manifest.json','./app-config.js','./404.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
