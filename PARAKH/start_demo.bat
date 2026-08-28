@echo off
echo ===================================================
echo   Starting PARAKH: AI-Powered Procurement Auditor
echo ===================================================

echo [1/3] Checking Python Virtual Environment...
if not exist ".venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

echo [2/3] Checking Demo Database...
if not exist "parakh.db" (
    echo Seeding synthetic procurement database...
    python backend\scripts\seed_demo.py
)

echo [3/3] Launching Backend & Frontend Services...
start "PARAKH Backend API" cmd /k "call .venv\Scripts\activate.bat && uvicorn app.main:app --app-dir backend --reload --port 8000"
start "PARAKH Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   PARAKH Services Launched!
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000/docs
echo ===================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
