@echo off
title BlightVision Launcher
cd /d "%~dp0"

echo ============================================
echo   BlightVision - starting the system...
echo ============================================
echo.

if not exist "backend\.venv\Scripts\python.exe" (
  echo [ERROR] Python environment not found in backend\.venv
  echo Follow the setup steps in backend\README.md first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing frontend packages for the first time...
  call npm install
)

rem 1. Backend (Python FastAPI + Random Forest) in its own window
echo [1/3] Starting the Random Forest backend on http://localhost:8000 ...
start "BlightVision Backend - do not close" /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --port 8000"

rem 2. Wait until the backend answers (max ~60 seconds)
echo [2/3] Waiting for the backend to be ready...
set /a tries=0
:wait_backend
set /a tries+=1
curl.exe -s -o nul http://localhost:8000/api/health && goto backend_ready
if %tries% geq 60 (
  echo [WARNING] The backend did not respond yet. Check the "BlightVision Backend" window for errors.
  goto start_frontend
)
timeout /t 1 /nobreak >nul
goto wait_backend

:backend_ready
echo       Backend is ready.

:start_frontend
rem 3. Frontend (React + Vite). Vite opens the browser automatically.
echo [3/3] Starting the website and opening your browser...
start "BlightVision Frontend - do not close" /D "%~dp0" cmd /k "npm run dev"

echo.
echo The system is opening in your browser at http://localhost:5173
echo To stop BlightVision, close the two "BlightVision" windows.
timeout /t 5 >nul
exit /b 0
