/**
 * /api/parent/lookup?name=학생이름
 *
 * 노션 피드백 DB에서 해당 학생의 피드백을 가져온다.
 * 학부모 세션에서 허용된 학생 이름만 조회.
 *
 * 담당자 명시 "노션 자료 로딩 너무 길어" — 직렬 child block fetch 제거 + 모든 fetch에 timeout.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyParentSessionToken, PARENT_SESSION_COOKIE } from "@/lib/parent-session";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeStudentName } from "@/lib/student-family";
import {
    fetchWithTimeout,
    getNotionFeedbackHeaders,
    isNotionFeedbackConfigured,
    queryNotionFeedbackPagesByStudent,
} from "@/lib/notion-feedback";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
};

function jsonNoStore(body: unknown, init?: { status?: number }) {
    return NextResponse.json(body, { ...init, headers: NO_STORE_HEADERS });
}

async function isAuthorizedParentLookup(req: NextRequest, name: string) {
    const requestedName = normalizeStudentName(name);
    const parentToken = req.cookies.get(PARENT_SESSION_COOKIE)?.value;
    const parentSession = parentToken ? verifyParentSessionToken(parentToken) : null;

    if (parentSession?.studentNames?.some(studentName => normalizeStudentName(studentName) === requestedName)) {
        return true;
    }

    if (parentSession?.studentId) {
        const adminClient = createAdminClient();
        if (adminClient) {
            const { data: profile } = await adminClient
                .from("profiles")
                .select("display_name,name")
                .eq("id", parentSession.studentId)
                .maybeSingle();
            const profileName = profile?.display_name || profile?.name || "";
            if (normalizeStudentName(profileName) === requestedName) return true;
        }
    }

    try {
        const userClient = await createServerSupabase();
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) return false;
        const { data: teacherProfile } = await userClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
        return teacherProfile?.role === "teacher" || teacherProfile?.role === "admin";
    } catch {
        return false;
    }
}

function getText(richText: any[]): string {
    return (richText || []).map((t: any) => t.plain_text).join("");
}

interface PageContent {
    sections: Record<string, string>;
    files: { name: string; url: string; type: string }[];
}

const SECTION_HEADING_TYPES = new Set(["heading_1", "heading_2", "heading_3"]);
const LEARNED_SECTION_NAMES = ["배운 내용", "배운내용"];
const HOMEWORK_SECTION_NAMES = ["과제", "숙제", "오늘의 과제"];
const ATTITUDE_SECTION_NAMES = ["수업 태도", "수업태도"];
const UNDERSTANDING_SECTION_NAMES = ["이해도 및 성취도", "이해도", "성취도"];
const NOTES_SECTION_NAMES = ["특이사항", "특이 사항", "전달사항", "전달 사항"];
const KNOWN_SECTION_NAMES = [
    ...LEARNED_SECTION_NAMES,
    ...HOMEWORK_SECTION_NAMES,
    ...ATTITUDE_SECTION_NAMES,
    ...UNDERSTANDING_SECTION_NAMES,
    ...NOTES_SECTION_NAMES,
];

function normalizeSectionTitle(title: string) {
    return title.replace(/\s+/g, "").trim();
}

function findSection(sections: Record<string, string>, candidates: string[]) {
    const normalizedCandidates = candidates.map(normalizeSectionTitle);
    const entry = Object.entries(sections).find(([title]) =>
        normalizedCandidates.includes(normalizeSectionTitle(title))
    );
    return entry?.[1]?.trim() || "";
}

function getExtraSections(sections: Record<string, string>) {
    const knownTitles = new Set(KNOWN_SECTION_NAMES.map(normalizeSectionTitle));
    return Object.entries(sections)
        .map(([title, content]) => ({ title: title.trim(), content: content.trim() }))
        .filter(section => section.title && section.content)
        .filter(section => !knownTitles.has(normalizeSectionTitle(section.title)));
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

async function getPageContent(pageId: string): Promise<PageContent> {
    let res: Response;
    try {
        res = await fetchWithTimeout(
            `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
            { headers: getNotionFeedbackHeaders() },
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
        if (SECTION_HEADING_TYPES.has(type) && text) {
            currentSection = text.replace(/^\d+\.\s*/, "").trim();
        } else if (text) {
            const sectionName = currentSection || "기타 내용";
            sections[sectionName] = (sections[sectionName] || "") + text + "\n";
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

    if (!(await isAuthorizedParentLookup(req, name))) {
        return jsonNoStore({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (!isNotionFeedbackConfigured()) {
        return jsonNoStore({ error: "서비스 일시 중단" }, { status: 503 });
    }

    try {
        const pages = await queryNotionFeedbackPagesByStudent(name);

        if (pages.length === 0) {
            return jsonNoStore({
                found: false,
                message: `"${name}" 학생의 피드백을 찾을 수 없습니다.`,
            });
        }

        const activePage = pages.filter((p: any) => p.properties["피드백 상태"]?.status?.name !== "시작 전");

        // Notion 피드백 본문은 학생 이름을 제외하고 가능한 모든 작성 섹션을 응답한다.
        const feedbacks = await Promise.all(
            activePage.map(async (page: any) => {
                const props = page.properties;
                const { sections, files } = await getPageContent(page.id);
                return {
                    id: page.id,
                    date: props["피드백 날짜"]?.date?.start || null,
                    status: props["피드백 상태"]?.status?.name || "시작 전",
                    title: getText(props["3.19"]?.title),
                    contentLearned: findSection(sections, LEARNED_SECTION_NAMES),
                    homework: findSection(sections, HOMEWORK_SECTION_NAMES),
                    attitude: findSection(sections, ATTITUDE_SECTION_NAMES),
                    understanding: findSection(sections, UNDERSTANDING_SECTION_NAMES),
                    notes: findSection(sections, NOTES_SECTION_NAMES),
                    extraSections: getExtraSections(sections),
                    files,
                    url: page.url,
                };
            })
        );

        return jsonNoStore({
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
