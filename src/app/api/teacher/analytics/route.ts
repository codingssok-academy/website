import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/* ────────────────────────────────────────────
   GET /api/teacher/analytics
   선생님용 학습 분석 데이터 집계 API
   ──────────────────────────────────────────── */

async function requireTeacher(): Promise<{ error: NextResponse } | { supabase: Awaited<ReturnType<typeof createClient>> }> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) };
    }

    const adminClient = createAdminClient();
    const db = adminClient ?? supabase;
    const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
        return { error: NextResponse.json({ error: '선생님 권한이 필요합니다.' }, { status: 403 }) };
    }

    return { supabase };
}

export async function GET() {
    const authResult = await requireTeacher();
    if ('error' in authResult) return authResult.error;

    try {
        const sb = authResult.supabase;

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 29);
        monthStart.setHours(0, 0, 0, 0);

        /* ── 1. 전체 학생 목록 ── */
        const { data: students, error: studErr } = await sb
            .from("students")
            .select("id, name, auth_user_id, grade, class, created_at")
            .order("name", { ascending: true });

        if (studErr) throw studErr;
        const allStudents = students || [];

        /* 유효 auth_user_id 목록 */
        const userIds = allStudents
            .map((s) => s.auth_user_id)
            .filter(Boolean) as string[];

        /* ── 2. user_progress (XP, level) ── */
        const { data: progRows } = await sb
            .from("user_progress")
            .select("user_id, xp, level, streak")
            .in("user_id", userIds.length ? userIds : ["__none__"]);

        const progressMap = new Map(
            (progRows || []).map((r) => [r.user_id, r])
        );

        /* ── 3. 오늘 접속자 (activity_log) ── */
        const { data: todayActivity } = await sb
            .from("activity_log")
            .select("user_id")
            .in("user_id", userIds.length ? userIds : ["__none__"])
            .gte("created_at", todayStart.toISOString());

        const todayUserSet = new Set(
            (todayActivity || []).map((r) => r.user_id)
        );

        /* ── 4. 이번 주 code_submissions ── */
        const { data: weekSubs } = await sb
            .from("code_submissions")
            .select("user_id, is_correct, created_at, problem_id")
            .in("user_id", userIds.length ? userIds : ["__none__"])
            .gte("created_at", weekStart.toISOString());

        const weekSubsArr = weekSubs || [];

        /* 학생별 이번 주 풀이 수 */
        const weekCountMap = new Map<string, number>();
        const weekCorrectMap = new Map<string, number>();
        weekSubsArr.forEach((r) => {
            weekCountMap.set(r.user_id, (weekCountMap.get(r.user_id) || 0) + 1);
            if (r.is_correct) {
                weekCorrectMap.set(r.user_id, (weekCorrectMap.get(r.user_id) || 0) + 1);
            }
        });

        /* ── 5. 마지막 접속 ── */
        const { data: lastActivity } = await sb
            .from("activity_log")
            .select("user_id, created_at")
            .in("user_id", userIds.length ? userIds : ["__none__"])
            .order("created_at", { ascending: false });

        const lastAccessMap = new Map<string, string>();
        (lastActivity || []).forEach((r) => {
            if (!lastAccessMap.has(r.user_id)) {
                lastAccessMap.set(r.user_id, r.created_at);
            }
        });

        /* ── 6. 카테고리별 정답률 (문제 카테고리 기준) ── */
        const { data: allSubs } = await sb
            .from("code_submissions")
            .select("user_id, is_correct, problem_id, created_at")
            .in("user_id", userIds.length ? userIds : ["__none__"]);

        /* problem_id에서 카테고리 추출 (형식: "category_number" 또는 problemId에 포함) */
        /* study_progress 테이블로 카테고리 집계 */
        const { data: studyRows } = await sb
            .from("study_progress")
            .select("user_id, problem_id, is_correct, category, created_at")
            .in("user_id", userIds.length ? userIds : ["__none__"]);

        const studyArr = studyRows || [];

        /* 전체 카테고리별 집계 */
        const catTotal = new Map<string, number>();
        const catCorrect = new Map<string, number>();
        /* 학생별 카테고리별 집계 */
        const studentCatMap = new Map<string, Map<string, { total: number; correct: number }>>();

        studyArr.forEach((r) => {
            const cat = r.category || "기타";
            catTotal.set(cat, (catTotal.get(cat) || 0) + 1);
            if (r.is_correct) catCorrect.set(cat, (catCorrect.get(cat) || 0) + 1);

            if (!studentCatMap.has(r.user_id)) {
                studentCatMap.set(r.user_id, new Map());
            }
            const cm = studentCatMap.get(r.user_id)!;
            const prev = cm.get(cat) || { total: 0, correct: 0 };
            cm.set(cat, {
                total: prev.total + 1,
                correct: prev.correct + (r.is_correct ? 1 : 0),
            });
        });

        /* code_submissions도 집계 (study_progress 없을 때 fallback) */
        const subsArr = allSubs || [];
        const subsByUser = new Map<string, typeof subsArr>();
        subsArr.forEach((r) => {
            if (!subsByUser.has(r.user_id)) subsByUser.set(r.user_id, []);
            subsByUser.get(r.user_id)!.push(r);
        });

        /* ── 7. 7일 일별 풀이 수 ── */
        const dailyLabels: string[] = [];
        const dailyMap = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            dailyLabels.push(key);
            dailyMap.set(key, 0);
        }
        weekSubsArr.forEach((r) => {
            const day = r.created_at.slice(0, 10);
            if (dailyMap.has(day)) {
                dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
            }
        });
        const weeklyActivity = dailyLabels.map((d) => ({
            date: d,
            label: `${new Date(d).getMonth() + 1}/${new Date(d).getDate()}`,
            count: dailyMap.get(d) || 0,
        }));

        /* ── 8. XP 30일 추이 (xp_logs) ── */
        const { data: xpLogs } = await sb
            .from("xp_logs")
            .select("user_id, amount, created_at")
            .in("user_id", userIds.length ? userIds : ["__none__"])
            .gte("created_at", monthStart.toISOString())
            .order("created_at", { ascending: true });

        const xpLogsByUser = new Map<string, typeof xpLogs>();
        (xpLogs || []).forEach((r) => {
            if (!xpLogsByUser.has(r.user_id)) xpLogsByUser.set(r.user_id, []);
            xpLogsByUser.get(r.user_id)!.push(r);
        });

        /* ── 9. 최근 풀이 기록 (학생별) ── */
        const { data: recentSubs } = await sb
            .from("code_submissions")
            .select("user_id, problem_id, is_correct, created_at")
            .in("user_id", userIds.length ? userIds : ["__none__"])
            .order("created_at", { ascending: false })
            .limit(200);

        const recentByUser = new Map<string, typeof recentSubs>();
        (recentSubs || []).forEach((r) => {
            if (!recentByUser.has(r.user_id)) recentByUser.set(r.user_id, []);
            recentByUser.get(r.user_id)!.push(r);
        });

        /* ── 10. 이번 주 TOP 5 문제 ── */
        const problemCount = new Map<string, number>();
        weekSubsArr.forEach((r) => {
            problemCount.set(r.problem_id, (problemCount.get(r.problem_id) || 0) + 1);
        });
        const top5Problems = [...problemCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ problem_id: id, count }));

        /* ── 11. 학생별 취약 카테고리 ── */
        const getWeakCategory = (userId: string): string | null => {
            const cm = studentCatMap.get(userId);
            if (!cm || cm.size === 0) return null;
            let worstCat: string | null = null;
            let worstRate = Infinity;
            cm.forEach((v, cat) => {
                if (v.total < 2) return;
                const rate = v.correct / v.total;
                if (rate < worstRate) {
                    worstRate = rate;
                    worstCat = cat;
                }
            });
            return worstCat;
        };

        /* ── 12. 학생 목록 조합 ── */
        const totalWeekSubs = weekSubsArr.length;
        const avgXp =
            userIds.length > 0
                ? Math.round(
                      userIds.reduce(
                          (sum, uid) => sum + (progressMap.get(uid)?.xp || 0),
                          0
                      ) / userIds.length
                  )
                : 0;

        const studentList = allStudents.map((s) => {
            const uid = s.auth_user_id;
            const prog = uid ? progressMap.get(uid) : undefined;
            const weekCount = uid ? (weekCountMap.get(uid) || 0) : 0;
            const lastAccess = uid ? (lastAccessMap.get(uid) || null) : null;
            const weakCat = uid ? getWeakCategory(uid) : null;

            /* 학생별 카테고리 정답률 */
            const catData: { category: string; total: number; correct: number; rate: number }[] = [];
            if (uid && studentCatMap.has(uid)) {
                studentCatMap.get(uid)!.forEach((v, cat) => {
                    catData.push({
                        category: cat,
                        total: v.total,
                        correct: v.correct,
                        rate: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
                    });
                });
                catData.sort((a, b) => a.rate - b.rate);
            }

            /* 학생별 7일 활동 */
            const studentWeekly = dailyLabels.map((d) => {
                const count = uid
                    ? weekSubsArr.filter(
                          (r) => r.user_id === uid && r.created_at.slice(0, 10) === d
                      ).length
                    : 0;
                return {
                    date: d,
                    label: `${new Date(d).getMonth() + 1}/${new Date(d).getDate()}`,
                    count,
                };
            });

            /* XP 30일 추이 */
            const xpTrend: { date: string; cumulative: number }[] = [];
            if (uid && xpLogsByUser.has(uid)) {
                let cum = 0;
                const logs = xpLogsByUser.get(uid)!;
                const dayMap = new Map<string, number>();
                logs.forEach((r) => {
                    const day = r.created_at.slice(0, 10);
                    dayMap.set(day, (dayMap.get(day) || 0) + (r.amount || 0));
                });
                for (let i = 29; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    cum += dayMap.get(key) || 0;
                    xpTrend.push({ date: key, cumulative: cum });
                }
            }

            /* 최근 풀이 10개 */
            const recentSubmissions = uid
                ? (recentByUser.get(uid) || []).slice(0, 10).map((r) => ({
                      problem_id: r.problem_id,
                      is_correct: r.is_correct,
                      created_at: r.created_at,
                  }))
                : [];

            return {
                id: s.id,
                auth_user_id: uid || null,
                name: s.name,
                grade: s.grade,
                class: s.class,
                level: prog?.level || 1,
                xp: prog?.xp || 0,
                streak: prog?.streak || 0,
                weekCount,
                lastAccess,
                weakCategory: weakCat,
                isOnlineToday: uid ? todayUserSet.has(uid) : false,
                categoryStats: catData,
                weeklyActivity: studentWeekly,
                xpTrend,
                recentSubmissions,
            };
        });

        /* ── 13. 전체 카테고리 분석 ── */
        const globalCategoryStats = [...catTotal.entries()].map(([cat, total]) => ({
            category: cat,
            total,
            correct: catCorrect.get(cat) || 0,
            rate: total > 0 ? Math.round(((catCorrect.get(cat) || 0) / total) * 100) : 0,
        })).sort((a, b) => a.rate - b.rate);

        return NextResponse.json({
            summary: {
                totalStudents: allStudents.length,
                todayOnline: todayUserSet.size,
                weekSubmissions: totalWeekSubs,
                avgXp,
            },
            students: studentList,
            weeklyActivity,
            globalCategoryStats,
            top5Problems,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
