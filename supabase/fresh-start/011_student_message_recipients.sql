-- Growth 2.0 fresh start: safe recipient discovery for the student message screen.
-- Apply after 010_direct_messages.sql.
-- This file exposes only approved assigned teachers and approved admins.

begin;

create or replace function public.codingssok_student_message_recipients()
returns table (
    receiver_id uuid,
    receiver_name text,
    receiver_role text
)
language sql
stable
security definer
set search_path = ''
as $$
    with current_student as (
        select s.id
        from public.students s
        join public.profiles signed_in on signed_in.id = s.auth_user_id
        where s.auth_user_id = auth.uid()
          and s.status = 'active'
          and signed_in.role = 'student'
          and signed_in.approval_status = 'approved'
        limit 1
    ),
    allowed_recipients as (
        select
            p.id as receiver_id,
            coalesce(
                nullif(btrim(p.display_name), ''),
                nullif(btrim(p.name), ''),
                case when p.role = 'admin' then '관리자' else '선생님' end
            ) as receiver_name,
            p.role as receiver_role,
            case when p.role = 'teacher' then 0 else 1 end as display_order
        from public.profiles p
        cross join current_student student
        where p.approval_status = 'approved'
          and (
              p.role = 'admin'
              or (
                  p.role = 'teacher'
                  and exists (
                      select 1
                      from public.teacher_student_assignments assignment
                      where assignment.teacher_id = p.id
                        and assignment.student_id = student.id
                        and assignment.status = 'active'
                  )
              )
          )
    )
    select recipient.receiver_id, recipient.receiver_name, recipient.receiver_role
    from allowed_recipients recipient
    order by recipient.display_order, recipient.receiver_name, recipient.receiver_id
$$;

revoke all on function public.codingssok_student_message_recipients()
    from public, anon;
grant execute on function public.codingssok_student_message_recipients()
    to authenticated;

comment on function public.codingssok_student_message_recipients() is
    'Returns only approved assigned teachers and approved admins available to the signed-in active student.';

commit;
