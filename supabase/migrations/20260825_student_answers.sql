-- Python Core and web textbook answer persistence.
-- This migration is idempotent and does not modify existing migrations.

create table if not exists public.student_answers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    page_path text not null check (char_length(page_path) between 1 and 500),
    field_index integer not null check (field_index >= 0),
    answer_text text not null default '' check (char_length(answer_text) <= 10000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, page_path, field_index)
);

create index if not exists idx_student_answers_user_page
    on public.student_answers (user_id, page_path);

alter table public.student_answers enable row level security;

drop policy if exists "Students read own answers" on public.student_answers;
create policy "Students read own answers"
    on public.student_answers for select
    using (auth.uid() = user_id);

drop policy if exists "Students insert own answers" on public.student_answers;
create policy "Students insert own answers"
    on public.student_answers for insert
    with check (auth.uid() = user_id);

drop policy if exists "Students update own answers" on public.student_answers;
create policy "Students update own answers"
    on public.student_answers for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Students delete own answers" on public.student_answers;
create policy "Students delete own answers"
    on public.student_answers for delete
    using (auth.uid() = user_id);
