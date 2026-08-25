"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ═══════════════════════════════════════
   코딩쏙 관리자 로그인 — 다크 테마
   /teacher/login
   ═══════════════════════════════════════ */

export default function TeacherLogin() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const nextPath = searchParams.get("next");
    const redirectTarget = nextPath && nextPath.startsWith("/teacher") ? nextPath : "/teacher/admin";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const { createClient } = await import("@/lib/supabase");
            const supabase = createClient();

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            if (authError) {
                setError("이메일 또는 비밀번호가 올바르지 않습니다.");
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", authData.user.id)
                .maybeSingle();

            const hasTeacherRole = profile?.role === "teacher" || profile?.role === "admin";

            if (!hasTeacherRole) {
                await supabase.auth.signOut();
                setError("선생님 권한이 없는 계정입니다.");
                setLoading(false);
                return;
            }

            router.push(redirectTarget);
        } catch {
            setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "#070b14",
            padding: 20, position: "relative", overflow: "hidden",
        }}>
            {/* 배경 글로우 */}
            <div style={{
                position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
                width: 600, height: 600, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: "10%", right: "15%",
                width: 300, height: 300, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 24, padding: "44px 40px",
                    maxWidth: 420, width: "100%",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
                    position: "relative", zIndex: 1,
                }}
            >
                {/* 로고 + 타이틀 */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <motion.img
                        src="/icon.png"
                        alt="코딩쏙"
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
                        style={{
                            width: 60, height: 60, borderRadius: 18, margin: "0 auto 18px",
                            objectFit: "contain",
                            boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
                        }}
                    />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                        코딩쏙
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.04em", margin: 0 }}>
                        관리자 로그인
                    </h1>
                    <p style={{ fontSize: 13, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>
                        선생님 계정으로 접속하세요
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 이메일 */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 7, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            이메일
                        </label>
                        <div style={{ position: "relative" }}>
                            <span className="material-symbols-outlined" style={{
                                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                fontSize: 18, color: "#334155", pointerEvents: "none",
                            }}>mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@codingssok.com"
                                autoComplete="email"
                                style={{
                                    width: "100%", padding: "13px 14px 13px 42px",
                                    borderRadius: 12, fontSize: 14, outline: "none",
                                    background: "#1e293b", border: "1px solid #1e293b",
                                    color: "#e2e8f0", boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={e => (e.target.style.borderColor = "#2563eb")}
                                onBlur={e => (e.target.style.borderColor = "#1e293b")}
                            />
                        </div>
                    </div>

                    {/* 비밀번호 */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 7, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            비밀번호
                        </label>
                        <div style={{ position: "relative" }}>
                            <span className="material-symbols-outlined" style={{
                                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                fontSize: 18, color: "#334155", pointerEvents: "none",
                            }}>lock</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{
                                    width: "100%", padding: "13px 44px 13px 42px",
                                    borderRadius: 12, fontSize: 14, outline: "none",
                                    background: "#1e293b", border: "1px solid #1e293b",
                                    color: "#e2e8f0", boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={e => (e.target.style.borderColor = "#2563eb")}
                                onBlur={e => (e.target.style.borderColor = "#1e293b")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{
                                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                    border: "none", background: "transparent", cursor: "pointer",
                                    color: "#475569", padding: 0, display: "flex",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* 에러 */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -6, height: 0 }}
                                style={{ overflow: "hidden", marginBottom: 16 }}
                            >
                                <div style={{
                                    padding: "11px 14px", borderRadius: 10,
                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                                    fontSize: 13, color: "#f87171", fontWeight: 500,
                                    display: "flex", alignItems: "center", gap: 8,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 제출 버튼 */}
                    <motion.button
                        whileHover={{ scale: loading ? 1 : 1.015 }}
                        whileTap={{ scale: loading ? 1 : 0.975 }}
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "14px", border: "none", borderRadius: 14,
                            background: loading
                                ? "#1e293b"
                                : "linear-gradient(135deg, #1d4ed8 0%, #6366f1 100%)",
                            color: loading ? "#475569" : "#fff",
                            fontSize: 15, fontWeight: 800,
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: loading ? "none" : "0 6px 20px rgba(37,99,235,0.3)",
                            transition: "background 0.2s, box-shadow 0.2s",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: 16, height: 16, borderRadius: "50%",
                                    border: "2px solid rgba(255,255,255,0.2)",
                                    borderTopColor: "#60a5fa",
                                    animation: "spin .7s linear infinite",
                                }} />
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                로그인 중...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                                로그인
                            </>
                        )}
                    </motion.button>
                </form>

                {/* 안내 + 홈 링크 */}
                <div style={{ marginTop: 24, textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "#1e293b", margin: "0 0 12px" }}>
                        Supabase에 등록된 선생님 계정으로만 접근 가능합니다
                    </p>
                    <Link href="/" style={{ fontSize: 13, color: "#334155", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
                        홈으로
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

