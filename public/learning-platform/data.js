const CATEGORIES = [
    { id: 'cos-block', name: 'COS 블록코딩', desc: 'Entry/Scratch 기반 SW코딩자격' },
];

const TERMS = [
    {
        id: 'tool-usage', category: 'cos-block', name: '프로그래밍 도구', hanja: 'Tool Usage',
        short: 'Entry/Scratch 인터페이스와 스프라이트 기본 조작', color: '#8b5cf6', icon: 'speed',
        sections: [
            { type: 'definition', title: '정의', content: '프로그래밍 도구 활용은 Entry나 Scratch의 화면 구성(무대, 스프라이트 목록, 블록 팔레트, 코딩 영역)을 이해하고 기본적인 프로그램을 작성할 수 있는 능력입니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '무대(Stage)', desc: '프로그램 실행 결과가 보이는 화면. 가로 480, 세로 360 픽셀 (Scratch 기준)' },
                    { label: '스프라이트(Sprite)', desc: '무대 위에서 동작하는 캐릭터나 객체. 모양·소리·코드를 가짐' },
                    { label: '블록 팔레트', desc: '사용할 수 있는 블록들이 카테고리별로 정리된 영역' },
                    { label: '코딩 영역', desc: '블록을 드래그하여 조합하는 프로그래밍 작업 공간' },
                    { label: '좌표계', desc: 'x축(가로 -240~240), y축(세로 -180~180), 중앙이 (0,0)' },
                ]
            },
            {
                type: 'compare', title: 'Entry vs Scratch 비교', headers: ['항목', 'Entry', 'Scratch'],
                rows: [
                    ['개발사', '네이버 커넥트재단', 'MIT 미디어랩'],
                    ['언어', '한국어 기반', '다국어 지원'],
                    ['좌표 범위', '-240~240, -135~135', '-240~240, -180~180'],
                    ['시작 블록', '시작하기 버튼을 클릭했을 때', '깃발 클릭 시'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'Scratch에서 무대의 크기는?', choices: ['480×360 픽셀', '640×480 픽셀', '320×240 픽셀', '800×600 픽셀'], answer: 0, explanation: 'Scratch의 무대 크기는 가로 480, 세로 360 픽셀입니다.' },
                    { q: '스프라이트의 좌표 (0, 0)은 무대의 어디에 위치하는가?', choices: ['왼쪽 상단', '오른쪽 하단', '정중앙', '왼쪽 하단'], answer: 2, explanation: '좌표 (0, 0)은 무대의 정중앙입니다.' },
                    { q: 'Entry에서 프로그램 실행을 시작하는 블록은?', choices: ['시작하기 버튼을 클릭했을 때', '깃발 클릭 시', 'Enter 키를 눌렀을 때', '마우스를 클릭했을 때'], answer: 0, explanation: 'Entry에서는 "시작하기 버튼을 클릭했을 때" 블록으로 프로그램을 시작합니다.' },
                    { q: '스프라이트에 포함되지 않는 것은?', choices: ['모양(코스튬)', '소리', '변수 선언', '무대 배경'], answer: 3, explanation: '무대 배경은 스프라이트가 아닌 무대(Stage)에 속합니다.' },
                    { q: 'Scratch에서 x좌표의 범위는?', choices: ['-240 ~ 240', '-180 ~ 180', '0 ~ 480', '-100 ~ 100'], answer: 0, explanation: 'Scratch의 x좌표 범위는 -240부터 240까지입니다.' },
                    { q: '블록 팔레트에서 "동작" 카테고리에 해당하는 블록은?', choices: ['10만큼 움직이기', '1초 기다리기', '안녕 말하기', '만약~이라면'], answer: 0, explanation: '"10만큼 움직이기"는 동작(Motion) 카테고리의 대표 블록입니다.' },
                    { q: '코딩 영역에서 블록을 삭제하는 방법은?', choices: ['블록을 팔레트로 드래그', '블록을 더블클릭', '블록에서 우클릭 후 복사', '무대를 클릭'], answer: 0, explanation: '코딩 영역의 블록을 블록 팔레트로 드래그하면 삭제됩니다.' },
                    { q: '하나의 프로젝트에서 스프라이트를 여러 개 사용할 수 있는가?', choices: ['예, 여러 개 가능', '아니오, 1개만 가능', '최대 3개까지', '최대 10개까지'], answer: 0, explanation: '하나의 프로젝트에서 여러 스프라이트를 추가하여 사용할 수 있습니다.' },
                ]
            },
            { type: 'tip', content: 'COS 시험에서는 Entry와 Scratch의 인터페이스 차이를 묻는 문제가 자주 출제됩니다. 특히 좌표 범위와 시작 블록 이름의 차이를 정확히 알아두세요!' }
        ], related: ['loops', 'coordinates'],
    },
    {
        id: 'loops', category: 'cos-block', name: '반복문', hanja: 'Loop / Iteration',
        short: '동일한 동작을 여러 번 실행하는 제어 구조', color: '#06b6d4', icon: 'accuracy',
        sections: [
            { type: 'definition', title: '정의', content: '반복문은 특정 블록(코드)을 여러 번 반복 실행하는 제어 구조입니다. 횟수 반복, 무한 반복, 조건 반복 등이 있으며, 코드의 효율성을 높이는 핵심 개념입니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '횟수 반복', desc: '"N번 반복하기" — 정해진 횟수만큼 실행 (예: 10번 반복하기)' },
                    { label: '무한 반복', desc: '"계속 반복하기" — 프로그램이 멈출 때까지 계속 실행' },
                    { label: '조건 반복', desc: '"~까지 반복하기" — 조건이 참이 될 때까지 반복 (while문과 유사)' },
                    { label: '이중 반복', desc: '반복문 안에 반복문을 넣는 구조. 구구단, 별 찍기 등에 활용' },
                    { label: '반복 제어', desc: '반복 중단하기(break) 개념으로 반복을 조기 종료' },
                ]
            },
            {
                type: 'compare', title: '반복문 종류 비교', headers: ['종류', '블록 형태', '실행 횟수', '주요 용도'],
                rows: [
                    ['횟수 반복', 'N번 반복하기', '정해진 N번', '도형 그리기, 정해진 횟수 동작'],
                    ['무한 반복', '계속 반복하기', '무한', '게임 루프, 키 입력 감지'],
                    ['조건 반복', '~까지 반복하기', '조건 충족까지', '특정 조건 달성 시 멈춤'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: '"10번 반복하기" 블록 안에 "10만큼 움직이기"를 넣으면 스프라이트는 총 몇 만큼 이동하는가?', choices: ['10', '20', '100', '1000'], answer: 2, explanation: '10번 × 10만큼 = 총 100만큼 이동합니다.' },
                    { q: '무한 반복문을 멈추려면 어떻게 해야 하는가?', choices: ['프로그램 정지 버튼 클릭', '반복문을 삭제', '조건 블록 추가', '타이머 설정'], answer: 0, explanation: '무한 반복은 프로그램 정지 버튼을 클릭하거나 "모든 코드 멈추기" 블록으로 종료합니다.' },
                    { q: '다음 중 이중 반복문의 실행 횟수가 올바른 것은? (바깥 3번, 안쪽 4번)', choices: ['3번', '4번', '7번', '12번'], answer: 3, explanation: '이중 반복문의 총 실행 횟수 = 바깥 × 안쪽 = 3 × 4 = 12번입니다.' },
                    { q: '"~까지 반복하기" 블록의 조건이 처음부터 참이면?', choices: ['한 번도 실행하지 않음', '1번 실행', '무한 반복', '오류 발생'], answer: 0, explanation: '조건이 이미 참이면 반복 블록 안의 코드가 실행되지 않습니다.' },
                    { q: '정삼각형을 그리기 위한 반복 횟수와 회전 각도는?', choices: ['3번, 120도', '4번, 90도', '3번, 60도', '6번, 60도'], answer: 0, explanation: '정삼각형: 3번 반복, 외각 = 360÷3 = 120도 회전합니다.' },
                    { q: '정사각형을 그리기 위해 "N번 반복하기"의 N은?', choices: ['2', '3', '4', '5'], answer: 2, explanation: '정사각형은 4개의 변이 있으므로 4번 반복합니다.' },
                    { q: '반복문 없이 같은 동작을 5번 하려면 블록을 몇 개 나열해야 하는가?', choices: ['1개', '3개', '5개', '10개'], answer: 2, explanation: '반복문 없이는 동일한 블록을 5개 나열해야 합니다. 반복문을 쓰면 훨씬 효율적입니다.' },
                    { q: '"계속 반복하기" 안에 "만약 스페이스 키를 눌렀다면 → 점프" 블록을 넣으면?', choices: ['스페이스 키를 누를 때마다 점프', '한 번만 점프', '프로그램이 멈춤', '오류 발생'], answer: 0, explanation: '무한 반복 안에서 키 입력을 계속 감지하므로, 키를 누를 때마다 점프합니다.' },
                ]
            },
            { type: 'tip', content: '정다각형 그리기 공식: "N번 반복하기 → 이동 + (360÷N)도 회전"이 COS 시험에서 매우 자주 출제됩니다!' }
        ], related: ['conditionals', 'coordinates'],
    },
    {
        id: 'conditionals', category: 'cos-block', name: '조건문', hanja: 'Conditional',
        short: '조건에 따라 다른 동작을 실행하는 제어 구조', color: '#10b981', icon: 'transmission',
        sections: [
            { type: 'definition', title: '정의', content: '조건문은 주어진 조건이 참(True)인지 거짓(False)인지에 따라 서로 다른 블록(코드)을 실행하는 분기 구조입니다. "만약~이라면", "만약~이라면/아니면" 등의 형태가 있습니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '단순 조건문', desc: '"만약 ~이라면" — 조건이 참일 때만 실행' },
                    { label: '이중 조건문', desc: '"만약 ~이라면 / 아니면" — 참과 거짓에 대해 각각 다른 코드 실행' },
                    { label: '중첩 조건문', desc: '조건문 안에 또 다른 조건문을 넣어 여러 경우를 처리' },
                    { label: '비교 연산자', desc: '= (같다), > (크다), < (작다) 등으로 조건을 구성' },
                    { label: '논리 연산자', desc: '"그리고(AND)", "또는(OR)", "~이 아니다(NOT)" 조합' },
                ]
            },
            {
                type: 'compare', title: '조건문 유형 비교', headers: ['유형', '구조', '사용 예'],
                rows: [
                    ['단순(if)', '만약 ~이라면 { }', '점수≥60이면 "합격" 출력'],
                    ['이중(if-else)', '만약 ~이라면 { } 아니면 { }', '점수≥60이면 합격, 아니면 불합격'],
                    ['중첩(nested)', '만약... 안에 만약...', '등급 A/B/C/D/F 판별'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: '"만약 점수 > 90 이라면 → A등급" 블록에서 점수가 85일 때 결과는?', choices: ['A등급 출력', '아무 일도 없음', '오류 발생', 'B등급 출력'], answer: 1, explanation: '85 > 90은 거짓이므로, "만약" 블록 안의 코드는 실행되지 않습니다.' },
                    { q: '"만약 x > 0 그리고 y > 0 이라면"에서 x=5, y=-3일 때 조건은?', choices: ['참', '거짓', '오류', '실행 안 됨'], answer: 1, explanation: 'x>0은 참이지만 y>0은 거짓. AND 연산은 둘 다 참이어야 참이므로 결과는 거짓입니다.' },
                    { q: '"만약 ~이라면 / 아니면" 블록에서 반드시 실행되는 부분의 수는?', choices: ['0개', '1개', '2개', '모두 실행'], answer: 1, explanation: '조건이 참이면 "이라면" 부분만, 거짓이면 "아니면" 부분만 실행됩니다. 항상 둘 중 하나만 실행됩니다.' },
                    { q: '"~또는(OR)" 연산자는 두 조건 중 몇 개가 참이면 전체가 참인가?', choices: ['0개', '1개 이상', '2개 모두', '해당 없음'], answer: 1, explanation: 'OR 연산은 두 조건 중 하나라도 참이면 결과가 참입니다.' },
                    { q: '변수 score=75일 때 "만약 score≥90 → A, 아니면 만약 score≥80 → B, 아니면 → C"의 결과는?', choices: ['A', 'B', 'C', '오류'], answer: 2, explanation: '75는 90 미만이고 80 미만이므로 최종 "아니면" 블록이 실행되어 C입니다.' },
                    { q: '"만약 마우스를 클릭했다면" 블록은 어느 카테고리에 속하는가?', choices: ['동작', '제어', '감지', '형태'], answer: 2, explanation: '"마우스를 클릭했다면"은 감지(Sensing) 카테고리의 블록입니다.' },
                    { q: '조건문 없이 키 입력에 따른 분기를 처리할 수 있는가?', choices: ['가능하다', '불가능하다', '변수를 사용하면 가능', '반복문으로 대체 가능'], answer: 1, explanation: '조건에 따른 분기 처리는 반드시 조건문(만약~이라면)이 필요합니다.' },
                    { q: '"NOT" 연산자의 역할은?', choices: ['참을 거짓으로, 거짓을 참으로 바꿈', '두 값을 비교', '두 조건을 합침', '변수를 초기화'], answer: 0, explanation: 'NOT 연산자는 참↔거짓을 반전시킵니다. "~이 아니다" 블록에 해당합니다.' },
                ]
            },
            { type: 'tip', content: 'COS 시험에서 조건문 추적 문제: 변수 값을 순서대로 따라가며 어떤 조건이 참/거짓인지 판단하는 연습이 필수입니다!' }
        ], related: ['loops', 'variables'],
    },
    {
        id: 'variables', category: 'cos-block', name: '변수·연산자', hanja: 'Variable & Operator',
        short: '데이터를 저장하고 계산하는 기본 요소', color: '#f59e0b', icon: 'storage',
        sections: [
            { type: 'definition', title: '정의', content: '변수는 데이터(숫자, 문자 등)를 저장하는 이름 붙은 공간이며, 연산자는 변수나 값에 대해 산술·비교·논리 계산을 수행하는 기호입니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '변수 생성', desc: '변수 이름을 정하고 초기값을 설정 (예: 점수 = 0)' },
                    { label: '변수 값 변경', desc: '"변수를 N만큼 바꾸기" 또는 "변수를 N(으)로 정하기"' },
                    { label: '산술 연산자', desc: '+(더하기), -(빼기), ×(곱하기), ÷(나누기), %(나머지)' },
                    { label: '비교 연산자', desc: '=(같다), >(크다), <(작다) — 결과는 참/거짓' },
                    { label: '난수(Random)', desc: '"1~N 사이의 난수" 블록으로 매번 다른 수를 생성' },
                ]
            },
            {
                type: 'compare', title: '연산자 종류', headers: ['종류', '기호', '예시', '결과'],
                rows: [
                    ['더하기', '+', '3 + 5', '8'],
                    ['나머지', '%', '10 % 3', '1'],
                    ['비교(같다)', '=', '5 = 5', '참(True)'],
                    ['논리(AND)', '그리고', '참 그리고 거짓', '거짓(False)'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: '변수 a=5, b=3일 때 "a를 a+b로 정하기" 실행 후 a의 값은?', choices: ['3', '5', '8', '15'], answer: 2, explanation: 'a = a + b = 5 + 3 = 8' },
                    { q: '10 % 3 (10 나누기 3의 나머지)의 결과는?', choices: ['0', '1', '3', '10'], answer: 1, explanation: '10 ÷ 3 = 3 나머지 1. 나머지 연산(%) 결과는 1입니다.' },
                    { q: '변수 count=0에서 "count를 1만큼 바꾸기"를 5번 반복하면 count는?', choices: ['0', '1', '5', '10'], answer: 2, explanation: '0에서 시작하여 +1을 5번 하면 count = 5' },
                    { q: '"1~6 사이의 난수" 블록의 가능한 결과에 포함되지 않는 것은?', choices: ['1', '3', '6', '7'], answer: 3, explanation: '1~6 사이의 난수이므로 7은 나올 수 없습니다.' },
                    { q: '변수 x=10일 때 "x를 x÷2로 정하기"를 2번 실행하면 x는?', choices: ['0', '2.5', '5', '10'], answer: 1, explanation: '1회: x = 10÷2 = 5, 2회: x = 5÷2 = 2.5' },
                    { q: '"변수를 N만큼 바꾸기"와 "변수를 N으로 정하기"의 차이는?', choices: ['바꾸기는 더하기, 정하기는 대입', '둘 다 같은 기능', '바꾸기만 음수 가능', '정하기만 문자 가능'], answer: 0, explanation: '"바꾸기"는 현재 값에 N을 더하고, "정하기"는 값을 N으로 교체합니다.' },
                    { q: '리스트(목록)에 "사과", "바나나", "체리"가 있을 때 2번째 항목은?', choices: ['사과', '바나나', '체리', '없음'], answer: 1, explanation: '리스트의 2번째 항목은 "바나나"입니다 (1부터 시작).' },
                    { q: '두 변수 a=3, b=5를 서로 교환하려면 추가로 필요한 변수는?', choices: ['0개', '1개(임시 변수)', '2개', '3개'], answer: 1, explanation: '값 교환에는 임시 변수 temp가 필요합니다: temp=a, a=b, b=temp' },
                ]
            },
            { type: 'tip', content: '변수 추적 문제: 코드 실행 순서대로 변수 값의 변화를 표로 기록하면 실수를 줄일 수 있습니다!' }
        ], related: ['conditionals', 'loops'],
    },
    {
        id: 'coordinates', category: 'cos-block', name: '좌표·움직임', hanja: 'Coordinate & Motion',
        short: '스프라이트의 위치와 이동을 제어하는 방법', color: '#ec4899', icon: 'output',
        sections: [
            { type: 'definition', title: '정의', content: '좌표는 무대 위에서 스프라이트의 위치를 나타내는 (x, y) 값이며, 움직임 블록을 사용하여 스프라이트를 이동, 회전, 방향 전환할 수 있습니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'x좌표', desc: '가로 위치. 왼쪽이 음수(-), 오른쪽이 양수(+)' },
                    { label: 'y좌표', desc: '세로 위치. 아래쪽이 음수(-), 위쪽이 양수(+)' },
                    { label: '이동 블록', desc: '"x좌표를 N만큼 바꾸기", "x: N, y: N 위치로 이동하기"' },
                    { label: '방향', desc: '0도=위, 90도=오른쪽, 180도(또는-180)=아래, -90도=왼쪽' },
                    { label: '글라이드', desc: '"N초 동안 x: A y: B로 이동하기" — 부드럽게 이동' },
                ]
            },
            {
                type: 'compare', title: '방향과 각도', headers: ['방향', '각도(Scratch)', '설명'],
                rows: [
                    ['위', '0도', '무대 위쪽을 향함'],
                    ['오른쪽', '90도', '무대 오른쪽을 향함'],
                    ['아래', '180도', '무대 아래쪽을 향함'],
                    ['왼쪽', '-90도 (270도)', '무대 왼쪽을 향함'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: '스프라이트가 (0, 0)에서 "x좌표를 50만큼 바꾸기" 실행 후 위치는?', choices: ['(50, 0)', '(0, 50)', '(-50, 0)', '(50, 50)'], answer: 0, explanation: 'x좌표만 50 증가하므로 (0+50, 0) = (50, 0)' },
                    { q: '스프라이트가 (100, -50)에 있을 때 "y좌표를 30만큼 바꾸기" 후 위치는?', choices: ['(130, -50)', '(100, -20)', '(100, -80)', '(100, 30)'], answer: 1, explanation: 'y좌표만 변경: (-50+30) = -20, 결과 (100, -20)' },
                    { q: 'Scratch에서 방향이 90도일 때 스프라이트가 향하는 방향은?', choices: ['위', '오른쪽', '아래', '왼쪽'], answer: 1, explanation: 'Scratch에서 90도는 오른쪽 방향입니다.' },
                    { q: '"벽에 닿으면 튕기기" 블록의 역할은?', choices: ['무대 끝에서 방향 반전', '스프라이트 삭제', '무대 확대', '배경 변경'], answer: 0, explanation: '스프라이트가 무대 가장자리에 닿으면 진행 방향이 반전됩니다.' },
                    { q: '(200, 100)에서 "x: -200, y: -100 위치로 이동하기" 후 이동 거리는?', choices: ['200', '300', '400', '약 447'], answer: 3, explanation: '이동 거리 = √((400)² + (200)²) = √(160000+40000) = √200000 ≈ 447' },
                    { q: '스프라이트를 시계방향으로 90도 회전하면 원래 방향이 0(위)일 때?', choices: ['오른쪽(90도)', '왼쪽(-90도)', '아래(180도)', '변화 없음'], answer: 0, explanation: '시계방향 90도 회전: 0도 + 90도 = 90도(오른쪽)' },
                    { q: '"마우스 포인터로 이동하기" 블록은 어떤 동작을 하는가?', choices: ['마우스 위치로 즉시 이동', '마우스를 따라 천천히 이동', '마우스를 클릭한 위치로 이동', '마우스 커서를 숨김'], answer: 0, explanation: '스프라이트가 현재 마우스 포인터 위치로 즉시 이동합니다.' },
                    { q: '스프라이트가 무대를 벗어나 보이지 않을 때 가장 쉬운 해결책은?', choices: ['"x: 0, y: 0 위치로 이동하기"', '프로그램 재시작', '스프라이트 삭제 후 재생성', '무대 크기 확대'], answer: 0, explanation: '"x: 0, y: 0으로 이동하기"로 중앙으로 되돌릴 수 있습니다.' },
                ]
            },
            { type: 'tip', content: '좌표 문제에서는 x(가로)와 y(세로)를 헷갈리지 않도록! x가 양수면 오른쪽, y가 양수면 위쪽입니다.' }
        ], related: ['tool-usage', 'loops'],
    },
    {
        id: 'debugging', category: 'cos-block', name: '디버깅', hanja: 'Debugging',
        short: '프로그램의 오류를 찾아 수정하는 과정', color: '#ef4444', icon: 'maintenance',
        sections: [
            { type: 'definition', title: '정의', content: '디버깅은 프로그램에서 의도하지 않은 결과(버그)를 발생시키는 오류를 찾아내고 수정하는 과정입니다. COS 시험에서는 주어진 코드의 문제점을 찾고 올바른 수정 방법을 선택하는 문제가 출제됩니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '논리 오류', desc: '프로그램이 실행되지만 의도한 결과와 다른 경우 (조건/반복 실수)' },
                    { label: '순서 오류', desc: '블록의 실행 순서가 잘못된 경우' },
                    { label: '초기화 오류', desc: '변수를 사용 전에 초기값을 설정하지 않은 경우' },
                    { label: '무한 루프', desc: '탈출 조건이 없어 반복문이 영원히 실행되는 경우' },
                    { label: '코드 추적', desc: '한 블록씩 순서대로 실행 결과를 따라가며 오류를 찾는 방법' },
                ]
            },
            {
                type: 'compare', title: '오류 종류 비교', headers: ['오류 종류', '증상', '해결 방법'],
                rows: [
                    ['논리 오류', '실행되지만 결과가 틀림', '조건식/연산식 점검'],
                    ['순서 오류', '실행 순서가 부적절', '블록 순서 재배치'],
                    ['초기화 오류', '변수 값이 예상과 다름', '시작 시 초기값 설정'],
                    ['무한 루프', '프로그램이 멈추지 않음', '탈출 조건 추가'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: '정사각형을 그리려는데 삼각형이 그려졌다. "3번 반복, 120도 회전"을 어떻게 수정해야 하는가?', choices: ['4번 반복, 90도 회전', '3번 반복, 90도 회전', '4번 반복, 120도 회전', '5번 반복, 72도 회전'], answer: 0, explanation: '정사각형 = 4번 반복 + 360÷4 = 90도 회전. 기존 코드는 정삼각형 코드였습니다.' },
                    { q: '변수 합계를 구하는 코드에서 "합=0으로 정하기"가 반복문 안에 있으면 어떤 문제가 생기는가?', choices: ['매 반복마다 합이 0으로 리셋', '정상 동작', '오류 발생', '합이 2배가 됨'], answer: 0, explanation: '초기화가 반복문 안에 있으면 매번 0으로 리셋되어 올바른 합계를 구할 수 없습니다.' },
                    { q: '"만약 x > 10 이라면 → x를 1만큼 바꾸기"에서 x=15일 때 발생할 수 있는 문제는?', choices: ['무한 반복 가능', '오류 발생', '정상 동작', '음수가 됨'], answer: 0, explanation: 'x가 10보다 클 때 더 크게 만드므로, 반복문과 함께 사용하면 탈출 불가능한 무한 루프가 됩니다.' },
                    { q: '스프라이트가 움직이지 않는 코드: "시작 → 만약 스페이스 키를 눌렀다면 → 10만큼 움직이기". 문제점은?', choices: ['반복문이 없어 한 번만 검사', '조건이 잘못됨', '이동 값이 너무 작음', '시작 블록이 잘못됨'], answer: 0, explanation: '키 입력 감지를 계속하려면 "계속 반복하기" 안에 조건문을 넣어야 합니다.' },
                    { q: '코드 추적(Tracing) 시 가장 먼저 해야 할 일은?', choices: ['변수 초기값 확인', '코드 삭제', '새 변수 추가', '반복 횟수 변경'], answer: 0, explanation: '코드 추적의 시작은 모든 변수의 초기값을 확인하는 것입니다.' },
                    { q: '"10번 반복하기" 안에 "y좌표를 -10만큼 바꾸기"를 넣었는데 스프라이트가 위로 움직인다. 어디가 잘못인가?', choices: ['-10을 10으로 바꿔야 함', '10번을 5번으로 바꿔야 함', 'x좌표로 바꿔야 함', '반복문을 제거해야 함'], answer: 0, explanation: 'y값 -10은 아래로 이동을 의미하므로, 위로 가려면 +10(양수)이어야 합니다. 문제 설명과 반대이므로 부호가 잘못입니다.' },
                    { q: '다음 중 디버깅 방법이 아닌 것은?', choices: ['코드 추적(Tracing)', '값 출력(말하기 블록)', '코드 전체 삭제', '단계별 실행'], answer: 2, explanation: '코드 전체 삭제는 디버깅이 아닙니다. 디버깅은 오류를 찾아 수정하는 것입니다.' },
                    { q: '동시에 두 스프라이트가 같은 변수를 바꾸면 발생할 수 있는 문제는?', choices: ['경쟁 상태(값이 예측 불가)', '오류 발생', '변수 삭제', '프로그램 종료'], answer: 0, explanation: '두 스프라이트가 동시에 같은 변수를 변경하면 결과가 예측하기 어려워집니다.' },
                ]
            },
            { type: 'tip', content: 'COS 시험 디버깅 문제 전략: ① 코드를 한 블록씩 따라가기 ② 변수 값 변화 기록하기 ③ 의도한 결과와 비교하기' }
        ], related: ['conditionals', 'variables'],
    },
];

// SVG Icon paths (reuse from WP platform)
const ICONS = {
    speed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    accuracy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
    transmission: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z" stroke-linejoin="round"/></svg>',
    storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7" stroke-linecap="round"/><rect x="2" y="3" width="20" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    output: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    maintenance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
    security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
    bookmarkFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
};
