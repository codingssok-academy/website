"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ═══════════════════════════════════════
   코딩쏙 학습 에디터 — 컴파일러급 기능
   ═══════════════════════════════════════ */

const LANG_OPTIONS = [
    { value: "c", label: "C", ext: ".c", monaco: "c", default: '#include <stdio.h>\n\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}' },
    { value: "python", label: "Python", ext: ".py", monaco: "python", default: '# Python\nprint("Hello!")' },
    { value: "cpp", label: "C++", ext: ".cpp", monaco: "cpp", default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}' },
    { value: "javascript", label: "JS", ext: ".js", monaco: "javascript", default: 'console.log("Hello!");' },
    { value: "java", label: "Java", ext: ".java", monaco: "java", default: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}' },
];

const SNIPPETS: Record<string, { label: string; code: string }[]> = {
    c: [
        { label: "Hello World", code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
        { label: "scanf 입력", code: '#include <stdio.h>\n\nint main() {\n    int n;\n    printf("숫자 입력: ");\n    scanf("%d", &n);\n    printf("입력값: %d\\n", n);\n    return 0;\n}' },
        { label: "배열 반복", code: '#include <stdio.h>\n\nint main() {\n    int arr[] = {1, 2, 3, 4, 5};\n    int len = sizeof(arr) / sizeof(arr[0]);\n    for (int i = 0; i < len; i++) {\n        printf("%d ", arr[i]);\n    }\n    printf("\\n");\n    return 0;\n}' },
        { label: "함수 정의", code: '#include <stdio.h>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("3 + 5 = %d\\n", add(3, 5));\n    return 0;\n}' },
        { label: "포인터", code: '#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int *p = &x;\n    printf("값: %d, 주소: %p\\n", *p, (void*)p);\n    return 0;\n}' },
        { label: "구조체", code: '#include <stdio.h>\n\ntypedef struct {\n    char name[20];\n    int age;\n} Person;\n\nint main() {\n    Person p = {"홍길동", 15};\n    printf("%s (%d세)\\n", p.name, p.age);\n    return 0;\n}' },
    ],
    python: [
        { label: "Hello World", code: 'print("Hello, World!")' },
        { label: "입력 받기", code: 'name = input("이름: ")\nprint(f"안녕, {name}!")' },
        { label: "리스트", code: 'nums = [1, 2, 3, 4, 5]\nfor n in nums:\n    print(n, end=" ")\nprint()' },
        { label: "함수", code: 'def add(a, b):\n    return a + b\n\nprint(f"3 + 5 = {add(3, 5)}")' },
        { label: "클래스", code: 'class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    def greet(self):\n        print(f"안녕! 나는 {self.name}")\n\np = Person("홍길동", 15)\np.greet()' },
    ],
    cpp: [
        { label: "Hello World", code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
        { label: "벡터", code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v = {1, 2, 3, 4, 5};\n    for (int x : v) cout << x << " ";\n    cout << endl;\n    return 0;\n}' },
    ],
    javascript: [
        { label: "Hello World", code: 'console.log("Hello, World!");' },
        { label: "배열 메서드", code: 'const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled);' },
    ],
    java: [
        { label: "Hello World", code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
    ],
};

const SHORTCUTS = [
    { key: "F5", desc: "코드 실행" },
    { key: "Ctrl+S", desc: "코드 저장" },
    { key: "Ctrl+/", desc: "주석 토글" },
    { key: "Ctrl+Z", desc: "실행 취소" },
    { key: "Ctrl+Shift+Z", desc: "다시 실행" },
    { key: "Ctrl+D", desc: "단어 선택" },
    { key: "Ctrl+L", desc: "줄 선택" },
    { key: "Alt+↑↓", desc: "줄 이동" },
];

/* ── 입력 함수 감지 패턴 ── */
const INPUT_PATTERNS: Record<string, RegExp> = {
    c: /\b(scanf|gets|fgets|getchar|fscanf)\s*\(/,
    cpp: /\b(cin\s*>>|getline\s*\(|scanf|gets|getchar)/,
    python: /\binput\s*\(/,
    javascript: /\bprompt\s*\(/,
    java: /\b(Scanner|BufferedReader|readLine)\b/,
};

function codeNeedsInput(code: string, lang: string): boolean {
    const pat = INPUT_PATTERNS[lang];
    return pat ? pat.test(code) : false;
}

interface Props {
    contextLabel?: string;
    onCodeRun?: () => void;
}

export default function MiniCodeEditor({ contextLabel, onCodeRun }: Props) {
    const [lang, setLang] = useState("c");
    const [code, setCode] = useState(LANG_OPTIONS[0].default);
    const [stdin, setStdin] = useState("");
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error" | "waiting_input">("idle");
    const [execTime, setExecTime] = useState<number | null>(null);
    const [showStdin, setShowStdin] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const [rightPanel, setRightPanel] = useState<"none" | "snippets" | "shortcuts">("none");
    const [terminalH, setTerminalH] = useState(expanded ? 180 : 140);
    const [compileCount, setCompileCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [stdinLines, setStdinLines] = useState<string[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const stdinInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<unknown>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 코드 저장/복원
    const storageKey = `codingssok_mini_editor_${lang}`;
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem(storageKey);
        if (saved) setCode(saved);
        const cc = parseInt(localStorage.getItem("cs-cc") || "0");
        const sc = parseInt(localStorage.getItem("cs-sc") || "0");
        setCompileCount(cc);
        setSuccessCount(sc);
    }, [storageKey]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const timer = setTimeout(() => localStorage.setItem(storageKey, code), 500);
        return () => clearTimeout(timer);
    }, [code, storageKey]);

    // 키보드 단축키
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "F5") { e.preventDefault(); runCode(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    const switchLang = (newLang: string) => {
        localStorage.setItem(storageKey, code);
        setLang(newLang);
        const opt = LANG_OPTIONS.find(l => l.value === newLang);
        const saved = localStorage.getItem(`codingssok_mini_editor_${newLang}`);
        setCode(saved || opt?.default || "");
        setOutput(""); setStatus("idle");
    };

    // 실제 컴파일 실행 (stdin 확정 후)
    const executeWithStdin = useCallback(async (finalStdin: string) => {
        setStatus("running"); setExecTime(null);
        const t0 = performance.now();
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language: lang, stdin: finalStdin }),
            });
            const data = await res.json();
            const ms = Math.round(performance.now() - t0);
            setExecTime(ms);
            const cc = compileCount + 1;
            setCompileCount(cc);
            localStorage.setItem("cs-cc", String(cc));
            if (!data.success) {
                setOutput(prev => prev + (data.stderr || data.error || "오류 발생"));
                setStatus("error");
            } else {
                setOutput(prev => prev + (data.stdout || "(출력 없음)"));
                setStatus("success");
                const sc = successCount + 1;
                setSuccessCount(sc);
                localStorage.setItem("cs-sc", String(sc));
                onCodeRun?.();
            }
        } catch {
            setOutput(prev => prev + "서버 연결 실패");
            setStatus("error");
            setExecTime(Math.round(performance.now() - t0));
        }
    }, [code, lang, onCodeRun, compileCount, successCount]);

    // 실행 버튼: 입력 필요 시 대기, 아니면 바로 실행
    const runCode = useCallback(async () => {
        setOutput(""); setExecTime(null); setStdinLines([]); setCurrentInput("");
        if (codeNeedsInput(code, lang) && !stdin) {
            // 입력이 필요한데 사전 입력(stdin)이 없는 경우 → 인터랙티브 모드
            setStatus("waiting_input");
            setTerminalH(h => Math.max(h, 180));
            setTimeout(() => stdinInputRef.current?.focus(), 100);
        } else {
            // 입력 불필요 또는 사전 입력 있음 → 바로 실행
            executeWithStdin(stdin);
        }
    }, [code, lang, stdin, executeWithStdin]);

    // 인터랙티브 입력 제출 (Ctrl+Enter 또는 전송 버튼)
    const submitInteractiveInput = useCallback(() => {
        const allLines = [...stdinLines, ...(currentInput ? [currentInput] : [])];
        const finalStdin = allLines.join("\n");
        setStdin(finalStdin);
        setOutput(prev => prev + "\n");
        executeWithStdin(finalStdin);
    }, [stdinLines, currentInput, executeWithStdin]);

    // Enter키로 줄 추가
    const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitInteractiveInput();
        } else if (e.key === "Enter") {
            e.preventDefault();
            setStdinLines(prev => [...prev, currentInput]);
            setOutput(prev => prev + currentInput + "\n");
            setCurrentInput("");
        }
    }, [currentInput, submitInteractiveInput]);

    const insertSnippet = (snippetCode: string) => {
        setCode(snippetCode);
        setRightPanel("none");
    };

    const resetCode = () => {
        const opt = LANG_OPTIONS.find(l => l.value === lang);
        setCode(opt?.default || "");
        setOutput(""); setStatus("idle");
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
    };

    const langSnippets = useMemo(() => SNIPPETS[lang] || [], [lang]);
    const statusDot = status === "success" ? "#5efc8e" : status === "error" ? "#ff6b6b" : status === "running" ? "#fbbf24" : status === "waiting_input" ? "#7daaff" : "#475569";

    // Monaco 커스텀 테마 등록
    const handleEditorMount = useCallback((editor: unknown, monaco: { editor: { defineTheme: (name: string, theme: unknown) => void } }) => {
        editorRef.current = editor;
        monaco.editor.defineTheme("cs-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "keyword", foreground: "c084fc", fontStyle: "bold" },
                { token: "type", foreground: "5eead4" },
                { token: "string", foreground: "86efac" },
                { token: "string.escape", foreground: "fcd34d" },
                { token: "comment", foreground: "6b7280", fontStyle: "italic" },
                { token: "number", foreground: "7dd3fc" },
                { token: "function", foreground: "fdba74" },
                { token: "variable", foreground: "e0e0e0" },
                { token: "operator", foreground: "7daaff" },
                { token: "delimiter", foreground: "94a3b8" },
                { token: "predefined", foreground: "67e8f9" },
            ],
            colors: {
                "editor.background": "#0a0a0f",
                "editor.foreground": "#e0e0e0",
                "editor.lineHighlightBackground": "#ffffff08",
                "editor.selectionBackground": "#3b82f640",
                "editorCursor.foreground": "#7daaff",
                "editorLineNumber.foreground": "#334155",
                "editorLineNumber.activeForeground": "#7daaff",
                "editor.inactiveSelectionBackground": "#3b82f620",
                "editorIndentGuide.background": "#1e293b",
                "editorIndentGuide.activeBackground": "#334155",
                "editorBracketMatch.background": "#7daaff30",
                "editorBracketMatch.border": "#7daaff60",
            },
        });
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex", flexDirection: "column",
                height: expanded ? "85vh" : "100%",
                maxHeight: expanded ? "85vh" : undefined,
                background: "#0a0a0f",
                borderRadius: 12, overflow: "hidden",
                border: "1px solid #1e293b",
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                transition: "height 0.3s ease",
                position: expanded ? "fixed" : "relative",
                top: expanded ? "4vh" : undefined,
                left: expanded ? "2vw" : undefined,
                right: expanded ? "2vw" : undefined,
                zIndex: expanded ? 1000 : undefined,
                boxShadow: expanded ? "0 25px 60px rgba(0,0,0,0.6)" : undefined,
            }}
        >
            {/* ═══ 타이틀바 ═══ */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 12px", height: 36, minHeight: 36,
                background: "#0d0d14", borderBottom: "1px solid #1a1a2e",
            }}>
                {/* 언어 선택 */}
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {LANG_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => switchLang(opt.value)} style={{
                            padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                            fontSize: 10, fontWeight: lang === opt.value ? 800 : 500,
                            background: lang === opt.value ? "#7daaff20" : "transparent",
                            color: lang === opt.value ? "#7daaff" : "#64748b",
                            transition: "all 0.15s",
                        }}>
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* 우측 컨트롤 */}
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {/* 폰트 크기 */}
                    <button onClick={() => setFontSize(s => Math.max(10, s - 1))} style={iconBtnStyle} title="글자 줄이기">
                        <span style={{ fontSize: 11, color: "#64748b" }}>A-</span>
                    </button>
                    <span style={{ fontSize: 9, color: "#475569", minWidth: 18, textAlign: "center" }}>{fontSize}</span>
                    <button onClick={() => setFontSize(s => Math.min(22, s + 1))} style={iconBtnStyle} title="글자 키우기">
                        <span style={{ fontSize: 11, color: "#64748b" }}>A+</span>
                    </button>

                    <div style={{ width: 1, height: 14, background: "#1e293b", margin: "0 4px" }} />

                    {/* 스니펫 */}
                    <button onClick={() => setRightPanel(rightPanel === "snippets" ? "none" : "snippets")}
                        style={{ ...iconBtnStyle, background: rightPanel === "snippets" ? "#7daaff20" : undefined, color: rightPanel === "snippets" ? "#7daaff" : "#64748b" }}
                        title="스니펫"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>code_blocks</span>
                    </button>

                    {/* 단축키 */}
                    <button onClick={() => setRightPanel(rightPanel === "shortcuts" ? "none" : "shortcuts")}
                        style={{ ...iconBtnStyle, background: rightPanel === "shortcuts" ? "#7daaff20" : undefined, color: rightPanel === "shortcuts" ? "#7daaff" : "#64748b" }}
                        title="단축키"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard</span>
                    </button>

                    <div style={{ width: 1, height: 14, background: "#1e293b", margin: "0 4px" }} />

                    {/* 확장/축소 */}
                    <button onClick={() => setExpanded(!expanded)}
                        style={{ ...iconBtnStyle, color: expanded ? "#7daaff" : "#64748b" }}
                        title={expanded ? "축소" : "확대"}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            {expanded ? "close_fullscreen" : "open_in_full"}
                        </span>
                    </button>
                </div>
            </div>

            {/* ═══ 툴바 ═══ */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 10px", height: 32, minHeight: 32,
                background: "#08080d", borderBottom: "1px solid #1a1a2e",
            }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {/* 실행 */}
                    <button onClick={runCode} disabled={status === "running" || status === "waiting_input"} style={{
                        padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: (status === "running" || status === "waiting_input") ? "#475569" : "linear-gradient(135deg, #16a34a, #22c55e)",
                        color: "#fff", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                    }}>
                        {status === "running" ? (
                            <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> 빌드 중</>
                        ) : status === "waiting_input" ? (
                            <>⌨ 입력 대기</>
                        ) : (
                            <>▶ 실행 <span style={{ fontSize: 9, opacity: 0.7 }}>(F5)</span></>
                        )}
                    </button>

                    {/* 입력 토글 */}
                    <button onClick={() => setShowStdin(!showStdin)} style={{
                        ...iconBtnStyle, padding: "4px 8px", fontSize: 10, fontWeight: 600,
                        background: showStdin ? "#fbbf2420" : undefined,
                        color: showStdin ? "#fbbf24" : "#64748b",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>keyboard</span>
                        입력
                    </button>
                </div>

                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {/* 실행 시간 */}
                    {execTime !== null && (
                        <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                            {execTime}ms
                        </span>
                    )}

                    {/* 통계 */}
                    <span style={{ fontSize: 9, color: "#334155" }}>
                        {compileCount}회 · {compileCount > 0 ? Math.round((successCount / compileCount) * 100) : 0}%
                    </span>

                    <div style={{ width: 1, height: 14, background: "#1e293b", margin: "0 2px" }} />

                    {/* 복사 */}
                    <button onClick={copyCode} style={iconBtnStyle} title="코드 복사">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>content_copy</span>
                    </button>
                    {/* 초기화 */}
                    <button onClick={resetCode} style={iconBtnStyle} title="초기화">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>restart_alt</span>
                    </button>
                </div>
            </div>

            {/* ═══ 컨텍스트 라벨 ═══ */}
            {contextLabel && (
                <div style={{
                    padding: "3px 12px", fontSize: 9, color: "#475569", fontWeight: 600,
                    background: "#06060a", borderBottom: "1px solid #1a1a2e",
                    display: "flex", alignItems: "center", gap: 4,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 10, color: "#7daaff" }}>book</span>
                    {contextLabel}
                </div>
            )}

            {/* ═══ stdin ═══ */}
            <AnimatePresence>
                {showStdin && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden", borderBottom: "1px solid #1a1a2e" }}
                    >
                        <div style={{ padding: "8px 12px", background: "#0d0a00" }}>
                            <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>STDIN</div>
                            <textarea
                                value={stdin} onChange={e => setStdin(e.target.value)}
                                placeholder="프로그램 입력값..."
                                rows={2}
                                style={{
                                    width: "100%", resize: "vertical", padding: "6px 8px",
                                    borderRadius: 6, border: "1px solid #fde68a30", fontSize: 12,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    background: "#0a0800", color: "#e2e8f0", outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ 메인 영역 (에디터 + 사이드패널) ═══ */}
            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                {/* 에디터 */}
                <div style={{ flex: 1, minHeight: expanded ? 300 : 200, position: "relative" }}>
                    <Editor
                        height="100%"
                        language={LANG_OPTIONS.find(l => l.value === lang)?.monaco || lang}
                        value={code}
                        onChange={v => setCode(v || "")}
                        theme="cs-dark"
                        options={{
                            fontSize,
                            lineHeight: Math.round(fontSize * 1.5),
                            minimap: { enabled: expanded },
                            scrollBeyondLastLine: false,
                            padding: { top: 10, bottom: 10 },
                            lineNumbers: "on",
                            lineNumbersMinChars: 3,
                            folding: expanded,
                            wordWrap: "on",
                            automaticLayout: true,
                            tabSize: 4,
                            renderWhitespace: "none",
                            overviewRulerBorder: false,
                            hideCursorInOverviewRuler: true,
                            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                            fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
                            fontLigatures: true,
                            bracketPairColorization: { enabled: true },
                            guides: { indentation: true, bracketPairs: true },
                            suggest: { showMethods: true, showFunctions: true, showConstructors: true },
                        }}
                        onMount={handleEditorMount}
                    />
                </div>

                {/* 사이드 패널 */}
                <AnimatePresence>
                    {rightPanel !== "none" && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 240, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                borderLeft: "1px solid #1a1a2e", background: "#08080d",
                                overflow: "hidden", display: "flex", flexDirection: "column",
                            }}
                        >
                            <div style={{
                                padding: "8px 12px", borderBottom: "1px solid #1a1a2e",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
                                    {rightPanel === "snippets" ? "스니펫" : "단축키"}
                                </span>
                                <button onClick={() => setRightPanel("none")} style={{ ...iconBtnStyle, padding: 2 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#64748b" }}>close</span>
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto", padding: 8 }} className="hide-sb">
                                {rightPanel === "snippets" ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {langSnippets.map((s, i) => (
                                            <button key={i} onClick={() => insertSnippet(s.code)} style={{
                                                textAlign: "left", padding: "8px 10px", borderRadius: 8,
                                                border: "1px solid #1e293b", background: "#0d0d14",
                                                cursor: "pointer", transition: "all 0.15s",
                                                color: "#cbd5e1", fontSize: 11, fontWeight: 600,
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7daaff40"; e.currentTarget.style.background = "#7daaff10"; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.background = "#0d0d14"; }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#7daaff" }}>data_object</span>
                                                    {s.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {SHORTCUTS.map((s, i) => (
                                            <div key={i} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "6px 8px", borderRadius: 6,
                                            }}>
                                                <span style={{ fontSize: 10, color: "#94a3b8" }}>{s.desc}</span>
                                                <kbd style={{
                                                    padding: "2px 6px", borderRadius: 4,
                                                    background: "#1e293b", border: "1px solid #334155",
                                                    fontSize: 9, color: "#7daaff", fontFamily: "monospace",
                                                }}>{s.key}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══ 터미널 리사이즈 핸들 ═══ */}
            <div
                style={{ height: 6, cursor: "row-resize", background: "#1e293b", position: "relative", flexShrink: 0 }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    const startY = e.clientY;
                    const startH = terminalH;
                    const onMove = (ev: MouseEvent) => {
                        ev.preventDefault();
                        setTerminalH(Math.max(60, Math.min(500, startH - (ev.clientY - startY))));
                    };
                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
                    document.body.style.cursor = "row-resize";
                    document.body.style.userSelect = "none";
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                }}
            >
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 24, height: 2, borderRadius: 1, background: "#475569" }} />
            </div>

            {/* ═══ 출력 터미널 ═══ */}
            <div style={{
                background: "#06060a",
                height: terminalH,
                overflowY: "auto",
                display: "flex", flexDirection: "column",
                flexShrink: 0,
            }} className="hide-sb">
                {/* 터미널 헤더 */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "5px 12px", borderBottom: "1px solid #1a1a2e", minHeight: 28,
                    position: "sticky", top: 0, background: "#06060a", zIndex: 1,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: "50%", background: statusDot,
                                boxShadow: status === "running" ? `0 0 8px ${statusDot}` : undefined,
                                animation: status === "running" ? "pulse 1s infinite" : undefined,
                            }} />
                            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5 }}>터미널</span>
                        </div>
                        {status !== "idle" && (
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: status === "success" ? "#5efc8e15" : status === "error" ? "#ff6b6b15" : status === "waiting_input" ? "#7daaff15" : "#fbbf2415",
                                color: status === "success" ? "#5efc8e" : status === "error" ? "#ff6b6b" : status === "waiting_input" ? "#7daaff" : "#fbbf24",
                            }}>
                                {status === "success" ? "SUCCESS" : status === "error" ? "ERROR" : status === "waiting_input" ? "INPUT" : "RUNNING"}
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {execTime !== null && (
                            <span style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{execTime}ms</span>
                        )}
                        <button onClick={() => { setOutput(""); setStatus("idle"); }} style={iconBtnStyle} title="출력 지우기">
                            <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#475569" }}>delete</span>
                        </button>
                    </div>
                </div>

                {/* 출력 본문 */}
                <div style={{ flex: 1, padding: "10px 12px", overflowY: "auto" }} className="hide-sb">
                    <pre style={{
                        margin: 0, fontSize: 12, lineHeight: 1.6,
                        fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
                        color: status === "error" ? "#ff8888" : "#e2e8f0",
                        whiteSpace: "pre-wrap", wordBreak: "break-all",
                    }}>
                        {status === "running" ? (
                            <span style={{ color: "#fbbf24" }}>⟳ 컴파일 중...</span>
                        ) : status === "waiting_input" ? (
                            <>
                                <span style={{ color: "#7daaff" }}>프로그램이 입력을 기다리고 있습니다...</span>{"\n"}
                                {stdinLines.map((line, i) => (
                                    <span key={i}><span style={{ color: "#fbbf24" }}>&gt; </span>{line}{"\n"}</span>
                                ))}
                            </>
                        ) : output ? (
                            <>{status !== "error" && <span style={{ color: "#5efc8e" }}>$ </span>}{output}</>
                        ) : (
                            <span style={{ color: "#334155" }}>코드를 실행하세요 (F5)</span>
                        )}
                    </pre>

                    {/* 인터랙티브 입력 영역 */}
                    {status === "waiting_input" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span style={{ color: "#fbbf24", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>&gt;</span>
                            <input
                                ref={stdinInputRef}
                                value={currentInput}
                                onChange={e => setCurrentInput(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder="입력값 입력 후 Enter (완료: Ctrl+Enter)"
                                autoFocus
                                style={{
                                    flex: 1, padding: "4px 8px", fontSize: 12,
                                    fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
                                    background: "#0d0d1a", color: "#e2e8f0",
                                    border: "1px solid #334155", borderRadius: 4, outline: "none",
                                    caretColor: "#7daaff",
                                }}
                            />
                            <button
                                onClick={submitInteractiveInput}
                                style={{
                                    padding: "4px 10px", borderRadius: 4, border: "none",
                                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                                    color: "#fff", fontSize: 10, fontWeight: 700,
                                    cursor: "pointer", flexShrink: 0,
                                    display: "flex", alignItems: "center", gap: 3,
                                }}
                                title="Ctrl+Enter"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>send</span>
                                전송
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ 상태바 ═══ */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 12px", height: 22, minHeight: 22,
                background: "#0d0d14", borderTop: "1px solid #1a1a2e",
                fontSize: 9, color: "#475569",
            }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <div style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: status === "running" ? "#fbbf24" : status === "error" ? "#ff6b6b" : status === "waiting_input" ? "#7daaff" : "#5efc8e",
                            animation: status === "waiting_input" ? "pulse 1.5s infinite" : undefined,
                        }} />
                        {status === "running" ? "빌드 중" : status === "waiting_input" ? "입력 대기" : "준비"}
                    </span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span>{LANG_OPTIONS.find(l => l.value === lang)?.label}</span>
                    <span>UTF-8</span>
                    <span>cs-dark</span>
                </div>
            </div>

            {/* ═══ 확장 모드 배경 오버레이 ═══ */}
            {expanded && (
                <div
                    onClick={() => setExpanded(false)}
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                        zIndex: 999, cursor: "pointer",
                    }}
                />
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
                .hide-sb::-webkit-scrollbar { display: none; } .hide-sb { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

const iconBtnStyle: React.CSSProperties = {
    padding: "3px 5px", borderRadius: 5, border: "none",
    background: "transparent", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 3,
    transition: "all 0.15s", color: "#64748b",
};
