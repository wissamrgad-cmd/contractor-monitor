// Contractor Monitor — Service Worker v13 — 11 May 2026 18:51
var CACHE = 'ctm-v13';
var BASE = '/contractor-monitor/';
var APP_SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      // Cache each URL individually so one failure doesn't break all
      var promises = APP_SHELL.map(function(url){
        return cache.add(url).catch(function(err){
          console.warn('SW: failed to cache', url, err);
        });
      });
      return Promise.all(promises);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Never cache: API calls or non-GET
  if(url.includes('api.github.com') ||
     url.includes('cdnjs.cloudflare.com') ||
     url.includes('unpkg.com') ||
     e.request.method !== 'GET'){
    e.respondWith(
      fetch(e.request).catch(function(){
        return new Response(JSON.stringify({error:'offline'}),
          {status:503, headers:{'Content-Type':'application/json'}});
      })
    );
    return;
  }

  // Navigation requests — network first, cache fallback
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request)
        .then(function(response){
          // Cache the fresh version
          if(response.ok){
            var clone = response.clone();
            caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
          }
          return response;
        })
        .catch(function(){
          // Offline — serve cached index.html
          return caches.match(BASE + 'index.html')
            .then(function(cached){
              return cached || caches.match(BASE)
                .then(function(cached2){
                  return cached2 || new Response(
                    '<h2>App is loading — please wait a moment and refresh</h2>',
                    {headers:{'Content-Type':'text/html'}}
                  );
                });
            });
        })
    );
    return;
  }

  // All other requests — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(response.ok){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){
        return new Response('', {status: 503});
      });
    })
  );
});
