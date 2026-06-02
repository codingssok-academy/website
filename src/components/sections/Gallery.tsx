"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";

/* ═══════════════════════════════════════════
   Gallery — Quantum Horizon Nexus Ultra V2
   WHITE-BLUE color scheme | REAL 3D depth
   ═══════════════════════════════════════════ */

// public/images/academy 폴더 동기화 (담당자이 직접 삭제한 사진 반영). 폴더 ls 결과 그대로.
const ALL_PHOTOS = [
    "KakaoTalk_20250816_230722315.jpg",
    "KakaoTalk_20250816_230722315_01.jpg",
    "KakaoTalk_20250816_234926393_02.jpg",
    "KakaoTalk_20250816_234926393_03.jpg",
    "KakaoTalk_20251212_142853867.jpg",
    "KakaoTalk_20251224_221516694.jpg",
    "KakaoTalk_20251226_181412188.jpg",
    "KakaoTalk_20251226_181412669.jpg",
    "KakaoTalk_20260206_133836930.jpg",
    "KakaoTalk_20260206_133838050.jpg",
    "KakaoTalk_20260206_134501663.jpg",
    "KakaoTalk_20260207_115634269.jpg",
    "KakaoTalk_20260212_122504963.jpg",
    "KakaoTalk_20260212_201344853.jpg",
    "KakaoTalk_20260212_201442338.jpg",
    "KakaoTalk_20260214_114438151.jpg",
    "KakaoTalk_20260214_114735389.jpg",
    "KakaoTalk_20260214_114735389_01.jpg",
    "KakaoTalk_20260214_114735389_02.jpg",
    "KakaoTalk_20260214_114735389_03.jpg",
    "KakaoTalk_20260214_114735389_04.jpg",
    "KakaoTalk_20260214_114735389_05.jpg",
    "KakaoTalk_20260214_114735389_06.jpg",
    "KakaoTalk_20260214_114735389_07.jpg",
    "KakaoTalk_20260214_114735389_09.jpg",
    "KakaoTalk_20260214_114735389_10.jpg",
    "KakaoTalk_20260214_114735389_11.jpg",
    "KakaoTalk_20260214_114735389_12.jpg",
    "KakaoTalk_20260214_114735389_14.jpg",
    "KakaoTalk_20260214_114735389_16.jpg",
    "KakaoTalk_20260214_114735389_18.jpg",
    "KakaoTalk_20260214_123017775.jpg",
    "KakaoTalk_20260214_123024032.jpg",
    "KakaoTalk_20260214_123026088.jpg",
    "KakaoTalk_20260214_123026716.jpg",
    "KakaoTalk_20260214_123027107.jpg",
    "KakaoTalk_20260214_123027734.jpg",
    "KakaoTalk_20260214_123028480.jpg",
    "KakaoTalk_20260214_123029152.jpg",
    "KakaoTalk_20260214_123029845.jpg",
    "KakaoTalk_20260214_123030414.jpg",
    "KakaoTalk_20260214_123031142.jpg",
    "KakaoTalk_20260214_123031788.jpg",
    "KakaoTalk_20260214_123032353.jpg",
    "KakaoTalk_20260214_123032981.jpg",
    "KakaoTalk_20260214_123033611.jpg",
    "KakaoTalk_20260214_123034056.jpg",
    "KakaoTalk_20260214_123034850.jpg",
    "KakaoTalk_20260214_123035541.jpg",
    "KakaoTalk_20260214_123035986.jpg",
    "KakaoTalk_20260214_123036558.jpg",
    "KakaoTalk_20260214_123037260.jpg",
    "KakaoTalk_20260214_123038167.png",
    "KakaoTalk_20260214_123038843.jpg",
    "KakaoTalk_20260214_123039490.jpg",
    "KakaoTalk_20260214_123040117.jpg",
    "KakaoTalk_20260214_123040786.jpg",
    "KakaoTalk_20260214_123041444.jpg",
    "KakaoTalk_20260214_123042231.jpg",
    "KakaoTalk_20260214_123042591.jpg",
    "KakaoTalk_20260214_123043125.jpg",
    "KakaoTalk_20260214_123043602.jpg",
    "KakaoTalk_20260214_123044272.jpg",
    "KakaoTalk_20260214_123044689.jpg",
    "KakaoTalk_20260214_123045273.jpg",
    "KakaoTalk_20260214_123045815.jpg",
    "KakaoTalk_20260214_123046449.jpg",
    "KakaoTalk_20260214_123047141.jpg",
    "KakaoTalk_20260214_123047849.jpg",
    "KakaoTalk_20260214_123048638.jpg",
    "KakaoTalk_20260214_123049271.jpg",
    "KakaoTalk_20260214_123049679.jpg",
    "KakaoTalk_20260214_123050356.jpg",
    "KakaoTalk_20260214_123051075.jpg",
    "KakaoTalk_20260214_123051679.jpg",
    "KakaoTalk_20260214_123052223.jpg",
    "KakaoTalk_20260214_123052818.jpg",
    "KakaoTalk_20260214_123053322.jpg",
    "KakaoTalk_20260214_123053899.jpg",
    "KakaoTalk_20260214_123054533.jpg",
    "KakaoTalk_20260214_123055071.jpg",
    "KakaoTalk_20260214_123055304.jpg",
    "SE-c5ee429c-2cea-42af-836f-60c08db18ac5.jpg",
    "[현장사진] 스마트기술_도입_예정_공간(로비_및_강의실)1.jpg",
    "[현장사진] 스마트기술_도입_예정_공간(로비_및_강의실)3.jpg",
    "cinematic_classroom.png",
    "reel_cut1_opening.png",
    "reel_cut2_closeup.png",
    "reel_cut3_detail.png",
    "reel_cut4_collab.png",
    "reel_cut5_skills.png",
];

const ALT_LABELS: Record<string, string> = {
    "KakaoTalk_20250816_230722315.jpg": "코딩쏙 학원 수업 모습",
    "KakaoTalk_20250816_230722315_01.jpg": "코딩쏙 학원 수업 모습",
    "KakaoTalk_20250816_234926393_02.jpg": "학생 코딩 실습 장면",
    "KakaoTalk_20250816_234926393_03.jpg": "학생 코딩 실습 장면",
    "KakaoTalk_20251212_142853867.jpg": "코딩쏙 학원 교실 환경",
    "KakaoTalk_20251212_143115800.jpg": "코딩쏙 학원 교실 환경",
    "KakaoTalk_20251212_143841685.jpg": "코딩쏙 학원 교실 환경",
    "KakaoTalk_20251224_221516694.jpg": "코딩쏙 크리스마스 이벤트",
    "KakaoTalk_20251226_181412188.jpg": "학원 특별 활동",
    "KakaoTalk_20251226_181412669.jpg": "학원 특별 활동",
    "KakaoTalk_20260113_162114986.jpg": "코딩쏙 새해 수업",
    "KakaoTalk_20260206_133836930.jpg": "학생 프로젝트 발표",
    "KakaoTalk_20260206_133837621.jpg": "학생 프로젝트 발표",
    "KakaoTalk_20260206_133838050.jpg": "학생 프로젝트 발표",
    "KakaoTalk_20260206_134501663.jpg": "대회 준비 및 결과",
    "KakaoTalk_20260207_115634269.jpg": "코딩쏙 수업 활동",
    "KakaoTalk_20260212_122504963.jpg": "학생 코딩 실습",
    "KakaoTalk_20260212_201344853.jpg": "코딩쏙 학원 행사",
    "KakaoTalk_20260212_201442338.jpg": "코딩쏙 학원 행사",
    "KakaoTalk_20260214_114438151.jpg": "발렌타인 이벤트 수업",
    "cinematic_classroom.png": "코딩쏙 학원 전경",
    "reel_cut1_opening.png": "코딩쏙 학원 소개",
    "reel_cut2_closeup.png": "학생 코딩 집중 장면",
    "reel_cut3_detail.png": "코딩 실습 디테일",
    "reel_cut4_collab.png": "학생 팀 협업 수업",
    "reel_cut5_skills.png": "코딩 스킬 향상 수업",
    "SE-c5ee429c-2cea-42af-836f-60c08db18ac5.jpg": "코딩쏙 학원 수업 현장",
    "smart_classroom_1.jpg": "스마트 교실 환경 1",
    "smart_classroom_2.jpg": "스마트 교실 환경 2",
    "smart_classroom_3.jpg": "스마트 교실 환경 3",
};

function getAlt(filename: string, index: number): string {
    if (ALT_LABELS[filename]) return ALT_LABELS[filename];
    // 날짜 기반 시퀀스 이미지 (KakaoTalk_20260214_114735389_NN.jpg 계열)
    if (filename.startsWith("KakaoTalk_20260214_114735389_")) return `코딩쏙 대회 준비 ${index + 1}`;
    if (filename.startsWith("KakaoTalk_20260214_123")) return `코딩쏙 수업 활동 ${index + 1}`;
    return `코딩쏙 학원 사진 ${index + 1}`;
}

const CARDS_VISIBLE = 5;

export default function Gallery() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

    // 스크롤 기반 scale up: 섹션 진입 시 0.85 → 1.0
    const { scrollYProgress: galleryScroll } = useScroll({
        target: sectionRef,
        offset: ["start end", "start center"],
    });
    const galleryScale = useTransform(galleryScroll, [0, 1], [0.88, 1]);
    const galleryOpacity = useTransform(galleryScroll, [0, 0.5], [0.4, 1]);
    const [current, setCurrent] = useState(0);
    const [lightbox, setLightbox] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [autoplay, setAutoplay] = useState(true);
    const [hovered, setHovered] = useState(false);
    const total = ALL_PHOTOS.length;

    const src = (name: string) => `/images/academy/${name}`;

    useEffect(() => {
        if (!autoplay || hovered || lightbox !== null) return;
        const t = setInterval(() => setCurrent((p) => (p + 1) % total), 3500);
        return () => clearInterval(t);
    }, [autoplay, hovered, lightbox, total]);

    const go = useCallback((d: number) => setCurrent((p) => (p + d + total) % total), [total]);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (lightbox !== null) {
                if (e.key === "Escape") setLightbox(null);
                if (e.key === "ArrowLeft") setLightbox((p) => (p! - 1 + total) % total);
                if (e.key === "ArrowRight") setLightbox((p) => (p! + 1) % total);
            }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [lightbox, total]);

    const half = Math.floor(CARDS_VISIBLE / 2);
    const visible: number[] = [];
    for (let i = -half; i <= half; i++) visible.push(((current + i) % total + total) % total);

    return (
        <>
                        
            <motion.section ref={sectionRef} id="gallery-section" className="gx-section" style={{ scale: galleryScale, opacity: galleryOpacity }}>
                {/* BG */}
                <div className="gx-bg">
                    <div className="gx-bg-radial" />
                    <div className="gx-beam gx-beam-1" />
                    <div className="gx-beam gx-beam-2" />
                    <div className="gx-floor-reflection" />
                    <div className="gx-floor-grid-mask">
                        <div className="gx-floor-grid" />
                    </div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="gx-header"
                >
                    <div className="gx-badge-wrap">
                        <div className="gx-badge-glow" />
                        <div className="gx-badge">
                            <span className="gx-badge-dot" />
                            <span className="gx-badge-label">NEXUS GALLERY V2.0</span>
                        </div>
                    </div>
                    <h1 className="gx-chrome-title">학원 둘러보기</h1>
                    <div className="gx-title-line" />
                    <p className="gx-sub">
                        <span className="gx-sub-dash" />
                        <span className="gx-sub-text">코딩쏙의 생생한 수업 현장 · 총 {total}장</span>
                        <span className="gx-sub-dash" />
                    </p>
                </motion.div>

                {/* ═══ 3D Carousel ═══ */}
                <div
                    className="gx-perspective-outer"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {/* Arrows */}
                    <button className="gx-arrow gx-arrow-l" onClick={() => go(-1)} aria-label="이전">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="gx-arrow gx-arrow-r" onClick={() => go(1)} aria-label="다음">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>

                    {/* 3D stage — preserve-3d applied here */}
                    <div className="gx-stage">
                        {/* Metal rings */}
                        <div className="gx-rings">
                            <div className="gx-ring gx-ring-1" />
                            <div className="gx-ring gx-ring-2" />
                            <div className="gx-ring-glow" />
                        </div>

                        {/* far-left */}
                        <div
                            className="gx-card gx-card-far-left"
                            onClick={() => setCurrent(visible[0])}
                        >
                            <div className="gx-card-dim" />
                            <Image src={src(ALL_PHOTOS[visible[0]])} alt={getAlt(ALL_PHOTOS[visible[0]], visible[0])} fill style={{ objectFit: "cover" }} sizes="400px" quality={40} loading="lazy" />
                        </div>

                        {/* side-left */}
                        <div
                            className="gx-card gx-card-side-left"
                            onClick={() => setCurrent(visible[1])}
                        >
                            <div className="gx-card-side-overlay-left" />
                            <Image src={src(ALL_PHOTOS[visible[1]])} alt={getAlt(ALL_PHOTOS[visible[1]], visible[1])} fill style={{ objectFit: "cover" }} sizes="480px" quality={60} loading="lazy" />
                            <div className="gx-side-label gx-label-bl">
                                <span>PREV_MODULE</span>
                            </div>
                        </div>

                        {/* ═══ MAIN CENTER CARD ═══ */}
                        <div
                            className="gx-card gx-card-main group"
                            onClick={() => setLightbox(visible[2])}
                        >
                            {/* Corner brackets */}
                            <div className="gx-bracket gx-br-tl" />
                            <div className="gx-bracket gx-br-br" />
                            <div className="gx-bracket gx-br-tr" />
                            <div className="gx-bracket gx-br-bl" />

                            <div className="gx-main-inner">
                                <div className="gx-main-grad" />
                                <Image
                                    src={src(ALL_PHOTOS[visible[2]])}
                                    alt={getAlt(ALL_PHOTOS[visible[2]], visible[2])}
                                    fill style={{ objectFit: "cover" }}
                                    className="gx-main-img"
                                    sizes="(max-width:768px) 90vw, 850px"
                                    quality={85}
                                    priority
                                />

                                {/* HUD top-right */}
                                <div className="gx-hud-tr">
                                    <div className="gx-hud-live">
                                        <span>Live Feed</span>
                                        <div className="gx-red-dot" />
                                    </div>
                                    <div className="gx-hud-res">1080p // 60fps</div>
                                </div>

                                {/* HUD bottom */}
                                <div className="gx-hud-bottom">
                                    <div className="gx-hud-info">
                                        <h2 className="gx-hud-title">코딩쏙 아카데미</h2>
                                        <div className="gx-hud-tags">
                                            <span className="gx-hud-badge">PHOTO {current + 1}</span>
                                            <span className="gx-hud-sub">IMMERSIVE LEARNING MODULE</span>
                                        </div>
                                    </div>
                                    <div className="gx-ring-progress">
                                        <svg width="64" height="64" viewBox="0 0 64 64">
                                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                            <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="175" strokeDashoffset={175 - (175 * (current + 1) / total)} style={{ transition: "stroke-dashoffset 0.6s", transform: "rotate(-90deg)", transformOrigin: "center" }} />
                                        </svg>
                                        <span className="gx-ring-pct">{Math.round(((current + 1) / total) * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* side-right */}
                        <div
                            className="gx-card gx-card-side-right"
                            onClick={() => setCurrent(visible[3])}
                        >
                            <div className="gx-card-side-overlay-right" />
                            <Image src={src(ALL_PHOTOS[visible[3]])} alt={getAlt(ALL_PHOTOS[visible[3]], visible[3])} fill style={{ objectFit: "cover" }} sizes="480px" quality={60} loading="lazy" />
                            <div className="gx-side-label gx-label-br">
                                <span>NEXT_MODULE</span>
                            </div>
                        </div>

                        {/* far-right */}
                        <div
                            className="gx-card gx-card-far-right"
                            onClick={() => setCurrent(visible[4])}
                        >
                            <div className="gx-card-dim" />
                            <Image src={src(ALL_PHOTOS[visible[4]])} alt={getAlt(ALL_PHOTOS[visible[4]], visible[4])} fill style={{ objectFit: "cover" }} sizes="400px" quality={40} loading="lazy" />
                        </div>
                    </div>
                </div>

                {/* Hologram Controls */}
                <div className="gx-holo-wrap">
                    <div className="gx-holo-glow" />
                    <div className="gx-holo-bar">
                        <button className="gx-holo-btn group" onClick={() => setAutoplay(!autoplay)}>
                            <div className="gx-holo-icon"><span className="material-symbols-outlined">{autoplay ? "pause" : "smart_display"}</span></div>
                            <span className="gx-holo-label">{autoplay ? "PAUSE" : "AUTO"}</span>
                        </button>
                        <div className="gx-holo-sep" />
                        <div className="gx-holo-counter">
                            <span className="gx-counter-num">{current + 1}</span>
                            <span className="gx-counter-of">/ {total}</span>
                        </div>
                        <div className="gx-holo-sep" />
                        <button className="gx-holo-btn group" onClick={() => setShowAll(!showAll)}>
                            <div className="gx-holo-icon"><span className="material-symbols-outlined">{showAll ? "close" : "grid_view"}</span></div>
                            <span className="gx-holo-label">{showAll ? "CLOSE" : "GRID"}</span>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <AnimatePresence>
                    {showAll && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }} style={{ overflow: "hidden", marginTop: 32 }}>
                            <div className="gx-full-grid">
                                {ALL_PHOTOS.map((name, i) => (
                                    <motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.02, 1), duration: 0.3 }} onClick={() => setLightbox(i)} className={`gx-grid-item ${current === i ? "gx-grid-active" : ""}`}>
                                        <Image src={src(name)} alt={getAlt(name, i)} fill style={{ objectFit: "cover" }} sizes="180px" quality={50} loading="lazy" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lightbox */}
                <AnimatePresence>
                    {lightbox !== null && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} className="gx-lightbox">
                            <button onClick={() => setLightbox(null)} className="gx-lb-close">{"\u00D7"}</button>
                            <button onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p! - 1 + total) % total); }} className="gx-lb-arr gx-lb-prev">{"\u2039"}</button>
                            <button onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p! + 1) % total); }} className="gx-lb-arr gx-lb-next">{"\u203A"}</button>
                            <motion.div key={lightbox} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", damping: 25 }} onClick={(e) => e.stopPropagation()} className="gx-lb-img">
                                <Image src={src(ALL_PHOTOS[lightbox])} alt={getAlt(ALL_PHOTOS[lightbox], lightbox)} fill style={{ objectFit: "contain" }} quality={90} sizes="90vw" priority />
                            </motion.div>
                            <div className="gx-lb-counter">{lightbox + 1} / {total}</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style>{`
/* ═══ SECTION ═══ White-Blue Theme ═══ */
.gx-section {
    position: relative;
    padding: clamp(40px,6vw,80px) 0 clamp(60px,8vw,100px);
    background: var(--color-white, #ffffff);
    color: #1e293b;
    overflow: visible;
    font-family: 'Rajdhani', sans-serif;
}

/* ── Background Atmosphere ── */
.gx-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; background: #ffffff; }
.gx-bg-radial { display: none; }
.gx-beam { display: none; }
.gx-beam-1 { display: none; }
.gx-beam-2 { display: none; }
.gx-floor-reflection { display: none; }
.gx-floor-grid-mask { display: none; }
.gx-floor-grid { display: none; }

/* ── Header ── */
.gx-header { text-align: center; margin-bottom: clamp(40px,5vw,72px); position: relative; z-index: 10; }
.gx-badge-wrap { display: inline-flex; position: relative; margin-bottom: 24px; cursor: pointer; }
.gx-badge-glow { position: absolute; inset: -4px; background: linear-gradient(90deg, #60a5fa, #06b6d4); filter: blur(16px); opacity: 0.2; transition: opacity 0.5s; border-radius: 999px; }
.gx-badge-wrap:hover .gx-badge-glow { opacity: 0.4; }
.gx-badge { position: relative; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border: 1px solid #e2e8f0; padding: 8px 24px; border-radius: 999px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.gx-badge-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: gxPulse 2s infinite; box-shadow: 0 0 8px #22c55e; }
.gx-badge-label { font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #64748b; }
/* Title — blue gradient */
.gx-chrome-title {
    font-family: 'Orbitron'; font-size: clamp(2.4rem,5vw,4rem); font-weight: 900;
    letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 8px;
    background: linear-gradient(135deg, #0f172a 0%, #2563eb 50%, #1e293b 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}
.gx-title-line { height: 1px; max-width: 400px; margin: 0 auto 12px; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent); }
.gx-sub { display: flex; align-items: center; justify-content: center; gap: 16px; }
.gx-sub-dash { display: inline-block; height: 1px; width: 48px; background: #cbd5e1; }
.gx-sub-text { font-family: 'Rajdhani'; font-size: 13px; color: #94a3b8; letter-spacing: 0.3em; text-transform: uppercase; }

/* ═══ 3D Carousel ═══ */
.gx-perspective-outer {
    position: relative;
    width: 100vw;
    margin-left: calc(-50vw + 50%);
    height: clamp(400px,48vw,700px);
    z-index: 10;
    perspective: 2000px;
}

.gx-stage {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
}

/* Metal Rings */
.gx-rings { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) translateZ(0); width: 950px; height: 580px; pointer-events: none; z-index: 45; }
.gx-ring { position: absolute; border-radius: 50%; }
.gx-ring-1 { width: 110%; height: 120%; top: -10%; left: -5%; border: 2px solid rgba(200,220,255,0.3); box-shadow: 0 0 20px rgba(59,130,246,0.25), inset 0 0 20px rgba(59,130,246,0.15); animation: gxSpin 30s linear infinite; }
.gx-ring-2 { width: 105%; height: 110%; top: -5%; left: -2.5%; border-left: 5px solid rgba(59,130,246,0.5); border-right: 5px solid rgba(59,130,246,0.5); border-top: 1px solid transparent; border-bottom: 1px solid transparent; box-shadow: 0 0 30px rgba(59,130,246,0.2); animation: gxSpinRev 25s linear infinite; }
.gx-ring-glow { position: absolute; inset: -2%; border-radius: 50%; border: 24px solid rgba(59,130,246,0.06); filter: blur(8px); animation: gxPulse 3s infinite; }

/* ═══ Card Positions ═══ */
.gx-card { position: absolute; left: 50%; top: 50%; cursor: pointer; transition: all 0.6s cubic-bezier(0.4,0,0.2,1); }
.gx-card-far-left {
    width: 400px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(148,163,184,0.3);
    transform: translate(-50%,-50%) translateX(-220%) translateZ(-500px) rotateY(45deg);
    filter: blur(4px) brightness(0.4); opacity: 0.5; z-index: 30;
}
.gx-card-side-left {
    width: 480px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(148,163,184,0.3);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    transform: translate(-50%,-50%) translateX(-120%) translateZ(-200px) rotateY(35deg);
    filter: blur(1.5px) brightness(0.55); opacity: 0.85; z-index: 40;
}
.gx-card-main {
    width: clamp(500px, 56vw, 850px); aspect-ratio: 16/9;
    border-radius: 4px; overflow: hidden;
    transform: translate(-50%,-50%) translateZ(100px);
    z-index: 50;
    box-shadow:
        0 25px 60px rgba(0,0,0,0.5),
        0 0 0 1px rgba(255,255,255,0.1),
        0 0 80px rgba(59,130,246,0.2),
        inset 0 0 40px rgba(59,130,246,0.1);
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    animation: gxFloat 6s ease-in-out infinite;
    cursor: zoom-in;
}
.gx-card-side-right {
    width: 480px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(148,163,184,0.3);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    transform: translate(-50%,-50%) translateX(120%) translateZ(-200px) rotateY(-35deg);
    filter: blur(1.5px) brightness(0.55); opacity: 0.85; z-index: 40;
}
.gx-card-far-right {
    width: 400px; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(148,163,184,0.3);
    transform: translate(-50%,-50%) translateX(220%) translateZ(-500px) rotateY(-45deg);
    filter: blur(4px) brightness(0.4); opacity: 0.5; z-index: 30;
}

/* Overlays */
.gx-card-dim { position: absolute; inset: 0; background: rgba(0,0,0,0.4); z-index: 10; }
.gx-card-side-overlay-left { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.6), transparent); z-index: 10; }
.gx-card-side-overlay-right { position: absolute; inset: 0; background: linear-gradient(to left, rgba(0,0,0,0.6), transparent); z-index: 10; }
.gx-side-label { position: absolute; z-index: 20; }
.gx-label-bl { bottom: 16px; left: 16px; }
.gx-label-br { bottom: 16px; right: 16px; }
.gx-side-label span { font-family: monospace; font-size: 10px; color: rgba(59,130,246,0.7); letter-spacing: 0.15em; }

/* Corner brackets — blue accents */
.gx-bracket { position: absolute; width: 32px; height: 32px; z-index: 55; pointer-events: none; }
.gx-br-tl { top: -1px; left: -1px; border-top: 2px solid #3b82f6; border-left: 2px solid #3b82f6; }
.gx-br-br { bottom: -1px; right: -1px; border-bottom: 2px solid #3b82f6; border-right: 2px solid #3b82f6; }
.gx-br-tr { top: -1px; right: -1px; border-top: 2px solid rgba(59,130,246,0.3); border-right: 2px solid rgba(59,130,246,0.3); }
.gx-br-bl { bottom: -1px; left: -1px; border-bottom: 2px solid rgba(59,130,246,0.3); border-left: 2px solid rgba(59,130,246,0.3); }

/* Main card inner */
.gx-main-inner { position: relative; width: 100%; height: 100%; overflow: hidden; }
.gx-main-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.75), transparent 45%); z-index: 20; pointer-events: none; }
.gx-main-img { transition: transform 1s ease !important; }
.group:hover .gx-main-img { transform: scale(1.05) !important; }

/* HUD */
.gx-hud-tr { position: absolute; top: 24px; right: 24px; z-index: 30; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.gx-hud-live { display: flex; align-items: center; gap: 8px; }
.gx-hud-live span { font-family: 'Orbitron'; font-size: 12px; color: #fff; letter-spacing: 0.15em; text-transform: uppercase; }
.gx-red-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: gxPulse 2s infinite; }
.gx-hud-res { font-family: monospace; font-size: 10px; color: #93c5fd; }
.gx-hud-bottom { position: absolute; bottom: 0; left: 0; width: 100%; padding: 28px; z-index: 30; display: flex; justify-content: space-between; align-items: flex-end; }
.gx-hud-info { flex: 1; }
.gx-hud-title { font-family: 'Orbitron'; font-size: clamp(20px,3vw,36px); font-weight: 700; color: #fff; margin-bottom: 8px; letter-spacing: 0.04em; text-shadow: 0 4px 12px rgba(0,0,0,0.4); }
.gx-hud-tags { display: flex; align-items: center; gap: 16px; }
.gx-hud-badge { padding: 4px 10px; background: rgba(59,130,246,0.25); border: 1px solid rgba(59,130,246,0.5); color: #93c5fd; font-family: monospace; font-size: 11px; font-weight: 700; border-radius: 4px; }
.gx-hud-sub { color: #cbd5e1; font-family: 'Rajdhani'; font-size: 12px; letter-spacing: 0.1em; }
.gx-ring-progress { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gx-ring-pct { position: absolute; font-family: monospace; font-size: 12px; font-weight: 700; color: #fff; }

/* Arrows — glass style */
.gx-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 55; padding: 16px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); backdrop-filter: blur(12px); cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.gx-arrow:hover { background: rgba(255,255,255,0.15); border-color: rgba(59,130,246,0.5); box-shadow: 0 0 24px rgba(59,130,246,0.3); }
.gx-arrow span { font-size: 30px; color: rgba(255,255,255,0.6); transition: all 0.3s; }
.gx-arrow:hover span { color: #93c5fd; }
.gx-arrow-l { left: clamp(12px,3vw,48px); }
.gx-arrow-r { right: clamp(12px,3vw,48px); }

/* ── Hologram Floor Controls ── */
.gx-holo-wrap { display: flex; justify-content: center; margin-top: 40px; position: relative; z-index: 50; }
.gx-holo-glow { position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); width: 90%; height: 20px; background: rgba(59,130,246,0.15); filter: blur(20px); border-radius: 50%; }
.gx-holo-bar {
    display: flex; align-items: center; gap: clamp(32px,5vw,64px);
    width: 800px; max-width: 90vw; height: 120px;
    justify-content: center;
    background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.9) 100%);
    transform: perspective(500px) rotateX(40deg);
    box-shadow: 0 -12px 40px rgba(59,130,246,0.12), 0 8px 24px rgba(0,0,0,0.06);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(59,130,246,0.15);
    border-top: 2px solid rgba(59,130,246,0.3);
    border-radius: 50px 50px 0 0;
    animation: gxFlicker 3s infinite;
    position: relative;
}
.gx-holo-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; transition: all 0.3s; padding: 0; }
.gx-holo-btn:hover { transform: translateY(-8px); }
.gx-holo-icon { width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(148,163,184,0.25); background: rgba(255,255,255,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.gx-holo-icon span { font-size: 24px; color: #64748b; transition: all 0.3s; }
.group:hover .gx-holo-icon { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); box-shadow: 0 0 20px rgba(59,130,246,0.2); }
.group:hover .gx-holo-icon span { color: #2563eb; }
.gx-holo-label { font-family: 'Orbitron'; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #94a3b8; transition: color 0.3s; }
.group:hover .gx-holo-label { color: #3b82f6; }
.gx-holo-sep { height: 48px; width: 1px; background: linear-gradient(to bottom, transparent, rgba(148,163,184,0.3), transparent); }
.gx-holo-counter { display: flex; align-items: baseline; gap: 6px; }
.gx-counter-num { font-family: 'Orbitron'; font-size: 32px; font-weight: 900; color: #2563eb; text-shadow: 0 0 20px rgba(59,130,246,0.2); }
.gx-counter-of { font-family: 'Rajdhani'; font-size: 14px; color: #94a3b8; }

/* ── Grid ── */
.gx-full-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; padding: 0 clamp(16px,3vw,40px); max-width: 1200px; margin: 0 auto; }
.gx-grid-item { position: relative; aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; cursor: zoom-in; border: 1px solid #e2e8f0; transition: all 0.2s; }
.gx-grid-item:hover { border-color: #93c5fd; box-shadow: 0 4px 16px rgba(59,130,246,0.15); }
.gx-grid-active { border: 2px solid #3b82f6; box-shadow: 0 0 12px rgba(59,130,246,0.2); }

/* ── Lightbox ── */
.gx-lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(15,23,42,0.92); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.gx-lb-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #fff; font-size: 20px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; }
.gx-lb-arr { position: absolute; top: 50%; transform: translateY(-50%); width: 52px; height: 52px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.4); color: #fff; font-size: 24px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; }
.gx-lb-prev { left: 20px; }
.gx-lb-next { right: 20px; }
.gx-lb-img { position: relative; width: min(90vw,1100px); height: min(80vh,850px); border-radius: 12px; overflow: hidden; cursor: default; }
.gx-lb-counter { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); padding: 6px 18px; border-radius: 999px; color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 600; }

/* ═══ Responsive ═══ */
@media (max-width: 1024px) {
    .gx-card-far-left, .gx-card-far-right { display: none; }
    .gx-card-side-left { width: 320px; transform: translate(-50%,-50%) translateX(-100%) translateZ(-150px) rotateY(30deg); }
    .gx-card-side-right { width: 320px; transform: translate(-50%,-50%) translateX(100%) translateZ(-150px) rotateY(-30deg); }
    .gx-rings { width: 600px; height: 400px; }
}
@media (max-width: 640px) {
    .gx-card-side-left, .gx-card-side-right { display: none; }
    .gx-card-main { width: clamp(300px,85vw,500px); }
    .gx-rings { display: none; }
}

/* ═══ Keyframes ═══ */
@keyframes gxSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes gxSpinRev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes gxPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes gxFloat { 0%,100% { transform: translate(-50%,-50%) translateZ(100px) translateY(0); } 50% { transform: translate(-50%,-50%) translateZ(100px) translateY(-10px); } }
                `}</style>
            </motion.section>
        </>
    );
}
