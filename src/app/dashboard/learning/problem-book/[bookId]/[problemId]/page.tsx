"use client";

import {
  useState, useEffect, useRef, useCallback, use, Suspense,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { C_PROBLEM_BOOK, getCProblemById } from "@/data/problems/c-problem-book";
import { PY_PROBLEM_BOOK, getPyProblemById } from "@/data/problems/py-problem-book";
import { PROBLEM_DIFFICULTY_META } from "@/data/problems/types";
import type { Problem, TestCase } from "@/data/problems/types";
import { sanitizeHTML } from "@/lib/sanitize";
import { useCodeSave } from "@/hooks/useCodeSave";
import { awardXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", background: "#090c10", color: "#484f58",
      fontSize: 13, gap: 8,
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid #484f58", borderTopColor: "#58a6ff",
        animation: "pbspin 0.7s linear infinite", display: "inline-block",
      }} />
      에디터 로딩 중...
    </div>
  ),
});

/* ── Types ── */
interface TestResult {
  index: number;
  passed: boolean;
  expected: string;
  got: string;
  input: string;
  error?: string;
}

type SubmitStatus = "idle" | "running" | "pass" | "fail";

interface RunOutputLine {
  type: "stdout" | "stderr" | "info";
  text: string;
}

interface LocalRunResult {
  lines: RunOutputLine[];
  rawStdout: string;
  success: boolean;
}

interface GradingProgress {
  current: number;
  total: number;
}

/* ── Book registry ── */
function getProblem(bookId: string, problemId: string): Problem | null {
  if (bookId === "c-problems") return getCProblemById(problemId);
  if (bookId === "py-problems") return getPyProblemById(problemId);
  return null;
}

function getBook(bookId: string) {
  if (bookId === "c-problems") return C_PROBLEM_BOOK;
  if (bookId === "py-problems") return PY_PROBLEM_BOOK;
  return null;
}

const BOOK_COLOR: Record<string, string> = {
  "c-problems": "#3b82f6",
  "py-problems": "#10b981",
};

const LANG_MAP: Record<"c" | "python", { monaco: string; compile: string; label: string }> = {
  c: { monaco: "c", compile: "c", label: "C" },
  python: { monaco: "python", compile: "python", label: "Python 3" },
};

const STARTER: Record<"c" | "python", string> = {
  c: `#include <stdio.h>

int main() {
    // 여기에 코드를 작성하세요

    return 0;
}`,
  python: `# 여기에 코드를 작성하세요
`,
};

/* ── JSCPP stdout 조각 병합: write()가 \n 없이 쪼개서 줄 수 있으므로 합쳐서 줄 분리 ── */
function mergeCOutputLines(parts: { type: "stdout" | "stderr" | "info"; text: string }[]) {
  const result: { type: "stdout" | "stderr" | "info"; text: string }[] = [];
  let buf = "";
  let bufType: "stdout" | "stderr" | "info" = "stdout";

  for (const p of parts) {
    if (p.type !== "stdout") {
      // 버퍼 먼저 flush
      if (buf !== "") {
        buf.split("\n").forEach((l) => result.push({ type: bufType, text: l }));
        buf = "";
      }
      result.push(p);
    } else {
      buf += p.text;
      bufType = "stdout";
    }
  }
  if (buf !== "") {
    buf.split("\n").forEach((l) => result.push({ type: "stdout", text: l }));
  }
  return result;
}

/* ── SafeHTML: DOMPurify(sanitizeHTML) 사용으로 XSS 방지 ── */
function SafeHTML({ html, style }: { html: string; style?: React.CSSProperties }) {
  // sanitizeHTML은 DOMPurify 기반으로 정제된 HTML만 반환
  const clean = sanitizeHTML(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} style={style} />;
}

/* ── Difficulty badge ── */
function DiffBadge({ difficulty }: { difficulty: 1 | 2 | 3 | 4 | 5 }) {
  const meta = PROBLEM_DIFFICULTY_META[difficulty];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      color: meta.color, background: meta.bg,
      border: `1px solid ${meta.color}40`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color }} />
      {meta.label}
    </span>
  );
}

/* ── Example box with copy button ── */
function ExampleBox({ label, content, borderRight }: {
  label: string;
  content: string;
  borderRight?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ borderRight: borderRight ? "1px solid #e2e8f0" : "none" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>{label}</span>
        <button onClick={copy} style={{
          background: "none", border: "none", cursor: "pointer",
          color: copied ? "#22c55e" : "#94a3b8", fontSize: 11,
          display: "flex", alignItems: "center", gap: 3,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: "10px 12px",
        fontSize: 13, fontFamily: "'JetBrains Mono','Fira Code',monospace",
        color: "#1e293b", background: "#fff",
        whiteSpace: "pre-wrap", minHeight: 44,
      }}>
        {content || "(없음)"}
      </pre>
    </div>
  );
}

/* ── TestResultBadge ── */
function TestResultBadge({ result }: { result: TestResult }) {
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 8,
      border: `1px solid ${result.passed ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
      background: result.passed ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: result.passed ? "#22c55e" : "#ef4444",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#fff" }}>
            {result.passed ? "check" : "close"}
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: result.passed ? "#4ade80" : "#f87171" }}>
          테스트 {result.index + 1} {result.passed ? "통과" : "실패"}
        </span>
      </div>
      {!result.passed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {result.input && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#484f58", marginBottom: 3 }}>입력</div>
              <pre style={{
                margin: 0, padding: "6px 8px",
                background: "rgba(255,255,255,0.03)", borderRadius: 4,
                fontSize: 12, fontFamily: "monospace", color: "#94a3b8", whiteSpace: "pre-wrap",
              }}>{result.input || "(없음)"}</pre>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#484f58", marginBottom: 3 }}>예상 출력</div>
              <pre style={{
                margin: 0, padding: "6px 8px",
                background: "rgba(34,197,94,0.06)", borderRadius: 4,
                fontSize: 12, fontFamily: "monospace", color: "#4ade80", whiteSpace: "pre-wrap",
              }}>{result.expected || "(없음)"}</pre>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#484f58", marginBottom: 3 }}>실제 출력</div>
              <pre style={{
                margin: 0, padding: "6px 8px",
                background: "rgba(239,68,68,0.06)", borderRadius: 4,
                fontSize: 12, fontFamily: "monospace",
                color: result.error ? "#fbbf24" : "#f87171", whiteSpace: "pre-wrap",
              }}>{result.error || result.got || "(없음)"}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
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
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3 + 2,
      color: `hsl(${Math.random() * 360},90%,60%)`,
      size: Math.random() * 7 + 3,
      rot: Math.random() * 360, rotSpd: (Math.random() - 0.5) * 8,
    }));
    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotSpd; p.vy += 0.05;
        if (p.y < canvas.height) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
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
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }} />;
}

/* ── Monaco cs-black theme ── */
function defineTheme(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("cs-black", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a737d", fontStyle: "italic" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
    ],
    colors: {
      "editor.background": "#090c10",
      "editor.foreground": "#e6edf3",
      "editor.lineHighlightBackground": "#161b22",
      "editor.selectionBackground": "#264f78",
      "editorCursor.foreground": "#58a6ff",
      "editorLineNumber.foreground": "#484f58",
      "editorLineNumber.activeForeground": "#e6edf3",
    },
  });
}

/* ── Spinner ── */
function Spinner() {
  return (
    <div style={{
      width: 12, height: 12, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.2)",
      borderTopColor: "#fff",
      animation: "pbspin 0.7s linear infinite",
    }} />
  );
}

/* ── Main page inner (params already resolved) ── */
function ProblemSolvePageInner({ bookId, problemId }: { bookId: string; problemId: string }) {
  const router = useRouter();

  const problem = getProblem(bookId, problemId);
  const book = getBook(bookId);
  const bookColor = BOOK_COLOR[bookId] ?? "#3b82f6";
  const lang = (problem?.language ?? "c") as "c" | "python";
  const langCfg = LANG_MAP[lang];

  /* code */
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`pb:code:${problemId}`);
      if (saved) return saved;
    }
    return STARTER[lang];
  });

  /* DB 영구 저장 (localStorage + Supabase student_code_saves) */
  const codeSave = useCodeSave(`problem:${problemId}`, lang);
  useEffect(() => {
    let cancelled = false;
    codeSave.load().then(loaded => {
      if (!cancelled && loaded && loaded !== code) setCode(loaded);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);
  useEffect(() => {
    codeSave.save(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  /* split pane drag */
  const [leftPct, setLeftPct] = useState(48);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(75, Math.max(25, pct)));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* local run worker ref */
  const localWorkerRef = useRef<Worker | null>(null);

  /* run / submit state */
  const [running, setRunning] = useState(false);
  const [runLines, setRunLines] = useState<RunOutputLine[]>([]);
  const [customStdin, setCustomStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [passCount, setPassCount] = useState(0);
  const [gradingProgress, setGradingProgress] = useState<GradingProgress | null>(null);
  const [lastExecTime, setLastExecTime] = useState<number | null>(null);
  const [passFlash, setPassFlash] = useState(false);

  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [confetti, setConfetti] = useState(false);

  /* persist code */
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`pb:code:${problemId}`, code);
    }
  }, [code, problemId]);

  /* cleanup local run worker on unmount */
  useEffect(() => {
    return () => {
      if (localWorkerRef.current) {
        localWorkerRef.current.terminate();
        localWorkerRef.current = null;
      }
    };
  }, []);

  /* compile helper — 제출(채점) 전용, Godbolt API */
  const compile = useCallback(async (
    src: string,
    stdin: string,
  ): Promise<{ stdout: string; stderr: string; success: boolean; executionTime?: number }> => {
    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: src, language: langCfg.compile, stdin }),
    });
    if (!res.ok) {
      return { stdout: "", stderr: "서버 오류", success: false };
    }
    const data = await res.json();
    return {
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
      success: data.success ?? false,
      executionTime: data.executionTime,
    };
  }, [langCfg.compile]);

  /* ── 로컬 실행: C (JSCPP) ── */
  const runCLocal = useCallback(async (src: string, stdin: string): Promise<LocalRunResult> => {
    try {
      const JSCPP = (await import("JSCPP")).default;
      const inputLines = stdin.split("\n").map((l) => l.trimEnd());
      let inputIdx = 0;
      const outputLines: RunOutputLine[] = [];

      JSCPP.run(src, "", {
        stdio: {
          write: (s: string) => {
            // printf/puts가 호출될 때마다 즉시 stdout으로 쌓기
            // JSCPP는 \n 단위로 쪼개서 줄 수 있으므로 그대로 누적
            outputLines.push({ type: "stdout", text: s });
          },
          drain: () => {
            // scanf가 호출될 때마다 다음 입력 줄 반환
            // 터미널에도 입력값 에코
            const val = inputLines[inputIdx] ?? "";
            if (val !== "") {
              outputLines.push({ type: "info", text: `▶ ${val}` });
            }
            inputIdx++;
            return val + "\n";
          },
        },
        unsigned_overflow: "warn",
      });

      // 조각난 stdout 조합: \n 기준으로 줄 병합, info 에코도 순서 유지
      const merged = mergeCOutputLines(outputLines);
      const rawStdout = merged
        .filter((l) => l.type === "stdout")
        .map((l) => l.text)
        .join("\n");
      return { lines: merged, rawStdout, success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const friendly =
        raw.includes("Memory overflow") || raw.includes("maximum call stack")
          ? "메모리 초과 — scanf에 한글 입력은 지원되지 않습니다. 영문/숫자만 입력해 주세요."
          : raw;
      return {
        lines: [{ type: "stderr", text: friendly }],
        rawStdout: "",
        success: false,
      };
    }
  }, []);

  /* ── 로컬 실행: Python (Pyodide worker, simple mode) ── */
  const runPyLocal = useCallback((src: string, stdin: string): Promise<LocalRunResult> => {
    return new Promise((resolve) => {
      // 이전 워커 정리
      if (localWorkerRef.current) {
        localWorkerRef.current.terminate();
        localWorkerRef.current = null;
      }

      const worker = new Worker("/workers/pyodide-worker.js");
      localWorkerRef.current = worker;

      const inputs = stdin ? stdin.split("\n").map((l) => l.trimEnd()) : [];
      const outputLines: RunOutputLine[] = [];

      const timer = setTimeout(() => {
        worker.terminate();
        localWorkerRef.current = null;
        resolve({
          lines: [...outputLines, { type: "stderr", text: "시간 초과 (10초)" }],
          rawStdout: outputLines.filter((l) => l.type === "stdout").map((l) => l.text).join("\n"),
          success: false,
        });
      }, 10000);

      worker.onmessage = (e) => {
        const msg = e.data as { type: string; data?: string; message?: string };
        switch (msg.type) {
          case "ready":
            worker.postMessage({ type: "run", code: src });
            break;
          case "stdout":
            if (msg.data !== undefined) outputLines.push({ type: "stdout", text: msg.data });
            break;
          case "stderr":
            if (msg.data !== undefined) outputLines.push({ type: "stderr", text: msg.data });
            break;
          case "done": {
            clearTimeout(timer);
            worker.terminate();
            localWorkerRef.current = null;
            const rawStdout = outputLines.filter((l) => l.type === "stdout").map((l) => l.text).join("\n");
            const hasErr = outputLines.some((l) => l.type === "stderr");
            resolve({ lines: outputLines, rawStdout, success: !hasErr });
            break;
          }
          case "error": {
            clearTimeout(timer);
            worker.terminate();
            localWorkerRef.current = null;
            outputLines.push({ type: "stderr", text: msg.message ?? "알 수 없는 오류" });
            const rawStdout = outputLines.filter((l) => l.type === "stdout").map((l) => l.text).join("\n");
            resolve({ lines: outputLines, rawStdout, success: false });
            break;
          }
        }
      };

      worker.onerror = () => {
        clearTimeout(timer);
        worker.terminate();
        localWorkerRef.current = null;
        resolve({
          lines: [{ type: "stderr", text: "Worker 로드 실패 — 페이지를 새로고침해 주세요" }],
          rawStdout: "",
          success: false,
        });
      };

      worker.postMessage({ type: "init-simple", inputs });
    });
  }, []);

  /* ── 실행 버튼 (로컬: JSCPP / Pyodide) ── */
  const handleRun = useCallback(async () => {
    setRunning(true);
    setRunLines([]);
    setLastExecTime(null);
    // 제출 상태 초기화
    setSubmitStatus("idle");
    setTestResults([]);

    const startTs = performance.now();
    try {
      const result = lang === "c"
        ? await runCLocal(code, customStdin)
        : await runPyLocal(code, customStdin);

      const elapsed = performance.now() - startTs;
      setLastExecTime(Math.round(elapsed));
      setRunLines([
        ...result.lines,
        { type: "info", text: `[완료] ${elapsed.toFixed(1)}ms` },
      ]);
      // 코드 실행 XP
      awardXP("code_run", `problem-book:${crypto.randomUUID()}`);
      trackMission("code_run");
    } catch (err: unknown) {
      const elapsed = performance.now() - startTs;
      setRunLines([
        { type: "stderr", text: err instanceof Error ? err.message : "알 수 없는 오류" },
        { type: "info", text: `[오류] ${elapsed.toFixed(1)}ms` },
      ]);
    } finally {
      setRunning(false);
    }
  }, [code, customStdin, lang, runCLocal, runPyLocal]);

  /* submit / grade — Godbolt API 유지 */
  const handleSubmit = useCallback(async () => {
    if (!problem) return;
    setSubmitStatus("running");
    setTestResults([]);
    setPassCount(0);
    setRunLines([]);
    setLastExecTime(null);
    setGradingProgress({ current: 0, total: problem.testCases.length });

    const results: TestResult[] = [];
    let passed = 0;
    let totalExecTime = 0;

    for (let i = 0; i < problem.testCases.length; i++) {
      setGradingProgress({ current: i + 1, total: problem.testCases.length });
      const tc: TestCase = problem.testCases[i];
      try {
        const { stdout, stderr, success, executionTime } = await compile(code, tc.input);
        if (executionTime !== undefined) totalExecTime += executionTime;
        const got = stdout.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const expected = tc.output.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const isPass = success && got === expected;
        if (isPass) passed++;
        results.push({ index: i, passed: isPass, expected, got, input: tc.input, error: !success ? stderr : undefined });
      } catch (err: unknown) {
        results.push({ index: i, passed: false, expected: tc.output, got: "", input: tc.input, error: err instanceof Error ? err.message : "오류" });
      }
      setTestResults([...results]);
    }

    setPassCount(passed);
    if (totalExecTime > 0) setLastExecTime(totalExecTime);
    setGradingProgress(null);
    const allPass = passed === problem.testCases.length;
    setSubmitStatus(allPass ? "pass" : "fail");

    // DB에 실행 결과 기록 (student_code_saves.run_count/last_run_result)
    codeSave.recordRun(allPass ? "passed" : "failed");

    if (allPass) {
      try {
        const key = `solved:${bookId}`;
        const raw = localStorage.getItem(key);
        const arr: string[] = raw ? JSON.parse(raw) : [];
        if (!arr.includes(problemId)) {
          arr.push(problemId);
          localStorage.setItem(key, JSON.stringify(arr));
        }
      } catch { /* ignore */ }
      setPassFlash(true);
      setTimeout(() => setPassFlash(false), 1200);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
      // XP 지급 + 미션 트래킹
      await awardXP("quiz_correct", `problem-book:${bookId}:${problemId}`);
      trackMission("quiz_solve");
    }
  }, [problem, code, compile, bookId, problemId]);

  /* keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.ctrlKey && !e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun, handleSubmit]);

  /* not found */
  if (!problem || !book) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 15, color: "#64748b", marginBottom: 12 }}>문제를 찾을 수 없습니다.</div>
        <Link href={`/dashboard/learning/problem-book/${bookId}`} style={{ color: "#3b82f6" }}>
          문제 목록으로
        </Link>
      </div>
    );
  }

  /* prev/next navigation */
  const levelPrefix = bookId === "c-problems" ? "c" : "py";
  const currentLevel = book.levels.find((l) => l.id === `${levelPrefix}-${problem.level}`);
  const problemIdx = currentLevel?.problems.findIndex((p) => p.id === problemId) ?? -1;
  const prevProblem = problemIdx > 0 ? currentLevel?.problems[problemIdx - 1] : null;
  const nextProblem = currentLevel && problemIdx < currentLevel.problems.length - 1
    ? currentLevel.problems[problemIdx + 1] : null;

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
      transition: "background 0.3s",
      background: passFlash ? "rgba(34,197,94,0.04)" : undefined,
    }}>
      <Confetti active={confetti} />

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px",
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        <Link href={`/dashboard/learning/problem-book/${bookId}`} style={{
          display: "flex", alignItems: "center", gap: 4,
          color: "#94a3b8", fontSize: 12, fontWeight: 600,
          textDecoration: "none", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          {book.title}
        </Link>
        <span style={{ color: "#e2e8f0" }}>/</span>
        <DiffBadge difficulty={problem.difficulty} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", flex: 1, minWidth: 0 }}>
          {problem.title}
        </span>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 6,
          background: `${bookColor}12`, border: `1px solid ${bookColor}30`,
          fontSize: 12, fontWeight: 700, color: bookColor, flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>code</span>
          {langCfg.label}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {prevProblem && (
            <button onClick={() => router.push(`/dashboard/learning/problem-book/${bookId}/${prevProblem.id}`)} style={{
              padding: "4px 8px", borderRadius: 6,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              fontSize: 11, fontWeight: 600, color: "#64748b",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>이전
            </button>
          )}
          {nextProblem && (
            <button onClick={() => router.push(`/dashboard/learning/problem-book/${bookId}/${nextProblem.id}`)} style={{
              padding: "4px 8px", borderRadius: 6,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              fontSize: 11, fontWeight: 600, color: "#64748b",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
            }}>
              다음<span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </button>
          )}
        </div>
      </div>

      {/* Split pane */}
      <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: Problem panel */}
        <div style={{
          width: `${leftPct}%`, minWidth: "25%",
          overflow: "auto", background: "#fff", borderRight: "1px solid #e2e8f0",
        }}>
          <div style={{ padding: "20px 24px 48px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              {problem.title}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
              {problem.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#64748b" }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Problem */}
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 10px", paddingBottom: 6, borderBottom: "2px solid #e2e8f0" }}>
                문제
              </h2>
              {problem.imageUrl && (
                <img src={problem.imageUrl} alt="문제 이미지" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 12 }} />
              )}
              <SafeHTML html={problem.description} style={{ fontSize: 14, color: "#334155", lineHeight: 1.8 }} />
            </section>

            {/* Input */}
            <section style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", paddingBottom: 6, borderBottom: "2px solid #e2e8f0" }}>
                입력
              </h2>
              <SafeHTML html={problem.inputDesc} style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }} />
            </section>

            {/* Output */}
            <section style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", paddingBottom: 6, borderBottom: "2px solid #e2e8f0" }}>
                출력
              </h2>
              <SafeHTML html={problem.outputDesc} style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }} />
            </section>

            {/* Examples */}
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 10px", paddingBottom: 6, borderBottom: "2px solid #e2e8f0" }}>
                예제 입출력
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {problem.examples.map((ex, i) => (
                  <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "6px 12px", background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                      예제 {i + 1}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                      <ExampleBox label="입력" content={ex.input} borderRight />
                      <ExampleBox label="출력" content={ex.output} />
                    </div>
                    {ex.explanation && (
                      <div style={{ padding: "8px 12px", background: "#fffbeb", fontSize: 12, color: "#78716c", lineHeight: 1.6, borderTop: "1px solid #fef3c7" }}>
                        <strong style={{ color: "#92400e" }}>설명: </strong>{ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Hint */}
            {problem.hint && (
              <section style={{ marginBottom: 20 }}>
                <button onClick={() => setShowHint(!showHint)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#fffbeb", border: "1px solid #fef3c7",
                  borderRadius: showHint ? "8px 8px 0 0" : 8, padding: "8px 14px",
                  fontSize: 13, fontWeight: 700, color: "#b45309",
                  cursor: "pointer", width: "100%",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lightbulb</span>
                  힌트 {showHint ? "숨기기" : "보기"}
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: "auto" }}>
                    {showHint ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        padding: "12px 14px",
                        background: "#fffbeb", border: "1px solid #fef3c7",
                        borderTop: "none", borderRadius: "0 0 8px 8px",
                        fontSize: 13, color: "#92400e", lineHeight: 1.7,
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                      }}>
                        {problem.hint}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* 해설 / 풀이 */}
            {problem.solution && (
              <section style={{ marginBottom: 20 }}>
                <button onClick={() => setShowSolution(!showSolution)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#eff6ff", border: "1px solid #dbeafe",
                  borderRadius: showSolution ? "8px 8px 0 0" : 8, padding: "8px 14px",
                  fontSize: 13, fontWeight: 700, color: "#1d4ed8",
                  cursor: "pointer", width: "100%",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                  해설/풀이 {showSolution ? "숨기기" : "보기"}
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: "auto" }}>
                    {showSolution ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <AnimatePresence>
                  {showSolution && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        padding: "14px 16px",
                        background: "#eff6ff", border: "1px solid #dbeafe",
                        borderTop: "none", borderRadius: "0 0 8px 8px",
                        fontSize: 13, color: "#1e3a8a", lineHeight: 1.7,
                      }}>
                        <SafeHTML html={problem.solution} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Related URL */}
            {problem.relatedUrl && (
              <section style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", paddingBottom: 6, borderBottom: "2px solid #e2e8f0" }}>
                  참고
                </h2>
                <a href={problem.relatedUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "#3b82f6", fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                  유사 문제 보기
                </a>
              </section>
            )}

            {/* Tags toggle */}
            <button onClick={() => setShowTags(!showTags)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "6px 12px",
              fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
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
                  style={{ overflow: "hidden", marginTop: 8 }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, paddingBottom: 4 }}>
                    {problem.tags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: 12, fontWeight: 700,
                        color: bookColor, background: `${bookColor}10`,
                        border: `1px solid ${bookColor}30`,
                        borderRadius: 6, padding: "3px 10px",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div
          onMouseDown={handleDragStart}
          style={{
            width: 5, cursor: "col-resize", background: "#e2e8f0",
            flexShrink: 0, transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = bookColor; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#e2e8f0"; }}
        />

        {/* Right: Compiler panel */}
        <div style={{
          flex: 1, minWidth: "25%",
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "#090c10",
        }}>
          {/* Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px",
            background: "#0d1117",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: lang === "c" ? "#60a5fa" : "#4ade80",
              background: lang === "c" ? "rgba(96,165,250,0.1)" : "rgba(74,222,128,0.1)",
              padding: "2px 8px", borderRadius: 4,
            }}>
              {langCfg.label}
            </span>
            {/* 실행 시간 배지 */}
            {lastExecTime !== null && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: "#94a3b8", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "2px 8px", borderRadius: 4,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>timer</span>
                {lastExecTime}ms
              </span>
            )}
            <div style={{ flex: 1 }} />
            {/* 코드 초기화 버튼 */}
            <button
              onClick={() => {
                if (confirm("코드를 초기화하시겠습니까?")) {
                  setCode(STARTER[lang]);
                }
              }}
              title="코드 초기화"
              style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "4px 8px", borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>restart_alt</span>
              초기화
            </button>
            <button onClick={() => setShowStdin(!showStdin)} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6,
              border: showStdin ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
              background: showStdin ? "rgba(255,255,255,0.08)" : "transparent",
              color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>keyboard_alt</span>
              stdin
            </button>
            {/* Run */}
            <button onClick={handleRun} disabled={running} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 6, border: "none",
              background: running ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.85)",
              color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer", transition: "all 0.15s",
            }}>
              {running ? <Spinner /> : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span>}
              {running ? "실행 중..." : "실행 (Ctrl+↵)"}
            </button>
            {/* Submit */}
            <button onClick={handleSubmit} disabled={submitStatus === "running"} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 6, border: "none",
              background: submitStatus === "running" ? "rgba(59,130,246,0.3)"
                : submitStatus === "pass" ? "rgba(34,197,94,0.85)"
                : submitStatus === "fail" ? "rgba(239,68,68,0.85)"
                : "rgba(59,130,246,0.85)",
              color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: submitStatus === "running" ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}>
              {submitStatus === "running" ? <Spinner />
                : submitStatus === "pass" ? <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                : submitStatus === "fail" ? <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>}
              {submitStatus === "running"
                ? (gradingProgress
                    ? `${gradingProgress.current}/${gradingProgress.total} 테스트 중...`
                    : "채점 중...")
                : submitStatus === "pass" ? "정답!"
                : submitStatus === "fail" ? "오답"
                : "제출 (Ctrl+⇧+↵)"}
            </button>
          </div>

          {/* stdin panel */}
          <AnimatePresence>
            {showStdin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 84, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
              >
                <div style={{ padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#484f58", marginBottom: 4 }}>표준 입력 (stdin)</div>
                  <textarea
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    placeholder="입력값을 여기에 작성..."
                    style={{
                      width: "100%", height: 48,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 4, color: "#e6edf3", fontSize: 12,
                      fontFamily: "monospace", padding: "6px 8px",
                      resize: "none", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Monaco editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={langCfg.monaco}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              theme="cs-black"
              beforeMount={(monaco) => defineTheme(monaco)}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Terminal output */}
          <div style={{
            minHeight: 80, maxHeight: 240,
            background: "#0a0e14",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            overflow: "auto", flexShrink: 0,
          }}>
            {/* 채점 중 프로그레스 바 */}
            {submitStatus === "running" && gradingProgress && (
              <div style={{ padding: "8px 12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#484f58" }}>
                    테스트 {gradingProgress.current} / {gradingProgress.total}
                  </span>
                  <span style={{ fontSize: 10, color: "#484f58" }}>
                    {Math.round((gradingProgress.current / gradingProgress.total) * 100)}%
                  </span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(gradingProgress.current / gradingProgress.total) * 100}%`,
                    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            )}

            {/* Submit result banner */}
            <AnimatePresence>
              {(submitStatus === "pass" || submitStatus === "fail") && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", gap: 10,
                    background: submitStatus === "pass" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: submitStatus === "pass" ? "#22c55e" : "#ef4444",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>
                      {submitStatus === "pass" ? "check" : "close"}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: submitStatus === "pass" ? "#4ade80" : "#f87171" }}>
                      {submitStatus === "pass"
                        ? "정답! 모든 테스트케이스 통과"
                        : `오답 — ${passCount}/${problem.testCases.length} 통과`}
                    </div>
                    <div style={{ fontSize: 11, color: "#484f58", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{problem.testCases.length}개 테스트케이스 실행 완료</span>
                      {lastExecTime !== null && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>timer</span>
                          총 {lastExecTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 테스트 통과 프로그레스 */}
                  {submitStatus === "fail" && (
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#484f58", marginBottom: 3 }}>
                        통과율
                      </div>
                      <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(passCount / problem.testCases.length) * 100}%`,
                          background: "#f87171",
                          borderRadius: 2,
                        }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Test case results */}
            {testResults.length > 0 && (
              <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#484f58", marginBottom: 2 }}>테스트케이스 결과</div>
                {testResults.map((r) => <TestResultBadge key={r.index} result={r} />)}
              </div>
            )}

            {/* Run output — 로컬 실행 결과 */}
            {(runLines.length > 0 || running) && testResults.length === 0 && (
              <div style={{ padding: "8px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#484f58", marginBottom: 4 }}>실행 출력</div>
                {running && <div style={{ fontSize: 12, color: "#484f58", fontStyle: "italic" }}>실행 중...</div>}
                {runLines.map((line, i) => (
                  <pre key={i} style={{
                    margin: 0,
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    color: line.type === "stderr"
                      ? "#fca5a5"
                      : line.type === "info"
                      ? "#484f58"
                      : "#e6edf3",
                  }}>
                    {line.text}
                  </pre>
                ))}
              </div>
            )}

            {/* Default hint */}
            {!running && runLines.length === 0 && testResults.length === 0 && submitStatus === "idle" && (
              <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#484f58" }}>terminal</span>
                <span style={{ fontSize: 12, color: "#484f58" }}>Ctrl+Enter 실행 · Ctrl+Shift+Enter 제출</span>
              </div>
            )}
          </div>

          {/* 하단 이전/다음 네비게이션 */}
          {(prevProblem || nextProblem) && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px",
              background: "#0d1117",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              {prevProblem ? (
                <button
                  onClick={() => router.push(`/dashboard/learning/problem-book/${bookId}/${prevProblem.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "transparent",
                    color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
                  이전 문제
                </button>
              ) : <div />}
              {nextProblem ? (
                <button
                  onClick={() => router.push(`/dashboard/learning/problem-book/${bookId}/${nextProblem.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "transparent",
                    color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>
                  다음 문제
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              ) : <div />}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pbspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── 외부 export: params Promise 언래핑 + Suspense 래핑 ── */
function ProblemSolvePageLoader({
  params,
}: {
  params: Promise<{ bookId: string; problemId: string }>;
}) {
  const { bookId, problemId } = use(params);
  return <ProblemSolvePageInner bookId={bookId} problemId={problemId} />;
}

export default function ProblemSolvePage({
  params,
}: {
  params: Promise<{ bookId: string; problemId: string }>;
}) {
  return (
    <Suspense fallback={
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", background: "#fff", color: "#94a3b8",
        flexDirection: "column", gap: 12, fontSize: 14,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#cbd5e1" }}>
          hourglass_top
        </span>
        문제 불러오는 중...
      </div>
    }>
      <ProblemSolvePageLoader params={params} />
    </Suspense>
  );
}
