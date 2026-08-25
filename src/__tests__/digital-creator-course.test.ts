import { describe, expect, it } from 'vitest';

import { COURSES, STUDENT_SHELF_COURSES, getCourseById } from '@/data/courses';

describe('Digital Creator course', () => {
    it('is the first of five focused student products without duplicating hidden courses', () => {
        const course = getCourseById('11');

        expect(COURSES[0]?.id).toBe('11');
        expect(course?.title).toBe('디지털 창작자');
        expect(getCourseById('13')).toBeUndefined();
        expect(course?.comingSoon).not.toBe(true);
        expect(course?.chapters).toHaveLength(3);
        expect(course?.chapters.every((chapter) => chapter.recommendedGrade === '초등 1~2학년')).toBe(true);
        expect(STUDENT_SHELF_COURSES.map((item) => item.id)).toEqual(['11', '3', '10', '5', '4']);
        expect(STUDENT_SHELF_COURSES.map((item) => item.title)).toEqual([
            '디지털 창작자', '파이썬 코어', 'AI 프로젝트 랩', '게임 제작', '알고리즘·대회',
        ]);
    });

    it('provides fifteen detailed 120-minute sessions and 150 phased activity pages', () => {
        const course = getCourseById('11');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);

        expect(course?.totalUnits).toBe(15);
        expect(course?.estimatedHours).toBe(30);
        expect(units).toHaveLength(15);
        expect(units.every((unit) => unit.duration === '120분')).toBe(true);
        expect(units.every((unit) => unit.subtitle?.includes('창작 미션 45분'))).toBe(true);
        expect(pages).toHaveLength(150);
        expect(units.every((unit) => unit.pages?.length === 10)).toBe(true);
        expect(units[0]?.title).toBe('컴퓨터 탐험가 되기');
        expect(units.at(-1)?.title).toBe('디지털 창작자 프로젝트 발표');
        expect(units.every((unit) => unit.pages?.[0]?.content?.includes('오늘의 120분'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('kids-it-phase'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('kids-it-textbook'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('digital-creator-textbook-v2.png'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('kids-it-illustration-frame'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('max-width:394px !important'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('생각 열기'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('만들기'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('도전하기'))).toBe(true);
        expect(pages.every((page) => page.content?.includes('수업 기록'))).toBe(true);
    });

    it('packages the first four sessions with student records, teacher guidance and class-ready outcomes', () => {
        const course = getCourseById('11');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const foundation = units.slice(0, 4);

        expect(foundation.map((unit) => unit.title)).toEqual([
            '컴퓨터 탐험가 되기',
            '창과 아이콘 움직이기',
            '마우스와 터치로 그리기',
            '키보드로 이야기 쓰기',
        ]);
        expect(foundation.every((unit) => unit.lessonPackage?.materials.length)).toBe(true);
        expect(foundation.every((unit) => unit.lessonPackage?.completionCriteria.length === 3)).toBe(true);
        expect(foundation.every((unit) => unit.lessonPackage?.parentReport.length)).toBe(true);
        expect(foundation.every((unit) => unit.pages?.filter((page) => page.activity).length === 4)).toBe(true);
        expect(foundation.flatMap((unit) => unit.pages ?? []).every((page) => page.teacherGuide)).toBe(true);
        expect(foundation.every((unit) => unit.pages?.[0]?.content?.includes('오늘의 결과물'))).toBe(true);
        expect(foundation.every((unit) => unit.pages?.at(-1)?.content?.includes('학부모 리포트 문장'))).toBe(true);
    });
});
