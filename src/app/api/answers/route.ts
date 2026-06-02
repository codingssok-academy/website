/**
 * /api/answers — 학생 답안 저장/조회
 *
 * GET  ?page_path=/learn/c-lang/L1-u01-...
 *   → 인증된 학생 본인의 답안 배열 반환
 *
 * POST { page_path, answers: [{field_index, answer_text}, ...] }
 *   → 인증된 학생 본인 답안 저장 (upsert)
 *
 * 보안: req.body / query의 user_id 무시 — supabase auth 세션의 user.id를 강제 사용
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const pagePath = req.nextUrl.searchParams.get("page_path");
    if (!pagePath) {
        return NextResponse.json({ error: "page_path required" }, { status: 400 });
    }

    const db = createAdminClient() ?? supabase;
    const { data, error } = await db
        .from("student_answers")
        .select("field_index, answer_text, updated_at")
        .eq("user_id", user.id)
        .eq("page_path", pagePath)
        .order("field_index");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ answers: data });
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { success } = await rateLimit(`answers:${user.id}`, { maxRequests: 60, windowMs: 60_000 });
    if (!success) {
        return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
    }

    let body: { page_path?: string; answers?: { field_index: number; answer_text: string }[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    const { page_path, answers } = body;
    if (!page_path || !Array.isArray(answers)) {
        return NextResponse.json({ error: "page_path, answers[] required" }, { status: 400 });
    }

    if (typeof page_path !== "string" || page_path.length > 500) {
        return NextResponse.json({ error: "page_path 형식 오류" }, { status: 400 });
    }

    if (answers.length > 100) {
        return NextResponse.json({ error: "answers 항목이 너무 많습니다 (최대 100)" }, { status: 400 });
    }

    const rows = answers.map((a) => ({
        user_id: user.id,
        page_path,
        field_index: Number(a.field_index) | 0,
        answer_text: String(a.answer_text ?? "").slice(0, 10000),
        updated_at: new Date().toISOString(),
    }));

    const db = createAdminClient() ?? supabase;
    const { error } = await db
        .from("student_answers")
        .upsert(rows, { onConflict: "user_id,page_path,field_index" });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: rows.length });
}
