"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { hapticLight, hapticMedium } from "./components/ui/haptic";
import { PARENT_VERIFIED_KEY, writeAllowedStudentNames } from "@/lib/parent-client-auth";

interface Props {
    onNameSet: (name: string) => void;
}

export default function ParentNameGate({ onNameSet }: Props) {
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);

    const submit = async () => {
        const studentName = name.trim().replace(/\s+/g, "");
        const parentPin = pin.replace(/\D/g, "").slice(0, 5);

        if (studentName.length < 2 || parentPin.length !== 5 || loading) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/parent/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: studentName, pin: parentPin }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "학생 이름 또는 학부모 인증번호가 맞지 않습니다.");
            }

            hapticLight();
            const allowedStudents = Array.isArray(data.allowedStudents) && data.allowedStudents.length > 0
                ? data.allowedStudents.map((item: unknown) => String(item || "").trim()).filter(Boolean)
                : [studentName];
            writeAllowedStudentNames(allowedStudents);
            localStorage.setItem(PARENT_VERIFIED_KEY, "true");
            onNameSet(data.studentName || studentName);
        } catch (err) {
            hapticMedium();
            setError(err instanceof Error ? err.message : "인증 중 오류가 발생했습니다.");
            setShake(true);
            setTimeout(() => setShake(false), 460);
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = name.trim().length >= 2 && pin.length === 5 && !loading;

    return (
        <div style={pageStyle}>
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ width: "100%", maxWidth: 420 }}
            >
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <Image
                        src="/images/logo-codingssok.png"
                        alt="코딩쏙"
                        width={132}
                        height={42}
                        style={{ objectFit: "contain", margin: "0 auto 20px" }}
                        priority
                    />
                    <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
                        학부모 포털
                        <br />
                        자녀의 학습 현황을 확인하려면 정보를 입력해주세요.
                    </div>
                </div>

                <motion.div animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}>
                    <div style={cardStyle}>
                        <label style={labelStyle} htmlFor="parent-student-name">
                            학생 이름
                        </label>
                        <input
                            id="parent-student-name"
                            value={name}
                            onChange={event => {
                                setName(event.target.value);
                                setError("");
                            }}
                            onKeyDown={event => {
                                if (event.key === "Enter") void submit();
                            }}
                            autoFocus
                            aria-label="학생 이름"
                            style={inputStyle}
                        />

                        <label style={{ ...labelStyle, marginTop: 18 }} htmlFor="parent-pin">
                            학부모 인증번호
                        </label>
                        <input
                            id="parent-pin"
                            type="tel"
                            inputMode="numeric"
                            value={pin}
                            onChange={event => {
                                setPin(event.target.value.replace(/\D/g, "").slice(0, 5));
                                setError("");
                            }}
                            onKeyDown={event => {
                                if (event.key === "Enter") void submit();
                            }}
                            aria-label="학부모 인증번호"
                            maxLength={5}
                            style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.28em", fontWeight: 900 }}
                        />

                        {error && (
                            <div style={errorStyle}>
                                <span style={errorMarkStyle}>!</span>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={() => void submit()}
                            disabled={!canSubmit}
                            style={{
                                ...submitButtonStyle,
                                background: canSubmit ? "linear-gradient(135deg, #111827, #020617)" : "#dbe3ef",
                                color: canSubmit ? "#ffffff" : "#8a98aa",
                                cursor: canSubmit ? "pointer" : "default",
                            }}
                        >
                            {loading ? "확인 중..." : "시작하기"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

const pageStyle: CSSProperties = {
    minHeight: "100dvh",
    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 48%, #eef6ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 20px",
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
};

const cardStyle: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #dbe5f2",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)",
};

const labelStyle: CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    color: "#26364d",
    marginBottom: 8,
};

const inputStyle: CSSProperties = {
    width: "100%",
    height: 54,
    border: "1px solid #dbe5f2",
    borderRadius: 14,
    padding: "0 15px",
    background: "#f9fbff",
    color: "#0f172a",
    fontSize: 16,
    fontWeight: 800,
    outline: "none",
    fontFamily: "inherit",
};

const errorStyle: CSSProperties = {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#ef4444",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.5,
};

const submitButtonStyle: CSSProperties = {
    marginTop: 20,
    width: "100%",
    minHeight: 54,
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 900,
    fontFamily: "inherit",
};

const errorMarkStyle: CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#ef4444",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
    flexShrink: 0,
};
