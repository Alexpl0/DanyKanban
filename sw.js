const CACHE_NAME = 'kanban-apqp-v3'; // ← Incrementa la versión
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

// Instalar el service worker
self.addEventListener('install', function(event) {
  // Forzar instalación inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache v3');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', function(event) {
  event.respondWith(
    // Estrategia Network First para archivos críticos
    fetch(event.request)
      .then(function(response) {
        // Si la red funciona, usar respuesta de red y actualizar caché
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Solo si falla la red, usar caché
        return caches.match(event.request);
      })
  );
});

// Actualizar el service worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Eliminar TODOS los cachés anteriores
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Forzar que todas las pestañas usen la nueva versión
      return self.clients.claim();
    })
  );
});