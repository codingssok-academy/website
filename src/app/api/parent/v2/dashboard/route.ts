/**
 * /api/parent/v2/dashboard?name=학생이름
 *
 * 학부모 대시보드 통합 API — Supabase + Notion 병렬 fetch
 * profiles, xp_history, user_progress, student_activity_log, student_homework
 *
 * 인증: 학부모 세션 쿠키(studentId↔name 매칭) 또는 교사 supabase auth(role=teacher/admin)
 *       둘 다 없으면 403.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripHtml, truncate } from "@/lib/text-utils";
import { verifyParentSessionToken, PARENT_SESSION_COOKIE } from "@/lib/parent-session";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// jsdom 체인은 text-utils로 끊었음. lazy dynamic import는 매 요청마다 module load
// 4-5초 비용 → static import 복귀. cold start 1-2초 + 그 후 호출 즉시.
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ─── Dashboard response 캐시 (lambda in-memory) ─────────────────────────────
// 같은 학생 30초 cache → 두 번째 호출부터 0ms 응답.
// 학원 학부모 페이지 새로고침 / 탭 전환 시나리오 최적화.
const dashCache = new Map<string, { data: any; ts: number }>();
const DASH_TTL = 30 * 1000;
function getCachedDash(name: string) {
    const entry = dashCache.get(name);
    if (!entry) return null;
    if (Date.now() - entry.ts > DASH_TTL) { dashCache.delete(name); return null; }
    return entry.data;
}
function setCachedDash(name: string, data: any) {
    dashCache.set(name, { data, ts: Date.now() });
    if (dashCache.size > 200) {
        const oldest = [...dashCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
        if (oldest) dashCache.delete(oldest[0]);
    }
}

// createClient는 GET handler 안 lazy dynamic import에서 destructure됨 (scope 격리)
// service client 생성은 handler 진입 후 직접 호출.

const NOTION_KEY = process.env.NOTION_API_KEY || "";
const FEEDBACK_DB = process.env.NOTION_FEEDBACK_DB_ID || "";
const NOTION_HEADERS = {
    "Authorization": `Bearer ${NOTION_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};
const NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
};

type NotionHomeworkResult = {
    feedbacks: { id: string; date: string | null; status: string }[];
    notionHomeworks: {
        id: string;
        source: "notion";
        title: string;
        description: string;
        date: string | null;
        files: { name: string; url: string; type: string }[];
        status: "pending";
    }[];
};

const EMPTY_NOTION_RESULT: NotionHomeworkResult = { feedbacks: [], notionHomeworks: [] };

function getText(richText: any[]): string {
    return (richText || []).map((t: any) => t.plain_text).join("");
}

export async function GET(req: NextRequest) {
    try {
    // 환경변수 빠른 검증 — 누락이면 즉시 명확한 에러
    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({
            error: "서버 설정 오류 (env)",
            missing: {
                NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
                SUPABASE_SERVICE_ROLE_KEY: !supabaseServiceKey,
            },
        }, { status: 500 });
    }

    const name = req.nextUrl.searchParams.get("name")?.trim();

    // 입력 검증: 2~10자 한글/영문만
    if (!name || name.length < 2 || name.length > 10) {
        return NextResponse.json({ error: "학생 이름 필요 (2~10자)" }, { status: 400 });
    }
    if (/[<>"';&\\]/.test(name)) {
        return NextResponse.json({ error: "잘못된 문자 포함" }, { status: 400 });
    }
    const includeNotion = req.nextUrl.searchParams.get("includeNotion") === "1";
    const bypassCache = req.nextUrl.searchParams.get("fresh") === "1" || includeNotion;

    // Rate limit: IP당 1분에 60회 (탭 전환 + 백그라운드 갱신 대응)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    try {
        const { rateLimit } = await import("@/lib/rate-limit");
        const { success } = await rateLimit(`parent-dash:${ip}`, { maxRequests: 60, windowMs: 60_000 });
        if (!success) {
            return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
        }
    } catch { /* ignore */ }

    const sb = createClient(supabaseUrl, supabaseServiceKey);

    // ── 인증: 학부모 세션 또는 교사 supabase auth ──
    let isAuthorized = false;

    // 1) 학부모 세션 — 쿠키의 studentId가 요청한 name의 student와 매칭되어야 함
    const parentToken = req.cookies.get(PARENT_SESSION_COOKIE)?.value;
    const parentSession = parentToken ? verifyParentSessionToken(parentToken) : null;
    if (parentSession?.studentId) {
        const { data: studentProfile } = await sb
            .from("profiles")
            .select("display_name")
            .eq("id", parentSession.studentId)
            .maybeSingle();
        if (studentProfile?.display_name === name) {
            isAuthorized = true;
        }
    }

    // 2) 교사/관리자 — supabase auth + role 확인
    if (!isAuthorized) {
        try {
            const userClient = await createServerSupabase();
            const { data: { user } } = await userClient.auth.getUser();
            if (user) {
                const { data: teacherProfile } = await userClient
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .maybeSingle();
                if (teacherProfile?.role === "teacher" || teacherProfile?.role === "admin") {
                    isAuthorized = true;
                }
            }
        } catch { /* ignore */ }
    }

    if (!isAuthorized) {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // ── Lambda in-memory cache hit (30초) — Supabase 7 query 비용 0 ──
    if (!bypassCache) {
        const cachedDash = getCachedDash(name);
        if (cachedDash) {
            return NextResponse.json(cachedDash, {
                headers: { ...NO_STORE_HEADERS, "X-Cache": "HIT" },
            });
        }
    }

    // 1. Find profile by display_name
    const { data: profiles } = await sb
        .from("profiles")
        .select("id, display_name, total_xp, level, role, avatar_url")
        .eq("display_name", name)
        .limit(1);

    const profile = profiles?.[0] ?? null;
    const userId = profile?.id;

    // 2. Parallel fetch — 기본은 Supabase만. includeNotion=1일 때만 Notion을 후속 조회.
    const [xpResult, progressResult, activityResult, codeResult, announcementResult, notesResult] = await Promise.all([
        // XP history (last 30 days)
        userId
            ? sb.from("xp_history")
                  .select("action_type, xp_amount, created_at")
                  .eq("user_id", userId)
                  .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
                  .order("created_at", { ascending: false })
                  .limit(200)
            : Promise.resolve({ data: [] }),

        // User progress (level, tier, streak)
        userId
            ? sb.from("user_progress")
                  .select("xp, level, streak, best_streak, tier, accuracy, total_code_runs, total_problems, last_active_date, tier_points")
                  .eq("user_id", userId)
                  .single()
            : Promise.resolve({ data: null }),

        // Activity log (학습 활동)
        sb.from("student_activity_log")
          .select("student_name, event_type, course_title, unit_title, page_title, duration_seconds, created_at")
          .eq("student_name", name)
          .order("created_at", { ascending: false })
          .limit(30),

        // 최근 코드 기록
        userId
            ? sb.from("code_submissions")
                  .select("id, language, code, output, status, created_at")
                  .eq("user_id", userId)
                  .order("created_at", { ascending: false })
                  .limit(10)
            : Promise.resolve({ data: [] }),

        // 공지사항 (고정 + 최근)
        sb.from("announcements")
          .select("id, title, content, is_pinned, created_at")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),

        // 학습 노트 개수 (최근 30일)
        userId
            ? sb.from("study_notes")
                  .select("id, updated_at")
                  .eq("user_id", userId)
                  .gte("updated_at", new Date(Date.now() - 30 * 86400000).toISOString())
            : Promise.resolve({ data: [] }),
    ]);

    // XP 통계 계산
    const xpHistory = (xpResult as any)?.data || [];
    const totalXp = xpHistory.reduce((s: number, x: any) => s + (x.xp_amount || 0), 0);
    const todayXp = xpHistory
        .filter((x: any) => x.created_at?.startsWith(new Date().toISOString().slice(0, 10)))
        .reduce((s: number, x: any) => s + (x.xp_amount || 0), 0);

    // 주간 XP (7일)
    const weeklyXp: { date: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        const dayXp = xpHistory
            .filter((x: any) => x.created_at?.startsWith(dateStr))
            .reduce((s: number, x: any) => s + (x.xp_amount || 0), 0);
        weeklyXp.push({ date: dateStr, xp: dayXp });
    }

    // 학습 시간 통계
    const activities = activityResult?.data || [];
    const todayActivities = activities.filter((a: any) =>
        a.created_at?.startsWith(new Date().toISOString().slice(0, 10))
    );
    const todayStudyMinutes = Math.round(
        todayActivities.reduce((s: number, a: any) => s + (a.duration_seconds || 0), 0) / 60
    );
    const totalStudyMinutes = Math.round(
        activities.reduce((s: number, a: any) => s + (a.duration_seconds || 0), 0) / 60
    );

    const progress = (progressResult as any)?.data;
    const notionResult: NotionHomeworkResult = includeNotion
        ? await fetchNotionWithHomework(name, 20)
        : EMPTY_NOTION_RESULT;

    const responseObj = {
        found: !!profile,
        student: profile ? {
            id: profile.id,
            name: profile.display_name,
            totalXp: totalXp || progress?.xp || 0,
            level: progress?.level || profile.level || 1,
            tier: progress?.tier || "Iron",
            streak: progress?.streak || 0,
            bestStreak: progress?.best_streak || 0,
            accuracy: progress?.accuracy || 0,
            totalCodeRuns: progress?.total_code_runs || 0,
            totalProblems: progress?.total_problems || 0,
            lastActive: progress?.last_active_date || null,
        } : null,
        xp: {
            total: totalXp || progress?.xp || 0,
            today: todayXp,
            weekly: weeklyXp,
            history: xpHistory.slice(0, 20),
        },
        activity: {
            todayMinutes: todayStudyMinutes,
            totalMinutes: totalStudyMinutes,
            recent: activities.slice(0, 10),
        },
        feedbacks: notionResult.feedbacks,
        notionHomeworks: notionResult.notionHomeworks,
        announcements: ((announcementResult as any)?.data || []).map((a: any) => ({
            id: a.id,
            title: truncate(stripHtml(a.title || ""), 100),
            content: truncate(stripHtml(a.content || ""), 300),
            isPinned: !!a.is_pinned,
            createdAt: a.created_at,
        })),
        studyNotes: {
            count30d: ((notesResult as any)?.data || []).length,
            latestAt: ((notesResult as any)?.data || [])[0]?.updated_at || null,
        },
        codeHistory: ((codeResult as any)?.data || []).map((c: any) => ({
            id: c.id,
            language: c.language,
            code: c.code?.slice(0, 500) || "",
            output: c.output?.slice(0, 200) || "",
            status: c.status,
            created_at: c.created_at,
        })),
    };
    if (!bypassCache) setCachedDash(name, responseObj);
    return NextResponse.json(responseObj, {
        headers: { ...NO_STORE_HEADERS, "X-Cache": "MISS" },
    });
    } catch (err: any) {
        // 진단용: 500 에러 stack을 Vercel 로그 + 응답 body 양쪽에 남김
        const stack = err?.stack || err?.message || String(err);
        console.error("[parent-v2-dashboard] FATAL:", stack);
        return NextResponse.json({
            error: "대시보드 로딩 실패",
            detail: err?.message || String(err),
            stack: stack.split("\n").slice(0, 8).join("\n"),
            env: {
                url: !!supabaseUrl,
                serviceKey: !!supabaseServiceKey,
                notion: !!NOTION_KEY,
                feedbackDb: !!FEEDBACK_DB,
            },
        }, { status: 500 });
    }
}

async function fetchNotionWithHomework(name: string, limit: number): Promise<NotionHomeworkResult> {
    if (!NOTION_KEY || !FEEDBACK_DB) return EMPTY_NOTION_RESULT;
    return fetchNotionFresh(name, limit);
}

// 노션 fetch 안전망: 5초 timeout 강제 (백그라운드 갱신도 hang 방지)
async function fetchWithTimeout(url: string, init: RequestInit, ms = 5000): Promise<Response> {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    } finally {
        clearTimeout(id);
    }
}

async function fetchNotionFresh(name: string, limit: number): Promise<NotionHomeworkResult> {
    try {
        const res = await fetchWithTimeout(`https://api.notion.com/v1/databases/${FEEDBACK_DB}/query`, {
            method: "POST",
            headers: NOTION_HEADERS,
            body: JSON.stringify({
                filter: { property: "학생 이름", rich_text: { equals: name } },
                sorts: [{ property: "피드백 날짜", direction: "descending" }],
                page_size: limit,
            }),
        }, 5000);
        if (!res.ok) return EMPTY_NOTION_RESULT;
        const data = await res.json();

        const activePages = (data.results || [])
            .filter((p: any) => p.properties["피드백 상태"]?.status?.name !== "시작 전");

        // 피드백 본문 병렬 fetch (과제 섹션 + 첨부파일 추출)
        const details = await Promise.all(
            activePages.slice(0, 5).map(async (p: any) => {
                const blocks = await fetchBlocks(p.id);
                const sections = parseSections(blocks);
                const files = extractFiles(blocks);
                return {
                    id: p.id,
                    date: p.properties["피드백 날짜"]?.date?.start || null,
                    status: p.properties["피드백 상태"]?.status?.name || "시작 전",
                    homework: sections["과제"]?.trim() || "",
                    files,
                };
            })
        );

        const feedbacks = details.map(d => ({
            id: d.id,
            date: d.date,
            status: d.status,
        }));

        // 과제가 있는 피드백만 notionHomeworks로 추출
        const notionHomeworks = details
            .filter(d => d.homework)
            .map(d => ({
                id: `notion-${d.id}`,
                source: "notion" as const,
                title: `수업 과제 (${d.date || "날짜 미지정"})`,
                description: d.homework,
                date: d.date,
                files: d.files,
                status: "pending" as const,
            }));

        return { feedbacks, notionHomeworks };
    } catch {
        return EMPTY_NOTION_RESULT;
    }
}

// Notion block helpers
async function fetchBlocks(pageId: string): Promise<any[]> {
    try {
        const res = await fetchWithTimeout(
            `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
            { headers: NOTION_HEADERS },
            3000
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch {
        return [];
    }
}

function parseSections(blocks: any[]): Record<string, string> {
    const sections: Record<string, string> = {};
    let current = "";
    for (const block of blocks) {
        const type = block.type;
        const text = getText(block[type]?.rich_text);
        if (type === "heading_2" && text) {
            current = text.replace(/^\d+\.\s*/, "").trim();
        } else if (current && text) {
            sections[current] = (sections[current] || "") + text + "\n";
        }
    }
    return sections;
}

function extractFiles(blocks: any[]): { name: string; url: string; type: string }[] {
    const files: { name: string; url: string; type: string }[] = [];
    for (const block of blocks) {
        const type = block.type;
        if (type === "file" || type === "pdf" || type === "image") {
            const d = block[type];
            const url = d?.file?.url || d?.external?.url || "";
            if (url) {
                files.push({
                    name: d?.caption?.[0]?.plain_text || d?.name || (type === "pdf" ? "PDF" : type === "image" ? "이미지" : "첨부파일"),
                    url,
                    type,
                });
            }
        }
    }
    return files;
}
