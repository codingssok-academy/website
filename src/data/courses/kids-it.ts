import type { Chapter, LearningActivity, LessonPackage, Page, TeacherGuide, Unit } from './types';

interface DigitalCreatorBlueprint {
    unitNumber: number;
    title: string;
    emoji: string;
    keyword: string;
    goal: string;
    materials: string[];
    deliverable: string;
    completionCriteria: [string, string, string];
    parentReport: string;
    concept: string;
    analogy: string;
    warmup: string;
    observe: string;
    demo: string;
    guided: [string, string];
    design: string;
    build: [string, string];
    challenge: string;
    test: string;
    share: string;
    promise: string;
    teacherOpening: string;
    teacherCoaching: string;
    teacherExtension: string;
}

interface DigitalCreatorSlide {
    title: string;
    idea: string;
    analogy: string;
    practice: [string, string];
    remember: string;
    activity?: LearningActivity;
}

export const DIGITAL_CREATOR_CURRICULUM_VERSION = '2026.2-rebuild';

const PAGE_TYPE = '페이지' as const;
const UNIT_TYPE = '프로젝트' as const;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getStageLabel(unitNumber: number): string {
    if (unitNumber <= 5) return '1단계 · 디지털 도구 탐험가';
    if (unitNumber <= 10) return '2단계 · 미디어 이야기 작가';
    return '3단계 · 코딩 창작자';
}

function getLessonPhase(pageNumber: number): { label: string; time: string; cue: string } {
    if (pageNumber <= 2) return { label: '발견하기', time: '20분', cue: '보고, 만지고, 내 말로 설명해요' };
    if (pageNumber <= 5) return { label: '익히기', time: '35분', cue: '선생님과 천천히 두 번 연습해요' };
    if (pageNumber <= 8) return { label: '창작하기', time: '45분', cue: '내 생각을 더해 하나의 작품을 만들어요' };
    return { label: '나누기', time: '20분', cue: '친구와 확인하고 발표·기록해요' };
}

function createActivity(
    unit: DigitalCreatorBlueprint,
    kind: 'discover' | 'practice' | 'create' | 'reflect',
): LearningActivity {
    if (kind === 'discover') {
        return {
            label: '발견 기록',
            prompt: `${unit.keyword}에서 새롭게 발견한 것을 한 가지 적어 보세요.`,
            placeholder: '그림이나 한 단어로 먼저 표현해도 좋아요.',
            example: `예: ${unit.concept}`,
            minLength: 2,
        };
    }
    if (kind === 'practice') {
        return {
            label: '연습 기록',
            prompt: '따라 하면서 성공한 동작과 어려웠던 동작을 하나씩 적어 보세요.',
            placeholder: '성공한 것: ___ / 어려웠던 것: ___',
            example: `성공한 것: ${unit.guided[0]} / 더 연습할 것: 천천히 순서 지키기`,
            minLength: 2,
        };
    }
    if (kind === 'create') {
        return {
            label: '창작 기록',
            prompt: `내 ${unit.deliverable}에 넣은 나만의 생각을 적어 보세요.`,
            placeholder: '내가 고른 색, 글자, 소리, 움직임을 적어 보세요.',
            example: `예: ${unit.challenge}`,
            minLength: 2,
        };
    }
    return {
        label: '성장 기록',
        prompt: '오늘 잘한 점 한 가지와 다음 시간에 다시 도전할 점 한 가지를 적어 보세요.',
        placeholder: '잘한 점: ___ / 다음 도전: ___',
        example: `잘한 점: 끝까지 완성했어요. / 다음 도전: ${unit.promise}`,
        minLength: 2,
    };
}

function createSlides(unit: DigitalCreatorBlueprint): DigitalCreatorSlide[] {
    return [
        {
            title: `미션 열기 · ${unit.title}`,
            idea: unit.goal,
            analogy: unit.analogy,
            practice: [unit.warmup, `오늘 사용할 준비물을 확인해요: ${unit.materials.join(' · ')}`],
            remember: `오늘의 목표는 ‘${unit.deliverable}’을 완성하는 것입니다.`,
        },
        {
            title: `핵심 발견 · ${unit.keyword}`,
            idea: unit.concept,
            analogy: unit.analogy,
            practice: [unit.observe, '찾은 기능이나 규칙을 친구에게 내 말로 한 문장 설명합니다.'],
            remember: unit.concept,
            activity: createActivity(unit, 'discover'),
        },
        {
            title: '선생님 시범을 눈으로 따라가요',
            idea: unit.demo,
            analogy: '요리 영상을 볼 때 손의 순서를 먼저 보는 것처럼, 선생님의 포인터와 화면 변화를 차례로 봅니다.',
            practice: [unit.demo, '시범이 끝나면 기억나는 순서를 손가락으로 세며 말합니다.'],
            remember: '누르기 전에 보고, 한 단계가 끝나면 화면 변화를 확인합니다.',
        },
        {
            title: '기본 기능을 두 번 연습해요',
            idea: '처음에는 선생님과 함께 하고, 두 번째에는 화면의 도움말을 보며 스스로 해 봅니다.',
            analogy: '자전거를 배울 때 잡아 주는 연습 뒤에 혼자 달려 보는 것과 같습니다.',
            practice: unit.guided,
            remember: '빠르게 한 번보다 정확하게 두 번 해 보는 것이 중요합니다.',
        },
        {
            title: '따라 하기 미션을 통과해요',
            idea: `배운 기능을 연결해 ${unit.deliverable}의 기본 모양을 만듭니다.`,
            analogy: '도장을 한 칸씩 찍어 미션 카드를 완성하는 것처럼, 성공한 단계마다 확인 표시를 합니다.',
            practice: [unit.guided[1], '완성 기준 첫 번째 항목을 보고 빠진 부분을 한 번 고칩니다.'],
            remember: unit.completionCriteria[0],
            activity: createActivity(unit, 'practice'),
        },
        {
            title: '내 작품의 설계도를 그려요',
            idea: unit.design,
            analogy: '집을 짓기 전에 방의 위치를 그리듯, 만들기 전에 필요한 요소와 순서를 정합니다.',
            practice: [unit.design, '제목·그림·글자·움직임 중 오늘 작품에 필요한 것을 동그라미 합니다.'],
            remember: '좋은 작품은 만들기 전에 목표와 순서를 정합니다.',
        },
        {
            title: '작품 만들기 · 첫 번째 단계',
            idea: unit.build[0],
            analogy: '큰 블록 작품도 가장 아래 블록부터 하나씩 쌓으면 완성할 수 있습니다.',
            practice: [unit.build[0], unit.build[1]],
            remember: '중간에 한 번 저장하면 내 작품을 안전하게 지킬 수 있습니다.',
        },
        {
            title: '작품 만들기 · 나답게 바꾸기',
            idea: unit.challenge,
            analogy: '같은 재료로도 서로 다른 작품이 나오듯, 색·말·소리·움직임에 내 선택을 넣습니다.',
            practice: [unit.challenge, '작품 제목과 만든 사람 이름을 넣고 마지막으로 저장합니다.'],
            remember: unit.completionCriteria[1],
            activity: createActivity(unit, 'create'),
        },
        {
            title: '친구와 테스트하고 한 번 고쳐요',
            idea: unit.test,
            analogy: '놀이기구를 열기 전에 안전 점검을 하듯, 작품도 다른 사람이 사용해 보고 고칩니다.',
            practice: [unit.test, '친구에게 좋은 점 하나와 궁금한 점 하나를 듣고 작품을 한 번 수정합니다.'],
            remember: '테스트는 틀린 것을 찾는 시간이 아니라 작품을 더 좋아지게 만드는 시간입니다.',
        },
        {
            title: '발표하고 성장 기록을 남겨요',
            idea: unit.share,
            analogy: '작은 전시회의 작가처럼 작품의 생각과 만든 방법을 짧고 또렷하게 소개합니다.',
            practice: [unit.share, unit.promise],
            remember: unit.completionCriteria[2],
            activity: createActivity(unit, 'reflect'),
        },
    ];
}

function createTeacherGuide(
    unit: DigitalCreatorBlueprint,
    slide: DigitalCreatorSlide,
    pageNumber: number,
): TeacherGuide {
    return {
        objective: slide.idea,
        say: pageNumber === 1 ? `${unit.teacherOpening} ${slide.analogy}` : slide.analogy,
        questions: [
            `${slide.title}에서 가장 먼저 해야 할 일은 무엇일까요?`,
            `화면이나 작품이 바뀐 까닭을 ${unit.keyword}와 연결해 말해 볼까요?`,
        ],
        expectedAnswer: slide.remember,
        coaching: unit.teacherCoaching,
        extension: unit.teacherExtension,
        assessment: slide.practice,
    };
}

function createLessonPackage(unit: DigitalCreatorBlueprint): LessonPackage {
    return {
        materials: unit.materials,
        deliverable: unit.deliverable,
        completionCriteria: unit.completionCriteria,
        parentReport: unit.parentReport,
    };
}

function createPage(unit: DigitalCreatorBlueprint, slide: DigitalCreatorSlide, pageIndex: number): Page {
    const pageNumber = pageIndex + 1;
    const phase = getLessonPhase(pageNumber);
    const pageId = `digital-creator-v2-${String((unit.unitNumber - 1) * 10 + pageNumber).padStart(3, '0')}`;
    const hasPictureChoice = unit.unitNumber === 1 && pageNumber === 1;
    const actionCue = hasPictureChoice
        ? '아래 그림 카드 활동에서 해보세요 ↓'
        : '아래 실제 작성칸에 적어보세요 ↓';
    const lessonPlan = pageNumber === 1 ? `
        <div class="kids-it-plan">
            <strong>오늘의 120분</strong>
            <span>발견하기 20분</span><i>→</i><span>익히기 35분</span><i>→</i><span>창작하기 45분</span><i>→</i><span>나누기 20분</span>
        </div>
    ` : '';
    const toolkit = pageNumber === 1 ? `
        <div class="kids-it-toolkit">
            <article><span>준비물</span><p>${unit.materials.map(escapeHtml).join(' · ')}</p></article>
            <article><span>오늘의 결과물</span><p>${escapeHtml(unit.deliverable)}</p></article>
            <article><span>완료 기준</span><p>${escapeHtml(unit.completionCriteria[0])}</p></article>
        </div>
    ` : '';
    const finish = pageNumber === 10 ? `
        <div class="kids-it-finish">
            <span>오늘의 완성 체크</span>
            <ul>${unit.completionCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            <p><b>학부모 리포트 문장</b>${escapeHtml(unit.parentReport)}</p>
        </div>
    ` : '';

    return {
        id: pageId,
        title: slide.title,
        type: PAGE_TYPE,
        content: `
            <section class="kids-it-slide kids-it-textbook" data-curriculum="${DIGITAL_CREATOR_CURRICULUM_VERSION}">
                <div class="kids-it-doodle kids-it-doodle-star">★</div>
                <div class="kids-it-doodle kids-it-doodle-cloud">☁</div>
                <div class="kids-it-doodle kids-it-doodle-plane">➤</div>
                <header class="kids-it-textbook-top">
                    <div class="kids-it-textbook-brand"><small>CODING SSOK ACADEMY</small><b>디지털 창작자</b></div>
                    <div class="kids-it-phase"><b>${phase.label}</b><span>${phase.time}</span></div>
                </header>
                <div class="kids-it-mission-ribbon">${escapeHtml(unit.emoji)} 오늘의 미션</div>
                <div class="kids-it-title-row">
                    <div>
                        <p class="kids-it-kicker">${getStageLabel(unit.unitNumber)} · ${pageNumber}/10</p>
                        <h2>${escapeHtml(slide.title)}</h2>
                        <p class="kids-it-cue">${phase.cue}</p>
                    </div>
                    <div class="kids-it-number">${String(unit.unitNumber).padStart(2, '0')}</div>
                </div>
                <div class="kids-it-pencil-line"></div>
                <section class="kids-it-think-box">
                    <div class="kids-it-think-copy">
                        <span class="kids-it-section-title"><i>💡</i> 생각 열기</span>
                        <p>${escapeHtml(slide.idea)}</p>
                        <div class="kids-it-analogy"><b>이렇게 생각해요</b>${escapeHtml(slide.analogy)}</div>
                    </div>
                    <div class="kids-it-illustration-frame" style="--kids-art-height:206px;display:flex !important;width:100% !important;max-width:430px !important;height:230px !important;margin:0 auto !important;padding:12px 18px !important;align-items:center !important;justify-content:center !important;overflow:visible !important;">
                        <img src="/images/courses/digital-creator-textbook-v2.png" alt="친구들과 로봇이 ${escapeHtml(unit.keyword)} 활동을 하는 모습" class="kids-it-illustration" width="430" height="287" style="display:block !important;width:100% !important;max-width:394px !important;height:auto !important;max-height:var(--kids-art-height) !important;margin:0 auto !important;object-fit:contain !important;border:0 !important;box-shadow:none !important;transform:none !important;" />
                    </div>
                </section>
                <div class="kids-it-action-grid">
                    <article class="kids-it-action kids-it-action-make">
                        <span class="kids-it-section-title"><i>🧩</i> 만들기</span>
                        <div class="kids-it-step-number">1</div>
                        <p>${escapeHtml(slide.practice[0])}</p>
                        <div class="kids-it-action-cue">${actionCue}</div>
                    </article>
                    <article class="kids-it-action kids-it-action-challenge">
                        <span class="kids-it-section-title"><i>⚑</i> 도전하기</span>
                        <div class="kids-it-step-number">2</div>
                        <p>${escapeHtml(slide.practice[1])}</p>
                        <div class="kids-it-action-cue">${actionCue}</div>
                    </article>
                </div>
                ${lessonPlan}
                ${toolkit}
                <div class="kids-it-remember kids-it-record-box">
                    <strong><i>📋</i> 수업 기록</strong>
                    <p>${escapeHtml(slide.remember)}</p>
                    <div class="kids-it-stars"><span>☆</span><span>☆</span><span>☆</span></div>
                </div>
                ${finish}
            </section>
        `,
        activity: slide.activity,
        choiceActivity: hasPictureChoice ? {
            label: '그림 카드 고르기',
            prompt: '컴퓨터로 해 본 일을 하나 이상 골라보세요.',
            soloGuide: '혼자 공부한다면 고른 카드를 보며 “나는 컴퓨터로 ○○을 해 봤어요”라고 소리 내어 말해 보세요.',
            groupGuide: '함께 공부한다면 고른 카드를 친구나 선생님에게 이야기해 보세요.',
            options: [
                { id: 'drawing', emoji: '🎨', label: '그림 그리기', description: '그림판이나 꾸미기' },
                { id: 'game', emoji: '🎮', label: '게임하기', description: '규칙을 보고 플레이하기' },
                { id: 'video', emoji: '🎬', label: '영상 보기', description: '재미있는 영상이나 수업 보기' },
                { id: 'search', emoji: '🔎', label: '공부·검색하기', description: '궁금한 것을 찾아보기' },
            ],
        } : undefined,
        actionWriting: !hasPictureChoice ? {
            label: '만들기·도전 기록',
            help: '한 단어나 짧은 문장으로 적어도 좋아요. 적은 내용은 자동 저장됩니다.',
            make: {
                prompt: slide.practice[0],
                placeholder: '무엇을 만들거나 해 보았는지 적어 보세요.',
            },
            challenge: {
                prompt: slide.practice[1],
                placeholder: '어떻게 바꾸거나 다시 도전했는지 적어 보세요.',
            },
        } : undefined,
        teacherGuide: createTeacherGuide(unit, slide, pageNumber),
    };
}

function createUnit(unit: DigitalCreatorBlueprint): Unit {
    const slides = createSlides(unit);
    return {
        id: `digital-creator-v2-u${String(unit.unitNumber).padStart(2, '0')}`,
        unitNumber: unit.unitNumber,
        title: unit.title,
        subtitle: `${unit.goal} · 발견하기 20분 · 익히기 35분 · 창작하기 45분 · 나누기 20분`,
        type: UNIT_TYPE,
        difficulty: unit.unitNumber <= 5 ? 1 : unit.unitNumber <= 10 ? 2 : 3,
        duration: '120분',
        pages: slides.map((slide, index) => createPage(unit, slide, index)),
        lessonPackage: createLessonPackage(unit),
    };
}

const DIGITAL_CREATOR_BLUEPRINTS: DigitalCreatorBlueprint[] = [
    {
        unitNumber: 1,
        title: '컴퓨터 탐험대 출발',
        emoji: '🖥️',
        keyword: '컴퓨터와 안전 약속',
        goal: '컴퓨터의 주요 부분과 화면 속 표지판을 찾고 안전한 사용 자세와 약속을 익힙니다.',
        materials: ['컴퓨터 또는 노트북', '마우스', '안전 약속 카드', '색연필'],
        deliverable: '컴퓨터 부분 4개와 안전 약속 3개가 담긴 탐험 지도',
        completionCriteria: ['화면·본체·키보드·마우스를 가리켜 말한다.', '보고–읽고–물어보기 약속을 작품에 넣는다.', '탐험 지도를 저장하고 친구에게 설명한다.'],
        parentReport: '컴퓨터의 주요 부분을 구별하고, 모르는 화면에서는 바로 누르지 않고 먼저 읽고 질문하는 안전 습관을 익혔습니다.',
        concept: '컴퓨터는 화면·본체·키보드·마우스가 서로 신호를 주고받으며 내 생각을 작품으로 바꾸는 도구입니다.',
        analogy: '컴퓨터는 여러 대원이 역할을 나누는 탐험대와 같습니다. 화면은 안내판, 키보드와 마우스는 명령 도구입니다.',
        warmup: '아래 그림 카드에서 컴퓨터로 해 본 일을 하나 이상 고릅니다. 혼자라면 소리 내어 말하고, 함께라면 친구나 선생님에게 이야기합니다.',
        observe: '화면·본체·키보드·마우스를 찾아 이름표 카드를 알맞은 곳에 놓습니다.',
        demo: '선생님이 바른 자세로 앉아 프로그램을 열고, 모르는 창에서 멈춰 질문하는 순서를 보여 줍니다.',
        guided: ['컴퓨터 부분 네 곳을 차례로 가리키며 이름을 말합니다.', '화면에서 아이콘과 버튼을 하나씩 찾고 누르기 전에 글자를 읽습니다.'],
        design: '탐험 지도를 네 구역으로 나누고 각 부분의 그림과 안전 약속을 어디에 넣을지 정합니다.',
        build: ['그림 도구로 컴퓨터 부분 네 개를 단순한 도형으로 그립니다.', '아래쪽에 바른 자세·모르면 질문하기·개인정보 지키기 배지를 넣습니다.'],
        challenge: '내가 가장 중요하다고 생각한 안전 약속을 큰 배지로 꾸미고 까닭을 한 문장으로 말합니다.',
        test: '친구가 지도의 그림만 보고 컴퓨터 부분과 안전 약속을 맞힐 수 있는지 확인합니다.',
        share: '“컴퓨터는 ___을 도와주고, 나는 ___ 약속을 지킬 거예요”로 발표합니다.',
        promise: '다음 수업에서도 누르기 전에 화면의 그림과 글자를 먼저 확인합니다.',
        teacherOpening: '실제 컴퓨터를 탐험 장소로 소개하고, 아이가 이미 알고 있는 부분부터 찾아보게 해 주세요.',
        teacherCoaching: '정답을 바로 말하지 말고 아이가 손가락으로 가리킨 뒤 이름표를 비교하게 합니다. 클릭 전에는 “보고–읽고–물어보기”를 함께 말합니다.',
        teacherExtension: '빠른 학생은 컴퓨터 부분 사이에 어떤 신호가 오가는지 화살표로 표현하고 친구에게 문제를 냅니다.',
    },
    {
        unitNumber: 2,
        title: '마우스 로봇 조종하기',
        emoji: '🖱️',
        keyword: '클릭·드래그·스크롤',
        goal: '포인터를 정확히 움직이고 클릭·더블클릭·드래그·스크롤을 구별해 사용합니다.',
        materials: ['컴퓨터', '마우스', '그림판', '마우스 미션 카드'],
        deliverable: '세 가지 마우스 기술로 통과하는 로봇 길 찾기 그림',
        completionCriteria: ['클릭·더블클릭·드래그를 상황에 맞게 사용한다.', '길을 벗어나면 되돌리기로 스스로 고친다.', '완성한 길 찾기를 저장하고 조작 순서를 설명한다.'],
        parentReport: '클릭·더블클릭·드래그·스크롤의 차이를 이해하고, 포인터를 천천히 조절해 로봇 길 찾기 작품을 완성했습니다.',
        concept: '마우스는 손의 움직임을 화면의 포인터로 바꾸며, 누르는 방법에 따라 선택·열기·옮기기 명령을 보냅니다.',
        analogy: '마우스는 로봇 조종기와 같습니다. 포인터는 로봇이고 클릭과 드래그는 서로 다른 조종 버튼입니다.',
        warmup: '책상 위 점 세 곳을 손가락으로 천천히 짚으며 눈과 손을 함께 움직이는 연습을 합니다.',
        observe: '포인터 모양이 화살표·손가락·글자 막대로 바뀌는 장소를 화면에서 찾아봅니다.',
        demo: '선생님이 클릭으로 도구를 고르고 드래그로 선을 그린 뒤 되돌리기로 실수를 고치는 과정을 보여 줍니다.',
        guided: ['크기가 다른 동그라미 다섯 개를 클릭해 색을 바꿉니다.', '선을 따라 드래그하고 화면 아래까지 스크롤한 뒤 다시 위로 올라옵니다.'],
        design: '출발점·도착점·장애물 세 종류를 정하고 로봇이 지나갈 길을 손으로 먼저 그립니다.',
        build: ['도형 도구로 출발점과 도착점, 장애물을 배치합니다.', '드래그로 길을 그리고 클릭으로 색과 굵기를 바꿉니다.'],
        challenge: '친구가 더 어렵게 도전할 수 있도록 갈림길이나 보너스 별을 하나 추가합니다.',
        test: '친구가 포인터를 길 밖으로 벗어나지 않고 출발점에서 도착점까지 움직이는지 관찰합니다.',
        share: '가장 어려웠던 마우스 동작과 성공하기 위해 천천히 한 방법을 시범 보입니다.',
        promise: '마우스를 세게 누르지 않고 손목을 편안하게 둔 채 천천히 조종합니다.',
        teacherOpening: '마우스를 로봇 조종기로 소개하고 화면 포인터와 손의 움직임이 연결되는 순간을 크게 보여 주세요.',
        teacherCoaching: '드래그가 어려우면 “누르고–움직이고–놓기”를 말로 나눠 연습합니다. 더블클릭은 책상에서 톡톡 리듬을 먼저 익힙니다.',
        teacherExtension: '빠른 학생은 길의 굵기를 바꾸거나 두 개의 난이도를 만들고 어느 길이 더 어려운지 설명합니다.',
    },
    {
        unitNumber: 3,
        title: '키보드 낱말 카드 만들기',
        emoji: '⌨️',
        keyword: '글자 입력과 고치기',
        goal: '한글·숫자·공백·엔터·백스페이스를 사용해 읽기 쉬운 낱말 카드를 만듭니다.',
        materials: ['컴퓨터', '키보드', '글쓰기 프로그램', '낱말 그림 카드'],
        deliverable: '제목과 세 문장, 그림 기호가 담긴 나의 낱말 카드',
        completionCriteria: ['한글·공백·엔터·백스페이스를 구별해 사용한다.', '제목과 세 문장을 읽기 좋게 배치하고 오타를 고친다.', '파일을 저장하고 만든 문장을 소리 내어 읽는다.'],
        parentReport: '한글 입력과 공백·엔터·백스페이스 사용법을 익히고, 스스로 오타를 찾아 고쳐 짧은 낱말 카드를 완성했습니다.',
        concept: '키보드는 생각을 글자로 바꾸는 도구이며 공백은 낱말을 나누고 엔터는 줄을 바꾸며 백스페이스는 틀린 글자를 고칩니다.',
        analogy: '키보드는 글자 블록 상자와 같습니다. 필요한 글자를 골라 순서대로 놓으면 문장이 됩니다.',
        warmup: '내 이름 글자와 좋아하는 낱말의 첫소리를 소리 내어 말하고 키보드에서 찾아봅니다.',
        observe: '한글 자판, 숫자 줄, 스페이스바, 엔터, 백스페이스의 위치와 크기를 비교합니다.',
        demo: '선생님이 짧은 문장을 입력하고 일부러 오타를 낸 뒤 커서를 옮겨 고치는 모습을 보여 줍니다.',
        guided: ['내 이름과 좋아하는 색을 한 줄에 입력하고 공백으로 나눕니다.', '엔터로 줄을 바꾸고 틀린 글자를 백스페이스로 고쳐 다시 입력합니다.'],
        design: '제목·내가 좋아하는 것·그 까닭·친구에게 묻는 말의 순서를 그림 카드로 정합니다.',
        build: ['제목을 크게 입력하고 엔터로 줄을 바꾼 뒤 세 문장을 씁니다.', '별·하트 같은 기호나 색을 한 가지 넣어 중요한 낱말을 꾸밉니다.'],
        challenge: '문장 하나를 더 재미있게 바꾸고, 물음표를 사용한 질문 문장을 추가합니다.',
        test: '친구가 소리 내어 읽을 때 낱말 사이와 줄이 잘 나뉘는지 확인하고 오타를 함께 찾습니다.',
        share: '카드 제목과 가장 마음에 드는 문장을 읽고, 스스로 고친 글자를 하나 말합니다.',
        promise: '개인정보나 비밀번호는 글쓰기 연습에 입력하지 않습니다.',
        teacherOpening: '글자 자석을 이어 문장을 만드는 모습과 키보드 입력을 연결해 설명해 주세요.',
        teacherCoaching: '자판을 찾기 어려워하면 첫소리 한 글자만 찾게 하고 손 전체 대신 한 손가락 입력부터 허용합니다. 오타는 실패가 아니라 고치기 연습이라고 말합니다.',
        teacherExtension: '빠른 학생은 글자 크기와 색을 바꾸고 제목과 본문의 차이를 설명하거나 질문 문장을 하나 더 씁니다.',
    },
    {
        unitNumber: 4,
        title: '파일·폴더 보물상자',
        emoji: '📁',
        keyword: '저장·이름·폴더',
        goal: '파일과 폴더의 차이를 알고 일정한 이름 규칙으로 작품을 저장하고 다시 찾습니다.',
        materials: ['컴퓨터', '연습용 그림 파일', '폴더 이름 카드', '보물 지도 활동지'],
        deliverable: '그림·글·사진 폴더와 이름 규칙이 적용된 나의 작품 보관함',
        completionCriteria: ['파일과 폴더의 역할을 구별해 말한다.', '날짜·이름·작품명이 들어간 규칙으로 저장한다.', '저장한 파일을 닫은 뒤 스스로 다시 찾아 연다.'],
        parentReport: '파일과 폴더의 차이를 이해하고, 일정한 파일 이름 규칙을 사용해 작품을 저장한 뒤 다시 찾는 과정을 수행했습니다.',
        concept: '파일은 하나의 작품이고 폴더는 여러 파일을 종류별로 모아 두는 상자이며, 좋은 이름은 다시 찾게 해 주는 표지판입니다.',
        analogy: '파일은 보물, 폴더는 보물상자, 파일 이름은 상자 안의 보물을 찾는 지도와 같습니다.',
        warmup: '교실 물건을 필기도구·책·장난감 상자로 나누며 왜 분류하면 찾기 쉬운지 말합니다.',
        observe: '연습 폴더에서 파일 아이콘과 폴더 아이콘을 찾아 모양과 이름의 차이를 비교합니다.',
        demo: '선생님이 새 폴더를 만들고 날짜_이름_작품명 규칙으로 파일을 저장한 뒤 닫고 다시 여는 과정을 보여 줍니다.',
        guided: ['그림·글·사진 이름의 폴더 세 개를 만들고 아이콘을 확인합니다.', '연습 파일 하나의 이름을 04_이름_보물지도 형식으로 바꿔 저장합니다.'],
        design: '내가 앞으로 만들 작품 세 종류를 고르고 어떤 폴더에 넣을지 보물 지도에 선으로 연결합니다.',
        build: ['내 작품 보관함 폴더 안에 그림·글·사진 폴더를 만듭니다.', '지난 시간 낱말 카드 파일을 알맞은 폴더에 저장하고 이름 규칙을 확인합니다.'],
        challenge: '폴더 안에 이번 달 폴더를 하나 더 만들고 두 단계 폴더를 따라가 파일을 다시 찾습니다.',
        test: '모든 창을 닫은 뒤 친구가 말해 주는 경로만 듣고 저장한 파일을 찾아 엽니다.',
        share: '내 파일 이름 규칙과 폴더 구조가 찾기 쉬운 까닭을 보물 지도처럼 설명합니다.',
        promise: '모르는 파일은 혼자 옮기거나 삭제하지 않고 먼저 선생님께 확인합니다.',
        teacherOpening: '실제 상자와 이름표를 보여 주고, 이름표가 없는 상자에서 물건을 찾기 어려운 상황을 이야기해 주세요.',
        teacherCoaching: '저장 창에서는 한 번에 한 요소만 찾게 합니다. 먼저 폴더 위치, 다음 파일 이름, 마지막 저장 버튼 순서로 손가락 체크를 사용합니다.',
        teacherExtension: '빠른 학생은 월별 하위 폴더를 만들고 친구 파일 두 개를 알맞은 위치에 분류하는 문제를 만듭니다.',
    },
    {
        unitNumber: 5,
        title: '도형으로 나만의 캐릭터',
        emoji: '🎨',
        keyword: '도형·색·겹치기',
        goal: '그림 도구의 도형·채우기·선·되돌리기를 사용해 표정이 있는 캐릭터를 만듭니다.',
        materials: ['컴퓨터', '그림판 또는 브라우저 그림 도구', '도형 카드', '색 조합 카드'],
        deliverable: '기본 도형 다섯 개 이상으로 만든 표정 캐릭터 카드',
        completionCriteria: ['도형·선·채우기·되돌리기를 사용한다.', '캐릭터의 표정과 특징에 내 생각을 넣는다.', '작품을 저장하고 사용한 도형과 색의 까닭을 발표한다.'],
        parentReport: '기본 도형과 색을 조합해 표정이 있는 캐릭터를 설계하고, 되돌리기로 수정하며 자신만의 디지털 그림을 완성했습니다.',
        concept: '복잡한 그림도 동그라미·네모·세모 같은 기본 도형을 크기와 위치를 바꾸어 겹치면 만들 수 있습니다.',
        analogy: '도형은 디지털 레고 블록과 같습니다. 같은 블록도 놓는 방법에 따라 로봇이나 동물이 됩니다.',
        warmup: '교실 물건에서 동그라미·네모·세모를 찾아 손으로 모양을 만들어 봅니다.',
        observe: '그림 도구에서 도형·선·채우기·지우개·되돌리기 아이콘을 찾아 역할을 예상합니다.',
        demo: '선생님이 동그라미와 네모를 겹쳐 얼굴을 만들고, 잘못 칠한 색을 되돌리는 모습을 보여 줍니다.',
        guided: ['도형 세 개로 얼굴과 몸을 만들고 채우기 도구로 색을 넣습니다.', '선 도구로 팔과 다리를 그리고 되돌리기와 다시 실행을 각각 사용합니다.'],
        design: '캐릭터의 이름·기분·특별한 능력을 정하고 필요한 도형과 색을 작은 설계도로 그립니다.',
        build: ['큰 도형부터 배치한 뒤 작은 도형으로 눈·입·장식을 만듭니다.', '배경색과 캐릭터 색이 잘 구별되도록 바꾸고 중간 저장합니다.'],
        challenge: '표정이나 소품을 바꾸어 캐릭터의 기분과 능력이 보이게 꾸밉니다.',
        test: '친구가 그림만 보고 캐릭터의 기분과 능력을 맞히는지 확인하고 헷갈리는 부분을 고칩니다.',
        share: '캐릭터 이름, 사용한 도형 세 가지, 가장 마음에 드는 특징을 소개합니다.',
        promise: '다른 친구의 그림을 놀리지 않고 서로 다른 표현을 존중합니다.',
        teacherOpening: '도형 자석 몇 개로 얼굴을 빠르게 만들며 복잡한 그림도 작은 모양에서 시작된다는 것을 보여 주세요.',
        teacherCoaching: '그림을 잘 그려야 한다는 부담을 줄이고 도형 개수와 기능 사용을 성공 기준으로 안내합니다. 채우기가 새면 선의 틈을 함께 찾습니다.',
        teacherExtension: '빠른 학생은 같은 캐릭터의 기쁜 표정과 놀란 표정을 두 장으로 만들고 달라진 도형을 비교합니다.',
    },
    {
        unitNumber: 6,
        title: '픽셀과 색으로 표정 만들기',
        emoji: '🟪',
        keyword: '픽셀·격자·색 조합',
        goal: '디지털 그림을 이루는 픽셀을 이해하고 격자와 제한된 색으로 표정 아이콘을 만듭니다.',
        materials: ['컴퓨터', '픽셀 그림 도구 또는 그림판', '격자 활동지', '색상 카드'],
        deliverable: '세 가지 감정을 표현한 12×12 픽셀 표정 세트',
        completionCriteria: ['픽셀이 모여 디지털 그림이 되는 원리를 말한다.', '격자와 4가지 이하의 색으로 표정 세 개를 만든다.', '친구가 감정을 알아보는지 테스트하고 수정한다.'],
        parentReport: '픽셀이 모여 디지털 이미지가 되는 원리를 이해하고, 제한된 격자와 색을 활용해 감정이 드러나는 표정 아이콘을 제작했습니다.',
        concept: '디지털 그림을 아주 크게 확대하면 작은 색 네모인 픽셀이 보이고, 픽셀의 위치와 색이 모여 하나의 그림이 됩니다.',
        analogy: '픽셀은 모자이크 타일과 같습니다. 작은 색 조각을 이어 붙이면 멀리서 하나의 얼굴로 보입니다.',
        warmup: '색종이 네모를 격자에 놓아 웃는 입과 찡그린 입을 각각 만들어 봅니다.',
        observe: '연습 이미지를 크게 확대해 네모 칸이 보이는 지점을 찾고 색 개수를 세어 봅니다.',
        demo: '선생님이 12×12 격자에 눈과 입을 대칭으로 놓고 색상 표에서 네 가지 색만 골라 채우는 과정을 보여 줍니다.',
        guided: ['격자의 가운데 선을 기준으로 두 눈의 위치를 맞춥니다.', '입 모양을 바꾸어 기쁨과 슬픔 표정을 각각 만듭니다.'],
        design: '기쁨·놀람·화남 중 세 감정을 고르고 눈·입·색이 어떻게 달라질지 격자 활동지에 표시합니다.',
        build: ['첫 번째 표정을 완성한 뒤 복사해 두 번째와 세 번째 칸에 붙입니다.', '눈·입·배경색을 바꾸어 세 감정이 서로 다르게 보이게 합니다.'],
        challenge: '네 가지 색만 사용하면서 볼이나 눈썹 같은 작은 특징을 추가합니다.',
        test: '친구에게 글자 없이 세 표정을 보여 주고 느껴지는 감정을 순서대로 말하게 합니다.',
        share: '가장 잘 표현된 감정과 그 감정을 위해 바꾼 픽셀 위치나 색을 설명합니다.',
        promise: '화면 속 작은 차이를 자세히 보고, 고칠 때는 한 칸씩 바꿉니다.',
        teacherOpening: '블록 그림을 가까이와 멀리에서 보여 주며 작은 칸과 전체 그림의 관계를 먼저 경험하게 해 주세요.',
        teacherCoaching: '격자 위치가 어려우면 행과 열을 숫자 대신 위·가운데·아래, 왼쪽·가운데·오른쪽으로 안내합니다. 색은 네 개를 먼저 정해 선택 부담을 줄입니다.',
        teacherExtension: '빠른 학생은 같은 표정을 좌우 대칭으로 완성하거나 두 프레임을 번갈아 보여 주는 깜빡임 효과를 설계합니다.',
    },
    {
        unitNumber: 7,
        title: '사진 편집과 저작권 약속',
        emoji: '📷',
        keyword: '자르기·꾸미기·출처',
        goal: '연습 사진을 자르고 꾸미며 개인정보와 다른 사람의 창작물을 안전하게 다루는 법을 익힙니다.',
        materials: ['교사가 준비한 연습 사진', '사진 편집 도구', '저작권·개인정보 카드', '출처 이름표'],
        deliverable: '자르기 전·후 사진과 출처 이름표가 담긴 안전한 디지털 엽서',
        completionCriteria: ['자르기·확대·글자 넣기 기능을 사용한다.', '개인정보가 보이지 않는지 확인하고 출처를 표시한다.', '편집한 까닭과 안전하게 공유하는 방법을 설명한다.'],
        parentReport: '사진 자르기와 글자 넣기 기능을 사용하고, 개인정보 확인과 출처 표시가 필요한 이유를 이해해 안전한 디지털 엽서를 만들었습니다.',
        concept: '사진 편집은 중요한 부분을 잘 보이게 바꾸는 일이지만, 사람의 얼굴·이름·위치 정보와 다른 사람의 작품은 허락과 출처를 확인해야 합니다.',
        analogy: '사진 편집은 종이 사진을 오려 엽서를 만드는 일과 같고, 출처는 빌린 물건에 붙이는 주인 이름표와 같습니다.',
        warmup: '사진 카드에서 주인공이 잘 보이는 사진과 개인정보가 보이는 사진을 나누어 봅니다.',
        observe: '연습 사진에서 남길 부분·자를 부분·가려야 할 정보를 서로 다른 색 테두리로 찾아봅니다.',
        demo: '선생님이 사진을 복사해 원본을 남기고 자르기·글자 넣기·출처 표시 순서로 엽서를 만드는 모습을 보여 줍니다.',
        guided: ['연습 사진을 복사하고 빈 공간을 줄여 주인공이 잘 보이게 자릅니다.', '짧은 제목을 넣고 아래쪽에 출처: 코딩쏙 연습 사진이라고 표시합니다.'],
        design: '엽서에서 가장 보여 주고 싶은 부분과 넣을 제목, 출처 이름표의 위치를 정합니다.',
        build: ['사진을 자르고 밝기나 색을 한 가지만 조절한 뒤 원본과 비교합니다.', '개인정보가 보이는 부분을 자르거나 가리고 제목과 출처를 넣습니다.'],
        challenge: '사진의 느낌과 어울리는 테두리와 한 문장 메시지를 추가하되 글자가 사진을 가리지 않게 배치합니다.',
        test: '친구와 개인정보·출처·읽기 쉬운 글자 세 항목을 점검하고 빠진 것을 수정합니다.',
        share: '어떤 부분을 왜 잘랐는지, 사진을 안전하게 사용하기 위해 무엇을 확인했는지 발표합니다.',
        promise: '사람 얼굴이 있는 사진은 허락 없이 올리지 않고 남의 작품에는 출처를 표시합니다.',
        teacherOpening: '친구의 색연필을 빌릴 때 허락하고 돌려주는 상황을 사진과 저작권 이야기로 연결해 주세요.',
        teacherCoaching: '실제 학생 사진 대신 교사용 연습 이미지만 사용합니다. 자르기 상자의 모서리를 잡는 동작을 먼저 크게 시범 보입니다.',
        teacherExtension: '빠른 학생은 같은 사진을 가로형과 세로형으로 각각 편집하고 어떤 용도에 더 어울리는지 비교합니다.',
    },
    {
        unitNumber: 8,
        title: '목소리로 소리 이야기',
        emoji: '🎙️',
        keyword: '녹음·재생·순서',
        goal: '주변 소리와 목소리를 녹음하고 장면 순서에 맞게 연결해 짧은 소리 이야기를 만듭니다.',
        materials: ['컴퓨터 또는 태블릿', '마이크 또는 헤드셋', '녹음 프로그램', '세 장면 이야기 카드'],
        deliverable: '시작·사건·끝이 들리는 20~30초 소리 이야기',
        completionCriteria: ['녹음·정지·재생 버튼을 구별해 사용한다.', '세 장면의 소리와 목소리를 순서대로 녹음한다.', '음량과 개인정보를 확인하고 친구에게 들려준다.'],
        parentReport: '녹음·정지·재생 기능을 구별하고, 시작–사건–끝의 순서가 있는 짧은 소리 이야기를 계획해 목소리로 표현했습니다.',
        concept: '소리 이야기는 보이지 않는 장면을 목소리·효과음·쉼으로 상상하게 하며, 녹음 순서와 음량이 내용을 이해하는 데 중요합니다.',
        analogy: '소리 이야기는 눈을 감고 듣는 그림책과 같습니다. 목소리와 효과음이 그림의 역할을 합니다.',
        warmup: '눈을 감고 교실에서 들리는 소리 세 가지를 찾아 무엇의 소리인지 맞혀 봅니다.',
        observe: '녹음 프로그램에서 녹음·정지·재생 버튼의 모양과 녹음 중 달라지는 표시를 찾습니다.',
        demo: '선생님이 제목을 말하고 효과음과 한 문장을 녹음한 뒤 재생해 음량을 확인하는 과정을 보여 줍니다.',
        guided: ['내 이름 대신 별명으로 “안녕하세요”를 녹음하고 정지·재생합니다.', '박수나 종이 소리를 짧게 녹음해 목소리와 음량을 비교합니다.'],
        design: '시작·사건·끝 카드마다 목소리 한 문장과 필요한 효과음을 그림으로 적습니다.',
        build: ['제목과 시작 장면을 녹음한 뒤 들어 보고 너무 작거나 큰 부분을 다시 녹음합니다.', '사건과 끝 장면을 차례로 녹음하고 장면 사이에 짧은 쉼을 둡니다.'],
        challenge: '목소리의 빠르기나 높낮이를 바꾸어 등장인물의 기분이 들리게 표현합니다.',
        test: '친구가 화면을 보지 않고도 시작·사건·끝을 말할 수 있는지 듣기 테스트를 합니다.',
        share: '소리 이야기를 들려주고 가장 잘 표현된 소리와 다시 녹음한 부분을 소개합니다.',
        promise: '다른 사람의 목소리는 허락 없이 녹음하거나 공유하지 않습니다.',
        teacherOpening: '화면을 보지 않고 짧은 효과음만 들려준 뒤 어떤 장면이 떠오르는지 이야기하게 해 주세요.',
        teacherCoaching: '녹음 전에 대사를 한 문장씩 소리 내어 연습합니다. 발음보다 순서와 자신 있는 표현을 우선 칭찬하고 실제 개인정보는 말하지 않게 합니다.',
        teacherExtension: '빠른 학생은 배경 효과음을 추가하거나 같은 문장을 기쁨과 걱정 두 감정으로 녹음해 차이를 비교합니다.',
    },
    {
        unitNumber: 9,
        title: '세 장면 디지털 그림책',
        emoji: '📖',
        keyword: '장면·순서·전환',
        goal: '그림·짧은 문장·소리를 세 장면에 배치해 처음–가운데–끝이 있는 디지털 그림책을 만듭니다.',
        materials: ['컴퓨터', '발표 또는 그림책 도구', '이야기 카드', '직접 만든 그림과 소리'],
        deliverable: '표지와 세 장면, 마지막 질문이 있는 디지털 그림책',
        completionCriteria: ['처음·가운데·끝의 사건을 순서대로 배치한다.', '각 장면에 그림과 짧은 문장을 읽기 좋게 넣는다.', '페이지 넘김을 테스트하고 친구에게 그림책을 읽어 준다.'],
        parentReport: '이야기의 처음–가운데–끝 구조를 이해하고, 그림과 짧은 문장을 장면별로 배치해 읽는 순서가 분명한 디지털 그림책을 완성했습니다.',
        concept: '디지털 그림책은 장면마다 한 가지 중요한 일을 보여 주고, 페이지 순서가 이어져 하나의 이야기가 됩니다.',
        analogy: '장면은 기차 칸과 같습니다. 칸의 순서를 바꾸면 도착하는 이야기의 모습도 달라집니다.',
        warmup: '섞여 있는 세 장의 그림 카드를 보고 처음·가운데·끝 순서로 나열합니다.',
        observe: '그림책 예시에서 표지·장면 그림·짧은 문장·페이지 넘김 버튼을 찾아봅니다.',
        demo: '선생님이 새 문서를 만들고 표지를 복제해 세 장면을 만든 뒤 그림과 한 문장을 넣는 과정을 보여 줍니다.',
        guided: ['표지에 제목과 작가 이름을 넣고 세 장면 페이지를 준비합니다.', '첫 장면에 주인공과 장소가 보이는 그림과 한 문장을 넣습니다.'],
        design: '주인공·장소·문제·해결을 고르고 세 칸 이야기 지도에 장면별 그림과 문장을 계획합니다.',
        build: ['가운데 장면에는 문제가 생기는 그림과 문장을 배치합니다.', '끝 장면에는 해결 모습과 친구에게 묻는 마지막 질문을 넣습니다.'],
        challenge: '직접 만든 소리나 간단한 전환 효과를 한 장면에만 넣어 이야기를 돕게 합니다.',
        test: '친구가 처음부터 끝까지 넘겨 보며 순서·글자 크기·그림 겹침을 확인하고 의견을 줍니다.',
        share: '그림책을 천천히 넘기며 세 장면을 읽고 가장 중요한 장면을 선택한 까닭을 말합니다.',
        promise: '효과를 많이 넣기보다 이야기를 이해하는 데 필요한 그림과 글을 먼저 생각합니다.',
        teacherOpening: '짧은 세 장면 그림을 일부러 순서를 바꾸어 보여 주고 무엇이 이상한지 찾게 해 주세요.',
        teacherCoaching: '글쓰기가 어려운 학생은 “누가–어디서–무엇을” 문장 틀을 사용합니다. 장면당 문장은 한두 문장으로 제한해 완성 경험을 우선합니다.',
        teacherExtension: '빠른 학생은 선택 버튼을 넣어 두 가지 끝 중 하나를 고르는 갈림길 그림책으로 확장합니다.',
    },
    {
        unitNumber: 10,
        title: '검색 탐정과 디지털 시민',
        emoji: '🔎',
        keyword: '검색어·비교·안전',
        goal: '궁금한 것을 좋은 검색어로 바꾸고 두 자료를 비교하며 개인정보·광고·온라인 예절을 함께 점검합니다.',
        materials: ['교사용 안전 검색 화면', '검색어 카드', '정보 비교표', '디지털 시민 약속 카드'],
        deliverable: '검색어 3개와 출처·안전 판단이 담긴 검색 탐정 보고서',
        completionCriteria: ['긴 질문에서 중요한 낱말을 골라 검색어를 만든다.', '두 자료의 제목·날짜·만든 곳을 비교한다.', '광고와 개인정보 상황에서 멈추고 도움을 요청한다.'],
        parentReport: '질문에서 핵심 낱말을 골라 검색어를 만들고, 두 자료의 만든 곳과 날짜를 비교하며 광고·개인정보 상황에서 안전하게 판단하는 연습을 했습니다.',
        concept: '검색은 정답을 바로 받는 일이 아니라 좋은 낱말로 자료를 찾고, 누가 언제 만든 정보인지 비교해 믿을 만한지 판단하는 과정입니다.',
        analogy: '검색어는 도서관 사서에게 건네는 보물 단서와 같고, 출처 확인은 보물 지도가 진짜인지 살피는 일과 같습니다.',
        warmup: '“우주에 가고 싶어요”처럼 긴 궁금증에서 우주·로켓 같은 중요한 낱말만 골라봅니다.',
        observe: '교사용 검색 결과 화면에서 제목·만든 곳·날짜·광고 표시가 있는 위치를 찾습니다.',
        demo: '선생님이 같은 주제를 두 가지 검색어로 찾고, 공공기관 자료와 광고성 자료의 표시를 비교하는 모습을 보여 줍니다.',
        guided: ['궁금한 질문 하나를 두세 낱말 검색어로 줄여 카드에 씁니다.', '두 자료에서 제목·만든 곳·날짜를 찾아 비교표에 표시합니다.'],
        design: '검색할 질문, 첫 검색어, 검색 결과가 어려울 때 바꿀 두 번째 검색어를 계획합니다.',
        build: ['교사가 허용한 검색 화면에서 자료 두 개를 골라 제목과 출처를 보고서에 적습니다.', '도움이 된 내용 한 가지와 아직 궁금한 점 한 가지를 내 말로 정리합니다.'],
        challenge: '광고·로그인 요구·개인정보 입력 상황 카드를 보고 멈춤·닫기·도움 요청 중 알맞은 행동을 표시합니다.',
        test: '친구와 검색어를 바꾸어 보고 결과가 주제와 맞는지, 출처가 보이는지 서로 확인합니다.',
        share: '가장 좋은 검색어와 믿을 만하다고 판단한 근거, 안전 약속 한 가지를 발표합니다.',
        promise: '검색 결과를 바로 믿거나 광고를 누르지 않고 만든 곳과 날짜를 먼저 확인합니다.',
        teacherOpening: '정답 찾기보다 단서 찾기 놀이로 시작하고, 저학년은 교사가 준비한 안전한 검색 결과 안에서만 활동하게 해 주세요.',
        teacherCoaching: '실제 자유 검색은 최소화하고 결과 화면을 미리 준비합니다. 출처 판단은 “누가 만들었나–언제 만들었나–광고인가” 세 질문으로 단순화합니다.',
        teacherExtension: '빠른 학생은 검색어의 낱말 하나를 바꾸어 결과 차이를 비교하고 더 좋은 검색어를 친구에게 추천합니다.',
    },
    {
        unitNumber: 11,
        title: '명령 카드로 길 찾기',
        emoji: '🧭',
        keyword: '순서·명령·알고리즘',
        goal: '목표를 작은 명령으로 나누고 순서대로 배열해 로봇이 길을 찾는 알고리즘을 만듭니다.',
        materials: ['방향 명령 카드', '바닥 격자 또는 활동지', '로봇 말', '컴퓨터'],
        deliverable: '시작점에서 보물까지 가는 명령 카드 알고리즘과 디지털 지도',
        completionCriteria: ['앞으로·왼쪽·오른쪽 명령을 구별한다.', '목표까지 가는 명령을 순서대로 배열하고 실행한다.', '틀린 지점을 찾아 명령 한 개 이상을 스스로 고친다.'],
        parentReport: '목표를 작은 명령으로 나누고 순서대로 배열해 실행했으며, 결과가 다를 때 틀린 명령을 찾아 수정하는 알고리즘 사고를 연습했습니다.',
        concept: '알고리즘은 목표를 이루기 위한 정확한 명령의 순서이며, 컴퓨터는 적힌 순서대로만 움직입니다.',
        analogy: '알고리즘은 요리법과 같습니다. 재료가 같아도 순서가 바뀌면 다른 결과가 나옵니다.',
        warmup: '친구 로봇에게 일어나기·두 걸음 걷기·돌기 명령을 말해 보고 정확한 말의 필요를 느껴봅니다.',
        observe: '앞으로·왼쪽·오른쪽·도착 명령 카드의 그림과 로봇이 바라보는 방향을 비교합니다.',
        demo: '선생님이 일부러 한 명령을 빼고 로봇을 움직인 뒤 결과를 보고 잘못된 지점을 찾는 모습을 보여 줍니다.',
        guided: ['세 칸 직선 길에 앞으로 명령 세 장을 순서대로 놓고 실행합니다.', '한 번 꺾이는 길에 회전 명령을 넣어 로봇이 바라보는 방향을 확인합니다.'],
        design: '시작점·보물·장애물을 지도에 배치하고 손가락으로 길을 따라가며 필요한 명령 수를 셉니다.',
        build: ['방향 명령 카드를 순서대로 놓고 친구 로봇이 그대로 실행하게 합니다.', '성공한 명령 순서를 디지털 지도에 화살표와 숫자로 옮깁니다.'],
        challenge: '장애물 하나를 추가하고 명령을 가장 적게 사용하는 새로운 길을 찾아봅니다.',
        test: '친구와 명령 카드를 바꾸어 실행하고 멈춘 위치에서 앞의 명령부터 하나씩 확인합니다.',
        share: '내 알고리즘의 명령 개수와 고친 명령, 더 짧은 길을 선택한 까닭을 설명합니다.',
        promise: '결과가 다르면 처음부터 다시 하기보다 어느 명령에서 달라졌는지 차례로 확인합니다.',
        teacherOpening: '교사가 로봇 역할을 맡아 애매한 명령을 일부러 엉뚱하게 실행하면 정확한 순서의 필요를 재미있게 느낄 수 있습니다.',
        teacherCoaching: '왼쪽·오른쪽이 어려우면 손목 색 스티커를 사용합니다. 아이가 직접 로봇이 되어 몸으로 실행한 뒤 카드로 옮기게 합니다.',
        teacherExtension: '빠른 학생은 두 경로의 명령 수를 비교하고 가장 짧은 알고리즘을 만들거나 친구에게 미로 문제를 냅니다.',
    },
    {
        unitNumber: 12,
        title: '엔트리 캐릭터 애니메이션',
        emoji: '🐱',
        keyword: '오브젝트·블록·실행',
        goal: '엔트리의 오브젝트와 시작·이동·말하기 블록을 연결해 짧은 자기소개 애니메이션을 만듭니다.',
        materials: ['컴퓨터', '엔트리', '블록 순서 카드', '캐릭터 설계 카드'],
        deliverable: '이동하고 인사하는 10초 자기소개 애니메이션',
        completionCriteria: ['오브젝트와 블록의 역할을 구별한다.', '시작–이동–말하기 블록을 연결해 실행한다.', '배경과 대사를 바꾸고 작품을 저장해 발표한다.'],
        parentReport: '엔트리에서 오브젝트와 블록의 역할을 이해하고, 시작–이동–말하기 명령을 연결해 자기소개 애니메이션을 제작했습니다.',
        concept: '엔트리에서는 캐릭터를 오브젝트라고 부르고, 블록을 위에서 아래로 연결하면 시작 신호에 따라 오브젝트가 움직이고 말합니다.',
        analogy: '오브젝트는 무대 위 배우이고 블록은 배우가 따라야 할 대본과 동작 지시입니다.',
        warmup: '친구와 배우·무대·대본 역할 카드를 나누고 한 문장 자기소개를 몸으로 표현합니다.',
        observe: '엔트리 화면에서 무대·오브젝트 목록·블록 꾸러미·실행 버튼을 찾아 역할을 말합니다.',
        demo: '선생님이 시작하기 버튼–이동하기–말하기 블록을 연결하고 실행 전후 오브젝트 변화를 보여 줍니다.',
        guided: ['시작하기 버튼을 클릭했을 때 블록을 놓고 이동하기 블록을 아래에 연결합니다.', '말하기 블록에 이름 대신 별명과 좋아하는 것을 입력해 실행합니다.'],
        design: '캐릭터·배경·등장 위치·이동 방향·자기소개 대사를 카드 한 장에 계획합니다.',
        build: ['원하는 오브젝트와 배경을 고르고 시작 위치를 정합니다.', '시작–이동–말하기 블록을 연결하고 숫자와 대사를 계획대로 바꿉니다.'],
        challenge: '기다리기와 모양 바꾸기 블록을 추가해 캐릭터가 자연스럽게 등장하도록 만듭니다.',
        test: '실행 버튼을 세 번 눌러 매번 처음 위치에서 시작하는지, 대사가 읽을 만큼 오래 보이는지 확인합니다.',
        share: '애니메이션을 실행하고 사용한 블록을 위에서 아래 순서대로 손가락으로 가리키며 설명합니다.',
        promise: '개인정보 대신 별명과 좋아하는 주제로 안전하게 자기소개합니다.',
        teacherOpening: '교실을 무대, 학생을 오브젝트, 선생님의 행동 카드를 블록으로 비유해 몸 활동 후 화면으로 옮겨 주세요.',
        teacherCoaching: '블록을 찾기 어려우면 색깔 꾸러미부터 찾게 하고 한 번에 한 블록만 연결합니다. 실행 전 시작 위치를 되돌리는 습관을 알려 줍니다.',
        teacherExtension: '빠른 학생은 두 오브젝트가 차례로 인사하거나 방송하기 블록 없이 기다리기를 활용해 대화처럼 보이게 만듭니다.',
    },
    {
        unitNumber: 13,
        title: '반복·조건 미니게임',
        emoji: '🎮',
        keyword: '반복·만일·점수',
        goal: '반복과 조건의 차이를 몸 활동으로 이해하고 키보드로 캐릭터를 움직여 별을 모으는 미니게임을 만듭니다.',
        materials: ['컴퓨터', '엔트리', '반복·조건 카드', '게임 설계 활동지'],
        deliverable: '키를 눌러 움직이고 별에 닿으면 점수가 오르는 미니게임',
        completionCriteria: ['반복과 조건을 생활 예로 설명한다.', '키 입력 이동과 닿았는가 조건을 블록으로 만든다.', '게임을 세 번 테스트하고 오류 또는 난이도를 한 번 수정한다.'],
        parentReport: '반복과 조건의 차이를 생활 속 예와 연결하고, 키 입력과 닿기 조건을 활용해 점수가 변하는 간단한 미니게임을 제작했습니다.',
        concept: '반복은 같은 행동을 여러 번 시키는 명령이고, 조건은 만약 어떤 일이 일어났을 때만 행동하게 하는 약속입니다.',
        analogy: '반복은 줄넘기를 열 번 하는 것, 조건은 비가 오면 우산을 펴는 것과 같습니다.',
        warmup: '박수 두 번을 세 번 반복하고, 선생님이 별 카드를 들었을 때만 점프하는 몸 코딩을 합니다.',
        observe: '예시 게임을 실행하며 계속 일어나는 행동과 별에 닿았을 때만 일어나는 행동을 나누어 봅니다.',
        demo: '선생님이 키를 눌렀을 때 이동하기와 별에 닿았는가 조건, 점수 더하기 블록을 차례로 연결합니다.',
        guided: ['오른쪽·왼쪽 키를 눌렀을 때 캐릭터가 움직이도록 두 조건을 만듭니다.', '별 오브젝트를 놓고 닿았을 때 점수에 1을 더하도록 연결합니다.'],
        design: '게임 이름·주인공·모을 물건·조작 키·이기는 점수를 설계 활동지에 정합니다.',
        build: ['캐릭터 이동 블록과 화면 가장자리 규칙을 만들고 여러 번 실행합니다.', '별에 닿으면 점수가 오르고 별이 다른 위치로 이동하도록 만듭니다.'],
        challenge: '시간 제한·장애물·보너스 점수 중 하나를 선택해 난이도를 조절합니다.',
        test: '친구가 설명 없이 세 번 플레이하고 조작하기 어려운 점과 재미있는 점을 각각 말하게 합니다.',
        share: '게임 규칙과 반복 또는 조건 블록 하나를 보여 주고 테스트 후 바꾼 부분을 설명합니다.',
        promise: '게임이 바로 되지 않아도 블록을 위에서 아래로 하나씩 확인하고 수정합니다.',
        teacherOpening: '몸으로 반복과 조건을 충분히 경험한 뒤 화면 블록 색과 연결해 주세요. 점수보다 규칙이 작동하는 경험을 우선합니다.',
        teacherCoaching: '좌우 이동 두 방향만 먼저 완성한 뒤 별 조건을 추가합니다. 오류가 나면 조건 블록 안쪽과 반복 블록 위치를 함께 손가락으로 추적합니다.',
        teacherExtension: '빠른 학생은 난이도 선택 버튼이나 최고 점수 변수를 추가하고 쉬운 모드와 어려운 모드를 비교합니다.',
    },
    {
        unitNumber: 14,
        title: '나의 융합 작품 제작소',
        emoji: '🛠️',
        keyword: '기획·제작·피드백',
        goal: '그림·글·소리·코딩 중 두 가지 이상을 골라 나만의 문제나 이야기를 담은 최종 작품을 기획하고 제작합니다.',
        materials: ['컴퓨터', '엔트리 또는 미디어 도구', '프로젝트 기획서', '테스트 체크리스트'],
        deliverable: '그림·글·소리·코딩이 두 가지 이상 결합된 최종 프로젝트 1차 완성본',
        completionCriteria: ['누구에게 무엇을 보여 줄 작품인지 기획서에 적는다.', '두 가지 이상의 디지털 표현 방법을 연결한다.', '친구 테스트를 받고 중요한 부분을 한 번 이상 수정한다.'],
        parentReport: '작품의 사용자와 목적을 먼저 정하고 그림·글·소리·코딩 중 두 가지 이상을 연결해 최종 프로젝트를 제작하고 피드백으로 개선했습니다.',
        concept: '융합 작품은 여러 기능을 많이 넣는 것이 아니라 전하고 싶은 생각에 알맞은 그림·글·소리·움직임을 골라 함께 작동하게 만드는 작품입니다.',
        analogy: '융합 작품은 도시락과 같습니다. 좋아하는 음식만 가득 넣기보다 서로 어울리는 재료를 골라야 맛있는 한 끼가 됩니다.',
        warmup: '지금까지 만든 작품 사진을 보며 가장 다시 만들고 싶은 것과 새로 더하고 싶은 기능을 고릅니다.',
        observe: '예시 작품에서 그림·글·소리·코딩 요소를 색 스티커로 표시하고 각 요소가 하는 일을 말합니다.',
        demo: '선생님이 “친구에게 안전 약속 알려 주기” 목표를 정하고 버튼·그림·목소리를 고르는 기획 과정을 보여 줍니다.',
        guided: ['누가 볼 작품인지와 작품을 보고 무엇을 느끼거나 하길 바라는지 한 문장으로 씁니다.', '필요한 기능을 꼭 필요·있으면 좋음 두 칸으로 나누어 우선순위를 정합니다.'],
        design: '작품 제목·사용자·목표·화면 순서·필요한 자료·안전 확인을 한 장 기획서에 완성합니다.',
        build: ['가장 중요한 첫 화면과 핵심 기능부터 만들고 저장한 뒤 실행해 봅니다.', '두 번째 표현 요소를 연결하고 제목·사용 방법·만든 사람을 넣습니다.'],
        challenge: '친구 한 명이 작품을 처음 사용해도 알 수 있도록 안내 버튼이나 음성·그림 설명을 추가합니다.',
        test: '친구가 말없이 작품을 사용하도록 관찰하고 멈춘 곳, 헷갈린 곳, 좋아한 곳을 체크합니다.',
        share: '기획서와 1차 완성본을 함께 보여 주고 테스트 후 무엇을 왜 바꾸었는지 설명합니다.',
        promise: '기능을 계속 늘리기보다 작품의 목표가 잘 보이는지 먼저 확인합니다.',
        teacherOpening: '학생이 이전 수업에서 가장 즐거웠던 기능을 고르게 하되, 최종 작품의 사용자와 목적을 먼저 정하도록 질문해 주세요.',
        teacherCoaching: '선택이 어려운 학생에게 그림책형·퀴즈형·게임형 세 가지 틀을 제시합니다. 핵심 기능 하나를 먼저 성공시킨 뒤 꾸미기로 넘어갑니다.',
        teacherExtension: '빠른 학생은 시작 안내·다시 하기·끝 화면을 추가하고 다른 학년 학생이 사용해도 이해할 수 있는지 테스트합니다.',
    },
    {
        unitNumber: 15,
        title: '디지털 창작자 발표회',
        emoji: '🏆',
        keyword: '완성·발표·성장',
        goal: '최종 작품을 점검해 완성하고 작품의 목표·만든 과정·고친 점을 발표하며 15회차 성장을 돌아봅니다.',
        materials: ['최종 프로젝트', '발표 카드', '작품 점검표', '친구 피드백 카드'],
        deliverable: '완성 프로젝트와 1분 작가 발표, 디지털 창작자 성장 카드',
        completionCriteria: ['작품의 시작·핵심 기능·끝을 직접 점검한다.', '목표·만든 방법·고친 점을 1분 안에 발표한다.', '친구 피드백과 나의 다음 목표를 성장 카드에 남긴다.'],
        parentReport: '15회차 동안 배운 디지털 도구와 코딩 사고를 활용해 최종 작품을 완성하고, 제작 과정과 수정 경험을 자신의 말로 발표했습니다.',
        concept: '좋은 발표는 작품을 자랑하는 시간만이 아니라 왜 만들었는지, 어떻게 해결했는지, 무엇을 고쳤는지를 다른 사람과 나누는 시간입니다.',
        analogy: '발표회는 운동회의 결승선과 같습니다. 빨리 도착한 것보다 연습하며 자란 과정을 함께 돌아봅니다.',
        warmup: '첫 수업 탐험 지도와 지금 작품을 비교하며 새롭게 할 수 있게 된 일을 손가락으로 세어 봅니다.',
        observe: '좋은 발표 예시에서 눈맞춤·또렷한 목소리·작품 시범·고친 점이 나오는 부분을 찾습니다.',
        demo: '선생님이 1분 발표 카드에 작품 목표·핵심 기능·어려움과 해결·다음 목표를 적고 시범 발표합니다.',
        guided: ['작품을 처음부터 끝까지 실행하며 글자·소리·버튼·이동을 점검표로 확인합니다.', '발표 카드 네 칸에 짧은 낱말을 적고 작품을 가리키며 한 번 연습합니다.'],
        design: '발표 순서와 보여 줄 화면, 친구에게 받고 싶은 질문을 정하고 내 작품 전시 자리를 준비합니다.',
        build: ['테스트에서 발견한 가장 중요한 문제를 한 가지 고쳐 최종본으로 저장합니다.', '작품 제목 카드와 사용 방법, 출처나 안전 약속이 필요한 부분을 마지막으로 확인합니다.'],
        challenge: '발표를 1분 안에 마치되 작품의 목표와 고친 점이 꼭 들리도록 스스로 시간을 재어 연습합니다.',
        test: '짝과 모의 발표를 하고 듣는 친구가 목표와 사용 방법을 말할 수 있는지 확인합니다.',
        share: '발표회에서 작품을 시연하고 친구 질문에 답한 뒤 구체적인 칭찬과 피드백을 한 가지씩 받습니다.',
        promise: '성장 카드에 가장 자랑스러운 변화와 다음에 만들고 싶은 작품을 적고 디지털 창작자 약속을 읽습니다.',
        teacherOpening: '완성도 순위를 매기기보다 각 학생의 처음과 지금을 비교하는 성장 발표회라고 안내해 주세요.',
        teacherCoaching: '말하기가 어려운 학생은 발표 카드를 읽거나 교사와 문답 형식으로 발표할 수 있게 합니다. 작동 오류가 생겨도 영상이나 화면 캡처로 과정을 설명할 수 있게 준비합니다.',
        teacherExtension: '빠른 학생은 관람객 질문을 받아 즉석에서 작은 개선을 하거나 다음 버전 기능을 우선순위로 정해 발표합니다.',
    },
];

const DIGITAL_CREATOR_UNITS = DIGITAL_CREATOR_BLUEPRINTS.map(createUnit);

export const KIDS_IT_CHAPTERS: Chapter[] = [
    {
        id: 'digital-creator-v2-stage-1',
        chapterNumber: 1,
        title: '1단계 | 디지털 도구 탐험가',
        icon: 'computer',
        description: '컴퓨터·마우스·키보드·파일·그림 도구를 안전하게 사용하고 매회 작은 결과물을 완성합니다.',
        ageLevel: 'elementary',
        recommendedGrade: '초등 1~2학년',
        units: DIGITAL_CREATOR_UNITS.slice(0, 5),
    },
    {
        id: 'digital-creator-v2-stage-2',
        chapterNumber: 2,
        title: '2단계 | 미디어 이야기 작가',
        icon: 'auto_stories',
        description: '픽셀·사진·소리·디지털 그림책·안전 검색을 연결해 생각을 미디어 이야기로 표현합니다.',
        ageLevel: 'elementary',
        recommendedGrade: '초등 1~2학년',
        units: DIGITAL_CREATOR_UNITS.slice(5, 10),
    },
    {
        id: 'digital-creator-v2-stage-3',
        chapterNumber: 3,
        title: '3단계 | 코딩 창작자',
        icon: 'extension',
        description: '순서·반복·조건을 몸과 엔트리로 익히고 최종 융합 작품을 제작해 발표합니다.',
        ageLevel: 'elementary',
        recommendedGrade: '초등 1~2학년',
        units: DIGITAL_CREATOR_UNITS.slice(10, 15),
    },
];
