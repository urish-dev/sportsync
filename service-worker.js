
const CACHE_NAME = 'sportsync-v4';
const DYNAMIC_CACHE_NAME = 'sportsync-dynamic-v4';

// In a built app, we don't cache .tsx files. We cache the shell and assets.
// Note: In a real production build, we would use a manifest to get exact hashed filenames.
// For this simple local build, we cache the critical external assets and the root.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  // External CDNs
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const stack = PRECACHE_URLS.map(url => 
        fetch(url, {cache: 'reload'}).then(response => {
          if (response.ok) return cache.put(url, response);
        }).catch(err => console.log('Failed to cache', url, err))
      );
      return Promise.all(stack);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // Network First for HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
          return caches.match(event.request).then(response => {
             return response || caches.match('./index.html') || caches.match('./');
          });
        })
    );
    return;
  }

  // Cache First for everything else
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
           // Cache external fonts/images dynamically
           if (event.request.destination === 'image' || event.request.destination === 'font') {
              cache.put(event.request, networkResponse.clone());
           }
           return networkResponse;
        });
      });
    })
  );
});
