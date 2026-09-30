// Minimal service worker to make the app installable as a PWA.
// Keep network-first for navigation so data is always fresh, but fall back
// to the cache when the user is offline.

const CACHE = "shofi-traders-v1";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Only handle same-origin GET requests.
    if (request.method !== "GET") return;
    if (!request.url.startsWith(self.location.origin)) return;

    // Never cache API/auth calls.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.status === 200 && response.type === "basic") {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() =>
                caches.match(request).then((cached) => cached || caches.match("/"))
            )
    );
});
