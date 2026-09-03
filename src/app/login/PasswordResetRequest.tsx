"use client";

import { useState } from "react";

interface PasswordResetRequestProps {
  studentName: string;
  disabled?: boolean;
}

export default function PasswordResetRequest({ studentName, disabled = false }: PasswordResetRequestProps) {
  const [open, setOpen] = useState(false);
  const [parentCode, setParentCode] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const sendRequest = async () => {
    const name = studentName.trim().replace(/\s+/g, "");
    if (!name) {
      setNotice({ ok: false, text: "위에 학생 이름을 먼저 입력해주세요." });
      return;
    }
    if (!/^\d{5}$/.test(parentCode)) {
      setNotice({ ok: false, text: "학부모 인증번호 숫자 5자리를 입력해주세요." });
      return;
    }

    setSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/student/password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentCode }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "요청을 보내지 못했습니다.");
      }
      setNotice({ ok: true, text: result.message });
      setParentCode("");
    } catch (error) {
      setNotice({
        ok: false,
        text: error instanceof Error ? error.message : "요청을 보내지 못했습니다.",
      });
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        style={{
          border: "none",
          background: "transparent",
          color: "#475569",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "underline",
          textUnderlineOffset: 4,
          cursor: disabled ? "not-allowed" : "pointer",
          padding: "4px 8px",
        }}
      >
        비밀번호를 잊었나요? 선생님께 요청하기
      </button>
    );
  }

  return (
    <section
      aria-label="비밀번호 변경 요청"
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 16,
        background: "#f8fbff",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <strong style={{ display: "block", color: "#1e3a8a", fontSize: 14, marginBottom: 4 }}>
            선생님께 새 비밀번호 요청하기
          </strong>
          <span style={{ display: "block", color: "#64748b", fontSize: 12, lineHeight: 1.55 }}>
            학원에서 받은 학부모 인증번호로 학생을 확인합니다.
          </span>
        </div>
        <button
          type="button"
          aria-label="비밀번호 요청 닫기"
          onClick={() => {
            setOpen(false);
            setNotice(null);
            setParentCode("");
          }}
          style={{ border: 0, background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 20 }}
        >
          ×
        </button>
      </div>

      <label htmlFor="password-request-parent-code" style={{ display: "block", marginTop: 14 }}>
        <span style={{ display: "block", color: "#334155", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
          학부모 인증번호 5자리
        </span>
        <input
          id="password-request-parent-code"
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          value={parentCode}
          onChange={event => {
            setParentCode(event.target.value.replace(/\D/g, "").slice(0, 5));
            setNotice(null);
          }}
          placeholder="숫자 5자리"
          maxLength={5}
          disabled={sending || disabled}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1.5px solid #bfdbfe",
            borderRadius: 12,
            background: "#fff",
            padding: "12px 14px",
            textAlign: "center",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "0.18em",
            color: "#0f172a",
          }}
        />
      </label>

      {notice && (
        <p
          role="status"
          style={{
            margin: "10px 0 0",
            color: notice.ok ? "#047857" : "#dc2626",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {notice.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => void sendRequest()}
        disabled={sending || disabled}
        style={{
          width: "100%",
          marginTop: 12,
          border: 0,
          borderRadius: 12,
          background: "#1e40af",
          color: "#fff",
          padding: "12px 14px",
          fontSize: 13,
          fontWeight: 800,
          cursor: sending || disabled ? "not-allowed" : "pointer",
          opacity: sending || disabled ? 0.65 : 1,
        }}
      >
        {sending ? "요청 보내는 중..." : "선생님께 요청 보내기"}
      </button>
      <p style={{ margin: "9px 0 0", color: "#64748b", fontSize: 11, lineHeight: 1.5, textAlign: "center" }}>
        비밀번호는 자동으로 바뀌지 않습니다. 선생님이 새 비밀번호를 알려드립니다.
      </p>
    </section>
  );
}
