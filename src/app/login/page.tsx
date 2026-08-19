"use client";

/* eslint-disable react-hooks/immutability, @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";

/* ── 클라이언트 사이드 Rate Limiting (UX 보호용, 보안 목적 아님) ──
 * PIN 비교는 Supabase 서버에서 처리되므로 PIN 노출 위험 없음.
 * Supabase Auth 자체 rate limit이 서버 보호를 담당.
 * 이 클라이언트 제한은 사용자에게 "너무 많이 시도했다"는 피드백을 주기 위한 용도. */
const LOGIN_ATTEMPTS_KEY = "codingssok_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1분

function checkLoginRateLimit(): { allowed: boolean; remainingMs: number } {
    try {
        const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
        if (!raw) return { allowed: true, remainingMs: 0 };
        const { count, firstAttempt } = JSON.parse(raw);
        const elapsed = Date.now() - firstAttempt;
        if (elapsed > LOCKOUT_MS) {
            localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
            return { allowed: true, remainingMs: 0 };
        }
        if (count >= MAX_ATTEMPTS) {
            return { allowed: false, remainingMs: LOCKOUT_MS - elapsed };
        }
        return { allowed: true, remainingMs: 0 };
    } catch { return { allowed: true, remainingMs: 0 }; }
}

function recordLoginAttempt() {
    try {
        const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
        if (!raw) {
            localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 1, firstAttempt: Date.now() }));
            return;
        }
        const data = JSON.parse(raw);
        if (Date.now() - data.firstAttempt > LOCKOUT_MS) {
            localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 1, firstAttempt: Date.now() }));
        } else {
            data.count++;
            localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
        }
    } catch { /* ignore */ }
}

function clearLoginAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

/* ── 코딩쏙 아카데미 — 이름 + 4자리 비밀번호 로그인 ── */

interface StudentRow {
  id: string;
  name: string;
  school?: string | null;
  grade: string | null;
  class?: string | null;
  avatar: string | null;
  auth_user_id?: string | null;
  status?: string | null;
}

const PRIMARY = "#3b82f6";
const ACCENT = "#2563eb";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [signupOpen, setSignupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinRef0 = useRef<HTMLInputElement>(null);
  const pinRef1 = useRef<HTMLInputElement>(null);
  const pinRef2 = useRef<HTMLInputElement>(null);
  const pinRef3 = useRef<HTMLInputElement>(null);
  const pinRefs = [pinRef0, pinRef1, pinRef2, pinRef3];

  useEffect(() => { inputRef.current?.focus(); }, []);

  const signInStudentAuth = useCallback(async (
    sb: ReturnType<typeof createClient>,
    student: StudentRow,
    currentPin: string,
  ) => {
    const email = buildStudentAuthEmail(student.id);
    const password = buildStudentAuthPassword(student.id, currentPin);

    const signIn = await sb.auth.signInWithPassword({ email, password });
    const authUser = signIn.data.user ?? null;

    if (signIn.error || !authUser) {
      throw new Error("비밀번호가 틀렸습니다.");
    }

    if (student.auth_user_id !== authUser.id) {
      const { error: syncStudentError } = await sb
        .from("students")
        .update({ auth_user_id: authUser.id })
        .eq("id", student.id);
      if (syncStudentError) {
        const message = syncStudentError.message?.toLowerCase() || "";
        const missingBridgeColumn = message.includes("auth_user_id") || message.includes("schema cache");
        if (!missingBridgeColumn) throw syncStudentError;
      }
    }

    await sb
      .from("profiles")
      .update({
        name: student.name,
        display_name: student.name,
      })
      .eq("id", authUser.id);

    return authUser.id;
  }, []);

  /* ── PIN 입력 핸들러 (각 자리별) ── */
  const handlePinDigit = (idx: number, value: string) => {
    if (value && !/^\d$/.test(value)) return; // 숫자만 허용
    const digits = pin.split("");
    while (digits.length < 4) digits.push("");
    digits[idx] = value;
    const newPin = digits.join("");
    setPin(newPin);
    setMsg(null);
    // 자동 포커스 이동
    if (value && idx < 3) {
      pinRefs[idx + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
  };

  const normalizeStudentName = (value: string) => value.trim().replace(/\s+/g, "");

  /* ── 로그인 처리 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = normalizeStudentName(name);
    if (!trimmed) { setMsg({ ok: false, text: "이름을 입력해주세요" }); return; }
    if (pin.length !== 4) { setMsg({ ok: false, text: "비밀번호 4자리를 입력해주세요" }); return; }

    setLoading(true); setMsg(null);

    // Rate Limiting 체크
    const { allowed, remainingMs } = checkLoginRateLimit();
    if (!allowed) {
      setMsg({ ok: false, text: `로그인 시도가 너무 많습니다. ${Math.ceil(remainingMs / 1000)}초 후 다시 시도해주세요.` });
      setLoading(false);
      return;
    }
    recordLoginAttempt();

    try {
      const sb = createClient();
      const response = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, pin }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success || !result?.student || !result?.session) {
        throw new Error(result?.error || "로그인 정보를 확인하지 못했습니다.");
      }

      const sessionResult = await sb.auth.setSession(result.session);
      const authUser = sessionResult.data.user;
      if (sessionResult.error || !authUser) {
        throw new Error("로그인 세션을 저장하지 못했습니다.");
      }

      const matched = result.student as StudentRow;
      clearLoginAttempts();
      loginAs(matched, authUser.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV === 'development') console.error("[Login] error:", err);
      setMsg({ ok: false, text: message });
      if (message.includes("비밀번호")) {
        setPin("");
        pinRefs[0].current?.focus();
      }
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    const trimmed = normalizeStudentName(name);
    const cleanParentCode = parentCode.replace(/\D/g, "").slice(0, 5);
    const cleanSchool = school.trim().slice(0, 40);
    const cleanGrade = grade.trim().slice(0, 20);
    if (!trimmed) { setMsg({ ok: false, text: "학생 이름을 입력해주세요" }); return; }
    if (cleanParentCode.length !== 5) { setMsg({ ok: false, text: "학부모 인증번호 5자리를 입력해주세요" }); return; }
    if (pin.length !== 4) { setMsg({ ok: false, text: "로그인에 사용할 비밀번호 4자리를 정해주세요" }); return; }

    setSignupLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/student/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, parentCode: cleanParentCode, pin, school: cleanSchool, grade: cleanGrade }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "회원가입을 처리하지 못했습니다.");
      }

      const student = data.student as StudentRow;
      const sb = createClient();
      const authUserId = await signInStudentAuth(sb, student, pin);
      clearLoginAttempts();
      loginAs(student, authUserId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV === "development") console.error("[Signup] error:", err);
      setMsg({ ok: false, text: message });
    } finally {
      setSignupLoading(false);
    }
  };

  /* ── 로그인 처리 ── */
  const loginAs = (student: StudentRow, authUserId: string) => {
    const isAdminStudent = student.class?.replace(/\s+/g, "").toLowerCase() === "admin"
      || student.name.replace(/\s+/g, "") === "장민";
    const profile = {
      id: authUserId,
      studentId: student.id,
      name: student.name,
      email: buildStudentAuthEmail(student.id),
      role: isAdminStudent ? "admin" as const : "student" as const,
      school: student.school || undefined,
      grade: student.grade || undefined,
      avatar: student.avatar || undefined,
      level: 1, xp: 0, streak: 0,
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem("codingssok_user", JSON.stringify(profile));
    document.cookie = `codingssok_session=${authUserId}; path=/; max-age=${60 * 60 * 24 * 30}; Secure; SameSite=Lax`;
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    window.location.href = redirect || "/dashboard/learning";
  };

  /* ── PIN digit style ── */
  const pinDigitStyle: React.CSSProperties = {
    width: 52, height: 60, textAlign: "center", fontSize: 24, fontWeight: 800,
    border: "2px solid #e5e7eb", borderRadius: 16, background: "rgba(255,255,255,0.8)",
    color: "#1f2937", outline: "none", transition: "all 0.2s", boxSizing: "border-box",
    letterSpacing: 0, caretColor: PRIMARY,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Pretendard', 'Inter', sans-serif", color: "#0f172a",
      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 30%, #e0f2fe 60%, #f0f9ff 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Google Fonts와 Material Symbols는 layout.tsx의 <head>에서 로드됨 */}

      {/* Background decorations */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: 480, height: 480,
        background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", left: "-8%",
        width: 560, height: 560,
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "10%",
        width: 200, height: 200,
        background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Login Card */}
      <div className="login-card" style={{
        width: "100%", maxWidth: 440, background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        borderRadius: 32, padding: "52px 40px", position: "relative", zIndex: 10,
        boxShadow: "0 32px 80px -12px rgba(59,130,246,0.18), 0 0 0 1px rgba(255,255,255,0.7), 0 1px 0 rgba(255,255,255,0.8)",
        border: "1px solid rgba(255,255,255,0.6)",
        animation: "fadeInUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img
            src="/images/promo/logo-codingssok.png"
            alt="코딩쏙"
            style={{
              width: 72, height: 72, borderRadius: 22, margin: "0 auto 20px",
              objectFit: "contain",
              boxShadow: "0 12px 32px rgba(14,165,233,0.15)",
            }}
          />
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, color: "#0f172a", margin: "0 0 8px" }}>
            코딩<span style={{ color: "#0ea5e9" }}>쏙</span> 아카데미
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
            {signupOpen ? "회원가입 — 이름, 인증번호, 학교 정보를 입력하세요." : "학습 플랫폼 — 이름과 비밀번호로 로그인"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 이름 입력 */}
          <div>
            <label htmlFor="student-name" style={{
              display: "block", fontSize: 13, fontWeight: 600, color: "#374151",
              marginBottom: 8, marginLeft: 4,
            }}>
              이름
            </label>
            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setMsg(null);
                }}
                required
                autoComplete="off"
                placeholder="홍길동"
                style={{
                  display: "block", width: "100%", paddingLeft: 16, paddingRight: 16,
                  paddingTop: 14, paddingBottom: 14, border: "2px solid #e5e7eb",
                  borderRadius: 16, background: "rgba(255,255,255,0.8)", fontSize: 16,
                  color: "#1f2937", outline: "none", transition: "all 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.1)`; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {signupOpen && (
            <>
              <div>
                <label htmlFor="parent-code" style={{
                  display: "block", fontSize: 13, fontWeight: 600, color: "#374151",
                  marginBottom: 8, marginLeft: 4,
                }}>
                  학부모 인증번호
                </label>
                <input
                  id="parent-code"
                  type="tel"
                  inputMode="numeric"
                  value={parentCode}
                  onChange={(e) => {
                    setParentCode(e.target.value.replace(/\D/g, "").slice(0, 5));
                    setMsg(null);
                  }}
                  placeholder="숫자 5자리"
                  maxLength={5}
                  style={{
                    display: "block", width: "100%", paddingLeft: 16, paddingRight: 16,
                    paddingTop: 14, paddingBottom: 14, border: "2px solid #dbeafe",
                    borderRadius: 16, background: "rgba(239,246,255,0.9)", fontSize: 18,
                    color: "#1f2937", outline: "none", transition: "all 0.2s",
                    boxSizing: "border-box", textAlign: "center", fontWeight: 800, letterSpacing: "0.22em",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.1)`; }}
                  onBlur={(e) => { e.target.style.borderColor = "#dbeafe"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 0.72fr", gap: 12 }}>
                <div>
                  <label htmlFor="student-school" style={{
                    display: "block", fontSize: 13, fontWeight: 600, color: "#374151",
                    marginBottom: 8, marginLeft: 4,
                  }}>
                    학교
                  </label>
                  <input
                    id="student-school"
                    type="text"
                    value={school}
                    onChange={(e) => {
                      setSchool(e.target.value.slice(0, 40));
                      setMsg(null);
                    }}
                    autoComplete="off"
                    placeholder="학교명"
                    style={{
                      display: "block", width: "100%", paddingLeft: 16, paddingRight: 16,
                      paddingTop: 14, paddingBottom: 14, border: "2px solid #e5e7eb",
                      borderRadius: 16, background: "rgba(255,255,255,0.8)", fontSize: 16,
                      color: "#1f2937", outline: "none", transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.1)`; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label htmlFor="student-grade" style={{
                    display: "block", fontSize: 13, fontWeight: 600, color: "#374151",
                    marginBottom: 8, marginLeft: 4,
                  }}>
                    학년
                  </label>
                  <input
                    id="student-grade"
                    type="text"
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value.slice(0, 20));
                      setMsg(null);
                    }}
                    autoComplete="off"
                    placeholder="학년"
                    style={{
                      display: "block", width: "100%", paddingLeft: 16, paddingRight: 16,
                      paddingTop: 14, paddingBottom: 14, border: "2px solid #e5e7eb",
                      borderRadius: 16, background: "rgba(255,255,255,0.8)", fontSize: 16,
                      color: "#1f2937", outline: "none", transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.1)`; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
            </>
          )}

          {/* 4자리 비밀번호 */}
          <div>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600, color: "#374151",
              marginBottom: 8, marginLeft: 4,
            }}>
              {signupOpen ? "사용할 비밀번호 (숫자 4자리)" : "비밀번호 (숫자 4자리)"}
            </label>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  ref={pinRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`비밀번호 ${idx + 1}번째 자리`}
                  value={pin[idx] || ""}
                  onChange={(e) => handlePinDigit(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.1)`; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  style={pinDigitStyle}
                />
              ))}
            </div>
          </div>

          {/* Error/Info Message */}
          {msg && (
            <div style={{
              padding: "12px 16px", borderRadius: 14, fontSize: 13, fontWeight: 500,
              background: msg.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
              color: msg.ok ? "#059669" : "#dc2626",
              border: `1px solid ${msg.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)"}`,
              whiteSpace: "pre-line", textAlign: "center",
            }}>
              {msg.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || signupLoading}
            style={{
              display: "flex", width: "100%", justifyContent: "center", alignItems: "center",
              gap: 8, padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 700,
              color: "#fff", border: "none",
              background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
              boxShadow: `0 6px 20px rgba(99,102,241,0.3)`,
              cursor: loading || signupLoading ? "not-allowed" : "pointer",
              opacity: loading || signupLoading ? 0.7 : 1,
              transition: "all 0.2s",
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>progress_activity</span>
                로그인 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                로그인
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading || signupLoading}
            onClick={() => {
              if (!signupOpen) {
                setSignupOpen(true);
                setMsg({ ok: true, text: "학생 이름, 학부모 인증번호, 사용할 비밀번호 4자리를 입력한 뒤 회원가입을 누르세요." });
                return;
              }
              void handleSignup();
            }}
            style={{
              display: "flex", width: "100%", justifyContent: "center", alignItems: "center",
              gap: 8, padding: "15px 20px", borderRadius: 16, fontSize: 15, fontWeight: 800,
              color: "#1d4ed8", border: "1.5px solid rgba(37,99,235,0.22)",
              background: "rgba(239,246,255,0.9)",
              cursor: loading || signupLoading ? "not-allowed" : "pointer",
              opacity: loading || signupLoading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {signupLoading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>progress_activity</span>
                회원가입 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                회원가입
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.6 }}>
            처음 가입할 때는 학원에서 받은 학부모 인증번호가 필요합니다.
            <br />
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>이름과 인증번호가 맞는 학생만 계정을 만들 수 있어요</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          .login-card {
            border-radius: 20px !important;
            padding: 36px 20px !important;
            margin: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
