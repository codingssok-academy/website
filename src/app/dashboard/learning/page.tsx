"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Component, ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { COURSES, STUDENT_SHELF_COURSES } from "@/data/courses";
import { canAccessContent, getTierInfo } from "@/lib/xp-engine";
import HomeworkBanner from "@/components/ui/HomeworkBanner";
import { useUserProgress } from "@/hooks/useUserProgress";
import BadgeIcon from "@/components/icons/BadgeIcon";
import StudentHomeScreen from "./components/StudentHomeScreen";
import LearningResumeCard from "./components/LearningResumeCard";

const Scene3D = dynamic(() => import("@/components/dashboard3d/Scene"), { ssr: false });

/* ?? ErrorBoundary for 3D Scene ?? */
class Scene3DErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err: Error) {
        if (process.env.NODE_ENV === "development") console.error("[Scene3D]", err);
    }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

function toggleFullscreen() {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   PREMIUM 3D BOOK ??5-face, thick spine,
   metallic shine, mouse-tracking rotation
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/

const T = 50;            // book thickness
const R = 6;             // corner radius
const PO = 2;            // pages inset from cover edges

/* ?? Toast ?? */
function useToast() {
    const [toast, setToast] = useState<string | null>(null);
    const show = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2800);
    }, []);
    return { toast, show };
}

function BookCard({
    course, progress, index, onClick, locked, requiredTierName, onComingSoon,
}: {
    course: typeof COURSES[0];
    progress: number;
    index: number;
    onClick: () => void;
    locked?: boolean;
    requiredTierName?: string;
    onComingSoon?: () => void;
}) {
    const [flipped, setFlipped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const colors = course.gradient.match(/#[0-9a-fA-F]{6}/g) || ["#3b82f6"];
    const spineColor = colors[0];
    const spineColor2 = colors[1] || colors[0];
    const spineColorDark = `color-mix(in srgb, ${spineColor} 70%, #000)`;
    // Per-card mouse-tracking rotation
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current || !bookRef.current || flipped) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;   // 0~1
        const y = (e.clientY - rect.top) / rect.height;    // 0~1
        const rotY = -35 + (x - 0.5) * 20;
        const rotX = 10 - (y - 0.5) * 12;
        bookRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    }, [flipped]);

    const isTouchRef = useRef(false);

    const handleMouseLeave = useCallback(() => {
        if (!bookRef.current || isTouchRef.current) return;
        if (flipped) {
            bookRef.current.style.transform = `rotateY(160deg) rotateX(0deg)`;
        } else {
            bookRef.current.style.transform = `rotateY(-35deg) rotateX(10deg)`;
        }
        setFlipped(false);
    }, [flipped]);

    const handleClick = useCallback(() => {
        if (locked) return;
        if (course.comingSoon) {
            onComingSoon?.();
            return;
        }
        if (!flipped) {
            setFlipped(true);
            if (bookRef.current) {
                bookRef.current.style.transform = `rotateY(160deg) rotateX(0deg)`;
            }
        } else {
            onClick();
        }
    }, [flipped, onClick, locked, course.comingSoon, onComingSoon]);

    // Touch support: single tap ??flip, second tap ??enter
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        isTouchRef.current = true;
        handleClick();
    }, [handleClick]);

    return (
        <div
            ref={containerRef}
            className={`bk-scene bks-${index}`}
            style={{ "--spine": spineColor, "--spine2": spineColor2, "--spine-dark": spineColorDark, "--shadow-c": `${spineColor}55` } as React.CSSProperties}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onTouchEnd={handleTouchEnd}
        >
            <div ref={bookRef} className="bk">

                {/* ?? FRONT COVER ?? */}
                <div className="bk-face bk-front">
                    {course.cardImage ? (
                        <img src={course.cardImage} alt={course.title} className="bk-cover-img" draggable={false} />
                    ) : (
                        <div className="bk-cover-grad" style={{ background: course.gradient }} />
                    )}
                    <div className="bk-cover-dim" />
                    <div className="bk-cover-shine" />
                    <div className="bk-cover-info">
                        <span className="bk-cover-title">{course.title}</span>
                    </div>
                    {progress > 0 && (
                        <div className="bk-cover-progress">
                            <div className="bk-cover-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                    {course.comingSoon && (
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "rgba(15,23,42,0.72)",
                            backdropFilter: "blur(2px)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: 6, borderRadius: "inherit", zIndex: 20,
                        }}>
                            <span style={{
                                fontSize: 9, fontWeight: 900, color: "#fff",
                                letterSpacing: 2, background: "rgba(255,255,255,0.15)",
                                padding: "4px 8px", borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.25)",
                            }}>COMING SOON</span>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>준비 중</span>
                        </div>
                    )}
                    {locked && requiredTierName && (
                        <div style={{
                            position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: 6, borderRadius: "inherit", zIndex: 20,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32, color: getTierInfo(requiredTierName).color }}>lock</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 10, verticalAlign: "middle" }}>{getTierInfo(requiredTierName).icon}</span> {getTierInfo(requiredTierName).nameKo} ?댁긽
                            </span>
                        </div>
                    )}
                </div>

                {/* ?? LEFT SPINE (colored, matching cover) ?? */}
                <div className="bk-face bk-spine" />

                {/* ?? RIGHT PAGE EDGES (paper texture) ?? */}
                <div className="bk-face bk-pages" />

                {/* ?? TOP EDGE ?? */}
                <div className="bk-face bk-top" />

                {/* ?? BOTTOM EDGE ?? */}
                <div className="bk-face bk-bottom" />

                {/* ?? BACK COVER ?? */}
                <div className="bk-face bk-back">
                    {course.cardImage ? (
                        <img src={course.cardImage} alt="" className="bk-cover-img" draggable={false} />
                    ) : (
                        <div className="bk-cover-grad" style={{ background: course.gradient }} />
                    )}
                    <div className="bk-back-overlay" />
                    <div className="bk-back-content">
                        <span className="bk-back-title">{course.title}</span>
                        <p className="bk-back-desc">{course.description}</p>
                        {progress > 0 && (
                            <div className="bk-back-pbar"><div className="bk-back-pbar-fill" style={{ width: `${progress}%` }} /></div>
                        )}
                        <button className="bk-back-btn" onClick={(e) => { e.stopPropagation(); if (!locked) onClick(); }}
                            style={locked ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
                            {locked ? `${getTierInfo(requiredTierName || "").nameKo} 이상 필요` : "코스 입장 →"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ?? GROUND SHADOW ?? */}
            <div className="bk-ground-shadow" />
        </div>
    );
}

export default function LearningDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    /* Mobile detection ??show StudentHomeScreen instead of 3D scene on small screens */
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        function detect() {
            setIsMobile(
                window.innerWidth < 768 ||
                window.matchMedia("(display-mode: standalone)").matches ||
                (window.navigator as Navigator & { standalone?: boolean }).standalone === true
            );
        }
        detect();
        window.addEventListener("resize", detect, { passive: true });
        return () => window.removeEventListener("resize", detect);
    }, []);

    if (isMobile) return <StudentHomeScreen />;
    const { progress: userProgress } = useUserProgress();
    const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const { toast, show: showToast } = useToast();

    useEffect(() => {
        async function load() {
            if (!user) { setIsLoading(false); return; }
            try {
                const { data } = await supabase
                    .from("user_course_progress").select("*").eq("user_id", user.id);
                if (data) {
                    const m: Record<string, number> = {};
                    data.forEach((p: { course_id: string; completed_lessons?: number | string[]; is_completed?: boolean }) => {
                        const completed = typeof p.completed_lessons === "number"
                            ? p.completed_lessons
                            : (Array.isArray(p.completed_lessons) ? p.completed_lessons.length : 0);
                        const c = COURSES.find(c => c.id === p.course_id);
                        m[p.course_id] = p.is_completed ? 100 : Math.round((completed / (c?.totalUnits || 1)) * 100);
                    });
                    setCourseProgress(m);
                }
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error(e); }
            setIsLoading(false);
            requestAnimationFrame(() => setReady(true));
        }
        load();
    }, [user, supabase]);

    const go = useCallback((id: string) => { router.push(`/dashboard/learning/courses/${id}`); }, [router]);

    const handleCourseSelect3D = useCallback((courseId: string) => {
        router.push(`/dashboard/learning/courses/${courseId}`);
    }, [router]);

    if (isLoading) {
        return (
            <div style={{ position:"fixed",inset:0,background:"#f0f4ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",border:"3px solid rgba(59,130,246,0.2)",borderTopColor:"#3b82f6",animation:"spin .8s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    const normalizedUserName = (user?.name || "").replace(/\s+/g, "");
    const isAdminUser = user?.role === "teacher" || (user?.role as string) === "admin" || normalizedUserName === "장민";

    return (
        <div className={`pg${ready ? " rdy" : ""}`}>
            {/* 3D Scene removed ??was showing old "book" design behind cards */}

            <style>{`
                .pg {
                    width:100%;height:100%;
                    background:linear-gradient(145deg,#f0f4ff,#e8efff 40%,#eff6ff 70%,#f0f4ff);
                    display:flex;flex-direction:column;
                    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
                    position:relative;overflow:hidden;overflow-y:auto;
                }
                .pg::before{content:'';position:absolute;width:500px;height:500px;top:-15%;right:-8%;background:radial-gradient(circle,rgba(147,197,253,0.1),transparent 70%);border-radius:50%;pointer-events:none}
                .pg::after{content:'';position:absolute;width:500px;height:500px;bottom:-15%;left:-8%;background:radial-gradient(circle,rgba(196,181,253,0.08),transparent 70%);border-radius:50%;pointer-events:none}

                /* ?? Welcome Banner ?? */
                .pg-welcome{
                    position:relative;z-index:10;
                    margin:0 24px;padding:20px 28px;
                    background:linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.75));
                    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
                    border:1px solid rgba(255,255,255,0.7);
                    border-radius:24px;
                    box-shadow:0 4px 24px rgba(59,130,246,0.08);
                    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;
                    animation:pg-fadein .5s ease both;
                }
                .pg-welcome-left{display:flex;flex-direction:column;gap:4px}
                .pg-welcome-name{font-size:clamp(16px,2vw,22px);font-weight:800;color:#0f172a;letter-spacing:-0.02em}
                .pg-welcome-sub{font-size:clamp(12px,1.1vw,14px);color:#64748b;font-weight:500}
                .pg-welcome-stats{display:flex;gap:12px;flex-wrap:wrap}
                .pg-stat{
                    display:flex;align-items:center;gap:7px;
                    padding:8px 14px;border-radius:12px;
                    background:rgba(255,255,255,0.7);
                    border:1px solid rgba(226,232,240,0.6);
                    font-size:12px;font-weight:700;color:#374151;
                    white-space:nowrap;
                }
                .pg-stat-icon{font-size:16px}

                /* ?? Quick Access Cards ?? */
                .pg-quick{
                    position:relative;z-index:10;
                    display:flex;gap:12px;
                    margin:12px 24px 0;
                    flex-wrap:nowrap;overflow-x:auto;
                    padding-bottom:4px;
                }
                .pg-quick::-webkit-scrollbar{display:none}
                .pg-qcard{
                    flex:1;min-width:140px;max-width:200px;
                    display:flex;flex-direction:column;align-items:flex-start;gap:8px;
                    padding:16px;border-radius:20px;cursor:pointer;
                    border:1px solid rgba(255,255,255,0.7);
                    transition:transform .2s ease,box-shadow .2s ease;
                    text-decoration:none;color:inherit;
                    animation:pg-fadein .5s ease both;
                }
                .pg-qcard:hover{transform:translateY(-3px)}
                .pg-qcard-icon{
                    width:36px;height:36px;border-radius:12px;
                    display:flex;align-items:center;justify-content:center;
                }
                .pg-qcard-title{font-size:13px;font-weight:700;color:#1e293b;line-height:1.2}
                .pg-qcard-sub{font-size:11px;color:#94a3b8;font-weight:500}

                @keyframes pg-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

                .pg-bar{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;z-index:100;position:relative}
                .pg-logo{display:flex;align-items:center;gap:10}
                .pg-logo img{height:38px}
                .pg-acts{display:flex;align-items:center;gap:8}
                .pg-user{padding:5px 12px;border-radius:8px;background:rgba(255,255,255,0.7);border:1px solid rgba(59,130,246,0.12);display:flex;align-items:center;gap:7;font-size:13px;font-weight:700;color:#1e293b}
                .pg-dot{width:6px;height:6px;border-radius:50%;background:#22c55e}
                .pg-btn{padding:5px 8px;border-radius:8px;background:rgba(255,255,255,0.7);border:1px solid rgba(59,130,246,0.12);color:#64748b;cursor:pointer;display:flex;align-items:center;gap:4;font-size:12px;font-weight:600;transition:background .2s}
                .pg-btn:hover{background:rgba(255,255,255,0.95)}

                .pg-grid{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:clamp(32px,5vh,56px);padding:0 24px;z-index:10;width:100%}
                .pg-r4{display:flex;justify-content:space-evenly;width:100%}
                .pg-r3{display:flex;justify-content:space-evenly;width:80%}

                /* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
                   PREMIUM 3D BOOK
                   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/

                .bk-scene {
                    display:flex;align-items:center;justify-content:center;
                    perspective: 1600px;
                    cursor:pointer;
                    position:relative;
                    /* Entrance animation */
                    opacity:0;transform:translateY(30px);
                    transition:opacity .6s ease,transform .6s ease;
                }
                .pg.rdy .bk-scene{opacity:1;transform:translateY(0)}
                .pg.rdy .bks-0{transition-delay:0s}
                .pg.rdy .bks-1{transition-delay:.08s}
                .pg.rdy .bks-2{transition-delay:.16s}
                .pg.rdy .bks-3{transition-delay:.24s}
                .pg.rdy .bks-4{transition-delay:.32s}
                .pg.rdy .bks-5{transition-delay:.4s}
                .pg.rdy .bks-6{transition-delay:.48s}
                .pg.rdy .bks-7{transition-delay:.56s}

                /* Idle float */
                @keyframes bk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
                .pg.rdy .bk-scene{animation:bk-float 4s ease-in-out infinite}
                .pg.rdy .bks-1{animation-delay:.6s}
                .pg.rdy .bks-2{animation-delay:1.2s}
                .pg.rdy .bks-3{animation-delay:1.8s}
                .pg.rdy .bks-4{animation-delay:.4s}
                .pg.rdy .bks-5{animation-delay:1s}
                .pg.rdy .bks-6{animation-delay:1.6s}
                .pg.rdy .bks-7{animation-delay:2.2s}
                .bk-scene:hover{animation-play-state:paused!important}

                /* ?? THE BOOK ?? */
                .bk {
                    width: clamp(130px, 13vw, 180px);
                    height: clamp(185px, 18.5vw, 250px);
                    position: relative;
                    transform-style: preserve-3d;
                    transform: rotateY(-35deg) rotateX(10deg);
                    transition: transform 0.5s cubic-bezier(0.23,1,0.32,1);
                }

                .bk-face {
                    position: absolute;
                    display: block;
                }

                /* ?? FRONT COVER ?? */
                .bk-front {
                    width: 100%;
                    height: 100%;
                    transform: translateZ(${T / 2}px);
                    border-radius: 2px ${R}px ${R}px 2px;
                    overflow: hidden;
                    box-shadow:
                        inset -5px 0 15px rgba(0,0,0,0.3);
                    z-index: 2;
                }
                /* Sheen/highlight on cover edges ??like reference */
                .bk-front::before {
                    content:'';
                    position:absolute;inset:0;z-index:5;pointer-events:none;
                    background:linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 40%,transparent 60%,rgba(0,0,0,0.2) 100%);
                }
                .bk-cover-img {
                    position:absolute;inset:0;width:100%;height:100%;
                    object-fit:cover;display:block;
                }
                .bk-cover-grad { position:absolute;inset:0; }
                .bk-cover-dim {
                    position:absolute;inset:0;z-index:1;
                    background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.6) 100%);
                }

                /* Metallic shine sweep */
                @keyframes bk-shine {
                    0%{background-position:-200% -200%}
                    100%{background-position:200% 200%}
                }
                .bk-cover-shine {
                    position:absolute;inset:0;z-index:2;pointer-events:none;
                    background:linear-gradient(
                        135deg,
                        rgba(255,255,255,0) 0%,
                        rgba(255,255,255,0.08) 42%,
                        rgba(255,255,255,0.35) 50%,
                        rgba(255,255,255,0.08) 58%,
                        rgba(255,255,255,0) 100%
                    );
                    background-size:200% 200%;
                    animation: bk-shine 5s linear infinite;
                    opacity:0.7;
                }

                .bk-cover-info {
                    position:absolute;bottom:0;left:0;right:0;z-index:3;
                    padding:clamp(8px,1vw,14px);
                    display:flex;flex-direction:column;gap:2px;
                }

                .bk-cover-title {
                    font-size:clamp(11px,1vw,15px);font-weight:800;color:#fff;
                    text-shadow:0 1px 6px rgba(0,0,0,0.7),0 3px 10px rgba(0,0,0,0.4);
                    letter-spacing:-0.02em;line-height:1.25;
                }

                /* Progress bar on cover */
                .bk-cover-progress {
                    position:absolute;bottom:4px;left:10%;right:10%;z-index:4;
                    height:3px;border-radius:2px;
                    background:rgba(0,0,0,0.3);
                }
                .bk-cover-progress-fill {
                    height:100%;border-radius:2px;
                    background:linear-gradient(90deg, var(--spine), var(--spine2));
                }

                /* ?? LEFT SPINE (colored, matching cover) ?? */
                .bk-spine {
                    width: ${T}px;
                    height: 100%;
                    left: -${T / 2}px;
                    top: 0;
                    transform: rotateY(-90deg);
                    background: linear-gradient(180deg, var(--spine), var(--spine-dark));
                    border-radius: ${R}px 0 0 ${R}px;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
                }

                /* ?? RIGHT PAGE EDGES (paper texture) ?? */
                .bk-pages {
                    width: ${T}px;
                    height: 100%;
                    right: -${T / 2}px;
                    top: 0;
                    transform: rotateY(90deg);
                    background:
                        linear-gradient(to right, rgba(0,0,0,0.1), transparent),
                        repeating-linear-gradient(to right,
                            #e5e5e5 0px, #fff 1.5px, #ddd 3px
                        );
                    background-size: 100% 100%, 4px 100%;
                    box-shadow: inset 5px 0 15px rgba(0,0,0,0.15);
                }

                /* ?? TOP EDGE ?? */
                .bk-top {
                    width: 100%;
                    height: ${T}px;
                    top: -${T / 2}px;
                    left: 0;
                    transform: rotateX(90deg);
                    background: #e8e8e8;
                    background-image:
                        repeating-linear-gradient(to bottom, #ccc 0px, #eee 1px, #fff 2px);
                }

                /* ?? BOTTOM EDGE ?? */
                .bk-bottom {
                    width: 100%;
                    height: ${T}px;
                    bottom: -${T / 2}px;
                    left: 0;
                    transform: rotateX(-90deg);
                    background: #e0e0e0;
                    background-image:
                        repeating-linear-gradient(to top, #ccc 0px, #eee 1px, #fff 2px);
                }

                /* ?? BACK COVER ?? */
                .bk-back {
                    width: 100%;
                    height: 100%;
                    transform: translateZ(-${T / 2}px) rotateY(180deg);
                    border-radius: ${R}px 2px 2px ${R}px;
                    overflow: hidden;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                .bk-back-overlay {
                    position:absolute;inset:0;z-index:1;
                    background:rgba(15,23,42,0.82);
                    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
                }
                .bk-back-content {
                    position:relative;z-index:2;
                    display:flex;flex-direction:column;align-items:center;
                    justify-content:center;gap:6px;
                    padding:clamp(10px,1.2vw,16px);height:100%;text-align:center;
                }
                .bk-back-title{font-size:clamp(12px,1.1vw,17px);font-weight:800;color:#fff}
                .bk-back-desc{font-size:clamp(8px,0.65vw,11px);color:rgba(255,255,255,0.6);line-height:1.4;margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
                .bk-back-pbar{width:70%;height:3px;border-radius:2px;background:rgba(255,255,255,0.1)}
                .bk-back-pbar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#3b82f6,#60a5fa)}
                .bk-back-btn{padding:7px 16px;border-radius:8px;background:rgba(255,255,255,0.1);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.2);color:#fff;cursor:pointer;font-size:clamp(9px,0.75vw,12px);font-weight:700;transition:all .2s}
                .bk-back-btn:hover{background:rgba(59,130,246,0.4);border-color:rgba(59,130,246,0.6);box-shadow:0 4px 20px rgba(59,130,246,0.35)}

                /* ?? GROUND SHADOW ?? */
                .bk-ground-shadow {
                    position:absolute;
                    bottom:-18px;left:10%;
                    width:80%;height:16px;
                    background:rgba(0,0,0,0.15);
                    filter:blur(12px);
                    border-radius:50%;
                    pointer-events:none;
                    z-index:-1;
                }

                .pg-hints{display:flex;justify-content:center;gap:20;padding:8px 0 12px;z-index:10;opacity:0.4}
                .pg-hint{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4}

                /* ?? MOBILE ?? */
                @media (max-width: 640px) {
                    .pg-grid { gap: clamp(12px,3vh,24px); padding: 0 8px 24px; }
                    .pg-r4 { flex-wrap: wrap; justify-content: center; gap: 20px 16px; }
                    .bk {
                        width: clamp(110px,40vw,150px) !important;
                        height: clamp(155px,56vw,210px) !important;
                    }
                    .pg-bar { padding: 10px 16px; }
                    .pg-user { display: none; }
                    .pg-hints { display: none; }
                }
                @media (max-width: 400px) {
                    .pg-r4 { gap: 14px 10px; }
                    .bk {
                        width: clamp(100px,43vw,140px) !important;
                        height: clamp(140px,60vw,196px) !important;
                    }
                }

            `}</style>

            <div className="pg-bar">
                <div className="pg-logo"><img src="/icon.png" alt="코딩쏙" /></div>
                <div className="pg-acts">
                    <div className="pg-user"><div className="pg-dot" />{user?.name || "학생"}</div>
                    {isAdminUser ? (
                        <button className="pg-btn" onClick={() => router.push("/teacher/admin")} style={{background:"linear-gradient(135deg, #ef4444, #f97316)",color:"#fff",borderRadius:6,padding:"2px 8px",fontWeight:600}}>
                            <span className="material-symbols-outlined" style={{fontSize:15,color:"#fff"}}>admin_panel_settings</span>관리자
                        </button>
                    ) : (
                        <>
                            <button className="pg-btn" onClick={() => router.push("/dashboard/learning/growth")} title="나의 성장 기록">
                                <span className="material-symbols-outlined" style={{fontSize:15}}>trending_up</span>성장기록
                            </button>
                            <button className="pg-btn" onClick={() => router.push("/dashboard/learning/files")} title="내 파일함">
                                <span className="material-symbols-outlined" style={{fontSize:15}}>folder_open</span>내 파일함
                            </button>
                        </>
                    )}
                    <button className="pg-btn" onClick={() => router.push("/dashboard/compiler")} title="C-Studio 컴파일러">
                        <span className="material-symbols-outlined" style={{fontSize:15}}>terminal</span>
                    </button>
                    <button className="pg-btn" onClick={toggleFullscreen}>
                        <span className="material-symbols-outlined" style={{fontSize:16}}>fullscreen</span>
                    </button>
                    <button className="pg-btn" onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); router.push("/"); }}>
                        <span className="material-symbols-outlined" style={{fontSize:14}}>logout</span>나가기
                    </button>
                </div>
            </div>

            {/* Welcome Banner removed */}

            {/* Quick Access Cards removed */}

            {toast && (
                <div style={{
                    position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(15,23,42,0.92)", color: "#fff",
                    padding: "10px 22px", borderRadius: 10,
                    fontSize: 13, fontWeight: 700, zIndex: 9999,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    pointerEvents: "none",
                }}>
                    {toast}
                </div>
            )}

            <LearningResumeCard userId={user?.id} />

            {/* ?숈젣 ?뚮┝ 諛곕꼫 */}
            <HomeworkBanner userName={user?.name || user?.email?.split("@")[0]} />

            <div className="pg-grid">
                {/* 학생에게는 학원의 5개 대표 교육상품만 노출 */}
                <div className="pg-r4">
                    {STUDENT_SHELF_COURSES.map((c,i) => (
                        <BookCard key={c.id} course={c} progress={courseProgress[c.id]||0} index={i} onClick={() => go(c.id)} locked={!!c.requiredTier && !canAccessContent(userProgress.tier, c.requiredTier)} requiredTierName={c.requiredTier} onComingSoon={() => showToast("以鍮?以묒엯?덈떎. 怨??ㅽ뵂???덉젙?댁뿉??")} />
                    ))}
                </div>
            </div>

            <div className="pg-hints">
                <span className="pg-hint"><span className="material-symbols-outlined" style={{fontSize:12}}>swipe</span>호버 - 3D 회전 / 클릭 - 뒤집기</span>
                <span className="pg-hint"><span className="material-symbols-outlined" style={{fontSize:12}}>touch_app</span>재클릭 - 진입</span>
            </div>
        </div>
    );
}

