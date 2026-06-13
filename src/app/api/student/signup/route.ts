import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";
import { PIN_COURSE } from "@/lib/parent-auth";
import { findReferenceParentCode } from "@/lib/parent-code-reference";
import { callParentPortalEdge } from "@/lib/parent-edge";

type StudentRow = {
    id: string;
    name: string;
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

function normalizeParentCode(input: unknown) {
    return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 5) : "";
}

function normalizeStudentPin(input: unknown) {
    return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 4) : "";
}

function publicStudent(row: StudentRow) {
    return {
        id: row.id,
        name: row.name,
        grade: row.grade || null,
        avatar: row.avatar || null,
        auth_user_id: row.auth_user_id || null,
        status: row.status || null,
    };
}

async function findAuthUserByEmail(
    adminClient: NonNullable<ReturnType<typeof createAdminClient>>,
    email: string,
) {
    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error(error.message);
        const match = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
        if (match) return match;
        if (data.users.length < 1000) break;
    }
    return null;
}

async function resolveParentCode(input: {
    adminClient: NonNullable<ReturnType<typeof createAdminClient>>;
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
    adminClient: NonNullable<ReturnType<typeof createAdminClient>>;
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
            }>("studentSignup", { name, parentCode, pin });
            if (!edge.ok) {
                return NextResponse.json(
                    { success: false, error: edge.error },
                    { status: edge.status || 503 },
                );
            }
            return NextResponse.json(edge.data);
        }

        const { data: studentData, error: studentError } = await adminClient
            .from("students")
            .select("id, name, grade, class, avatar, pin, auth_user_id, birthday, status")
            .eq("name", name)
            .maybeSingle();
        if (studentError) throw new Error(studentError.message);

        let student = (studentData as StudentRow | null) || null;
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
                    grade: null,
                    class: codeCheck.reference?.className || null,
                    avatar: null,
                    pin: parentCode,
                })
                .select("id, name, grade, class, avatar, pin, auth_user_id, birthday, status")
                .single();
            if (insertError || !inserted) throw new Error(insertError?.message || "학생 정보를 만들지 못했습니다.");
            student = inserted as StudentRow;
        }

        const email = buildStudentAuthEmail(student.id);
        const password = buildStudentAuthPassword(student.id, pin);
        const existingUser = await findAuthUserByEmail(adminClient, email);
        let authUserId = existingUser?.id || student.auth_user_id || "";

        if (authUserId) {
            const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role: "student" },
                app_metadata: { role: "student" },
            });
            if (error) throw new Error(error.message);
        } else {
            const { data, error } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role: "student" },
                app_metadata: { role: "student" },
            });
            if (error || !data.user) throw new Error(error?.message || "학생 인증 계정을 만들지 못했습니다.");
            authUserId = data.user.id;
        }

        await adminClient
            .from("profiles")
            .upsert(
                {
                    id: authUserId,
                    email,
                    name,
                    display_name: name,
                    role: "student",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" },
            );

        const { data: updated, error: updateError } = await adminClient
            .from("students")
            .update({
                auth_user_id: authUserId,
                pin: parentCode,
                class: student.class || codeCheck.reference?.className || null,
            })
            .eq("id", student.id)
            .select("id, name, grade, class, avatar, pin, auth_user_id, birthday, status")
            .single();
        if (updateError || !updated) throw new Error(updateError?.message || "학생 계정을 연결하지 못했습니다.");

        await syncParentCode({ adminClient, userId: authUserId, code: parentCode });

        return NextResponse.json({
            success: true,
            student: publicStudent(updated as StudentRow),
            message: "회원가입이 완료되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다." },
            { status: 500 },
        );
    }
}
