create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;

alter table public.profiles
  drop constraint if exists profiles_approval_status_check;

alter table public.profiles
  add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected', 'deactivated'));

create or replace function private.codingssok_admin_student_accounts_impl(
    _action text,
    _payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_requester uuid := auth.uid();
    v_requester_role text;
    v_student_id uuid;
    v_account_id uuid;
    v_status text;
    v_school text;
    v_grade text;
    v_auth_user_id uuid;
    v_profile_role text;
    v_students jsonb := '[]'::jsonb;
    v_total integer := 0;
    v_linked integer := 0;
    v_unlinked integer := 0;
    v_approved integer := 0;
    v_deactivated integer := 0;
    v_pending integer := 0;
    v_orphan integer := 0;
begin
    if v_requester is null then
        return jsonb_build_object('success', false, 'error', 'Admin login is required.');
    end if;

    if v_requester not in (
        '13a67bfd-61d0-4283-876f-7fa448d2b73e'::uuid,
        'ab1e2077-281b-438f-9b1c-7b93885069de'::uuid,
        'a48be88b-93f2-45bc-9685-cea99e926892'::uuid,
        '15b6cdb8-ab2f-43e9-a10f-f441ffb24b81'::uuid,
        'e0a7d4cc-cb6a-4734-a6dc-832dc3fcc3e7'::uuid
    ) then
        return jsonb_build_object('success', false, 'error', 'This admin account is not allowlisted.');
    end if;

    select role
      into v_requester_role
      from public.profiles
     where id = v_requester
       and approval_status = 'approved'
     limit 1;

    if coalesce(v_requester_role, '') <> 'admin' then
        return jsonb_build_object('success', false, 'error', 'Admin permission is required.');
    end if;

    if _action = 'studentAccountInfo' then
        v_student_id := nullif(_payload->>'studentId', '')::uuid;
        v_school := left(trim(coalesce(_payload->>'school', '')), 40);
        v_grade := left(trim(coalesce(_payload->>'grade', '')), 20);

        if v_student_id is null then
            return jsonb_build_object('success', false, 'error', 'Student id is required.');
        end if;

        update public.students
           set school = nullif(v_school, ''),
               grade = nullif(v_grade, ''),
               updated_at = now()
         where id = v_student_id;

        if not found then
            return jsonb_build_object('success', false, 'error', 'Student was not found.');
        end if;
    elsif _action = 'studentAccountStatus' then
        v_student_id := nullif(_payload->>'studentId', '')::uuid;
        v_status := nullif(_payload->>'status', '');

        if v_student_id is null or v_status not in ('pending', 'approved', 'deactivated', 'rejected') then
            return jsonb_build_object('success', false, 'error', 'Student id and valid status are required.');
        end if;

        update public.students
           set status = v_status,
               updated_at = now()
         where id = v_student_id;

        if not found then
            return jsonb_build_object('success', false, 'error', 'Student was not found.');
        end if;
    elsif _action = 'studentAccountDelete' then
        v_student_id := nullif(_payload->>'studentId', '')::uuid;
        v_account_id := nullif(_payload->>'accountId', '')::uuid;

        if v_student_id is null and v_account_id is null then
            return jsonb_build_object('success', false, 'error', 'Student id or account id is required.');
        end if;

        if v_account_id is not null and v_student_id is null then
            if v_account_id = v_requester then
                return jsonb_build_object('success', false, 'error', 'The current admin account cannot be deactivated here.');
            end if;

            select role
              into v_profile_role
              from public.profiles
             where id = v_account_id
             limit 1;

            if coalesce(v_profile_role, '') in ('teacher', 'admin') then
                return jsonb_build_object('success', false, 'error', 'Teacher and admin accounts are protected.');
            end if;

            update public.profiles
               set approval_status = 'deactivated',
                   updated_at = now()
             where id = v_account_id
               and coalesce(role, 'student') not in ('teacher', 'admin');
        else
            select auth_user_id
              into v_auth_user_id
              from public.students
             where id = v_student_id
             limit 1;

            if not found then
                return jsonb_build_object('success', false, 'error', 'Student was not found.');
            end if;

            if v_auth_user_id is not null then
                if v_auth_user_id = v_requester then
                    return jsonb_build_object('success', false, 'error', 'The current admin account cannot be deactivated here.');
                end if;

                select role
                  into v_profile_role
                  from public.profiles
                 where id = v_auth_user_id
                 limit 1;

                if coalesce(v_profile_role, '') in ('teacher', 'admin') then
                    return jsonb_build_object('success', false, 'error', 'Teacher and admin accounts are protected.');
                end if;

                update public.profiles
                   set approval_status = 'deactivated',
                       updated_at = now()
                 where id = v_auth_user_id
                   and coalesce(role, 'student') not in ('teacher', 'admin');
            end if;

            update public.students
               set auth_user_id = null,
                   pin = null,
                   status = 'deactivated',
                   updated_at = now()
             where id = v_student_id;

            if v_auth_user_id is not null then
                delete from public.study_progress
                 where user_id = v_auth_user_id
                   and course_id = '__parent_pin__';
            end if;
        end if;
    elsif _action <> 'studentAccountsList' then
        return jsonb_build_object('success', false, 'error', 'Unsupported action.');
    end if;

    with linked_profile_ids as (
        select auth_user_id as id
          from public.students
         where auth_user_id is not null
    ),
    student_accounts as (
        select jsonb_build_object(
            'id', s.id,
            'source', 'student',
            'name', s.name,
            'school', s.school,
            'grade', s.grade,
            'className', s."class",
            'status', coalesce(s.status, 'approved'),
            'canChangeStatus', true,
            'pinIssued', coalesce(s.pin, '') ~ '^\d{5}$',
            'createdAt', s.created_at,
            'updatedAt', s.updated_at,
            'authUserId', s.auth_user_id,
            'accountLinked', s.auth_user_id is not null,
            'email', p.email,
            'role', p.role,
            'displayName', coalesce(p.display_name, p.name),
            'authCreatedAt', null,
            'lastSignInAt', null,
            'canDeleteAccount', s.auth_user_id is not null and coalesce(p.role, '') not in ('teacher', 'admin')
        ) as item
          from public.students s
          left join public.profiles p on p.id = s.auth_user_id
         where coalesce(s."class", '') <> 'admin'
    ),
    orphan_accounts as (
        select jsonb_build_object(
            'id', p.id,
            'source', 'orphan',
            'name', coalesce(p.display_name, p.name, p.email, 'Unlinked account'),
            'school', null,
            'grade', null,
            'className', 'Unlinked account',
            'status', coalesce(p.approval_status, 'orphan'),
            'canChangeStatus', false,
            'pinIssued', false,
            'createdAt', p.created_at,
            'updatedAt', p.updated_at,
            'authUserId', p.id,
            'accountLinked', true,
            'email', p.email,
            'role', p.role,
            'displayName', coalesce(p.display_name, p.name),
            'authCreatedAt', null,
            'lastSignInAt', null,
            'canDeleteAccount', coalesce(p.role, '') not in ('teacher', 'admin')
        ) as item
          from public.profiles p
         where p.role = 'student'
           and not exists (select 1 from linked_profile_ids linked where linked.id = p.id)
    ),
    all_accounts as (
        select item from student_accounts
        union all
        select item from orphan_accounts
    )
    select coalesce(jsonb_agg(item order by item->>'name'), '[]'::jsonb)
      into v_students
      from all_accounts;

    select
        count(*)::integer,
        count(*) filter (where item->>'accountLinked' = 'true')::integer,
        count(*) filter (where item->>'accountLinked' <> 'true' and item->>'source' = 'student')::integer,
        count(*) filter (where item->>'status' = 'approved')::integer,
        count(*) filter (where item->>'status' = 'deactivated')::integer,
        count(*) filter (where item->>'status' = 'pending')::integer,
        count(*) filter (where item->>'source' = 'orphan')::integer
      into v_total, v_linked, v_unlinked, v_approved, v_deactivated, v_pending, v_orphan
      from jsonb_array_elements(v_students) as items(item);

    return jsonb_build_object(
        'success', true,
        'students', v_students,
        'stats', jsonb_build_object(
            'total', v_total,
            'linked', v_linked,
            'unlinked', v_unlinked,
            'approved', v_approved,
            'deactivated', v_deactivated,
            'pending', v_pending,
            'orphan', v_orphan
        )
    );
exception
    when invalid_text_representation then
        return jsonb_build_object('success', false, 'error', 'Invalid id format.');
    when others then
        return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

create or replace function public.codingssok_admin_student_accounts(
    _action text,
    _payload jsonb default '{}'::jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
    select private.codingssok_admin_student_accounts_impl(_action, _payload);
$$;

revoke all on function private.codingssok_admin_student_accounts_impl(text, jsonb) from public;
revoke all on function private.codingssok_admin_student_accounts_impl(text, jsonb) from anon;
grant usage on schema private to authenticated;
grant execute on function private.codingssok_admin_student_accounts_impl(text, jsonb) to authenticated;

revoke all on function public.codingssok_admin_student_accounts(text, jsonb) from public;
revoke all on function public.codingssok_admin_student_accounts(text, jsonb) from anon;
grant execute on function public.codingssok_admin_student_accounts(text, jsonb) to authenticated;
