import type { Chapter, Page, Unit } from './types';

const PHYSICAL_BASE = '/learn/physical-computing/vol1';

function slidePage(slideNumber: number, title: string): Page {
    const fileName = `${String(slideNumber).padStart(3, '0')}.png`;

    return {
        id: `physical-computing-${String(slideNumber).padStart(3, '0')}`,
        title,
        type: '페이지',
        content: `<div class="cs-slide-wrap"><img class="cs-slide" src="${PHYSICAL_BASE}/${fileName}" alt="${title}" loading="lazy" /></div>`,
    };
}

function makeUnit(id: string, unitNumber: number, title: string, type: Unit['type'], start: number, end: number, difficulty: Unit['difficulty']): Unit {
    const pages = Array.from({ length: end - start + 1 }, (_, index) => {
        const slideNumber = start + index;
        return slidePage(slideNumber, `${title} ${index + 1}`);
    });

    return {
        id,
        unitNumber,
        title,
        type,
        difficulty,
        duration: pages.length >= 10 ? '35분' : '25분',
        pages,
    };
}

export const PHYSICAL_COMPUTING: Chapter[] = [
    {
        id: 'physical-book-1',
        chapterNumber: 1,
        title: '1권 | 아두이노와 기본 회로',
        icon: 'memory',
        description: '피지컬 컴퓨팅의 의미, 아두이노, 입력과 출력, 전기 흐름, LED와 버튼 회로를 차근차근 익힙니다.',
        units: [
            makeUnit('physical-u01', 1, '피지컬 컴퓨팅과 아두이노', '이론', 1, 10, 1),
            makeUnit('physical-u02', 2, '전기 흐름과 기본 부품', '이론', 11, 20, 1),
            makeUnit('physical-u03', 3, 'LED 회로와 첫 제어', '실습', 21, 30, 1),
            makeUnit('physical-u04', 4, '버튼과 디지털 입력', '실습', 31, 40, 2),
        ],
    },
    {
        id: 'physical-book-2',
        chapterNumber: 2,
        title: '2권 | 센서·출력·움직임 제어',
        icon: 'sensors',
        description: '빛, 온도, 거리 센서와 모터, 소리, 화면 출력 장치를 연결해 주변 환경에 반응하는 장치를 만듭니다.',
        units: [
            makeUnit('physical-u05', 5, '아날로그 입력과 센서', '실습', 41, 50, 2),
            makeUnit('physical-u06', 6, '거리·빛·온도 센서', '실습', 51, 60, 2),
            makeUnit('physical-u07', 7, '모터와 움직임 제어', '실습', 61, 70, 2),
            makeUnit('physical-u08', 8, '디스플레이와 소리 출력', '실습', 71, 80, 2),
        ],
    },
    {
        id: 'physical-book-3',
        chapterNumber: 3,
        title: '3권 | 생활 문제 해결 프로젝트',
        icon: 'rocket_launch',
        description: '조건, 반복, 함수, 데이터 기록을 활용해 스마트 장치와 고등 종합 프로젝트까지 설계합니다.',
        units: [
            makeUnit('physical-u09', 9, '조건·반복·함수로 시스템 만들기', '프로젝트', 81, 90, 2),
            makeUnit('physical-u10', 10, '생활 문제 해결 프로젝트', '프로젝트', 91, 100, 3),
            makeUnit('physical-u11', 11, '스마트 장치 프로젝트', '프로젝트', 101, 110, 3),
            makeUnit('physical-u12', 12, '종합 프로젝트와 문서화', '프로젝트', 111, 120, 3),
        ],
    },
];
