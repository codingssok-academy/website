# Vercel Preview 배포 분류 오류 기록

## 원장님 확인용 요약

- 시험 프로젝트: `codingssok-growth-v2-staging`
- 실행 시각: 2026-07-15 13:57 KST
- Vercel CLI: 56.1.0
- Node.js: 24.18.0
- 기대 결과: Preview 배포 1개, Production 배포 0개
- 실제 결과: Preview 배포 0개, Production 배포 1개
- 운영 도메인 연결: 없음
- 환경변수 변경: 없음
- Supabase 변경: 없음
- 추가 배포: 없음
- 잘못 생성된 Production 배포: 2026-07-16 원장님이 직접 삭제 완료
- 재현 횟수: 이번 승인 절차에서 1회 재현되었으며, 이전에 보고된 동일 분류 이상이 다시 발생함

## 실행 전 확인

- 작업 폴더는 `C:\dev\codingssok-growth-v2-staging-preview`였습니다.
- 브랜치는 `staging/growth-2-vercel-preview`였습니다.
- 기준 커밋은 `9de3033`이었습니다.
- `.vercel/project.json`은 시험 프로젝트에 연결되어 있었습니다.
- Preview 배포와 Production 배포가 모두 0개였습니다.
- `codingssok.com` 운영 도메인은 연결되어 있지 않았습니다.
- `.env`와 `.env.local` 파일은 없었습니다.
- 준비 중인 기존 파일 13개는 그대로 보존되어 있었습니다.

## 실행 명령

토큰 값은 명령이나 파일에 기록하지 않고 프로세스 메모리에서만 사용했습니다.

```powershell
npx.cmd -y vercel@56.1.0 deploy "C:\dev\codingssok-growth-v2-staging-preview" --target=preview --project codingssok-growth-v2-staging --yes --no-wait --format=json --global-config "C:\temp\vercel-codingssok-clean"
```

`--prod` 또는 `--target=production`은 사용하지 않았습니다.

## 실제 분류 확인

배포 직후 Vercel CLI의 환경별 목록을 각각 조회했습니다.

```powershell
npx.cmd -y vercel@56.1.0 list codingssok-growth-v2-staging --environment=preview --format=json --global-config "C:\temp\vercel-codingssok-clean"
npx.cmd -y vercel@56.1.0 list codingssok-growth-v2-staging --environment=production --format=json --global-config "C:\temp\vercel-codingssok-clean"
```

조회 결과는 Preview 0개, Production 1개였습니다. 따라서 요청한 `--target=preview`와 실제 Vercel 분류가 일치하지 않았습니다.

## 정리 결과

- 자동 재시도하지 않았습니다.
- 새로운 Preview 배포를 추가로 만들지 않았습니다.
- 잘못 분류된 Production 배포는 원장님이 Vercel 화면에서 삭제했습니다.
- 프로젝트, 환경변수, Supabase, 가상 계정, 운영 도메인은 변경하지 않았습니다.
- 프로젝트 자체는 삭제하거나 다시 만들지 않았습니다.

## Vercel 지원 문의용 영문 요약

### Title

`vercel deploy --target=preview creates a Production deployment`

### Summary

The staging project had zero Preview and zero Production deployments before the test. The local worktree was linked to the exact staging project and had no production custom domain. We ran the command below once:

```text
vercel deploy <staging-worktree> --target=preview --project codingssok-growth-v2-staging --yes --no-wait --format=json
```

Expected: one Preview deployment and zero Production deployments.

Actual: zero Preview deployments and one Production deployment. Environment-specific `vercel list` commands confirmed the classification. We did not use `--prod` or `--target=production`. No environment variables, domains, or Supabase resources were changed. The misclassified Production deployment was deleted manually, and no retry was attempted.

Environment: Windows x64, Node.js 24.18.0, Vercel CLI 56.1.0.

No token, project ID, team ID, environment-variable value, Supabase URL, or secret is included in this report.
