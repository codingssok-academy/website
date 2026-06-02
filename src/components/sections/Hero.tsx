"use client";

import { useRef } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
} from "framer-motion";
import { ArrowDown, Route } from "lucide-react";

/* ══════════════════════════════════════════
   Hero — 화이트 배경 이미지 + 다크 텍스트
   ══════════════════════════════════════════ */

const ease = [0.25, 0.1, 0, 1] as const;

const heroMobileStyles = `
.hero-title {
  font-size: 64px;
}
.hero-copy {
  font-size: 17px;
}
@media (max-width: 480px) {
  .hero-title {
    font-size: 38px !important;
  }
  .hero-copy {
    font-size: 15px !important;
  }
  .hero-cta-wrap {
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100%;
    max-width: 320px;
  }
  .hero-cta-secondary {
    justify-content: center;
    width: 100%;
  }
  .hero-bottom-bar {
    padding: 0 16px 20px !important;
    flex-wrap: wrap;
    gap: 12px;
  }
  .hero-stats {
    gap: 20px !important;
  }
}
`;

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });

    const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -80]), {
        stiffness: 80,
        damping: 25,
    });
    const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
    // 배경 이미지 제거됨 — 순수 화이트 + 미세 그리드 + 그라데이션 오브로 대체 (피드백 #A)

    return (
        <>
        <style>{heroMobileStyles}</style>
        <section
            ref={sectionRef}
            id="hero"
            style={{
                position: "relative",
                width: "100%",
                height: "88vh",
                minHeight: 560,
                maxHeight: 860,
                overflow: "hidden",
                background: "#0f172a",
            }}
        >
            {/* 교실 배경 이미지 */}
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "url(/images/hero-classroom.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center 40%",
                backgroundRepeat: "no-repeat",
            }} />
            {/* 다크 오버레이 — 텍스트 가독성 */}
            <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.3) 40%, rgba(15,23,42,0.7) 100%)",
            }} />

            {/* ── 콘텐츠 ── */}
            <motion.div
                style={{
                    y,
                    opacity: contentOpacity,
                    position: "relative",
                    zIndex: 10,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "0 24px",
                }}
            >
                {/* 뱃지 */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease }}
                    style={{ marginBottom: 28 }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#fff",
                            padding: "6px 16px",
                            borderRadius: 99,
                            border: "1px solid rgba(255,255,255,0.25)",
                            letterSpacing: 0,
                            background: "rgba(255,255,255,0.1)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        대전 관평동 차세대 코딩학원
                    </span>
                </motion.div>

                {/* 헤드라인 */}
                <motion.h1
                    className="hero-title"
                    style={{
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: 0,
                        margin: "0 0 24px",
                        maxWidth: 820,
                        color: "#ffffff",
                    }}
                >
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5, ease }}
                        style={{ display: "block" }}
                    >
                        코딩쏙
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8, ease }}
                        style={{
                            display: "block",
                            background: "linear-gradient(135deg, #38bdf8, #fbbf24)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        차세대 코딩학원
                    </motion.span>
                </motion.h1>

                {/* 서브 카피 */}
                <motion.p
                    className="hero-copy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.2, ease }}
                    style={{
                        color: "rgba(255,255,255,0.75)",
                        lineHeight: 1.7,
                        margin: "0 0 40px",
                        fontWeight: 400,
                        letterSpacing: 0,
                        maxWidth: 620,
                    }}
                >
                    AI가 만든 코드도 이해하고, 고치고, 자기 결과물로 증명하는 학원.
                    <br />
                    진단 테스트부터 공통기초, 성향별 트랙, 학부모 성장 리포트까지 연결합니다.
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 1.5, ease }}
                    className="hero-cta-wrap"
                    style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
                >
                    <motion.a
                        href="#growth-platform"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "14px 30px",
                            borderRadius: 12,
                            background: "#ffffff",
                            color: "#0f172a",
                            fontSize: 15,
                            fontWeight: 800,
                            textDecoration: "none",
                            letterSpacing: 0,
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.8)",
                            minHeight: 48,
                        }}
                    >
                        <Route size={18} />
                        성장 플랫폼 보기
                    </motion.a>
                    <motion.a
                        href="#curriculum"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="hero-cta-secondary"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "14px 32px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(12px)",
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: 800,
                            textDecoration: "none",
                            letterSpacing: 0,
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.25)",
                            minHeight: 48,
                        }}
                    >
                        <ArrowDown size={18} />
                        커리큘럼 보기
                    </motion.a>
                </motion.div>
            </motion.div>

            {/* ── 하단 ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="hero-bottom-bar"
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    padding: "0 clamp(24px, 5vw, 48px) 32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                }}
            >
                {/* 숫자 */}
                <div className="hero-stats" style={{ display: "flex", gap: "clamp(24px, 4vw, 48px)" }}>
                    {[
                        { val: "6", label: "성장 단계" },
                        { val: "4", label: "성향별 트랙" },
                        { val: "10", label: "기록 메뉴" },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.2 + i * 0.15, duration: 0.6, ease }}
                        >
                            <div style={{
                                fontSize: 28,
                                fontWeight: 700,
                                color: "#ffffff",
                                letterSpacing: 0,
                                lineHeight: 1,
                            }}>
                                {s.val}
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.5)",
                                fontWeight: 500,
                                marginTop: 4,
                                letterSpacing: 0,
                            }}>
                                {s.label}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 스크롤 힌트 */}
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <span style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: 0,
                        textTransform: "uppercase" as const,
                    }}>
                        Scroll
                    </span>
                    <div style={{
                        width: 1,
                        height: 32,
                        background: "linear-gradient(to bottom, #94a3b8, transparent)",
                    }} />
                </motion.div>
            </motion.div>
        </section>
        </>
    );
}
