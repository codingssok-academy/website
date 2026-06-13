import type { Chapter, Page, Unit } from './types';

const ADVANCED_BASE = '/learn/math-thinking/advanced-06-15';
const SOLUTIONS_BASE = '/learn/math-thinking/solutions-51-110';

function imagePage(base: string, id: string, title: string, slideNumber: number): Page {
    const fileName = String(slideNumber).padStart(2, '0') + '.png';

    return {
        id,
        title,
        type: '페이지',
        content: '<div class="cs-slide-wrap math-slide-wrap"><img class="cs-slide math-slide" src="' + base + '/' + fileName + '" alt="' + title + '" loading="lazy" /></div>',
    };
}

function imageUnit(base: string, id: string, num: number, title: string, subtitle: string, start: number, end: number, difficulty: Unit['difficulty'] = 3): Unit {
    const pages = Array.from({ length: end - start + 1 }, (_, index) => {
        const slideNumber = start + index;
        return imagePage(base, id + '-p' + (index + 1), title + ' ' + (index + 1), slideNumber);
    });

    return {
        id,
        unitNumber: num,
        title,
        subtitle,
        type: '종합',
        difficulty,
        duration: pages.length >= 10 ? '40분' : '30분',
        pages,
    };
}

export const MATH_THINKING_CHAPTERS: Chapter[] = [
    {
        id: 'mt-advanced-06-15',
        chapterNumber: 1,
        title: '고난도 사고력수학 1-50',
        icon: 'workspace_premium',
        description: '경시와 심화 사고력에 필요한 문제 독해, 논리 추론, 전략 선택, 실전 점검을 이미지 교재 50장으로 학습합니다.',
        ageLevel: 'advanced',
        recommendedGrade: '중등 심화',
        units: [
            imageUnit(ADVANCED_BASE, 'mt-adv-u01', 1, '로드맵과 문제 독해', '조건을 읽고 필요한 정보를 정리합니다.', 1, 10, 3),
            imageUnit(ADVANCED_BASE, 'mt-adv-u02', 2, '논리추론과 전략 최적화', '가능성을 줄이고 풀이 순서를 세웁니다.', 11, 20, 3),
            imageUnit(ADVANCED_BASE, 'mt-adv-u03', 3, '경시수학 핵심 유형과 융합', '여러 개념이 섞인 문제를 단계별로 풉니다.', 21, 30, 3),
            imageUnit(ADVANCED_BASE, 'mt-adv-u04', 4, '실전모의고사와 약점 보완', '실전 풀이 후 놓친 조건을 다시 확인합니다.', 31, 40, 3),
            imageUnit(ADVANCED_BASE, 'mt-adv-u05', 5, '최종평가와 파이널 정리', '마무리 문제로 사고 흐름을 점검합니다.', 41, 50, 3),
        ],
    },
    {
        id: 'mt-solutions-51-110',
        chapterNumber: 2,
        title: '정답해설편 51-110',
        icon: 'fact_check',
        description: '고난도 사고력수학 51-110 정답해설을 보며 풀이 흐름, 오답 원인, 다시 풀어야 할 조건을 점검합니다.',
        ageLevel: 'advanced',
        recommendedGrade: '중등 심화',
        units: [
            imageUnit(SOLUTIONS_BASE, 'mt-sol-u06', 6, '정답해설 51-60', '풀이 근거와 조건 정리를 확인합니다.', 51, 60, 3),
            imageUnit(SOLUTIONS_BASE, 'mt-sol-u07', 7, '정답해설 61-70', '오답 원인을 찾고 풀이 순서를 다시 세웁니다.', 61, 70, 3),
            imageUnit(SOLUTIONS_BASE, 'mt-sol-u08', 8, '정답해설 71-80', '복합 조건 문제의 핵심 단서를 정리합니다.', 71, 80, 3),
            imageUnit(SOLUTIONS_BASE, 'mt-sol-u09', 9, '정답해설 81-90', '실전형 문제의 풀이 전략을 점검합니다.', 81, 90, 3),
            imageUnit(SOLUTIONS_BASE, 'mt-sol-u10', 10, '정답해설 91-100', '계산 실수와 조건 누락을 교정합니다.', 91, 100, 3),
            imageUnit(SOLUTIONS_BASE, 'mt-sol-u11', 11, '정답해설 101-110', '마지막 해설로 사고 흐름을 완성합니다.', 101, 110, 3),
        ],
    },
];
