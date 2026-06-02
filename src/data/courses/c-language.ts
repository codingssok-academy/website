/**
 * C언어 커리큘럼 데이터
 * 이론 → 프로젝트 교차 배치 (이론 4개 + 프로젝트 5개 반복)
 * Level 1: C언어 입문 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 2: 변수와 연산자 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 3: 조건문 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 4: 반복문 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 5: 배열 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 6: 함수 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 7: 문자열 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 8: 포인터 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 9: 구조체 (12 이론 + 15 프로젝트 = 27유닛)
 * Level 10: 동적 메모리 (12 이론 + 15 프로젝트 = 27유닛)
 */

import type { Chapter, Page } from './types';

const BASE = '/learn/c-lang';

function page(id: string, title: string, file: string): Page {
    return { id, title, type: '페이지' as const, content: `<iframe src="${BASE}/${file}" style="width:100%;height:100%;border:none;min-height:80vh" />` };
}

function theory(id: string, num: number, title: string, file: string, diff: 1 | 2 | 3 = 1, dur = '30분') {
    return { id, unitNumber: num, title, type: '이론' as const, difficulty: diff, duration: dur, pages: [page(id + '-p1', title, file)] };
}

function pj(id: string, num: number, title: string, file: string, diff: 1 | 2 | 3 = 1) {
    return { id, unitNumber: num, title: `프로젝트: ${title}`, type: '프로젝트' as const, difficulty: diff, duration: '40분', pages: [page(id + '-p1', title, file)] };
}

export const C_LANGUAGE_CHAPTERS: Chapter[] = [
    // ══════════════════════════════════════════════
    // Level 1: C언어 입문
    // ══════════════════════════════════════════════
    {
        id: 'c-L1',
        chapterNumber: 1,
        title: 'C언어 입문',
        icon: 'terminal',
        description: 'C언어의 역사, 개발 환경, 첫 프로그램, 문법 규칙, printf 심화, 별 찍기까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 소개와 첫 프로그램 ──
            theory('c-L1-u01', 1, 'C언어란? — 역사와 특징', 'L1-u01-c-intro-v2.html'),
            theory('c-L1-u02', 2, '개발 환경 준비 — VS Code + GCC', 'L1-u02-dev-setup-v2.html'),
            theory('c-L1-u03', 3, 'Hello, World! — 첫 C 프로그램', 'L1-u03-hello-world-v2.html'),
            theory('c-L1-u04', 4, 'C 프로그램 구조 — #include, main, return', 'L1-u04-c-skeleton-v2.html'),
            pj('c-L1-pj01', 5, '학교 소개 프로그램', 'L1-pj01-school-intro-v2.html'),
            pj('c-L1-pj02', 6, '동물 소리 출력기', 'L1-pj02-animal-sounds-v2.html'),
            pj('c-L1-pj03', 7, '시간표 출력기', 'L1-pj03-timetable-v2.html'),
            pj('c-L1-pj04', 8, '좋아하는 것 모음', 'L1-pj04-favorites-v2.html'),
            pj('c-L1-pj05', 9, '생일 축하 카드', 'L1-pj05-birthday-card-v2.html'),
            // ── 문법 규칙과 에러 ──
            theory('c-L1-u05', 10, '세미콜론과 중괄호', 'L1-u05-semicolon-braces-v2.html'),
            theory('c-L1-u06', 11, '주석 — 코드에 설명 달기', 'L1-u06-comments-v2.html'),
            theory('c-L1-u07', 12, '들여쓰기 스타일', 'L1-u07-indentation-v2.html'),
            theory('c-L1-u08', 13, '컴파일 에러 읽기', 'L1-u08-compile-errors-v2.html'),
            pj('c-L1-pj06', 14, '비밀 암호 메시지', 'L1-pj06-secret-code-v2.html'),
            pj('c-L1-pj07', 15, '요리 레시피 출력기', 'L1-pj07-recipe-printer-v2.html'),
            pj('c-L1-pj08', 16, 'O/X 퀴즈 게임', 'L1-pj08-quiz-game-v2.html'),
            pj('c-L1-pj09', 17, '영화 리뷰 카드', 'L1-pj09-movie-review-v2.html'),
            pj('c-L1-pj10', 18, '에러 사냥 챌린지', 'L1-pj10-error-hunt-v2.html'),
            // ── 출력의 달인 ──
            theory('c-L1-u09', 19, '런타임 에러', 'L1-u09-runtime-errors-v2.html'),
            theory('c-L1-u10', 20, 'printf 여러 줄 출력', 'L1-u10-printf-multiline-v2.html'),
            theory('c-L1-u11', 21, '이스케이프 시퀀스', 'L1-u11-escape-sequences-v2.html'),
            theory('c-L1-u12', 22, '별 찍기 패턴', 'L1-u12-star-patterns-v2.html'),
            pj('c-L1-pj11', 23, 'ASCII 아트 동물원', 'L1-pj11-ascii-art-v2.html'),
            pj('c-L1-pj12', 24, '게임 타이틀 화면', 'L1-pj12-game-title-v2.html'),
            pj('c-L1-pj13', 25, '이모티콘 만들기', 'L1-pj13-emoticon-maker-v2.html'),
            pj('c-L1-pj14', 26, '오늘의 운세', 'L1-pj14-fortune-teller-v2.html'),
            pj('c-L1-pj15', 27, '나만의 명함', 'L1-pj15-business-card-v2.html'),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 2: 변수와 연산자
    // ══════════════════════════════════════════════
    {
        id: 'c-L2',
        chapterNumber: 2,
        title: '변수와 연산자',
        icon: 'data_object',
        description: '변수, 자료형(int, float, char), scanf 입력, 사칙연산, 나머지, 복합대입, 증감 연산자를 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 변수의 세계 ──
            theory('c-L2-u01', 1, '변수란? — 데이터를 담는 상자', 'L2-u01-variable-intro-v2.html'),
            theory('c-L2-u02', 2, '정수형 변수 — int', 'L2-u02-int-type-v2.html'),
            theory('c-L2-u03', 3, 'printf 서식지정자 — %d', 'L2-u03-printf-format-v2.html'),
            theory('c-L2-u04', 4, 'scanf — 키보드로 입력받기', 'L2-u04-scanf-input-v2.html'),
            pj('c-L2-pj01', 5, '자기소개 카드', 'L2-pj01-self-intro-v2.html'),
            pj('c-L2-pj02', 6, '나이 계산기', 'L2-pj02-age-calc-v2.html'),
            pj('c-L2-pj03', 7, '용돈 계산기', 'L2-pj03-allowance-v2.html'),
            pj('c-L2-pj04', 8, '온도 변환기', 'L2-pj04-temp-convert-v2.html'),
            pj('c-L2-pj05', 9, '구구단 카드', 'L2-pj05-multiplication-v2.html'),
            // ── 자료형 탐험 ──
            theory('c-L2-u05', 10, '실수형 — float와 double', 'L2-u05-float-double-v2.html'),
            theory('c-L2-u06', 11, '문자형 — char', 'L2-u06-char-type-v2.html'),
            theory('c-L2-u07', 12, 'sizeof — 자료형의 크기', 'L2-u07-sizeof-v2.html'),
            theory('c-L2-u08', 13, '형변환 — 자동 vs 강제', 'L2-u08-type-cast-v2.html'),
            pj('c-L2-pj06', 14, 'BMI 계산기', 'L2-pj06-bmi-calc-v2.html'),
            pj('c-L2-pj07', 15, '성적 등급 계산기', 'L2-pj07-grade-calc-v2.html'),
            pj('c-L2-pj08', 16, '아스키 코드 탐험', 'L2-pj08-ascii-explorer-v2.html'),
            pj('c-L2-pj09', 17, '환율 계산기', 'L2-pj09-currency-v2.html'),
            pj('c-L2-pj10', 18, '비밀번호 생성기', 'L2-pj10-password-gen-v2.html'),
            // ── 산술 연산자 ──
            theory('c-L2-u09', 19, '사칙연산 — +, -, *, /', 'L2-u09-arithmetic-v2.html'),
            theory('c-L2-u10', 20, '나머지 연산 — %', 'L2-u10-modulo-v2.html'),
            theory('c-L2-u11', 21, '복합 대입 — +=, -=, *=, /=', 'L2-u11-compound-assign-v2.html'),
            theory('c-L2-u12', 22, '증감 연산 — ++, --', 'L2-u12-increment-v2.html'),
            pj('c-L2-pj11', 23, '간단 계산기 v1', 'L2-pj11-calculator-v2.html'),
            pj('c-L2-pj12', 24, '거스름돈 계산기', 'L2-pj12-change-calc-v2.html'),
            pj('c-L2-pj13', 25, '시간 변환기', 'L2-pj13-time-convert-v2.html'),
            pj('c-L2-pj14', 26, '점수 통계', 'L2-pj14-score-stats-v2.html'),
            pj('c-L2-pj15', 27, '숫자 퀴즈 게임', 'L2-pj15-number-quiz-v2.html'),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 3: 조건문
    // ══════════════════════════════════════════════
    {
        id: 'c-L3',
        chapterNumber: 3,
        title: '조건문',
        icon: 'call_split',
        description: '비교/논리 연산자, if, else if, switch, 삼항 연산자, 복합 조건까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 조건문 입문 ──
            theory('c-L3-u01', 1, '비교 연산자 — ==, !=, <, >', 'L3-u01-comparison-v2.html', 1, '30분'),
            theory('c-L3-u02', 2, 'if문 — 조건이 참이면 실행', 'L3-u02-if-basic-v2.html', 1, '30분'),
            theory('c-L3-u03', 3, 'if-else문 — 둘 중 하나 실행', 'L3-u03-if-else-v2.html', 1, '30분'),
            theory('c-L3-u04', 4, '논리 연산자 — &&, ||, !', 'L3-u04-logical-ops-v2.html', 2, '35분'),
            pj('c-L3-pj01', 5, '성인 판별기', 'L3-pj01-age-checker-v2.html', 1),
            pj('c-L3-pj02', 6, '짝홀 판별기', 'L3-pj02-even-odd-v2.html', 1),
            pj('c-L3-pj03', 7, '합격 불합격 판정', 'L3-pj03-pass-fail-v2.html', 1),
            pj('c-L3-pj04', 8, '로그인 시스템', 'L3-pj04-login-v2.html', 2),
            pj('c-L3-pj05', 9, '놀이공원 입장료', 'L3-pj05-ticket-price-v2.html', 2),
            // ── 조건문 확장 ──
            theory('c-L3-u05', 10, 'else if — 여러 조건 분기', 'L3-u05-else-if-v2.html', 2, '30분'),
            theory('c-L3-u06', 11, '중첩 if — 조건 안의 조건', 'L3-u06-nested-if-v2.html', 2, '30분'),
            theory('c-L3-u07', 12, 'switch문 — 값에 따른 분기', 'L3-u07-switch-v2.html', 2, '35분'),
            theory('c-L3-u08', 13, 'switch 활용 — break와 default', 'L3-u08-switch-advanced-v2.html', 2, '35분'),
            pj('c-L3-pj06', 14, '성적 등급 판정기', 'L3-pj06-grade-system-v2.html', 2),
            pj('c-L3-pj07', 15, '계절 판별기', 'L3-pj07-season-v2.html', 1),
            pj('c-L3-pj08', 16, '간단 계산기 v2', 'L3-pj08-calculator-v2.html', 2),
            pj('c-L3-pj09', 17, '가위바위보 게임', 'L3-pj09-rps-game-v2.html', 2),
            pj('c-L3-pj10', 18, '자판기 시뮬레이터', 'L3-pj10-vending-v2.html', 2),
            // ── 조건문 마스터 ──
            theory('c-L3-u09', 19, '삼항 연산자 — ? :', 'L3-u09-ternary-v2.html', 2, '30분'),
            theory('c-L3-u10', 20, '조건문 패턴 — 범위, 윤년, 최대값', 'L3-u10-patterns-v2.html', 2, '35분'),
            theory('c-L3-u11', 21, '복합 조건 — &&, || 조합 실전', 'L3-u11-complex-conditions-v2.html', 3, '35분'),
            theory('c-L3-u12', 22, '조건문 종합 실전', 'L3-u12-comprehensive-v2.html', 3, '40분'),
            pj('c-L3-pj11', 23, '윤년 판별기', 'L3-pj11-leap-year-v2.html', 2),
            pj('c-L3-pj12', 24, '택시 요금 계산기', 'L3-pj12-taxi-fare-v2.html', 2),
            pj('c-L3-pj13', 25, '혈액형 궁합 테스트', 'L3-pj13-blood-type-v2.html', 2),
            pj('c-L3-pj14', 26, '미니 RPG 전투', 'L3-pj14-mini-rpg-v2.html', 3),
            pj('c-L3-pj15', 27, '스무고개 게임', 'L3-pj15-twenty-questions-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 4: 반복문
    // ══════════════════════════════════════════════
    {
        id: 'c-L4',
        chapterNumber: 4,
        title: '반복문',
        icon: 'all_inclusive',
        description: 'while, do-while, for문, 중첩 반복, 별 찍기, 수열, 소수 판별까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 반복문 입문 ──
            theory('c-L4-u01', 1, 'while문 — 조건이 참인 동안 반복', 'L4-u01-while-v2.html', 1, '30분'),
            theory('c-L4-u02', 2, 'do-while문 — 일단 한 번 실행', 'L4-u02-do-while-v2.html', 1, '30분'),
            theory('c-L4-u03', 3, 'for문 — 횟수가 정해진 반복', 'L4-u03-for-basic-v2.html', 1, '30분'),
            theory('c-L4-u04', 4, '반복 제어 — break와 continue', 'L4-u04-break-continue-v2.html', 2, '35분'),
            pj('c-L4-pj01', 5, '카운트다운 타이머', 'L4-pj01-countdown-v2.html', 1),
            pj('c-L4-pj02', 6, '구구단 출력기', 'L4-pj02-multiplication-v2.html', 1),
            pj('c-L4-pj03', 7, '숫자 맞추기 게임', 'L4-pj03-number-guess-v2.html', 2),
            pj('c-L4-pj04', 8, '비밀번호 재시도', 'L4-pj04-password-retry-v2.html', 2),
            pj('c-L4-pj05', 9, '합계 계산기', 'L4-pj05-sum-calc-v2.html', 1),
            // ── 반복문 확장 ──
            theory('c-L4-u05', 10, '중첩 for문 — 반복 안의 반복', 'L4-u05-nested-for-v2.html', 2, '35분'),
            theory('c-L4-u06', 11, '무한루프 — while(1)과 탈출', 'L4-u06-infinite-loop-v2.html', 2, '30분'),
            theory('c-L4-u07', 12, '반복 + 조건 조합', 'L4-u07-loop-condition-v2.html', 2, '35분'),
            theory('c-L4-u08', 13, '반복문 선택 가이드', 'L4-u08-loop-choice-v2.html', 2, '30분'),
            pj('c-L4-pj06', 14, '별 찍기 삼각형', 'L4-pj06-star-triangle-v2.html', 2),
            pj('c-L4-pj07', 15, '구구단 전체 출력', 'L4-pj07-full-multiplication-v2.html', 2),
            pj('c-L4-pj08', 16, '메뉴 시스템', 'L4-pj08-menu-system-v2.html', 2),
            pj('c-L4-pj09', 17, '숫자 피라미드', 'L4-pj09-number-pyramid-v2.html', 2),
            pj('c-L4-pj10', 18, '로또 번호 생성기', 'L4-pj10-lotto-v2.html', 2),
            // ── 반복문 마스터 ──
            theory('c-L4-u09', 19, '별 찍기 패턴 — 다양한 도형', 'L4-u09-star-patterns-v2.html', 2, '35분'),
            theory('c-L4-u10', 20, '수열과 누적 — 합, 곱, 평균', 'L4-u10-series-v2.html', 2, '35분'),
            theory('c-L4-u11', 21, '소수 판별 — 알고리즘 입문', 'L4-u11-prime-v2.html', 3, '40분'),
            theory('c-L4-u12', 22, '반복문 종합 실전', 'L4-u12-comprehensive-v2.html', 3, '40분'),
            pj('c-L4-pj11', 23, '다이아몬드 별 찍기', 'L4-pj11-diamond-v2.html', 3),
            pj('c-L4-pj12', 24, '팩토리얼 계산기', 'L4-pj12-factorial-v2.html', 2),
            pj('c-L4-pj13', 25, '소수 목록 출력기', 'L4-pj13-prime-list-v2.html', 3),
            pj('c-L4-pj14', 26, '미니 은행 시스템', 'L4-pj14-mini-bank-v2.html', 3),
            pj('c-L4-pj15', 27, '텍스트 애니메이션', 'L4-pj15-text-animation-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 5: 배열
    // ══════════════════════════════════════════════
    {
        id: 'c-L5',
        chapterNumber: 5,
        title: '배열',
        icon: 'view_comfy',
        description: '1차원/2차원 배열, 초기화, 검색, 정렬, 문자 배열까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 배열 입문 ──
            theory('c-L5-u01', 1, '배열이란? — 같은 타입 데이터 모음', 'L5-u01-array-intro-v2.html'),
            theory('c-L5-u02', 2, '배열 선언과 초기화', 'L5-u02-array-init-v2.html'),
            theory('c-L5-u03', 3, '배열과 반복문 — for로 순회', 'L5-u03-array-loop-v2.html'),
            theory('c-L5-u04', 4, '배열 크기 — sizeof 활용', 'L5-u04-array-size-v2.html'),
            pj('c-L5-pj01', 5, '성적 관리 프로그램', 'L5-pj01-grade-manager-v2.html', 1),
            pj('c-L5-pj02', 6, '최대값 최소값 찾기', 'L5-pj02-min-max-v2.html', 1),
            pj('c-L5-pj03', 7, '주사위 통계', 'L5-pj03-dice-stats-v2.html', 2),
            pj('c-L5-pj04', 8, '출석부 시스템', 'L5-pj04-attendance-v2.html', 2),
            pj('c-L5-pj05', 9, '온도 기록기', 'L5-pj05-temp-logger-v2.html', 1),
            // ── 배열 활용 ──
            theory('c-L5-u05', 10, '배열 검색 — 선형 탐색', 'L5-u05-linear-search-v2.html', 2),
            theory('c-L5-u06', 11, '배열 정렬 — 버블 정렬', 'L5-u06-bubble-sort-v2.html', 2),
            theory('c-L5-u07', 12, '배열 뒤집기와 복사', 'L5-u07-array-reverse-v2.html', 2),
            theory('c-L5-u08', 13, '배열과 함수 미리보기', 'L5-u08-array-function-v2.html', 2),
            pj('c-L5-pj06', 14, '단어 뒤집기', 'L5-pj06-reverse-word-v2.html', 2),
            pj('c-L5-pj07', 15, '카드 셔플러', 'L5-pj07-card-shuffle-v2.html', 2),
            pj('c-L5-pj08', 16, '빈도 분석기', 'L5-pj08-frequency-v2.html', 2),
            pj('c-L5-pj09', 17, '미니 스프레드시트', 'L5-pj09-spreadsheet-v2.html', 2),
            pj('c-L5-pj10', 18, '정렬 시각화', 'L5-pj10-sort-visual-v2.html', 2),
            // ── 배열 마스터 ──
            theory('c-L5-u09', 19, '2차원 배열 — 표와 격자', 'L5-u09-2d-array-v2.html', 2),
            theory('c-L5-u10', 20, '2차원 배열 활용 — 행렬과 좌표', 'L5-u10-2d-usage-v2.html', 2),
            theory('c-L5-u11', 21, '문자 배열 — char 배열 기초', 'L5-u11-char-array-v2.html', 2),
            theory('c-L5-u12', 22, '배열 종합 실전', 'L5-u12-comprehensive-v2.html', 3),
            pj('c-L5-pj11', 23, '틱택토 게임', 'L5-pj11-tictactoe-v2.html', 3),
            pj('c-L5-pj12', 24, '지뢰 찾기 맵', 'L5-pj12-minesweeper-v2.html', 3),
            pj('c-L5-pj13', 25, '학생 성적표', 'L5-pj13-report-card-v2.html', 2),
            pj('c-L5-pj14', 26, '암호 해독기', 'L5-pj14-cipher-v2.html', 3),
            pj('c-L5-pj15', 27, '미니 데이터베이스', 'L5-pj15-mini-db-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 6: 함수
    // ══════════════════════════════════════════════
    {
        id: 'c-L6',
        chapterNumber: 6,
        title: '함수',
        icon: 'functions',
        description: '함수 선언, 매개변수, 반환값, 재귀, 변수 스코프까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 함수 입문 ──
            theory('c-L6-u01', 1, '함수란? — 코드 묶음에 이름 붙이기', 'L6-u01-function-intro-v2.html'),
            theory('c-L6-u02', 2, '함수 선언과 정의', 'L6-u02-function-define-v2.html'),
            theory('c-L6-u03', 3, '매개변수와 인자 — 값 전달하기', 'L6-u03-parameters-v2.html'),
            theory('c-L6-u04', 4, '반환값 — return으로 결과 돌려주기', 'L6-u04-return-v2.html'),
            pj('c-L6-pj01', 5, '인사말 생성기', 'L6-pj01-greeting-v2.html', 1),
            pj('c-L6-pj02', 6, '사칙연산 함수', 'L6-pj02-math-funcs-v2.html', 1),
            pj('c-L6-pj03', 7, '온도 변환 함수', 'L6-pj03-temp-func-v2.html', 1),
            pj('c-L6-pj04', 8, '성적 판정 함수', 'L6-pj04-grade-func-v2.html', 2),
            pj('c-L6-pj05', 9, '주사위 게임 함수', 'L6-pj05-dice-func-v2.html', 2),
            // ── 함수 확장 ──
            theory('c-L6-u05', 10, 'void 함수 — 반환값 없는 함수', 'L6-u05-void-func-v2.html'),
            theory('c-L6-u06', 11, '지역 변수와 전역 변수', 'L6-u06-scope-v2.html', 2),
            theory('c-L6-u07', 12, '함수 프로토타입 — 선언과 정의 분리', 'L6-u07-prototype-v2.html', 2),
            theory('c-L6-u08', 13, '배열을 함수에 전달하기', 'L6-u08-array-param-v2.html', 2),
            pj('c-L6-pj06', 14, '메뉴 시스템 리팩토링', 'L6-pj06-menu-refactor-v2.html', 2),
            pj('c-L6-pj07', 15, '통계 함수 라이브러리', 'L6-pj07-stats-lib-v2.html', 2),
            pj('c-L6-pj08', 16, '가위바위보 리팩토링', 'L6-pj08-rps-refactor-v2.html', 2),
            pj('c-L6-pj09', 17, '비밀번호 검증 함수', 'L6-pj09-pw-validate-v2.html', 2),
            pj('c-L6-pj10', 18, '계산기 함수 버전', 'L6-pj10-calc-func-v2.html', 2),
            // ── 함수 마스터 ──
            theory('c-L6-u09', 19, '재귀 함수 — 자기 자신을 호출', 'L6-u09-recursion-v2.html', 3),
            theory('c-L6-u10', 20, '재귀 활용 — 팩토리얼, 피보나치', 'L6-u10-recursion-usage-v2.html', 3),
            theory('c-L6-u11', 21, 'static과 함수 고급 패턴', 'L6-u11-static-v2.html', 3),
            theory('c-L6-u12', 22, '함수 종합 실전', 'L6-u12-comprehensive-v2.html', 3),
            pj('c-L6-pj11', 23, '하노이 탑', 'L6-pj11-hanoi-v2.html', 3),
            pj('c-L6-pj12', 24, '미로 탐색기', 'L6-pj12-maze-v2.html', 3),
            pj('c-L6-pj13', 25, '함수형 성적 시스템', 'L6-pj13-grade-system-v2.html', 2),
            pj('c-L6-pj14', 26, '미니 게임 엔진', 'L6-pj14-game-engine-v2.html', 3),
            pj('c-L6-pj15', 27, '라이브러리 만들기', 'L6-pj15-my-library-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 7: 문자열
    // ══════════════════════════════════════════════
    {
        id: 'c-L7',
        chapterNumber: 7,
        title: '문자열',
        icon: 'text_fields',
        description: '문자열 기초, string.h 함수, 문자열 처리 패턴, 문자열 배열까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 문자열 입문 ──
            theory('c-L7-u01', 1, '문자열이란? — char 배열 + \\0', 'L7-u01-string-intro-v2.html'),
            theory('c-L7-u02', 2, '문자열 입출력 — scanf, gets, puts', 'L7-u02-string-io-v2.html'),
            theory('c-L7-u03', 3, 'strlen — 문자열 길이 구하기', 'L7-u03-strlen-v2.html'),
            theory('c-L7-u04', 4, 'strcpy, strcat — 복사와 연결', 'L7-u04-strcpy-strcat-v2.html'),
            pj('c-L7-pj01', 5, '이름 인사 프로그램', 'L7-pj01-name-greet-v2.html', 1),
            pj('c-L7-pj02', 6, '문자 카운터', 'L7-pj02-char-counter-v2.html', 1),
            pj('c-L7-pj03', 7, '단어 뒤집기', 'L7-pj03-word-reverse-v2.html', 2),
            pj('c-L7-pj04', 8, '문장 합치기', 'L7-pj04-sentence-join-v2.html', 1),
            pj('c-L7-pj05', 9, '비밀 코드 생성기', 'L7-pj05-secret-code-v2.html', 2),
            // ── 문자열 활용 ──
            theory('c-L7-u05', 10, 'strcmp — 문자열 비교', 'L7-u05-strcmp-v2.html', 2),
            theory('c-L7-u06', 11, 'strchr, strstr — 문자/문자열 검색', 'L7-u06-search-v2.html', 2),
            theory('c-L7-u07', 12, '문자 분류 — ctype.h (isalpha, isdigit)', 'L7-u07-ctype-v2.html', 2),
            theory('c-L7-u08', 13, '문자열과 숫자 변환 — atoi, sprintf', 'L7-u08-conversion-v2.html', 2),
            pj('c-L7-pj06', 14, '로그인 시스템 v2', 'L7-pj06-login-string-v2.html', 2),
            pj('c-L7-pj07', 15, '회문(팰린드롬) 판별기', 'L7-pj07-palindrome-v2.html', 2),
            pj('c-L7-pj08', 16, '단어 검색기', 'L7-pj08-word-search-v2.html', 2),
            pj('c-L7-pj09', 17, '대소문자 변환기', 'L7-pj09-case-convert-v2.html', 2),
            pj('c-L7-pj10', 18, '숫자 추출기', 'L7-pj10-number-extract-v2.html', 2),
            // ── 문자열 마스터 ──
            theory('c-L7-u09', 19, '문자열 배열 — 여러 문자열 저장', 'L7-u09-string-array-v2.html', 2),
            theory('c-L7-u10', 20, '문자열 처리 패턴 — 토큰, 치환', 'L7-u10-string-patterns-v2.html', 3),
            theory('c-L7-u11', 21, '문자열 보안 — 버퍼 오버플로우', 'L7-u11-string-safety-v2.html', 3),
            theory('c-L7-u12', 22, '문자열 종합 실전', 'L7-u12-comprehensive-v2.html', 3),
            pj('c-L7-pj11', 23, '시저 암호 v2', 'L7-pj11-caesar-v2.html', 2),
            pj('c-L7-pj12', 24, '단어 빈도 분석기', 'L7-pj12-word-freq-v2.html', 3),
            pj('c-L7-pj13', 25, '미니 텍스트 에디터', 'L7-pj13-text-editor-v2.html', 3),
            pj('c-L7-pj14', 26, '행맨 게임', 'L7-pj14-hangman-v2.html', 3),
            pj('c-L7-pj15', 27, '문장 분석기', 'L7-pj15-sentence-analyzer-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 8: 포인터
    // ══════════════════════════════════════════════
    {
        id: 'c-L8',
        chapterNumber: 8,
        title: '포인터',
        icon: 'arrow_forward',
        description: '포인터 개념, 주소와 역참조, 배열과 포인터, 함수 포인터까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 포인터 입문 ──
            theory('c-L8-u01', 1, '포인터란? — 주소를 저장하는 변수', 'L8-u01-pointer-intro-v2.html'),
            theory('c-L8-u02', 2, '& 연산자와 * 연산자', 'L8-u02-address-deref-v2.html'),
            theory('c-L8-u03', 3, '포인터와 변수의 관계', 'L8-u03-pointer-var-v2.html'),
            theory('c-L8-u04', 4, '포인터로 값 변경하기', 'L8-u04-pointer-modify-v2.html', 2),
            pj('c-L8-pj01', 5, '주소 출력기', 'L8-pj01-address-printer-v2.html', 1),
            pj('c-L8-pj02', 6, '두 수 교환 (swap)', 'L8-pj02-swap-v2.html', 2),
            pj('c-L8-pj03', 7, '포인터 퀴즈 게임', 'L8-pj03-pointer-quiz-v2.html', 1),
            pj('c-L8-pj04', 8, '최대값 주소 찾기', 'L8-pj04-max-address-v2.html', 2),
            pj('c-L8-pj05', 9, '포인터 계산기', 'L8-pj05-pointer-calc-v2.html', 2),
            // ── 포인터 활용 ──
            theory('c-L8-u05', 10, '포인터와 배열 — 배열 이름은 포인터', 'L8-u05-pointer-array-v2.html', 2),
            theory('c-L8-u06', 11, '포인터 연산 — +1은 다음 원소', 'L8-u06-pointer-arith-v2.html', 2),
            theory('c-L8-u07', 12, '포인터와 함수 — call by reference', 'L8-u07-pointer-func-v2.html', 2),
            theory('c-L8-u08', 13, '포인터와 문자열', 'L8-u08-pointer-string-v2.html', 2),
            pj('c-L8-pj06', 14, '배열 순회 (포인터 버전)', 'L8-pj06-array-traverse-v2.html', 2),
            pj('c-L8-pj07', 15, '문자열 복사 (포인터 버전)', 'L8-pj07-strcpy-pointer-v2.html', 2),
            pj('c-L8-pj08', 16, '다중 반환 함수', 'L8-pj08-multi-return-v2.html', 2),
            pj('c-L8-pj09', 17, '포인터로 정렬', 'L8-pj09-pointer-sort-v2.html', 3),
            pj('c-L8-pj10', 18, '동적 문자열 처리', 'L8-pj10-dynamic-string-v2.html', 3),
            // ── 포인터 마스터 ──
            theory('c-L8-u09', 19, '이중 포인터 — 포인터의 포인터', 'L8-u09-double-pointer-v2.html', 3),
            theory('c-L8-u10', 20, 'const와 포인터 — 보호 패턴', 'L8-u10-const-pointer-v2.html', 3),
            theory('c-L8-u11', 21, '함수 포인터 — 함수를 변수에 저장', 'L8-u11-func-pointer-v2.html', 3),
            theory('c-L8-u12', 22, '포인터 종합 실전', 'L8-u12-comprehensive-v2.html', 3),
            pj('c-L8-pj11', 23, '콜백 계산기', 'L8-pj11-callback-calc-v2.html', 3),
            pj('c-L8-pj12', 24, '메모리 시각화 도구', 'L8-pj12-memory-visual-v2.html', 3),
            pj('c-L8-pj13', 25, '포인터 배열 문자열 정렬', 'L8-pj13-string-sort-v2.html', 3),
            pj('c-L8-pj14', 26, '미니 메모리 관리자', 'L8-pj14-memory-manager-v2.html', 3),
            pj('c-L8-pj15', 27, '포인터 마스터 챌린지', 'L8-pj15-master-challenge-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 9: 구조체
    // ══════════════════════════════════════════════
    {
        id: 'c-L9',
        chapterNumber: 9,
        title: '구조체',
        icon: 'account_tree',
        description: '구조체 정의, 멤버 접근, 구조체 배열, 포인터, typedef까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 구조체 입문 ──
            theory('c-L9-u01', 1, '구조체란? — 다른 타입 묶기', 'L9-u01-struct-intro-v2.html'),
            theory('c-L9-u02', 2, '구조체 선언과 초기화', 'L9-u02-struct-init-v2.html'),
            theory('c-L9-u03', 3, '멤버 접근 — 점(.) 연산자', 'L9-u03-member-access-v2.html'),
            theory('c-L9-u04', 4, 'typedef — 타입 별명 붙이기', 'L9-u04-typedef-v2.html'),
            pj('c-L9-pj01', 5, '학생 정보 카드', 'L9-pj01-student-card-v2.html', 1),
            pj('c-L9-pj02', 6, '좌표 계산기', 'L9-pj02-coordinate-v2.html', 1),
            pj('c-L9-pj03', 7, '날짜 관리기', 'L9-pj03-date-manager-v2.html', 2),
            pj('c-L9-pj04', 8, '도서 등록 시스템', 'L9-pj04-book-register-v2.html', 2),
            pj('c-L9-pj05', 9, 'RGB 색상 믹서', 'L9-pj05-color-mixer-v2.html', 1),
            // ── 구조체 활용 ──
            theory('c-L9-u05', 10, '구조체 배열 — 여러 데이터 관리', 'L9-u05-struct-array-v2.html', 2),
            theory('c-L9-u06', 11, '구조체와 함수 — 전달과 반환', 'L9-u06-struct-func-v2.html', 2),
            theory('c-L9-u07', 12, '구조체 포인터 — 화살표(->) 연산자', 'L9-u07-struct-pointer-v2.html', 2),
            theory('c-L9-u08', 13, '중첩 구조체 — 구조체 안의 구조체', 'L9-u08-nested-struct-v2.html', 2),
            pj('c-L9-pj06', 14, '성적 관리 시스템 v2', 'L9-pj06-grade-struct-v2.html', 2),
            pj('c-L9-pj07', 15, '연락처 관리 프로그램', 'L9-pj07-contacts-v2.html', 2),
            pj('c-L9-pj08', 16, '쇼핑 카트', 'L9-pj08-shopping-cart-v2.html', 2),
            pj('c-L9-pj09', 17, '영화 리뷰 데이터베이스', 'L9-pj09-movie-db-v2.html', 2),
            pj('c-L9-pj10', 18, '시간 계산기', 'L9-pj10-time-calc-v2.html', 2),
            // ── 구조체 마스터 ──
            theory('c-L9-u09', 19, 'enum — 열거형', 'L9-u09-enum-v2.html', 2),
            theory('c-L9-u10', 20, 'union — 공용체', 'L9-u10-union-v2.html', 3),
            theory('c-L9-u11', 21, '비트 필드와 패딩', 'L9-u11-bitfield-v2.html', 3),
            theory('c-L9-u12', 22, '구조체 종합 실전', 'L9-u12-comprehensive-v2.html', 3),
            pj('c-L9-pj11', 23, 'RPG 캐릭터 시스템', 'L9-pj11-rpg-character-v2.html', 3),
            pj('c-L9-pj12', 24, '은행 계좌 관리', 'L9-pj12-bank-account-v2.html', 3),
            pj('c-L9-pj13', 25, '도서관 관리 시스템', 'L9-pj13-library-v2.html', 3),
            pj('c-L9-pj14', 26, '카드 게임 (구조체 활용)', 'L9-pj14-card-game-v2.html', 3),
            pj('c-L9-pj15', 27, '미니 ERP 시스템', 'L9-pj15-mini-erp-v2.html', 3),
        ],
    },

    // ══════════════════════════════════════════════
    // Level 10: 동적 메모리
    // ══════════════════════════════════════════════
    {
        id: 'c-L10',
        chapterNumber: 10,
        title: '동적 메모리',
        icon: 'memory',
        description: 'malloc, calloc, realloc, free, 메모리 누수, 연결 리스트까지 배우고 15개 프로젝트로 실습합니다.',
        units: [
            // ── 동적 메모리 입문 ──
            theory('c-L10-u01', 1, '동적 메모리란? — 실행 중 할당', 'L10-u01-dynamic-intro-v2.html'),
            theory('c-L10-u02', 2, 'malloc — 메모리 할당', 'L10-u02-malloc-v2.html'),
            theory('c-L10-u03', 3, 'free — 메모리 해제', 'L10-u03-free-v2.html'),
            theory('c-L10-u04', 4, 'calloc과 realloc', 'L10-u04-calloc-realloc-v2.html', 2),
            pj('c-L10-pj01', 5, '동적 배열 만들기', 'L10-pj01-dynamic-array-v2.html', 2),
            pj('c-L10-pj02', 6, '동적 문자열 입력', 'L10-pj02-dynamic-string-v2.html', 2),
            pj('c-L10-pj03', 7, '크기 조절 배열', 'L10-pj03-resize-array-v2.html', 2),
            pj('c-L10-pj04', 8, '동적 성적 관리', 'L10-pj04-dynamic-grades-v2.html', 2),
            pj('c-L10-pj05', 9, '메모리 사용량 추적기', 'L10-pj05-memory-tracker-v2.html', 2),
            // ── 동적 메모리 활용 ──
            theory('c-L10-u05', 10, '메모리 누수 — 잊으면 안 되는 free', 'L10-u05-memory-leak-v2.html', 2),
            theory('c-L10-u06', 11, 'dangling 포인터 — 해제 후 접근', 'L10-u06-dangling-v2.html', 2),
            theory('c-L10-u07', 12, '동적 2차원 배열', 'L10-u07-dynamic-2d-v2.html', 3),
            theory('c-L10-u08', 13, '동적 구조체 배열', 'L10-u08-dynamic-struct-v2.html', 2),
            pj('c-L10-pj06', 14, '동적 연락처 관리', 'L10-pj06-dynamic-contacts-v2.html', 2),
            pj('c-L10-pj07', 15, '동적 행렬 계산기', 'L10-pj07-matrix-calc-v2.html', 3),
            pj('c-L10-pj08', 16, '메모리 풀 시뮬레이터', 'L10-pj08-memory-pool-v2.html', 3),
            pj('c-L10-pj09', 17, '동적 문자열 배열', 'L10-pj09-string-array-v2.html', 2),
            pj('c-L10-pj10', 18, '가변 크기 스택', 'L10-pj10-dynamic-stack-v2.html', 3),
            // ── 동적 메모리 마스터 ──
            theory('c-L10-u09', 19, '연결 리스트 개념', 'L10-u09-linked-list-intro-v2.html', 3),
            theory('c-L10-u10', 20, '연결 리스트 구현', 'L10-u10-linked-list-impl-v2.html', 3),
            theory('c-L10-u11', 21, '연결 리스트 활용', 'L10-u11-linked-list-usage-v2.html', 3),
            theory('c-L10-u12', 22, '동적 메모리 종합 실전', 'L10-u12-comprehensive-v2.html', 3),
            pj('c-L10-pj11', 23, '연결 리스트 할일 목록', 'L10-pj11-todo-list-v2.html', 3),
            pj('c-L10-pj12', 24, '연결 리스트 음악 플레이어', 'L10-pj12-music-player-v2.html', 3),
            pj('c-L10-pj13', 25, '동적 해시 테이블', 'L10-pj13-hash-table-v2.html', 3),
            pj('c-L10-pj14', 26, '메모리 디버거', 'L10-pj14-memory-debugger-v2.html', 3),
            pj('c-L10-pj15', 27, 'C언어 마스터 챌린지', 'L10-pj15-final-challenge-v2.html', 3),
        ],
    },
];
