import { describe, expect, it } from 'vitest';

import { COURSES, getCourseById } from '@/data/courses';

describe('Digital Creator course', () => {
    it('renames the existing first course without creating a duplicate category', () => {
        const course = getCourseById('11');

        expect(COURSES[0]?.id).toBe('11');
        expect(course?.title).toBe('디지털 창작자');
        expect(getCourseById('13')).toBeUndefined();
        expect(course?.comingSoon).not.toBe(true);
        expect(course?.chapters).toHaveLength(3);
        expect(course?.chapters.every((chapter) => chapter.recommendedGrade === '5~9세')).toBe(true);
    });

    it('keeps the existing fifteen-session learning content unchanged', () => {
        const course = getCourseById('11');
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);

        expect(course?.totalUnits).toBe(15);
        expect(course?.estimatedHours).toBe(15);
        expect(units).toHaveLength(15);
        expect(units.every((unit) => unit.duration === '25분')).toBe(true);
        expect(pages).toHaveLength(150);
        expect(units.every((unit) => unit.pages?.length === 10)).toBe(true);
    });
});
