/**
 * 코딩쏙 아카데미 — 전체 커리큘럼 인덱스
 */

import type { Course, Chapter } from './types';
import { PYTHON_BASICS } from './python-basics';
import { COMPUTER_BASICS } from './computer-basics';
import { CODING_BASICS } from './coding-basics';
import { PHYSICAL_COMPUTING } from './physical-computing';
import { MATH_THINKING_CHAPTERS } from './math-thinking';
import { AI_LITERACY_CHAPTERS } from './ai-literacy';
import { CPP_CHAPTERS } from './cpp';
import { PROGRAMMING_CONTEST_CHAPTERS } from './programming-contest';
import { WORDPROCESSOR_CHAPTERS } from './wordprocessor';
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

// ── CosPro 서브 코스 정의 ──
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
        title: '어린이 IT',
        icon: 'child_care',
        gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        cardImage: '/images/courses/kids-it.png',
        description: '5~9세 영유아 IT 입문 — 13단계 풀 시리즈. 기계부터 AI까지 차근차근. 0-1 단원 슬라이드 준비 완료.',
        totalUnits: 38,
        totalProblems: 0,
        estimatedHours: 25,
        chapters: KIDS_IT_CHAPTERS,
        materialMode: 'ppt',
    },
    {
        id: '12',
        title: '정보올림피아드 대회',
        subtitle: '알고리즘 · 문제해결 · 실전 대비',
        icon: 'emoji_events',
        gradient: 'linear-gradient(135deg, #1e40af, #312e81)',
        cardImage: '/images/courses/koi.png',
        description: '정보올림피아드 대회 학습 카드 410장 — 1교시·2교시 × 입문·초급·중급·고급 8단계 커리큘럼. C++ 트랙.',
        totalUnits: 8,
        totalProblems: 0,
        estimatedHours: 40,
        chapters: KOI_CHAPTERS,
        materialMode: 'ppt',
        defaultLanguage: 'cpp',
    },
    {
        id: '9',
        title: '사고력 수학',
        icon: 'calculate',
        gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
        cardImage: '/images/courses/math-thinking.png',
        description: '논리·이산수학·문제해결 — CS50 스타일로 코딩하는 두뇌를 만드는 사고력 수학입니다.',
        totalUnits: 20,
        totalProblems: 0,
        estimatedHours: 25,
        chapters: MATH_THINKING_CHAPTERS,
    },
    {
        id: '8',
        title: '컴퓨터 기초',
        icon: 'computer',
        gradient: 'linear-gradient(135deg, #ec4899, #60a5fa)',
        cardImage: '/images/courses/computer-basics.png',
        description: '컴퓨터가 뭔지부터 하드웨어, 소프트웨어, 인터넷, 이진수, 문제해결까지 완전 기초를 배웁니다.',
        totalUnits: 22,
        totalProblems: 0,
        estimatedHours: 30,
        chapters: COMPUTER_BASICS,
        materialMode: 'ppt',
    },
    {
        id: '1',
        title: '코딩 기초',
        icon: 'code',
        gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        cardImage: '/images/courses/coding-basics.png',
        description: '코딩이 뭔지, 왜 배우는지, 변수/조건/반복 개념, 문제해결 사고력, 개발 환경 첫걸음까지.',
        totalUnits: 22,
        totalProblems: 0,
        estimatedHours: 30,
        chapters: CODING_BASICS,
        materialMode: 'ppt',
    },
    {
        id: '2',
        title: '피지컬 컴퓨팅',
        icon: 'memory',
        gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
        cardImage: '/images/courses/physical-computing.png',
        description: '아두이노, 센서, 서보모터, 반도체 원리부터 IoT 프로젝트까지 실습합니다.',
        totalUnits: 22,
        totalProblems: 0,
        estimatedHours: 40,
        chapters: PHYSICAL_COMPUTING,
        materialMode: 'ppt',
    },
    {
        id: '3',
        title: '파이썬',
        icon: 'data_object',
        gradient: 'linear-gradient(135deg, #3b82f6, #3b82f6)',
        cardImage: '/images/courses/python.png',
        description: '파이썬의 기초 문법부터 자료구조, 함수, 클래스까지 체계적으로 학습합니다.',
        totalUnits: 94,
        totalProblems: 0,
        estimatedHours: 60,
        chapters: PYTHON_BASICS,
    },
    {
        id: '10',
        title: 'AI 강의',
        icon: 'smart_toy',
        gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        cardImage: '/images/courses/ai-class.png',
        description: 'AI 사용법, MCP, 프롬프트 엔지니어링, AI 도구 활용 — 미래를 위한 AI 역량을 키웁니다.',
        totalUnits: 22,
        totalProblems: 0,
        estimatedHours: 32,
        chapters: AI_LITERACY_CHAPTERS,
    },
    {
        id: '4',
        title: 'C++',
        icon: 'terminal',
        gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        cardImage: '/images/courses/cpp.png',
        description: 'C++ 49단원. 입문, 변수와 자료형, 입력과 연산자, 조건문까지 PNG 이미지 수업자료로 학습합니다.',
        totalUnits: 49,
        totalProblems: 0,
        estimatedHours: 32,
        chapters: CPP_CHAPTERS,
        defaultLanguage: 'cpp',
    },
    {
        id: '5',
        title: 'CosPro',
        icon: 'verified',
        gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        cardImage: '/images/courses/cospro.png',
        description: 'CosPro 파이썬/C언어 1급·2급 자격증 시험을 체계적으로 준비합니다.',
        totalUnits: 0,
        totalProblems: 0,
        estimatedHours: 0,
        chapters: EMPTY_CHAPTERS,
        comingSoon: true,
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
