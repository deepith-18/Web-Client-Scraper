# Demanex Local CI/CD Multi-Test Runner (PowerShell)
# Runs the full verification pipeline locally before git push

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       DEMANEX CONTINUOUS INTEGRATION & TEST RUNNER       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$pythonExe = Join-Path $root "backend\.venv\Scripts\python.exe"
$pytestExe = Join-Path $root "backend\.venv\Scripts\pytest.exe"

if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
    $pytestExe = "pytest"
}

$allPassed = $true

# Stage 1: Backend Security & SSRF Audit
Write-Host "`n[Stage 1/5] Running Security & SSRF Protection Tests..." -ForegroundColor Yellow
& $pytestExe backend/tests/test_ssrf.py -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: SSRF Protection tests failed." -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "PASSED: SSRF Protection & IP filtering verified." -ForegroundColor Green
}

# Stage 2: Backend Auth & RBAC Separation Tests
Write-Host "`n[Stage 2/5] Running Auth, JWT & Role Separation Tests..." -ForegroundColor Yellow
& $pytestExe backend/tests/test_auth.py -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Auth and RBAC tests failed." -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "PASSED: Auth, password hashing, and caller separation verified." -ForegroundColor Green
}

# Stage 3: Complete Backend 47-Test Suite
Write-Host "`n[Stage 3/5] Running Complete Backend Pytest Suite..." -ForegroundColor Yellow
& $pytestExe backend/tests -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Backend test suite encountered failures." -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "PASSED: All backend unit and integration tests passed." -ForegroundColor Green
}

# Stage 4: Frontend Static Type Analysis (TypeScript)
Write-Host "`n[Stage 4/5] Running Frontend Type Checking (tsc --noEmit)..." -ForegroundColor Yellow
Set-Location (Join-Path $root "frontend")
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Frontend TypeScript type check failed." -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "PASSED: Frontend static types 100% clean." -ForegroundColor Green
}
Set-Location $root

# Stage 5: Frontend Production Build Compilation
Write-Host "`n[Stage 5/5] Building Frontend Production Package..." -ForegroundColor Yellow
Set-Location (Join-Path $root "frontend")
$buildSuccess = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        $buildSuccess = $true
        break
    } else {
        if ($attempt -lt 3) {
            Write-Host "Build encountered transient lock/EPERM, retrying attempt $($attempt + 1)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
        }
    }
}

if (-not $buildSuccess) {
    Write-Host "FAILED: Frontend Next.js production build failed." -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "PASSED: Next.js production build succeeded with all routes compiled." -ForegroundColor Green
}
Set-Location $root

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "       DEMANEX CI/CD PIPELINE: ALL CHECKS PASSED          " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "       DEMANEX CI/CD PIPELINE: FAILURES DETECTED          " -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}

