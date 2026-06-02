"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import { createClient } from "@/lib/supabase";

/* ═══════════════════════════════════════
   학부모 피드백 작성 (새 버전)
   /teacher/admin/feedback
   ═══════════════════════════════════════ */

interface FeedbackRow {
    id: string;
    student_id: string;
    student_name: string | null;
    date: string | null;
    content: string; // JSON string
    created_at: string;
}

interface FeedbackContent {
    lessons: string;
    homework: string;
    attitude_score: number;
    attitude_comment: string;
    focus_score: number;
    participation_score: number;
    understanding_score: number;
    understanding_comment: string;
    special_notes: string;
    image_url: string;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i)}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "4px 6px",
                        cursor: "pointer",
                        fontSize: 26,
                        color: i <= value ? "#f59e0b" : "#d1d5db",
                        lineHeight: 1,
                        minWidth: 36,
                        minHeight: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {i <= value ? "★" : "☆"}
                </button>
            ))}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontSize: 16, // 16px+ prevents iOS auto-zoom
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    WebkitAppearance: "none",
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    display: "block",
    marginBottom: 6,
};

export default function FeedbackPage() {
    const { studentOptions, studentNameByAnyId } = useAdmin();

    // Mobile tab state (폼 / 이력)
    const [mobileTab, setMobileTab] = useState<"form" | "history">("form");

    // Form state
    const [studentId, setStudentId] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [lessons, setLessons] = useState("");
    const [homework, setHomework] = useState("");
    const [attitudeScore, setAttitudeScore] = useState(4);
    const [attitudeComment, setAttitudeComment] = useState("");
    const [focusScore, setFocusScore] = useState(4);
    const [participationScore, setParticipationScore] = useState(4);
    const [understandingScore, setUnderstandingScore] = useState(4);
    const [understandingComment, setUnderstandingComment] = useState("");
    const [specialNotes, setSpecialNotes] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
    const [history, setHistory] = useState<FeedbackRow[]>([]);

    const showToast = (ok: boolean, text: string) => {
        setToast({ ok, text });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchHistory = useCallback(async (sid?: string) => {
        const sb = createClient();
        let q = sb
            .from("teacher_feedback")
            .select("id, student_id, student_name, date, content, created_at")
            .order("created_at", { ascending: false })
            .limit(30);
        if (sid) q = q.eq("student_id", sid);
        const { data } = await q;
        setHistory((data || []) as FeedbackRow[]);
    }, []);

    useEffect(() => {
        fetchHistory(studentId || undefined);
    }, [studentId, fetchHistory]);

    const copyUrl = async (id: string) => {
        const url = `${window.location.origin}/feedback/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast(true, "URL이 클립보드에 복사되었습니다");
        } catch {
            showToast(false, "클립보드 복사 실패");
        }
    };

    const saveFeedback = async () => {
        if (!studentId || !lessons.trim()) return;
        setSaving(true);

        const studentName = studentOptions.find(s => s.id === studentId)?.name
            || studentNameByAnyId.get(studentId)
            || "학생";

        const contentObj: FeedbackContent = {
            lessons: lessons.trim(),
            homework: homework.trim(),
            attitude_score: attitudeScore,
            attitude_comment: attitudeComment.trim(),
            focus_score: focusScore,
            participation_score: participationScore,
            understanding_score: understandingScore,
            understanding_comment: understandingComment.trim(),
            special_notes: specialNotes.trim(),
            image_url: imageUrl.trim(),
        };

        try {
            const res = await fetch("/api/teacher/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    studentName,
                    date,
                    contentJson: contentObj,
                    // Legacy fields for backward compatibility
                    category: "lesson",
                    content: lessons.trim(),
                    focusScore,
                    engagementScore: participationScore,
                    understandingScore,
                    homeworkSummary: homework.trim() || null,
                    notifyParent: false,
                    deliveryChannel: "portal",
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error?.formErrors?.join(", ") || result.error || "저장 실패");
            }
            const feedbackId = result.feedback?.id;
            if (feedbackId) {
                await copyUrl(feedbackId);
            } else {
                showToast(true, "피드백이 저장되었습니다");
            }
            // Reset form
            setLessons(""); setHomework(""); setAttitudeComment("");
            setUnderstandingComment(""); setSpecialNotes(""); setImageUrl("");
            setAttitudeScore(4); setFocusScore(4); setParticipationScore(4); setUnderstandingScore(4);
            fetchHistory(studentId);
        } catch (err: unknown) {
            showToast(false, `오류: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSaving(false);
        }
    };

    const canSave = !!studentId && lessons.trim().length > 0 && !saving;

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#172554", margin: 0 }}>
                    학부모 피드백
                </h2>
                {/* 모바일 탭 전환 */}
                <div className="feedback-mobile-tabs" style={{
                    display: "none",
                    background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2,
                }}>
                    {(["form", "history"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setMobileTab(t)}
                            style={{
                                padding: "6px 14px", borderRadius: 8, border: "none",
                                background: mobileTab === t ? "#fff" : "transparent",
                                color: mobileTab === t ? "#172554" : "#64748b",
                                fontSize: 12, fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: mobileTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.15s",
                            }}
                        >
                            {t === "form" ? "작성" : `이력 (${history.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                    zIndex: 9999, padding: "14px 20px", borderRadius: 12,
                    background: toast.ok ? "#16a34a" : "#dc2626",
                    color: "#fff", fontSize: 14, fontWeight: 600,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                    maxWidth: "calc(100vw - 32px)", width: "max-content",
                    whiteSpace: "nowrap",
                }}>
                    {toast.text}
                </div>
            )}

            <div className="feedback-grid" style={{ gap: 20 }}>
                {/* 피드백 작성 폼 */}
                <div
                    className={`feedback-form-card feedback-form-panel${mobileTab === "history" ? " feedback-mobile-hidden" : ""}`}
                    style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}
                >
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 20px" }}>
                        피드백 작성
                    </h3>

                    {/* 학생 선택 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>학생명 *</label>
                        <select
                            value={studentId}
                            onChange={e => setStudentId(e.target.value)}
                            style={{ ...inputStyle, background: "#fff" }}
                        >
                            <option value="">학생 선택</option>
                            {studentOptions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.grade || "-"})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 수업 날짜 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>수업 날짜</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {/* 배운 내용 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>배운 내용 *</label>
                        <textarea
                            value={lessons}
                            onChange={e => setLessons(e.target.value)}
                            placeholder="오늘 수업에서 배운 내용을 작성해주세요..."
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                    </div>

                    {/* 과제 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>과제</label>
                        <textarea
                            value={homework}
                            onChange={e => setHomework(e.target.value)}
                            placeholder="오늘의 과제를 작성해주세요..."
                            rows={2}
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                    </div>

                    {/* 수업태도 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>수업태도</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <StarRating value={attitudeScore} onChange={setAttitudeScore} />
                            <span style={{ fontSize: 12, color: "#64748b" }}>{attitudeScore}/5</span>
                        </div>
                        <input
                            value={attitudeComment}
                            onChange={e => setAttitudeComment(e.target.value)}
                            placeholder="수업태도 코멘트 (선택)"
                            style={inputStyle}
                        />
                    </div>

                    {/* 집중도 / 참여도 */}
                    <div className="score-grid" style={{ marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>집중도</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <StarRating value={focusScore} onChange={setFocusScore} />
                                <span style={{ fontSize: 12, color: "#64748b" }}>{focusScore}/5</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>참여도</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <StarRating value={participationScore} onChange={setParticipationScore} />
                                <span style={{ fontSize: 12, color: "#64748b" }}>{participationScore}/5</span>
                            </div>
                        </div>
                    </div>

                    {/* 이해도 및 성취도 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>이해도 및 성취도</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <StarRating value={understandingScore} onChange={setUnderstandingScore} />
                            <span style={{ fontSize: 12, color: "#64748b" }}>{understandingScore}/5</span>
                        </div>
                        <input
                            value={understandingComment}
                            onChange={e => setUnderstandingComment(e.target.value)}
                            placeholder="이해도 코멘트 (선택)"
                            style={inputStyle}
                        />
                    </div>

                    {/* 특이사항 */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>특이사항</label>
                        <textarea
                            value={specialNotes}
                            onChange={e => setSpecialNotes(e.target.value)}
                            placeholder="특이사항을 작성해주세요 (선택)"
                            rows={2}
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                    </div>

                    {/* 이미지 첨부 */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>이미지 URL (선택)</label>
                        <input
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            placeholder="https://..."
                            style={inputStyle}
                        />
                    </div>

                    <div className="feedback-save-btn-wrap">
                        <button
                            onClick={saveFeedback}
                            disabled={!canSave}
                            style={{
                                width: "100%",
                                padding: "14px 24px",
                                borderRadius: 12,
                                border: "none",
                                background: canSave ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#94a3b8",
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: canSave ? "pointer" : "not-allowed",
                                transition: "background 0.2s",
                                boxShadow: canSave ? "0 4px 14px rgba(59,130,246,0.35)" : "none",
                            }}
                        >
                            {saving ? "저장 중..." : "피드백 저장 및 URL 복사"}
                        </button>
                    </div>
                </div>

                {/* 최근 피드백 목록 */}
                <div
                    className={`feedback-form-card feedback-history-panel${mobileTab === "form" ? " feedback-mobile-hidden" : ""}`}
                    style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}
                >
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 16px" }}>
                        최근 피드백 ({history.length})
                    </h3>

                    {history.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
                            {studentId ? "이 학생의 피드백이 없습니다" : "학생을 선택하면 이력을 볼 수 있습니다"}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10, maxHeight: 700, overflowY: "auto" }}>
                            {history.map(fb => {
                                let parsed: Partial<FeedbackContent> = {};
                                try { parsed = JSON.parse(fb.content); } catch { /* raw text */ }
                                const name = fb.student_name
                                    || studentNameByAnyId.get(fb.student_id)
                                    || "학생";
                                const dateStr = fb.date
                                    || new Date(fb.created_at).toLocaleDateString("ko");
                                return (
                                    <div key={fb.id} style={{
                                        padding: 14,
                                        borderRadius: 12,
                                        background: "#f8fafc",
                                        border: "1px solid #f1f5f9",
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                            <div>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: "#172554" }}>
                                                    {name}
                                                </span>
                                                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                                                    {dateStr}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => copyUrl(fb.id)}
                                                style={{
                                                    padding: "4px 10px",
                                                    borderRadius: 8,
                                                    border: "1px solid #3b82f6",
                                                    background: "#eff6ff",
                                                    color: "#3b82f6",
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                URL 복사
                                            </button>
                                        </div>
                                        {parsed.lessons ? (
                                            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
                                                {parsed.lessons.slice(0, 100)}{parsed.lessons.length > 100 ? "..." : ""}
                                            </p>
                                        ) : (
                                            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 6px" }}>
                                                {typeof fb.content === "string" && !fb.content.startsWith("{")
                                                    ? fb.content.slice(0, 100)
                                                    : "(내용 없음)"}
                                            </p>
                                        )}
                                        {(parsed.attitude_score || parsed.focus_score || parsed.participation_score || parsed.understanding_score) && (
                                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                                {parsed.attitude_score && <span style={{ fontSize: 11, color: "#64748b" }}>태도 {parsed.attitude_score}/5</span>}
                                                {parsed.focus_score && <span style={{ fontSize: 11, color: "#64748b" }}>집중 {parsed.focus_score}/5</span>}
                                                {parsed.participation_score && <span style={{ fontSize: 11, color: "#64748b" }}>참여 {parsed.participation_score}/5</span>}
                                                {parsed.understanding_score && <span style={{ fontSize: 11, color: "#64748b" }}>이해 {parsed.understanding_score}/5</span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .feedback-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }
                .feedback-form-card {
                    padding: 24px;
                }
                .score-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .feedback-save-btn-wrap {
                    margin-top: 4px;
                }
                @media (max-width: 767px) {
                    .feedback-grid {
                        grid-template-columns: 1fr;
                    }
                    .feedback-form-card {
                        padding: 16px;
                    }
                    .score-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }
                    .feedback-mobile-tabs {
                        display: flex !important;
                    }
                    .feedback-save-btn-wrap {
                        position: sticky;
                        bottom: calc(64px + env(safe-area-inset-bottom) + 8px);
                        background: linear-gradient(to top, #fff 70%, transparent);
                        padding: 12px 0 4px;
                        margin: 8px -16px -16px;
                        padding-left: 16px;
                        padding-right: 16px;
                        border-radius: 0 0 16px 16px;
                        z-index: 10;
                    }
                    .feedback-mobile-hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
