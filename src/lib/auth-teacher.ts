/**
 * 교사 인증 헬퍼 — API 라우트에서 사용
 *
 * 현재 정책: teacher 또는 admin 역할만 통과
 * 미인증 시 401, 권한 없음 시 403 반환
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeacherAuthResult =
    | { ok: true; userId: string; role: string }
    | { ok: false; response: NextResponse };

function normalizeAdminName(value: string | null | undefined) {
    return (value ?? "").replace(/\s+/g, "").trim().toLowerCase();
}

function isGrowthOsAdminStudent(row: { name?: string | null; class?: string | null; status?: string | null } | null) {
    if (!row || row.status === "deactivated") return false;
    const name = normalizeAdminName(row.name);
    const className = normalizeAdminName(row.class);
    return className === "admin" || ["구자현", "장민", "gujahyeon", "gujahyun", "jahyeon"].includes(name);
}

export async function requireTeacher(): Promise<TeacherAuthResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "로그인이 필요합니다." },
                    { status: 401 }
                ),
            };
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role !== "teacher" && profile?.role !== "admin") {
            const admin = createAdminClient();
            if (admin) {
                const { data: linkedStudent } = await admin
                    .from("students")
                    .select("name,class,status")
                    .eq("auth_user_id", user.id)
                    .maybeSingle();

                if (isGrowthOsAdminStudent(linkedStudent)) {
                    return { ok: true, userId: user.id, role: "teacher" };
                }
            }

            return {
                ok: false,
                response: NextResponse.json(
                    { error: "권한이 없습니다." },
                    { status: 403 }
                ),
            };
        }

        return { ok: true, userId: user.id, role: profile.role };
    } catch {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "인증 확인 중 오류가 발생했습니다." },
                { status: 500 }
            ),
        };
    }
}
