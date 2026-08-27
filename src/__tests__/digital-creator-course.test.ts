import { describe, expect, it } from 'vitest';

import { COURSES, STUDENT_SHELF_COURSES, getCourseById } from '@/data/courses';
import { DIGITAL_CREATOR_CURRICULUM_VERSION } from '@/data/courses/kids-it';

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

    it('provides a fully rebuilt set of fifteen 120-minute sessions and 150 phased activity pages', () => {
        const course = getCourseById('11');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);

        expect(course?.totalUnits).toBe(15);
        expect(course?.estimatedHours).toBe(30);
        expect(units).toHaveLength(15);
        expect(units.every((unit) => unit.duration === '120분')).toBe(true);
        expect(DIGITAL_CREATOR_CURRICULUM_VERSION).toBe('2026.2-rebuild');
        expect(units.every((unit) => unit.id.startsWith('digital-creator-v2-u'))).toBe(true);
        expect(pages.every((page) => page.id.startsWith('digital-creator-v2-'))).toBe(true);
        expect(new Set(units.map((unit) => unit.id)).size).toBe(15);
        expect(new Set(pages.map((page) => page.id)).size).toBe(150);
        expect(pages.some((page) => page.id.startsWith('kids-it-first-'))).toBe(false);
        expect(units.every((unit) => unit.subtitle?.includes('창작하기 45분'))).toBe(true);
        expect(pages).toHaveLength(150);
        expect(units.every((unit) => unit.pages?.length === 10)).toBe(true);
        expect(units[0]?.title).toBe('컴퓨터 탐험대 출발');
        expect(units.at(-1)?.title).toBe('디지털 창작자 발표회');
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

    it('packages every session with student records, teacher guidance and class-ready outcomes', () => {
        const course = getCourseById('11');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];

        expect(units.map((unit) => unit.title)).toEqual([
            '컴퓨터 탐험대 출발',
            '마우스 로봇 조종하기',
            '키보드 낱말 카드 만들기',
            '파일·폴더 보물상자',
            '도형으로 나만의 캐릭터',
            '픽셀과 색으로 표정 만들기',
            '사진 편집과 저작권 약속',
            '목소리로 소리 이야기',
            '세 장면 디지털 그림책',
            '검색 탐정과 디지털 시민',
            '명령 카드로 길 찾기',
            '엔트리 캐릭터 애니메이션',
            '반복·조건 미니게임',
            '나의 융합 작품 제작소',
            '디지털 창작자 발표회',
        ]);
        expect(units.every((unit) => unit.lessonPackage?.materials.length)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.completionCriteria.length === 3)).toBe(true);
        expect(units.every((unit) => unit.lessonPackage?.parentReport.length)).toBe(true);
        expect(units.every((unit) => unit.pages?.filter((page) => page.activity).length === 4)).toBe(true);
        expect(units.flatMap((unit) => unit.pages ?? []).every((page) => page.teacherGuide)).toBe(true);
        expect(units.every((unit) => unit.pages?.[0]?.content?.includes('오늘의 결과물'))).toBe(true);
        expect(units.every((unit) => unit.pages?.at(-1)?.content?.includes('학부모 리포트 문장'))).toBe(true);
    });

    it('starts the first lesson with selectable picture cards for solo or group learning', () => {
        const firstPage = getCourseById('11')?.chapters[0]?.units[0]?.pages?.[0];

        expect(firstPage?.choiceActivity?.options.map((option) => option.label)).toEqual([
            '그림 그리기',
            '게임하기',
            '영상 보기',
            '공부·검색하기',
        ]);
        expect(firstPage?.choiceActivity?.soloGuide).toContain('혼자 공부한다면');
        expect(firstPage?.choiceActivity?.groupGuide).toContain('친구나 선생님');
        expect(firstPage?.content).toContain('아래 그림 카드');
        expect(firstPage?.content).not.toContain('그림 카드에서 골라 친구와 한 가지씩');
    });
});
