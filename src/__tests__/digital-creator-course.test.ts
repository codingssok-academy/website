import { describe, expect, it } from 'vitest';

import { COURSES, getCourseById } from '@/data/courses';

describe('Digital Creator course', () => {
    it('is the first visible course for elementary grade 1 and 2 students', () => {
        const course = getCourseById('11');

        expect(COURSES[0]?.id).toBe('11');
        expect(course?.title).toBe('디지털 창작자');
        expect(course?.subtitle).toContain('초등 1·2학년');
        expect(course?.comingSoon).not.toBe(true);
        expect(course?.chapters).toHaveLength(3);
        expect(course?.chapters.every((chapter) => chapter.recommendedGrade === '초등 1~2학년')).toBe(true);
    });

    it('provides fifteen 120-minute sessions and 150 activity pages', () => {
        const course = getCourseById('11');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);

        expect(course?.totalUnits).toBe(15);
        expect(course?.estimatedHours).toBe(30);
        expect(units).toHaveLength(15);
        expect(units.every((unit) => unit.duration === '120분')).toBe(true);
        expect(units.every((unit) => unit.subtitle?.includes('창작 미션'))).toBe(true);
        expect(pages).toHaveLength(150);
        expect(units.every((unit) => unit.pages?.length === 10)).toBe(true);
    });
});
