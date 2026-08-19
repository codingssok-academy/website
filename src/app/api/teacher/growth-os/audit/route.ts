import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type DbRow = Record<string, unknown>;

interface TableRows {
    data: DbRow[];
    error: string | null;
}

interface NotionAuditRow {
    id: string;
    studentName: string;
    status: string | null;
    date: string | null;
    lastEditedTime: string | null;
}

interface NotionAudit {
    configured: boolean;
    feedbackCount: number;
    propertyNames: string[];
    rows: NotionAuditRow[];
    error: string | null;
}

const NOTION_KEY = process.env.NOTION_API_KEY || "";
const FEEDBACK_DB = process.env.NOTION_FEEDBACK_DB_ID || "";
const NOTION_VERSION = "2022-06-28";
const TRACK_IDS = ["공통기초", "A", "B", "C", "D"] as const;
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown) {
    return typeof value === "string" ? value : "";
}

function readText(row: DbRow, key: string) {
    return asText(row[key]).trim();
}

function readNumber(row: DbRow | null | undefined, key: string) {
    const value = row?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeName(value: string) {
    return value.replace(/\s+/g, "").trim().toLowerCase();
}

function isKnownTrack(value: unknown) {
    return TRACK_IDS.includes(value as typeof TRACK_IDS[number]);
}

function isGrowthAdminStudent(row: DbRow) {
    const name = normalizeName(readText(row, "name"));
    const className = normalizeName(readText(row, "class"));
    return className === "admin" || ["장민", "jangmin"].includes(name);
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

function latestDate(values: (string | null)[]) {
    const sorted = values
        .filter(Boolean)
        .map((value) => new Date(value as string).getTime())
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a);

    return sorted[0] ? new Date(sorted[0]).toISOString() : null;
}

function countBy(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const id = readText(row, key);
        if (!id) return acc;
        acc[id] = (acc[id] ?? 0) + 1;
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

function sumBy(rows: DbRow[], key: string, valueKey: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const id = readText(row, key);
        if (!id) return acc;
        acc[id] = (acc[id] ?? 0) + (readNumber(row, valueKey) ?? 0);
        return acc;
    }, {});
}

function latestBy(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, string | null>>((acc, row) => {
        const id = readText(row, key);
        if (!id) return acc;
        acc[id] = latestDate([acc[id] ?? null, readText(row, "created_at") || readText(row, "updated_at") || null]);
        return acc;
    }, {});
}

function latestByName(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, string | null>>((acc, row) => {
        const name = normalizeName(readText(row, key));
        if (!name) return acc;
        acc[name] = latestDate([
            acc[name] ?? null,
            readText(row, "started_at") || readText(row, "created_at") || readText(row, "updated_at") || null,
        ]);
        return acc;
    }, {});
}

function countValue(rows: DbRow[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
        const value = readText(row, key) || "unknown";
        acc[value] = (acc[value] ?? 0) + 1;
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

function richTextToPlain(items: unknown) {
    if (!Array.isArray(items)) return "";
    return items
        .map((item) => isRecord(item) ? asText(item.plain_text) : "")
        .join("")
        .trim();
}

function textFromNotionProperty(property: unknown) {
    if (!isRecord(property)) return "";
    const type = asText(property.type);
    const typedValue = property[type];

    if (type === "title" || type === "rich_text") return richTextToPlain(typedValue);
    if ((type === "select" || type === "status") && isRecord(typedValue)) return asText(typedValue.name);
    if (type === "date" && isRecord(typedValue)) return asText(typedValue.start);
    if (type === "email" || type === "phone_number" || type === "url") return asText(typedValue);
    if (type === "number" && typeof typedValue === "number") return String(typedValue);
    if (type === "checkbox" && typeof typedValue === "boolean") return typedValue ? "true" : "false";

    return "";
}

function pickNotionText(properties: Record<string, unknown>, names: string[]) {
    for (const name of names) {
        const text = textFromNotionProperty(properties[name]);
        if (text) return text;
    }

    for (const value of Object.values(properties)) {
        const text = textFromNotionProperty(value);
        if (text) return text;
    }

    return "";
}

function pickNotionDate(properties: Record<string, unknown>, names: string[], fallback: string | null) {
    for (const name of names) {
        const text = textFromNotionProperty(properties[name]);
        if (text && Number.isFinite(new Date(text).getTime())) return text;
    }

    for (const value of Object.values(properties)) {
        const text = textFromNotionProperty(value);
        if (text && Number.isFinite(new Date(text).getTime())) return text;
    }

    return fallback;
}

async function queryNotionAudit(): Promise<NotionAudit> {
    if (!NOTION_KEY || !FEEDBACK_DB) {
        return { configured: false, feedbackCount: 0, propertyNames: [], rows: [], error: null };
    }

    const rows: NotionAuditRow[] = [];
    let propertyNames: string[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    try {
        while (hasMore && rows.length < 250) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12_000);
            const response = await fetch(`https://api.notion.com/v1/databases/${FEEDBACK_DB}/query`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${NOTION_KEY}`,
                    "Notion-Version": NOTION_VERSION,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    page_size: 100,
                    ...(cursor ? { start_cursor: cursor } : {}),
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                return {
                    configured: true,
                    feedbackCount: rows.length,
                    propertyNames,
                    rows,
                    error: `Notion ${response.status}`,
                };
            }

            const data = await response.json() as Record<string, unknown>;
            const results = Array.isArray(data.results) ? data.results : [];

            for (const item of results) {
                if (!isRecord(item)) continue;
                const properties = isRecord(item.properties) ? item.properties : {};
                if (!propertyNames.length) propertyNames = Object.keys(properties);

                const studentName = pickNotionText(properties, ["학생 이름", "학생명", "이름", "Name", "Student"]);
                const status = pickNotionText(properties, ["피드백 상태", "상태", "Status"]) || null;
                const lastEditedTime = asText(item.last_edited_time) || null;

                rows.push({
                    id: asText(item.id),
                    studentName,
                    status,
                    date: pickNotionDate(properties, ["피드백 날짜", "날짜", "Date"], lastEditedTime),
                    lastEditedTime,
                });
            }

            hasMore = Boolean(data.has_more);
            cursor = typeof data.next_cursor === "string" ? data.next_cursor : null;
        }

        return { configured: true, feedbackCount: rows.length, propertyNames, rows, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { configured: true, feedbackCount: rows.length, propertyNames, rows, error: message };
    }
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
        notion,
    ] = await Promise.all([
        queryRows("students", admin.from("students").select("id,name,school,grade,class,pin,status,auth_user_id,created_at,updated_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("student_diagnostic_results", admin.from("student_diagnostic_results").select("student_id,percent,recommended_track,created_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("lesson_records", admin.from("lesson_records").select("student_id,error_fix_count,created_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("code_submissions", admin.from("code_submissions").select("user_id,status,created_at").order("created_at", { ascending: false }).limit(3000)),
        queryRows("compiler_activities", admin.from("compiler_activities").select("student_id,status,error_message,created_at").order("created_at", { ascending: false }).limit(3000)),
        queryRows("student_activity_log", admin.from("student_activity_log").select("user_id,student_name,course_title,unit_title,page_title,event_type,started_at,created_at").order("started_at", { ascending: false }).limit(5000)),
        queryRows("user_progress", admin.from("user_progress").select("user_id,xp,level,total_code_runs,total_problems,accuracy,updated_at").order("updated_at", { ascending: false }).limit(1000)),
        queryRows("portfolio_records", admin.from("portfolio_records").select("student_id,title,created_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("parent_reports", admin.from("parent_reports").select("student_id,status,created_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("next_lesson_plans", admin.from("next_lesson_plans").select("student_id,topic,created_at").order("created_at", { ascending: false }).limit(1000)),
        queryRows("track_assignments", admin.from("track_assignments").select("student_id,assigned_track,recommended_track,status,updated_at,created_at").order("updated_at", { ascending: false }).limit(1000)),
        queryRows("student_login_events", admin.from("student_login_events").select("student_id,student_name,auth_user_id,event_type,created_at").order("created_at", { ascending: false }).limit(2000)),
        queryNotionAudit(),
    ]);

    const diagnosticsByStudent = countBy(diagnostics.data, "student_id");
    const lessonsByStudent = countBy(lessons.data, "student_id");
    const portfoliosByStudent = countBy(portfolios.data, "student_id");
    const reportsByStudent = countBy(reports.data, "student_id");
    const plansByStudent = countBy(plans.data, "student_id");
    const assignmentsByStudent = countBy(assignments.data, "student_id");
    const loginsByStudent = countBy(loginEvents.data, "student_id");
    const codeSubmissionsByUser = countBy(codeSubmissions.data, "user_id");
    const compilerByUser = countBy(compilerActivities.data, "student_id");
    const activityByName = countByName(studentActivityLogs.data, "student_name");
    const activityByUser = countBy(studentActivityLogs.data, "user_id");
    const loginActivityByName = countByName(
        studentActivityLogs.data.filter((row) => ["login", "signup", "local-preview-login"].includes(readText(row, "event_type"))),
        "student_name",
    );
    const loginActivityByUser = countBy(
        studentActivityLogs.data.filter((row) => ["login", "signup", "local-preview-login"].includes(readText(row, "event_type"))),
        "user_id",
    );
    const progressByUser = userProgress.data.reduce<Record<string, DbRow>>((acc, row) => {
        const userId = readText(row, "user_id");
        if (!userId) return acc;
        const previous = acc[userId];
        const currentAt = new Date(readText(row, "updated_at") || 0).getTime();
        const previousAt = previous ? new Date(readText(previous, "updated_at") || 0).getTime() : 0;
        if (!previous || currentAt >= previousAt) acc[userId] = row;
        return acc;
    }, {});
    const errorFixCounts = sumBy(lessons.data, "student_id", "error_fix_count");

    const latestDiagnostics = latestBy(diagnostics.data, "student_id");
    const latestLessons = latestBy(lessons.data, "student_id");
    const latestLogins = latestBy(loginEvents.data, "student_id");
    const latestAssignments = latestBy(assignments.data, "student_id");
    const latestActivity = latestByName(studentActivityLogs.data, "student_name");

    const notionByName = notion.rows.reduce<Record<string, NotionAuditRow[]>>((acc, row) => {
        const key = normalizeName(row.studentName);
        if (!key) return acc;
        acc[key] = [...(acc[key] ?? []), row];
        return acc;
    }, {});

    const loginEventsByName = loginEvents.data.reduce<Record<string, number>>((acc, row) => {
        const key = normalizeName(readText(row, "student_name"));
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    const targetStudents = students.data.filter((student) => readText(student, "id") && readText(student, "name") && !isGrowthAdminStudent(student));

    const studentRows = targetStudents.map((student) => {
        const id = readText(student, "id");
        const name = readText(student, "name");
        const nameKey = normalizeName(name);
        const authUserId = readText(student, "auth_user_id");
        const progress = authUserId ? progressByUser[authUserId] : undefined;
        const classIsTrack = isKnownTrack(readText(student, "class"));
        const notionRows = notionByName[nameKey] ?? [];
        const loginCount =
            (loginsByStudent[id] ?? 0)
            + (loginEventsByName[nameKey] ?? 0)
            + (authUserId ? (loginActivityByUser[authUserId] ?? 0) : 0)
            + (loginActivityByName[nameKey] ?? 0);
        const hasAuth = Boolean(authUserId);
        const progressDiagnosticCount = progress && ((readNumber(progress, "accuracy") ?? 0) > 0 || (readNumber(progress, "total_problems") ?? 0) > 0) ? 1 : 0;
        const diagnosticCount = (diagnosticsByStudent[id] ?? 0) + progressDiagnosticCount;
        const activityCount = (activityByName[nameKey] ?? 0) + (authUserId ? (activityByUser[authUserId] ?? 0) : 0);
        const lessonCount = (lessonsByStudent[id] ?? 0) + activityCount;
        const codeRuns = Math.max(
            authUserId ? (codeSubmissionsByUser[authUserId] ?? 0) : 0,
            authUserId ? (compilerByUser[authUserId] ?? 0) : 0,
            readNumber(progress, "total_code_runs") ?? 0,
        );
        const assignmentCount = (assignmentsByStudent[id] ?? 0) + (classIsTrack ? 1 : 0);
        const gaps = [
            !hasAuth ? "로그인 auth 연결 없음" : "",
            !loginCount ? "로그인 이벤트 없음" : "",
            !diagnosticCount ? "진단/정확도 기록 없음" : "",
            !lessonCount ? "학습 활동 기록 없음" : "",
            !codeRuns ? "코드 실행 기록 없음" : "",
            !(portfoliosByStudent[id] ?? 0) ? "포트폴리오 없음" : "",
            !(reportsByStudent[id] ?? 0) ? "학부모 리포트 없음" : "",
            !(plansByStudent[id] ?? 0) ? "다음 수업 계획 없음" : "",
            !assignmentCount ? "트랙 배정 없음" : "",
            notion.configured && !notionRows.length ? "Notion 피드백 없음" : "",
        ].filter(Boolean);

        return {
            id,
            name,
            grade: readText(student, "grade") || null,
            class: readText(student, "class") || null,
            school: readText(student, "school") || null,
            status: readText(student, "status") || "unknown",
            hasAuth,
            counts: {
                logins: loginCount,
                diagnostics: diagnosticCount,
                lessons: lessonCount,
                codeRuns,
                errorFixes: (errorFixCounts[id] ?? 0) + compilerActivities.data.filter((row) => (
                    authUserId
                    && readText(row, "student_id") === authUserId
                    && (readText(row, "status") === "error" || Boolean(readText(row, "error_message")))
                )).length,
                activityLogs: activityCount,
                progressRecords: progress ? 1 : 0,
                portfolios: portfoliosByStudent[id] ?? 0,
                reports: reportsByStudent[id] ?? 0,
                plans: plansByStudent[id] ?? 0,
                assignments: assignmentCount,
                notionFeedbacks: notionRows.length,
            },
            latest: {
                login: latestLogins[id] ?? latestActivity[nameKey] ?? null,
                diagnostic: latestDiagnostics[id] ?? null,
                lesson: latestLessons[id] ?? latestActivity[nameKey] ?? null,
                assignment: latestAssignments[id] ?? null,
                notion: latestDate(notionRows.map((row) => row.date)),
            },
            gaps,
        };
    });

    const errors = [
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
        notion.error ? `notion: ${notion.error}` : null,
    ].filter(Boolean) as string[];
    const optionalMissing = errors.filter(isMissingOptionalTableError);
    const visibleErrors = errors.filter((error) => !isMissingOptionalTableError(error));

    return NextResponse.json({
        checkedAt: new Date().toISOString(),
        source: {
            supabase: true,
            notion: {
                configured: notion.configured,
                feedbackCount: notion.feedbackCount,
                propertyNames: notion.propertyNames,
            },
        },
        totals: {
            students: targetStudents.length,
            allStudents: students.data.length,
            adminExcluded: students.data.length - targetStudents.length,
            studentsWithPin: targetStudents.filter((student) => Boolean(readText(student, "pin"))).length,
            diagnosticResults: diagnostics.data.length,
            lessonRecords: lessons.data.length,
            codeSubmissions: codeSubmissions.data.length,
            compilerActivities: compilerActivities.data.length,
            studentActivityLogs: studentActivityLogs.data.length,
            userProgress: userProgress.data.length,
            portfolioRecords: portfolios.data.length,
            parentReports: reports.data.length,
            nextLessonPlans: plans.data.length,
            trackAssignments: assignments.data.length,
            loginEvents: loginEvents.data.length,
            studentsWithDataGaps: studentRows.filter((student) => student.gaps.length > 0).length,
        },
        loginSummary: {
            studentsWithAuth: targetStudents.filter((student) => Boolean(readText(student, "auth_user_id"))).length,
            studentsWithoutAuth: targetStudents.filter((student) => !readText(student, "auth_user_id")).length,
            eventsByType: countValue(loginEvents.data, "event_type"),
            recentEvents: loginEvents.data.slice(0, 20).map((event) => ({
                studentName: readText(event, "student_name"),
                eventType: readText(event, "event_type"),
                createdAt: readText(event, "created_at"),
            })),
            activityEventsByType: countValue(studentActivityLogs.data, "event_type"),
        },
        students: studentRows,
        recentNotionFeedbacks: notion.rows.slice(0, 20).map((row) => ({
            studentName: row.studentName,
            status: row.status,
            date: row.date,
            lastEditedTime: row.lastEditedTime,
        })),
        optionalMissing,
        errors: visibleErrors,
        meta: {
            requestedBy: teacher.userId,
            role: teacher.role,
            privacy: "PIN, 원문 피드백 본문, 파일 URL은 반환하지 않습니다.",
        },
    });
}
