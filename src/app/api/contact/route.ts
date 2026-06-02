import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        // Rate Limiting: IP 기반 시간당 5회 제한
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { success: rateLimitOk } = await rateLimit(`contact:${ip}`, { maxRequests: 5, windowMs: 3600_000 });
        if (!rateLimitOk) {
            return NextResponse.json(
                { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
                { status: 429, headers: { "Retry-After": "3600" } }
            );
        }

        const body = await request.json();
        const { studentName, grade, phone, course, message } = body;

        if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: "학생 이름은 2자 이상이어야 합니다." },
                { status: 400 }
            );
        }

        if (!phone || !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""))) {
            return NextResponse.json(
                { success: false, error: "올바른 전화번호 형식이 아닙니다." },
                { status: 400 }
            );
        }

        if (!course || typeof course !== 'string') {
            return NextResponse.json(
                { success: false, error: "관심 과정을 선택해주세요." },
                { status: 400 }
            );
        }

        // Supabase에 상담 신청 저장
        try {
            const supabase = await createClient();
            const { error } = await supabase.from("contact_submissions").insert({
                name: studentName.trim(),
                grade: grade?.trim() || null,
                phone: phone.replace(/\s/g, ""),
                course: course.trim(),
                message: message?.trim() || null,
            });

            if (error) {
                console.error(`[Contact] Supabase 저장 실패:`, error.message);
            }
        } catch (dbError) {
            // 테이블이 없거나 DB 연결 실패 시 콘솔 폴백
            console.error(`[Contact] DB 저장 실패, 콘솔 폴백:`, dbError);
            console.error(`[Contact] 새 상담 신청 접수 - 과정: ${course}, 시간: ${new Date().toISOString()}`);
        }

        return NextResponse.json({
            success: true,
            message: "상담 신청이 접수되었습니다. 24시간 이내 연락드리겠습니다.",
        });
    } catch {
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
