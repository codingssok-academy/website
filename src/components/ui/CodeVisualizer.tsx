"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════
   코드 시각화 — 변수/배열/포인터 박스 다이어그램
   학습 콘텐츠에 <CodeVisualizer /> 삽입
   
   지원:
   1. 변수 → 이름: 값 박스
   2. 배열 → 연속 박스 (인덱스 표시)
   3. 포인터 → 화살표 연결
   4. 스택 프레임 → 겹친 레이어
   5. Step-by-step 실행
   ═══════════════════════════════════════ */

export interface MemoryCell {
    name: string;
    value: string | number;
    type: "int" | "float" | "char" | "string" | "pointer";
    address?: string;         // hex address
    pointsTo?: string;        // name of target variable
    highlight?: boolean;
}

export interface ArrayCell {
    name: string;
    values: (string | number)[];
    type: "int" | "float" | "char";
    highlightIndex?: number;
}

export interface ExecutionStep {
    line: number;
    label: string;
    variables: MemoryCell[];
    arrays?: ArrayCell[];
    output?: string;
}

// ── Variable Box ──
function VarBox({ cell }: { cell: MemoryCell }) {
    const typeColors: Record<string, string> = {
        int: "#2563eb", float: "#0EA5E9", char: "#F59E0B",
        string: "#34D399", pointer: "#EF4444",
    };
    const color = typeColors[cell.type] || "#94a3b8";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: "inline-flex", flexDirection: "column", alignItems: "center",
                margin: "4px 6px",
            }}
        >
            {/* Variable name */}
            <div style={{
                fontSize: 10, fontWeight: 700, color, letterSpacing: "0.05em",
                marginBottom: 2, fontFamily: "JetBrains Mono, monospace",
            }}>
                {cell.name}
            </div>
            {/* Value box */}
            <motion.div
                animate={cell.highlight ? { boxShadow: `0 0 0 3px ${color}44, 0 4px 12px ${color}22` } : {}}
                style={{
                    padding: "6px 14px", borderRadius: 8, minWidth: 40, textAlign: "center",
                    background: cell.highlight ? color + "15" : "#f8fafc",
                    border: `2px solid ${color}`,
                    fontSize: 14, fontWeight: 700, color: "#172554",
                    fontFamily: "JetBrains Mono, monospace",
                }}
            >
                {cell.type === "char" ? `'${cell.value}'` : cell.type === "string" ? `"${cell.value}"` : String(cell.value)}
            </motion.div>
            {/* Type + Address */}
            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
                {cell.type}{cell.address ? ` @ ${cell.address}` : ""}
            </div>
        </motion.div>
    );
}

// ── Array visualization ──
function ArrayViz({ arr }: { arr: ArrayCell }) {
    const typeColors: Record<string, string> = {
        int: "#2563eb", float: "#0EA5E9", char: "#F59E0B",
    };
    const color = typeColors[arr.type] || "#94a3b8";

    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ margin: "8px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, fontFamily: "JetBrains Mono, monospace" }}>
                {arr.name}[{arr.values.length}]
            </div>
            <div style={{ display: "flex", gap: 0 }}>
                {arr.values.map((val, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {/* Index */}
                        <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>[{idx}]</div>
                        {/* Cell */}
                        <div style={{
                            width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                            border: `2px solid ${color}`, borderRight: idx < arr.values.length - 1 ? "none" : undefined,
                            borderRadius: idx === 0 ? "6px 0 0 6px" : idx === arr.values.length - 1 ? "0 6px 6px 0" : 0,
                            background: arr.highlightIndex === idx ? color + "20" : "#fff",
                            fontSize: 13, fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
                            color: "#172554",
                        }}>
                            {val}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ── Pointer Arrow ──
function PointerArrow({ from, to }: { from: string; to: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#EF4444", fontWeight: 600, margin: "4px 0" }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{from}</span>
            <svg width="32" height="12" viewBox="0 0 32 12">
                <line x1="0" y1="6" x2="24" y2="6" stroke="#EF4444" strokeWidth="2" />
                <polygon points="24,2 32,6 24,10" fill="#EF4444" />
            </svg>
            <span style={{ fontFamily: "JetBrains Mono, monospace" }}>&amp;{to}</span>
        </div>
    );
}

/* ═══ Main CodeVisualizer ═══ */
export default function CodeVisualizer({ steps }: { steps: ExecutionStep[] }) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];

    const pointers = useMemo(
        () => step.variables.filter(v => v.type === "pointer" && v.pointsTo),
        [step]
    );

    return (
        <div style={{
            background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
            overflow: "hidden", margin: "16px 0",
        }}>
            {/* Header */}
            <div style={{
                padding: "12px 16px", background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
                    메모리 시각화
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Step {currentStep + 1} / {steps.length}
                </span>
            </div>

            <div style={{ padding: 16 }}>
                {/* Step label */}
                <div style={{
                    padding: "8px 12px", borderRadius: 8, background: "#EFF6FF",
                    fontSize: 12, color: "#2563eb", fontWeight: 600, marginBottom: 12,
                    fontFamily: "JetBrains Mono, monospace",
                }}>
                    Line {step.line}: {step.label}
                </div>

                {/* Variables */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    <AnimatePresence mode="popLayout">
                        {step.variables.filter(v => v.type !== "pointer").map(v => (
                            <VarBox key={v.name} cell={v} />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Pointers */}
                {pointers.map(p => (
                    <PointerArrow key={p.name} from={p.name} to={p.pointsTo!} />
                ))}

                {/* Arrays */}
                {step.arrays?.map(a => (
                    <ArrayViz key={a.name} arr={a} />
                ))}

                {/* Output */}
                {step.output && (
                    <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 8,
                        background: "#0F172A", color: "#34D399",
                        fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                    }}>
                        <span style={{ color: "#64748b" }}>$ </span>{step.output}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{
                padding: "10px 16px", borderTop: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    style={{
                        padding: "6px 14px", borderRadius: 8, border: "none",
                        background: currentStep === 0 ? "#f1f5f9" : "#2563eb",
                        color: currentStep === 0 ? "#94a3b8" : "#fff",
                        fontWeight: 700, fontSize: 12, cursor: currentStep === 0 ? "default" : "pointer",
                    }}
                >
                    ← 이전
                </button>

                {/* Step dots */}
                <div style={{ display: "flex", gap: 4 }}>
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrentStep(i)}
                            style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: i === currentStep ? "#2563eb" : i < currentStep ? "#818CF8" : "#e2e8f0",
                                cursor: "pointer", transition: "all 0.2s",
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep === steps.length - 1}
                    style={{
                        padding: "6px 14px", borderRadius: 8, border: "none",
                        background: currentStep === steps.length - 1 ? "#f1f5f9" : "#2563eb",
                        color: currentStep === steps.length - 1 ? "#94a3b8" : "#fff",
                        fontWeight: 700, fontSize: 12, cursor: currentStep === steps.length - 1 ? "default" : "pointer",
                    }}
                >
                    다음 →
                </button>
            </div>
        </div>
    );
}

/* ═══ Demo data for testing ═══ */
export const DEMO_STEPS: ExecutionStep[] = [
    {
        line: 1,
        label: "int a = 10;",
        variables: [{ name: "a", value: 10, type: "int", address: "0x7ff1", highlight: true }],
    },
    {
        line: 2,
        label: "int b = 20;",
        variables: [
            { name: "a", value: 10, type: "int", address: "0x7ff1" },
            { name: "b", value: 20, type: "int", address: "0x7ff5", highlight: true },
        ],
    },
    {
        line: 3,
        label: "int *p = &a;",
        variables: [
            { name: "a", value: 10, type: "int", address: "0x7ff1" },
            { name: "b", value: 20, type: "int", address: "0x7ff5" },
            { name: "p", value: "0x7ff1", type: "pointer", pointsTo: "a", highlight: true },
        ],
    },
    {
        line: 4,
        label: "int arr[5] = {1, 3, 5, 7, 9};",
        variables: [
            { name: "a", value: 10, type: "int", address: "0x7ff1" },
            { name: "b", value: 20, type: "int", address: "0x7ff5" },
            { name: "p", value: "0x7ff1", type: "pointer", pointsTo: "a" },
        ],
        arrays: [{ name: "arr", values: [1, 3, 5, 7, 9], type: "int", highlightIndex: 2 }],
    },
    {
        line: 5,
        label: 'printf("%d", a + b);',
        variables: [
            { name: "a", value: 10, type: "int", address: "0x7ff1", highlight: true },
            { name: "b", value: 20, type: "int", address: "0x7ff5", highlight: true },
            { name: "p", value: "0x7ff1", type: "pointer", pointsTo: "a" },
        ],
        arrays: [{ name: "arr", values: [1, 3, 5, 7, 9], type: "int" }],
        output: "30",
    },
];
