"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

/* ════════════════════════════════════════════════
   선생님 학습 분석 대시보드
   /dashboard/learning/analytics
   ════════════════════════════════════════════════ */

/* ── Types ── */
interface CategoryStat {
    category: string;
    total: number;
    correct: number;
    rate: number;
}

interface WeeklyPoint {
    date: string;
    label: string;
    count: number;
}

interface XpTrendPoint {
    date: string;
    cumulative: number;
}

interface RecentSubmission {
    problem_id: string;
    is_correct: boolean;
    created_at: string;
}

interface StudentData {
    id: string;
    auth_user_id: string | null;
    name: string;
    grade: string | null;
    class: string | null;
    level: number;
    xp: number;
    streak: number;
    weekCount: number;
    lastAccess: string | null;
    weakCategory: string | null;
    isOnlineToday: boolean;
    categoryStats: CategoryStat[];
    weeklyActivity: WeeklyPoint[];
    xpTrend: XpTrendPoint[];
    recentSubmissions: RecentSubmission[];
}

interface AnalyticsData {
    summary: {
        totalStudents: number;
        todayOnline: number;
        weekSubmissions: number;
        avgXp: number;
    };
    students: StudentData[];
    weeklyActivity: WeeklyPoint[];
    globalCategoryStats: CategoryStat[];
    top5Problems: { problem_id: string; count: number }[];
}

type SortKey = "name" | "xp" | "weekCount" | "level";

/* ── Helpers ── */
function rateColor(rate: number): string {
    if (rate >= 80) return "#22c55e";
    if (rate >= 60) return "#f59e0b";
    if (rate >= 40) return "#f97316";
    return "#ef4444";
}

function formatDate(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "방금";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

/* ── Bar Chart (CSS) ── */
function BarChart({ data, height = 100 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
            {data.map((d, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        height: "100%",
                        justifyContent: "flex-end",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`,
                            background: d.color || "linear-gradient(to top, #3b82f6, #0ea5e9)",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.5s ease",
                            minHeight: d.value > 0 ? 4 : 0,
                        }}
                    />
                    <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", fontWeight: 600 }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ── Line Chart (SVG) ── */
function LineChart({ data, width = 300, height = 80 }: { data: number[]; width?: number; height?: number }) {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const pad = 8;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const points = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * innerW;
        const y = pad + (1 - (v - min) / range) * innerH;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
            <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Fill */}
            <polyline
                points={[
                    `${pad},${height - pad}`,
                    ...data.map((v, i) => {
                        const x = pad + (i / (data.length - 1)) * innerW;
                        const y = pad + (1 - (v - min) / range) * innerH;
                        return `${x},${y}`;
                    }),
                    `${width - pad},${height - pad}`,
                ].join(" ")}
                fill="url(#lineGrad)"
            />
            {/* Line */}
            <polyline
                points={points}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* ── Category Bar ── */
function CategoryBar({ label, rate, total, correct }: { label: string; rate: number; total: number; correct: number }) {
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{label}</span>
                <span style={{ fontSize: 11, color: rateColor(rate), fontWeight: 700 }}>
                    {rate}% ({correct}/{total})
                </span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div
                    style={{
                        height: "100%",
                        width: `${rate}%`,
                        background: `linear-gradient(to right, ${rateColor(rate)}, ${rateColor(Math.min(rate + 10, 100))})`,
                        borderRadius: 4,
                        transition: "width 0.7s ease",
                    }}
                />
            </div>
        </div>
    );
}

/* ── Summary Card ── */
function SummaryCard({
    icon,
    label,
    value,
    sub,
    color,
}: {
    icon: string;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                borderRadius: 20,
                padding: "20px 24px",
                border: "1px solid rgba(226,232,240,0.6)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
                display: "flex",
                alignItems: "center",
                gap: 16,
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${color}15`,
                    border: `1px solid ${color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: 24, color }}>{icon}</span>
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                </div>
                {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, fontWeight: 500 }}>{sub}</div>}
            </div>
        </motion.div>
    );
}

/* ── AI Weakness Analysis ── */
function AIAnalysisSection({ student }: { student: StudentData }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        setOpen(true);
        if (result) return; // 이미 결과 있으면 재사용
        setLoading(true);
        setError("");
        try {
            const wrongProblems = student.recentSubmissions
                .filter((s) => !s.is_correct)
                .map((s) => s.problem_id)
                .slice(0, 10);
            const categoryRates = student.categoryStats.map(
                (cs) => `${cs.category}: ${cs.rate}% (${cs.correct}/${cs.total})`
            );
            const prompt = `학생 이름: ${student.name}
레벨: ${student.level}, XP: ${student.xp}, 연속 학습: ${student.streak}일

카테고리별 정답률:
${categoryRates.length > 0 ? categoryRates.join("\n") : "(데이터 없음)"}

최근 오답 문제:
${wrongProblems.length > 0 ? wrongProblems.join(", ") : "(없음)"}

이 학생의 취약점을 분석하고 학습 방향을 추천해줘`;

            const res = await fetch("/api/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: prompt,
                    language: "학생 분석",
                    problemTitle: `${student.name} 취약점 분석`,
                    expectedOutput: "취약점 분석 및 학습 방향 추천",
                    actualOutput: "",
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || "AI 분석 중 오류가 발생했습니다.");
            } else {
                setResult(data.content || "분석 결과를 생성하지 못했어요.");
            }
        } catch {
            setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginBottom: 24 }}>
            <button
                onClick={handleAnalyze}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "10px 16px", borderRadius: 12,
                    border: "1.5px solid rgba(14,165,233,0.3)",
                    background: open ? "rgba(14,165,233,0.06)" : "rgba(14,165,233,0.04)",
                    cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0369a1",
                    transition: "all 0.15s",
                }}
                aria-label="AI 취약점 분석 실행"
            >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology</span>
                AI 취약점 분석
                {result && <span style={{ fontSize: 10, background: "rgba(34,197,94,0.1)", color: "#16a34a", borderRadius: 6, padding: "1px 6px", fontWeight: 600 }}>완료</span>}
            </button>

            {open && (
                <div style={{
                    marginTop: 12, padding: 16, borderRadius: 14,
                    background: "rgba(14,165,233,0.03)", border: "1px solid rgba(14,165,233,0.15)",
                }}>
                    {loading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: "50%",
                                border: "2px solid rgba(14,165,233,0.2)", borderTopColor: "#0ea5e9",
                                animation: "spin .8s linear infinite", flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 12, color: "#0369a1", fontWeight: 600 }}>AI가 분석 중...</span>
                        </div>
                    )}
                    {error && !loading && (
                        <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, lineHeight: 1.6 }}>
                            {error}
                        </div>
                    )}
                    {result && !loading && (
                        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                            {result}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Student Detail Panel ── */
function StudentDetail({ student, onClose }: { student: StudentData; onClose: () => void }) {
    const xpValues = student.xpTrend.map((t) => t.cumulative);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                borderRadius: 24,
                border: "1px solid rgba(226,232,240,0.6)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
                padding: 28,
                overflowY: "auto",
                maxHeight: "calc(100vh - 200px)",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: "50%",
                            background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 800, fontSize: 16,
                        }}>
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{student.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                                Lv.{student.level} · {student.xp.toLocaleString()} XP · {student.streak}일 연속
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label="닫기"
                    style={{
                        width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(226,232,240,0.8)",
                        background: "#f8fafc", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#64748b" }}>close</span>
                </button>
            </div>

            {/* AI 취약점 분석 */}
            <AIAnalysisSection student={student} />

            {/* 카테고리별 정답률 */}
            <Section title="카테고리별 정답률" icon="bar_chart">
                {student.categoryStats.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>데이터 없음</p>
                ) : (
                    student.categoryStats.map((cs) => (
                        <CategoryBar
                            key={cs.category}
                            label={cs.category}
                            rate={cs.rate}
                            total={cs.total}
                            correct={cs.correct}
                        />
                    ))
                )}
            </Section>

            {/* 주간 활동 */}
            <Section title="주간 활동 (최근 7일)" icon="calendar_today">
                <BarChart
                    data={student.weeklyActivity.map((w) => ({
                        label: w.label,
                        value: w.count,
                        color: "linear-gradient(to top, #3b82f6, #0ea5e9)",
                    }))}
                    height={100}
                />
            </Section>

            {/* XP 추이 */}
            <Section title="XP 추이 (최근 30일)" icon="trending_up">
                {xpValues.length >= 2 ? (
                    <div style={{ position: "relative" }}>
                        <LineChart data={xpValues} width={320} height={80} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: "#94a3b8" }}>30일 전</span>
                            <span style={{ fontSize: 9, color: "#94a3b8" }}>오늘</span>
                        </div>
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>데이터 부족</p>
                )}
            </Section>

            {/* 최근 풀이 */}
            <Section title="최근 풀이 기록" icon="history">
                {student.recentSubmissions.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>풀이 기록 없음</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {student.recentSubmissions.map((r, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "8px 12px", borderRadius: 10,
                                    background: r.is_correct ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                                    border: `1px solid ${r.is_correct ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: r.is_correct ? "#22c55e" : "#ef4444" }}>
                                    {r.is_correct ? "check_circle" : "cancel"}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {r.problem_id}
                                </span>
                                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                    {formatDate(r.created_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </motion.div>
    );
}

/* ── Section wrapper ── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0ea5e9" }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{title}</span>
            </div>
            {children}
        </div>
    );
}

/* ════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════ */
export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("weekCount");
    const [sortAsc, setSortAsc] = useState(false);
    const [search, setSearch] = useState("");

    /* Auth guard */
    useEffect(() => {
        if (!authLoading && user?.role !== "teacher") {
            router.replace("/dashboard/learning");
        }
    }, [authLoading, user, router]);

    /* Fetch analytics data */
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/teacher/analytics", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json as AnalyticsData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user?.role === "teacher") {
            fetchData();
        }
    }, [authLoading, user, fetchData]);

    /* Sort */
    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc((p) => !p);
        else { setSortKey(key); setSortAsc(false); }
    };

    const sortedStudents = data
        ? [...data.students]
              .filter((s) => !search || s.name.includes(search))
              .sort((a, b) => {
                  const dir = sortAsc ? 1 : -1;
                  if (sortKey === "name") return dir * a.name.localeCompare(b.name, "ko");
                  if (sortKey === "xp") return dir * (a.xp - b.xp);
                  if (sortKey === "weekCount") return dir * (a.weekCount - b.weekCount);
                  if (sortKey === "level") return dir * (a.level - b.level);
                  return 0;
              })
        : [];

    /* ── Auth loading / not teacher ── */
    if (authLoading || (!authLoading && user?.role !== "teacher")) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 400, fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        border: "3px solid rgba(59,130,246,0.2)",
                        borderTopColor: "#3b82f6",
                        animation: "spin .8s linear infinite",
                        margin: "0 auto 12px",
                    }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>접근 확인 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            WebkitFontSmoothing: "antialiased",
            minHeight: "100vh",
            padding: "0 0 60px",
        }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .sort-btn { cursor: pointer; user-select: none; transition: color 0.2s; }
                .sort-btn:hover { color: #0ea5e9 !important; }
                .student-row { transition: background 0.15s; cursor: pointer; }
                .student-row:hover { background: rgba(14,165,233,0.04) !important; }
                .analytics-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                @media (min-width: 640px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1024px) {
                    .summary-grid { grid-template-columns: repeat(4, 1fr); }
                    .analytics-grid { grid-template-columns: 1fr 380px; }
                }
            `}</style>

            {/* Page Title */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: 28 }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#0ea5e9" }}>analytics</span>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                학습 분석
                            </h1>
                        </div>
                        <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500, margin: 0 }}>
                            학생 학습 현황, 취약 카테고리, XP 추이를 한눈에 확인하세요.
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 12,
                            background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                            color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                            fontSize: 13, fontWeight: 700, opacity: loading ? 0.7 : 1,
                            boxShadow: "0 4px 16px rgba(14,165,233,0.25)",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, animation: loading ? "spin .8s linear infinite" : "none" }}>
                            refresh
                        </span>
                        새로고침
                    </button>
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: "14px 20px", borderRadius: 14, marginBottom: 20,
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: 20 }}>error</span>
                    <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{error}</span>
                </div>
            )}

            {/* Loading */}
            {loading && !data && (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: 300, flexDirection: "column", gap: 12,
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        border: "3px solid rgba(59,130,246,0.15)",
                        borderTopColor: "#3b82f6",
                        animation: "spin .8s linear infinite",
                    }} />
                    <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>분석 데이터 불러오는 중...</p>
                </div>
            )}

            {data && (
                <>
                    {/* 1. 전체 현황 카드 */}
                    <div className="summary-grid" style={{ display: "grid", gap: 16, marginBottom: 28 }}>
                        <SummaryCard icon="groups" label="총 학생" value={data.summary.totalStudents} sub="등록 학생 수" color="#0ea5e9" />
                        <SummaryCard icon="login" label="오늘 접속" value={data.summary.todayOnline} sub="오늘 활동 학생" color="#22c55e" />
                        <SummaryCard icon="edit_note" label="이번 주 풀이" value={data.summary.weekSubmissions} sub="최근 7일 제출" color="#f59e0b" />
                        <SummaryCard icon="stars" label="평균 XP" value={data.summary.avgXp.toLocaleString()} sub="전체 학생 평균" color="#8b5cf6" />
                    </div>

                    {/* 2. 메인 영역 */}
                    <div className="analytics-grid">
                        {/* 왼쪽 컬럼 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                            {/* 학생 테이블 */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{
                                    background: "rgba(255,255,255,0.85)",
                                    backdropFilter: "blur(16px)",
                                    borderRadius: 20,
                                    border: "1px solid rgba(226,232,240,0.6)",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Table Header */}
                                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(226,232,240,0.5)" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#0ea5e9" }}>table_chart</span>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>학생별 학습 현황</span>
                                        </div>
                                        {/* Search */}
                                        <div style={{ position: "relative" }}>
                                            <span className="material-symbols-outlined" style={{
                                                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                                fontSize: 16, color: "#94a3b8",
                                            }}>search</span>
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="학생 이름 검색"
                                                style={{
                                                    paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                                                    border: "1px solid rgba(226,232,240,0.8)", borderRadius: 10,
                                                    fontSize: 13, outline: "none", color: "#334155",
                                                    background: "rgba(248,250,252,0.8)", width: 180,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Table */}
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                                        <thead>
                                            <tr style={{ background: "rgba(248,250,252,0.7)" }}>
                                                {(
                                                    [
                                                        { key: "name", label: "이름" },
                                                        { key: "level", label: "레벨" },
                                                        { key: "xp", label: "XP" },
                                                        { key: "weekCount", label: "이번 주 풀이" },
                                                    ] as { key: SortKey; label: string }[]
                                                ).map((col) => (
                                                    <th
                                                        key={col.key}
                                                        className="sort-btn"
                                                        onClick={() => handleSort(col.key)}
                                                        style={{
                                                            padding: "10px 16px",
                                                            textAlign: "left",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            color: sortKey === col.key ? "#0ea5e9" : "#64748b",
                                                            letterSpacing: "0.05em",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {col.label}
                                                        {sortKey === col.key && (
                                                            <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "middle", marginLeft: 2 }}>
                                                                {sortAsc ? "arrow_upward" : "arrow_downward"}
                                                            </span>
                                                        )}
                                                    </th>
                                                ))}
                                                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b" }}>마지막 접속</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b" }}>취약 카테고리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedStudents.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                                                        학생이 없습니다.
                                                    </td>
                                                </tr>
                                            )}
                                            {sortedStudents.map((s, i) => (
                                                <motion.tr
                                                    key={s.id}
                                                    className="student-row"
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.025 }}
                                                    onClick={() => setSelectedStudent(selectedStudent?.id === s.id ? null : s)}
                                                    style={{
                                                        borderTop: "1px solid rgba(226,232,240,0.5)",
                                                        background: selectedStudent?.id === s.id ? "rgba(14,165,233,0.06)" : "transparent",
                                                    }}
                                                >
                                                    {/* 이름 */}
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{
                                                                width: 32, height: 32, borderRadius: "50%",
                                                                background: s.isOnlineToday
                                                                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                                                    : "linear-gradient(135deg, #94a3b8, #64748b)",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0,
                                                            }}>
                                                                {s.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                                                                {s.grade && (
                                                                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.grade}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* 레벨 */}
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            padding: "3px 10px", borderRadius: 999,
                                                            background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)",
                                                            fontSize: 12, fontWeight: 700, color: "#0369a1",
                                                        }}>
                                                            Lv.{s.level}
                                                        </span>
                                                    </td>
                                                    {/* XP */}
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
                                                        {s.xp.toLocaleString()}
                                                    </td>
                                                    {/* 이번 주 풀이 */}
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{s.weekCount}</span>
                                                            <span style={{ fontSize: 11, color: "#94a3b8" }}>문제</span>
                                                        </div>
                                                    </td>
                                                    {/* 마지막 접속 */}
                                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                                                        {formatDate(s.lastAccess)}
                                                    </td>
                                                    {/* 취약 카테고리 */}
                                                    <td style={{ padding: "12px 16px" }}>
                                                        {s.weakCategory ? (
                                                            <span style={{
                                                                display: "inline-flex", alignItems: "center", gap: 4,
                                                                padding: "3px 10px", borderRadius: 999,
                                                                background: "rgba(239,68,68,0.08)",
                                                                border: "1px solid rgba(239,68,68,0.15)",
                                                                fontSize: 11, fontWeight: 600, color: "#dc2626",
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>warning</span>
                                                                {s.weakCategory}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: 12, color: "#94a3b8" }}>-</span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {selectedStudent && (
                                    <div style={{
                                        padding: "10px 16px 12px",
                                        background: "rgba(14,165,233,0.04)",
                                        borderTop: "1px solid rgba(14,165,233,0.1)",
                                        fontSize: 12, color: "#0369a1", fontWeight: 600,
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                                        {selectedStudent.name} 상세 분석이 오른쪽에 표시됩니다.
                                    </div>
                                )}
                            </motion.div>

                            {/* 전체 카테고리 분석 */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{
                                    background: "rgba(255,255,255,0.85)",
                                    backdropFilter: "blur(16px)",
                                    borderRadius: 20,
                                    border: "1px solid rgba(226,232,240,0.6)",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                                    padding: 24,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#0ea5e9" }}>insights</span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>전체 카테고리 분석</span>
                                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>(낮은 정답률 순)</span>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                    {/* 취약 유형 순위 */}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: "0.04em" }}>
                                            학생들이 어려워하는 유형
                                        </div>
                                        {data.globalCategoryStats.length === 0 ? (
                                            <p style={{ fontSize: 13, color: "#94a3b8" }}>데이터 없음</p>
                                        ) : (
                                            data.globalCategoryStats.slice(0, 6).map((cs, i) => (
                                                <div key={cs.category} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                                    <div style={{
                                                        width: 22, height: 22, borderRadius: 6,
                                                        background: i < 3 ? "rgba(239,68,68,0.1)" : "rgba(241,245,249,0.8)",
                                                        border: `1px solid ${i < 3 ? "rgba(239,68,68,0.2)" : "rgba(226,232,240,0.6)"}`,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: 11, fontWeight: 800,
                                                        color: i < 3 ? "#dc2626" : "#94a3b8",
                                                        flexShrink: 0,
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{cs.category}</span>
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: rateColor(cs.rate) }}>{cs.rate}%</span>
                                                        </div>
                                                        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                                                            <div style={{ height: "100%", width: `${cs.rate}%`, background: rateColor(cs.rate), borderRadius: 3 }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* 이번 주 TOP 5 문제 */}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: "0.04em" }}>
                                            이번 주 인기 문제 TOP 5
                                        </div>
                                        {data.top5Problems.length === 0 ? (
                                            <p style={{ fontSize: 13, color: "#94a3b8" }}>데이터 없음</p>
                                        ) : (
                                            data.top5Problems.map((p, i) => (
                                                <div key={p.problem_id} style={{
                                                    display: "flex", alignItems: "center", gap: 10,
                                                    padding: "8px 12px", borderRadius: 10, marginBottom: 6,
                                                    background: i === 0 ? "rgba(251,191,36,0.08)" : "rgba(248,250,252,0.6)",
                                                    border: `1px solid ${i === 0 ? "rgba(251,191,36,0.2)" : "rgba(226,232,240,0.5)"}`,
                                                }}>
                                                    <span style={{
                                                        fontSize: 13, fontWeight: 800,
                                                        color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#64748b",
                                                    }}>
                                                        {["#1", "#2", "#3", "#4", "#5"][i]}
                                                    </span>
                                                    <span style={{
                                                        flex: 1, fontSize: 12, fontWeight: 600, color: "#334155",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>
                                                        {p.problem_id}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 700,
                                                        background: "rgba(14,165,233,0.1)", borderRadius: 6,
                                                        padding: "2px 8px", color: "#0369a1",
                                                    }}>
                                                        {p.count}회
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* 주간 전체 활동 차트 */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{
                                    background: "rgba(255,255,255,0.85)",
                                    backdropFilter: "blur(16px)",
                                    borderRadius: 20,
                                    border: "1px solid rgba(226,232,240,0.6)",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                                    padding: 24,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#0ea5e9" }}>stacked_bar_chart</span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>전체 주간 풀이 활동</span>
                                </div>
                                <BarChart
                                    data={data.weeklyActivity.map((w) => ({
                                        label: w.label,
                                        value: w.count,
                                    }))}
                                    height={120}
                                />
                                <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", textAlign: "right", fontWeight: 500 }}>
                                    최근 7일 전체 학생 제출 수
                                </div>
                            </motion.div>
                        </div>

                        {/* 오른쪽: 학생 상세 패널 */}
                        <div>
                            <AnimatePresence mode="wait">
                                {selectedStudent ? (
                                    <StudentDetail
                                        key={selectedStudent.id}
                                        student={selectedStudent}
                                        onClose={() => setSelectedStudent(null)}
                                    />
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            background: "rgba(255,255,255,0.6)",
                                            backdropFilter: "blur(12px)",
                                            borderRadius: 24,
                                            border: "1px dashed rgba(226,232,240,0.8)",
                                            padding: 40,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            textAlign: "center",
                                            gap: 12,
                                            minHeight: 300,
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1" }}>person_search</span>
                                        <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600, margin: 0 }}>
                                            학생을 클릭하면<br />상세 분석이 표시됩니다
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
