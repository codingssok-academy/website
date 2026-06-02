// XSS-safe: all HTML rendered via sanitizeHTML (DOMPurify-backed). See @/lib/sanitize.
"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  getBankProblemById,
  DIFFICULTY_COLOR_BANK,
  DIFFICULTY_LABEL_BANK,
  DIFFICULTY_XP_BANK,
  type BankProblem,
  type BankDifficulty,
} from "@/data/problem-bank";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { awardXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";
import { sanitizeHTML } from "@/lib/sanitize";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ── Language templates ── */
const CODE_TEMPLATES: Record<string, string> = {
  c: `#include <stdio.h>

int main() {
    // 여기에 코드를 작성하세요

    return 0;
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // 여기에 코드를 작성하세요

    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

# 여기에 코드를 작성하세요
`,
};

const LANG_LABEL: Record<string, string> = {
  c: "C",
  cpp: "C++17",
  python: "Python 3",
};

/* ── Submission record type ── */
interface SubmissionRecord {
  id: string;
  created_at: string;
  language: string;
  result: string;
  score: number;
  code: string;
}

/* ── Test result type ── */
interface TestResult {
  index: number;
  passed: boolean;
  expected: string;
  got: string;
  error?: string;
}

/* ── Safe HTML renderer (uses DOMPurify) ── */
function SafeHTML({ html, style }: { html: string; style?: React.CSSProperties }) {
  const sanitized = sanitizeHTML(html);
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitized }}
      style={style}
    />
  );
}

/* ── Confetti ── */
function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      color: `hsl(${Math.random() * 360},90%,60%)`,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    }));

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vy += 0.05;
        if (p.y < canvas.height) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

/* ── Difficulty badge ── */
function DifficultyBadge({ difficulty }: { difficulty: BankDifficulty }) {
  const color = DIFFICULTY_COLOR_BANK[difficulty];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
        }}
      />
      {DIFFICULTY_LABEL_BANK[difficulty]}
    </span>
  );
}

/* ── Spinner ── */
function Spinner() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        border: "2px solid rgba(255,255,255,0.1)",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

/* ── Info pill ── */
function InfoPill({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        color: color || "#64748b",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
        {icon}
      </span>
      {label}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 12px",
          paddingBottom: 8,
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Example box ── */
function ExampleBox({
  label,
  content,
  borderRight,
}: {
  label: string;
  content: string;
  borderRight?: boolean;
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).catch(() => {});
  };
  return (
    <div style={{ borderRight: borderRight ? "1px solid #e2e8f0" : "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 12px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
          {label}
        </span>
        <button
          onClick={copyToClipboard}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
          title="복사"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            content_copy
          </span>
          복사
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "10px 12px",
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          color: "#1e293b",
          background: "#ffffff",
          whiteSpace: "pre-wrap",
          minHeight: 48,
        }}
      >
        {content}
      </pre>
    </div>
  );
}

/* ── Language selector ── */
function LanguageSelector({
  language,
  setLanguage,
}: {
  language: string;
  setLanguage: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#475569" }}>
        code
      </span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          color: "#94a3b8",
          fontSize: 12,
          fontWeight: 700,
          padding: "4px 8px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {Object.entries(LANG_LABEL).map(([v, label]) => (
          <option key={v} value={v} style={{ background: "#1e293b" }}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Problem Panel ── */
function ProblemPanel({
  problem,
  diffColor,
  showTags,
  setShowTags,
}: {
  problem: BankProblem;
  diffColor: string;
  showTags: boolean;
  setShowTags: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        padding: "20px 24px 32px",
        color: "#1e293b",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Title area */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <DifficultyBadge difficulty={problem.difficulty} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 4 }}>코딩쏙 문제은행</span>
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#0f172a",
            margin: "0 0 6px",
            letterSpacing: "-0.03em",
          }}
        >
          {problem.title}
        </h1>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
          {problem.id}
        </p>
      </div>

      {/* Info bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 28,
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {[
          { label: "시간 제한", value: problem.timeLimit },
          { label: "메모리 제한", value: problem.memoryLimit },
          
          {
            label: "XP 보상",
            value: `+${DIFFICULTY_XP_BANK[problem.difficulty]}`,
            color: "#f59e0b",
          },
        ].map((item, i, arr) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRight: i < arr.length - 1 ? "1px solid #e2e8f0" : "none",
              background: i % 2 === 0 ? "#f8fafc" : "#ffffff",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: item.color || "#0f172a",
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Problem description */}
      <Section title="문제">
        <SafeHTML
          html={problem.description}
          style={{ lineHeight: 1.8, fontSize: 14, color: "#334155" }}
        />
      </Section>

      {/* Constraints */}
      <Section title="제약 조건">
        <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
          {problem.constraints.map((c, i) => (
            <li
              key={i}
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 2,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            >
              <SafeHTML html={c} style={{ display: "inline" }} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Input format */}
      <Section title="입력">
        <SafeHTML
          html={problem.inputFormat}
          style={{ fontSize: 14, color: "#334155", lineHeight: 1.8 }}
        />
      </Section>

      {/* Output format */}
      <Section title="출력">
        <SafeHTML
          html={problem.outputFormat}
          style={{ fontSize: 14, color: "#334155", lineHeight: 1.8 }}
        />
      </Section>

      {/* Examples */}
      <Section title="예제">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {problem.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <ExampleBox label={`입력 ${i + 1}`} content={ex.input} borderRight />
                <ExampleBox label={`출력 ${i + 1}`} content={ex.output} />
              </div>
              {ex.explanation && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fffbeb",
                    fontSize: 12,
                    color: "#78716c",
                    lineHeight: 1.6,
                    borderTop: "1px solid #fef3c7",
                  }}
                >
                  <strong style={{ color: "#92400e" }}>설명: </strong>
                  {ex.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Tags */}
      <div style={{ marginTop: 28 }}>
        <button
          onClick={() => setShowTags(!showTags)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {showTags ? "visibility_off" : "visibility"}
          </span>
          알고리즘 태그 {showTags ? "숨기기" : "보기"}
        </button>
        <AnimatePresence>
          {showTags && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap" as const,
              }}
            >
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6366f1",
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                    borderRadius: 6,
                    padding: "3px 10px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const AI_HINT_LIMIT_BANK = 5;
const AI_HINT_KEY_BANK = "codingssok_ai_hint_bank";

function getHintUsageBank(): { count: number; date: string } {
  if (typeof window === "undefined") return { count: 0, date: "" };
  try {
    const raw = localStorage.getItem(AI_HINT_KEY_BANK);
    return raw ? JSON.parse(raw) : { count: 0, date: "" };
  } catch { return { count: 0, date: "" }; }
}

function incrementHintUsageBank(): number {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getHintUsageBank();
  const newCount = usage.date === today ? usage.count + 1 : 1;
  localStorage.setItem(AI_HINT_KEY_BANK, JSON.stringify({ count: newCount, date: today }));
  return newCount;
}

function getRemainingHintsBank(): number {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getHintUsageBank();
  if (usage.date !== today) return AI_HINT_LIMIT_BANK;
  return Math.max(0, AI_HINT_LIMIT_BANK - usage.count);
}

/* ── Editor Panel ── */
function EditorPanel({
  code,
  language,
  onCodeChange,
  stdinVisible,
  setStdinVisible,
  customStdin,
  setCustomStdin,
  testing,
  submitting,
  testResults,
  submitResult,
  handleTest,
  handleSubmit,
  user,
  problemTitle,
}: {
  code: string;
  language: string;
  onCodeChange: (v: string) => void;
  stdinVisible: boolean;
  setStdinVisible: (v: boolean) => void;
  customStdin: string;
  setCustomStdin: (v: string) => void;
  testing: boolean;
  submitting: boolean;
  testResults: TestResult[];
  submitResult: {
    success: boolean;
    score: number;
    xpEarned: number;
    message: string;
  } | null;
  handleTest: () => void;
  handleSubmit: () => void;
  user: import("@/contexts/AuthContext").UserProfile | null;
  problemTitle: string;
}) {
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const handleAiHint = async () => {
    const remaining = getRemainingHintsBank();
    if (remaining <= 0) {
      setHintError("오늘 AI 힌트를 모두 사용했어요 (하루 5회 제한). 내일 다시 도전해보세요!");
      setShowHintModal(true);
      return;
    }

    const failedResult = testResults.find((r) => !r.passed);
    const expectedOutput = failedResult?.expected ?? "";
    const actualOutput = failedResult?.got ?? "";

    setAiLoading(true);
    setHintError(null);
    setAiHint(null);
    setShowHintModal(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, problemTitle, expectedOutput, actualOutput }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setHintError(data.error || "AI 힌트를 가져오지 못했어요.");
      } else {
        setAiHint(data.content);
        incrementHintUsageBank();
      }
    } catch {
      setHintError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  };

  const monacoLanguage =
    language === "cpp" ? "cpp" : language === "c" ? "c" : "python";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 200 }}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={(v) => onCodeChange(v || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            tabSize: 4,
            insertSpaces: true,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>

      {/* stdin toggle */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "#0f172a",
        }}
      >
        <button
          onClick={() => setStdinVisible(!stdinVisible)}
          style={{
            width: "100%",
            padding: "8px 16px",
            background: "none",
            border: "none",
            color: "#475569",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {stdinVisible ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
          사용자 정의 입력 (stdin)
        </button>
        <AnimatePresence>
          {stdinVisible && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 100 }}
              exit={{ height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="입력 데이터를 직접 입력하세요..."
                style={{
                  width: "100%",
                  height: 100,
                  background: "#1e293b",
                  border: "none",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  color: "#e2e8f0",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: "10px 16px",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "#0f172a",
          padding: "10px 16px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleTest}
          disabled={testing || submitting}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            background:
              testing || submitting
                ? "rgba(255,255,255,0.05)"
                : "rgba(34,197,94,0.12)",
            border: "1px solid",
            borderColor:
              testing || submitting
                ? "rgba(255,255,255,0.08)"
                : "rgba(34,197,94,0.3)",
            color: testing || submitting ? "#334155" : "#22c55e",
            fontSize: 13,
            fontWeight: 700,
            cursor: testing || submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          {testing ? (
            <>
              <Spinner />
              테스트 중...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                play_arrow
              </span>
              테스트 실행
            </>
          )}
        </button>

        <button
          onClick={handleSubmit}
          disabled={testing || submitting || !user}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            background:
              testing || submitting || !user
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg,#dc2626,#f59e0b)",
            border: "none",
            color: testing || submitting || !user ? "#334155" : "#ffffff",
            fontSize: 13,
            fontWeight: 800,
            cursor: testing || submitting || !user ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
            boxShadow:
              testing || submitting || !user
                ? "none"
                : "0 4px 20px rgba(220,38,38,0.3)",
          }}
        >
          {submitting ? (
            <>
              <Spinner />
              채점 중...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                send
              </span>
              제출
            </>
          )}
        </button>

        {!user && (
          <span style={{ fontSize: 11, color: "#475569" }}>
            로그인 후 제출 가능
          </span>
        )}
      </div>

      {/* Results area */}
      <AnimatePresence>
        {(testResults.length > 0 || submitResult) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              background: "#0a111e",
              overflow: "auto",
              maxHeight: 280,
              flexShrink: 0,
            }}
          >
            {submitResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "12px 20px",
                  background: submitResult.success
                    ? "rgba(39,226,164,0.08)"
                    : submitResult.score > 0
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(239,68,68,0.08)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 28 }}>
                  {submitResult.success ? "✓" : submitResult.score > 0 ? "◑" : "✗"}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: submitResult.success
                        ? "#27e2a4"
                        : submitResult.score > 0
                        ? "#f59e0b"
                        : "#f87171",
                    }}
                  >
                    {submitResult.message}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    점수: {submitResult.score}점
                    {submitResult.xpEarned > 0 && (
                      <span style={{ color: "#f59e0b", marginLeft: 12 }}>
                        +{submitResult.xpEarned} XP
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI 힌트 버튼 — 오답/부분정답일 때만 */}
            {submitResult && !submitResult.success && (
              <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={handleAiHint}
                  disabled={aiLoading}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(139,92,246,0.4)",
                    background: aiLoading ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.15)",
                    color: "#a78bfa",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: aiLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {aiLoading ? (
                    <>
                      <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                      AI 분석 중...
                    </>
                  ) : (
                    <>AI 힌트 ({getRemainingHintsBank()}회 남음)</>
                  )}
                </button>
              </div>
            )}

            {testResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  padding: "10px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: r.passed ? "#27e2a4" : "#f87171",
                      background: r.passed
                        ? "rgba(39,226,164,0.1)"
                        : "rgba(248,113,113,0.1)",
                      border: `1px solid ${r.passed ? "rgba(39,226,164,0.3)" : "rgba(248,113,113,0.3)"}`,
                      borderRadius: 4,
                      padding: "1px 8px",
                    }}
                  >
                    {r.passed ? "PASS" : "FAIL"}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    예제 {r.index + 1}
                  </span>
                </div>
                {!r.passed && (
                  <div style={{ fontSize: 12, fontFamily: "monospace" }}>
                    {r.error ? (
                      <span style={{ color: "#f87171" }}>{r.error.slice(0, 200)}</span>
                    ) : (
                      <div style={{ color: "#64748b" }}>
                        <span style={{ color: "#94a3b8" }}>예상: </span>
                        <code style={{ color: "#34d399" }}>{r.expected}</code>
                        <br />
                        <span style={{ color: "#94a3b8" }}>출력: </span>
                        <code style={{ color: "#f87171" }}>{r.got || "(없음)"}</code>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI 힌트 모달 */}
      <AnimatePresence>
        {showHintModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHintModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1e293b",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 16,
                padding: 24,
                maxWidth: 520,
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>AI 코드 힌트</span>
                </div>
                <button
                  onClick={() => setShowHintModal(false)}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {aiLoading && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
                  <div>코드를 분석하고 있어요...</div>
                </div>
              )}

              {hintError && !aiLoading && (
                <div style={{ color: "#f87171", fontSize: 13, background: "rgba(248,113,113,0.08)", borderRadius: 8, padding: "12px 16px" }}>
                  {hintError}
                </div>
              )}

              {aiHint && !aiLoading && (
                <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {aiHint}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Submissions Panel ── */
function SubmissionsPanel({ submissions }: { submissions: SubmissionRecord[] }) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
      {submissions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#475569",
            fontSize: 13,
            marginTop: 40,
          }}
        >
          제출 기록이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "12px 16px",
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  fontFamily: "monospace",
                }}
              >
                {new Date(sub.created_at).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#64748b",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 4,
                  padding: "2px 8px",
                }}
              >
                {LANG_LABEL[sub.language] || sub.language}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color:
                    sub.result === "정답"
                      ? "#27e2a4"
                      : sub.result === "부분 정답"
                      ? "#f59e0b"
                      : "#f87171",
                }}
              >
                {sub.result}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>
                {sub.score}점
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function BankProblemPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const problem = getBankProblemById(problemId);

  const [language, setLanguage] = useState<string>("cpp");
  const [code, setCode] = useState<string>(CODE_TEMPLATES.cpp);
  const [stdinVisible, setStdinVisible] = useState(false);
  const [customStdin, setCustomStdin] = useState("");
  const [activeTab, setActiveTab] = useState<"problem" | "editor">("problem");
  const [showTags, setShowTags] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"editor" | "submissions">("editor");

  // Panel resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(50);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(50);

  // Test/submit state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    score: number;
    xpEarned: number;
    message: string;
  } | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!problem) return;
    const saved = localStorage.getItem(`bank-code-${problem.id}-${language}`);
    setCode(saved || CODE_TEMPLATES[language] || "");
  }, [problem, language]);

  const saveCode = useCallback(
    (val: string) => {
      setCode(val);
      if (problem) {
        localStorage.setItem(`bank-code-${problem.id}-${language}`, val);
      }
    },
    [problem, language]
  );

  const loadSubmissions = useCallback(async () => {
    if (!user || !problem) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("code_submissions")
      .select("id, created_at, language, result, score, code")
      .eq("user_id", user.id)
      .eq("problem_id", problem.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSubmissions(data as SubmissionRecord[]);
  }, [user, problem]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Splitter drag
  const onSplitterMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = leftWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [leftWidth]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const dx = e.clientX - dragStartX.current;
      const newPct = Math.min(
        75,
        Math.max(25, dragStartWidth.current + (dx / containerWidth) * 100)
      );
      setLeftWidth(newPct);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const runCompile = useCallback(
    async (
      stdin: string
    ): Promise<{ stdout: string; success: boolean; stderr: string }> => {
      try {
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language, stdin }),
        });
        const data = await res.json();
        return {
          stdout: data.stdout || "",
          success: data.success,
          stderr: data.stderr || data.error || "",
        };
      } catch {
        return { stdout: "", success: false, stderr: "네트워크 오류" };
      }
    },
    [code, language]
  );

  const handleTest = useCallback(async () => {
    if (!problem) return;
    setTesting(true);
    setTestResults([]);
    setSubmitResult(null);

    const results: TestResult[] = [];
    for (let i = 0; i < problem.examples.length; i++) {
      const ex = problem.examples[i];
      const { stdout, stderr } = await runCompile(ex.input);
      const got = stdout.trim();
      const expected = ex.output.trim();
      results.push({
        index: i,
        passed: got === expected,
        expected,
        got,
        error: stderr || undefined,
      });
    }
    setTestResults(results);
    trackMission("code_run");
    setTesting(false);
  }, [problem, runCompile]);

  const handleSubmit = useCallback(async () => {
    if (!problem || !user) return;
    setSubmitting(true);
    setSubmitResult(null);
    setTestResults([]);

    const results: TestResult[] = [];
    for (let i = 0; i < problem.examples.length; i++) {
      const ex = problem.examples[i];
      const { stdout, stderr } = await runCompile(ex.input);
      const got = stdout.trim();
      const expected = ex.output.trim();
      results.push({
        index: i,
        passed: got === expected,
        expected,
        got,
        error: stderr || undefined,
      });
    }
    setTestResults(results);

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const maxScore = 100;
    const score = total > 0 ? Math.round((passed / total) * maxScore) : 0;
    const isCorrect = passed === total && total > 0;
    const result = isCorrect
      ? "정답"
      : passed > 0
      ? "부분 정답"
      : "오답";

    const supabase = createClient();
    await supabase.from("code_submissions").insert({
      user_id: user.id,
      problem_id: problem.id,
      language,
      code,
      result,
      score,
      stdout: results.map((r) => r.got).join("\n---\n"),
    });

    let xpEarned = 0;
    if (isCorrect) {
      xpEarned = DIFFICULTY_XP_BANK[problem.difficulty];
      try {
        await awardXP("quiz_correct", `bank:${problemId}`);
      } catch {
        // XP 실패해도 진행
      }
      trackMission("quiz_solve");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
    }

    setSubmitResult({
      success: isCorrect,
      score,
      xpEarned,
      message: isCorrect
        ? "정답입니다!"
        : passed > 0
        ? `부분 정답 (${passed}/${total} 테스트 통과)`
        : "오답입니다.",
    });

    setSubmitting(false);
    loadSubmissions();
  }, [problem, user, runCompile, language, code, loadSubmissions]);

  if (!problem) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#94a3b8",
          fontSize: 16,
          gap: 12,
        }}
      >
        문제를 찾을 수 없습니다.
        <button
          onClick={() => router.push("/dashboard/learning/problems/bank")}
          style={{
            color: "#38bdf8",
            textDecoration: "underline",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          목록으로
        </button>
      </div>
    );
  }

  const diffColor = DIFFICULTY_COLOR_BANK[problem.difficulty];

  // Mobile
  if (isMobile) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <Confetti active={confetti} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <div
          style={{
            background: "#0f172a",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => router.push("/dashboard/learning/problems/bank")}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7,
              color: "#64748b",
              fontSize: 12,
              padding: "5px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
          </button>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#e2e8f0",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {problem.title}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            background: "#0f172a",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          {(["problem", "editor"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #dc2626"
                    : "2px solid transparent",
                color: activeTab === tab ? "#f8fafc" : "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab === "problem" ? "문제" : "에디터"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {activeTab === "problem" ? (
            <div style={{ background: "#ffffff" }}>
              <ProblemPanel
                problem={problem}
                diffColor={diffColor}
                showTags={showTags}
                setShowTags={setShowTags}
              />
            </div>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "#1e293b",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  background: "#0f172a",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <LanguageSelector language={language} setLanguage={setLanguage} />
              </div>
              <EditorPanel
                code={code}
                language={language}
                onCodeChange={saveCode}
                stdinVisible={stdinVisible}
                setStdinVisible={setStdinVisible}
                customStdin={customStdin}
                setCustomStdin={setCustomStdin}
                testing={testing}
                submitting={submitting}
                testResults={testResults}
                submitResult={submitResult}
                handleTest={handleTest}
                handleSubmit={handleSubmit}
                user={user}
                problemTitle={problem?.title ?? ""}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <Confetti active={confetti} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top bar */}
      <div
        style={{
          height: 40,
          background: "rgba(15,23,42,0.98)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => router.push("/dashboard/learning/koi")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 7,
            color: "#64748b",
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            arrow_back
          </span>
          목록
        </button>
        <div style={{ height: 20, width: 1, background: "rgba(255,255,255,0.08)" }} />
        <DifficultyBadge difficulty={problem.difficulty} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>
          {problem.title}
        </span>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
          {problem.id}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <InfoPill icon="timer" label={problem.timeLimit} />
          <InfoPill icon="memory" label={problem.memoryLimit} />
          <InfoPill icon="emoji_events" label={`+${problem.xp} XP`} color="#f59e0b" />
        </div>
      </div>

      {/* Main split */}
      <div ref={containerRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Problem */}
        <div
          style={{
            width: `${leftWidth}%`,
            flexShrink: 0,
            overflow: "auto",
            background: "#ffffff",
          }}
        >
          <ProblemPanel
            problem={problem}
            diffColor={diffColor}
            showTags={showTags}
            setShowTags={setShowTags}
          />
        </div>

        {/* Splitter */}
        <div
          onMouseDown={onSplitterMouseDown}
          style={{
            width: 6,
            flexShrink: 0,
            background: "rgba(255,255,255,0.04)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            cursor: "col-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background =
              "rgba(220,38,38,0.2)";
          }}
          onMouseLeave={(e) => {
            if (!isDragging.current)
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.04)";
          }}
        >
          <div
            style={{
              width: 2,
              height: 40,
              borderRadius: 2,
              background: "rgba(255,255,255,0.15)",
            }}
          />
        </div>

        {/* Right: Editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#1e293b",
          }}
        >
          {/* Right tab bar */}
          <div
            style={{
              height: 44,
              background: "#0f172a",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "stretch",
              paddingLeft: 12,
              gap: 4,
              flexShrink: 0,
            }}
          >
            {(["editor", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRightTab(tab)}
                style={{
                  padding: "0 14px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeRightTab === tab
                      ? "2px solid #dc2626"
                      : "2px solid transparent",
                  color: activeRightTab === tab ? "#f8fafc" : "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab === "editor" ? "코드 에디터" : "제출 기록"}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {activeRightTab === "editor" && (
              <LanguageSelector language={language} setLanguage={setLanguage} />
            )}
          </div>

          {activeRightTab === "editor" ? (
            <EditorPanel
              code={code}
              language={language}
              onCodeChange={saveCode}
              stdinVisible={stdinVisible}
              setStdinVisible={setStdinVisible}
              customStdin={customStdin}
              setCustomStdin={setCustomStdin}
              testing={testing}
              submitting={submitting}
              testResults={testResults}
              submitResult={submitResult}
              handleTest={handleTest}
              handleSubmit={handleSubmit}
              user={user}
              problemTitle={problem?.title ?? ""}
            />
          ) : (
            <SubmissionsPanel submissions={submissions} />
          )}
        </div>
      </div>
    </div>
  );
}
