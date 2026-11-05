# ProspectIQ - Frontend Launcher Script
$ErrorActionPreference = "Stop"
$FrontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   Starting ProspectIQ Next.js Dashboard...     " -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Set-Location $FrontendDir

# 1. Dependency check
if (-not (Test-Path "$FrontendDir\node_modules")) {
    Write-Host "[1/3] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[1/3] Frontend dependencies ready." -ForegroundColor Green
}

# 2. Clear stale Next.js cache to avoid webpack chunk conflict between build and dev
if (Test-Path "$FrontendDir\.next") {
    Write-Host "[2/3] Cleaning stale Next.js cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$FrontendDir\.next" -ErrorAction SilentlyContinue
}

# 3. Start Next.js Development Server
Write-Host "`n[3/3] Launching Next.js UI on http://localhost:3000...`n" -ForegroundColor Cyan
npm run dev

