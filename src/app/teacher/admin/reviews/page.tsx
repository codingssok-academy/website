"use client";

/**
 * 교사 관리자 — 실제 리뷰 관리
 * /teacher/admin/reviews
 *
 * 워크플로:
 *  1. 네이버 스마트플레이스 / 구글 맵 / 카카오맵에서 코딩쏙 리뷰 복사
 *  2. 이 페이지에서 "추가" → 플랫폼/평점/작성자/날짜/내용 입력
 *  3. 작성자 이름은 이니셜 처리 권장 ("김OO 학부모")
 *  4. 저장하면 즉시 홈페이지 Reviews 섹션에 반영됨
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface Review {
    id: string;
    platform: "naver" | "google" | "kakao";
    rating: number;
    author: string;
    review_date: string;
    content: string;
    reply: string | null;
    display_order: number;
}

const PLATFORMS = [
    { id: "naver", name: "네이버", color: "#03C75A" },
    { id: "google", name: "구글", color: "#4285F4" },
    { id: "kakao", name: "카카오", color: "#FEE500" },
] as const;

const EMPTY_FORM: Omit<Review, "id"> = {
    platform: "naver",
    rating: 5,
    author: "",
    review_date: new Date().toISOString().split("T")[0],
    content: "",
    reply: "",
    display_order: 0,
};

export default function ReviewsAdminPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Review | null>(null);
    const [form, setForm] = useState<Omit<Review, "id">>(EMPTY_FORM);
    const [status, setStatus] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const sb = createClient();
        const { data, error } = await sb
            .from("academy_reviews")
            .select("*")
            .order("display_order", { ascending: false })
            .order("review_date", { ascending: false });
        if (!error) setReviews((data as Review[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const startNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
    };

    const startEdit = (r: Review) => {
        setEditing(r);
        setForm({
            platform: r.platform, rating: r.rating, author: r.author,
            review_date: r.review_date, content: r.content,
            reply: r.reply || "", display_order: r.display_order,
        });
    };

    const save = async () => {
        setStatus("저장 중...");
        const sb = createClient();
        const payload = { ...form, reply: form.reply || null };
        const { error } = editing
            ? await sb.from("academy_reviews").update(payload).eq("id", editing.id)
            : await sb.from("academy_reviews").insert(payload);
        if (error) { setStatus("오류: " + error.message); return; }
        setStatus("✓ 저장 완료");
        startNew();
        await load();
        setTimeout(() => setStatus(null), 2000);
    };

    const remove = async (id: string) => {
        if (!confirm("삭제할까요?")) return;
        const sb = createClient();
        const { error } = await sb.from("academy_reviews").delete().eq("id", id);
        if (!error) await load();
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>
                실제 리뷰 관리
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
                네이버/구글/카카오맵에서 복사한 리뷰를 이곳에 저장하면 홈페이지 Reviews 섹션에 즉시 반영됩니다.
                <br />작성자 이름은 개인정보 보호를 위해 이니셜로 입력 (예: "김OO 학부모")
            </p>

            {/* 편집 폼 */}
            <div style={{
                padding: 20, marginBottom: 24, borderRadius: 12,
                background: "#f8fafc", border: "1px solid #e2e8f0",
            }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#334155", margin: "0 0 12px" }}>
                    {editing ? "리뷰 수정" : "새 리뷰 추가"}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as any })}
                        style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                        {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
                        style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{"★".repeat(r)} ({r})</option>)}
                    </select>
                    <input type="text" placeholder="작성자 (예: 김OO 학부모)" value={form.author}
                        onChange={e => setForm({ ...form, author: e.target.value })}
                        style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }} />
                    <input type="date" value={form.review_date}
                        onChange={e => setForm({ ...form, review_date: e.target.value })}
                        style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }} />
                </div>
                <textarea placeholder="리뷰 내용" value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 12, boxSizing: "border-box" }} />
                <textarea placeholder="학원 답글 (선택)" value={form.reply || ""}
                    onChange={e => setForm({ ...form, reply: e.target.value })}
                    style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, fontFamily: "inherit", resize: "vertical", marginBottom: 12, boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={save} style={{ padding: "8px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        {editing ? "수정 저장" : "추가"}
                    </button>
                    {editing && (
                        <button onClick={startNew} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            취소
                        </button>
                    )}
                    {status && <span style={{ fontSize: 12, color: status.startsWith("오류") ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{status}</span>}
                </div>
            </div>

            {/* 리뷰 리스트 */}
            <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#334155", margin: "0 0 12px" }}>
                    등록된 리뷰 ({reviews.length})
                </h3>
                {loading ? (
                    <div style={{ padding: 20, color: "#94a3b8", fontSize: 12 }}>로드 중...</div>
                ) : reviews.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "2px dashed #cbd5e1", borderRadius: 12, color: "#64748b" }}>
                        아직 등록된 리뷰가 없습니다. 위 폼에서 첫 리뷰를 추가하세요.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {reviews.map(r => {
                            const meta = PLATFORMS.find(p => p.id === r.platform);
                            return (
                                <div key={r.id} style={{
                                    padding: 16, background: "#fff", border: "1px solid #e2e8f0",
                                    borderRadius: 10, display: "flex", gap: 16, alignItems: "flex-start",
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                            <span style={{
                                                padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                                                background: (meta?.color || "#cbd5e1") + "20", color: meta?.color || "#64748b",
                                            }}>
                                                {meta?.name || r.platform}
                                            </span>
                                            <span style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.author} · {r.review_date}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{r.content}</div>
                                        {r.reply && (
                                            <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef3c7", borderRadius: 6, fontSize: 12, color: "#78350f" }}>
                                                <strong>답글:</strong> {r.reply}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                                        <button onClick={() => startEdit(r)}
                                            style={{ padding: "4px 12px", background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                            수정
                                        </button>
                                        <button onClick={() => remove(r.id)}
                                            style={{ padding: "4px 12px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
