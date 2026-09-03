import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    normalizeGrowthArtifactTitle,
    normalizeGrowthArtifactUrl,
} from "@/lib/growth-artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const TEXT_FIELDS = [
    "studentName",
    "currentClass",
    "strengths",
    "weaknesses",
    "currentGoal",
    "nextClassPotential",
    "classProgress",
    "parentFeedbackDraft",
    "teacherMemo",
    "entryNote",
] as const;

type TextField = typeof TEXT_FIELDS[number];

type DbError = {
    message?: string;
    code?: string;
};

function readText(body: Record<string, unknown>, key: TextField, max = 4000) {
    const value = body[key];
    return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function readString(body: Record<string, unknown>, key: string, max = 4000) {
    const value = body[key];
    return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function readBoolean(body: Record<string, unknown>, key: string) {
    return body[key] === true;
}

function isMissingGrowthTable(error: DbError | null) {
    const message = (error?.message || "").toLowerCase();
    return (
        message.includes("student_growth_management")
        || message.includes("student_growth_entries")
    ) && (
        message.includes("could not find")
        || message.includes("does not exist")
        || message.includes("schema cache")
        || error?.code === "42P01"
        || error?.code === "PGRST205"
    );
}

async function loadData() {
    const supabase = await createClient();
    const admin = createAdminClient();
    const [studentsRes, recordsRes, entriesRes, filesRes] = await Promise.all([
        supabase
            .from("students")
            .select("id,name,school,grade,class,status,updated_at,created_at")
            .neq("status", "deactivated")
            .order("name", { ascending: true }),
        supabase
            .from("student_growth_management")
            .select("*")
            .order("updated_at", { ascending: false }),
        supabase
            .from("student_growth_entries")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(500),
        admin
            ? admin
                .from("student_files")
                .select("id,student_id,original_name,mime_type,category,created_at")
                .order("created_at", { ascending: false })
                .limit(1000)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (studentsRes.error) throw new Error(studentsRes.error.message);

    const students = (studentsRes.data || []).filter(student => student.class !== "admin");

    if (recordsRes.error || entriesRes.error) {
        const missing = isMissingGrowthTable(recordsRes.error) || isMissingGrowthTable(entriesRes.error);
        if (missing) {
            return {
                success: true,
                migrationRequired: true,
                students,
                records: [],
                entries: [],
            };
        }
        throw new Error(recordsRes.error?.message || entriesRes.error?.message || "성장관리표를 불러오지 못했습니다.");
    }

    return {
        success: true,
        migrationRequired: false,
        students,
        records: recordsRes.data || [],
        entries: entriesRes.data || [],
        files: filesRes.error ? [] : filesRes.data || [],
    };
}

function readArtifact(body: Record<string, unknown>) {
    const artifactTitle = normalizeGrowthArtifactTitle(body.artifactTitle);
    const artifactFileId = readString(body, "artifactFileId", 120) || null;
    const artifactUrl = normalizeGrowthArtifactUrl(body.artifactUrl);

    if (artifactFileId && artifactUrl) {
        throw new Error("결과물은 엔트리 링크 또는 학생 파일 중 하나만 선택해주세요.");
    }

    return {
        artifact_title: artifactTitle || null,
        artifact_url: artifactUrl,
        artifact_file_id: artifactFileId,
    };
}

async function artifactFileBelongsToStudent(studentId: string, fileId: string | null) {
    if (!fileId) return true;
    const admin = createAdminClient();
    if (!admin) throw new Error("학생 파일함을 확인할 서버 설정이 필요합니다.");

    const { data, error } = await admin
        .from("student_files")
        .select("id")
        .eq("id", fileId)
        .eq("student_id", studentId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
}

export async function GET() {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    try {
        return NextResponse.json(await loadData(), { headers: NO_STORE_HEADERS });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "성장관리표를 불러오지 못했습니다." },
            { status: 500, headers: NO_STORE_HEADERS },
        );
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) {
        return NextResponse.json({ success: false, error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
    }

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
        return NextResponse.json({ success: false, error: "학생을 먼저 선택해주세요." }, { status: 400 });
    }

    const supabase = await createClient();
    const autoSave = readBoolean(body, "autoSave");
    const createEntry = readBoolean(body, "createEntry");
    const entryNote = readText(body, "entryNote");
    let artifact: ReturnType<typeof readArtifact>;
    try {
        artifact = readArtifact(body);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "결과물 정보를 확인해주세요." },
            { status: 400, headers: NO_STORE_HEADERS },
        );
    }
    const payload = {
        student_id: studentId,
        student_name: readText(body, "studentName", 120),
        current_class: readText(body, "currentClass", 120),
        skill_level: null,
        strengths: readText(body, "strengths"),
        weaknesses: readText(body, "weaknesses"),
        current_goal: readText(body, "currentGoal"),
        next_class_potential: readText(body, "nextClassPotential", 500),
        class_progress: readText(body, "classProgress"),
        parent_feedback_draft: readText(body, "parentFeedbackDraft"),
        teacher_memo: readText(body, "teacherMemo"),
        status: readString(body, "recordStatus", 120) || "관찰중",
        ...artifact,
        created_by: auth.userId,
        updated_by: auth.userId,
    };

    const entryPayload = {
        student_id: payload.student_id,
        student_name: payload.student_name,
        current_class: payload.current_class,
        skill_level: payload.skill_level,
        strengths: payload.strengths,
        weaknesses: payload.weaknesses,
        current_goal: payload.current_goal,
        next_class_potential: payload.next_class_potential,
        class_progress: payload.class_progress,
        parent_feedback_draft: payload.parent_feedback_draft,
        teacher_memo: payload.teacher_memo,
        entry_note: entryNote,
        status: payload.status,
        artifact_title: payload.artifact_title,
        artifact_url: payload.artifact_url,
        artifact_file_id: payload.artifact_file_id,
        created_by: auth.userId,
    };

    try {
        if (!await artifactFileBelongsToStudent(studentId, artifact.artifact_file_id)) {
            return NextResponse.json(
                { success: false, error: "선택한 학생의 파일을 찾지 못했습니다." },
                { status: 400, headers: NO_STORE_HEADERS },
            );
        }

        const { data: record, error: upsertError } = await supabase
            .from("student_growth_management")
            .upsert(payload, { onConflict: "student_id" })
            .select("*")
            .single();

        if (upsertError) throw new Error(upsertError.message);

        if (autoSave && !createEntry && !entryNote) {
            return NextResponse.json({ success: true, record, entry: null }, { headers: NO_STORE_HEADERS });
        }

        const { data: entry, error: entryError } = await supabase
            .from("student_growth_entries")
            .insert(entryPayload)
            .select("*")
            .single();

        if (entryError) throw new Error(entryError.message);

        return NextResponse.json({ success: true, record, entry }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "성장 기록 저장에 실패했습니다." },
            { status: 500, headers: NO_STORE_HEADERS },
        );
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) {
        return NextResponse.json({ success: false, error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
    }

    const entryId = readString(body, "entryId", 120);
    const studentId = readString(body, "studentId", 120);
    if (!entryId || !studentId) {
        return NextResponse.json({ success: false, error: "수정할 성장 기록을 찾지 못했습니다." }, { status: 400 });
    }

    let artifact: ReturnType<typeof readArtifact>;
    try {
        artifact = readArtifact(body);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "결과물 정보를 확인해주세요." },
            { status: 400, headers: NO_STORE_HEADERS },
        );
    }

    const payload = {
        current_class: readText(body, "currentClass", 120),
        strengths: readText(body, "strengths"),
        weaknesses: readText(body, "weaknesses"),
        current_goal: readText(body, "currentGoal"),
        next_class_potential: readText(body, "nextClassPotential", 500),
        class_progress: readText(body, "classProgress"),
        parent_feedback_draft: readText(body, "parentFeedbackDraft"),
        teacher_memo: readText(body, "teacherMemo"),
        entry_note: readText(body, "entryNote"),
        status: readString(body, "recordStatus", 120) || "관찰중",
        ...artifact,
    };

    try {
        if (!await artifactFileBelongsToStudent(studentId, artifact.artifact_file_id)) {
            return NextResponse.json(
                { success: false, error: "선택한 학생의 파일을 찾지 못했습니다." },
                { status: 400, headers: NO_STORE_HEADERS },
            );
        }

        const supabase = await createClient();
        const { data: entry, error } = await supabase
            .from("student_growth_entries")
            .update(payload)
            .eq("id", entryId)
            .eq("student_id", studentId)
            .select("*")
            .single();

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, entry }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "성장 기록 수정에 실패했습니다." },
            { status: 500, headers: NO_STORE_HEADERS },
        );
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
        return NextResponse.json({ success: false, error: "학생을 먼저 선택해주세요." }, { status: 400 });
    }

    const supabase = await createClient();
    const [entriesDelete, summaryDelete] = await Promise.all([
        supabase.from("student_growth_entries").delete().eq("student_id", studentId),
        supabase.from("student_growth_management").delete().eq("student_id", studentId),
    ]);

    const error = entriesDelete.error || summaryDelete.error;
    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
}
