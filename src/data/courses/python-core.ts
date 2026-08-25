import type { Chapter, Page, Unit } from './types';
import { createPythonCoreSession } from './python-core-generator';
import { PYTHON_CORE_LEVEL_1_SPECS } from './python-core-level1';
import { PYTHON_CORE_LEVEL_2_SPECS } from './python-core-level2';
import { PYTHON_CORE_LEVEL_3_SPECS } from './python-core-level3';

type SlideInput = {
    step: string;
    eyebrow: string;
    title: string;
    summary: string;
    body: string;
};

function slide({ step, eyebrow, title, summary, body }: SlideInput): string {
    return `
        <article class="pycore-slide">
            <header class="pycore-hero">
                <div>
                    <span class="pycore-step">STEP ${step}</span>
                    <span class="pycore-eyebrow">${eyebrow}</span>
                </div>
                <h2>${title}</h2>
                <p>${summary}</p>
            </header>
            <div class="pycore-body">${body}</div>
        </article>
    `;
}

const WEEK_01_PAGES: Page[] = [
    {
        id: 'py-core-w01-p01',
        title: '오늘의 미션',
        type: '페이지',
        content: slide({
            step: '01',
            eyebrow: 'MISSION BRIEF',
            title: '컴퓨터에게 첫 인사를 시켜요',
            summary: '오늘은 코드를 외우는 날이 아니라, 내가 쓴 명령이 어떤 결과를 만드는지 확인하는 날입니다.',
            body: `
                <div class="pycore-mission-grid">
                    <section class="pycore-card pycore-card-blue">
                        <span class="material-symbols-outlined">campaign</span>
                        <strong>출력하기</strong>
                        <p>print()로 글자와 계산 결과를 화면에 보여줍니다.</p>
                    </section>
                    <section class="pycore-card pycore-card-mint">
                        <span class="material-symbols-outlined">psychology</span>
                        <strong>예측하기</strong>
                        <p>실행 버튼을 누르기 전에 결과를 먼저 생각합니다.</p>
                    </section>
                    <section class="pycore-card pycore-card-purple">
                        <span class="material-symbols-outlined">build</span>
                        <strong>고쳐보기</strong>
                        <p>오류를 실패가 아닌 고칠 위치를 알려주는 단서로 봅니다.</p>
                    </section>
                </div>
                <div class="pycore-route">
                    <span>개념</span><i></i><span>예측</span><i></i><span>코딩</span><i></i><span>디버깅</span><i></i><span>창작</span>
                </div>
                <div class="pycore-callout"><b>오늘의 완성 기준</b><span>5줄 자기소개 프로그램 + 오류 1개 직접 수정 + 코드 한 부분 말로 설명하기</span></div>
            `,
        }),
    },
    {
        id: 'py-core-w01-p02',
        title: 'print()와 자료형',
        type: '페이지',
        content: slide({
            step: '02',
            eyebrow: 'CONCEPT',
            title: 'print()는 컴퓨터의 방송 마이크예요',
            summary: '괄호 안에 넣은 내용을 컴퓨터 화면으로 전달합니다. 글자와 숫자는 표현 방법이 다릅니다.',
            body: `
                <div class="pycore-split">
                    <section class="pycore-concept-card">
                        <div class="pycore-icon-bubble blue"><span class="material-symbols-outlined">record_voice_over</span></div>
                        <div><small>글자를 말할 때</small><h3>따옴표로 감싸기</h3><code>print(&quot;안녕하세요&quot;)</code><p>글자는 문장 그대로 화면에 나옵니다.</p></div>
                    </section>
                    <section class="pycore-concept-card">
                        <div class="pycore-icon-bubble mint"><span class="material-symbols-outlined">calculate</span></div>
                        <div><small>숫자를 계산할 때</small><h3>따옴표 없이 쓰기</h3><code>print(3 + 2)</code><p>숫자는 계산된 결과 5가 나옵니다.</p></div>
                    </section>
                </div>
                <div class="pycore-code-compare"><div><span>문자열 str</span><code>print(&quot;3 + 2&quot;)</code><b>결과 → 3 + 2</b></div><div><span>정수 int</span><code>print(3 + 2)</code><b>결과 → 5</b></div></div>
                <div class="pycore-question"><span class="material-symbols-outlined">lightbulb</span><p><b>생각 질문</b> 따옴표는 컴퓨터에게 어떤 약속을 알려주는 표시일까요?</p></div>
            `,
        }),
    },
    {
        id: 'py-core-w01-p03',
        title: '실행 결과 예측',
        type: '퀴즈',
        content: slide({
            step: '03',
            eyebrow: 'PREDICT',
            title: '실행하기 전에 결과를 먼저 예측해요',
            summary: '좋은 개발자는 실행 버튼을 빨리 누르는 사람이 아니라, 결과를 먼저 설명할 수 있는 사람입니다.',
            body: `
                <div class="pycore-predict-list">
                    <div><span>예측 A</span><code>print(&quot;안녕하세요&quot;)</code><p>따옴표 안의 글자는 어떻게 보일까요?</p></div>
                    <div><span>예측 B</span><code>print(&quot;3 + 2&quot;)</code><p>계산될까요, 그대로 보일까요?</p></div>
                    <div><span>예측 C</span><code>print(7 * 3)</code><p>곱셈 결과를 머릿속으로 먼저 계산해보세요.</p></div>
                </div>
                <div class="pycore-rule"><b>수업 규칙</b><span>예측하기 → 실행하기 → 결과 비교하기 → 다른 점을 한 문장으로 말하기</span></div>
            `,
        }),
        quiz: {
            question: 'print(3 + 2)의 실행 결과는 무엇인가요?',
            options: ['3 + 2', '5', '32', '오류가 발생한다'],
            answer: 1,
            explanation: '따옴표가 없는 3과 2는 숫자이므로 덧셈한 결과 5가 출력됩니다.',
        },
    },
    {
        id: 'py-core-w01-p04',
        title: '첫 파이썬 프로그램',
        type: '페이지',
        content: slide({
            step: '04',
            eyebrow: 'GUIDED CODING',
            title: '보고, 입력하고, 한 줄을 바꿔 실행해요',
            summary: '오른쪽 Python 실행기에 코드를 입력합니다. 실행이 되면 한 줄을 내 이야기로 바꿔보세요.',
            body: `
                <div class="pycore-steps">
                    <div><b>1</b><span><strong>새 파일 만들기</strong><small>week01_이름.py로 저장하기</small></span></div>
                    <div><b>2</b><span><strong>코드 직접 입력</strong><small>복사보다 손으로 입력하며 기호 확인하기</small></span></div>
                    <div><b>3</b><span><strong>실행 결과 확인</strong><small>예상과 같다면 문장 한 줄 바꾸기</small></span></div>
                </div>
                <pre class="pycore-code"><code>print(&quot;안녕하세요!&quot;)
print(&quot;저는 파이썬을 배우는 중이에요.&quot;)
print(3 + 2)</code></pre>
                <div class="pycore-check"><span>□ 파일 이름을 정했나요?</span><span>□ 세 줄을 직접 입력했나요?</span><span>□ 한 줄을 내 문장으로 바꿨나요?</span></div>
            `,
        }),
        problems: [{
            id: 3101,
            title: '첫 인사 프로그램 완성하기',
            difficulty: 1,
            question: '두 개의 인사 문장과 한 번의 숫자 계산이 출력되도록 실행해보세요.',
            answer: 'print() 안의 문자열에는 따옴표를 사용하고, 계산식에는 따옴표를 사용하지 않습니다.',
            codeTemplate: 'print("안녕하세요!")\nprint("저는 파이썬을 배우는 중이에요.")\nprint(3 + 2)',
        }],
    },
    {
        id: 'py-core-w01-p05',
        title: '문자열과 숫자 구별',
        type: '퀴즈',
        content: slide({
            step: '05',
            eyebrow: 'DATA TYPE CHECK',
            title: '글자와 숫자를 정확하게 구별해요',
            summary: '모양이 비슷해도 따옴표가 있으면 문자열, 따옴표가 없으면 계산할 수 있는 숫자입니다.',
            body: `
                <div class="pycore-sort-board">
                    <div class="label">코드 속 값</div><div class="label">문자열 str</div><div class="label">숫자 int</div>
                    <div><code>&quot;사과&quot;</code></div><div>□</div><div>□</div>
                    <div><code>100</code></div><div>□</div><div>□</div>
                    <div><code>&quot;100&quot;</code></div><div>□</div><div>□</div>
                    <div><code>8 + 2</code></div><div>□</div><div>□</div>
                </div>
                <div class="pycore-tip"><span class="material-symbols-outlined">visibility</span><p><b>관찰 포인트</b> 값의 생김새만 보지 말고 따옴표가 있는지 먼저 확인하세요.</p></div>
            `,
        }),
        quiz: {
            question: '숫자 100이 아니라 글자 100으로 처리되는 것은 무엇인가요?',
            options: ['100', '"100"', '100 + 0', '10 * 10'],
            answer: 1,
            explanation: '따옴표로 감싼 "100"은 계산용 숫자가 아니라 문자열입니다.',
        },
    },
    {
        id: 'py-core-w01-p06',
        title: '5줄 자기소개',
        type: '페이지',
        content: slide({
            step: '06',
            eyebrow: 'BUILD',
            title: '나를 소개하는 5줄 프로그램을 완성해요',
            summary: '정답을 그대로 복사하지 않고 이름, 좋아하는 것, 배우고 싶은 것을 내 이야기로 바꿉니다.',
            body: `
                <div class="pycore-blueprint">
                    <div><span>1줄</span><b>인사말</b><small>안녕하세요!</small></div>
                    <div><span>2줄</span><b>이름</b><small>제 이름은 ○○입니다.</small></div>
                    <div><span>3줄</span><b>좋아하는 것</b><small>저는 ○○을 좋아합니다.</small></div>
                    <div><span>4줄</span><b>배우는 것</b><small>파이썬을 배우고 있습니다.</small></div>
                    <div><span>5줄</span><b>숫자 계산</b><small>나이 또는 좋아하는 숫자 계산</small></div>
                </div>
                <div class="pycore-callout"><b>완성 기준</b><span>다섯 줄 이상 출력 · 내 문장 두 줄 이상 · 숫자 계산 한 번 · 오류 없이 실행</span></div>
            `,
        }),
        problems: [{
            id: 3102,
            title: '나의 5줄 자기소개',
            difficulty: 1,
            question: '빈칸을 내 정보로 바꾸고, 다섯 줄 이상 출력되는 자기소개 프로그램을 완성하세요.',
            answer: '문자열은 따옴표 안에 쓰고 마지막 줄에는 따옴표 없는 숫자 계산을 넣습니다.',
            codeTemplate: 'print("안녕하세요!")\nprint("제 이름은 ___입니다.")\nprint("저는 ___을 좋아합니다.")\nprint("파이썬을 배우고 있습니다.")\nprint(10 + 3)',
        }],
    },
    {
        id: 'py-core-w01-p07',
        title: '오류 메시지 읽기',
        type: '페이지',
        content: slide({
            step: '07',
            eyebrow: 'DEBUG MODE',
            title: '오류 메시지는 고칠 곳을 알려주는 단서예요',
            summary: '오류가 나면 코드를 전부 지우지 않습니다. 메시지와 해당 줄을 보고 한 곳씩 확인합니다.',
            body: `
                <div class="pycore-debug-flow"><div><b>1</b><span>멈추기<small>당황해서 코드를 지우지 않기</small></span></div><i></i><div><b>2</b><span>줄 찾기<small>오류가 가리키는 줄 확인</small></span></div><i></i><div><b>3</b><span>짝 확인<small>따옴표와 괄호의 짝 보기</small></span></div><i></i><div><b>4</b><span>다시 실행<small>한 곳만 고친 뒤 확인</small></span></div></div>
                <div class="pycore-error-card"><span>SyntaxError</span><code>print(&quot;안녕하세요)</code><p>시작한 따옴표와 끝나는 따옴표의 짝이 맞지 않습니다.</p></div>
                <div class="pycore-rule"><b>디버깅 약속</b><span>오류 이름 → 줄 번호 → 기호의 짝 → 한 곳 수정 → 다시 실행</span></div>
            `,
        }),
        problems: [{
            id: 3103,
            title: '따옴표 오류 고치기',
            difficulty: 1,
            question: '실행해서 오류를 확인한 뒤, 따옴표의 짝을 고쳐 정상적으로 출력하세요.',
            answer: '안녕하세요 뒤에 닫는 큰따옴표를 추가합니다: print("안녕하세요")',
            codeTemplate: 'print("안녕하세요)\nprint("오늘도 한 단계 성장!")',
        }],
    },
    {
        id: 'py-core-w01-p08',
        title: '나만의 시작 화면',
        type: '페이지',
        content: slide({
            step: '08',
            eyebrow: 'CREATIVE CHALLENGE',
            title: '나만의 프로그램 시작 화면을 디자인해요',
            summary: '게임, 퀴즈, 계산기 중 하나를 골라 사용자가 처음 보게 될 화면을 코드로 만듭니다.',
            body: `
                <div class="pycore-choice-grid"><div><span>GAME</span><b>숫자 모험</b><p>제목·환영 문장·시작 점수를 보여줍니다.</p></div><div><span>QUIZ</span><b>파이썬 퀴즈</b><p>제목·규칙·문제 수를 보여줍니다.</p></div><div><span>TOOL</span><b>미니 계산기</b><p>제목·가능한 계산·예시 결과를 보여줍니다.</p></div></div>
                <pre class="pycore-code"><code>print(&quot;================&quot;)
print(&quot;  PYTHON QUEST  &quot;)
print(&quot;================&quot;)
print(&quot;준비되면 시작합니다!&quot;)
print(10 + 20)</code></pre>
                <div class="pycore-check"><span>□ 제목이 있나요?</span><span>□ 사용자에게 규칙을 알려주나요?</span><span>□ 예제에서 두 줄 이상 바꿨나요?</span></div>
            `,
        }),
        problems: [{
            id: 3104,
            title: '시작 화면 창작하기',
            difficulty: 2,
            question: '예제의 제목과 안내 문장을 바꾸고, 여섯 줄 이상의 시작 화면을 완성하세요.',
            answer: '제목 장식, 프로그램 안내, 계산 결과가 포함되면 좋습니다. 정답은 하나가 아닙니다.',
            codeTemplate: 'print("================")\nprint("  MY PROGRAM  ")\nprint("================")\nprint("환영합니다!")\nprint("규칙을 적어보세요.")\nprint(10 + 20)',
        }],
    },
    {
        id: 'py-core-w01-p09',
        title: '이해도 확인',
        type: '퀴즈',
        content: slide({
            step: '09',
            eyebrow: 'CHECK POINT',
            title: '만든 것보다 이해한 것을 확인해요',
            summary: '결과를 설명하고 코드를 직접 바꾸며 오류를 고칠 수 있다면 오늘의 목표를 달성한 것입니다.',
            body: `
                <div class="pycore-score-grid"><div><span class="material-symbols-outlined">visibility</span><b>예측</b><p>실행 전 결과를 말할 수 있다.</p></div><div><span class="material-symbols-outlined">data_object</span><b>구별</b><p>문자열과 숫자를 구별할 수 있다.</p></div><div><span class="material-symbols-outlined">edit_square</span><b>변경</b><p>예제를 내 문장으로 바꿀 수 있다.</p></div><div><span class="material-symbols-outlined">bug_report</span><b>수정</b><p>오류 메시지를 보고 한 곳을 고칠 수 있다.</p></div></div>
                <div class="pycore-callout"><b>통과 기준</b><span>개념 문제 해결 + 코드 한 줄 변경 + 오류 수정 과정을 말로 설명하기</span></div>
            `,
        }),
        quiz: {
            question: '코드에서 오류가 발생했을 때 가장 좋은 첫 행동은 무엇인가요?',
            options: ['코드를 전부 지운다', '무조건 선생님을 부른다', '오류 이름과 줄 번호를 확인한다', '컴퓨터를 다시 켠다'],
            answer: 2,
            explanation: '오류 메시지는 고칠 위치와 원인의 단서를 줍니다. 먼저 오류 이름과 줄 번호를 확인합니다.',
        },
    },
    {
        id: 'py-core-w01-p10',
        title: '성장 기록과 선택 과제',
        type: '핵심정리',
        content: slide({
            step: '10',
            eyebrow: 'WRAP UP',
            title: '오늘의 성장을 다음 수업으로 연결해요',
            summary: '오른쪽 학습 노트에 오늘 알게 된 것, 해결한 오류, 다음에 만들고 싶은 것을 기록하세요.',
            body: `
                <div class="pycore-reflection"><div><span>01</span><p><b>오늘 새롭게 알게 된 것</b><small>print(), 따옴표, 문자열과 숫자 중 하나를 설명합니다.</small></p></div><div><span>02</span><p><b>처음에는 어려웠지만 해결한 것</b><small>오류를 어떻게 발견하고 고쳤는지 순서대로 적습니다.</small></p></div><div><span>03</span><p><b>다음 시간에 더 해보고 싶은 것</b><small>게임·퀴즈·도구 중 만들고 싶은 것을 적습니다.</small></p></div></div>
                <div class="pycore-homework"><span class="material-symbols-outlined">home_work</span><div><small>선택 과제</small><h3>가족을 위한 응원 메시지 프로그램</h3><p>문자열을 세 번 이상, 숫자 계산을 한 번 이상 출력하고 <b>session01_home_이름.py</b>로 저장하세요.</p></div></div>
                <div class="pycore-selfcheck"><span>□ 도움이 필요해요</span><span>□ 조금 알겠어요</span><span>□ 혼자 할 수 있어요</span><span>□ 바꾸어 응용할 수 있어요</span></div>
            `,
        }),
    },
];

const SESSION_01_UNIT: Unit = {
    id: 'py-core-w01',
    unitNumber: 1,
    title: '1회차 · 컴퓨터에게 첫 인사를 시켜요',
    subtitle: 'print(), 문자열과 숫자, 첫 디버깅',
    duration: '120분',
    type: '실습',
    difficulty: 1,
    pages: WEEK_01_PAGES,
    problemCount: 4,
};

const LEVEL_1_UNITS = [SESSION_01_UNIT, ...PYTHON_CORE_LEVEL_1_SPECS.map(createPythonCoreSession)];
const LEVEL_2_UNITS = PYTHON_CORE_LEVEL_2_SPECS.map(createPythonCoreSession);
const LEVEL_3_UNITS = PYTHON_CORE_LEVEL_3_SPECS.map(createPythonCoreSession);

export const PYTHON_CORE_CHAPTERS: Chapter[] = [
    {
        id: 'python-core-level-1',
        chapterNumber: 1,
        title: 'Python Core 1단계 · 문법과 문제해결',
        icon: 'terminal',
        description: '1~12회차 · 출력부터 함수와 첫 퀴즈 프로젝트까지 완성합니다.',
        recommendedGrade: '초 5 ~ 중 2',
        units: LEVEL_1_UNITS,
    },
    {
        id: 'python-core-level-2',
        chapterNumber: 2,
        title: 'Python Core 2단계 · 데이터와 설계',
        icon: 'account_tree',
        description: '13~24회차 · 자료구조, 함수 설계, 파일, 알고리즘, 클래스를 프로젝트에 결합합니다.',
        recommendedGrade: '초 6 ~ 중 3',
        units: LEVEL_2_UNITS,
    },
    {
        id: 'python-core-level-3',
        chapterNumber: 3,
        title: 'Python Core 3단계 · 알고리즘과 캡스톤',
        icon: 'deployed_code',
        description: '25~36회차 · 객체 설계, 데이터 처리, 테스트, 알고리즘과 최종 작품 발표를 완성합니다.',
        recommendedGrade: '중 1 ~ 중 3',
        units: LEVEL_3_UNITS,
    },
];

