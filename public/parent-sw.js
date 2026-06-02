/* 코딩쏙 학부모 앱 Service Worker v2 */
const CACHE_NAME = "codingssok-parent-v2";
const PRECACHE_URLS = ["/parent", "/parent/growth", "/parent/feedback", "/parent/homework", "/parent/settings", "/offline"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith("codingssok-parent") && k !== CACHE_NAME).map((k) => caches.delete(k)))
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
                caches.match("/parent").then((r) => r || caches.match(event.request))
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

// Push notification handler
self.addEventListener("push", (event) => {
    let data = { title: "코딩쏙 학부모", body: "새로운 알림이 있습니다.", url: "/parent" };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: data.tag || "parent-notification",
            data: { url: data.url || "/parent" },
            vibrate: [200, 100, 200],
            actions: [
                { action: "open", title: "확인하기" },
                { action: "dismiss", title: "닫기" },
            ],
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/parent";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes("/parent") && "focus" in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});

// Periodic sync graceful fallback
if ("periodicSync" in self.registration) {
    self.addEventListener("periodicsync", (event) => {
        if (event.tag === "parent-sync") {
            event.waitUntil(
                self.clients.matchAll().then((clients) => {
                    clients.forEach((client) =>
                        client.postMessage({ type: "PERIODIC_SYNC" })
                    );
                })
            );
        }
    });
}
