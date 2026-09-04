import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireTeacher: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/auth-teacher", () => ({ requireTeacher: mocks.requireTeacher }));

import { GET } from "./route";

function request() {
    return new NextRequest("https://www.codingssok.com/api/teacher/student-files");
}

function makeListQuery(data: unknown[]) {
    const query: {
        in: ReturnType<typeof vi.fn>;
        order: ReturnType<typeof vi.fn>;
    } = {
        in: vi.fn(),
        order: vi.fn().mockResolvedValue({ data, error: null }),
    };
    query.in.mockReturnValue(query);
    return query;
}

describe("teacher student file list in fresh database mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        mocks.requireTeacher.mockResolvedValue({
            ok: true,
            userId: "teacher-user",
            role: "teacher",
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("limits a teacher's student and file queries to active assignments", async () => {
        const assignedStudentId = "11111111-1111-4111-8111-111111111111";
        const studentsQuery = makeListQuery([{
            id: assignedStudentId,
            name: "가짜학생",
            school: "테스트초등학교",
            grade: "3",
            class: "공통기초반",
            status: "active",
            auth_user_id: "student-user",
        }]);
        const filesQuery = makeListQuery([{
            id: "22222222-2222-4222-8222-222222222222",
            student_id: assignedStudentId,
            owner_auth_user_id: "student-user",
            uploaded_by: "teacher-user",
            uploaded_by_role: "teacher",
            original_name: "fake-project.ent",
            storage_path: `students/${assignedStudentId}/teacher/fake-project.ent`,
            mime_type: "application/octet-stream",
            size_bytes: 100,
            category: "result",
            note: "가짜 테스트 파일",
            visibility: "student_parent",
            created_at: "2026-09-04T00:00:00.000Z",
        }]);
        const assignmentEqStatus = vi.fn().mockResolvedValue({
            data: [{ student_id: assignedStudentId }],
            error: null,
        });
        const assignmentEqTeacher = vi.fn(() => ({ eq: assignmentEqStatus }));
        const studentsSelect = vi.fn(() => studentsQuery);
        const filesSelect = vi.fn(() => filesQuery);
        const admin = {
            from: vi.fn((table: string) => {
                if (table === "teacher_student_assignments") {
                    return { select: vi.fn(() => ({ eq: assignmentEqTeacher })) };
                }
                if (table === "students") return { select: studentsSelect };
                if (table === "student_files") return { select: filesSelect };
                throw new Error(`unexpected table: ${table}`);
            }),
        };
        mocks.createAdminClient.mockReturnValue(admin);

        const response = await GET(request());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(assignmentEqTeacher).toHaveBeenCalledWith("teacher_id", "teacher-user");
        expect(assignmentEqStatus).toHaveBeenCalledWith("status", "active");
        expect(studentsQuery.in).toHaveBeenCalledWith("id", [assignedStudentId]);
        expect(filesQuery.in).toHaveBeenCalledWith("student_id", [assignedStudentId]);
        expect(filesSelect).toHaveBeenCalledWith(expect.stringContaining("visibility"));
        expect(body.students).toHaveLength(1);
        expect(body.files).toHaveLength(1);
        expect(body.files[0].visibility).toBe("student_parent");
    });

    it("returns an empty list without querying all students when a teacher has no assignment", async () => {
        const studentsSelect = vi.fn();
        const filesSelect = vi.fn();
        const admin = {
            from: vi.fn((table: string) => {
                if (table === "teacher_student_assignments") {
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                            })),
                        })),
                    };
                }
                if (table === "students") return { select: studentsSelect };
                if (table === "student_files") return { select: filesSelect };
                throw new Error(`unexpected table: ${table}`);
            }),
        };
        mocks.createAdminClient.mockReturnValue(admin);

        const response = await GET(request());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true, students: [], files: [] });
        expect(studentsSelect).not.toHaveBeenCalled();
        expect(filesSelect).not.toHaveBeenCalled();
    });
});
