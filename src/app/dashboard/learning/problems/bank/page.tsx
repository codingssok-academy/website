"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
import { recommendProblems } from "@/lib/difficulty-recommender";

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.8)",
  backdropFilter: "blur(20px)",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.5)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
};

const STORAGE_KEY = "codingssok_bank_solved";

function loadSolved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSolved(solved: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...solved]));
}

async function loadSolvedFromSupabase(userId: string): Promise<Set<string>> {
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

export default function ProblemBankPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [solved, setSolved] = useState<Set<string>>(() => loadSolved());
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);
  const [recommendedProblems, setRecommendedProblems] = useState<BankProblem[]>([]);
  const syncedRef = useRef(false);
  const totalCount = getBankProblemCount();

  useEffect(() => {
    if (!user?.id || syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      const remote = await loadSolvedFromSupabase(user.id);
      if (remote.size === 0) return;
      setSolved(prev => {
        const merged = new Set([...prev, ...remote]);
        saveSolved(merged);
        return merged;
      });
    })();
  }, [user?.id]);

  // 추천 문제 계산 — solved가 바뀔 때마다 갱신
  useEffect(() => {
    const solvedIds = [...solved];
    const recs = recommendProblems(solvedIds, BANK_PROBLEMS, 5);
    setRecommendedProblems(recs);
  }, [solved]);

  const catInfo = useMemo(() => {
    return BANK_CATEGORIES.find(c => c.id === activeCategory) || null;
  }, [activeCategory]);

  const filteredProblems = useMemo(() => {
    let probs: BankProblem[] = activeCategory
      ? BANK_PROBLEMS.filter(p => p.category === activeCategory)
      : BANK_PROBLEMS;
    if (diffFilter !== "all") probs = probs.filter(p => p.difficulty === diffFilter);
    if (showSolvedOnly) probs = probs.filter(p => solved.has(p.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      probs = probs.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q)) ||
        p.category.includes(q)
      );
    }
    return probs;
  }, [activeCategory, diffFilter, search, showSolvedOnly, solved]);

  const solvedInView = filteredProblems.filter(p => solved.has(p.id)).length;
  const totalInView = activeCategory
    ? BANK_PROBLEMS.filter(p => p.category === activeCategory).length
    : totalCount;
  const progressPct = totalInView > 0 ? Math.round((solved.size / totalCount) * 100) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/learning/problems" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none" }}>
          &larr; 문제 은행
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 8, letterSpacing: -0.5 }}>
          코딩쏙 자체 문제은행
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
          자체 제작 <strong>{totalCount}개</strong> 문제 — 브라우저에서 바로 코드 작성 &amp; 채점
        </p>
      </div>

      {/* Progress */}
      <div style={{ ...glassCard, padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>전체 진행률</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#3b82f6" }}>
            {solved.size}/{totalCount} ({progressPct}%)
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

      {/* 추천 문제 섹션 */}
      {recommendedProblems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>push_pin</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>추천 문제</span>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>풀이 기록 기반 맞춤 추천</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recommendedProblems.map((p) => {
              const cat = BANK_CATEGORIES.find(c => c.id === p.category);
              const diffColor = DIFFICULTY_COLOR_BANK[p.difficulty];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    ...glassCard,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderLeft: "3px solid #6366f1",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(255,255,255,0.8) 100%)",
                  }}
                >
                  {cat && (
                    <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: `${cat.color}15`, color: cat.color, whiteSpace: "nowrap" }}>
                      {cat.title}
                    </span>
                  )}
                  <Link
                    href={`/dashboard/learning/problems/bank/${p.id}`}
                    style={{ flex: 1, minWidth: 0, textDecoration: "none" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.title}</div>
                    <div style={{ display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                      {p.tags.slice(0, 3).map(t => (
                        <span key={t} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9", color: "#64748b" }}>{t}</span>
                      ))}
                    </div>
                  </Link>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: diffColor }}>
                      {DIFFICULTY_LABEL_BANK[p.difficulty]}
                    </span>
                    <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700 }}>+{p.xp} XP</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 20 }}>
        <motion.button
          whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={() => setActiveCategory(null)}
          style={{ ...glassCard, padding: "12px 14px", border: activeCategory === null ? "2px solid #6366f1" : "1px solid rgba(226,232,240,0.5)", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#6366f1" }}>apps</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>전체</div>
              <div style={{ fontSize: 9, color: "#94a3b8" }}>{solved.size}/{totalCount}</div>
            </div>
          </div>
        </motion.button>
        {BANK_CATEGORIES.map(cat => {
          const catProbs = BANK_PROBLEMS.filter(p => p.category === cat.id);
          const catSolved = catProbs.filter(p => solved.has(p.id)).length;
          return (
            <motion.button
              key={cat.id}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveCategory(cat.id)}
              style={{ ...glassCard, padding: "12px 14px", border: activeCategory === cat.id ? `2px solid ${cat.color}` : "1px solid rgba(226,232,240,0.5)", cursor: "pointer", textAlign: "left" }}
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
      <div style={{ ...glassCard, padding: "10px 14px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="문제 검색..."
          style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, outline: "none", flex: "1 1 180px", minWidth: 140 }}
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
            const isSolved = solved.has(p.id);
            const cat = BANK_CATEGORIES.find(c => c.id === p.category);
            const diffColor = DIFFICULTY_COLOR_BANK[p.difficulty];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.2 }}
                style={{ ...glassCard, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderLeft: isSolved ? "3px solid #22c55e" : "3px solid transparent", opacity: isSolved ? 0.7 : 1 }}
              >
                {/* Solved indicator */}
                <div style={{ width: 22, height: 22, borderRadius: 6, border: isSolved ? "none" : "2px solid #cbd5e1", background: isSolved ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSolved && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>}
                </div>

                {/* Category badge */}
                {cat && (
                  <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 5, fontWeight: 700, background: `${cat.color}15`, color: cat.color, whiteSpace: "nowrap" }}>
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
                <span style={{ fontSize: 8, padding: "2px 8px", borderRadius: 5, fontWeight: 700, background: `${diffColor}18`, color: diffColor, whiteSpace: "nowrap" }}>
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
