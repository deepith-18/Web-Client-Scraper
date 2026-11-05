@echo off
title ProspectIQ - Next.js Frontend
cd /d "%~dp0frontend"

echo ===============================================
echo    Starting ProspectIQ Next.js Dashboard...
echo ===============================================

if not exist "node_modules" (
    echo [1/3] Installing frontend dependencies...
    call npm install
) else (
    echo [1/3] Frontend dependencies ready.
)

if exist ".next" (
    echo [2/3] Cleaning stale Next.js cache...
    rd /s /q ".next" 2>nul
)

echo [3/3] Launching Next.js UI on http://localhost:3000...
echo.
call npm run dev
pause

