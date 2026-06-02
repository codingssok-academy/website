"use client";

/**
 * PptViewer
 * 유닛별 선생님 업로드 PPT/메시지 표시
 * - unit_materials 테이블에서 동적 로드
 * - PPT는 Office Online Viewer 또는 Google Docs Viewer로 임베드
 */

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";

interface PptViewerProps {
    courseId: string;
    unitId: string;
    unitTitle?: string;
}

interface UnitMaterial {
    id: string;
    course_id: string;
    unit_id: string;
    ppt_url: string | null;
    ppt_filename: string | null;
    teacher_message: string | null;
    uploaded_by_name: string | null;
    updated_at: string;
}

export default function PptViewer({ courseId, unitId, unitTitle }: PptViewerProps) {
    const [material, setMaterial] = useState<UnitMaterial | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // 풀스크린 API 토글
    const toggleFullscreen = async () => {
        const el = wrapperRef.current;
        if (!el) return;
        try {
            if (!document.fullscreenElement) {
                await el.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (e) {
            console.warn("[PptViewer] fullscreen failed:", e);
        }
    };

    // 풀스크린 상태 동기화 (ESC 대응)
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchMaterial = async () => {
            setLoading(true);
            setError(null);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("unit_materials")
                    .select("*")
                    .eq("course_id", courseId)
                    .eq("unit_id", unitId)
                    .maybeSingle();
                if (cancelled) return;
                if (error) {
                    setError(error.message);
                } else {
                    setMaterial(data as UnitMaterial | null);
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "자료 로드 실패");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchMaterial();
        return () => { cancelled = true; };
    }, [courseId, unitId]);

    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                자료 불러오는 중...
            </div>
        );
    }

    if (!material) {
        return (
            <div style={{
                padding: 60, textAlign: "center", borderRadius: 16,
                background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                border: "2px dashed #bae6fd",
            }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📑</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0c4a6e", marginBottom: 6 }}>
                    아직 수업 자료가 등록되지 않았어요
                </div>
                <div style={{ fontSize: 13, color: "#0369a1" }}>
                    선생님이 이 유닛{unitTitle ? ` "${unitTitle}"` : ""}의 PPT를 곧 올려주실 거예요.
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 선생님 메시지 */}
            {material.teacher_message && (
                <div style={{
                    padding: "16px 20px", borderRadius: 12,
                    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                    borderLeft: "4px solid #f59e0b",
                }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#92400e", letterSpacing: "0.05em", marginBottom: 6 }}>
                        선생님 메시지{material.uploaded_by_name ? ` · ${material.uploaded_by_name}` : ""}
                    </div>
                    <div style={{ fontSize: 14, color: "#78350f", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {material.teacher_message}
                    </div>
                </div>
            )}

            {/* PPT 임베드 */}
            {material.ppt_url ? (
                <div
                    ref={wrapperRef}
                    style={{
                        borderRadius: isFullscreen ? 0 : 16,
                        overflow: "hidden",
                        border: isFullscreen ? "none" : "1px solid #e2e8f0",
                        background: "#0f172a",
                        height: isFullscreen ? "100vh" : "auto",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div style={{
                        padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#fff", borderBottom: "1px solid #e2e8f0",
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>📊</span>
                            {material.ppt_filename || "수업 자료"}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "풀스크린 종료 (ESC)" : "풀스크린으로 보기"}
                                style={{
                                    padding: "6px 12px", borderRadius: 8,
                                    background: isFullscreen ? "#ef4444" : "#10b981",
                                    color: "#fff", fontSize: 12, fontWeight: 700,
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 4,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                    {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                                </span>
                                {isFullscreen ? "종료" : "풀스크린"}
                            </button>
                            <a
                                href={material.ppt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: "6px 12px", borderRadius: 8, background: "#3b82f6",
                                    color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
                                }}
                            >
                                새 창에서 열기
                            </a>
                        </div>
                    </div>
                    <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.ppt_url)}`}
                        title={material.ppt_filename || "수업 자료"}
                        style={{
                            width: "100%",
                            height: isFullscreen ? "calc(100vh - 45px)" : "70vh",
                            border: "none", display: "block", flex: isFullscreen ? 1 : "initial",
                        }}
                        allowFullScreen
                    />
                </div>
            ) : (
                <div style={{
                    padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14,
                    border: "1px dashed #e2e8f0", borderRadius: 12,
                }}>
                    PPT 파일이 아직 업로드되지 않았어요.
                </div>
            )}

            {error && (
                <div style={{ fontSize: 12, color: "#dc2626" }}>오류: {error}</div>
            )}
        </div>
    );
}
