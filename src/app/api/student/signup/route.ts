import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";
import { PIN_COURSE } from "@/lib/parent-auth";
import { findReferenceParentCode } from "@/lib/parent-code-reference";
import { callParentPortalEdge } from "@/lib/parent-edge";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type StudentRow = {
    id: string;
    name: string;
    school?: string | null;
    grade?: string | null;
    class?: string | null;
    avatar?: string | null;
    pin?: string | null;
    auth_user_id?: string | null;
    birthday?: string | null;
    status?: string | null;
};

type ProgressRow = {
    completed_units: string[] | null;
};

function normalizeName(input: unknown) {
    return typeof input === "string" ? input.trim().replace(/\s+/g, "") : "";
}

function getAccountRoleForName(name: string) {
    return normalizeName(name) === "장민" ? "admin" : "student";
}

function normalizeParentCode(input: unknown) {
    return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 5) : "";
}

function normalizeStudentPin(input: unknown) {
    return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 4) : "";
}

function normalizeOptionalText(input: unknown, maxLength: number) {
    return typeof input === "string" ? input.trim().slice(0, maxLength) : "";
}

function publicStudent(row: StudentRow) {
    return {
        id: row.id,
        name: row.name,
        school: row.school || null,
        grade: row.grade || null,
        avatar: row.avatar || null,
        auth_user_id: row.auth_user_id || null,
        status: row.status || null,
    };
}

async function findAuthUserByEmail(adminClient: AdminClient, email: string) {
    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error(error.message);
        const match = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
        if (match) return match;
        if (data.users.length < 1000) break;
    }
    return null;
}

function isMissingAuthUserError(error: { message?: string; status?: number } | null | undefined) {
    const message = (error?.message || "").toLowerCase();
    return error?.status === 404 || message.includes("not found") || message.includes("does not exist");
}

type StudentAuthPayload = {
    email: string;
    password: string;
    name: string;
    role: string;
};

async function createStudentAuthUser(adminClient: AdminClient, payload: StudentAuthPayload) {
    const { data, error } = await adminClient.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: { name: payload.name, role: payload.role },
        app_metadata: { role: payload.role },
    });
    if (error || !data.user) throw new Error(error?.message || "학생 인증 계정을 만들지 못했습니다.");
    return data.user.id;
}

async function updateStudentAuthUser(adminClient: AdminClient, authUserId: string, payload: StudentAuthPayload) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: { name: payload.name, role: payload.role },
        app_metadata: { role: payload.role },
    });
    return error || null;
}

async function resolveStudentAuthUser(input: {
    adminClient: AdminClient;
    studentAuthUserId?: string | null;
    payload: StudentAuthPayload;
}) {
    const existingUser = await findAuthUserByEmail(input.adminClient, input.payload.email);
    if (existingUser?.id) {
        const error = await updateStudentAuthUser(input.adminClient, existingUser.id, input.payload);
        if (error) throw new Error(error.message);
        return { authUserId: existingUser.id, created: false };
    }

    if (input.studentAuthUserId) {
        const error = await updateStudentAuthUser(input.adminClient, input.studentAuthUserId, input.payload);
        if (!error) return { authUserId: input.studentAuthUserId, created: false };
        if (!isMissingAuthUserError(error)) throw new Error(error.message);
    }

    const authUserId = await createStudentAuthUser(input.adminClient, input.payload);
    return { authUserId, created: true };
}

async function cleanupCreatedAuthUser(adminClient: AdminClient, authUserId: string) {
    try {
        await adminClient.auth.admin.deleteUser(authUserId);
    } catch {
        // Best-effort cleanup only. The original signup error is more important to return.
    }
}

async function resolveParentCode(input: {
    adminClient: AdminClient;
    student: StudentRow | null;
    name: string;
}) {
    const reference = findReferenceParentCode(input.name);
    const studentPin = normalizeParentCode(input.student?.pin || "");
    if (studentPin) return { code: studentPin, source: "students", reference };

    const authUserId = input.student?.auth_user_id || null;
    if (authUserId) {
        const { data, error } = await input.adminClient
            .from("study_progress")
            .select("completed_units")
            .eq("user_id", authUserId)
            .eq("course_id", PIN_COURSE)
            .maybeSingle();
        if (error) throw new Error(error.message);
        const progress = data as ProgressRow | null;
        const progressPin = normalizeParentCode(progress?.completed_units?.[0] || "");
        if (progressPin) return { code: progressPin, source: "study_progress", reference };
    }

    if (input.student) {
        return { code: "", source: "", reference };
    }

    return { code: reference?.code || "", source: reference ? "reference" : "", reference };
}

async function syncParentCode(input: {
    adminClient: AdminClient;
    userId: string;
    code: string;
}) {
    const { error } = await input.adminClient.from("study_progress").upsert(
        {
            user_id: input.userId,
            course_id: PIN_COURSE,
            completed_units: [input.code],
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" },
    );
    if (error) throw new Error(error.message);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const name = normalizeName(body?.name);
        const parentCode = normalizeParentCode(body?.parentCode);
        const pin = normalizeStudentPin(body?.pin);
        const school = normalizeOptionalText(body?.school, 40);
        const grade = normalizeOptionalText(body?.grade, 20);

        if (name.length < 2 || name.length > 20) {
            return NextResponse.json({ success: false, error: "학생 이름을 확인해주세요." }, { status: 400 });
        }
        if (!/^\d{5}$/.test(parentCode)) {
            return NextResponse.json({ success: false, error: "학부모 인증번호 5자리를 입력해주세요." }, { status: 400 });
        }
        if (!/^\d{4}$/.test(pin)) {
            return NextResponse.json({ success: false, error: "로그인에 사용할 비밀번호 4자리를 입력해주세요." }, { status: 400 });
        }

        const adminClient = createAdminClient();
        if (!adminClient) {
            const edge = await callParentPortalEdge<{
                success: boolean;
                student?: ReturnType<typeof publicStudent>;
                message?: string;
                error?: string;
            }>("studentSignup", { name, parentCode, pin, school, grade });
            if (!edge.ok) {
                return NextResponse.json(
                    { success: false, error: edge.error },
                    { status: edge.status || 503 },
                );
            }
            return NextResponse.json(edge.data);
        }

        const { data: studentRowsData, error: studentError } = await adminClient
            .from("students")
            .select("id, name, school, grade, class, avatar, pin, auth_user_id, birthday, status")
            .eq("name", name)
            .limit(10);
        if (studentError) throw new Error(studentError.message);

        const studentRows = (studentRowsData || []) as StudentRow[];
        let student = studentRows.find(row => normalizeParentCode(row.pin || "") === parentCode) || null;
        if (!student && studentRows.length === 1) student = studentRows[0];
        if (!student && studentRows.length > 1) {
            return NextResponse.json(
                { success: false, error: "동명이인 학생이 있습니다. 학생 이름과 학부모 인증번호를 다시 확인해주세요." },
                { status: 401 },
            );
        }
        const codeCheck = await resolveParentCode({ adminClient, student, name });
        if (!codeCheck.code || codeCheck.code !== parentCode) {
            return NextResponse.json(
                { success: false, error: "학생 이름 또는 학부모 인증번호가 맞지 않습니다." },
                { status: 401 },
            );
        }
        if (student?.status === "deactivated") {
            return NextResponse.json(
                { success: false, error: "비활성화된 학생입니다. 선생님에게 문의해주세요." },
                { status: 403 },
            );
        }

        if (!student) {
            const { data: inserted, error: insertError } = await adminClient
                .from("students")
                .insert({
                    name,
                    birthday: "2000-01-01",
                    school: school || null,
                    grade: grade || null,
                    class: codeCheck.reference?.className || null,
                    avatar: null,
                    pin: parentCode,
                    login_pin: pin,
                    status: "approved",
                })
                .select("id, name, school, grade, class, avatar, pin, auth_user_id, birthday, status")
                .single();
            if (insertError || !inserted) throw new Error(insertError?.message || "학생 정보를 만들지 못했습니다.");
            student = inserted as StudentRow;
        }

        const email = buildStudentAuthEmail(student.id);
        const password = buildStudentAuthPassword(student.id, pin);
        const accountRole = getAccountRoleForName(name);
        const authPayload = { email, password, name, role: accountRole };
        const authResult = await resolveStudentAuthUser({
            adminClient,
            studentAuthUserId: student.auth_user_id,
            payload: authPayload,
        });
        const authUserId = authResult.authUserId;

        try {
            const { error: profileError } = await adminClient
                .from("profiles")
                .upsert(
                    {
                        id: authUserId,
                        email,
                        name,
                        display_name: name,
                        role: accountRole,
                        approval_status: "approved",
                        birth_date: student.birthday || null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "id" },
                );
            if (profileError) throw new Error(profileError.message);

            const { data: updated, error: updateError } = await adminClient
                .from("students")
                .update({
                    auth_user_id: authUserId,
                    pin: parentCode,
                    login_pin: pin,
                    school: school || student.school || null,
                    grade: grade || student.grade || null,
                    class: student.class || codeCheck.reference?.className || null,
                    status: student.status || "approved",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", student.id)
                .select("id, name, school, grade, class, avatar, pin, auth_user_id, birthday, status")
                .single();
            if (updateError || !updated) throw new Error(updateError?.message || "학생 계정을 연결하지 못했습니다.");

            await syncParentCode({ adminClient, userId: authUserId, code: parentCode });

            return NextResponse.json({
                success: true,
                student: publicStudent(updated as StudentRow),
                message: "회원가입이 완료되었습니다.",
            });
        } catch (error) {
            if (authResult.created) await cleanupCreatedAuthUser(adminClient, authUserId);
            throw error;
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다." },
            { status: 500 },
        );
    }
}
