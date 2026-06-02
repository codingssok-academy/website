-- 유닛별 수업 자료 (PPT, PDF, 메시지)
-- materialMode: 'ppt' 코스(컴퓨터기초/코딩기초/피지컬컴퓨팅)에서 사용
-- 선생님이 각 유닛에 대해 PPT를 업로드하고 학생에게 메시지를 남길 수 있다

create table if not exists public.unit_materials (
    id uuid primary key default gen_random_uuid(),
    course_id text not null,
    unit_id text not null,
    -- 자료 정보
    ppt_url text,            -- Supabase Storage 또는 외부 URL
    ppt_filename text,
    pdf_url text,            -- 추후 확장
    -- 선생님 메시지 (수업 안내)
    teacher_message text,
    -- 메타
    uploaded_by uuid references auth.users(id) on delete set null,
    uploaded_by_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (course_id, unit_id)
);

create index if not exists unit_materials_course_idx
    on public.unit_materials(course_id);

-- updated_at 자동 갱신 트리거
create or replace function public.touch_unit_materials_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists unit_materials_touch on public.unit_materials;
create trigger unit_materials_touch
    before update on public.unit_materials
    for each row execute function public.touch_unit_materials_updated_at();

-- RLS: 모두 SELECT 가능, INSERT/UPDATE/DELETE는 교사+관리자만
alter table public.unit_materials enable row level security;

drop policy if exists "unit_materials_public_select" on public.unit_materials;
create policy "unit_materials_public_select"
    on public.unit_materials for select
    using (true);

drop policy if exists "unit_materials_teacher_write" on public.unit_materials;
create policy "unit_materials_teacher_write"
    on public.unit_materials for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('teacher', 'admin')
        )
    )
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('teacher', 'admin')
        )
    );
