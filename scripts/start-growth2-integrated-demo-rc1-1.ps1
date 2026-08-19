[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$frontendRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = "C:\dev\codingssok-growth-v2-backend-demo-rc1"
$dependencyRoot = "C:\dev\codingssok-growth-v2\node_modules"
$stateRoot = Join-Path $env:TEMP "codingssok-growth-v2-demo-rc1-1"
$pidPath = Join-Path $stateRoot "frontend.pid"
$stdoutPath = Join-Path $stateRoot "frontend.stdout.log"
$stderrPath = Join-Path $stateRoot "frontend.stderr.log"
$studentUrl = "http://127.0.0.1:3019/growth-preview/student-local"
$parentUrl = "http://127.0.0.1:3019/growth-preview/parent-local"
$teacherUrl = "http://127.0.0.1:3019/growth-preview/teacher-local"
$mockUrl = "http://127.0.0.1:3019/growth-preview"
$teacherPassword = $null
$studentPassword = $null
$parentPassword = $null
$anonKey = $null
$apiUrl = $null
$dbContainer = "supabase_db_codingssok-growth-v2-local"
$restContainer = "supabase_rest_codingssok-growth-v2-local"
$gatewayContainer = "supabase_kong_codingssok-growth-v2-local"

function Invoke-CapturedCommand {
    param([string]$WorkingDirectory, [string]$Command, [string]$FailureMessage)
    Push-Location $WorkingDirectory
    try {
        $output = (& cmd.exe /d /c "$Command 2>&1" | Out-String)
        if ($LASTEXITCODE -ne 0) { throw $FailureMessage }
        return $output
    }
    finally { Pop-Location }
}

function Assert-Rc1Worktree {
    param(
        [string]$WorkingDirectory,
        [string]$ExpectedBranch,
        [string]$RequiredCommit,
        [string]$Name
    )
    if (-not (Test-Path $WorkingDirectory -PathType Container)) {
        throw "$Name 폴더를 찾지 못했습니다: $WorkingDirectory"
    }
    $branch = (& git -C $WorkingDirectory branch --show-current | Out-String).Trim()
    if ($branch -ne $ExpectedBranch) { throw "$Name 브랜치가 RC1 기준과 다릅니다." }
    & git -C $WorkingDirectory merge-base --is-ancestor $RequiredCommit HEAD
    if ($LASTEXITCODE -ne 0) { throw "$Name 기준 커밋을 찾지 못했습니다." }
    $status = (& git -C $WorkingDirectory status --porcelain | Out-String).Trim()
    if (-not [string]::IsNullOrWhiteSpace($status)) {
        throw "$Name 작업 폴더에 저장되지 않은 변경이 있습니다. 먼저 상태를 확인해 주세요."
    }
}

function Get-SupabaseStatus {
    $raw = Invoke-CapturedCommand $backendRoot "npx.cmd supabase status -o json" "로컬 DB 상태를 읽지 못했습니다."
    $jsonStart = $raw.IndexOf('{'); $jsonEnd = $raw.LastIndexOf('}')
    if ($jsonStart -lt 0 -or $jsonEnd -le $jsonStart) { throw "로컬 DB 연결 정보를 확인하지 못했습니다." }
    return $raw.Substring($jsonStart, $jsonEnd - $jsonStart + 1) | ConvertFrom-Json
}

try {
    & docker version *> $null
    if ($LASTEXITCODE -ne 0) { throw "Docker Client와 Server를 확인해 주세요." }
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw "Docker Desktop을 먼저 실행해 주세요." }

    Assert-Rc1Worktree $backendRoot "release/growth-2-demo-rc1-backend" "faf55d0" "백엔드 RC1"
    Assert-Rc1Worktree $frontendRoot "release/growth-2-demo-rc1-1-ui" "7c5b34d" "UI RC1.1"
    if (-not (Test-Path (Join-Path $backendRoot "scripts\prepare-growth2-integrated-demo-rc1.ps1") -PathType Leaf)) {
        throw "RC1 가상 자료 준비 도구를 찾지 못했습니다."
    }
    foreach ($environmentFile in @(".env", ".env.local")) {
        if (Test-Path (Join-Path $frontendRoot $environmentFile) -PathType Leaf) {
            throw "실제 환경설정과 섞이지 않도록 $environmentFile 파일을 확인해 주세요."
        }
    }

    $portOwner = Get-NetTCPConnection -LocalPort 3019 -State Listen -ErrorAction SilentlyContinue
    if ($null -ne $portOwner) {
        throw "3019번 포트를 다른 프로그램이 사용 중입니다. 해당 프로그램을 먼저 종료해 주세요."
    }

    if (-not (Test-Path (Join-Path $frontendRoot "node_modules") -PathType Container)) {
        if (-not (Test-Path $dependencyRoot -PathType Container)) {
            throw "기존 화면의 설치된 패키지를 찾지 못했습니다. 새 패키지는 설치하지 않습니다."
        }
        New-Item -ItemType Junction -Path (Join-Path $frontendRoot "node_modules") -Target $dependencyRoot | Out-Null
    }

    Write-Host "[1/4] Growth 2.0 통합 데모 RC1.1 로컬 DB를 시작합니다."
    [void](Invoke-CapturedCommand $backendRoot "npx.cmd supabase start" "RC1 로컬 DB를 시작하지 못했습니다.")

    Write-Host "[2/4] DB를 초기화하고 승인된 가상 자료를 준비합니다."
    [void](Invoke-CapturedCommand $backendRoot "npx.cmd supabase db reset" "RC1 로컬 DB 초기화에 실패했습니다.")

    $runningContainers = @(& docker ps --format "{{.Names}}")
    foreach ($container in @($dbContainer, $restContainer, $gatewayContainer)) {
        if ($runningContainers -notcontains $container) {
            throw "RC1 로컬 서비스가 준비되지 않았습니다: $container"
        }
    }
    & docker exec $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 `
        -c "alter database postgres set timezone to 'Asia/Seoul';" *> $null
    if ($LASTEXITCODE -ne 0) { throw "RC1 로컬 DB의 한국 시간 설정에 실패했습니다." }
    & docker restart $restContainer $gatewayContainer *> $null
    if ($LASTEXITCODE -ne 0) { throw "RC1 로컬 화면 연결 서비스를 다시 준비하지 못했습니다." }
    Start-Sleep -Seconds 5

    $status = Get-SupabaseStatus
    $apiUrl = [string]$status.API_URL
    $anonKey = [string]$status.ANON_KEY
    if ($apiUrl -notmatch '^http://(127\.0\.0\.1|localhost):[0-9]+$' -or [string]::IsNullOrWhiteSpace($anonKey)) {
        throw "운영 주소 또는 잘못된 키로는 통합 데모를 시작할 수 없습니다."
    }
    $apiReady = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try {
            $probe = Invoke-WebRequest -Uri "$apiUrl/rest/v1/growth_profiles?select=id&limit=1" `
                -Headers @{ apikey = $anonKey; authorization = "Bearer $anonKey" } `
                -UseBasicParsing -TimeoutSec 2
            if ($probe.StatusCode -eq 200) { $apiReady = $true; break }
        }
        catch {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -ge 400 -and $statusCode -lt 500) {
                $apiReady = $true
                break
            }
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $apiReady) { throw "RC1 로컬 화면 연결 서비스가 제한 시간 안에 준비되지 않았습니다." }

    $teacherPassword = ([guid]::NewGuid().ToString("N") + "Aa1!")
    $studentPassword = ([guid]::NewGuid().ToString("N") + "Aa1!")
    $parentPassword = ([guid]::NewGuid().ToString("N") + "Aa1!")
    $env:GROWTH_PREVIEW_TEACHER_PASSWORD = $teacherPassword
    $env:GROWTH_PREVIEW_STUDENT_PASSWORD = $studentPassword
    $env:GROWTH_PREVIEW_PARENT_PASSWORD = $parentPassword
    Push-Location $backendRoot
    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\prepare-growth2-integrated-demo-rc1.ps1"
        if ($LASTEXITCODE -ne 0) { throw "RC1 가상 자료 준비에 실패했습니다." }
    }
    finally { Pop-Location }

    Write-Host "[3/4] 3019번 학생·학부모·선생님 화면을 시작합니다."
    if (Test-Path $stateRoot) {
        $resolvedState = (Resolve-Path $stateRoot).Path
        $expectedState = [System.IO.Path]::GetFullPath($stateRoot)
        if ($resolvedState -ne $expectedState -or $resolvedState -notlike "$env:TEMP\*") {
            throw "임시 상태 폴더 경로를 확인해 주세요."
        }
    }
    New-Item -ItemType Directory -Force $stateRoot | Out-Null
    Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue

    $env:GROWTH_PREVIEW_LOCAL_ONLY = "1"
    $env:GROWTH_PREVIEW_SUPABASE_URL = $apiUrl
    $env:GROWTH_PREVIEW_SUPABASE_ANON_KEY = $anonKey
    $env:GROWTH_PREVIEW_STUDENT_A_EMAIL = "student-a-preview@example.test"
    $env:GROWTH_PREVIEW_STUDENT_A_PASSWORD = $studentPassword
    $env:GROWTH_PREVIEW_STUDENT_B_EMAIL = "student-b-preview@example.test"
    $env:GROWTH_PREVIEW_STUDENT_B_PASSWORD = $studentPassword
    $env:GROWTH_PREVIEW_PARENT_EMAIL = "parent-preview@example.test"
    $env:GROWTH_PREVIEW_PARENT_PASSWORD = $parentPassword
    $env:GROWTH_PREVIEW_TEACHER_EMAIL = "teacher-preview@example.test"
    $env:GROWTH_PREVIEW_TEACHER_PASSWORD = $teacherPassword
    $env:NEXT_PUBLIC_GROWTH_PREVIEW_ENV = "local"
    $env:NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV = "1"

    $process = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/d", "/c", "npx.cmd next dev --webpack -H 127.0.0.1 -p 3019" `
        -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    Set-Content -LiteralPath $pidPath -Value $process.Id -Encoding Ascii

    $ready = $false
    for ($attempt = 0; $attempt -lt 100; $attempt++) {
        Start-Sleep -Milliseconds 500
        if ($process.HasExited) { throw "RC1 화면 서버가 시작 중 종료되었습니다. 임시 로그를 확인해 주세요." }
        try {
            $responses = @($studentUrl, $parentUrl, $teacherUrl, $mockUrl) | ForEach-Object {
                Invoke-WebRequest -Uri $_ -UseBasicParsing -TimeoutSec 2
            }
            if (@($responses | Where-Object StatusCode -ne 200).Count -eq 0) { $ready = $true; break }
        }
        catch { }
    }
    if (-not $ready) { throw "RC1 화면이 제한 시간 안에 준비되지 않았습니다." }

    Write-Host "[4/4] 준비가 끝났습니다. 세 화면을 엽니다."
    Start-Process $studentUrl
    Start-Process $parentUrl
    Start-Process $teacherUrl
    Write-Host "READY growth2_demo_rc1_1=1 port=3019 student=1 parent=1 teacher=1 mock=1 environment=local demo_nav=1 student_a_published=1 student_a_draft=2 student_b_empty=1 student_b_draft=1 local_only=1"
}
finally {
    $env:GROWTH_PREVIEW_LOCAL_ONLY = $null
    $env:GROWTH_PREVIEW_SUPABASE_URL = $null
    $env:GROWTH_PREVIEW_SUPABASE_ANON_KEY = $null
    $env:GROWTH_PREVIEW_STUDENT_A_EMAIL = $null
    $env:GROWTH_PREVIEW_STUDENT_A_PASSWORD = $null
    $env:GROWTH_PREVIEW_STUDENT_B_EMAIL = $null
    $env:GROWTH_PREVIEW_STUDENT_B_PASSWORD = $null
    $env:GROWTH_PREVIEW_PARENT_EMAIL = $null
    $env:GROWTH_PREVIEW_PARENT_PASSWORD = $null
    $env:GROWTH_PREVIEW_TEACHER_EMAIL = $null
    $env:GROWTH_PREVIEW_TEACHER_PASSWORD = $null
    $env:GROWTH_PREVIEW_STUDENT_PASSWORD = $null
    $env:NEXT_PUBLIC_GROWTH_PREVIEW_ENV = $null
    $env:NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV = $null
    $teacherPassword = $null; $studentPassword = $null; $parentPassword = $null
    $anonKey = $null; $apiUrl = $null
}
