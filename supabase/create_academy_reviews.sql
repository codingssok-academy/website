-- 학원 실제 리뷰 저장 테이블
-- 교사가 네이버/구글/카카오맵에서 복사한 리뷰를 수동 입력
-- 학생 익명화 후 홈페이지 Reviews 섹션에 표시

create table if not exists public.academy_reviews (
    id uuid primary key default gen_random_uuid(),
    platform text not null check (platform in ('naver', 'google', 'kakao')),
    rating int not null check (rating between 1 and 5),
    author text not null,
    review_date date not null,
    content text not null,
    reply text,
    verified boolean not null default true,
    display_order int default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists academy_reviews_platform_idx on public.academy_reviews(platform);
create index if not exists academy_reviews_display_idx on public.academy_reviews(display_order desc, review_date desc);

-- updated_at 자동 갱신
create or replace function public.touch_academy_reviews_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists academy_reviews_touch on public.academy_reviews;
create trigger academy_reviews_touch
    before update on public.academy_reviews
    for each row execute function public.touch_academy_reviews_updated_at();

-- RLS: 누구나 SELECT, 교사/관리자만 write
alter table public.academy_reviews enable row level security;

drop policy if exists "academy_reviews_public_select" on public.academy_reviews;
create policy "academy_reviews_public_select"
    on public.academy_reviews for select using (true);

drop policy if exists "academy_reviews_teacher_write" on public.academy_reviews;
create policy "academy_reviews_teacher_write"
    on public.academy_reviews for all
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
