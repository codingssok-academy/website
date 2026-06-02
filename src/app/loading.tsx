export default function RootLoading() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                gap: 16,
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }}
            />
            <p style={{ fontSize: 15, color: "#64748b", fontWeight: 600 }}>코딩쏙 로딩 중...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
