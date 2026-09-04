-- Remove only the fixed fake records from prepare_admin_message_ui_check.sql.
-- Run only in project opcdcuedhwyuyhzaubpu (codingssok-growth-v2-fresh-test).

begin;

delete from public.direct_messages
where student_id = 'a0000000-0000-4000-8000-000000000001'::uuid
   or sender_id in (
       'b1111111-1111-4111-8111-111111111111'::uuid,
       'c2222222-2222-4222-8222-222222222222'::uuid
   )
   or receiver_id in (
       'b1111111-1111-4111-8111-111111111111'::uuid,
       'c2222222-2222-4222-8222-222222222222'::uuid
   );

delete from private.student_access_credentials
where student_id = 'a0000000-0000-4000-8000-000000000001'::uuid;

delete from public.students
where id = 'a0000000-0000-4000-8000-000000000001'::uuid;

delete from auth.identities
where user_id in (
    'b1111111-1111-4111-8111-111111111111'::uuid,
    'c2222222-2222-4222-8222-222222222222'::uuid
);

delete from auth.users
where id in (
    'b1111111-1111-4111-8111-111111111111'::uuid,
    'c2222222-2222-4222-8222-222222222222'::uuid
);

commit;

select case
    when (
        select count(*)
        from public.students
        where id = 'a0000000-0000-4000-8000-000000000001'::uuid
    ) = 0
    and (
        select count(*)
        from public.direct_messages
        where student_id = 'a0000000-0000-4000-8000-000000000001'::uuid
    ) = 0
    and (
        select count(*)
        from auth.users
        where id in (
            'b1111111-1111-4111-8111-111111111111'::uuid,
            'c2222222-2222-4222-8222-222222222222'::uuid
        )
    ) = 0
    then 'CLEAN: Fake student, admin, and message UI-check records are zero.'
    else 'FAIL: Fake UI-check records remain; stop and inspect before continuing.'
end as cleanup_result;
