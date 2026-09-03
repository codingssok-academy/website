import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyParentPin } from "@/lib/parent-auth";
import {
    PARENT_SESSION_COOKIE,
    clearParentSessionCookie,
    createParentSessionToken,
    setParentSessionCookie,
    verifyParentSessionToken,
} from "@/lib/parent-session";
import { getLinkedStudentNames } from "@/lib/student-family";
import { createNotionStudentId, getNotionParentAccess } from "@/lib/notion-feedback";
import { canParentSessionReadStudent, loadAllowedStudentsByParentPin, normalizeParentAccessName } from "@/lib/parent-session-access";
import { callParentPortalEdge } from "@/lib/parent-edge";
import { canParentSessionReadStudentFromDatabase, hasDatabaseAdmin } from "@/lib/postgres-admin";
import {
    usesHashedStudentAccessCodes,
    verifyHashedStudentAccessCode,
} from "@/lib/student-access-codes";

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

type StudentRow = {
    id: string;
    name: string;
    pin?: string | null;
    status?: string | null;
    auth_user_id?: string | null;
};

function authExpiredResponse(status = 401) {
    const response = NextResponse.json(
        { success: false, error: "학부모 인증이 만료되었거나 변경되었습니다." },
        { status, headers: NO_STORE_HEADERS },
    );
    clearParentSessionCookie(response);
    return response;
}

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get(PARENT_SESSION_COOKIE)?.value;
        const session = verifyParentSessionToken(token);
        if (!session?.studentId) return authExpiredResponse(401);

        const requestedName = req.nextUrl.searchParams.get("name") || session.parentName || session.studentNames?.[0] || "";
        const studentName = normalizeParentAccessName(requestedName);
        if (studentName.length < 2 || studentName.length > 20 || /[<>"';&\\]/.test(studentName)) {
            return authExpiredResponse(401);
        }

        const adminClient = createAdminClient();
        let canRead = false;

        if (usesHashedStudentAccessCodes() && !adminClient) {
            return NextResponse.json(
                { success: false, error: "새 학부모 인증 서버 설정을 확인해주세요." },
                { status: 503, headers: NO_STORE_HEADERS },
            );
        }

        if (adminClient) {
            canRead = await canParentSessionReadStudent(adminClient, session, studentName);
        } else if (hasDatabaseAdmin()) {
            canRead = await canParentSessionReadStudentFromDatabase(
                session.studentId,
                studentName,
                session.parentPin,
                session.studentNames,
            );
        } else {
            const edgeCheck = await callParentPortalEdge<{ success: true; canRead: boolean }>(
                "canRead",
                {
                    name: studentName,
                    studentId: session.studentId,
                    parentPin: session.parentPin,
                    studentNames: session.studentNames,
                },
            );
            canRead = Boolean(edgeCheck.ok && edgeCheck.data.canRead);
        }

        if (!canRead) return authExpiredResponse(403);

        let allowedStudents = session.studentNames?.map(normalizeParentAccessName).filter(Boolean) || [];
        if (adminClient && session.parentPin) {
            const allowed = await loadAllowedStudentsByParentPin(adminClient, session.parentPin, studentName);
            allowedStudents = allowed.studentNames;
        }
        if (allowedStudents.length === 0) allowedStudents = [studentName];

        return NextResponse.json({
            success: true,
            studentName,
            allowedStudents,
        }, { headers: NO_STORE_HEADERS });
    } catch {
        return authExpiredResponse(401);
    }
}

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

        if (usesHashedStudentAccessCodes()) {
            const adminClient = createAdminClient();
            if (!adminClient) {
                return NextResponse.json(
                    { success: false, error: "새 학부모 인증 서버 설정을 확인해주세요." },
                    { status: 503, headers: NO_STORE_HEADERS },
                );
            }

            const verified = await verifyHashedStudentAccessCode(adminClient, {
                studentName,
                purpose: "parent_access",
                code: pin,
            });
            if (verified.length !== 1) {
                return NextResponse.json(
                    { success: false, error: "학생 이름 또는 학부모 인증번호가 맞지 않습니다." },
                    { status: 401, headers: NO_STORE_HEADERS },
                );
            }

            const { data: student, error } = await adminClient
                .from("students")
                .select("id,name,status")
                .eq("id", verified[0].studentId)
                .maybeSingle();
            if (error) throw new Error(error.message);
            if (!student || student.status !== "active") {
                return NextResponse.json(
                    { success: false, error: "학생 이름 또는 학부모 인증번호가 맞지 않습니다." },
                    { status: 401, headers: NO_STORE_HEADERS },
                );
            }

            const canonicalName = normalizeParentAccessName(student.name);
            const token = createParentSessionToken({
                studentId: student.id,
                studentIds: [student.id],
                studentNames: [canonicalName],
                parentName: canonicalName,
            });
            const response = NextResponse.json({
                success: true,
                studentName: canonicalName,
                allowedStudents: [canonicalName],
            }, { headers: NO_STORE_HEADERS });
            setParentSessionCookie(response, token);
            return response;
        }

        const notionResult = await getNotionParentAccess(studentName, pin);
        const notionAccess = notionResult.access;
        if (notionAccess) {
            const canonicalName = canonicalStudentName(notionAccess, studentName);
            const allowedStudents = getLinkedStudentNames(canonicalName);
            const token = createParentSessionToken({
                studentId: notionAccess.id,
                studentIds: allowedStudents.map(createNotionStudentId),
                studentNames: allowedStudents,
                parentPin: pin,
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
            const { data: directStudents, error: directStudentError } = await adminClient
                .from("students")
                .select("id,name,pin,status,auth_user_id")
                .eq("name", studentName)
                .limit(5);
            if (directStudentError) throw new Error(directStudentError.message);

            const matchedStudent = ((directStudents || []) as StudentRow[]).find(student => student.pin === pin);
            if (matchedStudent) {
                if (matchedStudent.status === "deactivated") {
                    return NextResponse.json({ success: false, error: "비활성화된 학생입니다. 선생님에게 문의해주세요." }, { status: 403, headers: NO_STORE_HEADERS });
                }
                const allowed = await loadAllowedStudentsByParentPin(adminClient, pin, studentName);
                const token = createParentSessionToken({
                    studentId: matchedStudent.auth_user_id || matchedStudent.id,
                    studentIds: allowed.studentIds,
                    studentNames: allowed.studentNames,
                    parentPin: pin,
                    parentName: studentName,
                });

                const response = NextResponse.json({
                    success: true,
                    studentName,
                    allowedStudents: allowed.studentNames,
                }, { headers: NO_STORE_HEADERS });
                setParentSessionCookie(response, token);
                return response;
            }

            const profile = await verifyParentPin(adminClient, studentName, pin);
            if (profile) {
                const canonicalName = canonicalStudentName(profile, studentName);
                const allowedByPin = await loadAllowedStudentsByParentPin(adminClient, pin, canonicalName);
                const allowedStudents = allowedByPin.studentNames.length > 0
                    ? allowedByPin.studentNames
                    : getLinkedStudentNames(canonicalName);
                const linkedProfiles = await loadLinkedProfiles(adminClient, allowedStudents, profile);
                const token = createParentSessionToken({
                    studentId: profile.id,
                    studentIds: allowedByPin.studentIds.length > 0 ? allowedByPin.studentIds : linkedProfiles.map(item => item.id),
                    studentNames: allowedStudents,
                    parentPin: pin,
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
