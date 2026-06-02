"use client";

import { useEffect } from "react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') console.error("[DashboardError]", error);
    }, [error]);

    return (
        <div
            style={{
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Pretendard', sans-serif",
                padding: 24,
            }}
        >
            <div style={{ fontSize: 48, marginBottom: 16 }}><span className="material-symbols-outlined" style={{ fontSize: 48 }}>sentiment_dissatisfied</span></div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                문제가 발생했어요
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
                대시보드를 불러오는 중 오류가 발생했습니다.
            </p>
            <button
                onClick={reset}
                style={{
                    padding: "12px 28px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                }}
            >
                다시 시도
            </button>
        </div>
    );
}
