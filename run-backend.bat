@echo off
title ProspectIQ - Backend Server
cd /d "%~dp0"

echo ===============================================
echo    Starting ProspectIQ Backend API Engine...
echo ===============================================

if not exist ".env" (
    echo [1/4] Creating .env from .env.example...
    copy .env.example .env >nul
) else (
    echo [1/4] .env configuration detected.
)

if not exist "backend\.venv\Scripts\python.exe" (
    echo [2/4] Initializing Python virtual environment...
    python -m venv backend\.venv
    echo [2/4] Installing dependencies...
    backend\.venv\Scripts\pip install -r backend\requirements.txt
) else (
    echo [2/4] Python virtual environment ready.
)

echo [3/4] Checking and initializing database...
backend\.venv\Scripts\python -m backend.app.core.seed

echo [4/4] Launching FastAPI on http://localhost:8000...
echo Swagger Docs: http://localhost:8000/docs
echo.
backend\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause

