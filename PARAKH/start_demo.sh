#!/bin/bash
set -e

echo "==================================================="
echo "  Starting PARAKH: AI-Powered Procurement Auditor"
echo "==================================================="

# 1. Check Python Virtual Environment
if [ ! -d ".venv" ]; then
    echo "[1/3] Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
else
    echo "[1/3] Activating virtual environment..."
    source .venv/bin/activate
fi

# 2. Check Database
if [ ! -f "parakh.db" ]; then
    echo "[2/3] Seeding demo database..."
    PYTHONPATH=. python backend/scripts/seed_demo.py
fi

# 3. Launch Services
echo "[3/3] Launching FastAPI Backend & Vite Frontend..."
export PYTHONPATH=.
uvicorn backend.app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "  PARAKH Services Running!"
echo "  Frontend:    http://localhost:5173"
echo "  Backend API: http://localhost:8000/docs"
echo "==================================================="
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
