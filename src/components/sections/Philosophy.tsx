"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/*
  Philosophy — 코딩쏙 교육 철학
  White background, blue accent #2563EB
  Material Symbols icons, no emojis
  Layout: header → origin story → 4 philosophy cards → success highlight
*/

const BLUE = "#2563EB";
const BLUE_LIGHT = "#dbeafe";
const BLUE_MID = "#bfdbfe";

/* ── SVG inline icons (Material Symbols style) ── */
function IconBrain() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9.5 2A5.5 5.5 0 004 7.5c0 1.33.47 2.55 1.25 3.5H5a3 3 0 000 6h.05A3.5 3.5 0 0012 20a3.5 3.5 0 006.95-3H19a3 3 0 000-6h-.25A5.5 5.5 0 009.5 2z" stroke={BLUE} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <path d="M12 8v4M12 12l2 2" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconPeople() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="7" r="3" stroke={BLUE} strokeWidth="1.5" />
            <circle cx="17" cy="8" r="2.5" stroke={BLUE} strokeWidth="1.5" opacity="0.6" />
            <path d="M3 19v-1a6 6 0 0112 0v1" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 13c2.21 0 4 1.79 4 4v1" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
    );
}
function IconRocket() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C12 2 7 6 7 13h10c0-7-5-11-5-11z" stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 13v4l-2 3h14l-2-3v-4" stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="1.5" fill={BLUE} />
        </svg>
    );
}
function IconSchool() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3L2 8l10 5 10-5-10-5z" stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 10.5v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 8v5" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconStar() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" fill={BLUE_LIGHT} />
        </svg>
    );
}
function IconTrophy() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 2h8v9a4 4 0 01-8 0V2z" stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" fill={BLUE_LIGHT} />
            <path d="M5 5H2a5 5 0 005 5M19 5h3a5 5 0 01-5 5" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 15v3M9 21h6" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

const philosophies = [
    {
        num: "01",
        icon: <IconBrain />,
        title: "사고력 코딩",
        quote: "코드를 짜다 보면 문제를 쪼개고 → 순서를 세우고 → 틀리면 왜 틀렸는지 찾고 → 다시 고치고",
        desc: "이 과정이 반복되다 보면 어떤 문제를 봐도 포기하지 않는 아이가 됩니다. 코딩은 도구, 사고력이 목적입니다.",
    },
    {
        num: "02",
        icon: <IconPeople />,
        title: "소수 정예 맞춤형",
        quote: "학교 코딩 34시간 vs 코딩쏙 374시간",
        desc: "일반 학교 수업과 비교해 10배 이상의 실습 시간. 1:6 이하 소수 정예 구성으로 선생님이 아이 한 명 한 명의 속도를 압니다.",
    },
    {
        num: "03",
        icon: <IconRocket />,
        title: "AI 시대 적응형 교육",
        quote: "코딩을 배우는 게 문제가 아니라, 뭘 배우느냐가 문제",
        desc: "도구는 빠르게 바뀝니다. 코딩쏙은 특정 언어가 아닌 컴퓨팅 사고력과 문제해결 구조를 가르칩니다. AI가 대체할 수 없는 능력입니다.",
    },
    {
        num: "04",
        icon: <IconSchool />,
        title: "수업 그 이상의 공간",
        quote: "학부모가 안심하고, 아이가 즐겁게 오는 곳",
        desc: "매주 성장 리포트 발송, 개별 상담, AI 교육과 인간적 코칭의 연결. 단순한 학원이 아닌 성장 파트너입니다.",
    },
];

const achievements = [
    {
        icon: <IconStar />,
        name: "이다연 학생",
        detail: "자폐성 장애 의사소통 도구 IELM 개발 — 전국 대회 은상",
    },
    {
        icon: <IconTrophy />,
        name: "출발드림팀 (5명)",
        detail: "젬S 메이커스 코딩 페스티벌 본선 진출",
    },
];

/* ── Philosophy Card ── */
function PhilosophyCard({ p, i }: { p: typeof philosophies[0]; i: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 48 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: "#ffffff",
                border: "1px solid rgba(37,99,235,0.1)",
                borderRadius: 20,
                padding: "clamp(28px, 3.5vw, 40px)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(37,99,235,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
            }}
            whileHover={{
                boxShadow: "0 12px 48px rgba(37,99,235,0.12)",
                borderColor: "rgba(37,99,235,0.25)",
                y: -4,
            }}
        >
            {/* Top accent bar */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${BLUE}, #60a5fa, transparent)`,
                    borderRadius: "20px 20px 0 0",
                    transformOrigin: "left",
                }}
            />

            {/* Background orb */}
            <div style={{
                position: "absolute", top: "-30%", right: "-20%",
                width: "60%", height: "60%", borderRadius: "50%",
                background: `radial-gradient(circle, ${BLUE_LIGHT}50, transparent 70%)`,
                filter: "blur(40px)", pointerEvents: "none",
            }} />

            {/* Step + icon row */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24, position: "relative", zIndex: 1,
            }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
                    color: BLUE, padding: "5px 14px", borderRadius: 999,
                    background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`,
                    textTransform: "uppercase",
                }}>
                    STEP {p.num}
                </span>
                <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_MID})`,
                    border: `1px solid rgba(37,99,235,0.15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 16px rgba(37,99,235,0.12)`,
                }}>
                    {p.icon}
                </div>
            </div>

            {/* Title */}
            <h3 style={{
                fontSize: "clamp(18px, 2.2vw, 22px)",
                fontWeight: 800, color: "#0f172a",
                letterSpacing: "-0.02em", marginBottom: 16,
                position: "relative", zIndex: 1,
            }}>
                {p.title}
            </h3>

            {/* Quote block */}
            <blockquote style={{
                margin: "0 0 16px",
                padding: "14px 18px",
                borderLeft: `3px solid ${BLUE}`,
                background: `linear-gradient(135deg, ${BLUE_LIGHT}60, transparent)`,
                borderRadius: "0 12px 12px 0",
                position: "relative", zIndex: 1,
            }}>
                <p style={{
                    fontSize: 13, color: BLUE,
                    fontWeight: 600, lineHeight: 1.7,
                    margin: 0, fontStyle: "normal",
                }}>
                    &ldquo;{p.quote}&rdquo;
                </p>
            </blockquote>

            {/* Description */}
            <p style={{
                fontSize: 14, color: "#475569",
                lineHeight: 1.8, margin: 0,
                position: "relative", zIndex: 1,
                flexGrow: 1,
            }}>
                {p.desc}
            </p>
        </motion.div>
    );
}

/* ── Main Section ── */
export default function Philosophy() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const storyRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
    const storyInView = useInView(storyRef, { once: true, margin: "-60px" });

    return (
        <section
            ref={sectionRef}
            id="philosophy"
            aria-labelledby="philosophy-heading"
            style={{
                padding: "clamp(80px, 12vw, 140px) 0",
                background: "#ffffff",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Decorative orbs */}
            <div style={{
                position: "absolute", top: "8%", left: "3%",
                width: 480, height: 480, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(37,99,235,0.05), transparent 70%)",
                filter: "blur(90px)", pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: "10%", right: "3%",
                width: 400, height: 400, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)",
                filter: "blur(80px)", pointerEvents: "none",
            }} />

            <div className="container-nod">

                {/* ── Section Header ── */}
                <div ref={headerRef} style={{ marginBottom: 72, textAlign: "center", position: "relative", zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={headerInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7 }}
                    >
                        <span style={{
                            display: "inline-block",
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: BLUE,
                            padding: "6px 20px", borderRadius: 999,
                            background: `linear-gradient(135deg, ${BLUE_LIGHT}, #eff6ff)`,
                            border: `1px solid rgba(37,99,235,0.15)`,
                            marginBottom: 20,
                        }}>
                            Educational Philosophy
                        </span>
                    </motion.div>

                    <motion.h2
                        id="philosophy-heading"
                        initial={{ opacity: 0, y: 32 }}
                        animate={headerInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                            fontWeight: 800, color: "#0f172a",
                            lineHeight: 1.1, letterSpacing: "-0.03em",
                            marginBottom: 20,
                        }}
                    >
                        코딩쏙의 교육 철학
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={headerInView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.25, duration: 0.8 }}
                        style={{
                            fontSize: "clamp(15px, 2vw, 18px)", color: "#64748b",
                            maxWidth: 560, margin: "0 auto", lineHeight: 1.7,
                        }}
                    >
                        개발자를 만들려고 코딩을 가르치는 게 아닙니다. 어떤 문제든 포기하지 않고 해결하는 아이를 만듭니다.
                    </motion.p>
                </div>

                {/* ── Origin Story ── */}
                <motion.div
                    ref={storyRef}
                    initial={{ opacity: 0, y: 40 }}
                    animate={storyInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        maxWidth: 820, margin: "0 auto 80px",
                        position: "relative", zIndex: 1,
                    }}
                >
                    <div style={{
                        background: `linear-gradient(135deg, ${BLUE_LIGHT}40, #f8faff)`,
                        border: `1px solid rgba(37,99,235,0.12)`,
                        borderRadius: 24,
                        padding: "clamp(32px, 5vw, 52px)",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Large decorative quote mark */}
                        <div style={{
                            position: "absolute", top: 16, left: 24,
                            fontSize: 120, fontFamily: "Georgia, serif",
                            color: `rgba(37,99,235,0.07)`, lineHeight: 1,
                            userSelect: "none", pointerEvents: "none",
                            fontWeight: 700,
                        }} aria-hidden="true">
                            &ldquo;
                        </div>

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
                                textTransform: "uppercase", color: BLUE,
                                marginBottom: 20,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: BLUE }}>
                                    history_edu
                                </span>
                                Origin Story
                            </span>

                            <p style={{
                                fontSize: "clamp(16px, 2.2vw, 20px)",
                                color: "#1e293b", lineHeight: 1.8,
                                fontWeight: 500, marginBottom: 20,
                            }}>
                                코딩쏙을 시작할 때 스스로에게 물었습니다.
                                <br />
                                <em style={{ fontStyle: "normal", color: BLUE, fontWeight: 700 }}>
                                    &ldquo;개발자 만들려고 코딩 가르치는 거 아니에요.&rdquo;
                                </em>
                            </p>

                            <p style={{
                                fontSize: "clamp(14px, 1.8vw, 16px)",
                                color: "#475569", lineHeight: 1.9, margin: 0,
                            }}>
                                코딩을 가르치다 보니 깨달았습니다. 아이들이 버그를 고치는 그 순간, 논리를 쪼개고 다시 조립하는 그 과정이 — 수학이든, 작문이든, 사회생활이든 — 어디서나 쓰이는 사고 방식이라는 것을. 코딩쏙의 수업은 코드를 완성하는 것이 목표가 아닙니다. 코드를 통해 생각하는 법을 배우는 것이 목표입니다.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ── 4 Philosophy Cards ── */}
                <div
                    className="philosophy-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "clamp(18px, 2.5vw, 28px)",
                        position: "relative", zIndex: 1,
                        marginBottom: 72,
                    }}
                >
                    <style>{`
@media (max-width: 720px) {
  .philosophy-grid { grid-template-columns: 1fr !important; }
}
                    `}</style>
                    {philosophies.map((p, i) => (
                        <PhilosophyCard key={p.num} p={p} i={i} />
                    ))}
                </div>

                {/* ── Student Success Highlight ── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: "relative", zIndex: 1 }}
                >
                    <div style={{
                        textAlign: "center", marginBottom: 32,
                    }}>
                        <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: BLUE,
                            padding: "5px 16px", borderRadius: 999,
                            background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`,
                        }}>
                            Student Achievements
                        </span>
                        <p style={{
                            fontSize: "clamp(18px, 2.5vw, 22px)",
                            fontWeight: 700, color: "#0f172a",
                            marginTop: 16, letterSpacing: "-0.02em",
                        }}>
                            철학이 만든 결과
                        </p>
                    </div>

                    <div
                        className="achievements-row"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "clamp(14px, 2vw, 24px)",
                            maxWidth: 760, margin: "0 auto",
                        }}
                    >
                        <style>{`
@media (max-width: 560px) {
  .achievements-row { grid-template-columns: 1fr !important; }
}
                        `}</style>
                        {achievements.map((a, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    background: "#ffffff",
                                    border: `1px solid rgba(37,99,235,0.12)`,
                                    borderRadius: 16,
                                    padding: "24px 28px",
                                    display: "flex", alignItems: "flex-start", gap: 16,
                                    boxShadow: "0 2px 16px rgba(37,99,235,0.06)",
                                }}
                                whileHover={{
                                    boxShadow: "0 8px 32px rgba(37,99,235,0.12)",
                                    borderColor: "rgba(37,99,235,0.22)",
                                    y: -2,
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_MID})`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: `1px solid rgba(37,99,235,0.15)`,
                                }}>
                                    {a.icon}
                                </div>
                                <div>
                                    <p style={{
                                        fontSize: 14, fontWeight: 700, color: "#0f172a",
                                        marginBottom: 6, letterSpacing: "-0.01em",
                                    }}>
                                        {a.name}
                                    </p>
                                    <p style={{
                                        fontSize: 13, color: "#64748b",
                                        lineHeight: 1.6, margin: 0,
                                    }}>
                                        {a.detail}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
