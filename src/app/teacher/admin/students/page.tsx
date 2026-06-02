"use client";

/**
 * 학생 계정 관리 — 관리자 승인/거부/탈퇴
 * /teacher/admin/students
 */

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface Student {
    id: string;
    name: string;
    grade: string | null;
    pin: string;
    status: string;
    created_at: string;
    auth_user_id: string | null;
}

type FilterStatus = "all" | "pending" | "approved" | "deactivated" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "승인 대기", color: "#f59e0b", bg: "#fffbeb" },
    approved: { label: "승인됨", color: "#22c55e", bg: "#f0fdf4" },
    deactivated: { label: "비활성화", color: "#ef4444", bg: "#fef2f2" },
    rejected: { label: "거절됨", color: "#64748b", bg: "#f8fafc" },
};

export default function StudentManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const sb = createClient();
        let q = sb.from("students").select("*").order("created_at", { ascending: false });
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        setStudents((data as Student[]) || []);
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const updateStatus = async (studentId: string, newStatus: string) => {
        setActionLoading(studentId);
        const sb = createClient();
        await sb.from("students").update({ status: newStatus }).eq("id", studentId);
        await fetchStudents();
        setActionLoading(null);
    };

    const pendingCount = students.filter(s => s.status === "pending").length;

    return (
        <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                    학생 계정 관리
                </h1>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                    가입 승인, 계정 비활성화, 재승인을 관리합니다.
                </p>
            </div>

            {/* 승인 대기 배너 */}
            {pendingCount > 0 && (
                <div style={{
                    padding: "14px 20px", borderRadius: 12, marginBottom: 20,
                    background: "#fffbeb", border: "1.5px solid #fde68a",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>notification_important</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                        승인 대기 중인 학생이 {pendingCount}명 있습니다
                    </span>
                </div>
            )}

            {/* 필터 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {(["all", "pending", "approved", "deactivated", "rejected"] as FilterStatus[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "8px 16px", borderRadius: 10, border: "none",
                            background: filter === f ? "#2563eb" : "#f1f5f9",
                            color: filter === f ? "#fff" : "#64748b",
                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}
                    >
                        {f === "all" ? "전체" : STATUS_CONFIG[f]?.label || f}
                        {f === "pending" && pendingCount > 0 && (
                            <span style={{
                                marginLeft: 6, padding: "2px 6px", borderRadius: 6,
                                background: filter === f ? "rgba(255,255,255,0.3)" : "#f59e0b",
                                color: "#fff", fontSize: 10, fontWeight: 800,
                            }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* 학생 목록 */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>로딩 중...</div>
            ) : students.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    {filter === "all" ? "등록된 학생이 없습니다." : `${STATUS_CONFIG[filter]?.label || filter} 상태 학생이 없습니다.`}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {students.map(s => {
                        const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                        const isActing = actionLoading === s.id;
                        return (
                            <div key={s.id} style={{
                                padding: "16px 20px", borderRadius: 14,
                                background: "#fff", border: "1px solid #e2e8f0",
                                display: "flex", alignItems: "center", gap: 14,
                                opacity: isActing ? 0.6 : 1,
                            }}>
                                {/* 아바타 */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}40)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 16, fontWeight: 900, color: cfg.color,
                                }}>
                                    {s.name.charAt(0)}
                                </div>

                                {/* 정보 */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{s.name}</span>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 6,
                                            fontSize: 10, fontWeight: 700,
                                            background: cfg.bg, color: cfg.color,
                                        }}>
                                            {cfg.label}
                                        </span>
                                        {s.grade && <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.grade}</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                        가입: {s.created_at?.slice(0, 10)} · PIN: {s.pin}
                                    </div>
                                </div>

                                {/* 액션 버튼 */}
                                <div style={{ display: "flex", gap: 6 }}>
                                    {s.status === "pending" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(s.id, "approved")}
                                                disabled={isActing}
                                                style={{
                                                    padding: "6px 14px", borderRadius: 8, border: "none",
                                                    background: "#22c55e", color: "#fff",
                                                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                                                }}
                                            >
                                                승인
                                            </button>
                                            <button
                                                onClick={() => updateStatus(s.id, "rejected")}
                                                disabled={isActing}
                                                style={{
                                                    padding: "6px 14px", borderRadius: 8, border: "none",
                                                    background: "#f1f5f9", color: "#64748b",
                                                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                                                }}
                                            >
                                                거절
                                            </button>
                                        </>
                                    )}
                                    {s.status === "approved" && (
                                        <button
                                            onClick={() => updateStatus(s.id, "deactivated")}
                                            disabled={isActing}
                                            style={{
                                                padding: "6px 14px", borderRadius: 8, border: "none",
                                                background: "#fef2f2", color: "#ef4444",
                                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                            }}
                                        >
                                            비활성화
                                        </button>
                                    )}
                                    {(s.status === "deactivated" || s.status === "rejected") && (
                                        <button
                                            onClick={() => updateStatus(s.id, "approved")}
                                            disabled={isActing}
                                            style={{
                                                padding: "6px 14px", borderRadius: 8, border: "none",
                                                background: "#eff6ff", color: "#2563eb",
                                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                            }}
                                        >
                                            재승인
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
