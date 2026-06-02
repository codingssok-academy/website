"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CountUp from "react-countup";
import TextReveal from "@/components/ui/TextReveal";

gsap.registerPlugin(ScrollTrigger);

/*
  Why 코딩쏙 — Ultra Premium White-Blue
  Tech: GSAP ScrollTrigger parallax, react-countup, framer-motion spring physics,
        magnetic cursor tilt, stagger reveals, animated gradient borders
*/

/* ── SVG Icons ── */
function CalendarIcon({ color }: { color: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <rect x="7" y="14" width="3" height="3" rx="0.5" fill={color} opacity="0.3" />
            <rect x="11" y="14" width="3" height="3" rx="0.5" fill={color} opacity="0.5" />
            <rect x="15" y="14" width="3" height="3" rx="0.5" fill={color} opacity="0.7" />
        </svg>
    );
}

function TimerIcon({ color }: { color: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="13" r="8" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M12 9v4l2.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 2h4M12 2v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 7l-1.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CoachIcon({ color }: { color: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 3c1.66 0 3 1.34 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M9 3C7.34 3 6 4.34 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
    );
}

const reasons = [
    {
        number: "01",
        title: "월 5회/8회 시스템",
        subtitle: "배움을 완성하는 체계",
        desc: "한 달 4회는 진도 나가기 바쁩니다. 코딩쏙은 4번의 프로젝트와 1번의 '플러스 쏙(1:1 보완)'으로 배움을 완성합니다.",
        details: ["프로젝트 4회 + 보완 1회", "8회 코스로 심화 가능", "매주 성장 리포트 발송"],
        IconComponent: CalendarIcon,
        accentColor: "#3b82f6",
        gradientFrom: "#dbeafe",
        gradientTo: "#bfdbfe",
        countTo: 5,
        countSuffix: "+",
        countLabel: "회 / 월",
    },
    {
        number: "02",
        title: "90분 몰입 수업",
        subtitle: "최적의 집중 시간",
        desc: "초등학생 집중력이 가장 높은 90분 수업. 더 자주, 더 즐겁게 만나며 코딩 습관을 만듭니다.",
        details: ["집중력 극대화 90분", "실습 60% + 이론 40%", "매회 완성형 프로젝트"],
        IconComponent: TimerIcon,
        accentColor: "#0ea5e9",
        gradientFrom: "#e0f2fe",
        gradientTo: "#bae6fd",
        countTo: 90,
        countSuffix: "",
        countLabel: "분 / 회",
    },
    {
        number: "03",
        title: "1:6 소수 정예",
        subtitle: "아이의 속도에 맞춘 밀착 코칭",
        desc: "선생님의 기준이 아닌 아이의 속도에 맞춘 밀착 코칭과 매주 발송되는 성장 리포트로 안심을 더합니다.",
        details: ["개인별 맞춤 커리큘럼", "실시간 1:1 피드백", "학부모 성장 리포트"],
        IconComponent: CoachIcon,
        accentColor: "#3b82f6",
        gradientFrom: "#e0e7ff",
        gradientTo: "#c7d2fe",
        countTo: 0,
        countSuffix: "",
        countLabel: "밀착 코칭",
    },
];

/* ── Magnetic Tilt Card with GSAP parallax ── */
function FeatureCard({ r, i }: { r: typeof reasons[0]; i: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: "-80px" });
    const [counting, setCounting] = useState(false);

    // Magnetic spring tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
    const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });

    useEffect(() => {
        if (isInView) setCounting(true);
    }, [isInView]);

    // GSAP parallax on scroll
    useEffect(() => {
        if (!innerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(innerRef.current, {
                y: 40 + i * 15,
            }, {
                y: -20,
                ease: "none",
                scrollTrigger: {
                    trigger: innerRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                },
            });
        });
        return () => ctx.revert();
    }, [i]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        rotateX.set(-y * 15);
        rotateY.set(x * 15);
        mouseX.set(x * 30);
        mouseY.set(y * 30);
    }, [rotateX, rotateY, mouseX, mouseY]);

    const handleMouseLeave = useCallback(() => {
        rotateX.set(0); rotateY.set(0);
        mouseX.set(0); mouseY.set(0);
    }, [rotateX, rotateY, mouseX, mouseY]);

    const IconComp = r.IconComponent;

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 80, scale: 0.92 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: i * 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1200 }}
        >
            <motion.div
                ref={innerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX, rotateY,
                    background: "rgba(255, 255, 255, 0.98)",
                    borderRadius: 24,
                    padding: "clamp(32px, 4vw, 48px)",
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(59,130,246,0.1)",
                    boxShadow: "0 8px 40px rgba(59,130,246,0.06), 0 0 0 1px rgba(255,255,255,0.8) inset",
                    cursor: "default",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
                whileHover={{
                    boxShadow: `0 24px 80px ${r.accentColor}15, 0 0 0 1.5px ${r.accentColor}20, 0 0 0 1px rgba(255,255,255,0.8) inset`,
                }}
                transition={{ duration: 0.4 }}
            >
                {/* Animated top gradient accent */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, transparent, ${r.accentColor}, transparent)`,
                        borderRadius: "24px 24px 0 0",
                        transformOrigin: "left",
                    }}
                />

                {/* Floating gradient orb — parallax layer */}
                <motion.div
                    style={{
                        position: "absolute", top: "-40%", right: "-30%",
                        width: "80%", height: "80%", borderRadius: "50%",
                        background: `radial-gradient(circle, ${r.gradientFrom}60, transparent 70%)`,
                        filter: "blur(50px)", pointerEvents: "none",
                        x: mouseX, y: mouseY,
                    }}
                />

                {/* STEP badge + Icon */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, position: "relative", zIndex: 1 }}>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.4 + i * 0.2, type: "spring", stiffness: 300, damping: 15 }}
                        style={{
                            fontSize: 11, color: r.accentColor, fontWeight: 700, letterSpacing: "0.15em",
                            padding: "6px 16px", borderRadius: 10,
                            background: `linear-gradient(135deg, ${r.gradientFrom}, ${r.gradientTo})`,
                            border: `1px solid ${r.accentColor}20`,
                        }}
                    >
                        STEP {r.number}
                    </motion.span>
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={isInView ? { scale: 1, rotate: 0 } : {}}
                        transition={{ delay: 0.5 + i * 0.2, type: "spring", stiffness: 200, damping: 12 }}
                        style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: `linear-gradient(135deg, ${r.gradientFrom}, ${r.gradientTo})`,
                            border: `1px solid ${r.accentColor}15`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: `0 8px 24px ${r.accentColor}12`,
                            transform: "translateZ(30px)",
                        }}
                    >
                        <IconComp color={r.accentColor} />
                    </motion.div>
                </div>

                {/* Animated stat number — react-countup */}
                <div style={{ marginBottom: 24, position: "relative", zIndex: 1 }}>
                    <span style={{
                        fontSize: "clamp(48px, 6vw, 64px)",
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800, lineHeight: 1,
                        background: `linear-gradient(135deg, ${r.accentColor}, #1e293b)`,
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.04em",
                    }}>
                        {r.countTo === 0 ? "1:6" : (
                            counting ? (
                                <CountUp end={r.countTo} duration={2} suffix={r.countSuffix} useEasing />
                            ) : "0"
                        )}
                    </span>
                    <span style={{
                        fontSize: 13, color: "#94a3b8", marginLeft: 12, fontWeight: 500,
                        letterSpacing: "0.02em",
                    }}>
                        {r.countLabel}
                    </span>
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: "clamp(22px, 3vw, 26px)", fontWeight: 800,
                    color: "#0f172a", marginBottom: 8, lineHeight: 1.2,
                    position: "relative", zIndex: 1, letterSpacing: "-0.02em",
                }}>
                    {r.title}
                </h3>

                {/* Subtitle */}
                <p style={{
                    fontSize: 13, color: r.accentColor, fontWeight: 600,
                    letterSpacing: "0.03em", marginBottom: 16,
                    position: "relative", zIndex: 1,
                }}>
                    {r.subtitle}
                </p>

                {/* Divider */}
                <div style={{
                    width: "100%", height: 1, marginBottom: 16,
                    background: `linear-gradient(90deg, transparent, ${r.accentColor}20, transparent)`,
                }} />

                {/* Description */}
                <p style={{
                    fontSize: 14, color: "#475569", lineHeight: 1.8, marginBottom: 24,
                    position: "relative", zIndex: 1,
                }}>
                    {r.desc}
                </p>

                {/* Detail bullets with staggered entrance */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
                    {r.details.map((d, di) => (
                        <motion.div
                            key={di}
                            initial={{ opacity: 0, x: -20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 0.8 + i * 0.2 + di * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "8px 14px", borderRadius: 10,
                                background: `linear-gradient(135deg, ${r.gradientFrom}40, transparent)`,
                                border: `1px solid ${r.accentColor}08`,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke={r.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{d}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function WhyUs() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    // GSAP header parallax
    useEffect(() => {
        if (!headerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(headerRef.current, { y: 0 }, {
                y: -40,
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "center center",
                    scrub: 1,
                },
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            style={{
                padding: "clamp(80px, 12vw, 140px) 0",
                background: "#ffffff",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Decorative floating orbs */}
            <div style={{ position: "absolute", top: "5%", left: "5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.04), transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

            <div className="container-nod">
                {/* Section Header */}
                <div ref={headerRef} style={{ marginBottom: 72, textAlign: "center", position: "relative", zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span style={{
                            display: "inline-block",
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                            color: "#3b82f6", marginBottom: 16,
                            padding: "6px 20px", borderRadius: 999,
                            background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                            border: "1px solid rgba(59,130,246,0.15)",
                        }}>
                            Why 코딩쏙
                        </span>
                    </motion.div>
                    <TextReveal
                        as="h2"
                        className="text-center"
                        style={{
                            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                            fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em",
                            marginTop: 20,
                        }}
                    >
                        코딩쏙을 선택하는 이유
                    </TextReveal>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        style={{
                            fontSize: "clamp(15px, 2vw, 18px)", color: "#64748b",
                            marginTop: 20, maxWidth: 520, margin: "20px auto 0",
                            lineHeight: 1.7,
                        }}
                    >
                        월 5회 수업 구조, 90분 집중 수업, 1:6 소수 정예 — 세 가지 운영 원칙이 코딩쏙의 기준입니다.
                    </motion.p>
                </div>

                {/* Feature Cards Grid */}
                <div className="whyus-grid" style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "clamp(20px, 3vw, 32px)",
                    position: "relative", zIndex: 1,
                }}>
                    <style>{`
@media (max-width: 900px) {
  .whyus-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (max-width: 600px) {
  .whyus-grid { grid-template-columns: 1fr !important; }
}
                    `}</style>
                    {reasons.map((r, i) => (
                        <FeatureCard key={r.number} r={r} i={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
