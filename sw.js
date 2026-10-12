/* Service worker de Lina · Entreno. Sube el número de VERSION cada vez que cambies index.html para forzar la actualización. */
const VERSION = 'lina-v1';
const FONTS = 'lina-fonts-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('lina-') && k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Tipografías de Google: se guardan la primera vez para que funcionen sin conexión
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONTS).then(c =>
        c.match(req).then(hit => {
          const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
          return hit || red;
        })
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // La app: primero lo guardado (rápido y sin conexión), y se actualiza en segundo plano
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const red = fetch(req).then(r => {
        if (r && r.ok) caches.open(VERSION).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || red;
    })
  );
});
