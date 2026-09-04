import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    assertAllowedStudentFile,
    buildStudentFilePath,
    normalizeStudentFileCategory,
    normalizeStudentFileNote,
    sanitizeOriginalFileName,
    STUDENT_FILES_BUCKET,
    toStudentFileDto,
    type StudentFileRow,
} from "@/lib/student-files";
import { usesHashedStudentAccessCodes } from "@/lib/student-access-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentRow = {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
    class: string | null;
    status: string | null;
    auth_user_id: string | null;
};

function getStudentFileColumns() {
    return usesHashedStudentAccessCodes()
        ? "id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,visibility,created_at"
        : "id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at";
}

async function getCurrentStudent() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { error: NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 }) };
    }

    const admin = createAdminClient();
    if (!admin) {
        return { error: NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 }) };
    }

    const { data, error } = await admin
        .from("students")
        .select("id,name,school,grade,class,status,auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (error) {
        return { error: NextResponse.json({ success: false, error: error.message }, { status: 500 }) };
    }

    const student = data as StudentRow | null;
    const inactive = usesHashedStudentAccessCodes()
        ? student?.status !== "active"
        : student?.status === "deactivated" || student?.status === "rejected";
    if (!student || inactive) {
        return { error: NextResponse.json({ success: false, error: "사용 가능한 학생 계정이 아닙니다." }, { status: 403 }) };
    }

    return { admin, user, student };
}

export async function GET() {
    const ctx = await getCurrentStudent();
    if (ctx.error) return ctx.error;

    let filesQuery = ctx.admin
        .from("student_files")
        .select(getStudentFileColumns())
        .eq("student_id", ctx.student.id);
    if (usesHashedStudentAccessCodes()) {
        filesQuery = filesQuery.eq("visibility", "student_parent");
    }
    const { data, error } = await filesQuery.order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        student: {
            id: ctx.student.id,
            name: ctx.student.name,
            school: ctx.student.school,
            grade: ctx.student.grade,
            className: ctx.student.class,
        },
        files: ((data || []) as unknown as StudentFileRow[]).map(row => toStudentFileDto(row)),
    }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
    try {
        const ctx = await getCurrentStudent();
        if (ctx.error) return ctx.error;

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
            return NextResponse.json({ success: false, error: "업로드할 파일을 선택해주세요." }, { status: 400 });
        }

        assertAllowedStudentFile(file);
        const originalName = sanitizeOriginalFileName(file.name);
        const storagePath = buildStudentFilePath({
            studentId: ctx.student.id,
            fileName: originalName,
            uploadedByRole: "student",
        });
        const bytes = Buffer.from(await file.arrayBuffer());

        const upload = await ctx.admin.storage
            .from(STUDENT_FILES_BUCKET)
            .upload(storagePath, bytes, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });
        if (upload.error) throw new Error(upload.error.message);

        const metadata = {
            student_id: ctx.student.id,
            owner_auth_user_id: ctx.user.id,
            uploaded_by: ctx.user.id,
            uploaded_by_role: "student",
            original_name: originalName,
            storage_path: storagePath,
            mime_type: file.type || null,
            size_bytes: file.size,
            category: normalizeStudentFileCategory(form.get("category")),
            note: normalizeStudentFileNote(form.get("note")),
            ...(usesHashedStudentAccessCodes() ? { visibility: "student_parent" } : {}),
        };
        const { data, error } = await ctx.admin
            .from("student_files")
            .insert(metadata)
            .select(getStudentFileColumns())
            .single();

        if (error || !data) {
            await ctx.admin.storage.from(STUDENT_FILES_BUCKET).remove([storagePath]);
            throw new Error(error?.message || "파일 정보를 저장하지 못했습니다.");
        }

        return NextResponse.json({ success: true, file: toStudentFileDto(data as unknown as StudentFileRow) }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." },
            { status: 500 },
        );
    }
}
