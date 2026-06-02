import { NextRequest, NextResponse } from "next/server";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";
import { requireTeacher } from "@/lib/auth-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function readMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

function isAlreadyRegistered(message: string) {
    const text = message.toLowerCase();
    return text.includes("already") || text.includes("registered") || text.includes("exists");
}

export async function POST(request: NextRequest) {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json(
            { error: "Supabase service role environment is missing." },
            { status: 500 },
        );
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";

    if (!studentId) {
        return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    }

    const { data: student, error: studentError } = await admin
        .from("students")
        .select("id,name,pin,status,auth_user_id")
        .eq("id", studentId)
        .maybeSingle();

    if (studentError) {
        return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    if (!student) {
        return NextResponse.json({ error: "학생을 찾지 못했습니다." }, { status: 404 });
    }

    if (student.status === "deactivated") {
        return NextResponse.json({ error: "비활성화된 학생입니다." }, { status: 409 });
    }

    if (!student.pin) {
        return NextResponse.json({ error: "학생 PIN이 없어 계정 전환을 준비할 수 없습니다." }, { status: 409 });
    }

    const email = buildStudentAuthEmail(student.id);
    const password = buildStudentAuthPassword(student.id, student.pin);
    let authUserId = student.auth_user_id as string | null;

    if (authUserId) {
        const { error: updateAuthError } = await admin.auth.admin.updateUserById(authUserId, {
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: student.name,
                role: "student",
            },
        });

        if (updateAuthError) {
            authUserId = null;
        }
    }

    if (!authUserId) {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: student.name,
                role: "student",
            },
        });

        if (createError) {
            const message = readMessage(createError);
            if (!isAlreadyRegistered(message)) {
                return NextResponse.json({ error: message }, { status: 500 });
            }

            const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listError) {
                return NextResponse.json({ error: listError.message }, { status: 500 });
            }

            const existing = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
            if (!existing) {
                return NextResponse.json({ error: "이미 등록된 학생 Auth 계정을 찾지 못했습니다." }, { status: 500 });
            }

            authUserId = existing.id;
            const { error: updateExistingError } = await admin.auth.admin.updateUserById(authUserId, {
                password,
                user_metadata: {
                    name: student.name,
                    role: "student",
                },
            });
            if (updateExistingError) {
                return NextResponse.json({ error: updateExistingError.message }, { status: 500 });
            }
        } else {
            authUserId = created.user?.id ?? null;
        }
    }

    if (!authUserId) {
        return NextResponse.json({ error: "학생 Auth 계정을 준비하지 못했습니다." }, { status: 500 });
    }

    const now = new Date().toISOString();
    const { error: profileError } = await admin
        .from("profiles")
        .upsert({
            id: authUserId,
            name: student.name,
            email,
            display_name: student.name,
            role: "student",
            approval_status: "approved",
            updated_at: now,
        }, { onConflict: "id" });

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: syncStudentError } = await admin
        .from("students")
        .update({ auth_user_id: authUserId, updated_at: now })
        .eq("id", student.id);

    if (syncStudentError) {
        return NextResponse.json({ error: syncStudentError.message }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        studentId: student.id,
        authUserId,
        email,
        syncedAt: now,
    });
}
