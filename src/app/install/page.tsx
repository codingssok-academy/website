"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function InstallPage() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
        try {
            const stored = localStorage.getItem("codingssok_user");
            if (stored) setUserRole(JSON.parse(stored).role || null);
        } catch {}
    }, []);

    const appInfo = userRole === "teacher"
        ? { name: "선생님 앱", href: "/teacher/admin", color: "#f59e0b" }
        : { name: "학생 앱", href: "/dashboard/learning", color: "#3b82f6" };

    if (isStandalone) {
        return (
            <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 56, color: "#22c55e" }}>check_circle</span>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 12 }}>이미 앱으로 실행 중!</h1>
                    <Link href={appInfo.href} style={{ display: "inline-block", marginTop: 20, padding: "12px 24px", background: appInfo.color, color: "#fff", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>
                        시작하기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
            <div style={{ maxWidth: 500, margin: "0 auto" }}>
                <Link href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> 홈으로
                </Link>

                <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>앱 설치 방법</h1>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>30초면 끝난다. 아래 단계를 따라하면 홈 화면에 앱이 추가된다.</p>

                {/* 단계별 안내 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Step 1 */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900 }}>1</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                                {isIOS ? "Safari로 접속" : "Chrome 메뉴 열기"}
                            </span>
                        </div>
                        {isIOS ? (
                            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                                <strong>반드시 Safari</strong>에서 codingssok.com 에 접속한다.
                                <br />Chrome이나 다른 브라우저에서는 설치가 안 된다.
                            </div>
                        ) : (
                            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                                Chrome 브라우저에서 codingssok.com 에 접속한 뒤,
                                <br />오른쪽 위 <strong>점 3개 메뉴</strong>를 누른다.
                                <div style={{ marginTop: 10, background: "#f1f5f9", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#64748b" }}>more_vert</span>
                                    <span style={{ fontSize: 13, color: "#334155" }}>이 버튼이다 (점 3개)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2 */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900 }}>2</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                                {isIOS ? "공유 버튼 누르기" : "'홈 화면에 추가' 누르기"}
                            </span>
                        </div>
                        {isIOS ? (
                            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                                화면 하단 가운데에 있는 <strong>공유 버튼</strong>을 누른다.
                                <div style={{ marginTop: 10, background: "#f1f5f9", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#3b82f6" }}>ios_share</span>
                                    <span style={{ fontSize: 13, color: "#334155" }}>네모에서 화살표 올라가는 모양</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                                메뉴에서 <strong>"홈 화면에 추가"</strong> 또는 <strong>"앱 설치"</strong>를 찾아서 누른다.
                                <div style={{ marginTop: 10, background: "#f1f5f9", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#3b82f6" }}>add_to_home_screen</span>
                                    <span style={{ fontSize: 13, color: "#334155" }}>홈 화면에 추가</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 3 */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900 }}>3</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                                {isIOS ? "'홈 화면에 추가' 선택" : "'추가' 누르면 끝"}
                            </span>
                        </div>
                        {isIOS ? (
                            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                                공유 메뉴에서 아래로 스크롤하면 <strong>"홈 화면에 추가"</strong>가 있다.
                                <br />누르면 이름 확인 후 <strong>"추가"</strong>를 누른다.
                            </div>
                        ) : (
                            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                                팝업이 뜨면 <strong>"추가"</strong> 버튼을 누른다.
                                <br />홈 화면에 코딩쏙 아이콘이 생긴다.
                            </div>
                        )}
                    </div>

                    {/* 완료 */}
                    <div style={{ background: "#f0fdf4", borderRadius: 16, padding: 20, border: "1.5px solid #bbf7d0", textAlign: "center" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#22c55e" }}>celebration</span>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#166534", marginTop: 8 }}>설치 완료!</p>
                        <p style={{ fontSize: 13, color: "#15803d", marginTop: 4 }}>홈 화면의 코딩쏙 아이콘을 누르면 앱처럼 열린다.</p>
                        <p style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>주소창 없이, 전체 화면으로, 앱 전환기에도 따로 표시된다.</p>
                    </div>
                </div>

                {/* 바로가기 */}
                <div style={{ marginTop: 28 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>먼저 접속할 페이지 선택:</p>
                    <div style={{ display: "flex", gap: 10 }}>
                        {[
                            { name: "학생", href: "/dashboard/learning", color: "#3b82f6", icon: "school" },
                            { name: "학부모", href: "/parent", color: "#10b981", icon: "family_restroom" },
                            { name: "선생님", href: "/teacher/admin", color: "#f59e0b", icon: "admin_panel_settings" },
                        ].map(app => (
                            <Link key={app.name} href={app.href} style={{
                                flex: 1, textDecoration: "none", textAlign: "center",
                                padding: "14px 8px", borderRadius: 12, background: "#fff", border: "1.5px solid #e2e8f0",
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 24, color: app.color, display: "block", marginBottom: 4 }}>{app.icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{app.name}</span>
                            </Link>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>해당 페이지에서 위 단계를 따라하면 그 페이지가 앱 시작 화면이 된다.</p>
                </div>
            </div>
        </div>
    );
}
