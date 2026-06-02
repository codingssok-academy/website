/**
 * /api/homework
 *
 * GET  ?student_name=이름  — 해당 학생 숙제 조회
 * GET  ?pending=true       — 미완료 숙제만
 * POST                     — 숙제 출제 (선생님)
 * PATCH                    — 숙제 완료 체크 (학생)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth-teacher";

export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get("student_name");
    const userId = req.nextUrl.searchParams.get("user_id");
    const pendingOnly = req.nextUrl.searchParams.get("pending") === "true";
    const since = req.nextUrl.searchParams.get("since");

    // 입력 검증
    if (name && (name.length > 20 || /[<>"';&]/.test(name))) {
        return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });
    }

    const supabase = createClient();

    let query = supabase
        .from("student_homework")
        .select("*")
        .order("assigned_at", { ascending: false });

    if (name) query = query.eq("student_name", name);
    if (userId) query = query.eq("student_id", userId);
    if (pendingOnly) query = query.eq("status", "pending");
    if (since) query = query.gt("assigned_at", since);

    const { data, error } = await query.limit(50);

    if (error) {
        // 테이블 없거나 schema cache 미갱신 시 빈 배열 반환
        if (error.message.includes("schema cache") || error.code === "PGRST204") {
            return NextResponse.json({ homeworks: [], pendingCount: 0, newCount: 0 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        homeworks: data || [],
        pendingCount: (data || []).filter((h: any) => h.status === "pending").length,
        newCount: since ? (data || []).length : undefined,
    });
}

export async function POST(req: NextRequest) {
    // 교사 인증 필수
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { student_name, title, description, content_type, content_url, due_date } = body;

    // 입력 검증
    if (!student_name || !title) {
        return NextResponse.json({ error: "학생 이름과 숙제 제목은 필수입니다" }, { status: 400 });
    }
    if (typeof student_name !== "string" || student_name.length > 20 || /[<>"';&\\]/.test(student_name)) {
        return NextResponse.json({ error: "잘못된 학생 이름" }, { status: 400 });
    }
    if (typeof title !== "string" || title.length > 200) {
        return NextResponse.json({ error: "제목이 너무 깁니다" }, { status: 400 });
    }
    if (description && (typeof description !== "string" || description.length > 2000)) {
        return NextResponse.json({ error: "설명이 너무 깁니다" }, { status: 400 });
    }
    // content_url 검증: http(s)만 허용
    if (content_url && typeof content_url === "string") {
        if (!/^https?:\/\//.test(content_url) || content_url.length > 500) {
            return NextResponse.json({ error: "잘못된 URL" }, { status: 400 });
        }
    }

    // 쓰기 작업은 service_role 사용 (RLS 대비)
    const supabase = createAdminClient() || createClient();
    const { data, error } = await supabase
        .from("student_homework")
        .insert({
            student_name,
            title,
            description: description || null,
            content_type: content_type || "text",
            content_url: content_url || null,
            due_date: due_date || null,
            assigned_by: auth.userId,
            status: "pending",
        })
        .select()
        .single();

    if (error) {
        // 에러 메시지 노출 방지 — 서버 로그만 상세, 클라이언트엔 일반 메시지
        if (process.env.NODE_ENV === "development") console.error("[homework POST]", error);
        return NextResponse.json({ error: "숙제 생성에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ homework: data });
}

export async function PATCH(req: NextRequest) {
    // 교사 인증 필수
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { id, status } = body;

    if (!id) {
        return NextResponse.json({ error: "숙제 ID 필요" }, { status: 400 });
    }

    // status 값 화이트리스트
    const allowedStatuses = ["pending", "completed", "overdue"];
    const finalStatus = allowedStatuses.includes(status) ? status : "completed";

    const supabase = createAdminClient() || createClient();
    const update: { status: string; completed_at?: string } = { status: finalStatus };
    if (finalStatus === "completed") update.completed_at = new Date().toISOString();

    const { error } = await supabase
        .from("student_homework")
        .update(update)
        .eq("id", id);

    if (error) {
        if (process.env.NODE_ENV === "development") console.error("[homework PATCH]", error);
        return NextResponse.json({ error: "숙제 업데이트에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
