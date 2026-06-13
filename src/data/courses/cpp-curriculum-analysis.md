# C++ 코스 커리큘럼 분석 (이미지 기반)

> **분석 일자**: 2026-04-28
> **분석 방식**: `public/learn/cpp/` 21장 + `public/learn/cpp-vol3/` 9장 PNG visual 분석
> **목적**: 슬라이드 placeholder 제목("슬라이드 1, 2...")을 실제 내용 기반 제목으로 교체

---

## 1. 발견 사항: 슬라이드 구조

### `public/learn/cpp/` (21장) — **1권 + 2권 합본**
이미지 우상단의 페이지 번호 패턴을 보면 책이 **2권으로 분리**돼 있음:

| 파일명 | 페이지 표기 | 소속 권 | 내용 |
|---|---|---|---|
| slide-01 | 1/50 | **1권 표지** | C++ 시작과 출력 |
| slide-02 | 1/50 | **1권 표지 중복** | (slide-01과 동일) |
| slide-03 | 1/50 | **1권 표지 중복** | (slide-01과 동일) |
| slide-04 | 6/50 | 1권 | 첫 C++ 코드 만나보기 (Hello World) |
| slide-05 | 6/50 | 1권 | (slide-04와 동일) |
| slide-06 | 14/50 | 1권 | 여러 문장 출력하기 (cout 여러 번) |
| slide-07 | 19/50 | 1권 | 줄바꿈 비교하기 (endl vs \n) |
| slide-08 | 21/50 | 1권 | 세미콜론이란? |
| slide-09 | 26/50 | 1권 | 주석이란? |
| slide-10 | 31/50 | 1권 | Hello World란? |
| slide-11 | 36/50 | 1권 | 틀린 코드 찾기 (세미콜론 빠짐) |
| slide-12 | 41/50 | 1권 | 실행 결과 예측 1 |
| slide-13 | 46/50 | 1권 | 종합 실습 1 (첫 출력 프로그램) |
| slide-14 | 1/50 | **2권** | 변수와 자료형 1 (변수란?) |
| slide-15 | 6/50 | 2권 | 변수와 자료형 6 (int 정수형) |
| slide-16 | 11/50 | 2권 | 변수와 자료형 11 (double 실수형) |
| slide-17 | 16/50 | 2권 | 변수와 자료형 16 (char 문자형) |
| slide-18 | 26/50 | 2권 | 변수와 자료형 26 (string 문자열) |
| slide-19 | 31/50 | 2권 | 변수와 자료형 31 (변수 이름) |
| slide-20 | 36/50 | 2권 | 변수와 자료형 36 (int형 오류 찾기) |
| slide-21 | 41/50 | 2권 | 변수와 자료형 41 (실행 결과 예측) |

**주의**: slide-02/03이 slide-01과 동일, slide-05가 slide-04와 동일. 자현이 PNG 추출 시 중복 발생한 듯. 코스 데이터에는 중복 제거하고 unique 슬라이드만 사용 권장.

또한 2권은 46/50까지 있어야 하는데 slide-21이 41/50 (변수와 자료형 41)에서 끝남 — **2권 마지막 종합 실습(46/50)이 누락된 듯**. 자현 확인 필요.

### `public/learn/cpp-vol3/` (9장) — **3권 입력과 연산자**
| 파일명 | 페이지 | 내용 |
|---|---|---|
| slide-01 | 1/50 | 입력과 연산자 1 (3권 시작 — cin 개념) |
| slide-02 | 6/50 | 입력과 연산자 6 (정수 입력) |
| slide-03 | 11/50 | 입력과 연산자 11 (문자열 입력 2 — 공백 없는 단어) |
| slide-04 | 16/50 | 입력과 연산자 16 (산술 연산자) |
| slide-05 | 21/50 | 입력과 연산자 21 (나머지 %) |
| slide-06 | 26/50 | 입력과 연산자 26 (대입 연산자) |
| slide-07 | 26/50 | (slide-06과 동일 — 중복) |
| slide-08 | 36/50 | 입력과 연산자 36 (논리 연산자) |
| slide-09 | 41/50 | 입력과 연산자 41 (입력 순서 오류 찾기) |

**주의**: slide-07이 slide-06과 동일 (중복). 또한 31/50(비교 연산자 추정)이 누락됨.

---

## 2. 슬라이드별 상세 분석

### 1권: C++ 시작과 출력 (cpp/slide-01 ~ slide-13)

| # | 파일 | 페이지 | 제목 | 부제 | 핵심 주제 | type |
|---|---|---|---|---|---|---|
| 1 | slide-01 | 1/50 | **C++ 시작과 출력** | 1권 표지 | 첫 코드를 쓰고 화면에 출력하기. 4단계 학습(개념 학습→코드 구조→출력문 추가→직접 실습). 학습목표: cout/endl/`<<` 사용법 | 이론 |
| 2 | slide-04 | 6/50 | **첫 C++ 코드 만나보기** | Hello World 코드를 눈으로 익히기 | `#include <iostream>`, `using namespace std;`, `int main()`, `cout << "Hello World!"`, `return 0;` 코드 구조 시각화 | 이론 |
| 3 | slide-06 | 14/50 | **여러 문장 출력하기** | cout을 여러 번 써서 여러 내용을 차례대로 출력 | `cout << "안녕하세요";` `cout << "저는 중학생이에요.";` `cout << "C++을 배우는 중이에요.";` — cout이 여러 번 쓰일 수 있음 | 이론 |
| 4 | slide-07 | 19/50 | **줄바꿈 비교하기** | endl과 \n은 어떻게 다를까? | `cout << "안녕" << endl;` vs `cout << "안녕\n";` — 둘 다 줄바꿈, 사용법/가독성 비교 | 이론 |
| 5 | slide-08 | 21/50 | **세미콜론이란?** | 명령이 끝났다는 표시 | 세미콜론(;)의 역할, 어디에 붙이는지(cout 문장/return 문장 끝), 빠지면 오류 발생 | 이론 |
| 6 | slide-09 | 26/50 | **주석이란?** | 코드에 설명을 적어 두는 메모 | `// 인사말 출력` 한 줄 주석, 주석은 화면에 출력되지 않고 컴퓨터가 무시 | 이론 |
| 7 | slide-10 | 31/50 | **Hello World란?** | 프로그래밍에서 가장 유명한 첫 인사 | Hello World의 의미 — 컴파일/실행 환경이 정상인지 확인용. 출력/문장구조/실행결과를 한 번에 익힘 | 이론 |
| 8 | slide-11 | 36/50 | **틀린 코드 찾기 1** | 세미콜론이 빠지면 왜 오류가 날까? | 세미콜론 누락 코드 vs 정상 코드 비교, 컴파일러가 문장 끝 인식 못해 오류 발생 | 실습 |
| 9 | slide-12 | 41/50 | **실행 결과 예측 1** | 코드를 보고 화면에 무엇이 나타날지 먼저 생각해보자 | `cout << "안녕하세요!";` 코드 → 결과 예측 훈련, 마음속으로 보며 글자가 똑같은지 비교 | 실습 |
| 10 | slide-13 | 46/50 | **종합 실습 1** | 첫 C++ 출력 프로그램을 직접 완성 | `cout << "안녕하세요!" << endl; cout << "코딩쏙과 함께해요!" << endl;` — cout, endl, 세미콜론 함께 복습. 직접 코드 따라 쓰고 실행 | 종합 |

### 2권: 변수와 자료형 (cpp/slide-14 ~ slide-21)

| # | 파일 | 페이지 | 제목 | 부제 | 핵심 주제 | type |
|---|---|---|---|---|---|---|
| 11 | slide-14 | 1/50 | **변수와 자료형 1** | 변수란 무엇일까? | `int age = 14;` `cout << age;` — 변수 = 값을 담아 두는 상자, 공간이라고 생각하면 됨 | 이론 |
| 12 | slide-15 | 6/50 | **변수와 자료형 6** | int 정수형이란? | `int age = 14;` — int는 정수를 저장하는 자료형. 1, 25, 100, -3 같은 정수 담기 | 이론 |
| 13 | slide-16 | 11/50 | **변수와 자료형 11** | double 실수형이란? | `double height = 165.7;` — double은 소수점이 있는 수를 저장. 3.14, 1.5, -2.7 같은 실수 | 이론 |
| 14 | slide-17 | 16/50 | **변수와 자료형 16** | char 문자형이란? | `char grade = 'A';` — char는 문자 1개를 저장. 작은따옴표(' ') 사용. "A"와 'A'의 차이 | 이론 |
| 15 | slide-18 | 26/50 | **변수와 자료형 26** | string 문자열이란? | `#include <string>` `string name = "Jina";` — string은 여러 글자(이름, 인사말, 문장) 저장. 큰따옴표(" ") 사용 | 이론 |
| 16 | slide-19 | 31/50 | **변수와 자료형 31** | 변수 이름이란? | `int age = 14;` `string name = "Jina";` — 변수 이름은 알아보기 쉽게 짓기. age, name 같은 좋은 이름 짓기 | 이론 |
| 17 | slide-20 | 36/50 | **변수와 자료형 36** | int형 오류 찾기 | `int age = "열셋";` `int score = "100점";` `int total = 10 + "5";` — int에 문자열/소수 넣으면 오류. string 또는 double로 바꿔 고치기 | 실습 |
| 18 | slide-21 | 41/50 | **변수와 자료형 41** | 실행 결과 예측 (자료형 종합) | `int age = 14; double height = 165.5; char grade = 'A';` `cout << age << endl;` 등 — 4가지 자료형(int/double/char/string)을 cout으로 출력했을 때 결과 예측 | 실습 |

> **누락**: 2권 종합 실습 1 (페이지 46/50, "변수와 자료형 46")이 cpp 폴더에 없음. 자현이 추출 누락한 듯. 종합실습은 string/int/double/char/bool 변수를 한 프로그램에 모두 사용하는 미션.

### 3권: 입력과 연산자 (cpp-vol3/slide-01 ~ slide-09)

| # | 파일 | 페이지 | 제목 | 부제 | 핵심 주제 | type |
|---|---|---|---|---|---|---|
| 1 | slide-01 | 1/50 | **입력과 연산자 1** | 3권 시작 — 왜 입력과 연산자가 필요할까? | `int age; cin >> age; cout << "나이: " << age << endl;` — 입력은 컴퓨터에 값을 알려주는 도구, 연산자는 값을 계산하거나 비교하는 기호 | 이론 |
| 2 | slide-02 | 6/50 | **입력과 연산자 6** | 정수 입력 (int 값 입력받기) | `int age; cin >> age;` — cin으로 키보드 입력받아 정수형 변수에 저장. cout으로 출력 | 이론 |
| 3 | slide-03 | 11/50 | **입력과 연산자 11** | 문자열 입력 2 — 공백 없는 단어 | `string name; cin >> name;` — string 변수에 한 단어 입력. 공백(스페이스)을 만나면 그 전까지만 입력됨 (주의점) | 이론 |
| 4 | slide-04 | 16/50 | **입력과 연산자 16** | 산술 연산자란? | `int a = 10, b = 3; cout << a + b; cout << a - b; cout << a * b; cout << a / b; cout << a % b;` — `+`, `-`, `*`, `/`, `%` 산술 연산자, 정수 나눗셈은 몫만 나옴 | 이론 |
| 5 | slide-05 | 21/50 | **입력과 연산자 21** | 나머지 % | `cout << "a%b = " << a%b;` — % 는 나누고 남은 값을 구하는 연산자. 10 % 3 = 1 등 | 이론 |
| 6 | slide-06 | 26/50 | **입력과 연산자 26** | 대입 연산자 = | `int age; age = 14;` `int score; score = 100;` — = 은 값을 저장하는 기호 (수학의 등호 아님). 오른쪽 값을 왼쪽 변수에 저장 | 이론 |
| 7 | slide-08 | 36/50 | **입력과 연산자 36** | 논리 연산자란? | `if ((age >= 14) && (score >= 80))` — &&(AND), ||(OR), !(NOT). 두 개 이상 조건을 함께 판단할 때 사용 | 이론 |
| 8 | slide-09 | 41/50 | **입력과 연산자 41** | 입력 순서 오류 찾기 | `int age; string name; cout << "이름을 입력하세요"; cin >> age >> name;` — 입력 순서가 바뀌면 왜 다른 값이 저장될까? cin의 순서/타입 매칭 디버깅 | 실습 |

> **누락**:
> - 3권 비교 연산자 (페이지 31/50 추정)가 slide 누락
> - 종합 실습 (페이지 46/50 추정)도 누락
> - 또한 cpp-vol3/slide-07이 slide-06과 중복

---

## 3. TypeScript 데이터 정의 (cpp.ts에 적용 예정)

```ts
/**
 * C++ 학습 코스 (courseId='4')
 * - 1권: C++ 시작과 출력 (10 unit)
 * - 2권: 변수와 자료형 (8 unit)
 * - 3권: 입력과 연산자 (8 unit)
 * - 총 26 unit (이미지 기반)
 *
 * 슬라이드 PNG는 public/learn/cpp/ 와 public/learn/cpp-vol3/ 에 위치
 * 일부 unit은 누락된 슬라이드를 자현이 추가 추출 후 연결 필요
 */

export interface CppUnit {
  id: string;
  num: number;
  title: string;        // 화면에 표시될 진짜 제목
  topic: string;        // 한 줄 요약
  type: '이론' | '실습' | '프로젝트' | '종합';
  slidePath?: string;   // PNG 경로 (없으면 제목만)
}

// ─────────────────────────────────────────────────────────────
// 1권 + 2권: 입문 코스 (cpp/)
// ─────────────────────────────────────────────────────────────
export const CPP_INTRO_UNITS: CppUnit[] = [
  // 1권: C++ 시작과 출력
  { id: 'cpp-i01', num: 1, title: 'C++ 시작과 출력 (1권 안내)', topic: '4단계로 배우는 C++ 입문 — cout, endl, << 사용법', type: '이론', slidePath: '/learn/cpp/slide-01.png' },
  { id: 'cpp-i02', num: 2, title: '첫 C++ 코드 만나보기', topic: 'Hello World 코드 구조 익히기 (#include, main, cout, return)', type: '이론', slidePath: '/learn/cpp/slide-04.png' },
  { id: 'cpp-i03', num: 3, title: '여러 문장 출력하기', topic: 'cout을 여러 번 써서 여러 내용 차례대로 출력', type: '이론', slidePath: '/learn/cpp/slide-06.png' },
  { id: 'cpp-i04', num: 4, title: '줄바꿈 비교하기', topic: 'endl과 \\n의 차이 — 사용법, 가독성 비교', type: '이론', slidePath: '/learn/cpp/slide-07.png' },
  { id: 'cpp-i05', num: 5, title: '세미콜론이란?', topic: '명령이 끝났다는 표시(;) — 어디에 붙이고 빠지면 무슨 일이 생기는지', type: '이론', slidePath: '/learn/cpp/slide-08.png' },
  { id: 'cpp-i06', num: 6, title: '주석이란?', topic: '코드 설명용 메모(//) — 컴퓨터는 무시하고 사람만 읽는다', type: '이론', slidePath: '/learn/cpp/slide-09.png' },
  { id: 'cpp-i07', num: 7, title: 'Hello World란?', topic: '프로그래밍의 첫 인사 — 환경 점검과 출력 구조 한 번에', type: '이론', slidePath: '/learn/cpp/slide-10.png' },
  { id: 'cpp-i08', num: 8, title: '틀린 코드 찾기 1', topic: '세미콜론이 빠지면 왜 오류가 날까? (정상 vs 오류 비교)', type: '실습', slidePath: '/learn/cpp/slide-11.png' },
  { id: 'cpp-i09', num: 9, title: '실행 결과 예측 1', topic: '코드를 보고 화면에 무엇이 출력될지 미리 생각해보기', type: '실습', slidePath: '/learn/cpp/slide-12.png' },
  { id: 'cpp-i10', num: 10, title: '종합 실습 1: 첫 출력 프로그램', topic: 'cout, endl, 세미콜론을 함께 사용한 인사말 프로그램 완성', type: '종합', slidePath: '/learn/cpp/slide-13.png' },

  // 2권: 변수와 자료형
  { id: 'cpp-i11', num: 11, title: '변수란 무엇일까?', topic: '값을 담는 상자 — int age = 14 같은 변수의 개념', type: '이론', slidePath: '/learn/cpp/slide-14.png' },
  { id: 'cpp-i12', num: 12, title: 'int 정수형', topic: '정수를 저장하는 자료형 — 1, 25, 100, -3 등', type: '이론', slidePath: '/learn/cpp/slide-15.png' },
  { id: 'cpp-i13', num: 13, title: 'double 실수형', topic: '소수점이 있는 수를 저장 — 3.14, 1.5, -2.7 등', type: '이론', slidePath: '/learn/cpp/slide-16.png' },
  { id: 'cpp-i14', num: 14, title: 'char 문자형', topic: '문자 1개를 저장 — char grade = \'A\'; (작은따옴표)', type: '이론', slidePath: '/learn/cpp/slide-17.png' },
  { id: 'cpp-i15', num: 15, title: 'string 문자열', topic: '여러 글자(이름, 문장) 저장 — string name = "Jina"; (#include <string>)', type: '이론', slidePath: '/learn/cpp/slide-18.png' },
  { id: 'cpp-i16', num: 16, title: '변수 이름 짓기', topic: '알아보기 쉬운 이름 — age, name처럼 의미 있게', type: '이론', slidePath: '/learn/cpp/slide-19.png' },
  { id: 'cpp-i17', num: 17, title: 'int형 오류 찾기', topic: 'int에 문자열/소수를 넣으면 발생하는 오류와 해결법', type: '실습', slidePath: '/learn/cpp/slide-20.png' },
  { id: 'cpp-i18', num: 18, title: '실행 결과 예측 (자료형)', topic: 'int/double/char/string 변수를 cout 했을 때 결과 예측', type: '실습', slidePath: '/learn/cpp/slide-21.png' },

  // (누락) 2권 종합 실습 — slide PNG 추출 후 연결 필요
  // { id: 'cpp-i19', num: 19, title: '종합 실습 2: 자료형 모두 사용', topic: 'int/double/char/string/bool을 한 프로그램에 모두 사용', type: '종합', slidePath: '/learn/cpp/slide-XX.png' },
];

// ─────────────────────────────────────────────────────────────
// 3권: 입력과 연산자 (cpp-vol3/)
// ─────────────────────────────────────────────────────────────
export const CPP_VOL3_UNITS: CppUnit[] = [
  { id: 'cpp-v3-01', num: 1, title: '입력과 연산자 시작', topic: '3권 안내 — cin으로 입력받고, 연산자로 계산/비교한다', type: '이론', slidePath: '/learn/cpp-vol3/slide-01.png' },
  { id: 'cpp-v3-02', num: 2, title: '정수 입력 (cin)', topic: 'int 변수에 cin >> 으로 키보드 입력받기', type: '이론', slidePath: '/learn/cpp-vol3/slide-02.png' },
  { id: 'cpp-v3-03', num: 3, title: '문자열 입력 (공백 없는 단어)', topic: 'cin으로 string 한 단어 입력 — 공백 만나면 끊긴다는 주의점', type: '이론', slidePath: '/learn/cpp-vol3/slide-03.png' },
  { id: 'cpp-v3-04', num: 4, title: '산술 연산자 (+, -, *, /, %)', topic: '5가지 산술 연산자, 정수 나눗셈은 몫만 나오는 특징', type: '이론', slidePath: '/learn/cpp-vol3/slide-04.png' },
  { id: 'cpp-v3-05', num: 5, title: '나머지 연산자 (%)', topic: '나누고 남은 값을 구하는 % — 10 % 3 = 1 같은 예시', type: '이론', slidePath: '/learn/cpp-vol3/slide-05.png' },
  { id: 'cpp-v3-06', num: 6, title: '대입 연산자 (=)', topic: '오른쪽 값을 왼쪽 변수에 저장 — 수학의 등호와 다르다', type: '이론', slidePath: '/learn/cpp-vol3/slide-06.png' },
  // (누락) 비교 연산자 (==, !=, >, <, >=, <=) — 31/50 추정 슬라이드 없음
  { id: 'cpp-v3-07', num: 7, title: '논리 연산자 (&&, ||, !)', topic: '두 개 이상 조건을 함께 판단 — &&(AND), ||(OR), !(NOT)', type: '이론', slidePath: '/learn/cpp-vol3/slide-08.png' },
  { id: 'cpp-v3-08', num: 8, title: '입력 순서 오류 찾기', topic: 'cin >> age >> name 순서가 바뀌면 왜 이상한 값이 들어가는지', type: '실습', slidePath: '/learn/cpp-vol3/slide-09.png' },

  // (누락) 비교 연산자 슬라이드 + 3권 종합 실습 — 추가 추출 필요
];

// ─────────────────────────────────────────────────────────────
// 챕터 그룹핑 (UI에서 권/Part로 묶어 표시)
// ─────────────────────────────────────────────────────────────
export const CPP_CHAPTERS_GROUPING = {
  intro: [
    {
      chapterTitle: '1권: C++ 시작과 출력',
      description: '첫 C++ 코드를 쓰고 화면에 출력하는 법 익히기',
      units: ['cpp-i01', 'cpp-i02', 'cpp-i03', 'cpp-i04', 'cpp-i05', 'cpp-i06', 'cpp-i07', 'cpp-i08', 'cpp-i09', 'cpp-i10'],
    },
    {
      chapterTitle: '2권: 변수와 자료형',
      description: '값을 담는 상자(변수)와 4가지 자료형(int/double/char/string) 다루기',
      units: ['cpp-i11', 'cpp-i12', 'cpp-i13', 'cpp-i14', 'cpp-i15', 'cpp-i16', 'cpp-i17', 'cpp-i18'],
    },
  ],
  vol3: [
    {
      chapterTitle: '3권: 입력과 연산자',
      description: 'cin으로 입력받고, 산술/대입/논리 연산자로 값을 다루기',
      units: ['cpp-v3-01', 'cpp-v3-02', 'cpp-v3-03', 'cpp-v3-04', 'cpp-v3-05', 'cpp-v3-06', 'cpp-v3-07', 'cpp-v3-08'],
    },
  ],
};
```

---

## 4. 자현이 확인/추가 작업 필요한 항목

### A. 누락 슬라이드 추출
1. **2권 종합 실습 1** — 페이지 46/50, "변수와 자료형 46" — `cpp/` 폴더에 없음
2. **3권 비교 연산자** — 페이지 31/50 추정 — `cpp-vol3/` 폴더에 없음
3. **3권 종합 실습** — 페이지 46/50 추정 — `cpp-vol3/` 폴더에 없음

### B. 중복 슬라이드 정리
- `cpp/slide-02.png`, `cpp/slide-03.png` = `cpp/slide-01.png` 와 동일
- `cpp/slide-05.png` = `cpp/slide-04.png` 와 동일
- `cpp-vol3/slide-07.png` = `cpp-vol3/slide-06.png` 와 동일

→ 중복 파일은 삭제하거나 분석에서 제외. 위 TypeScript에서는 unique 슬라이드 18장(입문) + 8장(vol3) = 26장만 사용.

### C. cpp.ts 적용 시 고려
- 기존 cpp.ts 구조(courseId='4', units 배열) 확인 후 위 데이터 매핑
- `slidePath` 필드를 학습 화면에서 `<img src={slidePath} />`로 표시하면 자료 활용 가능
- 1권/2권/3권 구분은 `CPP_CHAPTERS_GROUPING`으로 챕터 단위 UI 가능

---

## 5. 분석 요약 (자현 보고용)

- **입문(cpp/)** 21장 → 중복 3장 제외 unique 18장. 1권(C++ 시작과 출력) 10unit + 2권(변수와 자료형) 8unit 구성
- **Vol.3(cpp-vol3/)** 9장 → 중복 1장 제외 unique 8장. 3권(입력과 연산자) 8unit
- 모든 슬라이드는 "코딩쏙" 브랜딩 + 코드 예시 + 3가지 설명 카드(의미/사용법/기억하기) + 생각 질문 패턴으로 통일됨
- **누락 발견**: 2권 종합실습, 3권 비교연산자, 3권 종합실습 — 자현이 추가 추출 필요
- **placeholder 제거 가능**: 위 26개 unit 모두 실제 의미 있는 제목 + 한 줄 주제 도출 완료
