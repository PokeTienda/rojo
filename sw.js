const CACHE_NAME = 'pokemon-rojo-v1';

// 1. Archivos iniciales mínimos que se guardan apenas abrís la página
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './rojo.gbc',
  './data/loader.js'
];

// Instalar el Service Worker y precargar lo básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar versiones viejas de caché si las hubiera
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 2. ESTRATEGIA DINÁMICA: Intercepta, sirve desde caché o descarga y guarda
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones de nuestro propio sitio (mismo origen)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Si el archivo ya está en caché (ROM, loader, o el núcleo ya guardado), lo usa directamente
          return cachedResponse;
        }

        // Si no está (como los archivos de gambatte la primera vez que tocás "JUGAR"),
        // lo descarga de la red, lo guarda en la caché para la próxima y lo entrega al emulador
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});
