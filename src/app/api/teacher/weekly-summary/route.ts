import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* ────────────────────────────────────────────
   GET /api/teacher/weekly-summary?studentId=xxx
   선생님용 학생 주간 학습 요약 API (Gemini)
   ──────────────────────────────────────────── */

async function requireTeacher(): Promise<
    { error: NextResponse } | { supabase: Awaited<ReturnType<typeof createClient>> }
> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
    }

    const adminClient = createAdminClient();
    const db = adminClient ?? supabase;

    const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
        return { error: NextResponse.json({ error: "선생님 권한이 필요합니다." }, { status: 403 }) };
    }

    return { supabase };
}

const FALLBACK_SUMMARY = "AI 요약 서비스가 일시적으로 이용 불가합니다. 통계 데이터를 직접 확인해주세요.";

export async function GET(req: NextRequest) {
    const authResult = await requireTeacher();
    if ("error" in authResult) return authResult.error;

    const adminClient = createAdminClient();
    const db = adminClient ?? authResult.supabase;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
        return NextResponse.json({ error: "studentId가 필요합니다." }, { status: 400 });
    }

    try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        const weekStartIso = weekStart.toISOString();

        /* ── 1. 학생 기본 정보 ── */
        const { data: student, error: studErr } = await db
            .from("students")
            .select("id, name, grade, class")
            .eq("id", studentId)
            .maybeSingle();

        if (studErr || !student) {
            return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
        }

        /* ── 2. 이번 주 code_submissions 집계 ── */
        const { data: submissions } = await db
            .from("code_submissions")
            .select("problem_id, is_correct, created_at, language")
            .eq("student_id", studentId)
            .gte("created_at", weekStartIso);

        const weekSubmissions = submissions ?? [];
        const totalSolved = weekSubmissions.length;
        const correctCount = weekSubmissions.filter((s) => s.is_correct).length;
        const accuracyRate = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

        // 카테고리별 집계 (problem_id 패턴에서 카테고리 추출)
        const categoryMap: Record<string, { total: number; correct: number }> = {};
        for (const sub of weekSubmissions) {
            // problem_id 형식: "c_pointer_001" → 카테고리: "pointer"
            const parts = (sub.problem_id as string).split("_");
            const cat = parts.length >= 2 ? parts[1] : "기타";
            if (!categoryMap[cat]) categoryMap[cat] = { total: 0, correct: 0 };
            categoryMap[cat].total++;
            if (sub.is_correct) categoryMap[cat].correct++;
        }

        // 가장 많이 푼 카테고리
        const topCategory = Object.entries(categoryMap)
            .sort((a, b) => b[1].total - a[1].total)[0]?.[0] ?? null;

        // 취약 카테고리 (정답률 50% 미만, 2회 이상 시도)
        const weakCategories = Object.entries(categoryMap)
            .filter(([, v]) => v.total >= 2 && v.correct / v.total < 0.5)
            .map(([cat]) => cat);

        /* ── 3. 이번 주 xp_logs 집계 ── */
        const { data: xpLogs } = await db
            .from("xp_logs")
            .select("amount, reason, created_at")
            .eq("user_id", studentId)
            .gte("created_at", weekStartIso);

        const weekXp = (xpLogs ?? []).reduce((sum, l) => sum + (l.amount as number), 0);

        /* ── 4. activity_log 집계 ── */
        const { data: activityLogs } = await db
            .from("activity_log")
            .select("activity_type, created_at")
            .eq("user_id", studentId)
            .gte("created_at", weekStartIso);

        const activeDays = new Set(
            (activityLogs ?? []).map((a) => new Date(a.created_at as string).toDateString())
        ).size;

        /* ── 5. Gemini API로 요약 생성 ── */
        const stats = {
            studentName: student.name,
            grade: student.grade ?? "",
            weekSubmissions: totalSolved,
            correctCount,
            accuracyRate,
            weekXp,
            activeDays,
            topCategory,
            weakCategories,
            categoryBreakdown: Object.fromEntries(
                Object.entries(categoryMap).map(([cat, v]) => [
                    cat,
                    { total: v.total, correct: v.correct, rate: Math.round((v.correct / v.total) * 100) },
                ])
            ),
        };

        let summary = FALLBACK_SUMMARY;
        const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
        const MODEL = process.env.NAVA_MODEL || "qwen2.5-coder:7b";

        {
            const prompt = `다음은 코딩 학습 플랫폼에서 이번 주(최근 7일) ${student.name} 학생의 학습 데이터입니다.

학생: ${student.name}${student.grade ? ` (${student.grade})` : ""}
이번 주 풀이 수: ${totalSolved}문제
정답 수: ${correctCount}문제 (정답률: ${accuracyRate}%)
획득 XP: ${weekXp}
활동일: ${activeDays}일
주로 공부한 카테고리: ${topCategory ?? "없음"}
취약 카테고리: ${weakCategories.length > 0 ? weakCategories.join(", ") : "없음"}

카테고리별 상세:
${Object.entries(categoryMap).map(([cat, v]) => `- ${cat}: ${v.total}문제 시도, ${v.correct}개 정답 (${Math.round((v.correct / v.total) * 100)}%)`).join("\n") || "데이터 없음"}

위 데이터를 바탕으로 2~3문장으로 이번 주 학습 요약을 작성해주세요.
형식: "이번 주 [학생명]은 [활동 내용]을 했고, [성과/문제점]입니다. [간단한 피드백]."
친근하고 긍정적인 톤으로, 한국어로 작성해주세요.`;

            try {
                const res = await fetch(`${OLLAMA_URL}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: MODEL, stream: false,
                        messages: [{ role: "user", content: prompt }],
                        options: { temperature: 0.6, num_predict: 512 },
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const text = data.message?.content;
                    if (text) summary = text.trim();
                } else {
                    console.error("[weekly-summary] Gemini error:", res.status);
                }
            } catch (err) {
                console.error("[weekly-summary] Gemini fetch error:", err);
            }
        }

        return NextResponse.json({ summary, stats });
    } catch (err) {
        console.error("[weekly-summary] Error:", err);
        return NextResponse.json({ error: "주간 요약 생성 중 오류가 발생했습니다." }, { status: 500 });
    }
}
