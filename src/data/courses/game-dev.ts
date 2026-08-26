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
}

export const GAME_MAKER_CURRICULUM_VERSION = '2026.1-game-maker';

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

function createStudioPages(unit: GameBlueprint): StudioPage[] {
    return [
        {
            title: `오늘의 게임 미션 · ${unit.title}`, phase: '미션', time: '10분', idea: unit.mission,
            task: `완성 목표는 ‘${unit.deliverable}’입니다. 플레이어가 무엇을 하고 언제 성공하는지 한 문장으로 정하세요.`,
            checkpoint: '플레이어·목표·성공 조건을 자신의 말로 설명한다.',
        },
        {
            title: `게임 장면 탐색 · ${unit.focus}`, phase: '탐색', time: '10분', idea: unit.concept,
            task: '완성 예시를 플레이하며 오브젝트, 플레이어 행동, 게임의 반응을 각각 찾아 표시하세요.',
            checkpoint: '화면에 보이는 것과 코드가 하는 일을 구분한다.',
            activity: createActivity(unit, 'predict'),
        },
        {
            title: `핵심 원리 · ${unit.focus}`, phase: '코딩', time: '10분', idea: unit.concept,
            task: '코드를 실행하기 전에 바뀌는 대상, 조건, 결과에 밑줄을 긋고 실행 순서를 말해 보세요.',
            checkpoint: `${unit.focus}의 입력과 결과를 연결해 설명한다.`,
        },
        {
            title: '선생님 시범 · 한 단계씩 만들기', phase: '제작', time: '15분',
            idea: '작은 기능 하나를 만든 뒤 바로 실행하면 어느 단계에서 문제가 생겼는지 찾기 쉽습니다.',
            task: `${unit.build} 선생님의 첫 단계를 따라 만든 뒤 Play 버튼으로 바로 확인하세요.`,
            checkpoint: '자신의 프로젝트에 핵심 기능을 직접 연결한다.',
        },
        {
            title: '스크립트 랩 · 읽고 바꾸고 실행하기', phase: '코딩', time: '15분',
            idea: '코드를 그대로 복사하는 것보다 어떤 값이 결과를 바꾸는지 예상하고 한 곳씩 수정하는 것이 중요합니다.',
            task: '예제 코드에서 오브젝트 이름이나 숫자 한 곳을 찾아 내 게임에 맞게 바꾸고 Output과 화면 결과를 비교하세요.',
            checkpoint: '예제 코드의 한 줄 이상을 목적에 맞게 수정하고 결과를 확인한다.',
            activity: createActivity(unit, 'build'),
        },
        {
            title: '핵심 기능 제작 · 플레이 가능한 흐름', phase: '제작', time: '15분',
            idea: '게임은 시작 → 행동 → 반응 → 보상 흐름이 끊기지 않아야 플레이할 수 있습니다.',
            task: `${unit.build} 시작부터 결과까지 한 번에 작동하도록 오브젝트와 스크립트를 연결하세요.`,
            checkpoint: '핵심 기능이 처음부터 끝까지 한 번 이상 정상 작동한다.',
        },
        {
            title: '나만의 도전 · 규칙 하나 바꾸기', phase: '도전', time: '15분',
            idea: '같은 기능도 속도·크기·시간·보상·배치 규칙을 바꾸면 다른 게임 경험이 됩니다.',
            task: '난이도, 보상 또는 화면 표현 중 한 가지를 골라 나만의 규칙으로 바꾸고 전후를 비교하세요.',
            checkpoint: '기본 예제와 다른 나만의 선택이 한 가지 이상 들어 있다.',
        },
        {
            title: '버그 헌터 · 예상과 실제 비교', phase: '테스트', time: '10분', idea: unit.debugTip,
            task: '정상 플레이와 일부러 실패하는 플레이를 각각 실행해 첫 번째로 예상과 달라지는 지점을 찾으세요.',
            checkpoint: '문제의 위치와 원인을 구분하고 한 번 이상 수정한다.',
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
    return {
        objective: page.idea,
        say: `“오늘은 게임을 하는 사람이 아니라 게임의 규칙을 설계하고 테스트하는 개발자입니다.” ${page.idea}`,
        questions: [
            '플레이어가 한 행동과 게임이 보여 준 반응은 각각 무엇인가요?',
            '숫자나 조건 한 가지를 바꾸면 게임 경험이 어떻게 달라질까요?',
        ],
        expectedAnswer: page.checkpoint,
        coaching: '정답 코드를 바로 주지 말고 Explorer의 오브젝트 이름, Script 위치, Output 오류 순서로 확인하게 하세요.',
        extension: `빠른 학생은 ${unit.focus}에 난이도 선택이나 두 번째 규칙을 추가하고 플레이 경험의 차이를 설명합니다.`,
        assessment: [page.task, page.checkpoint, unit.studioRule],
    };
}

function createPage(unit: GameBlueprint, page: StudioPage, pageIndex: number): Page {
    const pageNumber = pageIndex + 1;
    const lessonPackage = createLessonPackage(unit);
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
