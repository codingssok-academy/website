import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParentSessionPayload } from "@/lib/parent-session";

export type FreshDashboardStudent = {
    id: string;
    name: string;
    auth_user_id: string | null;
    school: string | null;
    grade: string | null;
    class: string | null;
    status: string;
};

const STUDENT_FIELDS = "id,name,auth_user_id,school,grade,class,status";
const normalizeName = (value: string) => value.trim().replace(/\s+/g, "");

// The parent PIN session is not a Supabase user session. Resolve its signed IDs
// before using the server client, never select an arbitrary namesake by name.
export async function resolveFreshDashboardStudent(
    service: SupabaseClient,
    session: ParentSessionPayload | null,
    name: string,
    createUserClient: () => Promise<SupabaseClient>,
): Promise<FreshDashboardStudent | null> {
    const normalizedName = normalizeName(name);
    if (session?.studentId) {
        const allowedNames = session.studentNames?.length
            ? session.studentNames : [session.parentName];
        if (!allowedNames.some(value => normalizeName(value) === normalizedName)) return null;
        const allowedIds = [...new Set([session.studentId, ...(session.studentIds || [])])];
        const { data, error } = await service.from("students")
            .select(STUDENT_FIELDS).in("id", allowedIds).eq("status", "active");
        if (error) throw new Error("fresh parent student lookup failed");
        const matches = ((data || []) as FreshDashboardStudent[]).filter(student =>
            allowedIds.includes(student.id) && student.status === "active"
            && normalizeName(student.name) === normalizedName);
        return matches.length === 1 ? matches[0] : null;
    }

    // Staff preview must also pass approval and the existing student RLS scope.
    const userClient = await createUserClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return null;
    const { data: profile, error: profileError } = await userClient.from("profiles")
        .select("role,approval_status").eq("id", user.id).maybeSingle();
    if (profileError || profile?.approval_status !== "approved"
        || !["teacher", "admin"].includes(profile?.role)) return null;
    const { data, error } = await userClient.from("students")
        .select(STUDENT_FIELDS).eq("name", name).eq("status", "active").limit(2);
    if (error) throw new Error("fresh staff student lookup failed");
    const matches = (data || []) as FreshDashboardStudent[];
    return matches.length === 1 ? matches[0] : null;
}

// Call only with the student resolved above. No additional DB privileges are
// needed; return the same monthly shape using explicit parent-safe fields.
export async function readFreshParentAttendance(
    service: SupabaseClient,
    student: FreshDashboardStudent,
    month: string,
) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("invalid attendance month");
    const [year, monthNumber] = month.split("-").map(Number);
    const monthStart = `${month}-01`;
    const monthEnd = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
    const { data, error } = await service.from("student_attendance_records")
        .select("id,class_date,lesson_title,status")
        .eq("student_id", student.id).gte("class_date", monthStart).lte("class_date", monthEnd)
        .order("class_date", { ascending: true }).order("lesson_title", { ascending: true });
    if (error) return { data: null, error };
    const records = data || [];
    const count = (status: string) => records.filter(record => record.status === status).length;
    const present = count("present");
    const absent = count("absent");
    const upcoming = count("scheduled");
    const makeup = count("makeup");
    return {
        error: null,
        data: {
            api_version: "1.0",
            period: { month, month_start: monthStart, month_end: monthEnd },
            data: {
                student: { id: student.id, display_name: student.name },
                summary: { scheduled: present + absent + upcoming, present, absent, upcoming, makeup, completed: present + makeup },
                records,
            },
        },
    };
}
