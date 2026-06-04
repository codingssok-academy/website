"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { hapticLight, hapticMedium } from "./components/ui/haptic";

const ACADEMY_CODE = "74123";
const CODE_VERIFIED_KEY = "codingssok_code_verified";

interface Props {
    onNameSet: (name: string) => void;
}

export default function ParentNameGate({ onNameSet }: Props) {
    const [step, setStep] = useState<"code" | "name">(() => {
        if (typeof window !== "undefined" && localStorage.getItem(CODE_VERIFIED_KEY) === "true") {
            return "name";
        }
        return "code";
    });
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);

    const handleCodeSubmit = () => {
        if (code.trim() === ACADEMY_CODE) {
            hapticLight();
            localStorage.setItem(CODE_VERIFIED_KEY, "true");
            setError("");
            setStep("name");
        } else {
            hapticMedium();
            setError("학원 코드가 올바르지 않습니다.");
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleNameSubmit = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/parent/lookup?name=${encodeURIComponent(trimmed)}`, {
                cache: "no-store",
            });
            const data = await res.json();
            if (data.found) {
                hapticLight();
                onNameSet(trimmed);
            } else {
                hapticMedium();
                setError(data.message || `"${trimmed}" 학생을 찾을 수 없습니다.`);
            }
        } catch {
            setError("서버 연결 오류. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100dvh",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 20px",
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ width: "100%", maxWidth: 400 }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <Image
                        src="/images/logo-codingssok.png"
                        alt="코딩쏙"
                        width={140}
                        height={44}
                        style={{ objectFit: "contain", margin: "0 auto 16px" }}
                        priority
                    />
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>
                        학부모 포털
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                        {step === "code"
                            ? <>학원에서 부여받은 접근 코드를<br />입력해주세요.</>
                            : <>자녀의 학습 현황을 확인하려면<br />학생 이름을 입력해주세요.</>
                        }
                    </div>
                </div>

                {/* Step indicator */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                    {["code", "name"].map((s, i) => (
                        <div key={s} style={{
                            width: step === s ? 24 : 8, height: 8, borderRadius: 999,
                            background: step === s ? "#2563eb" : s === "code" && step === "name" ? "#22c55e" : "#e2e8f0",
                            transition: "all 0.3s",
                        }} />
                    ))}
                </div>

                {/* Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: step === "name" ? 40 : -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: step === "name" ? -40 : 40 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            background: "#fff",
                            borderRadius: 24,
                            padding: "28px 24px",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                            border: "1px solid rgba(226,232,240,0.6)",
                        }}
                    >
                        {step === "code" ? (
                            <>
                                <label htmlFor="code-input" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                                    학원 접근 코드
                                </label>
                                <motion.div animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}>
                                    <input
                                        id="code-input"
                                        type="tel"
                                        inputMode="numeric"
                                        value={code}
                                        onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                                        onKeyDown={e => { if (e.key === "Enter") handleCodeSubmit(); }}
                                        placeholder="코드 입력"
                                        autoFocus
                                        maxLength={6}
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px",
                                            borderRadius: 14,
                                            border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                                            fontSize: 24,
                                            fontWeight: 800,
                                            color: "#0f172a",
                                            background: "#fafbfc",
                                            outline: "none",
                                            fontFamily: "inherit",
                                            boxSizing: "border-box",
                                            textAlign: "center",
                                            letterSpacing: "0.3em",
                                            transition: "border-color 0.15s",
                                        }}
                                    />
                                </motion.div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>error</span>
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    onClick={handleCodeSubmit}
                                    disabled={code.length < 3}
                                    style={{
                                        marginTop: 16, width: "100%", padding: "15px", borderRadius: 14, border: "none",
                                        background: code.length >= 3 ? "#1a1a1a" : "#e2e8f0",
                                        color: code.length >= 3 ? "#fff" : "#94a3b8",
                                        fontSize: 15, fontWeight: 800, cursor: code.length >= 3 ? "pointer" : "default",
                                        fontFamily: "inherit", minHeight: 52, transition: "background 0.2s",
                                    }}
                                >
                                    확인
                                </button>
                            </>
                        ) : (
                            <>
                                <label htmlFor="student-name-input" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                                    학생 이름
                                </label>
                                <input
                                    id="student-name-input"
                                    type="text"
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError(""); }}
                                    onKeyDown={e => { if (e.key === "Enter") handleNameSubmit(); }}
                                    placeholder="자녀 이름"
                                    autoFocus
                                    style={{
                                        width: "100%", padding: "14px 16px", borderRadius: 14,
                                        border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                                        fontSize: 16, fontWeight: 600, color: "#0f172a", background: "#fafbfc",
                                        outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                                        transition: "border-color 0.15s",
                                    }}
                                />

                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>error</span>
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    onClick={handleNameSubmit}
                                    disabled={loading || name.trim().length < 2}
                                    style={{
                                        marginTop: 16, width: "100%", padding: "15px", borderRadius: 14, border: "none",
                                        background: name.trim().length >= 2 ? "#1a1a1a" : "#e2e8f0",
                                        color: name.trim().length >= 2 ? "#fff" : "#94a3b8",
                                        fontSize: 15, fontWeight: 800,
                                        cursor: name.trim().length >= 2 ? "pointer" : "default",
                                        fontFamily: "inherit", minHeight: 52, transition: "background 0.2s",
                                    }}
                                >
                                    {loading ? "확인 중..." : "시작하기"}
                                </button>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                    {step === "code"
                        ? "접근 코드는 학원에서 안내드립니다."
                        : <>이름은 이 기기에만 저장되며<br />언제든지 설정에서 변경할 수 있습니다.</>
                    }
                </p>
            </motion.div>
        </div>
    );
}
