"use client";

import { useState, useEffect, useMemo, useRef } from "react";

/**
 * HologramHUD — Iron Man 스타일 플로팅 정보 패널
 * 
 * 좌측 하단에 떠 있는 글래스모피즘 HUD 패널
 * - XP / 레벨 표시
 * - 오늘 학습 시간
 * - 전체 진행률 링 게이지
 * - 연속 학습일 스트릭
 */

interface HologramHUDProps {
    /** 학생 이름 */
    studentName: string;
    /** 전체 진행률 (0-100) */
    progress: number;
    /** 코스별 진행률 */
    courseProgress: Record<string, number>;
    /** 총 코스 수 */
    totalCourses: number;
    /** 야간 모드 */
    isNight?: boolean;
    /** 접기/펼치기 상태 */
    defaultOpen?: boolean;
}

export default function HologramHUD({
    studentName,
    progress,
    courseProgress,
    totalCourses,
    isNight = false,
    defaultOpen = true,
}: HologramHUDProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [animProgress, setAnimProgress] = useState(0);
    const [streak] = useState(() => Math.floor(Math.random() * 7) + 1); // Mock streak
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animate progress counter
    useEffect(() => {
        let frame: number;
        const duration = 1500;
        const start = performance.now();
        const animate = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimProgress(Math.round(progress * eased));
            if (t < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [progress]);

    // Draw circular progress ring
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = 80;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const radius = 32;
        const lineWidth = 5;

        ctx.clearRect(0, 0, size, size);

        // Track
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = isNight ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.1)";
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Progress arc
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (animProgress / 100) * Math.PI * 2;
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(1, "#2563eb");

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();

        // Glow effect
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = "rgba(59,130,246,0.3)";
        ctx.lineWidth = lineWidth + 4;
        ctx.filter = "blur(4px)";
        ctx.stroke();
        ctx.filter = "none";
    }, [animProgress, isNight]);

    const completedCourses = useMemo(() =>
        Object.values(courseProgress).filter(p => p >= 100).length
    , [courseProgress]);

    // XP estimation: each % = 10xp
    const xp = animProgress * 10;
    const level = Math.floor(xp / 200) + 1;

    const bgStyle = isNight
        ? "rgba(15, 23, 42, 0.75)"
        : "rgba(255, 255, 255, 0.65)";
    const borderStyle = isNight
        ? "1px solid rgba(99, 102, 241, 0.2)"
        : "1px solid rgba(59, 130, 246, 0.15)";
    const textColor = isNight ? "#c7d2fe" : "#1e293b";
    const subColor = isNight ? "rgba(199, 210, 254, 0.6)" : "#64748b";

    return (
        <>
            <style>{`
                @keyframes hud-slide-in {
                    0% { transform: translateX(-20px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes hud-glow-pulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.05); }
                    50% { box-shadow: 0 0 30px rgba(59,130,246,0.12); }
                }
                @keyframes hud-scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .hud-panel {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    z-index: 100;
                    animation: hud-slide-in 0.5s ease-out;
                }
                .hud-toggle {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                    transition: all 0.2s;
                }
                .hud-toggle:hover { transform: scale(1.15); }
                .hud-stat { display: flex; align-items: center; gap: 6px; }
                .hud-stat-icon { font-size: 14px; }
                .hud-stat-value { font-weight: 800; font-size: 14px; }
                .hud-stat-label { font-size: 10px; }
                .hud-divider {
                    width: 100%;
                    height: 1px;
                    margin: 6px 0;
                }
                @keyframes streak-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
            `}</style>

            <div className="hud-panel">
                {open ? (
                    <div style={{
                        background: bgStyle,
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: borderStyle,
                        borderRadius: 16,
                        padding: "14px 16px",
                        minWidth: 220,
                        color: textColor,
                        animation: "hud-glow-pulse 4s ease-in-out infinite",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Scan line effect */}
                        <div style={{
                            position: "absolute",
                            left: 0,
                            width: "100%",
                            height: 1,
                            background: isNight
                                ? "linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)"
                                : "linear-gradient(90deg, transparent, rgba(59,130,246,0.08), transparent)",
                            animation: "hud-scan 3s linear infinite",
                            pointerEvents: "none",
                        }} />

                        <button
                            className="hud-toggle"
                            style={{
                                background: isNight ? "rgba(99,102,241,0.3)" : "rgba(59,130,246,0.15)",
                                color: isNight ? "#c7d2fe" : "#3b82f6",
                            }}
                            onClick={() => setOpen(false)}
                        >✕</button>

                        {/* Header row: name + ring */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                                <canvas
                                    ref={canvasRef}
                                    style={{ width: 80, height: 80 }}
                                />
                                <div style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    <span style={{ fontSize: 18, fontWeight: 900 }}>{animProgress}%</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>{studentName}</div>
                                <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                                    Lv.{level} · {xp} XP
                                </div>
                            </div>
                        </div>

                        <div className="hud-divider" style={{
                            background: isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                        }} />

                        {/* Stats row */}
                        <div style={{ display: "flex", gap: 14 }}>
                            <div className="hud-stat">
                                <span className="hud-stat-icon material-symbols-outlined" style={{ fontSize: 14 }}>menu_book</span>
                                <div>
                                    <div className="hud-stat-value" style={{ color: textColor }}>
                                        {completedCourses}/{totalCourses}
                                    </div>
                                    <div className="hud-stat-label" style={{ color: subColor }}>코스</div>
                                </div>
                            </div>
                            <div className="hud-stat">
                                <span className="hud-stat-icon material-symbols-outlined" style={{
                                    fontSize: 14,
                                    animation: streak >= 3 ? "streak-bounce 1s ease infinite" : "none",
                                }}>local_fire_department</span>
                                <div>
                                    <div className="hud-stat-value" style={{ color: textColor }}>
                                        {streak}일
                                    </div>
                                    <div className="hud-stat-label" style={{ color: subColor }}>연속</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        className="hud-toggle"
                        style={{
                            position: "relative",
                            width: 40, height: 40,
                            borderRadius: 12,
                            background: bgStyle,
                            backdropFilter: "blur(12px)",
                            border: borderStyle,
                            color: textColor,
                            fontSize: 16,
                        }}
                        onClick={() => setOpen(true)}
                    ><span className="material-symbols-outlined" style={{ fontSize: 16 }}>bar_chart</span></button>
                )}
            </div>
        </>
    );
}
