"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
    appName?: string;
    dismissDays?: number;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export default function InstallPrompt({
    appName = "코딩쏙",
    dismissDays = 7,
}: InstallPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // 이미 standalone(설치됨) 모드면 표시 안 함
        if (window.matchMedia("(display-mode: standalone)").matches) return;
        // iOS Safari standalone
        if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return;

        // 나중에 선택 후 7일 안 지났으면 표시 안 함
        const dismissKey = `${DISMISS_KEY}-${appName}`;
        const dismissedAt = localStorage.getItem(dismissKey);
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            const cutoff = dismissDays * 24 * 60 * 60 * 1000;
            if (elapsed < cutoff) return;
        }

        const autoInstall = new URLSearchParams(window.location.search).get("install") === "1";

        const handler = (e: Event) => {
            e.preventDefault();
            const prompt = e as BeforeInstallPromptEvent;
            setDeferredPrompt(prompt);

            if (autoInstall) {
                // ?install=1 → 즉시 설치 프롬프트
                prompt.prompt();
                prompt.userChoice.then(({ outcome }) => {
                    if (outcome === "accepted") {
                        setVisible(false);
                        setDeferredPrompt(null);
                    } else {
                        setVisible(true);
                    }
                });
                // URL에서 ?install=1 제거
                const url = new URL(window.location.href);
                url.searchParams.delete("install");
                window.history.replaceState({}, "", url.pathname);
            } else {
                setVisible(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [appName, dismissDays]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setVisible(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        const dismissKey = `${DISMISS_KEY}-${appName}`;
        localStorage.setItem(dismissKey, String(Date.now()));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label={`${appName} 앱 설치 안내`}
            style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                width: "calc(100% - 48px)",
                maxWidth: 480,
                background: "#ffffff",
                borderRadius: 20,
                boxShadow: "0 8px 40px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                animation: "pwa-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
        >
            <style>{`
                @keyframes pwa-slide-up {
                    from { opacity: 0; transform: translateX(-50%) translateY(24px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>

            {/* 앱 아이콘 */}
            <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
            }}>
                <span style={{ fontSize: 24 }}>💻</span>
            </div>

            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                    {appName}을 앱으로 설치하세요
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                    홈 화면에 추가하면 더 빠르게 이용할 수 있어요
                </p>
            </div>

            {/* 버튼들 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button
                    onClick={handleInstall}
                    aria-label="앱 설치"
                    style={{
                        padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                        color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                    }}
                >
                    설치
                </button>
                <button
                    onClick={handleDismiss}
                    aria-label="나중에 설치"
                    style={{
                        padding: "6px 16px", borderRadius: 10, border: "1px solid #e2e8f0",
                        cursor: "pointer", background: "transparent",
                        color: "#94a3b8", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                    }}
                >
                    나중에
                </button>
            </div>
        </div>
    );
}
