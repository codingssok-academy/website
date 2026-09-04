import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { usesHashedStudentAccessCodes } from "@/lib/student-access-codes";
import { createClient } from "@/lib/supabase/server";

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

type FreshGrowthRow = {
    id: string;
    student_id: string;
    period_month: string;
    class_snapshot: string | null;
    learned_concepts: string | null;
    strengths: string | null;
    improvements: string | null;
    next_goal: string | null;
    lesson_summary: string | null;
    parent_message: string | null;
    status: "draft" | "published" | "archived" | string;
    published_at: string | null;
    archived_at: string | null;
    created_at: string;
    updated_at: string;
    teacher_memo: string | null;
    entry_note: string | null;
    next_class_potential: string | null;
};

type StudentRow = {
    id: string;
    name: string;
    school?: string | null;
    grade?: string | null;
    class?: string | null;
    status?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
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

function isMissingFreshGrowthApi(error: DbError | null) {
    const message = (error?.message || "").toLowerCase();
    return (
        message.includes("growth_api_teacher_")
        || message.includes("teacher_memo")
        || message.includes("next_class_potential")
    ) && (
        message.includes("could not find")
        || message.includes("does not exist")
        || message.includes("schema cache")
        || error?.code === "42883"
        || error?.code === "PGRST202"
    );
}

function freshStatusToUi(status: string) {
    if (status === "published") return "완료";
    if (status === "archived") return "보관";
    return "초안";
}

function uiStatusToFresh(status: string) {
    return status === "완료" ? "published" : "draft";
}

function currentSeoulMonth() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date());
    const year = parts.find(part => part.type === "year")?.value;
    const month = parts.find(part => part.type === "month")?.value;
    return `${year}-${month}-01`;
}

function mapFreshRecord(row: FreshGrowthRow, studentName: string) {
    return {
        id: row.id,
        student_id: row.student_id,
        student_name: studentName,
        current_class: row.class_snapshot || "",
        skill_level: null,
        strengths: row.strengths || "",
        weaknesses: row.improvements || "",
        current_goal: row.next_goal || "",
        next_class_potential: row.next_class_potential || "",
        class_progress: row.learned_concepts || row.lesson_summary || "",
        parent_feedback_draft: row.parent_message || "",
        teacher_memo: row.teacher_memo || "",
        entry_note: row.entry_note || "",
        status: freshStatusToUi(row.status),
        period_month: row.period_month,
        published_at: row.published_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function readFreshRecordId(data: unknown) {
    if (typeof data === "string") return data;
    if (Array.isArray(data) && typeof data[0] === "string") return data[0];
    return "";
}

function freshWritePayload(body: Record<string, unknown>) {
    const classProgress = readText(body, "classProgress", 8000);
    return {
        p_class_snapshot: readText(body, "currentClass", 80) || null,
        p_learned_concepts: classProgress,
        p_strengths: readText(body, "strengths", 8000),
        p_improvements: readText(body, "weaknesses", 8000),
        p_next_goal: readText(body, "currentGoal", 8000),
        p_lesson_summary: classProgress,
        p_parent_message: readText(body, "parentFeedbackDraft", 8000),
        p_teacher_memo: readText(body, "teacherMemo", 8000),
        p_entry_note: readText(body, "entryNote", 8000),
        p_next_class_potential: readText(body, "nextClassPotential", 500),
    };
}

async function loadLegacyData() {
    const supabase = await createClient();
    const [studentsRes, recordsRes, entriesRes] = await Promise.all([
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
    ]);

    if (studentsRes.error) throw new Error(studentsRes.error.message);

    const students = (studentsRes.data || []).filter(student => student.class !== "admin");

    if (recordsRes.error || entriesRes.error) {
        const missing = isMissingGrowthTable(recordsRes.error) || isMissingGrowthTable(entriesRes.error);
        if (missing) {
            return {
                success: true,
                freshMode: false,
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
        freshMode: false,
        migrationRequired: false,
        students,
        records: recordsRes.data || [],
        entries: entriesRes.data || [],
    };
}

async function loadFreshRows(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data, error } = await supabase.rpc("growth_api_teacher_list_records");
    if (error) throw Object.assign(new Error(error.message), { code: error.code });
    return (Array.isArray(data) ? data : []) as FreshGrowthRow[];
}

async function loadFreshData() {
    const supabase = await createClient();
    const [studentsRes, recordsRes] = await Promise.all([
        supabase
            .from("students")
            .select("id,name,school,grade,class,status,updated_at,created_at")
            .neq("status", "deactivated")
            .order("name", { ascending: true }),
        supabase.rpc("growth_api_teacher_list_records"),
    ]);

    if (studentsRes.error) throw new Error(studentsRes.error.message);
    const students = ((studentsRes.data || []) as StudentRow[]).filter(student => student.class !== "admin");

    if (recordsRes.error) {
        if (isMissingFreshGrowthApi(recordsRes.error)) {
            return {
                success: true,
                freshMode: true,
                migrationRequired: true,
                students,
                records: [],
                entries: [],
            };
        }
        throw new Error(recordsRes.error.message);
    }

    const names = new Map(students.map(student => [student.id, student.name]));
    const entries = ((recordsRes.data || []) as FreshGrowthRow[])
        .map(row => mapFreshRecord(row, names.get(row.student_id) || ""));
    const latestByStudent = new Map<string, ReturnType<typeof mapFreshRecord>>();
    for (const entry of entries) {
        if (!latestByStudent.has(entry.student_id)) latestByStudent.set(entry.student_id, entry);
    }

    return {
        success: true,
        freshMode: true,
        migrationRequired: false,
        students,
        records: Array.from(latestByStudent.values()),
        entries,
    };
}

export async function GET() {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    try {
        const data = usesHashedStudentAccessCodes()
            ? await loadFreshData()
            : await loadLegacyData();
        return NextResponse.json(data, { headers: NO_STORE_HEADERS });
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

    if (usesHashedStudentAccessCodes()) {
        const recordId = readString(body, "recordId", 120) || null;
        const requestedStatus = readString(body, "recordStatus", 120);
        const { data, error } = await supabase.rpc("growth_api_teacher_save_record", {
            p_record_id: recordId,
            p_student_id: studentId,
            p_period_month: currentSeoulMonth(),
            ...freshWritePayload(body),
            p_status: autoSave ? "draft" : uiStatusToFresh(requestedStatus),
        });

        if (error) {
            return NextResponse.json(
                { success: false, error: isMissingFreshGrowthApi(error) ? "새 성장관리 저장 기능을 시험 DB에 먼저 적용해주세요." : error.message },
                { status: 500, headers: NO_STORE_HEADERS },
            );
        }

        try {
            const savedId = readFreshRecordId(data);
            const rows = await loadFreshRows(supabase);
            const studentRow = await supabase
                .from("students")
                .select("name")
                .eq("id", studentId)
                .maybeSingle();
            if (studentRow.error) throw new Error(studentRow.error.message);
            const saved = rows.find(row => row.id === savedId);
            if (!saved) throw new Error("저장한 성장 기록을 다시 확인하지 못했습니다.");
            const record = mapFreshRecord(saved, studentRow.data?.name || "");
            const entry = autoSave ? null : record;
            return NextResponse.json({ success: true, record, entry, freshMode: true }, { headers: NO_STORE_HEADERS });
        } catch (error) {
            return NextResponse.json(
                { success: false, error: error instanceof Error ? error.message : "저장한 성장 기록을 확인하지 못했습니다." },
                { status: 500, headers: NO_STORE_HEADERS },
            );
        }
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
        created_by: auth.userId,
    };

    try {
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
    };

    try {
        const supabase = await createClient();

        if (usesHashedStudentAccessCodes()) {
            const { data, error } = await supabase.rpc("growth_api_teacher_update_record", {
                p_record_id: entryId,
                p_student_id: studentId,
                ...freshWritePayload(body),
                p_status: uiStatusToFresh(readString(body, "recordStatus", 120)),
            });
            if (error) throw new Error(error.message);

            const savedId = readFreshRecordId(data);
            const [rows, studentRes] = await Promise.all([
                loadFreshRows(supabase),
                supabase.from("students").select("name").eq("id", studentId).maybeSingle(),
            ]);
            if (studentRes.error) throw new Error(studentRes.error.message);
            const saved = rows.find(row => row.id === savedId);
            if (!saved) throw new Error("수정한 성장 기록을 다시 확인하지 못했습니다.");
            const entry = mapFreshRecord(saved, studentRes.data?.name || "");
            return NextResponse.json({ success: true, entry, record: entry, freshMode: true }, { headers: NO_STORE_HEADERS });
        }

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

    if (usesHashedStudentAccessCodes()) {
        const { error } = await supabase.rpc("growth_api_teacher_archive_records", {
            p_student_id: studentId,
        });
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
        }
        return NextResponse.json({ success: true, freshMode: true }, { headers: NO_STORE_HEADERS });
    }

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
