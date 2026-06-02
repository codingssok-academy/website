"use client";

/**
 * 학생 숙제 목록
 * /dashboard/learning/homework
 */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Homework {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    assigned_at: string;
    completed_at: string | null;
}

export default function StudentHomeworkPage() {
    const { user } = useAuth();
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user) return;
        const name = user.name || user.email?.split("@")[0] || "";
        if (!name) return;
        setLoading(true);
        const res = await fetch(`/api/homework?student_name=${encodeURIComponent(name)}`);
        const data = await res.json();
        setHomeworks(data.homeworks || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const complete = useCallback(async (id: string) => {
        await fetch("/api/homework", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: "completed" }),
        });
        await load();
    }, [load]);

    const pending = homeworks.filter(h => h.status === "pending");
    const done = homeworks.filter(h => h.status === "completed");

    return (
        <div style={{
            minHeight: "100vh", background: "#f8fafc",
            fontFamily: "'Pretendard', sans-serif",
        }}>
            <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
                <Link href="/dashboard/learning" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 700 }}>
                    ← 학습 홈
                </Link>

                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "16px 0 8px" }}>내 숙제</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
                    선생님이 내준 숙제를 확인하고 완료 체크하세요.
                </p>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>로딩 중...</div>
                ) : homeworks.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: 60, background: "#fff",
                        borderRadius: 16, border: "1px solid #e2e8f0",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1", display: "block", marginBottom: 12 }}>task_alt</span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#475569" }}>숙제가 없어요</div>
                        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>선생님이 숙제를 내면 여기에 표시됩니다.</div>
                    </div>
                ) : (
                    <>
                        {/* 미완료 */}
                        {pending.length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                                    미완료 ({pending.length})
                                </h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {pending.map((hw, i) => (
                                        <motion.div
                                            key={hw.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{
                                                padding: "16px 18px", background: "#fff",
                                                borderRadius: 14, border: "2px solid #fbbf24",
                                                boxShadow: "0 2px 8px rgba(245,158,11,0.08)",
                                                display: "flex", alignItems: "center", gap: 14,
                                            }}
                                        >
                                            <button
                                                onClick={() => complete(hw.id)}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8,
                                                    border: "2px solid #cbd5e1", background: "#fff",
                                                    cursor: "pointer", display: "flex",
                                                    alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#cbd5e1" }}>check</span>
                                            </button>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{hw.title}</div>
                                                {hw.description && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{hw.description}</div>}
                                            </div>
                                            {hw.due_date && (
                                                <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>
                                                    {hw.due_date}
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 완료 */}
                        {done.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#94a3b8", marginBottom: 12 }}>
                                    완료 ({done.length})
                                </h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {done.map(hw => (
                                        <div key={hw.id} style={{
                                            padding: "12px 18px", background: "#f8fafc",
                                            borderRadius: 12, border: "1px solid #e2e8f0",
                                            display: "flex", alignItems: "center", gap: 12,
                                            opacity: 0.7,
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#22c55e", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textDecoration: "line-through" }}>{hw.title}</div>
                                            </div>
                                            <span style={{ fontSize: 10, color: "#94a3b8" }}>{hw.completed_at?.slice(0, 10)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
