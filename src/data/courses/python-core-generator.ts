import type { Page, Quiz, Unit } from "./types";

export type QuizSpec = Quiz & { code?: string };

export type PracticeSpec = {
    title: string;
    question: string;
    codeTemplate: string;
    answer: string;
};

export type PythonCoreSessionSpec = {
    number: number;
    title: string;
    subtitle: string;
    concept: string;
    analogy: string;
    explanation: string;
    syntax: [string, string];
    predict: QuizSpec;
    guided: PracticeSpec;
    check: QuizSpec;
    build: PracticeSpec;
    debug: PracticeSpec;
    creative: PracticeSpec;
    checkpoint: QuizSpec;
    homework: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const escapeHtml = (value: string) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const displayCode = (value: string) => escapeHtml(value).replaceAll("\n", "<br />");

function slide(step: string, eyebrow: string, title: string, summary: string, body: string): string {
    return `
        <article class="pycore-slide">
            <header class="pycore-hero">
                <div><span class="pycore-step">STEP ${step}</span><span class="pycore-eyebrow">${eyebrow}</span></div>
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(summary)}</p>
            </header>
            <div class="pycore-body">${body}</div>
        </article>
    `;
}

function problem(sessionNumber: number, slot: number, spec: PracticeSpec, difficulty: 1 | 2 | 3) {
    return {
        id: 4000 + sessionNumber * 10 + slot,
        title: spec.title,
        difficulty,
        question: spec.question,
        answer: spec.answer,
        codeTemplate: spec.codeTemplate,
    } as const;
}

export function createPythonCoreSession(spec: PythonCoreSessionSpec): Unit {
    const prefix = `py-core-w${pad(spec.number)}`;
    const pages: Page[] = [
        {
            id: `${prefix}-p01`,
            title: "오늘의 미션과 120분 로드맵",
            type: "페이지",
            content: slide("01", "MISSION BRIEF", `${spec.concept}로 오늘의 결과물을 만들어요`, spec.subtitle, `
                <div class="pycore-mission-grid">
                    <section class="pycore-card"><span class="material-symbols-outlined">psychology</span><strong>이해하기</strong><p>${escapeHtml(spec.analogy)}</p></section>
                    <section class="pycore-card pycore-card-mint"><span class="material-symbols-outlined">terminal</span><strong>실행하기</strong><p>${escapeHtml(spec.syntax[0])}를 직접 입력하고 결과를 예측합니다.</p></section>
                    <section class="pycore-card pycore-card-purple"><span class="material-symbols-outlined">rocket_launch</span><strong>응용하기</strong><p>${escapeHtml(spec.creative.title)}까지 완성하고 설명합니다.</p></section>
                </div>
                <div class="pycore-route"><span>도입 10분</span><i></i><span>개념·예측 25분</span><i></i><span>코딩 35분</span><i></i><span>프로젝트 40분</span><i></i><span>정리 10분</span></div>
                <div class="pycore-callout"><b>오늘의 완성 기준</b><span>10단계 열람 · 확인 퀴즈 3개 · 코딩 실행 4개 · 내 코드 설명 1회</span></div>
            `),
        },
        {
            id: `${prefix}-p02`,
            title: `${spec.concept} 핵심 개념`,
            type: "페이지",
            content: slide("02", "CONCEPT", `${spec.concept}은 무엇일까요?`, spec.explanation, `
                <div class="pycore-split">
                    <section class="pycore-concept-card"><div class="pycore-icon-bubble"><span class="material-symbols-outlined">lightbulb</span></div><div><small>쉬운 비유</small><h3>${escapeHtml(spec.analogy)}</h3><p>${escapeHtml(spec.explanation)}</p></div></section>
                    <section class="pycore-concept-card"><div class="pycore-icon-bubble mint"><span class="material-symbols-outlined">data_object</span></div><div><small>파이썬 표현</small><h3>핵심 문법 두 가지</h3><code>${displayCode(spec.syntax[0])}</code><code style="margin-top:8px">${displayCode(spec.syntax[1])}</code></div></section>
                </div>
                <div class="pycore-question"><span class="material-symbols-outlined">forum</span><p><b>말로 설명하기</b> 두 코드가 각각 언제 필요한지 짝에게 한 문장으로 설명하세요.</p></div>
            `),
        },
        {
            id: `${prefix}-p03`,
            title: "실행 결과 예측",
            type: "퀴즈",
            content: slide("03", "PREDICT", "실행 버튼보다 생각이 먼저예요", "코드를 한 줄씩 따라가며 출력 결과를 먼저 적고 실행 결과와 비교합니다.", `
                <div class="pycore-code"><code>${displayCode(spec.predict.code ?? spec.syntax[0])}</code></div>
                <div class="pycore-rule"><b>예측 규칙</b><span>값의 시작 상태 → 실행 순서 → 바뀌는 값 → 최종 출력을 차례로 확인합니다.</span></div>
            `),
            quiz: spec.predict,
        },
        {
            id: `${prefix}-p04`,
            title: "따라 만들기",
            type: "페이지",
            content: slide("04", "GUIDED CODING", spec.guided.title, "예제의 실행 흐름을 확인한 뒤 값이나 문장 한 부분을 내 것으로 바꿉니다.", `
                <div class="pycore-steps"><div><b>1</b><span><strong>예측</strong><small>코드 실행 결과를 노트에 적기</small></span></div><div><b>2</b><span><strong>실행</strong><small>오른쪽 실행기와 아래 실습에서 확인하기</small></span></div><div><b>3</b><span><strong>변형</strong><small>값 두 곳을 바꾸고 다시 실행하기</small></span></div></div>
                <pre class="pycore-code"><code>${displayCode(spec.guided.codeTemplate)}</code></pre>
                <div class="pycore-check"><span>□ 결과를 예측했나요?</span><span>□ 코드가 오류 없이 실행됐나요?</span><span>□ 두 곳 이상 바꿨나요?</span></div>
            `),
            problems: [problem(spec.number, 1, spec.guided, 1)],
        },
        {
            id: `${prefix}-p05`,
            title: "개념 확인 퀴즈",
            type: "퀴즈",
            content: slide("05", "CONCEPT CHECK", `${spec.concept}의 규칙을 확인해요`, "외운 답이 아니라 코드가 동작하는 이유를 골라봅니다.", `
                <div class="pycore-score-grid"><div><span class="material-symbols-outlined">visibility</span><b>관찰</b><p>기호와 들여쓰기를 확인합니다.</p></div><div><span class="material-symbols-outlined">account_tree</span><b>순서</b><p>위에서 아래로 실행 흐름을 봅니다.</p></div><div><span class="material-symbols-outlined">compare_arrows</span><b>비교</b><p>예측과 실제 결과를 비교합니다.</p></div><div><span class="material-symbols-outlined">record_voice_over</span><b>설명</b><p>정답의 이유를 말합니다.</p></div></div>
            `),
            quiz: spec.check,
        },
        {
            id: `${prefix}-p06`,
            title: "핵심 기능 만들기",
            type: "페이지",
            content: slide("06", "BUILD", spec.build.title, "빈칸과 예시 값을 바꾸어 오늘 배운 문법이 실제 기능이 되도록 만듭니다.", `
                <div class="pycore-blueprint"><div><span>입력</span><b>준비 값</b><small>문제에서 사용할 값을 정합니다.</small></div><div><span>처리</span><b>핵심 문법</b><small>${escapeHtml(spec.concept)}을 적용합니다.</small></div><div><span>확인</span><b>중간 값</b><small>필요하면 print()로 확인합니다.</small></div><div><span>출력</span><b>결과 문장</b><small>사용자가 이해하기 쉽게 표시합니다.</small></div><div><span>응용</span><b>조건 변경</b><small>값을 바꾸어 다시 검사합니다.</small></div></div>
                <pre class="pycore-code"><code>${displayCode(spec.build.codeTemplate)}</code></pre>
            `),
            problems: [problem(spec.number, 2, spec.build, 2)],
        },
        {
            id: `${prefix}-p07`,
            title: "오류 찾고 고치기",
            type: "페이지",
            content: slide("07", "DEBUG MODE", spec.debug.title, "오류 메시지와 실행 흐름을 근거로 한 곳씩 고치고 다시 실행합니다.", `
                <div class="pycore-debug-flow"><div><b>1</b><span>재현<small>먼저 실행해 같은 오류 확인</small></span></div><i></i><div><b>2</b><span>분류<small>문법·이름·자료형·논리 구분</small></span></div><i></i><div><b>3</b><span>수정<small>한 번에 한 곳만 변경</small></span></div><i></i><div><b>4</b><span>검증<small>다른 값으로 한 번 더 실행</small></span></div></div>
                <div class="pycore-error-card"><span>DEBUG</span><code>${displayCode(spec.debug.codeTemplate)}</code><p>${escapeHtml(spec.debug.question)}</p></div>
            `),
            problems: [problem(spec.number, 3, spec.debug, 2)],
        },
        {
            id: `${prefix}-p08`,
            title: "나만의 응용 프로젝트",
            type: "페이지",
            content: slide("08", "CREATIVE CHALLENGE", spec.creative.title, "예제를 복사하는 데서 멈추지 않고 주제·값·출력 형식을 내 아이디어로 바꿉니다.", `
                <div class="pycore-choice-grid"><div><span>CHANGE</span><b>주제 바꾸기</b><p>내가 좋아하는 게임·음식·학교생활로 바꿉니다.</p></div><div><span>ADD</span><b>기능 더하기</b><p>조건이나 데이터 한 가지를 추가합니다.</p></div><div><span>EXPLAIN</span><b>코드 설명하기</b><p>가장 중요한 세 줄을 골라 이유를 말합니다.</p></div></div>
                <pre class="pycore-code"><code>${displayCode(spec.creative.codeTemplate)}</code></pre>
                <div class="pycore-callout"><b>창작 기준</b><span>예제에서 세 곳 이상 변경 · 오류 없이 실행 · 결과 확인 · 핵심 코드 설명</span></div>
            `),
            problems: [problem(spec.number, 4, spec.creative, 3)],
        },
        {
            id: `${prefix}-p09`,
            title: "이해도 점검",
            type: "퀴즈",
            content: slide("09", "CHECK POINT", `${spec.concept}을 스스로 설명할 수 있나요?`, "정답을 고른 뒤 왜 다른 선택지는 맞지 않는지도 짧게 설명합니다.", `
                <div class="pycore-score-grid"><div><span class="material-symbols-outlined">psychology</span><b>개념</b><p>핵심 용어를 내 말로 설명한다.</p></div><div><span class="material-symbols-outlined">play_arrow</span><b>실행</b><p>결과를 예측하고 확인한다.</p></div><div><span class="material-symbols-outlined">bug_report</span><b>디버깅</b><p>오류 원인을 찾아 수정한다.</p></div><div><span class="material-symbols-outlined">auto_awesome</span><b>응용</b><p>조건을 바꾸어 새 결과를 만든다.</p></div></div>
            `),
            quiz: spec.checkpoint,
        },
        {
            id: `${prefix}-p10`,
            title: "성장 기록과 선택 과제",
            type: "핵심정리",
            content: slide("10", "WRAP UP", `${spec.number}회차 성장을 기록해요`, "오른쪽 학습 노트에 오늘의 발견과 해결 과정을 남기고 수업 완료 기준을 확인합니다.", `
                <div class="pycore-reflection"><div><span>01</span><p><b>${escapeHtml(spec.concept)}을 한 문장으로 설명하기</b><small>정의와 사용 상황을 함께 적습니다.</small></p></div><div><span>02</span><p><b>오늘 해결한 오류 기록하기</b><small>오류 증상 → 원인 → 수정 내용을 순서대로 적습니다.</small></p></div><div><span>03</span><p><b>내 프로젝트에서 바꾼 점 쓰기</b><small>예제와 달라진 기능을 구체적으로 적습니다.</small></p></div></div>
                <div class="pycore-homework"><span class="material-symbols-outlined">home_work</span><div><small>선택 과제</small><h3>${escapeHtml(spec.homework)}</h3><p>완성한 코드를 저장하고 다음 수업 시작 10분 동안 실행 결과와 수정한 부분을 설명하세요.</p></div></div>
                <div class="pycore-selfcheck"><span>□ 도움이 필요해요</span><span>□ 예제를 보고 할 수 있어요</span><span>□ 혼자 만들 수 있어요</span><span>□ 새 문제에 응용할 수 있어요</span></div>
            `),
        },
    ];

    return {
        id: prefix,
        unitNumber: spec.number,
        title: `${spec.number}회차 · ${spec.title}`,
        subtitle: spec.subtitle,
        duration: "120분",
        type: spec.number % 12 === 0 ? "프로젝트" : "실습",
        difficulty: spec.number <= 12 ? 1 : spec.number <= 24 ? 2 : 3,
        pages,
        problemCount: 4,
    };
}
