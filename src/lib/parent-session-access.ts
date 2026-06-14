import type { SupabaseClient } from "@supabase/supabase-js";
import { PIN_COURSE } from "@/lib/parent-auth";
import type { ParentSessionPayload } from "@/lib/parent-session";

type StudentAccessRow = {
    id: string;
    name: string;
    pin?: string | null;
    status?: string | null;
    auth_user_id?: string | null;
};

type ProfileAccessRow = {
    name?: string | null;
    display_name?: string | null;
};

type ProgressAccessRow = {
    completed_units?: string[] | null;
};

export function normalizeParentAccessName(value: string) {
    return value.trim().replace(/\s+/g, "");
}

function unique(values: string[]) {
    return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function isActiveStudent(row: StudentAccessRow | null | undefined) {
    return Boolean(row && row.status !== "deactivated" && /^\d{5}$/.test(row.pin || ""));
}

export async function loadAllowedStudentsByParentPin(
    supabase: SupabaseClient,
    pin: string,
    fallbackName: string,
) {
    const normalizedPin = pin.replace(/\D/g, "").slice(0, 5);
    const normalizedFallback = normalizeParentAccessName(fallbackName);
    if (!/^\d{5}$/.test(normalizedPin)) {
        return {
            studentIds: [] as string[],
            studentNames: normalizedFallback ? [normalizedFallback] : [],
        };
    }

    const { data } = await supabase
        .from("students")
        .select("id, name, pin, status, auth_user_id")
        .eq("pin", normalizedPin);

    const activeRows = ((data || []) as StudentAccessRow[]).filter(isActiveStudent);
    const studentNames = unique(activeRows.map(row => normalizeParentAccessName(row.name)));
    return {
        studentIds: unique(activeRows.map(row => row.auth_user_id || row.id)),
        studentNames: studentNames.length > 0 ? studentNames : (normalizedFallback ? [normalizedFallback] : []),
    };
}

export function getSessionAllowedNames(session: ParentSessionPayload | null, fallbackName: string) {
    if (!session) return [];
    const fromSession = session.studentNames?.map(normalizeParentAccessName).filter(Boolean) || [];
    const fallback = normalizeParentAccessName(fallbackName || session.parentName || "");
    return unique(fromSession.length > 0 ? fromSession : [fallback]);
}

export async function canParentSessionReadStudent(
    supabase: SupabaseClient,
    session: ParentSessionPayload | null,
    studentName: string,
) {
    if (!session?.studentId || !session.parentPin) return false;

    const normalizedName = normalizeParentAccessName(studentName);
    const allowedNames = getSessionAllowedNames(session, normalizedName);
    if (!allowedNames.includes(normalizedName)) return false;

    const normalizedPin = session.parentPin.replace(/\D/g, "").slice(0, 5);
    if (!/^\d{5}$/.test(normalizedPin)) return false;

    const [studentsRes, profileRes, progressRes] = await Promise.all([
        supabase
            .from("students")
            .select("id, name, pin, status, auth_user_id")
            .eq("name", normalizedName)
            .limit(10),
        supabase
            .from("profiles")
            .select("name, display_name")
            .eq("id", session.studentId)
            .maybeSingle(),
        supabase
            .from("study_progress")
            .select("completed_units")
            .eq("user_id", session.studentId)
            .eq("course_id", PIN_COURSE)
            .maybeSingle(),
    ]);

    const matchingStudent = ((studentsRes.data || []) as StudentAccessRow[]).find(
        row => normalizeParentAccessName(row.name) === normalizedName && row.pin === normalizedPin,
    );
    if (matchingStudent) {
        return matchingStudent.status !== "deactivated";
    }

    const profile = profileRes.data as ProfileAccessRow | null;
    const profileName = normalizeParentAccessName(profile?.display_name || profile?.name || "");
    const progress = progressRes.data as ProgressAccessRow | null;
    return profileName === normalizedName && progress?.completed_units?.[0] === normalizedPin;
}
