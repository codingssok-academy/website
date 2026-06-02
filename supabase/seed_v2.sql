-- ============================================================
-- Codingssok Academy v2 — Seed Data (실전 데이터)
-- migration_v2.sql 실행 후에 이 파일을 실행하세요
-- ============================================================

-- ── 티어 정의 (아이언 ~ 챌린저) ──
INSERT INTO public.tiers (name, name_ko, icon, color, gradient, min_points, sort_order) VALUES
('Iron',         '아이언',       '🪨', '#6b7280', 'linear-gradient(135deg, #6b7280, #9ca3af)', 0,    1),
('Bronze',       '브론즈',       '🥉', '#b45309', 'linear-gradient(135deg, #b45309, #d97706)', 100,  2),
('Silver',       '실버',         '🥈', '#6b7280', 'linear-gradient(135deg, #9ca3af, #d1d5db)', 300,  3),
('Gold',         '골드',         '🥇', '#ca8a04', 'linear-gradient(135deg, #ca8a04, #eab308)', 600,  4),
('Platinum',     '플래티넘',     '💎', '#0891b2', 'linear-gradient(135deg, #0891b2, #06b6d4)', 1000, 5),
('Diamond',      '다이아',       '💠', '#2563eb', 'linear-gradient(135deg, #2563eb, #3b82f6)', 1500, 6),
('Grandmaster',  '그랜드마스터', '🏆', '#7c3aed', 'linear-gradient(135deg, #7c3aed, #8b5cf6)', 2200, 7),
('Challenger',   '챌린저',       '👑', '#dc2626', 'linear-gradient(135deg, #dc2626, #ef4444)', 3000, 8);

-- ── 코스 데이터 (실제 교육 플랫폼 코스) ──
-- 기존 seed.sql의 영어 코스 대신 실제 한글 코스
DELETE FROM public.courses;
INSERT INTO public.courses (title, description, icon, color, category, difficulty, total_lessons, html_path, xp_reward, sort_order) VALUES
('컴퓨팅 사고력',       '문제를 분석하고 논리적으로 해결하는 사고력을 키웁니다. 알고리즘적 사고의 기초!',  '🧠', '#8b5cf6', '기초',       '입문',   20, '/courses/computational-thinking/index.html',  80,  1),
('코딩 기초',           '프로그래밍의 기본 개념 — 변수, 반복문, 조건문, 함수를 배웁니다.',              '💻', '#0ea5e9', '기초',       '입문',   24, '/courses/coding-basics/index.html',           100, 2),
('C언어 프로그래밍',    'C언어의 기초부터 포인터, 구조체, 메모리 관리까지 체계적으로 학습합니다.',       '⚙️', '#ef4444', '프로그래밍', '초급',   28, '/courses/c-programming/index.html',           150, 3),
('HTML/CSS 웹 기초',    'HTML 구조와 CSS 스타일링으로 나만의 웹페이지를 만들어봅니다.',                '🌐', '#14b8a6', '웹',         '입문',   20, '/courses/html-css/index.html',                100, 4),
('JavaScript 입문',     '웹에 생명을 불어넣는 JavaScript의 기초를 배웁니다.',                          '🟡', '#f59e0b', '웹',         '초급',   24, '/courses/javascript/index.html',              120, 5),
('알고리즘 도전',       '정렬, 탐색, 재귀, 동적 프로그래밍 등 핵심 알고리즘을 정복합니다.',            '🧮', '#f97316', '알고리즘',   '중급',   40, '/courses/algorithms/index.html',              200, 6),
('파이썬 기초',         'Python으로 시작하는 프로그래밍. 데이터 처리부터 자동화까지!',                  '🐍', '#3b82f6', '프로그래밍', '입문',   24, '/courses/python-basics/index.html',           100, 7),
('자료구조',            '배열, 연결 리스트, 스택, 큐, 트리, 그래프를 이해하고 구현합니다.',             '📊', '#6366f1', '알고리즘',   '중급',   32, '/courses/data-structures/index.html',         180, 8);

-- ── 배치고사 문제 (레벨 30 도달 시) ──
INSERT INTO public.tier_exams (tier_name, exam_type, question, options, correct_answer, explanation, difficulty, category, points, sort_order) VALUES
-- 배치고사 (placement)
('placement', 'placement',
 'C언어에서 정수형 변수를 선언하는 올바른 방법은?',
 '["int x = 10;", "integer x = 10;", "var x = 10;", "num x = 10;"]'::jsonb,
 'int x = 10;', 'C언어에서는 int 키워드로 정수형 변수를 선언합니다.', 'Easy', 'C언어', 10, 1),

('placement', 'placement',
 'printf("%d", 5/2); 의 출력 결과는?',
 '["2", "2.5", "3", "에러"]'::jsonb,
 '2', '정수끼리의 나눗셈은 소수점이 버려집니다.', 'Easy', 'C언어', 10, 2),

('placement', 'placement',
 'C언어에서 배열 int arr[5]의 인덱스 범위는?',
 '["0~4", "1~5", "0~5", "1~4"]'::jsonb,
 '0~4', 'C언어 배열은 0부터 시작합니다. arr[0] ~ arr[4]', 'Easy', 'C언어', 10, 3),

('placement', 'placement',
 'for(int i=0; i<10; i++) 에서 i는 몇 번 반복되나요?',
 '["9번", "10번", "11번", "무한"]'::jsonb,
 '10번', 'i가 0부터 9까지 총 10번 반복됩니다.', 'Easy', 'C언어', 10, 4),

('placement', 'placement',
 'C언어에서 문자열을 출력하는 함수는?',
 '["printf()", "print()", "echo()", "console.log()"]'::jsonb,
 'printf()', 'C언어의 표준 출력 함수는 printf()입니다.', 'Easy', 'C언어', 10, 5),

('placement', 'placement',
 'int *p; 에서 p는 무엇인가요?',
 '["정수형 포인터", "정수형 변수", "실수형 포인터", "문자형 변수"]'::jsonb,
 '정수형 포인터', '* 기호는 포인터를 선언할 때 사용합니다.', 'Medium', 'C언어', 15, 6),

('placement', 'placement',
 '다음 중 O(n log n) 시간복잡도를 가진 정렬은?',
 '["버블 정렬", "삽입 정렬", "퀵 정렬", "선택 정렬"]'::jsonb,
 '퀵 정렬', '퀵 정렬의 평균 시간복잡도는 O(n log n)입니다.', 'Medium', '알고리즘', 15, 7),

('placement', 'placement',
 'sizeof(int)의 일반적인 결과는? (64비트 시스템)',
 '["2", "4", "8", "1"]'::jsonb,
 '4', '대부분의 시스템에서 int는 4바이트입니다.', 'Medium', 'C언어', 15, 8),

('placement', 'placement',
 '재귀 함수에서 반드시 필요한 것은?',
 '["기저 조건(종료 조건)", "전역 변수", "포인터", "배열"]'::jsonb,
 '기저 조건(종료 조건)', '재귀 함수는 기저 조건이 없으면 무한 재귀에 빠집니다.', 'Medium', '알고리즘', 15, 9),

('placement', 'placement',
 'malloc()으로 할당한 메모리를 해제하는 함수는?',
 '["free()", "delete()", "release()", "dealloc()"]'::jsonb,
 'free()', 'C언어에서는 free() 함수로 동적 메모리를 해제합니다.', 'Hard', 'C언어', 20, 10),

-- 승급심사: 브론즈 → 실버
('Silver', 'promotion',
 '이중 포인터(int **pp)의 용도로 적절한 것은?',
 '["2차원 배열 동적 할당", "정수 저장", "문자열 출력", "반복문 제어"]'::jsonb,
 '2차원 배열 동적 할당', '이중 포인터는 포인터의 포인터로, 2차원 배열을 동적 할당할 때 사용합니다.', 'Medium', 'C언어', 15, 1),

('Silver', 'promotion',
 '스택(Stack)의 특징은?',
 '["LIFO", "FIFO", "랜덤 접근", "정렬된 접근"]'::jsonb,
 'LIFO', '스택은 Last In First Out(후입선출) 구조입니다.', 'Easy', '자료구조', 10, 2),

-- 승급심사: 실버 → 골드
('Gold', 'promotion',
 '이진 탐색의 시간복잡도는?',
 '["O(n)", "O(log n)", "O(n²)", "O(1)"]'::jsonb,
 'O(log n)', '이진 탐색은 매 단계마다 탐색 범위를 절반으로 줄입니다.', 'Easy', '알고리즘', 10, 1),

('Gold', 'promotion',
 '구조체(struct) 안에 함수 포인터를 넣을 수 있나요?',
 '["예, 가능합니다", "아니오, 불가능합니다", "C++에서만 가능", "컴파일 에러"]'::jsonb,
 '예, 가능합니다', 'C언어에서 구조체 멤버로 함수 포인터를 가질 수 있습니다.', 'Hard', 'C언어', 20, 2);

-- ── 데일리 미션 정의 ──
INSERT INTO public.daily_missions (title, description, icon, xp_reward, mission_type, condition_type, condition_value) VALUES
('🌅 오늘의 출석',       '오늘 학습 대시보드에 접속하세요',           'login',          10, 'daily',  'login',           1),
('✏️ 코드 1번 제출',     'C 컴파일러에서 코드를 1번 이상 실행하세요', 'code',           30, 'daily',  'submit_code',     1),
('📖 레슨 2개 완료',     '아무 코스에서 레슨 2개를 완료하세요',       'school',         40, 'daily',  'complete_lesson',  2),
('🏋️ 문제 3개 풀기',     '챌린지에서 문제 3개를 풀어보세요',          'fitness_center', 60, 'daily',  'solve_problems',   3),
('⏰ 30분 학습',         '총 30분 이상 학습하세요',                   'timer',          50, 'daily',  'study_minutes',   30),
('🔥 5일 연속 출석',     '5일 연속으로 출석 체크하세요',              'local_fire_department', 150, 'weekly', 'streak_days', 5),
('🎯 주간 챌린지 마스터', '이번 주 챌린지를 5개 이상 완료하세요',     'emoji_events',   200, 'weekly', 'solve_problems',  5);

-- ── 업적 정의 ──
INSERT INTO public.achievements (title, description, icon, icon_bg, icon_color, category, condition_type, condition_value, xp_reward, rarity, sort_order) VALUES
('🎉 첫 발자국',         '첫 번째 코드를 제출했어요!',               'celebration',    '#fef3c7', '#d97706', 'coding',   'first_code',       1,    50,  'common',    1),
('🔥 3일 연속 출석',     '3일 연속으로 학습했어요!',                 'local_fire_department', '#fee2e2', '#dc2626', 'streak',   'streak_days',      3,    80,  'common',    2),
('🔥 7일 연속 출석',     '일주일 내내 학습한 열정!',                 'local_fire_department', '#fef3c7', '#ea580c', 'streak',   'streak_days',      7,    150, 'rare',      3),
('🔥 30일 연속 출석',    '한 달 연속! 진정한 코딩 전사!',            'whatshot',       '#fce7f3', '#be185d', 'streak',   'streak_days',      30,   500, 'epic',      4),
('📚 문제 10개 정복',    '문제를 10개 풀었어요!',                    'school',         '#dbeafe', '#2563eb', 'coding',   'problems_solved',  10,   100, 'common',    5),
('📚 문제 50개 정복',    '반백! 50개 문제를 풀었어요!',              'auto_stories',   '#e0e7ff', '#4f46e5', 'coding',   'problems_solved',  50,   300, 'rare',      6),
('📚 문제 100개 정복',   '백전백승! 100문제 돌파!',                  'military_tech',  '#faf5ff', '#7c3aed', 'coding',   'problems_solved',  100,  800, 'epic',      7),
('⭐ XP 1000 달성',      '경험치 1000을 모았어요!',                  'star',           '#fef9c3', '#a16207', 'general',  'total_xp',         1000, 200, 'common',    8),
('⭐ XP 5000 달성',      '경험치 5000! 프로 수준!',                  'stars',          '#fff7ed', '#c2410c', 'general',  'total_xp',         5000, 500, 'rare',      9),
('⭐ XP 10000 달성',     '만 XP 달성! 전설의 코더!',                'auto_awesome',   '#fce7f3', '#9d174d', 'general',  'total_xp',         10000,1000,'legendary', 10),
('🥉 브론즈 달성',       '브론즈 티어에 도달했어요!',                'shield',         '#fff7ed', '#b45309', 'tier',     'tier_reached',     2,    100, 'common',    11),
('🥈 실버 달성',         '실버 티어에 도달했어요!',                  'shield',         '#f1f5f9', '#475569', 'tier',     'tier_reached',     3,    200, 'rare',      12),
('🥇 골드 달성',         '골드 티어! 빛나는 실력!',                  'shield',         '#fef9c3', '#a16207', 'tier',     'tier_reached',     4,    400, 'rare',      13),
('💎 플래티넘 달성',     '플래티넘! 엘리트 코더!',                   'diamond',        '#ecfeff', '#0891b2', 'tier',     'tier_reached',     5,    600, 'epic',      14),
('💠 다이아 달성',       '다이아몬드! 상위 1%!',                     'diamond',        '#eff6ff', '#2563eb', 'tier',     'tier_reached',     6,    800, 'epic',      15),
('👑 챌린저 달성',       '챌린저! 최고의 자리에 올랐어요!',          'crown',          '#fef2f2', '#dc2626', 'tier',     'tier_reached',     8,    2000,'legendary', 16),
('👥 첫 팔로워',         '누군가가 당신을 팔로우했어요!',            'group',          '#ede9fe', '#6d28d9', 'social',   'followers',        1,    50,  'common',    17),
('👥 인기스타 (10명)',   '팔로워 10명 달성! 인기쟁이!',              'diversity_3',    '#fdf4ff', '#a21caf', 'social',   'followers',        10,   200, 'rare',      18);

-- ── 챌린지 데이터 (한글화 + C언어 중심) ──
DELETE FROM public.challenges;
INSERT INTO public.challenges (title, description, difficulty, category, xp_reward, time_limit_minutes, code_template, test_cases, scheduled_date) VALUES
('두 수의 합',        '두 정수를 입력받아 합을 출력하는 프로그램을 작성하세요.',
 'Easy', 'C언어', 80, 15,
 E'#include <stdio.h>\n\nint main() {\n    // 두 정수를 입력받아 합을 출력하세요\n    \n    return 0;\n}',
 '[{"input": "3 5", "expected": "8"}, {"input": "10 20", "expected": "30"}]'::jsonb,
 CURRENT_DATE),

('구구단 출력',       '정수 N을 입력받아 N단 구구단을 출력하세요.',
 'Easy', 'C언어', 80, 15,
 E'#include <stdio.h>\n\nint main() {\n    // N을 입력받아 N단을 출력하세요\n    \n    return 0;\n}',
 '[{"input": "5", "expected": "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45"}]'::jsonb,
 CURRENT_DATE),

('팩토리얼 계산',     'N을 입력받아 N!을 출력하세요. (재귀 또는 반복문)',
 'Easy', 'C언어', 100, 20,
 E'#include <stdio.h>\n\nint factorial(int n) {\n    // 재귀로 구현하세요\n    return 0;\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d", factorial(n));\n    return 0;\n}',
 '[{"input": "5", "expected": "120"}, {"input": "0", "expected": "1"}]'::jsonb,
 CURRENT_DATE - INTERVAL '1 day'),

('배열 최대값 찾기',   '배열에서 가장 큰 값을 찾아 출력하세요.',
 'Medium', 'C언어', 120, 20,
 E'#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    \n    // 최대값을 찾아 출력하세요\n    \n    return 0;\n}',
 '[{"input": "5\n3 1 4 1 5", "expected": "5"}, {"input": "3\n-1 -5 -3", "expected": "-1"}]'::jsonb,
 CURRENT_DATE + INTERVAL '1 day'),

('버블 정렬 구현',     '배열을 버블 정렬로 오름차순 정렬하세요.',
 'Medium', 'C언어', 150, 25,
 E'#include <stdio.h>\n\nvoid bubbleSort(int arr[], int n) {\n    // 버블 정렬 구현\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    bubbleSort(arr, n);\n    for(int i=0; i<n; i++) printf("%d ", arr[i]);\n    return 0;\n}',
 '[{"input": "5\n5 3 1 4 2", "expected": "1 2 3 4 5"}]'::jsonb,
 CURRENT_DATE + INTERVAL '2 days'),

('문자열 뒤집기',      '입력받은 문자열을 뒤집어 출력하세요.',
 'Medium', 'C언어', 120, 20,
 E'#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char str[100];\n    scanf("%s", str);\n    \n    // 문자열을 뒤집어 출력하세요\n    \n    return 0;\n}',
 '[{"input": "hello", "expected": "olleh"}, {"input": "coding", "expected": "gnidoc"}]'::jsonb,
 CURRENT_DATE + INTERVAL '3 days'),

('이진 탐색 구현',     '정렬된 배열에서 이진 탐색으로 값을 찾으세요.',
 'Hard', 'C언어', 200, 30,
 E'#include <stdio.h>\n\nint binarySearch(int arr[], int n, int target) {\n    // 이진 탐색 구현\n    // 찾으면 인덱스, 없으면 -1 반환\n    return -1;\n}\n\nint main() {\n    int n, target;\n    scanf("%d %d", &n, &target);\n    int arr[100];\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    printf("%d", binarySearch(arr, n, target));\n    return 0;\n}',
 '[{"input": "5 3\n1 2 3 4 5", "expected": "2"}, {"input": "3 6\n1 3 5", "expected": "-1"}]'::jsonb,
 CURRENT_DATE + INTERVAL '4 days'),

('연결 리스트 구현',   '단일 연결 리스트를 구현하고 노드를 추가/출력하세요.',
 'Hard', 'C언어', 250, 35,
 E'#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int data;\n    struct Node* next;\n} Node;\n\n// 노드 추가, 출력 함수를 구현하세요\n\nint main() {\n    // 구현\n    return 0;\n}',
 '[{"input": "3\n1 2 3", "expected": "1 -> 2 -> 3"}]'::jsonb,
 CURRENT_DATE + INTERVAL '5 days');

-- ── 관리자 계정 설정 (louispetergu@naver.com) ──
-- 주의: 이 쿼리는 해당 유저가 이미 가입한 상태에서 실행해야 합니다
UPDATE public.profiles 
SET role = 'admin', display_name = '선생님 (관리자)'
WHERE email = 'louispetergu@naver.com';
