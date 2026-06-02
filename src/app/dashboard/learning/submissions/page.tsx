"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

/* ── Types ── */
interface CodeSubmission {
    id: string;
    user_id: string;
    language: string;
    code: string;
    output: string;
    stdout: string | null;
    status: string;
    created_at: string;
    problem_id: string | null;
    result: string | null;
    score: number | null;
}

/* ── Constants ── */
const PAGE_SIZE = 20;

const LANG_LABELS: Record<string, string> = {
    c: "C",
    cpp: "C++",
    python: "Python",
    javascript: "JavaScript",
    java: "Java",
};

const LANG_COLORS: Record<string, string> = {
    c: "#2563eb",
    cpp: "#7c3aed",
    python: "#d97706",
    javascript: "#ca8a04",
    java: "#dc2626",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    success: { label: "성공", color: "#16a34a", bg: "#f0fdf4", icon: "check_circle" },
    compile_error: { label: "컴파일 오류", color: "#dc2626", bg: "#fef2f2", icon: "error" },
    runtime_error: { label: "런타임 오류", color: "#ea580c", bg: "#fff7ed", icon: "warning" },
    error: { label: "오류", color: "#dc2626", bg: "#fef2f2", icon: "cancel" },
    pending: { label: "처리 중", color: "#6b7280", bg: "#f9fafb", icon: "hourglass_empty" },
};

const RESULT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    "정답": { label: "정답", color: "#16a34a", bg: "#f0fdf4" },
    "부분 정답": { label: "부분 정답", color: "#d97706", bg: "#fffbeb" },
    "오답": { label: "오답", color: "#dc2626", bg: "#fef2f2" },
};

function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getStatusConfig(status: string) {
    return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
}

function codePreview(code: string, maxLen = 120): string {
    const oneline = code.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    return oneline.length > maxLen ? oneline.slice(0, maxLen) + "…" : oneline;
}

/* ── Detail Modal ── */
function DetailModal({
    submission,
    onClose,
}: {
    submission: CodeSubmission;
    onClose: () => void;
}) {
    const statusCfg = getStatusConfig(submission.status);
    const resultCfg = submission.result ? (RESULT_CONFIG[submission.result] ?? null) : null;
    const outputText = submission.stdout || submission.output || "";

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: "fixed", inset: 0, zIndex: 200,
                    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "16px",
                }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                aria-modal="true"
                role="dialog"
                aria-label="제출 상세 보기"
            >
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    style={{
                        background: "#fff",
                        borderRadius: 20,
                        width: "100%",
                        maxWidth: 760,
                        maxHeight: "88vh",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                padding: "4px 10px", borderRadius: 8,
                                background: `${LANG_COLORS[submission.language] ?? "#64748b"}15`,
                                color: LANG_COLORS[submission.language] ?? "#64748b",
                                fontSize: 12, fontWeight: 700,
                            }}>
                                {LANG_LABELS[submission.language] ?? submission.language.toUpperCase()}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14, color: statusCfg.color }}>{statusCfg.icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: statusCfg.color }}>{statusCfg.label}</span>
                            </div>
                            {resultCfg && (
                                <div style={{
                                    padding: "3px 10px", borderRadius: 8,
                                    background: resultCfg.bg, color: resultCfg.color,
                                    fontSize: 12, fontWeight: 700,
                                }}>
                                    {resultCfg.label}
                                    {submission.score != null && submission.score > 0 && ` (${submission.score}점)`}
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(submission.created_at)}</span>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                aria-label="닫기"
                                style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    border: "none", background: "#f1f5f9", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#64748b" }}>close</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Problem ID if present */}
                        {submission.problem_id && (
                            <div style={{
                                padding: "10px 14px", borderRadius: 10,
                                background: "#f8fafc", border: "1px solid #e2e8f0",
                                fontSize: 13, color: "#475569",
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#64748b" }}>topic</span>
                                <span style={{ fontWeight: 600 }}>문제 ID:</span>
                                <span style={{ fontFamily: "monospace", color: "#0369a1" }}>{submission.problem_id}</span>
                            </div>
                        )}

                        {/* Code */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#64748b" }}>code</span>
                                제출 코드
                            </div>
                            <pre style={{
                                background: "#0f172a", borderRadius: 12, padding: "16px 18px",
                                fontSize: 12, lineHeight: 1.7, overflowX: "auto",
                                color: "#e2e8f0", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
                                maxHeight: 340, overflowY: "auto",
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                            }}>
                                {submission.code}
                            </pre>
                        </div>

                        {/* Output */}
                        {outputText && (
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#64748b" }}>terminal</span>
                                    실행 결과
                                </div>
                                <pre style={{
                                    background: submission.status === "success" ? "#f0fdf4" : "#fef2f2",
                                    border: `1px solid ${submission.status === "success" ? "#bbf7d0" : "#fecaca"}`,
                                    borderRadius: 12, padding: "14px 18px",
                                    fontSize: 12, lineHeight: 1.7, overflowX: "auto",
                                    color: submission.status === "success" ? "#166534" : "#991b1b",
                                    margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
                                    maxHeight: 200, overflowY: "auto",
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}>
                                    {outputText}
                                </pre>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ── Submission Card ── */
function SubmissionCard({
    submission,
    index,
    onClick,
}: {
    submission: CodeSubmission;
    index: number;
    onClick: () => void;
}) {
    const statusCfg = getStatusConfig(submission.status);
    const resultCfg = submission.result ? (RESULT_CONFIG[submission.result] ?? null) : null;
    const langColor = LANG_COLORS[submission.language] ?? "#64748b";

    return (
        <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                padding: "16px 20px",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "border-color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 16,
            }}
            aria-label={`제출 상세 보기: ${formatDate(submission.created_at)}`}
        >
            {/* Status icon */}
            <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: statusCfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: statusCfg.color }}>
                    {statusCfg.icon}
                </span>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    {/* Language badge */}
                    <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: `${langColor}12`, color: langColor,
                        flexShrink: 0,
                    }}>
                        {LANG_LABELS[submission.language] ?? submission.language.toUpperCase()}
                    </span>

                    {/* Status */}
                    <span style={{ fontSize: 12, fontWeight: 600, color: statusCfg.color, flexShrink: 0 }}>
                        {statusCfg.label}
                    </span>

                    {/* Judge result */}
                    {resultCfg && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                            background: resultCfg.bg, color: resultCfg.color, flexShrink: 0,
                        }}>
                            {resultCfg.label}
                            {submission.score != null && submission.score > 0 && ` ${submission.score}점`}
                        </span>
                    )}

                    {/* Problem ID */}
                    {submission.problem_id && (
                        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", flexShrink: 0 }}>
                            {submission.problem_id}
                        </span>
                    )}
                </div>

                {/* Code preview */}
                <div style={{
                    fontSize: 12, color: "#94a3b8", fontFamily: "monospace",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {codePreview(submission.code)}
                </div>
            </div>

            {/* Time + arrow */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {formatDate(submission.created_at)}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#cbd5e1" }}>
                    chevron_right
                </span>
            </div>
        </motion.button>
    );
}

/* ── Filter Bar ── */
const LANG_FILTERS = [
    { key: "all", label: "전체" },
    { key: "c", label: "C" },
    { key: "cpp", label: "C++" },
    { key: "python", label: "Python" },
    { key: "javascript", label: "JavaScript" },
    { key: "java", label: "Java" },
];

const STATUS_FILTERS = [
    { key: "all", label: "전체" },
    { key: "success", label: "성공" },
    { key: "compile_error", label: "컴파일 오류" },
    { key: "runtime_error", label: "런타임 오류" },
];

/* ── Main Page ── */
export default function SubmissionsPage() {
    const { user } = useAuth();

    const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<CodeSubmission | null>(null);

    const [langFilter, setLangFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchSubmissions = useCallback(async (pageNum: number, lang: string, status: string, replace: boolean) => {
        if (!user) return;

        const isFirst = pageNum === 0;
        if (isFirst) setLoading(true); else setLoadingMore(true);

        try {
            const supabase = createClient();
            let query = supabase
                .from("code_submissions")
                .select("id, user_id, language, code, output, stdout, status, created_at, problem_id, result, score")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

            if (lang !== "all") query = query.eq("language", lang);
            if (status !== "all") query = query.eq("status", status);

            const { data, error } = await query;
            if (error) throw error;

            const rows = (data ?? []) as CodeSubmission[];
            if (replace) {
                setSubmissions(rows);
            } else {
                setSubmissions(prev => [...prev, ...rows]);
            }
            setHasMore(rows.length === PAGE_SIZE);
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error("[Submissions]", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        setPage(0);
        fetchSubmissions(0, langFilter, statusFilter, true);
    }, [langFilter, statusFilter, fetchSubmissions]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchSubmissions(next, langFilter, statusFilter, false);
    };

    const totalShown = submissions.length;

    return (
        <>
            {/* Detail modal */}
            {selected && (
                <DetailModal submission={selected} onClose={() => setSelected(null)} />
            )}

            <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 0 120px" }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 24 }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#fff" }}>history</span>
                        </div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                제출 기록
                            </h1>
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                                내가 실행하고 제출한 모든 코드 기록
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    style={{
                        background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                        padding: "14px 18px", marginBottom: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        display: "flex", flexDirection: "column", gap: 10,
                    }}
                >
                    {/* Language filter */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>언어</span>
                        {LANG_FILTERS.map(f => (
                            <motion.button
                                key={f.key}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setLangFilter(f.key)}
                                style={{
                                    padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    border: "none", cursor: "pointer", transition: "all 0.15s",
                                    ...(langFilter === f.key
                                        ? { background: "#2563eb", color: "#fff" }
                                        : { background: "#f1f5f9", color: "#475569" }
                                    ),
                                }}
                            >
                                {f.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Status filter */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>결과</span>
                        {STATUS_FILTERS.map(f => (
                            <motion.button
                                key={f.key}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setStatusFilter(f.key)}
                                style={{
                                    padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    border: "none", cursor: "pointer", transition: "all 0.15s",
                                    ...(statusFilter === f.key
                                        ? { background: "#2563eb", color: "#fff" }
                                        : { background: "#f1f5f9", color: "#475569" }
                                    ),
                                }}
                            >
                                {f.label}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* List */}
                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.07 }}
                                style={{
                                    height: 78, borderRadius: 16, background: "#f1f5f9",
                                }}
                            />
                        ))}
                    </div>
                ) : submissions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "#fff", borderRadius: 20, border: "1px dashed #e2e8f0",
                            padding: "56px 24px", textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 56, color: "#cbd5e1" }}>
                                code_off
                            </span>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#475569", margin: "0 0 8px" }}>
                            제출 기록이 없어요
                        </p>
                        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
                            코드를 실행하거나 문제를 풀면 여기에 기록돼요
                        </p>
                        <Link
                            href="/dashboard/compiler"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "10px 20px", borderRadius: 12,
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
                                boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span>
                            C-Studio 열기
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 500 }}>
                            {totalShown}개 표시
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {submissions.map((sub, i) => (
                                <SubmissionCard
                                    key={sub.id}
                                    submission={sub}
                                    index={i}
                                    onClick={() => setSelected(sub)}
                                />
                            ))}
                        </div>

                        {/* Load more */}
                        {hasMore && (
                            <div style={{ marginTop: 20, textAlign: "center" }}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    style={{
                                        padding: "10px 28px", borderRadius: 12,
                                        border: "1px solid #e2e8f0", background: "#fff",
                                        fontSize: 13, fontWeight: 600, color: "#475569",
                                        cursor: loadingMore ? "not-allowed" : "pointer",
                                        opacity: loadingMore ? 0.6 : 1,
                                        display: "inline-flex", alignItems: "center", gap: 8,
                                    }}
                                >
                                    {loadingMore ? (
                                        <>
                                            <motion.span
                                                className="material-symbols-outlined"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                style={{ fontSize: 16, color: "#94a3b8" }}
                                            >
                                                progress_activity
                                            </motion.span>
                                            불러오는 중...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
                                            더 보기
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
