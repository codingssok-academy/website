export type QuizAnswerResult = "correct" | null;

export interface LessonAnswerSnapshot {
    version: 1;
    quizAnswer: number | null;
    quizResult: QuizAnswerResult;
    codeAnswers: Record<string, string>;
    updatedAt: string;
}

export interface LessonSessionProgress {
    version: 1;
    visitedPageIds: string[];
    correctQuizPageIds: string[];
    successfulProblemIds: number[];
    completedActivityPageIds: string[];
    updatedAt: string;
}

export interface LessonCompletionSummary {
    pages: { completed: number; total: number };
    quizzes: { completed: number; total: number };
    problems: { completed: number; total: number };
    activities: { completed: number; total: number };
    ready: boolean;
}

const uniqueStrings = (values: unknown): string[] => Array.from(new Set(
    Array.isArray(values) ? values.filter((value): value is string => typeof value === "string" && value.length > 0) : [],
));

const uniqueNumbers = (values: unknown): number[] => Array.from(new Set(
    Array.isArray(values) ? values.filter((value): value is number => Number.isInteger(value) && value >= 0) : [],
));

export function emptyLessonAnswer(): LessonAnswerSnapshot {
    return {
        version: 1,
        quizAnswer: null,
        quizResult: null,
        codeAnswers: {},
        updatedAt: new Date(0).toISOString(),
    };
}

export function emptyLessonProgress(): LessonSessionProgress {
    return {
        version: 1,
        visitedPageIds: [],
        correctQuizPageIds: [],
        successfulProblemIds: [],
        completedActivityPageIds: [],
        updatedAt: new Date(0).toISOString(),
    };
}

export function normalizeLessonAnswer(value: unknown): LessonAnswerSnapshot | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<LessonAnswerSnapshot>;
    const codeAnswers = candidate.codeAnswers && typeof candidate.codeAnswers === "object"
        ? Object.fromEntries(Object.entries(candidate.codeAnswers).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        : {};

    return {
        version: 1,
        quizAnswer: Number.isInteger(candidate.quizAnswer) ? Number(candidate.quizAnswer) : null,
        quizResult: candidate.quizResult === "correct" ? "correct" : null,
        codeAnswers,
        updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date(0).toISOString(),
    };
}

export function normalizeLessonProgress(value: unknown): LessonSessionProgress | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<LessonSessionProgress>;
    return {
        version: 1,
        visitedPageIds: uniqueStrings(candidate.visitedPageIds),
        correctQuizPageIds: uniqueStrings(candidate.correctQuizPageIds),
        successfulProblemIds: uniqueNumbers(candidate.successfulProblemIds),
        completedActivityPageIds: uniqueStrings(candidate.completedActivityPageIds),
        updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date(0).toISOString(),
    };
}

export function evaluateLessonCompletion(
    progress: LessonSessionProgress,
    pageIds: string[],
    quizPageIds: string[],
    problemIds: number[],
    activityPageIds: string[] = [],
): LessonCompletionSummary {
    const visited = new Set(progress.visitedPageIds);
    const correctQuizzes = new Set(progress.correctQuizPageIds);
    const successfulProblems = new Set(progress.successfulProblemIds);
    const completedActivities = new Set(progress.completedActivityPageIds);
    const pagesCompleted = pageIds.filter((id) => visited.has(id)).length;
    const quizzesCompleted = quizPageIds.filter((id) => correctQuizzes.has(id)).length;
    const problemsCompleted = problemIds.filter((id) => successfulProblems.has(id)).length;
    const activitiesCompleted = activityPageIds.filter((id) => completedActivities.has(id)).length;

    return {
        pages: { completed: pagesCompleted, total: pageIds.length },
        quizzes: { completed: quizzesCompleted, total: quizPageIds.length },
        problems: { completed: problemsCompleted, total: problemIds.length },
        activities: { completed: activitiesCompleted, total: activityPageIds.length },
        ready: pageIds.length > 0
            && pagesCompleted === pageIds.length
            && quizzesCompleted === quizPageIds.length
            && problemsCompleted === problemIds.length
            && activitiesCompleted === activityPageIds.length,
    };
}

export function lessonAnswerPath(courseId: string, unitId: string, pageId: string): string {
    return `/learning/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/pages/${encodeURIComponent(pageId)}`;
}

export function lessonProgressPath(courseId: string, unitId: string): string {
    return `/learning/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/progress`;
}
