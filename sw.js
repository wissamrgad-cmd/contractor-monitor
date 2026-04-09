// Contractor Monitor — Service Worker v10 — 09 Apr 2026 14:07
var CACHE = 'ctm-v10';
var APP_SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

// Install: pre-cache the full app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){ return self.skipWaiting(); })
  );
});

// Activate: delete old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always go to network for API calls — never cache
  if(url.includes('api.github.com')||url.includes('graph.microsoft.com')||
     url.includes('cdnjs.cloudflare.com')||e.request.method!=='GET'){
    e.respondWith(
      fetch(e.request).catch(function(){return new Response('',{status:503});})
    );
    return;
  }

  // For app navigation — network first, fall back to cached shell
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(function(r){
        // Update cache with latest version
        var clone=r.clone();
        caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});
        return r;
      }).catch(function(){
        // Offline — serve cached app shell
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For all other assets — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(r){
        var clone=r.clone();
        caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});
        return r;
      });
    })
  );
});
