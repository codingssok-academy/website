import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DbRow = Record<string, unknown>;
type Tone = "blue" | "green" | "purple" | "amber" | "slate";
type TrackId = "공통기초" | "A" | "B" | "C" | "D";

const TRACK_IDS: TrackId[] = ["공통기초", "A", "B", "C", "D"];
const OPTIONAL_GROWTH_TABLES = [
    "student_diagnostic_results",
    "lesson_records",
    "code_submissions",
    "portfolio_records",
    "parent_reports",
    "next_lesson_plans",
    "track_assignments",
    "student_login_events",
] as const;

interface TableRows {
    data: DbRow[];
    error: string | null;
}

function readText(row: DbRow | null | undefined, key: string) {
    const value = row?.[key];
    return typeof value === "string" ? value.trim() : "";
}

function readNumber(row: DbRow | null | undefined, key: string) {
    const value = row?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBool(row: DbRow | null | undefined, key: string) {
    const value = row?.[key];
    return typeof value === "boolean" ? value : false;
}

function readObject(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

function normalizeName(value: string) {
    return value.replace(/\s+/g, "").trim().toLowerCase();
}

function normalizeTrack(value: unknown, fallback: TrackId = "공통기초"): TrackId {
    return TRACK_IDS.includes(value as TrackId) ? value as TrackId : fallback;
}

function getTrackTitle(track: TrackId) {
    if (track === "A") return "A 트랙 · C++/정올";
    if (track === "B") return "B 트랙 · Python/프로젝트";
    if (track === "C") return "C 트랙 · 기초/흥미";
    if (track === "D") return "D 트랙 · 피지컬컴퓨팅";
    return "공통기초";
}

function latestDate(values: (string | null | undefined)[]) {
    const latest = values
        .filter(Boolean)
        .map((value) => new Date(value as string).getTime())
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0];

    return latest ? new Date(latest).toISOString() : null;
}

function relativeTime(value: string | null | undefined) {
    if (!value) return "누적";
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "누적";

    const now = Date.now();
    const diffDays = Math.floor((now - timestamp) / 86_400_000);
    if (diffDays <= 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays <= 7) return "이번 주";
    if (diffDays <= 30) return "이번 달";
    return new Date(value).toLocaleDateString("ko-KR");
}

function isMissingOptionalTableError(error: string | null) {
    if (!error) return false;
    const normalized = error.toLowerCase();
    return OPTIONAL_GROWTH_TABLES.some((table) => (
        normalized.includes(table)
        && (
            normalized.includes("could not find the table")
            || normalized.includes("does not exist")
            || normalized.includes("schema cache")
        )
    ));
}

function countRows(rows: DbRow[]) {
    return rows.length;
}

function sumRows(rows: DbRow[], key: string) {
    return rows.reduce((sum, row) => sum + (readNumber(row, key) ?? 0), 0);
}

function latestRow(rows: DbRow[]) {
    return rows[0] ?? null;
}

async function queryRows(label: string, request: PromiseLike<{ data: unknown[] | null; error: { message?: string } | null }>): Promise<TableRows> {
    try {
        const result = await request;
        if (result.error) return { data: [], error: `${label}: ${result.error.message ?? "query failed"}` };
        return { data: Array.isArray(result.data) ? result.data as DbRow[] : [], error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { data: [], error: `${label}: ${message}` };
    }
}

function buildTimeline(params: {
    lessons: DbRow[];
    activity: DbRow[];
    portfolios: DbRow[];
    reports: DbRow[];
    plans: DbRow[];
    codeSubmissions: DbRow[];
    compilerActivities: DbRow[];
}) {
    const items = [
        ...params.lessons.map((row) => ({
            type: "수업",
            title: readText(row, "title") || "수업 기록",
            desc: readText(row, "execution_result") || readText(row, "feedback") || "수업 기록이 저장되었습니다.",
            time: relativeTime(readText(row, "created_at") || readText(row, "updated_at")),
            tone: "blue" as Tone,
            at: readText(row, "created_at") || readText(row, "updated_at"),
        })),
        ...params.activity.map((row) => ({
            type: "학습",
            title: readText(row, "course_title") || readText(row, "event_type") || "학습 활동",
            desc: [readText(row, "unit_title"), readText(row, "page_title")].filter(Boolean).join(" · ") || "학습 플랫폼 활동 기록",
            time: relativeTime(readText(row, "started_at") || readText(row, "created_at")),
            tone: "green" as Tone,
            at: readText(row, "started_at") || readText(row, "created_at"),
        })),
        ...params.codeSubmissions.map((row) => ({
            type: "코드",
            title: readText(row, "language") ? `${readText(row, "language")} 코드 제출` : "코드 제출",
            desc: readText(row, "status") || "코드 제출 기록",
            time: relativeTime(readText(row, "created_at")),
            tone: "purple" as Tone,
            at: readText(row, "created_at"),
        })),
        ...params.compilerActivities.map((row) => ({
            type: "실행",
            title: readText(row, "language") ? `${readText(row, "language")} 실행` : "코드 실행",
            desc: readText(row, "status") || readText(row, "error_message") || "컴파일러 실행 기록",
            time: relativeTime(readText(row, "created_at")),
            tone: readText(row, "status") === "error" || readText(row, "error_message") ? "amber" as Tone : "green" as Tone,
            at: readText(row, "created_at"),
        })),
        ...params.reports.map((row) => ({
            type: "리포트",
            title: readText(row, "status") === "shared" ? "학부모 공유 완료" : "학부모 리포트 작성",
            desc: readText(row, "next_goal") || readText(row, "summary") || "학부모 리포트 기록",
            time: relativeTime(readText(row, "created_at") || readText(row, "updated_at")),
            tone: "amber" as Tone,
            at: readText(row, "created_at") || readText(row, "updated_at"),
        })),
        ...params.portfolios.map((row) => ({
            type: "포트폴리오",
            title: readText(row, "title") || "포트폴리오 저장",
            desc: readText(row, "representative") || readText(row, "includes") || "성장 기록 저장",
            time: relativeTime(readText(row, "created_at")),
            tone: "slate" as Tone,
            at: readText(row, "created_at"),
        })),
        ...params.plans.map((row) => ({
            type: "다음 계획",
            title: readText(row, "topic") || "다음 수업 계획",
            desc: readText(row, "next_step") || readText(row, "reason") || "다음 수업 추천",
            time: relativeTime(readText(row, "created_at") || readText(row, "updated_at")),
            tone: "blue" as Tone,
            at: readText(row, "created_at") || readText(row, "updated_at"),
        })),
    ];

    return items
        .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
        .slice(0, 5)
        .map(({ at, ...item }) => item);
}

function buildCurriculum(params: {
    track: TrackId;
    lessonCount: number;
    activityCount: number;
    codeRuns: number;
    portfolioCount: number;
    progressPercent: number;
    nextGoal: string;
}) {
    const activeTrackName = params.track === "공통기초" ? "공통기초" : getTrackTitle(params.track);
    const activeRecords = params.lessonCount + params.activityCount + params.codeRuns;

    return [
        {
            name: "공통기초",
            desc: "컴퓨터기초 · 코딩기초 · 사고력",
            stage: params.track === "공통기초" ? "현재 진행 중" : "기초 기록 누적",
            records: `${activeRecords}개`,
            next: params.nextGoal,
            progress: Math.max(5, Math.min(100, params.progressPercent)),
            tone: "blue" as Tone,
        },
        {
            name: activeTrackName === "공통기초" ? "Python" : activeTrackName,
            desc: params.track === "A" ? "구현력 · 알고리즘 입문" : params.track === "D" ? "센서 · 아두이노 · 만들기" : "프로젝트 · 포트폴리오",
            stage: params.track === "공통기초" ? "배정 전" : "배정 완료",
            records: `${Math.max(params.codeRuns, params.portfolioCount)}개`,
            next: params.track === "공통기초" ? "4주 체크 후 트랙 확정" : params.nextGoal,
            progress: params.track === "공통기초" ? 8 : Math.max(12, Math.min(100, params.progressPercent - 8)),
            tone: "purple" as Tone,
        },
        {
            name: "포트폴리오",
            desc: "코드 · 실행 결과 · 피드백",
            stage: params.portfolioCount > 0 ? "대표 기록 보유" : "저장 준비",
            records: `${params.portfolioCount}개`,
            next: params.portfolioCount > 0 ? "대표 기록 고르기" : "첫 성장 기록 저장",
            progress: Math.min(100, params.portfolioCount * 18),
            tone: "green" as Tone,
        },
    ];
}

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ configured: false, student: null, reason: "supabase_env_missing" });
    }

    const authClient = await createServerClient();
    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ configured: true, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json({ configured: true, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
    }

    const { data: student, error: studentError } = await admin
        .from("students")
        .select("id,name,grade,class,status,auth_user_id,created_at,updated_at")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (studentError) {
        return NextResponse.json({ configured: true, error: studentError.message }, { status: 500 });
    }

    if (!student) {
        return NextResponse.json({ configured: true, student: null, error: "연결된 학생 데이터가 없습니다." }, { status: 404 });
    }

    const studentRow = student as DbRow;
    const studentId = readText(studentRow, "id");
    const studentName = readText(studentRow, "name");
    const nameKey = normalizeName(studentName);
    const authUserId = readText(studentRow, "auth_user_id") || user.id;

    const [
        diagnostics,
        lessons,
        codeSubmissions,
        compilerActivities,
        activityLogsByUser,
        activityLogsByName,
        userProgress,
        portfolios,
        reports,
        plans,
        assignments,
        loginEvents,
    ] = await Promise.all([
        queryRows("student_diagnostic_results", admin.from("student_diagnostic_results").select("id,student_id,total_score,max_score,percent,recommended_track,start_stage,area_scores,track_counts,answered_count,created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(20)),
        queryRows("lesson_records", admin.from("lesson_records").select("id,student_id,title,goal,mission,code,execution_result,error_fix_count,feedback,evidence,created_at,updated_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(50)),
        queryRows("code_submissions", admin.from("code_submissions").select("id,user_id,language,code,output,status,created_at").eq("user_id", authUserId).order("created_at", { ascending: false }).limit(50)),
        queryRows("compiler_activities", admin.from("compiler_activities").select("id,student_id,language,status,error_message,created_at").eq("student_id", authUserId).order("created_at", { ascending: false }).limit(200)),
        queryRows("student_activity_log:user", admin.from("student_activity_log").select("id,user_id,student_name,course_title,unit_title,page_title,event_type,started_at,created_at,duration_seconds").eq("user_id", authUserId).order("started_at", { ascending: false }).limit(300)),
        queryRows("student_activity_log:name", admin.from("student_activity_log").select("id,user_id,student_name,course_title,unit_title,page_title,event_type,started_at,created_at,duration_seconds").eq("student_name", studentName).order("started_at", { ascending: false }).limit(300)),
        queryRows("user_progress", admin.from("user_progress").select("user_id,xp,level,streak,best_streak,total_code_runs,total_problems,accuracy,last_active_date,updated_at").eq("user_id", authUserId).limit(1)),
        queryRows("portfolio_records", admin.from("portfolio_records").select("id,student_id,title,includes,representative,is_featured,created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(30)),
        queryRows("parent_reports", admin.from("parent_reports").select("id,student_id,summary,strength,improvement,next_goal,status,shared_at,created_at,updated_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(30)),
        queryRows("next_lesson_plans", admin.from("next_lesson_plans").select("id,student_id,topic,next_step,method,track,reason,status,created_at,updated_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(30)),
        queryRows("track_assignments", admin.from("track_assignments").select("id,student_id,assigned_track,recommended_track,confidence,status,reason,assigned_at,updated_at,created_at").eq("student_id", studentId).order("updated_at", { ascending: false }).limit(1)),
        queryRows("student_login_events", admin.from("student_login_events").select("id,student_id,student_name,auth_user_id,event_type,status,source,created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(50)),
    ]);

    const rawErrors = [
        diagnostics.error,
        lessons.error,
        codeSubmissions.error,
        compilerActivities.error,
        activityLogsByUser.error,
        activityLogsByName.error,
        userProgress.error,
        portfolios.error,
        reports.error,
        plans.error,
        assignments.error,
        loginEvents.error,
    ].filter(Boolean) as string[];
    const errors = rawErrors.filter((error) => !isMissingOptionalTableError(error));
    const optionalMissing = rawErrors.filter(isMissingOptionalTableError);

    const diagnostic = latestRow(diagnostics.data);
    const activityLogs = [
        ...activityLogsByUser.data,
        ...activityLogsByName.data.filter((row) => !activityLogsByUser.data.some((userRow) => readText(userRow, "id") && readText(userRow, "id") === readText(row, "id"))),
    ].sort((a, b) => (
        new Date(readText(b, "started_at") || readText(b, "created_at") || 0).getTime()
        - new Date(readText(a, "started_at") || readText(a, "created_at") || 0).getTime()
    ));
    const assignment = latestRow(assignments.data);
    const progress = latestRow(userProgress.data);
    const report = latestRow(reports.data);
    const plan = latestRow(plans.data);
    const portfolio = latestRow(portfolios.data);
    const lesson = latestRow(lessons.data);
    const classTrack = normalizeTrack(readText(studentRow, "class"));
    const assignedTrack = normalizeTrack(readText(assignment, "assigned_track"), classTrack);
    const recommendedTrack = normalizeTrack(readText(assignment, "recommended_track") || readText(diagnostic, "recommended_track"), assignedTrack);
    const track = assignment || TRACK_IDS.includes(readText(studentRow, "class") as TrackId) ? assignedTrack : classTrack;
    const codeRuns = Math.max(
        countRows(codeSubmissions.data),
        countRows(compilerActivities.data),
        readNumber(progress, "total_code_runs") ?? 0,
    );
    const activityByName = activityLogs.filter((row) => normalizeName(readText(row, "student_name")) === nameKey);
    const activityCount = activityLogs.length || activityByName.length;
    const errorFixes = sumRows(lessons.data, "error_fix_count")
        + compilerActivities.data.filter((row) => readText(row, "status") === "error" || readText(row, "error_message")).length;
    const lessonCount = countRows(lessons.data) + activityCount;
    const reportCount = countRows(reports.data);
    const portfolioCount = countRows(portfolios.data);
    const planCount = countRows(plans.data);
    const diagnosticPercent = readNumber(diagnostic, "percent") ?? Math.round(readNumber(progress, "accuracy") ?? 0);
    const evidenceRecords = [
        diagnosticPercent > 0,
        lessonCount > 0,
        codeRuns > 0,
        errorFixes > 0,
        portfolioCount > 0,
        reportCount > 0,
        planCount > 0,
        countRows(loginEvents.data) > 0,
    ].filter(Boolean).length;
    const completionPercent = Math.min(100, Math.round((evidenceRecords / 8) * 100));
    const growthPercent = Math.max(
        0,
        Math.min(100, Math.round((diagnosticPercent * 0.35) + (completionPercent * 0.45) + Math.min(20, codeRuns + lessonCount))),
    );
    const nextGoal = readText(report, "next_goal")
        || readText(plan, "topic")
        || readText(assignment, "reason")
        || "다음 수업 목표를 선생님이 확정합니다.";
    const lastUpdated = latestDate([
        readText(assignment, "updated_at"),
        readText(assignment, "assigned_at"),
        readText(diagnostic, "created_at"),
        readText(lesson, "created_at"),
        readText(portfolio, "created_at"),
        readText(report, "created_at"),
        readText(plan, "created_at"),
        readText(progress, "updated_at"),
        readText(studentRow, "updated_at"),
    ]);

    return NextResponse.json({
        configured: true,
        checkedAt: new Date().toISOString(),
        student: {
            id: studentId,
            authUserId,
            name: studentName,
            grade: readText(studentRow, "grade") || null,
            track,
            trackTitle: getTrackTitle(track),
            status: readText(studentRow, "status") || null,
        },
        assignment: assignment ? {
            track,
            recommendedTrack,
            confidence: readNumber(assignment, "confidence") ?? null,
            reason: readText(assignment, "reason") || null,
            status: readText(assignment, "status") || null,
            savedAt: readText(assignment, "updated_at") || readText(assignment, "assigned_at") || null,
        } : null,
        diagnostic: diagnostic ? {
            percent: diagnosticPercent,
            total: readNumber(diagnostic, "total_score") ?? 0,
            max: readNumber(diagnostic, "max_score") ?? 0,
            topTrack: readText(diagnostic, "recommended_track") || null,
            startStage: readText(diagnostic, "start_stage") || null,
            areaScore: readObject(diagnostic.area_scores),
            areaMax: {},
            trackCounts: readObject(diagnostic.track_counts),
            answered: readNumber(diagnostic, "answered_count") ?? 0,
            savedAt: readText(diagnostic, "created_at") || null,
        } : null,
        progress: progress ? {
            xp: readNumber(progress, "xp") ?? 0,
            level: readNumber(progress, "level") ?? 1,
            streak: readNumber(progress, "streak") ?? 0,
            accuracy: readNumber(progress, "accuracy") ?? 0,
            totalCodeRuns: readNumber(progress, "total_code_runs") ?? 0,
            totalProblems: readNumber(progress, "total_problems") ?? 0,
            lastActive: readText(progress, "last_active_date") || null,
        } : null,
        summary: {
            lessonRecords: lessonCount,
            storedLessons: countRows(lessons.data),
            activityRecords: activityCount,
            codeRuns,
            errorFixes,
            portfolioRecords: portfolioCount,
            reportRecords: reportCount,
            planRecords: planCount,
            loginRecords: countRows(loginEvents.data),
            evidenceRecords,
            completionPercent,
            growthPercent,
            nextGoal,
            lastUpdated,
        },
        latest: {
            lesson: lesson ? {
                title: readText(lesson, "title") || "수업 기록",
                summary: readText(lesson, "goal") || readText(lesson, "mission") || null,
                code: readText(lesson, "code") || null,
                result: readText(lesson, "execution_result") || null,
                feedback: readText(lesson, "feedback") || null,
                savedAt: readText(lesson, "created_at") || null,
            } : null,
            portfolio: portfolio ? {
                title: readText(portfolio, "title"),
                includes: readText(portfolio, "includes"),
                representative: readText(portfolio, "representative"),
                isFeatured: readBool(portfolio, "is_featured"),
                savedAt: readText(portfolio, "created_at") || null,
            } : null,
            report: report ? {
                summary: readText(report, "summary"),
                strength: readText(report, "strength"),
                improvement: readText(report, "improvement"),
                nextGoal: readText(report, "next_goal"),
                status: readText(report, "status"),
                savedAt: readText(report, "created_at") || readText(report, "updated_at") || null,
            } : null,
            plan: plan ? {
                topic: readText(plan, "topic"),
                next: readText(plan, "next_step"),
                method: readText(plan, "method"),
                track: readText(plan, "track"),
                reason: readText(plan, "reason"),
                status: readText(plan, "status"),
                savedAt: readText(plan, "created_at") || readText(plan, "updated_at") || null,
            } : null,
        },
        timeline: buildTimeline({
            lessons: lessons.data,
            activity: activityLogs,
            portfolios: portfolios.data,
            reports: reports.data,
            plans: plans.data,
            codeSubmissions: codeSubmissions.data,
            compilerActivities: compilerActivities.data,
        }),
        curriculum: buildCurriculum({
            track,
            lessonCount,
            activityCount,
            codeRuns,
            portfolioCount,
            progressPercent: growthPercent,
            nextGoal,
        }),
        source: {
            tables: {
                diagnostics: diagnostics.data.length,
                lessons: lessons.data.length,
                codeSubmissions: codeSubmissions.data.length,
                compilerActivities: compilerActivities.data.length,
                activityLogs: activityLogs.length,
                userProgress: userProgress.data.length,
                portfolios: portfolios.data.length,
                reports: reports.data.length,
                plans: plans.data.length,
                assignments: assignments.data.length,
                loginEvents: loginEvents.data.length,
            },
            optionalMissing,
            errors,
        },
    });
}
