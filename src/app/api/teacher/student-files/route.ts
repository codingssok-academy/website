import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    assertAllowedStudentFile,
    buildStudentFilePath,
    normalizeStudentFileCategory,
    normalizeStudentFileNote,
    normalizeStudentFileVisibility,
    sanitizeOriginalFileName,
    STUDENT_FILES_BUCKET,
    toStudentFileDto,
    type StudentFileRow,
} from "@/lib/student-files";
import { usesHashedStudentAccessCodes } from "@/lib/student-access-codes";

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

const FRESH_FILE_COLUMNS = "id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,visibility,created_at";
const LEGACY_FILE_COLUMNS = "id,student_id,owner_auth_user_id,uploaded_by,uploaded_by_role,original_name,storage_path,mime_type,size_bytes,category,note,created_at";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        const freshMode = usesHashedStudentAccessCodes();
        let allowedStudentIds: string[] | null = null;

        if (freshMode && teacher.role !== "admin") {
            const { data: assignments, error: assignmentError } = await admin
                .from("teacher_student_assignments")
                .select("student_id")
                .eq("teacher_id", teacher.userId)
                .eq("status", "active");
            if (assignmentError) throw new Error(assignmentError.message);

            allowedStudentIds = [...new Set(
                ((assignments || []) as { student_id: string | null }[])
                    .map(assignment => assignment.student_id)
                    .filter((id): id is string => Boolean(id)),
            )];
            if (allowedStudentIds.length === 0) {
                return NextResponse.json(
                    { success: true, students: [], files: [], canManageVisibility: false },
                    { headers: { "Cache-Control": "no-store" } },
                );
            }
        }

        let studentsQuery = admin
            .from("students")
            .select("id,name,school,grade,class,status,auth_user_id");
        let filesQuery = admin
            .from("student_files")
            .select(freshMode ? FRESH_FILE_COLUMNS : LEGACY_FILE_COLUMNS);

        if (allowedStudentIds) {
            studentsQuery = studentsQuery.in("id", allowedStudentIds);
            filesQuery = filesQuery.in("student_id", allowedStudentIds);
        }

        const [studentsRes, filesRes] = await Promise.all([
            studentsQuery.order("name", { ascending: true }),
            filesQuery.order("created_at", { ascending: false }),
        ]);

        if (studentsRes.error) throw new Error(studentsRes.error.message);
        if (filesRes.error) throw new Error(filesRes.error.message);

        const students = ((studentsRes.data || []) as StudentOptionRow[])
            .filter(student => student.class !== "admin" && student.status !== "deactivated")
            .map(toStudentOption);
        const studentMap = new Map(students.map(student => [student.id, student]));
        const files = ((filesRes.data || []) as unknown as StudentFileRow[])
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

        return NextResponse.json({
            success: true,
            students,
            files,
            canManageVisibility: freshMode && teacher.role === "admin",
        }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "학생 파일 목록을 불러오지 못했습니다." },
            { status: 500 },
        );
    }
}

export async function PATCH(request: NextRequest) {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;
    if (teacher.role !== "admin") {
        return NextResponse.json(
            { success: false, error: "파일 공개 범위는 관리자만 변경할 수 있습니다." },
            { status: 403 },
        );
    }
    if (!usesHashedStudentAccessCodes()) {
        return NextResponse.json(
            { success: false, error: "새 시험 DB에서만 파일 공개 범위를 변경할 수 있습니다." },
            { status: 409 },
        );
    }

    try {
        const body = await request.json().catch(() => null);
        const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
        const visibility = normalizeStudentFileVisibility(body?.visibility);
        if (!fileId || !visibility) {
            return NextResponse.json(
                { success: false, error: "파일과 공개 범위를 정확히 선택해주세요." },
                { status: 400 },
            );
        }

        const admin = createAdminClient();
        if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

        const { data, error } = await admin
            .from("student_files")
            .update({ visibility })
            .eq("id", fileId)
            .select("id,visibility")
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
            return NextResponse.json({ success: false, error: "파일을 찾을 수 없습니다." }, { status: 404 });
        }

        return NextResponse.json({ success: true, file: data }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일 공개 범위를 변경하지 못했습니다." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;
    if (teacher.role !== "admin") {
        return NextResponse.json(
            { success: false, error: "학생 파일은 관리자만 올릴 수 있습니다." },
            { status: 403 },
        );
    }
    if (!usesHashedStudentAccessCodes()) {
        return NextResponse.json(
            { success: false, error: "새 시험 DB에서만 관리자 파일 업로드를 사용할 수 있습니다." },
            { status: 409 },
        );
    }

    try {
        const form = await request.formData();
        const studentId = typeof form.get("studentId") === "string" ? String(form.get("studentId")).trim() : "";
        const file = form.get("file");
        const visibility = normalizeStudentFileVisibility(form.get("visibility"));
        if (!UUID_PATTERN.test(studentId)) {
            return NextResponse.json({ success: false, error: "학생을 정확히 선택해주세요." }, { status: 400 });
        }
        if (!(file instanceof File)) {
            return NextResponse.json({ success: false, error: "업로드할 파일을 선택해주세요." }, { status: 400 });
        }
        if (!visibility) {
            return NextResponse.json({ success: false, error: "공개 범위를 정확히 선택해주세요." }, { status: 400 });
        }

        try {
            assertAllowedStudentFile(file);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: error instanceof Error ? error.message : "지원하지 않는 파일입니다." },
                { status: 400 },
            );
        }
        const admin = createAdminClient();
        if (!admin) return NextResponse.json({ success: false, error: "서버 저장소 설정이 필요합니다." }, { status: 503 });

        const { data: studentData, error: studentError } = await admin
            .from("students")
            .select("id,name,school,grade,class,status,auth_user_id")
            .eq("id", studentId)
            .eq("status", "active")
            .maybeSingle();
        if (studentError) throw new Error(studentError.message);
        const student = studentData as StudentOptionRow | null;
        if (!student || !student.auth_user_id) {
            return NextResponse.json(
                { success: false, error: "로그인 계정이 연결된 활동 중인 학생만 파일을 올릴 수 있습니다." },
                { status: 400 },
            );
        }

        const originalName = sanitizeOriginalFileName(file.name);
        const storagePath = buildStudentFilePath({
            studentId: student.id,
            fileName: originalName,
            uploadedByRole: "admin",
        });
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
                student_id: student.id,
                owner_auth_user_id: student.auth_user_id,
                uploaded_by: teacher.userId,
                uploaded_by_role: "admin",
                original_name: originalName,
                storage_path: storagePath,
                mime_type: file.type || null,
                size_bytes: file.size,
                category: normalizeStudentFileCategory(form.get("category")),
                note: normalizeStudentFileNote(form.get("note")),
                visibility,
            })
            .select(FRESH_FILE_COLUMNS)
            .single();
        if (error || !data) {
            await admin.storage.from(STUDENT_FILES_BUCKET).remove([storagePath]);
            throw new Error(error?.message || "파일 정보를 저장하지 못했습니다.");
        }

        return NextResponse.json({
            success: true,
            file: toStudentFileDto(data as unknown as StudentFileRow, {
                id: student.id,
                name: student.name,
                school: student.school,
                grade: student.grade,
                className: student.class,
            }),
        }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." },
            { status: 500 },
        );
    }
}
