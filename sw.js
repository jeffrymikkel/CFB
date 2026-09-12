var CACHE_NAME = 'bspn-v1';
var APP_SHELL = [
  '/CFB/',
  '/CFB/index.html'
];
var ESPN_ORIGIN = 'site.api.espn.com';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // ESPN API — always network, never cache
  if (url.hostname === ESPN_ORIGIN) return;

  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // App shell — network first, so a new index.html shows up on the very next visit.
  // Falls back to the last cached copy only when there's no connection.
  e.respondWith(
    fetch(e.request).then(function (response) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, clone); });
      return response;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
