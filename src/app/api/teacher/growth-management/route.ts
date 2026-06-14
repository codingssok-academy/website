import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEXT_FIELDS = [
    "studentName",
    "currentClass",
    "temperament",
    "skillLevel",
    "strengths",
    "weaknesses",
    "currentGoal",
    "nextClassPotential",
    "classProgress",
    "parentFeedbackDraft",
    "teacherMemo",
] as const;

function readText(body: Record<string, unknown>, key: typeof TEXT_FIELDS[number]) {
    const value = body[key];
    return typeof value === "string" ? value.trim().slice(0, 4000) : "";
}

function isMissingTable(error: { message?: string } | null) {
    const message = (error?.message || "").toLowerCase();
    return message.includes("student_growth_management")
        && (message.includes("could not find") || message.includes("does not exist") || message.includes("schema cache"));
}

async function loadData() {
    const supabase = await createClient();
    const [studentsRes, recordsRes] = await Promise.all([
        supabase
            .from("students")
            .select("id,name,grade,class,status,updated_at,created_at")
            .order("name", { ascending: true }),
        supabase
            .from("student_growth_management")
            .select("*")
            .order("updated_at", { ascending: false }),
    ]);

    if (studentsRes.error) throw new Error(studentsRes.error.message);
    if (recordsRes.error) {
        if (isMissingTable(recordsRes.error)) {
            return {
                success: true,
                migrationRequired: true,
                students: (studentsRes.data || []).filter(student => student.class !== "admin"),
                records: [],
            };
        }
        throw new Error(recordsRes.error.message);
    }

    return {
        success: true,
        migrationRequired: false,
        students: (studentsRes.data || []).filter(student => student.class !== "admin"),
        records: recordsRes.data || [],
    };
}

export async function GET() {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    try {
        return NextResponse.json(await loadData(), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to load growth management records." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) {
        return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
        return NextResponse.json({ success: false, error: "studentId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const payload = {
        student_id: studentId,
        student_name: readText(body, "studentName"),
        current_class: readText(body, "currentClass"),
        temperament: readText(body, "temperament"),
        skill_level: readText(body, "skillLevel"),
        strengths: readText(body, "strengths"),
        weaknesses: readText(body, "weaknesses"),
        current_goal: readText(body, "currentGoal"),
        next_class_potential: readText(body, "nextClassPotential"),
        class_progress: readText(body, "classProgress"),
        parent_feedback_draft: readText(body, "parentFeedbackDraft"),
        teacher_memo: readText(body, "teacherMemo"),
        status: "active",
        created_by: auth.userId,
        updated_by: auth.userId,
    };

    try {
        const { data, error } = await supabase
            .from("student_growth_management")
            .upsert(payload, { onConflict: "student_id" })
            .select("*")
            .single();

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, record: data }, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to save growth record." },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
        return NextResponse.json({ success: false, error: "studentId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("student_growth_management")
        .delete()
        .eq("student_id", studentId);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, {
        headers: { "Cache-Control": "no-store" },
    });
}
