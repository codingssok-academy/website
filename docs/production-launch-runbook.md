# Codingssok Production Launch Runbook

## 1. Required Access

- Supabase project access
- Vercel project access
- Kakao Biz Message endpoint and token
- One teacher test account
- One real parent-linked student test account

## 2. Required Environment Variables

Use [`/.env.production.example`](/C:/Users/MIN/codingssok-website/.env.production.example) as the source of truth.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PARENT_SESSION_SECRET`
- `KAKAO_BIZ_MESSAGE_ENDPOINT`
- `KAKAO_BIZ_MESSAGE_TOKEN`
- `NEXT_PUBLIC_TEACHER_CONTACT_EMAIL`
- `NEXT_PUBLIC_TEACHER_DISPLAY_NAME`

## 3. Database Migration Order

Apply these SQL files in this exact order in Supabase SQL Editor:

1. [`migration_v13_parent_engagement.sql`](/C:/Users/MIN/codingssok-website/supabase/migration_v13_parent_engagement.sql)
2. [`migration_v14_teacher_auth_security.sql`](/C:/Users/MIN/codingssok-website/supabase/migration_v14_teacher_auth_security.sql)
3. [`migration_v15_parent_portal_security.sql`](/C:/Users/MIN/codingssok-website/supabase/migration_v15_parent_portal_security.sql)

Minimum verification after each run:

- `v13`: `parent_student_links`, `feedback_delivery_logs`, `parent_feedback` exist
- `v14`: `is_teacher_or_admin` function exists
- `v15`: `parent_access_attempts` exists and old public parent-facing policies are removed

## 4. Vercel Environment Injection

If using CLI:

```powershell
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add PARENT_SESSION_SECRET production
vercel env add KAKAO_BIZ_MESSAGE_ENDPOINT production
vercel env add KAKAO_BIZ_MESSAGE_TOKEN production
vercel env add NEXT_PUBLIC_TEACHER_CONTACT_EMAIL production
vercel env add NEXT_PUBLIC_TEACHER_DISPLAY_NAME production
```

If using dashboard:

1. Open Vercel project settings
2. Go to Environment Variables
3. Add every key from `.env.production.example`
4. Redeploy after saving

## 5. Supabase Setup Verification

Confirm all of these:

- Teacher account exists in `auth.users`
- Teacher `profiles.role` is `teacher` or `admin`
- Student `students.auth_user_id` is mapped correctly
- At least one `parent_student_links` row exists for a real student
- Parent delivery target has either phone or Kakao recipient key

## 6. E2E Test Flow

Run this exact flow after deploy:

1. Teacher login works at `/teacher/login`
2. Teacher admin opens without redirect loop
3. Student detail modal shows parent PIN and recent parent access attempts
4. Parent PIN login works at `/parent/feedback`
5. Parent dashboard loads without direct Supabase permission errors
6. Student learning activity updates on parent dashboard within 15 seconds
7. Teacher writes structured feedback
8. Delivery log appears in `운영 점검`
9. Kakao test send succeeds
10. If a delivery fails, `카카오 재전송` succeeds from the log row
11. Repeated bad parent PIN attempts produce `rate_limited`

## 7. Launch Blocking Conditions

Do not open to real parents if any of these are true:

- `운영 오픈 체크리스트` shows blocking items
- `SUPABASE_SERVICE_ROLE_KEY` missing
- `PARENT_SESSION_SECRET` missing
- `KAKAO_BIZ_MESSAGE_ENDPOINT` or `KAKAO_BIZ_MESSAGE_TOKEN` missing
- `v15` not applied
- Parent links exist but delivery targets are missing
- Parent dashboard cannot load from server API

## 8. Known Non-Blocking Warnings

Current lint warnings are only the existing page-level custom font warnings in:

- [`page.tsx`](/C:/Users/MIN/codingssok-website/src/app/teacher/admin/page.tsx#L1141)
- [`page.tsx`](/C:/Users/MIN/codingssok-website/src/app/teacher/admin/page.tsx#L1151)

These do not block launch.

## 9. Immediate Next Command Set

After credentials are available, the next real sequence is:

```powershell
vercel login
vercel link
```

Then:

1. Apply `v13`, `v14`, `v15` in Supabase SQL Editor
2. Add all production env vars
3. Redeploy
4. Run the E2E flow above
