import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth-teacher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentRow = {
    id: string;
    name: string;
    grade: string | null;
    class: string | null;
    pin: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    auth_user_id: string | null;
};

type ProfileRow = {
    id: string;
    email: string | null;
    role: string | null;
    name: string | null;
    display_name: string | null;
    approval_status: string | null;
};

type AuthUserSummary = {
    id: string;
    email: string | undefined;
    created_at: string | undefined;
    last_sign_in_at: string | undefined;
};

type StudentAccountsRpcResponse = {
    success?: boolean;
    error?: string;
    students?: unknown[];
    stats?: Record<string, number>;
    warning?: string;
};

const STUDENT_COLUMNS = "id,name,grade,class,pin,status,created_at,updated_at,auth_user_id";
const PROFILE_COLUMNS = "id,email,role,name,display_name,approval_status";
const MUTABLE_STATUSES = new Set(["pending", "approved", "deactivated", "rejected"]);

function normalizeStatus(input: unknown) {
    return typeof input === "string" ? input.trim() : "";
}

function normalizeId(input: unknown) {
    return typeof input === "string" ? input.trim() : "";
}

function isProtectedProfile(profile: ProfileRow | null | undefined) {
    return profile?.role === "teacher" || profile?.role === "admin";
}

async function proxyStudentAccountsToRpc(action: string, payload: Record<string, unknown> = {}) {
    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
        return NextResponse.json({ success: false, error: "Admin session is required." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("codingssok_admin_student_accounts", {
        _action: action,
        _payload: payload,
    });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const body = data as StudentAccountsRpcResponse | null;
    if (!body?.success) {
        return NextResponse.json(
            { success: false, error: body?.error || "Student account operation failed." },
            { status: 500 },
        );
    }

    return NextResponse.json(body, {
        headers: { "Cache-Control": "no-store" },
    });
}

async function listAuthUsers(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
    const users = new Map<string, AuthUserSummary>();

    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error(error.message);

        for (const user of data.users || []) {
            users.set(user.id, {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
            });
        }

        if ((data.users || []).length < 1000) break;
    }

    return users;
}

async function loadStudentAccounts(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
    const [studentsRes, profilesRes] = await Promise.all([
        admin.from("students").select(STUDENT_COLUMNS).order("name", { ascending: true }),
        admin.from("profiles").select(PROFILE_COLUMNS),
    ]);

    if (studentsRes.error) throw new Error(studentsRes.error.message);
    if (profilesRes.error) throw new Error(profilesRes.error.message);

    let authUsers = new Map<string, AuthUserSummary>();
    let warning: string | null = null;
    try {
        authUsers = await listAuthUsers(admin);
    } catch (error) {
        warning = error instanceof Error ? error.message : "Auth user list was unavailable.";
    }

    const profiles = new Map((profilesRes.data || []).map(profile => [profile.id, profile as ProfileRow]));
    const linkedProfileIds = new Set<string>();

    const studentAccounts = ((studentsRes.data || []) as StudentRow[])
        .filter(student => student.class !== "admin")
        .map(student => {
            const profile = student.auth_user_id ? profiles.get(student.auth_user_id) || null : null;
            const authUser = student.auth_user_id ? authUsers.get(student.auth_user_id) || null : null;
            if (student.auth_user_id) linkedProfileIds.add(student.auth_user_id);

            return {
                id: student.id,
                source: "student" as const,
                name: student.name,
                grade: student.grade,
                className: student.class,
                status: student.status || "approved",
                canChangeStatus: true,
                pinIssued: /^\d{5}$/.test(student.pin || ""),
                createdAt: student.created_at,
                updatedAt: student.updated_at,
                authUserId: student.auth_user_id,
                accountLinked: Boolean(student.auth_user_id),
                email: authUser?.email || profile?.email || null,
                role: profile?.role || null,
                displayName: profile?.display_name || profile?.name || null,
                authCreatedAt: authUser?.created_at || null,
                lastSignInAt: authUser?.last_sign_in_at || null,
                canDeleteAccount: Boolean(student.auth_user_id && !isProtectedProfile(profile)),
            };
        });

    const orphanAccounts = (profilesRes.data || [])
        .map(profile => profile as ProfileRow)
        .filter(profile => {
            if (profile.role !== "student" || linkedProfileIds.has(profile.id)) return false;
            return authUsers.size > 0 ? authUsers.has(profile.id) : true;
        })
        .map(profile => {
            const authUser = authUsers.get(profile.id) || null;
            return {
                id: profile.id,
                source: "orphan" as const,
                name: profile.display_name || profile.name || authUser?.email || profile.email || "Unlinked account",
                grade: null,
                className: "Unlinked account",
                status: profile.approval_status || "orphan",
                canChangeStatus: false,
                pinIssued: false,
                createdAt: authUser?.created_at || null,
                updatedAt: null,
                authUserId: profile.id,
                accountLinked: true,
                email: authUser?.email || profile.email || null,
                role: profile.role || null,
                displayName: profile.display_name || profile.name || null,
                authCreatedAt: authUser?.created_at || null,
                lastSignInAt: authUser?.last_sign_in_at || null,
                canDeleteAccount: !isProtectedProfile(profile),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    const students = [...studentAccounts, ...orphanAccounts];
    const stats = {
        total: students.length,
        linked: students.filter(student => student.accountLinked).length,
        unlinked: studentAccounts.filter(student => !student.accountLinked).length,
        approved: students.filter(student => student.status === "approved").length,
        deactivated: students.filter(student => student.status === "deactivated").length,
        pending: students.filter(student => student.status === "pending").length,
        orphan: orphanAccounts.length,
    };

    return {
        success: true,
        students,
        stats,
        warning: warning ? "Auth 사용자 목록을 직접 조회하지 못해 프로필 기준으로 계정 상태를 표시합니다." : undefined,
    };
}

async function updateStatusWithAdmin(admin: NonNullable<ReturnType<typeof createAdminClient>>, body: Record<string, unknown>) {
    const studentId = normalizeId(body?.studentId);
    const status = normalizeStatus(body?.status);

    if (!studentId || !MUTABLE_STATUSES.has(status)) {
        return NextResponse.json(
            { success: false, error: "Student id and valid status are required." },
            { status: 400 },
        );
    }

    const { error } = await admin
        .from("students")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", studentId);

    if (error) throw new Error(error.message);

    return NextResponse.json(await loadStudentAccounts(admin), {
        headers: { "Cache-Control": "no-store" },
    });
}

async function deactivateAccountWithAdmin(
    admin: NonNullable<ReturnType<typeof createAdminClient>>,
    actorUserId: string,
    body: Record<string, unknown>,
) {
    const studentId = normalizeId(body?.studentId);
    const accountId = normalizeId(body?.accountId);

    if (!studentId && !accountId) {
        return NextResponse.json({ success: false, error: "Student id or account id is required." }, { status: 400 });
    }

    if (accountId && !studentId) {
        if (accountId === actorUserId) {
            return NextResponse.json({ success: false, error: "The current admin account cannot be deactivated here." }, { status: 400 });
        }

        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", accountId)
            .maybeSingle();

        if (profileError) throw new Error(profileError.message);
        if (isProtectedProfile(profile as ProfileRow | null)) {
            return NextResponse.json({ success: false, error: "Teacher and admin accounts are protected." }, { status: 400 });
        }

        const { error } = await admin
            .from("profiles")
            .update({ approval_status: "deactivated", updated_at: new Date().toISOString() })
            .eq("id", accountId);

        if (error) throw new Error(error.message);

        return NextResponse.json(await loadStudentAccounts(admin), {
            headers: { "Cache-Control": "no-store" },
        });
    }

    const { data: student, error: studentError } = await admin
        .from("students")
        .select(STUDENT_COLUMNS)
        .eq("id", studentId)
        .maybeSingle();

    if (studentError) throw new Error(studentError.message);
    if (!student) {
        return NextResponse.json({ success: false, error: "Student was not found." }, { status: 404 });
    }

    const row = student as StudentRow;
    const authUserId = row.auth_user_id;

    if (authUserId) {
        if (authUserId === actorUserId) {
            return NextResponse.json({ success: false, error: "The current admin account cannot be deactivated here." }, { status: 400 });
        }

        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", authUserId)
            .maybeSingle();

        if (profileError) throw new Error(profileError.message);
        if (isProtectedProfile(profile as ProfileRow | null)) {
            return NextResponse.json({ success: false, error: "Teacher and admin accounts are protected." }, { status: 400 });
        }

        const { error: profileUpdateError } = await admin
            .from("profiles")
            .update({ approval_status: "deactivated", updated_at: new Date().toISOString() })
            .eq("id", authUserId);

        if (profileUpdateError) throw new Error(profileUpdateError.message);

        await admin
            .from("study_progress")
            .delete()
            .eq("user_id", authUserId)
            .eq("course_id", "__parent_pin__");
    }

    const { error: studentUpdateError } = await admin
        .from("students")
        .update({
            auth_user_id: null,
            pin: null,
            status: "deactivated",
            updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

    if (studentUpdateError) throw new Error(studentUpdateError.message);

    return NextResponse.json(await loadStudentAccounts(admin), {
        headers: { "Cache-Control": "no-store" },
    });
}

export async function GET() {
    try {
        const auth = await requireTeacher();
        if (!auth.ok) return auth.response;

        const admin = createAdminClient();
        if (!admin) {
            return proxyStudentAccountsToRpc("studentAccountsList");
        }

        return NextResponse.json(await loadStudentAccounts(admin), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to load student accounts." },
            { status: 500 },
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireTeacher();
        if (!auth.ok) return auth.response;

        const body = await request.json().catch(() => ({}));
        const admin = createAdminClient();
        if (admin) return updateStatusWithAdmin(admin, body);

        return proxyStudentAccountsToRpc("studentAccountStatus", body);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to update student account status." },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireTeacher();
        if (!auth.ok) return auth.response;

        const body = await request.json().catch(() => ({}));
        const admin = createAdminClient();
        if (admin) return deactivateAccountWithAdmin(admin, auth.userId, body);

        return proxyStudentAccountsToRpc("studentAccountDelete", body);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to deactivate student account." },
            { status: 500 },
        );
    }
}
