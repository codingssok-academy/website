import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

import { getCourseById } from '@/data/courses';

describe('Python Core web course', () => {
    it('provides a 36-session curriculum organized into three levels', () => {
        const course = getCourseById('3');
        const firstChapter = course?.chapters[0];
        const firstUnit = firstChapter?.units[0];
        const units = course?.chapters.flatMap((chapter) => chapter.units) ?? [];

        expect(course?.title).toBe('파이썬 코어');
        expect(course?.defaultLanguage).toBe('python');
        expect(course?.chapters).toHaveLength(3);
        expect(units).toHaveLength(36);
        expect(units.every((unit) => unit.duration === '120분')).toBe(true);
        expect(firstChapter?.id).toBe('python-core-level-1');
        expect(firstUnit?.id).toBe('py-core-w01');
        expect(firstUnit?.pages).toHaveLength(10);
        expect(firstUnit?.pages?.map((page) => page.id)).toEqual(
            Array.from({ length: 10 }, (_, index) => `py-core-w01-p${String(index + 1).padStart(2, '0')}`),
        );
    });

    it('gives every session prediction, coding, debugging and reflection activities', () => {
        const units = getCourseById('3')?.chapters.flatMap((chapter) => chapter.units) ?? [];
        const pages = units.flatMap((unit) => unit.pages ?? []);
        const problemIds = pages.flatMap((page) => page.problems?.map((problem) => problem.id) ?? []);

        expect(pages).toHaveLength(360);
        expect(pages.filter((page) => page.quiz)).toHaveLength(108);
        expect(problemIds).toHaveLength(144);
        expect(new Set(problemIds).size).toBe(problemIds.length);
        expect(pages.some((page) => page.title.includes('오류'))).toBe(true);
        expect(units.every((unit) => unit.pages?.at(-1)?.title.includes('성장 기록'))).toBe(true);
    });

    it('executes every non-debug starter program without a Python syntax error', () => {
        const python = process.env.PYTHON_TEST_BIN;
        if (!python) return;

        const runnableProblems = getCourseById('3')?.chapters
            .flatMap((chapter) => chapter.units)
            .flatMap((unit) => unit.pages ?? [])
            .filter((page) => !page.title.includes('오류'))
            .flatMap((page) => page.problems ?? []) ?? [];

        const failures = runnableProblems.flatMap((problem) => {
            const result = spawnSync(python, ['-c', problem.codeTemplate ?? ''], { encoding: 'utf8', timeout: 3_000 });
            return result.status === 0 ? [] : [{ id: problem.id, title: problem.title, stderr: result.stderr }];
        });

        expect(failures).toEqual([]);
    });
});

