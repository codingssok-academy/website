import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDENT_ACCESS_CODE_MODE_ENV = "SUPABASE_ACCESS_CODE_MODE";

export type StudentAccessCodeMode = "legacy" | "hashed";
export type StudentAccessCodePurpose = "student_login" | "parent_access";

export type VerifiedStudentAccess = {
    studentId: string;
    authUserId: string | null;
    status: string;
};

type RpcRow = {
    student_id?: unknown;
    auth_user_id?: unknown;
    student_status?: unknown;
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
