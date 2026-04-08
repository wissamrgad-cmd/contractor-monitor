// Contractor Monitor — Service Worker v6 — force fresh load
var CACHE = 'ctm-v6';

self.addEventListener('install', function(e) {
  // Skip waiting immediately — don't wait for old SW to die
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  
  // Never cache — always go to network for:
  // API calls, non-GET requests, HTML pages
  if (url.includes('api.github.com') ||
      url.includes('graph.microsoft.com') ||
      url.includes('cdnjs.cloudflare.com') ||
      e.request.method !== 'GET' ||
      e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(function() {
      return caches.match('./index.html');
    }));
    return;
  }
  
  // For everything else: network first, cache as fallback
  e.respondWith(
    fetch(e.request).then(function(r) {
      var clone = r.clone();
      caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      return r;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
