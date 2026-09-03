-- Growth 2.0 fresh start: server-only access-code administration helpers.
-- Apply after 001_identity_access.sql in a new test project only.

create or replace function public.codingssok_list_student_access_code_status()
returns table (
    student_id uuid,
    student_login_issued boolean,
    parent_access_issued boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if auth.role() <> 'service_role' then
        raise exception 'service role required';
    end if;

    return query
    select
        s.id,
        bool_or(c.purpose = 'student_login'),
        bool_or(c.purpose = 'parent_access')
    from public.students s
    left join private.student_access_credentials c
      on c.student_id = s.id
    group by s.id;
end;
$$;

create or replace function public.codingssok_revoke_student_access_code(
    p_student_id uuid,
    p_purpose text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if auth.role() <> 'service_role' then
        raise exception 'service role required';
    end if;

    if p_purpose not in ('student_login', 'parent_access') then
        raise exception 'unsupported access-code purpose';
    end if;

    delete from private.student_access_credentials
    where student_id = p_student_id
      and purpose = p_purpose;
end;
$$;

revoke all on function public.codingssok_list_student_access_code_status()
    from public, anon, authenticated;
revoke all on function public.codingssok_revoke_student_access_code(uuid, text)
    from public, anon, authenticated;

grant execute on function public.codingssok_list_student_access_code_status()
    to service_role;
grant execute on function public.codingssok_revoke_student_access_code(uuid, text)
    to service_role;
