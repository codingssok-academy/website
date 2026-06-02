"use client";

/**
 * 나바쌤 메시지 렌더러 — 마크다운 코드 블록 파싱 + 실행 버튼
 *
 * ```lang\ncode\n``` 패턴을 감지하여:
 *  - 코드 블록은 실행 버튼과 함께 별도 렌더링
 *  - 나머지 텍스트는 pre-wrap으로 그대로 표시
 */

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface CodeBlock {
    lang: string;
    code: string;
}

interface Segment {
    type: "text" | "code";
    content: string;
    lang?: string;
}

const EXECUTABLE_LANGS = new Set(["c", "cpp", "python", "javascript", "java", "py", "js"]);
const LANG_ALIAS: Record<string, string> = {
    py: "python", js: "javascript", "c++": "cpp",
};

function parseMessage(content: string): Segment[] {
    const segments: Segment[] = [];
    const pattern = /```([a-zA-Z+]*)\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(pattern)];
    let lastIndex = 0;

    for (const match of matches) {
        const startIdx = match.index ?? 0;
        if (startIdx > lastIndex) {
            segments.push({
                type: "text",
                content: content.slice(lastIndex, startIdx),
            });
        }
        const rawLang = (match[1] || "").toLowerCase();
        const lang = LANG_ALIAS[rawLang] || rawLang;
        segments.push({
            type: "code",
            lang,
            content: match[2].trimEnd(),
        });
        lastIndex = startIdx + match[0].length;
    }
    if (lastIndex < content.length) {
        segments.push({ type: "text", content: content.slice(lastIndex) });
    }
    return segments;
}

function CodeBlockView({ block }: { block: CodeBlock }) {
    const [output, setOutput] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const runnable = EXECUTABLE_LANGS.has(block.lang);

    const run = useCallback(async () => {
        if (running) return;
        setRunning(true);
        setOutput(null);
        setStatus("idle");
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: block.code,
                    language: block.lang,
                    stdin: "",
                }),
            });
            const data = await res.json();
            if (data.success) {
                setOutput(data.stdout || "(출력 없음)");
                setStatus("success");
            } else {
                setOutput(data.stderr || data.error || "실행 오류");
                setStatus("error");
            }
        } catch {
            setOutput("서버 연결 실패");
            setStatus("error");
        }
        setRunning(false);
    }, [block, running]);

    const copy = useCallback(() => {
        navigator.clipboard?.writeText(block.code).catch(() => { /* ignore */ });
    }, [block]);

    return (
        <div style={{ borderRadius: 10, overflow: "hidden", background: "#0f172a", border: "1px solid #1e293b" }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 10px", background: "#1e293b",
                fontSize: 10, color: "#94a3b8", fontWeight: 600,
            }}>
                <span>{block.lang || "code"}</span>
                <div style={{ display: "flex", gap: 4 }}>
                    <button
                        onClick={copy}
                        title="복사"
                        style={{
                            padding: "3px 8px", borderRadius: 5, border: "none",
                            background: "rgba(255,255,255,0.06)", color: "#cbd5e1",
                            fontSize: 10, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 3,
                            fontFamily: "inherit",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>content_copy</span>
                        복사
                    </button>
                    {runnable && (
                        <button
                            onClick={run}
                            disabled={running}
                            title="실행"
                            style={{
                                padding: "3px 8px", borderRadius: 5, border: "none",
                                background: running ? "#475569" : "#22c55e",
                                color: "#fff", fontSize: 10, fontWeight: 700, cursor: running ? "wait" : "pointer",
                                display: "flex", alignItems: "center", gap: 3,
                                fontFamily: "inherit",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>
                                {running ? "hourglass_top" : "play_arrow"}
                            </span>
                            {running ? "실행 중" : "실행"}
                        </button>
                    )}
                </div>
            </div>
            <pre style={{
                margin: 0, padding: "10px 12px",
                fontSize: 12, lineHeight: 1.55, color: "#e2e8f0",
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>
                {block.code}
            </pre>
            {output !== null && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    style={{
                        borderTop: "1px solid #1e293b",
                        background: status === "error" ? "#2d1b1b" : "#0a2818",
                        padding: "8px 12px",
                        fontSize: 11, lineHeight: 1.55,
                        color: status === "error" ? "#fca5a5" : "#86efac",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "pre-wrap", wordBreak: "break-all",
                        maxHeight: 200, overflow: "auto",
                    }}
                >
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                        {status === "error" ? "STDERR" : "STDOUT"}
                    </div>
                    {output}
                </motion.div>
            )}
        </div>
    );
}

export default function TutorMessage({ content }: { content: string }) {
    const segments = useMemo(() => parseMessage(content), [content]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {segments.map((seg, i) => {
                if (seg.type === "text") {
                    if (!seg.content.trim()) return null;
                    return (
                        <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {seg.content}
                        </div>
                    );
                }
                return <CodeBlockView key={i} block={{ lang: seg.lang || "", code: seg.content }} />;
            })}
        </div>
    );
}
