"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient, isLocalPreviewAuthEnabled, isSupabaseConfigured } from "@/lib/supabase";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";
import { isGrowthOsAdminName } from "@/lib/growth-os-client";

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
  grade: string | null;
  avatar: string | null;
  auth_user_id?: string | null;
  status?: string | null;
}

const PRIMARY = "#3b82f6";
const ACCENT = "#2563eb";

function persistSessionCookie(authUserId: string) {
  document.cookie = `codingssok_session=${authUserId}; path=/; max-age=${60 * 60 * 24 * 30}; Secure; SameSite=Lax`;
}

function redirectToPostLoginDestination(profile: { name: string; role: "student" | "teacher" }) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  const isAdmin = profile.role === "teacher" || isGrowthOsAdminName(profile.name);
  if (isAdmin) {
    window.location.assign(redirect?.startsWith("/dashboard/learning/admin") ? redirect : "/dashboard/learning/admin");
    return;
  }
  window.location.assign(redirect || "/dashboard/learning");
}

function buildLocalPreviewId(name: string, pin: string) {
  const source = `${name.trim().toLowerCase()}-${pin}`;
  const encoded = encodeURIComponent(source).toLowerCase().replace(/%/g, "");
  const safe = encoded.replace(/[^a-z0-9-]/g, "").slice(0, 48) || "student";
  return `local-${safe}`;
}

function rememberLocalStudent(student: StudentRow, pin: string) {
  try {
    const raw = localStorage.getItem("codingssok_local_students");
    const rows = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : [];
    const savedAt = new Date().toISOString();
    const next = [
      {
        id: student.id,
        name: student.name,
        grade: student.grade,
        avatar: student.avatar,
        pin,
        status: student.status ?? "approved",
        savedAt,
      },
      ...rows.filter((row) => row.id !== student.id && row.name !== student.name),
    ];
    localStorage.setItem("codingssok_local_students", JSON.stringify(next));
  } catch {
    // Local preview signup history should never block login.
  }
}

function recordLoginEvent(params: {
  studentId: string;
  authUserId: string;
  studentName: string;
  eventType: "login" | "signup" | "local-preview-login";
}) {
  const payload = JSON.stringify({
    studentId: params.studentId,
    authUserId: params.authUserId,
    studentName: params.studentName,
    eventType: params.eventType,
    status: "success",
    source: "student-login",
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/growth-os/login-event",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }

    fetch("/api/growth-os/login-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Login should never fail because analytics recording failed.
  }
}

export default function LoginPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinRef0 = useRef<HTMLInputElement>(null);
  const pinRef1 = useRef<HTMLInputElement>(null);
  const pinRef2 = useRef<HTMLInputElement>(null);
  const pinRef3 = useRef<HTMLInputElement>(null);
  const pinRefs = [pinRef0, pinRef1, pinRef2, pinRef3];

  useEffect(() => { inputRef.current?.focus(); }, []);

  const ensureStudentAuth = useCallback(async (
    sb: ReturnType<typeof createClient>,
    student: StudentRow,
    currentPin: string,
  ) => {
    const role = isGrowthOsAdminName(student.name) ? "teacher" : "student";
    const email = buildStudentAuthEmail(student.id);
    const password = buildStudentAuthPassword(student.id, currentPin);

    const signIn = await sb.auth.signInWithPassword({ email, password });
    let authUser = signIn.data.user ?? null;

    if (!authUser) {
      const signUp = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: student.name,
            role,
          },
        },
      });

      const alreadyRegistered = signUp.error?.message?.toLowerCase().includes("already registered");
      if (signUp.error && !alreadyRegistered) {
        throw signUp.error;
      }

      authUser = signUp.data.user ?? null;
      if (!authUser || !signUp.data.session) {
        const retry = await sb.auth.signInWithPassword({ email, password });
        if (retry.error || !retry.data.user) {
          throw retry.error ?? new Error("학생 인증 계정을 연결하지 못했습니다.");
        }
        authUser = retry.data.user;
      }
    }

    if (!authUser) {
      throw new Error("학생 인증 계정을 찾지 못했습니다.");
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

    const { error: profileSyncError } = await sb
      .from("profiles")
      .upsert({
        id: authUser.id,
        name: student.name,
        email,
        display_name: student.name,
        role,
        approval_status: "approved",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileSyncError && process.env.NODE_ENV === "development") {
      console.warn("[Login] profile sync failed:", profileSyncError.message);
    }

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

  /* ── 로그인/가입 처리 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
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
      if (!isSupabaseConfigured()) {
        if (isLocalPreviewAuthEnabled()) {
          const studentId = buildLocalPreviewId(trimmed, pin);
          const authUserId = `${studentId}-auth`;
          recordLoginEvent({
            studentId,
            authUserId,
            studentName: trimmed,
            eventType: "local-preview-login",
          });
          clearLoginAttempts();
          const localStudent = {
            id: studentId,
            name: trimmed,
            grade: null,
            avatar: null,
            auth_user_id: authUserId,
            status: "approved",
          };
          rememberLocalStudent(localStudent, pin);
          loginAs(localStudent, authUserId);
          return;
        }
        setMsg({ ok: false, text: "로컬 환경에 Supabase 설정이 없어 로그인을 실행할 수 없습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요." });
        return;
      }

      const sb = createClient();

      // 1. 이름+PIN으로 서버에서 매칭 (PIN을 클라이언트에 노출하지 않음)
      const { data: matched, error } = await sb
        .from("students")
        .select("id, name, grade, avatar, auth_user_id, status")
        .ilike("name", trimmed)
        .eq("pin", pin)
        .maybeSingle();

      if (error) throw error;

      if (matched) {
        // ── 이름+PIN 매칭 성공 ──
        // deactivated만 차단 (비활성 보안). pending/rejected는 자동 통과.
        const status = matched.status || "approved";
        if (status === "deactivated") {
          setMsg({ ok: false, text: "비활성화된 계정입니다. 선생님에게 문의해주세요." });
          return;
        }

        const authUserId = await ensureStudentAuth(sb, matched as StudentRow, pin);
        recordLoginEvent({
          studentId: (matched as StudentRow).id,
          authUserId,
          studentName: (matched as StudentRow).name,
          eventType: "login",
        });
        clearLoginAttempts();
        rememberLocalStudent(matched as StudentRow, pin);
        loginAs(matched as StudentRow, authUserId);
      } else {
        // 이름이 존재하는지 확인 (PIN 없이 — 가입 vs 오답 판별)
        const { data: existingByName } = await sb
          .from("students")
          .select("id, status")
          .ilike("name", trimmed)
          .maybeSingle();

        if (existingByName) {
          const st = (existingByName as Pick<StudentRow, "status">).status;
          if (st === "deactivated") {
            setMsg({ ok: false, text: "비활성화된 계정입니다. 재가입이 필요합니다. 선생님에게 문의해주세요." });
          } else {
            // 이름은 있지만 PIN 불일치 (pending/rejected 상태 무관)
            setMsg({ ok: false, text: "비밀번호가 틀렸습니다" });
            setPin("");
            pinRefs[0].current?.focus();
          }
        } else {
          // ── 없으면 즉시 가입 + 자동 로그인 ──
          const { data: newStudent, error: insertErr } = await sb
            .from("students")
            .insert({ name: trimmed, pin, grade: null, avatar: null, status: "approved" })
            .select("id, name, grade, avatar, auth_user_id")
            .single();

          if (insertErr) throw insertErr;
          if (!newStudent) throw new Error("가입 처리 중 오류가 발생했습니다.");

          const authUserId = await ensureStudentAuth(sb, newStudent as StudentRow, pin);
          recordLoginEvent({
            studentId: (newStudent as StudentRow).id,
            authUserId,
            studentName: (newStudent as StudentRow).name,
            eventType: "signup",
          });
          clearLoginAttempts();
          rememberLocalStudent(newStudent as StudentRow, pin);
          loginAs(newStudent as StudentRow, authUserId);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV === 'development') console.error("[Login] error:", err);
      setMsg({ ok: false, text: `오류: ${message}` });
    } finally { setLoading(false); }
  };

  /* ── 로그인 처리 ── */
  const loginAs = (student: StudentRow, authUserId: string) => {
    const role: "student" | "teacher" = isGrowthOsAdminName(student.name) ? "teacher" : "student";
    const profile = {
      id: authUserId,
      studentId: student.id,
      name: student.name,
      email: buildStudentAuthEmail(student.id),
      role,
      grade: student.grade || undefined,
      avatar: student.avatar || undefined,
      level: 1, xp: 0, streak: 0,
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem("codingssok_user", JSON.stringify(profile));
    localStorage.setItem("codingssok_role", role);
    persistSessionCookie(authUserId);
    redirectToPostLoginDestination(profile);
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
            학습 플랫폼 — 이름과 비밀번호로 바로 시작!
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
                onChange={(e) => { setName(e.target.value); setMsg(null); }}
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

          {/* 4자리 비밀번호 */}
          <div>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600, color: "#374151",
              marginBottom: 8, marginLeft: 4,
            }}>
              비밀번호 (숫자 4자리)
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
            disabled={loading}
            style={{
              display: "flex", width: "100%", justifyContent: "center", alignItems: "center",
              gap: 8, padding: "16px 20px", borderRadius: 16, fontSize: 15, fontWeight: 700,
              color: "#fff", border: "none",
              background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
              boxShadow: `0 6px 20px rgba(99,102,241,0.3)`,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
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
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.6 }}>
            처음이라면 이름과 비밀번호를 정하면 자동으로 가입돼요!
            <br />
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>이미 있는 이름이면 비밀번호로 로그인해요</span>
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
