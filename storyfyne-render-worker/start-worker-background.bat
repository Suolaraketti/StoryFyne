@echo off
REM StoryFyne GPU Render Worker - Background Mode
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  Starting StoryFyne GPU Render Worker
echo  (Background Mode - Minimized Windows)
echo ============================================
echo.

REM Check if already running
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% == 0 (
    echo Worker is already running on port 3000!
    echo Run stop-worker.bat first if you want to restart.
    pause
    exit /b 1
)

REM Create jobs directory
if not exist "jobs" mkdir jobs

REM Start worker in a minimized, detached window
start /MIN "StoryFyne Worker" cmd /c "set PORT=3000 ^& set REMOTION_GL=angle ^& set REMOTION_CHROME_MODE=chrome-for-testing ^& set WORK_DIR=%~dp0jobs ^& node dist/worker.js ^> worker.log 2^>^&1"

echo Worker starting in background...
timeout /t 2 /nobreak >nul

REM Check if worker started
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Worker failed to start. Check worker.log
    pause
    exit /b 1
)

echo Worker is running on port 3000!

REM Start ngrok in a minimized window
start /MIN "Ngrok Tunnel" cmd /c "npx ngrok http 3000 ^> tunnel.log 2^>^&1"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo  WORKER AND TUNNEL ARE RUNNING
echo ============================================
echo.
echo Ngrok URL: Check http://127.0.0.1:4040/status
echo           or run: curl -s http://127.0.0.1:4040/api/tunnels ^| findstr public_url
echo.
echo Worker logs:  type worker.log
echo Tunnel logs:  type tunnel.log
echo.
echo To stop:      run stop-worker.bat
echo.
pause
