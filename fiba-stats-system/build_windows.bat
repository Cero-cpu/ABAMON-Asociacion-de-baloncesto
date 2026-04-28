@echo off
echo ===========================================
echo   FIBA Stats System - Windows Build Script
echo ===========================================

REM 1. Build Frontend
echo [1/3] Building Frontend...
cd ../frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Error building frontend
    pause
    exit /b %errorlevel%
)

REM 2. Build Backend
echo [2/3] Building Backend Executable...
cd ../backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
call pip install -r requirements.txt
call pip install pyinstaller
call pyinstaller backend.spec --noconfirm
if %errorlevel% neq 0 (
    echo Error building backend
    pause
    exit /b %errorlevel%
)

REM 3. Build Electron App
echo [3/3] Packaging Electron App...
cd ../electron
call npm install
call npm run build -- --win
if %errorlevel% neq 0 (
    echo Error building electron app
    pause
    exit /b %errorlevel%
)

echo ===========================================
echo   BUILD COMPLETE! Check electron/dist
echo ===========================================
pause
