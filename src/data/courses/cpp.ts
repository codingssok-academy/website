/**
 * 코딩쏙 C++ — 49 unit × 5 page = 245 슬라이드 (raw 매핑 + PNG 순서 검증 완료)
 *
 * 검증 요약: raw slide order and missing slide notes were checked during import.
 *
 * 책 구조 (실제 슬라이드 헤더 기반):
 *   - 1권 'C++ 입문 여정' (50 page) → raw/01,02,05~12 (10 unit, raw/03,04 중복 skip)
 *   - 2권 '변수와 자료형' (50 page) → raw/13~21 (9 unit, p21~25 누락 주의)
 *   - 3권 '입력과 연산자' (50 page) → vol3/01~10 (10 unit, vol3/10 = 마무리 정리)
 *   - 4권 '조건문' (100 page) → vol4/01~20 (20 unit: if 10 + else if·중첩 10)
 *
 * 검증 완료 (2026-04-28 직접 PNG Read 23장):
 *   ✅ 1권 50 page 완성 (raw/12 = p46~50)
 *   ✅ 2권 raw/21 = p46~50 종합 실습 완성 (p21~25만 누락)
 *   ✅ 3권 vol3/07 = 비교 연산자 p31~35 담당자 ChatGPT로 추가 완료 (2026-04-28)
 *   🔴 raw/05 PNG 순서 어긋남 (1=p11, 2=p15, 3=p12, 4=p14, 5=p13) → FOLDER_PAGE_ORDER 적용
 *   🔴 vol3/06 PNG 순서 어긋남 (1=p26, 2=p28, 3=p27, 4=p30, 5=p29) → FOLDER_PAGE_ORDER 적용
 *
 * 담당자 액션 필요 (자료 부재 — PDF에 슬라이드 추가):
 *   🟠 2권 p21~25 누락 (string 도입부 — char→string 다리) — raw/16(p20)→raw/17(p26) 점프
 *   🟠 3권 p46~50 누락 (3권 종합 실습) — vol3/09 끝 = p45, p46~50 부재
 *
 * 학습 페이지 흐름:
 *   - page 단위 navigation (floating pill ◀▶ + 키보드 ←→)
 *   - 5 page → 다음 unit, 1 page + 첫 unit 아니면 → 이전 unit 마지막 page
 */

import type { Chapter } from './types';

// ── 폴더 내 PNG 파일명이 페이지 순서와 어긋난 폴더 reorder 매핑 ──
// raw/05: 1.png=p11, 2.png=p15, 3.png=p12, 4.png=p14, 5.png=p13 → 정렬: [1,3,5,4,2]
// vol3/06: 1.png=p26, 2.png=p28, 3.png=p27, 4.png=p30, 5.png=p29 → 정렬: [1,3,2,5,4]
const FOLDER_PAGE_ORDER: Record<string, number[]> = {
    'raw/05': [1, 3, 5, 4, 2],
    'vol3/06': [1, 3, 2, 5, 4],
    // vol3/10: 1=p49, 2=p46, 3=p47, 4=p48, 5=p50 → [2,3,4,1,5]
    'vol3/10': [2, 3, 4, 1, 5],
};

function makePages(base: string, dir: string, count: number = 5) {
    // base 마지막 segment 추출 — raw / vol3 / vol4 / vol5 등 자동 인식
    const baseName = base.split('/').pop() ?? 'raw';
    const folder = `${baseName}/${dir}`;
    const order = FOLDER_PAGE_ORDER[folder] ?? Array.from({ length: count }, (_, i) => i + 1);
    return order.map((pageNum, i) => ({
        id: `${dir}-p${i + 1}`,
        title: `슬라이드 ${i + 1}`,
        type: '페이지' as const,
        content: `<div class="cs-slide-wrap"><img class="cs-slide" src="${base}/${dir}/${pageNum}.png" alt="슬라이드 ${i + 1}" loading="lazy" /></div>`,
    }));
}

interface UnitDef {
    id: string;
    unitNumber: number;
    title: string;
    type: '이론' | '실습' | '종합';
    base: string;
    dir: string;
}

function makeUnit({ id, unitNumber, title, type, base, dir }: UnitDef) {
    return {
        id,
        unitNumber,
        title,
        type,
        difficulty: 1 as const,
        duration: '15분',
        pages: makePages(base, dir, 5),
    };
}

const INTRO_BASE = '/learn/cpp/raw';
const VOL3_BASE = '/learn/cpp/vol3';
const VOL4_BASE = '/learn/cpp/vol4';

// 1권 — C++ 입문 여정 (10 unit)
const BOOK1_UNITS = [
    makeUnit({ id: 'cpp-b1u01', unitNumber: 1,  title: '1권 시작 — C++ 첫 만남',         type: '이론', base: INTRO_BASE, dir: '01' }),
    makeUnit({ id: 'cpp-b1u02', unitNumber: 2,  title: 'Hello World 코드 구조',          type: '이론', base: INTRO_BASE, dir: '02' }),
    makeUnit({ id: 'cpp-b1u03', unitNumber: 3,  title: 'cout 출력 기본',                 type: '이론', base: INTRO_BASE, dir: '05' }),
    makeUnit({ id: 'cpp-b1u04', unitNumber: 4,  title: 'endl과 줄바꿈',                  type: '이론', base: INTRO_BASE, dir: '06' }),
    makeUnit({ id: 'cpp-b1u05', unitNumber: 5,  title: '세미콜론과 오류 확인',           type: '실습', base: INTRO_BASE, dir: '07' }),
    makeUnit({ id: 'cpp-b1u06', unitNumber: 6,  title: '주석 — 한 줄 / 여러 줄',         type: '이론', base: INTRO_BASE, dir: '08' }),
    makeUnit({ id: 'cpp-b1u07', unitNumber: 7,  title: 'Hello World 응용 실습',          type: '실습', base: INTRO_BASE, dir: '09' }),
    makeUnit({ id: 'cpp-b1u08', unitNumber: 8,  title: '디버깅 — 틀린 코드 찾기',        type: '실습', base: INTRO_BASE, dir: '10' }),
    makeUnit({ id: 'cpp-b1u09', unitNumber: 9,  title: '실행 결과 예측',                 type: '실습', base: INTRO_BASE, dir: '11' }),
    makeUnit({ id: 'cpp-b1u10', unitNumber: 10, title: '1권 종합 실습',                  type: '종합', base: INTRO_BASE, dir: '12' }),
];

// 2권 — 변수와 자료형 (9 unit)
const BOOK2_UNITS = [
    makeUnit({ id: 'cpp-b2u01', unitNumber: 11, title: '변수란 무엇일까',                type: '이론', base: INTRO_BASE, dir: '13' }),
    makeUnit({ id: 'cpp-b2u02', unitNumber: 12, title: 'int 정수형',                     type: '이론', base: INTRO_BASE, dir: '14' }),
    makeUnit({ id: 'cpp-b2u03', unitNumber: 13, title: 'double 실수형',                  type: '이론', base: INTRO_BASE, dir: '15' }),
    makeUnit({ id: 'cpp-b2u04', unitNumber: 14, title: 'char 문자형',                    type: '이론', base: INTRO_BASE, dir: '16' }),
    makeUnit({ id: 'cpp-b2u05', unitNumber: 15, title: 'string 문자열',                  type: '이론', base: INTRO_BASE, dir: '17' }),
    makeUnit({ id: 'cpp-b2u06', unitNumber: 16, title: '변수 이름 짓기',                 type: '이론', base: INTRO_BASE, dir: '18' }),
    makeUnit({ id: 'cpp-b2u07', unitNumber: 17, title: '자료형 오류 찾기',               type: '실습', base: INTRO_BASE, dir: '19' }),
    makeUnit({ id: 'cpp-b2u08', unitNumber: 18, title: '자료형 실행 결과 예측',          type: '실습', base: INTRO_BASE, dir: '20' }),
    makeUnit({ id: 'cpp-b2u09', unitNumber: 19, title: '2권 종합 실습 — 자기소개 프로그램', type: '종합', base: INTRO_BASE, dir: '21' }),
];

// 3권 — 입력과 연산자 (10 unit)
const BOOK3_UNITS = [
    makeUnit({ id: 'cpp-b3u01', unitNumber: 20, title: '3권 시작 — 입력과 cin',              type: '이론', base: VOL3_BASE, dir: '01' }),
    makeUnit({ id: 'cpp-b3u02', unitNumber: 21, title: '정수 / 문자 / 문자열 입력',          type: '이론', base: VOL3_BASE, dir: '02' }),
    makeUnit({ id: 'cpp-b3u03', unitNumber: 22, title: 'string 입력 (한 단어 vs getline)',    type: '이론', base: VOL3_BASE, dir: '03' }),
    makeUnit({ id: 'cpp-b3u04', unitNumber: 23, title: '산술 연산자 (+, -, *, /, %)',         type: '이론', base: VOL3_BASE, dir: '04' }),
    makeUnit({ id: 'cpp-b3u05', unitNumber: 24, title: '나머지 연산자, 괄호 우선순위',        type: '이론', base: VOL3_BASE, dir: '05' }),
    makeUnit({ id: 'cpp-b3u06', unitNumber: 25, title: '대입 / 증감 연산자',                  type: '이론', base: VOL3_BASE, dir: '06' }),
    makeUnit({ id: 'cpp-b3u07', unitNumber: 26, title: '비교 연산자 ==, !=, <, >, <=, >=',    type: '이론', base: VOL3_BASE, dir: '07' }),
    makeUnit({ id: 'cpp-b3u08', unitNumber: 27, title: '논리 연산자 &&, ||, !',               type: '이론', base: VOL3_BASE, dir: '08' }),
    makeUnit({ id: 'cpp-b3u09', unitNumber: 28, title: '입력 순서 오류, 실행 결과 예측',      type: '실습', base: VOL3_BASE, dir: '09' }),
    makeUnit({ id: 'cpp-b3u10', unitNumber: 29, title: '3권 마무리 — 연산자 정리',            type: '종합', base: VOL3_BASE, dir: '10' }),
];

// 4권 — 조건문 (20 unit: if 10 + else if·중첩 10)
const BOOK4_UNITS = [
    // 1부 — if 조건문
    makeUnit({ id: 'cpp-b4u01', unitNumber: 30, title: 'if 조건문 — 첫 만남',                type: '이론', base: VOL4_BASE, dir: '01' }),
    makeUnit({ id: 'cpp-b4u02', unitNumber: 31, title: '참 / 거짓 (true / false)',           type: '이론', base: VOL4_BASE, dir: '02' }),
    makeUnit({ id: 'cpp-b4u03', unitNumber: 32, title: '비교 연산자로 조건 만들기',          type: '이론', base: VOL4_BASE, dir: '03' }),
    makeUnit({ id: 'cpp-b4u04', unitNumber: 33, title: 'if 블록과 중괄호',                   type: '이론', base: VOL4_BASE, dir: '04' }),
    makeUnit({ id: 'cpp-b4u05', unitNumber: 34, title: 'if 들여쓰기 — 코드 모양 잡기',       type: '이론', base: VOL4_BASE, dir: '05' }),
    makeUnit({ id: 'cpp-b4u06', unitNumber: 35, title: 'if 응용 — 짝수 / 홀수',              type: '실습', base: VOL4_BASE, dir: '06' }),
    makeUnit({ id: 'cpp-b4u07', unitNumber: 36, title: 'if 응용 — 양수 / 음수',              type: '실습', base: VOL4_BASE, dir: '07' }),
    makeUnit({ id: 'cpp-b4u08', unitNumber: 37, title: 'if 응용 — 시간대 분류',              type: '실습', base: VOL4_BASE, dir: '08' }),
    makeUnit({ id: 'cpp-b4u09', unitNumber: 38, title: 'if 디버깅 — 결과 예측',              type: '실습', base: VOL4_BASE, dir: '09' }),
    makeUnit({ id: 'cpp-b4u10', unitNumber: 39, title: 'if 1부 종합 실습',                   type: '종합', base: VOL4_BASE, dir: '10' }),
    // 2부 — else if + 중첩 조건
    makeUnit({ id: 'cpp-b4u11', unitNumber: 40, title: 'else 키워드 — 두 갈래',              type: '이론', base: VOL4_BASE, dir: '11' }),
    makeUnit({ id: 'cpp-b4u12', unitNumber: 41, title: 'if-else 짝 맞추기',                  type: '이론', base: VOL4_BASE, dir: '12' }),
    makeUnit({ id: 'cpp-b4u13', unitNumber: 42, title: 'else if — 여러 갈래',                type: '이론', base: VOL4_BASE, dir: '13' }),
    makeUnit({ id: 'cpp-b4u14', unitNumber: 43, title: 'else if 응용 — 학점 계산',           type: '실습', base: VOL4_BASE, dir: '14' }),
    makeUnit({ id: 'cpp-b4u15', unitNumber: 44, title: 'else if 응용 — 등급 분류',           type: '실습', base: VOL4_BASE, dir: '15' }),
    makeUnit({ id: 'cpp-b4u16', unitNumber: 45, title: '중첩 조건 — if 안에 if',             type: '이론', base: VOL4_BASE, dir: '16' }),
    makeUnit({ id: 'cpp-b4u17', unitNumber: 46, title: '중첩 조건 — 응용 실습',              type: '실습', base: VOL4_BASE, dir: '17' }),
    makeUnit({ id: 'cpp-b4u18', unitNumber: 47, title: '논리 연산자와 조건 결합',            type: '이론', base: VOL4_BASE, dir: '18' }),
    makeUnit({ id: 'cpp-b4u19', unitNumber: 48, title: '조건문 디버깅 — 결과 예측',          type: '실습', base: VOL4_BASE, dir: '19' }),
    makeUnit({ id: 'cpp-b4u20', unitNumber: 49, title: '4권 종합 실습 — 계산기 프로그램',    type: '종합', base: VOL4_BASE, dir: '20' }),
];

export const CPP_CHAPTERS: Chapter[] = [
    {
        id: 'cpp-book1',
        chapterNumber: 1,
        title: '1권 — C++ 입문 여정',
        icon: 'play_arrow',
        description: '10 unit × 5 슬라이드. Hello World부터 1권 종합 실습까지. 첫 코드, cout 출력, 줄바꿈, 세미콜론, 주석, 디버깅, 실행 결과 예측.',
        units: BOOK1_UNITS,
    },
    {
        id: 'cpp-book2',
        chapterNumber: 2,
        title: '2권 — 변수와 자료형',
        icon: 'inventory_2',
        description: '9 unit × 5 슬라이드. int / double / char / string 4가지 자료형 마스터 + 변수 이름 + 오류 찾기 + 자기소개 프로그램.',
        units: BOOK2_UNITS,
    },
    {
        id: 'cpp-book3',
        chapterNumber: 3,
        title: '3권 — 입력과 연산자',
        icon: 'calculate',
        description: '10 unit × 5 슬라이드. cin 입력 + 산술 / 나머지 / 대입 / 증감 / 비교 / 논리 연산자 + 마무리 정리.',
        units: BOOK3_UNITS,
    },
    {
        id: 'cpp-book4',
        chapterNumber: 4,
        title: '4권 — 조건문',
        icon: 'fork_right',
        description: '20 unit × 5 슬라이드. if 조건문 1부(10 unit) + else if · 중첩 조건 2부(10 unit). 짝/홀수, 학점, 등급 분류, 계산기 종합 실습까지.',
        units: BOOK4_UNITS,
    },
];
