import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
};

type AuthUserSummary = {
    id: string;
    email: string | undefined;
    created_at: string | undefined;
    last_sign_in_at: string | undefined;
};

const STUDENT_COLUMNS = "id,name,grade,class,pin,status,created_at,updated_at,auth_user_id";
const PROFILE_COLUMNS = "id,email,role,name,display_name";
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
    const [studentsRes, profilesRes, authUsers] = await Promise.all([
        admin.from("students").select(STUDENT_COLUMNS).order("name", { ascending: true }),
        admin.from("profiles").select(PROFILE_COLUMNS),
        listAuthUsers(admin),
    ]);

    if (studentsRes.error) throw new Error(studentsRes.error.message);
    if (profilesRes.error) throw new Error(profilesRes.error.message);

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
        .filter(profile => profile.role === "student" && !linkedProfileIds.has(profile.id) && authUsers.has(profile.id))
        .map(profile => {
            const authUser = authUsers.get(profile.id) || null;
            return {
                id: profile.id,
                source: "orphan" as const,
                name: profile.display_name || profile.name || authUser?.email || profile.email || "미연결 계정",
                grade: null,
                className: "미연결 계정",
                status: "orphan",
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
                canDeleteAccount: true,
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

    return { success: true, students, stats };
}

export async function GET() {
    try {
        const auth = await requireTeacher();
        if (!auth.ok) return auth.response;

        const admin = createAdminClient();
        if (!admin) {
            return NextResponse.json(
                { success: false, error: "SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다." },
                { status: 500 },
            );
        }

        return NextResponse.json(await loadStudentAccounts(admin), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "학생 계정 목록을 불러오지 못했습니다." },
            { status: 500 },
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireTeacher();
        if (!auth.ok) return auth.response;

        const admin = createAdminClient();
        if (!admin) {
            return NextResponse.json(
                { success: false, error: "SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다." },
                { status: 500 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const studentId = normalizeId(body?.studentId);
        const status = normalizeStatus(body?.status);

        if (!studentId || !MUTABLE_STATUSES.has(status)) {
            return NextResponse.json(
                { success: false, error: "학생 ID와 변경할 상태를 확인해주세요." },
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
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "학생 상태를 변경하지 못했습니다." },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireTeacher();
        if (!auth.ok) return auth.response;

        const admin = createAdminClient();
        if (!admin) {
            return NextResponse.json(
                { success: false, error: "SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다." },
                { status: 500 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const studentId = normalizeId(body?.studentId);
        const accountId = normalizeId(body?.accountId);

        if (!studentId && !accountId) {
            return NextResponse.json({ success: false, error: "학생 ID 또는 계정 ID가 필요합니다." }, { status: 400 });
        }

        if (accountId && !studentId) {
            if (accountId === auth.userId) {
                return NextResponse.json(
                    { success: false, error: "현재 로그인한 관리자 계정은 삭제할 수 없습니다." },
                    { status: 400 },
                );
            }

            const { data: profile, error: profileError } = await admin
                .from("profiles")
                .select(PROFILE_COLUMNS)
                .eq("id", accountId)
                .maybeSingle();

            if (profileError) throw new Error(profileError.message);
            if (isProtectedProfile(profile as ProfileRow | null)) {
                return NextResponse.json(
                    { success: false, error: "관리자/선생님 계정은 학생 계정 화면에서 삭제할 수 없습니다." },
                    { status: 400 },
                );
            }

            const { data: linkedStudent, error: linkedStudentError } = await admin
                .from("students")
                .select("id")
                .eq("auth_user_id", accountId)
                .maybeSingle();

            if (linkedStudentError) throw new Error(linkedStudentError.message);
            if (linkedStudent) {
                return NextResponse.json(
                    { success: false, error: "학생 목록에 연결된 계정은 학생 row에서 삭제해주세요." },
                    { status: 400 },
                );
            }

            const { error: deleteAuthError } = await admin.auth.admin.deleteUser(accountId);
            if (deleteAuthError) throw new Error(deleteAuthError.message);

            await admin.from("profiles").delete().eq("id", accountId);

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
            return NextResponse.json({ success: false, error: "학생을 찾을 수 없습니다." }, { status: 404 });
        }

        const row = student as StudentRow;
        const authUserId = row.auth_user_id;

        if (!authUserId) {
            return NextResponse.json(await loadStudentAccounts(admin), {
                headers: { "Cache-Control": "no-store" },
            });
        }

        if (authUserId === auth.userId) {
            return NextResponse.json(
                { success: false, error: "현재 로그인한 관리자 계정은 삭제할 수 없습니다." },
                { status: 400 },
            );
        }

        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", authUserId)
            .maybeSingle();

        if (profileError) throw new Error(profileError.message);
        if (isProtectedProfile(profile as ProfileRow | null)) {
            return NextResponse.json(
                { success: false, error: "관리자/선생님 계정은 학생 계정 화면에서 삭제할 수 없습니다." },
                { status: 400 },
            );
        }

        const now = new Date().toISOString();
        const { error: detachError } = await admin
            .from("students")
            .update({ auth_user_id: null, updated_at: now })
            .eq("id", row.id);

        if (detachError) throw new Error(detachError.message);

        const { error: deleteAuthError } = await admin.auth.admin.deleteUser(authUserId);
        if (deleteAuthError) {
            await admin.from("students").update({ auth_user_id: authUserId, updated_at: now }).eq("id", row.id);
            throw new Error(deleteAuthError.message);
        }

        await admin.from("profiles").delete().eq("id", authUserId);

        return NextResponse.json(await loadStudentAccounts(admin), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "학생 가입 계정을 삭제하지 못했습니다." },
            { status: 500 },
        );
    }
}
