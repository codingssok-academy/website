"use client";

/**
 * UnitMaterialEditor
 * 교사가 유닛별 PPT/메시지를 업로드/수정하는 에디터.
 * - PPT는 Supabase Storage(bucket: course-materials)에 업로드
 * - 메시지는 unit_materials 테이블에 저장
 * - 기존 자료 있으면 미리 채워서 보여줌
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
    courseId: string;
    unitId: string;
    unitTitle?: string;
}

const STORAGE_BUCKET = "course-materials";

export default function UnitMaterialEditor({ courseId, unitId, unitTitle }: Props) {
    const [pptUrl, setPptUrl] = useState<string>("");
    const [pptFilename, setPptFilename] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 기존 자료 로드
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setStatus(null);
            setError(null);
            try {
                const sb = createClient();
                const { data, error } = await sb
                    .from("unit_materials")
                    .select("*")
                    .eq("course_id", courseId)
                    .eq("unit_id", unitId)
                    .maybeSingle();
                if (cancelled) return;
                if (error) {
                    setError(error.message);
                } else if (data) {
                    setPptUrl(data.ppt_url || "");
                    setPptFilename(data.ppt_filename || "");
                    setMessage(data.teacher_message || "");
                } else {
                    setPptUrl(""); setPptFilename(""); setMessage("");
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "로드 실패");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [courseId, unitId]);

    // 파일 업로드
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        setStatus("업로드 중...");
        try {
            const sb = createClient();
            const ext = file.name.split(".").pop() || "pptx";
            const path = `${courseId}/${unitId}/${Date.now()}.${ext}`;
            const { error: uploadErr } = await sb.storage
                .from(STORAGE_BUCKET)
                .upload(path, file, { upsert: false, cacheControl: "3600" });
            if (uploadErr) throw uploadErr;
            const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
            setPptUrl(pub.publicUrl);
            setPptFilename(file.name);
            setStatus("업로드 완료. '저장' 버튼을 눌러 적용하세요.");
        } catch (e: any) {
            setError(e?.message || "업로드 실패");
            setStatus(null);
        } finally {
            setUploading(false);
        }
    }, [courseId, unitId]);

    // 저장
    const handleSave = useCallback(async () => {
        setSaving(true);
        setStatus(null);
        setError(null);
        try {
            const sb = createClient();
            const { data: { user } } = await sb.auth.getUser();
            const { error: upsertErr } = await sb
                .from("unit_materials")
                .upsert({
                    course_id: courseId,
                    unit_id: unitId,
                    ppt_url: pptUrl || null,
                    ppt_filename: pptFilename || null,
                    teacher_message: message || null,
                    uploaded_by: user?.id || null,
                    uploaded_by_name: user?.user_metadata?.name || user?.email || null,
                }, { onConflict: "course_id,unit_id" });
            if (upsertErr) throw upsertErr;
            setStatus("✓ 저장 완료");
        } catch (e: any) {
            setError(e?.message || "저장 실패");
        } finally {
            setSaving(false);
        }
    }, [courseId, unitId, pptUrl, pptFilename, message]);

    if (loading) {
        return <div style={{ padding: 20, color: "#94a3b8", fontSize: 12 }}>로드 중...</div>;
    }

    return (
        <div style={{
            marginTop: 20, padding: 20, borderRadius: 12,
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: "2px solid #f59e0b",
        }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#78350f", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                수업 자료 (PPT) 편집
                {unitTitle && <span style={{ fontWeight: 600, color: "#92400e" }}>· {unitTitle}</span>}
            </h4>

            {/* 메시지 */}
            <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#78350f", marginBottom: 4 }}>
                    선생님 메시지
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="이 유닛 학습 시 학생에게 안내할 메시지를 입력하세요..."
                    style={{
                        width: "100%", minHeight: 80, padding: "8px 10px",
                        border: "1px solid #fcd34d", borderRadius: 8, fontSize: 12,
                        fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                        background: "#fffbeb",
                    }}
                />
            </div>

            {/* PPT 업로드 */}
            <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#78350f", marginBottom: 4 }}>
                    PPT 파일
                </label>
                <input
                    type="file"
                    accept=".ppt,.pptx,.pdf"
                    onChange={handleFileChange}
                    disabled={uploading || saving}
                    style={{ fontSize: 11, color: "#78350f" }}
                />
                {pptFilename && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#92400e" }}>
                        현재: <strong>{pptFilename}</strong>
                        {pptUrl && (
                            <a href={pptUrl} target="_blank" rel="noopener noreferrer"
                                style={{ marginLeft: 8, color: "#1d4ed8", textDecoration: "underline" }}>
                                미리보기
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* 저장 버튼 */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    style={{
                        padding: "8px 16px", borderRadius: 8, border: "none",
                        background: "#f59e0b", color: "#fff", fontSize: 12, fontWeight: 800,
                        cursor: saving || uploading ? "wait" : "pointer",
                    }}
                >
                    {saving ? "저장 중..." : "저장"}
                </button>
                {status && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>{status}</span>}
                {error && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>{error}</span>}
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: "#92400e" }}>
                ※ 업로드된 PPT는 학생 학습 화면에서 Office Online Viewer로 자동 표시됩니다.
            </div>
        </div>
    );
}
