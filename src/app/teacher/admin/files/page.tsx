"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileUp, FolderOpen, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";

type StudentOption = {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
    className: string | null;
    status: string | null;
    linked: boolean;
};

type StudentFile = {
    id: string;
    studentId: string;
    uploadedByRole: "student" | "teacher" | "admin";
    originalName: string;
    mimeType: string | null;
    sizeBytes: number;
    category: string;
    note: string | null;
    createdAt: string;
    student: {
        id: string;
        name: string;
        school: string | null;
        grade: string | null;
        className: string | null;
    } | null;
};

const CATEGORIES = [
    { value: "result", label: "결과물" },
    { value: "entry", label: "엔트리" },
    { value: "code", label: "코드" },
    { value: "document", label: "문서" },
    { value: "homework", label: "과제" },
    { value: "teacher", label: "수업 자료" },
];

function formatBytes(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = value;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }
    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function roleLabel(role: StudentFile["uploadedByRole"]) {
    if (role === "student") return "학생";
    if (role === "admin") return "관리자";
    return "선생님";
}

async function readJson(response: Response) {
    const text = await response.text();
    if (!text.trim()) return { success: response.ok };
    try { return JSON.parse(text); } catch { return { success: false, error: text || `HTTP ${response.status}` }; }
}

export default function AdminStudentFilesPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [category, setCategory] = useState("teacher");
    const [note, setNote] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-files", { cache: "no-store" });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "학생 파일 목록을 불러오지 못했습니다.");
            setStudents(data.students || []);
            setFiles(data.files || []);
            if (!selectedStudentId && data.students?.[0]?.id) setSelectedStudentId(data.students[0].id);
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "학생 파일 목록을 불러오지 못했습니다." });
            setStudents([]);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [selectedStudentId]);

    useEffect(() => { void load(); }, [load]);

    const filteredStudents = useMemo(() => {
        const needle = query.trim().replace(/\s+/g, "");
        if (!needle) return students;
        return students.filter(student => [student.name, student.school || "", student.grade || "", student.className || ""].join("").replace(/\s+/g, "").includes(needle));
    }, [query, students]);

    const selectedStudent = students.find(student => student.id === selectedStudentId) || null;
    const visibleFiles = useMemo(() => {
        return files.filter(file => !selectedStudentId || file.studentId === selectedStudentId);
    }, [files, selectedStudentId]);

    const totalSize = useMemo(() => visibleFiles.reduce((sum, file) => sum + file.sizeBytes, 0), [visibleFiles]);

    const upload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!selectedStudentId) {
            setMessage({ type: "error", text: "학생을 선택해주세요." });
            return;
        }
        if (!file) {
            setMessage({ type: "error", text: "업로드할 파일을 선택해주세요." });
            return;
        }

        setUploading(true);
        setMessage(null);
        try {
            const form = new FormData();
            form.append("studentId", selectedStudentId);
            form.append("file", file);
            form.append("category", category);
            form.append("note", note);
            const res = await fetch("/api/teacher/student-files", { method: "POST", body: form });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "파일 업로드에 실패했습니다.");
            setFiles(prev => [data.file, ...prev]);
            setNote("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            setMessage({ type: "ok", text: "학생 파일함에 자료를 넣었습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." });
        } finally {
            setUploading(false);
        }
    };

    const remove = async (file: StudentFile) => {
        if (!window.confirm(`${file.originalName} 파일을 삭제할까요?`)) return;
        setActingId(file.id);
        setMessage(null);
        try {
            const res = await fetch(`/api/student/files/${file.id}`, { method: "DELETE" });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "파일 삭제에 실패했습니다.");
            setFiles(prev => prev.filter(item => item.id !== file.id));
            setMessage({ type: "ok", text: "파일을 삭제했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "파일 삭제에 실패했습니다." });
        } finally {
            setActingId(null);
        }
    };

    return (
        <main className="admin-files-page">
            <header className="page-head">
                <div>
                    <p className="kicker">Student file console</p>
                    <h1>학생 파일함</h1>
                    <p>학생별 결과물과 수업 자료를 보관하고, 필요 없는 파일은 정리합니다.</p>
                </div>
                <button type="button" className="subtle-button" onClick={load} disabled={loading}>
                    <RefreshCw size={16} /> 새로고침
                </button>
            </header>

            {message && <div className={`notice ${message.type}`}>{message.text}</div>}

            <section className="layout-grid">
                <aside className="student-panel">
                    <div className="panel-title">
                        <Search size={18} />
                        <div>
                            <h2>학생 선택</h2>
                            <p>{students.length}명 기준</p>
                        </div>
                    </div>
                    <input className="search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="학생 검색" />
                    <div className="student-list">
                        {filteredStudents.map(student => (
                            <button
                                type="button"
                                key={student.id}
                                className={`student-item${selectedStudentId === student.id ? " active" : ""}`}
                                onClick={() => setSelectedStudentId(student.id)}
                            >
                                <strong>{student.name}</strong>
                                <span>{[student.className, student.school, student.grade].filter(Boolean).join(" · ") || "정보 없음"}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="work-panel">
                    <div className="selected-strip">
                        <div>
                            <span>선택 학생</span>
                            <strong>{selectedStudent?.name || "학생을 선택해주세요"}</strong>
                        </div>
                        <div>
                            <span>파일</span>
                            <strong>{visibleFiles.length}</strong>
                        </div>
                        <div>
                            <span>용량</span>
                            <strong>{formatBytes(totalSize)}</strong>
                        </div>
                    </div>

                    <section className="upload-card">
                        <div className="panel-title compact">
                            <UploadCloud size={18} />
                            <div>
                                <h2>학생 파일함에 자료 넣기</h2>
                                <p>선생님이 넣은 자료는 학생 파일함에 바로 표시됩니다.</p>
                            </div>
                        </div>
                        <div className="upload-grid">
                            <label>
                                <span>분류</span>
                                <select value={category} onChange={event => setCategory(event.target.value)}>
                                    {CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>파일</span>
                                <input ref={fileInputRef} type="file" />
                            </label>
                            <label>
                                <span>메모</span>
                                <input value={note} onChange={event => setNote(event.target.value)} maxLength={120} placeholder="예: 6월 3주차 엔트리 결과물" />
                            </label>
                            <button type="button" className="primary-button" onClick={upload} disabled={uploading || !selectedStudentId}>
                                <FileUp size={16} /> {uploading ? "업로드 중" : "파일 넣기"}
                            </button>
                        </div>
                    </section>

                    <section className="file-panel">
                        <div className="panel-title compact">
                            <FolderOpen size={18} />
                            <div>
                                <h2>파일 목록</h2>
                                <p>관리자는 조회와 삭제를 할 수 있습니다.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty">파일 목록을 불러오는 중입니다.</div>
                        ) : visibleFiles.length === 0 ? (
                            <div className="empty">선택한 학생의 파일이 없습니다.</div>
                        ) : (
                            <div className="file-table">
                                <div className="file-row head">
                                    <span>파일</span><span>분류</span><span>등록자</span><span>일시</span><span>관리</span>
                                </div>
                                {visibleFiles.map(file => (
                                    <div className="file-row" key={file.id}>
                                        <div className="file-main">
                                            <strong>{file.originalName}</strong>
                                            <small>{formatBytes(file.sizeBytes)}{file.note ? ` · ${file.note}` : ""}</small>
                                        </div>
                                        <span>{CATEGORIES.find(item => item.value === file.category)?.label || file.category}</span>
                                        <span>{roleLabel(file.uploadedByRole)}</span>
                                        <span>{formatDate(file.createdAt)}</span>
                                        <div className="row-actions">
                                            <a className="small-button" href={`/api/student/files/${file.id}`} target="_blank" rel="noreferrer">
                                                <Download size={14} /> 다운로드
                                            </a>
                                            <button type="button" className="small-button danger" onClick={() => remove(file)} disabled={actingId === file.id}>
                                                <Trash2 size={14} /> 삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </section>
            </section>

            <style>{`
                .admin-files-page { color: #0f172a; font-family: Pretendard, system-ui, sans-serif; }
                .page-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
                .kicker { margin: 0 0 8px; color: #2563eb; text-transform: uppercase; letter-spacing: .16em; font-size: 12px; font-weight: 900; }
                h1 { margin: 0; font-size: clamp(34px, 4vw, 52px); line-height: 1; letter-spacing: -0.04em; }
                .page-head p:not(.kicker) { margin: 12px 0 0; color: #64748b; font-weight: 700; }
                .subtle-button, .primary-button, .small-button { border: 1px solid #d8e0ee; background: #fff; color: #1e293b; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 800; text-decoration: none; }
                .subtle-button { height: 42px; padding: 0 15px; }
                .primary-button { height: 46px; padding: 0 18px; background: #2563eb; border-color: #2563eb; color: #fff; white-space: nowrap; }
                .primary-button:disabled, .subtle-button:disabled, .small-button:disabled { opacity: .55; cursor: not-allowed; }
                .notice { margin: 0 0 16px; padding: 13px 16px; border-radius: 12px; font-weight: 800; border: 1px solid #dbe4f2; background: #fff; }
                .notice.ok { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
                .notice.error { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
                .notice.info { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
                .layout-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; }
                .student-panel, .work-panel, .upload-card, .file-panel { background: #fff; border: 1px solid #dbe4f2; border-radius: 18px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.05); }
                .student-panel { padding: 18px; position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow: hidden; display: flex; flex-direction: column; }
                .panel-title { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
                .panel-title h2 { margin: 0 0 3px; font-size: 17px; letter-spacing: -0.02em; }
                .panel-title p { margin: 0; color: #64748b; font-size: 12px; font-weight: 700; }
                .panel-title.compact { margin-bottom: 12px; }
                .search-input, input, select { height: 44px; border: 1px solid #d8e0ee; border-radius: 12px; padding: 0 12px; background: #f8fafc; color: #0f172a; font: inherit; font-weight: 700; }
                .student-list { margin-top: 12px; overflow: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 3px; }
                .student-item { text-align: left; border: 1px solid transparent; background: transparent; border-radius: 12px; padding: 11px 12px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
                .student-item strong { font-size: 14px; color: #0f172a; }
                .student-item span { font-size: 12px; color: #64748b; font-weight: 700; }
                .student-item.active { background: #eff6ff; border-color: #bfdbfe; }
                .work-panel { padding: 18px; }
                .selected-strip { display: grid; grid-template-columns: 1fr 120px 140px; gap: 10px; margin-bottom: 14px; }
                .selected-strip > div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
                .selected-strip span { display: block; color: #64748b; font-size: 12px; font-weight: 900; margin-bottom: 6px; }
                .selected-strip strong { font-size: 22px; letter-spacing: -0.03em; }
                .upload-card, .file-panel { padding: 18px; margin-bottom: 14px; box-shadow: none; }
                .upload-grid { display: grid; grid-template-columns: 150px minmax(220px, 1fr) minmax(220px, 1fr) auto; gap: 10px; align-items: end; }
                label { display: flex; flex-direction: column; gap: 7px; font-size: 12px; color: #475569; font-weight: 900; }
                input[type="file"] { padding-top: 10px; }
                .empty { padding: 42px 16px; border: 1px dashed #d8e0ee; border-radius: 14px; background: #f8fafc; color: #94a3b8; text-align: center; font-weight: 800; }
                .file-table { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
                .file-row { display: grid; grid-template-columns: minmax(250px, 1fr) 100px 90px 120px 220px; gap: 12px; align-items: center; padding: 13px 14px; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; }
                .file-row:first-child { border-top: none; }
                .file-row.head { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 900; }
                .file-main { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
                .file-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .file-main small { color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .row-actions { display: flex; gap: 8px; justify-content: flex-end; }
                .small-button { min-height: 34px; padding: 0 10px; border-radius: 10px; font-size: 12px; }
                .small-button.danger { color: #b91c1c; background: #fff7f7; border-color: #fecaca; }
                @media (max-width: 1100px) {
                    .layout-grid, .selected-strip, .upload-grid { grid-template-columns: 1fr; }
                    .student-panel { position: static; max-height: none; }
                    .file-row, .file-row.head { grid-template-columns: 1fr; align-items: start; }
                    .file-row.head { display: none; }
                    .row-actions { justify-content: flex-start; flex-wrap: wrap; }
                }
            `}</style>
        </main>
    );
}
