[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$backendRoot = "C:\dev\codingssok-growth-v2-backend-teacher-concepts"
$stateRoot = Join-Path $env:TEMP "codingssok-growth-v2-teacher-concepts-local"
$pidPath = Join-Path $stateRoot "frontend.pid"
$stdoutPath = Join-Path $stateRoot "frontend.stdout.log"
$stderrPath = Join-Path $stateRoot "frontend.stderr.log"

function Stop-VerifiedProcessTree {
    param([int]$ProcessId)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if ($null -eq $process) { return }
    $commandLine = [string]$process.CommandLine
    if ($commandLine -notmatch 'next dev' -or $commandLine -notmatch '3014') {
        throw "기록된 프로세스가 3014 직접 입력 개념 화면 서버인지 확인할 수 없어 종료하지 않았습니다."
    }
    & cmd.exe /d /c "taskkill.exe /PID $ProcessId /T /F 1>nul 2>nul"
    Start-Sleep -Milliseconds 200
    if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
        throw "3014 화면 서버를 안전하게 종료하지 못했습니다."
    }
}

if (Test-Path $pidPath -PathType Leaf) {
    $savedPid = 0
    if (-not [int]::TryParse((Get-Content -Raw $pidPath).Trim(), [ref]$savedPid)) {
        throw "선생님 화면 서버 번호 파일을 읽지 못했습니다."
    }
    Stop-VerifiedProcessTree $savedPid
}

if (Test-Path $backendRoot -PathType Container) {
    Push-Location $backendRoot
    try {
        Write-Host "연습 DB 자료를 초기화합니다."
        & cmd.exe /d /c "npx.cmd supabase db reset 1>nul 2>nul"
        if ($LASTEXITCODE -ne 0) { throw "연습 DB 초기화에 실패했습니다." }

        $sql = "select (select count(*) from auth.users),(select count(*) from public.growth_students),(select count(*) from public.growth_weekly_evaluations),(select count(*) from public.growth_weekly_evaluation_concepts),(select count(*) from public.growth_weekly_evaluation_custom_concepts),(select count(*) from public.growth_projects),(select count(*) from public.growth_xp_transactions),(select count(*) from public.growth_activity_events),(select count(*) from public.growth_student_missions),(select count(*) from public.growth_missions),(select count(*) from public.growth_badges);"
        $counts = (& docker exec supabase_db_codingssok-growth-v2-local psql -U postgres -d postgres -At -F ',' -c $sql | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $counts -ne "0,0,0,0,0,0,0,0,0,3,3") {
            throw "가상 자료 정리 결과가 예상과 다릅니다. 로컬 DB를 종료하지 않았습니다."
        }

        Write-Host "로컬 선생님 연습 DB 서비스를 종료합니다."
        & cmd.exe /d /c "npx.cmd supabase stop --no-backup 1>nul 2>nul"
        if ($LASTEXITCODE -ne 0) { throw "로컬 DB 서비스 종료에 실패했습니다." }
    }
    finally { Pop-Location }
}

foreach ($logPath in @($stdoutPath, $stderrPath)) {
    if (Test-Path $logPath -PathType Leaf) {
        $secretFound = Select-String -Path $logPath -Pattern 'eyJ[a-zA-Z0-9_-]{20,}|sb_secret_|postgresql://|Aa1!' -Quiet
        if ($secretFound) { throw "임시 로그에 비밀값으로 보이는 내용이 있어 자동 삭제 전에 확인이 필요합니다." }
    }
}

if (Test-Path $stateRoot) {
    $resolvedState = (Resolve-Path $stateRoot).Path
    $expectedState = [System.IO.Path]::GetFullPath($stateRoot)
    if ($resolvedState -ne $expectedState -or $resolvedState -notlike "$env:TEMP\*") {
        throw "임시 상태 폴더 경로가 예상과 달라 삭제하지 않았습니다."
    }
    Remove-Item -LiteralPath $resolvedState -Recurse -Force
}

$env:GROWTH_PREVIEW_LOCAL_ONLY = $null
$env:GROWTH_PREVIEW_SUPABASE_URL = $null
$env:GROWTH_PREVIEW_SUPABASE_ANON_KEY = $null
$env:GROWTH_PREVIEW_TEACHER_EMAIL = $null
$env:GROWTH_PREVIEW_TEACHER_PASSWORD = $null
$env:GROWTH_PREVIEW_STUDENT_PASSWORD = $null
$env:GROWTH_PREVIEW_PARENT_PASSWORD = $null

Write-Host "STOPPED local_teacher_concepts_preview=1 local_db_reset=1 auth_users=0 students=0 evaluations=0 custom_concepts=0 mission_catalog=3 badge_catalog=3"
