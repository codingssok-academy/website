/**
 * 파이썬 커리큘럼 데이터
 * 3개 레벨 (L1-L3)
 * L1: 파이썬 시작하기 (10 units)
 * L2: 기본 문법 (20 units)
 * L3: 활용 — 이론 1개 + 프로젝트 5개 교차 배치
 */

import type { Chapter, Page } from './types';

const BASE = '/learn/python';

function page(id: string, title: string, file: string): Page {
    return { id, title, type: '페이지' as const, content: `<iframe src="${BASE}/${file}" style="width:100%;height:100%;border:none;min-height:80vh" />` };
}

/** 프로젝트 유닛 생성 헬퍼 */
function pj(id: string, num: number, title: string, file: string, diff: 1 | 2 | 3 = 2) {
    return { id, unitNumber: num, title: `프로젝트: ${title}`, type: '프로젝트' as const, difficulty: diff, duration: '40분', pages: [page(id + '-p1', title, file)] };
}

/** 이론 유닛 생성 헬퍼 */
function theory(id: string, num: number, title: string, file: string, diff: 1 | 2 | 3 = 2, dur = '30분') {
    return { id, unitNumber: num, title, type: '이론' as const, difficulty: diff, duration: dur, pages: [page(id + '-p1', title, file)] };
}

export const PYTHON_BASICS: Chapter[] = [
    // ══════════════════════════════════════════
    // Level 1: 파이썬 시작하기 (10 units)
    // ══════════════════════════════════════════
    {
        id: 'py-L1', chapterNumber: 1, title: '파이썬 시작하기', icon: 'code',
        description: 'Python 소개, 환경 설정, 첫 프로그램, 주석, 들여쓰기',
        units: [
            {
                id: 'py-L1-u01', unitNumber: 1, title: 'Python이란? — 역사와 특징',
                type: '이론', difficulty: 1, duration: '30분',
                pages: [
                    page('py-L1-u01-p1', 'Python이란? — 역사와 특징', 'L1-u01-python-intro-v2.html'),
                    page('py-L1-u01-p2', 'Python이란? (R1)', 'L1-u01-python-intro-v2-R1.html'),
                    page('py-L1-u01-p3', 'Python이란? (R2)', 'L1-u01-python-intro-v2-R2.html'),
                    page('py-L1-u01-p4', 'Python이란? (R3)', 'L1-u01-python-intro-v2-R3.html'),
                ],
            },
            {
                id: 'py-L1-u02', unitNumber: 2, title: '개발 환경 준비 — VS Code + Python 설치',
                type: '이론', difficulty: 1, duration: '30분',
                pages: [
                    page('py-L1-u02-p1', '개발 환경 준비', 'L1-u02-setup-v2.html'),
                    page('py-L1-u02-p2', '개발 환경 준비 (R1)', 'L1-u02-setup-v2-R1.html'),
                    page('py-L1-u02-p3', '개발 환경 준비 (R2)', 'L1-u02-setup-v2-R2.html'),
                    page('py-L1-u02-p4', '개발 환경 준비 (R3)', 'L1-u02-setup-v2-R3.html'),
                ],
            },
            {
                id: 'py-L1-u03', unitNumber: 3, title: 'Hello, World! — 첫 프로그램',
                type: '이론', difficulty: 1, duration: '30분',
                pages: [
                    page('py-L1-u03-p1', 'Hello, World! (R1)', 'L1-u03-hello-world-v2-R1.html'),
                    page('py-L1-u03-p2', 'Hello, World! (R2)', 'L1-u03-hello-world-v2-R2.html'),
                    page('py-L1-u03-p3', 'Hello, World! (R3)', 'L1-u03-hello-world-v2-R3.html'),
                    page('py-L1-u03-p4', 'Hello, World! (R4)', 'L1-u03-hello-world-v2-R4.html'),
                    page('py-L1-u03-p5', 'Hello, World! (R5)', 'L1-u03-hello-world-v2-R5.html'),
                    page('py-L1-u03-p6', 'Hello, World! (R6)', 'L1-u03-hello-world-v2-R6.html'),
                ],
            },
            {
                id: 'py-L1-u04', unitNumber: 4, title: '자료형 맛보기 — 숫자와 문자의 차이',
                type: '이론', difficulty: 1, duration: '30분',
                pages: [page('py-L1-u04-p1', '자료형 맛보기', 'L1-u04-data-types-v2.html')],
            },
            {
                id: 'py-L1-u05', unitNumber: 5, title: '프로젝트: 자기소개 프로그램',
                type: '프로젝트', difficulty: 1, duration: '40분',
                pages: [
                    page('py-L1-u05-p1', '자기소개 프로그램', 'L1-u05-project-intro-v2.html'),
                    page('py-L1-u05-p2', '자기소개 프로그램 (R1)', 'L1-u05-project-intro-v2-R1.html'),
                    page('py-L1-u05-p3', '자기소개 프로그램 (R2)', 'L1-u05-project-intro-v2-R2.html'),
                    page('py-L1-u05-p4', '자기소개 프로그램 (R3)', 'L1-u05-project-intro-v2-R3.html'),
                    page('py-L1-u05-p5', '자기소개 프로그램 (R4)', 'L1-u05-project-intro-v2-R4.html'),
                    page('py-L1-u05-p6', '자기소개 프로그램 (R5)', 'L1-u05-project-intro-v2-R5.html'),
                    page('py-L1-u05-p7', '자기소개 프로그램 (R6)', 'L1-u05-project-intro-v2-R6.html'),
                ],
            },
            {
                id: 'py-L1-u06', unitNumber: 6, title: '주석 — 코드에 메모 남기기',
                type: '이론', difficulty: 1, duration: '25분',
                pages: [
                    page('py-L1-u06-p1', '주석 (R1)', 'L1-u06-comments-v2-R1.html'),
                    page('py-L1-u06-p2', '주석 (R2)', 'L1-u06-comments-v2-R2.html'),
                    page('py-L1-u06-p3', '주석 (R3)', 'L1-u06-comments-v2-R3.html'),
                    page('py-L1-u06-p4', '주석 (R4)', 'L1-u06-comments-v2-R4.html'),
                    page('py-L1-u06-p5', '주석 (R5)', 'L1-u06-comments-v2-R5.html'),
                    page('py-L1-u06-p6', '주석 (R6)', 'L1-u06-comments-v2-R6.html'),
                ],
            },
            {
                id: 'py-L1-u07', unitNumber: 7, title: '들여쓰기 — Python의 문법 규칙',
                type: '이론', difficulty: 1, duration: '25분',
                pages: [
                    page('py-L1-u07-p1', '들여쓰기 (R1)', 'L1-u07-indentation-v2-R1.html'),
                    page('py-L1-u07-p2', '들여쓰기 (R2)', 'L1-u07-indentation-v2-R2.html'),
                    page('py-L1-u07-p3', '들여쓰기 (R3)', 'L1-u07-indentation-v2-R3.html'),
                    page('py-L1-u07-p4', '들여쓰기 (R4)', 'L1-u07-indentation-v2-R4.html'),
                    page('py-L1-u07-p5', '들여쓰기 (R5)', 'L1-u07-indentation-v2-R5.html'),
                    page('py-L1-u07-p6', '들여쓰기 (R6)', 'L1-u07-indentation-v2-R6.html'),
                ],
            },
            {
                id: 'py-L1-u08', unitNumber: 8, title: '에러 메시지 읽기 — 당황하지 않기',
                type: '이론', difficulty: 1, duration: '25분',
                pages: [page('py-L1-u08-p1', '에러 메시지 읽기', 'L1-u08-error-reading-v2.html')],
            },
            {
                id: 'py-L1-u09', unitNumber: 9, title: '프로젝트: 나만의 챗봇 만들기',
                type: '프로젝트', difficulty: 1, duration: '40분',
                pages: [page('py-L1-u09-p1', '나만의 챗봇', 'L1-u09-project-chatbot-v2.html')],
            },
            {
                id: 'py-L1-u10', unitNumber: 10, title: '프로젝트: 별로 그림 그리기',
                type: '프로젝트', difficulty: 1, duration: '40분',
                pages: [
                    page('py-L1-u10-p1', '별로 그림 그리기', 'L1-u10-project-stars-v2.html'),
                    page('py-L1-u10-p2', '별로 그림 그리기 (R1)', 'L1-u10-project-stars-v2-R1.html'),
                ],
            },
        ],
    },

    // ══════════════════════════════════════════
    // Level 2: 기본 문법 — 이론 → 프로젝트 5개 패턴
    // ══════════════════════════════════════════

    // ── L2a: 변수, 입력, 연산자 ──
    {
        id: 'py-L2a', chapterNumber: 2, title: '변수, 입력, 연산자', icon: 'edit',
        description: '변수, input(), 연산자 — 이론 배우고 바로 프로젝트 실습',
        units: [
            theory('py-L2-u01', 1, '변수 — 값에 이름 붙이기', 'L2-u01-variables-v2.html', 1),
            theory('py-L2-u02', 2, 'input() — 사용자 입력 받기', 'L2-u02-input-v2.html', 1),
            theory('py-L2-u04', 3, '연산자 — 계산과 비교', 'L2-u04-operators-v2.html', 1),
            pj('pj-L2-calc', 4, '나만의 계산기', 'L2-u03-project-calculator-v2.html', 1),
            pj('pj-L2-bmi', 5, 'BMI 계산기', 'L2-pj-bmi-v2.html', 1),
            pj('pj-L2-age', 6, '나이 계산기 + 12간지', 'L2-pj-age-calc-v2.html', 1),
            pj('pj-L2-tip', 7, '팁 계산기', 'L2-pj-tip-calc-v2.html', 1),
            pj('pj-L2-love', 8, '사랑 퍼센트 계산기', 'L2-pj-love-calc-v2.html', 1),
        ],
    },

    // ── L2b: 조건문, 반복문 ──
    {
        id: 'py-L2b', chapterNumber: 3, title: '조건문과 반복문', icon: 'fork_right',
        description: 'if/elif/else, for, while — 조건과 반복의 세계',
        units: [
            { id: 'py-L2-u05', unitNumber: 1, title: '조건문 — if, elif, else', type: '이론' as const, difficulty: 2 as const, duration: '35분', pages: [
                page('py-L2-u05-p1', '조건문 R1 — 기초', 'L2-u05-if-else-v2.html'),
                page('py-L2-u05-p2', '조건문 R2 — 논리 연산자 심화', 'L2-u05-if-else-v2-R2.html'),
                page('py-L2-u05-p3', '조건문 R3 — 실전 응용', 'L2-u05-if-else-v2-R3.html'),
                page('py-L2-u05-p4', '조건문 R4 — 연습문제', 'L2-u05-if-else-v2-R4.html'),
                page('py-L2-u05-p5', '조건문 R5 — 챌린지', 'L2-u05-if-else-v2-R5.html'),
                page('py-L2-u05-p6', '조건문 R6 — 종합 정리', 'L2-u05-if-else-v2-R6.html'),
            ] },
            pj('pj-L2-grade', 2, '성적 관리', 'L2-u06-project-grade-v2.html'),
            pj('pj-L2-rock', 3, '가위바위보', 'L2-pj-rock-paper-v2.html'),
            pj('pj-L2-quiz', 4, '퀴즈 게임', 'L2-pj-quiz-simple-v2.html'),
            pj('pj-L2-coin', 5, '동전 던지기', 'L2-pj-coin-flip-v2.html'),
            pj('pj-L2-multi', 6, '구구단 게임', 'L2-pj-multiplication-v2.html'),

            theory('py-L2-u07', 7, '반복문 — for와 range()', 'L2-u07-for-range-v2.html'),
            theory('py-L2-u08', 8, '반복문 — while', 'L2-u08-while-v2.html'),
            pj('pj-L2-game', 9, '숫자 게임', 'L2-u09-project-game-v2.html'),
            pj('pj-L2-guess', 10, '숫자 맞추기', 'L2-pj-guessing-v2.html'),
            pj('pj-L2-pattern', 11, '별 패턴 만들기', 'L2-pj-pattern-v2.html'),
            pj('pj-L2-lotto', 12, '간단 로또', 'L2-pj-lotto-simple-v2.html'),
            pj('pj-L2-random-team', 13, '랜덤 팀 나누기', 'L2-pj-random-name-v2.html'),
        ],
    },

    // ── L2c: 문자열, 리스트 ──
    {
        id: 'py-L2c', chapterNumber: 4, title: '문자열과 리스트', icon: 'view_list',
        description: '텍스트와 데이터 묶음 다루기',
        units: [
            theory('py-L2-u10', 1, '문자열 — 텍스트의 세계', 'L2-u10-string-v2.html'),
            pj('pj-L2-counter', 2, '글자수 세기', 'L2-pj-counter-v2.html'),
            pj('pj-L2-reverse', 3, '문장 뒤집기 도구', 'L2-pj-reverse-v2.html'),
            pj('pj-L2-emoji', 4, '텍스트 이모티콘 만들기', 'L2-pj-emoji-maker-v2.html'),

            theory('py-L2-u11', 5, '리스트 — 데이터의 그릇', 'L2-u11-list-v2.html'),
            pj('pj-L2-data', 6, '데이터 분석기', 'L2-u12-project-data-v2.html'),
            pj('pj-L2-shopping', 7, '장보기 목록', 'L2-pj-shopping-v2.html'),
            pj('pj-L2-diary', 8, '한줄 일기', 'L2-pj-diary-simple-v2.html'),
        ],
    },

    // ── L2d: 튜플, 딕셔너리, 세트, 함수 ──
    {
        id: 'py-L2d', chapterNumber: 5, title: '자료구조와 함수', icon: 'category',
        description: '튜플, 딕셔너리, 세트, 함수 — 데이터를 체계적으로',
        units: [
            theory('py-L2-u13', 1, '튜플 — 변하지 않는 묶음', 'L2-u13-tuple-v2.html'),
            theory('py-L2-u14', 2, '딕셔너리 — 이름표가 붙은 데이터', 'L2-u14-dict-v2.html'),
            pj('pj-L2-menu', 3, '분식집 메뉴판', 'L2-pj-menu-v2.html'),
            pj('pj-L2-contacts', 4, '연락처 관리', 'L2-pj-contacts-v2.html'),

            theory('py-L2-u15', 5, '세트 — 중복 없는 집합', 'L2-u15-set-v2.html'),
            pj('pj-L2-attend', 6, '출석부', 'L2-pj-attendance-v2.html'),

            theory('py-L2-u16', 7, '함수 — 코드를 이름으로 묶기', 'L2-u16-function-v2.html'),
            pj('pj-L2-temp', 8, '온도 변환기', 'L2-pj-temp-convert-v2.html'),
            pj('pj-L2-grade-f', 9, '성적 등급 함수', 'L2-pj-grade-func-v2.html'),
        ],
    },

    // ── L2e: 모듈, 파일, 예외 ──
    {
        id: 'py-L2e', chapterNumber: 6, title: '모듈, 파일, 예외', icon: 'folder_open',
        description: '모듈 활용, 파일 저장, 에러 처리',
        units: [
            theory('py-L2-u17', 1, '모듈과 패키지 — 코드를 파일로 나누기', 'L2-u17-module-v2.html'),
            theory('py-L2-u18', 2, '파일 입출력 — 데이터를 영구 저장하기', 'L2-u18-file-io-v2.html'),
            pj('pj-L2-memo', 3, '메모 저장하기', 'L2-pj-memo-save-v2.html'),

            theory('py-L2-u19', 4, '예외 처리 — 에러를 우아하게 다루기', 'L2-u19-exception-v2.html'),
            pj('pj-L2-safe', 5, '안전한 입력', 'L2-pj-safe-input-v2.html'),

            pj('pj-L2-final', 6, '종합 프로젝트 — Layer 2 완전 정복', 'L2-u20-project-v2.html'),
        ],
    },

    // ══════════════════════════════════════════
    // Level 3: 활용
    // 패턴: 이론 1개 → 프로젝트 5개
    // ══════════════════════════════════════════

    // ── L3a: 함수 활용 ──
    {
        id: 'py-L3a', chapterNumber: 3, title: '함수 활용', icon: 'settings',
        description: '매개변수 심화, 반환값 활용, 람다, 내장 함수 — 이론마다 프로젝트 5개',
        units: [
            theory('py-L3-u21', 1, '매개변수 심화 — 기본값, 키워드 인자', 'L3-u21-params-advanced-v2.html'),
            pj('pj-a1-1', 2, '단위 변환기', 'L3-u25-project-math-tools-v2-R1.html'),
            pj('pj-a1-2', 3, '닉네임 생성기', 'L3-pj-nickname-v2.html'),
            pj('pj-a1-3', 4, '운세 뽑기', 'L3-pj-fortune-v2.html'),
            pj('pj-a1-4', 5, '비밀번호 생성기', 'L3-u25-project-math-tools-v2-R2.html'),
            pj('pj-a1-5', 6, '수학 도구함', 'L3-u25-project-math-tools-v2.html'),

            theory('py-L3-u22', 7, '여러 값 반환 — return과 튜플 언패킹', 'L3-u22-multi-return-v2.html'),
            pj('pj-a2-1', 8, '성적 분석 리포트', 'L3-u25-project-math-tools-v2-R3.html'),
            pj('pj-a2-2', 9, '이름 궁합 테스트', 'L3-pj-compatibility-v2.html'),
            pj('pj-a2-3', 10, 'MBTI 테스트', 'L3-pj-mbti-v2.html'),
            pj('pj-a2-4', 11, '주사위 시뮬레이터', 'L3-u60-project-dday-v2-R2.html'),
            pj('pj-a2-5', 12, '타로 카드 뽑기', 'L3-pj-tarot-v2.html'),

            theory('py-L3-u23', 13, '람다 함수 — 한 줄 함수', 'L3-u23-lambda-v2.html'),
            theory('py-L3-u24', 14, 'map, filter, sorted — 내장 함수 활용', 'L3-u24-builtin-functions-v2.html'),
            pj('pj-a3-1', 15, '오늘 뭐 먹지?', 'L3-pj-food-v2.html'),
            pj('pj-a3-2', 16, '투표 집계 시스템', 'L3-u37-project-vote-tally-v2.html'),
            pj('pj-a3-3', 17, '로또 번호 생성기', 'L3-u59-project-lotto-v2.html'),
            pj('pj-a3-4', 18, '텍스트 분석기', 'L3-u31-project-text-analyzer-v2.html'),
            pj('pj-a3-5', 19, '미니 검색 엔진', 'L3-u53-project-search-engine-v2.html'),
        ],
    },

    // ── L3b: 문자열 & 리스트 심화 ──
    {
        id: 'py-L3b', chapterNumber: 4, title: '문자열 & 리스트 심화', icon: 'edit_note',
        description: '슬라이싱, f-string, 컴프리헨션, 2차원 리스트, 문자열 메서드',
        units: [
            theory('py-L3-u26', 1, '슬라이싱 심화 — 문자열과 리스트 자르기', 'L3-u26-slicing-v2.html'),
            pj('pj-b1-1', 2, '시저 암호', 'L3-u31-project-text-analyzer-v2-R2.html'),
            pj('pj-b1-2', 3, '모스 부호 변환기', 'L3-pj-morse-v2.html'),
            pj('pj-b1-3', 4, '회문 판별기', 'L3-u31-project-text-analyzer-v2-R1.html'),
            pj('pj-b1-4', 5, '끝말잇기 게임', 'L3-pj-wordchain-v2.html'),
            pj('pj-b1-5', 6, 'ASCII 아트 생성기', 'L3-pj-ascii-art-v2.html'),

            theory('py-L3-u27', 7, 'f-string 심화 — 포맷팅의 모든 것', 'L3-u27-fstring-v2.html'),
            theory('py-L3-u28', 8, '리스트 컴프리헨션 — 한 줄로 리스트 만들기', 'L3-u28-list-comprehension-v2.html'),
            pj('pj-b2-1', 9, '행렬 계산기', 'L3-u31-project-text-analyzer-v2-R3.html'),
            pj('pj-b2-2', 10, '타자 연습 게임', 'L3-pj-typing-game-v2.html'),
            pj('pj-b2-3', 11, 'CSV 성적 관리', 'L3-u48-project-diary-v2-R2.html'),
            pj('pj-b2-4', 12, '레시피 관리', 'L3-pj-recipe-v2.html'),
            pj('pj-b2-5', 13, '행맨 게임', 'L3-pj-hangman-v2.html'),

            theory('py-L3-u29', 14, '2차원 리스트 — 표와 격자', 'L3-u29-2d-list-v2.html'),
            theory('py-L3-u30', 15, '문자열 메서드 총정리 — split, join, replace', 'L3-u30-string-methods-v2.html'),
            pj('pj-b3-1', 16, '보물찾기 게임', 'L3-pj-treasure-v2.html'),
            pj('pj-b3-2', 17, '미로 찾기', 'L3-u54-project-rps-tournament-v2-R2.html'),
            pj('pj-b3-3', 18, '숫자 야구 게임', 'L3-u54-project-rps-tournament-v2-R1.html'),
            pj('pj-b3-4', 19, '카드 게임', 'L3-u43-project-card-game-v2.html'),
            pj('pj-b3-5', 20, '가위바위보 토너먼트', 'L3-u54-project-rps-tournament-v2.html'),
        ],
    },

    // ── L3c: 딕셔너리 & 자료구조 ──
    {
        id: 'py-L3c', chapterNumber: 5, title: '딕셔너리 & 자료구조', icon: 'inventory_2',
        description: '딕셔너리 심화, 중첩 자료구조, JSON, 자료구조 선택',
        units: [
            theory('py-L3-u32', 1, '딕셔너리 활용 — get, items, 반복', 'L3-u32-dict-advanced-v2.html'),
            theory('py-L3-u33', 2, '중첩 자료구조 — 리스트 안의 딕셔너리', 'L3-u33-nested-structures-v2.html'),
            pj('pj-c1-1', 3, '포켓몬 도감', 'L3-pj-pokemon-v2.html'),
            pj('pj-c1-2', 4, '단어장 프로그램', 'L3-u37-project-vote-tally-v2-R1.html'),
            pj('pj-c1-3', 5, '전화번호부', 'L3-u36-project-phonebook-v2.html'),
            pj('pj-c1-4', 6, '도서관 시스템', 'L3-u37-project-vote-tally-v2-R2.html'),
            pj('pj-c1-5', 7, '음악 플레이리스트', 'L3-pj-music-playlist-v2.html'),

            theory('py-L3-u34', 8, '자료구조 선택 가이드 — 언제 뭘 쓸까?', 'L3-u34-data-structure-guide-v2.html'),
            theory('py-L3-u35', 9, 'JSON — 데이터 교환의 표준', 'L3-u35-json-v2.html'),
            pj('pj-c2-1', 10, '편의점 재고 관리', 'L3-u37-project-vote-tally-v2-R3.html'),
            pj('pj-c2-2', 11, '투표 집계 시스템', 'L3-u37-project-vote-tally-v2.html'),
            pj('pj-c2-3', 12, '나만의 챗봇', 'L3-pj-chatbot-ai-v2.html'),
            pj('pj-c2-4', 13, '오늘 뭐 먹지?', 'L3-pj-food-v2.html'),
            pj('pj-c2-5', 14, '학생 관리 시스템', 'L3-u63-project-student-mgmt-v2.html'),
        ],
    },

    // ── L3d: 클래스와 객체 ──
    {
        id: 'py-L3d', chapterNumber: 6, title: '클래스와 객체', icon: 'category',
        description: '클래스 기초, 생성자, 메서드, 상속',
        units: [
            theory('py-L3-u38', 1, '클래스란? — 데이터와 기능을 하나로', 'L3-u38-class-intro-v2.html'),
            pj('pj-d1-1', 2, '펫 시뮬레이터', 'L3-u43-project-card-game-v2-R1.html'),
            pj('pj-d1-2', 3, '자판기 시뮬레이터', 'L3-pj-vending-v2.html'),
            pj('pj-d1-3', 4, '은행 계좌 시스템', 'L3-u43-project-card-game-v2-R2.html'),
            pj('pj-d1-4', 5, '미니 SNS', 'L3-u43-project-card-game-v2-R3.html'),
            pj('pj-d1-5', 6, '동물원 시뮬레이터', 'L3-u42-project-zoo-v2.html'),

            theory('py-L3-u39', 7, '__init__ — 생성자로 초기화하기', 'L3-u39-init-v2.html'),
            theory('py-L3-u40', 8, '메서드 — 클래스 안의 함수', 'L3-u40-methods-v2.html'),
            theory('py-L3-u41', 9, '상속 맛보기 — 코드를 물려받기', 'L3-u41-inheritance-intro-v2.html'),
            pj('pj-d2-1', 10, '몬스터 배틀', 'L3-pj-monster-battle-v2.html'),
            pj('pj-d2-2', 11, '카드 게임', 'L3-u43-project-card-game-v2.html'),
            pj('pj-d2-3', 12, '텍스트 RPG 게임', 'L3-u61-project-text-rpg-v2.html'),
            pj('pj-d2-4', 13, '음악 플레이리스트', 'L3-pj-music-playlist-v2.html'),
            pj('pj-d2-5', 14, '포켓몬 도감', 'L3-pj-pokemon-v2.html'),
        ],
    },

    // ── L3e: 파일 & 에러 처리 ──
    {
        id: 'py-L3e', chapterNumber: 7, title: '파일 & 에러 처리', icon: 'folder_open',
        description: '파일 읽기/쓰기, CSV, 예외 처리 활용',
        units: [
            theory('py-L3-u44', 1, '파일 다루기 심화 — with문과 여러 파일', 'L3-u44-file-advanced-v2.html'),
            theory('py-L3-u45', 2, 'CSV 파일 — 엑셀처럼 데이터 저장하기', 'L3-u45-csv-v2.html'),
            theory('py-L3-u46', 3, '예외 처리 활용 — 여러 에러 잡기, finally', 'L3-u46-exception-advanced-v2.html'),
            pj('pj-e-1', 4, '비밀 일기장', 'L3-pj-diary-secret-v2.html'),
            pj('pj-e-2', 5, 'TODO 관리', 'L3-u48-project-diary-v2-R3.html'),
            pj('pj-e-3', 6, '레시피 관리', 'L3-pj-recipe-v2.html'),
            pj('pj-e-4', 7, '가계부 프로그램', 'L3-u47-project-budget-v2.html'),
            pj('pj-e-5', 8, '시험 스케줄러', 'L3-pj-schedule-maker-v2.html'),
        ],
    },

    // ── L3f: 알고리즘 기초 ──
    {
        id: 'py-L3f', chapterNumber: 8, title: '알고리즘 기초', icon: 'extension',
        description: '정렬, 탐색, 재귀, 시간 복잡도',
        units: [
            theory('py-L3-u49', 1, '정렬 알고리즘 — 버블/선택 정렬', 'L3-u49-sorting-v2.html'),
            theory('py-L3-u50', 2, '탐색 알고리즘 — 선형/이진 탐색', 'L3-u50-searching-v2.html'),
            pj('pj-f1-1', 3, '숫자 야구 게임', 'L3-u54-project-rps-tournament-v2-R1.html'),
            pj('pj-f1-2', 4, '행맨 게임', 'L3-pj-hangman-v2.html'),
            pj('pj-f1-3', 5, '보물찾기 게임', 'L3-pj-treasure-v2.html'),
            pj('pj-f1-4', 6, '미니 검색 엔진', 'L3-u53-project-search-engine-v2.html'),
            pj('pj-f1-5', 7, '끝말잇기 게임', 'L3-pj-wordchain-v2.html'),

            theory('py-L3-u51', 8, '재귀 함수 — 자기 자신을 호출하는 함수', 'L3-u51-recursion-v2.html'),
            theory('py-L3-u52', 9, '시간 복잡도 맛보기 — 빠른 코드란?', 'L3-u52-time-complexity-v2.html'),
            pj('pj-f2-1', 10, '미로 찾기', 'L3-u54-project-rps-tournament-v2-R2.html'),
            pj('pj-f2-2', 11, '가위바위보 토너먼트', 'L3-u54-project-rps-tournament-v2.html'),
            pj('pj-f2-3', 12, '퀴즈 프로그램', 'L3-u62-project-quiz-v2.html'),
            pj('pj-f2-4', 13, '몬스터 배틀', 'L3-pj-monster-battle-v2.html'),
            pj('pj-f2-5', 14, '타자 연습 게임', 'L3-pj-typing-game-v2.html'),
        ],
    },

    // ── L3g: 실전 모듈 & 라이브러리 ──
    {
        id: 'py-L3g', chapterNumber: 9, title: '실전 모듈 & 라이브러리', icon: 'build',
        description: 'random, datetime, math, turtle',
        units: [
            theory('py-L3-u55', 1, 'random — 랜덤의 모든 것', 'L3-u55-random-v2.html'),
            pj('pj-g1-1', 2, '로또 번호 생성기', 'L3-u59-project-lotto-v2.html'),
            pj('pj-g1-2', 3, '타로 카드 뽑기', 'L3-pj-tarot-v2.html'),
            pj('pj-g1-3', 4, '운세 뽑기', 'L3-pj-fortune-v2.html'),
            pj('pj-g1-4', 5, '주사위 시뮬레이터', 'L3-u60-project-dday-v2-R2.html'),
            pj('pj-g1-5', 6, '닉네임 생성기', 'L3-pj-nickname-v2.html'),

            theory('py-L3-u56', 7, 'datetime — 날짜와 시간 다루기', 'L3-u56-datetime-v2.html'),
            pj('pj-g2-1', 8, 'D-Day 카운터', 'L3-u60-project-dday-v2.html'),
            pj('pj-g2-2', 9, '시간표 관리', 'L3-u60-project-dday-v2-R1.html'),
            pj('pj-g2-3', 10, '시험 스케줄러', 'L3-pj-schedule-maker-v2.html'),
            pj('pj-g2-4', 11, '일기장 프로그램', 'L3-u48-project-diary-v2.html'),
            pj('pj-g2-5', 12, '비밀 일기장', 'L3-pj-diary-secret-v2.html'),

            theory('py-L3-u57', 13, 'math와 statistics — 수학 함수 모음', 'L3-u57-math-v2.html'),
            pj('pj-g3-1', 14, '수학 도구함', 'L3-u25-project-math-tools-v2.html'),
            pj('pj-g3-2', 15, '단위 변환기', 'L3-u25-project-math-tools-v2-R1.html'),
            pj('pj-g3-3', 16, '성적 분석 리포트', 'L3-u25-project-math-tools-v2-R3.html'),
            pj('pj-g3-4', 17, '행렬 계산기', 'L3-u31-project-text-analyzer-v2-R3.html'),
            pj('pj-g3-5', 18, 'CSV 성적 관리', 'L3-u48-project-diary-v2-R2.html'),

            theory('py-L3-u58', 19, 'turtle — 그림 그리기 프로그래밍', 'L3-u58-turtle-v2.html', 1, '35분'),
        ],
    },

    // ── L3h: 종합 프로젝트 & 마무리 ──
    {
        id: 'py-L3h', chapterNumber: 10, title: '종합 프로젝트 & 마무리', icon: 'star',
        description: '지금까지 배운 모든 것을 합쳐 대형 프로젝트 완성',
        units: [
            pj('py-L3-u61', 1, '텍스트 RPG 게임', 'L3-u61-project-text-rpg-v2.html', 3),
            pj('py-L3-u62', 2, '퀴즈 프로그램 (파일 연동)', 'L3-u62-project-quiz-v2.html', 3),
            pj('py-L3-u63', 3, '학생 관리 시스템', 'L3-u63-project-student-mgmt-v2.html', 3),
            { id: 'py-L3-u64', unitNumber: 4, title: 'Python 총정리 — 여기까지 배운 것', type: '종합' as const, difficulty: 2 as const, duration: '30분', pages: [page('py-L3-u64-p1', 'Python 총정리', 'L3-u64-python-summary-v2.html')] },
            { id: 'py-L3-u65', unitNumber: 5, title: '다음 단계 안내 — C언어, 알고리즘, 자격증', type: '이론' as const, difficulty: 1 as const, duration: '20분', pages: [page('py-L3-u65-p1', '다음 단계 안내', 'L3-u65-next-steps-v2.html')] },
        ],
    },

    // ── L3i: 컴퓨터 비전 (OpenCV) ──
    {
        id: 'py-L3i', chapterNumber: 11, title: '컴퓨터 비전 (OpenCV)', icon: 'visibility',
        description: '이미지 처리, 필터, 얼굴 인식 — AI의 눈을 만들어보자',
        units: [
            theory('py-cv-intro', 1, 'OpenCV 소개 — 이미지 읽기/보여주기', 'L3-cv-intro-v2.html'),
            theory('py-cv-filters', 2, '이미지 필터 — 흑백, 블러, 엣지', 'L3-cv-filters-v2.html'),
            theory('py-cv-drawing', 3, '이미지에 그리기 — 도형과 텍스트', 'L3-cv-drawing-v2.html'),
            theory('py-cv-face', 4, '얼굴 인식 — Haar Cascade', 'L3-cv-face-v2.html'),
            pj('py-cv-project', 5, '사진 필터 앱', 'L3-cv-project-v2.html'),
        ],
    },

    // ── L3j: GUI · 실행파일 만들기 ──
    {
        id: 'py-L3j', chapterNumber: 12, title: 'GUI · 실행파일 만들기', icon: 'desktop_windows',
        description: 'tkinter/PyQt로 윈도우 앱을 만들고 .exe로 배포하기',
        units: [
            { id: 'py-gui-tk-intro', unitNumber: 1, title: 'tkinter 입문 — 첫 윈도우 창', type: '이론' as const, difficulty: 2 as const, duration: '30분', pages: [page('py-gui-tk-intro-p1', 'tkinter 입문', 'L3-gui-tk-intro.html')] },
            { id: 'py-gui-tk-widgets', unitNumber: 2, title: '버튼, 입력칸, 라벨', type: '이론' as const, difficulty: 2 as const, duration: '35분', pages: [] },
            { id: 'py-gui-tk-layout', unitNumber: 3, title: '레이아웃 — pack, grid, place', type: '이론' as const, difficulty: 2 as const, duration: '35분', pages: [] },
            { id: 'py-gui-tk-events', unitNumber: 4, title: '이벤트 처리 — 클릭, 키보드', type: '이론' as const, difficulty: 2 as const, duration: '35분', pages: [] },
            { id: 'py-gui-tk-calc', unitNumber: 5, title: '프로젝트: 계산기 앱', type: '실습' as const, difficulty: 3 as const, duration: '60분', pages: [] },
            { id: 'py-gui-pyqt-intro', unitNumber: 6, title: 'PyQt6 입문 — 더 예쁜 GUI', type: '이론' as const, difficulty: 3 as const, duration: '40분', pages: [] },
            { id: 'py-gui-pyqt-designer', unitNumber: 7, title: 'Qt Designer로 화면 설계', type: '이론' as const, difficulty: 3 as const, duration: '40분', pages: [] },
            { id: 'py-gui-pyqt-todo', unitNumber: 8, title: '프로젝트: 할 일 관리 앱', type: '실습' as const, difficulty: 3 as const, duration: '70분', pages: [] },
            { id: 'py-gui-pyinstaller', unitNumber: 9, title: 'PyInstaller — 파이썬을 .exe로', type: '이론' as const, difficulty: 2 as const, duration: '30분', pages: [] },
            { id: 'py-gui-icon', unitNumber: 10, title: '아이콘과 리소스 포함하기', type: '이론' as const, difficulty: 2 as const, duration: '25분', pages: [] },
            { id: 'py-gui-distribute', unitNumber: 11, title: '친구에게 배포하기', type: '이론' as const, difficulty: 2 as const, duration: '25분', pages: [] },
            { id: 'py-gui-final', unitNumber: 12, title: '최종 프로젝트: 나만의 데스크톱 앱', type: '실습' as const, difficulty: 3 as const, duration: '90분', pages: [] },
        ],
    },
];
