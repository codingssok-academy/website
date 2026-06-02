"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Chapter, Unit, Page } from "@/data/courses";

interface WordProcessorViewProps {
    chapters: Chapter[];
    courseTitle: string;
    backHref: string;
    completedUnits: Set<string>;
    onToggleUnit: (unitId: string) => void;
}

// Material Icons는 className으로 사용

function MI({ icon, size = 20, style }: { icon: string; size?: number; style?: React.CSSProperties }) {
    return <span className="material-symbols-outlined" style={{ fontSize: size, verticalAlign: "middle", ...style }}>{icon}</span>;
}

type UnitEntry = { chapter: Chapter; unit: Unit; globalIndex: number };

function flattenUnits(chapters: Chapter[]): UnitEntry[] {
    const result: UnitEntry[] = [];
    let idx = 0;
    for (const ch of chapters) {
        for (const u of ch.units) {
            result.push({ chapter: ch, unit: u, globalIndex: idx++ });
        }
    }
    return result;
}

export default function WordProcessorView({
    chapters,
    courseTitle,
    backHref,
    completedUnits,
    onToggleUnit,
}: WordProcessorViewProps) {
    const router = useRouter();
    const allUnits = flattenUnits(chapters);

    // 첫 번째 페이지가 있는 유닛을 기본 선택
    const firstWithPage = allUnits.find(e => (e.unit.pages?.length ?? 0) > 0);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(firstWithPage?.unit ?? null);
    const [selectedPage, setSelectedPage] = useState<Page | null>(
        firstWithPage?.unit.pages?.[0] ?? null
    );

    // 챕터 아코디언
    const defaultExpanded = new Set(chapters.map(ch => ch.id));
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(defaultExpanded);

    // 좌측 패널 (모바일 오버레이)
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // 리사이즈
    const [sidebarW, setSidebarW] = useState(260);
    const dragRef = useRef<{ startX: number; startW: number } | null>(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [isMobile]);

    const startDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragRef.current = { startX: e.clientX, startW: sidebarW };
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const onMove = (ev: MouseEvent) => {
            if (!dragRef.current) return;
            const delta = ev.clientX - dragRef.current.startX;
            setSidebarW(Math.max(200, Math.min(420, dragRef.current.startW + delta)));
        };
        const onUp = () => {
            dragRef.current = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [sidebarW]);

    const toggleChapter = (chId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chId)) next.delete(chId);
            else next.add(chId);
            return next;
        });
    };

    const selectUnit = (unit: Unit) => {
        setSelectedUnit(unit);
        const firstPage = unit.pages?.[0] ?? null;
        setSelectedPage(firstPage);
        if (isMobile) setSidebarOpen(false);
    };

    // 이전/다음 유닛 네비게이션
    const currentIdx = allUnits.findIndex(e => e.unit.id === selectedUnit?.id);
    const prevEntry = currentIdx > 0 ? allUnits[currentIdx - 1] : null;
    const nextEntry = currentIdx < allUnits.length - 1 ? allUnits[currentIdx + 1] : null;

    const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
        이론: { bg: "#dbeafe", color: "#1d4ed8", label: "이론" },
        실습: { bg: "#dcfce7", color: "#166534", label: "실습" },
        프로젝트: { bg: "#fef3c7", color: "#92400e", label: "프로젝트" },
        퀴즈: { bg: "#ede9fe", color: "#5b21b6", label: "모의고사" },
        종합: { bg: "#fee2e2", color: "#991b1b", label: "종합" },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#f8fafc" }}>
            {/* ── 상단 헤더 ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0, zIndex: 30 }}>
                <button
                    onClick={() => router.push(backHref)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "transparent", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, fontFamily: "inherit" }}
                >
                    <MI icon="arrow_back" size={18} />
                    뒤로
                </button>

                {isMobile && (
                    <button
                        onClick={() => setSidebarOpen(v => !v)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "transparent", cursor: "pointer", color: "#64748b", fontSize: 14, fontFamily: "inherit" }}
                    >
                        <MI icon="menu" size={18} />
                    </button>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <MI icon="workspace_premium" size={22} style={{ color: "#2563eb" }} />
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {courseTitle}
                    </span>
                    {selectedUnit && (
                        <>
                            <span style={{ color: "#cbd5e1", fontSize: 16 }}>›</span>
                            <span style={{ fontSize: 14, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {selectedUnit.title}
                            </span>
                        </>
                    )}
                </div>

                {selectedUnit && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button
                            onClick={() => prevEntry && selectUnit(prevEntry.unit)}
                            disabled={!prevEntry}
                            style={{ display: "flex", alignItems: "center", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "transparent", cursor: prevEntry ? "pointer" : "not-allowed", color: prevEntry ? "#374151" : "#cbd5e1", fontFamily: "inherit" }}
                            title="이전 유닛"
                        >
                            <MI icon="chevron_left" size={20} />
                        </button>
                        <button
                            onClick={() => nextEntry && selectUnit(nextEntry.unit)}
                            disabled={!nextEntry}
                            style={{ display: "flex", alignItems: "center", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "transparent", cursor: nextEntry ? "pointer" : "not-allowed", color: nextEntry ? "#374151" : "#cbd5e1", fontFamily: "inherit" }}
                            title="다음 유닛"
                        >
                            <MI icon="chevron_right" size={20} />
                        </button>
                        <button
                            onClick={() => onToggleUnit(selectedUnit.id)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                                background: completedUnits.has(selectedUnit.id) ? "#dcfce7" : "#2563eb",
                                color: completedUnits.has(selectedUnit.id) ? "#166534" : "#fff",
                            }}
                        >
                            <MI icon={completedUnits.has(selectedUnit.id) ? "check_circle" : "radio_button_unchecked"} size={16} />
                            {completedUnits.has(selectedUnit.id) ? "완료" : "완료 표시"}
                        </button>
                    </div>
                )}
            </div>

            {/* ── 본문 (좌측 사이드바 + 우측 콘텐츠) ── */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
                {/* 모바일 오버레이 배경 */}
                {isMobile && sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 20 }}
                    />
                )}

                {/* ── 좌측 사이드바 ── */}
                <div style={{
                    width: isMobile ? Math.min(sidebarW, 300) : sidebarW,
                    flexShrink: 0,
                    background: "#fff",
                    borderRight: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: isMobile ? "absolute" : "relative",
                    top: 0,
                    left: 0,
                    height: "100%",
                    zIndex: isMobile ? 25 : 1,
                    transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
                    transition: isMobile ? "transform .25s ease" : "none",
                }}>
                    {/* 사이드바 헤더 */}
                    <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            학습 목차
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            {completedUnits.size} / {allUnits.length} 완료
                        </div>
                        {/* 진행바 */}
                        <div style={{ marginTop: 8, height: 4, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{
                                height: "100%",
                                width: `${allUnits.length > 0 ? Math.round((completedUnits.size / allUnits.length) * 100) : 0}%`,
                                background: "linear-gradient(90deg, #2563eb, #7c3aed)",
                                borderRadius: 4,
                                transition: "width .3s ease",
                            }} />
                        </div>
                    </div>

                    {/* 챕터 목록 */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }} className="hide-sb">
                        {chapters.map(ch => {
                            const isExpanded = expandedChapters.has(ch.id);
                            const chCompleted = ch.units.filter(u => completedUnits.has(u.id)).length;
                            return (
                                <div key={ch.id}>
                                    {/* 챕터 헤더 */}
                                    <button
                                        onClick={() => toggleChapter(ch.id)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                                            padding: "10px 16px", border: "none", background: "transparent",
                                            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                                        }}
                                    >
                                        <MI icon={ch.icon || "folder"} size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                CH{ch.chapterNumber}. {ch.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                                                {chCompleted}/{ch.units.length} 완료
                                            </div>
                                        </div>
                                        <MI icon={isExpanded ? "expand_less" : "expand_more"} size={18} style={{ color: "#94a3b8", flexShrink: 0 }} />
                                    </button>

                                    {/* 유닛 목록 */}
                                    {isExpanded && (
                                        <div style={{ paddingBottom: 4 }}>
                                            {ch.units.map(unit => {
                                                const isSelected = selectedUnit?.id === unit.id;
                                                const isDone = completedUnits.has(unit.id);
                                                const hasContent = (unit.pages?.length ?? 0) > 0;
                                                const badge = TYPE_BADGE[unit.type ?? '이론'];
                                                return (
                                                    <button
                                                        key={unit.id}
                                                        onClick={() => selectUnit(unit)}
                                                        disabled={!hasContent}
                                                        style={{
                                                            display: "flex", alignItems: "flex-start", gap: 8,
                                                            width: "100%", padding: "8px 16px 8px 36px",
                                                            border: "none", cursor: hasContent ? "pointer" : "not-allowed",
                                                            background: isSelected ? "#eff6ff" : "transparent",
                                                            borderLeft: isSelected ? "3px solid #2563eb" : "3px solid transparent",
                                                            fontFamily: "inherit", textAlign: "left",
                                                            opacity: hasContent ? 1 : 0.45,
                                                        }}
                                                    >
                                                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                                                            {isDone
                                                                ? <MI icon="check_circle" size={16} style={{ color: "#16a34a" }} />
                                                                : <MI icon="radio_button_unchecked" size={16} style={{ color: "#cbd5e1" }} />
                                                            }
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#1d4ed8" : "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {unit.title}
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                                                                {badge && (
                                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: badge.bg, color: badge.color }}>
                                                                        {badge.label}
                                                                    </span>
                                                                )}
                                                                {unit.duration && (
                                                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{unit.duration}</span>
                                                                )}
                                                                {!hasContent && (
                                                                    <span style={{ fontSize: 10, color: "#94a3b8" }}>준비 중</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 리사이즈 핸들 (데스크탑만) */}
                {!isMobile && (
                    <div
                        onMouseDown={startDrag}
                        style={{
                            width: 6, flexShrink: 0, cursor: "col-resize", background: "transparent",
                            position: "relative", zIndex: 10,
                        }}
                        className="panel-drag"
                    />
                )}

                {/* ── 우측 콘텐츠 ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
                    {selectedUnit && selectedPage ? (
                        <>
                            {/* 콘텐츠 영역 — iframe */}
                            <iframe
                                key={selectedPage.id}
                                src={extractIframeSrc(selectedPage.content ?? "")}
                                style={{ flex: 1, border: "none", width: "100%", height: "100%", display: "block" }}
                                allowFullScreen
                                title={selectedPage.title}
                            />
                        </>
                    ) : selectedUnit && !selectedPage ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: 12 }}>
                            <MI icon="hourglass_empty" size={48} style={{ opacity: 0.4 }} />
                            <div style={{ fontSize: 16, fontWeight: 600 }}>콘텐츠 준비 중</div>
                            <div style={{ fontSize: 14 }}>이 유닛의 학습 자료를 준비하고 있습니다.</div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: 12 }}>
                            <MI icon="workspace_premium" size={64} style={{ color: "#2563eb", opacity: 0.3 }} />
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>워드프로세서 필기</div>
                            <div style={{ fontSize: 14, color: "#64748b" }}>좌측에서 유닛을 선택하세요.</div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .hide-sb::-webkit-scrollbar{display:none}
                .hide-sb{-ms-overflow-style:none;scrollbar-width:none}
                .panel-drag:hover,.panel-drag:active{background:rgba(59,130,246,0.12)}
                .panel-drag::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:32px;border-radius:2px;background:#cbd5e1;transition:background .15s}
                .panel-drag:hover::after,.panel-drag:active::after{background:#3b82f6}
            `}</style>
        </div>
    );
}

/** content 문자열에서 iframe src URL 추출 */
function extractIframeSrc(content: string): string {
    const match = content.match(/src="([^"]+)"/);
    return match?.[1] ?? "";
}
