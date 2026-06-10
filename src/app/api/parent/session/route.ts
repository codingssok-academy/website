import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentPin } from "@/lib/parent-auth";
import { createParentSessionToken, setParentSessionCookie } from "@/lib/parent-session";
import { getLinkedStudentNames } from "@/lib/student-family";
import { createNotionStudentId, getNotionParentAccess } from "@/lib/notion-feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
};

type ProfileRow = {
    id: string;
    name: string | null;
    display_name?: string | null;
    email?: string | null;
};

function canonicalStudentName(profile: ProfileRow, fallbackName: string) {
    return (profile.display_name || profile.name || fallbackName).trim();
}

async function loadLinkedProfiles(
    adminClient: NonNullable<ReturnType<typeof createAdminClient>>,
    linkedNames: string[],
    primaryProfile: ProfileRow
) {
    const byId = new Map<string, ProfileRow>();
    byId.set(primaryProfile.id, primaryProfile);

    const [displayResult, nameResult] = await Promise.all([
        adminClient
            .from("profiles")
            .select("id,name,display_name,email")
            .in("display_name", linkedNames),
        adminClient
            .from("profiles")
            .select("id,name,display_name,email")
            .in("name", linkedNames),
    ]);

    for (const profile of [...(displayResult.data || []), ...(nameResult.data || [])] as ProfileRow[]) {
        if (profile.id) byId.set(profile.id, profile);
    }

    return [...byId.values()];
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const studentName = typeof body.name === "string" ? body.name.trim() : "";
        const pin = typeof body.pin === "string" ? body.pin.trim() : "";

        if (studentName.length < 2 || studentName.length > 20 || /[<>"';&\\]/.test(studentName)) {
            return NextResponse.json({ success: false, error: "학생 이름을 확인해주세요." }, { status: 400, headers: NO_STORE_HEADERS });
        }
        if (!/^\d{4,8}$/.test(pin)) {
            return NextResponse.json({ success: false, error: "학부모 인증번호를 확인해주세요." }, { status: 400, headers: NO_STORE_HEADERS });
        }

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        try {
            const { rateLimit } = await import("@/lib/rate-limit");
            const { success } = await rateLimit(`parent-session:${ip}:${studentName}`, { maxRequests: 12, windowMs: 60_000 });
            if (!success) {
                return NextResponse.json({ success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: NO_STORE_HEADERS });
            }
        } catch { /* Redis가 없어도 인증 자체는 계속 진행 */ }

        const notionResult = await getNotionParentAccess(studentName, pin);
        const notionAccess = notionResult.access;
        if (notionAccess) {
            const canonicalName = canonicalStudentName(notionAccess, studentName);
            const allowedStudents = getLinkedStudentNames(canonicalName);
            const token = createParentSessionToken({
                studentId: notionAccess.id,
                studentIds: allowedStudents.map(createNotionStudentId),
                studentNames: allowedStudents,
                parentName: canonicalName,
            });

            const response = NextResponse.json({
                success: true,
                studentName: canonicalName,
                allowedStudents,
            }, { headers: NO_STORE_HEADERS });
            setParentSessionCookie(response, token);
            return response;
        }
        if (notionResult.exists) {
            return NextResponse.json({ success: false, error: "학생 이름 또는 학부모 인증번호가 맞지 않습니다." }, { status: 401, headers: NO_STORE_HEADERS });
        }

        const adminClient = createAdminClient();
        if (adminClient) {
            const profile = await verifyParentPin(adminClient, studentName, pin);
            if (profile) {
                const canonicalName = canonicalStudentName(profile, studentName);
                const allowedStudents = getLinkedStudentNames(canonicalName);
                const linkedProfiles = await loadLinkedProfiles(adminClient, allowedStudents, profile);
                const token = createParentSessionToken({
                    studentId: profile.id,
                    studentIds: linkedProfiles.map(item => item.id),
                    studentNames: allowedStudents,
                    parentName: canonicalName,
                });

                const response = NextResponse.json({
                    success: true,
                    studentName: canonicalName,
                    allowedStudents,
                }, { headers: NO_STORE_HEADERS });
                setParentSessionCookie(response, token);
                return response;
            }
        }

        return NextResponse.json({ success: false, error: "학생 이름 또는 학부모 인증번호가 맞지 않습니다." }, { status: 401, headers: NO_STORE_HEADERS });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        return NextResponse.json({
            success: false,
            error: message.includes("PARENT_SESSION_SECRET")
                ? "서버 설정 오류입니다."
                : message || "학부모 인증 중 오류가 발생했습니다.",
        }, { status: 500, headers: NO_STORE_HEADERS });
    }
}
