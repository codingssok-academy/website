[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$expectedProjectName = 'codingssok-growth-v2-staging'
$linkedWorktree = 'C:\dev\codingssok-growth-v2-backend-staging'
$statePath = 'C:\dev\codingssok-growth-v2-staging-local\preview-fixture-state.json'
$apiUrl = $null
$publicKey = $null
$adminKey = $null
$createdUserIds = [Collections.Generic.List[string]]::new()
$accounts = @{}

function ConvertFrom-SecureInput {
    param([Security.SecureString]$Value)
    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        if ($pointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        }
    }
}

function ConvertFrom-Utf8Base64 {
    param([string]$Value)
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

function New-Id { return [guid]::NewGuid().ToString() }

function New-StrongPassword {
    $bytes = [byte[]]::new(32)
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) }
    finally { $generator.Dispose() }
    return ([Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', 'A').Replace('/', 'b') + 'Aa1!')
}

$text = @{
    StudentAName='7YWM7Iqk7Yq4IO2VmeyDnSBB'
    StudentBName='7YWM7Iqk7Yq4IO2VmeyDnSBC'
    ParentName='7YWM7Iqk7Yq4IO2Vmeu2gOuqqA=='
    TeacherName='7YWM7Iqk7Yq4IOyEoOyDneuLmA=='
    Guardian='67O07Zi47J6Q'
    ProjectName='6rCA7IOBIOyasOyjvCDtg5Dtl5gg7ZSE66Gc7KCd7Yq4'
    ProjectDescription='7Jio65287J24IFByZXZpZXcg7ZmV7J24IOyghOyaqSDqsIDsg4Eg7ZSE66Gc7KCd7Yq4'
    ProjectRecent='7Jqw7KO8IO2DkO2XmCDtmZTrqbTsnZgg6riw67O4IOq1rOyEseydhCDrp4zrk6Tsl4jsirXri4jri6Qu'
    ProjectNext='64uk7J2M7JeQ64qUIOygkOyImCDquLDriqXsnYQg7Jew6rKw7ZWp64uI64ukLg=='
    PublishedStrength='67CY67O166y4IOusuOygnOulvCDrgZ3quYzsp4Ag7ZW06rKw7ZWY6rOgIO2SgOydtOulvCDshKTrqoXtlojsirXri4jri6Qu'
    PublishedGoal='64uk7J2M7JeQ64qUIOyhsOqxtOusuOycvOuhnCDsoJDsiJgg6riw64ql7J2EIOyZhOyEse2VqeuLiOuLpC4='
    PublishedImprovement='7Iuk7ZaJIOyghOyXkCDsmIjsg4Eg6rKw6rO866W8IOunkO2VmOuKlCDsl7DsirXsnYQg642UIOydtOyWtOqwkeuLiOuLpC4='
    ParentPrompt='7Jik64qYIOunjOuToCDrsJjrs7XrrLjsnbQg7Ja065akIOydvOydhCDtlZjripTsp4Ag66y87Ja067SQIOyjvOyEuOyalC4='
    ForLabel='Zm9yIOuwmOuzteusuA=='
    DraftAStrength='7KGw6rG066y46rO8IOyYpOulmCDssL7quLDrpbwg7Jew6rKw7ZW0IO2VtOqysCDqs7zsoJXsnYQg7J6Q7IS47Z6IIOyEpOuqhe2WiOyKteuLiOuLpC4='
    DraftAImprovement='7Iuk7ZaJ7ZWY6riwIOyghOyXkCDsmIjsg4Eg6rKw6rO866W8IO2VnCDrrLjsnqXsnLzroZwg66eQ7ZWY64qUIOyXsOyKteydhCDsnbTslrTqsJHri4jri6Qu'
    DraftAGoal='64uk7J2MIOyLnOqwhOyXkOuKlCDtlajsiJjsmYAg7J6F7Lac66Cl7Jy866GcIOyekeydgCDquLDriqXsnYQg7JmE7ISx7ZWp64uI64ukLg=='
    CustomFunction='Y3VzdG9tOu2VqOyImA=='
    CustomInputOutput='Y3VzdG9tOuyehey2nOugpQ=='
    DraftBStrength='67OA7IiY7JmAIOyehey2nOugpeydmCDsiJzshJzrpbwg7LCo6re87LCo6re8IOyEpOuqhe2VnCDsoJDsnbQg7KKL7JWY7Iq164uI64ukLg=='
    DraftBImprovement='67OA7IiY7JeQIOyggOyepeuQmOuKlCDqsJLsnYQg7Iuk7ZaJIOyghOyXkCDsoIHripQg7Jew7Iq17J2EIOydtOyWtOqwkeuLiOuLpC4='
    DraftBGoal='64uk7J2MIOyLnOqwhOyXkOuKlCDrs4DsiJjsmYAg7J6F7Lac66Cl7Jy866GcIOyekeydgCDrrLjsoJzrpbwg7ZW06rKw7ZWp64uI64ukLg=='
    CustomVariable='Y3VzdG9tOuuzgOyImA=='
    TestPrefix='7YWM7Iqk7Yq4'
    VirtualPrefix='6rCA7IOB'
}
foreach ($key in @($text.Keys)) { $text[$key] = ConvertFrom-Utf8Base64 $text[$key] }

function Invoke-Api {
    param(
        [ValidateSet('GET', 'POST', 'DELETE')]
        [string]$Method,
        [string]$Path,
        [string]$ApiKey,
        [string]$Token,
        $Body = $null,
        [string]$Prefer = $null,
        [string]$Step = 'staging request'
    )

    $headers = @{
        apikey=$ApiKey
        Accept='application/json'
        'User-Agent'='codingssok-growth-preview-setup/1.0'
    }
    if (-not [string]::IsNullOrWhiteSpace($Token)) { $headers.Authorization = "Bearer $Token" }
    if (-not [string]::IsNullOrWhiteSpace($Prefer)) { $headers.Prefer = $Prefer }
    $parameters = @{
        Method=$Method
        Uri="$($script:apiUrl)$Path"
        Headers=$headers
        ErrorAction='Stop'
    }
    if ($null -ne $Body) {
        $parameters.ContentType = 'application/json; charset=utf-8'
        $parameters.Body = $Body | ConvertTo-Json -Depth 20 -Compress
    }
    try { return Invoke-RestMethod @parameters }
    catch { throw "$Step failed." }
}

function Invoke-Admin {
    param([string]$Method, [string]$Path, $Body = $null, [string]$Step = 'admin request')
    return Invoke-Api -Method $Method -Path $Path -ApiKey $script:adminKey -Token $null `
        -Body $Body -Prefer 'return=representation' -Step $Step
}

function Invoke-Public {
    param([string]$Path, $Body, [string]$Step)
    return Invoke-Api -Method 'POST' -Path $Path -ApiKey $script:publicKey -Token $null `
        -Body $Body -Step $Step
}

function Invoke-UserRpc {
    param([string]$Path, [string]$Token, $Body, [string]$Step)
    return Invoke-Api -Method 'POST' -Path $Path -ApiKey $script:publicKey -Token $Token `
        -Body $Body -Step $Step
}

function Assert-Count {
    param($Value, [int]$Expected, [string]$Step)
    $rows = @($Value)
    if ($rows.Count -ne $Expected) { throw "$Step returned an unexpected row count." }
    Write-Host "PASS $Step"
    return $rows
}

function ConvertTo-CollectionRows {
    param($Value, [string]$Step)

    if ($null -eq $Value) { return @() }
    if ($Value -is [Array]) { return @($Value) }

    $propertyNames = @($Value.PSObject.Properties.Name)
    foreach ($containerName in @('data', 'buckets', 'items')) {
        if ($propertyNames -contains $containerName) {
            $containerValue = $Value.$containerName
            if ($null -eq $containerValue) { return @() }
            return @($containerValue)
        }
    }

    if ($propertyNames -contains 'id') {
        return @($Value)
    }

    throw "$Step returned an unexpected response shape: $($propertyNames -join ',')"
}

function Confirm-Targets {
    $refPath = Join-Path $script:linkedWorktree 'supabase\.temp\project-ref'
    if (-not (Test-Path -LiteralPath $refPath)) { throw 'The approved Supabase staging link is missing.' }
    $projectRef = (Get-Content -Raw -LiteralPath $refPath).Trim()
    if ($projectRef -notmatch '^[a-z0-9]{20}$') { throw 'The approved Supabase project reference is invalid.' }

    $previous = Get-Location
    try {
        Set-Location -LiteralPath $script:linkedWorktree
        $raw = (& cmd.exe /d /c 'npx.cmd supabase projects list --agent no --output-format json 2>nul' | Out-String)
        if ($LASTEXITCODE -ne 0) { throw 'Could not verify the Supabase project list.' }
    }
    finally { Set-Location -LiteralPath $previous }

    $arrayStart = $raw.IndexOf('[')
    $objectStart = $raw.IndexOf('{')
    if ($arrayStart -ge 0 -and ($objectStart -lt 0 -or $arrayStart -lt $objectStart)) {
        $start = $arrayStart; $end = $raw.LastIndexOf(']')
    }
    else { $start = $objectStart; $end = $raw.LastIndexOf('}') }
    if ($start -lt 0 -or $end -le $start) { throw 'Could not read the Supabase project list safely.' }
    $parsed = $raw.Substring($start, $end - $start + 1) | ConvertFrom-Json
    $projects = @(if ($parsed.PSObject.Properties.Name -contains 'projects') { $parsed.projects } else { $parsed })
    $matches = @($projects | Where-Object { [string]$_.name -ceq $script:expectedProjectName })
    if ($matches.Count -ne 1) { throw 'The exact Supabase staging project was not found once.' }
    $candidateRef = if ($matches[0].PSObject.Properties.Name -contains 'id') {
        [string]$matches[0].id
    }
    elseif ($matches[0].PSObject.Properties.Name -contains 'ref') { [string]$matches[0].ref }
    else { [string]$matches[0].project_ref }
    if ($candidateRef -ne $projectRef) { throw 'The Supabase project name and linked target do not match.' }

    $vercelPath = Join-Path (Get-Location) '.vercel\project.json'
    if (-not (Test-Path -LiteralPath $vercelPath)) { throw 'Run Vercel link before preparing fixtures.' }
    $vercelProject = Get-Content -Raw -LiteralPath $vercelPath | ConvertFrom-Json
    if ([string]$vercelProject.projectName -cne $script:expectedProjectName) {
        throw 'This folder is not linked to the approved Vercel staging project.'
    }

    $script:apiUrl = "https://$projectRef.supabase.co"
    Write-Host 'PASS exact Supabase and Vercel staging targets'
}

function Add-VercelStagingEnvironment {
    param([string]$Name, [string]$Value, [switch]$Sensitive)
    $arguments = @('-y', 'vercel@58.4.4', 'env', 'add', $Name, 'staging', '--force', '--yes')
    if ($Sensitive) { $arguments += '--sensitive' } else { $arguments += '--no-sensitive' }
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = ($Value | & npx.cmd @arguments 2>&1 | Out-String)
        $exitCode = $LASTEXITCODE
    }
    finally { $ErrorActionPreference = $oldPreference }
    if ($exitCode -ne 0) { throw "Could not add Custom staging environment variable: $Name" }
    Write-Host "PASS Vercel Custom staging environment: $Name"
}

function Save-SafeState {
    param($State)
    $directory = Split-Path -Parent $script:statePath
    if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory | Out-Null }
    [IO.File]::WriteAllText(
        $script:statePath,
        ($State | ConvertTo-Json -Depth 10),
        [Text.UTF8Encoding]::new($false)
    )
}

function Remove-CreatedPreviewFixture {
    if ($script:createdUserIds.Count -eq 0 -or [string]::IsNullOrWhiteSpace($script:adminKey)) {
        return
    }

    $cleanupOrder = @(
        'growth_weekly_evaluation_custom_concepts', 'growth_weekly_evaluation_concepts',
        'growth_weekly_evaluation_notes', 'growth_weekly_evaluations', 'growth_student_badges',
        'growth_activity_events', 'growth_xp_transactions', 'growth_student_missions',
        'growth_project_updates', 'growth_projects', 'growth_teacher_student_assignments',
        'growth_parent_student_links', 'growth_students', 'growth_profiles'
    )
    foreach ($table in $cleanupOrder) {
        try {
            $null = Invoke-Admin -Method 'DELETE' -Path "/rest/v1/${table}?id=not.is.null" -Step "$table rollback"
        }
        catch {
            Write-Host "WARN rollback could not clear $table"
        }
    }
    foreach ($userId in @($script:createdUserIds)) {
        try {
            $null = Invoke-Admin -Method 'DELETE' -Path "/auth/v1/admin/users/$userId" -Step 'Auth user rollback'
        }
        catch {
            Write-Host 'WARN rollback could not remove one fake Auth user'
        }
    }
    Write-Host 'ROLLBACK attempted for this run only'
}

try {
    Write-Host 'Growth 2.0 staging Preview fixture setup started.'
    Confirm-Targets

    $setupInputBase64 = $env:GROWTH_PREVIEW_SETUP_INPUT_B64
    if (-not [string]::IsNullOrWhiteSpace($setupInputBase64)) {
        try {
            $setupInput = ConvertFrom-Utf8Base64 $setupInputBase64 | ConvertFrom-Json
            $script:publicKey = ([string]$setupInput.publishable_key).Trim().Trim('"').Trim("'")
            $script:adminKey = ([string]$setupInput.secret_key).Trim().Trim('"').Trim("'")
        }
        finally {
            $env:GROWTH_PREVIEW_SETUP_INPUT_B64 = $null
            $setupInputBase64 = $null
            $setupInput = $null
        }
    }
    else {
        $securePublic = Read-Host -Prompt 'STAGING publishable key' -AsSecureString
        $secureAdmin = Read-Host -Prompt 'NEW temporary STAGING Secret key' -AsSecureString
        try {
            $script:publicKey = (ConvertFrom-SecureInput $securePublic).Trim().Trim('"').Trim("'")
            $script:adminKey = (ConvertFrom-SecureInput $secureAdmin).Trim().Trim('"').Trim("'")
        }
        finally {
            $securePublic.Dispose()
            $secureAdmin.Dispose()
        }
    }
    if ($script:publicKey -notmatch '^sb_publishable_[A-Za-z0-9_-]+$') {
        throw 'Use the Copy button for the staging publishable key.'
    }
    if ($script:adminKey -notmatch '^sb_secret_[A-Za-z0-9_-]+$') {
        throw 'Use the Copy button on the new_keys row. Do not enter the key name or masked dots.'
    }

    $null = Invoke-Api -Method 'GET' -Path '/auth/v1/settings' -ApiKey $script:publicKey -Token $null -Step 'publishable key check'
    Write-Host 'PASS publishable key check'
    $auth = Invoke-Admin -Method 'GET' -Path '/auth/v1/admin/users?page=1&per_page=50' -Step 'Secret key check'
    if (@($auth.users).Count -ne 0) { throw 'The staging Auth project is not empty. Setup stopped.' }
    Write-Host 'PASS staging Auth is empty before setup'

    $userTables = @(
        'growth_profiles', 'growth_students', 'growth_parent_student_links',
        'growth_teacher_student_assignments', 'growth_weekly_evaluations',
        'growth_weekly_evaluation_notes', 'growth_weekly_evaluation_concepts',
        'growth_weekly_evaluation_custom_concepts', 'growth_projects',
        'growth_project_updates', 'growth_student_missions', 'growth_xp_transactions',
        'growth_activity_events', 'growth_student_badges'
    )
    $tableRows = @{}
    foreach ($table in $userTables) {
        $select = if ($table -eq 'growth_profiles') { 'id,role,display_name' } else { 'id' }
        $response = Invoke-Admin -Method 'GET' -Path "/rest/v1/${table}?select=$select" -Step "$table empty check"
        $tableRows[$table] = @(ConvertTo-CollectionRows -Value $response -Step "$table empty check")
    }
    $missionResponse = Invoke-Admin 'GET' '/rest/v1/growth_missions?select=id' $null 'mission catalog'
    $missionRows = ConvertTo-CollectionRows -Value $missionResponse -Step 'mission catalog'
    $null = Assert-Count $missionRows 3 'mission catalog count'
    $badgeResponse = Invoke-Admin 'GET' '/rest/v1/growth_badges?select=id' $null 'badge catalog'
    $badgeRows = ConvertTo-CollectionRows -Value $badgeResponse -Step 'badge catalog'
    $null = Assert-Count $badgeRows 3 'badge catalog count'
    $bucketResponse = Invoke-Api -Method 'GET' -Path '/storage/v1/bucket' -ApiKey $script:adminKey -Token $null -Step 'storage check'
    $buckets = @(ConvertTo-CollectionRows -Value $bucketResponse -Step 'storage check')
    if ($buckets.Count -ne 0) { throw 'Staging Storage is not empty. Nothing was deleted.' }
    Write-Host 'PASS staging Storage is empty'

    $staleCount = ($userTables | ForEach-Object { $tableRows[$_].Count } | Measure-Object -Sum).Sum
    if ($staleCount -gt 0) {
        if ($staleCount -gt 500) { throw 'Unexpected staging data volume. Nothing was deleted.' }
        $orphanProfiles = @($tableRows['growth_profiles'])
        if ($orphanProfiles.Count -gt 0) {
            $unknownProfiles = @()
            foreach ($profile in $orphanProfiles) {
                $profileProperties = @($profile.PSObject.Properties.Name)
                if (($profileProperties -notcontains 'id') -or
                    ($profileProperties -notcontains 'role') -or
                    ($profileProperties -notcontains 'display_name')) {
                    throw 'The staging profile check returned an unexpected response. Nothing was deleted.'
                }
                if ([string]$profile.id -notmatch '^[0-9a-f-]{36}$' -or
                    [string]$profile.role -notin @('student', 'parent', 'teacher', 'admin') -or
                    -not (([string]$profile.display_name).StartsWith($text.TestPrefix) -or
                        ([string]$profile.display_name).StartsWith($text.VirtualPrefix))) {
                    $unknownProfiles += $profile
                }
            }
            if ($unknownProfiles.Count -ne 0) {
                throw 'Unknown staging profiles exist. Nothing was deleted.'
            }
        }

        $cleanupOrder = @(
            'growth_student_badges', 'growth_activity_events', 'growth_xp_transactions',
            'growth_student_missions', 'growth_weekly_evaluation_custom_concepts',
            'growth_weekly_evaluation_concepts', 'growth_weekly_evaluation_notes',
            'growth_weekly_evaluations', 'growth_project_updates', 'growth_projects',
            'growth_teacher_student_assignments', 'growth_parent_student_links',
            'growth_students', 'growth_profiles'
        )
        foreach ($table in $cleanupOrder) {
            if ($tableRows[$table].Count -gt 0) {
                $null = Invoke-Admin -Method 'DELETE' -Path "/rest/v1/${table}?id=not.is.null" -Step "$table stale cleanup"
            }
        }
        foreach ($table in $userTables) {
            $remainingResponse = Invoke-Admin -Method 'GET' -Path "/rest/v1/${table}?select=id" -Step "$table cleanup check"
            $remaining = @(ConvertTo-CollectionRows -Value $remainingResponse -Step "$table cleanup check")
            if ($remaining.Count -ne 0) { throw "Stale cleanup did not finish: $table" }
        }
        Write-Host "PASS removed $staleCount stale staging-only rows"
    }

    $definitions = @(
        @{ Key='studentA'; Email='student-a-staging@example.test'; Role='student'; Name=$text.StudentAName },
        @{ Key='studentB'; Email='student-b-staging@example.test'; Role='student'; Name=$text.StudentBName },
        @{ Key='parent'; Email='parent-staging@example.test'; Role='parent'; Name=$text.ParentName },
        @{ Key='teacher'; Email='teacher-staging@example.test'; Role='teacher'; Name=$text.TeacherName }
    )
    foreach ($definition in $definitions) {
        $password = New-StrongPassword
        $user = Invoke-Admin -Method 'POST' -Path '/auth/v1/admin/users' -Body @{
            email=$definition.Email; password=$password; email_confirm=$true
            user_metadata=@{ purpose='growth-v2-staging-preview' }
        } -Step "create $($definition.Key)"
        $script:createdUserIds.Add([string]$user.id)
        $script:accounts[$definition.Key] = [pscustomobject]@{
            Id=[string]$user.id; Email=$definition.Email; Password=$password
            Role=$definition.Role; Name=$definition.Name; Token=$null
        }
        Write-Host "PASS fake Auth user: $($definition.Key)"
        Start-Sleep -Milliseconds 250
    }

    $studentA = $script:accounts.studentA
    $studentB = $script:accounts.studentB
    $parent = $script:accounts.parent
    $teacher = $script:accounts.teacher
    $ids = @{
        StudentA=New-Id; StudentB=New-Id; ParentLinkA=New-Id; ParentLinkB=New-Id
        AssignmentA=New-Id; AssignmentB=New-Id; ProjectA=New-Id; ProjectUpdateA=New-Id
        MissionA1=New-Id; MissionA2=New-Id; MissionA3=New-Id; BadgeA=New-Id
        EvaluationA1=New-Id; NoteA1=New-Id; ConceptA1=New-Id
    }
    $weekStart = (Get-Date).Date.AddDays(-(([int](Get-Date).DayOfWeek + 6) % 7)).ToString('yyyy-MM-dd')
    $weekEnd = ([datetime]$weekStart).AddDays(6).ToString('yyyy-MM-dd')
    $now = (Get-Date).ToUniversalTime().ToString('o')

    $profiles = @($definitions | ForEach-Object {
        $account = $script:accounts[$_.Key]
        @{ id=$account.Id; role=$_.Role; display_name=$_.Name; created_by=$account.Id; updated_by=$account.Id }
    })
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_profiles' $profiles 'profiles') 4 'four fake profiles'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_students' @(
        @{ id=$ids.StudentA; user_id=$studentA.Id; created_by=$teacher.Id; updated_by=$teacher.Id },
        @{ id=$ids.StudentB; user_id=$studentB.Id; created_by=$teacher.Id; updated_by=$teacher.Id }
    ) 'students') 2 'two fake students'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_parent_student_links' @(
        @{ id=$ids.ParentLinkA; parent_user_id=$parent.Id; student_id=$ids.StudentA; relationship_label=$text.Guardian; created_by=$parent.Id; updated_by=$parent.Id },
        @{ id=$ids.ParentLinkB; parent_user_id=$parent.Id; student_id=$ids.StudentB; relationship_label=$text.Guardian; created_by=$parent.Id; updated_by=$parent.Id }
    ) 'parent links') 2 'parent links to A and B'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_teacher_student_assignments' @(
        @{ id=$ids.AssignmentA; teacher_user_id=$teacher.Id; student_id=$ids.StudentA; created_by=$teacher.Id; updated_by=$teacher.Id },
        @{ id=$ids.AssignmentB; teacher_user_id=$teacher.Id; student_id=$ids.StudentB; created_by=$teacher.Id; updated_by=$teacher.Id }
    ) 'teacher assignments') 2 'teacher assignments to A and B'

    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_projects' @{
        id=$ids.ProjectA; student_id=$ids.StudentA; name=$text.ProjectName
        description=$text.ProjectDescription; created_by=$teacher.Id; updated_by=$teacher.Id
    } 'project') 1 'student A fake project'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_project_updates' @{
        id=$ids.ProjectUpdateA; project_id=$ids.ProjectA; author_user_id=$teacher.Id
        status='published'; recent_work=$text.ProjectRecent; next_work=$text.ProjectNext; progress_pct=60
        event_key='staging-preview-project-v1'; published_at=$now; created_by=$teacher.Id; updated_by=$teacher.Id
    } 'project update') 1 'student A published project update'

    $missions = @(
        @{ id=$ids.MissionA1; student_id=$ids.StudentA; mission_id='10000000-0000-4000-8000-000000000001'; assignment_key='staging-preview-a-1'; status='assigned'; created_by=$teacher.Id; updated_by=$teacher.Id },
        @{ id=$ids.MissionA2; student_id=$ids.StudentA; mission_id='10000000-0000-4000-8000-000000000002'; assignment_key='staging-preview-a-2'; status='assigned'; created_by=$teacher.Id; updated_by=$teacher.Id },
        @{ id=$ids.MissionA3; student_id=$ids.StudentA; mission_id='10000000-0000-4000-8000-000000000003'; assignment_key='staging-preview-a-3'; status='assigned'; created_by=$teacher.Id; updated_by=$teacher.Id }
    )
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_student_missions' $missions 'missions') 3 'student A missions'
    $completion1 = @(Assert-Count (Invoke-Admin 'POST' '/rest/v1/rpc/growth_complete_student_mission' @{
        p_student_mission_id=$ids.MissionA1; p_idempotency_key='staging-preview-complete-a-1'
    } 'complete mission 1') 1 'student A completed mission 1')[0]
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/rpc/growth_complete_student_mission' @{
        p_student_mission_id=$ids.MissionA2; p_idempotency_key='staging-preview-complete-a-2'
    } 'complete mission 2') 1 'student A completed mission 2'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_student_badges' @{
        id=$ids.BadgeA; student_id=$ids.StudentA; badge_id='20000000-0000-4000-8000-000000000001'
        award_key='staging-preview-badge-a'; source_event_id=[string]$completion1.activity_event_id
        created_by=$teacher.Id; updated_by=$teacher.Id
    } 'badge') 1 'student A badge'

    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_weekly_evaluations' @{
        id=$ids.EvaluationA1; student_id=$ids.StudentA; teacher_user_id=$teacher.Id
        week_start=$weekStart; week_end=$weekEnd; version=1; status='published'
        understanding='solves_independently'; participation='asked_questions'; homework_status='complete'
        strength=$text.PublishedStrength; next_goal=$text.PublishedGoal
        attendance_attended=2; attendance_scheduled=2; assignment_completion_pct=100
        weekly_goal_progress_pct=80; project_progress_pct=60; published_at=$now; published_by=$teacher.Id
        created_by=$teacher.Id; updated_by=$teacher.Id
    } 'published evaluation') 1 'student A published evaluation'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_weekly_evaluation_notes' @{
        id=$ids.NoteA1; evaluation_id=$ids.EvaluationA1
        improvement=$text.PublishedImprovement; parent_conversation_prompt=$text.ParentPrompt
        created_by=$teacher.Id; updated_by=$teacher.Id
    } 'parent note') 1 'student A parent-only note'
    $null = Assert-Count (Invoke-Admin 'POST' '/rest/v1/growth_weekly_evaluation_concepts' @{
        id=$ids.ConceptA1; evaluation_id=$ids.EvaluationA1; concept_key='for-loop'; label=$text.ForLabel
        sort_order=1; created_by=$teacher.Id; updated_by=$teacher.Id
    } 'published concept') 1 'student A published concept'

    foreach ($definition in $definitions) {
        $account = $script:accounts[$definition.Key]
        $login = Invoke-Public '/auth/v1/token?grant_type=password' @{
            email=$account.Email; password=$account.Password
        } "login $($definition.Key)"
        $account.Token = [string]$login.access_token
        if ([string]::IsNullOrWhiteSpace($account.Token)) { throw "No token for $($definition.Key)." }
        Write-Host "PASS fake login: $($definition.Key)"
    }

    $saveA = Invoke-UserRpc '/rest/v1/rpc/growth_api_save_teacher_evaluation_draft' $teacher.Token @{
        p_student_id=$ids.StudentA; p_week_start=$weekStart
        p_understanding='applies_elsewhere'; p_participation='tried_independently'
        p_homework_status='extra_challenge'; p_strength=$text.DraftAStrength
        p_improvement=$text.DraftAImprovement; p_next_goal=$text.DraftAGoal
        p_concept_keys=@('condition', 'debugging', $text.CustomFunction, $text.CustomInputOutput)
    } 'student A draft v2'
    if (-not $saveA.saved -or [int]$saveA.version -ne 2) { throw 'Student A draft v2 was not created as expected.' }
    Write-Host 'PASS student A published v1 and draft v2'

    $saveB = Invoke-UserRpc '/rest/v1/rpc/growth_api_save_teacher_evaluation_draft' $teacher.Token @{
        p_student_id=$ids.StudentB; p_week_start=$weekStart
        p_understanding='understands_basics'; p_participation='listened'
        p_homework_status='partly_complete'; p_strength=$text.DraftBStrength
        p_improvement=$text.DraftBImprovement; p_next_goal=$text.DraftBGoal
        p_concept_keys=@($text.CustomVariable, $text.CustomInputOutput)
    } 'student B draft v1'
    if (-not $saveB.saved -or [int]$saveB.version -ne 1) { throw 'Student B draft v1 was not created as expected.' }
    Write-Host 'PASS student B has draft v1 and no published evaluation'

    $studentHomeA = Invoke-UserRpc '/rest/v1/rpc/growth_api_student_home' $studentA.Token @{ p_week_start=$weekStart } 'student A read'
    $studentHomeB = Invoke-UserRpc '/rest/v1/rpc/growth_api_student_home' $studentB.Token @{ p_week_start=$weekStart } 'student B read'
    $parentChildren = Invoke-UserRpc '/rest/v1/rpc/growth_api_parent_children' $parent.Token @{} 'parent children read'
    $teacherStudents = Invoke-UserRpc '/rest/v1/rpc/growth_api_teacher_students' $teacher.Token @{} 'teacher students read'
    if ([int]$studentHomeA.data.published_feedback.version -ne 1) { throw 'Student A published v1 is not visible.' }
    if ($null -ne $studentHomeB.data.published_feedback) { throw 'Student B draft leaked to the student response.' }
    if (@($parentChildren.data).Count -ne 2 -or @($teacherStudents.data).Count -ne 2) { throw 'Parent or teacher relationships are incomplete.' }
    Write-Host 'PASS role-visible fixture relationships'

    Add-VercelStagingEnvironment 'NEXT_PUBLIC_SUPABASE_URL' $script:apiUrl
    Add-VercelStagingEnvironment 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' $script:publicKey
    Add-VercelStagingEnvironment 'NEXT_PUBLIC_GROWTH_PREVIEW_ENV' 'staging'
    Add-VercelStagingEnvironment 'NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV' '0'
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_STAGING_ONLY' '1' -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_STUDENT_A_EMAIL' $studentA.Email -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_STUDENT_A_PASSWORD' $studentA.Password -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_STUDENT_B_EMAIL' $studentB.Email -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_STUDENT_B_PASSWORD' $studentB.Password -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_PARENT_EMAIL' $parent.Email -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_PARENT_PASSWORD' $parent.Password -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_TEACHER_EMAIL' $teacher.Email -Sensitive
    Add-VercelStagingEnvironment 'GROWTH_PREVIEW_TEACHER_PASSWORD' $teacher.Password -Sensitive

    Save-SafeState ([ordered]@{
        purpose='growth-v2-staging-preview'
        created_at=(Get-Date).ToUniversalTime().ToString('o')
        auth_user_ids=@($studentA.Id, $studentB.Id, $parent.Id, $teacher.Id)
        student_ids=@($ids.StudentA, $ids.StudentB)
        emails=@($studentA.Email, $studentB.Email, $parent.Email, $teacher.Email)
        week_start=$weekStart
        initial_counts=[ordered]@{
            profiles=4; students=2; parent_links=2; teacher_assignments=2
            missions=3; completed_missions=2; xp_transactions=2; activity_events=2
            projects=1; project_updates=1; evaluations=3
        }
    })
    Write-Host 'PREVIEW_FIXTURE_SETUP=PASS'
    Write-Host 'TEMP_SECRET_KEY_REVOCATION_REQUIRED=YES'
    Write-Host 'No Secret key, password, or token was written to the state file.'
}
catch {
    Remove-CreatedPreviewFixture
    Write-Host 'PREVIEW_FIXTURE_SETUP=FAIL'
    Write-Host ([string]$_.Exception.Message)
    throw
}
finally {
    foreach ($account in @($script:accounts.Values)) {
        if ($null -ne $account) { $account.Password = $null; $account.Token = $null }
    }
    $script:publicKey = $null
    $script:adminKey = $null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
