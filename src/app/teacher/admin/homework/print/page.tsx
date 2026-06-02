"use client";

/**
 * 숙제 프린트물 — 인쇄 최적화 페이지
 * /teacher/admin/homework/print?student=이름&title=숙제제목
 *
 * A4 인쇄용, 학원 로고 + 학생 이름 + 숙제 내용 + 코드 작성란
 */

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PrintContent() {
    const params = useSearchParams();
    const student = params.get("student") || "___________";
    const title = params.get("title") || "코딩 숙제";
    const desc = params.get("desc") || "";
    const dueDate = params.get("due") || "";
    const lines = parseInt(params.get("lines") || "15");

    return (
        <>
            <style>{`
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
                @page { margin: 15mm 20mm; size: A4; }
                body { font-family: 'Noto Sans KR', '맑은 고딕', sans-serif; }
            `}</style>

            {/* 인쇄 버튼 */}
            <div className="no-print" style={{
                position: "fixed", top: 16, right: 16, zIndex: 100,
                display: "flex", gap: 8,
            }}>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: "10px 24px", borderRadius: 10,
                        background: "#2563eb", color: "#fff",
                        fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                    }}
                >
                    인쇄하기
                </button>
                <button
                    onClick={() => window.close()}
                    style={{
                        padding: "10px 16px", borderRadius: 10,
                        background: "#f1f5f9", color: "#64748b",
                        fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                    }}
                >
                    닫기
                </button>
            </div>

            {/* A4 프린트물 */}
            <div style={{
                width: "210mm", minHeight: "297mm",
                margin: "20px auto", padding: "20mm 22mm",
                background: "#fff",
                boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
            }}>
                {/* 헤더 */}
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 24,
                    paddingBottom: 16, borderBottom: "3px solid #1e3a5f",
                }}>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#1e3a5f", letterSpacing: "-0.02em" }}>
                            코딩쏙
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            CODINGSSOK ACADEMY
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                            {dueDate ? `마감일: ${dueDate}` : new Date().toLocaleDateString("ko-KR")}
                        </div>
                    </div>
                </div>

                {/* 학생 정보 */}
                <div style={{
                    display: "flex", gap: 20, marginBottom: 28,
                    padding: "14px 18px", background: "#f8fafc",
                    borderRadius: 10, border: "1px solid #e2e8f0",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>이름:</span>
                        <span style={{
                            fontSize: 16, fontWeight: 800, color: "#0f172a",
                            borderBottom: "2px solid #1e3a5f", paddingBottom: 2, minWidth: 100,
                        }}>
                            {student}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>반:</span>
                        <span style={{ borderBottom: "1px solid #cbd5e1", minWidth: 80, display: "inline-block" }}>&nbsp;</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>날짜:</span>
                        <span style={{ borderBottom: "1px solid #cbd5e1", minWidth: 100, display: "inline-block" }}>&nbsp;</span>
                    </div>
                </div>

                {/* 숙제 제목 */}
                <div style={{
                    fontSize: 22, fontWeight: 900, color: "#1e3a5f",
                    marginBottom: 8, display: "flex", alignItems: "center", gap: 10,
                }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: 8,
                        background: "#2563eb", color: "#fff", fontSize: 16, fontWeight: 900,
                    }}>
                        HW
                    </span>
                    {title}
                </div>

                {/* 숙제 설명 */}
                {desc && (
                    <div style={{
                        fontSize: 14, color: "#334155", lineHeight: 1.8,
                        marginBottom: 24, padding: "12px 16px",
                        background: "#eff6ff", borderRadius: 8,
                        borderLeft: "4px solid #2563eb",
                    }}>
                        {desc}
                    </div>
                )}

                {/* 문제 영역 */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{
                        fontSize: 14, fontWeight: 800, color: "#1e3a5f",
                        marginBottom: 12, paddingBottom: 6,
                        borderBottom: "1.5px solid #e2e8f0",
                    }}>
                        풀이 / 코드 작성란
                    </div>

                    {/* 코드 라인 */}
                    <div style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
                        {Array.from({ length: lines }, (_, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center",
                                borderBottom: "1px solid #e2e8f0",
                                minHeight: 28,
                            }}>
                                <span style={{
                                    width: 30, textAlign: "right", paddingRight: 10,
                                    fontSize: 10, color: "#cbd5e1", fontWeight: 600,
                                    borderRight: "1px solid #e2e8f0",
                                    lineHeight: "28px",
                                }}>
                                    {i + 1}
                                </span>
                                <div style={{ flex: 1, paddingLeft: 12, minHeight: 28 }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 실행 결과 */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{
                        fontSize: 14, fontWeight: 800, color: "#1e3a5f",
                        marginBottom: 12, paddingBottom: 6,
                        borderBottom: "1.5px solid #e2e8f0",
                    }}>
                        실행 결과
                    </div>
                    <div style={{
                        border: "1.5px solid #e2e8f0", borderRadius: 8,
                        minHeight: 80, padding: 12,
                        background: "#fafbfc",
                    }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>
                            프로그램 출력:
                        </div>
                    </div>
                </div>

                {/* 자기 평가 */}
                <div style={{
                    padding: "14px 18px", background: "#f0fdf4",
                    borderRadius: 10, border: "1px solid #bbf7d0",
                }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 8 }}>
                        자기 평가
                    </div>
                    <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#334155" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 14, height: 14, border: "1.5px solid #94a3b8", borderRadius: 3, display: "inline-block" }} />
                            혼자 다 풀었어요
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 14, height: 14, border: "1.5px solid #94a3b8", borderRadius: 3, display: "inline-block" }} />
                            힌트 보고 풀었어요
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 14, height: 14, border: "1.5px solid #94a3b8", borderRadius: 3, display: "inline-block" }} />
                            아직 어려워요
                        </label>
                    </div>
                </div>

                {/* 푸터 */}
                <div style={{
                    marginTop: 40, paddingTop: 12,
                    borderTop: "1px solid #e2e8f0",
                    display: "flex", justifyContent: "space-between",
                    fontSize: 10, color: "#94a3b8",
                }}>
                    <span>코딩쏙 아카데미 · 대전 유성구 관평동</span>
                    <span>codingssok.com</span>
                </div>
            </div>
        </>
    );
}

export default function HomeworkPrintPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>로딩 중...</div>}>
            <PrintContent />
        </Suspense>
    );
}
