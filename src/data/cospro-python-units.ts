/**
 * CosPro 파이썬 2급 — 학습 유닛 매핑
 * HTML 교재 파일은 /learn/cospro-python/ 에 위치
 */

export interface CosProUnit {
    id: string;
    title: string;
    htmlFile: string;
    category: string;
    icon: string;
    description: string;
}

export interface CosProCategory {
    id: string;
    title: string;
    icon: string;
    gradient: string;
    units: CosProUnit[];
}

export const COSPRO_PY2_CATEGORIES: CosProCategory[] = [
    {
        id: "theory",
        title: "이론 학습",
        icon: "menu_book",
        gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        units: [
            { id: "iron", title: "Iron — 파이썬 기초", htmlFile: "py-iron-v2-R40.html", category: "theory", icon: "looks_one", description: "변수, 자료형, 연산자, 입출력 기초" },
            { id: "bronze", title: "Bronze — 제어문", htmlFile: "py-bronze-v2-R40.html", category: "theory", icon: "looks_two", description: "조건문, 반복문, 중첩 제어문" },
            { id: "silver", title: "Silver — 함수·자료구조", htmlFile: "py-silver-v2-R40.html", category: "theory", icon: "looks_3", description: "함수, 리스트, 딕셔너리, 튜플" },
            { id: "gold", title: "Gold — 고급 문법", htmlFile: "py-gold-v2-R40.html", category: "theory", icon: "looks_4", description: "클래스, 예외처리, 파일I/O, 모듈" },
            { id: "types", title: "자료형 총정리", htmlFile: "py-cospro-types-v2-R40.html", category: "theory", icon: "data_object", description: "파이썬 자료형 심화 학습" },
            { id: "u01", title: "유닛 01", htmlFile: "py-cospro-u01-v2-R1.html", category: "theory", icon: "school", description: "CosPro 핵심 개념 정리" },
        ],
    },
    {
        id: "drill",
        title: "유형별 드릴",
        icon: "fitness_center",
        gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
        units: [
            { id: "drill-basic", title: "기초 드릴", htmlFile: "py-cospro-drill-basic-v2-R40.html", category: "drill", icon: "target", description: "기본 문법 반복 훈련" },
            { id: "drill-control", title: "제어문 드릴", htmlFile: "py-cospro-drill-control-v2-R40.html", category: "drill", icon: "alt_route", description: "조건문·반복문 집중 훈련" },
            { id: "drill-data", title: "자료구조 드릴", htmlFile: "py-cospro-drill-data-v2-R40.html", category: "drill", icon: "database", description: "리스트·딕셔너리 집중 훈련" },
            { id: "drill-func", title: "함수 드릴", htmlFile: "py-cospro-drill-func-v2-R40.html", category: "drill", icon: "function", description: "함수 정의·호출 집중 훈련" },
        ],
    },
    {
        id: "mock",
        title: "모의고사",
        icon: "quiz",
        gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
        units: [
            { id: "mock01", title: "모의고사 1회", htmlFile: "py-cospro-mock01-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 1회" },
            { id: "mock02", title: "모의고사 2회", htmlFile: "py-cospro-mock02-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 2회" },
            { id: "mock03", title: "모의고사 3회", htmlFile: "py-cospro-mock03-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 3회" },
            { id: "mock04", title: "모의고사 4회", htmlFile: "py-cospro-mock04-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 4회" },
            { id: "mock05", title: "모의고사 5회", htmlFile: "py-cospro-mock05-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 5회" },
            { id: "mock06", title: "모의고사 6회", htmlFile: "py-cospro-mock06-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 6회" },
            { id: "mock07", title: "모의고사 7회", htmlFile: "py-cospro-mock07-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 7회" },
            { id: "mock08", title: "모의고사 8회", htmlFile: "py-cospro-mock08-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 8회" },
            { id: "mock09", title: "모의고사 9회", htmlFile: "py-cospro-mock09-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 9회" },
            { id: "mock10", title: "모의고사 10회", htmlFile: "py-cospro-mock10-v2-R40.html", category: "mock", icon: "description", description: "실전 모의고사 10회" },
        ],
    },
    {
        id: "official",
        title: "기출문제",
        icon: "verified",
        gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
        units: [
            { id: "official", title: "CosPro 공식 기출", htmlFile: "py-cospro-official-v2-R40.html", category: "official", icon: "workspace_premium", description: "YBM 공식 기출문제 풀이" },
        ],
    },
];
