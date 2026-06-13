import type { Chapter, Page, Unit } from './types';

const KIDS_IT_BASE = '/learn/kids-it/first-steps';

function slidePage(slideNumber: number, title: string): Page {
    const fileName = `${String(slideNumber).padStart(3, '0')}.png`;

    return {
        id: `kids-it-first-${String(slideNumber).padStart(3, '0')}`,
        title,
        type: '페이지',
        content: `<div class="cs-slide-wrap"><img class="cs-slide" src="${KIDS_IT_BASE}/${fileName}" alt="${title}" loading="lazy" /></div>`,
    };
}

function makeUnit(id: string, unitNumber: number, title: string, start: number, end: number): Unit {
    const pages = Array.from({ length: end - start + 1 }, (_, index) => {
        const slideNumber = start + index;
        return slidePage(slideNumber, `${title} ${index + 1}`);
    });

    return {
        id,
        unitNumber,
        title,
        type: '종합',
        difficulty: 1,
        duration: pages.length >= 10 ? '25분' : '15분',
        pages,
    };
}

export const KIDS_IT_CHAPTERS: Chapter[] = [
    {
        id: 'kids-it-first-1',
        chapterNumber: 1,
        title: '1권 | 컴퓨터와 화면 첫걸음',
        icon: 'computer',
        description: '어린이가 컴퓨터 화면, 아이콘, 창, 마우스와 터치 조작을 부담 없이 익히는 첫 단계입니다.',
        ageLevel: 'elementary',
        recommendedGrade: '5~9세',
        units: [
            makeUnit('kids-it-first-u01', 1, '컴퓨터와 화면 첫 만남', 1, 10),
            makeUnit('kids-it-first-u02', 2, '아이콘과 창 다루기', 11, 20),
            makeUnit('kids-it-first-u03', 3, '마우스와 터치 조작', 21, 30),
            makeUnit('kids-it-first-u04', 4, '키보드와 글자 입력', 31, 40),
            makeUnit('kids-it-first-u05', 5, '파일과 폴더 기초', 41, 50),
        ],
    },
    {
        id: 'kids-it-first-2',
        chapterNumber: 2,
        title: '2권 | 미디어·인터넷·안전',
        icon: 'photo_camera',
        description: '그림, 사진, 소리, 인터넷 검색, 안전한 디지털 사용 습관을 정리합니다.',
        ageLevel: 'elementary',
        recommendedGrade: '5~9세',
        units: [
            makeUnit('kids-it-first-u06', 6, '그림과 사진 다루기', 51, 60),
            makeUnit('kids-it-first-u07', 7, '소리와 미디어 이해', 61, 70),
            makeUnit('kids-it-first-u08', 8, '인터넷과 검색 첫걸음', 71, 80),
            makeUnit('kids-it-first-u09', 9, '안전한 디지털 사용', 81, 90),
            makeUnit('kids-it-first-u10', 10, '문제 해결 순서 익히기', 91, 100),
        ],
    },
    {
        id: 'kids-it-first-3',
        chapterNumber: 3,
        title: '3권 | 디지털 표현과 마무리',
        icon: 'auto_stories',
        description: '코딩 전 사고, 순서와 반복 감각, 디지털 작품 만들기와 발표까지 이어갑니다.',
        ageLevel: 'elementary',
        recommendedGrade: '5~9세',
        units: [
            makeUnit('kids-it-first-u11', 11, '코딩 전 생각 정리', 101, 110),
            makeUnit('kids-it-first-u12', 12, '순서와 반복 감각', 111, 120),
            makeUnit('kids-it-first-u13', 13, '디지털 작품 만들기', 121, 130),
            makeUnit('kids-it-first-u14', 14, '정리와 발표 준비', 131, 140),
            makeUnit('kids-it-first-u15', 15, '첫걸음 마무리', 141, 145),
        ],
    },
];
