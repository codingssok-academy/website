// ═══════════════════════════════════════
//  승급 시험 문제 풀
// ═══════════════════════════════════════

export interface ExamQuestion {
    id: string;
    question: string;
    options: string[];
    correct: number;
    difficulty: 'easy' | 'medium' | 'hard';
    tier: string;
}

export const QUESTION_POOL: ExamQuestion[] = [
    // ══════════════════════════════════
    //  Easy (Iron→Bronze) — 기초 문법
    // ══════════════════════════════════
    {
        id: 'q01', difficulty: 'easy', tier: 'Iron',
        question: 'C언어에서 화면에 문자열을 출력하는 함수는?',
        options: ['printf()', 'scanf()', 'puts()', 'gets()'],
        correct: 0,
    },
    {
        id: 'q02', difficulty: 'easy', tier: 'Iron',
        question: '다음 중 C언어의 정수형 자료형이 아닌 것은?',
        options: ['int', 'float', 'short', 'long'],
        correct: 1,
    },
    {
        id: 'q03', difficulty: 'easy', tier: 'Iron',
        question: 'C 프로그램의 시작 함수 이름은?',
        options: ['start()', 'main()', 'begin()', 'init()'],
        correct: 1,
    },
    {
        id: 'q04', difficulty: 'easy', tier: 'Iron',
        question: '정수 변수를 선언하는 올바른 방법은?',
        options: ['integer x;', 'int x;', 'var x: int;', 'x = int;'],
        correct: 1,
    },
    {
        id: 'q05', difficulty: 'easy', tier: 'Iron',
        question: 'printf("%d", 10 + 5); 의 출력 결과는?',
        options: ['10', '5', '15', '105'],
        correct: 2,
    },
    {
        id: 'q06', difficulty: 'easy', tier: 'Iron',
        question: 'C언어에서 한 줄 주석을 작성하는 기호는?',
        options: ['#', '//', '/* */', '--'],
        correct: 1,
    },
    {
        id: 'q07', difficulty: 'easy', tier: 'Iron',
        question: 'scanf() 함수에서 정수를 입력받을 때 사용하는 서식 지정자는?',
        options: ['%f', '%c', '%d', '%s'],
        correct: 2,
    },
    {
        id: 'q08', difficulty: 'easy', tier: 'Iron',
        question: '다음 중 C언어의 관계 연산자가 아닌 것은?',
        options: ['==', '!=', '<>', '>='],
        correct: 2,
    },
    {
        id: 'q09', difficulty: 'easy', tier: 'Iron',
        question: '#include <stdio.h>에서 stdio.h는 무엇인가?',
        options: ['실행 파일', '헤더 파일', '소스 파일', '오브젝트 파일'],
        correct: 1,
    },
    {
        id: 'q10', difficulty: 'easy', tier: 'Iron',
        question: 'C언어에서 문장의 끝을 나타내는 기호는?',
        options: ['.', ':', ';', ','],
        correct: 2,
    },

    // ══════════════════════════════════
    //  Medium (Bronze→Silver, Silver→Gold)
    // ══════════════════════════════════
    {
        id: 'q11', difficulty: 'medium', tier: 'Bronze',
        question: 'for(int i=0; i<5; i++) 반복문은 몇 번 실행되는가?',
        options: ['4번', '5번', '6번', '무한'],
        correct: 1,
    },
    {
        id: 'q12', difficulty: 'medium', tier: 'Bronze',
        question: 'int arr[5] = {1,2,3,4,5}; 에서 arr[2]의 값은?',
        options: ['1', '2', '3', '4'],
        correct: 2,
    },
    {
        id: 'q13', difficulty: 'medium', tier: 'Bronze',
        question: 'while(1)은 어떤 의미인가?',
        options: ['1번 실행', '조건부 실행', '무한 반복', '컴파일 에러'],
        correct: 2,
    },
    {
        id: 'q14', difficulty: 'medium', tier: 'Bronze',
        question: 'switch 문에서 각 case를 끝내는 키워드는?',
        options: ['stop', 'end', 'break', 'exit'],
        correct: 2,
    },
    {
        id: 'q15', difficulty: 'medium', tier: 'Bronze',
        question: '다음 중 do-while 문의 특징은?',
        options: ['조건을 먼저 검사', '최소 1번 실행', '반복 불가', 'for문과 동일'],
        correct: 1,
    },
    {
        id: 'q16', difficulty: 'medium', tier: 'Bronze',
        question: 'char str[] = "Hello"; 에서 str의 크기(sizeof)는?',
        options: ['5', '6', '4', '7'],
        correct: 1,
    },
    {
        id: 'q17', difficulty: 'medium', tier: 'Silver',
        question: '함수의 반환형이 없을 때 사용하는 키워드는?',
        options: ['null', 'void', 'none', 'empty'],
        correct: 1,
    },
    {
        id: 'q18', difficulty: 'medium', tier: 'Silver',
        question: '배열의 인덱스는 몇부터 시작하는가?',
        options: ['-1', '0', '1', '배열 크기에 따라 다름'],
        correct: 1,
    },
    {
        id: 'q19', difficulty: 'medium', tier: 'Silver',
        question: 'strlen("abc")의 반환값은?',
        options: ['2', '3', '4', '에러'],
        correct: 1,
    },
    {
        id: 'q20', difficulty: 'medium', tier: 'Silver',
        question: '다음 중 문자열을 복사하는 함수는?',
        options: ['strcmp()', 'strcpy()', 'strlen()', 'strcat()'],
        correct: 1,
    },
    {
        id: 'q21', difficulty: 'medium', tier: 'Silver',
        question: 'int a = 10; int *p = &a; 에서 *p의 값은?',
        options: ['a의 주소', '10', 'p의 주소', '0'],
        correct: 1,
    },
    {
        id: 'q22', difficulty: 'medium', tier: 'Silver',
        question: '재귀 함수에서 반드시 필요한 것은?',
        options: ['전역 변수', '종료 조건', 'static 변수', 'void 반환형'],
        correct: 1,
    },

    // ══════════════════════════════════
    //  Hard (Gold→Platinum, Platinum→Diamond)
    // ══════════════════════════════════
    {
        id: 'q23', difficulty: 'hard', tier: 'Gold',
        question: '포인터 변수의 크기는 시스템에 따라 다르다. 64비트 시스템에서 일반적인 크기는?',
        options: ['4바이트', '8바이트', '16바이트', '타입에 따라 다름'],
        correct: 1,
    },
    {
        id: 'q24', difficulty: 'hard', tier: 'Gold',
        question: 'struct 키워드로 정의한 구조체의 멤버에 접근할 때 사용하는 연산자는?',
        options: ['::', '->', '.', '둘 다 (->와 .)'],
        correct: 3,
    },
    {
        id: 'q25', difficulty: 'hard', tier: 'Gold',
        question: 'malloc()으로 할당한 메모리를 해제하는 함수는?',
        options: ['delete()', 'free()', 'release()', 'dealloc()'],
        correct: 1,
    },
    {
        id: 'q26', difficulty: 'hard', tier: 'Gold',
        question: '다음 중 파일을 읽기 모드로 여는 코드는?',
        options: ['fopen("a.txt","w")', 'fopen("a.txt","r")', 'fopen("a.txt","a")', 'fopen("a.txt","rw")'],
        correct: 1,
    },
    {
        id: 'q27', difficulty: 'hard', tier: 'Platinum',
        question: '이중 포인터 int **pp에서 **pp가 의미하는 것은?',
        options: ['포인터의 주소', '포인터가 가리키는 값의 주소', '원본 변수의 값', '컴파일 에러'],
        correct: 2,
    },
    {
        id: 'q28', difficulty: 'hard', tier: 'Platinum',
        question: 'typedef struct { int x; int y; } Point; 에서 Point는?',
        options: ['변수 이름', '함수 이름', '구조체 별칭', '포인터 이름'],
        correct: 2,
    },
    {
        id: 'q29', difficulty: 'hard', tier: 'Platinum',
        question: '함수 포인터의 올바른 선언은?',
        options: ['int *func();', 'int (*func)();', 'int func*();', '*int func();'],
        correct: 1,
    },
    {
        id: 'q30', difficulty: 'hard', tier: 'Platinum',
        question: '비트 연산 0xFF & 0x0F의 결과는?',
        options: ['0xFF', '0x0F', '0xF0', '0x00'],
        correct: 1,
    },
    {
        id: 'q31', difficulty: 'hard', tier: 'Platinum',
        question: 'enum Color { RED, GREEN=5, BLUE }; 에서 BLUE의 값은?',
        options: ['2', '3', '6', '7'],
        correct: 2,
    },
    {
        id: 'q32', difficulty: 'hard', tier: 'Diamond',
        question: 'volatile 키워드의 용도는?',
        options: ['상수 선언', '최적화 방지', '메모리 해제', '타입 변환'],
        correct: 1,
    },
    {
        id: 'q33', difficulty: 'hard', tier: 'Diamond',
        question: '공용체(union)의 특징은?',
        options: ['모든 멤버가 별도 메모리 사용', '가장 큰 멤버 크기만큼 메모리 할당', '멤버 접근 불가', '배열만 포함 가능'],
        correct: 1,
    },
    {
        id: 'q34', difficulty: 'hard', tier: 'Diamond',
        question: '#define SQUARE(x) ((x)*(x)) 매크로에서 SQUARE(3+1)의 결과는?',
        options: ['16', '10', '7', '9'],
        correct: 0,
    },
    {
        id: 'q35', difficulty: 'hard', tier: 'Diamond',
        question: 'static 지역 변수의 특징은?',
        options: ['함수 종료 시 소멸', '프로그램 종료까지 유지', '전역에서 접근 가능', 'const와 동일'],
        correct: 1,
    },

    // ══════════════════════════════════════════════════
    //  추가 문제 (q36~q65) — 포인터, 메모리, 파일, 문자열 등
    // ══════════════════════════════════════════════════

    // ── 포인터 산술 ──
    {
        id: 'q36', difficulty: 'medium', tier: 'Silver',
        question: 'int arr[5]; int *p = arr; p++; 이후 p가 가리키는 것은?',
        options: ['arr[0]', 'arr[1]', 'arr[2]', '쓰레기 값'],
        correct: 1,
    },
    {
        id: 'q37', difficulty: 'hard', tier: 'Gold',
        question: 'int arr[5] = {10,20,30,40,50}; int *p = arr+3; printf("%d", p[-1]); 의 출력은?',
        options: ['20', '30', '40', '50'],
        correct: 1,
    },
    {
        id: 'q38', difficulty: 'hard', tier: 'Platinum',
        question: 'int a[3] = {1,2,3}; printf("%ld", (a+2) - a); 의 결과는?',
        options: ['2', '8', '6', '컴파일 에러'],
        correct: 0,
    },

    // ── 동적 메모리 할당 (malloc/free) ──
    {
        id: 'q39', difficulty: 'medium', tier: 'Silver',
        question: 'malloc() 함수가 선언된 헤더 파일은?',
        options: ['<stdio.h>', '<string.h>', '<stdlib.h>', '<math.h>'],
        correct: 2,
    },
    {
        id: 'q40', difficulty: 'hard', tier: 'Gold',
        question: 'int *p = (int*)malloc(5 * sizeof(int)); 에서 할당되는 바이트 수는? (int가 4바이트일 때)',
        options: ['5', '10', '20', '4'],
        correct: 2,
    },
    {
        id: 'q41', difficulty: 'hard', tier: 'Platinum',
        question: 'calloc(10, sizeof(int))과 malloc(10 * sizeof(int))의 차이점은?',
        options: ['차이 없음', 'calloc은 0으로 초기화', 'malloc이 더 빠름', 'calloc은 해제 불필요'],
        correct: 1,
    },
    {
        id: 'q42', difficulty: 'hard', tier: 'Diamond',
        question: 'realloc(ptr, 0)의 동작은?',
        options: ['아무 변화 없음', 'ptr 크기가 0이 됨', 'free(ptr)과 동일', '컴파일 에러'],
        correct: 2,
    },

    // ── 파일 I/O (fopen/fprintf/fscanf) ──
    {
        id: 'q43', difficulty: 'medium', tier: 'Bronze',
        question: 'fclose() 함수의 역할은?',
        options: ['파일 생성', '파일 삭제', '파일 닫기', '파일 이름 변경'],
        correct: 2,
    },
    {
        id: 'q44', difficulty: 'hard', tier: 'Gold',
        question: 'fprintf(fp, "%d", 100); 에서 fp는 무엇인가?',
        options: ['정수 변수', '문자열', 'FILE 포인터', '함수 포인터'],
        correct: 2,
    },
    {
        id: 'q45', difficulty: 'hard', tier: 'Platinum',
        question: 'fopen()이 파일 열기에 실패했을 때 반환하는 값은?',
        options: ['-1', '0', 'NULL', 'EOF'],
        correct: 2,
    },
    {
        id: 'q46', difficulty: 'hard', tier: 'Gold',
        question: '파일에 데이터를 추가(append)하려면 fopen()의 모드는?',
        options: ['"r"', '"w"', '"a"', '"r+"'],
        correct: 2,
    },

    // ── 2차원 배열 ──
    {
        id: 'q47', difficulty: 'medium', tier: 'Bronze',
        question: 'int arr[3][4]; 에서 전체 요소의 개수는?',
        options: ['3', '4', '7', '12'],
        correct: 3,
    },
    {
        id: 'q48', difficulty: 'medium', tier: 'Silver',
        question: 'int a[2][3] = {{1,2,3},{4,5,6}}; a[1][2]의 값은?',
        options: ['3', '5', '6', '4'],
        correct: 2,
    },
    {
        id: 'q49', difficulty: 'hard', tier: 'Gold',
        question: '2차원 배열을 함수에 전달할 때, 생략할 수 있는 차원은?',
        options: ['행(첫 번째 차원)', '열(두 번째 차원)', '모든 차원', '생략 불가'],
        correct: 0,
    },

    // ── 문자열 함수 (strlen/strcpy/strcat/strcmp) ──
    {
        id: 'q50', difficulty: 'medium', tier: 'Silver',
        question: 'strcmp("abc", "abc")의 반환값은?',
        options: ['1', '-1', '0', 'true'],
        correct: 2,
    },
    {
        id: 'q51', difficulty: 'medium', tier: 'Silver',
        question: 'strcat() 함수의 기능은?',
        options: ['문자열 비교', '문자열 복사', '문자열 이어붙이기', '문자열 길이 반환'],
        correct: 2,
    },
    {
        id: 'q52', difficulty: 'hard', tier: 'Gold',
        question: 'char s[10] = "Hi"; strcat(s, "!!"); 이후 strlen(s)의 값은?',
        options: ['2', '3', '4', '10'],
        correct: 2,
    },

    // ── 재귀 ──
    {
        id: 'q53', difficulty: 'medium', tier: 'Silver',
        question: '재귀로 팩토리얼을 구현할 때, factorial(0)의 반환값은?',
        options: ['0', '1', '-1', '정의되지 않음'],
        correct: 1,
    },
    {
        id: 'q54', difficulty: 'hard', tier: 'Platinum',
        question: '재귀 함수에서 종료 조건 없이 계속 호출하면 발생하는 것은?',
        options: ['무한 루프', '스택 오버플로', '세그폴트만 발생', '정상 종료'],
        correct: 1,
    },

    // ── 연결 리스트 기초 ──
    {
        id: 'q55', difficulty: 'hard', tier: 'Gold',
        question: '단일 연결 리스트의 노드에 반드시 필요한 것은?',
        options: ['이전 노드 포인터', '다음 노드 포인터', '인덱스 번호', '크기 정보'],
        correct: 1,
    },
    {
        id: 'q56', difficulty: 'hard', tier: 'Platinum',
        question: '연결 리스트의 마지막 노드의 next 포인터 값은?',
        options: ['0', '-1', 'NULL', '자기 자신'],
        correct: 2,
    },

    // ── #define 매크로 ──
    {
        id: 'q57', difficulty: 'medium', tier: 'Bronze',
        question: '#define PI 3.14 에서 PI는 어떤 것으로 처리되는가?',
        options: ['변수', '상수', '매크로(전처리 치환)', '함수'],
        correct: 2,
    },
    {
        id: 'q58', difficulty: 'hard', tier: 'Diamond',
        question: '#define MAX(a,b) ((a)>(b)?(a):(b)) 에서 괄호가 많은 이유는?',
        options: ['문법 오류 방지', '연산자 우선순위 문제 방지', '가독성 향상', '특별한 이유 없음'],
        correct: 1,
    },

    // ── typedef ──
    {
        id: 'q59', difficulty: 'medium', tier: 'Silver',
        question: 'typedef int INT32; 이후 INT32 x = 5; 에서 x의 자료형은?',
        options: ['INT32', 'int', 'long', 'short'],
        correct: 1,
    },
    {
        id: 'q60', difficulty: 'hard', tier: 'Gold',
        question: 'typedef와 #define의 차이점으로 올바른 것은?',
        options: ['기능이 완전히 동일하다', 'typedef는 컴파일러가 처리한다', '#define은 컴파일러가 처리한다', 'typedef는 함수에만 사용 가능하다'],
        correct: 1,
    },

    // ── enum 고급 ──
    {
        id: 'q61', difficulty: 'medium', tier: 'Bronze',
        question: 'enum Direction { UP, DOWN, LEFT, RIGHT }; 에서 LEFT의 값은?',
        options: ['0', '1', '2', '3'],
        correct: 2,
    },
    {
        id: 'q62', difficulty: 'hard', tier: 'Platinum',
        question: 'enum { A=1, B=A<<2, C=B|A }; 에서 C의 값은?',
        options: ['3', '4', '5', '6'],
        correct: 2,
    },

    // ── 비트 연산 ──
    {
        id: 'q63', difficulty: 'medium', tier: 'Silver',
        question: '5 << 1 의 결과는?',
        options: ['2', '5', '10', '1'],
        correct: 2,
    },
    {
        id: 'q64', difficulty: 'hard', tier: 'Diamond',
        question: '~0 (비트 NOT)의 결과는? (int가 32비트 signed일 때)',
        options: ['0', '1', '-1', '2147483647'],
        correct: 2,
    },

    // ── 삼항 연산자 ──
    {
        id: 'q65', difficulty: 'easy', tier: 'Iron',
        question: 'int x = (5 > 3) ? 10 : 20; 에서 x의 값은?',
        options: ['5', '3', '10', '20'],
        correct: 2,
    },

    // ── do-while 루프 ──
    {
        id: 'q66', difficulty: 'medium', tier: 'Bronze',
        question: 'do { printf("A"); } while(0); 의 출력은?',
        options: ['출력 없음', 'A', 'AA', '무한 출력'],
        correct: 1,
    },

    // ── goto 문 ──
    {
        id: 'q67', difficulty: 'medium', tier: 'Silver',
        question: 'goto 문의 특징으로 올바른 것은?',
        options: ['함수 간 이동 가능', '같은 함수 내에서만 이동 가능', 'C에서 사용 불가', '반복문 내에서만 사용 가능'],
        correct: 1,
    },
    {
        id: 'q68', difficulty: 'hard', tier: 'Gold',
        question: 'goto 문이 권장되지 않는 주된 이유는?',
        options: ['실행 속도가 느림', '메모리 누수 발생', '코드 흐름을 이해하기 어려움', '최신 컴파일러에서 지원 안 됨'],
        correct: 2,
    },

    // ── 함수 포인터 ──
    {
        id: 'q69', difficulty: 'hard', tier: 'Platinum',
        question: 'void (*fp)(int); fp = myFunc; fp(10); 에서 fp(10)은 무엇을 하는가?',
        options: ['포인터 주소 출력', 'myFunc(10) 호출', '컴파일 에러', '10을 반환'],
        correct: 1,
    },
    {
        id: 'q70', difficulty: 'hard', tier: 'Diamond',
        question: '함수 포인터 배열의 올바른 선언은?',
        options: ['int (*arr[])(int);', 'int *arr[](int);', 'int (arr[])(int);', 'int arr[]*();'],
        correct: 0,
    },

    // ── 추가 기초/중급 문제 ──
    {
        id: 'q71', difficulty: 'easy', tier: 'Iron',
        question: 'C언어에서 논리 AND 연산자는?',
        options: ['&', '&&', 'AND', '||'],
        correct: 1,
    },
    {
        id: 'q72', difficulty: 'easy', tier: 'Iron',
        question: 'int x = 10 % 3; 에서 x의 값은?',
        options: ['3', '1', '0', '10'],
        correct: 1,
    },
    {
        id: 'q73', difficulty: 'medium', tier: 'Bronze',
        question: 'continue 문의 역할은?',
        options: ['반복문 종료', '프로그램 종료', '다음 반복으로 건너뜀', '함수 종료'],
        correct: 2,
    },
    {
        id: 'q74', difficulty: 'hard', tier: 'Gold',
        question: 'char *p = "Hello"; p[0] = \'h\'; 의 결과는?',
        options: ['hello 출력', '정상 동작', '정의되지 않은 동작(런타임 에러 가능)', '컴파일 에러'],
        correct: 2,
    },
    {
        id: 'q75', difficulty: 'hard', tier: 'Diamond',
        question: 'sizeof(char)의 값은 항상 얼마인가?',
        options: ['0', '1', '플랫폼에 따라 다름', '2'],
        correct: 1,
    },
];
