-- 2026-04-25 P0 보안 패치: SECURITY DEFINER RPC 함수의 anon/authenticated 권한 회수
--
-- 발견 근거:
--   migrations/20260418_student_approval.sql 마지막 줄
--     GRANT EXECUTE ON FUNCTION approve_student(UUID, TEXT) TO anon, authenticated, service_role;
--     GRANT EXECUTE ON FUNCTION reject_student(UUID) TO anon, authenticated, service_role;
--   migrations/20260418_student_concepts.sql 마지막 줄
--     GRANT EXECUTE ON FUNCTION increment_concept(UUID, TEXT) TO anon, authenticated, service_role;
--
-- 영향: 익명/인증된 일반 사용자가 임의 학생을 approve/reject 가능했음.
--       임의 user_id에 임의 concept을 ask_count 증가시킬 수 있었음.
--       SECURITY DEFINER 함수라 RLS 우회 + DB 슈퍼유저 권한으로 실행됨.
--
-- 동작: 함수가 존재하지 않으면 silent skip (idempotent).
--       student_approval/student_concepts 마이그레이션이 이후에 적용되어도
--       이 회수 SQL을 다시 실행하면 anon/authenticated 권한이 자동 차단됨.
--
-- 적용 방법: Supabase SQL Editor에서 전체 복사-붙여넣기 후 Run, 또는 pg client.

DO $$
DECLARE
  fn_count INT := 0;
BEGIN
  -- approve_student (UUID, TEXT)
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'approve_student' AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid, p_approver_note text'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.approve_student(UUID, TEXT) FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.approve_student(UUID, TEXT) TO service_role';
    fn_count := fn_count + 1;
    RAISE NOTICE '✓ approve_student GRANT 회수';
  ELSE
    RAISE NOTICE '⊘ approve_student 함수 부재 — skip';
  END IF;

  -- reject_student (UUID)
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'reject_student' AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.reject_student(UUID) FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.reject_student(UUID) TO service_role';
    fn_count := fn_count + 1;
    RAISE NOTICE '✓ reject_student GRANT 회수';
  ELSE
    RAISE NOTICE '⊘ reject_student 함수 부재 — skip';
  END IF;

  -- increment_concept (UUID, TEXT)
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'increment_concept' AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid, p_concept text'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_concept(UUID, TEXT) FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.increment_concept(UUID, TEXT) TO service_role';
    fn_count := fn_count + 1;
    RAISE NOTICE '✓ increment_concept GRANT 회수';
  ELSE
    RAISE NOTICE '⊘ increment_concept 함수 부재 — skip';
  END IF;

  RAISE NOTICE '총 % 함수 처리됨', fn_count;
END $$;

NOTIFY pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════
-- 검증: 함수가 존재하는 경우 anon/authenticated가 EXECUTE 못 하는지 확인
-- ════════════════════════════════════════════════════════════════
SELECT
    p.proname AS function_name,
    r.rolname AS grantee,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE p.proname IN ('approve_student', 'reject_student', 'increment_concept')
  AND n.nspname = 'public'
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY p.proname, r.rolname;
