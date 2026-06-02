"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * AdaptiveEnvironment — 시간대별 환경 변화
 *
 * 현재 시각에 따라 배경 그라디언트, 파티클 색상, 분위기가 변화
 * - Dawn (5-8): 따뜻한 오렌지-핑크
 * - Day (8-17): 밝은 블루-화이트 (기본)
 * - Sunset (17-20): 퍼플-골드
 * - Night (20-5): 딥 네이비-별빛
 */

export interface EnvironmentTheme {
    background: string;
    particleColor: string;
    accentGlow: string;
    ambientOpacity: number;
    label: string;
    emoji: string;
}

/** 성능 티어 — low/medium/high */
export type PerformanceTier = "low" | "medium" | "high";

/** 런타임 성능 감지 */
function detectPerformanceTier(): PerformanceTier {
    // SSR guard
    if (typeof navigator === "undefined") return "medium";

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) return "low";

    const cores = navigator.hardwareConcurrency ?? 4;
    const dpr = window.devicePixelRatio ?? 1;

    if (cores <= 4) return "low";
    if (dpr >= 2 && cores >= 8) return "high";
    return "medium";
}

/** pixelRatio 상한 — tier별 */
export const TIER_MAX_DPR: Record<PerformanceTier, number> = {
    low: 1.0,
    medium: 1.5,
    high: 2.0,
};

const THEMES: Record<string, EnvironmentTheme> = {
    dawn: {
        background: "linear-gradient(145deg, #fff7ed, #fef3c7 30%, #fce7f3 60%, #f0f4ff 100%)",
        particleColor: "rgba(251, 191, 36, 0.3)",
        accentGlow: "rgba(251, 146, 60, 0.12)",
        ambientOpacity: 0.08,
        label: "새벽",
        emoji: "wb_twilight",
    },
    day: {
        background: "linear-gradient(145deg, #f0f4ff, #e8efff 40%, #eff6ff 70%, #f0f4ff)",
        particleColor: "rgba(147, 197, 253, 0.25)",
        accentGlow: "rgba(96, 165, 250, 0.08)",
        ambientOpacity: 0.06,
        label: "낮",
        emoji: "light_mode",
    },
    sunset: {
        background: "linear-gradient(145deg, #fdf2f8, #fce7f3 30%, #dbeafe 60%, #e0e7ff 100%)",
        particleColor: "rgba(192, 132, 252, 0.3)",
        accentGlow: "rgba(168, 85, 247, 0.1)",
        ambientOpacity: 0.1,
        label: "노을",
        emoji: "routine",
    },
    night: {
        background: "linear-gradient(145deg, #0f172a, #172554 35%, #1e293b 65%, #0f172a)",
        particleColor: "rgba(199, 210, 254, 0.2)",
        accentGlow: "rgba(129, 140, 248, 0.08)",
        ambientOpacity: 0.15,
        label: "밤",
        emoji: "dark_mode",
    },
};

function getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "sunset";
    return "night";
}

interface AdaptiveEnvironmentProps {
    /** Override hour for testing (0-23) */
    overrideHour?: number;
    /** Progress affects brightness (0-100) */
    progress?: number;
    children: React.ReactNode;
}

export default function AdaptiveEnvironment({ overrideHour, progress = 0, children }: AdaptiveEnvironmentProps) {
    const [currentHour, setCurrentHour] = useState(() => overrideHour ?? new Date().getHours());

    // Update hour every minute
    useEffect(() => {
        if (overrideHour !== undefined) {
            setCurrentHour(overrideHour);
            return;
        }
        const interval = setInterval(() => {
            setCurrentHour(new Date().getHours());
        }, 60_000);
        return () => clearInterval(interval);
    }, [overrideHour]);

    const timeOfDay = useMemo(() => getTimeOfDay(currentHour), [currentHour]);
    const theme = THEMES[timeOfDay];
    const isNight = timeOfDay === "night";

    // Progress-based brightness offset
    const brightnessBoost = Math.min(progress / 100 * 0.05, 0.05);

    return (
        <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: theme.background,
            transition: "background 2s ease",
            color: isNight ? "#e2e8f0" : "#1e293b",
        }}>
            {/* Ambient glow orbs */}
            <div style={{
                position: "absolute", inset: 0, overflow: "hidden",
                pointerEvents: "none", zIndex: 0,
            }}>
                {/* Top right orb */}
                <div style={{
                    position: "absolute",
                    width: 500, height: 500,
                    top: "-15%", right: "-8%",
                    background: `radial-gradient(circle, ${theme.accentGlow}, transparent 70%)`,
                    borderRadius: "50%",
                    opacity: theme.ambientOpacity + brightnessBoost,
                    transition: "all 2s ease",
                }} />
                {/* Bottom left orb */}
                <div style={{
                    position: "absolute",
                    width: 500, height: 500,
                    bottom: "-15%", left: "-8%",
                    background: `radial-gradient(circle, ${theme.particleColor}, transparent 70%)`,
                    borderRadius: "50%",
                    opacity: theme.ambientOpacity + brightnessBoost,
                    transition: "all 2s ease",
                }} />
                {/* Night stars */}
                {isNight && <StarField />}
            </div>

            {/* Time indicator chip */}
            <div style={{
                position: "absolute",
                top: 14, left: "50%", transform: "translateX(-50%)",
                padding: "3px 12px",
                borderRadius: 20,
                background: isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: isNight ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
                fontSize: 11,
                fontWeight: 600,
                color: isNight ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 2s ease",
                pointerEvents: "none",
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle" }}>{theme.emoji}</span> {theme.label}
            </div>

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
                {children}
            </div>
        </div>
    );
}

/** Lightweight CSS star field for night mode */
function StarField() {
    const stars = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 3,
        }));
    }, []);

    return (
        <>
            <style>{`
                @keyframes star-twinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.8; }
                }
            `}</style>
            {stars.map((s, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        borderRadius: "50%",
                        background: "white",
                        animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                    }}
                />
            ))}
        </>
    );
}

/** Export theme getter for other components */
export function useEnvironmentTheme(overrideHour?: number): EnvironmentTheme & { hour: number; isNight: boolean } {
    const [hour, setHour] = useState(() => overrideHour ?? new Date().getHours());

    useEffect(() => {
        if (overrideHour !== undefined) { setHour(overrideHour); return; }
        const id = setInterval(() => setHour(new Date().getHours()), 60_000);
        return () => clearInterval(id);
    }, [overrideHour]);

    const tod = getTimeOfDay(hour);
    return { ...THEMES[tod], hour, isNight: tod === "night" };
}

/** Hook — 성능 티어 감지 (클라이언트 전용) */
export function usePerformanceTier(): PerformanceTier {
    const [tier, setTier] = useState<PerformanceTier>("medium");

    useEffect(() => {
        setTier(detectPerformanceTier());
    }, []);

    return tier;
}
