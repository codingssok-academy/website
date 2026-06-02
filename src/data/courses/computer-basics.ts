/**
 * 컴퓨터 기초 커리큘럼 v3
 * 담당자 지시(2026-04-08): 기존 HTML 학습자료 전부 삭제, 커리큘럼 구조만 유지.
 * 학습 시 PptViewer(materialMode='ppt')가 표시되며 선생님이 업로드한 PPT가 노출됨.
 */

import type { Chapter } from './types';

// file 인자는 더 이상 사용하지 않지만 호출부 호환을 위해 두 번째 파라미터만 받음
function unit(id: string, num: number, title: string, _legacyFile?: string, dur = '25분') {
    return { id, unitNumber: num, title, type: '이론' as const, difficulty: 1 as const, duration: dur, pages: [] };
}

export const COMPUTER_BASICS: Chapter[] = [
    {
        id: 'cb-ch1',
        chapterNumber: 1,
        title: '컴퓨터란?',
        icon: 'computer',
        description: '컴퓨터가 뭔지, 하드웨어와 소프트웨어, 입력→처리→출력을 배웁니다.',
        units: [
            unit('cb-u01', 1, '컴퓨터가 뭐야?', 'CB-u01-what-is-computer-v2.html'),
            unit('cb-u02', 2, '컴퓨터의 몸 — 하드웨어', 'CB-u02-hardware-v2.html'),
            unit('cb-u03', 3, '컴퓨터의 뇌 — 소프트웨어', 'CB-u03-software-v2.html'),
            unit('cb-u04', 4, '입력 → 처리 → 출력', 'CB-u04-input-process-output-v2.html'),
        ],
    },
    {
        id: 'cb-ch2',
        chapterNumber: 2,
        title: '컴퓨터 다루기',
        icon: 'keyboard',
        description: '키보드, 마우스, 파일과 폴더, 확장자, 압축을 배웁니다.',
        units: [
            unit('cb-u05', 5, '키보드 마스터', 'CB-u05-keyboard-v2.html'),
            unit('cb-u06', 6, '마우스와 터치패드', 'CB-u06-mouse-v2.html'),
            unit('cb-u07', 7, '파일과 폴더', 'CB-u07-files-folders-v2.html'),
            unit('cb-u08', 8, '확장자의 비밀', 'CB-u08-extensions-v2.html'),
            unit('cb-u09', 9, '압축과 해제', 'CB-u09-compression-v2.html'),
        ],
    },
    {
        id: 'cb-ch3',
        chapterNumber: 3,
        title: '인터넷 세상',
        icon: 'public',
        description: '인터넷, 브라우저, 이메일, 클라우드, 인터넷 안전을 배웁니다.',
        units: [
            unit('cb-u10', 10, '인터넷이란?', 'CB-u10-internet-v2.html'),
            unit('cb-u11', 11, '브라우저와 검색', 'CB-u11-browser-search-v2.html'),
            unit('cb-u12', 12, '이메일과 클라우드', 'CB-u12-email-cloud-v2.html'),
            unit('cb-u13', 13, '인터넷 안전', 'CB-u13-internet-safety-v2.html'),
        ],
    },
    {
        id: 'cb-ch4',
        chapterNumber: 4,
        title: '컴퓨터 속 숫자',
        icon: 'tag',
        description: '이진수, 비트와 바이트, 아스키코드, RGB와 픽셀을 배웁니다.',
        units: [
            unit('cb-u14', 14, '0과 1의 세계', 'CB-u14-binary-v2.html'),
            unit('cb-u15', 15, '비트와 바이트', 'CB-u15-bits-bytes-v2.html'),
            unit('cb-u16', 16, '글자의 비밀', 'CB-u16-ascii-unicode-v2.html'),
            unit('cb-u17', 17, '색깔의 비밀', 'CB-u17-rgb-pixel-v2.html'),
        ],
    },
    {
        id: 'cb-ch5',
        chapterNumber: 5,
        title: '컴퓨터와 문제해결',
        icon: 'lightbulb',
        description: '문제해결, 알고리즘, 조건 사고, 반복 사고를 배우고 총정리합니다.',
        units: [
            unit('cb-u18', 18, '문제해결이란?', 'CB-u18-problem-solving-v2.html'),
            unit('cb-u19', 19, '알고리즘 = 레시피', 'CB-u19-algorithm-v2.html'),
            unit('cb-u20', 20, '조건으로 나누기', 'CB-u20-condition-thinking-v2.html'),
            unit('cb-u21', 21, '반복으로 줄이기', 'CB-u21-repeat-thinking-v2.html'),
            unit('cb-u22', 22, '컴퓨터기초 총정리', 'CB-u22-comprehensive-v2.html'),
        ],
    },
];
