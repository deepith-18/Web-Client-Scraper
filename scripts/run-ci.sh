#!/usr/bin/env bash
# Demanex Local/CI Test Runner (Bash)
set -e

echo "=========================================================="
echo "       DEMANEX CONTINUOUS INTEGRATION & TEST RUNNER       "
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo ""
echo "[Stage 1/5] Running Security & SSRF Protection Tests..."
pytest backend/tests/test_ssrf.py -q

echo ""
echo "[Stage 2/5] Running Auth, JWT & Role Separation Tests..."
pytest backend/tests/test_auth.py -q

echo ""
echo "[Stage 3/5] Running Complete Backend Pytest Suite..."
pytest backend/tests -v

echo ""
echo "[Stage 4/5] Running Frontend Type Checking (tsc --noEmit)..."
cd "$DIR/frontend"
npm run type-check

echo ""
echo "[Stage 5/5] Building Frontend Production Package..."
npm run build

echo ""
echo "=========================================================="
echo "       DEMANEX CI/CD PIPELINE: ALL CHECKS PASSED          "
echo "=========================================================="

