const CATEGORIES = [
    { id: 'pcce-python', name: 'PCCE Python', desc: '프로그래머스 코딩능력시험' },
];

const TERMS = [
    {
        id: 'var-output', category: 'pcce-python', name: '변수·출력', hanja: 'Variable & Output',
        short: '변수 선언, 타입, print 함수, 포맷팅', color: '#14b8a6', icon: 'speed',
        sections: [
            { type: 'definition', title: '정의', content: '변수는 데이터를 저장하는 공간이며, print() 함수로 데이터를 화면에 출력합니다. PCCE에서는 변수의 타입 이해와 다양한 출력 형식을 묻는 문제가 출제됩니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '변수 선언', desc: 'name = "홍길동", age = 20 — 타입 자동 결정' },
                    { label: 'print() 기본', desc: 'print(값1, 값2) — 공백으로 구분, 끝에 줄바꿈' },
                    { label: 'sep / end', desc: 'sep="구분자", end="끝문자" 매개변수로 출력 형식 조절' },
                    { label: 'f-string', desc: 'f"나이: {age}세" — 변수를 직접 문자열에 삽입' },
                    { label: '타입 확인', desc: 'type(x)으로 변수의 자료형 확인 가능' },
                ]
            },
            {
                type: 'compare', title: '출력 형식 비교', headers: ['코드', '출력 결과'],
                rows: [
                    ['print(1, 2, 3)', '1 2 3'],
                    ['print(1, 2, 3, sep="-")', '1-2-3'],
                    ['print("Hello", end=" "); print("World")', 'Hello World'],
                    ['print(f"값: {10 * 2}")', '값: 20'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'a = 10; b = 3; print(a // b)의 결과는?', choices: ['3', '3.33', '1', '10'], answer: 0, explanation: '//는 정수 나눗셈(몫). 10 // 3 = 3' },
                    { q: 'print(type(3.14))의 결과는?', choices: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "3.14"], answer: 1, explanation: '3.14는 실수이므로 float 타입입니다.' },
                    { q: 'x = "5"; y = 3; print(int(x) + y)의 결과는?', choices: ['53', '8', 'TypeError', '35'], answer: 1, explanation: 'int("5") = 5, 5 + 3 = 8' },
                    { q: 'print("A", "B", "C", sep="")의 결과는?', choices: ['A B C', 'ABC', 'A,B,C', 'A-B-C'], answer: 1, explanation: 'sep=""은 구분자를 없앰. 붙여서 출력: ABC' },
                    { q: 'a = 7; b = 2; print(a % b)의 결과는?', choices: ['1', '2', '3', '3.5'], answer: 0, explanation: '%는 나머지 연산. 7 % 2 = 1 (7÷2=3...나머지 1)' },
                    { q: 'a = 10\na += 5\na -= 3\nprint(a)의 결과는?', choices: ['10', '12', '15', '8'], answer: 1, explanation: 'a=10 → a+=5: 15 → a-=3: 12' },
                    { q: 'print(2 ** 3)의 결과는?', choices: ['6', '8', '5', '23'], answer: 1, explanation: '**는 거듭제곱. 2³ = 8' },
                    { q: 'x = "Hello"\nprint(x * 3)의 결과는?', choices: ['Hello3', 'HelloHelloHello', '오류', 'Hello Hello Hello'], answer: 1, explanation: '문자열 * 정수는 문자열 반복. "Hello" * 3 = "HelloHelloHello"' },
                ]
            },
            { type: 'tip', content: 'PCCE에서 //와 %의 차이를 확실히! //는 몫, %는 나머지. print() 매개변수 sep, end도 자주 출제됩니다.' }
        ], related: ['pcce-conditionals', 'pcce-string-list'],
    },
    {
        id: 'pcce-conditionals', category: 'pcce-python', name: '조건문', hanja: 'Conditional',
        short: 'if/elif/else 분기와 논리 연산', color: '#8b5cf6', icon: 'transmission',
        sections: [
            { type: 'definition', title: '정의', content: '조건문은 특정 조건의 참/거짓에 따라 다른 코드를 실행하는 분기 구조입니다. if, elif, else 키워드를 사용하며, 비교/논리 연산자로 조건을 구성합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'if 문', desc: '조건이 참일 때만 실행. 콜론(:)과 들여쓰기 필수' },
                    { label: 'elif', desc: '여러 조건을 순서대로 검사. 첫 번째 참인 조건만 실행' },
                    { label: 'else', desc: '모든 조건이 거짓일 때 실행. 생략 가능' },
                    { label: 'and / or / not', desc: '논리 연산자: and(둘 다 참), or(하나라도 참), not(반전)' },
                    { label: 'in 연산자', desc: '"값 in 시퀀스" — 포함 여부 확인. "a" in "apple" → True' },
                ]
            },
            {
                type: 'compare', title: '조건문 패턴', headers: ['패턴', '특징', '용도'],
                rows: [
                    ['if만', '단일 조건', '특정 경우만 처리'],
                    ['if-else', '이중 분기', '참/거짓 두 가지'],
                    ['if-elif-else', '다중 분기', '등급, 카테고리 분류'],
                    ['중첩 if', 'if 안에 if', '복합 조건 처리'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'x = 7\nif x > 10:\n    print("A")\nelif x > 5:\n    print("B")\nelif x > 3:\n    print("C")\nelse:\n    print("D")\n결과는?', choices: ['A', 'B', 'C', 'D'], answer: 1, explanation: '7 > 10 거짓, 7 > 5 참 → "B" 출력. elif는 첫 번째 참인 조건만 실행합니다.' },
                    { q: 'a = 4; b = 6\nif a > 3 and b > 5:\n    print("OK")\nelse:\n    print("NO")\n결과는?', choices: ['OK', 'NO', '오류', 'OKNO'], answer: 0, explanation: '4 > 3 참 AND 6 > 5 참 → 전체 참 → "OK"' },
                    { q: 'x = 0\nif x:\n    print("참")\nelse:\n    print("거짓")\n결과는?', choices: ['참', '거짓', '0', '오류'], answer: 1, explanation: 'Python에서 0은 False로 평가됩니다. if 0은 거짓입니다.' },
                    { q: 'score = 85\ngrade = "A" if score >= 90 else "B" if score >= 80 else "C"\nprint(grade)의 결과는?', choices: ['A', 'B', 'C', '오류'], answer: 1, explanation: '85 >= 90 거짓 → 85 >= 80 참 → grade = "B"' },
                    { q: '"python" in "I love python"의 결과는?', choices: ['True', 'False', '"python"', '오류'], answer: 0, explanation: '"python"이 "I love python" 안에 포함되어 있으므로 True' },
                    { q: 'not True or False의 결과는?', choices: ['True', 'False', 'None', '오류'], answer: 1, explanation: 'not True = False, False or False = False' },
                    { q: 'x = 15\nif x % 2 == 0:\n    print("짝수")\nelse:\n    print("홀수")\n결과는?', choices: ['짝수', '홀수', '15', '오류'], answer: 1, explanation: '15 % 2 = 1 (0이 아님) → "홀수"' },
                    { q: 'a, b = 5, 10\nif a > b:\n    a, b = b, a\nprint(a, b)의 결과는?', choices: ['5 10', '10 5', '5 5', '10 10'], answer: 0, explanation: '5 > 10은 거짓. 교환이 실행되지 않아 그대로 5 10' },
                ]
            },
            { type: 'tip', content: 'PCCE 조건문 핵심: 0, 빈 문자열(""), 빈 리스트([])는 False! 그리고 elif는 위에서부터 첫 번째 참만 실행됩니다.' }
        ], related: ['var-output', 'pcce-loops'],
    },
    {
        id: 'pcce-loops', category: 'pcce-python', name: '반복문', hanja: 'Loop',
        short: 'for, while, range, 이중 반복문', color: '#06b6d4', icon: 'accuracy',
        sections: [
            { type: 'definition', title: '정의', content: '반복문은 특정 코드를 여러 번 반복 실행하는 구조입니다. for문은 시퀀스를 순회하고, while문은 조건이 참인 동안 반복합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'for + range', desc: 'for i in range(n): — 0부터 n-1까지 반복' },
                    { label: 'for + 리스트', desc: 'for x in [1,2,3]: — 리스트 요소를 하나씩 순회' },
                    { label: 'while', desc: 'while 조건: — 조건이 거짓이 될 때까지 반복' },
                    { label: 'enumerate()', desc: 'for i, v in enumerate(lst): — 인덱스와 값을 동시에' },
                    { label: '리스트 컴프리헨션', desc: '[x**2 for x in range(5)] = [0, 1, 4, 9, 16]' },
                ]
            },
            {
                type: 'compare', title: 'range() 패턴', headers: ['코드', '결과', '설명'],
                rows: [
                    ['range(5)', '0,1,2,3,4', '0부터 4까지'],
                    ['range(1,6)', '1,2,3,4,5', '1부터 5까지'],
                    ['range(0,10,2)', '0,2,4,6,8', '짝수만'],
                    ['range(5,0,-1)', '5,4,3,2,1', '역순'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'sum = 0\nfor i in range(1, 11):\n    sum += i\nprint(sum)의 결과는?', choices: ['45', '55', '10', '100'], answer: 1, explanation: '1+2+3+...+10 = 55' },
                    { q: '[x * 2 for x in range(4)]의 결과는?', choices: ['[0, 2, 4, 6]', '[2, 4, 6, 8]', '[0, 1, 2, 3]', '[2, 4, 6]'], answer: 0, explanation: 'range(4) = 0,1,2,3. 각각 ×2 = [0, 2, 4, 6]' },
                    { q: 'i = 1\nwhile i <= 5:\n    print(i, end=" ")\n    i += 2\n출력은?', choices: ['1 2 3 4 5', '1 3 5', '2 4', '1 3 5 7'], answer: 1, explanation: 'i: 1→3→5→7(종료). 출력: 1 3 5' },
                    { q: 'for i in range(3):\n    for j in range(3):\n        if i == j:\n            print(i, end=" ")\n출력은?', choices: ['0 0 1 1 2 2', '0 1 2', '0 0 0 1 1 1 2 2 2', '0 1 2 3'], answer: 1, explanation: 'i==j인 경우만: (0,0), (1,1), (2,2). 출력: 0 1 2' },
                    { q: 'count = 0\nfor x in [1, 2, 3, 4, 5]:\n    if x % 2 == 0:\n        count += 1\nprint(count)의 결과는?', choices: ['2', '3', '5', '1'], answer: 0, explanation: '짝수: 2, 4 → count = 2' },
                    { q: 'for i, v in enumerate(["a", "b", "c"]):\n    print(i, v)\n첫 줄 출력은?', choices: ['0 a', '1 a', 'a 0', 'a b c'], answer: 0, explanation: 'enumerate는 (인덱스, 값) 쌍. 첫 줄: 0 a' },
                    { q: 'n = 64\ncount = 0\nwhile n > 1:\n    n //= 2\n    count += 1\nprint(count)의 결과는?', choices: ['5', '6', '7', '32'], answer: 1, explanation: '64→32→16→8→4→2→1. 6번 나눔. count = 6' },
                    { q: 'result = ""\nfor c in "Hello":\n    if c.isupper():\n        result += c\nprint(result)의 결과는?', choices: ['H', 'Hello', 'HELLO', 'ello'], answer: 0, explanation: '대문자만 추가. "Hello"에서 대문자는 "H"만.' },
                ]
            },
            { type: 'tip', content: 'PCCE 핵심: 리스트 컴프리헨션 [표현식 for 변수 in 범위 if 조건]을 읽고 결과를 예측하는 문제가 자주 나옵니다!' }
        ], related: ['pcce-conditionals', 'pcce-func-lib'],
    },
    {
        id: 'pcce-func-lib', category: 'pcce-python', name: '함수·라이브러리', hanja: 'Function & Library',
        short: '함수 정의/호출, math, random 모듈', color: '#f59e0b', icon: 'maintenance',
        sections: [
            { type: 'definition', title: '정의', content: '함수는 재사용 가능한 코드 블록이며, 라이브러리(모듈)는 미리 만들어진 함수 모음입니다. PCCE에서는 함수 정의·호출과 math, random 등 표준 라이브러리 활용을 평가합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: 'def 함수()', desc: '함수 정의. return으로 결과 반환, 없으면 None' },
                    { label: 'math 모듈', desc: 'math.sqrt(16)=4.0, math.ceil(3.1)=4, math.floor(3.9)=3' },
                    { label: 'random 모듈', desc: 'random.randint(1,6), random.choice(리스트), random.shuffle()' },
                    { label: 'import', desc: 'import math 또는 from math import sqrt' },
                    { label: '내장 함수', desc: 'len(), max(), min(), sum(), sorted(), abs()' },
                ]
            },
            {
                type: 'compare', title: '자주 쓰는 내장 함수', headers: ['함수', '기능', '예시', '결과'],
                rows: [
                    ['len()', '길이', 'len([1,2,3])', '3'],
                    ['max()', '최대값', 'max(3,7,1)', '7'],
                    ['sum()', '합계', 'sum([1,2,3])', '6'],
                    ['sorted()', '정렬', 'sorted([3,1,2])', '[1,2,3]'],
                    ['abs()', '절대값', 'abs(-5)', '5'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'def double(x):\n    return x * 2\nprint(double(7))의 결과는?', choices: ['7', '14', '77', 'None'], answer: 1, explanation: 'double(7) = 7 * 2 = 14' },
                    { q: 'import math\nprint(math.ceil(4.1))의 결과는?', choices: ['4', '5', '4.1', '4.0'], answer: 1, explanation: 'ceil은 올림. 4.1 → 5' },
                    { q: 'print(max(3, -5, 7, 2, -1))의 결과는?', choices: ['-5', '7', '3', '2'], answer: 1, explanation: 'max()는 가장 큰 값을 반환. 3, -5, 7, 2, -1 중 최대는 7' },
                    { q: 'print(sorted([5, 2, 8, 1], reverse=True))의 결과는?', choices: ['[1, 2, 5, 8]', '[8, 5, 2, 1]', '[5, 2, 8, 1]', '오류'], answer: 1, explanation: 'reverse=True는 내림차순. [8, 5, 2, 1]' },
                    { q: 'def add_all(*args):\n    return sum(args)\nprint(add_all(1, 2, 3, 4))의 결과는?', choices: ['4', '10', '(1,2,3,4)', '오류'], answer: 1, explanation: '*args는 가변 인수. sum((1,2,3,4)) = 10' },
                    { q: 'import math\nprint(math.floor(7.9))의 결과는?', choices: ['7', '8', '7.9', '7.0'], answer: 0, explanation: 'floor는 내림. 7.9 → 7' },
                    { q: 'print(abs(-3) + abs(4))의 결과는?', choices: ['1', '7', '-7', '12'], answer: 1, explanation: 'abs(-3)=3, abs(4)=4. 3+4=7' },
                    { q: 'def is_even(n):\n    return n % 2 == 0\nprint(is_even(9))의 결과는?', choices: ['True', 'False', '0', '1'], answer: 1, explanation: '9 % 2 = 1. 1 == 0은 False' },
                ]
            },
            { type: 'tip', content: 'PCCE에서 import 문법: "import math" 후 "math.sqrt()" vs "from math import sqrt" 후 "sqrt()" 차이를 알아두세요!' }
        ], related: ['pcce-loops', 'pcce-string-list'],
    },
    {
        id: 'pcce-string-list', category: 'pcce-python', name: '리스트·문자열', hanja: 'List & String',
        short: '인덱싱, 슬라이싱, 주요 메서드 활용', color: '#ec4899', icon: 'storage',
        sections: [
            { type: 'definition', title: '정의', content: '리스트와 문자열은 Python에서 가장 자주 사용하는 시퀀스 자료형입니다. 인덱싱, 슬라이싱으로 요소에 접근하고, 다양한 메서드로 데이터를 가공합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '인덱싱', desc: 'a[0] 첫 요소, a[-1] 마지막 요소, a[-2] 뒤에서 두 번째' },
                    { label: '슬라이싱', desc: 'a[1:4] 1~3번째, a[:3] 처음~2번째, a[::2] 짝수 인덱스' },
                    { label: 'append/insert', desc: 'append(값) 끝에 추가, insert(위치, 값) 특정 위치 삽입' },
                    { label: 'split/join', desc: '"a,b".split(",")→["a","b"], ",".join(["a","b"])→"a,b"' },
                    { label: '2차원 리스트', desc: 'matrix[행][열] — 행렬 형태의 데이터 저장' },
                ]
            },
            {
                type: 'compare', title: '리스트 vs 문자열', headers: ['항목', 'list', 'str'],
                rows: [
                    ['변경 가능', 'O (mutable)', 'X (immutable)'],
                    ['인덱싱', 'a[0]', 's[0]'],
                    ['슬라이싱', 'a[1:3]', 's[1:3]'],
                    ['추가', 'a.append(x)', 's + "x" (새 문자열)'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'a = [10, 20, 30, 40, 50]\nprint(a[-2])의 결과는?', choices: ['30', '40', '50', '20'], answer: 1, explanation: 'a[-2]는 뒤에서 두 번째 = 40' },
                    { q: 's = "programming"\nprint(s[3:7])의 결과는?', choices: ['gram', 'gra', 'ogra', 'ramm'], answer: 0, explanation: 's[3:7] = 인덱스 3~6 = "gram"' },
                    { q: 'a = [1, 2, 3]\na.insert(1, 10)\nprint(a)의 결과는?', choices: ['[1, 10, 2, 3]', '[10, 1, 2, 3]', '[1, 2, 10, 3]', '[1, 2, 3, 10]'], answer: 0, explanation: 'insert(1, 10)은 인덱스 1에 10을 삽입. [1, 10, 2, 3]' },
                    { q: 'words = "Hello World Python"\nprint(words.split()[1])의 결과는?', choices: ['Hello', 'World', 'Python', 'H'], answer: 1, explanation: 'split()은 공백으로 분리. ["Hello", "World", "Python"]. [1] = "World"' },
                    { q: 'a = [1, 2, 3, 4, 5]\nprint(a[::2])의 결과는?', choices: ['[1, 3, 5]', '[2, 4]', '[1, 2, 3]', '[5, 3, 1]'], answer: 0, explanation: 'a[::2]는 2칸 간격. 인덱스 0, 2, 4 → [1, 3, 5]' },
                    { q: 'matrix = [[1,2],[3,4],[5,6]]\nprint(matrix[1][0])의 결과는?', choices: ['1', '2', '3', '4'], answer: 2, explanation: 'matrix[1] = [3,4], [0] = 3' },
                    { q: 'a = [3, 1, 4, 1, 5]\nprint(a.count(1))의 결과는?', choices: ['1', '2', '3', '0'], answer: 1, explanation: 'count(1)은 1의 개수. [3,1,4,1,5]에서 1은 2개' },
                    { q: 'a = "hello"\na = a.upper()\nprint(a[0] + a[-1])의 결과는?', choices: ['HO', 'he', 'Ho', 'hO'], answer: 0, explanation: 'upper() → "HELLO", [0]="H", [-1]="O" → "HO"' },
                ]
            },
            { type: 'tip', content: 'PCCE에서 2차원 리스트 문제가 자주 출제됩니다! matrix[행][열] 순서를 헷갈리지 마세요.' }
        ], related: ['var-output', 'pcce-algorithm'],
    },
    {
        id: 'pcce-algorithm', category: 'pcce-python', name: '알고리즘 기초', hanja: 'Basic Algorithm',
        short: '정렬, 탐색, 구현, 시뮬레이션', color: '#6366f1', icon: 'security',
        sections: [
            { type: 'definition', title: '정의', content: '알고리즘은 문제를 해결하기 위한 단계적 절차입니다. PCCE Lv.3~4에서는 정렬, 탐색, 구현, 시뮬레이션 등 기초 알고리즘 활용 능력을 평가합니다.' },
            {
                type: 'keypoints', title: '핵심 포인트', items: [
                    { label: '선형 탐색', desc: '처음부터 끝까지 하나씩 확인. O(n) 시간 복잡도' },
                    { label: '정렬', desc: 'sorted(), .sort() 활용. key 매개변수로 정렬 기준 지정' },
                    { label: '구현', desc: '문제 설명을 그대로 코드로 옮기는 유형. 조건 꼼꼼히 확인' },
                    { label: '빈도수 세기', desc: 'dict나 Counter를 활용하여 요소 출현 횟수 계산' },
                    { label: '그리디', desc: '현재 상황에서 최선의 선택을 반복하는 방법 (거스름돈 문제 등)' },
                ]
            },
            {
                type: 'compare', title: '알고리즘 유형', headers: ['유형', '특징', '예시'],
                rows: [
                    ['선형 탐색', '순서대로 하나씩', '최대값/최소값 찾기'],
                    ['정렬', '순서 재배치', '성적순 정렬, 이름순 정렬'],
                    ['구현', '규칙 그대로 코딩', '시뮬레이션, 카드 게임'],
                    ['그리디', '매 순간 최선 선택', '거스름돈 최소 동전 수'],
                ]
            },
            {
                type: 'exam', title: '연습문제 (8문항)', questions: [
                    { q: 'a = [5, 3, 8, 1, 2]\ndef find_max(lst):\n    m = lst[0]\n    for x in lst:\n        if x > m:\n            m = x\n    return m\nprint(find_max(a))의 결과는?', choices: ['5', '8', '1', '2'], answer: 1, explanation: '선형 탐색으로 최대값을 찾습니다. 5→8(갱신), 최대값 = 8' },
                    { q: '거스름돈 730원을 500원, 100원, 50원, 10원 동전으로 줄 때 최소 동전 개수는?', choices: ['5', '6', '7', '8'], answer: 1, explanation: '500×1 + 100×2 + 50×0 + 10×3 = 1+2+0+3 = 6개' },
                    { q: 'students = [("김", 85), ("이", 92), ("박", 78)]\nresult = sorted(students, key=lambda x: x[1], reverse=True)\nprint(result[0][0])의 결과는?', choices: ['김', '이', '박', '92'], answer: 1, explanation: '점수 내림차순 정렬. "이"(92)가 1위' },
                    { q: 'from collections import Counter\ndata = [1,2,2,3,3,3]\nc = Counter(data)\nprint(c.most_common(1))의 결과는?', choices: ['[(3, 3)]', '[(1, 1)]', '[3]', '3'], answer: 0, explanation: 'most_common(1)은 가장 빈도 높은 1개를 (값, 빈도) 형태로 반환' },
                    { q: '1부터 100까지의 짝수의 합을 구하는 코드로 올바른 것은?', choices: ['sum(range(2, 101, 2))', 'sum(range(1, 100, 2))', 'sum(range(0, 100, 2))', 'sum(range(2, 100, 2))'], answer: 0, explanation: 'range(2, 101, 2)는 2, 4, 6, ..., 100. 101 미포함이므로 100까지 포함됩니다.' },
                    { q: 'def reverse_list(lst):\n    result = []\n    for i in range(len(lst)-1, -1, -1):\n        result.append(lst[i])\n    return result\nprint(reverse_list([1,2,3]))의 결과는?', choices: ['[1, 2, 3]', '[3, 2, 1]', '[3, 1]', '오류'], answer: 1, explanation: '뒤에서부터 순회하여 추가. [3, 2, 1]' },
                    { q: '문자열 "abcba"가 팰린드롬(회문)인지 확인하는 가장 간단한 방법은?', choices: ['s == s[::-1]', 's == reversed(s)', 'len(s) % 2 == 0', 's.sort() == s'], answer: 0, explanation: 's[::-1]로 뒤집은 것과 원본이 같으면 팰린드롬입니다.' },
                    { q: 'nums = [4, 2, 7, 1, 9, 3]\nnums.sort()\nprint(nums[len(nums)//2])의 결과는?', choices: ['3', '4', '7', '1'], answer: 1, explanation: '정렬: [1,2,3,4,7,9]. len=6, 6//2=3. nums[3]=4' },
                ]
            },
            { type: 'tip', content: 'PCCE Lv.3~4 알고리즘 문제는 대부분 구현형(시뮬레이션)입니다. 문제를 꼼꼼히 읽고 조건을 빠짐없이 코드로 옮기세요!' }
        ], related: ['pcce-loops', 'pcce-func-lib'],
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
