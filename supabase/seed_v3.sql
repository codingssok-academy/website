-- ============================================================
-- Codingssok Academy v3 — 시드 데이터
-- migration_v3.sql 실행 후에 이 파일을 실행하세요
-- ============================================================

-- ── 코스 데이터 삽입 (중복 시 건너뛰기) ──
INSERT INTO public.courses (title, description, category, difficulty, total_lessons, xp_reward, sort_order)
VALUES
  ('컴퓨팅 사고력', '문제 해결 능력을 키우는 컴퓨팅 사고의 기초', '기초', 'beginner', 12, 500, 1),
  ('C언어 기초', '변수, 배열, 포인터까지 C언어의 핵심 문법', '프로그래밍', 'beginner', 20, 800, 2),
  ('코딩 기초', '프로그래밍의 기본 개념과 논리적 사고', '기초', 'beginner', 15, 600, 3),
  ('알고리즘 입문', '정렬, 탐색, 재귀 등 기본 알고리즘', '알고리즘', 'intermediate', 18, 1000, 4),
  ('HTML/CSS', '웹 페이지 구조와 스타일링의 기초', '웹', 'beginner', 14, 500, 5),
  ('JavaScript 기초', '동적 웹 페이지를 만드는 JS 핵심 문법', '웹', 'intermediate', 16, 700, 6),
  ('Python 기초', '데이터 분석과 자동화를 위한 Python 기초', '프로그래밍', 'beginner', 15, 600, 7),
  ('데이터 구조', '스택, 큐, 트리, 그래프 자료구조 학습', '알고리즘', 'advanced', 22, 1200, 8)
ON CONFLICT DO NOTHING;

-- ── 공지사항 샘플 (관리자 패널에서 표시용) ──
INSERT INTO public.announcements (title, content, is_pinned)
VALUES
  ('🎉 코딩쏙 아카데미 v2 오픈!', '새로운 티어 시스템, 미션 & 업적, XP 상점 등 다양한 기능이 추가되었습니다. 열심히 공부하고 XP를 모아보세요!', true),
  ('📚 C언어 기초 코스 업데이트', '포인터와 구조체 레슨이 새롭게 추가되었습니다. 20개 레슨으로 더 체계적으로 C언어를 배울 수 있어요.', false),
  ('🏆 주간 리더보드 오픈', '매주 월요일에 리더보드가 초기화됩니다. 이번 주 1등에게는 특별한 뱃지가 수여됩니다!', false)
ON CONFLICT DO NOTHING;
