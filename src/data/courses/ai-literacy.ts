import type { Chapter, LearningActivity, LessonPackage, Page, TeacherGuide, Unit } from './types';

interface AiProjectBlueprint {
    unitNumber: number;
    title: string;
    emoji: string;
    focus: string;
    mission: string;
    concept: string;
    experiment: string;
    build: string;
    deliverable: string;
    safety: string;
}

interface AiStudioPage {
    title: string;
    phase: '탐구' | '실험' | '설계' | '제작' | '공유';
    time: string;
    idea: string;
    task: string;
    checkpoint: string;
    activity?: LearningActivity;
}

export const AI_PROJECT_LAB_CURRICULUM_VERSION = '2026.1-foundation';

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
    if (unitNumber <= 6) return '1단계 · AI 탐구자';
    if (unitNumber <= 12) return '2단계 · AI 도구 창작자';
    if (unitNumber <= 18) return '3단계 · AI 문제 해결사';
    return '4단계 · AI 프로젝트 디렉터';
}

function getMaterials(unit: AiProjectBlueprint): string[] {
    const common = ['컴퓨터', 'AI 실험 기록지', '프로젝트 캔버스'];
    if (unit.unitNumber <= 6) return [...common, '교사가 준비한 안전한 사례·가상 데이터'];
    if (unit.unitNumber <= 12) return [...common, '교사 계정으로 준비한 AI 도구'];
    if (unit.unitNumber <= 18) return [...common, '사용자 테스트 체크리스트'];
    return [...common, '캡스톤 제작·발표 자료'];
}

function createActivity(unit: AiProjectBlueprint, kind: 'discover' | 'experiment' | 'build' | 'reflect'): LearningActivity {
    if (kind === 'discover') {
        return {
            label: '탐구 노트',
            prompt: `${unit.focus}에 관해 새롭게 안 점과 아직 궁금한 점을 각각 적어 보세요.`,
            placeholder: '새롭게 안 점: ___ / 궁금한 점: ___',
            example: unit.concept,
            minLength: 5,
        };
    }
    if (kind === 'experiment') {
        return {
            label: '실험 기록',
            prompt: '입력이나 조건 한 가지를 바꾸었을 때 결과가 어떻게 달라졌는지 기록하세요.',
            placeholder: '바꾼 것: ___ / 달라진 결과: ___ / 그렇게 생각한 근거: ___',
            example: unit.experiment,
            minLength: 5,
        };
    }
    if (kind === 'build') {
        return {
            label: '제작 로그',
            prompt: `내 ${unit.deliverable}에서 AI가 도운 일과 내가 결정·수정한 일을 구분해 적으세요.`,
            placeholder: 'AI가 도운 일: ___ / 내가 결정하거나 고친 일: ___',
            example: 'AI는 후보를 만들고, 나는 목적에 맞는 결과를 골라 직접 고쳤어요.',
            minLength: 5,
        };
    }
    return {
        label: '성장 리플렉션',
        prompt: '테스트 뒤 고친 점, 지킨 AI 안전 약속, 다음에 개선할 점을 적어 보세요.',
        placeholder: '고친 점: ___ / 안전 약속: ___ / 다음 개선: ___',
        example: unit.safety,
        minLength: 5,
    };
}

function createStudioPages(unit: AiProjectBlueprint): AiStudioPage[] {
    return [
        {
            title: `프로젝트 브리핑 · ${unit.title}`,
            phase: '탐구', time: '10분', idea: unit.mission,
            task: `오늘 완성할 결과물은 ‘${unit.deliverable}’입니다. 누구를 위해 무엇을 만들지 한 문장으로 정하세요.`,
            checkpoint: '사용자·문제·결과물을 내 말로 설명한다.',
        },
        {
            title: `핵심 개념 · ${unit.focus}`,
            phase: '탐구', time: '10분', idea: unit.concept,
            task: '생활 속 사례에서 입력, AI가 하는 일, 결과를 각각 찾아 화살표로 연결하세요.',
            checkpoint: `${unit.focus}를 사례와 연결해 설명한다.`,
            activity: createActivity(unit, 'discover'),
        },
        {
            title: '사례를 비교하고 AI의 역할 찾기',
            phase: '실험', time: '15분', idea: 'AI가 잘하는 일과 사람이 결정해야 하는 일을 구분해야 결과를 안전하게 사용할 수 있습니다.',
            task: `${unit.experiment} 먼저 결과를 예상하고 판단 근거를 기록하세요.`,
            checkpoint: '입력·처리·결과와 사람의 판단 지점을 구분한다.',
        },
        {
            title: '선생님 시범 · 입력에서 결과까지',
            phase: '실험', time: '15분', idea: '결과만 보지 않고 어떤 입력과 조건 때문에 결과가 나왔는지 관찰합니다.',
            task: `${unit.experiment} 시범 순서를 관찰하고 화면 변화를 세 단계로 정리하세요.`,
            checkpoint: '시범을 입력 → 처리 → 결과 순서로 설명한다.',
        },
        {
            title: '조건을 바꾸며 두 번 실험하기',
            phase: '실험', time: '20분', idea: '한 번에 한 조건만 바꾸어야 결과 차이의 까닭을 비교할 수 있습니다.',
            task: `${unit.experiment} 입력이나 조건 하나만 바꾸어 두 번째 실험을 하고 결과를 비교하세요.`,
            checkpoint: '두 결과의 같은 점과 다른 점을 근거와 함께 기록한다.',
            activity: createActivity(unit, 'experiment'),
        },
        {
            title: '프로젝트 캔버스 설계하기',
            phase: '설계', time: '15분', idea: '좋은 AI 프로젝트는 도구보다 사용자·문제·성공 기준을 먼저 정합니다.',
            task: `‘${unit.deliverable}’의 사용자, 필요한 입력, AI의 역할, 사람의 판단, 성공 기준을 설계하세요.`,
            checkpoint: '사용자·입력·결과·안전 약속이 있는 설계도를 완성한다.',
        },
        {
            title: '프로토타입 제작 · 핵심 기능',
            phase: '제작', time: '15분', idea: '가장 중요한 기능 하나가 처음부터 끝까지 작동하는 작은 버전을 먼저 만듭니다.',
            task: `${unit.build} 가장 단순한 입력 하나로 핵심 흐름부터 작동시키세요.`,
            checkpoint: '핵심 기능이 한 번 이상 작동하고 중간본이 저장되어 있다.',
        },
        {
            title: '프로토타입 제작 · 나의 판단 더하기',
            phase: '제작', time: '15분', idea: 'AI 결과를 그대로 제출하지 않고 목적에 맞게 고르고 수정한 이유를 남깁니다.',
            task: `${unit.build} 결과 설명·수정·다시 하기 중 필요한 기능을 더하고 내가 바꾼 부분을 표시하세요.`,
            checkpoint: 'AI가 도운 부분과 내가 결정·수정한 부분이 구분된다.',
            activity: createActivity(unit, 'build'),
        },
        {
            title: '레드팀 테스트 · 정확성·사용성·안전',
            phase: '공유', time: '10분', idea: unit.safety,
            task: '정상 입력, 애매한 입력, 잘못된 입력을 각각 시험하고 가장 중요한 문제를 한 번 고치세요.',
            checkpoint: '테스트 근거로 한 번 이상 수정하고 남은 한계를 표시한다.',
        },
        {
            title: '데모와 성장 기록',
            phase: '공유', time: '10분', idea: '완성 결과뿐 아니라 질문·실험·수정 과정을 설명하는 것이 프로젝트 학습의 핵심입니다.',
            task: `‘${unit.deliverable}’을 시연하며 문제, AI의 역할, 내가 고친 점, 다음 개선을 1분 안에 설명하세요.`,
            checkpoint: '작품과 제작 근거를 함께 발표하고 동료 피드백을 기록한다.',
            activity: createActivity(unit, 'reflect'),
        },
    ];
}

function createLessonPackage(unit: AiProjectBlueprint): LessonPackage {
    return {
        materials: getMaterials(unit),
        deliverable: unit.deliverable,
        completionCriteria: [
            `${unit.focus}의 핵심을 자신의 말로 설명한다.`,
            `${unit.deliverable}을 완성하고 AI와 사람의 역할을 구분한다.`,
            `테스트 결과로 한 번 이상 수정하고 “${unit.safety}” 약속을 지킨다.`,
        ],
        parentReport: `${unit.focus}의 원리를 직접 실험하고 ‘${unit.deliverable}’을 제작했습니다. AI 결과를 그대로 받아들이지 않고 비교·수정했으며, ${unit.safety}`,
    };
}

function createTeacherGuide(unit: AiProjectBlueprint, page: AiStudioPage, pageNumber: number): TeacherGuide {
    const support = unit.unitNumber <= 6
        ? '정답을 먼저 말하지 말고 “무엇을 보고 그렇게 판단했니?”라고 물어 근거를 말하게 하세요.'
        : 'AI가 대신 완성하지 않도록 학생의 예상·선택·수정 이유를 먼저 말하거나 기록하게 하세요.';
    return {
        objective: page.idea,
        say: `“AI가 정답을 대신 내는 시간이 아니라 우리가 질문하고 비교하고 결정하는 실험실입니다.” ${page.idea}`,
        questions: [
            `${page.title}에서 AI가 맡는 일과 사람이 맡는 일은 각각 무엇인가요?`,
            '결과가 믿을 만하고 안전한지 무엇을 보고 판단할 수 있을까요?',
        ],
        expectedAnswer: page.checkpoint,
        coaching: support,
        extension: `빠른 학생은 ${unit.focus}의 조건을 하나 더 바꾸어 세 번째 결과를 만들고 차이를 근거로 설명합니다.`,
        assessment: [page.task, page.checkpoint, pageNumber === 9 ? unit.safety : '학생이 선택과 수정 이유를 자신의 말로 설명하는지 확인합니다.'],
    };
}

function createPage(unit: AiProjectBlueprint, page: AiStudioPage, pageIndex: number): Page {
    const pageNumber = pageIndex + 1;
    const pageId = `ai-project-v1-${String((unit.unitNumber - 1) * 10 + pageNumber).padStart(3, '0')}`;
    const lessonPackage = createLessonPackage(unit);
    const plan = pageNumber === 1 ? `
        <div class="ai-lab-timeline" aria-label="120분 수업 순서">
            <strong>오늘의 120분</strong><span>탐구 20분</span><i>→</i><span>실험 50분</span><i>→</i><span>설계·제작 30분</span><i>→</i><span>공유 20분</span>
        </div>
        <div class="ai-lab-kit">
            <article><b>준비물</b><p>${getMaterials(unit).map(escapeHtml).join(' · ')}</p></article>
            <article><b>오늘의 결과물</b><p>${escapeHtml(unit.deliverable)}</p></article>
            <article><b>안전 기준</b><p>${escapeHtml(unit.safety)}</p></article>
        </div>
    ` : '';
    const finish = pageNumber === 10 ? `
        <div class="ai-lab-finish">
            <strong>스튜디오 출고 전 최종 점검</strong>
            <ol>${lessonPackage.completionCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
            <p><b>학부모 리포트</b>${escapeHtml(lessonPackage.parentReport)}</p>
        </div>
    ` : '';

    return {
        id: pageId,
        title: page.title,
        type: PAGE_TYPE,
        content: `
            <section class="ai-lab-slide ai-lab-studio" data-curriculum="${AI_PROJECT_LAB_CURRICULUM_VERSION}">
                <header class="ai-lab-header">
                    <div><small>CODING SSOK · AI PROJECT LAB</small><b>${getStageLabel(unit.unitNumber)}</b></div>
                    <span>${page.phase} · ${page.time}</span>
                </header>
                <div class="ai-lab-title-row">
                    <div class="ai-lab-unit-number">${String(unit.unitNumber).padStart(2, '0')}</div>
                    <div><p>${escapeHtml(unit.emoji)} ${escapeHtml(unit.focus)} · ${pageNumber}/10</p><h2>${escapeHtml(page.title)}</h2></div>
                </div>
                <section class="ai-lab-brief"><span>LAB NOTE</span><h3>오늘의 핵심</h3><p>${escapeHtml(page.idea)}</p></section>
                <div class="ai-lab-board">
                    <article><span>STUDIO TASK</span><h3>직접 해보기</h3><p>${escapeHtml(page.task)}</p></article>
                    <article><span>CHECKPOINT</span><h3>완료 기준</h3><p>${escapeHtml(page.checkpoint)}</p></article>
                </div>
                <aside class="ai-lab-ethics"><b>AI 사용 약속</b><p>${escapeHtml(unit.safety)}</p></aside>
                ${plan}${finish}
            </section>
        `,
        activity: page.activity,
        teacherGuide: createTeacherGuide(unit, page, pageNumber),
    };
}

function createUnit(unit: AiProjectBlueprint): Unit {
    return {
        id: `ai-project-v1-u${String(unit.unitNumber).padStart(2, '0')}`,
        unitNumber: unit.unitNumber,
        title: unit.title,
        subtitle: `${unit.focus} · 탐구 20분 · 실험 50분 · 설계·제작 30분 · 공유 20분`,
        duration: '120분',
        type: UNIT_TYPE,
        difficulty: unit.unitNumber <= 6 ? 1 : unit.unitNumber <= 18 ? 2 : 3,
        pages: createStudioPages(unit).map((page, index) => createPage(unit, page, index)),
        problemCount: 0,
        lessonPackage: createLessonPackage(unit),
    };
}

const AI_PROJECT_BLUEPRINTS: AiProjectBlueprint[] = [
    { unitNumber: 1, title: 'AI 탐정의 첫 번째 사건', emoji: '🕵️', focus: 'AI와 자동화 구분', mission: '생활 속 기술 사례를 관찰해 AI, 자동화, 사람이 직접 하는 일을 근거와 함께 구분합니다.', concept: '자동화는 정해진 규칙을 반복하고, AI는 데이터에서 찾은 패턴으로 분류·예측·생성 같은 판단을 돕습니다.', experiment: '추천 영상·자동문·번역·계산기 사례를 AI·자동화·사람 칸에 놓고 근거를 비교합니다.', build: '사례마다 입력·처리·결과를 화살표로 연결하고 애매한 사례에는 확인 질문을 붙입니다.', deliverable: '생활 기술 AI 탐정 지도', safety: 'AI처럼 보인다는 이유만으로 결과를 믿지 않고 작동 근거와 한계를 확인합니다.' },
    { unitNumber: 2, title: '데이터는 AI의 재료', emoji: '🧺', focus: '데이터와 특징', mission: '같은 대상을 여러 특징으로 관찰하고 AI가 배울 수 있는 일관된 데이터 카드로 정리합니다.', concept: '데이터는 관찰하거나 기록한 사실이고 특징은 대상을 구별할 때 살펴보는 성질입니다.', experiment: '사물 카드를 색·크기·모양·쓰임으로 기록한 뒤 빠진 값과 서로 다른 표현을 찾아봅니다.', build: '분류할 대상과 특징 세 가지를 정해 데이터 카드 20개와 데이터 사전을 만듭니다.', deliverable: '기준과 누락 점검이 포함된 데이터 카드 모음', safety: '이름·얼굴·연락처처럼 사람을 알아볼 수 있는 정보는 수집하지 않습니다.' },
    { unitNumber: 3, title: '분류 로봇 훈련소', emoji: '🤖', focus: '학습 데이터와 분류', mission: '두 범주의 예시를 준비하고 간단한 분류 모델을 훈련해 정확도와 오류를 비교합니다.', concept: '분류 AI는 정답이 표시된 여러 예시의 공통 패턴을 배우고 새로운 입력이 어느 범주에 가까운지 판단합니다.', experiment: '범주마다 비슷한 수의 예시를 입력하고 훈련에 쓰지 않은 자료 다섯 개로 결과를 확인합니다.', build: '실패 사례와 비슷한 데이터를 보충해 모델을 다시 훈련하고 1차·2차 결과를 비교합니다.', deliverable: '성공·실패 사례가 담긴 분류 모델 카드', safety: '친구 얼굴이나 몸을 허락 없이 촬영하지 않고 안전한 사물 데이터만 사용합니다.' },
    { unitNumber: 4, title: '추천 시스템의 비밀', emoji: '🎯', focus: '유사도와 추천', mission: '사용자의 선택 기록을 특징으로 바꾸고 비슷한 점을 근거로 설명 가능한 추천 규칙을 만듭니다.', concept: '추천은 선택 기록과 항목의 특징을 비교해 가능성이 높은 후보를 제안하지만 취향을 완전히 아는 정답은 아닙니다.', experiment: '책 카드의 장르·길이·난이도에 점수를 붙이고 가상 사용자와 많이 일치하는 책을 찾습니다.', build: '상위 추천 세 개와 각 추천의 근거, 다른 선택 보기 기능을 추천 보드에 넣습니다.', deliverable: '근거와 대안이 있는 책 추천 보드', safety: '추천 결과만 계속 보지 않고 다른 선택과 새로운 관점도 함께 확인합니다.' },
    { unitNumber: 5, title: '생성형 AI와 좋은 질문', emoji: '💬', focus: '생성형 AI와 프롬프트', mission: '목적·대상·조건·출력 형식이 있는 질문을 만들고 결과를 비교·수정해 원하는 초안을 얻습니다.', concept: '생성형 AI는 학습한 패턴으로 새 글·그림·소리의 초안을 만들지만 그럴듯한 오류도 만들 수 있습니다.', experiment: '같은 주제를 짧게 묻는 질문과 네 가지 조건을 담은 질문으로 요청해 결과를 비교합니다.', build: '질문을 두 번 개선하고 결과의 정확성·적합성·표현을 평가해 최종본을 직접 수정합니다.', deliverable: '세 번의 질문 개선 과정이 담긴 프롬프트 실험 노트', safety: '개인정보를 입력하지 않고 AI의 답을 사실 확인 없이 그대로 사용하지 않습니다.' },
    { unitNumber: 6, title: 'AI 공정성 재판소', emoji: '⚖️', focus: '편향·공정성·책임', mission: '한쪽으로 치우친 데이터가 판단에 미치는 영향을 실험하고 더 공정한 규칙을 제안합니다.', concept: '데이터나 기준이 일부 사람과 상황을 충분히 담지 못하면 AI 판단이 불공정해질 수 있습니다.', experiment: '치우친 가상 지원자 자료와 균형을 보완한 자료의 선택 결과를 비교합니다.', build: '개발자·사용자·검토자 관점으로 토론하고 사람 검토와 이의 제기가 있는 판결문을 만듭니다.', deliverable: '문제·영향·개선 규칙이 담긴 AI 공정성 판결문', safety: '사람에게 중요한 결정은 AI 결과만으로 확정하지 않고 반드시 사람이 검토합니다.' },
    { unitNumber: 7, title: '질문 설계 스튜디오', emoji: '❓', focus: '문제 정의와 질문 구조', mission: '막연한 부탁을 사용자·목적·맥락·제약·완료 기준이 있는 AI 작업 요청으로 바꿉니다.', concept: '좋은 질문은 길어서가 아니라 필요한 맥락과 판단 기준이 분명해 확인하고 개선할 수 있는 질문입니다.', experiment: '짧은 질문에 사용자·목적·조건을 한 칸씩 더하고 세 결과를 유용성 기준으로 평가합니다.', build: '입력 자료·금지 조건·출력 형식·확인 기준이 있는 세 수준의 질문 포트폴리오를 만듭니다.', deliverable: '질문과 결과 비교가 있는 질문 설계 포트폴리오', safety: '다른 사람의 개인정보·비밀·저작물을 허락 없이 질문에 넣지 않습니다.' },
    { unitNumber: 8, title: '글쓰기 AI 편집실', emoji: '✍️', focus: '요약·변환·사실 확인', mission: '직접 쓴 원문에 AI의 표현 제안을 받고 의미와 목소리를 지키며 최종 글을 편집합니다.', concept: 'AI 편집은 글쓴이를 대신하는 일이 아니라 원문의 목적을 지키며 구조·길이·표현을 비교하고 선택하는 과정입니다.', experiment: '원문의 핵심 세 가지를 표시한 뒤 친구용과 학부모용 요약에서 빠지거나 바뀐 뜻을 찾습니다.', build: 'AI 제안의 채택·거절 부분을 색으로 구분하고 내 표현을 살린 최종본과 수정 이유를 남깁니다.', deliverable: '원문·AI 제안·최종본이 있는 편집 전후 카드', safety: '사람·숫자·날짜·핵심 사실을 확인하며 최종 글의 책임은 작성자가 집니다.' },
    { unitNumber: 9, title: '이미지 AI 아트디렉터', emoji: '🎨', focus: '이미지 생성과 시각 의사소통', mission: '구도·대상·색·분위기·용도를 설계하고 여러 이미지 초안을 직접 편집해 메시지를 전달합니다.', concept: '이미지 AI는 문장을 시각 패턴으로 바꾸지만 글자·손·맥락·사실 표현에 오류가 생길 수 있습니다.', experiment: '같은 주제를 서로 다른 구도와 분위기로 요청하고 전달력과 오류를 기준으로 비교합니다.', build: '선택한 배경에 글자와 정보는 직접 편집하고 생성·선택·수정 과정을 작품 설명에 표시합니다.', deliverable: '제작 과정이 기록된 캠페인 포스터', safety: '실존 인물의 얼굴을 허락 없이 만들거나 속이는 이미지로 사용하지 않고 AI 활용을 밝힙니다.' },
    { unitNumber: 10, title: '소리와 음성 AI 방송국', emoji: '🎙️', focus: '음성 인식·합성과 오디오 정보', mission: '음성 인식과 합성의 차이를 실험하고 정확한 대본과 출처가 있는 30초 안내 방송을 만듭니다.', concept: '음성 인식은 소리를 글로, 음성 합성은 글을 소리로 바꾸며 발음·소음·언어에 따라 오류가 달라집니다.', experiment: '같은 문장을 속도와 소음을 바꾸어 말하고 인식 결과와 전달력을 비교합니다.', build: '직접 쓴 30초 대본을 녹음 또는 합성하고 숫자·이름·발음을 확인해 편집합니다.', deliverable: '대본과 변환 비교가 포함된 30초 안전 안내 방송', safety: '다른 사람의 목소리를 허락 없이 복제하지 않고 녹음 전에 동의를 받습니다.' },
    { unitNumber: 11, title: '나만의 이미지 분류 앱', emoji: '📷', focus: '모델 훈련과 인터페이스 연결', mission: '직접 만든 분류 모델의 예측을 사용자가 이해할 수 있는 화면과 연결합니다.', concept: 'AI 앱에는 모델뿐 아니라 입력 방법, 결과 설명, 확신이 낮을 때의 안내와 다시 시도하기가 필요합니다.', experiment: '훈련하지 않은 사물과 다른 배경에서 열 번 시험해 성공·실패 조건을 기록합니다.', build: '모델 입력과 결과 화면을 연결하고 설명 문구·다시 하기·한계 안내를 추가합니다.', deliverable: '결과 이유와 다시 시도 안내가 있는 이미지 분류 앱', safety: '사람의 신원·감정·능력을 판단하는 용도로 분류 모델을 사용하지 않습니다.' },
    { unitNumber: 12, title: '안전한 AI 챗봇 설계', emoji: '🗨️', focus: '대화 흐름과 안전 응답', mission: '질문 범위를 정하고 모르는 질문과 위험한 요청에 안전하게 대응하는 챗봇을 만듭니다.', concept: '좋은 챗봇은 무엇이든 답하는 척하지 않고 할 수 있는 일과 사람에게 도움을 요청할 상황을 분명히 안내합니다.', experiment: '자주 묻는 질문을 의도별로 묶고 정상·애매·위험 질문에 필요한 응답을 비교합니다.', build: '인사·수업 문의·모르는 질문 흐름과 사과·범위 안내·선생님 연결 문장을 구현합니다.', deliverable: '모름 처리와 도움 요청이 있는 학원 안내 챗봇', safety: '개인정보·의료·법률·위험 행동 질문은 임의로 답하지 않고 믿을 수 있는 어른에게 연결합니다.' },
    { unitNumber: 13, title: '문제 발견 인터뷰', emoji: '🔍', focus: '사용자 공감과 문제 정의', mission: '사용자를 관찰하고 열린 질문으로 인터뷰해 AI가 도울 가치가 있는 구체적인 문제를 찾습니다.', concept: '프로젝트는 기능이 아니라 실제 사용자의 어려움에서 시작하며 AI가 꼭 필요한지도 판단해야 합니다.', experiment: '짝 인터뷰에서 들은 사실과 나의 추측을 다른 색으로 기록하고 반복되는 불편을 찾습니다.', build: '사용자 말·관찰 근거를 묶어 “누가 언제 무엇 때문에 어렵다” 문제 문장을 만듭니다.', deliverable: '근거와 문제 문장이 담긴 문제 발견 캔버스', safety: '인터뷰 전에 동의를 받고 가상 이름을 쓰며 민감한 질문은 하지 않습니다.' },
    { unitNumber: 14, title: '좋은 데이터 설계소', emoji: '🗂️', focus: '데이터 계획과 품질', mission: '문제에 필요한 데이터와 필요하지 않은 데이터를 구분하고 안전한 수집·정리 계획을 만듭니다.', concept: '데이터는 많기보다 문제와 관련 있고 다양한 상황을 포함하며 수집 목적과 보관 방법이 분명해야 합니다.', experiment: '가상 데이터에서 누락·중복·표현 불일치·범주 불균형을 찾아 같은 규칙으로 고칩니다.', build: '데이터 출처·수·균형·이름 규칙·삭제 시점이 있는 데이터 사전과 명세서를 만듭니다.', deliverable: '품질과 개인정보를 점검한 프로젝트 데이터 명세서', safety: '목적에 필요하지 않은 개인정보는 수집하지 않고 프로젝트가 끝나면 삭제합니다.' },
    { unitNumber: 15, title: 'AI 기능 선택 회의', emoji: '🧩', focus: '문제·기술 적합성', mission: '분류·추천·생성·음성·규칙 기능 중 문제에 필요한 최소 기능을 근거로 선택합니다.', concept: '모든 문제에 AI가 필요한 것은 아니며 단순한 규칙으로 충분하면 그것이 더 안전하고 효율적일 수 있습니다.', experiment: '같은 문제의 AI 방식과 규칙 방식을 정확성·시간·데이터·안전 기준으로 비교합니다.', build: '반드시 필요한 기능·있으면 좋은 기능·이번 버전에서 뺄 기능을 나누어 의사결정서를 만듭니다.', deliverable: 'AI 사용 여부와 근거가 담긴 기술 의사결정서', safety: '정확성과 책임이 중요한 판단에는 사람이 최종 확인하는 단계를 둡니다.' },
    { unitNumber: 16, title: '화면 흐름 프로토타입', emoji: '🖥️', focus: '사용자 흐름과 피드백', mission: '사용자가 들어와 결과를 확인하고 오류에서 회복하는 과정을 종이와 화면 프로토타입으로 설계합니다.', concept: '프로토타입은 완성 전에 아이디어를 빠르게 보여 주고 사용자의 행동과 혼란을 발견하는 시험용 모형입니다.', experiment: '짝이 종이 화면을 설명 없이 사용하게 하고 멈춘 곳과 잘못 누른 곳을 관찰합니다.', build: '시작·입력·처리·결과·오류·다시 하기 화면을 만들고 핵심 버튼을 연결합니다.', deliverable: '오류 회복까지 연결된 클릭형 프로토타입', safety: 'AI 결과임을 표시하고 사용자가 결과를 수정·거절·다시 시도할 선택권을 줍니다.' },
    { unitNumber: 17, title: '프로토타입 1차 제작', emoji: '🛠️', focus: '최소 기능 제품', mission: '설계한 흐름에서 가장 중요한 AI 또는 규칙 기능 하나를 실제로 작동하게 만듭니다.', concept: '최소 기능 제품은 가장 위험한 가정을 빠르게 시험할 수 있는 작은 작동 버전입니다.', experiment: '정상 입력·경계 입력·잘못된 입력을 넣어 예상과 실제가 처음 달라지는 지점을 찾습니다.', build: '가장 단순한 입력과 결과를 연결하고 안내·오류·돌아가기 기능을 추가합니다.', deliverable: '입력부터 결과까지 작동하는 프로젝트 1차 버전', safety: '테스트에는 가상 데이터만 사용하고 실제 서비스가 아닌 프로토타입임을 표시합니다.' },
    { unitNumber: 18, title: '사용자 테스트와 개선', emoji: '🧪', focus: '증거 기반 개선', mission: '사용자의 실제 행동을 관찰하고 사실·해석·아이디어를 구분해 두 번째 버전을 만듭니다.', concept: '사용자 테스트는 칭찬받는 시간이 아니라 어디서 성공하고 막히는지 증거를 모아 더 나은 결정을 하는 과정입니다.', experiment: '사용자 말·행동·걸린 시간을 사실대로 기록하고 영향도와 수정 난이도로 우선순위를 정합니다.', build: '가장 많이 막힌 흐름 두 가지를 고치고 같은 시나리오로 전후 결과를 비교합니다.', deliverable: '세 명의 테스트 기록이 반영된 프로젝트 2차 버전', safety: '참여자에게 목적을 설명하고 원하지 않으면 언제든 테스트를 중단할 수 있게 합니다.' },
    { unitNumber: 19, title: '캡스톤 주제 선정', emoji: '🚀', focus: '프로젝트 제안과 범위', mission: '환경·학습·생활·문화 중 관심 문제를 선택하고 6회 안에 검증할 수 있는 범위를 정합니다.', concept: '좋은 캡스톤은 거대한 문제보다 한 사용자의 한 상황에서 확인할 수 있는 작은 변화를 목표로 합니다.', experiment: '아이디어를 중요성·실행 가능성·AI 적합성·안전성으로 평가해 가장 알맞은 주제를 고릅니다.', build: '사용자·문제 근거·핵심 기능·성공 기준·팀 역할·하지 않을 일이 있는 제안서를 만듭니다.', deliverable: '범위와 성공 기준이 분명한 캡스톤 제안서', safety: '사람에게 피해를 줄 판단·감시·개인정보 수집을 프로젝트 주제로 삼지 않습니다.' },
    { unitNumber: 20, title: '캡스톤 데이터와 출처', emoji: '📚', focus: '근거 수집과 출처 기록', mission: '캡스톤 자료를 신뢰성·저작권·개인정보 기준으로 선별하고 출처 목록을 만듭니다.', concept: '프로젝트의 신뢰도는 입력 자료의 품질과 출처 기록에서 시작하며 사용할 권리가 없는 자료는 쓰지 않습니다.', experiment: '같은 정보를 다룬 두 자료의 만든 곳·날짜·근거·사용 조건을 비교합니다.', build: '자료마다 제목·만든 곳·날짜·주소·사용 조건·선택 이유가 있는 출처 카드를 만듭니다.', deliverable: '사용 가능 여부가 표시된 캡스톤 데이터·출처 카드', safety: '출처와 사용 조건을 확인하고 개인정보와 허가 없는 저작물은 제외합니다.' },
    { unitNumber: 21, title: '캡스톤 핵심 엔진', emoji: '⚙️', focus: 'AI·규칙 로직 구현', mission: '캡스톤의 핵심 입력·처리·결과와 실패 상황을 연결한 작동 엔진을 만듭니다.', concept: '핵심 엔진은 입력을 어떤 규칙이나 모델로 처리하고 어떤 결과로 돌려줄지 정의한 중심 흐름입니다.', experiment: '정상·경계·잘못된 입력을 각각 두 번 넣고 예상과 달라지는 첫 지점을 디버깅합니다.', build: '핵심 기능을 끝까지 작동시킨 뒤 입력 확인·결과 설명·오류 안내를 연결합니다.', deliverable: '세 종류 입력을 안전하게 처리하는 캡스톤 핵심 기능', safety: 'AI가 모르는 상황에서는 추측 대신 확인할 수 없음과 다음 행동을 안내합니다.' },
    { unitNumber: 22, title: '캡스톤 경험 완성', emoji: '✨', focus: '인터페이스와 설명 가능성', mission: '핵심 엔진을 사용자가 이해하고 통제할 수 있는 화면과 연결해 처음부터 끝까지 사용할 수 있게 합니다.', concept: '사용자는 입력 방법, 결과의 의미와 한계, 수정·거절·다시 시도 방법을 이해할 수 있어야 합니다.', experiment: '처음 보는 친구가 설명 없이 핵심 과업을 끝내는지 관찰하고 클릭·멈춤·오류를 기록합니다.', build: '시작 안내·핵심 기능·결과 설명·수정·다시 하기·출처·한계를 연결합니다.', deliverable: '사용자가 통제할 수 있는 캡스톤 베타본', safety: 'AI 결과를 정답처럼 표현하지 않고 근거·한계·사람의 최종 판단을 함께 안내합니다.' },
    { unitNumber: 23, title: '레드팀 안전 점검', emoji: '🛡️', focus: '실패·오용·안전 테스트', mission: '어려운 입력과 오용 상황을 시험해 오류·편향·개인정보·과신 위험을 찾아 줄입니다.', concept: '레드팀 테스트는 예상 밖 상황과 악용 가능성을 먼저 찾아 사용자 피해를 줄이는 전문적인 안전 점검입니다.', experiment: '오류·편향·개인정보·과신 관점의 시나리오를 실행하고 심각도와 가능성을 평가합니다.', build: '큰 위험 세 가지를 경고·거절·사람 연결로 수정하고 남은 한계를 분명히 표시합니다.', deliverable: '위험 평가와 수정이 기록된 안전 보고서와 최종 후보본', safety: '가상 정보만 사용하고 실제 사람에게 피해를 주는 입력이나 행동은 시도하지 않습니다.' },
    { unitNumber: 24, title: 'AI 프로젝트 데모데이', emoji: '🏆', focus: '포트폴리오와 책임 있는 발표', mission: '문제 발견부터 데이터·실험·실패·개선·안전 판단까지 전 과정을 작품과 근거로 발표합니다.', concept: '좋은 발표는 기능뿐 아니라 누구의 문제를 어떻게 검증했고 무엇을 아직 해결하지 못했는지 투명하게 보여 줍니다.', experiment: '모의 발표에서 시간·핵심 메시지·시연 흐름·질문 응답을 확인하고 한 번 수정합니다.', build: '최종본과 백업을 저장하고 문제·AI 역할·실험·개선·안전·한계가 있는 포트폴리오를 완성합니다.', deliverable: '캡스톤 최종본·과정 포트폴리오·3분 책임 있는 AI 발표', safety: 'AI 사용 부분·사람의 판단·자료 출처·작품 한계를 투명하게 밝힙니다.' },
];

const AI_PROJECT_UNITS = AI_PROJECT_BLUEPRINTS.map(createUnit);

export const AI_LITERACY_CHAPTERS: Chapter[] = [
    {
        id: 'ai-project-v1-stage-1', chapterNumber: 1, title: '1단계 | AI 탐구자', icon: 'psychology',
        description: 'AI·데이터·분류·추천·생성·공정성의 원리를 실험하고 안전한 사용 기준을 세웁니다.',
        recommendedGrade: '초등 4학년~중학생', units: AI_PROJECT_UNITS.slice(0, 6),
    },
    {
        id: 'ai-project-v1-stage-2', chapterNumber: 2, title: '2단계 | AI 도구 창작자', icon: 'auto_fix_high',
        description: '텍스트·이미지·음성·분류·대화 도구를 목적에 맞게 사용하고 작은 AI 작품으로 연결합니다.',
        recommendedGrade: '초등 4학년~중학생', units: AI_PROJECT_UNITS.slice(6, 12),
    },
    {
        id: 'ai-project-v1-stage-3', chapterNumber: 3, title: '3단계 | AI 문제 해결사', icon: 'design_services',
        description: '사용자 문제를 발견하고 데이터·기능·화면을 설계해 테스트 가능한 AI 프로토타입을 만듭니다.',
        recommendedGrade: '초등 4학년~중학생', units: AI_PROJECT_UNITS.slice(12, 18),
    },
    {
        id: 'ai-project-v1-stage-4', chapterNumber: 4, title: '4단계 | AI 프로젝트 디렉터', icon: 'rocket_launch',
        description: '캡스톤을 기획·제작·안전 점검하고 과정 포트폴리오와 책임 있는 발표로 완성합니다.',
        recommendedGrade: '초등 4학년~중학생', units: AI_PROJECT_UNITS.slice(18, 24),
    },
];
