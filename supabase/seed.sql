-- ============================================================
-- Codingssok Academy — Seed Data
-- migration.sql 실행 후에 이 파일을 실행하세요
-- ============================================================

-- ── 코스 데이터 ──
insert into public.courses (title, description, icon, color, category, difficulty, total_lessons, html_path, xp_reward, sort_order) values
('Python Basics',        'Learn Python from scratch with hands-on exercises',  '🐍', '#3b82f6', 'Programming', 'Beginner',     24, '/courses/python-basics/index.html',    100, 1),
('Web Development',      'HTML, CSS, JavaScript fundamentals',                  '🌐', '#8b5cf6', 'Web',         'Beginner',     32, '/courses/web-dev/index.html',          120, 2),
('Algorithm Mastery',    'Data structures and algorithm challenges',            '🧮', '#f97316', 'Algorithms',  'Intermediate', 40, '/courses/algorithms/index.html',       200, 3),
('C Programming',        'System-level programming with C language',            '⚙️', '#ef4444', 'Programming', 'Intermediate', 28, '/courses/c-programming/index.html',    150, 4),
('Computational Thinking','Problem-solving and logical thinking skills',        '🧠', '#06b6d4', 'Foundation',  'Beginner',     20, '/courses/comp-thinking/index.html',     80, 5),
('React & Next.js',      'Modern frontend development with React',             '⚛️', '#0ea5e9', 'Web',         'Advanced',     36, '/courses/react-nextjs/index.html',     250, 6);

-- ── 챌린지 데이터 ──
insert into public.challenges (title, description, difficulty, category, xp_reward, time_limit_minutes, code_template, test_cases, scheduled_date) values
('Binary Search',    'Implement binary search algorithm for a sorted array',
 'Easy', 'Algorithms', 80, 20,
 E'def binary_search(nums, target):\n    """Find target in sorted array. Return index or -1."""\n    # Your solution here\n    pass',
 '[{"input": "[1,3,5,7,9], target=5", "expected": "2"}, {"input": "[1,2,3], target=4", "expected": "-1"}]'::jsonb,
 current_date - interval '4 days'),

('Merge Sort',       'Implement merge sort to sort an array in ascending order',
 'Medium', 'Algorithms', 120, 25,
 E'def merge_sort(nums):\n    """Sort array using merge sort."""\n    # Your solution here\n    pass',
 '[{"input": "[5,3,1,4,2]", "expected": "[1,2,3,4,5]"}]'::jsonb,
 current_date - interval '3 days'),

('Graph BFS',        'Implement breadth-first search on an adjacency list graph',
 'Hard', 'Algorithms', 200, 30,
 E'def bfs(graph, start):\n    """Return BFS traversal order."""\n    # Your solution here\n    pass',
 '[{"input": "{0:[1,2],1:[3],2:[3],3:[]}, start=0", "expected": "[0,1,2,3]"}]'::jsonb,
 current_date - interval '2 days'),

('Dynamic Programming', 'Solve the coin change problem using DP',
 'Hard', 'Algorithms', 200, 35,
 E'def coin_change(coins, amount):\n    """Return minimum coins needed."""\n    # Your solution here\n    pass',
 '[{"input": "[1,5,10], amount=27", "expected": "5"}]'::jsonb,
 current_date - interval '1 day'),

('Array Rotation',   'Given an integer array, rotate to the right by k steps in O(1) extra space',
 'Medium', 'Algorithms', 150, 30,
 E'def rotate(nums, k):\n    """\n    Rotate array to the right by k steps.\n    Do not return anything, modify nums in-place.\n    """\n    # Your solution here\n    pass',
 '[{"input": "[1,2,3,4,5,6,7], k=3", "expected": "[5,6,7,1,2,3,4]"}, {"input": "[-1,-100,3,99], k=2", "expected": "[3,99,-1,-100]"}, {"input": "[1,2], k=5", "expected": "[2,1]"}]'::jsonb,
 current_date),

('Two Sum',          'Find two numbers that add up to a specific target',
 'Easy', 'Algorithms', 80, 15,
 E'def two_sum(nums, target):\n    """Return indices of two numbers."""\n    # Your solution here\n    pass',
 '[{"input": "[2,7,11,15], target=9", "expected": "[0,1]"}]'::jsonb,
 current_date + interval '1 day'),

('Linked List Cycle', 'Detect if a linked list has a cycle',
 'Medium', 'Data Structures', 120, 25,
 E'def has_cycle(head):\n    """Return True if cycle exists."""\n    # Your solution here\n    pass',
 '[{"input": "[3,2,0,-4], pos=1", "expected": "true"}]'::jsonb,
 current_date + interval '2 days');
