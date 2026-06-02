"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════
   수강생 성공 스토리 — Quantum Nexus Slider
   Aero-glass cards · Horizontal Scroll · 3D tilt
   ═══════════════════════════════════════════ */

const STORIES = [
    {
        name: "김O민",
        initial: "김",
        avatarStyle: { background: "linear-gradient(to bottom right, #3b82f6, #2563eb)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(79,70,229,0.3)",
        tagStyle: { background: "rgba(219,234,254,0.5)", border: "1px solid #bfdbfe", color: "#1d4ed8" } as React.CSSProperties,
        track: "Python Core",
        level: "Lv.3 Completed",
        stars: 1,
        quote: "처음엔 타이핑도 힘들어했지만, 3개월 만에 구구단 알고리즘을 스스로 설계했습니다. 논리적 사고의 확장이 눈에 보입니다.",
        highlight: "구구단 알고리즘",
        hlStyle: { background: "#e0e7ff", color: "#4338ca" } as React.CSSProperties,
        achieveIcon: "trending_up",
        achieveIconStyle: { color: "#2563eb", background: "#EFF6FF" } as React.CSSProperties,
        achievement: "정보올림피아드 예선 통과",
        tags: ["#Algorithm", "#Python"],
    },
    {
        name: "이O준",
        initial: "이",
        avatarStyle: { background: "linear-gradient(to bottom right, #fb923c, #ef4444)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(249,115,22,0.3)",
        tagStyle: { background: "rgba(255,237,213,0.5)", border: "1px solid #fed7aa", color: "#c2410c" } as React.CSSProperties,
        track: "C++ Master",
        level: "Lv.5 Completed",
        stars: 2,
        quote: "수학을 포기하려던 아이가 코딩 변수를 배우며 함수 개념을 완벽히 이해했습니다. 교과 성적까지 수직 상승했어요.",
        highlight: "함수 개념",
        hlStyle: { background: "#ffedd5", color: "#c2410c" } as React.CSSProperties,
        achieveIcon: "emoji_events",
        achieveIconStyle: { color: "#ea580c", background: "#fff7ed" } as React.CSSProperties,
        achievement: "COS-Pro 2급 최연소 합격",
        tags: ["#C_Lang", "#Math_Link"],
    },
    {
        name: "박O서",
        initial: "박",
        avatarStyle: { background: "linear-gradient(to bottom right, #34d399, #14b8a6)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(16,185,129,0.3)",
        tagStyle: { background: "rgba(209,250,229,0.5)", border: "1px solid #a7f3d0", color: "#047857" } as React.CSSProperties,
        track: "Block Logic",
        level: "Lv.2 Completed",
        stars: 1,
        quote: "저학년이라 걱정했는데, 블록코딩을 게임처럼 즐겨요. 매주 오는 AI 분석 리포트로 아이의 관심사를 정확히 파악했습니다.",
        highlight: "AI 분석 리포트",
        hlStyle: { background: "#d1fae5", color: "#047857" } as React.CSSProperties,
        achieveIcon: "auto_awesome",
        achieveIconStyle: { color: "#059669", background: "#ecfdf5" } as React.CSSProperties,
        achievement: "창작 게임 3종 출시",
        tags: ["#Logic", "#Creativity"],
    },
    {
        name: "정O현",
        initial: "정",
        avatarStyle: { background: "linear-gradient(to bottom right, #3b82f6, #0ea5e9)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(59,130,246,0.3)",
        tagStyle: { background: "rgba(243,232,255,0.5)", border: "1px solid #bfdbfe", color: "#1d4ed8" } as React.CSSProperties,
        track: "Web Dev",
        level: "Lv.6 Completed",
        stars: 3,
        quote: "학원에서 만든 포트폴리오로 학교 발표회 대상을 받았어요. 풀스택 개발자라는 구체적인 꿈을 가지게 되었습니다.",
        highlight: "풀스택 개발자",
        hlStyle: { background: "#dbeafe", color: "#1d4ed8" } as React.CSSProperties,
        achieveIcon: "rocket_launch",
        achieveIconStyle: { color: "#2563eb", background: "#eff6ff" } as React.CSSProperties,
        achievement: "앱 개발 공모전 입상",
        tags: ["#FullStack", "#Portfolio"],
    },
    {
        name: "최O진",
        initial: "최",
        avatarStyle: { background: "linear-gradient(to bottom right, #f43f5e, #e11d48)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(244,63,94,0.3)",
        tagStyle: { background: "rgba(255,228,230,0.5)", border: "1px solid #fecdd3", color: "#be123c" } as React.CSSProperties,
        track: "C Language",
        level: "Lv.4 Completed",
        stars: 2,
        quote: "다른 학원에서 코딩 포기했던 아이인데, 여기서 C언어 포인터까지 이해했어요. 선생님이 아이 속도에 맞춰주시는 게 큰 차이였습니다.",
        highlight: "C언어 포인터",
        hlStyle: { background: "#ffe4e6", color: "#be123c" } as React.CSSProperties,
        achieveIcon: "school",
        achieveIconStyle: { color: "#e11d48", background: "#fff1f2" } as React.CSSProperties,
        achievement: "프로그래밍기능사 필기 합격",
        tags: ["#C_Lang", "#Certification"],
    },
    {
        name: "한O우",
        initial: "한",
        avatarStyle: { background: "linear-gradient(to bottom right, #0ea5e9, #06b6d4)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(14,165,233,0.3)",
        tagStyle: { background: "rgba(224,242,254,0.5)", border: "1px solid #bae6fd", color: "#0369a1" } as React.CSSProperties,
        track: "Algorithm",
        level: "Lv.5 Completed",
        stars: 2,
        quote: "백준 문제를 하나도 못 풀던 아이가 6개월 만에 실버 티어까지 올라갔습니다. 매일 한 문제씩 푸는 습관이 생겼어요.",
        highlight: "실버 티어",
        hlStyle: { background: "#e0f2fe", color: "#0369a1" } as React.CSSProperties,
        achieveIcon: "military_tech",
        achieveIconStyle: { color: "#0284c7", background: "#f0f9ff" } as React.CSSProperties,
        achievement: "백준 실버 달성",
        tags: ["#Algorithm", "#BaekJoon"],
    },
    {
        name: "윤O아",
        initial: "윤",
        avatarStyle: { background: "linear-gradient(to bottom right, #f59e0b, #eab308)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(245,158,11,0.3)",
        tagStyle: { background: "rgba(254,249,195,0.5)", border: "1px solid #fde68a", color: "#a16207" } as React.CSSProperties,
        track: "Creative Coding",
        level: "Lv.3 Completed",
        stars: 1,
        quote: "코딩에 전혀 관심 없던 딸이 turtle로 그림 그리기 시작하더니, 지금은 혼자서 게임을 만들고 있어요. 자기주도 학습이 된 거죠.",
        highlight: "혼자서 게임을 만들고",
        hlStyle: { background: "#fef9c3", color: "#a16207" } as React.CSSProperties,
        achieveIcon: "videogame_asset",
        achieveIconStyle: { color: "#ca8a04", background: "#fefce8" } as React.CSSProperties,
        achievement: "자체 제작 게임 5개 완성",
        tags: ["#Creative", "#Game_Dev"],
    },
    {
        name: "서O호",
        initial: "서",
        avatarStyle: { background: "linear-gradient(to bottom right, #2563eb, #3b82f6)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(99,102,241,0.3)",
        tagStyle: { background: "rgba(224,231,255,0.5)", border: "1px solid #c7d2fe", color: "#4338ca" } as React.CSSProperties,
        track: "Data Science",
        level: "Lv.4 Completed",
        stars: 2,
        quote: "과학 탐구 대회에서 파이썬 데이터 분석으로 대상을 탔어요. 학원에서 배운 pandas가 진짜 도움이 됐다고 하더라고요.",
        highlight: "파이썬 데이터 분석",
        hlStyle: { background: "#e0e7ff", color: "#4338ca" } as React.CSSProperties,
        achieveIcon: "analytics",
        achieveIconStyle: { color: "#2563eb", background: "#eef2ff" } as React.CSSProperties,
        achievement: "과학 탐구 대회 대상",
        tags: ["#Python", "#Data_Science"],
    },
    {
        name: "강O현",
        initial: "강",
        avatarStyle: { background: "linear-gradient(to bottom right, #10b981, #059669)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(16,185,129,0.3)",
        tagStyle: { background: "rgba(209,250,229,0.5)", border: "1px solid #a7f3d0", color: "#047857" } as React.CSSProperties,
        track: "C Programming",
        level: "Lv.3 Completed",
        stars: 2,
        quote: "중1인데 변수 개념을 수학 수업보다 코딩에서 먼저 이해했어요. 선생님이 수학이랑 연결해서 설명해주시니까 학교 수업도 따라가기 편해졌대요.",
        highlight: "수학이랑 연결해서",
        hlStyle: { background: "#d1fae5", color: "#047857" } as React.CSSProperties,
        achieveIcon: "calculate",
        achieveIconStyle: { color: "#059669", background: "#ecfdf5" } as React.CSSProperties,
        achievement: "수학 성적 2등급 상승",
        tags: ["#C_Lang", "#Math"],
    },
    {
        name: "조O원",
        initial: "조",
        avatarStyle: { background: "linear-gradient(to bottom right, #ec4899, #f43f5e)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(236,72,153,0.3)",
        tagStyle: { background: "rgba(252,231,243,0.5)", border: "1px solid #fbcfe8", color: "#be185d" } as React.CSSProperties,
        track: "Python Advanced",
        level: "Lv.5 Completed",
        stars: 3,
        quote: "처음 3개월은 솔직히 진도가 느려서 불안했는데, 기초를 단단히 잡고 나니까 갑자기 속도가 붙더라고요. 지금은 정올 예선도 스스로 준비해요.",
        highlight: "기초를 단단히 잡고",
        hlStyle: { background: "#fce7f3", color: "#be185d" } as React.CSSProperties,
        achieveIcon: "speed",
        achieveIconStyle: { color: "#ec4899", background: "#fdf2f8" } as React.CSSProperties,
        achievement: "정올 지역 예선 진출",
        tags: ["#Python", "#Olympiad"],
    },
    {
        name: "임O진",
        initial: "임",
        avatarStyle: { background: "linear-gradient(to bottom right, #14b8a6, #0d9488)" } as React.CSSProperties,
        avatarShadow: "0 8px 20px rgba(20,184,166,0.3)",
        tagStyle: { background: "rgba(204,251,241,0.5)", border: "1px solid #99f6e4", color: "#0f766e" } as React.CSSProperties,
        track: "Arduino IoT",
        level: "Lv.2 Completed",
        stars: 1,
        quote: "컴퓨터만 하던 아이가 아두이노 배우면서 직접 뭔가 만드는 재미를 알았어요. LED 신호등 만들어서 동생한테 자랑하더라고요.",
        highlight: "직접 뭔가 만드는",
        hlStyle: { background: "#ccfbf1", color: "#0f766e" } as React.CSSProperties,
        achieveIcon: "hardware",
        achieveIconStyle: { color: "#14b8a6", background: "#f0fdfa" } as React.CSSProperties,
        achievement: "IoT 프로젝트 3개 완성",
        tags: ["#Arduino", "#Maker"],
    },
];

function StoryCard({ story, index }: { story: typeof STORIES[0]; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg) translate3d(${x * 10}px, ${y * 10}px, 0) scale(1.02)`;
    };
    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (card) card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translate3d(0,0,0) scale(1)";
    };

    // Highlight the keyword in quote
    const parts = story.quote.split(story.highlight);

    return (
        <div className="ts-item group">
            <div className="ts-card-wrap" style={{ animationDelay: `${0.15 * index}s` }}>
                <div
                    ref={cardRef}
                    className="ts-glass"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Specular highlight */}
                    <div className="ts-specular" />

                    {/* Header */}
                    <div className="ts-header">
                        <div className="ts-avatar-row">
                            <div className="ts-avatar" style={{ ...story.avatarStyle, boxShadow: story.avatarShadow }}>
                                {story.initial}
                            </div>
                            <div>
                                <h3 className="ts-name">{story.name}</h3>
                                <div className="ts-track-row">
                                    <span className="ts-track-badge" style={story.tagStyle}>{story.track}</span>
                                    <span className="ts-level">{story.level}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ts-stars">
                            {Array.from({ length: story.stars }).map((_, i) => (
                                <span key={i} className="material-symbols-outlined ts-star" style={{ transitionDelay: `${i * 50}ms` }}>star</span>
                            ))}
                        </div>
                    </div>

                    {/* Quote */}
                    <div className="ts-quote-area">
                        <p className="ts-quote">
                            &ldquo;{parts[0]}<span className="ts-hl" style={story.hlStyle}>{story.highlight}</span>{parts[1]}&rdquo;
                        </p>
                    </div>

                    {/* Achievement */}
                    <div className="ts-footer">
                        <div className="ts-achieve-box">
                            <span className="material-symbols-outlined ts-achieve-icon" style={story.achieveIconStyle}>{story.achieveIcon}</span>
                            <div>
                                <div className="ts-achieve-label">Achievement</div>
                                <div className="ts-achieve-text">{story.achievement}</div>
                            </div>
                        </div>
                        <div className="ts-tags">
                            {story.tags.map(tag => (
                                <span key={tag} className={["#A", "#C", "#F", "#L"].some(p => tag.startsWith(p))
                                    ? "ts-tag ts-tag-dark" : "ts-tag ts-tag-light"}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                {/* RT Shadow */}
                <div className="ts-rt-shadow" />
            </div>
        </div>
    );
}

export default function Testimonials() {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = STORIES.length;

    const next = useCallback(() => setActive(p => (p + 1) % total), [total]);
    const prev = useCallback(() => setActive(p => (p - 1 + total) % total), [total]);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [paused, next]);

    const getCardStyle = (i: number) => {
        const diff = ((i - active) % total + total) % total;
        if (diff === 0) return { transform: 'translateX(0) scale(1) rotateY(0deg)', opacity: 1, zIndex: 30, filter: 'blur(0px)' };
        if (diff === 1 || diff === -(total - 1)) return { transform: 'translateX(70%) scale(0.85) rotateY(-15deg)', opacity: 0.6, zIndex: 20, filter: 'blur(2px)' };
        if (diff === total - 1) return { transform: 'translateX(-70%) scale(0.85) rotateY(15deg)', opacity: 0.6, zIndex: 20, filter: 'blur(2px)' };
        return { transform: 'translateX(0) scale(0.7)', opacity: 0, zIndex: 0, filter: 'blur(4px)' };
    };

    return (
        <section ref={ref} id="testimonials" className="ts-section">

            {/* BG */}
            <div className="ts-bg" aria-hidden>
                <div className="ts-grid" />
                <div className="ts-orb ts-orb1" />
                <div className="ts-orb ts-orb2" />
                <div className="ts-spark ts-sp1" /><div className="ts-spark ts-sp2" />
                <div className="ts-spark ts-sp3" /><div className="ts-spark ts-sp4" /><div className="ts-spark ts-sp5" />
            </div>

            <div className="ts-container">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
                    animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                    transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
                    className="ts-header-area"
                >
                    <div className="ts-live-badge">
                        <span className="ts-live-dot" />
                        <span>수강생 후기</span>
                    </div>
                    <h2 className="text-center ts-main-title">
                        수강생 성공 스토리
                    </h2>
                    <p className="ts-main-sub">
                        코딩쏙 수강생들의 실제 성장 이야기를 확인하세요.
                    </p>
                </motion.header>
            </div>

            {/* 3D Carousel */}
            <div
                className="ts-carousel-3d"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {STORIES.map((story, i) => (
                    <div
                        key={i}
                        className="ts-carousel-card"
                        style={{
                            ...getCardStyle(i),
                            transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            position: 'absolute',
                            width: '100%',
                            maxWidth: '680px',
                            left: '50%',
                            marginLeft: '-340px',
                            pointerEvents: i === active ? 'auto' : 'none',
                        }}
                        onClick={() => i !== active && setActive(i)}
                    >
                        <StoryCard story={story} index={i} />
                    </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="ts-nav">
                <button className="ts-nav-btn" onClick={prev} aria-label="Previous">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="ts-dots">
                    {STORIES.map((_, i) => (
                        <button
                            key={i}
                            className={`ts-dot ${i === active ? 'ts-dot-active' : ''}`}
                            onClick={() => setActive(i)}
                        />
                    ))}
                </div>
                <button className="ts-nav-btn" onClick={next} aria-label="Next">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            <style>{`
/* ═══ Section ═══ */
.ts-section { position: relative; overflow: hidden; padding: clamp(80px,10vw,140px) 0 clamp(60px,8vw,100px); background: #fff; font-family: 'Pretendard', sans-serif; color: #1e293b; }
.ts-container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px,4vw,40px); position: relative; z-index: 10; }

/* BG */
.ts-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; background: #ffffff; }
.ts-grid { display: none; }
.ts-orb { display: none; }
.ts-orb1 { display: none; }
.ts-orb2 { display: none; }
.ts-spark { position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; filter: blur(1px); box-shadow: 0 0 10px #3b82f6; animation: tsFloat 8s ease-in-out infinite; }
.ts-sp1 { left: 10%; top: 80%; animation-duration: 7s; }
.ts-sp2 { left: 30%; top: 40%; animation-duration: 9s; animation-delay: 1s; }
.ts-sp3 { left: 70%; top: 60%; animation-duration: 6s; animation-delay: 2s; }
.ts-sp4 { left: 90%; top: 20%; animation-duration: 11s; animation-delay: 0.5s; }
.ts-sp5 { left: 50%; top: 90%; animation-duration: 8s; animation-delay: 3s; }

/* Header */
.ts-header-area { text-align: center; margin-bottom: clamp(32px,5vw,56px); }
.ts-live-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; border-radius: 999px; background: rgba(255,255,255,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.6); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #312e81; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); animation: tsPulseGlow 4s ease-in-out infinite; font-family: 'Orbitron', sans-serif; }
.ts-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e; }
.ts-main-title { font-family: 'Pretendard', sans-serif !important; font-size: clamp(2.5rem, 6vw, 5rem) !important; font-weight: 900 !important; letter-spacing: -0.04em; color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; }
.ts-main-sub { margin-top: 16px; font-size: 16px; color: #64748b; font-weight: 500; background: rgba(255,255,255,0.1); padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(4px); display: inline-block; }
.ts-accent-num { color: #2563eb; font-weight: 700; }

/* ═══ 3D Carousel ═══ */
.ts-carousel-3d { position: relative; z-index: 10; height: 620px; perspective: 1200px; margin: 0 auto; max-width: 1200px; }
@media (max-width: 768px) {
  .ts-carousel-3d { height: auto; min-height: 560px; }
  .ts-carousel-card { max-width: 90vw !important; margin-left: -45vw !important; }
}
@media (max-width: 480px) {
  .ts-carousel-3d { min-height: 680px; }
  .ts-carousel-card { max-width: 92vw !important; margin-left: -46vw !important; }
  .ts-glass { padding: 24px 20px !important; }
  .ts-quote { font-size: 15px !important; }
  .ts-card-wrap { height: 640px !important; }
}
.ts-item { width: 100%; }

/* Navigation */
.ts-nav { display: flex; align-items: center; justify-content: center; gap: 16px; position: relative; z-index: 20; margin-top: 16px; }
.ts-nav-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; color: #475569; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.ts-nav-btn:hover { background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: scale(1.1); }
.ts-dots { display: flex; gap: 8px; }
.ts-dot { width: 10px; height: 10px; border-radius: 50%; border: none; background: #cbd5e1; cursor: pointer; transition: all 0.3s; }
.ts-dot-active { background: #2563eb; transform: scale(1.3); box-shadow: 0 0 12px rgba(79,70,229,0.4); }

/* Card */
.ts-card-wrap { position: relative; height: 580px; }
.ts-glass {
    width: 100%; height: 100%; border-radius: 2rem; padding: 32px;
    display: flex; flex-direction: column; position: relative; overflow: hidden;
    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1);
    transform-style: preserve-3d;
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: default;
}
.ts-specular { position: absolute; inset: 0; background: linear-gradient(125deg, transparent 0%, rgba(255,255,255,0.4) 40%, transparent 60%); z-index: 10; opacity: 0; transition: opacity 0.3s; pointer-events: none; border-radius: inherit; }
.ts-glass:hover .ts-specular { opacity: 1; }
.ts-rt-shadow { position: absolute; bottom: -40px; left: 10%; width: 80%; height: 20px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%); filter: blur(10px); transform: rotateX(60deg); z-index: -1; transition: all 0.4s; }
.ts-glass:hover ~ .ts-rt-shadow { transform: rotateX(60deg) scale(0.8); opacity: 0.6; }

/* Header in card */
.ts-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
.ts-avatar-row { display: flex; align-items: center; gap: 16px; }
.ts-avatar { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: 700; box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.ts-name { font-size: 22px; font-weight: 700; color: #1e293b; }
.ts-track-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.ts-track-badge { padding: 2px 8px; border-radius: 4px; border: 1px solid; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.ts-level { font-size: 13px; color: #64748b; }
.ts-stars { display: flex; gap: 4px; }
.ts-star { color: #f59e0b; font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); transform: rotateX(45deg) rotateZ(45deg); transition: transform 0.3s; }
.group:hover .ts-star { transform: rotateX(45deg) rotateZ(225deg) scale(1.2); }

/* Quote */
.ts-quote-area { flex-grow: 1; }
.ts-quote { font-size: 17px; color: #475569; line-height: 1.7; font-weight: 500; }
.ts-hl { padding: 1px 6px; border-radius: 4px; }

/* Footer */
.ts-footer { margin-top: auto; }
.ts-achieve-box { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.5); box-shadow: inset 0 0 10px rgba(255,255,255,0.2); margin-bottom: 16px; }
.ts-achieve-icon { padding: 8px; border-radius: 10px; font-size: 22px; }
.ts-achieve-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
.ts-achieve-text { font-size: 14px; font-weight: 700; color: #1e293b; }
.ts-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.ts-tag { padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.ts-tag-dark { background: #1e293b; color: #fff; box-shadow: 0 4px 12px rgba(30,41,59,0.2); }
.ts-tag-light { background: #fff; color: #475569; border: 1px solid #e2e8f0; }

/* Keyframes */
@keyframes tsHue { 0% { filter: hue-rotate(0deg) blur(120px); } 100% { filter: hue-rotate(360deg) blur(120px); } }
@keyframes tsFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; } }
@keyframes tsPulseGlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
            `}</style>
        </section>
    );
}
