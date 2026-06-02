"use client";

/**
 * 학습 unit 페이지의 컴파일러 패널 — bottom drawer 패턴.
 *
 * 담당자 명시:
 * - "컴파일러 바로 보이게 하자 메모장 말고" → default OPEN
 * - "vscode급 이상" → Monaco IntelliSense + bracket colorization + 미니맵 + 자동 포매팅
 *
 * 동작:
 * - default: 화면 하단 55vh drawer 열림 (학습 슬라이드 + 컴파일러 동시 보임)
 * - 닫기 → fab 버튼으로 다시 열기
 * - 코드 자동 저장 (localStorage by courseId/unitId)
 * - Ctrl+Enter 실행 / Ctrl+S 저장
 */

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div style={{
            height: "100%",
            background: "#0d1117",
            color: "#484f58",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            gap: 8,
        }}>
            <span style={{
                width: 12, height: 12, borderRadius: "50%",
                border: "2px solid #484f58", borderTopColor: "#58a6ff",
                animation: "ucp-spin 0.7s linear infinite",
                display: "inline-block",
            }} />
            에디터 로딩 중...
        </div>
    ),
});

const STARTERS = {
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
    python: `# 여기에 코드를 작성하세요
print("Hello, World!")
`,
};

interface Props {
    unitId: string;
    courseId: string;
    language?: "cpp" | "python";
}

const PANEL_OPEN_KEY = "ucp:open";
const codeKey = (courseId: string, unitId: string) => `ucp:code:${courseId}:${unitId}`;

export default function UnitCompilerPanel({ unitId, courseId, language = "cpp" }: Props) {
    const [open, setOpen] = useState(true);
    const [code, setCode] = useState(STARTERS[language]);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState<{ stdout: string; stderr: string; success: boolean } | null>(null);
    const [execTime, setExecTime] = useState<number | null>(null);
    const codeRef = useRef(code);

    // hydration: localStorage에서 open + 코드 복원
    useEffect(() => {
        const savedOpen = localStorage.getItem(PANEL_OPEN_KEY);
        if (savedOpen !== null) setOpen(savedOpen === "1");
        const savedCode = localStorage.getItem(codeKey(courseId, unitId));
        if (savedCode) {
            setCode(savedCode);
            codeRef.current = savedCode;
        }
    }, [courseId, unitId]);

    const onCodeChange = useCallback((v: string | undefined) => {
        const next = v || "";
        setCode(next);
        codeRef.current = next;
        try { localStorage.setItem(codeKey(courseId, unitId), next); } catch { /* quota */ }
    }, [courseId, unitId]);

    const toggle = useCallback(() => {
        setOpen(prev => {
            const next = !prev;
            localStorage.setItem(PANEL_OPEN_KEY, next ? "1" : "0");
            return next;
        });
    }, []);

    const run = useCallback(async () => {
        setRunning(true);
        setOutput(null);
        const t0 = performance.now();
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: codeRef.current, language }),
            });
            const data = await res.json();
            setOutput({
                stdout: data.program_output || data.stdout || "",
                stderr: data.compiler_error || data.program_error || data.stderr || "",
                success: !!(data.program_output || data.stdout) && !data.compiler_error && !data.program_error,
            });
            setExecTime(Math.round(performance.now() - t0));
        } catch (e) {
            setOutput({ stdout: "", stderr: "네트워크 오류", success: false });
        } finally {
            setRunning(false);
        }
    }, [language]);

    // 단축키: Ctrl+Enter (실행) / Ctrl+S (저장 — localStorage 자동이라 토스트만)
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                run();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, run]);

    return (
        <>
            <style jsx global>{`@keyframes ucp-spin { to { transform: rotate(360deg); } }`}</style>

            {/* Drawer */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="ucp-drawer"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 240, damping: 30 }}
                        style={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "min(55vh, 520px)",
                            background: "#0d1117",
                            zIndex: 90,
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 -16px 48px rgba(0,0,0,0.35)",
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderBottom: "none",
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "linear-gradient(180deg, #161b22, #0d1117)",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            gap: 10,
                            flexShrink: 0,
                        }}>
                            <span className="material-symbols-outlined" style={{ color: "#60a5fa", fontSize: 20 }}>
                                terminal
                            </span>
                            <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 800, letterSpacing: "0.02em" }}>
                                {language === "cpp" ? "C++" : "Python"} 컴파일러
                            </span>
                            <span style={{
                                fontSize: 10,
                                padding: "2px 7px",
                                borderRadius: 4,
                                background: "rgba(96,165,250,0.12)",
                                color: "#60a5fa",
                                fontWeight: 700,
                            }}>
                                자동 저장
                            </span>
                            {execTime !== null && (
                                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                                    ⏱ {execTime}ms
                                </span>
                            )}
                            <span style={{ color: "#484f58", fontSize: 10, marginLeft: 4 }}>
                                Ctrl+Enter 실행
                            </span>
                            <div style={{ flex: 1 }} />
                            <button
                                onClick={run}
                                disabled={running}
                                style={{
                                    background: running ? "rgba(34,197,94,0.25)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                                    color: "#fff",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    padding: "6px 16px",
                                    borderRadius: 7,
                                    border: "none",
                                    cursor: running ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    boxShadow: running ? "none" : "0 2px 8px rgba(34,197,94,0.3)",
                                }}
                            >
                                {running ? (
                                    <>
                                        <span style={{
                                            width: 10, height: 10, borderRadius: "50%",
                                            border: "2px solid rgba(255,255,255,0.3)",
                                            borderTopColor: "#fff",
                                            animation: "ucp-spin 0.7s linear infinite",
                                            display: "inline-block",
                                        }} />
                                        실행 중
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span>
                                        실행
                                    </>
                                )}
                            </button>
                            <button
                                onClick={toggle}
                                aria-label="컴파일러 닫기"
                                style={{
                                    background: "transparent",
                                    color: "#94a3b8",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 4,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>keyboard_arrow_down</span>
                            </button>
                        </div>

                        {/* Editor + Output 좌우 분할 */}
                        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                            <div style={{ flex: 1.6, minWidth: 0, position: "relative" }}>
                                <Editor
                                    height="100%"
                                    language={language}
                                    value={code}
                                    onChange={onCodeChange}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                                        fontLigatures: true,
                                        minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
                                        lineNumbers: "on",
                                        scrollBeyondLastLine: false,
                                        wordWrap: "on",
                                        automaticLayout: true,
                                        tabSize: 4,
                                        insertSpaces: true,
                                        renderLineHighlight: "all",
                                        renderWhitespace: "selection",
                                        cursorBlinking: "smooth",
                                        cursorSmoothCaretAnimation: "on",
                                        smoothScrolling: true,
                                        bracketPairColorization: { enabled: true },
                                        guides: { indentation: true, bracketPairs: "active", highlightActiveIndentation: true },
                                        suggest: { preview: true, showStatusBar: true, insertMode: "insert" },
                                        quickSuggestions: { other: true, comments: false, strings: false },
                                        suggestOnTriggerCharacters: true,
                                        acceptSuggestionOnEnter: "on",
                                        formatOnPaste: true,
                                        formatOnType: true,
                                        padding: { top: 14, bottom: 14 },
                                        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                                        stickyScroll: { enabled: true },
                                        linkedEditing: true,
                                        autoClosingBrackets: "always",
                                        autoClosingQuotes: "always",
                                        autoIndent: "full",
                                        folding: true,
                                        foldingHighlight: true,
                                        showFoldingControls: "mouseover",
                                    }}
                                />
                            </div>

                            {/* Output panel */}
                            <div style={{
                                flex: 1,
                                minWidth: 200,
                                background: "#0a0e14",
                                borderLeft: "1px solid rgba(255,255,255,0.08)",
                                display: "flex",
                                flexDirection: "column",
                            }}>
                                <div style={{
                                    padding: "8px 12px",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#484f58",
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>output</span>
                                    출력
                                    {output && (
                                        <span style={{
                                            marginLeft: "auto",
                                            color: output.success ? "#4ade80" : "#f87171",
                                            fontSize: 10,
                                        }}>
                                            {output.success ? "● 성공" : "● 오류"}
                                        </span>
                                    )}
                                </div>
                                <pre style={{
                                    margin: 0,
                                    flex: 1,
                                    padding: "10px 12px",
                                    fontSize: 12,
                                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                                    lineHeight: 1.6,
                                    overflow: "auto",
                                    whiteSpace: "pre-wrap",
                                    color: output ? (output.success ? "#e6edf3" : "#fca5a5") : "#484f58",
                                }}>
                                    {output
                                        ? (output.stdout || output.stderr || "(출력 없음)")
                                        : "▶ 실행 버튼 또는 Ctrl+Enter\n\n자동 저장 — 새로고침해도 코드 보존"
                                    }
                                </pre>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 닫혔을 때 fab */}
            {!open && (
                <motion.button
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    onClick={toggle}
                    aria-label="컴파일러 열기"
                    style={{
                        position: "fixed",
                        bottom: 20,
                        right: 20,
                        zIndex: 89,
                        background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                        color: "#fff",
                        padding: "13px 20px",
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 800,
                        boxShadow: "0 8px 28px rgba(30,58,138,0.45), 0 2px 8px rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        letterSpacing: "0.02em",
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>terminal</span>
                    컴파일러 열기
                </motion.button>
            )}
        </>
    );
}
