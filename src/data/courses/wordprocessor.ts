/**
 * 워드프로세서 필기 코스 — 챕터 & 유닛 데이터
 * 20유닛 + 모의고사 3회
 */

import type { Chapter } from './types';

const BASE = '/learn/워드프로세서';
const EXAM_BASE = '/learn/워드프로세서/모의고사';

/** iframe으로 HTML 파일을 표시하는 페이지 생성 */
function iframePage(id: string, title: string, src: string) {
    return {
        id,
        title,
        type: '페이지' as const,
        content: `<iframe src="${src}" style="width:100%;height:100%;border:none;" allowfullscreen />`,
    };
}

export const WORDPROCESSOR_CHAPTERS: Chapter[] = [
    // ── CH1: 기초 입문 (u01~u05) ──
    {
        id: 'wp-ch1',
        chapterNumber: 1,
        title: '기초 입문',
        icon: 'edit_document',
        description: '워드프로세서 기본 개념과 한글 프로그램 시작하기',
        units: [
            {
                id: 'wp-u01',
                unitNumber: 1,
                title: '워드프로세서란 무엇인가요?',
                type: '이론',
                difficulty: 1,
                duration: '30분',
                pages: [iframePage('wp-1.1', '워드프로세서 소개', `${BASE}/wordprocessor-r1-u01-intro-v2.html`)],
            },
            {
                id: 'wp-u02',
                unitNumber: 2,
                title: '키보드 입력 기초',
                type: '이론',
                difficulty: 1,
                duration: '30분',
                pages: [iframePage('wp-2.1', '키보드 입력 기초', `${BASE}/wordprocessor-r1-u02-input-basics-v2.html`)],
            },
            {
                id: 'wp-u03',
                unitNumber: 3,
                title: '파일 저장과 관리',
                type: '이론',
                difficulty: 1,
                duration: '30분',
                pages: [iframePage('wp-3.1', '파일 저장과 관리', `${BASE}/wordprocessor-r1-u03-save-files-v2.html`)],
            },
            {
                id: 'wp-u04',
                unitNumber: 4,
                title: '화면 구성 살펴보기',
                type: '이론',
                difficulty: 1,
                duration: '30분',
                pages: [iframePage('wp-4.1', '화면 구성 살펴보기', `${BASE}/wordprocessor-r1-u04-screen-layout-v2.html`)],
            },
            {
                id: 'wp-u05',
                unitNumber: 5,
                title: '프로젝트: 자기소개서 작성',
                type: '프로젝트',
                difficulty: 1,
                duration: '45분',
                pages: [iframePage('wp-5.1', '프로젝트: 자기소개서 작성', `${BASE}/wordprocessor-r1-u05-project-self-intro-v2.html`)],
            },
        ],
    },

    // ── CH2: 편집 기초 (u06~u10) ──
    {
        id: 'wp-ch2',
        chapterNumber: 2,
        title: '편집 기초',
        icon: 'edit',
        description: '커서 이동, 복사·붙여넣기, 찾기·바꾸기 등 편집 핵심 기능',
        units: [
            {
                id: 'wp-u06',
                unitNumber: 6,
                title: '커서와 선택 영역',
                type: '이론',
                difficulty: 1,
                duration: '30분',
                pages: [iframePage('wp-6.1', '커서와 선택 영역', `${BASE}/wordprocessor-r1-u06-cursor-selection-v2.html`)],
            },
            {
                id: 'wp-u07',
                unitNumber: 7,
                title: '복사·잘라내기·붙여넣기',
                type: '이론',
                difficulty: 1,
                duration: '30분',
                pages: [iframePage('wp-7.1', '복사·잘라내기·붙여넣기', `${BASE}/wordprocessor-r1-u07-edit-commands-v2.html`)],
            },
            {
                id: 'wp-u08',
                unitNumber: 8,
                title: '찾기와 바꾸기',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [iframePage('wp-8.1', '찾기와 바꾸기', `${BASE}/wordprocessor-r1-u08-find-replace-v2.html`)],
            },
            {
                id: 'wp-u09',
                unitNumber: 9,
                title: '글자 모양과 서식',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [iframePage('wp-9.1', '글자 모양과 서식', `${BASE}/wordprocessor-r1-u09-text-formatting-v2.html`)],
            },
            {
                id: 'wp-u10',
                unitNumber: 10,
                title: '프로젝트: 공지 문서 편집',
                type: '프로젝트',
                difficulty: 2,
                duration: '45분',
                pages: [iframePage('wp-10.1', '프로젝트: 공지 문서 편집', `${BASE}/wordprocessor-r1-u10-project-notice-edit-v2.html`)],
            },
        ],
    },

    // ── CH3: 문단과 서식 (u11~u15) ──
    {
        id: 'wp-ch3',
        chapterNumber: 3,
        title: '문단과 서식',
        icon: 'format_align_left',
        description: '문단 정렬, 탭·리스트, 다단, 스타일 활용',
        units: [
            {
                id: 'wp-u11',
                unitNumber: 11,
                title: '문단 서식 설정',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [iframePage('wp-11.1', '문단 서식 설정', `${BASE}/wordprocessor-r1-u11-paragraph-formatting-v2.html`)],
            },
            {
                id: 'wp-u12',
                unitNumber: 12,
                title: '탭과 목록(리스트)',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [iframePage('wp-12.1', '탭과 목록(리스트)', `${BASE}/wordprocessor-r1-u12-lists-tabs-v2.html`)],
            },
            {
                id: 'wp-u13',
                unitNumber: 13,
                title: '다단 구성과 구역',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [iframePage('wp-13.1', '다단 구성과 구역', `${BASE}/wordprocessor-r1-u13-columns-sections-v2.html`)],
            },
            {
                id: 'wp-u14',
                unitNumber: 14,
                title: '스타일과 드롭캡',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [iframePage('wp-14.1', '스타일과 드롭캡', `${BASE}/wordprocessor-r1-u14-styles-dropcap-v2.html`)],
            },
            {
                id: 'wp-u15',
                unitNumber: 15,
                title: '프로젝트: 가정통신문 만들기',
                type: '프로젝트',
                difficulty: 2,
                duration: '45분',
                pages: [iframePage('wp-15.1', '프로젝트: 가정통신문 만들기', `${BASE}/wordprocessor-r1-u15-project-homeletter-v2.html`)],
            },
        ],
    },

    // ── CH4: 페이지 레이아웃 (u16~u20) ──
    {
        id: 'wp-ch4',
        chapterNumber: 4,
        title: '페이지 레이아웃',
        icon: 'description',
        description: '용지 설정, 테두리·배경, 머리말·꼬리말, 각주·미주',
        units: [
            {
                id: 'wp-u16',
                unitNumber: 16,
                title: '용지 설정',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [],
            },
            {
                id: 'wp-u17',
                unitNumber: 17,
                title: '테두리와 배경',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [],
            },
            {
                id: 'wp-u18',
                unitNumber: 18,
                title: '머리말·꼬리말·쪽 번호',
                type: '이론',
                difficulty: 2,
                duration: '30분',
                pages: [],
            },
            {
                id: 'wp-u19',
                unitNumber: 19,
                title: '각주·미주·목차 요소',
                type: '이론',
                difficulty: 3,
                duration: '30분',
                pages: [],
            },
            {
                id: 'wp-u20',
                unitNumber: 20,
                title: '프로젝트: 보고서 레이아웃',
                type: '프로젝트',
                difficulty: 3,
                duration: '60분',
                pages: [],
            },
        ],
    },

    // ── CH5: 모의고사 (84회 × 2 = 168 유닛) ──
    {
        id: 'wp-ch5',
        chapterNumber: 5,
        title: '모의고사',
        icon: 'quiz',
        description: '워드프로세서 필기 모의고사 84회분 (시험지 + 인터랙티브)',
        units: Array.from({ length: 84 }, (_, i) => {
            const n = i + 1;
            const nn = String(n).padStart(2, '0');
            const baseUnit = 21 + i * 2;
            const diff: 1 | 2 | 3 = n <= 28 ? 2 : n <= 56 ? 3 : 3;
            return [
                {
                    id: `wp-mock-${nn}-sheet`,
                    unitNumber: baseUnit,
                    title: `${n}회 모의고사 — 시험지`,
                    type: '퀴즈' as const,
                    difficulty: diff,
                    duration: '60분',
                    pages: [iframePage(`wp-m${nn}s`, `${n}회 모의고사 시험지`, `${EXAM_BASE}/시험지-${n}회-60문제.html`)],
                },
                {
                    id: `wp-mock-${nn}-inter`,
                    unitNumber: baseUnit + 1,
                    title: `${n}회 모의고사 — 인터랙티브`,
                    type: '퀴즈' as const,
                    difficulty: diff,
                    duration: '60분',
                    pages: [iframePage(`wp-m${nn}i`, `${n}회 모의고사 인터랙티브`, `${EXAM_BASE}/인터랙티브-${n}회-60문제.html`)],
                },
            ];
        }).flat(),
    },
];
