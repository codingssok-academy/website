"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    PROBLEM_SETS,
    DIFFICULTY_COLORS,
    SOURCE_INFO,
    getTotalProblemCount,
} from "@/data/problems/external-problems";
import type { ExternalProblem } from "@/data/problems/external-problems";
import {
    BANK_PROBLEMS,
    BANK_CATEGORIES,
    DIFFICULTY_COLOR_BANK,
    DIFFICULTY_LABEL_BANK,
    getBankProblemCount,
} from "@/data/problem-bank";
import type { BankProblem } from "@/data/problem-bank";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

/* ── Styles ── */
const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    border: "1px solid rgba(226,232,240,0.5)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
};

/* ── localStorage helpers (external OJ) ── */
const EXT_STORAGE_KEY = "codingssok_solved_problems";
const BANK_STORAGE_KEY = "codingssok_bank_solved";

function loadExtSolved(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(EXT_STORAGE_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}
function saveExtSolved(s: Set<string>) {
    localStorage.setItem(EXT_STORAGE_KEY, JSON.stringify([...s]));
}
function loadBankSolved(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(BANK_STORAGE_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}
function saveBankSolved(s: Set<string>) {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify([...s]));
}

/* ── Supabase helpers ── */
async function loadExtSolvedFromSupabase(userId: string): Promise<Set<string>> {
    try {
        const supabase = createClient();
        const { data } = await supabase
            .from("study_progress")
            .select("problem_id")
            .eq("user_id", userId)
            .eq("type", "problem_solved");
        if (data) return new Set(data.map((r: { problem_id: string }) => r.problem_id));
    } catch { /* ignore */ }
    return new Set();
}
async function syncExtToSupabase(userId: string, problemId: string, isSolved: boolean) {
    try {
        const supabase = createClient();
        if (isSolved) {
            await supabase.from("study_progress").upsert(
                { user_id: userId, problem_id: problemId, type: "problem_solved", completed_at: new Date().toISOString() },
                { onConflict: "user_id,problem_id" },
            );
        } else {
            await supabase.from("study_progress")
                .delete()
                .eq("user_id", userId)
                .eq("problem_id", problemId)
                .eq("type", "problem_solved");
        }
    } catch { /* ignore */ }
}
async function loadBankSolvedFromSupabase(userId: string): Promise<Set<string>> {
    try {
        const supabase = createClient();
        const { data } = await supabase
            .from("code_submissions")
            .select("problem_id")
            .eq("user_id", userId)
            .eq("result", "정답")
            .like("problem_id", "pb-%");
        if (data) return new Set(data.map((r: { problem_id: string }) => r.problem_id));
    } catch { /* ignore */ }
    return new Set();
}

/* ── Tab type ── */
type Tab = "bank" | "external" | "koi" | "challenges" | "codegolf";

const TABS: { id: Tab; label: string; icon: string; count: number; color: string }[] = [
    { id: "bank", label: "자체 문제", icon: "emoji_events", count: getBankProblemCount(), color: "#6366f1" },
    { id: "external", label: "외부 OJ", icon: "link", count: getTotalProblemCount(), color: "#3b82f6" },
    { id: "koi", label: "KOI", icon: "military_tech", count: 8, color: "#dc2626" },
    { id: "challenges", label: "챌린지", icon: "bolt", count: 7, color: "#f59e0b" },
    { id: "codegolf", label: "코드골프", icon: "golf_course", count: 8, color: "#10b981" },
];

const TOTAL_PROBLEMS = getBankProblemCount() + getTotalProblemCount() + 8 + 7 + 8;

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
export default function ProblemHubPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("bank");

    /* External OJ solved state */
    const [extSolved, setExtSolved] = useState<Set<string>>(() => loadExtSolved());
    const extSyncedRef = useRef(false);

    /* Bank solved state */
    const [bankSolved, setBankSolved] = useState<Set<string>>(() => loadBankSolved());
    const bankSyncedRef = useRef(false);

    /* Sync external OJ from Supabase */
    useEffect(() => {
        if (!user?.id || extSyncedRef.current) return;
        extSyncedRef.current = true;
        (async () => {
            const remote = await loadExtSolvedFromSupabase(user.id);
            if (remote.size === 0) return;
            setExtSolved(prev => {
                const merged = new Set([...prev, ...remote]);
                saveExtSolved(merged);
                for (const id of prev) {
                    if (!remote.has(id)) syncExtToSupabase(user.id, id, true);
                }
                return merged;
            });
        })();
    }, [user?.id]);

    /* Sync bank from Supabase */
    useEffect(() => {
        if (!user?.id || bankSyncedRef.current) return;
        bankSyncedRef.current = true;
        (async () => {
            const remote = await loadBankSolvedFromSupabase(user.id);
            if (remote.size === 0) return;
            setBankSolved(prev => {
                const merged = new Set([...prev, ...remote]);
                saveBankSolved(merged);
                return merged;
            });
        })();
    }, [user?.id]);

    const totalSolved = extSolved.size + bankSolved.size;

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <Link href="/dashboard/learning" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none" }}>
                    &larr; 학습
                </Link>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 8, letterSpacing: -0.5 }}>
                    문제 허브
                </h1>
                <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                    자체 문제 · 외부 OJ · KOI · 챌린지 · 코드골프 통합 <strong>{TOTAL_PROBLEMS}개</strong> 문제
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
                <StatCard icon="quiz" label="총 문제" value={TOTAL_PROBLEMS.toLocaleString()} color="#3b82f6" />
                <StatCard icon="check_circle" label="풀이 완료" value={totalSolved.toString()} color="#22c55e" />
                <StatCard
                    icon="percent"
                    label="정답률"
                    value={TOTAL_PROBLEMS > 0 ? `${Math.round((totalSolved / TOTAL_PROBLEMS) * 100)}%` : "0%"}
                    color="#f59e0b"
                />
                <StatCard icon="emoji_events" label="자체 풀이" value={bankSolved.size.toString()} color="#6366f1" />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                {TABS.map(tab => (
                    <motion.button
                        key={tab.id}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "9px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                            background: activeTab === tab.id ? tab.color : "rgba(241,245,249,0.8)",
                            color: activeTab === tab.id ? "#fff" : "#64748b",
                            fontSize: 13, fontWeight: 700,
                            boxShadow: activeTab === tab.id ? `0 4px 14px ${tab.color}40` : "none",
                            transition: "all 0.2s",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
                        {tab.label}
                        <span style={{
                            fontSize: 10, padding: "1px 6px", borderRadius: 6,
                            background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                            color: activeTab === tab.id ? "#fff" : "#94a3b8",
                            fontWeight: 800,
                        }}>{tab.count}</span>
                    </motion.button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                >
                    {activeTab === "bank" && (
                        <BankTab bankSolved={bankSolved} setBankSolved={setBankSolved} />
                    )}
                    {activeTab === "external" && (
                        <ExternalTab extSolved={extSolved} setExtSolved={setExtSolved} userId={user?.id} />
                    )}
                    {activeTab === "koi" && <RedirectTab href="/dashboard/learning/courses/12" label="정보올림피아드 대회 학습 카드" color="#1e40af" icon="emoji_events" desc="정보올림피아드 대회 학습 카드 410장. 책 페이지처럼 넘기며 알고리즘·실전 대비." />}
                    {activeTab === "challenges" && <RedirectTab href="/dashboard/learning/challenges" label="챌린지 페이지로 이동" color="#f59e0b" icon="bolt" desc="단계별 C언어 챌린지 7문제에 도전하세요. XP를 획득합니다." />}
                    {activeTab === "codegolf" && <RedirectTab href="/dashboard/learning/codegolf" label="코드골프 페이지로 이동" color="#10b981" icon="golf_course" desc="가장 짧은 코드로 문제를 풀어보세요! 리더보드에 도전하세요." />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div style={{
            ...glassCard, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 10,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
            </div>
            <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{value}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
            </div>
        </div>
    );
}

/* ── Redirect Tab ── */
function RedirectTab({ href, label, color, icon, desc }: { href: string; label: string; color: string; icon: string; desc: string }) {
    return (
        <div style={{ ...glassCard, padding: "40px 32px", textAlign: "center" }}>
            <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color }}>{icon}</span>
            </div>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>{desc}</p>
            <Link href={href} style={{ textDecoration: "none" }}>
                <motion.button
                    whileHover={{ scale: 1.03, boxShadow: `0 8px 24px ${color}30` }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        padding: "12px 28px", borderRadius: 14, border: "none", cursor: "pointer",
                        background: color, color: "#fff", fontSize: 14, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 8,
                    }}
                >
                    {label}
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </motion.button>
            </Link>
        </div>
    );
}

/* ══════════════════════════════════════════
   Bank Tab (inline — 자체 문제)
══════════════════════════════════════════ */
function BankTab({
    bankSolved,
    setBankSolved,
}: {
    bankSolved: Set<string>;
    setBankSolved: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [diffFilter, setDiffFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [showSolvedOnly, setShowSolvedOnly] = useState(false);

    const totalCount = getBankProblemCount();

    const filteredProblems = useMemo(() => {
        let probs: BankProblem[] = activeCategory
            ? BANK_PROBLEMS.filter(p => p.category === activeCategory)
            : BANK_PROBLEMS;
        if (diffFilter !== "all") probs = probs.filter(p => p.difficulty === diffFilter);
        if (showSolvedOnly) probs = probs.filter(p => bankSolved.has(p.id));
        if (search.trim()) {
            const q = search.toLowerCase();
            probs = probs.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.tags.some(t => t.includes(q)) ||
                p.category.includes(q)
            );
        }
        return probs;
    }, [activeCategory, diffFilter, search, showSolvedOnly, bankSolved]);

    const totalInView = activeCategory
        ? BANK_PROBLEMS.filter(p => p.category === activeCategory).length
        : totalCount;
    const progressPct = totalCount > 0 ? Math.round((bankSolved.size / totalCount) * 100) : 0;
    const solvedInView = filteredProblems.filter(p => bankSolved.has(p.id)).length;

    const catInfo = BANK_CATEGORIES.find(c => c.id === activeCategory) || null;

    return (
        <div>
            {/* Progress */}
            <div style={{ ...glassCard, padding: "14px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        전체 진행률
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#6366f1" }}>
                        {bankSolved.size}/{totalCount} ({progressPct}%)
                    </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                    />
                </div>
            </div>

            {/* Category grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 8, marginBottom: 16 }}>
                <motion.button
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveCategory(null)}
                    style={{
                        ...glassCard, padding: "11px 12px",
                        border: activeCategory === null ? "2px solid #6366f1" : "1px solid rgba(226,232,240,0.5)",
                        cursor: "pointer", textAlign: "left",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#6366f1" }}>apps</span>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>전체</div>
                            <div style={{ fontSize: 9, color: "#94a3b8" }}>{bankSolved.size}/{totalCount}</div>
                        </div>
                    </div>
                </motion.button>
                {BANK_CATEGORIES.map(cat => {
                    const catProbs = BANK_PROBLEMS.filter(p => p.category === cat.id);
                    const catSolved = catProbs.filter(p => bankSolved.has(p.id)).length;
                    return (
                        <motion.button
                            key={cat.id}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                ...glassCard, padding: "11px 12px",
                                border: activeCategory === cat.id ? `2px solid ${cat.color}` : "1px solid rgba(226,232,240,0.5)",
                                cursor: "pointer", textAlign: "left",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: cat.color }}>{cat.icon}</span>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{cat.title}</div>
                                    <div style={{ fontSize: 9, color: "#94a3b8" }}>{catSolved}/{catProbs.length}</div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ ...glassCard, padding: "10px 14px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="문제 검색..."
                    style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, outline: "none", flex: "1 1 160px", minWidth: 120 }}
                />
                <div style={{ display: "flex", gap: 3 }}>
                    {(["all", "bronze", "silver", "gold", "platinum"] as const).map(d => (
                        <button key={d} onClick={() => setDiffFilter(d)} style={{
                            padding: "5px 8px", borderRadius: 7, border: "none", cursor: "pointer",
                            background: diffFilter === d ? (d === "all" ? "#6366f1" : DIFFICULTY_COLOR_BANK[d]) : "#f1f5f9",
                            color: diffFilter === d ? "#fff" : "#64748b", fontSize: 10, fontWeight: 600,
                        }}>
                            {d === "all" ? "전체" : DIFFICULTY_LABEL_BANK[d]}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowSolvedOnly(!showSolvedOnly)} style={{
                    padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                    background: showSolvedOnly ? "#22c55e" : "#f1f5f9",
                    color: showSolvedOnly ? "#fff" : "#64748b", fontSize: 10, fontWeight: 600,
                }}>
                    {showSolvedOnly ? "풀이 완료만" : "전체 보기"}
                </button>
            </div>

            {/* Count */}
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>
                {filteredProblems.length}개 문제{catInfo ? ` (${catInfo.title})` : ""}
                {solvedInView > 0 && <span style={{ color: "#22c55e", marginLeft: 8 }}>{solvedInView}개 해결</span>}
            </div>

            {/* Problem list */}
            <AnimatePresence mode="popLayout">
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {filteredProblems.map((p, i) => {
                        const isSolved = bankSolved.has(p.id);
                        const cat = BANK_CATEGORIES.find(c => c.id === p.category);
                        const diffColor = DIFFICULTY_COLOR_BANK[p.difficulty];
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.2 }}
                                style={{
                                    ...glassCard, padding: "12px 16px",
                                    display: "flex", alignItems: "center", gap: 12,
                                    borderLeft: isSolved ? "3px solid #22c55e" : "3px solid transparent",
                                    opacity: isSolved ? 0.7 : 1,
                                }}
                            >
                                {/* Solved indicator */}
                                <div style={{
                                    width: 22, height: 22, borderRadius: 6,
                                    border: isSolved ? "none" : "2px solid #cbd5e1",
                                    background: isSolved ? "#22c55e" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    {isSolved && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>}
                                </div>

                                {/* Category badge */}
                                {cat && (
                                    <span style={{
                                        fontSize: 8, padding: "2px 6px", borderRadius: 5, fontWeight: 700,
                                        background: `${cat.color}15`, color: cat.color, whiteSpace: "nowrap",
                                    }}>
                                        {cat.title}
                                    </span>
                                )}

                                {/* Title & tags */}
                                <Link
                                    href={`/dashboard/learning/problems/bank/${p.id}`}
                                    style={{ flex: 1, minWidth: 0, textDecoration: isSolved ? "line-through" : "none", textDecorationColor: "#94a3b8" }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: isSolved ? "#94a3b8" : "#0f172a" }}>{p.title}</div>
                                    <div style={{ display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                                        {p.tags.slice(0, 3).map(t => (
                                            <span key={t} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9", color: "#64748b" }}>{t}</span>
                                        ))}
                                    </div>
                                </Link>

                                {/* XP */}
                                <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, whiteSpace: "nowrap" }}>+{p.xp} XP</span>

                                {/* Difficulty */}
                                <span style={{
                                    fontSize: 8, padding: "2px 8px", borderRadius: 5, fontWeight: 700,
                                    background: `${diffColor}18`, color: diffColor, whiteSpace: "nowrap",
                                }}>
                                    {DIFFICULTY_LABEL_BANK[p.difficulty]}
                                </span>

                                {/* Solve link */}
                                <Link href={`/dashboard/learning/problems/bank/${p.id}`} style={{ flexShrink: 0 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#cbd5e1" }}>chevron_right</span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </AnimatePresence>

            {filteredProblems.length === 0 && (
                <div style={{ ...glassCard, padding: 48, textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1" }}>search_off</span>
                    <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 12 }}>검색 결과가 없습니다</p>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════
   External OJ Tab
══════════════════════════════════════════ */
function ExternalTab({
    extSolved,
    setExtSolved,
    userId,
}: {
    extSolved: Set<string>;
    setExtSolved: React.Dispatch<React.SetStateAction<Set<string>>>;
    userId?: string;
}) {
    const [activeSet, setActiveSet] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [diffFilter, setDiffFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [showSolvedOnly, setShowSolvedOnly] = useState(false);
    const totalCount = getTotalProblemCount();

    const toggleSolved = useCallback((id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExtSolved(prev => {
            const next = new Set(prev);
            const nowSolved = !next.has(id);
            if (next.has(id)) next.delete(id); else next.add(id);
            saveExtSolved(next);
            if (userId) syncExtToSupabase(userId, id, nowSolved);
            return next;
        });
    }, [userId, setExtSolved]);

    const currentSet = useMemo(() => activeSet ? PROBLEM_SETS.find(s => s.id === activeSet) : null, [activeSet]);

    const filteredProblems = useMemo(() => {
        let probs: ExternalProblem[] = currentSet?.problems ?? PROBLEM_SETS.flatMap(s => s.problems);
        if (sourceFilter !== "all") probs = probs.filter(p => p.source === sourceFilter);
        if (diffFilter !== "all") probs = probs.filter(p => p.difficulty === diffFilter);
        if (showSolvedOnly) probs = probs.filter(p => extSolved.has(p.id));
        if (search.trim()) {
            const q = search.toLowerCase();
            probs = probs.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.tags.some(t => t.includes(q)) ||
                p.category.includes(q)
            );
        }
        return probs;
    }, [currentSet, sourceFilter, diffFilter, search, showSolvedOnly, extSolved]);

    const solvedInSet = currentSet
        ? currentSet.problems.filter(p => extSolved.has(p.id)).length
        : extSolved.size;
    const totalInSet = currentSet ? currentSet.problems.length : totalCount;
    const progressPct = totalInSet > 0 ? Math.round((solvedInSet / totalInSet) * 100) : 0;

    return (
        <div>
            {/* Progress Bar */}
            <div style={{ ...glassCard, padding: "14px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        진행률 {currentSet ? `(${currentSet.title})` : ""}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#3b82f6" }}>
                        {solvedInSet}/{totalInSet} ({progressPct}%)
                    </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #3b82f6, #2563eb)" }}
                    />
                </div>
            </div>

            {/* Category Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 16 }}>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveSet(null)}
                    style={{
                        ...glassCard, padding: "11px 12px",
                        border: activeSet === null ? "2px solid #3b82f6" : "1px solid rgba(226,232,240,0.5)",
                        cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#3b82f6" }}>grid_view</span>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>전체</div>
                            <div style={{ fontSize: 9, color: "#94a3b8" }}>{extSolved.size}/{totalCount}</div>
                        </div>
                    </div>
                </motion.button>
                {PROBLEM_SETS.map(set => {
                    const setSolved = set.problems.filter(p => extSolved.has(p.id)).length;
                    return (
                        <motion.button key={set.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveSet(set.id)}
                            style={{
                                ...glassCard, padding: "11px 12px",
                                border: activeSet === set.id ? `2px solid ${set.color}` : "1px solid rgba(226,232,240,0.5)",
                                cursor: "pointer", textAlign: "left",
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: set.color }}>{set.icon}</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{set.title}</div>
                                    <div style={{ fontSize: 9, color: "#94a3b8" }}>{setSolved}/{set.problems.length}</div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ ...glassCard, padding: "10px 14px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="문제 검색..."
                    style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, outline: "none", flex: "1 1 160px", minWidth: 120 }}
                />
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {["all", "baekjoon", "programmers", "koistudy", "codeup"].map(s => (
                        <button key={s} onClick={() => setSourceFilter(s)} style={{
                            padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                            background: sourceFilter === s ? (s === "all" ? "#3b82f6" : SOURCE_INFO[s]?.color || "#3b82f6") : "#f1f5f9",
                            color: sourceFilter === s ? "#fff" : "#64748b", fontSize: 10, fontWeight: 600,
                        }}>{s === "all" ? "전체" : SOURCE_INFO[s]?.label || s}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                    {["all", "bronze", "silver", "gold", "platinum"].map(d => (
                        <button key={d} onClick={() => setDiffFilter(d)} style={{
                            padding: "5px 8px", borderRadius: 7, border: "none", cursor: "pointer",
                            background: diffFilter === d ? (d === "all" ? "#3b82f6" : DIFFICULTY_COLORS[d]?.text || "#3b82f6") : "#f1f5f9",
                            color: diffFilter === d ? "#fff" : "#64748b", fontSize: 10, fontWeight: 600,
                        }}>{d === "all" ? "전체" : DIFFICULTY_COLORS[d]?.label || d}</button>
                    ))}
                </div>
                <button onClick={() => setShowSolvedOnly(!showSolvedOnly)} style={{
                    padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                    background: showSolvedOnly ? "#22c55e" : "#f1f5f9",
                    color: showSolvedOnly ? "#fff" : "#64748b", fontSize: 10, fontWeight: 600,
                }}>{showSolvedOnly ? "풀이 완료만" : "전체 보기"}</button>
            </div>

            {/* Results Count */}
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>
                {filteredProblems.length}개 문제 {currentSet ? `(${currentSet.title})` : ""}
            </div>

            {/* Problem List */}
            <AnimatePresence mode="popLayout">
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {filteredProblems.map((p, i) => {
                        const diff = DIFFICULTY_COLORS[p.difficulty];
                        const src = SOURCE_INFO[p.source];
                        const isSolved = extSolved.has(p.id);
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.2 }}
                                style={{
                                    ...glassCard, padding: "12px 16px",
                                    display: "flex", alignItems: "center", gap: 12,
                                    borderLeft: isSolved ? "3px solid #22c55e" : "3px solid transparent",
                                    opacity: isSolved ? 0.7 : 1,
                                }}
                            >
                                {/* Solve Checkbox */}
                                <motion.button
                                    whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                                    onClick={(e) => toggleSolved(p.id, e)}
                                    style={{
                                        width: 22, height: 22, borderRadius: 6,
                                        border: isSolved ? "none" : "2px solid #cbd5e1",
                                        background: isSolved ? "#22c55e" : "transparent",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {isSolved && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>}
                                </motion.button>

                                {/* Source Badge */}
                                <span style={{
                                    fontSize: 8, padding: "2px 6px", borderRadius: 5, fontWeight: 700,
                                    background: `${src.color}15`, color: src.color, whiteSpace: "nowrap",
                                }}>{src.label}</span>

                                {/* Title & Tags */}
                                <a href={p.url} target="_blank" rel="noopener noreferrer"
                                    style={{ flex: 1, minWidth: 0, textDecoration: isSolved ? "line-through" : "none", textDecorationColor: "#94a3b8" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: isSolved ? "#94a3b8" : "#0f172a" }}>{p.title}</div>
                                    <div style={{ display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                                        {p.tags.slice(0, 3).map(t => (
                                            <span key={t} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9", color: "#64748b" }}>{t}</span>
                                        ))}
                                    </div>
                                </a>

                                {/* Difficulty */}
                                <span style={{
                                    fontSize: 8, padding: "2px 8px", borderRadius: 5, fontWeight: 700,
                                    background: diff.bg, color: diff.text, whiteSpace: "nowrap",
                                }}>{diff.label}</span>

                                {/* External Link */}
                                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#cbd5e1" }}>open_in_new</span>
                                </a>
                            </motion.div>
                        );
                    })}
                </div>
            </AnimatePresence>

            {filteredProblems.length === 0 && (
                <div style={{ ...glassCard, padding: 48, textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1" }}>search_off</span>
                    <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 12 }}>검색 결과가 없습니다</p>
                </div>
            )}
        </div>
    );
}
