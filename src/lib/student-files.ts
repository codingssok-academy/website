export const STUDENT_FILES_BUCKET = "student-files";
export const STUDENT_FILE_MAX_BYTES = 50 * 1024 * 1024;

export type StudentFileVisibility = "student_parent" | "staff_only";

const ALLOWED_EXTENSIONS = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "pdf",
    "txt",
    "md",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "zip",
    "sb3",
    "ent",
    "py",
    "cpp",
    "c",
    "h",
    "html",
    "css",
    "js",
    "json",
]);

export type StudentFileRow = {
    id: string;
    student_id: string;
    owner_auth_user_id: string | null;
    uploaded_by: string | null;
    uploaded_by_role: "student" | "teacher" | "admin";
    original_name: string;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number;
    category: string;
    note: string | null;
    visibility?: StudentFileVisibility;
    created_at: string;
};

export type StudentFileDto = {
    id: string;
    studentId: string;
    ownerAuthUserId: string | null;
    uploadedByRole: "student" | "teacher" | "admin";
    originalName: string;
    mimeType: string | null;
    sizeBytes: number;
    category: string;
    note: string | null;
    visibility: StudentFileVisibility;
    createdAt: string;
    canStudentDelete: boolean;
    student?: {
        id: string;
        name: string;
        school: string | null;
        grade: string | null;
        className: string | null;
    } | null;
};

export function normalizeStudentFileCategory(input: unknown) {
    const value = typeof input === "string" ? input.trim().slice(0, 24) : "";
    return value || "result";
}

export function normalizeStudentFileNote(input: unknown) {
    const value = typeof input === "string" ? input.trim().slice(0, 240) : "";
    return value || null;
}

export function normalizeStudentFileVisibility(input: unknown): StudentFileVisibility | null {
    return input === "student_parent" || input === "staff_only" ? input : null;
}

export function sanitizeOriginalFileName(input: unknown) {
    const fallback = "student-file";
    const raw = typeof input === "string" ? input.trim() : fallback;
    const cleaned = raw
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
        .replace(/\s+/g, " ")
        .slice(0, 160)
        .trim();
    return cleaned || fallback;
}

export function getSafeFileExtension(fileName: string) {
    const match = sanitizeOriginalFileName(fileName).toLowerCase().match(/\.([a-z0-9]{1,10})$/);
    return match?.[1] || "bin";
}

export function assertAllowedStudentFile(file: File) {
    if (!file || file.size <= 0) {
        throw new Error("업로드할 파일을 선택해주세요.");
    }
    if (file.size > STUDENT_FILE_MAX_BYTES) {
        throw new Error("파일은 50MB 이하만 업로드할 수 있습니다.");
    }
    const ext = getSafeFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error("지원하지 않는 파일 형식입니다.");
    }
}

export function buildStudentFilePath(input: {
    studentId: string;
    fileName: string;
    uploadedByRole: "student" | "teacher" | "admin";
}) {
    const ext = getSafeFileExtension(input.fileName);
    const stamp = Date.now();
    const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    return `students/${input.studentId}/${input.uploadedByRole}/${stamp}-${random}.${ext}`;
}

export function toStudentFileDto(row: StudentFileRow, student?: StudentFileDto["student"]): StudentFileDto {
    return {
        id: row.id,
        studentId: row.student_id,
        ownerAuthUserId: row.owner_auth_user_id,
        uploadedByRole: row.uploaded_by_role,
        originalName: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes || 0),
        category: row.category,
        note: row.note,
        visibility: row.visibility ?? "student_parent",
        createdAt: row.created_at,
        canStudentDelete: row.uploaded_by_role === "student",
        student: student ?? null,
    };
}
