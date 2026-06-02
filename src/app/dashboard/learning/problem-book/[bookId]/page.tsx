"use client";

import { useState, useMemo, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { C_PROBLEM_BOOK } from "@/data/problems/c-problem-book";
import { PY_PROBLEM_BOOK } from "@/data/problems/py-problem-book";
import { PROBLEM_DIFFICULTY_META } from "@/data/problems/types";
import type { ProblemBook, ProblemLevel, Problem } from "@/data/problems/types";

/* ── 책 레지스트리 ── */
const BOOK_MAP: Record<string, ProblemBook> = {
  "c-problems": C_PROBLEM_BOOK,
  "py-problems": PY_PROBLEM_BOOK,
};

const BOOK_COLOR: Record<string, string> = {
  "c-problems": "#3b82f6",
  "py-problems": "#10b981",
};

type DifficultyFilter = 0 | 1 | 2 | 3 | 4 | 5;

/* ── 난이도 배지 ── */
function DiffBadge({ difficulty }: { difficulty: 1 | 2 | 3 | 4 | 5 }) {
  const meta = PROBLEM_DIFFICULTY_META[difficulty];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      color: meta.color, background: meta.bg,
      border: `1px solid ${meta.color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      {meta.label}
    </span>
  );
}

/* ── 문제 카드 ── */
function ProblemCard({ problem, bookId, solved }: { problem: Problem; bookId: string; solved: boolean }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      onClick={() => router.push(`/dashboard/learning/problem-book/${bookId}/${problem.id}`)}
      style={{
        padding: "14px 16px",
        background: "#fff",
        borderRadius: 12,
        border: solved ? "1px solid rgba(34,197,94,0.3)" : "1px solid #e2e8f0",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        position: "relative",
      }}
    >
      {/* 풀었음 표시 */}
      {solved && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 22, height: 22, borderRadius: "50%",
          background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#fff" }}>check</span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <DiffBadge difficulty={problem.difficulty} />
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
          {problem.id.split("-").pop()?.padStart(3, "0")}
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8, paddingRight: solved ? 28 : 0 }}>
        {problem.title}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {problem.tags.slice(0, 4).map((tag) => (
          <span key={tag} style={{
            fontSize: 10, fontWeight: 600,
            padding: "1px 6px", borderRadius: 4,
            background: "#f1f5f9", color: "#64748b",
          }}>
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ── 레벨 사이드바 아이템 ── */
function LevelItem({
  level,
  active,
  bookColor,
  solvedCount,
  onClick,
}: {
  level: ProblemLevel;
  active: boolean;
  bookColor: string;
  solvedCount: number;
  onClick: () => void;
}) {
  const total = level.problems.length;
  const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: active ? `1px solid ${bookColor}30` : "1px solid transparent",
        background: active
          ? `linear-gradient(135deg, ${bookColor}12, ${bookColor}06)`
          : "transparent",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: total > 0 ? 8 : 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: active ? `${bookColor}18` : "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: active ? bookColor : "#94a3b8" }}>
            {level.icon}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: active ? 700 : 500,
            color: active ? "#0f172a" : "#475569",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {level.title}
          </div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {solvedCount}/{total}문제
            </div>
          )}
          {total === 0 && (
            <div style={{ fontSize: 11, color: "#cbd5e1" }}>준비중</div>
          )}
        </div>
        {active && (
          <motion.div
            layoutId="level-dot"
            style={{ width: 6, height: 6, borderRadius: "50%", background: bookColor, flexShrink: 0 }}
          />
        )}
      </div>

      {total > 0 && (
        <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: "100%", background: bookColor, borderRadius: 99 }}
          />
        </div>
      )}
    </button>
  );
}

/* ── 메인 페이지 내부 (params 언래핑 후) ── */
function BookLevelPageInner({ bookId }: { bookId: string }) {
  const book = BOOK_MAP[bookId];
  const bookColor = BOOK_COLOR[bookId] ?? "#3b82f6";

  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    book?.levels[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>(0);

  // 풀었는지 여부 (로컬스토리지 기반)
  const [solved] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(`solved:${bookId}`);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  if (!book) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        문제집을 찾을 수 없습니다.{" "}
        <Link href="/dashboard/learning/courses/6" style={{ color: "#3b82f6" }}>
          프로그래밍 대회 코스로 돌아가기
        </Link>
      </div>
    );
  }

  const selectedLevel = book.levels.find((l) => l.id === selectedLevelId);

  const filteredProblems = useMemo(() => {
    if (!selectedLevel) return [];
    let list = selectedLevel.problems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (diffFilter !== 0) {
      list = list.filter((p) => p.difficulty === diffFilter);
    }
    return list;
  }, [selectedLevel, search, diffFilter]);

  const totalSolved = book.levels.reduce((acc, l) => {
    return acc + l.problems.filter((p) => solved.has(p.id)).length;
  }, 0);
  const totalProblems = book.levels.reduce((acc, l) => acc + l.problems.length, 0);

  return (
    <div style={{ padding: "24px 20px 60px", maxWidth: 1100, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/learning/courses/6"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: "#94a3b8",
            textDecoration: "none", marginBottom: 12,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
          프로그래밍 대회로
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              {book.title}
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {totalSolved}/{totalProblems}문제 완료
            </p>
          </div>

          {/* 진행 바 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 120, height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0}%` }}
                style={{ height: "100%", background: bookColor, borderRadius: 99 }}
              />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: bookColor }}>
              {totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 본문 2단 */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>

        {/* 왼쪽: 레벨 목록 */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 12,
          position: "sticky",
          top: 90,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", padding: "4px 6px 8px", textTransform: "uppercase", letterSpacing: 1 }}>
            단계
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {book.levels.map((level) => (
              <LevelItem
                key={level.id}
                level={level}
                active={level.id === selectedLevelId}
                bookColor={bookColor}
                solvedCount={level.problems.filter((p) => solved.has(p.id)).length}
                onClick={() => setSelectedLevelId(level.id)}
              />
            ))}
          </nav>
        </div>

        {/* 오른쪽: 문제 목록 */}
        <div>
          {/* 레벨 정보 */}
          {selectedLevel && (
            <motion.div
              key={selectedLevel.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: `linear-gradient(135deg, ${selectedLevel.color}10, ${selectedLevel.color}05)`,
                border: `1px solid ${selectedLevel.color}25`,
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${selectedLevel.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: selectedLevel.color }}>
                  {selectedLevel.icon}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  {selectedLevel.title}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {selectedLevel.description}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: selectedLevel.color }}>
                  {selectedLevel.problems.length}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>문제</div>
              </div>
            </motion.div>
          )}

          {/* 필터 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {/* 검색 */}
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <span className="material-symbols-outlined" style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: 16, color: "#94a3b8", pointerEvents: "none",
              }}>search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="문제 제목, 태그 검색..."
                style={{
                  width: "100%", paddingLeft: 34, paddingRight: 12,
                  paddingTop: 8, paddingBottom: 8,
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  fontSize: 13, color: "#0f172a", outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 난이도 필터 */}
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setDiffFilter(0)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: diffFilter === 0 ? `1px solid ${bookColor}` : "1px solid #e2e8f0",
                  background: diffFilter === 0 ? `${bookColor}12` : "#fff",
                  color: diffFilter === 0 ? bookColor : "#64748b",
                  cursor: "pointer",
                }}
              >
                전체
              </button>
              {([1, 2, 3, 4, 5] as const).map((d) => {
                const m = PROBLEM_DIFFICULTY_META[d];
                return (
                  <button
                    key={d}
                    onClick={() => setDiffFilter(diffFilter === d ? 0 : d)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: diffFilter === d ? `1px solid ${m.color}` : "1px solid #e2e8f0",
                      background: diffFilter === d ? m.bg : "#fff",
                      color: diffFilter === d ? m.color : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 문제 없음 */}
          {selectedLevel && selectedLevel.problems.length === 0 && (
            <div style={{
              padding: "60px 20px", textAlign: "center",
              background: "#f8fafc", borderRadius: 14, border: "1px dashed #e2e8f0",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#cbd5e1", display: "block", marginBottom: 12 }}>
                construction
              </span>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>문제 준비 중입니다</div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>곧 추가될 예정이에요!</div>
            </div>
          )}

          {/* 문제 그리드 */}
          <AnimatePresence mode="wait">
            {filteredProblems.length > 0 ? (
              <motion.div
                key={selectedLevelId + search + diffFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 10,
                }}
              >
                {filteredProblems.map((problem, i) => (
                  <motion.div
                    key={problem.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ProblemCard
                      problem={problem}
                      bookId={bookId}
                      solved={solved.has(problem.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              selectedLevel && selectedLevel.problems.length > 0 && (
                <div style={{
                  padding: "40px 20px", textAlign: "center",
                  background: "#f8fafc", borderRadius: 14,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#cbd5e1", display: "block", marginBottom: 8 }}>
                    search_off
                  </span>
                  <div style={{ fontSize: 14, color: "#94a3b8" }}>검색 결과가 없습니다</div>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── 외부 export: params Promise 언래핑 + Suspense 래핑 ── */
function BookLevelPageLoader({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  return <BookLevelPageInner bookId={bookId} />;
}

export default function BookLevelPage({ params }: { params: Promise<{ bookId: string }> }) {
  return (
    <Suspense fallback={
      <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 12 }}>
          hourglass_top
        </span>
        문제집 불러오는 중...
      </div>
    }>
      <BookLevelPageLoader params={params} />
    </Suspense>
  );
}
