import type { Chapter, Page, Unit } from './types';

const GAME_BASE = '/learn/game-dev/vol1';

function slidePage(slideNumber: number, title: string): Page {
    const fileName = `${String(slideNumber).padStart(2, '0')}.png`;

    return {
        id: `game-dev-${String(slideNumber).padStart(3, '0')}`,
        title,
        type: '페이지',
        content: `<div class="cs-slide-wrap"><img class="cs-slide" src="${GAME_BASE}/${fileName}" alt="${title}" loading="lazy" /></div>`,
    };
}

function makeUnit(
    id: string,
    unitNumber: number,
    title: string,
    type: Unit['type'],
    start: number,
    end: number,
    difficulty: Unit['difficulty'],
): Unit {
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
        duration: pages.length >= 15 ? '45분' : pages.length >= 10 ? '30분' : '20분',
        pages,
    };
}

const GAME_DEV_BOOK1_UNITS: Unit[] = [
    makeUnit('game-dev-u01', 1, 'Roblox Studio 시작 화면', '이론', 1, 10, 1),
    makeUnit('game-dev-u02', 2, '첫 Script와 print()', '실습', 11, 20, 1),
    makeUnit('game-dev-u03', 3, '변수와 값 저장', '이론', 21, 30, 1),
    makeUnit('game-dev-u04', 4, '조건문과 비교 판단', '이론', 31, 45, 2),
    makeUnit('game-dev-u05', 5, '조건문 결과 예측과 Part 변경', '실습', 46, 50, 2),
    makeUnit('game-dev-u06', 6, 'Part 속성 제어', '실습', 51, 70, 2),
    makeUnit('game-dev-u07', 7, 'Touched 이벤트', '실습', 71, 75, 2),
    makeUnit('game-dev-u08', 8, 'ClickDetector 클릭 이벤트', '실습', 76, 80, 2),
    makeUnit('game-dev-u09', 9, '점수와 체력 시스템', '프로젝트', 81, 90, 3),
    makeUnit('game-dev-u10', 10, '미니게임 규칙 입문', '프로젝트', 91, 95, 3),
];

const GAME_DEV_BOOK2_UNITS: Unit[] = [
    makeUnit('game-dev-u11', 11, '화면 UI와 ScreenGui', '이론', 96, 105, 2),
    makeUnit('game-dev-u12', 12, 'TextButton과 UI 꾸미기', '실습', 106, 116, 2),
    makeUnit('game-dev-u13', 13, 'UI 배치와 버튼 흐름', '실습', 117, 125, 2),
    makeUnit('game-dev-u14', 14, 'leaderstats와 코인 점수', '실습', 126, 139, 3),
    makeUnit('game-dev-u15', 15, '오비 체크포인트와 위험 블록', '프로젝트', 140, 151, 3),
    makeUnit('game-dev-u16', 16, '목표 블록과 제한 시간', '프로젝트', 152, 164, 3),
    makeUnit('game-dev-u17', 17, '상점과 아이템 구매', '프로젝트', 165, 178, 3),
    makeUnit('game-dev-u18', 18, '속도·점프 아이템 테스트', '프로젝트', 179, 190, 3),
    makeUnit('game-dev-u19', 19, '최종 미니게임 완성', '프로젝트', 191, 200, 3),
    makeUnit('game-dev-u20', 20, '게임 출시와 업데이트 보강', '프로젝트', 201, 210, 3),
    makeUnit('game-dev-u21', 21, '다음 게임 프로젝트 기획', '프로젝트', 211, 220, 3),
];

const GAME_DEV_BOOK3_UNITS: Unit[] = [
    makeUnit('game-dev-u22', 22, '함수와 table 기초', '이론', 221, 230, 2),
    makeUnit('game-dev-u23', 23, 'ModuleScript와 상태 관리', '실습', 231, 240, 2),
    makeUnit('game-dev-u24', 24, '읽기 쉬운 Luau 코드 구조', '이론', 241, 250, 2),
    makeUnit('game-dev-u25', 25, 'Roblox 서비스와 보관함', '이론', 251, 260, 2),
    makeUnit('game-dev-u26', 26, 'RemoteEvent와 서버·클라이언트', '실습', 261, 270, 3),
    makeUnit('game-dev-u27', 27, 'DataStore와 저장 시스템', '실습', 271, 280, 3),
    makeUnit('game-dev-u28', 28, 'UI 상태와 메뉴 화면', '실습', 281, 290, 3),
    makeUnit('game-dev-u29', 29, '상점 UI와 구매 흐름', '프로젝트', 291, 300, 3),
    makeUnit('game-dev-u30', 30, '코인 수집과 보상 처리', '프로젝트', 301, 310, 3),
    makeUnit('game-dev-u31', 31, '체크포인트와 스폰 시스템', '프로젝트', 311, 320, 3),
    makeUnit('game-dev-u32', 32, '타이머와 라운드 흐름', '프로젝트', 321, 330, 3),
    makeUnit('game-dev-u33', 33, '오비 장애물과 함정 제작', '프로젝트', 331, 340, 3),
    makeUnit('game-dev-u34', 34, '상호작용 오브젝트 만들기', '프로젝트', 341, 350, 3),
    makeUnit('game-dev-u35', 35, '인벤토리와 아이템 시스템', '프로젝트', 351, 360, 3),
    makeUnit('game-dev-u36', 36, '퀘스트와 NPC 체력 시스템', '프로젝트', 361, 370, 3),
];

const GAME_DEV_BOOK4_UNITS: Unit[] = [
    makeUnit('game-dev-u37', 37, '보스전 기본 흐름', '프로젝트', 371, 380, 3),
    makeUnit('game-dev-u38', 38, '보스 공격 패턴', '프로젝트', 381, 390, 3),
    makeUnit('game-dev-u39', 39, '보스전 연출과 제한 시간', '프로젝트', 391, 400, 3),
    makeUnit('game-dev-u40', 40, '보스전 심화 시스템', '프로젝트', 401, 410, 3),
    makeUnit('game-dev-u41', 41, '보스전 랭킹과 마무리', '프로젝트', 411, 420, 3),
];

export const GAME_DEV_CHAPTERS: Chapter[] = [
    {
        id: 'game-dev-book1',
        chapterNumber: 1,
        title: '1권 | Roblox Luau 게임 제작 기초',
        icon: 'sports_esports',
        description: 'Roblox Studio 화면, Script, print, 변수, 조건문, Part 속성, 이벤트, 점수·체력, 체크포인트까지 게임 제작의 첫 흐름을 학습합니다.',
        units: GAME_DEV_BOOK1_UNITS,
    },
    {
        id: 'game-dev-book2',
        chapterNumber: 2,
        title: '2권 | UI·코인·오비·상점 미니게임',
        icon: 'stadia_controller',
        description: 'ScreenGui와 버튼 UI, leaderstats 점수, 코인 수집, 오비 체크포인트, 제한 시간, 상점 아이템, 최종 미니게임 완성까지 이어지는 제작 교과서입니다.',
        units: GAME_DEV_BOOK2_UNITS,
    },
    {
        id: 'game-dev-book3',
        chapterNumber: 3,
        title: '3권 | 함수·모듈·저장·퀘스트 시스템',
        icon: 'extension',
        description: '함수, table, ModuleScript, Roblox 서비스, RemoteEvent, DataStore, UI 상태, 인벤토리, 퀘스트, NPC 체력 시스템까지 확장합니다.',
        units: GAME_DEV_BOOK3_UNITS,
    },
    {
        id: 'game-dev-book4',
        chapterNumber: 4,
        title: '4권 | 보스전 시스템 프로젝트',
        icon: 'sports_martial_arts',
        description: '보스 체력바, 공격 패턴, 라운드 시작과 종료, 승패 조건, 보상, 난이도 조절, 랭킹과 최종 점검까지 보스전 프로젝트로 마무리합니다.',
        units: GAME_DEV_BOOK4_UNITS,
    },
];
