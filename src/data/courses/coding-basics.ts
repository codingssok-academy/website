/**
 * 코딩 기초 커리큘럼 v3
 * 담당자 지시(2026-04-08): 기존 HTML 학습자료 전부 삭제, 커리큘럼 구조만 유지.
 * 학습 시 PptViewer(materialMode='ppt')로 선생님 업로드 PPT 표시.
 */

import type { Chapter } from './types';

function unit(id: string, num: number, title: string, _legacyFile?: string, dur = '25분') {
    return { id, unitNumber: num, title, type: '이론' as const, difficulty: 1 as const, duration: dur, pages: [] };
}

export const CODING_BASICS: Chapter[] = [
    {
        id: 'cd-ch1',
        chapterNumber: 1,
        title: '코딩이란?',
        icon: 'code',
        description: '코딩이 뭔지, 왜 배우는지, 용어와 프로그래밍 언어 종류를 배웁니다.',
        units: [
            unit('cd-u01', 1, '코딩 = 컴퓨터에게 명령 내리기', 'CD-u01-what-is-coding-v2.html'),
            unit('cd-u02', 2, '왜 코딩을 배우나?', 'CD-u02-why-coding-v2.html'),
            unit('cd-u03', 3, '코딩 용어 정리', 'CD-u03-terms-v2.html'),
            unit('cd-u04', 4, '프로그래밍 언어 종류', 'CD-u04-languages-v2.html'),
        ],
    },
    {
        id: 'cd-ch2',
        chapterNumber: 2,
        title: '코딩의 기본 재료',
        icon: 'category',
        description: '변수, 자료형, 조건문, 반복문, 함수의 개념을 비유로 배웁니다.',
        units: [
            unit('cd-u05', 5, '변수 = 이름표 붙은 상자', 'CD-u05-variable-v2.html'),
            unit('cd-u06', 6, '자료형 = 상자의 종류', 'CD-u06-datatype-v2.html'),
            unit('cd-u07', 7, '조건문 = 갈림길', 'CD-u07-condition-v2.html'),
            unit('cd-u08', 8, '반복문 = 같은 일 여러 번', 'CD-u08-loop-v2.html'),
            unit('cd-u09', 9, '함수 = 레시피', 'CD-u09-function-v2.html'),
        ],
    },
    {
        id: 'cd-ch3',
        chapterNumber: 3,
        title: '문제해결과 사고력',
        icon: 'psychology',
        description: '분해, 패턴, 추상화, 순서도, 의사코드로 문제해결 사고력을 기릅니다.',
        units: [
            unit('cd-u10', 10, '문제를 쪼개는 힘', 'CD-u10-decomposition-v2.html'),
            unit('cd-u11', 11, '패턴 찾기', 'CD-u11-pattern-v2.html'),
            unit('cd-u12', 12, '핵심만 뽑기 (추상화)', 'CD-u12-abstraction-v2.html'),
            unit('cd-u13', 13, '순서도 그리기', 'CD-u13-flowchart-v2.html'),
            unit('cd-u14', 14, '의사코드 = 말로 먼저 쓰기', 'CD-u14-pseudocode-v2.html'),
        ],
    },
    {
        id: 'cd-ch4',
        chapterNumber: 4,
        title: '개발 환경 첫걸음',
        icon: 'terminal',
        description: 'VS Code 설치, 터미널, Hello World, 에러 읽기를 배웁니다.',
        units: [
            unit('cd-u15', 15, 'VS Code 설치하기', 'CD-u15-vscode-v2.html'),
            unit('cd-u16', 16, '터미널이란?', 'CD-u16-terminal-v2.html'),
            unit('cd-u17', 17, '첫 코드 실행하기', 'CD-u17-hello-world-v2.html'),
            unit('cd-u18', 18, '에러 읽기 = 틀려도 괜찮아', 'CD-u18-errors-v2.html'),
        ],
    },
    {
        id: 'cd-ch5',
        chapterNumber: 5,
        title: '코딩 마인드셋',
        icon: 'rocket_launch',
        description: '디버깅, 구글링, 개발자 직업을 알아보고 총정리합니다.',
        units: [
            unit('cd-u19', 19, '버그와 디버깅', 'CD-u19-debugging-v2.html'),
            unit('cd-u20', 20, '구글링의 기술', 'CD-u20-googling-v2.html'),
            unit('cd-u21', 21, '코딩하는 사람들', 'CD-u21-developers-v2.html'),
            unit('cd-u22', 22, '코딩기초 총정리', 'CD-u22-comprehensive-v2.html'),
        ],
    },
];
