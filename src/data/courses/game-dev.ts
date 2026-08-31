import type { Chapter, LearningActivity, LessonPackage, Page, TeacherGuide, Unit } from './types';

interface GameBlueprint {
    unitNumber: number;
    title: string;
    emoji: string;
    focus: string;
    mission: string;
    concept: string;
    build: string;
    code: string;
    deliverable: string;
    debugTip: string;
    studioRule: string;
}

interface StudioPage {
    title: string;
    phase: '미션' | '탐색' | '코딩' | '제작' | '도전' | '테스트' | '공유';
    time: string;
    idea: string;
    task: string;
    checkpoint: string;
    activity?: LearningActivity;
    guideSteps?: string[];
    expectedResult?: string;
    commonMistake?: string;
    assistant?: boolean;
}

interface BeginnerDetail {
    startFile: string;
    target: string;
    clickSteps: [string, string, string, string];
    expectedResult: string;
    commonMistake: string;
}

export const GAME_MAKER_CURRICULUM_VERSION = '2026.2-game-maker-ai';

export const GAME_MAKER_REFERENCE_LINKS = [
    { label: 'Roblox Creator Hub · Explore Studio UI', url: 'https://create.roblox.com/docs/tutorials/curriculums/studio/explore-ui' },
    { label: 'Roblox Creator Hub · Intro to coding and game design', url: 'https://create.roblox.com/docs/education/lesson-plans/intro-to-game-and-coding' },
    { label: 'Roblox Creator Hub · Core curriculum', url: 'https://create.roblox.com/docs/tutorials/curriculums/core' },
    { label: 'Roblox Creator Hub · AI Assistant', url: 'https://create.roblox.com/docs/tutorials/curriculums/building/code-with-assistant' },
    { label: 'Roblox Creator Hub · Assistant prompt guide', url: 'https://create.roblox.com/docs/assistant/prompt-engineering' },
] as const;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getStageLabel(unitNumber: number): string {
    if (unitNumber <= 6) return '1단계 · 3D 월드 디자이너';
    if (unitNumber <= 12) return '2단계 · Luau 게임 코더';
    if (unitNumber <= 18) return '3단계 · 게임 시스템 빌더';
    return '4단계 · 게임 디렉터';
}

const BEGINNER_DETAILS: Record<number, BeginnerDetail> = {
    1: { startFile: '새 Baseplate', target: 'Workspace와 StartBlock', clickSteps: ['Roblox Studio에 로그인하고 New Experience에서 Baseplate를 누릅니다.', '상단 Window 메뉴 또는 Home 도구막대에서 Explorer·Properties·Output을 켭니다.', 'Explorer의 Workspace 옆 ＋를 눌러 Part를 넣고 이름을 StartBlock으로 바꿉니다.', 'File 메뉴에서 Save to File을 눌러 01_FirstWorld.rbxl로 저장합니다.'], expectedResult: 'Explorer의 Workspace 아래에 StartBlock이 보이고, 컴퓨터에 01_FirstWorld.rbxl 파일이 저장됩니다.', commonMistake: '화면에서 블록을 잃어버리면 Explorer에서 StartBlock을 한 번 누른 뒤 F 키를 누릅니다.' },
    2: { startFile: '01_FirstWorld.rbxl', target: 'AxisX·AxisY·AxisZ', clickSteps: ['01_FirstWorld.rbxl을 열고 Explorer에서 StartBlock을 선택한 뒤 F 키를 누릅니다.', '마우스 오른쪽 버튼을 누른 채 움직이고, 휠과 W·A·S·D로 카메라를 연습합니다.', 'Home 또는 Model의 Part를 세 번 눌러 블록을 만들고 AxisX·AxisY·AxisZ로 이름을 바꿉니다.', 'Properties의 Position을 펼쳐 X·Y·Z 숫자를 한 축씩 바꾸고 위·앞·옆에서 확인합니다.'], expectedResult: '서로 다른 방향에 놓인 블록 세 개를 어느 시점에서도 다시 찾을 수 있습니다.', commonMistake: '블록이 움직이지 않고 카메라만 움직이면 먼저 블록을 클릭해 파란 선택 테두리가 보이는지 확인합니다.' },
    3: { startFile: '02_AxisTraining.rbxl', target: 'Step1~Step5', clickSteps: ['Part 하나를 만들고 Ctrl+D로 네 번 복제해 Step1부터 Step5까지 이름을 붙입니다.', 'Model 도구막대에서 Move를 누르고 각 블록을 옆으로 일정하게 옮깁니다.', 'Scale로 높이와 길이를 바꾸고 Rotate로 마지막 블록의 방향을 돌립니다.', '위·옆 시점에서 겹침을 확인한 뒤 모든 발판의 Anchored를 켭니다.'], expectedResult: '다섯 발판이 겹치지 않고 계단처럼 이어지며 Play 중에도 떨어지지 않습니다.', commonMistake: 'Scale 대신 Move 화살표를 잡았다면 Esc를 누르고 Model에서 Scale을 다시 선택합니다.' },
    4: { startFile: '03_BlockLab.rbxl', target: 'SafeBlock·FallingBlock·SecretDoor', clickSteps: ['Part 세 개를 만들고 SafeBlock·FallingBlock·SecretDoor로 이름을 바꿉니다.', 'Properties 검색창에 Material을 입력해 서로 다른 재질을 고릅니다.', 'Anchored와 CanCollide를 검색해 세 블록의 값을 수업표대로 다르게 설정합니다.', 'Play로 밟기·떨어지기·통과하기를 시험하고 Stop으로 돌아옵니다.'], expectedResult: '안전 블록은 고정되고, 떨어지는 블록은 중력으로 내려가며, 비밀문은 통과됩니다.', commonMistake: 'Play 중에는 편집하지 말고 먼저 Stop을 누른 뒤 Properties 값을 고칩니다.' },
    5: { startFile: '04_PhysicsRoom.rbxl', target: 'StartIsland·MiddleIsland·GoalIsland', clickSteps: ['Part를 크게 늘려 StartIsland를 만들고 두 번 복제합니다.', '복제한 블록을 MiddleIsland와 GoalIsland로 바꾸고 높이와 거리를 조절합니다.', 'Properties에서 GoalIsland의 Color·Material을 눈에 띄게 바꿉니다.', '세 블록을 선택해 Ctrl+G로 묶고 SkyIslands라는 Model 이름을 붙입니다.'], expectedResult: '시작·중간·목표 섬이 한눈에 구분되고 목표 방향을 설명 없이 찾을 수 있습니다.', commonMistake: '여러 블록이 함께 선택되지 않으면 Ctrl 키를 누른 채 Explorer에서 하나씩 선택합니다.' },
    6: { startFile: '05_SkyIslands.rbxl', target: 'FinishFlag와 FinishScript', clickSteps: ['시작부터 도착까지 다섯 구간을 연결하고 각 발판의 Anchored를 확인합니다.', '도착 지점에 Part를 놓고 FinishFlag로 이름을 바꿉니다.', 'Explorer에서 FinishFlag 옆 ＋를 눌러 Script를 넣고 예제 코드를 입력합니다.', 'Script 도구막대에서 Output을 열고 Play로 세 번 완주 테스트합니다.'], expectedResult: '캐릭터가 FinishFlag에 닿을 때마다 Output에 플레이어 이름과 완주 메시지가 한 번 표시됩니다.', commonMistake: 'Touched가 작동하지 않으면 Script가 FinishFlag 안에 있는지와 이름 철자를 먼저 확인합니다.' },
    7: { startFile: '새 Baseplate 또는 06_Obby.rbxl 복사본', target: 'SignalBlock의 Script', clickSteps: ['Window 또는 Script 도구막대에서 Output을 열고 화면 아래에 고정합니다.', 'Workspace에 SignalBlock을 만들고 옆 ＋로 Script를 추가합니다.', '기본 코드를 지운 뒤 print 세 줄을 직접 입력하고 철자를 확인합니다.', 'Play를 누른 뒤 Output의 1·2·3 메시지 순서를 읽고 Stop을 누릅니다.'], expectedResult: 'Output에 세 메시지가 위에서 아래 순서대로 한 번씩 표시됩니다.', commonMistake: 'Output이 비어 있으면 Script 왼쪽 아이콘이 회색인지, Disabled가 켜졌는지 확인합니다.' },
    8: { startFile: '07_SignalBlock.rbxl', target: 'GameSettings Script', clickSteps: ['ServerScriptService 옆 ＋를 눌러 Script를 만들고 GameSettings로 바꿉니다.', 'speed와 reward 변수를 한 줄씩 입력하고 Output으로 출력합니다.', '숫자를 하나만 바꾼 뒤 실행 전 결과를 기록지에 예상합니다.', 'Play 후 Output의 실제 값을 예상과 비교하고 파일을 새 이름으로 저장합니다.'], expectedResult: '변수 숫자를 바꿀 때 Output 결과도 같은 값으로 바뀝니다.', commonMistake: '숫자에 따옴표를 붙이면 글자가 되므로 계산할 숫자는 따옴표 없이 씁니다.' },
    9: { startFile: '08_GameSettings.rbxl', target: 'ScoreGate Script', clickSteps: ['Workspace에 Gate Part를 만들고 ScoreGate로 이름을 바꿉니다.', 'ScoreGate 안에 Script를 넣고 score와 need 변수를 만듭니다.', 'if·then·else·end를 줄 맞춰 입력하고 >= 비교 기호를 확인합니다.', 'score를 5와 12로 각각 바꾸어 통과·실패 메시지를 모두 테스트합니다.'], expectedResult: 'score가 need 이상일 때만 “문이 열렸어요”가 출력됩니다.', commonMistake: '빨간 밑줄이 보이면 then 또는 end가 빠졌는지, 대문자 철자가 같은지 확인합니다.' },
    10: { startFile: '09_ScoreGate.rbxl', target: 'ObstacleFactory Script', clickSteps: ['ServerScriptService에 Script를 만들고 ObstacleFactory로 이름을 바꿉니다.', 'for index = 1, 6 do와 end를 먼저 입력합니다.', '반복 안에서 Part를 만들고 Size·Position·Anchored·Parent를 차례로 정합니다.', '먼저 3개만 생성해 Play로 확인한 뒤 6개로 늘립니다.'], expectedResult: 'Play할 때 같은 간격의 고정 발판 여섯 개가 한 번만 생성됩니다.', commonMistake: '발판이 계속 생기면 Script가 반복해서 복제된 것은 아닌지 Explorer와 Output을 확인합니다.' },
    11: { startFile: '10_ObstacleFactory.rbxl', target: 'Goal과 Paint Script', clickSteps: ['Workspace에 Goal Part를 만들고 눈에 띄는 위치에 둡니다.', 'Goal 안에 Script를 넣고 paint 함수의 이름·매개변수·end부터 작성합니다.', '함수 아래에서 paint를 한 번 호출하고 Color3 값을 전달합니다.', '다른 색을 두 번 더 전달해 마지막 색이 무엇일지 예상하고 실행합니다.'], expectedResult: '함수를 호출할 때 전달한 마지막 색으로 Goal이 바뀝니다.', commonMistake: '함수를 만들기만 하고 호출하지 않으면 아무 변화가 없으므로 paint(...) 줄을 확인합니다.' },
    12: { startFile: '11_FunctionLab.rbxl', target: 'Coin과 Collect Script', clickSteps: ['작은 원기둥 Part를 만들고 Coin으로 이름을 바꾼 뒤 Anchored를 켭니다.', 'Coin 안에 Script를 넣고 Touched 이벤트를 연결합니다.', 'GetPlayerFromCharacter로 플레이어인지 확인한 뒤 Coin을 숨깁니다.', 'Play에서 한 번 수집하고 다시 닿아도 중복 실행되지 않는지 확인합니다.'], expectedResult: '플레이어가 Coin에 닿으면 Coin이 사라지고 같은 Coin은 한 번만 처리됩니다.', commonMistake: '코인이 닿기 전에 사라지면 Transparency 기본값과 Script 실행 시점을 확인합니다.' },
    13: { startFile: '12_CoinCollector.rbxl', target: 'ServerScriptService의 PlayerStats', clickSteps: ['ServerScriptService에 Script를 만들고 PlayerStats로 이름을 바꿉니다.', 'PlayerAdded 이벤트 안에 leaderstats Folder를 만들고 이름을 정확히 입력합니다.', 'leaderstats 안에 Coins IntValue를 만들고 시작값을 0으로 둡니다.', 'Play 후 플레이어 목록에 Coins가 표시되는지 확인합니다.'], expectedResult: '플레이어가 입장하면 이름 옆에 Coins 0이 표시됩니다.', commonMistake: '점수판이 안 보이면 leaderstats의 대소문자와 Parent가 player인지 확인합니다.' },
    14: { startFile: '13_Leaderboard.rbxl', target: 'DangerPart의 Damage Script', clickSteps: ['빨간 Part를 만들고 DangerPart로 이름을 바꾸며 위험 표지를 옆에 둡니다.', 'DangerPart 안에 Script를 넣고 Touched로 닿은 캐릭터를 받습니다.', 'FindFirstChildOfClass로 Humanoid를 찾고 TakeDamage(20)를 실행합니다.', 'Play에서 한 번만 닿아 체력 감소량과 재실행 속도를 확인합니다.'], expectedResult: '위험 블록에 닿으면 체력이 20 줄고, 떨어져 있으면 더 줄지 않습니다.', commonMistake: '체력이 순식간에 0이 되면 Touched가 여러 번 실행되므로 debounce 시간을 추가합니다.' },
    15: { startFile: '14_DangerZone.rbxl', target: 'Checkpoint1~Checkpoint3', clickSteps: ['Home의 Part 삽입 목록에서 SpawnLocation을 세 개 넣습니다.', '각각 Checkpoint1·Checkpoint2·Checkpoint3으로 이름을 바꾸고 순서대로 배치합니다.', '각 SpawnLocation 안에 Script를 넣어 RespawnLocation을 현재 체크포인트로 바꿉니다.', '각 지점에 닿은 뒤 일부러 떨어져 최근 위치에서 부활하는지 확인합니다.'], expectedResult: '마지막으로 닿은 체크포인트에서 캐릭터가 다시 시작합니다.', commonMistake: '항상 처음에서 부활하면 오브젝트가 SpawnLocation인지와 RespawnLocation 대입을 확인합니다.' },
    16: { startFile: '15_Checkpoints.rbxl', target: 'RoundManager Script', clickSteps: ['ServerScriptService에 RoundManager Script를 만듭니다.', '준비 상태와 플레이 상태를 주석으로 먼저 나눕니다.', '10부터 0까지 줄어드는 for 반복문과 task.wait(1)을 입력합니다.', '테스트에서는 시간을 3초로 줄여 흐름을 확인한 뒤 10초로 되돌립니다.'], expectedResult: 'Output에 준비 숫자가 1초 간격으로 줄고 ROUND START가 한 번 표시됩니다.', commonMistake: '숫자가 한꺼번에 나오면 task.wait(1)이 반복문 안쪽에 있는지 확인합니다.' },
    17: { startFile: '16_RoundGame.rbxl', target: 'StarterGui의 GameHUD', clickSteps: ['StarterGui 옆 ＋에서 ScreenGui를 만들고 GameHUD로 이름을 바꿉니다.', 'GameHUD 안에 TextLabel을 넣고 ObjectiveLabel로 이름을 바꿉니다.', 'Properties에서 Text·Size·Position·TextScaled·BackgroundColor를 조정합니다.', 'Play 화면 크기를 바꾸어 글자가 잘리거나 화면 밖으로 나가지 않는지 확인합니다.'], expectedResult: '화면 위쪽에 목표 문장이 크게 보이고 창 크기를 바꿔도 읽을 수 있습니다.', commonMistake: 'UI가 안 보이면 ScreenGui의 Enabled와 TextLabel의 Visible·Size를 확인합니다.' },
    18: { startFile: '17_GameHUD.rbxl', target: 'ShopGui와 BuyButton', clickSteps: ['StarterGui에 ShopGui를 만들고 Frame·TextLabel·TextButton을 차례로 넣습니다.', '버튼 이름을 BuyButton으로 바꾸고 가격과 효과를 화면에 씁니다.', '서버 Script에서 Coins가 가격 이상인지 다시 확인한 뒤 한 번만 차감합니다.', 'Coins가 부족할 때와 충분할 때를 각각 테스트합니다.'], expectedResult: '가격이 보이고 조건을 만족할 때만 게임 점수가 차감되며 효과가 적용됩니다.', commonMistake: 'LocalScript 화면만 믿지 말고 실제 점수 차감은 서버에서 다시 검증해야 합니다.' },
    19: { startFile: '18_SystemGame.rbxl의 복사본', target: 'GamePlan과 필수 기능 3개', clickSteps: ['기존 파일을 다른 이름으로 저장해 원본을 보존합니다.', '기록지에 플레이어·목표·반복 행동·반응·보상·실패 조건을 한 문장씩 씁니다.', '반드시 필요한 기능 세 개와 나중에 할 기능을 나눕니다.', 'Workspace에 Start·Challenge·Goal 표시 블록만 먼저 배치합니다.'], expectedResult: '한 문장 게임 루프와 필수 기능 세 개, 시작·도전·목표 위치가 정해집니다.', commonMistake: '아이디어가 커지면 맵·상점·NPC를 모두 넣지 말고 120분 안에 검증할 핵심 세 개만 남깁니다.' },
    20: { startFile: '19_MyGamePlan.rbxl', target: 'Greybox Model', clickSteps: ['File에서 Save to File로 20_Greybox_v1.rbxl 복사본을 만듭니다.', '회색 Part만 사용해 시작·도전·휴식·목표 공간을 만듭니다.', '색·장식·무료 모델은 넣지 않고 이동 거리와 시야만 조절합니다.', '타이머로 3분 플레이 후 막힌 위치를 기록하고 블록을 옮깁니다.'], expectedResult: '장식 없이도 처음부터 목표까지 길을 찾고 3분 안에 플레이할 수 있습니다.', commonMistake: '꾸미기에 시간이 쓰이면 Material을 SmoothPlastic과 회색으로 고정하고 이동 동선부터 끝냅니다.' },
    21: { startFile: '20_Greybox_v1.rbxl', target: 'CoreLoop Model과 관련 Scripts', clickSteps: ['Explorer에 CoreLoop Folder를 만들고 핵심 오브젝트와 Script를 모읍니다.', '행동 하나를 고르고 즉시 보이는 반응과 점수 보상을 연결합니다.', '보상을 받은 뒤 다음 목표가 화면이나 공간에 나타나게 합니다.', '같은 행동을 세 번 반복해 점수와 오브젝트 상태가 꼬이지 않는지 확인합니다.'], expectedResult: '행동→반응→보상→다음 목표가 세 번 연속 끊기지 않고 작동합니다.', commonMistake: '기능을 한꺼번에 연결하지 말고 행동·반응·보상 순서로 하나씩 Play 테스트합니다.' },
    22: { startFile: '21_CoreLoop.rbxl', target: 'ThemeGuide와 EasyPath·HardPath', clickSteps: ['기록지에 주색·보조색·재질·빛·소리 규칙을 정합니다.', '쉬운 길과 도전 길을 블록 크기와 거리로 구분합니다.', 'Lighting과 Part Material을 같은 테마 규칙으로 조정합니다.', '두 길을 모두 플레이해 어려운 길의 추가 보상이 알맞은지 비교합니다.'], expectedResult: '테마가 통일되고 플레이어가 쉬운 길과 도전 길을 선택할 수 있습니다.', commonMistake: '색이 많아 목표가 묻히면 주색 두 개와 강조색 한 개만 남깁니다.' },
    23: { startFile: '22_BetaGame.rbxl', target: 'TestChecklist와 Output', clickSteps: ['TestChecklist에 시작·목표·실패·보상·UI 항목을 적습니다.', '친구 세 명에게 설명 없이 같은 시작 지점에서 플레이하도록 합니다.', '걸린 시간·멈춘 위치·오류 메시지를 기록하고 영향이 큰 두 문제를 고칩니다.', '수정 후 같은 방법으로 다시 테스트해 전후 결과를 비교합니다.'], expectedResult: '세 명의 관찰 기록과 수정 전후가 남고 영향이 큰 문제 두 개가 해결됩니다.', commonMistake: '친구에게 조작법을 계속 알려 주면 문제가 숨으므로 질문은 기록하고 테스트 후 설명합니다.' },
    24: { startFile: '23_FinalCandidate.rbxl', target: '최종 게임과 포트폴리오', clickSteps: ['File에서 최종 파일과 날짜가 붙은 백업 파일을 각각 저장합니다.', '새 Play 세션에서 시작·성공·실패·재시작을 처음부터 끝까지 확인합니다.', '게임 목표·조작법·핵심 코드·발견한 버그·수정 전후 화면을 포트폴리오에 정리합니다.', '공개 게시 전에 선생님과 개인정보·외부 에셋·도움받은 코드를 확인합니다.'], expectedResult: '작동하는 최종 파일, 복구 가능한 백업, 제작 과정을 설명하는 포트폴리오가 준비됩니다.', commonMistake: '마지막 날 새 기능을 추가하지 말고 알려진 문제와 발표 순서를 먼저 점검합니다.' },
};

function getBeginnerDetail(unit: GameBlueprint): BeginnerDetail {
    return BEGINNER_DETAILS[unit.unitNumber];
}

function getMaterials(unit: GameBlueprint): string[] {
    const common = ['컴퓨터', 'Roblox Studio', '마우스', '게임 제작 기록지'];
    if (unit.unitNumber <= 6) return [...common, '교사용 시작 월드 파일'];
    if (unit.unitNumber <= 12) return [...common, 'Luau 코드 카드'];
    if (unit.unitNumber <= 18) return [...common, '시스템 테스트 체크리스트'];
    return [...common, '게임 기획서', '플레이테스트 기록표'];
}

function createActivity(unit: GameBlueprint, kind: 'predict' | 'build' | 'debug' | 'reflect'): LearningActivity {
    if (kind === 'predict') return {
        label: '빌드 예상',
        prompt: `${unit.focus} 기능을 실행하면 플레이어 화면에서 무엇이 달라질지 예상해 보세요.`,
        placeholder: '내 예상: ___ / 그렇게 생각한 이유: ___',
        example: unit.concept,
        minLength: 5,
    };
    if (kind === 'build') return {
        label: '제작 로그',
        prompt: `오늘 만든 ${unit.deliverable}에서 내가 바꾼 속성이나 코드 한 가지를 기록하세요.`,
        placeholder: '바꾼 것: ___ / 바꾼 이유: ___ / 달라진 결과: ___',
        example: unit.build,
        minLength: 5,
    };
    if (kind === 'debug') return {
        label: '디버그 리포트',
        prompt: '테스트에서 발견한 문제와 고친 방법을 원인까지 생각해 기록하세요.',
        placeholder: '문제: ___ / 원인: ___ / 고친 방법: ___ / 다시 테스트한 결과: ___',
        example: unit.debugTip,
        minLength: 5,
    };
    return {
        label: '게임 디렉터 노트',
        prompt: '친구의 플레이테스트 의견과 다음 버전에서 개선할 점을 적어 보세요.',
        placeholder: '친구 의견: ___ / 내가 고친 점: ___ / 다음 개선: ___',
        example: '플레이어가 목표를 바로 이해할 수 있도록 시작 안내판을 더 크게 만들었어요.',
        minLength: 5,
    };
}

function getAssistantLevel(unitNumber: number): string {
    if (unitNumber <= 3) return 'AI 1단계 · 질문하고 위치 찾기';
    if (unitNumber <= 6) return 'AI 2단계 · 선택한 오브젝트 설명받기';
    if (unitNumber <= 12) return 'AI 3단계 · 코드 설명·오류 힌트 받기';
    if (unitNumber <= 18) return 'AI 4단계 · 반복 작업·기본 코드 함께 만들기';
    return 'AI 5단계 · 제작 보조·검토·플레이테스트 아이디어';
}

function getAssistantAllowed(unit: GameBlueprint): string {
    if (unit.unitNumber <= 3) return 'Studio 창과 선택한 오브젝트의 역할을 질문하고, 다음 클릭 위치를 한 단계씩 설명받습니다.';
    if (unit.unitNumber <= 6) return '정확히 선택한 Part의 속성 의미를 묻고, 작은 변화 한 가지를 제안받습니다.';
    if (unit.unitNumber <= 12) return '내가 먼저 입력한 짧은 Luau 코드의 줄별 설명, 오류 원인 후보, 수정 힌트를 받습니다.';
    if (unit.unitNumber <= 18) return 'Folder·Part·GUI 같은 반복 생성과 이벤트 기본 틀을 요청하고 서버·클라이언트 위치를 확인합니다.';
    return '작업 목록 정리, 반복 편집, 코드 검토, 테스트 시나리오와 개선 후보를 제안받습니다.';
}

function getAssistantStudentWork(unit: GameBlueprint): string {
    if (unit.unitNumber <= 6) return '오브젝트 배치, 색·거리·난이도 결정, Play 테스트는 학생이 직접 합니다.';
    if (unit.unitNumber <= 12) return '코드의 대상·조건·결과를 먼저 예상하고, 바뀐 줄을 표시하고, Output을 읽는 일은 학생 몫입니다.';
    if (unit.unitNumber <= 18) return '게임 규칙·보상·공정성·서버 검증을 결정하고 정상·실패 테스트를 모두 학생이 수행합니다.';
    return '게임 아이디어, 재미의 이유, 최종 선택, 친구 관찰, 공개 여부와 포트폴리오는 학생이 책임집니다.';
}

function createAssistantPrompt(unit: GameBlueprint): string {
    const detail = getBeginnerDetail(unit);
    return `지금 ${detail.startFile}에서 ${detail.target}을(를) 선택했습니다. 목표는 “${unit.deliverable}”입니다. ${unit.build} 먼저 바꿀 대상과 이유를 3단계로 설명해 주세요. Script가 필요하면 넣을 정확한 위치를 말하고, 짧은 Luau 코드 뒤에 각 줄의 뜻도 설명해 주세요. 아직 실행하거나 Accept하지 말고 제가 확인할 체크리스트를 먼저 주세요.`;
}

function createStudioPages(unit: GameBlueprint): StudioPage[] {
    const detail = getBeginnerDetail(unit);
    return [
        {
            title: `오늘의 게임 미션 · ${unit.title}`, phase: '미션', time: '10분', idea: unit.mission,
            task: `시작 파일은 ‘${detail.startFile}’입니다. 먼저 파일을 찾고, 완성 목표 ‘${unit.deliverable}’에서 플레이어가 무엇을 하고 언제 성공하는지 말하세요.`,
            checkpoint: '시작 파일·플레이어 행동·성공 조건을 자신의 말로 설명한다.', expectedResult: detail.expectedResult,
        },
        {
            title: `화면 길잡이 · 어디를 눌러야 할까요?`, phase: '탐색', time: '10분', idea: unit.concept,
            task: `오늘 다룰 대상은 ‘${detail.target}’입니다. 선생님의 화면과 내 화면에서 같은 이름을 찾아 선택 테두리가 보이는지 확인하세요.`,
            checkpoint: 'Explorer에서 정확한 대상을 선택하고 Properties 또는 Script 위치를 찾는다.',
            activity: createActivity(unit, 'predict'),
            guideSteps: detail.clickSteps.slice(0, 2), expectedResult: detail.expectedResult, commonMistake: detail.commonMistake,
        },
        {
            title: '따라 만들기 ① · 선생님과 같은 화면 만들기', phase: '제작', time: '15분', idea: '한 단계가 끝날 때마다 선생님 화면과 이름·위치·값을 비교하면 길을 잃지 않습니다.',
            task: `1~2단계를 천천히 실행하세요. 각 단계가 끝나면 ‘완료’라고 말하고 ${detail.target}이(가) Explorer에 보이는지 확인하세요.`,
            checkpoint: '첫 두 단계를 순서대로 실행하고 오브젝트 이름과 위치를 확인한다.',
            guideSteps: detail.clickSteps.slice(0, 2), expectedResult: detail.expectedResult, commonMistake: detail.commonMistake,
        },
        {
            title: '따라 만들기 ② · 직접 완성하고 바로 실행하기', phase: '제작', time: '15분',
            idea: '작은 기능 하나를 만든 뒤 바로 실행하면 어느 단계에서 문제가 생겼는지 찾기 쉽습니다.',
            task: `3~4단계를 실행한 뒤 ${unit.build} Play 버튼으로 예상 결과와 같은지 확인하세요.`,
            checkpoint: '나머지 두 단계를 실행하고 예상 결과를 Play 또는 Output에서 확인한다.',
            guideSteps: detail.clickSteps.slice(2, 4), expectedResult: detail.expectedResult, commonMistake: detail.commonMistake,
        },
        {
            title: '코드 돋보기 · AI보다 먼저 읽고 예상하기', phase: '코딩', time: '15분',
            idea: '코드를 그대로 복사하는 것보다 어떤 값이 결과를 바꾸는지 예상하고 한 곳씩 수정하는 것이 중요합니다.',
            task: '예제 코드에서 ① 바뀌는 대상 ② 실행 조건 ③ 보이는 결과를 색으로 표시하세요. 그다음 이름이나 숫자 한 곳을 내 게임에 맞게 바꾸고 결과를 예상합니다.',
            checkpoint: 'AI를 열기 전에 코드의 대상·조건·결과와 바꾼 한 줄을 설명한다.',
            activity: createActivity(unit, 'build'),
        },
        {
            title: `AI Assistant 실험실 · ${getAssistantLevel(unit.unitNumber)}`, phase: '코딩', time: '10분',
            idea: 'AI의 답은 매번 달라질 수 있으므로 Accept 전에 무엇을 바꾸는지 읽고, Play와 Output으로 반드시 검증해야 합니다.',
            task: 'Studio 오른쪽 위 Assistant를 열고 제공된 프롬프트를 입력하세요. 답을 바로 적용하지 말고 대상·위치·코드·테스트 방법을 먼저 표시합니다.',
            checkpoint: '구체적인 프롬프트를 사용하고 AI 제안을 설명·검토·실행·수정의 네 단계로 확인한다.',
            assistant: true, expectedResult: detail.expectedResult, commonMistake: 'AI 결과가 예상과 다르면 Accept하지 말고 이름·수치·실행 시점을 더 구체적으로 적어 다시 요청합니다.',
        },
        {
            title: '나만의 도전 · AI가 정하지 않은 규칙 만들기', phase: '도전', time: '15분',
            idea: '같은 기능도 속도·크기·시간·보상·배치 규칙을 바꾸면 다른 게임 경험이 됩니다.',
            task: '난이도, 보상 또는 화면 표현 중 한 가지를 직접 골라 바꾸세요. AI가 제안한 것과 내가 선택한 것을 구분해 기록하고 전후를 비교합니다.',
            checkpoint: '기본 예제와 다른 나만의 선택이 한 가지 이상 들어 있다.',
        },
        {
            title: '버그 헌터 · 예상과 실제 비교', phase: '테스트', time: '10분', idea: unit.debugTip,
            task: '정상 플레이와 일부러 실패하는 플레이를 각각 실행해 첫 번째로 예상과 달라지는 지점을 찾으세요.',
            checkpoint: '문제의 위치와 원인을 구분하고 한 번 이상 수정한다.', commonMistake: detail.commonMistake,
            activity: createActivity(unit, 'debug'),
        },
        {
            title: '친구 플레이테스트 · 설명 없이 관찰하기', phase: '테스트', time: '10분',
            idea: '좋은 테스트는 방법을 대신 알려 주지 않고 친구가 어디서 멈추고 무엇을 오해하는지 관찰합니다.',
            task: '친구가 3분 동안 플레이하게 하고 성공한 점, 멈춘 지점, 가장 먼저 고칠 점을 기록하세요.',
            checkpoint: '친구의 말과 실제 행동을 구분해 피드백을 남긴다.',
        },
        {
            title: '게임 쇼케이스 · 저장하고 설명하기', phase: '공유', time: '10분',
            idea: '완성 화면뿐 아니라 목표, 핵심 코드, 발견한 버그와 수정 과정을 설명해야 제작 실력이 보입니다.',
            task: `‘${unit.deliverable}’을 저장하고 목표·핵심 기능·내가 바꾼 점·다음 개선을 1분 안에 시연하세요.`,
            checkpoint: '작동하는 결과물과 제작 근거를 함께 발표한다.',
            activity: createActivity(unit, 'reflect'),
        },
    ];
}

function createLessonPackage(unit: GameBlueprint): LessonPackage {
    return {
        materials: getMaterials(unit),
        deliverable: unit.deliverable,
        completionCriteria: [
            `${unit.focus}의 역할을 자신의 말로 설명한다.`,
            `${unit.deliverable}을 완성하고 나만의 규칙을 한 가지 이상 적용한다.`,
            '테스트에서 발견한 문제를 한 번 이상 수정하고 제작 기록을 남긴다.',
        ],
        parentReport: `${unit.focus}의 원리를 Roblox Studio에서 직접 구현해 ‘${unit.deliverable}’을 제작했습니다. 예제 코드를 자신의 게임에 맞게 수정하고 친구 플레이테스트 결과를 반영했습니다.`,
    };
}

function createTeacherGuide(unit: GameBlueprint, page: StudioPage): TeacherGuide {
    const detail = getBeginnerDetail(unit);
    return {
        objective: page.idea,
        say: `“오늘은 게임을 하는 사람이 아니라 게임의 규칙을 설계하고 테스트하는 개발자입니다. 선생님 화면과 다르면 멈추고 Explorer에서 ‘${detail.target}’부터 다시 찾으면 됩니다.” ${page.idea}`,
        questions: [
            '플레이어가 한 행동과 게임이 보여 준 반응은 각각 무엇인가요?',
            page.assistant ? 'AI가 바꾸려는 대상·위치·결과를 학생이 설명할 수 있나요?' : '숫자나 조건 한 가지를 바꾸면 게임 경험이 어떻게 달라질까요?',
        ],
        expectedAnswer: page.checkpoint,
        coaching: `정답 코드를 바로 주지 말고 ① Play를 Stop했는지 ② Explorer 이름 ③ Script 위치 ④ Output의 첫 오류 순서로 확인하게 하세요. 자주 막히는 지점: ${page.commonMistake ?? detail.commonMistake}`,
        extension: `빠른 학생은 ${unit.focus}에 난이도 선택이나 두 번째 규칙을 추가하고 플레이 경험의 차이를 설명합니다.`,
        assessment: [page.task, page.checkpoint, page.expectedResult ?? detail.expectedResult, unit.studioRule],
    };
}

function createPage(unit: GameBlueprint, page: StudioPage, pageIndex: number): Page {
    const pageNumber = pageIndex + 1;
    const detail = getBeginnerDetail(unit);
    const lessonPackage = createLessonPackage(unit);
    const guide = page.guideSteps?.length ? `
        <section class="game-studio-beginner-guide" aria-label="초보자 따라하기">
            <header><span>🖱️ 처음이어도 괜찮아요</span><b>한 칸씩 따라가기</b></header>
            <ol>${page.guideSteps.map((step) => `<li><span>${escapeHtml(step)}</span><em>완료 □</em></li>`).join('')}</ol>
            <div><p><b>이렇게 보이면 성공</b>${escapeHtml(page.expectedResult ?? detail.expectedResult)}</p><p><b>막혔을 때</b>${escapeHtml(page.commonMistake ?? detail.commonMistake)}</p></div>
        </section>
    ` : '';
    const assistant = page.assistant ? `
        <section class="game-studio-ai-card" aria-label="Roblox Studio AI Assistant 활용">
            <header><span>✦ ROBLOX STUDIO ASSISTANT</span><b>${escapeHtml(getAssistantLevel(unit.unitNumber))}</b></header>
            <div class="game-studio-ai-scope"><article><b>AI에게 부탁해도 되는 일</b><p>${escapeHtml(getAssistantAllowed(unit))}</p></article><article><b>학생이 직접 해야 하는 일</b><p>${escapeHtml(getAssistantStudentWork(unit))}</p></article></div>
            <div class="game-studio-ai-prompt"><b>복사해서 내 프로젝트에 맞게 고칠 프롬프트</b><p>${escapeHtml(createAssistantPrompt(unit))}</p></div>
            <ol><li>AI가 바꿀 정확한 오브젝트와 Script 위치를 확인합니다.</li><li>코드의 대상·조건·결과를 내 말로 설명합니다.</li><li>Accept 전 현재 파일을 저장하고, 필요하면 Ctrl+Z로 되돌립니다.</li><li>Play와 Output으로 정상·실패 상황을 모두 시험합니다.</li></ol>
            <small>공식 Roblox Creator Hub의 Assistant 사용법·프롬프트 가이드 기준 · AI 출력은 매번 달라질 수 있으며 반드시 직접 검증합니다.</small>
        </section>
    ` : '';
    const schedule = pageNumber === 1 ? `
        <div class="game-studio-timeline" aria-label="120분 수업 순서">
            <strong>오늘의 120분</strong><span>미션·탐색 20분</span><i>→</i><span>코딩·제작 70분</span><i>→</i><span>테스트 20분</span><i>→</i><span>기록·공유 10분</span>
        </div>
        <div class="game-studio-kit">
            <article><b>준비물</b><p>${getMaterials(unit).map(escapeHtml).join(' · ')}</p></article>
            <article><b>오늘의 빌드</b><p>${escapeHtml(unit.deliverable)}</p></article>
            <article><b>스튜디오 규칙</b><p>${escapeHtml(unit.studioRule)}</p></article>
        </div>
    ` : '';
    const finish = pageNumber === 10 ? `
        <div class="game-studio-finish">
            <strong>게임 출고 전 체크리스트</strong>
            <ol>${lessonPackage.completionCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
            <p><b>학부모 리포트</b>${escapeHtml(lessonPackage.parentReport)}</p>
        </div>
    ` : '';

    return {
        id: `game-maker-v1-${String((unit.unitNumber - 1) * 10 + pageNumber).padStart(3, '0')}`,
        title: page.title,
        type: '페이지',
        content: `
            <section class="game-studio-slide" data-curriculum="${GAME_MAKER_CURRICULUM_VERSION}">
                <header class="game-studio-toolbar">
                    <div class="game-studio-brand"><span>CS</span><div><small>CODING SSOK</small><b>GAME STUDIO</b></div></div>
                    <nav aria-label="게임 제작 도구"><span>MODEL</span><span>SCRIPT</span><span>UI</span><strong>▶ PLAY</strong></nav>
                </header>
                <div class="game-studio-meta"><span>${getStageLabel(unit.unitNumber)}</span><b>${page.phase} · ${page.time}</b></div>
                <div class="game-studio-editor">
                    <section class="game-studio-scene">
                        <div class="game-studio-scene-copy"><small>${escapeHtml(unit.emoji)} ${escapeHtml(unit.focus)} · ${pageNumber}/10</small><h2>${escapeHtml(page.title)}</h2><p>${escapeHtml(page.idea)}</p></div>
                        <span class="game-studio-axis">X&nbsp; Y&nbsp; Z</span>
                    </section>
                    <aside class="game-studio-explorer">
                        <header>EXPLORER <span>＋</span></header>
                        <p>⌄ ◫ Workspace</p><p>&nbsp;&nbsp;◇ ${escapeHtml(unit.deliverable)}</p><p>&nbsp;&nbsp;▤ MainScript</p><p>› ▣ StarterGui</p><p>› ⚙ ServerScript</p>
                        <header>PROPERTIES</header><dl><div><dt>Goal</dt><dd>${escapeHtml(unit.focus)}</dd></div><div><dt>Status</dt><dd>BUILDING</dd></div></dl>
                    </aside>
                </div>
                <div class="game-studio-workbench">
                    <article><span>BUILD TASK</span><h3>직접 만들기</h3><p>${escapeHtml(page.task)}</p></article>
                    <article><span>CHECKPOINT</span><h3>완료 기준</h3><p>${escapeHtml(page.checkpoint)}</p></article>
                </div>
                ${guide}${assistant}
                <div class="game-studio-script"><div><span>●</span> MainScript <b>Luau</b></div><pre><code>${escapeHtml(unit.code)}</code></pre></div>
                <aside class="game-studio-rule"><b>STUDIO RULE</b><p>${escapeHtml(unit.studioRule)}</p></aside>
                ${schedule}${finish}
            </section>
        `,
        activity: page.activity,
        teacherGuide: createTeacherGuide(unit, page),
    };
}

function createUnit(unit: GameBlueprint): Unit {
    return {
        id: `game-maker-v1-u${String(unit.unitNumber).padStart(2, '0')}`,
        unitNumber: unit.unitNumber,
        title: unit.title,
        subtitle: `${unit.focus} · 미션·탐색 20분 · 코딩·제작 70분 · 테스트 20분 · 기록·공유 10분`,
        duration: '120분',
        type: '프로젝트',
        difficulty: unit.unitNumber <= 6 ? 1 : unit.unitNumber <= 18 ? 2 : 3,
        pages: createStudioPages(unit).map((page, index) => createPage(unit, page, index)),
        problemCount: 0,
        lessonPackage: createLessonPackage(unit),
    };
}

const GAME_BLUEPRINTS: GameBlueprint[] = [
    { unitNumber: 1, title: '게임 스튜디오 첫 입장', emoji: '🧭', focus: 'Studio 화면과 프로젝트 저장', mission: 'Viewport, Explorer, Properties, Toolbox를 찾아 역할을 구분하고 안전한 첫 프로젝트를 저장합니다.', concept: 'Viewport는 게임 세계를 만드는 곳이고 Explorer는 오브젝트 구조, Properties는 선택한 오브젝트 값을 보여 줍니다.', build: 'Baseplate 프로젝트에 StartBlock을 배치하고 이름을 바꾼 뒤 내 프로젝트로 저장합니다.', code: '-- Output에서 첫 실행을 확인해요\nprint("Game Maker ready!")', deliverable: '이름과 시작 블록이 있는 첫 게임 월드', debugTip: '오브젝트가 보이지 않으면 Explorer에서 선택하고 F 키로 화면 중심에 맞춥니다.', studioRule: '무료 모델은 선생님이 확인한 것만 사용하고 낯선 Script가 들어 있는 모델은 넣지 않습니다.' },
    { unitNumber: 2, title: '카메라 탐험 훈련', emoji: '🎥', focus: '3D 카메라와 좌표 감각', mission: '이동·회전·확대로 월드를 관찰하고 X·Y·Z 축의 의미를 익힙니다.', concept: '3D 공간의 X는 좌우, Y는 높이, Z는 앞뒤 위치를 나타냅니다.', build: '세 가지 색 블록을 X·Y·Z 방향으로 배치하고 위·앞·옆 시점에서 확인합니다.', code: 'local block = workspace.BlueBlock\nprint(block.Position)', deliverable: 'X·Y·Z 방향 훈련장', debugTip: '카메라가 길을 잃으면 Explorer에서 오브젝트를 선택하고 F 키로 다시 찾습니다.', studioRule: '화면이 어지러우면 즉시 조작을 멈추고 카메라 이동 속도를 낮춥니다.' },
    { unitNumber: 3, title: '블록 변신 연구소', emoji: '🧊', focus: 'Move·Scale·Rotate 변형', mission: 'Part의 위치·크기·회전을 바꾸어 같은 블록으로 계단과 다리를 설계합니다.', concept: 'Move는 위치, Scale은 크기, Rotate는 방향을 바꿉니다.', build: '크기가 다른 Part를 정렬해 다섯 칸 계단과 회전한 입구를 만듭니다.', code: 'local part = workspace.Step1\npart.Size = Vector3.new(6, 1, 3)', deliverable: '정렬된 계단과 입구가 있는 연습 맵', debugTip: '블록이 겹치면 Move 단위를 작게 바꾸고 위·옆 시점에서 간격을 확인합니다.', studioRule: '친구의 월드에서 오브젝트를 이동하거나 삭제하기 전에는 허락을 받습니다.' },
    { unitNumber: 4, title: '재질과 물리 실험실', emoji: '🧱', focus: 'Material·Anchored·Collision', mission: '색과 재질을 꾸미고 물리 속성을 실험해 안전하게 밟을 수 있는 길을 만듭니다.', concept: 'Anchored가 꺼진 Part는 중력의 영향을 받고 CanCollide가 꺼지면 통과할 수 있습니다.', build: '안전 블록, 떨어지는 블록, 통과하는 비밀문을 각각 만듭니다.', code: 'local bridge = workspace.Bridge\nbridge.Anchored = true\nbridge.CanCollide = true', deliverable: '세 가지 물리 성질 테스트 룸', debugTip: '게임 시작과 함께 블록이 떨어지면 Anchored 값을 먼저 확인합니다.', studioRule: '번쩍이는 효과와 큰 소리를 피하고 위험 요소를 미리 표시합니다.' },
    { unitNumber: 5, title: '하늘섬 월드 디자인', emoji: '🏝️', focus: '월드 구성과 시각적 안내', mission: '시작부터 목표까지 길을 잃지 않도록 색·모양·높이로 하늘섬을 설계합니다.', concept: '좋은 레벨은 설명을 읽지 않아도 목표 방향과 안전한 길을 알아볼 수 있어야 합니다.', build: '시작섬, 중간섬, 목표섬을 만들고 색과 랜드마크로 방향을 안내합니다.', code: 'local goal = workspace.Goal\ngoal.Color = Color3.fromRGB(255, 170, 0)', deliverable: '시작과 목표가 분명한 하늘섬 월드', debugTip: '길을 잃는다면 목표의 크기·색·높이 차이가 충분한지 확인합니다.', studioRule: '다른 게임의 맵을 복제하지 않고 아이디어를 내 방식으로 다시 설계합니다.' },
    { unitNumber: 6, title: '첫 오비게임 완성', emoji: '🚩', focus: '장애물 흐름과 완주 조건', mission: 'Part와 물리 속성을 연결해 시작·도전·도착이 있는 첫 오비게임을 완성합니다.', concept: '쉬운 장애물로 조작을 익힌 뒤 점차 어려워지고 도착 지점에서 성공을 알려야 합니다.', build: '점프 블록, 위험 구간, 도착 깃발을 순서대로 연결합니다.', code: 'local finish = script.Parent\nfinish.Touched:Connect(function(hit)\n    local player = game.Players:GetPlayerFromCharacter(hit.Parent)\n    if player then print(player.Name .. " 완주!") end\nend)', deliverable: '5구간 하늘섬 오비게임', debugTip: '세 번 연속 완주 가능한지 확인하며 점프 거리와 블록 크기를 하나씩 조절합니다.', studioRule: '친구의 실패를 놀리지 않고 어느 구간이 어려웠는지 개선 의견으로 말합니다.' },
    { unitNumber: 7, title: 'Script와 Output 신호', emoji: '📟', focus: 'Script 위치와 실행 확인', mission: 'Script를 올바른 위치에 만들고 print 결과를 Output에서 확인합니다.', concept: '코드가 보인다고 실행되는 것은 아니며 Script 위치, Play 상태, Output을 함께 확인해야 합니다.', build: 'Part 안에 Script를 넣고 시작·중간·끝 메시지를 출력합니다.', code: 'print("1. 게임 시작")\nprint("2. 기능 준비")\nprint("3. 테스트 완료")', deliverable: '실행 순서를 보여 주는 신호 블록', debugTip: 'Output이 비어 있으면 Script 활성화와 위치를 확인합니다.', studioRule: '인터넷 코드의 뜻과 작동 범위를 확인한 뒤 교사와 함께 사용합니다.' },
    { unitNumber: 8, title: '변수로 게임 값 저장', emoji: '📦', focus: '변수와 값 변경', mission: '속도·점수·보상처럼 바뀌는 게임 값을 변수에 저장합니다.', concept: '변수는 값에 이름표를 붙인 상자이며 이름을 잘 정하면 코드를 읽기 쉽습니다.', build: 'speed와 reward 변수 값을 바꾸어 난이도와 보상을 비교합니다.', code: 'local speed = 16\nlocal reward = 10\nprint("속도:", speed, "보상:", reward)', deliverable: '값으로 조절하는 게임 설정판', debugTip: '문자와 숫자 오류가 나면 쉼표로 출력하거나 값의 형태를 맞춥니다.', studioRule: '변수 이름에 친구 실명이나 개인정보를 사용하지 않습니다.' },
    { unitNumber: 9, title: '조건문 판정 게이트', emoji: '🚪', focus: 'if 조건과 비교 판단', mission: '점수에 따라 문이 열리거나 안내가 달라지는 판정 게이트를 만듭니다.', concept: '조건문은 조건이 참일 때와 거짓일 때 실행할 행동을 나눕니다.', build: '필요 점수와 현재 점수를 비교해 통과 또는 도전 안내를 보여 줍니다.', code: 'local score = 12\nlocal need = 10\nif score >= need then\n    print("문이 열렸어요!")\nelse\n    print("점수가 더 필요해요.")\nend', deliverable: '점수로 열리는 판정 게이트', debugTip: '조건이 반대로 작동하면 비교 기호와 두 변수 값을 확인합니다.', studioRule: '실패 이유와 다시 시도할 방법을 화면에 분명히 알려 줍니다.' },
    { unitNumber: 10, title: '반복 장애물 공장', emoji: '🔁', focus: '반복문과 규칙적인 배치', mission: '반복문으로 비슷한 블록을 만들고 횟수와 간격으로 패턴을 조절합니다.', concept: '반복문은 같은 명령을 정한 횟수만큼 실행합니다.', build: 'for 반복문으로 여섯 발판을 만들고 높이 패턴을 추가합니다.', code: 'for index = 1, 6 do\n    local step = Instance.new("Part")\n    step.Position = Vector3.new(index * 5, 3, 0)\n    step.Parent = workspace\nend', deliverable: '코드로 만든 6칸 반복 장애물', debugTip: '블록 수가 다르면 반복 시작값·끝값과 index 계산을 확인합니다.', studioRule: '반복 생성 전 개수와 크기를 작게 시험해 컴퓨터가 느려지지 않게 합니다.' },
    { unitNumber: 11, title: '함수로 기능 묶기', emoji: '🧰', focus: '함수와 매개변수', mission: '여러 번 쓰는 기능을 함수로 묶고 바꾸어 전달할 값을 익힙니다.', concept: '함수는 명령 묶음에 이름을 붙인 도구이고 매개변수는 사용할 때 전달하는 값입니다.', build: '블록 색을 바꾸는 함수를 만들고 다른 색을 세 번 전달합니다.', code: 'local function paint(part, color)\n    part.Color = color\nend\npaint(workspace.Goal, Color3.fromRGB(255, 170, 0))', deliverable: '재사용 가능한 색상 변경 함수', debugTip: '함수가 작동하지 않으면 만든 뒤 실제로 호출했는지 확인합니다.', studioRule: '함수 이름은 하는 일을 알 수 있게 정하고 코드를 필요 없이 반복하지 않습니다.' },
    { unitNumber: 12, title: '코인 수집 미니게임', emoji: '🪙', focus: 'Touched 이벤트와 보상', mission: '코인에 닿았을 때 보상을 주고 코인을 숨기는 수집 게임을 완성합니다.', concept: '이벤트는 특정 행동이 일어났을 때 연결된 함수를 실행합니다.', build: '코인에 Touched를 연결하고 캐릭터를 확인한 뒤 숨김 효과를 만듭니다.', code: 'local coin = script.Parent\ncoin.Touched:Connect(function(hit)\n    local player = game.Players:GetPlayerFromCharacter(hit.Parent)\n    if player then\n        coin.Transparency = 1\n        coin.CanCollide = false\n    end\nend)', deliverable: '코인 10개 수집 미니게임', debugTip: '여러 번 실행되면 상태 변수로 이미 수집했는지 확인합니다.', studioRule: '보상은 실제 돈이나 Robux가 아닌 수업용 게임 점수만 사용합니다.' },
    { unitNumber: 13, title: '점수판 시스템', emoji: '🏅', focus: 'leaderstats와 점수 표시', mission: '플레이어별 Coins 값을 만들고 코인을 모을 때 점수가 올라가게 합니다.', concept: 'leaderstats 폴더 안의 값은 플레이어 목록에 표시되며 점수 변경은 서버에서 처리합니다.', build: '입장 시 Coins 값을 만들고 수집 이벤트에서 1씩 증가시킵니다.', code: 'game.Players.PlayerAdded:Connect(function(player)\n    local stats = Instance.new("Folder")\n    stats.Name = "leaderstats"\n    stats.Parent = player\n    local coins = Instance.new("IntValue")\n    coins.Name = "Coins"\n    coins.Parent = stats\nend)', deliverable: '플레이어별 코인 점수판', debugTip: '안 보이면 폴더 이름과 Coins의 Parent를 확인합니다.', studioRule: '점수 순위는 놀리기보다 자신의 이전 기록을 개선하는 데 사용합니다.' },
    { unitNumber: 14, title: '체력과 위험 블록', emoji: '❤️', focus: 'Humanoid 체력과 피해', mission: '위험 블록에 닿으면 체력이 줄고 위험을 미리 알아보게 표시합니다.', concept: '캐릭터의 Humanoid가 체력을 관리하며 중요한 변경은 서버 Script에서 처리합니다.', build: 'Humanoid를 찾아 일정량의 체력을 줄이고 피해 간격을 조절합니다.', code: 'script.Parent.Touched:Connect(function(hit)\n    local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")\n    if humanoid then humanoid:TakeDamage(20) end\nend)', deliverable: '경고 표시와 피해 간격이 있는 위험 구간', debugTip: '체력이 너무 빨리 줄면 짧은 재실행 방지 시간을 둡니다.', studioRule: '위험 요소는 색·모양·표지로 미리 알려 피할 선택권을 줍니다.' },
    { unitNumber: 15, title: '체크포인트와 부활', emoji: '📍', focus: 'SpawnLocation과 진행', mission: '실패해도 최근 지점부터 다시 시작하는 체크포인트를 만듭니다.', concept: '체크포인트는 실패 비용을 조절해 도전을 계속하게 합니다.', build: '세 SpawnLocation을 배치하고 닿은 지점을 다음 부활 위치로 설정합니다.', code: 'local checkpoint = script.Parent\ncheckpoint.Touched:Connect(function(hit)\n    local player = game.Players:GetPlayerFromCharacter(hit.Parent)\n    if player then player.RespawnLocation = checkpoint end\nend)', deliverable: '세 구간 체크포인트 오비', debugTip: '엉뚱한 곳에서 부활하면 SpawnLocation과 RespawnLocation을 확인합니다.', studioRule: '너무 긴 구간을 처음부터 반복하게 하지 않고 회복 지점을 둡니다.' },
    { unitNumber: 16, title: '타이머 라운드 게임', emoji: '⏱️', focus: '시간과 라운드 흐름', mission: '준비·플레이·결과 상태와 제한 시간이 있는 라운드를 만듭니다.', concept: '라운드 게임은 상태와 시간을 함께 관리합니다.', build: '10초 준비와 60초 플레이 타이머를 만들고 남은 시간을 표시합니다.', code: 'for timeLeft = 10, 0, -1 do\n    print("시작까지", timeLeft)\n    task.wait(1)\nend\nprint("ROUND START!")', deliverable: '준비·플레이·종료가 있는 1분 라운드', debugTip: '숫자가 너무 빠르면 task.wait 위치와 감소값을 확인합니다.', studioRule: '처음 배우는 플레이어도 규칙을 익힐 준비 시간을 제공합니다.' },
    { unitNumber: 17, title: '화면 UI 안내판', emoji: '🖥️', focus: 'ScreenGui와 TextLabel', mission: '목표와 남은 시간을 화면에 읽기 쉽게 표시합니다.', concept: 'UI는 화면 위에 표시되며 크기, 대비, 위치를 여러 해상도에서 확인해야 합니다.', build: 'StarterGui에 목표·시간·상태 안내를 배치합니다.', code: 'local label = script.Parent\nlabel.Text = "코인 10개를 모으세요!"\nlabel.TextScaled = true', deliverable: '목표와 상태를 알려 주는 게임 HUD', debugTip: 'UI가 안 보이면 ScreenGui Enabled와 Label의 Size·Position을 확인합니다.', studioRule: '작은 글씨와 색만 쓰지 않고 아이콘이나 문장을 함께 사용합니다.' },
    { unitNumber: 18, title: '게임 코인 상점', emoji: '🛒', focus: '버튼·가격·구매 조건', mission: '모은 코인으로 효과를 사는 수업용 상점을 만듭니다.', concept: '구매는 보유 점수가 가격보다 충분한지 확인한 뒤 차감과 보상을 한 번만 처리합니다.', build: '가격을 표시하고 Coins가 충분할 때만 점수를 차감하고 효과를 줍니다.', code: 'local price = 10\nif coins.Value >= price then\n    coins.Value -= price\n    print("점프 효과 구매 완료")\nelse\n    print("코인이 부족해요")\nend', deliverable: '게임 점수로 이용하는 아이템 상점', debugTip: '연속 클릭 구매는 버튼을 잠시 잠그고 서버에서 가격을 다시 확인합니다.', studioRule: '현금·Robux 구매를 넣지 않고 가상 게임 점수만 사용합니다.' },
    { unitNumber: 19, title: '나만의 게임 기획서', emoji: '📝', focus: '플레이어·목표·핵심 반복', mission: '게임의 플레이어, 목표, 행동, 반응, 보상, 실패 조건을 정리합니다.', concept: '좋은 기획은 기능 목록보다 플레이어가 반복할 행동과 재미의 이유가 분명합니다.', build: '“플레이어는 ___해서 ___을 얻는다” 문장과 세 화면을 기획합니다.', code: '-- GAME LOOP\n-- 1. 목표를 본다\n-- 2. 행동하고 반응을 확인한다\n-- 3. 보상을 얻고 다음 도전을 선택한다', deliverable: '핵심 반복이 보이는 1장 게임 기획서', debugTip: '아이디어가 크면 필수 기능 세 개만 남깁니다.', studioRule: '다른 게임의 이름·캐릭터·맵을 복제하지 않고 규칙을 분석해 새 주제로 바꿉니다.' },
    { unitNumber: 20, title: '그레이박스 레벨 설계', emoji: '🗺️', focus: '빠른 맵 구조 검증', mission: '단순한 회색 블록으로 시작·도전·휴식·목표 공간을 시험합니다.', concept: '그레이박스는 장식보다 이동 거리, 시야, 길 찾기와 난이도를 먼저 검증합니다.', build: '네 공간을 회색 블록으로 배치하고 3분 안에 완주 가능한지 측정합니다.', code: 'local testPart = workspace.TestPart\ntestPart.Color = Color3.fromRGB(163, 162, 165)\ntestPart.Material = Enum.Material.SmoothPlastic', deliverable: '3분 플레이가 가능한 그레이박스 맵', debugTip: '길을 잃으면 공간 크기, 시야와 목표 위치부터 다시 배치합니다.', studioRule: '테스트 버전임을 표시하고 친구에게 테스트 목적을 설명합니다.' },
    { unitNumber: 21, title: '핵심 게임 루프 연결', emoji: '🔗', focus: '행동·반응·보상 순환', mission: '플레이어 행동에 즉시 반응하고 보상이 다음 행동으로 이어지게 합니다.', concept: '핵심 루프는 행동 → 게임 반응 → 보상 → 다음 선택의 순환입니다.', build: '수집 행동에 점수·효과·다음 목표를 연결해 세 번 반복해도 작동하게 합니다.', code: 'local reward = 1\ncoins.Value += reward\nprint("보상 +", reward, "다음 목표로 이동하세요!")', deliverable: '세 번 반복 가능한 핵심 게임 루프', debugTip: '다음 할 일이 보이지 않으면 새 목표 표시와 이동 동선을 확인합니다.', studioRule: '반복 클릭보다 플레이어가 선택하고 실력을 키우는 규칙을 만듭니다.' },
    { unitNumber: 22, title: '나만의 테마와 도전', emoji: '✨', focus: '테마·난이도·피드백', mission: '고유한 테마와 선택형 도전, 성공·실패 피드백을 더합니다.', concept: '테마는 목표·장애물·보상·소리가 같은 분위기를 전달하게 만드는 것입니다.', build: '색과 오브젝트 규칙을 정하고 쉬운 길과 도전 길을 선택하게 합니다.', code: 'local difficulty = "normal"\nif difficulty == "hard" then\n    reward = 3\nelse\n    reward = 1\nend', deliverable: '선택형 도전과 고유 테마가 있는 베타 게임', debugTip: '장식 때문에 목표가 안 보이면 플레이 요소와 배경의 대비를 키웁니다.', studioRule: '큰 소리·빠른 번쩍임·과도한 화면 흔들림을 피합니다.' },
    { unitNumber: 23, title: '플레이테스트와 밸런스', emoji: '🧪', focus: '관찰·버그·난이도', mission: '세 명의 행동과 시간을 관찰해 버그와 어려운 구간을 수정합니다.', concept: '밸런스는 성공률, 걸린 시간, 멈춘 위치와 설명을 함께 보고 조절합니다.', build: '같은 시나리오로 세 명을 테스트하고 영향이 큰 문제 두 가지를 수정합니다.', code: 'local testMode = true\nif testMode then\n    warn("TEST: checkpoint reached")\nend', deliverable: '테스트 기록이 반영된 최종 후보본', debugTip: '한 사람 의견보다 여러 사람이 같은 곳에서 막히는지 확인합니다.', studioRule: '참여자에게 목적을 설명하고 원하면 언제든 테스트를 중단하게 합니다.' },
    { unitNumber: 24, title: '게임 메이커 쇼케이스', emoji: '🏆', focus: '최종 점검과 포트폴리오', mission: '게임 목표, 핵심 코드, 테스트와 수정 과정을 정리해 최종 작품을 시연합니다.', concept: '좋은 포트폴리오는 완성 화면과 함께 설계·코딩·테스트·수정의 근거를 보여 줍니다.', build: '최종 파일과 백업을 저장하고 소개, 조작법, 핵심 기능, 수정 전후를 정리합니다.', code: 'print("GAME READY")\nprint("테스트 완료, 알려진 문제 기록 완료")', deliverable: '최종 창작게임과 게임 메이커 포트폴리오', debugTip: '깨끗한 테스트 환경에서 시작부터 종료까지 실행하고 백업 파일을 준비합니다.', studioRule: '외부 자료와 도움받은 코드를 밝히고 개인정보가 없는지 확인합니다.' },
];

const GAME_UNITS = GAME_BLUEPRINTS.map(createUnit);

export const GAME_DEV_CHAPTERS: Chapter[] = [
    { id: 'game-maker-v1-stage-1', chapterNumber: 1, title: '1단계 | 3D 월드 디자이너', icon: 'view_in_ar', description: 'Studio 조작, 3D 공간, Part 속성, 물리와 레벨 동선을 익혀 첫 오비게임을 완성합니다.', recommendedGrade: '초등 4~6학년', units: GAME_UNITS.slice(0, 6) },
    { id: 'game-maker-v1-stage-2', chapterNumber: 2, title: '2단계 | Luau 게임 코더', icon: 'code_blocks', description: 'Script·변수·조건·반복·함수·이벤트를 작은 기능으로 연결해 코인 수집게임을 만듭니다.', recommendedGrade: '초등 4~6학년', units: GAME_UNITS.slice(6, 12) },
    { id: 'game-maker-v1-stage-3', chapterNumber: 3, title: '3단계 | 게임 시스템 빌더', icon: 'stadia_controller', description: '점수·체력·체크포인트·라운드·UI·상점을 연결해 플레이 가능한 시스템을 완성합니다.', recommendedGrade: '초등 4~6학년', units: GAME_UNITS.slice(12, 18) },
    { id: 'game-maker-v1-stage-4', chapterNumber: 4, title: '4단계 | 게임 디렉터', icon: 'movie_edit', description: '게임을 기획하고 그레이박스·핵심 루프·테마·테스트를 거쳐 창작게임과 포트폴리오를 발표합니다.', recommendedGrade: '초등 4~6학년', units: GAME_UNITS.slice(18, 24) },
];
