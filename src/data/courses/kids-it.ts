import type { Chapter, LearningActivity, LessonPackage, Page, TeacherGuide, Unit } from './types';

interface KidsSlide {
    title: string;
    idea: string;
    analogy: string;
    practice: string[];
    remember: string;
    activity?: LearningActivity;
}

interface KidsUnitDef {
    id: string;
    unitNumber: number;
    title: string;
    bookLabel: string;
    slides: KidsSlide[];
    lessonPackage?: LessonPackage;
    teacherOpening?: string;
    teacherCoaching?: string;
    teacherExtension?: string;
}

const PAGE_TYPE = '페이지' as const;
const UNIT_TYPE = '종합' as const;

const DIGITAL_CREATOR_UNIT_META = [
    { title: '컴퓨터 탐험가 되기', goal: '화면·아이콘·버튼을 관찰하고 안전한 사용 약속을 정해요.' },
    { title: '창과 아이콘 움직이기', goal: '클릭·더블클릭·창 이동으로 필요한 프로그램을 찾아요.' },
    { title: '마우스와 터치로 그리기', goal: '클릭·드래그·스크롤을 사용해 간단한 그림을 만들어요.' },
    { title: '키보드로 이야기 쓰기', goal: '한글·숫자·기호를 입력하고 짧은 디지털 이야기를 써요.' },
    { title: '내 작품 저장소 만들기', goal: '파일 이름과 폴더 규칙을 정해 작품을 저장하고 다시 찾아요.' },
    { title: '그림과 사진으로 표현하기', goal: '그림과 사진을 고르고 배치해 한 장의 메시지를 만들어요.' },
    { title: '소리와 영상으로 이야기하기', goal: '소리·장면·재생 순서를 연결해 짧은 미디어 이야기를 만들어요.' },
    { title: '안전하게 검색하고 발견하기', goal: '검색어를 고르고 믿을 만한 정보를 안전하게 찾아요.' },
    { title: '디지털 시민 안전 미션', goal: '개인정보·비밀번호·온라인 예절을 상황 미션으로 연습해요.' },
    { title: '문제 해결 탐정단', goal: '관찰–확인–다시 시도–도움 요청 순서로 문제를 해결해요.' },
    { title: '코딩 설계도 그리기', goal: '목표·재료·순서·조건을 그림 설계도로 표현해요.' },
    { title: '순서와 반복으로 움직이기', goal: '명령의 순서와 반복 패턴으로 캐릭터 움직임을 설계해요.' },
    { title: '나만의 디지털 작품 만들기', goal: '글·그림·버튼·소리를 조합해 나만의 작품을 완성해요.' },
    { title: '작품 발표회 준비하기', goal: '작품을 테스트하고 고친 뒤 친구에게 설명할 발표를 준비해요.' },
    { title: '디지털 창작자 프로젝트 발표', goal: '완성 작품을 발표하고 피드백과 성장 기록을 남겨요.' },
] as const;

function getUnitMeta(unitNumber: number) {
    return DIGITAL_CREATOR_UNIT_META[unitNumber - 1] ?? {
        title: `디지털 창작 ${unitNumber}회차`,
        goal: '디지털 도구를 안전하게 사용해 생각을 작품으로 표현해요.',
    };
}

function getStageLabel(unitNumber: number) {
    if (unitNumber <= 5) return '1단계 · 컴퓨터 탐험가';
    if (unitNumber <= 10) return '2단계 · 미디어 스토리텔러';
    return '3단계 · 코딩·디지털 창작자';
}

function getLessonPhase(pageNumber: number) {
    if (pageNumber <= 2) return { label: '알아보기', time: '20분' };
    if (pageNumber <= 5) return { label: '따라 하기', time: '35분' };
    if (pageNumber <= 8) return { label: '창작 미션', time: '45분' };
    return { label: '발표·기록', time: '20분' };
}

function getPhaseCue(pageNumber: number) {
    if (pageNumber <= 2) return '먼저 보고 말해요';
    if (pageNumber <= 5) return '선생님과 함께 한 단계씩 해요';
    if (pageNumber <= 8) return '내 생각을 넣어 작품으로 만들어요';
    return '친구에게 보여주고 성장 기록을 남겨요';
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function makePage(unit: KidsUnitDef, slide: KidsSlide, pageIndex: number): Page {
    const pageNumber = pageIndex + 1;
    const legacySlideNumber = (unit.unitNumber - 1) * 10 + pageNumber;
    const unitMeta = getUnitMeta(unit.unitNumber);
    const phase = getLessonPhase(pageNumber);
    const lessonPlan = pageNumber === 1 ? `
        <div class="kids-it-plan">
            <strong>오늘의 120분</strong>
            <span>알아보기 20분</span><i>→</i><span>따라 하기 35분</span><i>→</i><span>창작 미션 45분</span><i>→</i><span>발표·기록 20분</span>
        </div>
    ` : '';
    const packageSummary = pageNumber === 1 && unit.lessonPackage ? `
        <div class="kids-it-toolkit">
            <article><span>준비물</span><p>${unit.lessonPackage.materials.map(escapeHtml).join(' · ')}</p></article>
            <article><span>오늘의 결과물</span><p>${escapeHtml(unit.lessonPackage.deliverable)}</p></article>
            <article><span>완료 기준</span><p>${escapeHtml(unit.lessonPackage.completionCriteria[0])}</p></article>
        </div>
    ` : '';
    const lessonWrapUp = pageNumber === unit.slides.length && unit.lessonPackage ? `
        <div class="kids-it-finish">
            <span>오늘의 완성 체크</span>
            <ul>${unit.lessonPackage.completionCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            <p><b>학부모 리포트 문장</b>${escapeHtml(unit.lessonPackage.parentReport)}</p>
        </div>
    ` : '';
    const teacherGuide: TeacherGuide | undefined = unit.lessonPackage ? {
        objective: slide.idea,
        say: `${unit.teacherOpening ?? '오늘 배울 내용을 실제 화면과 연결해 설명해 주세요.'} ${slide.analogy}`,
        questions: [
            `${slide.title}에서 가장 먼저 보이는 것은 무엇인가요?`,
            slide.practice[0] ?? '직접 해 본 방법을 말해 볼까요?',
        ],
        expectedAnswer: slide.remember,
        coaching: unit.teacherCoaching ?? '아이에게 먼저 화면을 가리켜 보게 하고, 필요한 경우 손동작을 천천히 시범 보입니다.',
        extension: unit.teacherExtension ?? '빠르게 끝낸 학생은 같은 기능을 다른 방법으로 한 번 더 설명하게 합니다.',
        assessment: slide.practice,
    } : undefined;

    return {
        id: `kids-it-first-${String(legacySlideNumber).padStart(3, '0')}`,
        title: `${unitMeta.title} ${pageNumber}`,
        type: PAGE_TYPE,
        content: `
            <section class="kids-it-slide kids-it-textbook">
                <div class="kids-it-doodle kids-it-doodle-star">★</div>
                <div class="kids-it-doodle kids-it-doodle-cloud">☁</div>
                <div class="kids-it-doodle kids-it-doodle-plane">➤</div>
                <header class="kids-it-textbook-top">
                    <div class="kids-it-textbook-brand"><small>CODING SSOK ACADEMY</small><b>디지털 창작자</b></div>
                    <div class="kids-it-phase"><b>${phase.label}</b><span>${phase.time}</span></div>
                </header>
                <div class="kids-it-mission-ribbon">오늘의 미션</div>
                <div class="kids-it-title-row">
                    <div>
                        <p class="kids-it-kicker">${getStageLabel(unit.unitNumber)} · ${pageNumber}/${unit.slides.length}</p>
                        <h2>${escapeHtml(slide.title)}</h2>
                        <p class="kids-it-cue">${getPhaseCue(pageNumber)}</p>
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
                    <img src="/images/courses/digital-creator-textbook-v1.png" alt="친구들과 로봇이 디지털 작품을 만드는 모습" class="kids-it-illustration" />
                </section>
                <div class="kids-it-action-grid">
                    <article class="kids-it-action kids-it-action-make">
                        <span class="kids-it-section-title"><i>🧩</i> 만들기</span>
                        <div class="kids-it-step-number">1</div>
                        <p>${escapeHtml(slide.practice[0] ?? slide.remember)}</p>
                        <div class="kids-it-write-line"></div>
                    </article>
                    <article class="kids-it-action kids-it-action-challenge">
                        <span class="kids-it-section-title"><i>⚑</i> 도전하기</span>
                        <div class="kids-it-step-number">2</div>
                        <p>${escapeHtml(slide.practice[1] ?? slide.remember)}</p>
                        <div class="kids-it-write-line"></div>
                    </article>
                </div>
                ${lessonPlan}
                ${packageSummary}
                <div class="kids-it-remember kids-it-record-box">
                    <strong><i>📋</i> 수업 기록</strong>
                    <p>${escapeHtml(slide.remember)}</p>
                    <div class="kids-it-stars"><span>☆</span><span>☆</span><span>☆</span></div>
                </div>
                ${lessonWrapUp}
            </section>
        `,
        activity: slide.activity,
        teacherGuide,
    };
}

function makeUnit(def: KidsUnitDef): Unit {
    const unitMeta = getUnitMeta(def.unitNumber);
    return {
        id: def.id,
        unitNumber: def.unitNumber,
        title: unitMeta.title,
        subtitle: `${unitMeta.goal} · 알아보기 20분 · 따라 하기 35분 · 창작 미션 45분 · 발표·기록 20분`,
        type: UNIT_TYPE,
        difficulty: 1,
        duration: '120분',
        pages: def.slides.map((slide, index) => makePage(def, slide, index)),
        lessonPackage: def.lessonPackage,
    };
}

const LEGACY_BOOK1_UNITS: Unit[] = [
    makeUnit({
        id: 'kids-it-first-u01',
        unitNumber: 1,
        title: '컴퓨터와 화면 첫 만남',
        bookLabel: '1권 | 컴퓨터와 화면 첫걸음',
        slides: [
            {
                title: '컴퓨터는 무엇을 도와줄까요?',
                idea: '컴퓨터는 그림 그리기, 글쓰기, 영상 보기처럼 여러 일을 도와주는 똑똑한 도구입니다.',
                analogy: '컴퓨터는 장난감 상자처럼 여러 도구가 한곳에 모여 있는 상자라고 생각해요.',
                practice: ['컴퓨터로 할 수 있는 일을 세 가지 말해 봅니다.', '오늘 배우고 싶은 일을 하나 고릅니다.'],
                remember: '컴퓨터는 내가 하고 싶은 일을 도와주는 도구입니다.',
            },
            {
                title: '화면은 컴퓨터의 얼굴이에요',
                idea: '화면에는 컴퓨터가 지금 무엇을 보여주는지 나타납니다.',
                analogy: '화면은 이야기책의 펼쳐진 쪽처럼, 지금 볼 내용을 보여주는 곳입니다.',
                practice: ['화면에서 가장 먼저 보이는 그림이나 글자를 찾아봅니다.', '어른과 함께 밝기가 너무 강하지 않은지 확인합니다.'],
                remember: '화면은 컴퓨터가 나에게 보여주는 얼굴입니다.',
            },
            {
                title: '바탕화면을 둘러봐요',
                idea: '바탕화면은 여러 프로그램과 파일을 찾기 시작하는 첫 장소입니다.',
                analogy: '바탕화면은 책상 위처럼 자주 쓰는 물건을 올려두는 자리입니다.',
                practice: ['바탕화면에 어떤 그림이 있는지 천천히 봅니다.', '모르는 것은 누르기 전에 이름을 읽어 봅니다.'],
                remember: '바탕화면은 컴퓨터 책상입니다.',
            },
            {
                title: '아이콘은 작은 표지판이에요',
                idea: '아이콘은 프로그램이나 파일을 그림으로 알려주는 표시입니다.',
                analogy: '아이콘은 문 앞 이름표처럼, 안에 무엇이 있는지 알려줍니다.',
                practice: ['같은 모양 아이콘을 찾아봅니다.', '아이콘 아래 글자를 소리 내어 읽어 봅니다.'],
                remember: '아이콘은 무엇인지 알려주는 작은 표지판입니다.',
            },
            {
                title: '창은 열고 닫을 수 있어요',
                idea: '창은 프로그램이나 파일이 열렸을 때 보이는 네모난 공간입니다.',
                analogy: '창은 종이 한 장을 책상에 올려둔 것과 비슷합니다.',
                practice: ['창의 위쪽 막대를 찾아봅니다.', '닫기 버튼은 어른과 함께 확인합니다.'],
                remember: '창은 컴퓨터 안에서 열린 종이입니다.',
            },
            {
                title: '버튼은 누르면 일이 시작돼요',
                idea: '버튼을 누르면 저장, 닫기, 다음처럼 정해진 일이 실행됩니다.',
                analogy: '버튼은 엘리베이터 버튼처럼 누르면 약속된 행동을 합니다.',
                practice: ['화면에서 버튼처럼 보이는 곳을 찾아봅니다.', '누르기 전에는 버튼의 글자를 먼저 읽습니다.'],
                remember: '버튼은 컴퓨터에게 부탁하는 작은 스위치입니다.',
            },
            {
                title: '메뉴는 고르는 목록이에요',
                idea: '메뉴에는 컴퓨터가 할 수 있는 여러 선택지가 모여 있습니다.',
                analogy: '메뉴는 식당 메뉴판처럼 무엇을 할지 고르는 표입니다.',
                practice: ['화면 위나 옆에서 메뉴 모양을 찾아봅니다.', '한 번에 하나만 천천히 골라 봅니다.'],
                remember: '메뉴는 선택할 일을 모아 둔 목록입니다.',
            },
            {
                title: '스크롤로 아래를 볼 수 있어요',
                idea: '내용이 화면보다 길면 스크롤을 해서 위아래로 움직입니다.',
                analogy: '스크롤은 긴 그림책을 아래로 조금씩 펼치는 것과 같습니다.',
                practice: ['손가락이나 휠로 조금만 움직여 봅니다.', '너무 빨리 움직이면 다시 천천히 올려 봅니다.'],
                remember: '스크롤은 긴 내용을 천천히 넘기는 방법입니다.',
            },
            {
                title: '전체 화면과 작은 창을 알아봐요',
                idea: '창은 크게 보거나 작게 보며 화면 공간을 조절할 수 있습니다.',
                analogy: '그림을 가까이 보면 크게 보이고, 멀리 두면 작게 보이는 것과 비슷합니다.',
                practice: ['창이 화면을 가득 채웠는지 살펴봅니다.', '작은 창이 겹쳐 있으면 앞뒤를 찾아봅니다.'],
                remember: '창 크기는 내가 보기 편하게 바꿀 수 있습니다.',
            },
            {
                title: '안전하게 시작하는 약속',
                idea: '모르는 버튼이나 광고는 혼자 누르지 않고 어른에게 물어봅니다.',
                analogy: '처음 가는 길에서 보호자 손을 잡는 것처럼, 컴퓨터에서도 도움을 요청해요.',
                practice: ['모르는 창이 나오면 멈추고 읽습니다.', '이름, 전화번호, 주소는 혼자 입력하지 않습니다.'],
                remember: '모르면 멈추고 물어보는 것이 가장 안전합니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u02',
        unitNumber: 2,
        title: '아이콘과 창 다루기',
        bookLabel: '1권 | 컴퓨터와 화면 첫걸음',
        slides: [
            {
                title: '아이콘 이름을 읽어 봐요',
                idea: '아이콘 아래 이름을 읽으면 무엇을 여는지 더 잘 알 수 있습니다.',
                analogy: '이름표를 보면 친구 이름을 알 수 있는 것과 같습니다.',
                practice: ['아이콘 하나를 고르고 이름을 읽습니다.', '그림과 이름이 어떻게 연결되는지 말해 봅니다.'],
                remember: '아이콘은 그림과 이름을 함께 봅니다.',
            },
            {
                title: '한 번 클릭과 두 번 클릭',
                idea: '한 번 클릭은 고르기, 두 번 클릭은 열기에 많이 사용합니다.',
                analogy: '한 번 똑똑은 부르기, 두 번 똑똑은 문 열기 신호처럼 생각해요.',
                practice: ['아이콘을 한 번 눌러 선택 표시를 봅니다.', '어른과 함께 두 번 클릭으로 열어 봅니다.'],
                remember: '클릭 횟수에 따라 컴퓨터가 다르게 반응합니다.',
            },
            {
                title: '창을 앞으로 가져오기',
                idea: '여러 창이 있으면 누른 창이 앞쪽으로 나옵니다.',
                analogy: '책상 위 종이 중 하나를 맨 위에 올리는 것과 같습니다.',
                practice: ['겹친 창이 있다면 제목 부분을 눌러 봅니다.', '앞에 나온 창의 제목을 읽습니다.'],
                remember: '보고 싶은 창을 누르면 앞으로 나옵니다.',
            },
            {
                title: '창을 움직여 봐요',
                idea: '창 위쪽 막대를 잡고 움직이면 위치를 바꿀 수 있습니다.',
                analogy: '종이를 손으로 밀어 책상 위 위치를 바꾸는 것과 비슷합니다.',
                practice: ['창의 제목 막대를 찾습니다.', '마우스를 누른 채 조금 옮겨 봅니다.'],
                remember: '제목 막대를 잡으면 창을 옮길 수 있습니다.',
            },
            {
                title: '창 크기를 바꿔 봐요',
                idea: '창의 모서리를 잡으면 크게 또는 작게 만들 수 있습니다.',
                analogy: '고무줄을 살짝 늘리면 모양이 커지는 것과 비슷합니다.',
                practice: ['창 모서리에 마우스를 가져갑니다.', '화살표 모양이 보이면 천천히 움직입니다.'],
                remember: '모서리는 창 크기를 바꾸는 손잡이입니다.',
            },
            {
                title: '닫기 버튼은 마지막에 눌러요',
                idea: '닫기 버튼을 누르면 지금 보던 창이 사라집니다.',
                analogy: '책을 덮으면 지금 읽던 쪽이 보이지 않는 것과 같습니다.',
                practice: ['닫기 버튼이 어디 있는지 찾아봅니다.', '저장해야 할 것이 있는지 먼저 확인합니다.'],
                remember: '닫기 전에는 저장했는지 생각합니다.',
            },
            {
                title: '최소화는 잠깐 숨기기예요',
                idea: '최소화는 창을 닫지 않고 아래쪽에 잠시 숨기는 기능입니다.',
                analogy: '장난감을 버리지 않고 서랍에 잠깐 넣어 두는 것과 같습니다.',
                practice: ['최소화 버튼을 찾아봅니다.', '아래쪽 작업 표시줄에서 다시 열어 봅니다.'],
                remember: '최소화는 닫기가 아니라 잠깐 숨기기입니다.',
            },
            {
                title: '여러 창을 차례대로 봐요',
                idea: '여러 창이 열려도 하나씩 차례대로 보면 헷갈리지 않습니다.',
                analogy: '줄을 서서 한 명씩 이야기하면 잘 들리는 것과 같습니다.',
                practice: ['열린 창이 몇 개인지 세어 봅니다.', '필요 없는 창은 어른과 함께 닫습니다.'],
                remember: '창이 많을수록 천천히 하나씩 봅니다.',
            },
            {
                title: '잘못 눌렀을 때 멈추기',
                idea: '잘못 눌렀다고 느끼면 더 누르지 말고 화면을 먼저 살펴봅니다.',
                analogy: '블록을 잘못 끼웠을 때 잠깐 멈추고 모양을 보는 것과 같습니다.',
                practice: ['새 창이 뜨면 제목을 읽습니다.', '무서운 문구가 보이면 어른에게 보여줍니다.'],
                remember: '잘못 눌렀을 때는 멈추는 힘이 중요합니다.',
            },
            {
                title: '아이콘과 창 정리하기',
                idea: '자주 쓰는 것과 지금 필요 없는 것을 구분하면 화면이 깔끔해집니다.',
                analogy: '놀이가 끝난 뒤 블록을 통에 넣으면 다음에 찾기 쉽습니다.',
                practice: ['열린 창을 하나씩 확인합니다.', '오늘 사용한 프로그램 이름을 말해 봅니다.'],
                remember: '정리된 화면은 찾기 쉬운 책상과 같습니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u03',
        unitNumber: 3,
        title: '마우스와 터치 조작',
        bookLabel: '1권 | 컴퓨터와 화면 첫걸음',
        slides: [
            {
                title: '마우스는 손가락 길잡이예요',
                idea: '마우스를 움직이면 화면의 화살표도 함께 움직입니다.',
                analogy: '마우스는 화면 위를 달리는 작은 자동차를 운전하는 손잡이입니다.',
                practice: ['마우스를 천천히 움직여 화살표를 봅니다.', '화살표를 원하는 아이콘 가까이 데려갑니다.'],
                remember: '마우스를 움직이면 화면의 포인터가 움직입니다.',
            },
            {
                title: '포인터를 목표에 맞춰요',
                idea: '누르기 전에 포인터가 정확히 어디에 있는지 확인합니다.',
                analogy: '공을 던지기 전에 바구니를 보는 것과 같습니다.',
                practice: ['작은 버튼 위에 포인터를 올려 봅니다.', '포인터 모양이 바뀌는지 관찰합니다.'],
                remember: '먼저 가리키고, 그다음 누릅니다.',
            },
            {
                title: '왼쪽 클릭은 선택하기',
                idea: '왼쪽 버튼 클릭은 가장 많이 쓰는 기본 선택 방법입니다.',
                analogy: '손가락으로 이것이라고 콕 집는 행동과 비슷합니다.',
                practice: ['아이콘 하나를 왼쪽 클릭합니다.', '선택 표시가 생겼는지 봅니다.'],
                remember: '왼쪽 클릭은 고르기입니다.',
            },
            {
                title: '두 번 클릭은 열기',
                idea: '아이콘을 빠르게 두 번 클릭하면 프로그램이나 파일이 열립니다.',
                analogy: '문을 똑똑 두 번 두드리면 들어가도 되는지 묻는 느낌입니다.',
                practice: ['어른과 함께 두 번 클릭을 연습합니다.', '너무 느리면 한 번씩만 선택될 수 있음을 봅니다.'],
                remember: '두 번 클릭은 열기 신호입니다.',
            },
            {
                title: '오른쪽 클릭은 도움 메뉴',
                idea: '오른쪽 클릭을 하면 추가로 할 수 있는 메뉴가 나옵니다.',
                analogy: '비밀 주머니를 열면 더 많은 도구가 나오는 것과 같습니다.',
                practice: ['바탕화면 빈 곳에서 오른쪽 클릭을 봅니다.', '메뉴가 나오면 아무것도 누르지 않고 닫아 봅니다.'],
                remember: '오른쪽 클릭은 더 많은 선택지를 보여줍니다.',
            },
            {
                title: '드래그는 잡고 옮기기',
                idea: '버튼을 누른 채 움직이면 물건을 끌어서 옮길 수 있습니다.',
                analogy: '종이를 손가락으로 잡고 다른 자리로 밀어 놓는 것과 같습니다.',
                practice: ['간단한 그림판에서 선을 그어 봅니다.', '아이콘은 함부로 옮기지 않고 연습 공간에서만 해 봅니다.'],
                remember: '드래그는 잡고 움직이기입니다.',
            },
            {
                title: '휠은 위아래 이동',
                idea: '마우스 휠을 굴리면 긴 화면을 위아래로 볼 수 있습니다.',
                analogy: '두루마리 종이를 조금씩 펼치는 것과 비슷합니다.',
                practice: ['긴 페이지에서 휠을 한 칸씩 굴립니다.', '너무 멀리 가면 반대로 굴려 돌아옵니다.'],
                remember: '휠은 긴 화면을 넘기는 바퀴입니다.',
            },
            {
                title: '터치는 손가락 클릭이에요',
                idea: '터치 화면에서는 손가락으로 직접 눌러 선택합니다.',
                analogy: '종이 위 그림을 손가락으로 콕 누르는 것과 같습니다.',
                practice: ['손끝으로 가볍게 한 번 터치합니다.', '세게 누르지 않아도 되는지 확인합니다.'],
                remember: '터치는 손가락으로 하는 클릭입니다.',
            },
            {
                title: '밀기와 벌리기',
                idea: '손가락을 밀면 화면이 움직이고, 두 손가락을 벌리면 크게 보일 수 있습니다.',
                analogy: '사진을 가까이 당겨 자세히 보는 느낌과 비슷합니다.',
                practice: ['지도나 사진에서 두 손가락 확대를 연습합니다.', '원래 크기로 돌아오는 방법도 해 봅니다.'],
                remember: '손가락 움직임도 컴퓨터와 약속된 신호입니다.',
            },
            {
                title: '천천히, 정확하게 조작하기',
                idea: '마우스와 터치는 빠른 것보다 정확한 것이 더 중요합니다.',
                analogy: '색칠할 때 천천히 칠하면 선 밖으로 덜 나가는 것과 같습니다.',
                practice: ['작은 버튼을 천천히 눌러 봅니다.', '실수하면 멈추고 다시 목표를 봅니다.'],
                remember: '컴퓨터 조작은 천천히 정확하게가 좋습니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u04',
        unitNumber: 4,
        title: '키보드와 글자 입력',
        bookLabel: '1권 | 컴퓨터와 화면 첫걸음',
        slides: [
            {
                title: '키보드는 글자 악기예요',
                idea: '키보드를 누르면 화면에 글자와 숫자가 나타납니다.',
                analogy: '피아노 건반을 누르면 소리가 나듯, 키보드를 누르면 글자가 나옵니다.',
                practice: ['자기 이름의 첫 글자를 찾아봅니다.', '한 글자씩 천천히 눌러 봅니다.'],
                remember: '키보드는 글자를 입력하는 도구입니다.',
            },
            {
                title: '한글과 영어 바꾸기',
                idea: '한영 키를 사용하면 한글과 영어 입력을 바꿀 수 있습니다.',
                analogy: '두 가지 색연필을 번갈아 쓰는 것과 같습니다.',
                practice: ['한글로 한 글자를 입력합니다.', '한영 키를 누르고 영어 한 글자를 입력합니다.'],
                remember: '한영 키는 글자 나라를 바꿉니다.',
            },
            {
                title: '스페이스바는 띄어쓰기',
                idea: '스페이스바를 누르면 글자 사이에 빈칸이 생깁니다.',
                analogy: '친구들이 줄 설 때 조금씩 간격을 두는 것과 같습니다.',
                practice: ['내 이름과 좋아하는 것을 띄어 써 봅니다.', '빈칸이 너무 많은지 확인합니다.'],
                remember: '스페이스바는 글자 사이 쉬는 자리입니다.',
            },
            {
                title: '엔터는 다음 줄로 가기',
                idea: '엔터를 누르면 글을 다음 줄에서 이어 쓸 수 있습니다.',
                analogy: '공책에서 다음 줄로 내려가는 것과 같습니다.',
                practice: ['짧은 말을 쓰고 엔터를 누릅니다.', '다음 줄에 또 다른 말을 써 봅니다.'],
                remember: '엔터는 다음 줄로 내려가는 버튼입니다.',
            },
            {
                title: '백스페이스는 지우개',
                idea: '백스페이스는 커서 왼쪽 글자를 지웁니다.',
                analogy: '연필 글씨를 지우개로 살짝 지우는 것과 같습니다.',
                practice: ['글자를 하나 잘못 입력해 봅니다.', '백스페이스로 하나만 지워 봅니다.'],
                remember: '백스페이스는 뒤로 가며 지우는 지우개입니다.',
            },
            {
                title: '커서는 글자 자리 표시',
                idea: '깜빡이는 커서는 다음 글자가 들어갈 자리를 알려줍니다.',
                analogy: '줄넘기 차례를 알려주는 표시처럼, 지금 글자 차례를 보여줍니다.',
                practice: ['글을 쓸 때 깜빡이는 막대를 찾습니다.', '마우스로 다른 자리를 눌러 커서를 옮겨 봅니다.'],
                remember: '커서는 다음 글자가 들어갈 자리입니다.',
            },
            {
                title: '쉬프트로 큰 글자와 기호',
                idea: '쉬프트를 함께 누르면 큰 영어 글자나 위쪽 기호를 입력할 수 있습니다.',
                analogy: '두 손으로 상자를 들면 혼자 들 때와 다른 일을 할 수 있는 것과 같습니다.',
                practice: ['쉬프트와 영어 글자를 함께 눌러 봅니다.', '숫자 위 기호는 어른과 함께 연습합니다.'],
                remember: '쉬프트는 다른 키의 특별한 모습도 꺼냅니다.',
            },
            {
                title: '짧은 문장을 써 봐요',
                idea: '간단한 문장을 쓰면 키보드 위치를 더 익숙하게 알 수 있습니다.',
                analogy: '자전거를 조금씩 타 보며 균형을 배우는 것과 같습니다.',
                practice: ['나는 컴퓨터를 배워요 라고 써 봅니다.', '띄어쓰기와 마침표를 확인합니다.'],
                remember: '연습할수록 손가락이 길을 기억합니다.',
            },
            {
                title: '비밀번호는 조용히 입력해요',
                idea: '비밀번호는 나만 알아야 하므로 다른 사람에게 보여주지 않습니다.',
                analogy: '집 열쇠를 아무에게나 주지 않는 것과 같습니다.',
                practice: ['비밀번호 칸에서는 글자가 숨겨지는지 봅니다.', '비밀번호는 보호자와 정한 것만 사용합니다.'],
                remember: '비밀번호는 내 디지털 열쇠입니다.',
            },
            {
                title: '바른 자세로 입력하기',
                idea: '허리와 손목을 편하게 두면 오래 해도 덜 피곤합니다.',
                analogy: '그림 그릴 때 책상 높이가 맞으면 더 편한 것과 같습니다.',
                practice: ['등을 의자에 기대고 앉습니다.', '눈과 화면 사이를 팔 길이 정도로 둡니다.'],
                remember: '몸이 편해야 컴퓨터도 즐겁게 배웁니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u05',
        unitNumber: 5,
        title: '파일과 폴더 기초',
        bookLabel: '1권 | 컴퓨터와 화면 첫걸음',
        slides: [
            {
                title: '파일은 만든 결과물이에요',
                idea: '사진, 그림, 글처럼 컴퓨터에 저장된 하나의 결과물을 파일이라고 합니다.',
                analogy: '파일은 공책 한 장이나 그림 한 장처럼 하나의 작품입니다.',
                practice: ['사진 파일과 글 파일 아이콘이 다른지 봅니다.', '파일 이름을 읽어 봅니다.'],
                remember: '파일은 컴퓨터에 저장한 하나의 물건입니다.',
            },
            {
                title: '폴더는 파일을 담는 상자',
                idea: '폴더는 여러 파일을 한곳에 모아 두는 공간입니다.',
                analogy: '색종이를 색깔별 봉투에 넣어 두는 것과 같습니다.',
                practice: ['폴더 모양 아이콘을 찾아봅니다.', '폴더 이름이 무엇인지 읽습니다.'],
                remember: '폴더는 파일을 담는 상자입니다.',
            },
            {
                title: '이름을 잘 지으면 찾기 쉬워요',
                idea: '파일 이름은 나중에 다시 찾을 때 큰 도움이 됩니다.',
                analogy: '장난감 통에 이름표를 붙이면 어디 있는지 빨리 알 수 있습니다.',
                practice: ['오늘 만든 파일에 날짜나 주제를 넣어 봅니다.', '너무 긴 이름보다 알아보기 쉬운 이름을 씁니다.'],
                remember: '좋은 이름은 나중의 나를 도와줍니다.',
            },
            {
                title: '저장은 작품을 남기기',
                idea: '저장을 해야 컴퓨터를 꺼도 만든 내용이 남아 있습니다.',
                analogy: '그림을 다 그린 뒤 파일철에 넣어 보관하는 것과 같습니다.',
                practice: ['저장 버튼 모양을 찾아봅니다.', '저장한 뒤 파일 이름을 확인합니다.'],
                remember: '저장은 작품을 잃어버리지 않게 하는 약속입니다.',
            },
            {
                title: '다른 이름으로 저장',
                idea: '다른 이름으로 저장하면 원래 파일은 두고 새 파일을 만들 수 있습니다.',
                analogy: '그림을 복사해서 한 장은 그대로 두고 한 장만 색칠하는 것과 같습니다.',
                practice: ['원본과 복사본이라는 말을 알아봅니다.', '중요한 파일은 어른과 함께 복사합니다.'],
                remember: '다른 이름으로 저장은 새 복사본 만들기입니다.',
            },
            {
                title: '파일 열기',
                idea: '파일을 열면 저장해 둔 내용을 다시 볼 수 있습니다.',
                analogy: '상자에서 예전에 만든 작품을 꺼내 보는 것과 같습니다.',
                practice: ['파일을 두 번 클릭해서 열어 봅니다.', '열린 내용이 파일 이름과 맞는지 봅니다.'],
                remember: '파일 열기는 저장한 것을 다시 꺼내 보기입니다.',
            },
            {
                title: '폴더 안으로 들어가기',
                idea: '폴더를 열면 그 안에 들어 있는 파일과 폴더를 볼 수 있습니다.',
                analogy: '큰 상자를 열었더니 작은 상자와 물건이 들어 있는 것과 같습니다.',
                practice: ['폴더를 열고 안의 개수를 세어 봅니다.', '뒤로 가기 버튼으로 이전 위치로 돌아옵니다.'],
                remember: '폴더 안에는 또 다른 물건들이 들어 있을 수 있습니다.',
            },
            {
                title: '파일 옮기기는 자리 바꾸기',
                idea: '파일은 필요한 폴더로 옮겨 정리할 수 있습니다.',
                analogy: '책을 책꽂이의 알맞은 칸으로 옮기는 것과 같습니다.',
                practice: ['연습용 파일을 만들어 폴더로 옮겨 봅니다.', '중요한 파일은 어른에게 먼저 확인합니다.'],
                remember: '옮기기는 파일의 집을 바꾸는 일입니다.',
            },
            {
                title: '휴지통은 잠깐 버리는 곳',
                idea: '삭제한 파일은 휴지통에 들어갈 수 있지만, 완전히 사라질 수도 있습니다.',
                analogy: '종이를 휴지통에 넣으면 다시 꺼낼 수 있지만 버리기 전 생각해야 합니다.',
                practice: ['휴지통 아이콘을 찾아봅니다.', '삭제는 혼자 하지 않기로 약속합니다.'],
                remember: '삭제는 신중하게 해야 합니다.',
            },
            {
                title: '내 폴더 정리 규칙 만들기',
                idea: '사진, 그림, 숙제처럼 종류별로 폴더를 만들면 찾기 쉽습니다.',
                analogy: '옷장에 양말, 티셔츠, 바지를 나눠 넣는 것과 같습니다.',
                practice: ['그림 폴더와 사진 폴더 이름을 생각합니다.', '오늘 배운 파일, 폴더, 저장을 다시 말해 봅니다.'],
                remember: '잘 정리된 폴더는 보물 지도를 가진 상자입니다.',
            },
        ],
    }),
];

const DETAILED_FOUNDATION_UNITS: Unit[] = [
    makeUnit({
        id: 'kids-it-first-u01',
        unitNumber: 1,
        title: '컴퓨터 탐험가 되기',
        bookLabel: '1단계 | 컴퓨터 탐험가',
        lessonPackage: {
            materials: ['컴퓨터 또는 노트북', '마우스', '그림판', '필기도구'],
            deliverable: '아이콘 3개와 안전 약속 2개가 담긴 나의 컴퓨터 탐험 지도',
            completionCriteria: ['화면·아이콘·버튼을 구별해 말한다.', '모르는 창이 나오면 멈추고 도움을 요청한다.', '탐험 지도를 저장하고 친구에게 한 가지를 설명한다.'],
            parentReport: '화면의 아이콘과 버튼을 관찰하고, 모르는 상황에서 멈추고 질문하는 안전한 디지털 사용 습관을 연습했습니다.',
        },
        teacherOpening: '교실을 탐험할 때 출입문과 표지판을 먼저 찾듯, 컴퓨터도 화면의 표지판부터 살펴본다고 말해 주세요.',
        teacherCoaching: '정답을 먼저 알려주지 말고 아이가 포인터로 가리킨 뒤 이름을 말하게 합니다. 클릭 전에는 “보고–읽고–누르기”를 함께 외칩니다.',
        teacherExtension: '빠르게 끝낸 학생은 같은 기능을 가진 아이콘이나 버튼을 하나 더 찾아 친구에게 퀴즈로 냅니다.',
        slides: [
            { title: '오늘은 컴퓨터 탐험가', idea: '컴퓨터를 켜고 화면을 관찰한 뒤 오늘 만들 탐험 지도와 안전 약속을 확인합니다.', analogy: '처음 가는 놀이터에서 입구와 안내판을 살피는 것처럼 화면부터 천천히 둘러봐요.', practice: ['컴퓨터로 해 본 일을 손가락으로 세어 봅니다.', '오늘의 결과물과 네 가지 수업 단계를 함께 읽습니다.'], remember: '컴퓨터는 내 생각을 작품으로 만드는 도구입니다.' },
            { title: '화면에서 표지판 찾기', idea: '바탕화면에서 아이콘, 버튼, 글자를 찾아 서로 다른 역할을 관찰합니다.', analogy: '아이콘은 가게 간판, 버튼은 누르면 열리는 초인종과 비슷합니다.', practice: ['아이콘 한 개와 버튼 한 개를 포인터로 가리킵니다.', '누르기 전에 그림과 글자를 소리 내어 읽습니다.'], remember: '먼저 보고 읽은 뒤에 누릅니다.', activity: { label: '탐험 기록 1', prompt: '화면에서 발견한 아이콘이나 버튼 이름을 하나 적어 보세요.', placeholder: '예: 그림판 또는 시작 버튼', example: '그림판 아이콘', minLength: 1 } },
            { title: '프로그램을 안전하게 열기', idea: '그림판 아이콘을 찾아 한 번 선택하고 두 번 클릭해 프로그램을 엽니다.', analogy: '문 앞 이름표를 확인하고 문을 여는 순서와 같습니다.', practice: ['아이콘을 한 번 클릭해 선택 표시를 확인합니다.', '두 번 클릭해 그림판 창을 열고 제목을 읽습니다.'], remember: '한 번 클릭은 고르기, 두 번 클릭은 열기입니다.' },
            { title: '아이콘·버튼·메뉴 구별하기', idea: '그림판 화면에서 도구 아이콘, 실행 버튼, 선택 메뉴를 역할에 따라 나눕니다.', analogy: '필통 속 연필, 지우개, 색연필이 서로 다른 일을 하는 것과 같습니다.', practice: ['연필 도구와 지우개 도구를 번갈아 선택합니다.', '색상 메뉴에서 원하는 색을 한 가지 고릅니다.'], remember: '모양이 다른 도구는 하는 일도 다릅니다.' },
            { title: '창의 세 가지 버튼 연습', idea: '최소화, 최대화, 닫기 버튼의 차이를 관찰하고 안전한 순서로 사용합니다.', analogy: '최소화는 서랍에 잠깐 넣기, 닫기는 책을 덮기와 같습니다.', practice: ['최소화한 뒤 작업 표시줄에서 다시 엽니다.', '닫기 전에는 저장 여부를 먼저 확인합니다.'], remember: '닫기 전에는 저장했는지 확인합니다.', activity: { label: '따라 하기 확인', prompt: '최소화·최대화·닫기 중 오늘 직접 사용한 버튼을 적어 보세요.', placeholder: '예: 최소화 버튼', example: '최소화 버튼을 눌렀다가 다시 열었어요.', minLength: 2 } },
            { title: '탐험 지도 설계하기', idea: '탐험 지도에 넣을 아이콘 3개와 안전 약속 2개의 위치를 먼저 정합니다.', analogy: '블록을 만들기 전에 어디에 놓을지 그림으로 생각하는 것과 같습니다.', practice: ['화면을 세 칸으로 나누고 아이콘 자리를 정합니다.', '아래쪽에는 안전 약속 자리를 남깁니다.'], remember: '만들기 전 설계하면 생각이 또렷해집니다.' },
            { title: '아이콘 세 개 그리기', idea: '그림판의 도형과 색 도구를 사용해 발견한 아이콘을 단순한 모양으로 표현합니다.', analogy: '복잡한 로봇도 동그라미와 네모부터 그리면 쉽게 시작할 수 있습니다.', practice: ['동그라미·네모 도구로 아이콘 세 개를 만듭니다.', '각 아이콘 아래에 선이나 색으로 역할을 표시합니다.'], remember: '완전히 똑같지 않아도 특징이 보이면 좋은 그림입니다.' },
            { title: '안전 약속 배지 붙이기', idea: '모르는 창과 개인정보 상황에서 지킬 행동을 그림이나 짧은 말로 표시합니다.', analogy: '횡단보도 앞의 멈춤 표지판처럼 컴퓨터에도 멈춤 약속이 필요합니다.', practice: ['“모르면 멈춰요” 배지를 지도에 넣습니다.', '이름·전화번호는 혼자 입력하지 않는 표시를 넣습니다.'], remember: '모르면 멈추고 선생님이나 보호자에게 물어봅니다.', activity: { label: '창작 미션 기록', prompt: '내 탐험 지도에 넣은 안전 약속 한 가지를 적어 보세요.', placeholder: '예: 모르는 광고는 누르지 않아요.', example: '모르면 멈추고 선생님께 물어봐요.', minLength: 2 } },
            { title: '친구에게 탐험 지도 소개하기', idea: '완성한 지도를 보여주며 아이콘 한 개와 안전 약속 한 개를 설명합니다.', analogy: '박물관 안내원이 중요한 작품을 짧고 또렷하게 소개하는 것과 같습니다.', practice: ['“이 아이콘은 ___을 해요”로 설명합니다.', '친구 발표에서 좋은 점을 한 가지 말합니다.'], remember: '작품을 설명하면 내가 배운 것이 더 잘 기억납니다.' },
            { title: '탐험가 성장 기록', idea: '오늘 잘한 행동과 다음 시간에 더 해 보고 싶은 일을 기록하고 결과물을 저장합니다.', analogy: '탐험가는 여행이 끝난 뒤 발견한 것을 탐험 일지에 남깁니다.', practice: ['파일 이름을 “01_이름_탐험지도”로 저장합니다.', '완성 기준 세 가지를 선생님과 확인합니다.'], remember: '나는 안전하게 살펴보고 질문하는 컴퓨터 탐험가입니다.', activity: { label: '오늘의 성장 기록', prompt: '오늘 가장 잘한 것과 다음에 해 보고 싶은 것을 짧게 적어 보세요.', placeholder: '예: 아이콘을 잘 찾았어요. 다음에는 그림을 더 그리고 싶어요.', example: '모르는 버튼을 바로 누르지 않고 물어봤어요.', minLength: 2 } },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u02',
        unitNumber: 2,
        title: '창과 아이콘 움직이기',
        bookLabel: '1단계 | 컴퓨터 탐험가',
        lessonPackage: {
            materials: ['컴퓨터 또는 노트북', '마우스', '그림판', '연습용 폴더'],
            deliverable: '클릭·창 이동·크기 조절·정리를 보여주는 창 조작 미션 카드',
            completionCriteria: ['한 번 클릭과 두 번 클릭을 구별한다.', '창을 이동·크기 조절·최소화한 뒤 되돌린다.', '저장 확인 후 창을 정리하고 조작 방법을 시범 보인다.'],
            parentReport: '클릭과 더블클릭의 차이를 이해하고 창 이동·크기 조절·최소화·복원 과정을 스스로 수행했습니다.',
        },
        teacherOpening: '책상 위 종이를 앞뒤로 옮기고 크기를 바꿀 수 없지만, 컴퓨터 창은 움직이고 크기를 바꿀 수 있다고 시범 보여 주세요.',
        teacherCoaching: '더블클릭이 어려운 학생은 손가락으로 “톡톡” 리듬을 먼저 연습합니다. 창을 옮길 때는 제목 막대를 색 테이프로 표시한 것처럼 찾아보게 합니다.',
        teacherExtension: '빠르게 끝낸 학생은 두 창을 화면 양쪽에 나란히 배치하고 어떤 상황에서 편리한지 설명합니다.',
        slides: [
            { title: '창 조작 미션을 시작해요', idea: '지난 시간의 안전 약속을 떠올리고 오늘 연습할 네 가지 창 조작을 확인합니다.', analogy: '게임을 시작하기 전에 조작 버튼을 확인하는 준비 화면과 같습니다.', practice: ['한 번 클릭과 두 번 클릭을 손가락으로 표현합니다.', '오늘 결과물과 완료 기준을 함께 읽습니다.'], remember: '창을 잘 다루면 필요한 일을 빠르게 찾을 수 있습니다.' },
            { title: '한 번 클릭과 두 번 클릭 비교', idea: '한 번 클릭은 선택, 두 번 클릭은 열기에 사용되는 차이를 화면 변화로 확인합니다.', analogy: '한 번 손들기는 “저요”, 두 번 노크는 “들어갈게요”라는 신호와 비슷합니다.', practice: ['아이콘을 한 번 눌러 테두리 변화를 봅니다.', '같은 아이콘을 두 번 눌러 열린 창을 확인합니다.'], remember: '클릭 횟수에 따라 컴퓨터의 행동이 달라집니다.', activity: { label: '탐정 기록 1', prompt: '한 번 클릭과 두 번 클릭은 각각 어떤 일을 했나요?', placeholder: '예: 한 번은 고르기, 두 번은 열기', example: '한 번 클릭은 선택, 두 번 클릭은 열기예요.', minLength: 2 } },
            { title: '원하는 창을 맨 앞으로', idea: '겹친 창의 제목을 클릭해 보고 싶은 창을 앞으로 가져옵니다.', analogy: '겹친 색종이 중 보고 싶은 종이를 맨 위로 올리는 것과 같습니다.', practice: ['그림판과 연습용 폴더 창을 겹쳐 놓습니다.', '각 창을 번갈아 클릭해 앞뒤 변화를 말합니다.'], remember: '보고 싶은 창을 클릭하면 맨 앞으로 옵니다.' },
            { title: '제목 막대를 잡고 이동하기', idea: '창 위쪽 제목 막대를 드래그해 화면의 다른 자리로 옮깁니다.', analogy: '가방 손잡이를 잡고 가방 전체를 옮기는 것과 같습니다.', practice: ['제목 막대 위에 포인터를 정확히 놓습니다.', '누른 채 천천히 화면 왼쪽과 오른쪽으로 옮깁니다.'], remember: '제목 막대는 창을 옮기는 손잡이입니다.' },
            { title: '모서리로 크기 바꾸기', idea: '창 모서리에서 포인터 모양을 확인하고 드래그해 크기를 조절합니다.', analogy: '사진의 모서리를 잡아 크게 펼치는 모습과 비슷합니다.', practice: ['모서리에서 양방향 화살표를 찾습니다.', '내용이 잘 보이는 크기로 만들고 다시 원래대로 돌립니다.'], remember: '모서리는 창의 크기 손잡이입니다.', activity: { label: '따라 하기 확인', prompt: '창을 움직이거나 크기를 바꿀 때 잡았던 곳을 적어 보세요.', placeholder: '예: 제목 막대와 오른쪽 아래 모서리', example: '움직일 때는 제목 막대, 크기는 모서리를 잡았어요.', minLength: 2 } },
            { title: '미션 카드 1: 잠깐 숨기기', idea: '최소화 버튼으로 창을 숨긴 뒤 작업 표시줄에서 같은 창을 다시 찾습니다.', analogy: '사용하던 색연필을 서랍에 잠깐 넣었다가 다시 꺼내는 것과 같습니다.', practice: ['그림판을 최소화하고 화면에서 사라졌는지 봅니다.', '작업 표시줄 아이콘을 눌러 같은 그림을 다시 확인합니다.'], remember: '최소화는 닫기가 아니라 잠깐 숨기기입니다.' },
            { title: '미션 카드 2: 두 창 나란히', idea: '두 창을 이동하고 크기를 조절해 서로 가리지 않도록 배치합니다.', analogy: '책 두 권을 책상 위에 나란히 펼쳐 보는 것과 같습니다.', practice: ['그림판 창을 왼쪽 절반에 놓습니다.', '폴더 창을 오른쪽에 놓고 두 제목이 모두 보이게 합니다.'], remember: '창을 나란히 놓으면 두 내용을 함께 볼 수 있습니다.' },
            { title: '미션 카드 3: 저장하고 정리하기', idea: '만든 미션 표시를 저장하고 필요한 창만 남도록 안전하게 정리합니다.', analogy: '놀이가 끝난 뒤 작품은 보관하고 도구는 제자리에 놓는 것과 같습니다.', practice: ['저장 버튼을 눌러 파일 이름을 확인합니다.', '필요 없는 창은 저장 여부를 보고 하나씩 닫습니다.'], remember: '저장 확인 후 하나씩 정리합니다.', activity: { label: '창작 미션 기록', prompt: '오늘 성공한 창 조작을 두 가지 적어 보세요.', placeholder: '예: 창 이동하기, 최소화했다가 다시 열기', example: '창 크기를 바꾸고 두 창을 나란히 놓았어요.', minLength: 2 } },
            { title: '친구 앞에서 조작 시범', idea: '미션 카드에서 자신 있는 조작 하나를 골라 천천히 설명하며 보여줍니다.', analogy: '마술사가 손동작을 천천히 보여주면 친구도 따라 할 수 있는 것과 같습니다.', practice: ['“먼저 ___을 잡아요”로 시작해 설명합니다.', '친구의 설명을 듣고 같은 조작을 따라 합니다.'], remember: '말하면서 보여주면 정확한 순서를 알 수 있습니다.' },
            { title: '창 조작 성장 기록', idea: '오늘 성공한 미션과 어려웠던 조작을 기록하고 다음 연습 목표를 정합니다.', analogy: '운동 연습표에 성공한 동작과 더 연습할 동작을 표시하는 것과 같습니다.', practice: ['파일 이름을 “02_이름_창미션”으로 저장합니다.', '완성 기준을 확인하고 선생님에게 결과물을 보여줍니다.'], remember: '나는 창을 움직이고 정리할 수 있습니다.', activity: { label: '오늘의 성장 기록', prompt: '가장 자신 있는 창 조작과 조금 더 연습할 조작을 적어 보세요.', placeholder: '예: 최소화는 자신 있어요. 크기 조절은 더 연습할래요.', example: '창 이동은 잘했고 더블클릭은 더 연습하고 싶어요.', minLength: 2 } },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u03',
        unitNumber: 3,
        title: '마우스와 터치로 그리기',
        bookLabel: '1단계 | 컴퓨터 탐험가',
        lessonPackage: {
            materials: ['컴퓨터 또는 터치 기기', '마우스', '그림판', '도형 참고 카드'],
            deliverable: '선·도형·색·이름을 넣어 저장한 나만의 디지털 배지',
            completionCriteria: ['포인터를 목표에 맞추고 클릭·드래그를 정확히 사용한다.', '선·도형·색을 조합해 디지털 배지를 완성한다.', '작품을 저장하고 사용한 도구를 친구에게 설명한다.'],
            parentReport: '마우스의 클릭·드래그와 스크롤을 정확히 사용하고 선·도형·색을 조합한 디지털 배지를 완성했습니다.',
        },
        teacherOpening: '마우스는 화면 속 연필을 움직이는 손잡이라고 설명하고, 빠르게 움직이는 것보다 목표에 정확히 멈추는 모습을 시범 보여 주세요.',
        teacherCoaching: '손목 전체보다 팔을 편하게 두고 작은 움직임부터 연습시킵니다. 드래그가 끊기면 “잡기–움직이기–놓기” 세 단어로 다시 시도합니다.',
        teacherExtension: '빠르게 끝낸 학생은 같은 배지를 두 가지 색 조합으로 만들고 어떤 느낌이 다른지 비교합니다.',
        slides: [
            { title: '오늘은 디지털 미술가', idea: '마우스와 터치의 기본 움직임을 익히고 오늘 만들 디지털 배지를 확인합니다.', analogy: '붓을 잡는 방법을 알면 원하는 모양을 더 잘 그릴 수 있는 것과 같습니다.', practice: ['손목을 편하게 두고 마우스를 잡습니다.', '오늘 결과물의 선·도형·색·이름 요소를 찾습니다.'], remember: '빠르게보다 천천히 정확하게 움직입니다.' },
            { title: '포인터와 목표 맞추기', idea: '마우스를 움직이며 포인터가 화면의 작은 목표 위에 정확히 멈추도록 조절합니다.', analogy: '공을 던지기 전에 바구니를 정확히 바라보는 것과 같습니다.', practice: ['화면의 아이콘 세 개 위에 차례로 포인터를 올립니다.', '포인터 모양이 달라지는 곳을 찾아 말합니다.'], remember: '먼저 가리키고, 그다음 누릅니다.', activity: { label: '관찰 기록 1', prompt: '포인터를 올렸을 때 모양이 달라진 곳을 하나 적어 보세요.', placeholder: '예: 버튼 위에서 손가락 모양이 되었어요.', example: '그림판 도구 위에서 포인터 모양이 바뀌었어요.', minLength: 2 } },
            { title: '클릭 표적 미션', idea: '크기가 다른 표적을 한 번씩 클릭하며 포인터 정확도를 높입니다.', analogy: '도장 찍을 자리에 맞춰 꾹 누르는 놀이와 비슷합니다.', practice: ['큰 표적부터 작은 표적 순서로 클릭합니다.', '잘못 눌렀을 때는 멈추고 다시 목표를 봅니다.'], remember: '클릭은 목표 위에서 한 번 가볍게 누릅니다.' },
            { title: '드래그로 선과 도형 만들기', idea: '마우스 버튼을 누른 채 움직여 선을 그리고 도형 크기를 조절합니다.', analogy: '색연필을 종이에 댄 채 움직이면 선이 생기는 것과 같습니다.', practice: ['직선과 곡선을 하나씩 그립니다.', '도형 도구를 골라 작은 원과 큰 원을 만듭니다.'], remember: '드래그는 잡기–움직이기–놓기입니다.' },
            { title: '스크롤·확대·터치 비교', idea: '휠 스크롤과 두 손가락 확대 등 기기에 따른 화면 이동 방법을 비교합니다.', analogy: '긴 그림책을 넘기거나 사진을 가까이 가져오는 행동과 같습니다.', practice: ['휠을 천천히 굴려 위아래로 이동합니다.', '터치 기기에서는 두 손가락으로 확대 후 원래 크기로 돌아옵니다.'], remember: '기기가 달라도 화면을 움직이는 약속이 있습니다.', activity: { label: '따라 하기 확인', prompt: '클릭·드래그·스크롤 중 가장 잘된 동작과 이유를 적어 보세요.', placeholder: '예: 드래그가 잘됐어요. 선을 끊지 않고 그렸어요.', example: '클릭이 잘됐어요. 누르기 전에 포인터를 확인했어요.', minLength: 2 } },
            { title: '배지 모양 설계하기', idea: '동그라미·별·방패 중 기본 모양을 고르고 안에 넣을 상징을 정합니다.', analogy: '운동팀 마크도 먼저 큰 모양과 대표 색을 정하고 시작합니다.', practice: ['배지의 바깥 모양을 한 가지 고릅니다.', '나를 나타내는 작은 상징을 하나 정합니다.'], remember: '작품은 큰 모양부터 작은 장식 순서로 만듭니다.' },
            { title: '선과 도형으로 배지 만들기', idea: '도형과 선 도구를 사용해 배지의 큰 모양과 상징을 화면에 배치합니다.', analogy: '큰 블록으로 몸통을 만들고 작은 블록으로 장식하는 것과 같습니다.', practice: ['도형 도구로 배지 테두리를 만듭니다.', '드래그로 상징 또는 무늬를 두 개 이상 넣습니다.'], remember: '도형을 조합하면 새로운 그림이 됩니다.' },
            { title: '색과 이름을 넣고 저장하기', idea: '색을 두세 가지로 정리하고 짧은 이름이나 첫 글자를 넣어 작품을 완성합니다.', analogy: '케이크에 마지막 장식과 이름표를 올리는 단계와 같습니다.', practice: ['서로 잘 보이는 색을 골라 채웁니다.', '이름 첫 글자를 넣고 “03_이름_디지털배지”로 저장합니다.'], remember: '저장해야 내 디지털 작품이 남습니다.', activity: { label: '창작 미션 기록', prompt: '배지에 넣은 모양·색·상징과 그 이유를 적어 보세요.', placeholder: '예: 별과 파란색을 넣었어요. 도전하는 마음을 나타내요.', example: '초록 방패와 번개를 넣어서 용기 있는 모습을 표현했어요.', minLength: 2 } },
            { title: '디지털 배지 전시회', idea: '작품을 화면에 띄우고 사용한 도구와 작품의 의미를 친구에게 소개합니다.', analogy: '미술관의 작가가 작품 제목과 만든 생각을 들려주는 것과 같습니다.', practice: ['“제 배지 이름은 ___입니다”로 발표합니다.', '친구 작품에서 멋진 모양이나 색을 하나 찾아 말합니다.'], remember: '작품에는 만든 사람의 생각이 담겨 있습니다.' },
            { title: '디지털 미술가 성장 기록', idea: '사용할 수 있게 된 마우스 동작과 다음 작품에서 도전할 기능을 기록합니다.', analogy: '화가가 스케치북에 새로 배운 기법을 적어 두는 것과 같습니다.', practice: ['저장한 파일을 다시 열어 작품이 남았는지 확인합니다.', '완성 기준을 선생님과 하나씩 확인합니다.'], remember: '나는 마우스로 생각을 그림으로 표현할 수 있습니다.', activity: { label: '오늘의 성장 기록', prompt: '오늘 가장 잘 사용한 도구와 다음에 더 사용해 보고 싶은 도구를 적어 보세요.', placeholder: '예: 도형 도구를 잘 썼어요. 다음에는 스티커를 넣고 싶어요.', example: '드래그로 별을 잘 만들었고 다음에는 글자 도구를 더 써 보고 싶어요.', minLength: 2 } },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u04',
        unitNumber: 4,
        title: '키보드로 이야기 쓰기',
        bookLabel: '1단계 | 컴퓨터 탐험가',
        lessonPackage: {
            materials: ['컴퓨터 또는 노트북', '키보드', '간단한 글쓰기 프로그램', '이야기 그림 카드'],
            deliverable: '제목·두 문장·줄바꿈이 들어간 나의 첫 디지털 이야기',
            completionCriteria: ['한글·영어 전환과 스페이스·엔터·백스페이스를 사용한다.', '제목과 두 문장으로 짧은 이야기를 입력하고 수정한다.', '개인정보를 넣지 않고 파일을 저장해 소리 내어 발표한다.'],
            parentReport: '키보드의 한영 전환·띄어쓰기·줄바꿈·수정 기능을 사용해 개인정보가 없는 짧은 디지털 이야기를 완성했습니다.',
        },
        teacherOpening: '키보드는 글자 소리가 나는 피아노라고 설명하고, 커서는 다음 글자가 앉을 빈 의자라고 보여 주세요.',
        teacherCoaching: '속도보다 정확도를 칭찬하고 한 손가락 입력도 허용합니다. 오타가 나면 실패라고 하지 말고 커서와 백스페이스로 고치는 탐정 미션으로 바꿉니다.',
        teacherExtension: '빠르게 끝낸 학생은 제목 크기나 기호를 바꾸고, 원래 문장과 고친 문장 중 어느 쪽이 더 읽기 좋은지 설명합니다.',
        slides: [
            { title: '오늘은 디지털 이야기 작가', idea: '키보드의 주요 키를 살펴보고 두 문장 이야기라는 오늘의 결과물을 확인합니다.', analogy: '피아노 건반이 소리를 만들듯 키보드 건반은 화면에 글자를 만듭니다.', practice: ['자기 이름에 들어가는 글자 키를 찾아봅니다.', '오늘 이야기에는 개인정보를 쓰지 않는 약속을 확인합니다.'], remember: '키보드는 내 생각을 글자로 바꾸는 도구입니다.' },
            { title: '키보드 지도 탐험', idea: '글자·숫자·스페이스·엔터·백스페이스·한영 키의 위치와 역할을 찾습니다.', analogy: '도시 지도에서 학교와 공원을 찾듯 키보드에서도 필요한 키를 찾습니다.', practice: ['스페이스·엔터·백스페이스를 차례로 가리킵니다.', '키 하나를 누르고 화면의 커서 변화를 관찰합니다.'], remember: '키의 위치와 역할을 알면 글쓰기가 쉬워집니다.', activity: { label: '키보드 탐험 기록', prompt: '오늘 처음 알게 된 키 이름과 하는 일을 적어 보세요.', placeholder: '예: 엔터 키 — 다음 줄로 내려가요.', example: '백스페이스 키는 왼쪽 글자를 지워요.', minLength: 2 } },
            { title: '한글·영어·기호 바꾸기', idea: '한영 키와 쉬프트 키를 사용해 입력 모드를 바꾸고 화면 결과를 비교합니다.', analogy: '색연필을 바꾸면 같은 종이에도 다른 색이 나오는 것과 같습니다.', practice: ['한글 한 글자와 영어 한 글자를 번갈아 입력합니다.', '쉬프트와 숫자 키를 함께 눌러 기호 하나를 입력합니다.'], remember: '한영과 쉬프트 키는 다른 글자 모습을 꺼냅니다.' },
            { title: '띄어쓰기와 줄바꿈', idea: '스페이스로 낱말 사이를 띄우고 엔터로 문장을 다음 줄에 배치합니다.', analogy: '친구들이 줄을 설 때 간격을 두고, 새 줄로 이동하는 것과 같습니다.', practice: ['“나는 코딩을 배워요”를 띄어 씁니다.', '엔터를 눌러 좋아하는 것을 다음 줄에 씁니다.'], remember: '스페이스는 낱말 사이, 엔터는 다음 줄입니다.' },
            { title: '커서와 백스페이스로 고치기', idea: '깜빡이는 커서를 원하는 위치로 옮기고 오타를 한 글자씩 수정합니다.', analogy: '커서는 다음 글자가 앉을 빈 의자, 백스페이스는 작은 지우개입니다.', practice: ['일부러 한 글자를 틀리게 입력합니다.', '커서를 옮기고 백스페이스로 정확히 고칩니다.'], remember: '오타는 커서를 찾고 한 글자씩 고치면 됩니다.', activity: { label: '따라 하기 확인', prompt: '틀린 글자를 어떤 키와 순서로 고쳤는지 적어 보세요.', placeholder: '예: 커서를 옮기고 백스페이스로 지운 뒤 다시 썼어요.', example: '틀린 글자 뒤를 클릭하고 백스페이스로 지운 다음 다시 입력했어요.', minLength: 2 } },
            { title: '두 문장 이야기 설계하기', idea: '그림 카드에서 주인공·장소·행동을 골라 제목과 두 문장의 순서를 정합니다.', analogy: '레고를 조립하기 전에 어떤 모양을 만들지 부품을 고르는 것과 같습니다.', practice: ['주인공과 장소를 한 가지씩 고릅니다.', '처음 문장과 다음 문장에서 일어날 일을 말로 먼저 이야기합니다.'], remember: '글을 쓰기 전에 말로 순서를 정하면 쉽게 시작할 수 있습니다.' },
            { title: '제목과 첫 문장 입력하기', idea: '제목을 입력하고 엔터로 줄을 바꾼 뒤 주인공과 장소가 나오는 첫 문장을 씁니다.', analogy: '책 표지의 제목을 쓰고 첫 장을 여는 것과 같습니다.', practice: ['제목을 짧게 입력하고 엔터를 누릅니다.', '“___가 ___에 갔어요”처럼 첫 문장을 완성합니다.'], remember: '제목 다음에는 줄을 바꾸면 읽기 편합니다.' },
            { title: '두 번째 문장과 수정·저장', idea: '주인공의 행동이 담긴 두 번째 문장을 쓰고 띄어쓰기와 오타를 확인해 저장합니다.', analogy: '그림을 완성한 뒤 삐져나온 색을 고치고 이름표를 붙이는 단계와 같습니다.', practice: ['두 번째 문장을 쓰고 소리 내어 읽으며 오타를 찾습니다.', '“04_이름_디지털이야기”로 저장합니다.'], remember: '읽어 보면 고칠 곳을 더 쉽게 찾을 수 있습니다.', activity: { label: '창작 미션 기록', prompt: '내 이야기의 제목과 가장 마음에 드는 문장을 적어 보세요.', placeholder: '예: 제목은 우주 고양이예요. “고양이가 별을 만났어요.”가 좋아요.', example: '제목은 구름 자동차이고, “자동차가 무지개 길을 달렸어요.”가 마음에 들어요.', minLength: 2 } },
            { title: '작가 낭독회', idea: '완성한 이야기를 친구에게 읽어 주고 제목·문장·줄바꿈이 잘 보이는지 의견을 듣습니다.', analogy: '그림책 작가가 새 책을 독자에게 처음 읽어 주는 시간과 같습니다.', practice: ['제목을 말하고 두 문장을 천천히 읽습니다.', '친구 이야기에서 재미있는 낱말을 하나 찾아 칭찬합니다.'], remember: '내 글을 읽어 주면 생각을 다른 사람과 나눌 수 있습니다.' },
            { title: '디지털 작가 성장 기록', idea: '오늘 사용한 키와 스스로 고친 부분을 돌아보고 안전한 글쓰기 약속을 확인합니다.', analogy: '작가는 원고를 마친 뒤 잘된 점과 다음 이야깃거리를 메모합니다.', practice: ['파일을 다시 열어 제목과 두 문장이 저장됐는지 확인합니다.', '비밀번호와 개인정보는 작품에 적지 않는 약속을 말합니다.'], remember: '나는 키보드로 생각을 안전하게 이야기로 만들 수 있습니다.', activity: { label: '오늘의 성장 기록', prompt: '오늘 가장 잘 사용한 키와 다음 이야기에서 써 보고 싶은 내용을 적어 보세요.', placeholder: '예: 엔터 키를 잘 썼어요. 다음에는 공룡 이야기를 쓰고 싶어요.', example: '백스페이스로 오타를 고쳤고 다음에는 로봇 이야기를 쓰고 싶어요.', minLength: 2 } },
        ],
    }),
];

const BOOK1_UNITS: Unit[] = [
    ...DETAILED_FOUNDATION_UNITS,
    ...LEGACY_BOOK1_UNITS.slice(4, 5),
];

const BOOK2_UNITS: Unit[] = [
    makeUnit({
        id: 'kids-it-first-u06',
        unitNumber: 6,
        title: '그림과 사진 다루기',
        bookLabel: '2권 | 미디어·인터넷·안전',
        slides: [
            {
                title: '그림판으로 표현하기',
                idea: '그림 도구를 사용하면 컴퓨터에서 선과 색으로 생각을 표현할 수 있습니다.',
                analogy: '그림판은 물감이 들어 있는 디지털 스케치북입니다.',
                practice: ['선 그리기 도구를 찾아봅니다.', '좋아하는 색으로 짧은 선을 그립니다.'],
                remember: '컴퓨터에서도 그림으로 마음을 표현할 수 있습니다.',
            },
            {
                title: '색 고르기',
                idea: '색을 고르면 그림의 느낌이 달라집니다.',
                analogy: '크레파스 상자에서 원하는 색을 고르는 것과 같습니다.',
                practice: ['밝은 색과 어두운 색을 하나씩 고릅니다.', '같은 모양을 다른 색으로 칠해 봅니다.'],
                remember: '색은 그림의 기분을 바꿉니다.',
            },
            {
                title: '지우개와 되돌리기',
                idea: '실수해도 지우개나 되돌리기로 고칠 수 있습니다.',
                analogy: '블록을 잘못 쌓으면 한 조각 빼고 다시 쌓는 것과 같습니다.',
                practice: ['작은 선을 지우개로 지워 봅니다.', '되돌리기 버튼이 어디 있는지 찾습니다.'],
                remember: '실수는 고치며 배우는 과정입니다.',
            },
            {
                title: '사진은 소중한 기록',
                idea: '사진 파일은 사람, 장소, 순간을 담은 기록입니다.',
                analogy: '사진은 시간을 작은 액자에 넣어 둔 것과 같습니다.',
                practice: ['사진 파일 이름을 살펴봅니다.', '사람 얼굴이 나온 사진은 함부로 보내지 않기로 약속합니다.'],
                remember: '사진에는 소중한 정보가 들어 있습니다.',
            },
            {
                title: '확대와 축소',
                idea: '사진을 크게 보면 자세히 보고, 작게 보면 전체를 볼 수 있습니다.',
                analogy: '돋보기로 보면 자세히, 멀리서 보면 전체가 보이는 것과 같습니다.',
                practice: ['확대 버튼을 찾아봅니다.', '확대 후 다시 원래 크기로 돌아옵니다.'],
                remember: '확대와 축소는 보는 거리를 바꾸는 기능입니다.',
            },
            {
                title: '자르기는 필요한 부분만 남기기',
                idea: '사진 자르기는 보고 싶은 부분만 남기는 기능입니다.',
                analogy: '종이 그림에서 필요한 부분만 오려 붙이는 것과 같습니다.',
                practice: ['연습 사진에서 빈 공간을 줄여 봅니다.', '사람 얼굴은 어른과 함께 확인합니다.'],
                remember: '자르기는 사진에서 중요한 부분을 고르는 일입니다.',
            },
            {
                title: '저작권을 쉽게 알아봐요',
                idea: '인터넷 그림은 다른 사람이 만든 작품일 수 있어 함부로 쓰면 안 됩니다.',
                analogy: '친구 그림을 빌릴 때 허락을 받는 것과 같습니다.',
                practice: ['내가 직접 만든 그림과 남이 만든 그림을 구분합니다.', '출처라는 말을 배웁니다.'],
                remember: '남의 작품은 허락과 출처가 필요합니다.',
            },
            {
                title: '내 그림 저장하기',
                idea: '완성한 그림은 이름을 정해 저장해야 다시 볼 수 있습니다.',
                analogy: '완성한 그림을 내 작품 파일에 넣어 보관하는 것과 같습니다.',
                practice: ['그림 제목을 정합니다.', '저장한 파일이 폴더에 있는지 확인합니다.'],
                remember: '저장하면 내 작품이 컴퓨터에 남습니다.',
            },
            {
                title: '작품을 보여줄 때 조심하기',
                idea: '사진이나 그림을 공유할 때는 개인정보가 있는지 확인해야 합니다.',
                analogy: '편지를 보내기 전에 주소와 이름이 보이는지 살피는 것과 같습니다.',
                practice: ['이름표, 학교명, 전화번호가 보이는지 봅니다.', '공유 전에는 보호자에게 보여줍니다.'],
                remember: '공유 전에는 내 정보가 보이는지 확인합니다.',
            },
            {
                title: '나만의 디지털 작품 만들기',
                idea: '배운 도구로 간단한 그림 작품을 만들며 정리합니다.',
                analogy: '여러 색 블록을 모아 하나의 집을 만드는 것과 같습니다.',
                practice: ['제목이 있는 작은 그림을 만듭니다.', '파일 이름을 정하고 저장합니다.'],
                remember: '디지털 도구는 내 생각을 작품으로 바꿔 줍니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u07',
        unitNumber: 7,
        title: '소리와 미디어 이해',
        bookLabel: '2권 | 미디어·인터넷·안전',
        slides: [
            {
                title: '소리 파일 알아보기',
                idea: '컴퓨터에는 노래, 녹음, 효과음 같은 소리 파일이 있습니다.',
                analogy: '소리 파일은 작은 음악 상자에 소리를 담아 둔 것과 같습니다.',
                practice: ['스피커 모양 아이콘을 찾아봅니다.', '소리를 듣기 전 볼륨을 낮춥니다.'],
                remember: '소리 파일은 저장된 소리입니다.',
            },
            {
                title: '볼륨은 소리 크기',
                idea: '볼륨을 조절하면 소리가 작아지거나 커집니다.',
                analogy: '목소리를 속삭임에서 큰 소리로 바꾸는 것과 같습니다.',
                practice: ['볼륨 버튼을 찾아봅니다.', '작은 소리에서 조금씩 키워 봅니다.'],
                remember: '볼륨은 귀가 편한 크기로 맞춥니다.',
            },
            {
                title: '재생과 멈춤',
                idea: '재생은 시작, 멈춤은 잠깐 쉬기입니다.',
                analogy: '동화책을 읽다가 책갈피를 끼워 쉬는 것과 같습니다.',
                practice: ['재생 버튼 모양을 찾습니다.', '멈춤 버튼을 눌러 소리를 잠깐 멈춥니다.'],
                remember: '재생과 멈춤은 미디어의 기본 버튼입니다.',
            },
            {
                title: '영상은 그림이 빠르게 움직여요',
                idea: '영상은 여러 장면이 이어져 움직이는 것처럼 보입니다.',
                analogy: '그림책을 빠르게 넘기면 그림이 움직이는 것과 비슷합니다.',
                practice: ['영상의 시작과 끝을 살펴봅니다.', '멈춤 버튼으로 한 장면을 자세히 봅니다.'],
                remember: '영상은 움직이는 화면과 소리가 함께할 수 있습니다.',
            },
            {
                title: '광고와 영상 구분하기',
                idea: '영상 앞뒤나 중간에는 광고가 나올 수 있습니다.',
                analogy: '동화책 사이에 장난감 전단지가 끼어 있는 것과 같습니다.',
                practice: ['광고라는 표시가 있는지 찾아봅니다.', '광고 버튼은 혼자 누르지 않습니다.'],
                remember: '광고는 내가 보려던 내용과 다를 수 있습니다.',
            },
            {
                title: '이어폰도 안전하게',
                idea: '이어폰은 너무 크게 들으면 귀가 피곤해질 수 있습니다.',
                analogy: '가까이에서 큰 북소리를 오래 들으면 귀가 놀라는 것과 같습니다.',
                practice: ['볼륨을 중간보다 낮게 맞춥니다.', '오래 들었으면 잠깐 귀를 쉬게 합니다.'],
                remember: '귀도 쉬는 시간이 필요합니다.',
            },
            {
                title: '녹음은 내 목소리 저장',
                idea: '마이크로 말하면 내 목소리를 파일로 저장할 수 있습니다.',
                analogy: '목소리를 작은 병에 담아 나중에 여는 것과 같습니다.',
                practice: ['짧게 자기소개를 녹음합니다.', '녹음 파일 이름을 정합니다.'],
                remember: '녹음은 소리를 파일로 만드는 일입니다.',
            },
            {
                title: '소리도 개인정보가 될 수 있어요',
                idea: '목소리에는 이름, 위치, 주변 이야기가 들어갈 수 있습니다.',
                analogy: '목소리 편지에도 내 비밀이 적힐 수 있는 것과 같습니다.',
                practice: ['녹음하기 전 주변 소리를 들어봅니다.', '공유 전 보호자에게 확인합니다.'],
                remember: '목소리도 조심해서 공유합니다.',
            },
            {
                title: '좋은 미디어 습관',
                idea: '재미있는 영상도 시간을 정해 보면 더 건강하게 사용할 수 있습니다.',
                analogy: '간식이 맛있어도 밥 대신 계속 먹으면 안 되는 것과 같습니다.',
                practice: ['보기 전에 끝낼 시간을 정합니다.', '끝나면 눈과 몸을 움직여 쉽니다.'],
                remember: '미디어는 시간을 정해 즐깁니다.',
            },
            {
                title: '소리와 영상 정리하기',
                idea: '좋은 소리 크기, 안전한 공유, 쉬는 시간을 함께 기억합니다.',
                analogy: '놀이터 규칙을 지키면 더 오래 즐겁게 노는 것과 같습니다.',
                practice: ['오늘 배운 버튼 이름을 말합니다.', '내가 지킬 미디어 약속 하나를 정합니다.'],
                remember: '재미와 안전을 함께 지키면 좋은 미디어 사용자가 됩니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u08',
        unitNumber: 8,
        title: '인터넷과 검색 첫걸음',
        bookLabel: '2권 | 미디어·인터넷·안전',
        slides: [
            {
                title: '인터넷은 연결된 길이에요',
                idea: '인터넷은 여러 컴퓨터와 정보가 서로 연결된 큰 길입니다.',
                analogy: '도서관, 우체국, 놀이터로 이어지는 아주 큰 길 지도와 같습니다.',
                practice: ['인터넷으로 할 수 있는 일을 말해 봅니다.', '혼자 들어가면 안 되는 곳도 있음을 배웁니다.'],
                remember: '인터넷은 많은 정보가 이어진 길입니다.',
            },
            {
                title: '브라우저는 인터넷 문',
                idea: '브라우저는 인터넷 사이트에 들어갈 때 사용하는 프로그램입니다.',
                analogy: '브라우저는 도서관 입구 문처럼 정보를 보러 들어가는 문입니다.',
                practice: ['브라우저 아이콘을 찾아봅니다.', '주소창과 검색창을 구분해 봅니다.'],
                remember: '브라우저는 인터넷을 여는 문입니다.',
            },
            {
                title: '주소는 사이트의 집 위치',
                idea: '인터넷 주소는 사이트가 어디 있는지 알려줍니다.',
                analogy: '친구 집 주소를 알아야 찾아갈 수 있는 것과 같습니다.',
                practice: ['주소창에 글자가 있는지 봅니다.', '이상한 주소는 보호자에게 보여줍니다.'],
                remember: '주소는 인터넷 집의 위치입니다.',
            },
            {
                title: '검색어는 질문의 씨앗',
                idea: '검색어를 잘 쓰면 원하는 정보를 더 쉽게 찾을 수 있습니다.',
                analogy: '씨앗을 잘 심으면 원하는 꽃을 찾기 쉬운 것과 같습니다.',
                practice: ['긴 문장보다 중요한 낱말을 골라봅니다.', '강아지 돌보기처럼 두 단어로 검색어를 만들어 봅니다.'],
                remember: '검색어는 내가 찾고 싶은 것을 짧게 말한 것입니다.',
            },
            {
                title: '검색 결과는 모두 답이 아니에요',
                idea: '검색 결과에는 맞는 정보도 있고 틀리거나 광고인 정보도 있습니다.',
                analogy: '길 안내 표지판 중에는 내가 갈 곳과 다른 표지판도 있는 것과 같습니다.',
                practice: ['광고 표시가 있는 결과를 찾아봅니다.', '모르는 사이트는 바로 누르지 않습니다.'],
                remember: '검색 결과는 확인하며 골라야 합니다.',
            },
            {
                title: '정보를 두 번 확인하기',
                idea: '중요한 내용은 한 곳만 보지 말고 다른 믿을 만한 곳도 확인합니다.',
                analogy: '친구 한 명 말만 듣지 않고 선생님께도 확인하는 것과 같습니다.',
                practice: ['같은 내용을 두 사이트에서 비교합니다.', '날짜가 너무 오래되지 않았는지 봅니다.'],
                remember: '중요한 정보는 두 번 확인합니다.',
            },
            {
                title: '모르는 말은 쉬운 말로 바꾸기',
                idea: '검색하다 어려운 말이 나오면 더 쉬운 낱말로 다시 찾아봅니다.',
                analogy: '어려운 퍼즐을 작은 조각부터 맞추는 것과 같습니다.',
                practice: ['모르는 낱말 하나를 적습니다.', '어린이, 쉬운 설명 같은 말을 함께 넣어 봅니다.'],
                remember: '어려우면 검색어를 더 쉽게 바꿉니다.',
            },
            {
                title: '개인정보는 검색창에 쓰지 않기',
                idea: '이름, 전화번호, 주소 같은 정보는 검색창에 함부로 쓰지 않습니다.',
                analogy: '내 집 열쇠 번호를 길가에 적어 두지 않는 것과 같습니다.',
                practice: ['개인정보 예시를 세 가지 말해 봅니다.', '검색 전 보호자에게 물어볼 상황을 정합니다.'],
                remember: '검색창에도 내 비밀은 쓰지 않습니다.',
            },
            {
                title: '좋은 검색 습관',
                idea: '궁금한 것을 찾을 때는 차분히 읽고 필요한 내용만 고릅니다.',
                analogy: '마트에서 필요한 물건만 장바구니에 담는 것과 같습니다.',
                practice: ['검색 결과 제목을 먼저 읽습니다.', '읽기 어려운 곳은 뒤로 가기로 나옵니다.'],
                remember: '검색은 빨리 누르기보다 잘 고르기입니다.',
            },
            {
                title: '오늘의 안전 검색 약속',
                idea: '인터넷은 재미있지만 혼자 판단하기 어려운 곳도 있습니다.',
                analogy: '큰 시장에서는 보호자와 함께 다니면 더 안전한 것과 같습니다.',
                practice: ['모르는 사람, 이상한 광고, 개인정보 입력을 조심합니다.', '궁금한 것은 보호자와 함께 검색합니다.'],
                remember: '인터넷에서는 궁금함과 조심함을 함께 가져갑니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u09',
        unitNumber: 9,
        title: '안전한 디지털 사용',
        bookLabel: '2권 | 미디어·인터넷·안전',
        slides: [
            {
                title: '디지털 안전은 왜 필요할까요?',
                idea: '컴퓨터와 인터넷을 사용할 때 나와 내 정보를 지키는 방법이 필요합니다.',
                analogy: '놀이터에서 규칙을 지키면 안전하게 놀 수 있는 것과 같습니다.',
                practice: ['인터넷에서 조심해야 할 일을 떠올립니다.', '모르면 물어보기 약속을 합니다.'],
                remember: '디지털 안전은 나를 지키는 규칙입니다.',
            },
            {
                title: '개인정보 알아보기',
                idea: '이름, 얼굴 사진, 학교, 전화번호, 주소는 개인정보가 될 수 있습니다.',
                analogy: '개인정보는 내 가방 속 소중한 물건처럼 지켜야 합니다.',
                practice: ['개인정보 예시를 그림으로 떠올립니다.', '온라인에 쓰기 전 멈추는 연습을 합니다.'],
                remember: '나를 알아볼 수 있는 정보는 조심합니다.',
            },
            {
                title: '비밀번호는 열쇠예요',
                idea: '비밀번호는 내 계정에 들어가는 문을 잠그는 열쇠입니다.',
                analogy: '집 열쇠를 아무에게나 주지 않는 것처럼 비밀번호도 알려주지 않습니다.',
                practice: ['비밀번호를 말로 크게 읽지 않습니다.', '보호자와 안전한 비밀번호 규칙을 정합니다.'],
                remember: '비밀번호는 나만의 디지털 열쇠입니다.',
            },
            {
                title: '모르는 사람과 대화 조심',
                idea: '인터넷에서 만난 사람은 실제로 누구인지 알기 어렵습니다.',
                analogy: '가면을 쓴 사람이 누구인지 바로 알 수 없는 것과 같습니다.',
                practice: ['모르는 사람이 말을 걸면 보호자에게 말합니다.', '사진이나 정보를 보내지 않습니다.'],
                remember: '온라인 친구도 조심해서 만나야 합니다.',
            },
            {
                title: '광고와 다운로드 조심',
                idea: '반짝이는 광고나 다운로드 버튼은 위험한 곳으로 이어질 수 있습니다.',
                analogy: '길가의 낯선 사탕을 바로 먹지 않는 것과 같습니다.',
                practice: ['다운로드라는 말을 찾아봅니다.', '설치 버튼은 혼자 누르지 않기로 합니다.'],
                remember: '무언가 내려받을 때는 꼭 확인합니다.',
            },
            {
                title: '좋은 말로 댓글 쓰기',
                idea: '온라인에서도 친구 앞에서 말하듯 따뜻한 말을 사용해야 합니다.',
                analogy: '말은 종이비행기처럼 날아가 다른 사람 마음에 닿습니다.',
                practice: ['기분 좋은 댓글 예시를 말합니다.', '화가 나면 바로 쓰지 않고 쉬었다가 생각합니다.'],
                remember: '온라인 말도 진짜 마음에 닿습니다.',
            },
            {
                title: '화면 시간 정하기',
                idea: '눈과 몸을 위해 컴퓨터 사용 시간을 정하고 쉬는 시간이 필요합니다.',
                analogy: '운동도 쉬어야 더 오래 즐길 수 있는 것과 같습니다.',
                practice: ['시작하기 전 끝낼 시간을 정합니다.', '끝나면 물 마시기나 스트레칭을 합니다.'],
                remember: '쉬는 시간은 디지털 공부의 일부입니다.',
            },
            {
                title: '이상한 화면이 뜨면',
                idea: '놀라운 문구나 낯선 창이 뜨면 혼자 해결하려 하지 않습니다.',
                analogy: '길을 잃었을 때 뛰지 말고 제자리에 서서 도움을 요청하는 것과 같습니다.',
                practice: ['더 누르지 않고 화면을 그대로 둡니다.', '보호자나 선생님께 보여줍니다.'],
                remember: '이상하면 멈추고 도움을 요청합니다.',
            },
            {
                title: '공유하기 전 세 가지 확인',
                idea: '사진이나 글을 보내기 전 내용, 사람, 개인정보를 확인합니다.',
                analogy: '편지를 보내기 전 받는 사람과 내용을 다시 보는 것과 같습니다.',
                practice: ['누구에게 보내는지 확인합니다.', '내 정보가 들어 있는지 확인합니다.'],
                remember: '보내기 전에는 한 번 더 생각합니다.',
            },
            {
                title: '나만의 안전 약속 만들기',
                idea: '오늘 배운 안전 규칙 중 내가 꼭 지킬 약속을 정합니다.',
                analogy: '자전거를 탈 때 헬멧을 쓰는 내 규칙처럼 디지털 규칙도 필요합니다.',
                practice: ['모르면 물어보기, 비밀번호 지키기, 시간 정하기 중 하나를 고릅니다.', '가족과 함께 약속 문장을 말합니다.'],
                remember: '안전한 습관은 매일 조금씩 자랍니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u10',
        unitNumber: 10,
        title: '문제 해결 순서 익히기',
        bookLabel: '2권 | 미디어·인터넷·안전',
        slides: [
            {
                title: '문제는 천천히 볼 수 있어요',
                idea: '컴퓨터가 예상과 다르게 움직이면 먼저 무엇이 일어났는지 살펴봅니다.',
                analogy: '퍼즐 조각이 안 맞을 때 전체 그림을 다시 보는 것과 같습니다.',
                practice: ['지금 보이는 화면을 말로 설명합니다.', '마지막으로 누른 것을 떠올립니다.'],
                remember: '문제 해결은 관찰에서 시작합니다.',
            },
            {
                title: '멈추고 읽기',
                idea: '오류 문구나 안내 문구는 문제의 힌트가 될 수 있습니다.',
                analogy: '보물찾기 쪽지에 다음 힌트가 적혀 있는 것과 같습니다.',
                practice: ['팝업 창의 제목을 읽습니다.', '모르는 단어는 보호자에게 묻습니다.'],
                remember: '화면의 글자는 문제 해결 힌트입니다.',
            },
            {
                title: '전원과 연결 확인',
                idea: '기기가 안 켜지면 전원, 충전, 케이블처럼 기본 연결을 먼저 봅니다.',
                analogy: '물총에 물이 있는지 먼저 확인하는 것과 같습니다.',
                practice: ['충전 표시가 있는지 봅니다.', '케이블은 어른과 함께 확인합니다.'],
                remember: '기본 연결부터 확인하면 많은 문제가 풀립니다.',
            },
            {
                title: '소리가 안 날 때',
                idea: '소리가 안 나면 볼륨, 음소거, 이어폰 연결을 확인합니다.',
                analogy: '수도꼭지가 잠겨 있으면 물이 안 나오는 것과 같습니다.',
                practice: ['스피커 아이콘을 찾아봅니다.', '볼륨이 0인지 음소거인지 봅니다.'],
                remember: '소리 문제는 볼륨부터 확인합니다.',
            },
            {
                title: '인터넷이 안 될 때',
                idea: '인터넷이 느리거나 안 되면 와이파이 연결을 살펴봅니다.',
                analogy: '전화선이 끊기면 목소리가 가지 않는 것과 비슷합니다.',
                practice: ['와이파이 표시가 있는지 확인합니다.', '다른 사이트도 안 되는지 보호자와 봅니다.'],
                remember: '인터넷 문제는 연결 표시부터 봅니다.',
            },
            {
                title: '다시 시도하기',
                idea: '가끔은 잠깐 기다렸다가 다시 누르면 해결되기도 합니다.',
                analogy: '문이 잘 안 열릴 때 손잡이를 차분히 다시 잡는 것과 같습니다.',
                practice: ['버튼을 여러 번 빠르게 누르지 않습니다.', '잠깐 기다린 뒤 한 번만 다시 시도합니다.'],
                remember: '다시 시도는 천천히 한 번씩 합니다.',
            },
            {
                title: '되돌리기 사용하기',
                idea: '글이나 그림에서 실수하면 되돌리기로 이전 상태로 갈 수 있습니다.',
                analogy: '블록을 한 단계 전 모양으로 되돌리는 것과 같습니다.',
                practice: ['되돌리기 버튼 모양을 찾습니다.', '작은 실수를 만들고 되돌려 봅니다.'],
                remember: '되돌리기는 실수를 고치는 좋은 친구입니다.',
            },
            {
                title: '도움 요청 잘하기',
                idea: '도움을 받을 때는 무엇을 하다가 어떻게 되었는지 말하면 좋습니다.',
                analogy: '의사 선생님께 어디가 아픈지 말해야 도와줄 수 있는 것과 같습니다.',
                practice: ['제가 무엇을 눌렀는데 이렇게 됐어요 라고 말해 봅니다.', '화면을 그대로 보여줍니다.'],
                remember: '잘 설명하면 도움도 빨라집니다.',
            },
            {
                title: '문제 해결 순서 만들기',
                idea: '관찰하기, 읽기, 기본 확인, 다시 시도, 도움 요청 순서로 생각합니다.',
                analogy: '요리 순서처럼 차례대로 하면 덜 헷갈립니다.',
                practice: ['다섯 단계를 손가락으로 세어 봅니다.', '가상의 문제를 하나 정해 순서대로 말합니다.'],
                remember: '순서가 있으면 문제도 작아집니다.',
            },
            {
                title: '오늘의 해결사 연습',
                idea: '작은 문제를 차분히 해결하는 연습을 하면 컴퓨터가 덜 무섭습니다.',
                analogy: '미로도 한 칸씩 가면 출구를 찾을 수 있는 것과 같습니다.',
                practice: ['오늘 배운 순서를 다시 말합니다.', '다음에 문제가 생기면 먼저 멈추기로 약속합니다.'],
                remember: '차분한 순서가 최고의 문제 해결 도구입니다.',
            },
        ],
    }),
];

const BOOK3_UNITS: Unit[] = [
    makeUnit({
        id: 'kids-it-first-u11',
        unitNumber: 11,
        title: '코딩 전 생각 정리',
        bookLabel: '3권 | 디지털 표현과 마무리',
        slides: [
            {
                title: '코딩은 컴퓨터에게 설명하기',
                idea: '코딩은 컴퓨터가 이해할 수 있게 할 일을 차례대로 알려주는 것입니다.',
                analogy: '친구에게 종이접기 순서를 하나씩 알려주는 것과 같습니다.',
                practice: ['양치질 순서를 세 단계로 말합니다.', '순서가 바뀌면 어떻게 될지 생각합니다.'],
                remember: '코딩은 차례대로 알려주는 설명입니다.',
            },
            {
                title: '목표를 먼저 정해요',
                idea: '무엇을 만들지 정하면 필요한 순서를 생각하기 쉽습니다.',
                analogy: '블록으로 집을 만들지 자동차를 만들지 먼저 정하는 것과 같습니다.',
                practice: ['만들고 싶은 디지털 작품을 하나 고릅니다.', '작품 이름을 정합니다.'],
                remember: '목표가 있으면 길을 찾기 쉽습니다.',
            },
            {
                title: '필요한 재료 생각하기',
                idea: '작품에는 글자, 그림, 소리, 버튼 같은 재료가 필요할 수 있습니다.',
                analogy: '요리 전에 재료를 꺼내 두는 것과 같습니다.',
                practice: ['내 작품에 필요한 재료를 세 가지 말합니다.', '이미 있는 자료와 새로 만들 자료를 나눕니다.'],
                remember: '재료를 알면 만들기가 쉬워집니다.',
            },
            {
                title: '순서대로 적어 보기',
                idea: '컴퓨터에게 줄 말을 짧은 단계로 나누면 이해하기 쉽습니다.',
                analogy: '레고 설명서가 한 장면씩 나누어져 있는 것과 같습니다.',
                practice: ['먼저, 다음, 마지막 말을 사용합니다.', '세 단계 계획을 말로 적어 봅니다.'],
                remember: '큰 일은 작은 순서로 나눕니다.',
            },
            {
                title: '조건을 생각하기',
                idea: '만약 어떤 일이 생기면 무엇을 할지 정할 수 있습니다.',
                analogy: '비가 오면 우산을 쓰고, 맑으면 모자를 쓰는 규칙과 같습니다.',
                practice: ['만약 버튼을 누르면 소리가 난다 문장을 말합니다.', '내 작품의 만약 규칙을 하나 만듭니다.'],
                remember: '조건은 만약 이렇게 되면 이렇게 하라는 약속입니다.',
            },
            {
                title: '반복을 찾아보기',
                idea: '같은 일을 여러 번 해야 하면 반복으로 생각할 수 있습니다.',
                analogy: '줄넘기를 하나, 둘, 셋 계속 하는 것과 같습니다.',
                practice: ['매일 반복하는 일을 말합니다.', '작품에서 반복될 동작을 찾아봅니다.'],
                remember: '반복은 같은 일을 여러 번 하는 규칙입니다.',
            },
            {
                title: '실수도 계획에 넣기',
                idea: '틀렸을 때 어떻게 고칠지 생각하면 더 좋은 작품이 됩니다.',
                analogy: '미끄럼틀에서 다시 올라가 한 번 더 타는 것과 같습니다.',
                practice: ['버튼을 잘못 누르면 어떻게 할지 말합니다.', '되돌리기나 다시 시작을 떠올립니다.'],
                remember: '실수할 때의 길도 생각해 둡니다.',
            },
            {
                title: '그림으로 계획하기',
                idea: '말로 어려우면 간단한 그림으로 화면을 그려 볼 수 있습니다.',
                analogy: '집을 짓기 전에 설계도를 그리는 것과 같습니다.',
                practice: ['종이에 화면 모양을 그립니다.', '버튼과 그림이 어디 있을지 표시합니다.'],
                remember: '그림 계획은 만들기 전 지도입니다.',
            },
            {
                title: '친구에게 설명해 보기',
                idea: '내 계획을 다른 사람에게 설명하면 빠진 부분을 찾기 쉽습니다.',
                analogy: '길을 설명하다 보면 빠뜨린 모퉁이를 알게 되는 것과 같습니다.',
                practice: ['내 작품 계획을 한 문장으로 말합니다.', '친구나 보호자가 궁금해하는 점을 듣습니다.'],
                remember: '설명하면 내 생각이 더 또렷해집니다.',
            },
            {
                title: '작은 계획표 완성',
                idea: '목표, 재료, 순서, 조건, 반복을 간단히 정리합니다.',
                analogy: '소풍 가방을 챙긴 뒤 목록을 확인하는 것과 같습니다.',
                practice: ['오늘 만든 계획표를 다시 읽습니다.', '가장 먼저 만들 부분을 정합니다.'],
                remember: '좋은 코딩은 좋은 생각 정리에서 시작합니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u12',
        unitNumber: 12,
        title: '순서와 반복 감각',
        bookLabel: '3권 | 디지털 표현과 마무리',
        slides: [
            {
                title: '순서는 차례입니다',
                idea: '컴퓨터는 알려준 순서대로 일을 처리합니다.',
                analogy: '양말을 신은 뒤 신발을 신어야 편한 것과 같습니다.',
                practice: ['아침 준비 순서를 말합니다.', '순서가 바뀌면 이상한 일을 찾아봅니다.'],
                remember: '컴퓨터는 순서를 아주 중요하게 생각합니다.',
            },
            {
                title: '명령은 짧고 분명하게',
                idea: '컴퓨터에게는 한 번에 하나씩 분명한 명령을 주는 것이 좋습니다.',
                analogy: '친구에게 동시에 세 가지를 말하면 헷갈리는 것과 같습니다.',
                practice: ['일어나기, 걷기, 멈추기를 따로 말합니다.', '긴 일을 작은 말로 나눕니다.'],
                remember: '명령은 짧을수록 이해하기 쉽습니다.',
            },
            {
                title: '반복은 다시 하기',
                idea: '같은 일을 여러 번 하는 것을 반복이라고 합니다.',
                analogy: '박수를 세 번 치는 것도 반복입니다.',
                practice: ['박수 세 번을 해 봅니다.', '반복되는 행동을 생활에서 찾습니다.'],
                remember: '반복은 같은 일을 정해진 만큼 다시 하는 것입니다.',
            },
            {
                title: '몇 번 반복할까요?',
                idea: '반복은 몇 번 할지 정하면 더 정확합니다.',
                analogy: '줄넘기를 열 번 하겠다고 정하는 것과 같습니다.',
                practice: ['점프를 두 번, 박수를 세 번 해 봅니다.', '횟수를 바꾸면 결과가 달라지는지 봅니다.'],
                remember: '반복에는 횟수가 있을 수 있습니다.',
            },
            {
                title: '계속 반복도 있어요',
                idea: '어떤 일은 멈추라는 신호가 있을 때까지 계속 반복될 수 있습니다.',
                analogy: '음악이 멈출 때까지 춤추는 놀이와 같습니다.',
                practice: ['음악이 나오는 동안 손뼉 치기를 상상합니다.', '멈춤 신호가 왜 필요한지 말합니다.'],
                remember: '계속 반복에는 멈추는 조건이 필요합니다.',
            },
            {
                title: '패턴 찾기',
                idea: '반복되는 모양이나 소리를 찾으면 규칙을 알 수 있습니다.',
                analogy: '빨강, 파랑, 빨강, 파랑 구슬 줄에서 규칙을 찾는 것과 같습니다.',
                practice: ['색깔 패턴을 만들어 봅니다.', '다음에 올 색을 맞힙니다.'],
                remember: '패턴은 반복 속에 숨어 있는 규칙입니다.',
            },
            {
                title: '순서 카드 만들기',
                idea: '순서를 카드로 나누면 옮기며 바른 차례를 찾을 수 있습니다.',
                analogy: '동화 장면 카드를 이야기 순서대로 놓는 것과 같습니다.',
                practice: ['손 씻기 순서 카드를 상상합니다.', '카드를 바꿔 놓으면 어떤 문제가 생기는지 말합니다.'],
                remember: '순서 카드는 생각을 눈에 보이게 합니다.',
            },
            {
                title: '반복으로 쉽게 만들기',
                idea: '반복을 사용하면 같은 명령을 길게 쓰지 않아도 됩니다.',
                analogy: '같은 스티커를 열 번 붙일 때 하나씩 말하지 않고 열 번이라고 말하는 것과 같습니다.',
                practice: ['앞으로 한 걸음을 세 번이라고 말합니다.', '같은 말을 줄여 보는 연습을 합니다.'],
                remember: '반복은 같은 명령을 짧게 만드는 힘입니다.',
            },
            {
                title: '조건과 반복 함께 생각하기',
                idea: '반복은 조건과 함께 쓰이면 더 똑똑한 규칙이 됩니다.',
                analogy: '노래가 끝날 때까지 박수치기처럼 끝 조건이 있는 놀이입니다.',
                practice: ['불이 켜져 있는 동안 읽기 같은 문장을 만듭니다.', '멈추는 때를 정합니다.'],
                remember: '조건은 반복이 언제 멈출지 알려줍니다.',
            },
            {
                title: '순서와 반복으로 놀이 만들기',
                idea: '순서와 반복을 사용해 간단한 몸 움직임 놀이를 만들 수 있습니다.',
                analogy: '춤 동작을 순서대로 만들고 후렴을 반복하는 것과 같습니다.',
                practice: ['박수 두 번, 점프 한 번을 두 번 반복합니다.', '친구에게 순서를 알려 줍니다.'],
                remember: '순서와 반복은 코딩의 기본 리듬입니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u13',
        unitNumber: 13,
        title: '디지털 작품 만들기',
        bookLabel: '3권 | 디지털 표현과 마무리',
        slides: [
            {
                title: '작품 주제 정하기',
                idea: '디지털 작품은 내가 전하고 싶은 이야기를 담을 수 있습니다.',
                analogy: '도화지에 무엇을 그릴지 먼저 정하는 것과 같습니다.',
                practice: ['좋아하는 동물, 음식, 장소 중 하나를 고릅니다.', '작품 제목을 한 문장으로 정합니다.'],
                remember: '좋은 작품은 주제에서 시작합니다.',
            },
            {
                title: '화면 구성하기',
                idea: '제목, 그림, 버튼이 어디에 있을지 정하면 만들기 쉽습니다.',
                analogy: '방에 침대와 책상을 놓을 자리를 정하는 것과 같습니다.',
                practice: ['종이에 화면을 네모로 그립니다.', '제목과 그림 위치를 표시합니다.'],
                remember: '화면 구성은 작품의 자리 배치입니다.',
            },
            {
                title: '글자는 짧고 크게',
                idea: '어린이 작품의 글자는 읽기 쉽게 짧고 또렷하면 좋습니다.',
                analogy: '큰 표지판은 멀리서도 잘 보이는 것과 같습니다.',
                practice: ['긴 문장을 짧은 문장으로 바꿉니다.', '제목이 잘 보이는지 확인합니다.'],
                remember: '디지털 글자는 읽기 쉬워야 합니다.',
            },
            {
                title: '색은 너무 많지 않게',
                idea: '색을 너무 많이 쓰면 무엇이 중요한지 보기 어려울 수 있습니다.',
                analogy: '무지개 색을 모두 섞으면 탁해지는 것과 같습니다.',
                practice: ['주요 색 두 가지를 고릅니다.', '중요한 버튼에 같은 색을 씁니다.'],
                remember: '색은 적게, 분명하게 쓰면 좋습니다.',
            },
            {
                title: '버튼의 역할 정하기',
                idea: '버튼을 누르면 어떤 일이 일어날지 미리 정합니다.',
                analogy: '초인종을 누르면 딩동 소리가 나는 약속과 같습니다.',
                practice: ['시작 버튼과 다시 하기 버튼을 상상합니다.', '버튼 이름을 짧게 정합니다.'],
                remember: '버튼에는 분명한 약속이 필요합니다.',
            },
            {
                title: '소리나 움직임 넣기',
                idea: '작품에 소리나 움직임을 넣으면 더 재미있게 표현할 수 있습니다.',
                analogy: '그림책에 효과음 스티커를 붙이는 것과 같습니다.',
                practice: ['버튼을 누르면 나는 소리를 정합니다.', '그림이 움직일 방향을 말합니다.'],
                remember: '소리와 움직임은 작품에 생동감을 줍니다.',
            },
            {
                title: '저장하며 만들기',
                idea: '작품을 만드는 중간에도 저장하면 실수를 줄일 수 있습니다.',
                analogy: '탑을 쌓다가 중간중간 사진을 남기는 것과 같습니다.',
                practice: ['큰 변화 후 저장합니다.', '파일 이름에 작품 제목을 넣습니다.'],
                remember: '중간 저장은 작품을 지키는 습관입니다.',
            },
            {
                title: '테스트해 보기',
                idea: '작품을 직접 눌러 보며 예상대로 움직이는지 확인합니다.',
                analogy: '장난감을 만든 뒤 잘 굴러가는지 밀어 보는 것과 같습니다.',
                practice: ['버튼을 하나씩 눌러 봅니다.', '이상한 부분을 메모합니다.'],
                remember: '테스트는 작품이 잘 움직이는지 확인하는 시간입니다.',
            },
            {
                title: '고치고 다시 보기',
                idea: '테스트에서 찾은 부분을 조금씩 고치면 작품이 좋아집니다.',
                analogy: '그림을 그리고 색을 더하며 완성하는 것과 같습니다.',
                practice: ['고칠 점 하나를 정합니다.', '고친 뒤 다시 눌러 확인합니다.'],
                remember: '좋은 작품은 고치며 자랍니다.',
            },
            {
                title: '작품 완성 체크',
                idea: '제목, 그림, 버튼, 저장, 안전을 확인하면 발표 준비가 됩니다.',
                analogy: '소풍 전 가방을 한 번 더 확인하는 것과 같습니다.',
                practice: ['체크 목록을 하나씩 읽습니다.', '보호자나 친구에게 보여줄 준비를 합니다.'],
                remember: '완성은 확인까지 끝났을 때입니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u14',
        unitNumber: 14,
        title: '정리와 발표 준비',
        bookLabel: '3권 | 디지털 표현과 마무리',
        slides: [
            {
                title: '발표는 작품 이야기하기',
                idea: '발표는 내가 만든 작품을 다른 사람에게 소개하는 시간입니다.',
                analogy: '내가 만든 블록 집을 친구에게 구경시켜 주는 것과 같습니다.',
                practice: ['작품 제목을 또박또박 말합니다.', '무엇을 만들었는지 한 문장으로 말합니다.'],
                remember: '발표는 내 작품의 이야기를 나누는 일입니다.',
            },
            {
                title: '세 가지로 설명하기',
                idea: '무엇을 만들었는지, 어떻게 만들었는지, 무엇이 재미있는지 말하면 좋습니다.',
                analogy: '샌드위치를 빵, 속재료, 맛으로 설명하는 것과 같습니다.',
                practice: ['무엇, 어떻게, 재미있는 점을 적습니다.', '각각 한 문장으로 말합니다.'],
                remember: '세 가지 질문이 발표를 도와줍니다.',
            },
            {
                title: '파일과 폴더 정리',
                idea: '발표 전에 필요한 파일이 어디 있는지 확인해야 합니다.',
                analogy: '무대에 오르기 전 준비물을 가방에 넣는 것과 같습니다.',
                practice: ['작품 파일 위치를 찾습니다.', '필요 없는 파일은 발표 폴더에서 빼둡니다.'],
                remember: '정리된 파일은 발표를 편하게 만듭니다.',
            },
            {
                title: '화면을 미리 확인하기',
                idea: '발표할 화면이 잘 보이는지 미리 열어 봅니다.',
                analogy: '공연 전 조명을 켜 보고 무대 위치를 확인하는 것과 같습니다.',
                practice: ['작품을 한 번 실행합니다.', '글자가 잘 보이는지 확인합니다.'],
                remember: '발표 전 미리 보기는 꼭 필요합니다.',
            },
            {
                title: '목소리는 천천히',
                idea: '천천히 말하면 듣는 사람이 더 잘 이해합니다.',
                analogy: '계단을 한 칸씩 내려가면 넘어지지 않는 것과 같습니다.',
                practice: ['작품 제목을 천천히 말해 봅니다.', '중요한 말 앞에서 잠깐 쉽니다.'],
                remember: '천천히 말하면 생각도 잘 전달됩니다.',
            },
            {
                title: '친구 발표 듣기',
                idea: '다른 사람 발표를 들을 때는 눈과 귀를 발표자에게 둡니다.',
                analogy: '친구가 건네는 선물을 두 손으로 받는 것과 같습니다.',
                practice: ['좋았던 점 하나를 찾습니다.', '질문은 발표가 끝난 뒤 합니다.'],
                remember: '잘 듣는 것도 멋진 발표 태도입니다.',
            },
            {
                title: '좋은 피드백 말하기',
                idea: '피드백은 친구 작품이 더 좋아지도록 돕는 말입니다.',
                analogy: '식물이 자라도록 물을 주는 것과 같습니다.',
                practice: ['좋았던 점을 먼저 말합니다.', '고치면 더 좋을 점은 부드럽게 말합니다.'],
                remember: '피드백은 따뜻하고 구체적으로 말합니다.',
            },
            {
                title: '질문에 대답하기',
                idea: '질문을 받으면 모르는 것은 모른다고 말해도 괜찮습니다.',
                analogy: '아직 못 찾은 퍼즐 조각은 나중에 찾으면 됩니다.',
                practice: ['좋은 질문 감사합니다 라고 말해 봅니다.', '모르면 더 알아보고 알려줄게요 라고 연습합니다.'],
                remember: '모르는 것을 솔직히 말하는 것도 배움입니다.',
            },
            {
                title: '발표 후 저장과 백업',
                idea: '발표가 끝난 뒤에도 작품을 안전한 곳에 보관합니다.',
                analogy: '상장을 받은 뒤 파일에 넣어 보관하는 것과 같습니다.',
                practice: ['최종 파일 이름을 확인합니다.', '보호자와 함께 백업 위치를 정합니다.'],
                remember: '완성 작품은 안전하게 보관합니다.',
            },
            {
                title: '나의 성장 돌아보기',
                idea: '처음보다 무엇을 더 잘하게 되었는지 생각하면 자신감이 생깁니다.',
                analogy: '키가 자란 표시를 벽에 남기는 것과 같습니다.',
                practice: ['처음 어려웠던 것 하나를 말합니다.', '이제 할 수 있는 것 하나를 말합니다.'],
                remember: '배움은 내가 자란 흔적을 찾는 일입니다.',
            },
        ],
    }),
    makeUnit({
        id: 'kids-it-first-u15',
        unitNumber: 15,
        title: '첫걸음 마무리',
        bookLabel: '3권 | 디지털 표현과 마무리',
        slides: [
            {
                title: '컴퓨터 첫걸음 돌아보기',
                idea: '화면, 아이콘, 창, 마우스, 키보드, 파일을 배웠습니다.',
                analogy: '처음엔 낯선 놀이터였지만 이제 길을 조금 알게 된 것과 같습니다.',
                practice: ['가장 기억나는 단어를 하나 고릅니다.', '그 단어를 쉬운 말로 설명합니다.'],
                remember: '기본 이름을 알면 컴퓨터가 덜 낯설어집니다.',
            },
            {
                title: '내가 할 수 있는 조작',
                idea: '클릭, 드래그, 스크롤, 입력처럼 직접 해 본 기능을 떠올립니다.',
                analogy: '자전거의 페달, 브레이크, 손잡이를 익힌 것과 같습니다.',
                practice: ['클릭과 드래그의 차이를 말합니다.', '스크롤을 언제 쓰는지 설명합니다.'],
                remember: '조작은 손으로 익히는 컴퓨터 언어입니다.',
            },
            {
                title: '파일 정리 다시 보기',
                idea: '파일과 폴더를 알면 내가 만든 작품을 잘 찾을 수 있습니다.',
                analogy: '보물 상자에 이름표를 붙여 두는 것과 같습니다.',
                practice: ['파일과 폴더를 비교해 말합니다.', '저장이 왜 필요한지 설명합니다.'],
                remember: '저장과 정리는 내 작품을 지키는 방법입니다.',
            },
            {
                title: '인터넷 안전 다시 보기',
                idea: '검색, 개인정보, 비밀번호, 광고 조심을 다시 기억합니다.',
                analogy: '큰 길을 건널 때 좌우를 보는 습관과 같습니다.',
                practice: ['개인정보 세 가지를 말합니다.', '이상한 창이 뜨면 어떻게 할지 말합니다.'],
                remember: '인터넷에서는 멈추고 확인하는 습관이 중요합니다.',
            },
            {
                title: '문제 해결 순서 다시 보기',
                idea: '문제가 생기면 관찰하고, 읽고, 기본을 확인하고, 도움을 요청합니다.',
                analogy: '매듭을 풀 때 한 줄씩 천천히 보는 것과 같습니다.',
                practice: ['다섯 단계 순서를 말합니다.', '소리가 안 날 때 무엇부터 볼지 말합니다.'],
                remember: '문제는 순서대로 보면 작아집니다.',
            },
            {
                title: '코딩 생각 다시 보기',
                idea: '목표, 재료, 순서, 조건, 반복은 코딩 전 생각을 도와줍니다.',
                analogy: '요리 레시피처럼 만들기 전에 순서를 정하는 것과 같습니다.',
                practice: ['만약 문장을 하나 만듭니다.', '반복되는 행동을 하나 찾습니다.'],
                remember: '코딩은 생각을 순서로 정리하는 일입니다.',
            },
            {
                title: '좋은 디지털 시민',
                idea: '디지털 공간에서도 예의와 안전을 지키는 사람이 좋은 시민입니다.',
                analogy: '교실에서 친구를 배려하듯 온라인에서도 배려합니다.',
                practice: ['좋은 댓글 예시를 말합니다.', '공유 전 확인할 것을 말합니다.'],
                remember: '온라인에서도 친절과 안전은 똑같이 중요합니다.',
            },
            {
                title: '나의 디지털 약속',
                idea: '앞으로 컴퓨터를 사용할 때 지킬 나만의 약속을 정합니다.',
                analogy: '새 학기 목표를 정하는 것과 같습니다.',
                practice: ['모르면 물어보기 같은 약속을 하나 고릅니다.', '가족에게 약속을 말합니다.'],
                remember: '작은 약속이 좋은 습관을 만듭니다.',
            },
            {
                title: '다음에 배우고 싶은 것',
                idea: '컴퓨터 첫걸음 다음에는 코딩, 그림, 발표, 문제 해결을 더 배울 수 있습니다.',
                analogy: '첫 번째 계단을 오른 뒤 다음 계단을 보는 것과 같습니다.',
                practice: ['더 배우고 싶은 주제를 고릅니다.', '왜 배우고 싶은지 한 문장으로 말합니다.'],
                remember: '배움은 다음 궁금함으로 이어집니다.',
            },
            {
                title: '첫걸음 수료 축하',
                idea: '지금까지 배운 기본기를 가지고 더 안전하고 즐겁게 컴퓨터를 사용할 수 있습니다.',
                analogy: '작은 씨앗이 싹을 틔운 것처럼, 오늘 배움이 앞으로 자라납니다.',
                practice: ['내가 잘한 점 하나를 말합니다.', '다음 수업에서 도전할 점 하나를 정합니다.'],
                remember: '나는 컴퓨터를 안전하게 배우는 첫걸음을 해냈습니다.',
            },
        ],
    }),
];

export const KIDS_IT_CHAPTERS: Chapter[] = [
    {
        id: 'kids-it-first-1',
        chapterNumber: 1,
        title: '1단계 | 컴퓨터 탐험가',
        icon: 'computer',
        description: '화면과 입력 장치를 직접 조작하고 그림·글·파일을 만들며 디지털 도구의 기본기를 익힙니다.',
        ageLevel: 'elementary',
        recommendedGrade: '초등 1~2학년',
        units: BOOK1_UNITS,
    },
    {
        id: 'kids-it-first-2',
        chapterNumber: 2,
        title: '2단계 | 미디어 스토리텔러',
        icon: 'photo_camera',
        description: '그림·사진·소리·영상을 활용해 이야기를 만들고 검색과 디지털 안전 습관을 프로젝트로 익힙니다.',
        ageLevel: 'elementary',
        recommendedGrade: '초등 1~2학년',
        units: BOOK2_UNITS,
    },
    {
        id: 'kids-it-first-3',
        chapterNumber: 3,
        title: '3단계 | 코딩·디지털 창작자',
        icon: 'auto_stories',
        description: '순서·조건·반복으로 코딩 사고를 익히고 디지털 작품을 설계·제작·발표하는 최종 단계입니다.',
        ageLevel: 'elementary',
        recommendedGrade: '초등 1~2학년',
        units: BOOK3_UNITS,
    },
];
