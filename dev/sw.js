const PREFIX = "fm-shell:" + self.registration.scope + ":";
const CACHE = PREFIX + "1ed749ec82d5";
const DEV_PATH = new URL("dev/", self.registration.scope).pathname;
const PRECACHE = ["./","./assets/index-DzoibXms.css","./assets/index-H4JcL7f3.js","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./manifest.webmanifest"];
const INDEX = PRECACHE[0];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith(DEV_PATH)) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(INDEX)));
    return;
  }
  // ignoreVary: Der Server sendet "Vary: Origin". Die Vorab-Anfrage von addAll trägt keinen Origin-Header,
  // die Modul- und CSS-Anfragen der Seite (CORS-Modus) schon. Ohne ignoreVary träfe caches.match nie.
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request)));
});
