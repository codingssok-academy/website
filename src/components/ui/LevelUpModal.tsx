"use client";
import { useEffect, useState, useMemo } from "react";
import { getLevelTitle, getLevelUpRewards, getMilestone, type LevelUpReward, type MilestoneReward } from "@/lib/xp-engine";

interface LevelUpModalProps {
    level: number;
    onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
    const [show, setShow] = useState(false);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number }[]>([]);

    const titleInfo = useMemo(() => getLevelTitle(level), [level]);
    const levelRewards = useMemo(() => getLevelUpRewards(level), [level]);
    const milestone = useMemo(() => getMilestone(level), [level]);
    const allRewards: LevelUpReward[] = [
        ...levelRewards,
        ...(milestone?.rewards || []),
    ];
    const bonusXp = milestone?.xpBonus || 0;

    useEffect(() => {
        setTimeout(() => setShow(true), 50);
        const p = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: ['#fbbf24', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#0ea5e9', '#f43f5e'][Math.floor(Math.random() * 7)],
            size: Math.random() * 8 + 4,
            delay: Math.random() * 0.5,
        }));
        setParticles(p);
        const timer = setTimeout(onClose, milestone ? 6000 : 4000);
        return () => clearTimeout(timer);
    }, [onClose, milestone]);

    const REWARD_ICONS: Record<string, string> = {
        ice: 'ac_unit', hint: 'lightbulb', xp_boost: 'bolt', badge: 'military_tech',
    };

    return (
        <>
            <style>{`
                @keyframes lvlup-burst { 0% { transform: scale(0) rotate(0deg); opacity: 1; } 50% { opacity: 1; } 100% { transform: scale(1) rotate(180deg); opacity: 0; } }
                @keyframes lvlup-float { 0% { transform: translateY(0px) scale(1); opacity: 1; } 100% { transform: translateY(-200px) scale(0.3); opacity: 0; } }
                @keyframes lvlup-glow { 0%, 100% { text-shadow: 0 0 20px rgba(251,191,36,0.5), 0 0 60px rgba(251,191,36,0.3); } 50% { text-shadow: 0 0 40px rgba(251,191,36,0.8), 0 0 120px rgba(251,191,36,0.5), 0 0 200px rgba(99,102,241,0.3); } }
                @keyframes lvlup-number { 0% { transform: scale(0.3) rotateY(90deg); opacity: 0; } 60% { transform: scale(1.3) rotateY(-10deg); } 80% { transform: scale(0.95) rotateY(5deg); } 100% { transform: scale(1) rotateY(0deg); opacity: 1; } }
                @keyframes lvlup-ring { 0% { transform: scale(0.5); opacity: 1; border-width: 8px; } 100% { transform: scale(2.5); opacity: 0; border-width: 1px; } }
                @keyframes lvlup-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-2deg); } 75% { transform: translateX(5px) rotate(2deg); } }
                @keyframes lvlup-reward-in { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
            `}</style>
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, zIndex: 99999,
                    background: show ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
                    backdropFilter: show ? "blur(8px)" : "blur(0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.5s ease",
                    cursor: "pointer",
                }}
            >
                {/* 파티클 */}
                {particles.map(p => (
                    <div key={p.id} style={{
                        position: "absolute",
                        left: `${p.x}%`, top: `${p.y}%`,
                        width: p.size, height: p.size,
                        borderRadius: p.size > 8 ? "2px" : "50%",
                        background: p.color,
                        animation: `lvlup-float 2s ${p.delay}s ease-out forwards`,
                    }} />
                ))}

                {/* 확장 링 */}
                {[0, 0.3, 0.6].map((d, i) => (
                    <div key={i} style={{
                        position: "absolute",
                        width: 120, height: 120,
                        borderRadius: "50%",
                        border: "4px solid rgba(251,191,36,0.6)",
                        animation: `lvlup-ring 1.5s ${d}s ease-out forwards`,
                    }} />
                ))}

                {/* 메인 콘텐츠 */}
                <div style={{ textAlign: "center", animation: show ? "lvlup-shake 0.5s ease-in-out" : "none" }}>
                    <div style={{ fontSize: 48, marginBottom: 8, animation: "lvlup-burst 1s ease-out" }}>
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 48, color: titleInfo.color, fontVariationSettings: "'FILL' 1" }}
                        >
                            {titleInfo.icon}
                        </span>
                    </div>

                    <div style={{
                        fontSize: 16, fontWeight: 800, color: "#fbbf24",
                        letterSpacing: 6, textTransform: "uppercase", marginBottom: 8,
                    }}>
                        {milestone ? 'MILESTONE!' : 'LEVEL UP!'}
                    </div>

                    <div style={{
                        fontSize: 80, fontWeight: 900,
                        background: `linear-gradient(135deg, ${titleInfo.color}, #f59e0b, #3b82f6)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "lvlup-number 0.8s 0.2s cubic-bezier(0.34,1.56,0.64,1) both, lvlup-glow 2s 1s ease-in-out infinite",
                        lineHeight: 1,
                    }}>
                        Lv.{level}
                    </div>

                    <p style={{ fontSize: 14, color: titleInfo.color, marginTop: 12, fontWeight: 700 }}>
                        {titleInfo.title}
                    </p>

                    {milestone && (
                        <p style={{ fontSize: 13, color: "#fbbf24", marginTop: 4, fontWeight: 600 }}>
                            {milestone.description}
                        </p>
                    )}

                    {/* 보상 목록 */}
                    {(allRewards.length > 0 || bonusXp > 0) && (
                        <div style={{
                            marginTop: 16, display: "flex", flexWrap: "wrap",
                            justifyContent: "center", gap: 8,
                        }}>
                            {bonusXp > 0 && (
                                <div style={{
                                    padding: "6px 14px", borderRadius: 10,
                                    background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)",
                                    fontSize: 12, fontWeight: 700, color: "#fbbf24",
                                    animation: "lvlup-reward-in 0.4s 0.8s ease-out both",
                                }}>
                                    +{bonusXp.toLocaleString()} XP
                                </div>
                            )}
                            {allRewards.map((r, i) => (
                                <div key={i} style={{
                                    padding: "6px 14px", borderRadius: 10,
                                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                                    fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)",
                                    animation: `lvlup-reward-in 0.4s ${0.9 + i * 0.1}s ease-out both`,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>{REWARD_ICONS[r.type] || 'redeem'}</span> {r.name}
                                </div>
                            ))}
                        </div>
                    )}

                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 16 }}>
                        아무 곳이나 클릭하면 닫힙니다
                    </p>
                </div>
            </div>
        </>
    );
}
