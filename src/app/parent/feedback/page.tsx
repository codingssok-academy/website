"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clearParentClientAuth, PARENT_STUDENT_KEY } from "@/lib/parent-client-auth";

interface FeedbackFile {
    name: string;
    url: string;
    type: string;
}

interface Feedback {
    id: string;
    date: string | null;
    status: string;
    studentName: string;
    contentLearned: string;
    homework: string;
    attitude: string;
    understanding: string;
    notes: string;
    files?: FeedbackFile[];
}

interface LookupResult {
    found: boolean;
    message?: string;
    studentName?: string;
    totalFeedbacks?: number;
    feedbacks?: Feedback[];
}

function FeedbackSection({
    icon,
    title,
    content,
    color,
    bg,
}: {
    icon: string;
    title: string;
    content: string;
    color: string;
    bg: string;
}) {
    return (
        <div
            style={{
                background: bg,
                borderRadius: 14,
                padding: "12px 14px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                }}
            >
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 15,
                        color,
                        fontVariationSettings: "'FILL' 1",
                    }}
                >
                    {icon}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color }}>{title}</span>
            </div>
            <p
                style={{
                    fontSize: 13,
                    color: "#334155",
                    lineHeight: 1.7,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                }}
            >
                {content}
            </p>
        </div>
    );
}

function FeedbackCard({ fb, index }: { fb: Feedback; index: number }) {
    const [expanded, setExpanded] = useState(index === 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.28, ease: "easeOut" }}
            style={{
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(226,232,240,0.8)",
            }}
        >
            {/* Card header */}
            <button
                onClick={() => setExpanded(prev => !prev)}
                style={{
                    width: "100%",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    borderBottom: expanded ? "1px solid #f1f5f9" : "none",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#eff6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: 18,
                                color: "#2563eb",
                                fontVariationSettings: "'FILL' 1",
                            }}
                        >
                            calendar_month
                        </span>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                            {fb.date ?? "날짜 미지정"}
                        </div>
                        {fb.contentLearned && (
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                    marginTop: 2,
                                    maxWidth: 200,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {fb.contentLearned.split("\n")[0]}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            background: fb.status === "완료" ? "#dcfce7" : "#fef3c7",
                            color: fb.status === "완료" ? "#166534" : "#92400e",
                        }}
                    >
                        {fb.status}
                    </span>
                    <motion.span
                        className="material-symbols-outlined"
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontSize: 18, color: "#94a3b8" }}
                    >
                        expand_more
                    </motion.span>
                </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            style={{
                                padding: "16px 18px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {fb.contentLearned && (
                                <FeedbackSection
                                    icon="menu_book"
                                    title="배운 내용"
                                    content={fb.contentLearned}
                                    color="#2563eb"
                                    bg="#eff6ff"
                                />
                            )}
                            {fb.homework && (
                                <FeedbackSection
                                    icon="assignment"
                                    title="과제"
                                    content={fb.homework}
                                    color="#ea580c"
                                    bg="#fff7ed"
                                />
                            )}
                            {fb.attitude && (
                                <FeedbackSection
                                    icon="sentiment_satisfied"
                                    title="수업 태도"
                                    content={fb.attitude}
                                    color="#16a34a"
                                    bg="#f0fdf4"
                                />
                            )}
                            {fb.understanding && (
                                <FeedbackSection
                                    icon="trending_up"
                                    title="이해도 및 성취도"
                                    content={fb.understanding}
                                    color="#2563eb"
                                    bg="#eff6ff"
                                />
                            )}
                            {fb.notes && (
                                <FeedbackSection
                                    icon="info"
                                    title="특이사항"
                                    content={fb.notes}
                                    color="#64748b"
                                    bg="#f8fafc"
                                />
                            )}

                            {/* PDF/image attachments */}
                            {fb.files && fb.files.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            color: "#64748b",
                                            marginBottom: 8,
                                        }}
                                    >
                                        첨부파일
                                    </div>
                                    {fb.files.map((file, fi) =>
                                        file.type === "image" ? (
                                            <a
                                                key={fi}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ display: "block" }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: 12,
                                                        display: "block",
                                                    }}
                                                />
                                            </a>
                                        ) : (
                                            <div
                                                key={fi}
                                                style={{
                                                    borderRadius: 12,
                                                    overflow: "hidden",
                                                    border: "1px solid #e2e8f0",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: "8px 12px",
                                                        background: "#fafbfc",
                                                        borderBottom: "1px solid #f1f5f9",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{
                                                            fontSize: 14,
                                                            color: "#ef4444",
                                                            fontVariationSettings: "'FILL' 1",
                                                        }}
                                                    >
                                                        picture_as_pdf
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            color: "#334155",
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {file.name}
                                                    </span>
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            fontSize: 10,
                                                            color: "#2563eb",
                                                            fontWeight: 700,
                                                            textDecoration: "none",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 2,
                                                        }}
                                                    >
                                                        새 탭
                                                        <span
                                                            className="material-symbols-outlined"
                                                            style={{ fontSize: 11 }}
                                                        >
                                                            open_in_new
                                                        </span>
                                                    </a>
                                                </div>
                                                <iframe
                                                    src={`/api/proxy-pdf?url=${encodeURIComponent(file.url)}`}
                                                    title={file.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "60vh",
                                                        border: "none",
                                                        display: "block",
                                                    }}
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function ParentFeedbackPage() {
    const [studentName, setStudentName] = useState("");
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<LookupResult | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(PARENT_STUDENT_KEY) ?? "";
        setStudentName(stored);
    }, []);

    const search = useCallback(async (name: string) => {
        if (!name || name.length < 2) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/parent/lookup?name=${encodeURIComponent(name)}`);
            const data = await res.json();
            if (res.status === 401 || res.status === 403) {
                clearParentClientAuth();
                window.location.reload();
                return;
            }
            if (!res.ok) {
                setResult({ found: false, message: data?.error || "피드백을 불러오지 못했습니다." });
                return;
            }
            setResult(data);
        } catch {
            setResult({ found: false, message: "서버 연결 오류" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (studentName) search(studentName);
        else setLoading(false);
    }, [studentName, search]);

    return (
        <div style={{ padding: "20px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
            {/* Title row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                }}
            >
                <div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>
                        수업 피드백
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                        {studentName ? `${studentName} 학생` : "피드백 조회"}
                    </div>
                </div>
            </div>

            {/* Loading skeletons */}
            {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            style={{
                                height: 76,
                                borderRadius: 20,
                                background: "#e2e8f0",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Not found */}
            {!loading && result && !result.found && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        background: "#fff",
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: 48,
                            color: "#cbd5e1",
                            display: "block",
                            marginBottom: 12,
                        }}
                    >
                        search_off
                    </span>
                    <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                        {result.message || "피드백을 불러오지 못했습니다."}
                    </div>
                </motion.div>
            )}

            {/* Feedback list */}
            {!loading && result?.found && result.feedbacks && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Summary bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            borderRadius: 20,
                            padding: "18px 20px",
                            color: "#fff",
                            display: "flex",
                            gap: 24,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900 }}>
                                {result.totalFeedbacks}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.75 }}>수업 피드백</div>
                        </div>
                    </motion.div>

                    {result.feedbacks.length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px 20px",
                                color: "#94a3b8",
                                fontSize: 14,
                            }}
                        >
                            작성 완료된 피드백이 아직 없습니다.
                        </div>
                    )}

                    {result.feedbacks.map((fb, i) => (
                        <FeedbackCard key={fb.id} fb={fb} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
