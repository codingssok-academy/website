import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export type GrowthTrackId = "공통기초" | "A" | "B" | "C" | "D";

export interface LocalTrackAssignment {
    studentId: string;
    studentName?: string;
    track: GrowthTrackId;
    recommendedTrack?: GrowthTrackId;
    confidence?: number;
    reason?: string;
    nextGoal?: string;
    reportStatus?: string;
    savedAt: string;
    source?: "local-admin" | "supabase-admin" | "legacy";
}

export interface LocalStudentRecord {
    studentId?: string;
    studentName?: string;
    savedAt?: string;
}

export interface GrowthOsStudentInput {
    name: string;
    grade?: string;
    className?: string;
    school?: string;
    status?: string;
}

export async function ensureGrowthOsStudentId(input?: GrowthOsStudentInput) {
    if (!isSupabaseConfigured()) return null;
    if (!input) return null;
    const name = input.name.trim();
    if (!name) return null;

    const supabase = createClient();
    const { data: existing, error: readError } = await supabase
        .from("students")
        .select("id")
        .eq("name", name)
        .limit(1)
        .maybeSingle();

    if (readError) throw readError;
    if (existing?.id) return String(existing.id);

    const { data: userResult } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from("students")
        .insert({
            name,
            grade: input.grade ?? null,
            class: input.className ?? null,
            school: input.school ?? null,
            status: input.status ?? "active",
            created_by: userResult.user?.id ?? null,
        })
        .select("id")
        .single();

    if (error) throw error;
    return data?.id ? String(data.id) : null;
}

export const TRACK_ASSIGNMENT_STORAGE_KEY = "codingssok_track_assignments";

const TRACK_IDS: GrowthTrackId[] = ["공통기초", "A", "B", "C", "D"];

export function normalizeGrowthTrack(track: unknown, fallback: GrowthTrackId = "공통기초"): GrowthTrackId {
    return TRACK_IDS.includes(track as GrowthTrackId) ? track as GrowthTrackId : fallback;
}

export function getTrackTitle(track: GrowthTrackId) {
    const titles: Record<GrowthTrackId, string> = {
        공통기초: "공통기초",
        A: "A · C++/정올",
        B: "B · Python/프로젝트",
        C: "C · 기초/흥미 회복",
        D: "D · 피지컬컴퓨팅",
    };
    return titles[track];
}

export function readLocalTrackAssignments(): LocalTrackAssignment[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(TRACK_ASSIGNMENT_STORAGE_KEY);
        if (!raw) return [];

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
            .map((item) => ({
                studentId: String(item.studentId ?? ""),
                studentName: typeof item.studentName === "string" ? item.studentName : undefined,
                track: normalizeGrowthTrack(item.track),
                recommendedTrack: item.recommendedTrack ? normalizeGrowthTrack(item.recommendedTrack) : undefined,
                confidence: typeof item.confidence === "number" ? item.confidence : undefined,
                reason: typeof item.reason === "string" ? item.reason : undefined,
                nextGoal: typeof item.nextGoal === "string" ? item.nextGoal : undefined,
                reportStatus: typeof item.reportStatus === "string" ? item.reportStatus : undefined,
                savedAt: typeof item.savedAt === "string" ? item.savedAt : new Date().toISOString(),
                source: typeof item.source === "string" ? item.source as LocalTrackAssignment["source"] : "legacy",
            }))
            .filter((item) => item.studentId.length > 0);
    } catch {
        return [];
    }
}

export function getLocalTrackAssignmentForStudent(studentId: string, studentName?: string) {
    return readLocalTrackAssignments().find((item) => (
        item.studentId === studentId || (studentName ? item.studentName === studentName : false)
    )) ?? null;
}

export function upsertLocalTrackAssignment(input: Omit<LocalTrackAssignment, "savedAt"> & { savedAt?: string }) {
    const assignment: LocalTrackAssignment = {
        ...input,
        track: normalizeGrowthTrack(input.track),
        recommendedTrack: input.recommendedTrack ? normalizeGrowthTrack(input.recommendedTrack) : undefined,
        savedAt: input.savedAt ?? new Date().toISOString(),
    };

    const next = [
        assignment,
        ...readLocalTrackAssignments().filter((item) => item.studentId !== assignment.studentId),
    ];

    if (typeof window !== "undefined") {
        window.localStorage.setItem(TRACK_ASSIGNMENT_STORAGE_KEY, JSON.stringify(next));
    }

    return assignment;
}

export function filterLocalStudentRecords<T extends LocalStudentRecord>(rows: T[], studentId: string, studentName?: string) {
    return rows.filter((row) => (
        !row.studentId
        || row.studentId === studentId
        || (studentName ? row.studentName === studentName : false)
    ));
}

export function pickLocalStudentRecord<T extends LocalStudentRecord>(rows: T[], studentId: string, studentName?: string) {
    return rows.find((row) => (
        row.studentId === studentId || (studentName ? row.studentName === studentName : false)
    )) ?? rows.find((row) => !row.studentId) ?? null;
}

export function upsertLocalStudentRecord<T extends LocalStudentRecord>(key: string, input: T) {
    if (typeof window === "undefined") return input;

    const savedRecord = {
        ...input,
        savedAt: input.savedAt ?? new Date().toISOString(),
    };

    let rows: T[] = [];
    try {
        const raw = window.localStorage.getItem(key);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        rows = Array.isArray(parsed) ? parsed as T[] : [];
    } catch {
        rows = [];
    }

    const next = [
        savedRecord,
        ...rows.filter((row) => (
            input.studentId
                ? row.studentId !== input.studentId
                : row.studentName !== input.studentName
        )),
    ];

    window.localStorage.setItem(key, JSON.stringify(next));
    return savedRecord;
}
