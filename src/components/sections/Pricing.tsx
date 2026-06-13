"use client";

import Link from "next/link";

const tracks = [
    {
        name: "공통기초반",
        icon: "menu_book",
        tone: "#1d4ed8",
        desc: "처음 시작하는 학생을 위한 사고력, 엔트리, 컴퓨터 사용 능력 중심 과정입니다.",
        prices: [
            { label: "주 1회", price: "14만" },
            { label: "주 2회", price: "28만" },
        ],
    },
    {
        name: "흥미반",
        icon: "extension",
        tone: "#0ea5e9",
        desc: "엔트리와 짧은 결과물로 시작하는 별도 입문 트랙입니다.",
        prices: [
            { label: "주 1회", price: "16만" },
            { label: "주 2회", price: "32만" },
        ],
    },
    {
        name: "만들기반",
        icon: "deployed_code",
        tone: "#0891b2",
        desc: "앱, 웹, 게임을 직접 완성하는 별도 제작 트랙입니다.",
        prices: [
            { label: "주 1회", price: "16만" },
            { label: "주 2회", price: "32만" },
        ],
    },
    {
        name: "프로젝트반",
        icon: "rocket_launch",
        tone: "#4f46e5",
        desc: "AI 활용, GitHub 기록, 발표 자료를 남기는 별도 포트폴리오 트랙입니다.",
        prices: [
            { label: "주 1회", price: "16만" },
            { label: "주 2회", price: "32만" },
        ],
    },
    {
        name: "대회반",
        icon: "workspace_premium",
        tone: "#7c3aed",
        desc: "문제 분석, 알고리즘, C++/Python, 외부 OJ 기록까지 관리하는 심화 과정입니다.",
        prices: [
            { label: "주 1회", price: "18만" },
            { label: "주 2회", price: "36만" },
        ],
    },
];

const weekday = ["2시 ~ 4시", "4시 ~ 6시", "6시 ~ 8시", "8시 ~ 10시"];
const saturday = ["10시 ~ 12시", "1시 ~ 3시", "3시 ~ 5시", "5시 ~ 7시"];

export default function Pricing() {
    return (
        <section id="pricing" style={{ padding: "clamp(76px, 10vw, 124px) 20px", background: "#f8fbff" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 44 }}>
                    <span style={{ color: "#2563eb", fontWeight: 900, letterSpacing: "0.14em", fontSize: 12 }}>
                        TUITION & SCHEDULE
                    </span>
                    <h2 style={{ margin: "12px 0 0", fontSize: "clamp(30px, 4vw, 48px)", color: "#0f172a", fontWeight: 900, letterSpacing: "-0.03em" }}>
                        트랙별 수강료 · 수업 시간
                    </h2>
                    <p style={{ margin: "14px auto 0", maxWidth: 700, color: "#64748b", lineHeight: 1.7, wordBreak: "keep-all" }}>
                        월 4회/8회 시스템 및 120분 수업 기준으로 운영합니다. 학생의 목표와 수준에 맞춰
                        각 반을 독립 트랙으로 배정합니다.
                    </p>
                </div>

                <div className="pricing-track-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                    {tracks.map((track) => (
                        <article
                            key={track.name}
                            style={{
                                borderRadius: 8,
                                background: "#ffffff",
                                border: "1px solid #dbeafe",
                                boxShadow: "0 14px 36px rgba(15, 23, 42, 0.07)",
                                padding: 20,
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 8,
                                    background: `${track.tone}14`,
                                    color: track.tone,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 30,
                                    marginBottom: 16,
                                }}
                            >
                                {track.icon}
                            </span>
                            <h3 style={{ margin: 0, fontSize: 21, lineHeight: 1.25, color: "#0f172a", fontWeight: 900, wordBreak: "keep-all" }}>
                                {track.name}
                            </h3>
                            <p style={{ margin: "12px 0 18px", color: "#64748b", fontSize: 14, lineHeight: 1.65, wordBreak: "keep-all" }}>
                                {track.desc}
                            </p>
                            <div style={{ border: "1px solid #dbeafe", borderRadius: 8, overflow: "hidden" }}>
                                {track.prices.map((row, index) => (
                                    <div
                                        key={row.label}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            borderTop: index === 0 ? "none" : "1px solid #dbeafe",
                                            background: index === 0 ? "#eff6ff" : "#f8fbff",
                                        }}
                                    >
                                        <span style={{ padding: "13px 12px", color: "#0f172a", fontWeight: 800 }}>{row.label}</span>
                                        <strong style={{ padding: "13px 12px", color: track.tone, fontSize: 23, lineHeight: 1, textAlign: "right" }}>{row.price}</strong>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <div className="schedule-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 22 }}>
                    {[
                        { title: "평일", icon: "calendar_month", times: weekday, tone: "#1d4ed8" },
                        { title: "토요일", icon: "event", times: saturday, tone: "#4f46e5" },
                    ].map((group) => (
                        <article key={group.title} style={{ borderRadius: 8, background: "#fff", border: "1px solid #dbeafe", padding: 22 }}>
                            <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: 24, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
                                <span className="material-symbols-outlined" style={{ color: group.tone }}>{group.icon}</span>
                                {group.title}
                            </h3>
                            <div style={{ display: "grid", gap: 8 }}>
                                {group.times.map((time) => (
                                    <div key={time} style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 8, background: "#f8fbff", border: "1px solid #dbeafe", padding: "11px 14px" }}>
                                        <span className="material-symbols-outlined" style={{ color: group.tone, fontSize: 20 }}>schedule</span>
                                        <strong style={{ color: "#0f172a", fontSize: 16 }}>{time}</strong>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <div style={{ textAlign: "center", marginTop: 32 }}>
                    <Link
                        href="#contact"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "14px 26px",
                            borderRadius: 8,
                            background: "#0f172a",
                            color: "#fff",
                            textDecoration: "none",
                            fontWeight: 900,
                        }}
                    >
                        상담 문의
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                    </Link>
                </div>
            </div>

            <style>{`
                @media (max-width: 1120px) {
                    .pricing-track-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                }
                @media (max-width: 900px) {
                    .schedule-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .pricing-track-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
}
