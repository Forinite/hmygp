// HowMuchYouGoPay? service worker. Caches only static files. Pages, API calls and Supabase data always come live from the network.
const V = 'v1', STATIC = 'hmygp-static-' + V, OFFLINE = '/offline.html'
self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC).then(c => c.addAll([OFFLINE, '/icons/icon-192.png', '/icons/icon-512.png'])).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hmygp-') && k !== STATIC).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return          // never touch payments, Supabase or other sites
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return
  if (req.mode === 'navigate') { e.respondWith(fetch(req).catch(() => caches.match(OFFLINE))); return }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(STATIC).then(c => c.put(req, copy)) }
      return res
    })))
  }
})
