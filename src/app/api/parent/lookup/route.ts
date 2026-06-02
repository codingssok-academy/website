/**
 * /api/parent/lookup?name=학생이름
 *
 * 노션 피드백 DB에서 해당 학생의 피드백을 가져온다.
 * 로그인 불필요. 학생 이름 매칭만으로 조회.
 *
 * 담당자 명시 "노션 자료 로딩 너무 길어" — 직렬 child block fetch 제거 + 모든 fetch에 timeout.
 */

import { NextRequest, NextResponse } from "next/server";

const NOTION_KEY = process.env.NOTION_API_KEY || "";
const FEEDBACK_DB = "3279bd0e-91c9-802f-b0bf-e8336861f74c";
const HEADERS = {
    "Authorization": `Bearer ${NOTION_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};

const ACTIVE_PAGE_LIMIT = 5;

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
                    page_size: 20,
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

        const activePage = pages
            .slice(0, ACTIVE_PAGE_LIMIT)
            .filter((p: any) => p.properties["피드백 상태"]?.status?.name !== "시작 전");

        // 담당자 명시 '숙제 기능 + 모든 내용 다 없애' — supabase student_homework 쿼리 제거,
        // 노션 피드백의 '과제' section도 응답에서 제외.
        const feedbacks = await Promise.all(
            activePage.map(async (page: any) => {
                const props = page.properties;
                const { sections, files } = await getPageContent(page.id);
                return {
                    id: page.id,
                    date: props["피드백 날짜"]?.date?.start || null,
                    status: props["피드백 상태"]?.status?.name || "시작 전",
                    studentName: getText(props["학생 이름"]?.rich_text),
                    title: getText(props["3.19"]?.title),
                    contentLearned: sections["배운 내용"]?.trim() || "",
                    attitude: sections["수업 태도"]?.trim() || "",
                    understanding: sections["이해도 및 성취도"]?.trim() || "",
                    notes: sections["특이사항"]?.trim() || "",
                    files,
                    url: page.url,
                };
            })
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
