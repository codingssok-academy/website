"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { awardXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";
import type { editor } from "monaco-editor";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ── Types ── */
interface TestCase {
  input: string;
  expected: string;
}

interface Problem {
  id: string;
  title: string;
  description: string[];
  difficulty: 1 | 2 | 3;
  category: "입출력" | "조건문" | "반복문" | "배열";
  language: "c" | "python" | "both";
  starterC?: string;
  starterPython?: string;
  testCases: TestCase[];
}

type Category = "전체" | "입출력" | "조건문" | "반복문" | "배열";
type Difficulty = "전체" | "초급" | "중급" | "고급";
type Lang = "c" | "python";

/* ── Problem Data ── */
const PROBLEMS: Problem[] = [
  // 입출력 (5)
  {
    id: "io-01",
    title: "Hello, World!",
    description: ["화면에 Hello, World! 를 출력하세요.", "입력: 없음", "출력: Hello, World!"],
    difficulty: 1,
    category: "입출력",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    // 여기에 코드를 작성하세요\n    \n    return 0;\n}',
    starterPython: '# 여기에 코드를 작성하세요\n',
    testCases: [{ input: "", expected: "Hello, World!" }],
  },
  {
    id: "io-02",
    title: "이름 출력",
    description: [
      "이름을 입력받아 안녕하세요, [이름]! 을 출력하세요.",
      "입력 예시: 홍길동",
      "출력 예시: 안녕하세요, 홍길동!",
    ],
    difficulty: 1,
    category: "입출력",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    char name[50];\n    scanf("%s", name);\n    // 출력 코드 작성\n    return 0;\n}',
    starterPython: 'name = input()\n# 출력 코드 작성\n',
    testCases: [
      { input: "홍길동", expected: "안녕하세요, 홍길동!" },
      { input: "철수", expected: "안녕하세요, 철수!" },
    ],
  },
  {
    id: "io-03",
    title: "두 수의 합",
    description: [
      "두 정수를 입력받아 합을 출력하세요.",
      "입력 예시: 3 5",
      "출력 예시: 8",
    ],
    difficulty: 1,
    category: "입출력",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // 합 출력\n    return 0;\n}',
    starterPython: 'a, b = map(int, input().split())\n# 합 출력\n',
    testCases: [
      { input: "3 5", expected: "8" },
      { input: "10 20", expected: "30" },
    ],
  },
  {
    id: "io-04",
    title: "정수 세 개의 평균",
    description: [
      "세 정수를 입력받아 평균을 정수로 출력하세요 (소수점 버림).",
      "입력 예시: 10 20 30",
      "출력 예시: 20",
    ],
    difficulty: 1,
    category: "입출력",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int a, b, c;\n    scanf("%d %d %d", &a, &b, &c);\n    // 평균 출력\n    return 0;\n}',
    starterPython: 'a, b, c = map(int, input().split())\n# 평균 출력\n',
    testCases: [
      { input: "10 20 30", expected: "20" },
      { input: "1 2 3", expected: "2" },
    ],
  },
  {
    id: "io-05",
    title: "섭씨 → 화씨 변환",
    description: [
      "섭씨 온도를 입력받아 화씨로 변환하여 출력하세요.",
      "공식: F = C * 9 / 5 + 32  (결과는 정수)",
      "입력 예시: 100",
      "출력 예시: 212",
    ],
    difficulty: 2,
    category: "입출력",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int c;\n    scanf("%d", &c);\n    // 변환 후 출력\n    return 0;\n}',
    starterPython: 'c = int(input())\n# 변환 후 출력\n',
    testCases: [
      { input: "100", expected: "212" },
      { input: "0", expected: "32" },
    ],
  },
  // 조건문 (5)
  {
    id: "cond-01",
    title: "홀수/짝수 판별",
    description: [
      "정수를 입력받아 홀수이면 홀수, 짝수이면 짝수를 출력하세요.",
      "입력 예시: 4",
      "출력 예시: 짝수",
    ],
    difficulty: 1,
    category: "조건문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // 조건문 작성\n    return 0;\n}',
    starterPython: 'n = int(input())\n# 조건문 작성\n',
    testCases: [
      { input: "4", expected: "짝수" },
      { input: "7", expected: "홀수" },
    ],
  },
  {
    id: "cond-02",
    title: "양수/음수/영 판별",
    description: [
      "정수 하나를 입력받아 양수이면 양수, 음수이면 음수, 0이면 영을 출력하세요.",
      "입력 예시: -3",
      "출력 예시: 음수",
    ],
    difficulty: 1,
    category: "조건문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // 조건문 작성\n    return 0;\n}',
    starterPython: 'n = int(input())\n# 조건문 작성\n',
    testCases: [
      { input: "-3", expected: "음수" },
      { input: "5", expected: "양수" },
      { input: "0", expected: "영" },
    ],
  },
  {
    id: "cond-03",
    title: "최댓값 구하기",
    description: [
      "두 정수를 입력받아 더 큰 수를 출력하세요. (같으면 그대로 출력)",
      "입력 예시: 7 3",
      "출력 예시: 7",
    ],
    difficulty: 1,
    category: "조건문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // 최댓값 출력\n    return 0;\n}',
    starterPython: 'a, b = map(int, input().split())\n# 최댓값 출력\n',
    testCases: [
      { input: "7 3", expected: "7" },
      { input: "2 9", expected: "9" },
    ],
  },
  {
    id: "cond-04",
    title: "학점 계산",
    description: [
      "점수(0~100)를 입력받아 학점을 출력하세요.",
      "90 이상: A  /  80 이상: B  /  70 이상: C  /  60 이상: D  /  그 외: F",
      "입력 예시: 85",
      "출력 예시: B",
    ],
    difficulty: 2,
    category: "조건문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int score;\n    scanf("%d", &score);\n    // 학점 출력\n    return 0;\n}',
    starterPython: 'score = int(input())\n# 학점 출력\n',
    testCases: [
      { input: "85", expected: "B" },
      { input: "92", expected: "A" },
      { input: "55", expected: "F" },
    ],
  },
  {
    id: "cond-05",
    title: "윤년 판별",
    description: [
      "연도를 입력받아 윤년이면 윤년, 아니면 평년을 출력하세요.",
      "윤년 조건: 4로 나누어 떨어지고, 100으로 나누어 떨어지지 않거나, 400으로 나누어 떨어짐",
      "입력 예시: 2000",
      "출력 예시: 윤년",
    ],
    difficulty: 2,
    category: "조건문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int year;\n    scanf("%d", &year);\n    // 윤년 판별\n    return 0;\n}',
    starterPython: 'year = int(input())\n# 윤년 판별\n',
    testCases: [
      { input: "2000", expected: "윤년" },
      { input: "1900", expected: "평년" },
      { input: "2024", expected: "윤년" },
      { input: "2023", expected: "평년" },
    ],
  },
  // 반복문 (5)
  {
    id: "loop-01",
    title: "1부터 N까지 합",
    description: [
      "N을 입력받아 1부터 N까지의 합을 출력하세요.",
      "입력 예시: 10",
      "출력 예시: 55",
    ],
    difficulty: 1,
    category: "반복문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // 합 계산 후 출력\n    return 0;\n}',
    starterPython: 'n = int(input())\n# 합 계산 후 출력\n',
    testCases: [
      { input: "10", expected: "55" },
      { input: "5", expected: "15" },
    ],
  },
  {
    id: "loop-02",
    title: "구구단 출력",
    description: [
      "N을 입력받아 N단 구구단을 출력하세요.",
      "출력 형식: N x 1 = N",
      "입력 예시: 3",
      "출력 예시: 3 x 1 = 3 / ... / 3 x 9 = 27",
    ],
    difficulty: 1,
    category: "반복문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int i = 1; i <= 9; i++) {\n        // 출력\n    }\n    return 0;\n}',
    starterPython: 'n = int(input())\nfor i in range(1, 10):\n    # 출력\n    pass\n',
    testCases: [
      {
        input: "3",
        expected: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27",
      },
    ],
  },
  {
    id: "loop-03",
    title: "팩토리얼",
    description: [
      "N을 입력받아 N! (N 팩토리얼)을 출력하세요.",
      "입력 예시: 5",
      "출력 예시: 120",
    ],
    difficulty: 2,
    category: "반복문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    long long result = 1;\n    // 팩토리얼 계산\n    printf("%lld\\n", result);\n    return 0;\n}',
    starterPython: 'n = int(input())\nresult = 1\n# 팩토리얼 계산\nprint(result)\n',
    testCases: [
      { input: "5", expected: "120" },
      { input: "10", expected: "3628800" },
    ],
  },
  {
    id: "loop-04",
    title: "피보나치 수열",
    description: [
      "N을 입력받아 피보나치 수열의 N번째 값을 출력하세요. (F(1)=1, F(2)=1)",
      "입력 예시: 7",
      "출력 예시: 13",
    ],
    difficulty: 2,
    category: "반복문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // 피보나치 계산\n    return 0;\n}',
    starterPython: 'n = int(input())\n# 피보나치 계산\n',
    testCases: [
      { input: "7", expected: "13" },
      { input: "1", expected: "1" },
      { input: "10", expected: "55" },
    ],
  },
  {
    id: "loop-05",
    title: "별 삼각형",
    description: [
      "N을 입력받아 높이가 N인 직각삼각형을 * 로 출력하세요.",
      "입력 예시: 4",
      "출력 예시: * / ** / *** / ****  (각 줄)",
    ],
    difficulty: 2,
    category: "반복문",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int i = 1; i <= n; i++) {\n        // 별 출력\n    }\n    return 0;\n}',
    starterPython: 'n = int(input())\nfor i in range(1, n+1):\n    # 별 출력\n    pass\n',
    testCases: [
      { input: "4", expected: "*\n**\n***\n****" },
      { input: "3", expected: "*\n**\n***" },
    ],
  },
  // 배열 (5)
  {
    id: "arr-01",
    title: "배열 최댓값",
    description: [
      "첫 줄에 N, 둘째 줄에 N개의 정수를 입력받아 최댓값을 출력하세요.",
      "입력 예시: 5 / 3 1 4 1 5",
      "출력 예시: 5",
    ],
    difficulty: 2,
    category: "배열",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    // 최댓값 찾기\n    return 0;\n}',
    starterPython: 'n = int(input())\narr = list(map(int, input().split()))\n# 최댓값 출력\n',
    testCases: [
      { input: "5\n3 1 4 1 5", expected: "5" },
      { input: "3\n10 2 7", expected: "10" },
    ],
  },
  {
    id: "arr-02",
    title: "배열 역순 출력",
    description: [
      "N개의 정수를 입력받아 역순으로 출력하세요. (공백으로 구분)",
      "입력 예시: 5 / 1 2 3 4 5",
      "출력 예시: 5 4 3 2 1",
    ],
    difficulty: 2,
    category: "배열",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    // 역순 출력\n    return 0;\n}',
    starterPython: 'n = int(input())\narr = list(map(int, input().split()))\n# 역순 출력\n',
    testCases: [
      { input: "5\n1 2 3 4 5", expected: "5 4 3 2 1" },
      { input: "3\n10 20 30", expected: "30 20 10" },
    ],
  },
  {
    id: "arr-03",
    title: "배열 합과 평균",
    description: [
      "N개의 정수를 입력받아 합과 평균을 출력하세요. 평균은 소수점 첫째 자리까지.",
      "입력 예시: 4 / 10 20 30 40",
      "출력 예시: 합: 100 / 평균: 25.0",
    ],
    difficulty: 2,
    category: "배열",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100], sum = 0;\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &arr[i]);\n        sum += arr[i];\n    }\n    // 합, 평균 출력\n    return 0;\n}',
    starterPython: 'n = int(input())\narr = list(map(int, input().split()))\n# 합, 평균 출력\n',
    testCases: [
      { input: "4\n10 20 30 40", expected: "합: 100\n평균: 25.0" },
      { input: "3\n1 2 3", expected: "합: 6\n평균: 2.0" },
    ],
  },
  {
    id: "arr-04",
    title: "버블 정렬",
    description: [
      "N개의 정수를 입력받아 오름차순으로 정렬하여 출력하세요.",
      "버블 정렬을 직접 구현하세요.",
      "입력 예시: 5 / 5 3 1 4 2",
      "출력 예시: 1 2 3 4 5",
    ],
    difficulty: 3,
    category: "배열",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    // 버블 정렬 구현\n    for (int i = 0; i < n; i++) {\n        printf("%d", arr[i]);\n        if (i < n-1) printf(" ");\n    }\n    printf("\\n");\n    return 0;\n}',
    starterPython: 'n = int(input())\narr = list(map(int, input().split()))\n# 버블 정렬 구현 (sorted() 사용 금지)\nprint(*arr)\n',
    testCases: [
      { input: "5\n5 3 1 4 2", expected: "1 2 3 4 5" },
      { input: "4\n9 3 7 1", expected: "1 3 7 9" },
    ],
  },
  {
    id: "arr-05",
    title: "중복 제거",
    description: [
      "N개의 정수를 입력받아 중복을 제거하고 오름차순으로 출력하세요.",
      "입력 예시: 6 / 3 1 4 1 5 3",
      "출력 예시: 1 3 4 5",
    ],
    difficulty: 3,
    category: "배열",
    language: "both",
    starterC: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    // 중복 제거 후 정렬 출력\n    return 0;\n}',
    starterPython: 'n = int(input())\narr = list(map(int, input().split()))\n# 중복 제거 후 정렬 출력\n',
    testCases: [
      { input: "6\n3 1 4 1 5 3", expected: "1 3 4 5" },
      { input: "5\n2 2 2 2 2", expected: "2" },
    ],
  },
];

/* ── Constants ── */
const CATEGORIES: Category[] = ["전체", "입출력", "조건문", "반복문", "배열"];
const DIFFICULTIES: Difficulty[] = ["전체", "초급", "중급", "고급"];
const DIFF_LABEL: Record<number, Difficulty> = { 1: "초급", 2: "중급", 3: "고급" };
const DIFF_COLOR: Record<number, string> = {
  1: "#4ade80",
  2: "#fbbf24",
  3: "#f87171",
};
const CAT_ICON: Record<Category, string> = {
  전체: "grid_view",
  입출력: "terminal",
  조건문: "fork_right",
  반복문: "loop",
  배열: "data_array",
};

const MONACO_THEME_DEF = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", background: "000000", foreground: "e0e0e0" },
    { token: "keyword", foreground: "c084fc", fontStyle: "bold" },
    { token: "keyword.control", foreground: "c084fc" },
    { token: "type", foreground: "5eead4" },
    { token: "string", foreground: "86efac" },
    { token: "string.escape", foreground: "fcd34d" },
    { token: "comment", foreground: "6b7280", fontStyle: "italic" },
    { token: "number", foreground: "7dd3fc" },
    { token: "operator", foreground: "e0e0e0" },
    { token: "function", foreground: "fdba74" },
    { token: "predefined", foreground: "67e8f9" },
  ],
  colors: {
    "editor.background": "#000000",
    "editor.foreground": "#e0e0e0",
    "editorLineNumber.foreground": "#444444",
    "editorLineNumber.activeForeground": "#888888",
    "editor.selectionBackground": "#1a3a6a",
    "editor.lineHighlightBackground": "#0a0a0a",
    "editorCursor.foreground": "#7daaff",
    "editorWhitespace.foreground": "#1a1a1a",
    "editorWidget.background": "#0a0a0a",
    "editorWidget.border": "#222",
    "editorSuggestWidget.background": "#0a0a0a",
    "editorSuggestWidget.border": "#222",
    "editorSuggestWidget.selectedBackground": "#1a1a1a",
    "minimap.background": "#000000",
    "scrollbarSlider.background": "#1a1a1a80",
    "scrollbarSlider.hoverBackground": "#22222280",
  },
};

/* ── Helpers ── */
function MI({ icon, s, c }: { icon: string; s?: number; c?: string }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: s || 16, color: c, lineHeight: 1, display: "block" }}
    >
      {icon}
    </span>
  );
}

/* ════════════════════════════════
   MAIN PAGE
═══════════════════════════════════ */
export default function PracticePage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Layout
  const [splitPct, setSplitPct] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"problem" | "editor">("problem");
  const [isMobile, setIsMobile] = useState(false);

  // Problem state
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("전체");
  const [selectedProblem, setSelectedProblem] = useState<Problem>(PROBLEMS[0]);

  // Editor state
  const [lang, setLang] = useState<Lang>("c");
  const [code, setCode] = useState(PROBLEMS[0].starterC || "");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Terminal state
  const [output, setOutput] = useState("");
  const [outStatus, setOutStatus] = useState<"idle" | "success" | "error" | "running">("idle");
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [termH, setTermH] = useState(180);

  // Stats
  const [runCount, setRunCount] = useState(0);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);

  // Test results
  const [testResults, setTestResults] = useState<
    { input: string; expected: string; got: string; pass: boolean }[]
  >([]);
  const [showTests, setShowTests] = useState(false);

  /* ── Mobile detection ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Filtered problems ── */
  const filtered = useMemo(() => {
    return PROBLEMS.filter((p) => {
      const catMatch = selectedCategory === "전체" || p.category === selectedCategory;
      const diffMatch =
        selectedDifficulty === "전체" || DIFF_LABEL[p.difficulty] === selectedDifficulty;
      return catMatch && diffMatch;
    });
  }, [selectedCategory, selectedDifficulty]);

  /* ── Problem select ── */
  const selectProblem = useCallback(
    (p: Problem) => {
      setSelectedProblem(p);
      const starter = lang === "c" ? p.starterC || "" : p.starterPython || "";
      setCode(starter);
      setOutput("");
      setOutStatus("idle");
      setTestResults([]);
      setShowTests(false);
      if (isMobile) setMobileTab("editor");
    },
    [lang, isMobile]
  );

  /* ── Lang switch ── */
  const switchLang = useCallback(
    (l: Lang) => {
      setLang(l);
      const starter =
        l === "c" ? selectedProblem.starterC || "" : selectedProblem.starterPython || "";
      setCode(starter);
      setOutput("");
      setOutStatus("idle");
    },
    [selectedProblem]
  );

  /* ── Monaco mount ── */
  const handleMount = useCallback(
    (
      editorInst: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor")
    ) => {
      editorRef.current = editorInst;
      monaco.editor.defineTheme("cs-black", MONACO_THEME_DEF);
      monaco.editor.setTheme("cs-black");
    },
    []
  );

  /* ── Splitter drag ── */
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(70, Math.max(25, pct)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  /* ── Run code ── */
  const runCode = useCallback(async () => {
    setOutput("");
    setOutStatus("running");
    setTestResults([]);
    setShowTests(false);
    const t0 = performance.now();

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang, stdin }),
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      setLastRunTime(elapsed);

      if (!data.success) {
        setOutput(data.stderr || data.error || "오류 발생");
        setOutStatus("error");
      } else {
        setOutput(data.stdout || "(출력 없음)");
        setOutStatus("success");
      }
      setRunCount((n) => n + 1);
      trackMission("code_run");
      awardXP("code_run", `practice:${crypto.randomUUID()}`);

      if (user?.id) {
        try {
          await supabase.from("code_submissions").insert({
            user_id: user.id,
            language: lang,
            code,
            output: data.stdout || "",
            status: data.success ? "success" : "error",
          });
        } catch {
          /* silent */
        }
      }
    } catch {
      setOutput("서버 연결 실패");
      setOutStatus("error");
      setLastRunTime(null);
    }
  }, [code, lang, stdin, user, supabase]);

  /* ── Run all test cases ── */
  const runTests = useCallback(async () => {
    if (!selectedProblem.testCases.length) return;
    setOutStatus("running");
    setOutput("테스트 케이스 실행 중...");
    setShowTests(true);

    const results: typeof testResults = [];
    for (const tc of selectedProblem.testCases) {
      try {
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language: lang, stdin: tc.input }),
        });
        const data = await res.json();
        const got = (data.stdout || "").trim();
        const expected = tc.expected.trim();
        results.push({ input: tc.input, expected, got, pass: got === expected });
      } catch {
        results.push({
          input: tc.input,
          expected: tc.expected,
          got: "연결 오류",
          pass: false,
        });
      }
    }

    setTestResults(results);
    const passed = results.filter((r) => r.pass).length;
    const total = results.length;
    const isAllPass = passed === total;
    setOutput(`${passed}/${total} 통과`);
    setOutStatus(isAllPass ? "success" : "error");

    if (user?.id) {
      try {
        await supabase.from("code_submissions").insert({
          user_id: user.id,
          language: lang,
          code,
          output: results.map((r) => r.got).join("\n---\n"),
          status: isAllPass ? "success" : "error",
        });
      } catch {
        /* silent */
      }
    }
  }, [code, lang, selectedProblem, user, supabase, testResults]);

  /* ── Keyboard shortcut: F5 ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [runCode]);

  /* ─── PANELS ─── */

  const problemPanel = (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      {/* Filters */}
      <div
        style={{
          padding: "12px 16px 0",
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        {/* Category */}
        <div
          style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 10 }}
          className="hide-scrollbar"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
                background:
                  selectedCategory === cat
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(255,255,255,0.04)",
                color: selectedCategory === cat ? "#a5b4fc" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              <MI icon={CAT_ICON[cat]} s={13} />
              {cat}
            </button>
          ))}
        </div>
        {/* Difficulty */}
        <div style={{ display: "flex", gap: 4, paddingBottom: 10, alignItems: "center" }}>
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
                background:
                  selectedDifficulty === diff
                    ? "rgba(99,102,241,0.15)"
                    : "transparent",
                color: selectedDifficulty === diff ? "#a5b4fc" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              {diff}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#4b5563" }}>
            {filtered.length}개
          </span>
        </div>
      </div>

      {/* Problem list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }} className="hide-scrollbar">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProblem(p)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              border: "none",
              borderLeft:
                selectedProblem.id === p.id
                  ? "2px solid #6366f1"
                  : "2px solid transparent",
              background:
                selectedProblem.id === p.id
                  ? "rgba(99,102,241,0.08)"
                  : "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: DIFF_COLOR[p.difficulty],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: selectedProblem.id === p.id ? 700 : 500,
                color: selectedProblem.id === p.id ? "#e2e8f0" : "#9ca3af",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.title}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: DIFF_COLOR[p.difficulty],
                background: `${DIFF_COLOR[p.difficulty]}18`,
                padding: "2px 6px",
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              {DIFF_LABEL[p.difficulty]}
            </span>
          </button>
        ))}
      </div>

      {/* Problem description */}
      <div
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: 16,
          overflowY: "auto",
          maxHeight: "45%",
          flexShrink: 0,
        }}
        className="hide-scrollbar"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: DIFF_COLOR[selectedProblem.difficulty],
              background: `${DIFF_COLOR[selectedProblem.difficulty]}18`,
              padding: "2px 7px",
              borderRadius: 4,
            }}
          >
            {DIFF_LABEL[selectedProblem.difficulty]}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#6b7280",
              background: "rgba(255,255,255,0.04)",
              padding: "2px 7px",
              borderRadius: 4,
            }}
          >
            {selectedProblem.category}
          </span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px" }}>
          {selectedProblem.title}
        </h3>
        <div>
          {selectedProblem.description.map((line, i) => (
            <p
              key={i}
              style={{ margin: "4px 0", lineHeight: 1.7, fontSize: 13, color: "#cbd5e1" }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Test cases preview */}
        {selectedProblem.testCases.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
              예제 테스트 케이스
            </p>
            {selectedProblem.testCases.slice(0, 2).map((tc, i) => (
              <div
                key={i}
                style={{
                  background: "#111",
                  border: "1px solid #1f1f1f",
                  borderRadius: 6,
                  padding: "8px 10px",
                  marginBottom: 6,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {tc.input && (
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#6b7280" }}>입력: </span>
                    <span style={{ color: "#7dd3fc" }}>
                      {tc.input.replace(/\n/g, " / ")}
                    </span>
                  </div>
                )}
                <div>
                  <span style={{ color: "#6b7280" }}>출력: </span>
                  <span style={{ color: "#86efac" }}>
                    {tc.expected.replace(/\n/g, " / ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const editorPanel = (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid #111",
          flexShrink: 0,
          background: "#050505",
        }}
      >
        {/* Lang select */}
        <div style={{ display: "flex", gap: 2 }}>
          {(["c", "python"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                background: lang === l ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                color: lang === l ? "#a5b4fc" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              {l === "c" ? "C" : "Python"}
            </button>
          ))}
        </div>

        {/* Stdin toggle */}
        <button
          onClick={() => setShowStdin((v) => !v)}
          title="표준 입력 (stdin)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            background: showStdin ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
            color: showStdin ? "#fbbf24" : "#6b7280",
          }}
        >
          <MI icon="input" s={13} />
          stdin
        </button>

        <div style={{ flex: 1 }} />

        {/* Run tests */}
        <button
          onClick={runTests}
          disabled={outStatus === "running"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 7,
            border: "1px solid rgba(99,102,241,0.3)",
            cursor: outStatus === "running" ? "not-allowed" : "pointer",
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(99,102,241,0.1)",
            color: "#a5b4fc",
            opacity: outStatus === "running" ? 0.5 : 1,
          }}
        >
          <MI icon="science" s={13} />
          테스트
        </button>

        {/* Run */}
        <button
          onClick={runCode}
          disabled={outStatus === "running"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 14px",
            borderRadius: 7,
            border: "none",
            cursor: outStatus === "running" ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 700,
            background:
              outStatus === "running"
                ? "rgba(99,102,241,0.3)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#fff",
            boxShadow:
              outStatus === "running" ? "none" : "0 0 12px rgba(99,102,241,0.4)",
            transition: "all 0.15s",
          }}
        >
          <MI
            icon={outStatus === "running" ? "hourglass_top" : "play_arrow"}
            s={14}
            c="#fff"
          />
          {outStatus === "running" ? "실행 중..." : "실행"}
        </button>
      </div>

      {/* stdin */}
      <AnimatePresence>
        {showStdin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: "#0a0800",
                borderBottom: "1px solid #1f1a00",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "#fbbf24",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                표준 입력 (stdin)
              </p>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="여기에 입력값을 작성하세요..."
                rows={3}
                style={{
                  width: "100%",
                  background: "#000",
                  border: "1px solid #2a2200",
                  borderRadius: 6,
                  color: "#fbbf24",
                  fontSize: 12,
                  fontFamily: "monospace",
                  padding: "6px 8px",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monaco */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <Editor
          height="100%"
          language={lang === "c" ? "c" : "python"}
          value={code}
          onChange={(v) => setCode(v || "")}
          onMount={handleMount}
          theme="cs-black"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            tabSize: 4,
            wordWrap: "off",
            automaticLayout: true,
          }}
        />
      </div>

      {/* Terminal */}
      <div
        style={{
          height: termH,
          flexShrink: 0,
          borderTop: "1px solid #111",
          background: "#000",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderBottom: "1px solid #111",
            background: "#050505",
            flexShrink: 0,
          }}
        >
          <MI icon="terminal" s={13} c="#6b7280" />
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>출력</span>
          {lastRunTime !== null && outStatus !== "running" && (
            <span style={{ fontSize: 10, color: "#374151" }}>{lastRunTime}ms</span>
          )}
          {outStatus === "success" && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", marginLeft: 4 }}>
              성공
            </span>
          )}
          {outStatus === "error" && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", marginLeft: 4 }}>
              오류
            </span>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "#374151" }}>실행 {runCount}회</span>
          <button
            onClick={() => {
              setOutput("");
              setOutStatus("idle");
              setTestResults([]);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <MI icon="delete_sweep" s={13} c="#4b5563" />
          </button>
          <button
            onClick={() => setTermH((h) => (h === 0 ? 180 : 0))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <MI icon={termH === 0 ? "expand_less" : "expand_more"} s={13} c="#4b5563" />
          </button>
        </div>

        {/* Output */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px",
            fontFamily: "monospace",
            fontSize: 12,
          }}
          className="hide-scrollbar"
        >
          {/* Test results */}
          {showTests && testResults.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {testResults.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 5,
                    marginBottom: 4,
                    background: r.pass
                      ? "rgba(74,222,128,0.06)"
                      : "rgba(248,113,113,0.06)",
                    border: `1px solid ${
                      r.pass ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"
                    }`,
                  }}
                >
                  <MI
                    icon={r.pass ? "check_circle" : "cancel"}
                    s={13}
                    c={r.pass ? "#4ade80" : "#f87171"}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 10, color: "#6b7280" }}>
                      케이스 {i + 1}
                      {r.input ? ` (입력: ${r.input.replace(/\n/g, " / ")})` : ""}
                    </span>
                    {!r.pass && (
                      <div style={{ fontSize: 10, marginTop: 2 }}>
                        <span style={{ color: "#6b7280" }}>기대: </span>
                        <span style={{ color: "#86efac" }}>{r.expected}</span>
                        <span style={{ color: "#6b7280", marginLeft: 8 }}>결과: </span>
                        <span style={{ color: "#f87171" }}>{r.got}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Raw output */}
          {output && (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color:
                  outStatus === "error"
                    ? "#f87171"
                    : outStatus === "success"
                    ? "#e0e0e0"
                    : "#9ca3af",
                lineHeight: 1.6,
              }}
            >
              {output}
            </pre>
          )}

          {outStatus === "idle" && !output && (
            <span style={{ color: "#374151", fontSize: 11 }}>
              실행 버튼을 누르거나 F5를 눌러 코드를 실행하세요
            </span>
          )}
        </div>
      </div>
    </div>
  );

  /* ─── MOBILE ─── */
  if (isMobile) {
    return (
      <div
        style={{
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          background: "#000",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1a1a1a",
            background: "#050505",
            flexShrink: 0,
          }}
        >
          {(["problem", "editor"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderBottom:
                  mobileTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: mobileTab === tab ? "#a5b4fc" : "#6b7280",
              }}
            >
              {tab === "problem" ? "문제" : "에디터"}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          {mobileTab === "problem" ? problemPanel : editorPanel}
        </div>
      </div>
    );
  }

  /* ─── DESKTOP ─── */
  return (
    <div
      ref={containerRef}
      style={{
        height: "calc(100vh - 64px)",
        display: "flex",
        background: "#000",
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "col-resize" : "auto",
      }}
    >
      {/* Left: Problem */}
      <div
        style={{
          width: `${splitPct}%`,
          minWidth: 0,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {problemPanel}
      </div>

      {/* Splitter */}
      <div
        onMouseDown={startDrag}
        style={{
          width: 4,
          flexShrink: 0,
          background: isDragging ? "#6366f1" : "#1a1a1a",
          cursor: "col-resize",
          transition: "background 0.15s",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 32,
            borderRadius: 4,
            background: isDragging ? "#6366f1" : "#262626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MI icon="drag_indicator" s={12} c={isDragging ? "#fff" : "#4b5563"} />
        </div>
      </div>

      {/* Right: Editor */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        {editorPanel}
      </div>
    </div>
  );
}
