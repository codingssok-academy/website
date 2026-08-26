import { describe, expect, it } from 'vitest';

import { getCourseById } from '@/data/courses';
import { AI_PROJECT_LAB_CURRICULUM_VERSION } from '@/data/courses/ai-literacy';

describe('AI Project Lab course', () => {
    it('provides four stages and twenty-four 120-minute studio sessions', () => {
        const course = getCourseById('10');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];

        expect(course?.title).toBe('AI 프로젝트 랩');
        expect(course?.totalUnits).toBe(24);
        expect(course?.estimatedHours).toBe(48);
        expect(course?.chapters).toHaveLength(4);
        expect(course?.chapters.every((chapter) => chapter.units.length === 6)).toBe(true);
        expect(course?.chapters.every((chapter) => chapter.recommendedGrade === '초등 4학년~중학생')).toBe(true);
        expect(units).toHaveLength(24);
        expect(units.every((unit) => unit.duration === '120분')).toBe(true);
        expect(units[0]?.title).toBe('AI 탐정의 첫 번째 사건');
        expect(units.at(-1)?.title).toBe('AI 프로젝트 데모데이');
    });

    it('includes 240 unique studio pages with student records and teacher-only guides', () => {
        const units = getCourseById('10')?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);

        expect(AI_PROJECT_LAB_CURRICULUM_VERSION).toBe('2026.1-foundation');
        expect(units.every((unit) => unit.id.startsWith('ai-project-v1-u'))).toBe(true);
        expect(units.every((unit) => unit.pages?.length === 10)).toBe(true);
        expect(pages).toHaveLength(240);
        expect(new Set(pages.map((page) => page.id)).size).toBe(240);
        expect(pages.every((page) => page.id.startsWith('ai-project-v1-'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('ai-lab-studio'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('AI 사용 약속'))).toBe(true);
        expect(pages.every((page) => page.teacherGuide)).toBe(true);
        expect(units.every((unit) => unit.pages?.filter((page) => page.activity).length === 4)).toBe(true);
    });

    it('packages every class with materials, outcome, completion checks and a parent report', () => {
        const units = getCourseById('10')?.chapters.flatMap((chapter) => chapter.units) ?? [];

        expect(units.every((unit) => unit.lessonPackage?.materials.length)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.deliverable.length)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.completionCriteria.length === 3)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.parentReport.length)).toBe(true);
        expect(units.every((unit) => unit.pages?.[0]?.content?.includes('오늘의 120분'))).toBe(true);
        expect(units.every((unit) => unit.pages?.at(-1)?.content?.includes('학부모 리포트'))).toBe(true);
    });
});
