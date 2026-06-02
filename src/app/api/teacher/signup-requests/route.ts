/**
 * /api/teacher/signup-requests
 *
 * GET   — 대기 중인 가입 요청 목록
 * POST  — 승인/거부 (action: 'approve' | 'reject')
 *
 * 교사 인증 필수.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth-teacher";

export async function GET() {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ requests: [], pendingCount: 0 });

    // 대기 중인 프로필 (email 컬럼은 profiles에 없을 수 있음 — auth.users에서 별도)
    const { data, error } = await admin
        .from("profiles")
        .select("id, display_name, name, role, birth_date, created_at, approval_status")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        // 디버그: 담당자이 진단할 수 있게 에러 메시지 노출 (profiles 컬럼/RLS 이슈 추적)
        if (process.env.NODE_ENV === "development") console.error("[signup-requests GET]", error);
        return NextResponse.json(
            { error: "조회 실패", detail: error.message, code: error.code, hint: error.hint },
            { status: 500 }
        );
    }

    // auth.users에서 email 보강 (옵션 — Admin API 호출)
    const ids = (data || []).map((p) => p.id);
    let emailMap: Record<string, string> = {};
    if (ids.length > 0) {
        try {
            const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
            emailMap = Object.fromEntries(
                (usersData?.users || [])
                    .filter((u) => ids.includes(u.id) && u.email)
                    .map((u) => [u.id, u.email as string])
            );
        } catch {
            // auth.admin 권한 없거나 실패 — email 없이 진행
        }
    }

    const requests = (data || []).map((p) => ({
        id: p.id,
        name: p.display_name || p.name || "이름 없음",
        role: p.role || "student",
        birthDate: p.birth_date || null,
        createdAt: p.created_at,
        email: emailMap[p.id] || null,
    }));

    return NextResponse.json({
        requests,
        pendingCount: requests.length,
    });
}

export async function POST(req: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { userId, action } = body as { userId?: string; action?: "approve" | "reject" };

    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "userId 필요" }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
        return NextResponse.json({ error: "action은 approve 또는 reject" }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

    try {
        if (action === "approve") {
            await admin.rpc("approve_student", { p_user_id: userId, p_approver_note: null });
        } else {
            await admin.rpc("reject_student", { p_user_id: userId });
        }
    } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[signup-requests POST]", err);
        return NextResponse.json({ error: "처리 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action });
}
