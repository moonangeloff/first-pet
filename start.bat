@echo off
setlocal

echo [1/4] Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Error installing backend dependencies.
    exit /b %ERRORLEVEL%
)

echo [2/4] Initializing database...
if not exist helpdesk.db (
    python init_db.py
)

echo [3/4] Installing frontend dependencies...
cd ../frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing frontend dependencies.
    exit /b %ERRORLEVEL%
)

echo [4/4] Starting HelpDesk...
echo.
echo Launching Backend (FastAPI) on http://localhost:8000
start "HelpDesk Backend" /D "..\backend" uvicorn main:app --reload

echo Launching Frontend (React) on http://localhost:5173
call npm run dev

pause
