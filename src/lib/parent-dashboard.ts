export type ParentGrowthRecord = {
    id: string;
    currentClass: string | null;
    strengths: string | null;
    currentGoal: string | null;
    classProgress: string | null;
    parentFeedback: string | null;
    recordedAt: string | null;
};

export type ParentAttendance = {
    month: string;
    summary: {
        scheduled: number;
        present: number;
        absent: number;
        makeup: number;
        upcoming: number;
        completed: number;
    };
    records: Array<{
        id: string;
        classDate: string;
        lessonTitle: string;
        status: "scheduled" | "present" | "absent" | "makeup";
    }>;
};

type UnknownRow = Record<string, unknown>;

function readText(row: UnknownRow, key: string, max = 1000) {
    const value = row[key];
    if (typeof value !== "string") return null;
    const clean = value.trim();
    return clean ? clean.slice(0, max) : null;
}

function readNumber(row: UnknownRow, key: string) {
    const value = Number(row[key]);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function toParentGrowthRecord(value: unknown): ParentGrowthRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const row = value as UnknownRow;
    if (readText(row, "status", 20) !== "완료") return null;

    const id = readText(row, "id", 100);
    if (!id) return null;

    return {
        id,
        currentClass: readText(row, "current_class", 100),
        strengths: readText(row, "strengths"),
        currentGoal: readText(row, "current_goal"),
        classProgress: readText(row, "class_progress"),
        parentFeedback: readText(row, "parent_feedback_draft"),
        recordedAt: readText(row, "updated_at", 50) || readText(row, "created_at", 50),
    };
}

export function toParentAttendance(value: unknown): ParentAttendance | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const root = value as UnknownRow;
    const data = root.data;
    const period = root.period;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (!period || typeof period !== "object" || Array.isArray(period)) return null;

    const dataRow = data as UnknownRow;
    const periodRow = period as UnknownRow;
    const summaryValue = dataRow.summary;
    const summaryRow = summaryValue && typeof summaryValue === "object" && !Array.isArray(summaryValue)
        ? summaryValue as UnknownRow
        : {};
    const rawRecords = Array.isArray(dataRow.records) ? dataRow.records : [];
    const allowedStatuses = new Set(["scheduled", "present", "absent", "makeup"]);
    const records = rawRecords.flatMap(record => {
        if (!record || typeof record !== "object" || Array.isArray(record)) return [];
        const row = record as UnknownRow;
        const id = readText(row, "id", 100);
        const classDate = readText(row, "class_date", 20);
        const lessonTitle = readText(row, "lesson_title", 150);
        const status = readText(row, "status", 20);
        if (!id || !classDate || !lessonTitle || !status || !allowedStatuses.has(status)) return [];
        return [{
            id,
            classDate,
            lessonTitle,
            status: status as ParentAttendance["records"][number]["status"],
        }];
    });

    return {
        month: readText(periodRow, "month", 20) || new Date().toISOString().slice(0, 7),
        summary: {
            scheduled: readNumber(summaryRow, "scheduled"),
            present: readNumber(summaryRow, "present"),
            absent: readNumber(summaryRow, "absent"),
            makeup: readNumber(summaryRow, "makeup"),
            upcoming: readNumber(summaryRow, "upcoming"),
            completed: readNumber(summaryRow, "completed"),
        },
        records,
    };
}
