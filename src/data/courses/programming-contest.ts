import type { Chapter, Unit } from "./types";
import { getHtmlContentPath } from "./html-content-map";

function contestUnit(id: string, unitNumber: number, title: string, difficulty: 1 | 2 | 3): Unit {
    const path = getHtmlContentPath('6', unitNumber);
    return {
        id,
        unitNumber,
        title,
        type: "종합",
        difficulty,
        pages: path ? [{
            id,
            title,
            type: '페이지' as const,
            content: `<iframe src="${path}" style="width:100%;height:100%;border:none;min-height:80vh" />`,
        }] : [],
    };
}

export const PROGRAMMING_CONTEST_CHAPTERS: Chapter[] = [
    {
        id: "pc-iron",
        chapterNumber: 1,
        title: "Iron",
        icon: "shield",
        description: "C언어 입문형 대회 문제집입니다. 구현, 배열, 문자열, 함수, 포인터, 기초 자료구조를 다집니다.",
        units: [
            contestUnit("pc-iron-r1", 1, "C언어 입문 기초 문제집", 1),
            contestUnit("pc-iron-r2", 2, "배열, 문자열, 제어 흐름 심화", 1),
            contestUnit("pc-iron-r3", 3, "함수, 2차원 배열, 재귀 입문", 1),
            contestUnit("pc-iron-r4", 4, "포인터, 문자열 함수, 구조체 입문", 1),
            contestUnit("pc-iron-r5", 5, "동적 메모리, 파일 I/O, 전처리기", 1),
            contestUnit("pc-iron-r6", 6, "비트 연산, 수학 기초, 기초 정렬 알고리즘", 1),
            contestUnit("pc-iron-r7", 7, "스택 & 큐, 완전 탐색, 시뮬레이션", 1),
            contestUnit("pc-iron-r8", 8, "해시 & 맵, 문자열 심화, 종합 실전", 1),
        ],
    },
    {
        id: "pc-bronze",
        chapterNumber: 2,
        title: "Bronze",
        icon: "military_tech",
        description: "구현에서 DFS/BFS, 백트래킹, DP, 그래프, 문자열, 자료구조까지 Bronze 실전 감각을 올립니다.",
        units: [
            contestUnit("pc-bronze-r1", 9, "그리디 알고리즘, 투 포인터, 슬라이딩 윈도우", 1),
            contestUnit("pc-bronze-r2", 10, "누적 합, 이분 탐색, 정렬 심화", 1),
            contestUnit("pc-bronze-r3", 11, "DFS, BFS, 그래프 기초", 1),
            contestUnit("pc-bronze-r4", 12, "백트래킹, 분할 정복, 재귀 심화", 1),
            contestUnit("pc-bronze-r5", 13, "동적 프로그래밍 (Dynamic Programming)", 1),
            contestUnit("pc-bronze-r6", 14, "그래프 심화, 문자열 알고리즘, 정수론", 1),
            contestUnit("pc-bronze-r7", 15, "고급 자료구조, 고급 그래프, 기하 심화", 1),
            contestUnit("pc-bronze-r8", 16, "종합 실전, 대회 시뮬레이션, 졸업 시험", 1),
        ],
    },
    {
        id: "pc-silver",
        chapterNumber: 3,
        title: "Silver",
        icon: "workspace_premium",
        description: "KOI 2차와 USACO Silver 감각으로 고급 DP, 그래프, 문자열, 수학, 실전 모의까지 이어집니다.",
        units: [
            contestUnit("pc-silver-r1", 17, "고급 DP, 트리 심화, 문자열 심화", 2),
            contestUnit("pc-silver-r2", 18, "고급 그래프, 고급 자료구조, 수학 심화", 2),
            contestUnit("pc-silver-r3", 19, "게임 이론, 확률·기댓값, 구현 심화", 2),
            contestUnit("pc-silver-r4", 20, "플로우 심화, 기하 심화, 정수론 심화", 2),
            contestUnit("pc-silver-r5", 21, "문자열 고급, DP 최적화 고급, 자료구조 응용", 2),
            contestUnit("pc-silver-r6", 22, "대회 실전 I·II·III", 2),
            contestUnit("pc-silver-r7", 23, "고급 알고리즘 종합, 대회 전략, 실전 모의", 2),
            contestUnit("pc-silver-r8", 24, "Silver 졸업 시험, Gold 브릿지", 2),
        ],
    },
    {
        id: "pc-gold",
        chapterNumber: 4,
        title: "Gold",
        icon: "emoji_events",
        description: "KOI 본선, USACO Gold, Codeforces Div.2를 겨냥한 극한 DP, 자료구조, 그래프, 실전 라운드입니다.",
        units: [
            contestUnit("pc-gold-r1", 25, "극한 DP, 극한 자료구조, 극한 그래프", 3),
            contestUnit("pc-gold-r2", 26, "극한 문자열, 극한 수학, 극한 기하", 3),
            contestUnit("pc-gold-r3", 27, "IOI 실전, KOI 본선 실전, ICPC 실전", 3),
            contestUnit("pc-gold-r4", 28, "인터랙티브 문제, 특수 기법, 복합 문제", 3),
            contestUnit("pc-gold-r5", 29, "극한 실전 I·II·III", 3),
            contestUnit("pc-gold-r6", 30, "플래티넘 입문, 알고리즘 연구, 종합 마무리", 3),
            contestUnit("pc-gold-r7", 31, "고급 최적화, 고급 모델링, 플래티넘 브릿지", 3),
            contestUnit("pc-gold-r8", 32, "Gold 졸업 검증, 최종 종합 실전, Platinum 브릿지", 3),
        ],
    },
    {
        id: "pc-platinum",
        chapterNumber: 5,
        title: "Platinum",
        icon: 'diamond',
        description: "Platinum과 IOI 상위 난도를 겨냥한 고급 트리, 문자열, 수학, 최적화, 이론형 라운드입니다.",
        units: [
            contestUnit("pc-platinum-r1", 33, "고급 트리와 자료구조, 고급 그래프와 최적화", 3),
            contestUnit("pc-platinum-r2", 34, "고급 문자열, 고급 수학과 기하", 3),
            contestUnit("pc-platinum-r3", 35, "고급 DP와 최적화, 고급 그래프", 3),
            contestUnit("pc-platinum-r4", 36, "고급 자료구조, 고급 기하와 수학", 3),
            contestUnit("pc-platinum-r5", 37, "고급 문자열과 DP, 고급 그래프와 수학", 3),
            contestUnit("pc-platinum-r6", 38, "고급 자료구조 2, 고급 그래프 2", 3),
            contestUnit("pc-platinum-r7", 39, "고급 수학과 최적화 2, 구조적 증명과 이론", 3),
            contestUnit("pc-platinum-r8", 40, "Platinum 졸업 검증, 최종 복합 실전", 3),
        ],
    },
];
