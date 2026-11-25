#!/usr/bin/env bash
# ProspectIQ - Backend Launcher Script (macOS / Linux)
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "==============================================="
echo "   Starting ProspectIQ Backend API Engine...   "
echo "==============================================="
echo ""

# 1. Environment file check
if [ ! -f "$DIR/.env" ]; then
    echo "[1/4] Creating .env from .env.example..."
    cp "$DIR/.env.example" "$DIR/.env"
else
    echo "[1/4] .env configuration detected."
fi

# 2. Virtual environment check
# Determine python command (prefer python3)
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "Error: Neither python3 nor python was found in PATH." >&2
    exit 1
fi

if [ ! -f "$DIR/backend/.venv/bin/python" ]; then
    echo "[2/4] Initializing Python virtual environment..."
    $PYTHON_CMD -m venv "$DIR/backend/.venv"
    echo "[2/4] Installing dependencies..."
    "$DIR/backend/.venv/bin/pip" install -r "$DIR/backend/requirements.txt"
else
    echo "[2/4] Python virtual environment ready."
fi

# 3. Database schema & initial seeding check
echo "[3/4] Checking & initializing database..."
"$DIR/backend/.venv/bin/python" -m backend.app.core.seed
echo "[3/4] Database verified and ready."

# 4. Start FastAPI server
echo ""
echo "[4/4] Launching FastAPI server on http://localhost:8000..."
echo "Swagger Docs: http://localhost:8000/docs"
echo ""
"$DIR/backend/.venv/bin/python" -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
