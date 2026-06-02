/**
 * C언어 문제집 인덱스
 * L1~L10 레벨 정의 및 문제 연결
 */

import type { ProblemBook } from './types';
import { C_L1_PROBLEMS } from './c-lang-L1';
import { C_L2_PROBLEMS } from './c-lang-L2';
import { C_L3_PROBLEMS } from './c-lang-L3';
import { C_L4_PROBLEMS } from './c-lang-L4';
import { C_L5_PROBLEMS } from './c-lang-L5';
import { C_L6_PROBLEMS } from './c-lang-L6';
import { C_L7_PROBLEMS } from './c-lang-L7';
import { C_L8_PROBLEMS } from './c-lang-L8';
import { C_L9_PROBLEMS } from './c-lang-L9';
import { C_L10_PROBLEMS } from './c-lang-L10';

export const C_PROBLEM_BOOK: ProblemBook = {
  id: 'c-problems',
  title: 'C언어 문제집',
  language: 'c',
  totalProblems: 2000,
  levels: [
    { id: 'c-L1', title: '입출력', description: 'printf와 scanf로 입력과 출력을 연습합니다.', icon: 'terminal', color: '#3b82f6', problems: C_L1_PROBLEMS },
    { id: 'c-L2', title: '변수와 연산자', description: '변수 선언, 자료형, 산술/복합 연산자를 연습합니다.', icon: 'data_object', color: '#10b981', problems: C_L2_PROBLEMS },
    { id: 'c-L3', title: '조건문', description: 'if, else if, switch, 삼항 연산자를 연습합니다.', icon: 'call_split', color: '#f59e0b', problems: C_L3_PROBLEMS },
    { id: 'c-L4', title: '반복문', description: 'for, while, 중첩 반복, 별찍기를 연습합니다.', icon: 'all_inclusive', color: '#ef4444', problems: C_L4_PROBLEMS },
    { id: 'c-L5', title: '배열', description: '1차원/2차원 배열, 검색, 정렬을 연습합니다.', icon: 'view_comfy', color: '#8b5cf6', problems: C_L5_PROBLEMS },
    { id: 'c-L6', title: '함수', description: '함수 선언, 매개변수, 재귀를 연습합니다.', icon: 'functions', color: '#ec4899', problems: C_L6_PROBLEMS },
    { id: 'c-L7', title: '문자열', description: 'string.h 함수와 문자열 처리를 연습합니다.', icon: 'text_fields', color: '#06b6d4', problems: C_L7_PROBLEMS },
    { id: 'c-L8', title: '포인터', description: '포인터, 주소, 배열과 포인터를 연습합니다.', icon: 'arrow_forward', color: '#84cc16', problems: C_L8_PROBLEMS },
    { id: 'c-L9', title: '구조체', description: '구조체, typedef, enum을 연습합니다.', icon: 'account_tree', color: '#f97316', problems: C_L9_PROBLEMS },
    { id: 'c-L10', title: '동적 메모리', description: 'malloc, free, 연결 리스트를 연습합니다.', icon: 'memory', color: '#fbbf24', problems: C_L10_PROBLEMS },
  ],
};

export const C_ACTIVE_LEVELS = C_PROBLEM_BOOK.levels.filter(l => l.problems.length > 0);
export function getCLevelById(levelId: string) { return C_PROBLEM_BOOK.levels.find(l => l.id === levelId) ?? null; }
export function getCProblemById(problemId: string) { for (const l of C_PROBLEM_BOOK.levels) { const f = l.problems.find(p => p.id === problemId); if (f) return f; } return null; }
