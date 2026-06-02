/**
 * 코딩쏙 문제집 — 타입 정의
 * C언어 / Python 자체 문제집 시스템
 */

/** 예제 입출력 */
export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

/** 채점용 테스트케이스 (사용자에게 숨김) */
export interface TestCase {
  input: string;
  output: string;
}

/** 개별 문제 */
export interface Problem {
  /** 고유 ID: "c-L1-001", "py-L2-015" 형식 */
  id: string;
  /** 문제 제목 */
  title: string;
  /** 레벨 ID: "L1", "L2", ... "L10" */
  level: string;
  /** 레벨 이름: "입출력", "조건문" 등 */
  levelTitle: string;
  /** 난이도: 1=입문, 2=초급, 3=중급, 4=고급, 5=도전 */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** 분류 태그 */
  tags: string[];
  /** 문제 설명 (HTML 가능, 중학생 눈높이) */
  description: string;
  /** 입력 설명 */
  inputDesc: string;
  /** 출력 설명 */
  outputDesc: string;
  /** 공개 예제 (2~3개) */
  examples: ProblemExample[];
  /** 채점용 테스트케이스 (3~5개) */
  testCases: TestCase[];
  /** 힌트 (선택) */
  hint?: string;
  /**
   * 해설/풀이 (선택). 정답을 맞춘 후 또는 학생이 명시적으로 펼쳤을 때 표시.
   * 마크다운/HTML 가능 — 접근 방법, 핵심 알고리즘, 예시 코드 + 설명을 포함.
   */
  solution?: string;
  /** 참고 링크 — 백준/코드업 유사 문제 */
  relatedUrl?: string;
  /** 문제 이미지 URL */
  imageUrl?: string;
  /** 언어 */
  language: 'c' | 'python';
}

/** 레벨 (한 단원) */
export interface ProblemLevel {
  /** 레벨 ID: "c-L1", "c-L2" */
  id: string;
  /** 레벨 이름: "입출력" */
  title: string;
  /** 레벨 설명 */
  description: string;
  /** 아이콘 이름 (lucide-react 기준) */
  icon: string;
  /** 대표 색상 (hex) */
  color: string;
  /** 소속 문제 목록 */
  problems: Problem[];
}

/** 문제집 (언어 단위) */
export interface ProblemBook {
  /** 문제집 ID: "c-problems", "py-problems" */
  id: string;
  /** 문제집 이름: "C언어 문제집" */
  title: string;
  /** 언어 */
  language: 'c' | 'python';
  /** 목표 총 문제 수 */
  totalProblems: number;
  /** 레벨 목록 */
  levels: ProblemLevel[];
}

/** 난이도 메타데이터 */
export const PROBLEM_DIFFICULTY_META: Record<
  1 | 2 | 3 | 4 | 5,
  { label: string; color: string; bg: string }
> = {
  1: { label: '입문', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  2: { label: '초급', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  3: { label: '중급', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  4: { label: '고급', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  5: { label: '도전', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};
