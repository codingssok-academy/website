/**
 * /api/curriculum/[courseId]
 *
 * 코스 전체 커리큘럼을 JSON 또는 Markdown 으로 export.
 * 피드백 L32: "내가 이 과목 PPT 제작을 해야돼 라고 하면 커리큘럼 기억했던것들을 나한테 얘기하면"
 *
 * Nava(어시스턴트)가 이 엔드포인트를 호출해서 코스 전체 커리큘럼을 한 번에 가져간 뒤,
 * 담당자에게 markdown 으로 읽어주거나 PPT 스켈레톤을 생성할 때 사용.
 *
 * 사용 예:
 *  GET /api/curriculum/8                   — 컴퓨터기초 코스 (JSON)
 *  GET /api/curriculum/8?format=markdown   — 컴퓨터기초 코스 (Markdown, PPT 제작용)
 *  GET /api/curriculum?format=markdown     — 전체 코스 목록 요약
 */

import { NextRequest, NextResponse } from "next/server";
import { COURSES } from "@/data/courses";
import type { Course, Chapter, Unit } from "@/data/courses/types";

export const revalidate = 3600;

function courseToMarkdown(course: Course): string {
    const lines: string[] = [];
    lines.push(`# ${course.title}`);
    if (course.subtitle) lines.push(`> ${course.subtitle}`);
    lines.push("");
    lines.push(course.description);
    lines.push("");
    lines.push(`- **총 유닛 수**: ${course.totalUnits}`);
    lines.push(`- **예상 학습 시간**: ${course.estimatedHours}시간`);
    if (course.materialMode) lines.push(`- **자료 모드**: ${course.materialMode}`);
    lines.push("");

    for (const chapter of course.chapters) {
        lines.push(`## 챕터 ${chapter.chapterNumber}. ${chapter.title}`);
        if (chapter.description) lines.push(`> ${chapter.description}`);
        if ((chapter as any).ageLevel) {
            lines.push(`- 연령대: ${(chapter as any).ageLevel}`);
        }
        if ((chapter as any).recommendedGrade) {
            lines.push(`- 권장 학년: ${(chapter as any).recommendedGrade}`);
        }
        lines.push("");

        for (const unit of chapter.units) {
            lines.push(`### ${unit.unitNumber}. ${unit.title}`);
            if ((unit as any).subtitle) lines.push(`   ${(unit as any).subtitle}`);
            if (unit.duration) lines.push(`   *소요: ${unit.duration}*`);
            if (unit.difficulty) lines.push(`   *난이도: ${"★".repeat(unit.difficulty)}*`);
            const pageCount = unit.pages?.length ?? 0;
            if (pageCount > 0) lines.push(`   *페이지: ${pageCount}개*`);
            lines.push("");
        }
    }

    lines.push("---");
    lines.push("");
    lines.push("_이 문서는 `/api/curriculum` 에서 자동 생성되었습니다. PPT 제작 가이드로 사용하세요._");

    return lines.join("\n");
}

function allCoursesToMarkdown(): string {
    const lines: string[] = [];
    lines.push(`# 코딩쏙 전체 커리큘럼 요약`);
    lines.push("");
    lines.push(`총 ${COURSES.length}개 코스`);
    lines.push("");
    for (const c of COURSES) {
        const status = c.comingSoon ? " (준비중)" : "";
        lines.push(`## ${c.title}${status}`);
        lines.push(`- ${c.description}`);
        lines.push(`- ${c.totalUnits}유닛 · ${c.estimatedHours}시간 · ${c.chapters.length}챕터`);
        lines.push("");
    }
    return lines.join("\n");
}

function stripUnit(unit: Unit) {
    return {
        id: unit.id,
        unitNumber: unit.unitNumber,
        title: unit.title,
        subtitle: (unit as any).subtitle,
        type: unit.type,
        difficulty: unit.difficulty,
        duration: unit.duration,
        pageCount: unit.pages?.length ?? 0,
    };
}

function stripChapter(chapter: Chapter) {
    return {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        description: chapter.description,
        ageLevel: (chapter as any).ageLevel,
        recommendedGrade: (chapter as any).recommendedGrade,
        units: chapter.units.map(stripUnit),
    };
}

export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ courseId: string }> },
) {
    const start = Date.now();
    try {
        const { courseId } = await ctx.params;
        const format = req.nextUrl.searchParams.get("format") || "json";

        // courseId 가 없거나 "all" 이면 전체 요약
        if (!courseId || courseId === "all") {
            const body = format === "markdown"
                ? allCoursesToMarkdown()
                : JSON.stringify({
                    courses: COURSES.map(c => ({
                        id: c.id,
                        title: c.title,
                        description: c.description,
                        totalUnits: c.totalUnits,
                        estimatedHours: c.estimatedHours,
                        comingSoon: c.comingSoon,
                        materialMode: c.materialMode,
                        chapterCount: c.chapters.length,
                    })),
                });
            console.log(`[curriculum] all format=${format} ms=${Date.now() - start}`);
            return new NextResponse(body, {
                headers: {
                    "Content-Type": format === "markdown"
                        ? "text/markdown; charset=utf-8"
                        : "application/json; charset=utf-8",
                },
            });
        }

        const course = COURSES.find(c => c.id === courseId);
        if (!course) {
            console.warn(`[curriculum] 404 courseId=${courseId} ms=${Date.now() - start}`);
            return NextResponse.json({ error: "course_not_found", courseId }, { status: 404 });
        }

        if (format === "markdown") {
            console.log(`[curriculum] ${courseId} markdown ms=${Date.now() - start}`);
            return new NextResponse(courseToMarkdown(course), {
                headers: { "Content-Type": "text/markdown; charset=utf-8" },
            });
        }

        console.log(`[curriculum] ${courseId} json ms=${Date.now() - start}`);
        return NextResponse.json({
            id: course.id,
            title: course.title,
            subtitle: course.subtitle,
            description: course.description,
            totalUnits: course.totalUnits,
            totalProblems: course.totalProblems,
            estimatedHours: course.estimatedHours,
            materialMode: course.materialMode,
            comingSoon: course.comingSoon,
            chapters: course.chapters.map(stripChapter),
        });
    } catch (err) {
        console.error("[curriculum] exception:", err, `ms=${Date.now() - start}`);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
