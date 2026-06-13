/**
 * 코딩쏙 아카데미 — 커리큘럼 데이터 타입 정의
 * 200+ 유닛 커리큘럼을 위한 공통 타입
 */

/** 퀴즈 (객관식) */
export interface Quiz {
    question: string;
    options: string[];
    answer: number; // 0~3 index
    explanation: string;
}

/** 코드 문제 */
export interface CodeProblem {
    id: number;
    title: string;
    difficulty: 1 | 2 | 3; // 1=쉬움, 2=보통, 3=어려움
    question: string; // HTML or markdown
    answer: string;    // HTML or markdown
    codeTemplate?: string; // 코드 실행 문제용 초기 코드
}

/** 페이지 (유닛 내 개별 학습 항목) */
export interface Page {
    id: string;         // "3.1", "7.11" 등
    title: string;      // "새 프로젝트 만들기"
    type: '페이지' | '퀴즈' | '핵심정리' | 'QnA';
    content?: string;        // HTML 학습 콘텐츠
    quiz?: Quiz;             // 객관식 퀴즈
    problems?: CodeProblem[]; // 코드 문제
}

/** 학습 유닛 (하나의 레슨) */
export interface Unit {
    id: string;
    unitNumber: number;
    title: string;
    subtitle?: string;
    duration?: string;
    type?: '이론' | '실습' | '퀴즈' | '종합' | '프로젝트';
    difficulty?: 1 | 2 | 3;
    content?: string; // 학습 내용 (HTML/markdown) — 레거시 호환
    tip?: string;
    pages?: Page[];      // 유닛 내 상세 페이지/퀴즈 목록
    quiz?: Quiz;
    problems?: CodeProblem[];
    problemCount?: number;
}

/** 연령대 — 사고력수학 등 초등~고등까지 연령대별 과정에서 사용 */
export type AgeLevel = 'elementary' | 'middle' | 'advanced';

/** 챕터 (유닛들의 묶음) */
export interface Chapter {
    id: string;
    chapterNumber: number;
    title: string;
    icon: string;
    description: string;
    units: Unit[];
    /** 연령대 (선택). 설정 시 코스 상세 페이지에서 배지 표시 */
    ageLevel?: AgeLevel;
    /** 권장 학년 표시 (예: "초 4-6") */
    recommendedGrade?: string;
}

/** 코스 (챕터들의 묶음) */
export interface Course {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    gradient: string;
    cardImage?: string;
    description: string;
    totalUnits: number;
    totalProblems: number;
    estimatedHours: number;
    chapters: Chapter[];
    /** 정적 HTML 콘텐츠 경로 (learning-platform 연동용) */
    htmlPath?: string;
    /** 접근에 필요한 최소 티어 (없으면 누구나 접근 가능) */
    requiredTier?: string;
    /** 준비 중인 코스 (콘텐츠 미완성) */
    comingSoon?: boolean;
    /**
     * 자료 모드: 'iframe' (기본) — 정적 HTML 교재 / 'ppt' — 선생님이 업로드한 PPT 사용
     * ppt 모드일 경우 unit별 자료는 unit_materials 테이블에서 동적으로 로드
     */
    materialMode?: 'iframe' | 'ppt';
    /**
     * 코드 에디터 default language. 미지정 시 'python'.
     * 코스 진입 시 우측 sidebar의 CodeEditor가 이 언어로 시작.
     */
    defaultLanguage?: 'python' | 'c' | 'cpp' | 'lua';
}
