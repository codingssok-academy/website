import { describe, expect, it } from 'vitest';

import { getCourseById } from '@/data/courses';

describe('Python Core web course', () => {
    it('places the ten-step week 1 lesson before the legacy Python curriculum', () => {
        const course = getCourseById('3');
        const firstChapter = course?.chapters[0];
        const firstUnit = firstChapter?.units[0];

        expect(course?.title).toBe('파이썬 코어');
        expect(course?.defaultLanguage).toBe('python');
        expect(firstChapter?.id).toBe('python-core-level-1');
        expect(firstUnit?.id).toBe('py-core-w01');
        expect(firstUnit?.pages).toHaveLength(10);
        expect(firstUnit?.pages?.map((page) => page.id)).toEqual(
            Array.from({ length: 10 }, (_, index) => `py-core-w01-p${String(index + 1).padStart(2, '0')}`),
        );
    });

    it('includes prediction, coding, debugging and reflection activities', () => {
        const pages = getCourseById('3')?.chapters[0]?.units[0]?.pages ?? [];

        expect(pages.filter((page) => page.quiz)).toHaveLength(3);
        expect(pages.flatMap((page) => page.problems ?? [])).toHaveLength(4);
        expect(pages.some((page) => page.title.includes('오류'))).toBe(true);
        expect(pages.at(-1)?.title).toBe('성장 기록과 과제');
    });
});

