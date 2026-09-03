import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDENT_ACCESS_CODE_MODE_ENV = "SUPABASE_ACCESS_CODE_MODE";

export type StudentAccessCodeMode = "legacy" | "hashed";
export type StudentAccessCodePurpose = "student_login" | "parent_access";

export type VerifiedStudentAccess = {
    studentId: string;
    authUserId: string | null;
    status: string;
};

export type StudentAccessCodeStatus = {
    studentId: string;
    studentLoginIssued: boolean;
    parentAccessIssued: boolean;
};

type RpcRow = {
    student_id?: unknown;
    auth_user_id?: unknown;
    student_status?: unknown;
};

type StatusRpcRow = {
    student_id?: unknown;
    student_login_issued?: unknown;
    parent_access_issued?: unknown;
};

function readText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

export function getStudentAccessCodeMode(): StudentAccessCodeMode {
    return process.env[STUDENT_ACCESS_CODE_MODE_ENV]?.trim().toLowerCase() === "hashed"
        ? "hashed"
        : "legacy";
}

export function usesHashedStudentAccessCodes() {
    return getStudentAccessCodeMode() === "hashed";
}

export function isValidStudentAccessCode(purpose: StudentAccessCodePurpose, code: string) {
    return purpose === "student_login" ? /^\d{4}$/.test(code) : /^\d{5}$/.test(code);
}

export async function verifyHashedStudentAccessCode(
    admin: SupabaseClient,
    input: {
        studentName: string;
        purpose: StudentAccessCodePurpose;
        code: string;
    },
): Promise<VerifiedStudentAccess[]> {
    const studentName = input.studentName.trim().replace(/\s+/g, "");
    const code = input.code.replace(/\D/g, "");
    if (!studentName || !isValidStudentAccessCode(input.purpose, code)) return [];

    const { data, error } = await admin.rpc("codingssok_verify_student_access_code", {
        p_student_name: studentName,
        p_purpose: input.purpose,
        p_code: code,
    });
    if (error) throw new Error(error.message || "인증번호를 확인하지 못했습니다.");

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return (rows as RpcRow[]).flatMap((row) => {
        const studentId = readText(row.student_id);
        const status = readText(row.student_status);
        if (!studentId || !status) return [];
        return [{
            studentId,
            authUserId: readText(row.auth_user_id) || null,
            status,
        }];
    });
}

export async function issueHashedStudentAccessCode(
    admin: SupabaseClient,
    input: {
        studentId: string;
        purpose: StudentAccessCodePurpose;
        code: string;
    },
) {
    const studentId = input.studentId.trim();
    const code = input.code.replace(/\D/g, "");
    if (!studentId || !isValidStudentAccessCode(input.purpose, code)) {
        throw new Error("인증번호 형식을 확인해주세요.");
    }

    const { error } = await admin.rpc("codingssok_issue_student_access_code", {
        p_student_id: studentId,
        p_purpose: input.purpose,
        p_code: code,
    });
    if (error) throw new Error(error.message || "인증번호를 안전하게 저장하지 못했습니다.");
}

export async function loadHashedStudentAccessCodeStatuses(
    admin: SupabaseClient,
): Promise<StudentAccessCodeStatus[]> {
    const { data, error } = await admin.rpc("codingssok_list_student_access_code_status");
    if (error) throw new Error(error.message || "인증번호 발급 상태를 확인하지 못했습니다.");

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return (rows as StatusRpcRow[]).flatMap((row) => {
        const studentId = readText(row.student_id);
        if (!studentId) return [];
        return [{
            studentId,
            studentLoginIssued: row.student_login_issued === true,
            parentAccessIssued: row.parent_access_issued === true,
        }];
    });
}

export async function revokeHashedStudentAccessCode(
    admin: SupabaseClient,
    input: {
        studentId: string;
        purpose: StudentAccessCodePurpose;
    },
) {
    const studentId = input.studentId.trim();
    if (!studentId) throw new Error("학생 정보를 확인해주세요.");

    const { error } = await admin.rpc("codingssok_revoke_student_access_code", {
        p_student_id: studentId,
        p_purpose: input.purpose,
    });
    if (error) throw new Error(error.message || "인증번호를 해제하지 못했습니다.");
}
