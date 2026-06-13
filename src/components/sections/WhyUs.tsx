"use client";

import { motion } from "framer-motion";

const reasons = [
    {
        number: "01",
        icon: "calendar_month",
        title: "월 4회/8회 시스템",
        subtitle: "수업 리듬을 유지하는 고정 운영 구조",
        desc: "주 1회는 월 4회, 주 2회는 월 8회 기준으로 운영합니다. 반복 출석과 누적 실습량이 보장되어야 코딩 실력이 안정적으로 쌓입니다.",
        details: ["월 4회 기본 과정", "월 8회 집중 과정", "결석 보강 및 진도 관리"],
        stat: "4/8",
        unit: "회",
    },
    {
        number: "02",
        icon: "timer",
        title: "120분 몰입 수업",
        subtitle: "설명보다 직접 만드는 시간이 긴 수업",
        desc: "한 번 배울 때 개념 이해, 실습, 디버깅, 결과물 점검까지 끝내기 위해 120분 수업을 기준으로 잡았습니다.",
        details: ["개념 이해", "실습 구현", "코드 점검과 피드백"],
        stat: "120",
        unit: "분",
    },
    {
        number: "03",
        icon: "groups",
        title: "소수 정예 코칭",
        subtitle: "학생별 속도에 맞춘 반 배정",
        desc: "학생 수준과 목표에 맞춰 각 반을 독립적으로 배정합니다. 단순 진도보다 실제 사용 능력을 기준으로 봅니다.",
        details: ["학생별 진도 체크", "수업별 피드백", "목표별 트랙 이동"],
        stat: "1:6",
        unit: "이내",
    },
];

export default function WhyUs() {
    return (
        <section
            id="why"
            style={{
                padding: "clamp(80px, 11vw, 132px) 20px",
                background: "#ffffff",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "7px 18px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#2563eb",
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                        }}
                    >
                        WHY CODINGSSOK
                    </span>
                    <h2
                        style={{
                            margin: "18px 0 0",
                            fontSize: "clamp(32px, 4.8vw, 56px)",
                            lineHeight: 1.08,
                            letterSpacing: "-0.03em",
                            fontWeight: 900,
                            color: "#0f172a",
                        }}
                    >
                        코딩쏙을 선택하는 이유
                    </h2>
                    <p
                        style={{
                            margin: "18px auto 0",
                            maxWidth: 680,
                            color: "#64748b",
                            fontSize: 16,
                            lineHeight: 1.75,
                            wordBreak: "keep-all",
                        }}
                    >
                        월 4회/8회 시스템, 120분 몰입 수업, 학생별 반 배정으로
                        코딩을 배운 내용이 아니라 직접 쓸 수 있는 능력으로 만듭니다.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 22,
                    }}
                    className="why-grid"
                >
                    {reasons.map((item, index) => (
                        <motion.article
                            key={item.number}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ delay: index * 0.08, duration: 0.45 }}
                            style={{
                                minHeight: 380,
                                borderRadius: 8,
                                border: "1px solid #dbeafe",
                                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                                boxShadow: "0 18px 48px rgba(30, 64, 175, 0.08)",
                                padding: 28,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ color: "#2563eb", fontWeight: 900, fontSize: 13 }}>{item.number}</span>
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 8,
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 25,
                                    }}
                                >
                                    {item.icon}
                                </span>
                            </div>

                            <div style={{ marginTop: 34 }}>
                                <span style={{ fontSize: 54, lineHeight: 1, fontWeight: 900, color: "#1d4ed8", letterSpacing: "-0.04em" }}>
                                    {item.stat}
                                </span>
                                <span style={{ marginLeft: 8, color: "#64748b", fontWeight: 800 }}>{item.unit}</span>
                            </div>

                            <h3 style={{ margin: "26px 0 8px", color: "#0f172a", fontSize: 23, lineHeight: 1.25, fontWeight: 900 }}>
                                {item.title}
                            </h3>
                            <p style={{ margin: 0, color: "#2563eb", fontSize: 13, fontWeight: 800 }}>{item.subtitle}</p>
                            <p style={{ margin: "16px 0 22px", color: "#475569", fontSize: 14, lineHeight: 1.75, wordBreak: "keep-all" }}>
                                {item.desc}
                            </p>

                            <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
                                {item.details.map((detail) => (
                                    <div
                                        key={detail}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 9,
                                            color: "#334155",
                                            fontSize: 13,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#2563eb" }}>check_circle</span>
                                        {detail}
                                    </div>
                                ))}
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .why-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
}
