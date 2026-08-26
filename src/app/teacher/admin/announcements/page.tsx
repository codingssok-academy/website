"use client";

import { useState, useEffect, useCallback } from "react";
import type { Announcement } from "../types";

/* ═══════════════════════════════════════
   공지 작성/관리
   /teacher/admin/announcements
   ═══════════════════════════════════════ */

export default function AnnouncementsPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editPinned, setEditPinned] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/teacher/announcements", { cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "전체 메시지를 불러오지 못했습니다.");
            setAnnouncements((data.announcements || []) as Announcement[]);
        } catch (error) {
            setMsg({ ok: false, text: error instanceof Error ? error.message : "전체 메시지를 불러오지 못했습니다." });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(fetchAnnouncements);
    }, [fetchAnnouncements]);

    const createAnnouncement = async () => {
        if (!title.trim() || !content.trim()) {
            setMsg({ ok: false, text: "제목과 내용을 입력해주세요" });
            return;
        }
        setSending(true); setMsg(null);
        try {
            const response = await fetch("/api/teacher/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, isPinned }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "전체 메시지를 보내지 못했습니다.");
            setMsg({ ok: true, text: "전체 학생에게 메시지를 보냈습니다." });
            setTitle(""); setContent(""); setIsPinned(false);
            await fetchAnnouncements();
        } catch (err: unknown) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "전체 메시지를 보내지 못했습니다." });
        } finally { setSending(false); }
    };

    const startEdit = (ann: Announcement) => {
        setEditingId(ann.id);
        setEditTitle(ann.title);
        setEditContent(ann.content);
        setEditPinned(ann.is_pinned);
    };

    const saveEdit = async () => {
        if (!editingId || !editTitle.trim() || !editContent.trim()) return;
        try {
            const response = await fetch("/api/teacher/announcements", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingId, title: editTitle, content: editContent, isPinned: editPinned }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "전체 메시지를 수정하지 못했습니다.");
            setEditingId(null);
            setMsg({ ok: true, text: "전체 메시지를 수정했습니다." });
            await fetchAnnouncements();
        } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "전체 메시지를 수정하지 못했습니다." });
        }
    };

    const deleteAnnouncement = async (id: string) => {
        try {
            const response = await fetch("/api/teacher/announcements", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "전체 메시지를 삭제하지 못했습니다.");
            setDeleteId(null);
            setMsg({ ok: true, text: "전체 메시지를 삭제했습니다." });
            await fetchAnnouncements();
        } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "전체 메시지를 삭제하지 못했습니다." });
        }
    };

    const togglePin = async (announcement: Announcement) => {
        try {
            const response = await fetch("/api/teacher/announcements", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: announcement.id,
                    title: announcement.title,
                    content: announcement.content,
                    isPinned: !announcement.is_pinned,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "상단 고정 상태를 변경하지 못했습니다.");
            await fetchAnnouncements();
        } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : "상단 고정 상태를 변경하지 못했습니다." });
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box",
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#2563eb", letterSpacing: "0.08em", marginBottom: 6 }}>CODINGSSOK MESSAGE</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "#172554", margin: "0 0 8px" }}>전체 메시지</h1>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                    장민 관리자 계정에서 작성한 내용이 모든 학생의 학습 화면 ‘선생님 메시지’에 표시됩니다.
                </p>
            </div>

            {/* 공지 작성 폼 */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#2563eb" }}>edit_note</span>
                    새 전체 메시지 작성
                </h3>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>제목 *</label>
                    <input aria-label="전체 메시지 제목" value={title} onChange={e => setTitle(e.target.value)}
                        maxLength={80} placeholder="예: 9월 프로젝트 수업 안내" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>내용 *</label>
                    <textarea aria-label="전체 메시지 내용" value={content} onChange={e => setContent(e.target.value)}
                        maxLength={2000} placeholder="모든 학생에게 전달할 내용을 작성해주세요." rows={5}
                        style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)}
                            style={{ accentColor: "#2563eb" }} />
                        <span style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>push_pin</span>
                            상단 고정
                        </span>
                    </label>

                    <button
                        type="button"
                        aria-label={sending ? "전체 메시지 보내는 중" : "전체 학생에게 보내기"}
                        onClick={createAnnouncement}
                        disabled={sending}
                        style={{
                        padding: "12px 24px", borderRadius: 12, border: "none",
                        background: sending ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #6366f1)",
                        color: "#fff", fontSize: 14, fontWeight: 700,
                        cursor: sending ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>campaign</span>
                        {sending ? "보내는 중..." : "전체 학생에게 보내기"}
                    </button>
                </div>

                {msg && (
                    <div style={{
                        padding: "10px 14px", borderRadius: 10, marginTop: 12,
                        background: msg.ok ? "#F0FDF4" : "#FEF2F2",
                        border: `1px solid ${msg.ok ? "#BBF7D0" : "#FECACA"}`,
                        fontSize: 13, color: msg.ok ? "#16a34a" : "#DC2626", fontWeight: 500,
                    }}>{msg.text}</div>
                )}
            </div>

            {/* 전체 메시지 목록 */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 16px" }}>
                    보낸 전체 메시지 ({announcements.length})
                </h3>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>메시지를 불러오는 중입니다...</div>
                ) : announcements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>아직 보낸 전체 메시지가 없습니다.</div>
                ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                        {announcements.map(ann => (
                            <div key={ann.id} style={{
                                borderRadius: 12, border: ann.is_pinned ? "2px solid #fbbf24" : "1px solid #e2e8f0",
                                overflow: "hidden",
                            }}>
                                {editingId === ann.id ? (
                                    <div style={{ padding: "16px" }}>
                                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                            style={{ ...inputStyle, marginBottom: 8, fontWeight: 700 }} />
                                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                                            rows={4} style={{ ...inputStyle, marginBottom: 8, resize: "vertical" }} />
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                                <input type="checkbox" checked={editPinned} onChange={e => setEditPinned(e.target.checked)}
                                                    style={{ accentColor: "#2563eb" }} /> 고정
                                            </label>
                                            <div style={{ flex: 1 }} />
                                            <button onClick={saveEdit} style={{
                                                padding: "6px 14px", borderRadius: 8, border: "none",
                                                background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                            }}>저장</button>
                                            <button onClick={() => setEditingId(null)} style={{
                                                padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                                                background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer",
                                            }}>취소</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: "16px 18px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    {ann.is_pinned && <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#f59e0b" }}>push_pin</span>}
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#172554" }}>{ann.title}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                                    {new Date(ann.created_at).toLocaleDateString("ko")}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button onClick={() => togglePin(ann)}
                                                    title={ann.is_pinned ? "고정 해제" : "상단 고정"}
                                                    style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                                        {ann.is_pinned ? "push_pin" : "push_pin"}
                                                    </span>
                                                </button>
                                                <button onClick={() => startEdit(ann)}
                                                    style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                                                </button>
                                                {deleteId === ann.id ? (
                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        <button onClick={() => deleteAnnouncement(ann.id)}
                                                            style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>삭제</button>
                                                        <button onClick={() => setDeleteId(null)}
                                                            style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer" }}>취소</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeleteId(ann.id)}
                                                        style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: "#cbd5e1" }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 13, color: "#475569", margin: 0, whiteSpace: "pre-wrap" }}>{ann.content}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
