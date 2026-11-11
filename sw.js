/* LT NCAA Tracker – service worker: darbas be tinklo, pasikartojantis fono tikrinimas ir pranešimai */
if (/[?&]os=1/.test(self.location.search)) { try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {} }
const V = 'ltncaa-v1';
const SHELL = ['./', 'index.html', 'players.html', 'charts.html', 'compare.html', 'insights.html', 'metodika.html', 'style.css', 'extra.css', 'polish.css', 'modern.css', 'insights.css',
  'theme.js', 'media.js', 'pnav.js', 'pwa.js', 'config.js', 'home.js', 'app.js', 'charts.js', 'compare.js', 'insights.js', 'share.js', 'manifest.webmanifest', 'icons/icon-192.png', 'ncaa-logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k.startsWith('ltncaa-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Visiems tos pačios kilmės užklausoms: pirma tinklas (kad visada būtų naujausi duomenys), jei nėra ryšio – paskutinė išsaugota kopija */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    try {
      const res = await fetch(r, u.pathname.includes('/data/') ? { cache: 'no-store' } : undefined);
      if (res && res.ok) c.put(r, res.clone());
      return res;
    } catch (err) {
      return (await c.match(r, { ignoreSearch: r.mode === 'navigate' })) || (r.mode === 'navigate' ? await c.match('index.html') : undefined) || Response.error();
    }
  })());
});

/* Fono tikrinimas (Chrome Android, įdiegta programėlė): ar yra nauji rezultatai */
async function seen(set) {
  const c = await caches.open('ltncaa-meta');
  if (set !== undefined) return c.put('seen', new Response(String(set)));
  const r = await c.match('seen'); return r ? r.text() : '';
}
async function check() {
  try {
    const j = await (await fetch('data/notify.json', { cache: 'no-store' })).json();
    if (!j || !j.id || j.id === await seen()) return;
    await self.registration.showNotification(j.title || 'LT NCAA', { body: j.body || '', icon: 'icons/icon-192.png', badge: 'icons/favicon-64.png', tag: 'ltn-' + j.id, data: { url: j.url || 'index.html' } });
    await seen(j.id);
  } catch (e) {}
}
self.addEventListener('periodicsync', e => { if (e.tag === 'ltn-check') e.waitUntil(check()); });
self.addEventListener('message', e => { if (e.data === 'mark-seen') e.waitUntil((async () => { try { const j = await (await fetch('data/notify.json', { cache: 'no-store' })).json(); if (j && j.id) await seen(j.id); } catch (x) {} })()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || 'index.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => x.url.startsWith(self.registration.scope)); return w ? (w.focus(), w.navigate(url)) : self.clients.openWindow(url); }));
});
