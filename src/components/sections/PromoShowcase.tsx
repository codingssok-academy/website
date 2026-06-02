"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

/*
  PromoShowcase — Interactive 3D Image Slider
  Tech: framer-motion AnimatePresence slide transitions, GSAP parallax,
        auto-play timer, magnetic cursor, 3D perspective, floating code symbols,
        progress indicators, glassmorphism controls
*/

const slides = [
    {
        src: "/images/promo/codingssok-1.jpg",
        alt: "코딩쏙학원 - 미래형 코딩 교실",
        title: "미래형 코딩 교실",
        subtitle: "아이들이 직접 코드를 만들어가는 공간",
    },
    {
        src: "/images/promo/codingssok-2.jpg",
        alt: "코딩쏙학원 - 글로벌 코딩 교육",
        title: "글로벌 코딩 교육",
        subtitle: "세계와 연결되는 코딩 커리큘럼",
    },
    {
        src: "/images/promo/codingssok-3.jpg",
        alt: "코딩쏙학원 - 코드 블록 빌딩",
        title: "놀이처럼 배우는 코딩",
        subtitle: "블록 코딩부터 텍스트 코딩까지",
    },
    {
        src: "/images/promo/codingssok-4.jpg",
        alt: "코딩쏙학원 - 홀로그래픽 코딩 체험",
        title: "홀로그래픽 코딩 체험",
        subtitle: "최신 기술로 코딩 실력을 키워요",
    },
];

/* ── Floating Code Symbols ── */
const floatingSymbols = [
    { text: "< / >", color: "#3b82f6", size: 20, top: "10%", left: "4%" },
    { text: "{ }", color: "#3b82f6", size: 18, top: "20%", right: "5%" },
    { text: "print()", color: "#0ea5e9", size: 14, bottom: "25%", left: "3%" },
    { text: "→", color: "#2563eb", size: 22, bottom: "15%", right: "4%" },
    { text: "#", color: "#2563eb", size: 16, top: "50%", left: "2%" },
    { text: "[ ]", color: "#3b82f6", size: 18, top: "40%", right: "3%" },
];

/* ── Slide transition variants ── */
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.9,
        rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        rotateY: 0,
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
    exit: (direction: number) => ({
        x: direction > 0 ? "-60%" : "60%",
        opacity: 0,
        scale: 0.85,
        rotateY: direction > 0 ? -10 : 10,
        transition: { duration: 0.5, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] },
    }),
};

export default function PromoShowcase() {
    const sectionRef = useRef<HTMLElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const AUTOPLAY_INTERVAL = 5000;

    // Auto-play with progress
    useEffect(() => {
        if (isPaused) return;
        const startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(elapsed / AUTOPLAY_INTERVAL, 1);
            setProgress(p);
        }, 30);

        const auto = setTimeout(() => {
            setDirection(1);
            setActiveIndex((prev) => (prev + 1) % slides.length);
            setProgress(0);
        }, AUTOPLAY_INTERVAL);

        return () => { clearTimeout(auto); clearInterval(timer); };
    }, [activeIndex, isPaused]);

    const goToSlide = useCallback((index: number) => {
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
        setProgress(0);
    }, [activeIndex]);

    const goNext = useCallback(() => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % slides.length);
        setProgress(0);
    }, []);

    const goPrev = useCallback(() => {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
        setProgress(0);
    }, []);

    // Magnetic cursor tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useSpring(mouseY, { stiffness: 100, damping: 30 });
    const rotateY = useSpring(mouseX, { stiffness: 100, damping: 30 });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 6);
        mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * -4);
    }, [mouseX, mouseY]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0); mouseY.set(0);
    }, [mouseX, mouseY]);

    return (
        <section
            ref={sectionRef}
            id="promo-showcase"
            style={{
                padding: "clamp(60px, 10vw, 140px) 0",
                background: "#ffffff",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <style>{`
@media (max-width: 640px) {
  #promo-showcase .promo-thumbnail {
    width: clamp(60px, 20vw, 100px) !important;
  }
}
`}</style>
            {/* Floating code symbols */}
            {floatingSymbols.map((sym, i) => (
                <motion.span
                    key={i}
                    animate={{
                        y: [0, -12, 0, 8, 0],
                        rotate: [0, 3, -3, 2, 0],
                        opacity: [0.2, 0.4, 0.3, 0.4, 0.2],
                    }}
                    transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        top: sym.top, left: sym.left, right: sym.right, bottom: sym.bottom,
                        fontSize: sym.size, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700, color: sym.color, opacity: 0.2,
                        pointerEvents: "none", zIndex: 0,
                        filter: `drop-shadow(0 0 6px ${sym.color}30)`,
                    }}
                >{sym.text}</motion.span>
            ))}

            {/* Ambient orbs */}
            <div style={{ position: "absolute", top: "10%", left: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />

            <div className="u-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: "center", marginBottom: 56 }}
                >
                    <span style={{
                        display: "inline-block", padding: "7px 22px", borderRadius: 999,
                        background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
                        color: "#2563eb", fontSize: 12, fontWeight: 700,
                        letterSpacing: "0.12em", marginBottom: 20,
                        border: "1px solid rgba(79,70,229,0.12)",
                    }}>
                        코딩쏙학원
                    </span>
                    <h2 style={{
                        fontSize: "clamp(28px, 4.5vw, 48px)",
                        fontWeight: 800, color: "#0f172a",
                        letterSpacing: "-0.03em", lineHeight: 1.2, margin: 0,
                    }}>
                        코딩이 우리 아이 머리속으로{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #3b82f6, #3b82f6)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>쏙!</span>
                    </h2>
                </motion.div>

                {/* ── Main Slider ── */}
                <motion.div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseOut={() => setIsPaused(false)}
                    style={{
                        position: "relative",
                        borderRadius: 28,
                        overflow: "hidden",
                        aspectRatio: "4 / 3",
                        background: "#e2e8f0",
                        boxShadow: "0 24px 80px rgba(59,130,246,0.12), 0 0 0 1px rgba(59,130,246,0.06)",
                        perspective: 1200,
                        rotateX, rotateY,
                        transformStyle: "preserve-3d",
                        cursor: "default",
                    }}
                >
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={activeIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            style={{
                                position: "absolute", inset: 0,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <Image
                                src={slides[activeIndex].src}
                                alt={slides[activeIndex].alt}
                                fill
                                sizes="(max-width: 1200px) 100vw, 1200px"
                                style={{ objectFit: "cover" }}
                                priority={activeIndex === 0}
                            />
                            {/* Gradient overlay */}
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                                pointerEvents: "none",
                            }} />

                            {/* Slide text */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0,
                                    padding: "clamp(24px, 4vw, 48px)",
                                }}
                            >
                                <p style={{
                                    fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)",
                                    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
                                }}>
                                    {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                                </p>
                                <h3 style={{
                                    fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
                                    color: "#fff", marginBottom: 8, lineHeight: 1.2,
                                    letterSpacing: "-0.02em",
                                    textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                                }}>
                                    {slides[activeIndex].title}
                                </h3>
                                <p style={{
                                    fontSize: "clamp(14px, 1.5vw, 17px)", color: "rgba(255,255,255,0.85)",
                                    fontWeight: 500, marginBottom: 20,
                                }}>
                                    {slides[activeIndex].subtitle}
                                </p>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* ── Nav Arrows ── */}
                    <button
                        onClick={goPrev}
                        style={{
                            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                            width: 48, height: 48, borderRadius: "50%",
                            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff", fontSize: 20, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s", zIndex: 10,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={goNext}
                        style={{
                            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                            width: 48, height: 48, borderRadius: "50%",
                            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff", fontSize: 20, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s", zIndex: 10,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                    >
                        ›
                    </button>
                </motion.div>

                {/* ── Thumbnail Strip + Progress ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 12, marginTop: 24, flexWrap: "wrap", padding: "0 8px",
                }}>
                    {slides.map((slide, i) => (
                        <motion.button
                            key={i}
                            onClick={() => goToSlide(i)}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="promo-thumbnail"
                            style={{
                                position: "relative",
                                width: "clamp(72px, 12vw, 140px)",
                                aspectRatio: "16 / 10",
                                borderRadius: 14,
                                overflow: "hidden",
                                border: i === activeIndex ? "2.5px solid #3b82f6" : "2px solid transparent",
                                boxShadow: i === activeIndex
                                    ? "0 8px 24px rgba(59,130,246,0.2)"
                                    : "0 2px 12px rgba(0,0,0,0.06)",
                                cursor: "pointer",
                                background: "#fff",
                                padding: 0,
                                transition: "border 0.3s, box-shadow 0.3s",
                            }}
                        >
                            <Image
                                src={slide.src}
                                alt={slide.alt}
                                fill
                                sizes="140px"
                                style={{
                                    objectFit: "cover",
                                    opacity: i === activeIndex ? 1 : 0.5,
                                    transition: "opacity 0.3s",
                                }}
                            />
                            {/* Progress bar on active thumbnail */}
                            {i === activeIndex && (
                                <div style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                                    background: "rgba(255,255,255,0.3)",
                                }}>
                                    <motion.div
                                        style={{
                                            height: "100%",
                                            background: "linear-gradient(90deg, #3b82f6, #3b82f6)",
                                            width: `${progress * 100}%`,
                                            borderRadius: 3,
                                        }}
                                    />
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>
        </section>
    );
}
