/**
 * 파이썬 문제집 인덱스
 * L1~L8 레벨 정의 및 문제 연결
 */

import type { ProblemBook } from './types';
import { PY_L1_PROBLEMS } from './py-lang-L1';
import { PY_L2_PROBLEMS } from './py-lang-L2';
import { PY_L3_PROBLEMS } from './py-lang-L3';
import { PY_L4_PROBLEMS } from './py-lang-L4';
import { PY_L5_PROBLEMS } from './py-lang-L5';
import { PY_L6_PROBLEMS } from './py-lang-L6';
import { PY_L7_PROBLEMS } from './py-lang-L7';
import { PY_L8_PROBLEMS } from './py-lang-L8';
import { PY_L9_PROBLEMS } from './py-lang-L9';
import { PY_L10_PROBLEMS } from './py-lang-L10';
import { PY_L11_PROBLEMS } from './py-lang-L11';
import { PY_L12_PROBLEMS } from './py-lang-L12';

export const PY_PROBLEM_BOOK: ProblemBook = {
  id: 'py-problems',
  title: '파이썬 문제집',
  language: 'python',
  totalProblems: 2100,
  levels: [
    { id: 'py-L1', title: '입출력', description: 'print, input, f-string으로 입출력을 연습한다.', icon: 'terminal', color: '#10b981', problems: PY_L1_PROBLEMS },
    { id: 'py-L2', title: '변수와 연산자', description: '변수, 자료형, 산술/비교 연산자를 연습한다.', icon: 'data_object', color: '#3b82f6', problems: PY_L2_PROBLEMS },
    { id: 'py-L3', title: '조건문', description: 'if, elif, else, 논리 연산자를 연습한다.', icon: 'call_split', color: '#f59e0b', problems: PY_L3_PROBLEMS },
    { id: 'py-L4', title: '반복문', description: 'for, while, 중첩 반복, break/continue를 연습한다.', icon: 'all_inclusive', color: '#ef4444', problems: PY_L4_PROBLEMS },
    { id: 'py-L5', title: '리스트', description: '리스트, 튜플, 슬라이싱, 컴프리헨션을 연습한다.', icon: 'view_comfy', color: '#8b5cf6', problems: PY_L5_PROBLEMS },
    { id: 'py-L6', title: '함수', description: '함수 정의, 매개변수, 람다, 재귀를 연습한다.', icon: 'functions', color: '#ec4899', problems: PY_L6_PROBLEMS },
    { id: 'py-L7', title: '문자열', description: '문자열 메서드, split/join, 포맷팅을 연습한다.', icon: 'text_fields', color: '#06b6d4', problems: PY_L7_PROBLEMS },
    { id: 'py-L8', title: '딕셔너리', description: '딕셔너리, 집합, 컴프리헨션을 연습한다.', icon: 'account_tree', color: '#84cc16', problems: PY_L8_PROBLEMS },
    { id: 'py-L9', title: '파일 입출력', description: '파일 열기/읽기/쓰기, with문, CSV/JSON 처리를 연습한다.', icon: 'folder_open', color: '#f97316', problems: PY_L9_PROBLEMS },
    { id: 'py-L10', title: '클래스', description: '클래스 정의, __init__, 메서드, 상속을 연습한다.', icon: 'schema', color: '#a855f7', problems: PY_L10_PROBLEMS },
    { id: 'py-L11', title: '예외 처리', description: 'try/except, 예외 종류, raise, 사용자 정의 예외를 연습한다.', icon: 'bug_report', color: '#ef4444', problems: PY_L11_PROBLEMS },
    { id: 'py-L12', title: '모듈', description: 'import, math, random, datetime 모듈 활용을 연습한다.', icon: 'extension', color: '#0ea5e9', problems: PY_L12_PROBLEMS },
  ],
};

export const PY_ACTIVE_LEVELS = PY_PROBLEM_BOOK.levels.filter(l => l.problems.length > 0);
export function getPyLevelById(levelId: string) { return PY_PROBLEM_BOOK.levels.find(l => l.id === levelId) ?? null; }
export function getPyProblemById(problemId: string) { for (const l of PY_PROBLEM_BOOK.levels) { const f = l.problems.find(p => p.id === problemId); if (f) return f; } return null; }
