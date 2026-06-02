/* ═══════════════════════════════════
   코딩쏙 Service Worker — 오프라인 지원
   ═══════════════════════════════════ */

const CACHE_NAME = "codingssok-v4";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
    "/",
];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// Activate: clean old caches (own prefix only)
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith("codingssok-") && k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: only handle same-origin requests
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip external requests (fonts, CDN, etc.) — let browser handle directly
    if (url.origin !== self.location.origin) return;

    // Skip API requests
    if (url.pathname.startsWith("/api/")) return;

    // 교재 HTML은 SW 개입 없이 직접 로드 (iframe 차단 방지)
    if (url.pathname.startsWith("/learn/")) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match(event.request).then((r) => r || caches.match(OFFLINE_URL))
            )
        );
        return;
    }

    // Same-origin static: network-first, fallback to cache
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
