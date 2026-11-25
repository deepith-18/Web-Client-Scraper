#!/usr/bin/env bash
# ProspectIQ - Frontend Launcher Script (macOS / Linux)
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$DIR/frontend"

echo ""
echo "==============================================="
echo "   Starting ProspectIQ Next.js Dashboard...    "
echo "==============================================="
echo ""

# Ensure common PATHs are included on macOS
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"

# Check if npm and node are installed
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ Error: Node.js / npm is not installed or not in PATH."
    echo ""
    echo "To fix this, please install Node.js (LTS version):"
    echo "  1. Download the macOS installer (.pkg) from https://nodejs.org"
    echo "     or run: brew install node"
    echo "  2. After installation, restart this terminal window."
    echo "  3. Re-run: ./run-frontend.sh"
    echo ""
    exit 1
fi

cd "$FRONTEND_DIR"

# 1. Dependency check
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "[1/3] Installing frontend dependencies..."
    npm install
else
    echo "[1/3] Frontend dependencies ready."
fi

# 2. Clear stale Next.js cache to avoid webpack chunk conflicts
if [ -d "$FRONTEND_DIR/.next" ]; then
    echo "[2/3] Cleaning stale Next.js cache..."
    rm -rf "$FRONTEND_DIR/.next"
fi

# 3. Start Next.js Development Server
echo ""
echo "[3/3] Launching Next.js UI on http://localhost:3000..."
echo ""
npm run dev
