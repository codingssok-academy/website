-- 학생이 작성한 모든 소스코드 영구 저장
-- 피드백 L27-28 "소스코드들 전부 저장 반드시 되게 할것"
--
-- 저장 전략:
--  - 코드는 (user_id, context_key) 조합으로 upsert (덮어쓰기)
--  - context_key는 학습 위치 식별자 (예: "problem:c-L1-001", "unit:cb-u05-p1", "playground:main")
--  - language는 "python" / "c" / "cpp" / "java" 등
--  - 변경 이력은 별도 테이블에 저장 안 함 (용량 폭증 방지, 필요 시 code_history 테이블 추가)

create table if not exists public.student_code_saves (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    context_key text not null,        -- 예: "problem:c-L1-042", "unit:py-L2-u03"
    language text not null,            -- "python" | "c" | "cpp" | "java"
    code text not null,                 -- 소스 코드 본문
    code_length int generated always as (char_length(code)) stored,
    run_count int not null default 0,  -- 실행 버튼 누른 횟수
    last_run_result text,              -- 마지막 실행 결과 요약 ("passed", "failed", "error")
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, context_key)
);

create index if not exists student_code_saves_user_idx
    on public.student_code_saves(user_id, updated_at desc);
create index if not exists student_code_saves_context_idx
    on public.student_code_saves(context_key);

-- updated_at 자동 갱신
create or replace function public.touch_student_code_saves_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists student_code_saves_touch on public.student_code_saves;
create trigger student_code_saves_touch
    before update on public.student_code_saves
    for each row execute function public.touch_student_code_saves_updated_at();

-- RLS
alter table public.student_code_saves enable row level security;

drop policy if exists "code_saves_self_all" on public.student_code_saves;
create policy "code_saves_self_all"
    on public.student_code_saves for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "code_saves_teacher_select" on public.student_code_saves;
create policy "code_saves_teacher_select"
    on public.student_code_saves for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('teacher', 'admin')
        )
    );
