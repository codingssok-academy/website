/**
 * 코딩쏙 아카데미 — 전체 커리큘럼 인덱스
 */

import type { Course, Chapter } from './types';
import { COMPUTER_BASICS } from './computer-basics';
import { CODING_BASICS } from './coding-basics';
import { AI_LITERACY_CHAPTERS } from './ai-literacy';
import { CPP_CHAPTERS } from './cpp';
import { PYTHON_CORE_CHAPTERS } from './python-core';
import { GAME_DEV_CHAPTERS } from './game-dev';
import { PROGRAMMING_CONTEST_CHAPTERS } from './programming-contest';
import { KIDS_IT_CHAPTERS } from './kids-it';
import { KOI_CHAPTERS } from './koi';
import {
    WORDPROCESSOR_EXAM_CHAPTERS,
    COMPUTER_CERT_EXAM_CHAPTERS,
    PROGRAMMING_CERT_EXAM_CHAPTERS,
    CERTIFICATE_SUB_COURSES,
} from './certificates';
export type { CertificateSubCourse } from './certificates';

// ── 빈 챕터 (준비 중 코스용) ──
const EMPTY_CHAPTERS: Chapter[] = [
    {
        id: 'coming-soon',
        chapterNumber: 0,
        title: '준비 중',
        icon: 'hourglass_empty',
        description: '콘텐츠를 준비하고 있습니다.',
        units: [{
            id: 'placeholder',
            unitNumber: 0,
            title: '콘텐츠 준비 중입니다',
            type: '이론' as const,
            problems: [],
            pages: [],
        }],
    },
];

export interface CosProSubCourse {
    id: string;
    title: string;
    subtitle: string;
    language: 'Python' | 'C';
    level: 1 | 2;
    gradient: string;
    cardImage?: string;
    description: string;
    icon: string;
}

export const COSPRO_SUB_COURSES: CosProSubCourse[] = [
    {
        id: 'cospro-python-2',
        title: 'CosPro 파이썬 2급',
        subtitle: 'Python Level 2',
        language: 'Python',
        level: 2,
        gradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
        description: '파이썬 기초 문법, 자료형, 제어문, 함수 등 2급 시험 범위를 체계적으로 학습합니다.',
        icon: 'data_object',
    },
    {
        id: 'cospro-python-1',
        title: 'CosPro 파이썬 1급',
        subtitle: 'Python Level 1',
        language: 'Python',
        level: 1,
        gradient: 'linear-gradient(135deg, #2563eb, #ec4899)',
        description: '파이썬 고급 문법, 클래스, 알고리즘, 자료구조 등 1급 시험 범위를 마스터합니다.',
        icon: 'data_object',
    },
    {
        id: 'cospro-c-2',
        title: 'CosPro C언어 2급',
        subtitle: 'C Language Level 2',
        language: 'C',
        level: 2,
        gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        description: 'C언어 기초 문법, 포인터, 배열, 구조체 등 2급 시험 범위를 체계적으로 학습합니다.',
        icon: 'terminal',
    },
    {
        id: 'cospro-c-1',
        title: 'CosPro C언어 1급',
        subtitle: 'C Language Level 1',
        language: 'C',
        level: 1,
        gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
        description: 'C언어 고급 문법, 동적 메모리, 파일I/O, 알고리즘 등 1급 시험 범위를 마스터합니다.',
        icon: 'terminal',
    },
];

export interface ProgrammingContestSubCourse {
    id: string;
    title: string;
    subtitle: string;
    language: "Python" | "C" | "C/Python";
    gradient: string;
    description: string;
    icon: string;
    track: "python" | "c" | "koi";
    status: "ready" | "coming-soon";
}

export const PROGRAMMING_CONTEST_SUB_COURSES: ProgrammingContestSubCourse[] = [
    {
        id: "contest-c",
        title: "프로그래밍 대회 C언어",
        subtitle: "C Language Contest Track",
        language: "C",
        gradient: "linear-gradient(135deg, #f97316, #eab308)",
        description: "Iron부터 Platinum까지 40개 라운드의 C언어 대회 문제집을 학습합니다.",
        icon: "emoji_events",
        track: "c",
        status: "ready",
    },
    {
        id: "contest-python",
        title: "프로그래밍 대회 파이썬",
        subtitle: "Python Contest Track",
        language: "Python",
        gradient: "linear-gradient(135deg, #2563eb, #0284c7)",
        description: "L1 입출력부터 L12 모듈까지 파이썬 문제집 2,100문제를 학습합니다.",
        icon: "data_object",
        track: "python",
        status: "ready",
    },
    {
        id: "contest-koi",
        title: "정보올림피아드 (KOI)",
        subtitle: "Korea Olympiad in Informatics",
        language: "C/Python",
        gradient: "linear-gradient(135deg, #dc2626, #f59e0b)",
        description: "한국정보올림피아드(KOI) 기출 및 예상 문제를 단계별로 학습합니다.",
        icon: "emoji_events",
        track: "koi",
        status: "ready",
    },
];

export { CERTIFICATE_SUB_COURSES };

// ── 자격증 서브코스 ID → 챕터 매핑 ──
export function getCertificateChapters(subCourseId: string): Chapter[] {
    switch (subCourseId) {
        case 'cert-wordprocessor':
            return WORDPROCESSOR_EXAM_CHAPTERS;
        case 'cert-computer-2':
            return COMPUTER_CERT_EXAM_CHAPTERS;
        case 'cert-programming':
            return PROGRAMMING_CERT_EXAM_CHAPTERS;
        default:
            return EMPTY_CHAPTERS;
    }
}

// ── 코스 정의 ──

export const COURSES: Course[] = [
    {
        id: '11',
        title: '디지털 창작자',
        subtitle: '초등 1·2학년 · 디지털 기초와 창작',
        icon: 'palette',
        gradient: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
        cardImage: '/images/courses/kids-it.png',
        description: '초등 1·2학년을 위한 120분 수업 15회차 과정입니다. 컴퓨터 기초부터 미디어·인터넷 안전, 코딩 사고, 디지털 작품 제작과 발표까지 150개 활동 화면으로 학습합니다.',
        totalUnits: 15,
        totalProblems: 0,
        estimatedHours: 30,
        chapters: KIDS_IT_CHAPTERS,
    },
    {
        id: '12',
        title: '정보올림피아드 대회',
        subtitle: '알고리즘 · 문제해결 · 실전 대비',
        icon: 'emoji_events',
        gradient: 'linear-gradient(135deg, #1e40af, #312e81)',
        cardImage: '/images/courses/koi.png',
        description: '정보올림피아드 단계별 수업자료를 게임 제작 코스와 같은 책형 화면으로 다시 구성할 준비 상태입니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: KOI_CHAPTERS,

        defaultLanguage: 'cpp',
    },
    {
        id: '9',
        title: '사고력 수학',
        icon: 'calculate',
        gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
        cardImage: '/images/courses/math-thinking.png',
        description: '고난도 사고력수학 1-50 본교재와 정답해설편 51-110을 함께 보며 문제 독해, 논리 추론, 풀이 검토, 오답 교정을 학습합니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: EMPTY_CHAPTERS,
        comingSoon: true,
    },
    {
        id: '8',
        title: '컴퓨터 기초',
        icon: 'computer',
        gradient: 'linear-gradient(135deg, #ec4899, #60a5fa)',
        cardImage: '/images/courses/computer-basics.png',
        description: '컴퓨터 구조, 키보드·마우스, 파일, 인터넷, 이진수와 문제해결을 책형 수업자료로 다시 구성합니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: COMPUTER_BASICS,

    },
    {
        id: '1',
        title: '코딩 기초',
        icon: 'code',
        gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        cardImage: '/images/courses/coding-basics.png',
        description: '코딩의 의미, 변수·조건·반복·함수, 문제해결 사고까지 책형 수업자료로 다시 구성할 준비를 마쳤습니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: CODING_BASICS,

    },
    {
        id: '2',
        title: '피지컬 컴퓨팅',
        icon: 'memory',
        gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
        cardImage: '/images/courses/physical-computing.png',
        description: '아두이노, 기본 회로, 센서, 출력 장치, 모터 제어, 생활 문제 해결 프로젝트까지 피지컬 컴퓨팅 완성본 120장으로 학습합니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: EMPTY_CHAPTERS,
        comingSoon: true,

    },
    {
        id: '3',
        title: '파이썬 코어',
        subtitle: '예측 · 실행 · 디버깅 · 응용',
        icon: 'data_object',
        gradient: 'linear-gradient(135deg, #3b82f6, #3b82f6)',
        cardImage: '/images/courses/python.png',
        description: '120분 수업 36회차 과정입니다. 주 1회는 36주, 주 2회는 18주 동안 예측·실행·디버깅·프로젝트를 반복하며 완성합니다.',
        totalUnits: 36,
        totalProblems: 144,
        estimatedHours: 72,
        chapters: PYTHON_CORE_CHAPTERS,
        defaultLanguage: 'python',
    },
    {
        id: '10',
        title: 'AI 강의',
        icon: 'smart_toy',
        gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        cardImage: '/images/courses/ai-class.png',
        description: 'AI 기초부터 도구 활용, 안전과 윤리, 진로까지 책형 수업자료로 다시 업로드할 준비 상태입니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: AI_LITERACY_CHAPTERS,
    },
    {
        id: '4',
        title: 'C++',
        icon: 'terminal',
        gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        cardImage: '/images/courses/cpp.png',
        description: 'C++ 121단원. 입문, 변수와 자료형, 입력과 연산자, 조건문, 반복문·문자열·배열·함수·vector·pair·정렬·이분탐색·2차원 배열·완전탐색·누적합·투 포인터·stack까지 실전형 슬라이드로 학습합니다.',
        totalUnits: 121,
        totalProblems: 0,
        estimatedHours: 90,
        chapters: CPP_CHAPTERS,
        defaultLanguage: 'cpp',
    },
    {
        id: '5',
        title: '게임 제작',
        subtitle: 'Roblox Luau 기초',
        icon: 'sports_esports',
        gradient: 'linear-gradient(135deg, #16a34a, #2563eb)',
        cardImage: '/images/courses/game-dev.png',
        description: 'Roblox Studio와 Luau로 게임 제작을 배우는 교과서 과정입니다. 기초 UI·코인·오비·상점에서 함수·모듈·저장·퀘스트, 보스전 프로젝트까지 420장으로 학습합니다.',
        totalUnits: 41,
        totalProblems: 0,
        estimatedHours: 60,
        chapters: GAME_DEV_CHAPTERS,
        defaultLanguage: 'lua',
    },
    {
        id: '6',
        title: '프로그래밍 대회',
        icon: 'emoji_events',
        gradient: 'linear-gradient(135deg, #f97316, #eab308)',
        cardImage: '/images/courses/programming-contest.png',
        description: 'KOI, USACO 등 프로그래밍 대회 준비를 위한 알고리즘 문제풀이 코스입니다.',
        totalUnits: 40,
        totalProblems: 1000,
        estimatedHours: 160,
        chapters: PROGRAMMING_CONTEST_CHAPTERS,
    },
    {
        id: '7',
        title: '자격증',
        icon: 'workspace_premium',
        gradient: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
        cardImage: '/images/courses/certificate.png',
        description: '워드프로세서, 컴활2급, 프로그래밍기능사 — 모의고사 293회분으로 자격증을 준비합니다.',
        totalUnits: 586, // 293회 × 2 (시험지 + 인터랙티브)
        totalProblems: 17580, // 293회 × 60문제
        estimatedHours: 293,
        chapters: WORDPROCESSOR_EXAM_CHAPTERS, // CertificateSelector에서 서브코스 선택
    },
];

// ── 유틸리티 함수 ──

/** 코스 ID로 코스 찾기 */
export function getCourseById(courseId: string): Course | undefined {
    return COURSES.find(c => c.id === courseId);
}

/** 코스의 모든 유닛을 flat 배열로 반환 */
export function getAllUnits(courseId: string) {
    const course = getCourseById(courseId);
    if (!course) return [];
    return course.chapters.flatMap(ch => ch.units);
}

/** 코스의 특정 유닛 찾기 */
export function getUnit(courseId: string, unitId: string) {
    return getAllUnits(courseId).find(u => u.id === unitId);
}

/** 전체 통계 */
export function getCurriculumStats() {
    return {
        totalCourses: COURSES.length,
        totalChapters: COURSES.reduce((sum, c) => sum + c.chapters.length, 0),
        totalUnits: COURSES.reduce((sum, c) => sum + c.totalUnits, 0),
        totalProblems: COURSES.reduce((sum, c) => sum + c.totalProblems, 0),
        totalHours: COURSES.reduce((sum, c) => sum + c.estimatedHours, 0),
    };
}

// Re-export types
export type { Course, Chapter, Unit, Quiz, CodeProblem, Page } from './types';
