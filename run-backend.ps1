# ProspectIQ - Backend Launcher Script
$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   Starting ProspectIQ Backend API Engine...    " -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Set-Location $WorkspaceRoot

# 1. Environment file check
if (-not (Test-Path "$WorkspaceRoot\.env")) {
    Write-Host "[1/4] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item "$WorkspaceRoot\.env.example" "$WorkspaceRoot\.env"
} else {
    Write-Host "[1/4] .env configuration detected." -ForegroundColor Green
}

# 2. Virtual environment check
if (-not (Test-Path "$WorkspaceRoot\backend\.venv\Scripts\python.exe")) {
    Write-Host "[2/4] Initializing Python virtual environment..." -ForegroundColor Yellow
    python -m venv "$WorkspaceRoot\backend\.venv"
    Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
    & "$WorkspaceRoot\backend\.venv\Scripts\pip.exe" install -r "$WorkspaceRoot\backend\requirements.txt"
} else {
    Write-Host "[2/4] Python virtual environment ready." -ForegroundColor Green
}

# 3. Database schema & initial seeding check
Write-Host "[3/4] Checking & initializing database..." -ForegroundColor Yellow
& "$WorkspaceRoot\backend\.venv\Scripts\python.exe" -m backend.app.core.seed
Write-Host "[3/4] Database verified and ready." -ForegroundColor Green

# 4. Start FastAPI server
Write-Host "`n[4/4] Launching FastAPI server on http://localhost:8000..." -ForegroundColor Cyan
Write-Host "Swagger Docs: http://localhost:8000/docs`n" -ForegroundColor Green
& "$WorkspaceRoot\backend\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

