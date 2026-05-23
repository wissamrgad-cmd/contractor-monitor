// Contractor Monitor — Service Worker v14 — 23 May 2026 21:39
var CACHE = 'ctm-v14';
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

  // NEVER cache or intercept Railway API calls — always go to network
  if(url.includes('railway.app') ||
     url.includes('api.github.com') ||
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

  // Navigation — network first, cache fallback for offline
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request)
        .then(function(response){
          if(response.ok){
            var clone = response.clone();
            caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
          }
          return response;
        })
        .catch(function(){
          return caches.match(BASE + 'index.html')
            .then(function(cached){
              return cached || caches.match(BASE)
                .then(function(c2){
                  return c2 || new Response(
                    '<h2>Loading — please wait and refresh</h2>',
                    {headers:{'Content-Type':'text/html'}}
                  );
                });
            });
        })
    );
    return;
  }

  // App shell assets — cache first
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
