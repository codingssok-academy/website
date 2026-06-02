import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EVENT_TYPES = new Set(["login", "signup", "local-preview-login"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readString(value: unknown, maxLength: number) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function readUuid(value: unknown) {
    const text = readString(value, 80);
    return UUID_RE.test(text) ? text : null;
}

function isMissingOptionalLoginTable(error: string) {
    const normalized = error.toLowerCase();
    return normalized.includes("student_login_events")
        && (
            normalized.includes("could not find the table")
            || normalized.includes("does not exist")
            || normalized.includes("schema cache")
        );
}

function readMetadata(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
            .filter(([, item]) => (
                typeof item === "string" ||
                typeof item === "number" ||
                typeof item === "boolean" ||
                item === null
            ))
            .slice(0, 12),
    );
}

export async function POST(request: NextRequest) {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const studentName = readString(body.studentName, 80);
    const eventType = readString(body.eventType, 32);
    const source = readString(body.source, 32) || "web";

    if (!studentName || !EVENT_TYPES.has(eventType)) {
        return NextResponse.json({ ok: false, error: "Invalid login event" }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json({ ok: true, stored: false, reason: "server_config_missing" });
    }

    const { error } = await admin.from("student_login_events").insert({
        student_id: readUuid(body.studentId),
        auth_user_id: readUuid(body.authUserId),
        student_name: studentName,
        event_type: eventType,
        status: readString(body.status, 24) || "success",
        source,
        metadata: readMetadata(body.metadata),
    });

    if (error) {
        if (isMissingOptionalLoginTable(error.message ?? "")) {
            const { error: fallbackError } = await admin.from("student_activity_log").insert({
                user_id: readString(body.authUserId, 120) || readString(body.studentId, 120) || null,
                student_name: studentName,
                course_title: "로그인",
                unit_title: source,
                page_title: eventType,
                event_type: eventType,
                started_at: new Date().toISOString(),
                duration_seconds: 0,
            });

            if (!fallbackError) {
                return NextResponse.json({ ok: true, stored: true, fallback: "student_activity_log" });
            }

            return NextResponse.json({ ok: false, error: fallbackError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, stored: true });
}
