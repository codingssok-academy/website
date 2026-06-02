"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') console.error("[GlobalError]", error);
    }, [error]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Pretendard', sans-serif",
                background: "#f8fafc",
                padding: 24,
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    maxWidth: 440,
                    padding: "48px 32px",
                    background: "#fff",
                    borderRadius: 24,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                }}
            >
                <div style={{ fontSize: 56, marginBottom: 16 }}></div>
                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: "0 0 12px",
                    }}
                >
                    오류가 발생했습니다
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: "#64748b",
                        margin: "0 0 24px",
                        lineHeight: 1.6,
                    }}
                >
                    예상치 못한 오류가 발생했습니다.
                    <br />
                    다시 시도하거나 잠시 후 이용해주세요.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
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
                    <a
                        href="/"
                        style={{
                            padding: "12px 28px",
                            borderRadius: 14,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#475569",
                            fontSize: 14,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-block",
                        }}
                    >
                        홈으로 이동
                    </a>
                </div>
            </div>
        </div>
    );
}
