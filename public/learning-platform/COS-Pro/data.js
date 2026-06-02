const CATEGORIES = [
    { id: 'cospro-python', name: 'COS Pro Python', desc: 'Python 코딩전문능력 시험' },
];

const TERMS = [
    {
        id: 'basic-syntax', category: 'cospro-python', name: '기본 문법', hanja: 'Basic Syntax',
        short: '변수, 자료형, 입출력, 형변환 등 Python 기초', color: '#ef4444', icon: 'speed',
        sections: [
            { type: 'definition', title: '정의', content: 'Python 기본 문법은 변수 선언, 자료형(int, float, str, bool), 입출력(input/print), 형변환(int(), str(), float()) 등 프로그램 작성의 기본 요소를 다룹니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '변수 선언', desc: 'Python은 타입 선언 없이 값을 대입하면 자동으로 타입이 결정됨 (동적 타이핑)' },
                    { label: '자료형', desc: 'int(정수), float(실수), str(문자열), bool(True/False), list, dict, tuple' },
                    { label: 'input()', desc: '사용자 입력을 받는 함수. 항상 문자열(str)로 반환됨' },
                    { label: 'print()', desc: '화면에 출력하는 함수. sep, end 매개변수로 출력 형식 조절' },
                    { label: '형변환', desc: 'int("5")→5, str(10)→"10", float("3.14")→3.14' },
                ]
            },
            {
                type: 'compare', title: '자료형 비교', headers: ['자료형', '예시', '특징'],
                rows: [
                    ['int', '10, -3, 0', '정수, 소수점 없음'],
                    ['float', '3.14, -0.5', '실수, 소수점 있음'],
                    ['str', '"hello", \'world\'', '문자열, 따옴표로 감싸기'],
                    ['bool', 'True, False', '논리값, 조건판단에 사용'],
                    ['list', '[1, 2, 3]', '순서 있는 변경 가능 목록'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'x = input()으로 "5"를 입력받으면 type(x)의 결과는?', choices: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'bool'>"], answer: 1, explanation: 'input()은 항상 문자열(str)로 반환합니다. 숫자로 사용하려면 int()로 변환해야 합니다.' },
                    { q: 'print(3 + 2, 4 * 2, sep="-")의 출력은?', choices: ['5-8', '3+2-4*2', '5 8', '32 42'], answer: 0, explanation: '3+2=5, 4*2=8, sep="-"이므로 5와 8 사이에 -가 출력됩니다: 5-8' },
                    { q: 'a = "10"; b = "20"; print(a + b)의 결과는?', choices: ['30', '1020', '10 20', '오류'], answer: 1, explanation: 'a와 b는 문자열이므로 +는 문자열 연결(concatenation). "10"+"20"="1020"' },
                    { q: 'int(3.7)의 결과는?', choices: ['3', '4', '3.7', '오류'], answer: 0, explanation: 'int()는 소수점을 버리고 정수로 변환합니다 (반올림이 아님). 3.7 → 3' },
                    { q: '다음 중 변수 이름으로 사용할 수 없는 것은?', choices: ['my_var', '_count', '2ndPlace', 'total'], answer: 2, explanation: '변수 이름은 숫자로 시작할 수 없습니다. 2ndPlace는 불가능합니다.' },
                    { q: 'print("Hello", end="!")의 출력은?', choices: ['Hello!', 'Hello !', 'Hello\\n!', '!Hello'], answer: 0, explanation: 'end 매개변수는 출력 끝에 붙는 문자를 지정합니다. 기본값은 줄바꿈(\\n)이지만 !로 변경됩니다.' },
                    { q: 'x = 5; x += 3; print(x)의 결과는?', choices: ['3', '5', '8', '53'], answer: 2, explanation: 'x += 3은 x = x + 3과 같습니다. 5 + 3 = 8' },
                    { q: 'bool(0)의 결과는?', choices: ['True', 'False', '0', '오류'], answer: 1, explanation: 'Python에서 0, 빈 문자열(""), 빈 리스트([])는 False로 변환됩니다.' },
                ]
            },
            { type: 'tip', content: 'COS Pro에서 가장 자주 틀리는 포인트: input()은 항상 str을 반환! 숫자 비교/연산 전에 반드시 int() 또는 float()로 변환하세요.' }
        ], related: ['control-flow', 'string-handling'],
    },
    {
        id: 'control-flow', category: 'cospro-python', name: '제어문', hanja: 'Control Flow',
        short: 'if/elif/else, for, while, break/continue 문법', color: '#8b5cf6', icon: 'transmission',
        sections: [
            { type: 'definition', title: '정의', content: '제어문은 프로그램 실행 흐름을 제어하는 구조입니다. 조건문(if/elif/else)으로 분기하고, 반복문(for/while)으로 반복하며, break/continue로 흐름을 조정합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'if-elif-else', desc: '다중 조건 분기. elif는 여러 개 가능, else는 0~1개' },
                    { label: 'for 반복문', desc: 'for i in range(n): — 정해진 횟수/시퀀스 반복' },
                    { label: 'while 반복문', desc: 'while 조건: — 조건이 참인 동안 반복' },
                    { label: 'break', desc: '반복문을 즉시 종료하고 빠져나감' },
                    { label: 'continue', desc: '현재 반복을 건너뛰고 다음 반복으로 진행' },
                ]
            },
            {
                type: 'compare', title: 'for vs while 비교', headers: ['항목', 'for', 'while'],
                rows: [
                    ['사용 시점', '반복 횟수가 정해진 경우', '종료 조건이 정해진 경우'],
                    ['문법', 'for i in range(n):', 'while 조건:'],
                    ['무한 루프', '불가능', 'while True: (가능)'],
                    ['예시', '1~10 합 구하기', '입력값이 0일 때까지 반복'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'for i in range(5): print(i) — 마지막으로 출력되는 값은?', choices: ['4', '5', '0', '1'], answer: 0, explanation: 'range(5)는 0, 1, 2, 3, 4를 생성합니다. 마지막 값은 4입니다.' },
                    { q: 'range(2, 10, 3)이 생성하는 수열은?', choices: ['2, 5, 8', '2, 5, 8, 11', '3, 6, 9', '2, 4, 6, 8'], answer: 0, explanation: 'range(시작, 끝, 간격) = 2에서 시작, 10 미만, 3씩 증가: 2, 5, 8' },
                    { q: '다음 코드의 출력은?\nx = 15\nif x > 20:\n    print("A")\nelif x > 10:\n    print("B")\nelse:\n    print("C")', choices: ['A', 'B', 'C', 'AB'], answer: 1, explanation: '15 > 20은 거짓, 15 > 10은 참이므로 "B"가 출력됩니다.' },
                    { q: 'for i in range(10):\n    if i == 5:\n        break\n    print(i)\n마지막으로 출력되는 값은?', choices: ['4', '5', '9', '0'], answer: 0, explanation: 'i가 5가 되면 break로 반복 종료. 그 전까지 0, 1, 2, 3, 4가 출력됩니다.' },
                    { q: 'while True: 무한 루프를 종료하는 방법은?', choices: ['break 사용', 'continue 사용', 'return 사용(함수 내)', 'break 또는 return'], answer: 3, explanation: 'break는 반복문을 종료하고, 함수 안이라면 return도 종료시킵니다.' },
                    { q: 'for i in range(1, 6):\n    if i % 2 == 0:\n        continue\n    print(i)\n출력되는 값은?', choices: ['1 3 5', '2 4', '1 2 3 4 5', '1 3'], answer: 0, explanation: 'continue는 짝수일 때 print를 건너뜁니다. 홀수 1, 3, 5만 출력됩니다.' },
                    { q: 'x = 1; while x < 100: x *= 2\nprint(x)의 결과는?', choices: ['64', '128', '100', '256'], answer: 1, explanation: 'x: 1→2→4→8→16→32→64→128. x=128일 때 128 < 100은 거짓이므로 종료. 128 출력.' },
                    { q: 'for i in range(3):\n    for j in range(2):\n        print("*", end="")\n    print()\n출력되는 별의 총 개수는?', choices: ['3', '5', '6', '9'], answer: 2, explanation: '바깥 3번 × 안쪽 2번 = 총 6개의 별이 출력됩니다.' },
                ]
            },
            { type: 'tip', content: 'range(n) = 0부터 n-1까지! range(1, n+1) = 1부터 n까지! 이 차이를 확실히 외우세요.' }
        ], related: ['basic-syntax', 'functions'],
    },
    {
        id: 'functions', category: 'cospro-python', name: '함수', hanja: 'Function',
        short: '코드를 재사용 가능한 단위로 묶는 구조', color: '#06b6d4', icon: 'accuracy',
        sections: [
            { type: 'definition', title: '정의', content: '함수는 특정 작업을 수행하는 코드 블록을 이름 붙여 재사용할 수 있게 만든 구조입니다. def 키워드로 정의하고, 매개변수로 입력을 받고, return으로 결과를 반환합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'def 함수명(매개변수):', desc: '함수 정의 문법. 콜론과 들여쓰기 필수' },
                    { label: '매개변수(Parameter)', desc: '함수 정의 시 받는 변수. 기본값 설정 가능: def f(x=0)' },
                    { label: '인수(Argument)', desc: '함수 호출 시 전달하는 값. 위치/키워드 인수 가능' },
                    { label: 'return', desc: '함수의 결과를 반환. return 없으면 None 반환' },
                    { label: '재귀 함수', desc: '함수가 자기 자신을 호출하는 구조. 팩토리얼, 피보나치 등' },
                ]
            },
            {
                type: 'compare', title: '함수 관련 용어', headers: ['용어', '설명', '예시'],
                rows: [
                    ['매개변수', '함수 정의 시 변수', 'def add(a, b):'],
                    ['인수', '함수 호출 시 값', 'add(3, 5)'],
                    ['반환값', 'return으로 돌려주는 값', 'return a + b'],
                    ['기본값', '인수 생략 시 사용되는 값', 'def f(x=10):'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'def add(a, b):\n    return a + b\nprint(add(3, 5))의 결과는?', choices: ['3', '5', '8', 'None'], answer: 2, explanation: 'add(3, 5)는 3 + 5 = 8을 반환합니다.' },
                    { q: 'def greet(name="World"):\n    return f"Hello, {name}!"\nprint(greet())의 결과는?', choices: ['Hello, !', 'Hello, name!', 'Hello, World!', '오류'], answer: 2, explanation: '인수를 생략하면 기본값 "World"가 사용됩니다.' },
                    { q: 'def f(x):\n    x = x + 1\na = 5\nf(a)\nprint(a)의 결과는?', choices: ['5', '6', 'None', '오류'], answer: 0, explanation: '정수는 불변(immutable)이므로 함수 안에서 x를 바꿔도 원래 a에는 영향 없습니다.' },
                    { q: 'def func():\n    print("hello")\nresult = func()\nprint(result)의 결과는?', choices: ['hello', 'None', 'hello\\nNone', '오류'], answer: 2, explanation: 'func()가 호출되면 "hello" 출력. return이 없으므로 result=None. 그래서 hello와 None이 출력됩니다.' },
                    { q: 'def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n-1)\nfactorial(5)의 결과는?', choices: ['5', '15', '120', '720'], answer: 2, explanation: '5! = 5×4×3×2×1 = 120 (재귀 호출)' },
                    { q: 'def f(a, b, c=0):\n    return a + b + c\nf(1, 2)의 결과는?', choices: ['0', '3', '6', '오류'], answer: 1, explanation: 'c의 기본값은 0이므로 f(1, 2) = 1 + 2 + 0 = 3' },
                    { q: 'lambda x, y: x * y — 이 표현식의 의미는?', choices: ['x와 y를 곱하는 익명 함수', 'x와 y를 더하는 함수', '변수 선언', '클래스 정의'], answer: 0, explanation: 'lambda는 이름 없는 간단한 함수를 만듭니다. x*y를 반환하는 함수입니다.' },
                    { q: '함수 안에서 선언한 변수를 함수 밖에서 사용할 수 있는가?', choices: ['항상 가능', '불가능 (지역 변수)', 'global 선언 시 가능', '불가능, global도 안 됨'], answer: 2, explanation: '함수 안의 변수는 지역 변수입니다. 밖에서 사용하려면 global 키워드가 필요합니다.' },
                ]
            },
            { type: 'tip', content: 'COS Pro에서 함수 문제: 매개변수와 인수의 차이, return 유무에 따른 결과(None), 지역/전역 변수를 정확히 구분하세요!' }
        ], related: ['control-flow', 'data-structures'],
    },
    {
        id: 'data-structures', category: 'cospro-python', name: '자료구조', hanja: 'Data Structure',
        short: '리스트, 딕셔너리, 튜플, 집합 활용', color: '#10b981', icon: 'storage',
        sections: [
            { type: 'definition', title: '정의', content: 'Python의 내장 자료구조는 데이터를 효율적으로 저장·관리하는 구조입니다. 리스트(list), 딕셔너리(dict), 튜플(tuple), 집합(set) 등이 있으며 각각 용도가 다릅니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'list (리스트)', desc: '순서 있고 변경 가능. [1, 2, 3]. append(), pop(), sort() 등' },
                    { label: 'dict (딕셔너리)', desc: '키-값 쌍. {"name": "홍길동", "age": 20}. keys(), values()' },
                    { label: 'tuple (튜플)', desc: '순서 있고 변경 불가. (1, 2, 3). 좌표, 고정 데이터에 사용' },
                    { label: 'set (집합)', desc: '순서 없고 중복 불가. {1, 2, 3}. 합집합, 교집합 연산' },
                    { label: '인덱싱/슬라이싱', desc: 'list[0](첫 요소), list[-1](마지막), list[1:3](1~2번째)' },
                ]
            },
            {
                type: 'compare', title: '자료구조 비교', headers: ['구조', '문법', '순서', '변경', '중복'],
                rows: [
                    ['list', '[1, 2, 3]', 'O', 'O', 'O'],
                    ['tuple', '(1, 2, 3)', 'O', 'X', 'O'],
                    ['dict', '{k: v}', 'O (3.7+)', 'O', '키 X'],
                    ['set', '{1, 2, 3}', 'X', 'O', 'X'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'a = [1, 2, 3, 4, 5]; print(a[2])의 결과는?', choices: ['1', '2', '3', '4'], answer: 2, explanation: '리스트 인덱스는 0부터 시작. a[2]는 세 번째 요소인 3입니다.' },
                    { q: 'a = [1, 2, 3]; a.append(4); print(len(a))의 결과는?', choices: ['3', '4', '5', '오류'], answer: 1, explanation: 'append(4)로 4가 추가되어 [1, 2, 3, 4]. 길이는 4입니다.' },
                    { q: 'd = {"a": 1, "b": 2}; print(d["c"])의 결과는?', choices: ['None', '0', 'KeyError 발생', '빈 문자열'], answer: 2, explanation: '존재하지 않는 키로 접근하면 KeyError가 발생합니다. d.get("c")를 사용하면 None을 반환합니다.' },
                    { q: 'a = [3, 1, 4, 1, 5]; a.sort(); print(a[0])의 결과는?', choices: ['1', '3', '4', '5'], answer: 0, explanation: 'sort()는 오름차순 정렬. [1, 1, 3, 4, 5]. 첫 번째 요소는 1.' },
                    { q: 't = (1, 2, 3); t[0] = 10의 결과는?', choices: ['t = (10, 2, 3)', 't = [10, 2, 3]', 'TypeError 발생', 't 변화 없음'], answer: 2, explanation: '튜플은 변경 불가(immutable). 요소를 수정하려면 TypeError가 발생합니다.' },
                    { q: 's = {1, 2, 3, 2, 1}; print(len(s))의 결과는?', choices: ['3', '5', '2', '오류'], answer: 0, explanation: '집합은 중복을 허용하지 않으므로 {1, 2, 3}이 됩니다. 길이는 3.' },
                    { q: 'a = [1, 2, 3, 4, 5]; print(a[1:4])의 결과는?', choices: ['[1, 2, 3]', '[2, 3, 4]', '[2, 3, 4, 5]', '[1, 2, 3, 4]'], answer: 1, explanation: 'a[1:4]는 인덱스 1부터 3까지 (4 미포함): [2, 3, 4]' },
                    { q: 'a = [1, 2, 3]; b = a; b.append(4); print(a)의 결과는?', choices: ['[1, 2, 3]', '[1, 2, 3, 4]', '[4]', '오류'], answer: 1, explanation: 'b = a는 같은 리스트를 참조합니다. b를 수정하면 a도 변경됩니다.' },
                ]
            },
            { type: 'tip', content: '리스트와 튜플의 핵심 차이: 리스트는 변경 가능(mutable), 튜플은 변경 불가(immutable). COS Pro 시험에서 자주 출제됩니다!' }
        ], related: ['functions', 'string-handling'],
    },
    {
        id: 'string-handling', category: 'cospro-python', name: '문자열 처리', hanja: 'String Handling',
        short: '인덱싱, 슬라이싱, 문자열 메서드 활용', color: '#f59e0b', icon: 'output',
        sections: [
            { type: 'definition', title: '정의', content: '문자열(str)은 문자들의 시퀀스입니다. 인덱싱, 슬라이싱으로 부분 추출이 가능하고, upper(), split(), join(), replace() 등 다양한 메서드로 가공할 수 있습니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '인덱싱', desc: 's[0]은 첫 글자, s[-1]은 마지막 글자' },
                    { label: '슬라이싱', desc: 's[1:4]는 인덱스 1~3, s[::-1]은 문자열 뒤집기' },
                    { label: 'split()', desc: '문자열을 구분자로 나누어 리스트로 반환. "a,b,c".split(",") → ["a","b","c"]' },
                    { label: 'join()', desc: '리스트를 하나의 문자열로 합침. "-".join(["a","b"]) → "a-b"' },
                    { label: 'f-string', desc: 'f"이름: {name}" — 변수를 직접 문자열에 삽입' },
                ]
            },
            {
                type: 'compare', title: '주요 문자열 메서드', headers: ['메서드', '기능', '예시', '결과'],
                rows: [
                    ['upper()', '대문자 변환', '"hello".upper()', '"HELLO"'],
                    ['lower()', '소문자 변환', '"HELLO".lower()', '"hello"'],
                    ['strip()', '양쪽 공백 제거', '" hi ".strip()', '"hi"'],
                    ['replace()', '문자열 치환', '"abc".replace("a","x")', '"xbc"'],
                    ['count()', '개수 세기', '"hello".count("l")', '2'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 's = "Python"; print(s[0] + s[-1])의 결과는?', choices: ['Pn', 'Py', 'on', 'Po'], answer: 0, explanation: 's[0]="P", s[-1]="n". "P"+"n"="Pn"' },
                    { q: 's = "Hello World"; print(s[6:11])의 결과는?', choices: ['World', 'Hello', 'Worl', ' Worl'], answer: 0, explanation: 's[6:11] = 인덱스 6부터 10까지 = "World"' },
                    { q: '"  hello  ".strip()의 결과는?', choices: ['"hello"', '"  hello"', '"hello  "', '" hello "'], answer: 0, explanation: 'strip()은 양쪽 공백을 모두 제거합니다.' },
                    { q: 's = "apple,banana,cherry"; s.split(",")의 결과는?', choices: ['["apple", "banana", "cherry"]', '"apple banana cherry"', '3', '["apple,banana,cherry"]'], answer: 0, explanation: 'split(",")는 쉼표로 나누어 리스트로 반환합니다.' },
                    { q: '"-".join(["2026", "02", "13"])의 결과는?', choices: ['"2026-02-13"', '["2026-02-13"]', '"20260213"', '오류'], answer: 0, explanation: 'join()은 리스트 요소들을 "-"로 연결합니다.' },
                    { q: 's = "abcdef"; print(s[::-1])의 결과는?', choices: ['"abcdef"', '"fedcba"', '"acdf"', '오류'], answer: 1, explanation: 's[::-1]은 문자열을 뒤집습니다. "abcdef" → "fedcba"' },
                    { q: 'name = "홍길동"; print(f"이름: {name}")의 결과는?', choices: ['"이름: 홍길동"', '"이름: name"', '"이름: {name}"', '오류'], answer: 0, explanation: 'f-string은 {} 안의 변수를 값으로 치환합니다.' },
                    { q: '"Hello World".replace("World", "Python")의 결과는?', choices: ['"Hello Python"', '"Hello World"', '"Python World"', '오류'], answer: 0, explanation: 'replace()는 첫 번째 인수를 두 번째 인수로 바꿉니다.' },
                ]
            },
            { type: 'tip', content: '슬라이싱 기본 공식: s[start:end:step]. start 포함, end 미포함! s[::-1]로 뒤집기는 시험 단골입니다.' }
        ], related: ['basic-syntax', 'code-analysis'],
    },
    {
        id: 'code-analysis', category: 'cospro-python', name: '코드 분석·디버깅', hanja: 'Code Analysis',
        short: '코드 출력 예측, 오류 발견, 수정 능력', color: '#6b7280', icon: 'maintenance',
        sections: [
            { type: 'definition', title: '정의', content: '코드 분석은 주어진 코드를 읽고 실행 결과를 예측하는 능력이며, 디버깅은 잘못된 코드에서 오류를 찾아 수정하는 능력입니다. COS Pro 시험에서 핵심적인 평가 영역입니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '출력 예측', desc: '코드를 한 줄씩 따라가며 변수 값 변화와 최종 출력을 예측' },
                    { label: '빈칸 채우기', desc: '프로그램이 올바르게 동작하도록 빠진 코드를 채우는 유형' },
                    { label: '오류 수정', desc: '논리 오류, 인덱스 오류, 타입 오류 등을 찾아 수정' },
                    { label: 'SyntaxError', desc: '문법 오류: 콜론 누락, 들여쓰기 오류, 괄호 불일치 등' },
                    { label: 'RuntimeError', desc: '실행 중 오류: ZeroDivisionError, IndexError, TypeError 등' },
                ]
            },
            {
                type: 'compare', title: '주요 에러 종류', headers: ['에러', '원인', '예시'],
                rows: [
                    ['SyntaxError', '문법 오류', 'if x > 5 (콜론 누락)'],
                    ['NameError', '정의 안 된 변수', 'print(abc) (abc 미선언)'],
                    ['TypeError', '타입 불일치', '"3" + 5 (str + int)'],
                    ['IndexError', '범위 초과', 'a[10] (길이 5인 리스트)'],
                    ['ZeroDivisionError', '0으로 나누기', '10 / 0'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'x = 1\nfor i in range(4):\n    x *= 2\nprint(x)의 결과는?', choices: ['4', '8', '16', '32'], answer: 2, explanation: 'x: 1→2→4→8→16. 4번 2를 곱하면 2⁴ = 16' },
                    { q: 'a = [1, 2, 3]\nfor i in range(len(a)):\n    a[i] = a[i] ** 2\nprint(a)의 결과는?', choices: ['[1, 2, 3]', '[1, 4, 9]', '[2, 4, 6]', '[1, 8, 27]'], answer: 1, explanation: '각 요소를 제곱: 1²=1, 2²=4, 3²=9 → [1, 4, 9]' },
                    { q: 'print("3" + 5)의 결과는?', choices: ['8', '"35"', 'TypeError', '"3 5"'], answer: 2, explanation: '문자열과 정수는 + 연산이 불가능합니다. TypeError가 발생합니다.' },
                    { q: '다음 코드에서 오류를 수정하시오:\ndef sum_list(lst)\n    total = 0\n    for x in lst:\n        total += x\n    return total', choices: ['def 다음에 콜론(:) 추가', 'return을 print로 변경', 'total = 1로 변경', 'for를 while로 변경'], answer: 0, explanation: 'def sum_list(lst) 뒤에 콜론(:)이 빠져있습니다. SyntaxError입니다.' },
                    { q: 's = ""\nfor i in range(1, 6):\n    s += str(i)\nprint(s)의 결과는?', choices: ['"1 2 3 4 5"', '"12345"', '15', '[1,2,3,4,5]'], answer: 1, explanation: '빈 문자열에 "1","2","3","4","5"를 연결하면 "12345"' },
                    { q: 'a = [5, 3, 8, 1]\na.sort(reverse=True)\nprint(a[0])의 결과는?', choices: ['1', '3', '5', '8'], answer: 3, explanation: 'reverse=True는 내림차순 정렬. [8, 5, 3, 1]. 첫 요소는 8.' },
                    { q: 'result = []\nfor i in range(10):\n    if i % 3 == 0:\n        result.append(i)\nprint(result)의 결과는?', choices: ['[0, 3, 6, 9]', '[3, 6, 9]', '[1, 2, 4, 5, 7, 8]', '[0, 1, 2]'], answer: 0, explanation: '0~9에서 3의 배수: 0, 3, 6, 9. (0 % 3 == 0은 참!)' },
                    { q: 'def mystery(n):\n    if n == 0: return 0\n    return n + mystery(n-1)\nmystery(4)의 결과는?', choices: ['4', '6', '10', '24'], answer: 2, explanation: 'mystery(4) = 4+3+2+1+0 = 10 (재귀적 합산)' },
                ]
            },
            { type: 'tip', content: '코드 추적 팁: 변수표를 만들어 각 단계별 변수 값을 기록하면 실수를 크게 줄일 수 있습니다!' }
        ], related: ['control-flow', 'functions'],
    },
];

// SVG Icon paths
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
