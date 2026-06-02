"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { COSPRO_SUB_COURSES, type CosProSubCourse } from "@/data/courses";

/* ═══════════════════════════════════════
   CosPro 서브 코스 선택 — 3D 책 카드
   ═══════════════════════════════════════ */

const T = 44;
const R = 6;

/* Custom SVG icons */
function PythonIcon({ size = 48 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="py1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5A9FD4" />
                    <stop offset="100%" stopColor="#306998" />
                </linearGradient>
                <linearGradient id="py2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD43B" />
                    <stop offset="100%" stopColor="#FFE873" />
                </linearGradient>
            </defs>
            <path d="M31.5 6C20.2 6 21 10.8 21 10.8V16h11v2H17.5S10 17.2 10 28.7 16.4 40 16.4 40H21v-5.6s-.3-6.4 6.3-6.4h10.8s6-.1 6-5.8V12.6S44.8 6 31.5 6zm-6 3.8a2 2 0 110 4 2 2 0 010-4z" fill="url(#py1)" />
            <path d="M32.5 58c11.3 0 10.5-4.8 10.5-4.8V48H32v-2h14.5S54 46.8 54 35.3 47.6 24 47.6 24H43v5.6s.3 6.4-6.3 6.4H25.9s-6 .1-6 5.8v9.6S19.2 58 32.5 58zm6-3.8a2 2 0 110-4 2 2 0 010 4z" fill="url(#py2)" />
        </svg>
    );
}

function CLangIcon({ size = 48 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="c1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6295CB" />
                    <stop offset="100%" stopColor="#3E6FB0" />
                </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="26" fill="url(#c1)" />
            <circle cx="32" cy="32" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <path d="M42 20a18 18 0 10.001 24.001" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <text x="30" y="40" fontFamily="system-ui,sans-serif" fontSize="22" fontWeight="900" fill="#fff" textAnchor="middle">C</text>
        </svg>
    );
}

function CosProBook({
    sub, index, onClick,
}: {
    sub: CosProSubCourse;
    index: number;
    onClick: () => void;
}) {
    const [flipped, setFlipped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const colors = sub.gradient.match(/#[0-9a-fA-F]{6}/g) || ["#3b82f6"];
    const spineColor = colors[0];
    const spineColor2 = colors[1] || colors[0];
    const spineColorDark = `color-mix(in srgb, ${spineColor} 70%, #000)`;

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current || !bookRef.current || flipped) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotY = -35 + (x - 0.5) * 20;
        const rotX = 10 - (y - 0.5) * 12;
        bookRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    }, [flipped]);

    const handleMouseLeave = useCallback(() => {
        if (!bookRef.current) return;
        if (flipped) {
            bookRef.current.style.transform = `rotateY(160deg) rotateX(0deg)`;
        } else {
            bookRef.current.style.transform = `rotateY(-35deg) rotateX(10deg)`;
        }
        setFlipped(false);
    }, [flipped]);

    const handleClick = useCallback(() => {
        if (!flipped) {
            setFlipped(true);
            if (bookRef.current) {
                bookRef.current.style.transform = `rotateY(160deg) rotateX(0deg)`;
            }
        } else {
            onClick();
        }
    }, [flipped, onClick]);

    return (
        <div
            ref={containerRef}
            className={`cp-scene cp-s${index}`}
            style={{ "--spine": spineColor, "--spine2": spineColor2, "--spine-dark": spineColorDark } as React.CSSProperties}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <div ref={bookRef} className="cp-bk">
                {/* FRONT COVER */}
                <div className="cp-face cp-front">
                    <div className="cp-cover-grad" style={{ background: sub.gradient }} />
                    <div className="cp-cover-dim" />
                    <div className="cp-cover-shine" />
                    <div className="cp-cover-content">
                        <div className="cp-cover-icon">
                            {sub.language === 'Python' ? <PythonIcon size={48} /> : <CLangIcon size={48} />}
                        </div>
                        <div className="cp-cover-lang">{sub.language}</div>
                        <div className="cp-cover-title">{sub.level === 2 ? '2급' : '1급'}</div>
                        <div className="cp-cover-badge">CosPro</div>
                    </div>
                </div>

                {/* SPINE */}
                <div className="cp-face cp-spine" />

                {/* PAGES */}
                <div className="cp-face cp-pages" />

                {/* TOP */}
                <div className="cp-face cp-top" />

                {/* BOTTOM */}
                <div className="cp-face cp-bottom" />

                {/* BACK COVER */}
                <div className="cp-face cp-back">
                    <div className="cp-cover-grad" style={{ background: sub.gradient }} />
                    <div className="cp-back-overlay" />
                    <div className="cp-back-content">
                        <div className="cp-back-title">{sub.title}</div>
                        <p className="cp-back-desc">{sub.description}</p>
                        <button className="cp-back-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                            학습 시작 →
                        </button>
                    </div>
                </div>
            </div>
            <div className="cp-ground-shadow" />
        </div>
    );
}

export default function CosProSelector() {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setReady(true));
    }, []);

    return (
        <div className={`cp-pg${ready ? " cp-rdy" : ""}`}>
            <style>{`
                .cp-pg {
                    width:100%;min-height:100vh;
                    background:linear-gradient(145deg,#fdf2f8,#fce7f3 30%,#faf5ff 60%,#f0f4ff);
                    display:flex;flex-direction:column;align-items:center;
                    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
                    position:relative;overflow-x:hidden;overflow-y:auto;
                    padding:40px 24px 80px;
                }
                .cp-pg::before{content:'';position:absolute;width:600px;height:600px;top:-20%;right:-10%;background:radial-gradient(circle,rgba(236,72,153,0.08),transparent 70%);border-radius:50%;pointer-events:none}
                .cp-pg::after{content:'';position:absolute;width:500px;height:500px;bottom:-15%;left:-8%;background:radial-gradient(circle,rgba(139,92,246,0.06),transparent 70%);border-radius:50%;pointer-events:none}

                .cp-header{text-align:center;margin-bottom:48px;z-index:10;position:relative}
                .cp-back-link{
                    display:inline-flex;align-items:center;gap:6px;
                    font-size:13px;font-weight:600;color:#94a3b8;
                    text-decoration:none;margin-bottom:20px;cursor:pointer;
                    transition:color .2s;
                }
                .cp-back-link:hover{color:#64748b}
                .cp-header-badge{
                    display:inline-flex;align-items:center;gap:6px;
                    padding:6px 16px;border-radius:999px;
                    background:linear-gradient(135deg,rgba(236,72,153,0.1),rgba(139,92,246,0.1));
                    border:1px solid rgba(236,72,153,0.2);
                    font-size:11px;font-weight:800;color:#ec4899;
                    letter-spacing:1px;text-transform:uppercase;
                    margin-bottom:16px;
                }
                .cp-header h1{
                    font-size:clamp(28px,4vw,42px);font-weight:900;
                    background:linear-gradient(135deg,#ec4899,#8b5cf6);
                    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                    background-clip:text;
                    margin:0 0 8px;letter-spacing:-0.03em;
                }
                .cp-header p{font-size:15px;color:#94a3b8;font-weight:500;margin:0}

                .cp-grid{
                    display:grid;
                    grid-template-columns:repeat(2,1fr);
                    gap:clamp(40px,6vw,80px);
                    z-index:10;position:relative;
                    max-width:700px;width:100%;
                    justify-items:center;
                }
                @media(max-width:640px){
                    .cp-grid{grid-template-columns:1fr;gap:48px}
                }

                .cp-divider-row{
                    display:contents;
                }
                .cp-lang-label{
                    grid-column:1/-1;
                    display:flex;align-items:center;gap:12px;
                    width:100%;padding:0 8px;
                }
                .cp-lang-label span{
                    font-size:13px;font-weight:800;color:#64748b;
                    letter-spacing:1px;text-transform:uppercase;white-space:nowrap;
                }
                .cp-lang-label::after{
                    content:'';flex:1;height:1px;
                    background:linear-gradient(90deg,rgba(148,163,184,0.3),transparent);
                }

                /* ═══ 3D BOOK ═══ */
                .cp-scene {
                    display:flex;align-items:center;justify-content:center;
                    perspective:1400px;cursor:pointer;position:relative;
                    opacity:0;transform:translateY(30px);
                    transition:opacity .6s ease,transform .6s ease;
                }
                .cp-pg.cp-rdy .cp-scene{opacity:1;transform:translateY(0)}
                .cp-pg.cp-rdy .cp-s0{transition-delay:0s}
                .cp-pg.cp-rdy .cp-s1{transition-delay:.12s}
                .cp-pg.cp-rdy .cp-s2{transition-delay:.24s}
                .cp-pg.cp-rdy .cp-s3{transition-delay:.36s}

                @keyframes cp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                .cp-pg.cp-rdy .cp-scene{animation:cp-float 4s ease-in-out infinite}
                .cp-pg.cp-rdy .cp-s1{animation-delay:.7s}
                .cp-pg.cp-rdy .cp-s2{animation-delay:1.4s}
                .cp-pg.cp-rdy .cp-s3{animation-delay:2.1s}
                .cp-scene:hover{animation-play-state:paused!important}

                .cp-bk {
                    width:clamp(150px,18vw,200px);
                    height:clamp(210px,25vw,280px);
                    position:relative;
                    transform-style:preserve-3d;
                    transform:rotateY(-35deg) rotateX(10deg);
                    transition:transform 0.5s cubic-bezier(0.23,1,0.32,1);
                }

                .cp-face{position:absolute;display:block}

                .cp-front {
                    width:100%;height:100%;
                    transform:translateZ(${T / 2}px);
                    border-radius:2px ${R}px ${R}px 2px;
                    overflow:hidden;
                    box-shadow:inset -5px 0 15px rgba(0,0,0,0.3);
                    z-index:2;
                }
                .cp-front::before{
                    content:'';position:absolute;inset:0;z-index:5;pointer-events:none;
                    background:linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 40%,transparent 60%,rgba(0,0,0,0.2) 100%);
                }
                .cp-cover-grad{position:absolute;inset:0}
                .cp-cover-dim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.5) 100%)}

                @keyframes cp-shine{0%{background-position:-200% -200%}100%{background-position:200% 200%}}
                .cp-cover-shine{
                    position:absolute;inset:0;z-index:2;pointer-events:none;
                    background:linear-gradient(135deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.08) 42%,rgba(255,255,255,0.35) 50%,rgba(255,255,255,0.08) 58%,rgba(255,255,255,0) 100%);
                    background-size:200% 200%;
                    animation:cp-shine 5s linear infinite;opacity:0.7;
                }

                .cp-cover-content{
                    position:absolute;inset:0;z-index:3;
                    display:flex;flex-direction:column;
                    align-items:center;justify-content:center;
                    gap:4px;padding:20px;text-align:center;
                }
                .cp-cover-icon{font-size:clamp(32px,4vw,48px);filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3))}
                .cp-cover-lang{
                    font-size:clamp(10px,1vw,13px);font-weight:800;color:rgba(255,255,255,0.7);
                    letter-spacing:2px;text-transform:uppercase;
                    text-shadow:0 1px 4px rgba(0,0,0,0.5);
                }
                .cp-cover-title{
                    font-size:clamp(28px,3.5vw,40px);font-weight:900;color:#fff;
                    text-shadow:0 2px 10px rgba(0,0,0,0.5),0 4px 20px rgba(0,0,0,0.3);
                    letter-spacing:-0.02em;line-height:1;
                }
                .cp-cover-badge{
                    margin-top:4px;
                    padding:3px 12px;border-radius:999px;
                    background:rgba(255,255,255,0.15);
                    backdrop-filter:blur(4px);
                    border:1px solid rgba(255,255,255,0.25);
                    font-size:clamp(8px,0.8vw,10px);font-weight:800;color:#fff;
                    letter-spacing:1.5px;text-transform:uppercase;
                }

                .cp-spine{
                    width:${T}px;height:100%;left:-${T / 2}px;top:0;
                    transform:rotateY(-90deg);
                    background:linear-gradient(180deg,var(--spine),var(--spine-dark));
                    border-radius:${R}px 0 0 ${R}px;
                    box-shadow:inset 0 0 20px rgba(0,0,0,0.5);
                }
                .cp-pages{
                    width:${T}px;height:100%;right:-${T / 2}px;top:0;
                    transform:rotateY(90deg);
                    background:linear-gradient(to right,rgba(0,0,0,0.1),transparent),repeating-linear-gradient(to right,#e5e5e5 0px,#fff 1.5px,#ddd 3px);
                    background-size:100% 100%,4px 100%;
                    box-shadow:inset 5px 0 15px rgba(0,0,0,0.15);
                }
                .cp-top{
                    width:100%;height:${T}px;top:-${T / 2}px;left:0;
                    transform:rotateX(90deg);
                    background:#e8e8e8;
                    background-image:repeating-linear-gradient(to bottom,#ccc 0px,#eee 1px,#fff 2px);
                }
                .cp-bottom{
                    width:100%;height:${T}px;bottom:-${T / 2}px;left:0;
                    transform:rotateX(-90deg);
                    background:#e0e0e0;
                    background-image:repeating-linear-gradient(to top,#ccc 0px,#eee 1px,#fff 2px);
                }

                .cp-back{
                    width:100%;height:100%;
                    transform:translateZ(-${T / 2}px) rotateY(180deg);
                    border-radius:${R}px 2px 2px ${R}px;
                    overflow:hidden;
                    backface-visibility:hidden;-webkit-backface-visibility:hidden;
                }
                .cp-back-overlay{
                    position:absolute;inset:0;z-index:1;
                    background:rgba(15,23,42,0.85);
                    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
                }
                .cp-back-content{
                    position:relative;z-index:2;
                    display:flex;flex-direction:column;align-items:center;
                    justify-content:center;gap:8px;
                    padding:clamp(12px,1.5vw,20px);height:100%;text-align:center;
                }
                .cp-back-title{font-size:clamp(13px,1.2vw,18px);font-weight:800;color:#fff}
                .cp-back-desc{font-size:clamp(9px,0.7vw,11px);color:rgba(255,255,255,0.6);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
                .cp-back-btn{
                    padding:8px 18px;border-radius:10px;
                    background:rgba(255,255,255,0.1);backdrop-filter:blur(4px);
                    border:1px solid rgba(255,255,255,0.2);
                    color:#fff;cursor:pointer;
                    font-size:clamp(10px,0.85vw,13px);font-weight:700;
                    transition:all .2s;
                }
                .cp-back-btn:hover{background:rgba(236,72,153,0.4);border-color:rgba(236,72,153,0.6);box-shadow:0 4px 20px rgba(236,72,153,0.35)}

                .cp-ground-shadow{
                    position:absolute;bottom:-16px;left:10%;
                    width:80%;height:14px;
                    background:rgba(0,0,0,0.12);
                    filter:blur(10px);border-radius:50%;
                    pointer-events:none;z-index:-1;
                }

                .cp-hints{
                    margin-top:40px;display:flex;gap:20px;z-index:10;opacity:0.4;
                }
                .cp-hint{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4px}
            `}</style>

            <div className="cp-header">
                <div>
                    <a className="cp-back-link" onClick={() => router.push("/dashboard/learning")}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                        학습 대시보드로 돌아가기
                    </a>
                </div>
                <div className="cp-header-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>workspace_premium</span>
                    CERTIFICATION
                </div>
                <h1>CosPro</h1>
                <p>파이썬 · C언어 자격증 시험을 선택하세요</p>
            </div>

            {/* Python Section */}
            <div className="cp-grid">
                <div className="cp-lang-label">
                    <span>Python</span>
                </div>
                {COSPRO_SUB_COURSES.filter(s => s.language === 'Python').map((sub, i) => (
                    <CosProBook
                        key={sub.id}
                        sub={sub}
                        index={i}
                        onClick={() => router.push(`/dashboard/learning/courses/5/cospro/${sub.id}`)}
                    />
                ))}

                <div className="cp-lang-label">
                    <span>C Language</span>
                </div>
                {COSPRO_SUB_COURSES.filter(s => s.language === 'C').map((sub, i) => (
                    <CosProBook
                        key={sub.id}
                        sub={sub}
                        index={i + 2}
                        onClick={() => router.push(`/dashboard/learning/courses/5/cospro/${sub.id}`)}
                    />
                ))}
            </div>

            <div className="cp-hints">
                <span className="cp-hint">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>swipe</span>
                    호버 — 3D 회전 / 클릭 — 뒤집기
                </span>
                <span className="cp-hint">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>touch_app</span>
                    재클릭 — 진입
                </span>
            </div>
        </div>
    );
}
