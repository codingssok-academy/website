import { describe, expect, it } from 'vitest';

import { getCourseById } from '@/data/courses';
import { GAME_MAKER_CURRICULUM_VERSION } from '@/data/courses/game-dev';

describe('Game Maker course', () => {
    it('provides four stages and twenty-four 120-minute game studio sessions', () => {
        const course = getCourseById('5');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];

        expect(course?.title).toBe('게임 제작');
        expect(course?.totalUnits).toBe(24);
        expect(course?.estimatedHours).toBe(48);
        expect(course?.chapters).toHaveLength(4);
        expect(course?.chapters.every((chapter) => chapter.units.length === 6)).toBe(true);
        expect(course?.chapters.every((chapter) => chapter.recommendedGrade === '초등 4~6학년')).toBe(true);
        expect(units).toHaveLength(24);
        expect(units.every((unit) => unit.duration === '120분')).toBe(true);
        expect(units.every((unit) => unit.subtitle?.includes('미션·탐색 20분 · 코딩·제작 70분 · 테스트 20분 · 기록·공유 10분'))).toBe(true);
        expect(units[0]?.title).toBe('게임 스튜디오 첫 입장');
        expect(units.at(-1)?.title).toBe('게임 메이커 쇼케이스');
    });

    it('includes 240 unique studio pages with four records and teacher-only guides per class', () => {
        const units = getCourseById('5')?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);

        expect(GAME_MAKER_CURRICULUM_VERSION).toBe('2026.1-game-maker');
        expect(units.every((unit) => unit.id.startsWith('game-maker-v1-u'))).toBe(true);
        expect(units.every((unit) => unit.pages?.length === 10)).toBe(true);
        expect(pages).toHaveLength(240);
        expect(new Set(pages.map((page) => page.id)).size).toBe(240);
        expect(pages.every((page) => page.id.startsWith('game-maker-v1-'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('game-studio-slide'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('STUDIO RULE'))).toBe(true);
        expect(pages.every((page) => page.teacherGuide)).toBe(true);
        expect(units.every((unit) => unit.pages?.filter((page) => page.activity).length === 4)).toBe(true);
    });

    it('packages every class with materials, a build outcome, completion checks and a parent report', () => {
        const units = getCourseById('5')?.chapters.flatMap((chapter) => chapter.units) ?? [];

        expect(units.every((unit) => unit.lessonPackage?.materials.length)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.deliverable.length)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.completionCriteria.length === 3)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.parentReport.length)).toBe(true);
        expect(units.every((unit) => unit.pages?.[0]?.content?.includes('오늘의 120분'))).toBe(true);
        expect(units.every((unit) => unit.pages?.at(-1)?.content?.includes('학부모 리포트'))).toBe(true);
    });
});
