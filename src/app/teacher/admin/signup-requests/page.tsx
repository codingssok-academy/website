"use client";

/**
 * 학생 가입 요청 승인 페이지
 * /teacher/admin/signup-requests
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SignupRequest {
    id: string;
    name: string;
    role: string;
    birthDate: string | null;
    createdAt: string;
    email: string | null;
}

function formatRole(role: string): string {
    switch (role) {
        case "student": return "학생";
        case "parent": return "학부모";
        case "teacher": return "교사";
        case "admin": return "관리자";
        default: return role;
    }
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${mm}.${dd} ${hh}:${mi}`;
    } catch { return iso; }
}

function formatBirth(b: string | null): string {
    if (!b) return "—";
    return b.slice(0, 10);
}

export default function SignupRequestsPage() {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/teacher/signup-requests");
            const data = await res.json();
            setRequests(data.requests || []);
        } catch {
            setRequests([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAction = useCallback(async (userId: string, action: "approve" | "reject", name: string) => {
        if (action === "reject" && !confirm(`"${name}" 학생의 가입을 거절하시겠어요?`)) return;
        setProcessing(userId);
        try {
            const res = await fetch("/api/teacher/signup-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action }),
            });
            if (!res.ok) throw new Error();
            setRequests(prev => prev.filter(r => r.id !== userId));
            setToast({
                msg: action === "approve" ? `"${name}" 승인 완료! 이제 로그인 가능` : `"${name}" 가입 거절됨`,
                type: "success",
            });
            setTimeout(() => setToast(null), 3500);
        } catch {
            setToast({ msg: "처리 실패. 잠시 후 다시 시도해주세요.", type: "error" });
            setTimeout(() => setToast(null), 3500);
        }
        setProcessing(null);
    }, []);

    return (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        style={{
                            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                            zIndex: 999, padding: "10px 20px", borderRadius: 12,
                            background: toast.type === "success" ? "#16a34a" : "#dc2626",
                            color: "#fff", fontSize: 13, fontWeight: 700,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        }}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    가입 요청 관리
                </h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                    학생이 회원가입하면 여기에 표시돼요. 승인하면 바로 로그인 가능합니다.
                </p>
            </div>

            {/* 상단 통계 */}
            <div style={{
                display: "flex", gap: 10, marginBottom: 20,
            }}>
                <div style={{
                    flex: 1, padding: "16px 20px", borderRadius: 14,
                    background: requests.length > 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#f1f5f9",
                    color: requests.length > 0 ? "#fff" : "#64748b",
                    display: "flex", alignItems: "center", gap: 14,
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: 28, fontVariationSettings: "'FILL' 1",
                    }}>
                        {requests.length > 0 ? "person_add" : "check_circle"}
                    </span>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                            {requests.length}명
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2, fontWeight: 600 }}>
                            {requests.length > 0 ? "승인 대기 중" : "대기 중인 요청 없음"}
                        </div>
                    </div>
                </div>
            </div>

            {/* 요청 목록 */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            height: 90, borderRadius: 14, background: "#f1f5f9",
                            animation: "pulse 1.5s infinite",
                        }} />
                    ))}
                    <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>
                </div>
            ) : requests.length === 0 ? (
                <div style={{
                    padding: "80px 20px", textAlign: "center",
                    background: "#fff", borderRadius: 16, border: "2px dashed #e2e8f0",
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: 56, color: "#cbd5e1", display: "block", marginBottom: 12,
                    }}>
                        inbox
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>
                        새 가입 요청이 없습니다
                    </div>
                    <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                        학생이 회원가입하면 여기에 표시돼요.
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <AnimatePresence>
                        {requests.map((r, idx) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                style={{
                                    background: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderLeft: "4px solid #f59e0b",
                                    borderRadius: 14,
                                    padding: "16px 20px",
                                    display: "flex", alignItems: "center", gap: 14,
                                }}
                            >
                                {/* 아바타 */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: "linear-gradient(135deg, #2563eb, #1e40af)",
                                    color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 18, fontWeight: 900,
                                    flexShrink: 0,
                                }}>
                                    {r.name.slice(0, 1)}
                                </div>

                                {/* 정보 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                                            {r.name}
                                        </span>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 999,
                                            fontSize: 10, fontWeight: 700,
                                            background: "#dbeafe", color: "#1d4ed8",
                                        }}>
                                            {formatRole(r.role)}
                                        </span>
                                    </div>
                                    <div style={{
                                        display: "flex", gap: 12,
                                        fontSize: 11, color: "#64748b",
                                    }}>
                                        <span>생년월일: <strong>{formatBirth(r.birthDate)}</strong></span>
                                        <span>·</span>
                                        <span>요청: <strong>{formatDate(r.createdAt)}</strong></span>
                                    </div>
                                </div>

                                {/* 액션 */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <motion.button
                                        onClick={() => handleAction(r.id, "approve", r.name)}
                                        disabled={processing === r.id}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: "10px 18px", borderRadius: 10, border: "none",
                                            background: processing === r.id ? "#d1d5db" : "linear-gradient(135deg, #22c55e, #16a34a)",
                                            color: "#fff", fontSize: 13, fontWeight: 800,
                                            cursor: processing === r.id ? "wait" : "pointer",
                                            display: "flex", alignItems: "center", gap: 4,
                                            boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: 16, fontVariationSettings: "'FILL' 1",
                                        }}>
                                            {processing === r.id ? "hourglass_top" : "check"}
                                        </span>
                                        승인
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleAction(r.id, "reject", r.name)}
                                        disabled={processing === r.id}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: "10px 14px", borderRadius: 10,
                                            border: "1px solid #fecaca",
                                            background: "#fff", color: "#dc2626",
                                            fontSize: 12, fontWeight: 700,
                                            cursor: processing === r.id ? "wait" : "pointer",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        거절
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 새로고침 */}
            <div style={{ marginTop: 16, textAlign: "center" }}>
                <button
                    onClick={load}
                    disabled={loading}
                    style={{
                        padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                        background: "#fff", color: "#64748b",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit",
                        display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
                    목록 새로고침
                </button>
            </div>
        </div>
    );
}
