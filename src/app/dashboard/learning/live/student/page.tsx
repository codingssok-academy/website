"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ── Types ── */
interface LiveSession {
  id: string;
  teacher_id: string;
  title: string;
  code: string;
  language: string;
  output: string;
  is_active: boolean;
  student_count: number;
}

const MONACO_LANG: Record<string, string> = {
  c: "c",
  cpp: "cpp",
  python: "python",
  javascript: "javascript",
};

export default function StudentLivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);

  const [session, setSession] = useState<LiveSession | null>(null);
  const [teacherCode, setTeacherCode] = useState("");
  const [myCode, setMyCode] = useState("");
  const [teacherOutput, setTeacherOutput] = useState("");
  const [myOutput, setMyOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [searchingSession, setSearchingSession] = useState(true);
  const [noSession, setNoSession] = useState(false);
  const [copied, setCopied] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  /* auth guard */
  useEffect(() => {
    if (!loading && !user) { router.push("/login"); }
  }, [user, loading, router]);

  /* teacher → redirect to teacher view */
  useEffect(() => {
    if (!loading && user?.role === "teacher") {
      router.push("/dashboard/learning/live");
    }
  }, [user, loading, router]);

  /* fetch active session + register student */
  useEffect(() => {
    if (!user || user.role === "teacher") return;
    (async () => {
      setSearchingSession(true);
      const { data } = await sb
        .from("live_sessions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        setNoSession(true);
        setSearchingSession(false);
        return;
      }

      setSession(data as LiveSession);
      sessionIdRef.current = data.id;
      setTeacherCode(data.code || "");
      setMyCode(data.code || "");
      setTeacherOutput(data.output || "");
      setSearchingSession(false);

      // bump student count (atomic-safe: re-read before update)
      const { data: fresh } = await sb.from("live_sessions").select("student_count").eq("id", data.id).single();
      await sb.from("live_sessions").update({ student_count: (fresh?.student_count || 0) + 1 }).eq("id", data.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* decrement student count on unmount */
  useEffect(() => {
    return () => {
      if (!sessionIdRef.current) return;
      sb.from("live_sessions")
        .select("student_count")
        .eq("id", sessionIdRef.current)
        .single()
        .then(({ data }: { data: { student_count: number | null } | null }) => {
          if (!data) return;
          sb.from("live_sessions")
            .update({ student_count: Math.max(0, (data.student_count || 1) - 1) })
            .eq("id", sessionIdRef.current!)
            .then(() => undefined);
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* auto-detect new session when none exists */
  useEffect(() => {
    if (session || !noSession) return;
    const channel = sb
      .channel("live-session-detect")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_sessions" }, (payload: { new: LiveSession }) => {
        const newSession = payload.new as LiveSession;
        if (newSession.is_active) {
          setSession(newSession);
          sessionIdRef.current = newSession.id;
          setTeacherCode(newSession.code || "");
          setMyCode(newSession.code || "");
          setTeacherOutput(newSession.output || "");
          setNoSession(false);
          setSearchingSession(false);
          // register student
          sb.from("live_sessions")
            .update({ student_count: (newSession.student_count || 0) + 1 })
            .eq("id", newSession.id)
            .then(() => undefined);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_sessions", filter: "is_active=eq.true" }, (payload: { new: LiveSession }) => {
        const updated = payload.new as LiveSession;
        if (updated.is_active && !session) {
          setSession(updated);
          sessionIdRef.current = updated.id;
          setTeacherCode(updated.code || "");
          setMyCode(updated.code || "");
          setTeacherOutput(updated.output || "");
          setNoSession(false);
          setSearchingSession(false);
        }
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [session, noSession, sb]);

  /* realtime subscription */
  useEffect(() => {
    if (!session) return;
    const channel = sb
      .channel(`live-student-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload: { new: LiveSession }) => {
          const updated = payload.new as LiveSession;

          // session ended
          if (!updated.is_active) {
            setSession(null);
            setNoSession(true);
            return;
          }

          setTeacherCode(updated.code || "");
          if (updated.output !== undefined) setTeacherOutput(updated.output);
          setSession(updated);
        }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [session, sb]);

  /* copy teacher code to my editor */
  const handleCopyTeacher = useCallback(() => {
    setMyCode(teacherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [teacherCode]);

  /* run my code */
  const handleRunMy = useCallback(async () => {
    if (!session || isRunning) return;
    setIsRunning(true);
    setMyOutput("실행 중...");
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: myCode, language: session.language, stdin: "" }),
      });
      const data = await res.json();
      setMyOutput(data.stdout || data.stderr || data.error || "출력 없음");
    } catch {
      setMyOutput("실행 오류가 발생했습니다.");
    } finally {
      setIsRunning(false);
    }
  }, [myCode, session, isRunning]);

  if (loading || !user) return null;

  /* searching */
  if (searchingSession) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0d1117",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ textAlign: "center", color: "#6b7280" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 16, color: "#374151" }}>cast</span>
          <p style={{ fontSize: 14 }}>활성 수업을 찾는 중...</p>
        </motion.div>
      </div>
    );
  }

  /* no session */
  if (noSession || !session) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0d1117",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div style={{ textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, display: "block", marginBottom: 16, color: "#374151" }}>cast_connected</span>
          <h2 style={{ color: "#e6edf3", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>진행 중인 수업이 없습니다</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>선생님이 수업을 시작하면 자동으로 연결됩니다.</p>
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: "8px 24px", borderRadius: 8, border: "1px solid #30363d",
              background: "#21262d", color: "#e6edf3", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            새로고침
          </motion.button>
        </div>
      </div>
    );
  }

  const monacoLang = MONACO_LANG[session.language] || "c";

  return (
    <div style={{
      height: "100vh", background: "#0d1117",
      display: "flex", flexDirection: "column",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      overflow: "hidden",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px",
        background: "#161b22",
        borderBottom: "1px solid #30363d",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.7)" }}
          />
          <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>LIVE</span>
          <span style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600 }}>{session.title}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            padding: "4px 12px", borderRadius: 999,
            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)",
            color: "#0ea5e9", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase" as const,
          }}>
            {session.language}
          </span>
          <span style={{ color: "#4b5563", fontSize: 11 }}>학생 뷰</span>
        </div>
      </div>

      {/* Main content: split editor */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Teacher code (read-only) */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderRight: "2px solid #21262d",
        }}>
          {/* Panel header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 16px",
            background: "#0f1318",
            borderBottom: "1px solid #21262d",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#ef4444" }}>person</span>
              <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>선생님 코드</span>
              <span style={{
                padding: "2px 8px", borderRadius: 4,
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444", fontSize: 10, fontWeight: 700,
              }}>READ ONLY</span>
            </div>
            <motion.button
              onClick={handleCopyTeacher}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 14px", borderRadius: 6, border: "1px solid #30363d",
                background: copied ? "rgba(34,197,94,0.1)" : "#21262d",
                color: copied ? "#22c55e" : "#9ca3af",
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "복사됨!" : "따라하기"}
            </motion.button>
          </div>

          {/* Teacher editor (read-only) */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={monacoLang}
              value={teacherCode}
              theme="vs-dark"
              options={{
                readOnly: true,
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                lineNumbers: "on",
                renderLineHighlight: "none",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                cursorStyle: "line",
              }}
            />
          </div>

          {/* Teacher output */}
          {teacherOutput && (
            <div style={{
              height: 120, background: "#0a0c10",
              borderTop: "1px solid #21262d",
              display: "flex", flexDirection: "column", flexShrink: 0,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderBottom: "1px solid #1a1f26",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#ef4444" }}>play_circle</span>
                <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>선생님 실행 결과</span>
              </div>
              <pre style={{
                flex: 1, overflow: "auto", margin: 0,
                padding: "8px 14px",
                color: "#22c55e", fontSize: 12, lineHeight: 1.6,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {teacherOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Student editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Panel header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 16px",
            background: "#0f1318",
            borderBottom: "1px solid #21262d",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#0ea5e9" }}>edit</span>
              <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>내 코드</span>
            </div>
            <motion.button
              onClick={handleRunMy}
              disabled={isRunning}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 14px", borderRadius: 6, border: "none",
                background: isRunning ? "#374151" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", fontSize: 11, fontWeight: 700,
                cursor: isRunning ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                {isRunning ? "hourglass_empty" : "play_arrow"}
              </span>
              {isRunning ? "실행 중..." : "실행"}
            </motion.button>
          </div>

          {/* Student editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={monacoLang}
              value={myCode}
              onChange={v => setMyCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                lineNumbers: "on",
                renderLineHighlight: "all",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
              }}
            />
          </div>

          {/* Student output */}
          <div style={{
            height: 120, background: "#0a0c10",
            borderTop: "1px solid #21262d",
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderBottom: "1px solid #1a1f26",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#0ea5e9" }}>terminal</span>
              <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>내 실행 결과</span>
            </div>
            <pre style={{
              flex: 1, overflow: "auto", margin: 0,
              padding: "8px 14px",
              color: myOutput.includes("오류") || myOutput.includes("error") ? "#f87171" : "#22c55e",
              fontSize: 12, lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {myOutput || <span style={{ color: "#4b5563" }}>실행 결과가 여기에 표시됩니다...</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
