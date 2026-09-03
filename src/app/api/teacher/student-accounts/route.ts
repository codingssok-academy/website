import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { buildStudentAuthPassword } from "@/lib/auth-bridge";
import {
    issueHashedStudentAccessCode,
    loadHashedStudentAccessCodeStatuses,
    revokeHashedStudentAccessCode,
    usesHashedStudentAccessCodes,
} from "@/lib/student-access-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentRow = {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
    class: string | null;
    pin: string | null;
    login_pin: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    auth_user_id: string | null;
    profile_id?: string | null;
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

const STUDENT_COLUMNS = "id,name,school,grade,class,pin,login_pin,status,created_at,updated_at,auth_user_id";
const HASHED_STUDENT_COLUMNS = "id,name,school,grade,class,status,created_at,updated_at,auth_user_id,profile_id";
const PROFILE_COLUMNS = "id,email,role,name,display_name,approval_status";
const MUTABLE_STATUSES = new Set(["pending", "approved", "deactivated", "rejected"]);
const ACTIVE_STUDENT_NAMES = new Set([
    "탁규원",
    "김무성",
    "김주찬",
    "전예준",
    "윤유림",
    "김성윤",
    "한효제",
    "박하준",
    "이현구",
    "오서영",
    "민다온",
    "김우현",
    "박리현",
    "강지호",
    "김은별",
    "노현승",
    "김주원",
    "석정현",
    "유시호",
    "한보윤",
    "한보리",
    "김기석",
    "박지용",
    "임하준",
    "이다연",
    "길태웅",
    "하우빈",
    "김영호",
    "박도현",
    "서민호",
    "이세라",
    "엄찬유",
    "김윤호",
    "변승완",
    "김태현",
    "김민준",
    "조예준",
    "이시아",
]);

function normalizeStatus(input: unknown) {
    return typeof input === "string" ? input.trim() : "";
}

function normalizeId(input: unknown) {
    return typeof input === "string" ? input.trim() : "";
}

function normalizeOptionalText(input: unknown, maxLength: number) {
    return typeof input === "string" ? input.trim().slice(0, maxLength) : "";
}

function normalizeLoginPin(input: unknown) {
    return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 4) : "";
}

function normalizeStudentName(input: unknown) {
    return typeof input === "string" ? input.replace(/\s+/g, "").trim() : "";
}

function isProtectedProfile(profile: ProfileRow | null | undefined) {
    return profile?.role === "teacher" || profile?.role === "admin";
}

function readableProfileName(profile: ProfileRow, authUser: AuthUserSummary | null) {
    const candidate = [profile.display_name, profile.name]
        .map(value => String(value || "").trim())
        .find(value => value && !/^\?+$/.test(value));
    if (candidate) return candidate;

    const email = authUser?.email || profile.email || "";
    if (/^student_[a-f0-9-]+@codingssok\.local$/i.test(email)) return "연결 안 된 계정";
    return email || "연결 안 된 계정";
}

async function deactivateProfile(admin: NonNullable<ReturnType<typeof createAdminClient>>, accountId: string) {
    const timestamp = new Date().toISOString();
    const { error } = await admin
        .from("profiles")
        .update({ approval_status: "rejected", updated_at: timestamp })
        .eq("id", accountId);

    if (!error) return;

    const message = error.message || "";
    if (!message.includes("updated_at")) throw new Error(message);

    const fallback = await admin
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("id", accountId);

    if (fallback.error) throw new Error(fallback.error.message);
}

async function clearParentLoginBridge(admin: NonNullable<ReturnType<typeof createAdminClient>>, accountId: string) {
    try {
        await admin
            .from("study_progress")
            .delete()
            .eq("user_id", accountId)
            .eq("course_id", "__parent_pin__");
    } catch {
        // Login account unlinking must not fail just because the optional bridge table is unavailable.
    }
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
    const hashedMode = usesHashedStudentAccessCodes();
    const [studentsRes, profilesRes, accessCodeStatuses] = await Promise.all([
        admin.from("students").select(hashedMode ? HASHED_STUDENT_COLUMNS : STUDENT_COLUMNS).order("name", { ascending: true }),
        admin.from("profiles").select(PROFILE_COLUMNS),
        hashedMode ? loadHashedStudentAccessCodeStatuses(admin) : Promise.resolve([]),
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
    const accessStatusByStudentId = new Map(accessCodeStatuses.map(status => [status.studentId, status]));
    const linkedProfileIds = new Set<string>();

    const allStudentAccounts = ((studentsRes.data || []) as unknown as StudentRow[])
        .filter(student => student.class !== "admin")
        .map(student => {
            const profile = student.auth_user_id ? profiles.get(student.auth_user_id) || null : null;
            const authUser = student.auth_user_id ? authUsers.get(student.auth_user_id) || null : null;
            if (student.auth_user_id) linkedProfileIds.add(student.auth_user_id);
            const isActiveRoster = ACTIVE_STUDENT_NAMES.has(normalizeStudentName(student.name));
            const deleteRecommended = !hashedMode
                && !isActiveRoster
                && Boolean(student.auth_user_id && !isProtectedProfile(profile));
            const accessStatus = accessStatusByStudentId.get(student.id);

            return {
                id: student.id,
                source: "student" as const,
                name: student.name,
                school: student.school,
                grade: student.grade,
                className: student.class,
                status: student.status || "approved",
                canChangeStatus: true,
                pinIssued: hashedMode ? accessStatus?.parentAccessIssued === true : /^\d{5}$/.test(student.pin || ""),
                loginPin: !hashedMode && student.auth_user_id && /^\d{4}$/.test(student.login_pin || "") ? student.login_pin : null,
                loginPinIssued: hashedMode ? accessStatus?.studentLoginIssued === true : /^\d{4}$/.test(student.login_pin || ""),
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
                deleteRecommended,
                recommendationReason: deleteRecommended ? "운영 38명 명단 기준 밖 회원가입 계정" : null,
            };
        });

    const studentAccounts = hashedMode
        ? allStudentAccounts
        : allStudentAccounts.filter(student => {
            if (ACTIVE_STUDENT_NAMES.has(normalizeStudentName(student.name))) {
                return student.status !== "deactivated";
            }
            return student.deleteRecommended;
        });

    const orphanAccounts = (profilesRes.data || [])
        .map(profile => profile as ProfileRow)
        .filter(profile => {
            if (profile.role !== "student" || linkedProfileIds.has(profile.id)) return false;
            if (profile.approval_status === "deactivated" || profile.approval_status === "rejected") return false;
            return authUsers.size > 0 ? authUsers.has(profile.id) : true;
        })
        .map(profile => {
            const authUser = authUsers.get(profile.id) || null;
            return {
                id: profile.id,
                source: "orphan" as const,
                name: readableProfileName(profile, authUser),
                school: null,
                grade: null,
                className: "Unlinked account",
                status: profile.approval_status || "orphan",
                canChangeStatus: false,
                pinIssued: false,
                loginPin: null,
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
                deleteRecommended: true,
                recommendationReason: "학생 목록과 연결되지 않은 회원가입 계정",
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    const students = [...studentAccounts, ...orphanAccounts];
    const activeRosterAccounts = hashedMode
        ? studentAccounts
        : studentAccounts.filter(student => ACTIVE_STUDENT_NAMES.has(normalizeStudentName(student.name)));
    const stats = {
        total: activeRosterAccounts.length,
        linked: activeRosterAccounts.filter(student => student.accountLinked).length,
        unlinked: activeRosterAccounts.filter(student => !student.accountLinked).length,
        approved: activeRosterAccounts.filter(student => student.status === "approved" || student.status === "active").length,
        deactivated: activeRosterAccounts.filter(student => student.status === "deactivated").length,
        pending: activeRosterAccounts.filter(student => student.status === "pending").length,
        orphan: orphanAccounts.length,
        deleteRecommended: students.filter(student => student.deleteRecommended).length,
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
    const requestedStatus = normalizeStatus(body?.status);
    const status = usesHashedStudentAccessCodes() && requestedStatus === "approved"
        ? "active"
        : requestedStatus;
    const allowedStatuses = usesHashedStudentAccessCodes()
        ? new Set(["pending", "active", "deactivated"])
        : MUTABLE_STATUSES;

    if (!studentId || !allowedStatuses.has(status)) {
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

async function updateStudentInfoWithAdmin(admin: NonNullable<ReturnType<typeof createAdminClient>>, body: Record<string, unknown>) {
    const studentId = normalizeId(body?.studentId);
    const school = normalizeOptionalText(body?.school, 40);
    const grade = normalizeOptionalText(body?.grade, 20);

    if (!studentId) {
        return NextResponse.json(
            { success: false, error: "Student id is required." },
            { status: 400 },
        );
    }

    const { error } = await admin
        .from("students")
        .update({
            school: school || null,
            grade: grade || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", studentId);

    if (error) throw new Error(error.message);

    return NextResponse.json(await loadStudentAccounts(admin), {
        headers: { "Cache-Control": "no-store" },
    });
}

async function updateStudentLoginPinWithAdmin(admin: NonNullable<ReturnType<typeof createAdminClient>>, body: Record<string, unknown>) {
    const studentId = normalizeId(body?.studentId);
    const loginPin = normalizeLoginPin(body?.loginPin);

    if (!studentId || !/^\d{4}$/.test(loginPin)) {
        return NextResponse.json(
            { success: false, error: "Student id and 4-digit login password are required." },
            { status: 400 },
        );
    }

    const hashedMode = usesHashedStudentAccessCodes();
    const { data: student, error: studentError } = await admin
        .from("students")
        .select(hashedMode ? HASHED_STUDENT_COLUMNS : STUDENT_COLUMNS)
        .eq("id", studentId)
        .maybeSingle();

    if (studentError) throw new Error(studentError.message);
    if (!student) {
        return NextResponse.json({ success: false, error: "Student was not found." }, { status: 404 });
    }

    const row = student as unknown as StudentRow;
    if (!row.auth_user_id) {
        return NextResponse.json(
            { success: false, error: "Only registered student accounts can have a login password." },
            { status: 400 },
        );
    }

    const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", row.auth_user_id)
        .maybeSingle();

    if (profileError) throw new Error(profileError.message);
    if (isProtectedProfile(profile as ProfileRow | null)) {
        return NextResponse.json({ success: false, error: "Teacher and admin accounts are protected." }, { status: 400 });
    }

    if (hashedMode) {
        await issueHashedStudentAccessCode(admin, {
            studentId: row.id,
            purpose: "student_login",
            code: loginPin,
        });
    }

    const { error: authError } = await admin.auth.admin.updateUserById(row.auth_user_id, {
        password: buildStudentAuthPassword(row.id, loginPin),
    });

    if (authError) {
        if (hashedMode) {
            await revokeHashedStudentAccessCode(admin, {
                studentId: row.id,
                purpose: "student_login",
            });
        }
        throw new Error(authError.message);
    }

    if (!hashedMode) {
        const { error: updateError } = await admin
            .from("students")
            .update({
                login_pin: loginPin,
                updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);

        if (updateError) throw new Error(updateError.message);
    }

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

        await deactivateProfile(admin, accountId);

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

    const row = student as unknown as StudentRow;
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

        await deactivateProfile(admin, authUserId);
        await clearParentLoginBridge(admin, authUserId);
        if (usesHashedStudentAccessCodes()) {
            await revokeHashedStudentAccessCode(admin, {
                studentId: row.id,
                purpose: "student_login",
            });
        }
    }

    const { error: studentUpdateError } = await admin
        .from("students")
        .update(usesHashedStudentAccessCodes()
            ? { auth_user_id: null, profile_id: null, updated_at: new Date().toISOString() }
            : { auth_user_id: null, updated_at: new Date().toISOString() })
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
        const action = typeof body?.action === "string" ? body.action : "";
        const admin = createAdminClient();
        if (admin) {
            if (action === "studentInfo") return updateStudentInfoWithAdmin(admin, body);
            if (action === "studentLoginPin") return updateStudentLoginPinWithAdmin(admin, body);
            return updateStatusWithAdmin(admin, body);
        }

        if (action === "studentLoginPin") {
            return NextResponse.json(
                { success: false, error: "Server admin credentials are required to reset a student login password." },
                { status: 503 },
            );
        }

        return proxyStudentAccountsToRpc(action === "studentInfo" ? "studentAccountInfo" : "studentAccountStatus", body);
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
