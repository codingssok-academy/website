export const LEARNING_REVIEW_REQUEST_PREFIX = "[선생님 확인 필요]";

const MAX_LABEL_LENGTH = 120;
const MAX_NOTE_LENGTH = 300;

export interface LearningReviewRequest {
    courseId: string;
    unitId: string;
    pageId: string;
    courseTitle: string;
    unitTitle: string;
    pageTitle: string;
    note: string;
    href: string;
}

function cleanLine(value: string, maxLength: number) {
    return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function buildLearningReviewRequest(input: Omit<LearningReviewRequest, "href">) {
    const courseId = cleanLine(input.courseId, 100);
    const unitId = cleanLine(input.unitId, 120);
    const pageId = cleanLine(input.pageId, 120);
    if (!courseId || !unitId || !pageId) return "";

    const courseTitle = cleanLine(input.courseTitle, MAX_LABEL_LENGTH) || "수업";
    const unitTitle = cleanLine(input.unitTitle, MAX_LABEL_LENGTH) || "학습 단원";
    const pageTitle = cleanLine(input.pageTitle, MAX_LABEL_LENGTH) || "학습 화면";
    const note = cleanLine(input.note, MAX_NOTE_LENGTH) || "이 화면을 다시 천천히 확인해 보세요.";
    const params = new URLSearchParams({ unit: unitId, page: pageId });
    const href = `/dashboard/learning/courses/${encodeURIComponent(courseId)}?${params.toString()}`;

    return [
        LEARNING_REVIEW_REQUEST_PREFIX,
        `학습 위치: ${courseTitle} > ${unitTitle} > ${pageTitle}`,
        `다시 볼 주소: ${href}`,
        `선생님 말씀: ${note}`,
    ].join("\n");
}

export function parseLearningReviewRequest(content: string): LearningReviewRequest | null {
    if (!content.trimStart().startsWith(LEARNING_REVIEW_REQUEST_PREFIX)) return null;

    const lines = content.split(/\r?\n/);
    const locationLine = lines.find(line => line.startsWith("학습 위치:"));
    const hrefLine = lines.find(line => line.startsWith("다시 볼 주소:"));
    const noteLine = lines.find(line => line.startsWith("선생님 말씀:"));
    if (!locationLine || !hrefLine) return null;

    const href = hrefLine.slice("다시 볼 주소:".length).trim();
    let url: URL;
    try {
        url = new URL(href, "https://codingssok.local");
    } catch {
        return null;
    }

    const pathMatch = url.pathname.match(/^\/dashboard\/learning\/courses\/([^/]+)$/);
    const unitId = url.searchParams.get("unit") || "";
    const pageId = url.searchParams.get("page") || "";
    if (!pathMatch || !unitId || !pageId || url.origin !== "https://codingssok.local") return null;

    const labels = locationLine
        .slice("학습 위치:".length)
        .split(" > ")
        .map(label => cleanLine(label, MAX_LABEL_LENGTH));
    if (labels.length !== 3 || labels.some(label => !label)) return null;

    let courseId: string;
    try {
        courseId = decodeURIComponent(pathMatch[1]);
    } catch {
        return null;
    }

    return {
        courseId,
        unitId,
        pageId,
        courseTitle: labels[0],
        unitTitle: labels[1],
        pageTitle: labels[2],
        note: cleanLine(noteLine?.slice("선생님 말씀:".length) || "", MAX_NOTE_LENGTH),
        href: `${url.pathname}${url.search}`,
    };
}

export function isLearningReviewRequestForPage(
    request: LearningReviewRequest,
    location: Pick<LearningReviewRequest, "courseId" | "unitId" | "pageId">,
) {
    return request.courseId === location.courseId
        && request.unitId === location.unitId
        && request.pageId === location.pageId;
}
