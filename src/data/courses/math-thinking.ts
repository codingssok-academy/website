/**
 * 사고력 수학 커리큘럼
 * 논리·이산수학·문제해결 — CS50 스타일
 * 코딩하는 두뇌를 만드는 사고력 수학 입문 과정
 */

import type { Chapter, Page } from './types';

const BASE = '/learn/사고력수학';

function page(id: string, title: string, file: string): Page {
    return {
        id,
        title,
        type: '페이지' as const,
        content: `<iframe src="${BASE}/${file}" style="width:100%;height:100%;border:none;min-height:80vh" />`,
    };
}

function unit(id: string, num: number, title: string, subtitle: string, htmlFile?: string, dur = '30분') {
    return {
        id,
        unitNumber: num,
        title,
        subtitle,
        type: '이론' as const,
        difficulty: 2 as const,
        duration: dur,
        pages: htmlFile ? [page(`${id}-p1`, title, htmlFile)] : [],
    };
}

export const MATH_THINKING_CHAPTERS: Chapter[] = [
    {
        id: 'mt-ch1',
        chapterNumber: 1,
        title: '논리적 사고의 시작',
        icon: 'psychology',
        description: '명제, 참/거짓, 조건, 부정 — 컴퓨터처럼 생각하는 첫걸음',
        ageLevel: 'elementary',
        recommendedGrade: '초 4-6',
        units: [
            unit('mt-u01', 1, '참과 거짓', '명제란 무엇인가', 'MT-u01-true-false.html'),
            unit('mt-u02', 2, '그리고/또는/아니다', '논리 연산자 입문', 'MT-u02-logic-operators.html'),
            unit('mt-u03', 3, '만약 ~라면', '조건문의 수학적 의미', 'MT-u03-if-then.html'),
            unit('mt-u04', 4, '진리표 만들기', '모든 경우를 표로 정리하기', 'MT-u04-truth-table.html'),
        ],
    },
    {
        id: 'mt-ch2',
        chapterNumber: 2,
        title: '집합과 분류',
        icon: 'category',
        description: '집합, 부분집합, 합집합·교집합 — 데이터를 묶고 나누는 사고',
        ageLevel: 'elementary',
        recommendedGrade: '초 5-6 / 중 1',
        units: [
            unit('mt-u05', 5, '집합이란?', '같은 성질의 묶음', 'MT-u05-sets.html'),
            unit('mt-u06', 6, '벤다이어그램', '겹치는 것과 안 겹치는 것'),
            unit('mt-u07', 7, '합집합과 교집합', '더하고 겹치는 셈법'),
            unit('mt-u08', 8, '여집합과 차집합', '뺄셈과 반대'),
        ],
    },
    {
        id: 'mt-ch3',
        chapterNumber: 3,
        title: '경우의 수와 확률',
        icon: 'casino',
        description: '나열, 순서, 조합 — 가능성을 세는 방법',
        ageLevel: 'middle',
        recommendedGrade: '중 1-2',
        units: [
            unit('mt-u09', 9, '경우의 수 세기', '체계적으로 빠짐없이'),
            unit('mt-u10', 10, '순열 — 순서가 중요할 때', 'nPr 직관 이해'),
            unit('mt-u11', 11, '조합 — 순서가 상관없을 때', 'nCr 직관 이해'),
            unit('mt-u12', 12, '확률의 시작', '가능성을 숫자로 표현'),
        ],
    },
    {
        id: 'mt-ch4',
        chapterNumber: 4,
        title: '수열과 패턴',
        icon: 'timeline',
        description: '규칙 찾기, 점화식, 피보나치 — 반복 사고의 수학',
        ageLevel: 'middle',
        recommendedGrade: '중 2-3',
        units: [
            unit('mt-u13', 13, '규칙 찾기', '다음에 올 수는?'),
            unit('mt-u14', 14, '등차수열과 등비수열', '늘어나는 두 가지 방법'),
            unit('mt-u15', 15, '피보나치 수열', '자연 속 수학'),
            unit('mt-u16', 16, '점화식 — 다음 항 만들기', '재귀적 사고'),
        ],
    },
    {
        id: 'mt-ch5',
        chapterNumber: 5,
        title: '문제해결 전략',
        icon: 'lightbulb',
        description: '나누어 정복, 거꾸로 풀기, 패턴 인식 — 알고리즘 사고법',
        ageLevel: 'advanced',
        recommendedGrade: '중 3 / 고 1',
        units: [
            unit('mt-u17', 17, '문제를 작게 쪼개기', 'Divide & Conquer 입문'),
            unit('mt-u18', 18, '거꾸로 풀어보기', '결과에서 시작하는 사고'),
            unit('mt-u19', 19, '패턴 발견하기', '같은 구조 알아채기'),
            unit('mt-u20', 20, '추론과 증명', '왜 그런지 설명하기'),
        ],
    },
];
