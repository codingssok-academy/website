import { getCourseById } from "@/data/courses";

export interface LearningActivityRow {
    course_id: string | null;
    course_title: string | null;
    unit_id: string | null;
    unit_title: string | null;
    page_id: string | null;
    page_title: string | null;
    started_at: string | null;
}

export interface LearningResume {
    courseId: string;
    courseTitle: string;
    unitId: string;
    unitTitle: string;
    pageId: string;
    pageTitle: string;
    currentStep: number;
    totalSteps: number;
    remainingSteps: number;
    progressPercent: number;
    href: string;
    startedAt: string | null;
}

function normalizeCourseId(courseId: string) {
    const contestMatch = courseId.match(/^6-(c|python|koi)$/);
    return contestMatch
        ? { courseId: "6", track: contestMatch[1] }
        : { courseId, track: null };
}

export function createLearningResume(row: LearningActivityRow): LearningResume | null {
    if (!row.course_id || !row.unit_id || !row.page_id) return null;

    const normalized = normalizeCourseId(row.course_id);
    const course = getCourseById(normalized.courseId);
    if (!course) return null;

    const unit = course.chapters.flatMap((chapter) => chapter.units).find((item) => item.id === row.unit_id);
    if (!unit) return null;

    const pages = unit.pages ?? [];
    const pageIndex = pages.findIndex((page) => page.id === row.page_id);
    if (pageIndex < 0 || pages.length === 0) return null;

    const params = new URLSearchParams({ unit: unit.id, page: pages[pageIndex].id });
    if (normalized.track) params.set("track", normalized.track);

    const currentStep = pageIndex + 1;
    const remainingSteps = Math.max(pages.length - currentStep, 0);

    return {
        courseId: course.id,
        courseTitle: row.course_title || course.title,
        unitId: unit.id,
        unitTitle: row.unit_title || unit.title,
        pageId: pages[pageIndex].id,
        pageTitle: row.page_title || pages[pageIndex].title,
        currentStep,
        totalSteps: pages.length,
        remainingSteps,
        progressPercent: Math.round((currentStep / pages.length) * 100),
        href: `/dashboard/learning/courses/${course.id}?${params.toString()}`,
        startedAt: row.started_at,
    };
}

export function findLatestLearningResume(rows: LearningActivityRow[]) {
    for (const row of rows) {
        const resume = createLearningResume(row);
        if (resume) return resume;
    }
    return null;
}
