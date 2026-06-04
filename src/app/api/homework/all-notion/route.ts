/**
 * GET /api/homework/all-notion
 * 전체 학생의 Notion 피드백에서 과제 섹션 추출 (교사 전용)
 *
 * 인증: supabase auth + role=teacher/admin
 * 캐시: 없음. Notion 운영 데이터는 요청마다 최신 조회.
 */

import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NOTION_KEY = process.env.NOTION_API_KEY || "";
const FEEDBACK_DB = process.env.NOTION_FEEDBACK_DB_ID || "";
const HEADERS = {
    "Authorization": `Bearer ${NOTION_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};
const NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
};

function getText(richText: any[]): string {
    return (richText || []).map((t: any) => t.plain_text).join("");
}

export async function GET() {
    // ── 인증: 교사/관리자만 ──
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
    if (profile?.role !== "teacher" && profile?.role !== "admin") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (!NOTION_KEY || !FEEDBACK_DB) {
        return NextResponse.json({ homeworks: [] }, { headers: NO_STORE_HEADERS });
    }

    const result = await fetchAllNotionFresh();
    return NextResponse.json(result, {
        headers: NO_STORE_HEADERS,
    });
}

async function fetchAllNotionFresh() {
    if (!NOTION_KEY || !FEEDBACK_DB) return { homeworks: [] };

    try {
        // 최근 피드백 20건 (전체 학생)
        const res = await fetch(`https://api.notion.com/v1/databases/${FEEDBACK_DB}/query`, {
            method: "POST",
            headers: HEADERS,
            cache: "no-store",
            body: JSON.stringify({
                filter: { property: "피드백 상태", status: { equals: "완료" } },
                sorts: [{ property: "피드백 날짜", direction: "descending" }],
                page_size: 20,
            }),
        });

        if (!res.ok) return { homeworks: [] };
        const data = await res.json();

        // 각 피드백의 과제 섹션 병렬 추출
        const homeworks = await Promise.all(
            (data.results || []).map(async (page: any) => {
                const props = page.properties;
                const studentName = getText(props["학생 이름"]?.rich_text);
                const date = props["피드백 날짜"]?.date?.start || null;

                if (!studentName) return null;

                try {
                    const blockRes = await fetch(
                        `https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`,
                        { headers: HEADERS, cache: "no-store" }
                    );
                    if (!blockRes.ok) return null;
                    const blockData = await blockRes.json();

                    let inHomework = false;
                    let homeworkText = "";
                    const files: { name: string; url: string; type: string }[] = [];

                    for (const block of blockData.results || []) {
                        const type = block.type;
                        const text = getText(block[type]?.rich_text);

                        if (type === "heading_2") {
                            const heading = text.replace(/^\d+\.\s*/, "").trim();
                            inHomework = heading === "과제";
                            if (!inHomework) continue;
                        }

                        if (inHomework && text) {
                            homeworkText += text + "\n";
                        }

                        if (type === "file" || type === "pdf" || type === "image") {
                            const d = block[type];
                            const url = d?.file?.url || d?.external?.url || "";
                            if (url) {
                                files.push({
                                    name: d?.caption?.[0]?.plain_text || d?.name || type,
                                    url,
                                    type,
                                });
                            }
                        }
                    }

                    if (!homeworkText.trim()) return null;

                    return {
                        id: `notion-${page.id}`,
                        student_name: studentName,
                        title: `수업 과제 (${date || "날짜 미지정"})`,
                        description: homeworkText.trim(),
                        date,
                        files,
                    };
                } catch {
                    return null;
                }
            })
        );

        const result = { homeworks: homeworks.filter(Boolean) };
        return result;
    } catch {
        return { homeworks: [] };
    }
}
