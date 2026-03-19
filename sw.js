const CACHE_NAME = 'pepieux-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/gestion.html',
  '/budget.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Lato:wght@400;700&display=swap'
];

// Installation : mise en cache de tous les assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.filter(function(u){ return !u.startsWith('http'); }));
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch : cache-first pour les assets locaux, network-first pour le reste
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  
  // Assets locaux : cache d'abord
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
          return response;
        }).catch(function() {
          return new Response('Hors ligne - contenu non disponible', {status: 503});
        });
      })
    );
  } else {
    // Ressources externes (fonts etc) : network avec fallback cache
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});