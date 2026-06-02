"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Portal — 코스 진입 시 포탈 전환 효과
 * CSS 기반 포탈 애니메이션 (확장 → 빨려들어감 → 페이지 전환)
 */

interface PortalProps {
    /** 포탈 활성화 여부 */
    active: boolean;
    /** 포탈 색상 (코스 gradient 첫 번째 색) */
    color: string;
    /** 전환 완료 후 콜백 */
    onComplete: () => void;
    /** 코스 타이틀 */
    courseTitle?: string;
}

export default function Portal({ active, color, onComplete, courseTitle }: PortalProps) {
    const [phase, setPhase] = useState<"idle" | "open" | "pull" | "flash">("idle");
    const containerRef = useRef<HTMLDivElement>(null);
    const completeCalled = useRef(false);

    useEffect(() => {
        if (!active) {
            setPhase("idle");
            completeCalled.current = false;
            return;
        }

        // Phase sequence: open (ring expands) → pull (zoom in) → flash (white out) → navigate
        setPhase("open");
        const t1 = setTimeout(() => setPhase("pull"), 600);
        const t2 = setTimeout(() => setPhase("flash"), 1200);
        const t3 = setTimeout(() => {
            if (!completeCalled.current) {
                completeCalled.current = true;
                onComplete();
            }
        }, 1600);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [active, onComplete]);

    if (phase === "idle") return null;

    return (
        <div ref={containerRef} style={{
            position: "fixed", inset: 0, zIndex: 9999,
            pointerEvents: "all",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <style>{`
                @keyframes portal-ring-expand {
                    0% { transform: scale(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: scale(3); opacity: 0.9; }
                }
                @keyframes portal-pull {
                    0% { transform: scale(1); filter: blur(0px); }
                    100% { transform: scale(15); filter: blur(8px); }
                }
                @keyframes portal-flash {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes portal-particles {
                    0% { transform: translate(0) scale(1); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
                }
                @keyframes portal-title-in {
                    0% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 0; transform: scale(2); }
                }
                .portal-ring {
                    position: absolute;
                    width: 200px; height: 200px;
                    border-radius: 50%;
                    border: 4px solid ${color};
                    box-shadow: 0 0 40px ${color}88, 0 0 80px ${color}44, inset 0 0 40px ${color}44;
                    animation: portal-ring-expand 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .portal-ring:nth-child(2) { animation-delay: 0.1s; width: 160px; height: 160px; border-width: 2px; }
                .portal-ring:nth-child(3) { animation-delay: 0.2s; width: 240px; height: 240px; border-width: 1px; }
                .portal-vortex {
                    position: absolute;
                    width: 300px; height: 300px;
                    border-radius: 50%;
                    background: radial-gradient(circle, ${color}cc 0%, ${color}44 40%, transparent 70%);
                }
                .portal-pull-container {
                    animation: portal-pull 0.6s cubic-bezier(0.55, 0, 1, 0.45) forwards;
                }
                .portal-flash-overlay {
                    position: fixed; inset: 0;
                    background: white;
                    animation: portal-flash 0.4s ease-out forwards;
                }
                .portal-particle {
                    position: absolute;
                    width: 4px; height: 4px;
                    border-radius: 50%;
                    background: ${color};
                    animation: portal-particles 0.8s ease-out forwards;
                }
                .portal-course-title {
                    position: absolute;
                    font-size: 28px;
                    font-weight: 900;
                    color: white;
                    text-shadow: 0 0 20px ${color}, 0 2px 8px rgba(0,0,0,0.3);
                    animation: portal-title-in 1.2s ease-out forwards;
                    letter-spacing: -0.02em;
                    white-space: nowrap;
                }
            `}</style>

            {/* Dark backdrop */}
            <div style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.6)",
                opacity: phase === "open" ? 1 : phase === "flash" ? 0 : 1,
                transition: "opacity 0.3s",
            }} />

            {phase === "open" && (
                <>
                    <div className="portal-ring" />
                    <div className="portal-ring" />
                    <div className="portal-ring" />
                    <div className="portal-vortex" />
                    {/* Particles flying inward */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = 150 + Math.random() * 100;
                        return (
                            <div
                                key={i}
                                className="portal-particle"
                                style={{
                                    "--tx": `${-Math.cos(angle) * dist}px`,
                                    "--ty": `${-Math.sin(angle) * dist}px`,
                                    left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                                    top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                                    animationDelay: `${i * 0.05}s`,
                                    width: 3 + Math.random() * 4,
                                    height: 3 + Math.random() * 4,
                                } as React.CSSProperties}
                            />
                        );
                    })}
                    {courseTitle && <div className="portal-course-title">{courseTitle}</div>}
                </>
            )}

            {phase === "pull" && (
                <div className="portal-pull-container">
                    <div className="portal-vortex" />
                </div>
            )}

            {phase === "flash" && <div className="portal-flash-overlay" />}
        </div>
    );
}
