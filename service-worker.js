/**
 * Service worker — offline shell + fast repeat visits.
 *  - Pages:        network-first, fall back to cache, then offline.html
 *  - Local assets: stale-while-revalidate
 *  - Google Fonts: cache-first
 *  - Firebase, admin and other origins: always network (never cached)
 * Bump VERSION whenever you deploy changes to cached files.
 */
const VERSION = 'ar-v1.0.0';
const CORE = `${VERSION}-core`;
const RUNTIME = `${VERSION}-runtime`;
const FONTS = 'ar-fonts-v1';

const PRECACHE = [
  './', './index.html', './case-study.html', './offline.html', './404.html', './manifest.json',
  './css/tokens.css', './css/style.css', './css/animations.css', './css/responsive.css', './css/case-study.css',
  './js/app.js', './js/utils.js', './js/config.js', './js/firebase.js', './js/content.js', './js/seed-data.js',
  './js/cursor.js', './js/animations.js', './js/hero.js', './js/sections.js', './js/projects.js',
  './js/case-study.js', './js/case-sections.js',
  './assets/icons/favicon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CORE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![CORE, RUNTIME, FONTS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fonts: cache-first
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(caches.open(FONTS).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }));
    return;
  }

  // Everything else cross-origin (Firebase, Behance, Facebook) stays on the network
  if (url.origin !== self.location.origin) return;
  // Admin is never served from cache
  if (url.pathname.includes('/admin/')) return;

  // Pages: network-first
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(RUNTIME);
        cache.put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req, { ignoreSearch: true }))
          || (await caches.match('./offline.html'));
      }
    })());
    return;
  }

  // Local assets: stale-while-revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(async (res) => {
      if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
