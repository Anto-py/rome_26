// Service worker : cache d'abord pour les fichiers du site, réseau seul pour les tuiles de carte.
// Incrémenter VERSION à chaque modification de data.js (ou de tout autre fichier) pour forcer la mise à jour.
const VERSION = "rome26-v3";

const FICHIERS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/app.js",
  "js/data.js",
  "js/temps.js",
  "js/vues.js",
  "js/carte.js",
  "js/recherche.js",
  "js/outils.js",
  "vendor/leaflet/leaflet.js",
  "vendor/leaflet/leaflet.css",
  "vendor/leaflet/images/marker-icon.png",
  "vendor/leaflet/images/marker-icon-2x.png",
  "vendor/leaflet/images/marker-shadow.png",
  "vendor/leaflet/images/layers.png",
  "vendor/leaflet/images/layers-2x.png",
  "fonts/anton.woff2",
  "fonts/oswald.woff2",
  "fonts/inter.woff2",
  "img/fond_art_nouveau.jpg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(FICHIERS.map(f => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(c => c !== VERSION).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  // Tuiles OpenStreetMap, Google Maps… : on laisse passer, sans cache
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(trouve => {
      if (trouve) return trouve;
      if (event.request.mode === "navigate") {
        return caches.match("index.html").then(page => page || fetch(event.request));
      }
      return fetch(event.request);
    })
  );
});
