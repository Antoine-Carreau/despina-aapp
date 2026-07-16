/* Despina — service worker.
   But : l'appli doit fonctionner entièrement hors-ligne (on observe souvent
   sous un ciel noir, sans réseau). Tout le calcul est local, donc seul le
   « shell » (pages, CSS, JS, catalogue) a besoin d'être mis en cache.

   Stratégies :
   - navigation (pages)      : réseau d'abord, cache en repli  -> on voit les mises à jour, ça marche hors-ligne
   - statiques même origine  : cache d'abord, réseau en repli   -> instantané
   - tiers (polices, CDS…)   : réseau seul, jamais mis en cache -> pas de réponses opaques qui gonflent le cache
*/
const VERSION = "despina-v0.6";
const SHELL = [
  "./", "./index.html", "./solar.html", "./deepsky.html", "./messier.html",
  "./quiz.html", "./observe.html", "./info.html",
  "./manifest.json",
  "./assets/css/base.css",
  "./assets/js/i18n.js", "./assets/js/theme.js", "./assets/js/solar.js",
  "./assets/js/skymap.js", "./assets/js/skyphoto.js",
  "./assets/vendor/astronomy.browser.min.js",
  "./assets/data/sky.json",
  "./assets/img/icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // addAll échoue en bloc si un seul fichier manque : on met en cache un par un
    await Promise.all(SHELL.map(u => c.add(u).catch(err => console.warn("[sw] non caché:", u, err))));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", e => { if (e.data === "skip-waiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Tiers (Google Fonts, CDS, Aladin, Open-Meteo) : on laisse passer, sans cache.
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord pour ne pas servir une version périmée.
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(VERSION);
        c.put(req, net.clone());
        return net;
      } catch (err) {
        return (await caches.match(req)) || (await caches.match("./index.html")) ||
               new Response("Hors-ligne", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })());
    return;
  }

  // Statiques : cache d'abord.
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const net = await fetch(req);
      if (net && net.status === 200 && net.type === "basic") {
        const c = await caches.open(VERSION);
        c.put(req, net.clone());
      }
      return net;
    } catch (err) {
      return new Response("", { status: 504 });
    }
  })());
});
