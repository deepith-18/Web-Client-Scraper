# ProspectIQ - Frontend Launcher Script
$ErrorActionPreference = "Stop"
$FrontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   Starting ProspectIQ Next.js Dashboard...     " -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Set-Location $FrontendDir

# 1. Dependency check
if (-not (Test-Path "$FrontendDir\node_modules")) {
    Write-Host "[1/2] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[1/2] Frontend dependencies ready." -ForegroundColor Green
}

# 2. Start Next.js Development Server
Write-Host "`n[2/2] Launching Next.js UI on http://localhost:3000...`n" -ForegroundColor Cyan
npm run dev

