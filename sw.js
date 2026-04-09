// Contractor Monitor — Service Worker v8
var CACHE = 'ctm-v8';
self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if(url.includes('api.github.com')||url.includes('graph.microsoft.com')||
     url.includes('cdnjs.cloudflare.com')||e.request.method!=='GET'||
     e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(function(){
      return caches.match('./index.html');
    }));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(r){
      var clone=r.clone();
      caches.open(CACHE).then(function(cache){cache.put(e.request,clone);});
      return r;
    }).catch(function(){ return caches.match(e.request); })
  );
});
