const CACHE_NAME = 'canchaos-admin-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/supabase-client.js',
  './js/nico-agent.js',
  './js/nico-analytics.js',
  './js/nico-chat.js',
  './js/views/agenda.js',
  './js/views/buffet.js',
  './js/views/caja.js',
  './js/views/canchas.js',
  './js/views/dashboard.js',
  './js/views/gastos.js',
  './js/views/goleadores.js',
  './js/views/login.js',
  './js/views/matchmaking.js',
  './js/views/reportes.js',
  './js/views/reservas.js',
  './js/views/torneos.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usar cache.addAll de forma tolerante para evitar fallos si alguna fuente externa cambia
      return Promise.allSettled(
        ASSETS.map(asset => 
          cache.add(asset).catch(err => console.warn(`[ServiceWorker] No se pudo cachear recurso: ${asset}`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // No interceptar llamadas API de Supabase o Vercel con cache estático
  const url = event.request.url;
  if (url.includes('/api/') || url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar copia fresca en cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Si no hay red, ir al cache
        return caches.match(event.request);
      })
  );
});
