/**
 * 피지컬 컴퓨팅 커리큘럼
 * 담당자 지시(2026-04-08): 기존 HTML 학습자료 전부 삭제, 커리큘럼 구조만 유지.
 * 학습 시 PptViewer(materialMode='ppt')로 선생님 업로드 PPT 표시.
 */

import type { Chapter } from './types';

function unit(id: string, num: number, title: string, _legacyFile?: string, diff: 1 | 2 | 3 = 1, dur = '30분') {
    return { id, unitNumber: num, title, type: '이론' as const, difficulty: diff, duration: dur, pages: [] };
}

export const PHYSICAL_COMPUTING: Chapter[] = [
    {
        id: 'pc-ch1',
        chapterNumber: 1,
        title: '첫 만남',
        icon: 'developer_board',
        description: '아두이노 보드를 만져보고, LED를 켜고, 첫 코드를 업로드합니다.',
        units: [
            unit('pc-u01', 1, '아두이노가 뭐야?', 'PC-u01-arduino-intro-v2.html'),
            unit('pc-u02', 2, 'LED 켜기 — 첫 회로', 'PC-u02-first-led-v2.html'),
            unit('pc-u03', 3, 'LED 깜빡이기 — 첫 코드', 'PC-u03-blink-v2.html'),
            unit('pc-u04', 4, '버튼으로 LED 제어', 'PC-u04-button-led-v2.html', 1, '35분'),
        ],
    },
    {
        id: 'pc-ch2',
        chapterNumber: 2,
        title: '센서의 세계',
        icon: 'sensors',
        description: '빛, 온도, 초음파, 소리 센서로 주변 환경을 감지합니다.',
        units: [
            unit('pc-u05', 5, '빛 센서 — 어두우면 LED 켜기', 'PC-u05-light-sensor-v2.html', 2),
            unit('pc-u06', 6, '온도 센서 — 내 방 온도 측정', 'PC-u06-temp-sensor-v2.html', 2),
            unit('pc-u07', 7, '초음파 센서 — 거리 측정기', 'PC-u07-ultrasonic-v2.html', 2),
            unit('pc-u08', 8, '소리 센서 — 박수치면 반응', 'PC-u08-sound-sensor-v2.html', 2),
        ],
    },
    {
        id: 'pc-ch3',
        chapterNumber: 3,
        title: '움직이기',
        icon: 'animation',
        description: '서보모터, PWM, 부저, LCD로 출력을 제어합니다.',
        units: [
            unit('pc-u09', 9, '서보모터 — 각도 제어', 'PC-u09-servo-v2.html', 2),
            unit('pc-u10', 10, 'LED 밝기 조절 — PWM', 'PC-u10-pwm-v2.html', 2),
            unit('pc-u11', 11, '부저 — 멜로디 연주', 'PC-u11-buzzer-v2.html', 2),
            unit('pc-u12', 12, 'LCD 화면 — 글자 표시', 'PC-u12-lcd-v2.html', 2),
        ],
    },
    {
        id: 'pc-ch4',
        chapterNumber: 4,
        title: '이제 원리를 알자',
        icon: 'science',
        description: '전기 기초, 회로, 반도체, 마이크로프로세서 원리를 배웁니다.',
        units: [
            unit('pc-u13', 13, '전기의 기초 — 전압, 전류, 저항', 'PC-u13-electricity-v2.html', 2),
            unit('pc-u14', 14, '회로 읽기 — 직렬과 병렬', 'PC-u14-circuits-v2.html', 2),
            unit('pc-u15', 15, '반도체란? — 컴퓨터의 핵심 재료', 'PC-u15-semiconductor-v2.html', 2, '35분'),
            unit('pc-u16', 16, '마이크로프로세서 — CPU의 미니 버전', 'PC-u16-microprocessor-v2.html', 2, '35분'),
        ],
    },
    {
        id: 'pc-ch5',
        chapterNumber: 5,
        title: '프로젝트',
        icon: 'rocket_launch',
        description: '배운 것을 조합해서 실전 프로젝트를 만듭니다.',
        units: [
            unit('pc-u17', 17, '스마트 가로등', 'PC-u17-smart-light-v2.html', 2, '40분'),
            unit('pc-u18', 18, '디지털 온도계', 'PC-u18-digital-thermometer-v2.html', 2, '40분'),
            unit('pc-u19', 19, '주차 감지기', 'PC-u19-parking-sensor-v2.html', 2, '40분'),
            unit('pc-u20', 20, '미니 피아노', 'PC-u20-mini-piano-v2.html', 2, '40분'),
            unit('pc-u21', 21, '스마트 선풍기', 'PC-u21-smart-fan-v2.html', 3, '45분'),
            unit('pc-u22', 22, '내가 만드는 IoT', 'PC-u22-iot-project-v2.html', 3, '45분'),
        ],
    },
];
