import Link from "next/link";

export default function NotFound() {
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
                <div style={{ fontSize: 72, fontWeight: 900, color: "#e2e8f0", marginBottom: 8 }}>
                    404
                </div>
                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: "0 0 12px",
                    }}
                >
                    페이지를 찾을 수 없습니다
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: "#64748b",
                        margin: "0 0 28px",
                        lineHeight: 1.6,
                    }}
                >
                    요청하신 페이지가 존재하지 않거나 이동되었습니다.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <Link
                        href="/"
                        style={{
                            padding: "12px 28px",
                            borderRadius: 14,
                            border: "none",
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        홈으로 이동
                    </Link>
                    <Link
                        href="/dashboard/learning"
                        style={{
                            padding: "12px 28px",
                            borderRadius: 14,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#475569",
                            fontSize: 14,
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        학습 대시보드
                    </Link>
                </div>
            </div>
        </div>
    );
}
