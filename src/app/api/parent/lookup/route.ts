/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * /api/parent/lookup?name=학생이름
 *
 * 노션 피드백 DB에서 해당 학생의 피드백을 가져온다.
 * 로그인 불필요. 학생 이름 매칭만으로 조회.
 *
 * 자현 명시 "노션 자료 로딩 너무 길어" — 직렬 child block fetch 제거 + 모든 fetch에 timeout.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { PIN_COURSE } from "@/lib/parent-auth";
import { PARENT_SESSION_COOKIE, verifyParentSessionToken } from "@/lib/parent-session";
import { findReferenceParentCode } from "@/lib/parent-code-reference";
import { callParentPortalEdge } from "@/lib/parent-edge";
import { canParentSessionReadStudentFromDatabase, hasDatabaseAdmin } from "@/lib/postgres-admin";

const NOTION_KEY = process.env.NOTION_API_KEY || "";
const FEEDBACK_DB = "3279bd0e-91c9-802f-b0bf-e8336861f74c";
const HEADERS = {
    "Authorization": `Bearer ${NOTION_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};

const DETAIL_CONCURRENCY = 5;

function isLocalRequest(req: NextRequest) {
    const host = req.headers.get("host") || "";
    return host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("[::1]:");
}

async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: ac.signal });
    } finally {
        clearTimeout(t);
    }
}

function getText(richText: any[]): string {
    return (richText || []).map((t: any) => t.plain_text).join("");
}

function getFirstSection(sections: Record<string, string>, names: string[]) {
    for (const name of names) {
        const value = sections[name]?.trim();
        if (value) return value;
    }
    return "";
}

async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
) {
    const results: R[] = [];
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await mapper(items[index], index);
        }
    });
    await Promise.all(workers);
    return results;
}

interface PageContent {
    sections: Record<string, string>;
    files: { name: string; url: string; type: string }[];
}

function extractFile(block: any): { name: string; url: string; type: string } | null {
    const type = block.type;
    if (type === "file") {
        const d = block.file;
        const url = d?.file?.url || d?.external?.url || "";
        return url ? { name: d?.name || "첨부파일", url, type: "file" } : null;
    }
    if (type === "pdf") {
        const d = block.pdf;
        const url = d?.file?.url || d?.external?.url || "";
        return url ? { name: d?.caption?.[0]?.plain_text || "PDF", url, type: "pdf" } : null;
    }
    if (type === "image") {
        const d = block.image;
        const url = d?.file?.url || d?.external?.url || "";
        return url ? { name: d?.caption?.[0]?.plain_text || "이미지", url, type: "image" } : null;
    }
    return null;
}

async function canReadStudentFeedback(req: NextRequest, name: string) {
    const parentToken = req.cookies.get(PARENT_SESSION_COOKIE)?.value;
    const parentSession = parentToken ? verifyParentSessionToken(parentToken) : null;
    const adminClient = createAdminClient();

    if (
        isLocalRequest(req) &&
        (!createAdminClient() || parentSession?.studentId === `reference:${name}`) &&
        findReferenceParentCode(name)
    ) {
        return true;
    }

    if (parentSession?.studentId) {
        if (adminClient) {
            const [profileRes, studentRes, pinRes] = await Promise.all([
                adminClient
                    .from("profiles")
                    .select("name, display_name")
                    .eq("id", parentSession.studentId)
                    .maybeSingle(),
                adminClient
                    .from("students")
                    .select("id, name, pin, auth_user_id")
                    .or(`id.eq.${parentSession.studentId},auth_user_id.eq.${parentSession.studentId}`)
                    .limit(5),
                adminClient
                    .from("study_progress")
                    .select("completed_units")
                    .eq("user_id", parentSession.studentId)
                    .eq("course_id", PIN_COURSE)
                    .maybeSingle(),
            ]);

            const profileName = profileRes.data?.display_name || profileRes.data?.name || "";
            const matchingStudent = (studentRes.data || []).find((student: any) => student.name === name);
            const hasActiveStudentPin = Boolean(matchingStudent?.pin);
            const hasActiveProgressPin = Boolean(pinRes.data?.completed_units?.[0]);

            if ((profileName === name && hasActiveProgressPin) || (matchingStudent && hasActiveStudentPin)) {
                return true;
            }
        }

        if (!adminClient && hasDatabaseAdmin()) {
            return canParentSessionReadStudentFromDatabase(parentSession.studentId, name);
        }

        if (!adminClient && !hasDatabaseAdmin()) {
            const edgeCheck = await callParentPortalEdge<{ success: true; canRead: boolean }>(
                "canRead",
                { name, studentId: parentSession.studentId },
            );
            if (edgeCheck.ok && edgeCheck.data.canRead) return true;
        }
    }

    try {
        const supabase = await createServerSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
        return profile?.role === "teacher" || profile?.role === "admin";
    } catch {
        return false;
    }
}

async function getPageContent(pageId: string): Promise<PageContent> {
    let res: Response;
    try {
        res = await fetchWithTimeout(
            `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
            { headers: HEADERS },
            3500,
        );
    } catch {
        return { sections: {}, files: [] };
    }
    if (!res.ok) return { sections: {}, files: [] };
    const data = await res.json();

    const sections: Record<string, string> = {};
    const files: { name: string; url: string; type: string }[] = [];
    let currentSection = "";

    for (const block of data.results || []) {
        const type = block.type;

        const text = getText(block[type]?.rich_text);
        if (type === "heading_2" && text) {
            currentSection = text.replace(/^\d+\.\s*/, "").trim();
        } else if (currentSection && text) {
            sections[currentSection] = (sections[currentSection] || "") + text + "\n";
        }

        const file = extractFile(block);
        if (file) files.push(file);
    }

    return { sections, files };
}

export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get("name")?.trim();

    if (!name || name.length < 2) {
        return NextResponse.json({ error: "학생 이름을 입력해주세요 (2글자 이상)" }, { status: 400 });
    }
    if (name.length > 20 || /[<>"';&\\]/.test(name)) {
        return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    try {
        const { rateLimit } = await import("@/lib/rate-limit");
        const { success } = await rateLimit(`parent-lookup:${ip}`, { maxRequests: 30, windowMs: 60_000 });
        if (!success) {
            return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
        }
    } catch { /* Redis 없어도 동작 */ }

    const authorized = await canReadStudentFeedback(req, name);
    if (!authorized) {
        return NextResponse.json({ error: "학부모 인증이 필요합니다." }, { status: 403 });
    }

    if (!NOTION_KEY) {
        return NextResponse.json({ error: "서비스 일시 중단" }, { status: 503 });
    }

    try {
        const queryRes = await fetchWithTimeout(
            `https://api.notion.com/v1/databases/${FEEDBACK_DB}/query`,
            {
                method: "POST",
                headers: HEADERS,
                body: JSON.stringify({
                    filter: { property: "학생 이름", rich_text: { equals: name } },
                    sorts: [{ property: "피드백 날짜", direction: "descending" }],
                    page_size: 100,
                }),
            },
            5000,
        );

        if (!queryRes.ok) {
            return NextResponse.json({ error: "노션 조회 실패" }, { status: 502 });
        }

        const queryData = await queryRes.json();
        const pages = queryData.results || [];

        if (pages.length === 0) {
            return NextResponse.json({
                found: false,
                message: `"${name}" 학생의 피드백을 찾을 수 없습니다.`,
            });
        }

        const activePages = pages
            .filter((p: any) => p.properties["피드백 상태"]?.status?.name !== "시작 전");

        const feedbacks = await mapWithConcurrency(
            activePages,
            DETAIL_CONCURRENCY,
            async (page: any) => {
                const props = page.properties;
                const { sections, files } = await getPageContent(page.id);
                return {
                    id: page.id,
                    date: props["피드백 날짜"]?.date?.start || null,
                    status: props["피드백 상태"]?.status?.name || "시작 전",
                    studentName: getText(props["학생 이름"]?.rich_text),
                    title: getText(props["3.19"]?.title),
                    contentLearned: getFirstSection(sections, ["배운 내용", "학습 내용", "수업 내용"]),
                    homework: getFirstSection(sections, ["과제", "숙제", "다음 과제"]),
                    attitude: getFirstSection(sections, ["수업 태도", "태도"]),
                    understanding: getFirstSection(sections, ["이해도 및 성취도", "이해도", "성취도"]),
                    notes: getFirstSection(sections, ["특이사항", "특이 사항", "비고"]),
                    files,
                    url: page.url,
                };
            },
        );

        return NextResponse.json({
            found: true,
            studentName: name,
            totalFeedbacks: pages.filter((p: any) => p.properties["피드백 상태"]?.status?.name === "완료").length,
            feedbacks,
        });
    } catch (err: any) {
        if (err?.name === "AbortError") {
            return NextResponse.json({ error: "노션 응답 지연 — 잠시 후 다시 시도해주세요" }, { status: 504 });
        }
        return NextResponse.json({ error: "조회 중 오류" }, { status: 500 });
    }
}
