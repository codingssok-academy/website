/* 코딩쏙 학생 앱 Service Worker */
const CACHE_NAME = "codingssok-student-v2";
const PRECACHE_URLS = ["/dashboard/learning"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith("codingssok-student") && k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith("/api/")) return;
    // 교재 HTML은 서비스 워커 개입 없이 직접 로드
    if (url.pathname.startsWith("/learn/")) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match("/dashboard/learning").then((r) => r || new Response("Offline", { status: 503 }))
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
            .catch(() => caches.match(event.request).then((r) => r || new Response("Offline", { status: 503 })))
    );
});
