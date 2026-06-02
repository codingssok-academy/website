export default function DashboardLoading() {
    return (
        <div
            style={{
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }}
            />
            <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>로딩 중...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
