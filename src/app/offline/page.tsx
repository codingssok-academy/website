'use client'

export default function OfflinePage() {
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
                <div style={{ fontSize: 56, marginBottom: 16 }}><span className="material-symbols-outlined" style={{ fontSize: 56 }}>wifi_off</span></div>
                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: "0 0 12px",
                    }}
                >
                    오프라인 상태입니다
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: "#64748b",
                        margin: "0 0 28px",
                        lineHeight: 1.6,
                    }}
                >
                    인터넷 연결을 확인해주세요.
                    <br />
                    연결되면 자동으로 복구됩니다.
                </p>
                <button
                    onClick={() => window.location.reload()}
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
        </div>
    );
}
