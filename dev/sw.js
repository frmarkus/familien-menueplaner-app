const PREFIX = "fm-shell:" + self.registration.scope + ":";
const CACHE = PREFIX + "cee89fd8a24b";
const DEV_PATH = new URL("dev/", self.registration.scope).pathname;
const PRECACHE = ["./","./assets/index-BjesxZyi.css","./assets/index-DkiQjaoy.js","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./manifest.webmanifest"];
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

self.addEventListener("push", (event) => {
  const message = event.data ? event.data.json().data : undefined;
  if (!message) return;
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      renotify: true,
      icon: new URL("icons/icon-192.png", self.registration.scope).href,
      data: { target: message.target },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL("#" + event.notification.data.target, self.registration.scope).href;
  const inScope = (client) => {
    const path = new URL(client.url).pathname;
    return path.startsWith(new URL(self.registration.scope).pathname) && !path.startsWith(DEV_PATH);
  };
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find(inScope);
      if (!open) return self.clients.openWindow(url);
      return open.navigate(url).then(() => open.focus());
    }),
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
