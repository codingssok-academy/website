-- Temporary accounts for the local student/admin message UI check.
-- Run only in project opcdcuedhwyuyhzaubpu (codingssok-growth-v2-fresh-test).
-- These fixed fake records must be removed with cleanup_admin_message_ui_check.sql.

begin;

do $$
begin
    if exists (
        select 1 from auth.users
        where id in (
            'b1111111-1111-4111-8111-111111111111'::uuid,
            'c2222222-2222-4222-8222-222222222222'::uuid
        )
    ) or exists (
        select 1 from public.students
        where id = 'a0000000-0000-4000-8000-000000000001'::uuid
    ) then
        raise exception 'previous fake UI-check records exist; run cleanup first';
    end if;
end;
$$;

insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
values
    (
        'b1111111-1111-4111-8111-111111111111'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        'student_a0000000-0000-4000-8000-000000000001@codingssok.local',
        extensions.crypt(
            'cs_student_a0000000000040008000000000000001_2468',
            extensions.gen_salt('bf')
        ),
        now(),
        '{"provider":"email","providers":["email"],"role":"student"}'::jsonb,
        '{"name":"가짜화면학생"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        'c2222222-2222-4222-8222-222222222222'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        'ui-admin-roundtrip@invalid.local',
        extensions.crypt('UiAdminTest!2468', extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
        '{"name":"가짜화면관리자"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
values
    (
        'student_a0000000-0000-4000-8000-000000000001@codingssok.local',
        'b1111111-1111-4111-8111-111111111111'::uuid,
        jsonb_build_object(
            'sub', 'b1111111-1111-4111-8111-111111111111',
            'email', 'student_a0000000-0000-4000-8000-000000000001@codingssok.local',
            'email_verified', true
        ),
        'email',
        now(),
        now(),
        now()
    ),
    (
        'ui-admin-roundtrip@invalid.local',
        'c2222222-2222-4222-8222-222222222222'::uuid,
        jsonb_build_object(
            'sub', 'c2222222-2222-4222-8222-222222222222',
            'email', 'ui-admin-roundtrip@invalid.local',
            'email_verified', true
        ),
        'email',
        now(),
        now(),
        now()
    );

insert into public.students (
    id,
    profile_id,
    auth_user_id,
    name,
    school,
    grade,
    class,
    status,
    created_by
)
values (
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'b1111111-1111-4111-8111-111111111111'::uuid,
    'b1111111-1111-4111-8111-111111111111'::uuid,
    '가짜화면학생',
    '가짜테스트초등학교',
    '1학년',
    '공통기초반',
    'active',
    'c2222222-2222-4222-8222-222222222222'::uuid
);

set local role service_role;
select set_config(
    'request.jwt.claim.sub',
    'c2222222-2222-4222-8222-222222222222',
    true
);
select set_config('request.jwt.claim.role', 'service_role', true);

select public.codingssok_issue_student_access_code(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'student_login',
    '2468'
);

reset role;
commit;

select case
    when (
        select count(*)
        from public.students
        where id = 'a0000000-0000-4000-8000-000000000001'::uuid
          and status = 'active'
    ) = 1
    and (
        select count(*)
        from public.profiles
        where id = 'b1111111-1111-4111-8111-111111111111'::uuid
          and role = 'student'
          and approval_status = 'approved'
    ) = 1
    and (
        select count(*)
        from public.profiles
        where id = 'c2222222-2222-4222-8222-222222222222'::uuid
          and role = 'admin'
          and approval_status = 'approved'
    ) = 1
    then 'READY: Fake student and admin UI-check accounts were created.'
    else 'FAIL: Fake UI-check accounts are incomplete; run cleanup before retrying.'
end as preparation_result;
