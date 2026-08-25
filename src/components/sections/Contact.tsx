"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

/* ═══════════════════════════════════════════
   Contact — Quantum Nexus Forge Ultra V3.2
   Monolith-slab form · Code-shard BG · Flow-lines
   Two-column: info left, glass form right
   ═══════════════════════════════════════════ */

const FEATURES = [
    { icon: "school", title: "소수 정예 교육", desc: "1:6 이하 소수 정예 수업으로 학생 개인별 진도와 이해도를 파악하며 수업합니다." },
    { icon: "code", title: "텍스트 코딩 중심", desc: "C, Python 텍스트 코딩을 중심으로 실습 비중 60%의 수업을 진행합니다." },
    { icon: "emoji_events", title: "대회·자격증 대비", desc: "정보올림피아드, COS-Pro, 프로그래밍기능사 등 목표에 맞는 특화 과정을 운영합니다." },
];

export default function Contact() {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <section ref={ref} id="contact" className="ct-section">

            {/* BG */}
            <div className="ct-bg" aria-hidden>
                <div className="ct-gradient-bg" />
                <div className="ct-vol-light" />
                <div className="ct-code ct-code1">class Nexus {"{"} constructor() {"{"} this.future = true; {"}"} {"}"}</div>
                <div className="ct-code ct-code2">&lt;StreamData protocol=&quot;v3.2&quot; /&gt;</div>
                <div className="ct-code ct-code3">import {"{"} Consciousness {"}"} from &apos;@universe/core&apos;;</div>
                <div className="ct-code ct-code4">await connection.establish(&apos;secure&apos;);</div>
                <div className="ct-orb ct-orb1" />
                <div className="ct-orb ct-orb2" />
                {/* Flow lines SVG */}
                <svg className="ct-flow-svg" preserveAspectRatio="none">
                    <path className="ct-flow-line" d="M 200 300 C 400 300, 400 200, 900 250" />
                    <path className="ct-flow-line ct-flow2" d="M 200 450 C 450 450, 500 400, 900 450" />
                    <path className="ct-flow-line ct-flow3" d="M 200 600 C 400 600, 500 700, 900 650" />
                </svg>
            </div>

            <div className="ct-container">
                <div className="ct-grid">
                    {/* Left — Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="ct-info"
                    >
                        <Image
                            src="/icon.png"
                            alt="코딩쏙"
                            width={160}
                            height={50}
                            style={{ objectFit: "contain", marginBottom: 24 }}
                        />
                        <div className="ct-proto-badge">
                            <span className="ct-proto-line" />
                            <span className="ct-proto-text">무료 상담 접수</span>
                        </div>
                        <h2 className="ct-main-title">
                            <span className="ct-title-dark">코딩 상담</span>
                            <span className="ct-title-metallic">신청하기</span>
                        </h2>
                        <p className="ct-main-desc">
                            아이의 현재 수준과 학습 목표를 파악하여 적합한 과정을 안내해드립니다. 체험 수업 후 등록 여부를 결정하실 수 있습니다.
                        </p>

                        <div className="ct-features">
                            {FEATURES.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                                    className="ct-feature group"
                                >
                                    <div className="ct-feature-icon">
                                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{f.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="ct-feature-title">{f.title}</h3>
                                        <p className="ct-feature-desc">{f.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="ct-form-wrap"
                    >
                        {/* Orbiting decorations */}
                        <div className="ct-orbit ct-orbit1" />
                        <div className="ct-orbit ct-orbit2" />
                        <div className="ct-orbit ct-orbit3" />

                        <div className="ct-slab">
                            <div className="ct-secure-badge">
                                <span className="ct-secure-dot" />
                                <span>상담 문의</span>
                            </div>

                            <div className="ct-form-header">
                                <h3 className="ct-form-title">상담 신청</h3>
                                <p className="ct-form-sub">편하신 방법으로 문의해 주세요.</p>
                            </div>

                            <div className="ct-form" style={{ gap: 16 }}>
                                {/* 카카오톡 상담 */}
                                <a
                                    href="https://pf.kakao.com/_tNeen/chat"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ct-kakao-btn"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6-.15.56-.55 2.03-.63 2.35-.1.4.15.39.31.28.13-.08 2.04-1.38 2.87-1.94.59.09 1.2.13 1.8.13 5.52 0 10-3.58 10-7.9S17.52 3 12 3z" />
                                    </svg>
                                    카카오톡으로 상담하기
                                </a>

                                {/* 구분선 */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>또는</span>
                                    <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                                </div>

                                {/* 전화 상담 */}
                                <a
                                    href="tel:010-7566-7229"
                                    className="ct-phone-btn"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                                    010-7566-7229 전화 상담
                                </a>

                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
/* ═══ Section ═══ */
.ct-section { position: relative; overflow: hidden; padding: clamp(80px,10vw,140px) 0; font-family: 'Noto Sans KR', sans-serif; color: #1e293b; min-height: 100vh; display: flex; align-items: center; }
.ct-container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px,4vw,40px); position: relative; z-index: 10; width: 100%; }

/* BG */
.ct-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.ct-gradient-bg { position: absolute; inset: 0; background: #ffffff; }
.ct-vol-light { display: none; }
.ct-code { position: absolute; font-family: 'Space Grotesk', monospace; color: rgba(78,205,196,0.12); font-size: 14px; white-space: nowrap; transform-style: preserve-3d; }
.ct-code1 { top: 10%; left: 5%; animation: ctShard 10s ease-in-out infinite; transform: translateZ(-50px); }
.ct-code2 { bottom: 20%; left: 15%; animation: ctShard 10s ease-in-out infinite 2s; transform: translateZ(-20px) rotate(-15deg); }
.ct-code3 { top: 30%; right: 10%; animation: ctShard 10s ease-in-out infinite 4s; transform: translateZ(-80px); }
.ct-code4 { bottom: 10%; right: 25%; animation: ctShard 10s ease-in-out infinite 1s; transform: translateZ(-40px) rotate(10deg); }
.ct-orb { display: none; }
.ct-orb1 { display: none; }
.ct-orb2 { display: none; }
.ct-flow-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: none; }
@media (min-width: 1024px) { .ct-flow-svg { display: block; } }
.ct-flow-line { fill: none; stroke: #4ECDC4; stroke-width: 1.5; stroke-dasharray: 10 30; opacity: 0.3; filter: drop-shadow(0 0 5px #4ECDC4); animation: ctDash 30s linear infinite; }
.ct-flow2 { animation-duration: 25s; stroke-opacity: 0.2; }
.ct-flow3 { animation-duration: 35s; stroke-opacity: 0.15; }

/* Grid Layout */
.ct-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
@media (min-width: 1024px) { .ct-grid { grid-template-columns: 5fr 6fr; gap: 64px; } }

/* Left Info */
.ct-info { animation: ctBreathe 4s ease-in-out infinite; }
.ct-proto-badge { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.ct-proto-line { width: 48px; height: 2px; background: linear-gradient(to right, #f5576c, #4ECDC4); border-radius: 999px; }
.ct-proto-text { font-size: 11px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; background: linear-gradient(135deg, #f093fb, #f5576c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.ct-main-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 16px; }
.ct-title-dark { display: block; color: #1e293b; text-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.ct-title-metallic { display: block; background: linear-gradient(to right, #2d3748 20%, #718096 40%, #2d3748 60%, #1a202c 80%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: ctShimmer 5s linear infinite; }
.ct-main-desc { font-size: 16px; color: #64748b; line-height: 1.7; font-weight: 300; max-width: 440px; border-left: 4px solid rgba(78,205,196,0.3); padding-left: 20px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); border-radius: 0 12px 12px 0; padding: 12px 16px 12px 20px; margin-bottom: 32px; }
.ct-features { display: flex; flex-direction: column; gap: 12px; }
.ct-feature { display: flex; align-items: flex-start; gap: 20px; padding: 16px; border-radius: 16px; border: 1px solid transparent; transition: all 0.5s; cursor: default; }
.ct-feature:hover { background: rgba(255,255,255,0.5); border-color: rgba(255,255,255,0.6); box-shadow: 0 8px 20px rgba(78,205,196,0.05); }
.ct-feature-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, rgba(78,205,196,0.15), transparent); display: flex; align-items: center; justify-content: center; color: #4ECDC4; flex-shrink: 0; transition: all 0.3s; box-shadow: inset 0 0 20px rgba(78,205,196,0.15); }
.ct-feature:hover .ct-feature-icon { transform: scale(1.1) rotate(3deg); }
.ct-feature-title { font-size: 18px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: #1e293b; margin-bottom: 4px; transition: color 0.3s; }
.ct-feature:hover .ct-feature-title { color: #4ECDC4; }
.ct-feature-desc { font-size: 14px; color: #64748b; line-height: 1.5; }

/* Right Form */
.ct-form-wrap { position: relative; perspective: 2000px; animation: ctBreathe 4s ease-in-out infinite; animation-delay: -1s; }
.ct-orbit { position: absolute; border: 1px solid; border-radius: 50%; pointer-events: none; }
.ct-orbit1 { top: -64px; right: -64px; width: 192px; height: 192px; border-color: rgba(78,205,196,0.15); animation: spin 10s linear infinite; }
.ct-orbit2 { top: -64px; right: -64px; width: 144px; height: 144px; border-color: rgba(78,205,196,0.08); animation: spin 15s linear infinite reverse; }
.ct-orbit3 { bottom: -48px; left: -48px; width: 128px; height: 128px; border-color: rgba(245,87,108,0.15); animation: spin 20s linear infinite reverse; }

/* Slab */
.ct-slab {
    position: relative; z-index: 20;
    background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.8); border-left: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 0 80px rgba(100,200,255,0.06);
    border-radius: 2.5rem; padding: clamp(32px,5vw,56px);
    transform-style: preserve-3d;
    transition: transform 0.5s;
    animation: ctSlabPulse 4s ease-in-out infinite;
    overflow: visible;
}
.ct-slab::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%); z-index: 1; opacity: 0.25; pointer-events: none; mix-blend-mode: overlay; }
.ct-slab::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 3px 3px 6px rgba(255,255,255,0.2), inset -3px -3px 6px rgba(0,0,0,0.06); z-index: 2; pointer-events: none; }
.ct-slab:hover { transform: scale(1.01); }

/* Secure badge */
.ct-secure-badge { position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.6); padding: 8px 28px; border-radius: 999px; box-shadow: 0 10px 20px rgba(0,0,0,0.06); z-index: 30; display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; font-family: 'Space Grotesk', sans-serif; color: #1e293b; }
.ct-secure-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: ctPulse 1s ease-in-out infinite; }

/* Form header */
.ct-form-header { text-align: center; margin-bottom: 32px; position: relative; z-index: 10; }
.ct-form-title { font-size: clamp(24px, 3.5vw, 36px); font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 8px; }
.ct-form-sub { font-size: 14px; color: #64748b; font-weight: 500; letter-spacing: 0.02em; }

/* Form */
.ct-form { display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 10; }

/* KakaoTalk Button */
.ct-kakao-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; border-radius: 16px; background: #FEE500; color: #3A1D1D; font-size: 15px; font-weight: 700; text-decoration: none; transition: all 0.3s; border: none; cursor: pointer; }
.ct-kakao-btn:hover { background: #F5DB00; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(254,229,0,0.4); }
.ct-kakao-btn:active { transform: translateY(0); }

/* Phone Button */
.ct-phone-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; border-radius: 16px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; transition: all 0.3s; border: none; cursor: pointer; }
.ct-phone-btn:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.4); }
.ct-phone-btn:active { transform: translateY(0); }

/* Mobile */
@media (max-width: 640px) {
  .ct-section { padding: clamp(48px,8vw,80px) 0 !important; min-height: auto !important; }
  .ct-code { display: none !important; }
  .ct-orbit { display: none !important; }
  .ct-slab { padding: 28px 20px !important; border-radius: 24px !important; }
  .ct-secure-badge { font-size: 9px !important; padding: 6px 16px !important; }
}

/* Keyframes */
@keyframes ctFloat { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(0.5deg); } }
@keyframes ctShard { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
@keyframes ctBreathe { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.005); filter: brightness(1.03); } }
@keyframes ctPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes ctSlabPulse { 0%, 100% { box-shadow: inset 0 0 30px rgba(66,153,225,0.06), 0 20px 50px rgba(0,0,0,0.15); } 50% { box-shadow: inset 0 0 60px rgba(66,153,225,0.15), 0 25px 60px rgba(66,153,225,0.1); } }
@keyframes ctShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes ctDash { 0% { stroke-dashoffset: 1000; } 100% { stroke-dashoffset: 0; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </section>
    );
}
