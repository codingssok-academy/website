"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { useCodeSave } from "@/hooks/useCodeSave";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{ background: "#0a0a0a", color: "#666", padding: 24, height: "100%" }}>
      Loading editor...
    </div>
  ),
});

/* ─────────────────────────────────────────
   Types
   ───────────────────────────────────────── */

type Language = "python" | "c" | "cpp" | "lua";

interface CodeEditorProps {
  language?: Language;
  initialCode?: string;
  onCodeRun?: () => void;
  height?: string;
  /**
   * 영구 저장용 컨텍스트 키 (예: "problem:c-L1-042", "playground:main").
   * 전달되면 useCodeSave 훅을 통해 localStorage + Supabase(student_code_saves) 양쪽에 자동 저장.
   */
  saveContext?: string;
}

interface TerminalLine {
  type: "stdout" | "stderr" | "info" | "input" | "prompt";
  text: string;
}

/* ─────────────────────────────────────────
   Constants
   ───────────────────────────────────────── */

const LANG_CONFIG: Record<Language, { label: string; monaco: string; defaultCode: string }> = {
  python: {
    label: "Python",
    monaco: "python",
    defaultCode: 'name = input("Enter your name: ")\nprint(f"Hello, {name}!")',
  },
  c: {
    label: "C",
    monaco: "c",
    defaultCode:
      '#include <stdio.h>\n\nint main() {\n    int n;\n    printf("Enter a number: ");\n    scanf("%d", &n);\n    printf("You entered: %d\\n", n);\n    return 0;\n}',
  },
  cpp: {
    label: "C++",
    monaco: "cpp",
    defaultCode:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter a number: ";\n    cin >> n;\n    cout << "You entered: " << n << endl;\n    return 0;\n}',
  },
  lua: {
    label: "Luau",
    monaco: "lua",
    defaultCode:
      'local message = "Hello, Roblox!"\nprint(message)',
  },
};

const SNIPPETS: Record<Language, { label: string; code: string }[]> = {
  python: [
    { label: "Hello World", code: 'print("Hello, World!")' },
    {
      label: "Input",
      code: 'name = input("Enter name: ")\nprint(f"Hello, {name}!")',
    },
    {
      label: "Loop",
      code: "for i in range(1, 6):\n    print(i, end=\" \")\nprint()",
    },
    {
      label: "Function",
      code: 'def add(a, b):\n    return a + b\n\nprint(f"3 + 5 = {add(3, 5)}")',
    },
    {
      label: "Class",
      code: 'class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\n    def greet(self):\n        print(f"Hi, I am {self.name} ({self.age})")\n\np = Person("Alice", 15)\np.greet()',
    },
    {
      label: "List Comprehension",
      code: "squares = [x**2 for x in range(10)]\nprint(squares)",
    },
  ],
  c: [
    {
      label: "Hello World",
      code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    },
    {
      label: "scanf",
      code: '#include <stdio.h>\n\nint main() {\n    int n;\n    printf("Enter number: ");\n    scanf("%d", &n);\n    printf("You entered: %d\\n", n);\n    return 0;\n}',
    },
    {
      label: "Array",
      code: '#include <stdio.h>\n\nint main() {\n    int arr[] = {1, 2, 3, 4, 5};\n    int len = sizeof(arr) / sizeof(arr[0]);\n    for (int i = 0; i < len; i++) {\n        printf("%d ", arr[i]);\n    }\n    printf("\\n");\n    return 0;\n}',
    },
    {
      label: "Function",
      code: '#include <stdio.h>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("3 + 5 = %d\\n", add(3, 5));\n    return 0;\n}',
    },
    {
      label: "Pointer",
      code: '#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int *p = &x;\n    printf("Value: %d, Address: %p\\n", *p, (void*)p);\n    return 0;\n}',
    },
  ],
  cpp: [
    {
      label: "Hello World",
      code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
    },
    {
      label: "cin",
      code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter number: ";\n    cin >> n;\n    cout << "You entered: " << n << endl;\n    return 0;\n}',
    },
    {
      label: "If/Else",
      code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter score: ";\n    cin >> n;\n    if (n >= 90) cout << "A" << endl;\n    else if (n >= 80) cout << "B" << endl;\n    else cout << "C" << endl;\n    return 0;\n}',
    },
    {
      label: "For Loop",
      code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        cout << i << " ";\n    }\n    cout << endl;\n    return 0;\n}',
    },
    {
      label: "While",
      code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int i = 1;\n    while (i <= 5) {\n        cout << i * i << " ";\n        i++;\n    }\n    cout << endl;\n    return 0;\n}',
    },
    {
      label: "Array",
      code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int arr[5] = {10, 20, 30, 40, 50};\n    int sum = 0;\n    for (int i = 0; i < 5; i++) sum += arr[i];\n    cout << "Sum: " << sum << endl;\n    return 0;\n}',
    },
    {
      label: "vector",
      code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v = {1, 2, 3, 4, 5};\n    v.push_back(6);\n    for (int x : v) cout << x << " ";\n    cout << endl;\n    return 0;\n}',
    },
    {
      label: "Function",
      code: '#include <iostream>\nusing namespace std;\n\nint add(int a, int b) { return a + b; }\nint multiply(int a, int b) { return a * b; }\n\nint main() {\n    cout << "3 + 5 = " << add(3, 5) << endl;\n    cout << "3 * 5 = " << multiply(3, 5) << endl;\n    return 0;\n}',
    },
    {
      label: "String",
      code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cout << "What is your name? ";\n    cin >> name;\n    cout << "Hello, " << name << "! Length: " << name.length() << endl;\n    return 0;\n}',
    },
    {
      label: "Struct",
      code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nstruct Student {\n    string name;\n    int age;\n    int score;\n};\n\nint main() {\n    Student s = {"Alice", 15, 95};\n    cout << s.name << " (" << s.age << "세) - 점수: " << s.score << endl;\n    return 0;\n}',
    },
    {
      label: "Class",
      code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Person {\npublic:\n    string name;\n    int age;\n    Person(string n, int a) : name(n), age(a) {}\n    void greet() { cout << "Hi, I am " << name << " (" << age << ")" << endl; }\n};\n\nint main() {\n    Person p("Alice", 15);\n    p.greet();\n    return 0;\n}',
    },
    {
      label: "Math",
      code: '#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    cout << "sqrt(2) = " << sqrt(2.0) << endl;\n    cout << "pow(2, 10) = " << pow(2, 10) << endl;\n    cout << "abs(-5) = " << abs(-5) << endl;\n    return 0;\n}',
    },
  ],
  lua: [
    { label: "Hello", code: 'print("Hello, Roblox!")' },
    {
      label: "Part",
      code: 'local part = Instance.new("Part")\npart.Size = Vector3.new(4, 1, 4)\npart.Position = Vector3.new(0, 5, 0)\npart.Parent = workspace',
    },
  ],
};

const LS_KEY_PREFIX = "codingssok-editor-";

const MIN_EDITOR_HEIGHT = 120;
const MIN_TERMINAL_HEIGHT = 80;

// Regex to count scanf/gets calls in C code (for pre-scan input collection)
const C_INPUT_REGEX = /\b(?:scanf|gets|fgets|getchar)\s*\(/g;
const PY_INPUT_REGEX = /\binput\s*\(/g;

/**
 * C 소스에서 각 입력 호출 직전의 printf/puts 문자열 리터럴을 추출.
 * 결과: 각 입력 호출마다 해당 입력 직전에 출력될 텍스트(없으면 빈 문자열).
 *
 * 예: printf("Enter a number: "); scanf("%d", &n);
 *  → ["Enter a number: "]
 */
function extractCInputPrompts(code: string): string[] {
    const prompts: string[] = [];
    let buffer = "";
    const cleaned = code
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
    const callRe = /\b(printf|puts|scanf|gets|fgets|getchar)\s*\(/g;
    const matches = Array.from(cleaned.matchAll(callRe));
    for (const m of matches) {
        const fn = m[1];
        const callEnd = (m.index ?? 0) + m[0].length;
        if (fn === "printf" || fn === "puts") {
            // 첫 문자열 리터럴 추출
            let i = callEnd;
            while (i < cleaned.length && /\s/.test(cleaned[i])) i++;
            if (cleaned[i] === '"') {
                i++;
                let lit = "";
                while (i < cleaned.length && cleaned[i] !== '"') {
                    if (cleaned[i] === "\\" && i + 1 < cleaned.length) {
                        const esc = cleaned[i + 1];
                        if (esc === "n") lit += "\n";
                        else if (esc === "t") lit += "\t";
                        else if (esc === "\\") lit += "\\";
                        else if (esc === '"') lit += '"';
                        else lit += esc;
                        i += 2;
                    } else {
                        lit += cleaned[i++];
                    }
                }
                buffer += lit;
                if (fn === "puts") buffer += "\n";
            }
        } else {
            // 입력 함수 — 누적된 buffer를 prompt로 등록
            prompts.push(buffer);
            buffer = "";
        }
    }
    return prompts;
}

/**
 * Python: input("...") 의 prompt 인자를 순서대로 추출.
 */
function extractPythonInputPrompts(code: string): string[] {
    const prompts: string[] = [];
    const cleaned = code.replace(/#[^\n]*/g, "");
    const re = /\binput\s*\(\s*(?:(["'])((?:\\.|(?!\1).)*)\1)?/g;
    const matches = Array.from(cleaned.matchAll(re));
    for (const m of matches) {
        const lit = m[2] || "";
        prompts.push(
            lit.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\")
        );
    }
    return prompts;
}

/* ─────────────────────────────────────────
   Component
   ───────────────────────────────────────── */

export default function CodeEditor({
  language: initialLanguage = "python",
  initialCode,
  onCodeRun,
  height = "100%",
  saveContext,
}: CodeEditorProps) {
  /* ── state ── */
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState<string>(() => {
    if (initialCode) return initialCode;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LS_KEY_PREFIX + initialLanguage);
      if (saved) {
        // C++ 마이그레이션: cpp 모드인데 localStorage에 stale C 코드(stdio.h/printf/scanf)가
        // 있으면 무시 + reset → cpp default code 로드. 담당자 'C 없애고 C++' 명시 후
        // 이전 학생 데이터 정리.
        if (
          initialLanguage === "cpp" &&
          (saved.includes("<stdio.h>") || /\bprintf\s*\(/.test(saved) || /\bscanf\s*\(/.test(saved))
        ) {
          try { localStorage.removeItem(LS_KEY_PREFIX + initialLanguage); } catch {}
          return LANG_CONFIG[initialLanguage].defaultCode;
        }
        return saved;
      }
    }
    return LANG_CONFIG[initialLanguage].defaultCode;
  });

  /* ── 영구 저장 훅 (saveContext 전달 시에만 활성) ── */
  const codeSave = useCodeSave(
    saveContext || `local:${initialLanguage}`,
    initialLanguage,
  );
  // saveContext 있으면 마운트 시 서버에서 코드 로드
  useEffect(() => {
    if (!saveContext) return;
    let cancelled = false;
    codeSave.load().then(loaded => {
      if (!cancelled && loaded && loaded !== code) {
        // C++ 마이그레이션: supabase에서 가져온 코드도 stale C(stdio.h/printf/scanf)이면
        // 무시 + cpp default 유지. 담당자 'C++ 컴파일러 예제 소스코드 C언어' 명시.
        if (
          initialLanguage === "cpp" &&
          (loaded.includes("<stdio.h>") || /\bprintf\s*\(/.test(loaded) || /\bscanf\s*\(/.test(loaded))
        ) {
          return;
        }
        setCode(loaded);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveContext]);
  // 코드 변경 시 자동 저장 (debounce는 훅 내부)
  useEffect(() => {
    if (!saveContext) return;
    codeSave.save(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, saveContext]);
  const [terminal, setTerminal] = useState<TerminalLine[]>([]);
  const [running, setRunning] = useState(false);
  const [pyLoading, setPyLoading] = useState(false);
  const [pyLoadProgress, setPyLoadProgress] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [editorHeight, setEditorHeight] = useState(320);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [execTime, setExecTime] = useState<number | null>(null);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [runCount, setRunCount] = useState(0);
  const [showSnippets, setShowSnippets] = useState(false);

  // Theme 토글 (Catppuccin Mocha dark ↔ Latte light) — localStorage 영구 저장
  const [theme, setThemeState] = useState<"mocha" | "latte">(() => {
    if (typeof window === "undefined") return "mocha";
    try { return (localStorage.getItem("cs-editor-theme") as "mocha" | "latte") || "mocha"; } catch { return "mocha"; }
  });
  const setTheme = useCallback((t: "mocha" | "latte") => {
    setThemeState(t);
    try { localStorage.setItem("cs-editor-theme", t); } catch {}
  }, []);

  // Run history (마지막 5 실행 결과 — 학습 패턴 비교)
  interface RunRecord { id: number; ts: number; success: boolean; lang: string; output: string; execMs: number | null; }
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Theme 컬러 헬퍼
  const themeColors = theme === "mocha"
    ? { bg: "#1e1e2e", mantle: "#181825", surface: "#313244", text: "#cdd6f4", subtext: "#a6adc8", overlay: "#9399b2", accent: "#cba6f7", border: "#313244", terminalBg: "#181825", toolbarBg: "rgba(24,24,37,0.9)" }
    : { bg: "#eff1f5", mantle: "#e6e9ef", surface: "#ccd0da", text: "#4c4f69", subtext: "#5c5f77", overlay: "#7c7f93", accent: "#8839ef", border: "#bcc0cc", terminalBg: "#e6e9ef", toolbarBg: "rgba(230,233,239,0.9)" };

  // Toolbar 버튼 스타일 — theme 동적 (담당자 'Latte 모드에서도 검정 button')
  const toolbarBtnStyle = useMemo(() => makeToolbarBtnStyle(theme), [theme]);

  // C input collection state
  const [collectingCInput, setCollectingCInput] = useState(false);
  const [cInputCount, setCInputCount] = useState(0);
  // 각 입력 호출에 매핑된 printf 프롬프트 (예: "Enter a number: ")
  const [inputPrompts, setInputPrompts] = useState<string[]>([]);
  const [cInputIndex, setCInputIndex] = useState(0);
  const [cInputs, setCInputs] = useState<string[]>([]);
  const [cInputText, setCInputText] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const sharedBufferRef = useRef<SharedArrayBuffer | null>(null);
  const startTimeRef = useRef(0);

  /* ── terminal helpers ── */
  const appendTerminal = useCallback((type: TerminalLine["type"], text: string) => {
    setTerminal((prev) => [...prev, { type, text }]);
  }, []);

  /* auto-scroll terminal */
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminal, waitingInput, collectingCInput]);

  /* focus input when waiting */
  useEffect(() => {
    if (waitingInput || collectingCInput) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [waitingInput, collectingCInput]);

  /* save code to localStorage */
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY_PREFIX + language, code);
    }
  }, [code, language]);

  /* ── cleanup worker on unmount ── */
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /* ── language switch ── */
  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setExecTime(null);
    setTerminal([]);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LS_KEY_PREFIX + lang);
      setCode(saved ?? LANG_CONFIG[lang].defaultCode);
    } else {
      setCode(LANG_CONFIG[lang].defaultCode);
    }
  }, []);

  /* ── send input to Python worker ── */
  const sendInputToWorker = useCallback((value: string) => {
    const buffer = sharedBufferRef.current;
    if (!buffer) return;

    const signal = new Int32Array(buffer, 0, 2);
    const encoded = new TextEncoder().encode(value);
    new Uint8Array(buffer, 8).set(encoded);
    Atomics.store(signal, 1, encoded.length);
    Atomics.store(signal, 0, 1);
    Atomics.notify(signal, 0);
  }, []);

  /* ── handle terminal input submit (Python) ── */
  const handleInputSubmit = useCallback(() => {
    if (!waitingInput) return;
    const val = inputText;
    setInputText("");
    setWaitingInput(false);
    appendTerminal("input", val);
    sendInputToWorker(val);
  }, [waitingInput, inputText, appendTerminal, sendInputToWorker]);

  /* ── run C/C++ code via godbolt API (real g++/gcc compiler) ──
   *
   * 담당자 '한글 출력 깨지잖아' — JSCPP는 클라이언트 인터프리터라 한글 + namespace + 모던 C++
   * 기능을 제대로 처리 못 함 (HUX8� 같은 garbage 출력). godbolt API는 진짜 g++/gcc 컴파일러를
   * 호출하므로 한글 UTF-8 + using namespace std; 누락 + std::cout / cout 혼용 모두 정상 동작.
   *
   * stdin은 inputs[]를 줄바꿈으로 join해서 한 번에 전달 (godbolt executeParameters.stdin).
   */
  const runCCode = useCallback(async (cCode: string, inputs: string[]) => {
    appendTerminal("info", "Compiling...");
    try {
      const stdin = inputs.join("\n");
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cCode, language, stdin }),
      });

      const data = await res.json().catch(() => ({} as { success?: boolean; stdout?: string; stderr?: string; error?: string }));

      if (!res.ok) {
        appendTerminal("stderr", data.error || `컴파일 서버 응답 오류 (${res.status})`);
      } else if (data.success) {
        const out = data.stdout || "";
        if (out) {
          for (const line of out.split("\n")) {
            if (line !== "") appendTerminal("stdout", line);
          }
        }
        if (data.stderr) {
          for (const line of data.stderr.split("\n")) {
            if (line !== "") appendTerminal("stderr", line);
          }
        }
      } else {
        const errMsg = data.stderr || data.error || "컴파일/실행 실패";
        for (const line of errMsg.split("\n")) {
          if (line !== "") appendTerminal("stderr", line);
        }
      }

      const elapsed = performance.now() - startTimeRef.current;
      setExecTime(elapsed);
      const ok = res.ok && data.success;
      appendTerminal("info", `[${ok ? "Complete" : "Error"}] ${elapsed.toFixed(1)}ms`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      appendTerminal("stderr", `네트워크 오류 — 인터넷 연결을 확인하세요: ${errMsg}`);
      const elapsed = performance.now() - startTimeRef.current;
      setExecTime(elapsed);
      appendTerminal("info", `[Error] ${elapsed.toFixed(1)}ms`);
    } finally {
      setRunning(false);
    }
  }, [appendTerminal, language]);

  /* ── run Python (simple mode, no SharedArrayBuffer) ── */
  const hasSAB = typeof SharedArrayBuffer !== "undefined";
  const runPythonSimple = useCallback(async (pyCode: string, inputs: string[]) => {
    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker("/workers/pyodide-worker.js");
    workerRef.current = worker;
    setPyLoading(true);
    setPyLoadProgress("Initializing...");

    worker.onmessage = (e) => {
      const msg = e.data as { type: string; stage?: string; data?: string; message?: string; success?: boolean };
      switch (msg.type) {
        case "loading":
          setPyLoadProgress(msg.stage === "downloading" ? "Downloading Pyodide (~10MB)..." : (msg.stage ?? ""));
          break;
        case "ready":
          setPyLoading(false);
          setPyLoadProgress("");
          worker.postMessage({ type: "run", code: pyCode });
          break;
        case "stdout":
          appendTerminal("stdout", msg.data ?? "");
          break;
        case "stderr":
          appendTerminal("stderr", msg.data ?? "");
          break;
        case "done": {
          const elapsed = performance.now() - startTimeRef.current;
          setExecTime(elapsed);
          appendTerminal("info", `[Complete] ${elapsed.toFixed(1)}ms`);
          setRunning(false);
          break;
        }
        case "error": {
          appendTerminal("stderr", msg.message ?? "Unknown error");
          const elapsed = performance.now() - startTimeRef.current;
          setExecTime(elapsed);
          appendTerminal("info", `[Error] ${elapsed.toFixed(1)}ms`);
          setRunning(false);
          setPyLoading(false);
          break;
        }
      }
    };
    worker.onerror = () => {
      appendTerminal("stderr", "Worker 로드 실패 — 페이지를 새로고침해 주세요");
      setRunning(false);
      setPyLoading(false);
    };
    worker.postMessage({ type: "init-simple", inputs });
  }, [appendTerminal]);

  /* ── handle C input submit ── */
  const handleCInputSubmit = useCallback(() => {
    if (!collectingCInput) return;
    const val = cInputText;
    setCInputText("");
    appendTerminal("input", val);

    const newInputs = [...cInputs, val];
    setCInputs(newInputs);

    const nextIdx = cInputIndex + 1;
    if (nextIdx < cInputCount) {
      setCInputIndex(nextIdx);
      const nextPrompt = inputPrompts[nextIdx] || "";
      if (nextPrompt) appendTerminal("prompt", nextPrompt);
      else appendTerminal("prompt", `Input ${nextIdx + 1}/${cInputCount}:`);
    } else {
      // All inputs collected
      setCollectingCInput(false);
      if (language === "python") {
        runPythonSimple(code, newInputs);
      } else {
        runCCode(code, newInputs);
      }
    }
  }, [collectingCInput, cInputText, cInputs, cInputIndex, cInputCount, inputPrompts, code, language, appendTerminal, runCCode, runPythonSimple]);

  /* ── run Python via Worker ── */
  const runPython = useCallback(async (pyCode: string) => {
    if (!hasSAB) {
      // SharedArrayBuffer 없으면 simple 모드 (입력 미리 수집됨)
      await runPythonSimple(pyCode, []);
      return;
    }

    // Create SharedArrayBuffer for stdin communication
    // Layout: [0-3] Int32 ready flag | [4-7] Int32 byte length | [8+] input bytes
    const buffer = new SharedArrayBuffer(4096);
    const signal = new Int32Array(buffer, 0, 2);
    Atomics.store(signal, 0, 0);
    Atomics.store(signal, 1, 0);
    sharedBufferRef.current = buffer;

    // Kill previous worker if any
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker("/workers/pyodide-worker.js");
    workerRef.current = worker;

    setPyLoading(true);
    setPyLoadProgress("Initializing...");

    worker.onmessage = (e) => {
      const msg = e.data as { type: string; stage?: string; data?: string; message?: string; success?: boolean };

      switch (msg.type) {
        case "loading":
          setPyLoadProgress(msg.stage === "downloading" ? "Downloading Pyodide (~10MB)..." : (msg.stage ?? ""));
          break;

        case "ready":
          setPyLoading(false);
          setPyLoadProgress("");
          worker.postMessage({ type: "run", code: pyCode });
          break;

        case "stdout":
          appendTerminal("stdout", msg.data ?? "");
          break;

        case "stderr":
          appendTerminal("stderr", msg.data ?? "");
          break;

        case "input-request":
          setWaitingInput(true);
          break;

        case "done": {
          const elapsed = performance.now() - startTimeRef.current;
          setExecTime(elapsed);
          appendTerminal("info", `[Complete] ${elapsed.toFixed(1)}ms`);
          setRunning(false);
          break;
        }

        case "error": {
          appendTerminal("stderr", msg.message ?? "Unknown error");
          const elapsed = performance.now() - startTimeRef.current;
          setExecTime(elapsed);
          appendTerminal("info", `[Error] ${elapsed.toFixed(1)}ms`);
          setRunning(false);
          setPyLoading(false);
          break;
        }
      }
    };

    worker.onerror = (err) => {
      const errMsg = err.message || err.type || "Worker 로드 실패 — 페이지를 새로고침해 주세요";
      appendTerminal("stderr", `Worker error: ${errMsg}`);
      if (!err.message) {
        appendTerminal("stderr", "SharedArrayBuffer 또는 네트워크 문제일 수 있습니다.");
      }
      setRunning(false);
      setPyLoading(false);
    };

    // Init worker with SharedArrayBuffer
    worker.postMessage({ type: "init", buffer });
  }, [appendTerminal]);

  /* ── run code ── */
  const runCode = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setTerminal([]);
    setExecTime(null);
    setWaitingInput(false);
    setCollectingCInput(false);
    setCInputs([]);
    setCInputIndex(0);
    setInputText("");
    setCInputText("");
    onCodeRun?.();
    setRunCount((c) => c + 1);

    startTimeRef.current = performance.now();

    const cmdPrefix = language === "python" ? "$ python main.py" : language === "cpp" ? "$ g++ main.cpp -std=c++23 && ./a.out" : "$ gcc main.c && ./a.out";
    appendTerminal("info", cmdPrefix);

    if (language === "python") {
      if (!hasSAB) {
        // SharedArrayBuffer 없으면 input() 개수 미리 세고 수집
        const pyMatches = code.match(PY_INPUT_REGEX);
        const pyInputCount = pyMatches ? pyMatches.length : 0;
        if (pyInputCount > 0) {
          const prompts = extractPythonInputPrompts(code);
          setInputPrompts(prompts);
          setCInputCount(pyInputCount);
          setCInputIndex(0);
          setCollectingCInput(true);
          // 첫 번째 input의 prompt를 그대로 출력
          const first = prompts[0] || "";
          if (first) appendTerminal("prompt", first);
          else appendTerminal("prompt", `Input 1/${pyInputCount}:`);
          return;
        }
      }
      await runPython(code);
    } else {
      // C: pre-scan for input calls
      const matches = code.match(C_INPUT_REGEX);
      const inputCallCount = matches ? matches.length : 0;

      if (inputCallCount > 0) {
        const prompts = extractCInputPrompts(code);
        setInputPrompts(prompts);
        setCInputCount(inputCallCount);
        setCInputIndex(0);
        setCollectingCInput(true);
        // 첫 번째 scanf 직전의 printf 텍스트를 그대로 출력
        const first = prompts[0] || "";
        if (first) appendTerminal("prompt", first);
        else appendTerminal("prompt", `Input 1/${inputCallCount}:`);
      } else {
        await runCCode(code, []);
      }
    }
  }, [running, language, code, onCodeRun, appendTerminal, runPython, runCCode, hasSAB]);

  /* ── 에러 inline highlight: stderr → Monaco markers (담당자 명시 '2026 최신') ── */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const stderrText = terminal.filter(l => l.type === "stderr").map(l => l.text).join("\n");
    if (!stderrText) {
      const model = editorRef.current.getModel();
      if (model) monacoRef.current.editor.setModelMarkers(model, "compile-errors", []);
      return;
    }
    // clang/gcc 에러 형식: "main.cpp:5:13: error: expected ';' before 'return'"
    // 또는 simple: "5:13: error: ..."
    const errorRegex = /(?:[^:\n]*?:)?(\d+):(\d+):\s*(error|warning|note|fatal error):\s*(.+)/gi;
    const markers: any[] = [];
    let match: RegExpExecArray | null;
    while ((match = errorRegex.exec(stderrText)) !== null) {
      const [, line, col, sev, msg] = match;
      const lineNum = parseInt(line, 10);
      const colNum = parseInt(col, 10);
      if (lineNum < 1 || lineNum > 10000) continue;
      const severity = /error/i.test(sev)
        ? monacoRef.current.MarkerSeverity.Error
        : /warning/i.test(sev)
          ? monacoRef.current.MarkerSeverity.Warning
          : monacoRef.current.MarkerSeverity.Info;
      markers.push({
        startLineNumber: lineNum,
        startColumn: colNum,
        endLineNumber: lineNum,
        endColumn: colNum + 20,
        message: msg.trim(),
        severity,
      });
    }
    const model = editorRef.current.getModel();
    if (model) monacoRef.current.editor.setModelMarkers(model, "compile-errors", markers);
  }, [terminal]);

  /* ── 코드 변경 시 markers 자동 clear ── */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (model) monacoRef.current.editor.setModelMarkers(model, "compile-errors", []);
  }, [code]);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        runCode();
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runCode]);

  /* ── terminal input keydown ── */
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (waitingInput) {
          handleInputSubmit();
        } else if (collectingCInput) {
          handleCInputSubmit();
        }
      }
    },
    [waitingInput, collectingCInput, handleInputSubmit, handleCInputSubmit],
  );

  /* ── drag resize ── */
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientY - dragStartY.current;
      const containerHeight = containerRef.current?.clientHeight ?? 600;
      const maxEditorHeight = containerHeight - MIN_TERMINAL_HEIGHT - 40;
      const newHeight = Math.max(
        MIN_EDITOR_HEIGHT,
        Math.min(maxEditorHeight, dragStartHeight.current + delta),
      );
      setEditorHeight(newHeight);
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

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      dragStartY.current = e.clientY;
      dragStartHeight.current = editorHeight;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [editorHeight],
  );

  /* ── snippets ── */
  const snippets = useMemo(() => SNIPPETS[language], [language]);

  /* ── reset ── */
  const resetCode = useCallback(() => {
    setCode(LANG_CONFIG[language].defaultCode);
    setTerminal([]);
    setExecTime(null);
    setWaitingInput(false);
    setCollectingCInput(false);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setRunning(false);
    localStorage.removeItem(LS_KEY_PREFIX + language);
  }, [language]);

  /* ── copy ── */
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {});
  }, [code]);

  /* ── terminal line color ── */
  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "stdout":
        return "#4ade80";
      case "stderr":
        return "#f87171";
      case "info":
        return "#94a3b8";
      case "input":
        return "#ffffff";
      case "prompt":
        return "#60a5fa";
    }
  };

  /* ── editor mount ── */
  // Editor + monaco refs (에러 inline highlight + AI 자동완성용)
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      editor.onDidChangeCursorPosition(
        (e: { position: { lineNumber: number; column: number } }) => {
          setCursorPos({ line: e.position.lineNumber, col: e.position.column });
        },
      );
    },
    [],
  );

  const isInputActive = waitingInput || collectingCInput;
  const currentInputValue = waitingInput ? inputText : cInputText;
  const setCurrentInputValue = waitingInput ? setInputText : setCInputText;

  /* ── render ── */
  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height,
        minHeight: 480,
        background: themeColors.bg,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        border: `1px solid ${themeColors.border}`,
        boxShadow: theme === "mocha"
          ? "0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(180,190,254,0.04)"
          : "0 8px 32px rgba(76,79,105,0.12), 0 0 0 1px rgba(136,57,239,0.06)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* ── Toolbar — Glass morphism (theme dynamic) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: themeColors.toolbarBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${themeColors.border}`,
          flexWrap: "wrap",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
      >
        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          style={{
            background: "#1a1a1a",
            color: "#e2e8f0",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
            outline: "none",
            fontFamily: "inherit",
          }}
        >
          {(Object.keys(LANG_CONFIG) as Language[]).map((lang) => (
            <option key={lang} value={lang}>
              {LANG_CONFIG[lang].label}
            </option>
          ))}
        </select>

        {/* Snippets toggle */}
        <button
          onClick={() => setShowSnippets(!showSnippets)}
          style={{
            ...toolbarBtnStyle,
            background: showSnippets ? "#1a2a1a" : "#1a1a1a",
            color: showSnippets ? "#4ade80" : "#999",
          }}
        >
          Snippets
        </button>

        <div style={{ flex: 1 }} />

        {/* Theme 토글 (담당자 '2026 최신 디자인') */}
        <button
          onClick={() => setTheme(theme === "mocha" ? "latte" : "mocha")}
          style={{ ...toolbarBtnStyle, fontSize: 14, padding: "3px 8px" }}
          title={theme === "mocha" ? "라이트 모드 (Catppuccin Latte)" : "다크 모드 (Catppuccin Mocha)"}
        >
          {theme === "mocha" ? "☀️" : "🌙"}
        </button>

        {/* Run History */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            ...toolbarBtnStyle,
            background: showHistory ? (theme === "mocha" ? "#cba6f733" : "#8839ef22") : (theme === "mocha" ? "#1a1a1a" : "#dce0e8"),
            color: showHistory ? (theme === "mocha" ? "#cba6f7" : "#8839ef") : themeColors.subtext,
          }}
          title="실행 기록 (마지막 5)"
        >
          History {runHistory.length > 0 && `(${runHistory.length})`}
        </button>

        {/* Font size */}
        <button
          onClick={() => setFontSize((s) => Math.max(10, s - 1))}
          style={toolbarBtnStyle}
          title="Font size -"
        >
          A-
        </button>
        <span style={{ color: "#666", fontSize: 11 }}>{fontSize}px</span>
        <button
          onClick={() => setFontSize((s) => Math.min(24, s + 1))}
          style={toolbarBtnStyle}
          title="Font size +"
        >
          A+
        </button>

        <div style={{ width: 1, height: 16, background: "#333", margin: "0 4px" }} />

        {/* Copy */}
        <button onClick={copyCode} style={toolbarBtnStyle} title="Copy code">
          Copy
        </button>

        {/* Reset */}
        <button onClick={resetCode} style={toolbarBtnStyle} title="Reset to default">
          Reset
        </button>

        {/* Run */}
        <button
          onClick={runCode}
          disabled={running}
          style={{
            ...toolbarBtnStyle,
            background: running ? "#1a3a1a" : "#166534",
            color: "#4ade80",
            fontWeight: 600,
            padding: "4px 12px",
            opacity: running ? 0.6 : 1,
          }}
          title="Run (F5)"
        >
          {running ? (pyLoading ? "Loading..." : "Running...") : "Run (F5)"}
        </button>
      </div>

      {/* ── Snippets panel ── */}
      {showSnippets && (
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "6px 10px",
            background: "#0f0f0f",
            borderBottom: "1px solid #1a1a1a",
            flexWrap: "wrap",
          }}
        >
          {snippets.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setCode(s.code);
                setShowSnippets(false);
              }}
              style={{
                ...toolbarBtnStyle,
                fontSize: 10,
                padding: "3px 8px",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Pyodide loading bar ── */}
      {pyLoading && (
        <div
          style={{
            padding: "4px 10px",
            background: "#1a1a00",
            borderBottom: "1px solid #333300",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 3,
              background: "#333",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "60%",
                height: "100%",
                background: "#f59e0b",
                borderRadius: 2,
                animation: "loadpulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <span style={{ color: "#f59e0b", fontSize: 11, whiteSpace: "nowrap" }}>
            {pyLoadProgress}
          </span>
        </div>
      )}

      {/* ── Editor area ── */}
      <div style={{ height: editorHeight, minHeight: MIN_EDITOR_HEIGHT, flexShrink: 0 }}>
        <MonacoEditor
          height="100%"
          language={LANG_CONFIG[language].monaco}
          value={code}
          onChange={(val) => setCode(val ?? "")}
          onMount={handleEditorMount}
          theme={theme === "mocha" ? "codingssok-black" : "codingssok-latte"}
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            lineHeight: 1.6,
            letterSpacing: 0.3,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            cursorWidth: 2,
            smoothScrolling: true,
            mouseWheelZoom: true,
            wordWrap: "on",
            // 담당자 명시 'C++ 컴파일러 vscode급 이상' — 자동완성 + 자동 정리 + 브래킷 강화
            bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
            guides: { indentation: true, bracketPairs: "active", highlightActiveIndentation: "always", bracketPairsHorizontal: true },
            suggest: { showSnippets: true, showKeywords: true, preview: true, showStatusBar: true, showIcons: true, snippetsPreventQuickSuggestions: false },
            quickSuggestions: { other: "on", comments: "off", strings: "off" },
            parameterHints: { enabled: true, cycle: true },
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoSurround: "languageDefined",
            autoIndent: "advanced",
            matchBrackets: "always",
            renderWhitespace: "selection",
            stickyScroll: { enabled: true, maxLineCount: 4 },
            folding: true,
            foldingStrategy: "indentation",
            foldingHighlight: true,
            showFoldingControls: "always",
            snippetSuggestions: "top",
            tabCompletion: "on",
            wordBasedSuggestions: "matchingDocuments",
            roundedSelection: true,
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: true },
            occurrencesHighlight: "singleFile",
            selectionHighlight: true,
            colorDecorators: true,
            linkedEditing: true,
          }}
          beforeMount={(monaco) => {
            // Catppuccin Latte (light theme) — dark 모드와 짝
            monaco.editor.defineTheme("codingssok-latte", {
              base: "vs",
              inherit: true,
              rules: [
                { token: "comment", foreground: "9ca0b0", fontStyle: "italic" },
                { token: "keyword", foreground: "8839ef" },                  // mauve
                { token: "keyword.directive", foreground: "ea76cb" },        // pink
                { token: "string", foreground: "40a02b" },                   // green
                { token: "string.escape", foreground: "df8e1d" },            // yellow
                { token: "number", foreground: "fe640b" },                   // peach
                { token: "type", foreground: "df8e1d" },                     // yellow
                { token: "type.identifier", foreground: "df8e1d" },
                { token: "function", foreground: "1e66f5" },                 // blue
                { token: "variable", foreground: "4c4f69" },                 // text
                { token: "variable.parameter", foreground: "e64553" },       // maroon
                { token: "operator", foreground: "179299" },                 // teal
                { token: "delimiter", foreground: "6c6f85" },                // subtext0
                { token: "namespace", foreground: "df8e1d" },
                { token: "constant", foreground: "fe640b" },
              ],
              colors: {
                "editor.background": "#eff1f5",
                "editor.foreground": "#4c4f69",
                "editor.lineHighlightBackground": "#dce0e8",
                "editor.lineHighlightBorder": "#dce0e800",
                "editor.selectionBackground": "#acb0be",
                "editor.selectionHighlightBackground": "#acb0be44",
                "editorCursor.foreground": "#dc8a78",                        // rosewater
                "editorLineNumber.foreground": "#8c8fa1",
                "editorLineNumber.activeForeground": "#4c4f69",
                "editorIndentGuide.background": "#ccd0da",
                "editorIndentGuide.activeBackground": "#8839ef",
                "editorBracketMatch.background": "#8839ef33",
                "editorBracketMatch.border": "#8839ef",
                "editorGutter.background": "#eff1f5",
                "editorWidget.background": "#e6e9ef",
                "editorWidget.foreground": "#4c4f69",
                "editorWidget.border": "#bcc0cc",
                "editorSuggestWidget.background": "#e6e9ef",
                "editorSuggestWidget.border": "#bcc0cc",
                "editorSuggestWidget.foreground": "#4c4f69",
                "editorSuggestWidget.selectedBackground": "#8839ef33",
                "editorSuggestWidget.highlightForeground": "#1e66f5",
                "editorHoverWidget.background": "#e6e9ef",
                "editorHoverWidget.border": "#bcc0cc",
                "scrollbarSlider.background": "#bcc0cc88",
                "scrollbarSlider.hoverBackground": "#9ca0b0aa",
                "scrollbarSlider.activeBackground": "#8839efaa",
                "editorStickyScroll.background": "#e6e9ef",
                "editorError.foreground": "#d20f39",
                "editorWarning.foreground": "#df8e1d",
                "editorInfo.foreground": "#1e66f5",
              },
            });
            // 담당자 명시 '2026 최신' — Catppuccin Mocha (2024-2026 GitHub 1위 인기 테마)
            // base: #1e1e2e, mantle: #181825, surface0: #313244, text: #cdd6f4
            // 부드러운 파스텔 + 모던 dark
            monaco.editor.defineTheme("codingssok-black", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "comment", foreground: "6c7086", fontStyle: "italic" },          // overlay0
                { token: "keyword", foreground: "cba6f7" },                                // mauve
                { token: "keyword.directive", foreground: "f5c2e7" },                      // pink
                { token: "string", foreground: "a6e3a1" },                                 // green
                { token: "string.escape", foreground: "f9e2af" },                          // yellow
                { token: "number", foreground: "fab387" },                                 // peach
                { token: "type", foreground: "f9e2af" },                                   // yellow
                { token: "type.identifier", foreground: "f9e2af" },                        // yellow
                { token: "function", foreground: "89b4fa" },                               // blue
                { token: "variable", foreground: "cdd6f4" },                               // text
                { token: "variable.parameter", foreground: "eba0ac" },                     // maroon
                { token: "operator", foreground: "94e2d5" },                               // teal
                { token: "delimiter", foreground: "9399b2" },                              // overlay2
                { token: "namespace", foreground: "f9e2af" },                              // yellow
                { token: "constant", foreground: "fab387" },                               // peach
              ],
              colors: {
                "editor.background": "#1e1e2e",                                            // base
                "editor.foreground": "#cdd6f4",                                            // text
                "editor.lineHighlightBackground": "#313244",                               // surface0
                "editor.lineHighlightBorder": "#31324400",
                "editor.selectionBackground": "#585b70",                                   // surface2
                "editor.selectionHighlightBackground": "#585b7044",
                "editor.wordHighlightBackground": "#585b7066",
                "editor.findMatchBackground": "#fab38766",
                "editor.findMatchHighlightBackground": "#fab38733",
                "editorCursor.foreground": "#f5e0dc",                                      // rosewater
                "editorLineNumber.foreground": "#7f849c",                                  // overlay1
                "editorLineNumber.activeForeground": "#cdd6f4",                            // text
                "editorIndentGuide.background": "#313244",                                 // surface0
                "editorIndentGuide.activeBackground": "#cba6f7",                           // mauve
                "editorBracketMatch.background": "#cba6f733",
                "editorBracketMatch.border": "#cba6f7",
                "editorGutter.background": "#1e1e2e",
                "editorWidget.background": "#181825",                                      // mantle
                "editorWidget.foreground": "#cdd6f4",
                "editorWidget.border": "#313244",
                "editorSuggestWidget.background": "#181825",
                "editorSuggestWidget.border": "#313244",
                "editorSuggestWidget.foreground": "#cdd6f4",
                "editorSuggestWidget.selectedBackground": "#cba6f733",
                "editorSuggestWidget.highlightForeground": "#89b4fa",
                "editorHoverWidget.background": "#181825",
                "editorHoverWidget.border": "#313244",
                "input.background": "#181825",
                "input.border": "#313244",
                "dropdown.background": "#181825",
                "dropdown.border": "#313244",
                "list.activeSelectionBackground": "#cba6f733",
                "list.hoverBackground": "#313244",
                "scrollbarSlider.background": "#58576a88",
                "scrollbarSlider.hoverBackground": "#7f849caa",
                "scrollbarSlider.activeBackground": "#cba6f7aa",
                "editorStickyScroll.background": "#181825",
                "editorStickyScrollHover.background": "#313244",
                "editorError.foreground": "#f38ba8",                                       // red
                "editorWarning.foreground": "#f9e2af",                                     // yellow
                "editorInfo.foreground": "#89b4fa",                                        // blue
              },
            });
          }}
        />
      </div>

      {/* ── Drag handle ── */}
      <div
        onMouseDown={startDrag}
        style={{
          height: 6,
          cursor: "row-resize",
          background: "#111111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 2,
            background: "#333",
            borderRadius: 1,
          }}
        />
      </div>

      {/* ── Terminal area — theme dynamic ── */}
      <div
        style={{
          flex: 1,
          minHeight: MIN_TERMINAL_HEIGHT,
          display: "flex",
          flexDirection: "column",
          background: themeColors.terminalBg,
          transition: "background 0.2s ease",
        }}
      >
        {/* Terminal header — Glass */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            background: themeColors.toolbarBg,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: `1px solid ${themeColors.border}`,
            borderBottom: `1px solid ${themeColors.border}`,
            gap: 8,
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
        >
          <span style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>TERMINAL</span>
          {running && !pyLoading && (
            <span style={{ color: "#4ade80", fontSize: 11, animation: "blinker 1s linear infinite" }}>
              Running...
            </span>
          )}
          {isInputActive && (
            <span style={{ color: "#60a5fa", fontSize: 11 }}>
              Waiting for input...
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => {
              setTerminal([]);
              setExecTime(null);
            }}
            style={{
              ...toolbarBtnStyle,
              fontSize: 10,
              padding: "2px 8px",
            }}
          >
            Clear
          </button>
        </div>

        {/* Terminal output */}
        <div
          ref={terminalContainerRef}
          onClick={() => {
            if (isInputActive) inputRef.current?.focus();
          }}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "8px 12px",
            fontSize: fontSize - 1,
            lineHeight: 1.6,
            cursor: isInputActive ? "text" : "default",
          }}
        >
          {terminal.length === 0 && !running && (
            <div style={{ color: "#444", fontStyle: "italic", fontSize: 12 }}>
              Press Run (F5) to execute code
            </div>
          )}
          {terminal.map((line, i) => (
            <div
              key={i}
              style={{
                color: lineColor(line.type),
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {line.type === "input" ? `> ${line.text}` : line.text}
            </div>
          ))}

          {/* ── Inline terminal input — 시각 강화 (담당자 'input 어디니') ── */}
          {isInputActive && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 8,
                padding: "8px 12px",
                background: theme === "mocha" ? "rgba(137,180,250,0.08)" : "rgba(30,102,245,0.06)",
                border: `2px solid ${theme === "mocha" ? "#89b4fa" : "#1e66f5"}`,
                borderRadius: 8,
                boxShadow: theme === "mocha"
                  ? "0 0 0 4px rgba(137,180,250,0.12), 0 4px 16px rgba(137,180,250,0.18)"
                  : "0 0 0 4px rgba(30,102,245,0.10), 0 4px 16px rgba(30,102,245,0.16)",
                animation: "input-pulse 1.6s ease-in-out infinite",
              }}
            >
              <span style={{
                color: theme === "mocha" ? "#89b4fa" : "#1e66f5",
                fontWeight: 800,
                marginRight: 8,
                fontSize: fontSize,
              }}>›</span>
              <input
                ref={inputRef}
                value={currentInputValue}
                onChange={(e) => setCurrentInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                autoFocus
                placeholder="여기에 입력하고 Enter ↵"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: theme === "mocha" ? "#cdd6f4" : "#4c4f69",
                  fontSize: fontSize,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  caretColor: theme === "mocha" ? "#89b4fa" : "#1e66f5",
                  padding: 0,
                  lineHeight: 1.6,
                }}
              />
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: theme === "mocha" ? "#a6adc8" : "#7c7f93",
                padding: "3px 8px",
                borderRadius: 999,
                background: theme === "mocha" ? "#313244" : "#dce0e8",
                whiteSpace: "nowrap" as const,
              }}>
                ↵ Enter
              </span>
            </div>
          )}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes input-pulse {
              0%, 100% { box-shadow: 0 0 0 4px rgba(137,180,250,0.12), 0 4px 16px rgba(137,180,250,0.18); }
              50% { box-shadow: 0 0 0 6px rgba(137,180,250,0.20), 0 6px 24px rgba(137,180,250,0.28); }
            }
          ` }} />

          {execTime !== null && !running && (
            <div
              style={{
                color: "#555",
                fontSize: 11,
                marginTop: 4,
                borderTop: "1px solid #1a1a1a",
                paddingTop: 4,
              }}
            >
              Execution time: {execTime.toFixed(1)}ms
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "2px 10px",
          background: "#111111",
          borderTop: "1px solid #1a1a1a",
          gap: 16,
          fontSize: 11,
          color: "#555",
          flexShrink: 0,
        }}
      >
        <span>{LANG_CONFIG[language].label}</span>
        <span>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        {execTime !== null && <span>{execTime.toFixed(1)}ms</span>}
        <span>Runs: {runCount}</span>
        <div style={{ flex: 1 }} />
        <span>UTF-8</span>
      </div>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes blinker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes loadpulse {
          0% { width: 20%; }
          50% { width: 80%; }
          100% { width: 20%; }
        }
      `}</style>
    </div>
  );
}

/* ── shared button style ── */
function makeToolbarBtnStyle(themeMode: "mocha" | "latte"): React.CSSProperties {
  return themeMode === "mocha"
    ? {
        background: "#313244",
        color: "#cdd6f4",
        border: "1px solid #45475a",
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        cursor: "pointer",
        fontFamily: "inherit",
        lineHeight: 1,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }
    : {
        background: "#dce0e8",
        color: "#4c4f69",
        border: "1px solid #bcc0cc",
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        cursor: "pointer",
        fontFamily: "inherit",
        lineHeight: 1,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      };
}
