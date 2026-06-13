"use client";

import { motion } from "framer-motion";

const roadmap = [
    "사고력 기초",
    "블록코딩",
    "텍스트코딩",
    "반별 트랙 선택",
    "GitHub · 포트폴리오",
];

const tracks = [
    {
        label: "기초",
        title: "공통기초반",
        icon: "school",
        tone: "#2563eb",
        desc: "문제 읽기, 조건 찾기, 순서 정리, 반복 구조 이해를 먼저 잡는 입문 공통 과정입니다.",
        skills: ["컴퓨팅 사고력", "엔트리", "하드웨어 기초", "텍스트코딩 비교"],
    },
    {
        label: "흥미",
        title: "흥미반",
        icon: "extension",
        tone: "#0ea5e9",
        desc: "코딩을 처음 부담 없이 접하는 별도 입문 트랙입니다. 엔트리와 짧은 결과물 중심으로 흥미와 수업 지속력을 먼저 만듭니다.",
        skills: ["엔트리", "블록코딩", "간단한 게임", "흥미 유지"],
    },
    {
        label: "제작",
        title: "만들기반",
        icon: "deployed_code",
        tone: "#0891b2",
        desc: "아이디어를 실제 산출물로 바꾸는 별도 제작 트랙입니다. 앱, 웹, 게임을 직접 완성하며 구현 순서와 디버깅 흐름을 익힙니다.",
        skills: ["앱 제작", "웹 제작", "게임 제작", "코드 구현"],
    },
    {
        label: "프로젝트",
        title: "프로젝트반",
        icon: "rocket_launch",
        tone: "#4f46e5",
        desc: "완성 결과물을 증명 자료로 남기는 별도 포트폴리오 트랙입니다. AI 활용, GitHub 기록, PR, 발표 자료까지 관리합니다.",
        skills: ["AI 활용", "GitHub PR", "발표 자료", "포트폴리오"],
    },
    {
        label: "증명",
        title: "대회반",
        icon: "emoji_events",
        tone: "#7c3aed",
        desc: "문제 분석력과 알고리즘 구현력을 KOI 대비와 외부 OJ 풀이 기록으로 증명합니다.",
        skills: ["문제 풀이", "KOI 대비", "C++/Python", "외부 OJ 기록"],
    },
];

const problemFlow = [
    "문제에서 구하는 것 찾기",
    "조건 찾기",
    "작은 예시로 실험하기",
    "그림과 표로 바꾸기",
    "말로 해결 순서 정리",
    "코드 구현",
    "검증",
];

export default function Curriculum() {
    return (
        <section id="curriculum" style={{ padding: "clamp(84px, 11vw, 136px) 20px", background: "#ffffff" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 50 }}>
                    <span style={{ color: "#2563eb", fontWeight: 900, letterSpacing: "0.14em", fontSize: 12 }}>
                        CURRICULUM
                    </span>
                    <h2 style={{ margin: "12px 0 0", color: "#0f172a", fontSize: "clamp(32px, 4.6vw, 56px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
                        코딩학원 커리큘럼의 흐름
                    </h2>
                    <p style={{ margin: "16px auto 0", maxWidth: 760, color: "#64748b", lineHeight: 1.75, wordBreak: "keep-all" }}>
                        문법만 따라가는 수업이 아니라 사고력, 블록코딩, 텍스트코딩을 기반으로
                        대회 기록, 자격증, 프로젝트 포트폴리오까지 이어지는 구조입니다.
                    </p>
                </div>

                <div className="roadmap" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, marginBottom: 34 }}>
                    {roadmap.map((step, index) => (
                        <div key={step} style={{ borderRadius: 8, border: "1px solid #dbeafe", background: "#f8fbff", padding: "14px 12px", textAlign: "center" }}>
                            <div style={{ color: "#2563eb", fontSize: 12, fontWeight: 900 }}>STEP {index + 1}</div>
                            <strong style={{ display: "block", marginTop: 6, color: "#0f172a", fontSize: 14, wordBreak: "keep-all" }}>{step}</strong>
                        </div>
                    ))}
                </div>

                <div className="curriculum-track-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                    {tracks.map((track, index) => (
                        <motion.article
                            key={track.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ delay: index * 0.06, duration: 0.42 }}
                            style={{
                                borderRadius: 8,
                                border: "1px solid #dbeafe",
                                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                                padding: 20,
                                boxShadow: "0 16px 42px rgba(15,23,42,0.06)",
                                minHeight: 300,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <span className="material-symbols-outlined" style={{ width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${track.tone}14`, color: track.tone }}>
                                    {track.icon}
                                </span>
                                <div>
                                    <span style={{ color: track.tone, fontSize: 12, fontWeight: 900 }}>{track.label}</span>
                                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: 20, lineHeight: 1.25, fontWeight: 900, wordBreak: "keep-all" }}>{track.title}</h3>
                                </div>
                            </div>
                            <p style={{ margin: "0 0 18px", color: "#475569", lineHeight: 1.7, fontSize: 14, wordBreak: "keep-all" }}>{track.desc}</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
                                {track.skills.map((skill) => (
                                    <span key={skill} style={{ borderRadius: 999, border: "1px solid #dbeafe", background: "#fff", color: "#334155", padding: "7px 11px", fontSize: 12, fontWeight: 800 }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </motion.article>
                    ))}
                </div>

                <article style={{ marginTop: 22, borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", padding: 24 }}>
                    <h3 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 24, fontWeight: 900 }}>문제 해결력 수업 방향</h3>
                    <div className="problem-flow-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
                        {problemFlow.map((item, index) => (
                            <div key={item} style={{ borderRadius: 8, background: "#fff", border: "1px solid #dbeafe", padding: "12px 10px", minHeight: 92 }}>
                                <span style={{ color: "#2563eb", fontSize: 12, fontWeight: 900 }}>{index + 1}</span>
                                <strong style={{ display: "block", marginTop: 7, color: "#0f172a", fontSize: 13, lineHeight: 1.45, wordBreak: "keep-all" }}>{item}</strong>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            <style>{`
                @media (max-width: 1120px) {
                    .curriculum-track-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                }
                @media (max-width: 900px) {
                    .roadmap,
                    .problem-flow-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .curriculum-track-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
}
