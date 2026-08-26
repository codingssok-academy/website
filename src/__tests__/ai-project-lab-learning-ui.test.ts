import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const coursePage = readFileSync(
    join(process.cwd(), 'src/app/dashboard/learning/courses/[courseId]/page.tsx'),
    'utf8',
);

describe('AI Project Lab learning UI', () => {
    it('uses a focused creative-studio reader and per-session page navigation', () => {
        expect(coursePage).toContain("activePage?.id.startsWith('ai-project-v1-')");
        expect(coursePage).toContain('selectedUnit?.id.startsWith("ai-project-v1-")');
        expect(coursePage).toContain('ai-project-reader');
        expect(coursePage).toContain('ai-project-material');
        expect(coursePage).toContain('ai-lab-page-nav');
        expect(coursePage).toContain('다음 단계');
        expect(coursePage).toContain('AI 프로젝트 랩 · 창작 스튜디오형');
    });

    it('persists project records and requires all studio work before completion', () => {
        expect(coursePage).toContain('isProjectActivityPage');
        expect(coursePage).toContain('usesProjectActivityUnit');
        expect(coursePage).toContain('projectActivityAnswer');
        expect(coursePage).toContain('updateProjectActivityAnswer');
        expect(coursePage).toContain('ai-lab-activity-panel');
        expect(coursePage).toContain('ai-lab-completion');
        expect(coursePage).toContain('남은 스튜디오 단계와 제작 기록을 마쳐주세요');
    });

    it('keeps instructor guidance teacher-only and visually separate from student work', () => {
        expect(coursePage).toContain('isProjectActivityPage && isTeacherView && activePage.teacherGuide');
        expect(coursePage).toContain('ai-lab-teacher-guide');
        expect(coursePage).toContain("content:'AI LAB · 교사용'");
    });

    it('includes responsive mobile layouts without horizontal overflow', () => {
        expect(coursePage).toContain('.course-content-pad.ai-project-reader');
        expect(coursePage).toContain('overflow-x:clip!important');
        expect(coursePage).toContain('.course-content-pad .ai-lab-board,.course-content-pad .ai-lab-kit { grid-template-columns:1fr; }');
    });
});
