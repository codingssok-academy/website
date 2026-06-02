import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type DbRow = Record<string, unknown>;
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

function normalizeName(value: string) {
    return value.replace(/\s+/g, "").trim().toLowerCase();
}

function isGrowthAdminStudent(row: DbRow) {
    const name = normalizeName(readText(row, "name"));
    const className = normalizeName(readText(row, "class"));
    return className === "admin" || ["구자현", "장민", "gujahyeon", "gujahyun", "jahyeon"].includes(name);
}

function normalizeTrack(value: unknown, fallback: TrackId = "공통기초"): TrackId {
    return TRACK_IDS.includes(value as TrackId) ? value as TrackId : fallback;
}

function isKnownTrack(value: unknown) {
    return TRACK_IDS.includes(value as TrackId);
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

function latestDate(values: (string | null | undefined)[]) {
    const latest = values
        .filter(Boolean)
        .map((value) => new Date(value as string).getTime())
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0];

    return latest ? new Date(latest).toISOString() : null;
}

function toDisplayDate(value: string | null) {
    if (!value) return "기록 없음";
    return new Date(value).toLocaleDateString("ko-KR");
}

function countBy(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const id = readText(row, key);
        if (!id) return acc;
        acc[id] = (acc[id] ?? 0) + 1;
        return acc;
    }, {});
}

function sumBy(rows: DbRow[], key: string, valueKey: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const id = readText(row, key);
        if (!id) return acc;
        acc[id] = (acc[id] ?? 0) + (readNumber(row, valueKey) ?? 0);
        return acc;
    }, {});
}

function countByName(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const name = normalizeName(readText(row, key));
        if (!name) return acc;
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
    }, {});
}

function latestBy(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, DbRow>>((acc, row) => {
        const id = readText(row, key);
        if (!id) return acc;

        const previous = acc[id];
        const currentAt = latestDate([
            readText(row, "updated_at"),
            readText(row, "assigned_at"),
            readText(row, "created_at"),
        ]);
        const previousAt = previous ? latestDate([
            readText(previous, "updated_at"),
            readText(previous, "assigned_at"),
            readText(previous, "created_at"),
        ]) : null;

        if (!previous || new Date(currentAt ?? 0).getTime() >= new Date(previousAt ?? 0).getTime()) {
            acc[id] = row;
        }
        return acc;
    }, {});
}

async function queryRows(label: string, request: PromiseLike<{ data: unknown[] | null; error: { message?: string } | null }>): Promise<TableRows> {
    try {
        const result = await request;
        if (result.error) {
            return { data: [], error: `${label}: ${result.error.message ?? "query failed"}` };
        }
        return { data: Array.isArray(result.data) ? result.data as DbRow[] : [], error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { data: [], error: `${label}: ${message}` };
    }
}

function buildRows(params: {
    students: DbRow[];
    diagnostics: DbRow[];
    lessons: DbRow[];
    codeSubmissions: DbRow[];
    compilerActivities: DbRow[];
    studentActivityLogs: DbRow[];
    userProgress: DbRow[];
    portfolios: DbRow[];
    reports: DbRow[];
    plans: DbRow[];
    assignments: DbRow[];
    loginEvents: DbRow[];
}) {
    const latestDiagnostic = latestBy(params.diagnostics, "student_id");
    const latestReport = latestBy(params.reports, "student_id");
    const latestPlan = latestBy(params.plans, "student_id");
    const latestAssignment = latestBy(params.assignments, "student_id");
    const latestPortfolio = latestBy(params.portfolios, "student_id");

    const lessonCounts = countBy(params.lessons, "student_id");
    const portfolioCounts = countBy(params.portfolios, "student_id");
    const reportCounts = countBy(params.reports, "student_id");
    const planCounts = countBy(params.plans, "student_id");
    const errorFixCounts = sumBy(params.lessons, "student_id", "error_fix_count");
    const loginCountsByStudent = countBy(params.loginEvents, "student_id");
    const codeCountsByUser = countBy(params.codeSubmissions, "user_id");
    const compilerCountsByProfile = countBy(params.compilerActivities, "student_id");
    const activityCountsByName = countByName(params.studentActivityLogs, "student_name");
    const activityCountsByUser = countBy(params.studentActivityLogs, "user_id");
    const loginActivityCountsByName = countByName(
        params.studentActivityLogs.filter((row) => ["login", "signup", "local-preview-login"].includes(readText(row, "event_type"))),
        "student_name",
    );
    const latestActivityByName = params.studentActivityLogs.reduce<Record<string, string | null>>((acc, row) => {
        const name = normalizeName(readText(row, "student_name"));
        if (!name) return acc;
        acc[name] = latestDate([acc[name], readText(row, "started_at"), readText(row, "created_at")]);
        return acc;
    }, {});
    const progressByUser = latestBy(params.userProgress, "user_id");

    return params.students
        .filter((student) => readText(student, "id") && readText(student, "name"))
        .filter((student) => !isGrowthAdminStudent(student))
        .map((student) => {
            const id = readText(student, "id");
            const name = readText(student, "name");
            const nameKey = normalizeName(name);
            const authUserId = readText(student, "auth_user_id") || null;
            const classValue = readText(student, "class");
            const classIsTrack = isKnownTrack(classValue);
            const progress = authUserId ? progressByUser[authUserId] : undefined;
            const diagnostic = latestDiagnostic[id];
            const assignment = latestAssignment[id];
            const report = latestReport[id];
            const plan = latestPlan[id];
            const portfolio = latestPortfolio[id];
            const diagnosticScore = readNumber(diagnostic, "percent") ?? Math.round(readNumber(progress, "accuracy") ?? 0);
            const currentTrack = classIsTrack ? normalizeTrack(classValue) : "공통기초";
            const recommendedTrack = normalizeTrack(readText(assignment, "recommended_track") || readText(diagnostic, "recommended_track"), currentTrack);
            const assignedTrack = normalizeTrack(readText(assignment, "assigned_track"), currentTrack);
            const hasTrackAssignment = Boolean(assignment || classIsTrack);
            const activityRecords = activityCountsByName[nameKey] ?? (authUserId ? activityCountsByUser[authUserId] ?? 0 : 0);
            const lessonRecords = (lessonCounts[id] ?? 0) + activityRecords;
            const portfolioRecords = portfolioCounts[id] ?? 0;
            const reportRecords = reportCounts[id] ?? 0;
            const planRecords = planCounts[id] ?? 0;
            const codeRuns = Math.max(
                authUserId ? (codeCountsByUser[authUserId] ?? 0) : 0,
                authUserId ? (compilerCountsByProfile[authUserId] ?? 0) : 0,
                readNumber(progress, "total_code_runs") ?? 0,
            );
            const compilerErrors = params.compilerActivities.filter((row) => (
                authUserId
                    && readText(row, "student_id") === authUserId
                    && (readText(row, "status") === "error" || Boolean(readText(row, "error_message")))
            )).length;
            const reportStatus = readText(report, "status") === "shared"
                ? "공유 가능"
                : reportRecords > 0 ? "작성 중" : "초안 필요";
            const nextGoal = readText(report, "next_goal") || readText(plan, "topic") || "다음 목표 입력 필요";
            const lastUpdated = latestDate([
                readText(assignment, "updated_at"),
                readText(assignment, "assigned_at"),
                readText(diagnostic, "created_at"),
                readText(report, "created_at"),
                readText(plan, "created_at"),
                latestActivityByName[nameKey],
                readText(progress, "updated_at"),
                readText(student, "updated_at"),
                readText(student, "created_at"),
            ]);
            const missing = [
                diagnosticScore > 0 ? null : "진단/정확도",
                lessonRecords > 0 ? null : "학습 활동",
                codeRuns > 0 ? null : "코드 실행 기록",
                portfolioRecords > 0 ? null : "포트폴리오",
                reportRecords > 0 ? null : "학부모 리포트",
                planRecords > 0 ? null : "다음 수업 계획",
                hasTrackAssignment ? null : "트랙 배정",
            ].filter(Boolean) as string[];
            const evidence = [
                diagnosticScore > 0 ? "정확도 기록" : null,
                lessonRecords > 0 ? "학습 활동" : null,
                codeRuns > 0 ? "코드 실행" : null,
                (errorFixCounts[id] || compilerErrors) ? "오류 기록" : null,
                portfolioRecords > 0 ? "포트폴리오" : null,
                reportRecords > 0 ? "학부모 리포트" : null,
                planRecords > 0 ? "다음 계획" : null,
                (loginCountsByStudent[id] || loginActivityCountsByName[nameKey]) ? "로그인 기록" : null,
            ].filter(Boolean) as string[];

            return {
                id,
                name,
                grade: readText(student, "grade") || "학년 미입력",
                school: readText(student, "class") || "반 미입력",
                status: readText(assignment, "status") === "assigned"
                    ? "배정 완료"
                    : !hasTrackAssignment ? "배정 필요" : assignedTrack === "공통기초" && recommendedTrack !== "공통기초" ? "배정 필요" : "공통기초 유지",
                currentTrack,
                recommendedTrack,
                assignedTrack,
                confidence: readNumber(assignment, "confidence") ?? diagnosticScore,
                diagnosticScore,
                lessonRecords,
                codeRuns,
                errorFixes: (errorFixCounts[id] ?? 0) + compilerErrors,
                portfolioRecords,
                reportStatus,
                nextGoal,
                loginPin: readText(student, "pin") || null,
                authUserId,
                evidence,
                missing,
                note: readText(assignment, "reason")
                    || readText(portfolio, "title")
                    || (progress ? `레벨 ${readNumber(progress, "level") ?? 1} · XP ${readNumber(progress, "xp") ?? 0}` : "")
                    || "실제 성장 기록을 더 연결해야 합니다.",
                lastUpdated: toDisplayDate(lastUpdated),
            };
        });
}

export async function GET() {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json(
            { error: "Supabase service role environment is missing." },
            { status: 500 },
        );
    }

    const [
        students,
        diagnostics,
        lessons,
        codeSubmissions,
        compilerActivities,
        studentActivityLogs,
        userProgress,
        portfolios,
        reports,
        plans,
        assignments,
        loginEvents,
    ] = await Promise.all([
        queryRows("students", admin.from("students").select("id,name,grade,class,pin,auth_user_id,status,created_at,updated_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("student_diagnostic_results", admin.from("student_diagnostic_results").select("student_id,percent,recommended_track,answered_count,created_at").order("created_at", { ascending: false }).limit(2000)),
        queryRows("lesson_records", admin.from("lesson_records").select("student_id,error_fix_count,created_at").order("created_at", { ascending: false }).limit(3000)),
        queryRows("code_submissions", admin.from("code_submissions").select("user_id,status,created_at").order("created_at", { ascending: false }).limit(3000)),
        queryRows("compiler_activities", admin.from("compiler_activities").select("student_id,status,error_message,created_at").order("created_at", { ascending: false }).limit(3000)),
        queryRows("student_activity_log", admin.from("student_activity_log").select("user_id,student_name,course_title,unit_title,page_title,event_type,started_at,created_at").order("started_at", { ascending: false }).limit(5000)),
        queryRows("user_progress", admin.from("user_progress").select("user_id,xp,level,total_code_runs,total_problems,accuracy,updated_at").order("updated_at", { ascending: false }).limit(1000)),
        queryRows("portfolio_records", admin.from("portfolio_records").select("student_id,title,created_at").order("created_at", { ascending: false }).limit(2000)),
        queryRows("parent_reports", admin.from("parent_reports").select("student_id,status,next_goal,created_at").order("created_at", { ascending: false }).limit(2000)),
        queryRows("next_lesson_plans", admin.from("next_lesson_plans").select("student_id,topic,created_at").order("created_at", { ascending: false }).limit(2000)),
        queryRows("track_assignments", admin.from("track_assignments").select("student_id,assigned_track,recommended_track,confidence,status,reason,assigned_at,updated_at,created_at").order("updated_at", { ascending: false }).limit(2000)),
        queryRows("student_login_events", admin.from("student_login_events").select("student_id,student_name,auth_user_id,event_type,created_at").order("created_at", { ascending: false }).limit(3000)),
    ]);

    const rawErrors = [
        students.error,
        diagnostics.error,
        lessons.error,
        codeSubmissions.error,
        compilerActivities.error,
        studentActivityLogs.error,
        userProgress.error,
        portfolios.error,
        reports.error,
        plans.error,
        assignments.error,
        loginEvents.error,
    ].filter(Boolean) as string[];
    const errors = rawErrors.filter((error) => !isMissingOptionalTableError(error));
    const optionalMissing = rawErrors.filter(isMissingOptionalTableError);

    return NextResponse.json({
        checkedAt: new Date().toISOString(),
        source: { supabase: true, serviceRole: true },
        totals: {
            students: students.data.length,
            diagnostics: diagnostics.data.length,
            lessons: lessons.data.length,
            codeSubmissions: codeSubmissions.data.length,
            compilerActivities: compilerActivities.data.length,
            studentActivityLogs: studentActivityLogs.data.length,
            userProgress: userProgress.data.length,
            portfolios: portfolios.data.length,
            reports: reports.data.length,
            plans: plans.data.length,
            assignments: assignments.data.length,
            loginEvents: loginEvents.data.length,
        },
        optionalMissing,
        students: buildRows({
            students: students.data,
            diagnostics: diagnostics.data,
            lessons: lessons.data,
            codeSubmissions: codeSubmissions.data,
            compilerActivities: compilerActivities.data,
            studentActivityLogs: studentActivityLogs.data,
            userProgress: userProgress.data,
            portfolios: portfolios.data,
            reports: reports.data,
            plans: plans.data,
            assignments: assignments.data,
            loginEvents: loginEvents.data,
        }),
        errors,
    });
}

export async function PATCH(request: NextRequest) {
    const teacher = await requireTeacher();
    if (!teacher.ok) return teacher.response;

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json(
            { error: "Supabase service role environment is missing." },
            { status: 500 },
        );
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    const track = normalizeTrack(body?.track);
    const recommendedTrack = normalizeTrack(body?.recommendedTrack);
    const confidence = typeof body?.confidence === "number" ? body.confidence : 0;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const savedAt = new Date().toISOString();

    if (!studentId) {
        return NextResponse.json({ error: "studentId is required." }, { status: 400 });
    }

    const { error } = await admin.from("track_assignments").upsert({
        student_id: studentId,
        assigned_track: track,
        recommended_track: recommendedTrack,
        confidence,
        status: track === "공통기초" ? "hold" : "assigned",
        reason,
        assigned_by: teacher.userId,
        assigned_at: savedAt,
        updated_at: savedAt,
    }, { onConflict: "student_id" });

    if (error) {
        if (isMissingOptionalTableError(`track_assignments: ${error.message}`)) {
            const { error: studentUpdateError } = await admin
                .from("students")
                .update({ class: track, updated_at: savedAt })
                .eq("id", studentId);

            if (studentUpdateError) {
                return NextResponse.json({ error: studentUpdateError.message }, { status: 500 });
            }

            return NextResponse.json({ ok: true, savedAt, fallback: "students.class" });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedAt });
}
