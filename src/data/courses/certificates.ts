/**
 * 자격증 모의고사 코스 데이터
 * 3개 자격증: 워드프로세서(84회), 컴활2급(125회), 프로그래밍기능사(84회)
 * 인터랙티브 HTML만 사용
 */

import type { Chapter } from './types';

function examPage(id: string, title: string, src: string) {
    return {
        id,
        title,
        type: '페이지' as const,
        content: `<iframe src="${src}" style="width:100%;height:100%;border:none;" allowfullscreen />`,
    };
}

// ── 워드프로세서 (84회) ──
const WP_BASE = '/learn/자격증/워드프로세서';
const WP_ROUNDS = [60, ...Array.from({ length: 83 }, (_, i) => i + 2)]; // 특별회 + r2~r84

function wpUnit(r: number, i: number, diff: 2 | 3) {
    const prefix = r === 60 ? 'wp-exam-60' : `wp-exam-r${r}`;
    const label = r === 60 ? '특별' : `${r}`;
    return {
        id: `wp-mock-${label}`,
        unitNumber: i + 1,
        title: `모의고사 ${label}회`,
        type: '퀴즈' as const,
        difficulty: diff,
        duration: '60분',
        pages: [examPage(`wp-i${r}`, `모의고사 ${label}회`, `${WP_BASE}/${prefix}-interactive.html`)],
    };
}

export const WORDPROCESSOR_EXAM_CHAPTERS: Chapter[] = [
    {
        id: 'wp-exam-1', chapterNumber: 1, title: '1~28회', icon: 'quiz',
        description: '워드프로세서 필기 모의고사 기초편',
        units: WP_ROUNDS.slice(0, 28).map((r, i) => wpUnit(r, i, 2)),
    },
    {
        id: 'wp-exam-2', chapterNumber: 2, title: '29~56회', icon: 'quiz',
        description: '워드프로세서 필기 모의고사 중급편',
        units: WP_ROUNDS.slice(28, 56).map((r, i) => wpUnit(r, i, 2)),
    },
    {
        id: 'wp-exam-3', chapterNumber: 3, title: '57~84회', icon: 'quiz',
        description: '워드프로세서 필기 모의고사 심화편',
        units: WP_ROUNDS.slice(56).map((r, i) => wpUnit(r, i, 3)),
    },
];

// ── 컴활2급 (125회) ──
const CA2_BASE = '/learn/자격증/컴활2급';

function ca2Unit(r: number, i: number, diff: 2 | 3) {
    return {
        id: `ca2-mock-${r}`,
        unitNumber: i + 1,
        title: `모의고사 ${r}회`,
        type: '퀴즈' as const,
        difficulty: diff,
        duration: '60분',
        pages: [examPage(`ca2-i${r}`, `모의고사 ${r}회`, `${CA2_BASE}/ca2-exam-r${r}-interactive.html`)],
    };
}

export const COMPUTER_CERT_EXAM_CHAPTERS: Chapter[] = [
    {
        id: 'ca2-exam-1', chapterNumber: 1, title: '1~42회', icon: 'quiz',
        description: '컴활2급 필기 모의고사 기초편',
        units: Array.from({ length: 42 }, (_, i) => ca2Unit(i + 1, i, 2)),
    },
    {
        id: 'ca2-exam-2', chapterNumber: 2, title: '43~84회', icon: 'quiz',
        description: '컴활2급 필기 모의고사 중급편',
        units: Array.from({ length: 42 }, (_, i) => ca2Unit(i + 43, i, 2)),
    },
    {
        id: 'ca2-exam-3', chapterNumber: 3, title: '85~125회', icon: 'quiz',
        description: '컴활2급 필기 모의고사 심화편',
        units: Array.from({ length: 41 }, (_, i) => ca2Unit(i + 85, i, 3)),
    },
];

// ── 프로그래밍기능사 (84회) ──
const PF_BASE = '/learn/자격증/프로그래밍기능사';

function pfUnit(r: number, i: number, diff: 2 | 3) {
    return {
        id: `pf-mock-${r}`,
        unitNumber: i + 1,
        title: `모의고사 ${r}회`,
        type: '퀴즈' as const,
        difficulty: diff,
        duration: '60분',
        pages: [examPage(`pf-i${r}`, `모의고사 ${r}회`, `${PF_BASE}/pf-exam-r${r}-interactive.html`)],
    };
}

export const PROGRAMMING_CERT_EXAM_CHAPTERS: Chapter[] = [
    {
        id: 'pf-exam-1', chapterNumber: 1, title: '1~28회', icon: 'quiz',
        description: '프로그래밍기능사 필기 모의고사 기초편',
        units: Array.from({ length: 28 }, (_, i) => pfUnit(i + 1, i, 2)),
    },
    {
        id: 'pf-exam-2', chapterNumber: 2, title: '29~56회', icon: 'quiz',
        description: '프로그래밍기능사 필기 모의고사 중급편',
        units: Array.from({ length: 28 }, (_, i) => pfUnit(i + 29, i, 2)),
    },
    {
        id: 'pf-exam-3', chapterNumber: 3, title: '57~84회', icon: 'quiz',
        description: '프로그래밍기능사 필기 모의고사 심화편',
        units: Array.from({ length: 28 }, (_, i) => pfUnit(i + 57, i, 3)),
    },
];

// ── 자격증 서브코스 ──
export interface CertificateSubCourse {
    id: string;
    title: string;
    subtitle: string;
    gradient: string;
    description: string;
    icon: string;
    totalRounds: number;
    status: 'ready' | 'coming-soon';
}

export const CERTIFICATE_SUB_COURSES: CertificateSubCourse[] = [
    {
        id: 'cert-wordprocessor',
        title: '워드프로세서 필기',
        subtitle: 'Word Processor Written',
        gradient: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        description: '워드프로세서 필기 모의고사 84회분',
        icon: 'edit_document',
        totalRounds: 84,
        status: 'ready',
    },
    {
        id: 'cert-computer-2',
        title: '컴퓨터활용능력 2급',
        subtitle: 'Computer Literacy Level 2',
        gradient: 'linear-gradient(135deg, #059669, #0d9488)',
        description: '컴활2급 필기 모의고사 125회분',
        icon: 'computer',
        totalRounds: 125,
        status: 'ready',
    },
    {
        id: 'cert-programming',
        title: '프로그래밍기능사',
        subtitle: 'Programming Technician',
        gradient: 'linear-gradient(135deg, #dc2626, #f59e0b)',
        description: '프로그래밍기능사 필기 모의고사 84회분',
        icon: 'terminal',
        totalRounds: 84,
        status: 'ready',
    },
];
