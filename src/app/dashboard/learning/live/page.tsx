"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  created_at: string;
}

/* ── Lang config ── */
const LANG_OPTIONS = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
];

const MONACO_LANG: Record<string, string> = {
  c: "c",
  cpp: "cpp",
  python: "python",
  javascript: "javascript",
};

const DEFAULT_CODE: Record<string, string> = {
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, 코딩쏙!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, 코딩쏙!" << endl;\n    return 0;\n}`,
  python: `# 파이썬 라이브 수업\nprint("Hello, 코딩쏙!")`,
  javascript: `// JavaScript 라이브 수업\nconsole.log("Hello, 코딩쏙!");`,
};

/* ── Debounce hook ── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function TeacherLivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = createClient();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE.c);
  const [language, setLanguage] = useState("c");
  const [title, setTitle] = useState("라이브 수업");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const debouncedCode = useDebounce(code, 500);
  const sessionRef = useRef<LiveSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* auth guard — teacher only */
  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      if (!user) { router.push("/login"); return; }
      // student → redirect to student view
      router.push("/dashboard/learning/live/student");
    }
  }, [user, loading, router]);

  /* check for existing active session */
  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    (async () => {
      const { data } = await sb
        .from("live_sessions")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setSession(data as LiveSession);
        sessionRef.current = data as LiveSession;
        setCode(data.code || DEFAULT_CODE[data.language] || DEFAULT_CODE.c);
        setLanguage(data.language);
        setTitle(data.title);
        setOutput(data.output || "");
        setStudentCount(data.student_count || 0);
        startTimer();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* sync code to Supabase when debounced */
  useEffect(() => {
    if (!sessionRef.current) return;
    sb.from("live_sessions")
      .update({ code: debouncedCode })
      .eq("id", sessionRef.current.id)
      .then(() => undefined);
  }, [debouncedCode, sb]);

  /* realtime: student_count */
  useEffect(() => {
    if (!session) return;
    const channel = sb
      .channel(`live-teacher-${session.id}`)
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
          setStudentCount(updated.student_count ?? 0);
        }
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [session, sb]);

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setElapsed(0);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* Start session */
  const handleStart = useCallback(async () => {
    if (!user) return;
    setIsStarting(true);
    try {
      const { data, error } = await sb
        .from("live_sessions")
        .insert({
          teacher_id: user.id,
          title,
          code,
          language,
          is_active: true,
          student_count: 0,
        })
        .select()
        .single();
      if (error) throw error;
      setSession(data as LiveSession);
      sessionRef.current = data as LiveSession;
      startTimer();
    } catch (err) {
      console.error("[Live] start failed:", err);
    } finally {
      setIsStarting(false);
    }
  }, [user, title, code, language, sb]);

  /* End session */
  const handleEnd = useCallback(async () => {
    if (!sessionRef.current) return;
    setIsEnding(true);
    try {
      await sb
        .from("live_sessions")
        .update({ is_active: false })
        .eq("id", sessionRef.current.id);
      setSession(null);
      sessionRef.current = null;
      stopTimer();
      setOutput("");
    } catch (err) {
      console.error("[Live] end failed:", err);
    } finally {
      setIsEnding(false);
    }
  }, [sb]);

  /* Run code */
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("실행 중...");
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin: "" }),
      });
      const data = await res.json();
      const result = data.stdout || data.stderr || data.error || "출력 없음";
      setOutput(result);
      // broadcast output to students
      if (sessionRef.current) {
        await sb
          .from("live_sessions")
          .update({ output: result, code })
          .eq("id", sessionRef.current.id);
      }
    } catch {
      setOutput("실행 오류가 발생했습니다.");
    } finally {
      setIsRunning(false);
    }
  }, [code, language, isRunning, sb]);

  /* language change */
  const handleLangChange = useCallback(async (lang: string) => {
    setLanguage(lang);
    const newCode = DEFAULT_CODE[lang] || "";
    setCode(newCode);
    if (sessionRef.current) {
      await sb
        .from("live_sessions")
        .update({ language: lang, code: newCode })
        .eq("id", sessionRef.current.id);
    }
  }, [sb]);

  if (loading || !user) return null;
  if (user.role !== "teacher") return null;

  const isLive = !!session;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", flexDirection: "column", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "#161b22",
        borderBottom: "1px solid #30363d",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Live badge */}
          <AnimatePresence>
            {isLive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "5px 14px", borderRadius: 999,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.4)",
                }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.8)" }}
                />
                <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>LIVE</span>
                <span style={{ color: "#6b7280", fontSize: 11 }}>{formatTime(elapsed)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={isLive}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "#e6edf3", fontSize: 15, fontWeight: 700,
              fontFamily: "inherit",
              opacity: isLive ? 0.6 : 1,
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Student count */}
          {isLive && (
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 999,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#22c55e" }}>group</span>
              <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{studentCount}명 접속</span>
            </div>
          )}

          {/* Language selector */}
          <select
            value={language}
            onChange={e => handleLangChange(e.target.value)}
            style={{
              background: "#21262d", border: "1px solid #30363d", borderRadius: 8,
              color: "#e6edf3", padding: "6px 12px", fontSize: 12, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {LANG_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Run button */}
          <motion.button
            onClick={handleRun}
            disabled={isRunning}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 18px", borderRadius: 8, border: "none", cursor: isRunning ? "not-allowed" : "pointer",
              background: isRunning ? "#374151" : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {isRunning ? "hourglass_empty" : "play_arrow"}
            </span>
            {isRunning ? "실행 중..." : "실행"}
          </motion.button>

          {/* Start / End */}
          {!isLive ? (
            <motion.button
              onClick={handleStart}
              disabled={isStarting}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 20px", borderRadius: 8, border: "none",
                cursor: isStarting ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>cast</span>
              {isStarting ? "시작 중..." : "수업 시작"}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleEnd}
              disabled={isEnding}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 20px", borderRadius: 8,
                border: "1px solid #4b5563",
                cursor: isEnding ? "not-allowed" : "pointer",
                background: "#374151",
                color: "#9ca3af", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              } as React.CSSProperties}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>stop_circle</span>
              {isEnding ? "종료 중..." : "수업 종료"}
            </motion.button>
          )}
        </div>
      </div>

      {/* Not live — pre-flight message */}
      {!isLive && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          padding: "10px 24px",
          background: "rgba(234,179,8,0.06)",
          borderBottom: "1px solid rgba(234,179,8,0.15)",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#eab308" }}>info</span>
          <span style={{ color: "#d1a000", fontSize: 12, fontWeight: 600 }}>
            코드를 작성한 뒤 "수업 시작"을 클릭하면 학생들이 실시간으로 볼 수 있습니다.
          </span>
        </div>
      )}

      {/* Editor + Output */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language={MONACO_LANG[language] || "c"}
            value={code}
            onChange={v => setCode(v ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
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

        {/* Output panel */}
        <div style={{
          height: 180, background: "#0a0c10",
          borderTop: "1px solid #30363d",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px",
            borderBottom: "1px solid #21262d",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#6b7280" }}>terminal</span>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.5 }}>OUTPUT</span>
            {isLive && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#4b5563" }}>
                실행 결과가 학생에게 자동 전송됩니다
              </span>
            )}
          </div>
          <pre style={{
            flex: 1, overflow: "auto", margin: 0,
            padding: "12px 16px",
            color: output.includes("오류") || output.includes("error") ? "#f87171" : "#22c55e",
            fontSize: 13, lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
            {output || <span style={{ color: "#4b5563" }}>실행 결과가 여기에 표시됩니다...</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}
