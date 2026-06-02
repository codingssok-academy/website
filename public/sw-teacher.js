/* 코딩쏙 관리자 앱 Service Worker */
const CACHE_NAME = "codingssok-teacher-v1";
const PRECACHE_URLS = ["/teacher/admin"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith("codingssok-teacher") && k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith("/api/")) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match("/teacher/admin").then((r) => r || caches.match(event.request))
            )
        );
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((res) => {
                // 206 partial response는 캐시 불가 — 스킵
                if (res.status === 206) return res;
                const clone = res.clone();
                caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});
