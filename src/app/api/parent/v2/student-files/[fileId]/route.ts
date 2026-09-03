import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { canParentSessionReadStudent } from "@/lib/parent-session-access";
import { PARENT_SESSION_COOKIE, verifyParentSessionToken } from "@/lib/parent-session";
import { STUDENT_FILES_BUCKET, type StudentFileRow } from "@/lib/student-files";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> },
) {
    const name = request.nextUrl.searchParams.get("name")?.trim() || "";
    if (!name || name.length < 2 || name.length > 10 || /[<>"';&\\]/.test(name)) {
        return NextResponse.json(
            { success: false, error: "학생 정보를 다시 확인해주세요." },
            { status: 400, headers: NO_STORE_HEADERS },
        );
    }

    const { fileId } = await params;
    if (!fileId) {
        return NextResponse.json(
            { success: false, error: "파일을 찾지 못했습니다." },
            { status: 404, headers: NO_STORE_HEADERS },
        );
    }

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json(
            { success: false, error: "서버 저장소 설정이 필요합니다." },
            { status: 503, headers: NO_STORE_HEADERS },
        );
    }

    try {
        const { data: fileData, error: fileError } = await admin
            .from("student_files")
            .select("id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at")
            .eq("id", fileId)
            .maybeSingle();
        if (fileError) throw new Error(fileError.message);

        const file = fileData as StudentFileRow | null;
        if (!file) {
            return NextResponse.json(
                { success: false, error: "파일을 찾지 못했습니다." },
                { status: 404, headers: NO_STORE_HEADERS },
            );
        }

        const { data: student, error: studentError } = await admin
            .from("students")
            .select("id,name,status")
            .eq("id", file.student_id)
            .eq("name", name)
            .neq("status", "deactivated")
            .maybeSingle();
        if (studentError) throw new Error(studentError.message);
        if (!student) {
            return NextResponse.json(
                { success: false, error: "이 학생의 파일이 아닙니다." },
                { status: 403, headers: NO_STORE_HEADERS },
            );
        }

        const [currentGrowth, historyGrowth] = await Promise.all([
            admin
                .from("student_growth_management")
                .select("id")
                .eq("student_id", student.id)
                .eq("artifact_file_id", file.id)
                .eq("status", "완료")
                .limit(1),
            admin
                .from("student_growth_entries")
                .select("id")
                .eq("student_id", student.id)
                .eq("artifact_file_id", file.id)
                .eq("status", "완료")
                .limit(1),
        ]);
        const growthError = currentGrowth.error || historyGrowth.error;
        if (growthError) throw new Error(growthError.message);
        if (!currentGrowth.data?.length && !historyGrowth.data?.length) {
            return NextResponse.json(
                { success: false, error: "학부모에게 공개된 결과물이 아닙니다." },
                { status: 403, headers: NO_STORE_HEADERS },
            );
        }

        let authorized = false;
        const parentToken = request.cookies.get(PARENT_SESSION_COOKIE)?.value;
        const parentSession = parentToken ? verifyParentSessionToken(parentToken) : null;
        if (parentSession?.studentId) {
            authorized = await canParentSessionReadStudent(admin, parentSession, name);
        }

        if (!authorized) {
            const teacher = await requireTeacher();
            authorized = teacher.ok;
        }

        if (!authorized) {
            return NextResponse.json(
                { success: false, error: "파일을 볼 권한이 없습니다." },
                { status: 403, headers: NO_STORE_HEADERS },
            );
        }

        const { data, error } = await admin.storage
            .from(STUDENT_FILES_BUCKET)
            .createSignedUrl(file.storage_path, 60);
        if (error || !data?.signedUrl) throw new Error(error?.message || "파일 보기 주소를 만들지 못했습니다.");

        return NextResponse.redirect(data.signedUrl, { headers: NO_STORE_HEADERS });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일을 불러오지 못했습니다." },
            { status: 500, headers: NO_STORE_HEADERS },
        );
    }
}
