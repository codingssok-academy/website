"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ── SVG Icons (Material Symbols style) ── */
function CodeIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 6L2 12l6 6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 6l6 6-6 6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 4l-5 16" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
    );
}

function EducationIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3L2 8l10 5 10-5-10-5z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 10.5V16c0 0 2 2 6 2s6-2 6-2v-5.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 8v5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function QuoteIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="#2563EB" opacity="0.15" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="#2563EB" opacity="0.15" />
        </svg>
    );
}

const teachers = [
    {
        id: "goo",
        name: "구자현 선생님",
        role: "소프트웨어 강사",
        roleLabel: "INSTRUCTOR",
        tagline: "AI 개발 · IoT · 하드웨어",
        IconComponent: CodeIcon,
        skills: [
            "실무 개발자 출신",
            "AI 개발 및 활용 전문",
            "하드웨어 및 마이크로프로세서 설계/제작",
            "IoT 시스템 개발",
            "관련 자격증 다수 보유",
            "학생 맞춤 1:1 코드 리뷰",
        ],
        quote: "코드를 외우는 게 아니라\n생각하는 법을 가르칩니다",
        initials: "구",
    },
    {
        id: "jang",
        name: "장민 원장님",
        role: "교육 총괄",
        roleLabel: "DIRECTOR",
        tagline: "교육 설계 · 코칭 · 학부모 소통",
        IconComponent: EducationIcon,
        skills: [
            "교육 과정 설계 전문",
            "학생 마인드셋 코칭",
            "학부모 소통 및 상담",
            "학습 동기 부여 전문",
            "개인별 성장 로드맵 설계",
            "학원 운영 및 교육 철학 수립",
        ],
        quote: "기술보다 중요한 건\n아이의 자신감입니다",
        initials: "장",
    },
];

function TeacherCard({ teacher, index }: { teacher: typeof teachers[0]; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: "-60px" });
    const IconComp = teacher.IconComponent;

    return (
        <motion.article
            ref={cardRef}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            aria-label={`${teacher.name} 소개`}
            style={{
                background: "#ffffff",
                border: "1px solid rgba(37,99,235,0.1)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(37,99,235,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
            }}
            whileHover={{
                boxShadow: "0 16px 56px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                y: -4,
            }}
        >
            {/* Top accent bar */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.3 + index * 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    height: 3,
                    background: "linear-gradient(90deg, transparent, #2563EB, #60a5fa, transparent)",
                    transformOrigin: "left",
                }}
            />

            <div style={{ padding: "clamp(28px, 4vw, 44px)" }}>
                {/* Header: avatar + name block */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: 18,
                        background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                        border: "1px solid rgba(37,99,235,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        position: "relative",
                    }}>
                        <span style={{
                            fontSize: 26,
                            fontWeight: 800,
                            color: "#2563EB",
                            fontFamily: "'Outfit', 'Pretendard', sans-serif",
                            letterSpacing: "-0.02em",
                        }}>
                            {teacher.initials}
                        </span>
                    </div>

                    {/* Name + role */}
                    <div style={{ flex: 1 }}>
                        <span style={{
                            display: "inline-block",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            color: "#2563EB",
                            background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                            border: "1px solid rgba(37,99,235,0.15)",
                            padding: "3px 10px",
                            borderRadius: 6,
                            marginBottom: 8,
                        }}>
                            {teacher.roleLabel}
                        </span>
                        <h3 style={{
                            fontSize: "clamp(18px, 2.5vw, 22px)",
                            fontWeight: 800,
                            color: "#0f172a",
                            lineHeight: 1.15,
                            letterSpacing: "-0.02em",
                            marginBottom: 4,
                        }}>
                            {teacher.name}
                        </h3>
                        <p style={{
                            fontSize: 13,
                            color: "#64748b",
                            fontWeight: 500,
                        }}>
                            {teacher.role}
                        </p>
                    </div>

                    {/* Icon */}
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                        border: "1px solid rgba(37,99,235,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <IconComp />
                    </div>
                </div>

                {/* Tagline */}
                <p style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563EB",
                    letterSpacing: "0.06em",
                    marginBottom: 20,
                    opacity: 0.8,
                }}>
                    {teacher.tagline}
                </p>

                {/* Divider */}
                <div style={{
                    height: 1,
                    background: "linear-gradient(90deg, rgba(37,99,235,0.12), transparent)",
                    marginBottom: 20,
                }} />

                {/* Skills list */}
                <ul
                    style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: 8 }}
                    aria-label={`${teacher.name} 전문 분야`}
                >
                    {teacher.skills.map((skill, si) => (
                        <motion.li
                            key={si}
                            initial={{ opacity: 0, x: -16 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 0.5 + index * 0.18 + si * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "7px 12px",
                                borderRadius: 8,
                                background: "rgba(37,99,235,0.03)",
                                border: "1px solid rgba(37,99,235,0.06)",
                            }}
                        >
                            <span style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <CheckIcon />
                            </span>
                            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500, lineHeight: 1.4 }}>
                                {skill}
                            </span>
                        </motion.li>
                    ))}
                </ul>

                {/* Quote */}
                <motion.blockquote
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.9 + index * 0.18, duration: 0.7 }}
                    style={{
                        margin: 0,
                        padding: "18px 20px",
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #eff6ff, #dbeafe30)",
                        border: "1px solid rgba(37,99,235,0.1)",
                        position: "relative",
                    }}
                    cite={teacher.name}
                >
                    <div style={{ position: "absolute", top: 12, right: 14, opacity: 0.6 }}>
                        <QuoteIcon />
                    </div>
                    <p style={{
                        fontSize: "clamp(13px, 1.8vw, 15px)",
                        color: "#1e3a8a",
                        fontWeight: 600,
                        lineHeight: 1.65,
                        whiteSpace: "pre-line",
                        margin: 0,
                        fontStyle: "italic",
                        letterSpacing: "-0.01em",
                    }}>
                        &ldquo;{teacher.quote}&rdquo;
                    </p>
                    <footer style={{ marginTop: 10, fontSize: 11, color: "#64748b", fontWeight: 600, fontStyle: "normal" }}>
                        — {teacher.name}
                    </footer>
                </motion.blockquote>
            </div>
        </motion.article>
    );
}

export default function Teachers() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const isHeaderInView = useInView(headerRef, { once: true, margin: "-40px" });

    return (
        <section
            ref={sectionRef}
            id="teachers"
            aria-labelledby="teachers-heading"
            style={{
                padding: "clamp(80px, 12vw, 140px) 0",
                background: "#ffffff",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background decorative orbs */}
            <div style={{
                position: "absolute", top: "10%", left: "3%",
                width: 480, height: 480, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(37,99,235,0.05), transparent 70%)",
                filter: "blur(80px)", pointerEvents: "none",
            }} aria-hidden="true" />
            <div style={{
                position: "absolute", bottom: "10%", right: "3%",
                width: 360, height: 360, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)",
                filter: "blur(80px)", pointerEvents: "none",
            }} aria-hidden="true" />

            <div className="container-nod">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    style={{ marginBottom: 64, textAlign: "center", position: "relative", zIndex: 1 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase" as const,
                            color: "#2563EB",
                            padding: "6px 20px",
                            borderRadius: 999,
                            background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                            border: "1px solid rgba(37,99,235,0.15)",
                            marginBottom: 20,
                        }}>
                            코딩쏙의 선생님들
                        </span>
                    </motion.div>

                    <motion.h2
                        id="teachers-heading"
                        initial={{ opacity: 0, y: 28 }}
                        animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontSize: "clamp(1.9rem, 4.2vw, 3rem)",
                            fontWeight: 800,
                            color: "#0f172a",
                            lineHeight: 1.12,
                            letterSpacing: "-0.03em",
                            marginTop: 0,
                            marginBottom: 20,
                        }}
                    >
                        강사진 소개
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={isHeaderInView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.25, duration: 0.8 }}
                        style={{
                            fontSize: "clamp(14px, 1.8vw, 17px)",
                            color: "#64748b",
                            maxWidth: 500,
                            margin: "0 auto",
                            lineHeight: 1.75,
                        }}
                    >
                        실무 경험과 교육 전문성을 갖춘 두 선생님이 아이의 성장을 함께합니다.
                    </motion.p>
                </div>

                {/* Teacher Cards */}
                <div
                    className="teachers-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "clamp(20px, 3vw, 36px)",
                        position: "relative",
                        zIndex: 1,
                        maxWidth: 960,
                        margin: "0 auto",
                    }}
                >
                    <style>{`
@media (max-width: 720px) {
  .teachers-grid { grid-template-columns: 1fr !important; max-width: 480px !important; }
}
                    `}</style>
                    {teachers.map((teacher, index) => (
                        <TeacherCard key={teacher.id} teacher={teacher} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
