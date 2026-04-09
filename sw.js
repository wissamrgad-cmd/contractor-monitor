// Contractor Monitor — Service Worker v11 — 09 Apr 2026 14:24
var CACHE = 'ctm-v11';
var APP_SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(cache){return cache.addAll(APP_SHELL);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch', function(e) {
  var url=e.request.url;
  if(url.includes('api.github.com')||url.includes('cdnjs.cloudflare.com')||e.request.method!=='GET'){
    e.respondWith(fetch(e.request).catch(function(){return new Response('',{status:503});}));
    return;
  }
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(function(r){var clone=r.clone();caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});return r;}).catch(function(){return caches.match('./index.html');}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(cached){if(cached)return cached;return fetch(e.request).then(function(r){var clone=r.clone();caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});return r;});}));
});
