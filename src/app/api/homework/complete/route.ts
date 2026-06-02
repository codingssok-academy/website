/**
 * POST /api/homework/complete
 * 숙제 완료 처리 — 선생님 전용
 * body: { ref: string, student_name: string }
 * ref = Supabase homework ID 또는 "notion-{pageId}"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth-teacher";

export async function POST(req: NextRequest) {
    // 교사 인증 필수
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const { ref, student_name } = await req.json();

    // 입력 검증
    if (!ref || !student_name) {
        return NextResponse.json({ error: "ref와 student_name 필수" }, { status: 400 });
    }
    if (typeof ref !== "string" || ref.length > 200) {
        return NextResponse.json({ error: "잘못된 ref" }, { status: 400 });
    }
    if (typeof student_name !== "string" || student_name.length > 20 || /[<>"';&\\]/.test(student_name)) {
        return NextResponse.json({ error: "잘못된 학생 이름" }, { status: 400 });
    }

    // 쓰기 작업은 service_role (RLS 대비)
    const supabase = createAdminClient() || createClient();

    if (ref.startsWith("notion-")) {
        const { error } = await supabase
            .from("homework_completions")
            .upsert({ homework_ref: ref, student_name, completed_by: auth.userId }, { onConflict: "homework_ref" });

        if (error) {
            if (process.env.NODE_ENV === "development") console.error("[homework/complete notion]", error);
            return NextResponse.json({ error: "완료 처리 실패" }, { status: 500 });
        }
    } else {
        const { error } = await supabase
            .from("student_homework")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", ref);

        if (error) {
            if (process.env.NODE_ENV === "development") console.error("[homework/complete supabase]", error);
            return NextResponse.json({ error: "완료 처리 실패" }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

/** GET: 완료된 Notion 과제 목록 조회 (student_name 없으면 전체) */
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get("student_name");

    const supabase = createClient();
    let query = supabase.from("homework_completions").select("homework_ref");
    if (name) query = query.eq("student_name", name);

    const { data } = await query;

    return NextResponse.json({
        refs: (data || []).map((d: any) => d.homework_ref),
    });
}
