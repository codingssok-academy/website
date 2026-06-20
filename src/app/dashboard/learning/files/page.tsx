"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileUp, FolderOpen, RefreshCw, Trash2, UploadCloud } from "lucide-react";

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
    canStudentDelete: boolean;
};

type StudentInfo = {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
    className: string | null;
};

const CATEGORIES = [
    { value: "result", label: "결과물" },
    { value: "entry", label: "엔트리" },
    { value: "code", label: "코드" },
    { value: "document", label: "문서" },
    { value: "homework", label: "과제" },
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
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function roleLabel(role: StudentFile["uploadedByRole"]) {
    if (role === "student") return "학생 업로드";
    if (role === "admin") return "관리자 제공";
    return "선생님 제공";
}

async function readJson(response: Response) {
    const text = await response.text();
    if (!text.trim()) return { success: response.ok };
    try { return JSON.parse(text); } catch { return { success: false, error: text || `HTTP ${response.status}` }; }
}

export default function StudentFilesPage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [category, setCategory] = useState("result");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/student/files", { cache: "no-store" });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "파일함을 불러오지 못했습니다.");
            setStudent(data.student || null);
            setFiles(data.files || []);
        } catch (error) {
            setFiles([]);
            setMessage({ type: "error", text: error instanceof Error ? error.message : "파일함을 불러오지 못했습니다." });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.sizeBytes, 0), [files]);

    const upload = async () => {
        const file = inputRef.current?.files?.[0];
        if (!file) {
            setMessage({ type: "error", text: "업로드할 파일을 선택해주세요." });
            return;
        }
        setUploading(true);
        setMessage(null);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("category", category);
            form.append("note", note);
            const res = await fetch("/api/student/files", { method: "POST", body: form });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "업로드에 실패했습니다.");
            setFiles(prev => [data.file, ...prev]);
            setNote("");
            if (inputRef.current) inputRef.current.value = "";
            setMessage({ type: "ok", text: "파일을 저장했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "업로드에 실패했습니다." });
        } finally {
            setUploading(false);
        }
    };

    const remove = async (file: StudentFile) => {
        if (!file.canStudentDelete) return;
        if (!window.confirm(`${file.originalName} 파일을 삭제할까요?`)) return;
        setMessage(null);
        try {
            const res = await fetch(`/api/student/files/${file.id}`, { method: "DELETE" });
            const data = await readJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "삭제에 실패했습니다.");
            setFiles(prev => prev.filter(item => item.id !== file.id));
            setMessage({ type: "ok", text: "파일을 삭제했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "삭제에 실패했습니다." });
        }
    };

    return (
        <main className="files-shell">
            <header className="files-header">
                <button type="button" className="icon-button" onClick={() => router.push("/dashboard/learning")} aria-label="뒤로가기">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <p className="eyebrow">Student file room</p>
                    <h1>내 파일함</h1>
                    <p>{student?.name ? `${student.name} 학생의 결과물과 수업 자료를 보관합니다.` : "내 수업 자료와 결과물을 한 곳에 저장합니다."}</p>
                </div>
                <button type="button" className="ghost-button" onClick={load} disabled={loading}>
                    <RefreshCw size={16} /> 새로고침
                </button>
            </header>

            {message && <div className={`notice ${message.type}`}>{message.text}</div>}

            <section className="summary-grid">
                <div className="summary-card">
                    <span>보관 파일</span>
                    <strong>{files.length}</strong>
                </div>
                <div className="summary-card">
                    <span>사용 용량</span>
                    <strong>{formatBytes(totalSize)}</strong>
                </div>
                <div className="summary-card">
                    <span>제공 자료</span>
                    <strong>{files.filter(file => file.uploadedByRole !== "student").length}</strong>
                </div>
            </section>

            <section className="upload-panel">
                <div className="panel-title">
                    <UploadCloud size={20} />
                    <div>
                        <h2>파일 저장</h2>
                        <p>엔트리, 코드, 문서, 결과물 파일을 50MB 이하로 저장할 수 있습니다.</p>
                    </div>
                </div>
                <div className="upload-row">
                    <label>
                        <span>분류</span>
                        <select value={category} onChange={event => setCategory(event.target.value)}>
                            {CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                    </label>
                    <label className="file-field">
                        <span>파일</span>
                        <input ref={inputRef} type="file" />
                    </label>
                    <label>
                        <span>메모</span>
                        <input value={note} onChange={event => setNote(event.target.value)} maxLength={120} placeholder="예: 엔트리 게임 1차 완성" />
                    </label>
                    <button type="button" className="primary-button" onClick={upload} disabled={uploading}>
                        <FileUp size={17} /> {uploading ? "저장 중" : "저장하기"}
                    </button>
                </div>
            </section>

            <section className="list-panel">
                <div className="panel-title compact">
                    <FolderOpen size={20} />
                    <div>
                        <h2>저장된 파일</h2>
                        <p>선생님이 넣은 자료와 내가 올린 결과물이 함께 표시됩니다.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty">파일 목록을 불러오는 중입니다.</div>
                ) : files.length === 0 ? (
                    <div className="empty">아직 저장된 파일이 없습니다.</div>
                ) : (
                    <div className="file-table">
                        <div className="file-row head">
                            <span>파일명</span><span>분류</span><span>등록</span><span>크기</span><span>관리</span>
                        </div>
                        {files.map(file => (
                            <div className="file-row" key={file.id}>
                                <div className="file-main">
                                    <strong>{file.originalName}</strong>
                                    <small>{roleLabel(file.uploadedByRole)}{file.note ? ` · ${file.note}` : ""}</small>
                                </div>
                                <span>{CATEGORIES.find(item => item.value === file.category)?.label || file.category}</span>
                                <span>{formatDate(file.createdAt)}</span>
                                <span>{formatBytes(file.sizeBytes)}</span>
                                <div className="actions">
                                    <a className="small-button" href={`/api/student/files/${file.id}`} target="_blank" rel="noreferrer">
                                        <Download size={15} /> 다운로드
                                    </a>
                                    {file.canStudentDelete && (
                                        <button type="button" className="small-button danger" onClick={() => remove(file)}>
                                            <Trash2 size={15} /> 삭제
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                .files-shell { min-height: 100vh; padding: 32px; background: #f5f7fb; color: #0f172a; font-family: Pretendard, system-ui, sans-serif; }
                .files-header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; margin-bottom: 18px; }
                .files-header h1 { margin: 2px 0 6px; font-size: clamp(32px, 5vw, 54px); line-height: 1; letter-spacing: -0.03em; }
                .files-header p { margin: 0; color: #64748b; font-size: 15px; font-weight: 600; }
                .eyebrow { color: #2563eb !important; text-transform: uppercase; letter-spacing: .16em; font-size: 12px !important; font-weight: 900 !important; }
                .icon-button, .ghost-button, .primary-button, .small-button { border: 1px solid #d8e0ee; background: #fff; color: #1e293b; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 800; text-decoration: none; }
                .icon-button { width: 42px; height: 42px; border-radius: 12px; }
                .ghost-button { height: 42px; padding: 0 15px; border-radius: 12px; }
                .primary-button { height: 48px; padding: 0 20px; border-radius: 12px; border: none; background: #2563eb; color: #fff; white-space: nowrap; }
                .primary-button:disabled, .ghost-button:disabled { opacity: .55; cursor: not-allowed; }
                .notice { margin: 0 0 16px; padding: 13px 16px; border-radius: 12px; font-weight: 800; border: 1px solid #dbe4f2; background: #fff; }
                .notice.ok { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
                .notice.error { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
                .notice.info { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
                .summary-card, .upload-panel, .list-panel { background: #fff; border: 1px solid #dbe4f2; border-radius: 18px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.05); }
                .summary-card { padding: 18px 20px; }
                .summary-card span { display: block; color: #64748b; font-size: 12px; font-weight: 900; margin-bottom: 8px; }
                .summary-card strong { font-size: 30px; letter-spacing: -0.03em; }
                .upload-panel, .list-panel { padding: 22px; margin-bottom: 16px; }
                .panel-title { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 18px; }
                .panel-title h2 { margin: 0 0 4px; font-size: 20px; letter-spacing: -0.02em; }
                .panel-title p { margin: 0; color: #64748b; font-size: 13px; font-weight: 700; }
                .panel-title.compact { margin-bottom: 12px; }
                .upload-row { display: grid; grid-template-columns: 150px minmax(220px, 1fr) minmax(220px, 1fr) auto; gap: 12px; align-items: end; }
                label { display: flex; flex-direction: column; gap: 7px; color: #475569; font-size: 12px; font-weight: 900; }
                input, select { height: 46px; border: 1px solid #d8e0ee; border-radius: 12px; padding: 0 13px; font: inherit; font-weight: 700; color: #0f172a; background: #f8fafc; }
                .file-field input { padding-top: 11px; }
                .empty { padding: 44px 16px; text-align: center; color: #94a3b8; font-weight: 800; border: 1px dashed #d8e0ee; border-radius: 16px; background: #f8fafc; }
                .file-table { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
                .file-row { display: grid; grid-template-columns: minmax(260px, 1fr) 120px 120px 110px 220px; gap: 14px; align-items: center; padding: 14px 16px; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; }
                .file-row:first-child { border-top: none; }
                .file-row.head { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 900; }
                .file-main { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
                .file-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .file-main small { color: #64748b; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .actions { display: flex; gap: 8px; justify-content: flex-end; }
                .small-button { min-height: 34px; padding: 0 11px; border-radius: 10px; font-size: 12px; }
                .small-button.danger { color: #b91c1c; border-color: #fecaca; background: #fff7f7; }
                @media (max-width: 920px) {
                    .files-shell { padding: 20px; }
                    .files-header { grid-template-columns: auto 1fr; }
                    .files-header .ghost-button { grid-column: 1 / -1; justify-self: start; }
                    .summary-grid, .upload-row { grid-template-columns: 1fr; }
                    .file-row, .file-row.head { grid-template-columns: 1fr; align-items: start; }
                    .file-row.head { display: none; }
                    .actions { justify-content: flex-start; flex-wrap: wrap; }
                }
            `}</style>
        </main>
    );
}
