create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    profile_name text;
    profile_role text;
    profile_birth_date date;
    profile_approval_status text;
begin
    profile_name := coalesce(
        nullif(trim(new.raw_user_meta_data->>'name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'student'
    );

    profile_role := case
        when new.raw_app_meta_data->>'role' in ('student', 'teacher', 'parent', 'admin') then new.raw_app_meta_data->>'role'
        when new.raw_user_meta_data->>'role' in ('student', 'parent') then new.raw_user_meta_data->>'role'
        else 'student'
    end;

    profile_approval_status := case
        when new.raw_app_meta_data ? 'role' then 'approved'
        else 'pending'
    end;

    profile_birth_date := case
        when coalesce(new.raw_user_meta_data->>'birth_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
            then (new.raw_user_meta_data->>'birth_date')::date
        else null
    end;

    insert into public.profiles (
        id,
        name,
        display_name,
        email,
        role,
        birth_date,
        approval_status,
        updated_at
    ) values (
        new.id,
        profile_name,
        profile_name,
        new.email,
        profile_role,
        profile_birth_date,
        profile_approval_status,
        now()
    )
    on conflict (id) do update set
        name = excluded.name,
        display_name = excluded.display_name,
        email = excluded.email,
        role = excluded.role,
        birth_date = coalesce(excluded.birth_date, public.profiles.birth_date),
        updated_at = now();

    return new;
end;
$$;
