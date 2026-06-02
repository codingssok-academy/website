"use client";

import { useRouter } from "next/navigation";

export default function ProgrammingContestComingSoon() {
    const router = useRouter();

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                background: "linear-gradient(145deg,#eef4ff,#f5f3ff 45%,#fff7ed)",
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    width: "min(720px, 100%)",
                    borderRadius: 28,
                    padding: "32px 30px",
                    background: "rgba(255,255,255,0.78)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148,163,184,0.16)",
                    boxShadow: "0 24px 80px rgba(15,23,42,0.1)",
                    display: "grid",
                    gap: 22,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 18,
                            background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontSize: 28,
                            boxShadow: "0 16px 30px rgba(37,99,235,0.24)",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>code</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: 1.2 }}>PROGRAMMING CONTEST</div>
                        <h1 style={{ margin: "4px 0 0", fontSize: 28, lineHeight: 1.1, color: "#0f172a" }}>파이썬 트랙 준비 중</h1>
                    </div>
                </div>

                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#475569" }}>
                    프로그래밍 대회 파이썬 트랙은 다음 자료 묶음으로 이어서 넣겠습니다.
                    현재는 C언어 트랙에 방금 추가한 40개 라운드 교재가 먼저 연결되어 있습니다.
                </p>

                <div
                    style={{
                        borderRadius: 22,
                        padding: 22,
                        background: "linear-gradient(135deg,rgba(37,99,235,0.08),rgba(124,58,237,0.08))",
                        border: "1px solid rgba(99,102,241,0.14)",
                    }}
                >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>현재 가능한 트랙</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#ea580c" }}>C언어 프로그래밍 대회 트랙</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Iron · Bronze · Silver · Gold · Platinum 40개 라운드</div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                        onClick={() => router.push("/dashboard/learning/courses/6?track=c")}
                        style={{
                            padding: "12px 18px",
                            borderRadius: 14,
                            border: "none",
                            cursor: "pointer",
                            background: "linear-gradient(135deg,#f97316,#ea580c)",
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 800,
                            boxShadow: "0 12px 24px rgba(249,115,22,0.22)",
                        }}
                    >
                        C언어 트랙 보기
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/learning/courses/6")}
                        style={{
                            padding: "12px 18px",
                            borderRadius: 14,
                            border: "1px solid #dbe4f0",
                            cursor: "pointer",
                            background: "#fff",
                            color: "#475569",
                            fontSize: 14,
                            fontWeight: 700,
                        }}
                    >
                        카테고리 선택으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
