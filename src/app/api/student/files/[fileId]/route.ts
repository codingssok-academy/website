import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth-teacher";
import { canParentSessionReadStudent } from "@/lib/parent-session-access";
import { PARENT_SESSION_COOKIE, verifyParentSessionToken } from "@/lib/parent-session";
import { usesHashedStudentAccessCodes } from "@/lib/student-access-codes";
import { getStudentFilePreviewKind, STUDENT_FILES_BUCKET, type StudentFileRow } from "@/lib/student-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccessResult =
    | { ok: true; role: "student" | "parent" | "teacher" | "admin" }
    | { ok: false; response: NextResponse };

async function loadFile(admin: NonNullable<ReturnType<typeof createAdminClient>>, fileId: string) {
    const columns = usesHashedStudentAccessCodes()
        ? "id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,visibility,created_at"
        : "id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at";
    const { data, error } = await admin
        .from("student_files")
        .select(columns)
        .eq("id", fileId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data as StudentFileRow | null;
}

async function checkLegacyAccess(file: StudentFileRow, intent: "download" | "delete"): Promise<AccessResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const admin = createAdminClient();
        if (admin) {
            const { data: student } = await admin
                .from("students")
                .select("id,status")
                .eq("auth_user_id", user.id)
                .maybeSingle();
            if (student?.id === file.student_id && student.status !== "deactivated") {
                if (intent === "delete" && file.uploaded_by_role !== "student") {
                    return {
                        ok: false,
                        response: NextResponse.json({ success: false, error: "선생님이 올린 파일은 학생이 삭제할 수 없습니다." }, { status: 403 }),
                    };
                }
                return { ok: true, role: "student" };
            }
        }
    }

    const teacher = await requireTeacher();
    if (teacher.ok) return { ok: true, role: teacher.role === "admin" ? "admin" : "teacher" };
    return teacher;
}

async function checkFreshAccess(
    request: NextRequest,
    file: StudentFileRow,
    intent: "download" | "delete",
    admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<AccessResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const { data: allowed, error: permissionError } = await supabase.rpc(
            "codingssok_can_read_student_file",
            { p_file_id: file.id },
        );
        if (permissionError) {
            return {
                ok: false,
                response: NextResponse.json(
                    { success: false, error: "파일 권한을 확인하지 못했습니다." },
                    { status: 503 },
                ),
            };
        }

        if (allowed === true) {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role,approval_status")
                .eq("id", user.id)
                .maybeSingle();
            if (profileError) {
                return {
                    ok: false,
                    response: NextResponse.json(
                        { success: false, error: "계정 권한을 확인하지 못했습니다." },
                        { status: 503 },
                    ),
                };
            }

            if (profile?.approval_status === "approved") {
                const role = profile.role;
                if (
                    intent === "download"
                    && (role === "student" || role === "parent" || role === "teacher" || role === "admin")
                ) {
                    return { ok: true, role };
                }
                if (intent === "delete" && (role === "teacher" || role === "admin")) {
                    return { ok: true, role };
                }
                if (
                    intent === "delete"
                    && role === "student"
                    && file.owner_auth_user_id === user.id
                    && file.uploaded_by_role === "student"
                ) {
                    return { ok: true, role: "student" };
                }
            }
        }
    }

    if (intent === "download" && file.visibility === "student_parent") {
        const token = request.cookies.get(PARENT_SESSION_COOKIE)?.value;
        const session = verifyParentSessionToken(token);
        const allowedStudentIds = new Set([
            session?.studentId,
            ...(session?.studentIds || []),
        ].filter((id): id is string => Boolean(id)));

        if (session && allowedStudentIds.has(file.student_id)) {
            const { data: student, error: studentError } = await admin
                .from("students")
                .select("id,name,status")
                .eq("id", file.student_id)
                .maybeSingle();
            if (studentError) {
                return {
                    ok: false,
                    response: NextResponse.json(
                        { success: false, error: "학생 정보를 확인하지 못했습니다." },
                        { status: 503 },
                    ),
                };
            }

            if (
                student?.status === "active"
                && await canParentSessionReadStudent(admin, session, student.name)
            ) {
                return { ok: true, role: "parent" };
            }
        }
    }

    return {
        ok: false,
        response: NextResponse.json({ success: false, error: "파일 접근 권한이 없습니다." }, { status: 403 }),
    };
}

async function checkAccess(
    request: NextRequest,
    file: StudentFileRow,
    intent: "download" | "delete",
    admin: NonNullable<ReturnType<typeof createAdminClient>>,
) {
    return usesHashedStudentAccessCodes()
        ? checkFreshAccess(request, file, intent, admin)
        : checkLegacyAccess(file, intent);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> },
) {
    try {
        const { fileId } = await params;
        if (!fileId) return NextResponse.json({ success: false, error: "파일 ID가 필요합니다." }, { status: 400 });
        const mode = request.nextUrl.searchParams.get("mode") || "download";
        if (mode !== "download" && mode !== "preview") {
            return NextResponse.json({ success: false, error: "지원하지 않는 파일 열기 방식입니다." }, { status: 400 });
        }

        const admin = createAdminClient();
        if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

        const file = await loadFile(admin, fileId);
        if (!file) return NextResponse.json({ success: false, error: "파일을 찾을 수 없습니다." }, { status: 404 });

        const access = await checkAccess(request, file, "download", admin);
        if (!access.ok) return access.response;

        if (mode === "preview" && !getStudentFilePreviewKind(file.original_name, file.mime_type)) {
            return NextResponse.json(
                { success: false, error: "이 파일은 안전한 미리보기를 지원하지 않습니다. 다운로드를 이용해주세요." },
                { status: 400 },
            );
        }

        const storage = admin.storage.from(STUDENT_FILES_BUCKET);
        const { data, error } = await storage.createSignedUrl(file.storage_path, 60);
        if (error || !data?.signedUrl) throw new Error(error?.message || "다운로드 링크를 만들지 못했습니다.");

        if (mode === "preview") return NextResponse.redirect(data.signedUrl);

        // Add the filename after signing: the SDK download option encodes it twice.
        // Do not decode the signed path or token; encode only this query value once.
        const downloadUrl = new URL(data.signedUrl);
        downloadUrl.searchParams.set("download", file.original_name);
        return NextResponse.redirect(downloadUrl);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일 다운로드에 실패했습니다." },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> },
) {
    try {
        const { fileId } = await params;
        if (!fileId) return NextResponse.json({ success: false, error: "파일 ID가 필요합니다." }, { status: 400 });

        const admin = createAdminClient();
        if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

        const file = await loadFile(admin, fileId);
        if (!file) return NextResponse.json({ success: true });

        const access = await checkAccess(request, file, "delete", admin);
        if (!access.ok) return access.response;

        const storage = await admin.storage.from(STUDENT_FILES_BUCKET).remove([file.storage_path]);
        if (storage.error) throw new Error(storage.error.message);

        const { error } = await admin.from("student_files").delete().eq("id", file.id);
        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일 삭제에 실패했습니다." },
            { status: 500 },
        );
    }
}
