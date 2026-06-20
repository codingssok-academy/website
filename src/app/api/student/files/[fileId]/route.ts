import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth-teacher";
import { STUDENT_FILES_BUCKET, type StudentFileRow } from "@/lib/student-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccessResult =
    | { ok: true; role: "student" | "teacher" | "admin" }
    | { ok: false; response: NextResponse };

async function loadFile(admin: NonNullable<ReturnType<typeof createAdminClient>>, fileId: string) {
    const { data, error } = await admin
        .from("student_files")
        .select("id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at")
        .eq("id", fileId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data as StudentFileRow | null;
}

async function checkAccess(file: StudentFileRow, intent: "download" | "delete"): Promise<AccessResult> {
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

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ fileId: string }> },
) {
    try {
        const { fileId } = await params;
        if (!fileId) return NextResponse.json({ success: false, error: "파일 ID가 필요합니다." }, { status: 400 });

        const admin = createAdminClient();
        if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

        const file = await loadFile(admin, fileId);
        if (!file) return NextResponse.json({ success: false, error: "파일을 찾을 수 없습니다." }, { status: 404 });

        const access = await checkAccess(file, "download");
        if (!access.ok) return access.response;

        const { data, error } = await admin.storage
            .from(STUDENT_FILES_BUCKET)
            .createSignedUrl(file.storage_path, 60, { download: file.original_name });
        if (error || !data?.signedUrl) throw new Error(error?.message || "다운로드 링크를 만들지 못했습니다.");

        return NextResponse.redirect(data.signedUrl);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일 다운로드에 실패했습니다." },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ fileId: string }> },
) {
    try {
        const { fileId } = await params;
        if (!fileId) return NextResponse.json({ success: false, error: "파일 ID가 필요합니다." }, { status: 400 });

        const admin = createAdminClient();
        if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

        const file = await loadFile(admin, fileId);
        if (!file) return NextResponse.json({ success: true });

        const access = await checkAccess(file, "delete");
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
