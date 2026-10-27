/* Luma — service worker : application disponible hors ligne, photos déjà vues gardées en cache.
   La version change automatiquement à chaque construction (build.py). */
const VERSION = 'luma-5955ff51';
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo.svg', './icons/luma-192.png', './icons/luma-512.png'];
const IMMUTABLE = /fonts\.(googleapis|gstatic)\.com|images\.unsplash\.com\//;
const MAX_IMG = 160;
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function trim(name){ try { const c = await caches.open(name), keys = await c.keys(); for (let i = 0; i < keys.length - MAX_IMG; i++) await c.delete(keys[i]); } catch (e) {} }
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (IMMUTABLE.test(req.url)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')){ const cp = r.clone(); caches.open(VERSION + '-img').then(c => c.put(req, cp)).then(() => trim(VERSION + '-img')); } return r; })));
    return;
  }
  if (url.origin !== self.location.origin) return;   // FormSubmit, Stripe… : jamais en cache
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)){
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok){ const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })));
});
