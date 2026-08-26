import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const coursePage = readFileSync(
    join(process.cwd(), 'src/app/dashboard/learning/courses/[courseId]/page.tsx'),
    'utf8',
);

describe('Game Maker learning UI', () => {
    it('uses an original block-game studio reader and focused page navigation', () => {
        expect(coursePage).toContain("activePage?.id.startsWith('game-maker-v1-')");
        expect(coursePage).toContain('selectedUnit?.id.startsWith("game-maker-v1-")');
        expect(coursePage).toContain('game-studio-reader');
        expect(coursePage).toContain('game-studio-material');
        expect(coursePage).toContain('game-studio-page-nav');
        expect(coursePage).toContain('다음 빌드');
        expect(coursePage).toContain("url('/images/courses/game-studio-world-v1.png')");
    });

    it('persists game-development records and requires all studio work before completion', () => {
        expect(coursePage).toContain('isGameStudioPage');
        expect(coursePage).toContain('isGameStudioUnit');
        expect(coursePage).toContain('game-studio-activity-panel');
        expect(coursePage).toContain('game-studio-completion');
        expect(coursePage).toContain('남은 빌드 단계와 게임 개발 기록을 마쳐주세요');
    });

    it('keeps the game instructor guide teacher-only and visually separate', () => {
        expect(coursePage).toContain('isProjectActivityPage && isTeacherView && activePage.teacherGuide');
        expect(coursePage).toContain('game-studio-teacher-guide');
        expect(coursePage).toContain("content:'GAME STUDIO · 교사용'");
    });

    it('includes a responsive layout without horizontal page overflow', () => {
        expect(coursePage).toContain('.course-content-pad.game-studio-reader');
        expect(coursePage).toContain('overflow-x:clip!important');
        expect(coursePage).toContain('.course-content-pad .game-studio-editor { grid-template-columns:1fr; }');
        expect(coursePage).toContain('.course-content-pad .game-studio-workbench,.course-content-pad .game-studio-kit { grid-template-columns:1fr; }');
    });
});
