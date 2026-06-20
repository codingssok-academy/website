import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentOptionRow = {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
    class: string | null;
    status: string | null;
    auth_user_id: string | null;
};

function toStudentOption(row: StudentOptionRow) {
    return {
        id: row.id,
        name: row.name,
        school: row.school,
        grade: row.grade,
        className: row.class,
        status: row.status,
        linked: Boolean(row.auth_user_id),
    };
}

export async function GET(request: NextRequest) {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

    try {
        const studentId = request.nextUrl.searchParams.get("studentId")?.trim() || "";
        const [studentsRes, filesRes] = await Promise.all([
            admin
                .from("students")
                .select("id,name,school,grade,class,status,auth_user_id")
                .order("name", { ascending: true }),
            admin
                .from("student_files")
                .select("id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at")
                .order("created_at", { ascending: false }),
        ]);

        if (studentsRes.error) throw new Error(studentsRes.error.message);
        if (filesRes.error) throw new Error(filesRes.error.message);

        const students = ((studentsRes.data || []) as StudentOptionRow[])
            .filter(student => student.class !== "admin" && student.status !== "deactivated")
            .map(toStudentOption);
        const studentMap = new Map(students.map(student => [student.id, student]));
        const files = ((filesRes.data || []) as StudentFileRow[])
            .filter(file => !studentId || file.student_id === studentId)
            .map(file => {
                const student = studentMap.get(file.student_id);
                return toStudentFileDto(file, student ? {
                    id: student.id,
                    name: student.name,
                    school: student.school,
                    grade: student.grade,
                    className: student.className,
                } : null);
            });

        return NextResponse.json({ success: true, students, files }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "학생 파일 목록을 불러오지 못했습니다." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

    try {
        const form = await request.formData();
        const studentId = String(form.get("studentId") || "").trim();
        const file = form.get("file");
        if (!studentId) return NextResponse.json({ success: false, error: "학생을 선택해주세요." }, { status: 400 });
        if (!(file instanceof File)) return NextResponse.json({ success: false, error: "업로드할 파일을 선택해주세요." }, { status: 400 });

        const { data: student, error: studentError } = await admin
            .from("students")
            .select("id,name,school,grade,class,status,auth_user_id")
            .eq("id", studentId)
            .maybeSingle();
        if (studentError) throw new Error(studentError.message);
        const target = student as StudentOptionRow | null;
        if (!target || target.status === "deactivated" || target.class === "admin") {
            return NextResponse.json({ success: false, error: "사용 가능한 학생이 아닙니다." }, { status: 400 });
        }

        assertAllowedStudentFile(file);
        const originalName = sanitizeOriginalFileName(file.name);
        const uploadedByRole = teacher.role === "admin" ? "admin" : "teacher";
        const storagePath = buildStudentFilePath({ studentId: target.id, fileName: originalName, uploadedByRole });
        const bytes = Buffer.from(await file.arrayBuffer());

        const upload = await admin.storage
            .from(STUDENT_FILES_BUCKET)
            .upload(storagePath, bytes, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });
        if (upload.error) throw new Error(upload.error.message);

        const { data, error } = await admin
            .from("student_files")
            .insert({
                student_id: target.id,
                owner_auth_user_id: target.auth_user_id || null,
                uploaded_by: teacher.userId,
                uploaded_by_role: uploadedByRole,
                original_name: originalName,
                storage_path: storagePath,
                mime_type: file.type || null,
                size_bytes: file.size,
                category: normalizeStudentFileCategory(form.get("category")),
                note: normalizeStudentFileNote(form.get("note")),
            })
            .select("id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at")
            .single();

        if (error || !data) {
            await admin.storage.from(STUDENT_FILES_BUCKET).remove([storagePath]);
            throw new Error(error?.message || "파일 정보를 저장하지 못했습니다.");
        }

        return NextResponse.json({
            success: true,
            file: toStudentFileDto(data as StudentFileRow, {
                id: target.id,
                name: target.name,
                school: target.school,
                grade: target.grade,
                className: target.class,
            }),
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "학생 파일 업로드에 실패했습니다." },
            { status: 500 },
        );
    }
}

