"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FileUp, FolderOpen, LockKeyhole, RefreshCw, Search, Trash2 } from "lucide-react";

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
    visibility: "student_parent" | "staff_only";
    createdAt: string;
    student: {
        id: string;
        name: string;
        school: string | null;
        grade: string | null;
        className: string | null;
    } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
    result: "결과물",
    entry: "엔트리",
    code: "코드",
    document: "문서",
    homework: "과제",
    teacher: "수업 자료",
    other: "기타",
};

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
    try {
        return JSON.parse(text);
    } catch {
        return { success: false, error: text || `HTTP ${response.status}` };
    }
}

export default function AdminStudentFilesPage() {
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [canManageVisibility, setCanManageVisibility] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState("result");
    const [uploadNote, setUploadNote] = useState("");
    const [uploadVisibility, setUploadVisibility] = useState<StudentFile["visibility"]>("student_parent");
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-files", { cache: "no-store" });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "학생 파일 목록을 불러오지 못했습니다.");

            const nextStudents = (data.students || []) as StudentOption[];
            setStudents(nextStudents);
            setFiles((data.files || []) as StudentFile[]);
            setCanManageVisibility(data.canManageVisibility === true);
            setSelectedStudentId(current => {
                if (current && nextStudents.some(student => student.id === current)) return current;
                return nextStudents[0]?.id || "";
            });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "학생 파일 목록을 불러오지 못했습니다." });
            setStudents([]);
            setFiles([]);
            setCanManageVisibility(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // 최초 진입 시 서버의 파일 목록을 한 번 불러옵니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { void load(); }, [load]);

    const filteredStudents = useMemo(() => {
        const needle = query.trim().replace(/\s+/g, "");
        if (!needle) return students;
        return students.filter(student => [student.name, student.school || "", student.grade || "", student.className || ""].join("").replace(/\s+/g, "").includes(needle));
    }, [query, students]);

    const selectedStudent = students.find(student => student.id === selectedStudentId) || null;
    const visibleFiles = useMemo(() => files.filter(file => !selectedStudentId || file.studentId === selectedStudentId), [files, selectedStudentId]);
    const totalSize = useMemo(() => visibleFiles.reduce((sum, file) => sum + file.sizeBytes, 0), [visibleFiles]);

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

    const changeVisibility = async (file: StudentFile, visibility: StudentFile["visibility"]) => {
        if (file.visibility === visibility || actingId) return;
        setActingId(file.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-files", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: file.id, visibility }),
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "공개 범위를 변경하지 못했습니다.");
            setFiles(prev => prev.map(item => item.id === file.id ? { ...item, visibility } : item));
            setMessage({
                type: "ok",
                text: visibility === "student_parent"
                    ? `${file.originalName} 파일을 학부모에게 공개했습니다.`
                    : `${file.originalName} 파일을 선생님만 볼 수 있게 변경했습니다.`,
            });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "공개 범위를 변경하지 못했습니다." });
        } finally {
            setActingId(null);
        }
    };

    const upload = async () => {
        if (!selectedStudent || !uploadFile || uploading) {
            setMessage({ type: "error", text: selectedStudent ? "업로드할 파일을 선택해주세요." : "학생을 먼저 선택해주세요." });
            return;
        }
        if (!selectedStudent.linked) {
            setMessage({ type: "error", text: "로그인 계정이 연결된 학생에게만 파일을 올릴 수 있습니다." });
            return;
        }

        setUploading(true);
        setMessage(null);
        try {
            const form = new FormData();
            form.set("studentId", selectedStudent.id);
            form.set("file", uploadFile);
            form.set("category", uploadCategory);
            form.set("note", uploadNote);
            form.set("visibility", uploadVisibility);
            const res = await fetch("/api/teacher/student-files", { method: "POST", body: form });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "파일 업로드에 실패했습니다.");

            setFiles(prev => [data.file as StudentFile, ...prev]);
            setUploadFile(null);
            setUploadNote("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            setMessage({
                type: "ok",
                text: uploadVisibility === "student_parent"
                    ? `${uploadFile.name} 파일을 올리고 학부모에게 공개했습니다.`
                    : `${uploadFile.name} 파일을 선생님 전용으로 올렸습니다.`,
            });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="admin-files-page">
            <header className="page-head">
                <div>
                    <p className="kicker">Student File Console</p>
                    <h1>학생 파일함</h1>
                    <p>학생별 파일을 확인하고 학부모에게 보여줄 결과물을 선택합니다.</p>
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
                                onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setUploadFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
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

                    {canManageVisibility && (
                        <section className="upload-panel" aria-label="관리자 학생 파일 업로드">
                            <div className="panel-title compact">
                                <FileUp size={18} />
                                <div>
                                    <h2>새 파일 올리기</h2>
                                    <p>{selectedStudent?.name || "선택한 학생"}의 결과물을 최대 50MB까지 올릴 수 있습니다.</p>
                                </div>
                            </div>
                            <div className="upload-form">
                                <label className="form-field file-field">
                                    <span>파일 선택</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        aria-label="파일 선택"
                                        accept=".ent,.sb3,.py,.cpp,.c,.h,.html,.css,.js,.json,.png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                                        onChange={event => setUploadFile(event.target.files?.[0] || null)}
                                        disabled={uploading || !selectedStudent?.linked}
                                    />
                                    <small>{uploadFile ? `${uploadFile.name} · ${formatBytes(uploadFile.size)}` : "엔트리, 스크래치, 코드, 이미지, 문서"}</small>
                                </label>
                                <label className="form-field">
                                    <span>분류</span>
                                    <select aria-label="분류" value={uploadCategory} onChange={event => setUploadCategory(event.target.value)} disabled={uploading}>
                                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </label>
                                <label className="form-field">
                                    <span>공개 범위</span>
                                    <select aria-label="공개 범위" value={uploadVisibility} onChange={event => setUploadVisibility(event.target.value as StudentFile["visibility"])} disabled={uploading}>
                                        <option value="student_parent">학부모 공개</option>
                                        <option value="staff_only">선생님만 보기</option>
                                    </select>
                                </label>
                                <label className="form-field note-field">
                                    <span>파일 설명 <em>선택</em></span>
                                    <input aria-label="파일 설명" value={uploadNote} onChange={event => setUploadNote(event.target.value)} maxLength={240} placeholder="예: 9월 엔트리 게임 작품" disabled={uploading} />
                                </label>
                                <button
                                    type="button"
                                    className="upload-button"
                                    onClick={() => void upload()}
                                    disabled={uploading || !selectedStudent?.linked}
                                >
                                    <FileUp size={17} /> {uploading ? "올리는 중..." : "선택 학생에게 올리기"}
                                </button>
                            </div>
                            {selectedStudent && !selectedStudent.linked && <p className="upload-warning">이 학생은 로그인 계정 연결 후 파일을 올릴 수 있습니다.</p>}
                        </section>
                    )}

                    <section className="file-panel">
                        <div className="panel-title compact">
                            <FolderOpen size={18} />
                            <div>
                                <h2>파일 목록</h2>
                                <p>공개 범위를 바꾸면 학부모 현황판에 바로 반영됩니다.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty">파일 목록을 불러오는 중입니다.</div>
                        ) : visibleFiles.length === 0 ? (
                            <div className="empty">선택한 학생의 파일이 없습니다.</div>
                        ) : (
                            <div className="file-table">
                                <div className="file-row head">
                                    <span>파일</span><span>분류</span><span>등록자</span><span>공개 범위</span><span>일시</span><span>관리</span>
                                </div>
                                {visibleFiles.map(file => (
                                    <div className="file-row" key={file.id}>
                                        <div className="file-main">
                                            <strong>{file.originalName}</strong>
                                            <small>{formatBytes(file.sizeBytes)}{file.note ? ` · ${file.note}` : ""}</small>
                                        </div>
                                        <span>{CATEGORY_LABELS[file.category] || file.category}</span>
                                        <span>{roleLabel(file.uploadedByRole)}</span>
                                        {canManageVisibility ? (
                                            <div className="visibility-control" role="group" aria-label={`${file.originalName} 공개 범위`}>
                                                <button
                                                    type="button"
                                                    className={`visibility-button${file.visibility === "student_parent" ? " active public" : ""}`}
                                                    aria-pressed={file.visibility === "student_parent"}
                                                    aria-label={`${file.originalName}을 학부모 공개로 변경`}
                                                    onClick={() => void changeVisibility(file, "student_parent")}
                                                    disabled={actingId === file.id}
                                                >
                                                    <Eye size={13} /> 학부모 공개
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`visibility-button${file.visibility === "staff_only" ? " active private" : ""}`}
                                                    aria-pressed={file.visibility === "staff_only"}
                                                    aria-label={`${file.originalName}을 선생님만 보기로 변경`}
                                                    onClick={() => void changeVisibility(file, "staff_only")}
                                                    disabled={actingId === file.id}
                                                >
                                                    <LockKeyhole size={13} /> 선생님만
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`visibility-badge ${file.visibility}`}>
                                                {file.visibility === "student_parent" ? "학부모 공개" : "선생님만"}
                                            </span>
                                        )}
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
                .subtle-button, .small-button { border: 1px solid #d8e0ee; background: #fff; color: #1e293b; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 800; text-decoration: none; }
                .subtle-button { height: 42px; padding: 0 15px; }
                .subtle-button:disabled, .small-button:disabled { opacity: .55; cursor: not-allowed; }
                .notice { margin: 0 0 16px; padding: 13px 16px; border-radius: 12px; font-weight: 800; border: 1px solid #dbe4f2; background: #fff; }
                .notice.ok { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
                .notice.error { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
                .layout-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; }
                .student-panel, .work-panel, .file-panel, .upload-panel { background: #fff; border: 1px solid #dbe4f2; border-radius: 18px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.05); }
                .student-panel { padding: 18px; position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow: hidden; display: flex; flex-direction: column; }
                .panel-title { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
                .panel-title h2 { margin: 0 0 3px; font-size: 17px; letter-spacing: -0.02em; }
                .panel-title p { margin: 0; color: #64748b; font-size: 12px; font-weight: 700; }
                .panel-title.compact { margin-bottom: 12px; }
                .search-input { height: 44px; border: 1px solid #d8e0ee; border-radius: 12px; padding: 0 12px; background: #f8fafc; color: #0f172a; font: inherit; font-weight: 700; }
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
                .upload-panel { margin-bottom: 14px; padding: 18px; box-shadow: none; border-color: #bfdbfe; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 68%); }
                .upload-form { display: grid; grid-template-columns: minmax(240px, 1fr) 130px 160px; gap: 12px; align-items: end; }
                .form-field { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
                .form-field > span { color: #334155; font-size: 12px; font-weight: 900; }
                .form-field em { color: #94a3b8; font-style: normal; font-weight: 700; }
                .form-field input, .form-field select { min-width: 0; height: 42px; border: 1px solid #cbd5e1; border-radius: 11px; background: #fff; color: #0f172a; padding: 0 11px; font: inherit; font-size: 13px; font-weight: 700; }
                .form-field input[type="file"] { padding: 8px; }
                .form-field input:disabled, .form-field select:disabled { cursor: not-allowed; opacity: .6; }
                .form-field small { min-height: 16px; overflow: hidden; color: #64748b; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
                .note-field { grid-column: 1 / 3; }
                .upload-button { height: 42px; border: 0; border-radius: 11px; background: #2563eb; color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 15px; font-weight: 900; cursor: pointer; box-shadow: 0 8px 18px rgba(37, 99, 235, .2); }
                .upload-button:disabled { cursor: not-allowed; opacity: .55; box-shadow: none; }
                .upload-warning { margin: 10px 0 0; color: #b45309; font-size: 12px; font-weight: 800; }
                .file-panel { padding: 18px; box-shadow: none; }
                .empty { padding: 42px 16px; border: 1px dashed #d8e0ee; border-radius: 14px; background: #f8fafc; color: #94a3b8; text-align: center; font-weight: 800; }
                .file-table { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
                .file-row { display: grid; grid-template-columns: minmax(210px, 1fr) 74px 68px minmax(210px, .9fr) 108px 196px; gap: 10px; align-items: center; padding: 13px 14px; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; }
                .file-row:first-child { border-top: none; }
                .file-row.head { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 900; }
                .file-main { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
                .file-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .file-main small { color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .row-actions { display: flex; gap: 8px; justify-content: flex-end; }
                .visibility-control { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 4px; border-radius: 11px; background: #f1f5f9; }
                .visibility-button { min-height: 32px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #64748b; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 0 7px; font-size: 11px; font-weight: 900; cursor: pointer; white-space: nowrap; }
                .visibility-button.active.public { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
                .visibility-button.active.private { color: #475569; background: #fff; border-color: #cbd5e1; }
                .visibility-button:disabled { opacity: .55; cursor: wait; }
                .visibility-badge { width: fit-content; border-radius: 999px; padding: 6px 9px; font-size: 11px; font-weight: 900; }
                .visibility-badge.student_parent { color: #047857; background: #ecfdf5; }
                .visibility-badge.staff_only { color: #475569; background: #f1f5f9; }
                .small-button { min-height: 34px; padding: 0 10px; border-radius: 10px; font-size: 12px; }
                .small-button.danger { color: #b91c1c; background: #fff7f7; border-color: #fecaca; }
                @media (max-width: 1100px) {
                    .layout-grid, .selected-strip { grid-template-columns: 1fr; }
                    .upload-form { grid-template-columns: 1fr; }
                    .note-field { grid-column: auto; }
                    .student-panel { position: static; max-height: none; }
                    .file-row, .file-row.head { grid-template-columns: 1fr; align-items: start; }
                    .file-row.head { display: none; }
                    .row-actions { justify-content: flex-start; flex-wrap: wrap; }
                }
            `}</style>
        </main>
    );
}
