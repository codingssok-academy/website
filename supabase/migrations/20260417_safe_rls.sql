-- 안전한 RLS 정책 활성화
-- 실행 방법: Supabase SQL Editor에서 전체 복사-붙여넣기 후 Run
-- 적용 대상: 기능 파괴 위험이 낮은 테이블들

-- ════════════════════════════════════════════════════════════════
-- 1. homework_completions
-- 읽기: anon/authenticated (학부모 앱에서 조회)
-- 쓰기: service_role 전용 (서버 API만)
-- ════════════════════════════════════════════════════════════════
ALTER TABLE homework_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hw_completions_select" ON homework_completions;
CREATE POLICY "hw_completions_select" ON homework_completions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "hw_completions_write_service" ON homework_completions;
CREATE POLICY "hw_completions_write_service" ON homework_completions
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ════════════════════════════════════════════════════════════════
-- 2. error_logs
-- 쓰기: anon (클라이언트에서 에러 리포트)
-- 읽기: service_role 전용 (관리자만 조회)
-- ════════════════════════════════════════════════════════════════
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_logs_insert_anon" ON error_logs;
CREATE POLICY "error_logs_insert_anon" ON error_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "error_logs_read_service" ON error_logs;
CREATE POLICY "error_logs_read_service" ON error_logs
    FOR SELECT USING (auth.role() = 'service_role');

-- ════════════════════════════════════════════════════════════════
-- 3. student_homework
-- 읽기: anon/authenticated (학부모 앱, 학생 앱)
-- 쓰기: service_role 전용 (서버 API에서 교사 인증 후)
-- ════════════════════════════════════════════════════════════════
ALTER TABLE student_homework ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_homework_select" ON student_homework;
CREATE POLICY "student_homework_select" ON student_homework
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "student_homework_write_service" ON student_homework;
CREATE POLICY "student_homework_write_service" ON student_homework
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ════════════════════════════════════════════════════════════════
-- 4. announcements
-- 읽기: anon/authenticated (학부모 홈에 표시)
-- 쓰기: service_role 전용
-- ════════════════════════════════════════════════════════════════
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_write_service" ON announcements;
CREATE POLICY "announcements_write_service" ON announcements
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ════════════════════════════════════════════════════════════════
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('homework_completions', 'error_logs', 'student_homework', 'announcements')
ORDER BY tablename;
