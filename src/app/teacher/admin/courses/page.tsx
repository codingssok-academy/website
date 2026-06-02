"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { COURSES } from "@/data/courses";
import type { Course, Chapter, Unit } from "@/data/courses/types";
import UnitMaterialEditor from "./UnitMaterialEditor";

/* ═══════════════════════════════════════
   수업 자료 관리
   /teacher/admin/courses
   ═══════════════════════════════════════ */

interface UnitCompletion {
    unit_id: string;
    completed_count: number;
}

export default function CoursesManagePage() {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [completionMap, setCompletionMap] = useState<Map<string, number>>(new Map());
    const [totalStudents, setTotalStudents] = useState(0);
    const [completionLoading, setCompletionLoading] = useState(false);
    const [previewUnit, setPreviewUnit] = useState<Unit | null>(null);

    // 전체 학생 수 로드
    useEffect(() => {
        (async () => {
            try {
                const sb = createClient();
                const { count } = await sb
                    .from("students")
                    .select("*", { count: "exact", head: true })
                    .not("auth_user_id", "is", null);
                setTotalStudents(count ?? 0);
            } catch { /* ignore */ }
        })();
    }, []);

    // 코스 선택 시 완료율 로드
    useEffect(() => {
        if (!selectedCourse) return;
        const allUnitIds = selectedCourse.chapters.flatMap(ch =>
            ch.units.map(u => `${selectedCourse.id}__${u.id}`)
        );
        if (allUnitIds.length === 0) return;

        setCompletionLoading(true);
        (async () => {
            try {
                const sb = createClient();
                const { data } = await sb
                    .from("user_unit_progress")
                    .select("unit_id, user_id")
                    .in("unit_id", allUnitIds)
                    .eq("completed", true);
                const map = new Map<string, number>();
                for (const row of data ?? []) {
                    const key = row.unit_id as string;
                    map.set(key, (map.get(key) ?? 0) + 1);
                }
                setCompletionMap(map);
            } catch { /* ignore */ }
            finally { setCompletionLoading(false); }
        })();
    }, [selectedCourse]);

    const toggleChapter = (id: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const getCompletionRate = (courseId: string, unitId: string) => {
        if (totalStudents === 0) return 0;
        const key = `${courseId}__${unitId}`;
        return Math.round(((completionMap.get(key) ?? 0) / totalStudents) * 100);
    };

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#172554", margin: "0 0 4px" }}>수업 자료 관리</h2>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>코스별 유닛 현황 및 학생 완료율을 확인합니다.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selectedCourse ? "280px 1fr" : "1fr", gap: 20 }}>
                {/* 코스 목록 */}
                <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        코스 목록
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {COURSES.map(course => (
                            <motion.button
                                key={course.id}
                                onClick={() => {
                                    setSelectedCourse(course);
                                    setPreviewUnit(null);
                                    setExpandedChapters(new Set());
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 16px", borderRadius: 12,
                                    border: selectedCourse?.id === course.id
                                        ? "2px solid #2563eb"
                                        : "1px solid #e2e8f0",
                                    background: selectedCourse?.id === course.id ? "#eff6ff" : "#fff",
                                    cursor: "pointer", textAlign: "left", width: "100%",
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: course.gradient,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#fff", fontVariationSettings: "'FILL' 1" }}>
                                        {course.icon}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#172554", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {course.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                                        {course.chapters.reduce((acc, ch) => acc + ch.units.length, 0)}개 유닛
                                    </div>
                                </div>
                                {course.comingSoon && (
                                    <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#94a3b8", padding: "2px 6px", borderRadius: 4 }}>
                                        준비 중
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* 유닛 트리뷰 + 미리보기 */}
                {selectedCourse && (
                    <div style={{ display: "grid", gridTemplateColumns: previewUnit ? "1fr 400px" : "1fr", gap: 20 }}>
                        {/* 트리뷰 */}
                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#172554", margin: 0 }}>{selectedCourse.title}</h3>
                                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                                        {selectedCourse.chapters.length}개 챕터 ·{" "}
                                        {selectedCourse.chapters.reduce((a, c) => a + c.units.length, 0)}개 유닛
                                        {completionLoading && " · 완료율 로딩 중..."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setExpandedChapters(
                                        expandedChapters.size === selectedCourse.chapters.length
                                            ? new Set()
                                            : new Set(selectedCourse.chapters.map(c => c.id))
                                    )}
                                    style={{
                                        padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                                        background: "#f8fafc", color: "#475569", fontSize: 11, fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    {expandedChapters.size === selectedCourse.chapters.length ? "모두 접기" : "모두 펼치기"}
                                </button>
                            </div>

                            <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                                {selectedCourse.chapters.map((chapter, ci) => (
                                    <div key={chapter.id}>
                                        {/* 챕터 헤더 */}
                                        <button
                                            onClick={() => toggleChapter(chapter.id)}
                                            style={{
                                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                                padding: "12px 20px", border: "none",
                                                borderBottom: "1px solid #f1f5f9",
                                                background: expandedChapters.has(chapter.id) ? "#f8fafc" : "#fff",
                                                cursor: "pointer", textAlign: "left",
                                            }}
                                        >
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 8,
                                                background: "linear-gradient(135deg, #e0f2fe, #eff6ff)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#2563eb", fontVariationSettings: "'FILL' 1" }}>
                                                    {chapter.icon}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#172554" }}>
                                                    Ch.{chapter.chapterNumber} {chapter.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                                    {chapter.units.length}개 유닛
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined" style={{
                                                fontSize: 18, color: "#94a3b8",
                                                transform: expandedChapters.has(chapter.id) ? "rotate(180deg)" : "rotate(0deg)",
                                                transition: "transform 0.2s",
                                            }}>
                                                expand_more
                                            </span>
                                        </button>

                                        {/* 유닛 목록 */}
                                        <AnimatePresence>
                                            {expandedChapters.has(chapter.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: "hidden" }}
                                                >
                                                    {chapter.units.map((unit, ui) => {
                                                        const rate = getCompletionRate(selectedCourse.id, unit.id);
                                                        const isSelected = previewUnit?.id === unit.id;
                                                        return (
                                                            <motion.button
                                                                key={unit.id}
                                                                onClick={() => setPreviewUnit(isSelected ? null : unit)}
                                                                whileHover={{ backgroundColor: "#f0f9ff" }}
                                                                style={{
                                                                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                                                                    padding: "10px 20px 10px 52px",
                                                                    border: "none",
                                                                    borderBottom: ui < chapter.units.length - 1 ? "1px solid #f8fafc" : "none",
                                                                    background: isSelected ? "#eff6ff" : "transparent",
                                                                    cursor: "pointer", textAlign: "left",
                                                                    transition: "background 0.15s",
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                                                    background: "#f1f5f9",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                }}>
                                                                    <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8" }}>
                                                                        {unit.unitNumber}
                                                                    </span>
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {unit.title}
                                                                    </div>
                                                                    {unit.type && (
                                                                        <span style={{
                                                                            fontSize: 10, fontWeight: 600,
                                                                            color: unit.type === "실습" ? "#0ea5e9" : unit.type === "퀴즈" ? "#8b5cf6" : "#64748b",
                                                                        }}>
                                                                            {unit.type}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* 완료율 바 */}
                                                                {!completionLoading && totalStudents > 0 && (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                                                        <div style={{ width: 60, height: 4, background: "#e2e8f0", borderRadius: 2 }}>
                                                                            <div style={{
                                                                                height: "100%", borderRadius: 2,
                                                                                width: `${rate}%`,
                                                                                background: rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#e2e8f0",
                                                                                transition: "width 0.4s",
                                                                            }} />
                                                                        </div>
                                                                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, width: 28 }}>
                                                                            {rate}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 유닛 미리보기 패널 */}
                        <AnimatePresence>
                            {previewUnit && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    style={{
                                        background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                                        overflow: "hidden", position: "sticky", top: 24,
                                        maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column",
                                    }}
                                >
                                    {/* 헤더 */}
                                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "start", gap: 10 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>
                                                유닛 {previewUnit.unitNumber}
                                            </div>
                                            <h4 style={{ fontSize: 15, fontWeight: 800, color: "#172554", margin: 0 }}>
                                                {previewUnit.title}
                                            </h4>
                                            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                                {previewUnit.type && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700,
                                                        padding: "2px 8px", borderRadius: 4,
                                                        background: previewUnit.type === "실습" ? "#e0f2fe" : previewUnit.type === "퀴즈" ? "#f3e8ff" : "#f1f5f9",
                                                        color: previewUnit.type === "실습" ? "#0369a1" : previewUnit.type === "퀴즈" ? "#7c3aed" : "#64748b",
                                                    }}>
                                                        {previewUnit.type}
                                                    </span>
                                                )}
                                                {previewUnit.duration && (
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>
                                                        {previewUnit.duration}
                                                    </span>
                                                )}
                                                {(previewUnit.pages?.length ?? 0) > 0 && (
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>
                                                        {previewUnit.pages!.length}페이지
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPreviewUnit(null)}
                                            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", padding: 4 }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                                        </button>
                                    </div>

                                    {/* 완료율 */}
                                    {totalStudents > 0 && !completionLoading && (
                                        <div style={{ padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                            {(() => {
                                                const rate = getCompletionRate(selectedCourse.id, previewUnit.id);
                                                const completed = completionMap.get(`${selectedCourse.id}__${previewUnit.id}`) ?? 0;
                                                return (
                                                    <div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>학생 완료율</span>
                                                            <span style={{ fontSize: 12, fontWeight: 800, color: rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#94a3b8" }}>
                                                                {completed}/{totalStudents}명 ({rate}%)
                                                            </span>
                                                        </div>
                                                        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                                                            <div style={{
                                                                height: "100%", borderRadius: 3,
                                                                width: `${rate}%`,
                                                                background: rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#e2e8f0",
                                                                transition: "width 0.4s",
                                                            }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* 페이지 목록 */}
                                    <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
                                        {previewUnit.subtitle && (
                                            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", lineHeight: 1.6 }}>
                                                {previewUnit.subtitle}
                                            </p>
                                        )}

                                        {(previewUnit.pages?.length ?? 0) > 0 ? (
                                            <div>
                                                <h5 style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    페이지 구성
                                                </h5>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    {previewUnit.pages!.map((page, pi) => (
                                                        <div key={page.id} style={{
                                                            display: "flex", alignItems: "center", gap: 10,
                                                            padding: "8px 12px", borderRadius: 8, background: "#f8fafc",
                                                            border: "1px solid #f1f5f9",
                                                        }}>
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 800,
                                                                width: 20, height: 20, borderRadius: 4,
                                                                background: page.type === "퀴즈" ? "#f3e8ff" : page.type === "핵심정리" ? "#fef3c7" : "#e0f2fe",
                                                                color: page.type === "퀴즈" ? "#7c3aed" : page.type === "핵심정리" ? "#d97706" : "#0369a1",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                flexShrink: 0,
                                                            }}>
                                                                {pi + 1}
                                                            </span>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    {page.title}
                                                                </div>
                                                            </div>
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                                                                background: page.type === "퀴즈" ? "#f3e8ff" : page.type === "핵심정리" ? "#fef3c7" : "#f1f5f9",
                                                                color: page.type === "퀴즈" ? "#7c3aed" : page.type === "핵심정리" ? "#d97706" : "#64748b",
                                                            }}>
                                                                {page.type}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (previewUnit.problems?.length ?? 0) > 0 ? (
                                            <div>
                                                <h5 style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    코드 문제 ({previewUnit.problems!.length}개)
                                                </h5>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    {previewUnit.problems!.map((prob) => (
                                                        <div key={prob.id} style={{
                                                            display: "flex", alignItems: "center", gap: 10,
                                                            padding: "8px 12px", borderRadius: 8, background: "#f8fafc",
                                                            border: "1px solid #f1f5f9",
                                                        }}>
                                                            <div style={{
                                                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                                                background: prob.difficulty === 1 ? "#22c55e" : prob.difficulty === 2 ? "#f59e0b" : "#ef4444",
                                                            }} />
                                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", flex: 1 }}>
                                                                {prob.title}
                                                            </span>
                                                            <span style={{ fontSize: 10, color: "#94a3b8" }}>
                                                                {prob.difficulty === 1 ? "쉬움" : prob.difficulty === 2 ? "보통" : "어려움"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
                                                페이지 미리보기가 없습니다.
                                            </div>
                                        )}

                                        {/* PPT 모드 코스 — 자료 업로드/메시지 편집 */}
                                        {selectedCourse?.materialMode === 'ppt' && (
                                            <UnitMaterialEditor
                                                courseId={selectedCourse.id}
                                                unitId={previewUnit.id}
                                                unitTitle={previewUnit.title}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
