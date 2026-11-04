@echo off
title ProspectIQ - Next.js Frontend
cd /d "%~dp0frontend"

echo ===============================================
echo    Starting ProspectIQ Next.js Dashboard...
echo ===============================================

if not exist "node_modules" (
    echo [1/2] Installing frontend dependencies...
    call npm install
) else (
    echo [1/2] Frontend dependencies ready.
)

echo [2/2] Launching Next.js UI on http://localhost:3000...
echo.
call npm run dev
pause

