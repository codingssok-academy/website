"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { calcLevel } from "@/lib/xp-engine";
import { createClient } from "@/lib/supabase";
import { applyTheme, getItemEffectDescription } from "@/lib/store-effects";
import { useStreak } from "@/hooks/useStreak";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem, ScaleOnHover, HoverGlow } from "@/components/motion/motion";

const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
};

const STORE_ITEMS = [
    { id: "streak_ice", icon: "ac_unit", name: "스트릭 아이스", desc: "하루 놓쳐도 연속 스트릭이 유지돼요! (1회)", xp: 500, category: "부스터", rarity: "rare" },
    { id: "theme_dark", icon: "", name: "다크 테마", desc: "에디터와 대시보드를 다크모드로 변환하세요", xp: 500, category: "테마", rarity: "common" },
    { id: "theme_neon", icon: "", name: "네온 테마", desc: "화려한 네온 컬러 에디터 테마", xp: 800, category: "테마", rarity: "rare" },
    { id: "badge_star", icon: "star", name: "스타 뱃지", desc: "프로필에 빛나는 스타 뱃지를 달아보세요", xp: 300, category: "뱃지", rarity: "common" },
    { id: "badge_fire", icon: "", name: "파이어 뱃지", desc: "불타오르는 열정의 뱃지", xp: 500, category: "뱃지", rarity: "rare" },
    { id: "badge_diamond", icon: "", name: "다이아몬드 뱃지", desc: "최상위 등급의 프리미엄 뱃지", xp: 1500, category: "뱃지", rarity: "legendary" },
    { id: "boost_2x", icon: "", name: "더블 XP 부스터", desc: "24시간 동안 XP 2배 획득!", xp: 200, category: "부스터", rarity: "common" },
    { id: "boost_hint", icon: "", name: "힌트 팩 (10회)", desc: "챌린지에서 사용할 수 있는 힌트 10개", xp: 150, category: "부스터", rarity: "common" },
    { id: "ai_review", icon: "", name: "AI 코드 리뷰", desc: "AI가 코드를 심층 분석해드려요", xp: 400, category: "프리미엄", rarity: "rare" },
    { id: "mentor_pass", icon: "", name: "멘토 패스", desc: "1:1 멘토링 30분 이용권", xp: 1000, category: "프리미엄", rarity: "epic" },
    { id: "title_coder", icon: "", name: "코딩 마스터 칭호", desc: "닉네임 옆에 '코딩 마스터' 표시", xp: 2000, category: "칭호", rarity: "legendary" },
    { id: "frame_gold", icon: "", name: "황금 프로필 테두리", desc: "프로필 사진에 황금빛 테두리 적용", xp: 700, category: "꾸미기", rarity: "rare" },
    { id: "emoji_custom", icon: "", name: "커스텀 이모지 팩", desc: "채팅에서 사용할 수 있는 특별 이모지 10종", xp: 350, category: "꾸미기", rarity: "common" },
];

const RARITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    common: { bg: "#f1f5f9", color: "#64748b", label: "일반" },
    rare: { bg: "#dbeafe", color: "#2563eb", label: "레어" },
    epic: { bg: "#dbeafe", color: "#1d4ed8", label: "에픽" },
    legendary: { bg: "#fef3c7", color: "#d97706", label: "전설" },
};

const CATEGORIES = ["전체", "테마", "뱃지", "부스터", "프리미엄", "칭호", "꾸미기"];

export default function StorePage() {
    const { user } = useAuth();
    const { progress, update } = useUserProgress();
    const { purchaseIce, streak } = useStreak();
    const supabase = useMemo(() => createClient(), []);
    const [category, setCategory] = useState("전체");
    const [purchased, setPurchased] = useState<string[]>([]);
    const [buying, setBuying] = useState<string | null>(null);
    const [toast, setToast] = useState("");

    // 구매 기록 로드
    useEffect(() => {
        if (!user) return;
        supabase.from("store_purchases").select("item_id").eq("user_id", user.id)
            .then(({ data }: { data: { item_id: string }[] | null }) => {
                if (data) setPurchased(data.map((d: { item_id: string }) => d.item_id));
            });
    }, [user, supabase]);

    const filtered = category === "전체" ? STORE_ITEMS : STORE_ITEMS.filter((i) => i.category === category);

    const isRepeatableItem = (id: string) => id === "streak_ice";

    const buyItem = async (item: typeof STORE_ITEMS[0]) => {
        const repeatable = isRepeatableItem(item.id);
        if (!user || progress.xp < item.xp || (!repeatable && purchased.includes(item.id))) return;
        setBuying(item.id);

        // XP 차감 (레벨은 유지 — 상점 구매로 레벨이 내려가지 않음)
        const newXp = progress.xp - item.xp;
        const keepLevel = Math.max(calcLevel(newXp), progress.level);
        await supabase.from("user_progress").update({
            xp: newXp, level: keepLevel, updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);

        // 구매 기록
        await supabase.from("store_purchases").insert({
            user_id: user.id, item_id: item.id, item_name: item.name, xp_cost: item.xp,
        });

        // 로컬 state 동기화
        update({ xp: newXp, level: keepLevel });

        // 스트릭 아이스 특수 처리
        if (item.id === "streak_ice") {
            await purchaseIce(user.id);
        } else {
            setPurchased((prev) => [...prev, item.id]);
        }

        // 테마 즉시 적용
        if (item.id.startsWith("theme_")) {
            applyTheme(item.id);
        }
        // XP 부스터 즉시 적용 + localStorage에 저장 (새로고침 후에도 유지)
        if (item.id === "boost_2x" && typeof document !== "undefined") {
            const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24시간
            document.documentElement.setAttribute("data-xp-boost", "2");
            localStorage.setItem("codingssok_xp_boost", JSON.stringify({ multiplier: 2, expiresAt }));
        }

        const levelDrop = "";
        const extra = item.id === "streak_ice" ? ` (보유: ${streak.iceItems + 1}개)` : "";
        setToast(`${item.name} 구매 완료! -${item.xp} XP${levelDrop}${extra}`);
        setBuying(null);
        setTimeout(() => setToast(""), 4000);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 토스트 */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{
                            position: "fixed", top: 20, right: 20, zIndex: 9999,
                            padding: "14px 24px", borderRadius: 16, background: "#059669", color: "#fff",
                            fontSize: 14, fontWeight: 700, boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                        }}
                    >{toast}</motion.div>
                )}
            </AnimatePresence>

            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0 }}> XP 상점</h1>
                    <p style={{ fontSize: 13, color: "#64748b" }}>경험치로 다양한 아이템을 구매하세요!</p>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                    borderRadius: 16, background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                    color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                }}>
                    {progress.xp.toLocaleString()} XP
                </div>
            </div>

            {/* 카테고리 필터 */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CATEGORIES.map((c) => (
                    <motion.button key={c} onClick={() => setCategory(c)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{
                            padding: "8px 18px", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 700,
                            background: category === c ? "#0f172a" : "rgba(255,255,255,0.7)",
                            color: category === c ? "#fff" : "#64748b", cursor: "pointer",
                        }}
                    >{c}</motion.button>
                ))}
            </div>

            {/* 아이템 그리드 */}
            <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {filtered.map((item) => {
                    const rarity = RARITY_STYLES[item.rarity];
                    const repeatable = isRepeatableItem(item.id);
                    const owned = !repeatable && purchased.includes(item.id);
                    const canBuy = progress.xp >= item.xp && !owned;
                    return (
                        <StaggerItem key={item.id}>
                            <HoverGlow glowColor={`${rarity.color}22`}>
                                <div style={{
                                    ...glassCard, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column",
                                    position: "relative", overflow: "hidden",
                                    opacity: owned ? 0.6 : 1,
                                    borderTop: `3px solid ${rarity.color}33`,
                                }}>
                                    {/* 레어리티 뱃지 */}
                                    <motion.div
                                        animate={item.rarity === "legendary" ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{
                                            position: "absolute", top: 12, right: 12,
                                            padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800,
                                            background: rarity.bg, color: rarity.color,
                                        }}
                                    >{rarity.label}</motion.div>

                                    {/* 아이콘 */}
                                    <motion.div
                                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                        transition={{ duration: 0.4 }}
                                        style={{
                                            width: 56, height: 56, borderRadius: 16, marginBottom: 16,
                                            background: `linear-gradient(135deg, ${rarity.bg}, #fff)`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                        }}
                                    >{item.icon ? <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{item.icon}</span> : null}</motion.div>

                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{item.name}</h3>
                                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{item.desc}</p>
                                    <p style={{ fontSize: 11, color: "#94a3b8", flex: 1, marginBottom: 16 }}>
                                        {getItemEffectDescription(item.id)}
                                    </p>

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 15, fontWeight: 900, color: "#f59e0b" }}>{item.xp} XP</span>
                                        <motion.button
                                            onClick={() => buyItem(item)}
                                            disabled={!canBuy || buying === item.id}
                                            whileHover={canBuy ? { scale: 1.05 } : {}}
                                            whileTap={canBuy ? { scale: 0.95 } : {}}
                                            style={{
                                                padding: "8px 20px", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 700,
                                                background: owned ? "#10b981" : canBuy ? "linear-gradient(135deg, #0ea5e9, #3b82f6)" : "#e2e8f0",
                                                color: owned ? "#fff" : canBuy ? "#fff" : "#94a3b8",
                                                cursor: canBuy ? "pointer" : "not-allowed",
                                                boxShadow: canBuy ? "0 4px 14px rgba(14,165,233,0.3)" : "none",
                                            }}
                                        >
                                            {owned ? "✓ 보유 중" : buying === item.id ? "구매 중..." : canBuy ? (repeatable ? `구매 (${streak.iceItems}개 보유)` : "구매") : "XP 부족"}
                                        </motion.button>
                                    </div>
                                </div>
                            </HoverGlow>
                        </StaggerItem>
                    );
                })}
            </StaggerList>

            {/* 하단 안내 */}
            <div style={{
                ...glassCard, borderRadius: 20, padding: 24, textAlign: "center",
                background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(14,165,233,0.05))",
            }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}></span>
                <p style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>
                    더 많은 아이템이 곧 추가됩니다! 챌린지와 미션을 완료하면 XP를 빠르게 모을 수 있어요.
                </p>
            </div>
        </div>
    );
}
