"use client";

/**
 * 숙제 채점 — Notion 과제 + Supabase 숙제 통합
 * /teacher/admin/homework
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

interface Homework {
    id: string;
    source: "supabase" | "notion";
    student_name: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    assigned_at: string;
    completed_at: string | null;
    files?: { name: string; url: string; type: string }[];
}

export default function HomeworkAdminPage() {
    const [students, setStudents] = useState<string[]>([]);
    const [activeStudent, setActiveStudent] = useState("");
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [tab, setTab] = useState<"pending" | "completed">("pending");
    const [completing, setCompleting] = useState<string | null>(null);
    const [toast, setToast] = useState("");

    // 학생 목록 로드
    useEffect(() => {
        (async () => {
            try {
                const sb = createClient();
                const { data } = await sb
                    .from("students")
                    .select("name")
                    .order("name");
                const names = (data || [])
                    .map((s: any) => s.name)
                    .filter((n: string) => n && /^[가-힣]{2,4}$/.test(n));
                setStudents(names);
                // 전체 보기로 시작
                setActiveStudent("");
            } catch { /* ignore */ }
            setStudentsLoading(false);
        })();
    }, []);

    // 학생 선택 시 숙제 로드 (빈 문자열 = 전체)
    const loadHomeworks = useCallback(async (name: string) => {
        setLoading(true);
        try {
            // 전체 or 학생별
            const hwUrl = name
                ? `/api/homework?student_name=${encodeURIComponent(name)}`
                : "/api/homework";
            const fetchJson = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());

            // 전체 모드: all-notion API, 학생 모드: v2 dashboard
            const [hwRes, notionData, compRes] = await Promise.all([
                fetchJson(hwUrl),
                name
                    ? fetchJson(`/api/parent/v2/dashboard?name=${encodeURIComponent(name)}&includeNotion=1&fresh=1`)
                    : fetchJson("/api/homework/all-notion"),
                name
                    ? fetchJson(`/api/homework/complete?student_name=${encodeURIComponent(name)}`)
                    : fetchJson("/api/homework/complete"),
            ]);

            const completedRefs = new Set(compRes.refs || []);

            const supabaseHw: Homework[] = (hwRes.homeworks || []).map((h: any) => ({
                ...h, source: "supabase" as const, files: [],
            }));

            // 전체 모드: notionData.homeworks, 학생 모드: notionData.notionHomeworks
            const rawNotionHw = name ? (notionData.notionHomeworks || []) : (notionData.homeworks || []);
            const notionHw: Homework[] = rawNotionHw.map((n: any) => ({
                id: n.id,
                source: "notion" as const,
                student_name: n.student_name || name,
                title: n.title,
                description: n.description,
                due_date: null,
                status: completedRefs.has(n.id) ? "completed" : "pending",
                assigned_at: n.date || "",
                completed_at: null,
                files: n.files || [],
            }));

            setHomeworks([...supabaseHw, ...notionHw]);
        } catch {
            setHomeworks([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadHomeworks(activeStudent);
    }, [activeStudent, loadHomeworks]);

    const markComplete = useCallback(async (hw: Homework) => {
        setCompleting(hw.id);
        try {
            await fetch("/api/homework/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ref: hw.id, student_name: hw.student_name }),
            });
            setHomeworks(prev => prev.map(h =>
                h.id === hw.id ? { ...h, status: "completed", completed_at: new Date().toISOString() } : h
            ));
            setToast(`${hw.student_name} — "${hw.title}" 완료`);
            setTimeout(() => setToast(""), 3000);
        } catch { /* ignore */ }
        setCompleting(null);
    }, []);

    const pending = homeworks.filter(h => h.status === "pending");
    const completed = homeworks.filter(h => h.status === "completed");
    const displayed = tab === "pending" ? pending : completed;

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        style={{
                            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                            zIndex: 999, padding: "10px 20px", borderRadius: 12,
                            background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700,
                            boxShadow: "0 4px 16px rgba(22,163,106,0.3)",
                        }}
                    >{toast}</motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>숙제 채점</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                    학생을 선택하면 Notion 과제 + 숙제가 표시됩니다
                </p>
            </div>

            {/* 학생 칩 목록 */}
            {studentsLoading ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} style={{ width: 64, height: 36, borderRadius: 999, background: "#f1f5f9" }} />
                    ))}
                </div>
            ) : (
                <div style={{
                    display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap",
                    maxHeight: 120, overflowY: "auto",
                    padding: "4px 0",
                }}>
                    {/* 전체 보기 칩 */}
                    <motion.button
                        onClick={() => setActiveStudent("")}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: "8px 16px", borderRadius: 999, border: "none",
                            background: activeStudent === "" ? "#1a1a1a" : "#f5f5f5",
                            color: activeStudent === "" ? "#fff" : "#1a1a1a",
                            fontSize: 13, fontWeight: activeStudent === "" ? 700 : 500,
                            cursor: "pointer", fontFamily: "inherit",
                        }}
                    >
                        전체
                    </motion.button>
                    {students.map(name => {
                        const isActive = activeStudent === name;
                        return (
                            <motion.button
                                key={name}
                                onClick={() => setActiveStudent(name)}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    padding: "8px 16px", borderRadius: 999, border: "none",
                                    background: isActive ? "#2563eb" : "#f1f5f9",
                                    color: isActive ? "#fff" : "#334155",
                                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                                    cursor: "pointer", fontFamily: "inherit",
                                    transition: "all 0.15s",
                                }}
                            >
                                {name}
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* 현재 필터 표시 */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderRadius: 12,
                background: "#fafafa", border: "1px solid #e5e5e5",
                marginBottom: 16,
            }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                    {activeStudent || "전체 학생"}
                </span>
                <span style={{ fontSize: 12, color: "#a3a3a3" }}>
                    {homeworks.length}개 · 대기 {pending.length}개
                </span>
            </div>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
                {([
                    { id: "pending" as const, label: `채점 대기 ${pending.length}`, icon: "pending" },
                    { id: "completed" as const, label: `완료 ${completed.length}`, icon: "check_circle" },
                ]).map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        flex: 1, padding: "10px 8px", borderRadius: 8, border: "none",
                        background: tab === t.id ? "#fff" : "transparent",
                        color: tab === t.id ? "#0f172a" : "#64748b",
                        fontSize: 13, fontWeight: tab === t.id ? 800 : 500, cursor: "pointer",
                        boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        fontFamily: "inherit",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 숙제 목록 */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{ height: 90, borderRadius: 14, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
                    ))}
                    <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>
                </div>
            ) : displayed.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1", display: "block", marginBottom: 12 }}>
                        {tab === "pending" ? "task_alt" : "assignment"}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>
                        {tab === "pending" ? `${activeStudent} 학생의 대기 숙제 없음` : "완료된 숙제가 없습니다"}
                    </div>
                    {tab === "pending" && (
                        <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 8 }}>
                            Notion 피드백에 "과제" 섹션이 있으면 자동으로 표시됩니다
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {displayed.map((hw, idx) => (
                        <motion.div
                            key={hw.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            style={{
                                background: "#fff",
                                border: `1px solid ${hw.status === "completed" ? "#bbf7d0" : "#e2e8f0"}`,
                                borderRadius: 14, padding: "16px 18px",
                                borderLeft: `4px solid ${hw.source === "notion" ? "#3b82f6" : hw.status === "completed" ? "#22c55e" : "#f59e0b"}`,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                        <span style={{
                                            padding: "1px 7px", borderRadius: 999, fontSize: 9, fontWeight: 700,
                                            background: hw.source === "notion" ? "#dbeafe" : "#f1f5f9",
                                            color: hw.source === "notion" ? "#2563eb" : "#64748b",
                                        }}>{hw.source === "notion" ? "Notion 과제" : "직접출제"}</span>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                                        {hw.title}
                                    </div>
                                    {hw.description && (
                                        <div style={{
                                            fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 6,
                                            background: "#f8fafc", borderRadius: 8, padding: "8px 10px",
                                        }}>
                                            {hw.description.length > 200 ? hw.description.slice(0, 200) + "..." : hw.description}
                                        </div>
                                    )}
                                    {hw.files && hw.files.length > 0 && (
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                                            {hw.files.map((f, i) => (
                                                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: 3,
                                                        padding: "3px 8px", borderRadius: 6,
                                                        background: "#f5f3ff", color: "#7c3aed",
                                                        fontSize: 11, fontWeight: 600, textDecoration: "none",
                                                    }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                                                        {f.type === "pdf" ? "picture_as_pdf" : f.type === "image" ? "image" : "attach_file"}
                                                    </span>
                                                    {f.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                        {hw.assigned_at?.slice(0, 10)}
                                        {hw.status === "completed" && hw.completed_at && ` · 완료: ${hw.completed_at.slice(0, 10)}`}
                                    </div>
                                </div>

                                {hw.status === "pending" ? (
                                    <motion.button
                                        onClick={() => markComplete(hw)}
                                        disabled={completing === hw.id}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: "10px 20px", borderRadius: 10, border: "none",
                                            background: completing === hw.id ? "#d1d5db" : "linear-gradient(135deg, #22c55e, #16a34a)",
                                            color: "#fff", fontSize: 13, fontWeight: 800,
                                            cursor: completing === hw.id ? "wait" : "pointer",
                                            display: "flex", alignItems: "center", gap: 4,
                                            boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
                                            fontFamily: "inherit", flexShrink: 0,
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                                            {completing === hw.id ? "hourglass_empty" : "check"}
                                        </span>
                                        {completing === hw.id ? "처리 중" : "완료"}
                                    </motion.button>
                                ) : (
                                    <span style={{
                                        padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                                        background: "#dcfce7", color: "#166534",
                                        display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        완료
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
