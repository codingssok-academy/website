import { env } from "@/lib/env";
import { normalizeStudentName } from "@/lib/student-family";

const DEFAULT_FEEDBACK_DB_ID = "3279bd0e-91c9-802f-b0bf-e8336861f74c";
const NOTION_VERSION = "2022-06-28";
const STUDENT_NAME_PROPERTY = "학생 이름";
const FEEDBACK_DATE_PROPERTY = "피드백 날짜";
const PARENT_PIN_PROPERTIES = ["학부모 인증번호", "인증번호", "학부모 PIN", "parentPin", "parent_pin"];

interface QueryStudentFeedbackOptions {
    pageSize?: number;
    maxPages?: number;
    timeoutMs?: number;
}

export interface NotionParentAccess {
    id: string;
    name: string;
    display_name: string;
    email: null;
}

export interface NotionParentAccessResult {
    exists: boolean;
    access: NotionParentAccess | null;
}

export function createNotionStudentId(name: string) {
    return `notion:${normalizeStudentName(name)}`;
}

export function isNotionFeedbackConfigured() {
    return Boolean(process.env.NOTION_API_KEY && getNotionFeedbackDatabaseId());
}

function getNotionFeedbackDatabaseId() {
    return process.env.NOTION_FEEDBACK_DB_ID || DEFAULT_FEEDBACK_DB_ID;
}

export function getNotionFeedbackHeaders() {
    return {
        Authorization: `Bearer ${process.env.NOTION_API_KEY || ""}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    };
}

export async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: ac.signal, cache: "no-store" });
    } finally {
        clearTimeout(t);
    }
}

export async function queryNotionFeedbackPagesByStudent(
    studentName: string,
    options: QueryStudentFeedbackOptions = {},
) {
    const notionKey = process.env.NOTION_API_KEY || "";
    const databaseId = getNotionFeedbackDatabaseId();
    if (!notionKey || !databaseId) return [];

    const pageSize = options.pageSize ?? 100;
    const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
    const timeoutMs = options.timeoutMs ?? 5000;
    const pages: any[] = [];
    let cursor: string | undefined;
    let requestedPages = 0;

    do {
        const queryRes = await fetchWithTimeout(
            `https://api.notion.com/v1/databases/${databaseId}/query`,
            {
                method: "POST",
                headers: getNotionFeedbackHeaders(),
                body: JSON.stringify({
                    filter: { property: STUDENT_NAME_PROPERTY, rich_text: { equals: studentName } },
                    sorts: [{ property: FEEDBACK_DATE_PROPERTY, direction: "descending" }],
                    page_size: pageSize,
                    ...(cursor ? { start_cursor: cursor } : {}),
                }),
            },
            timeoutMs,
        );

        if (!queryRes.ok) {
            throw new Error("노션 조회 실패");
        }

        const data = await queryRes.json();
        pages.push(...(data.results || []));
        cursor = data.has_more ? data.next_cursor : undefined;
        requestedPages += 1;
    } while (cursor && requestedPages < maxPages);

    return pages;
}

function getPlainPropertyValue(property: any) {
    if (!property) return "";
    if (property.type === "title") {
        return (property.title || []).map((item: any) => item.plain_text || "").join("").trim();
    }
    if (property.type === "rich_text") {
        return (property.rich_text || []).map((item: any) => item.plain_text || "").join("").trim();
    }
    if (property.type === "number") {
        return property.number == null ? "" : String(property.number).trim();
    }
    if (property.type === "phone_number") {
        return (property.phone_number || "").trim();
    }
    if (property.type === "select") {
        return (property.select?.name || "").trim();
    }
    if (property.type === "status") {
        return (property.status?.name || "").trim();
    }
    return "";
}

function hasMatchingNotionParentPin(page: any, pin: string) {
    return PARENT_PIN_PROPERTIES.some(propertyName =>
        getPlainPropertyValue(page.properties?.[propertyName]) === pin,
    );
}

export async function verifyNotionParentAccess(
    studentName: string,
    pin: string,
): Promise<NotionParentAccess | null> {
    return (await getNotionParentAccess(studentName, pin)).access;
}

export async function getNotionParentAccess(
    studentName: string,
    pin: string,
): Promise<NotionParentAccessResult> {
    const sharedPin = env.PARENT_PORTAL_SHARED_PIN.trim();
    const normalizedName = normalizeStudentName(studentName);
    if (!normalizedName) return { exists: false, access: null };

    const pages = await queryNotionFeedbackPagesByStudent(studentName.trim(), {
        pageSize: 100,
        timeoutMs: 4000,
    });
    if (pages.length === 0) return { exists: false, access: null };

    const matchesNotionPin = pages.some(page => hasMatchingNotionParentPin(page, pin));
    const matchesSharedPin = Boolean(sharedPin && pin === sharedPin);
    if (!matchesNotionPin && !matchesSharedPin) return { exists: true, access: null };

    const displayName = studentName.trim();
    return {
        exists: true,
        access: {
            id: createNotionStudentId(displayName),
            name: displayName,
            display_name: displayName,
            email: null,
        },
    };
}
