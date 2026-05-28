@echo off
REM StoryFyne GPU Render Worker - One-Click Start
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  StoryFyne GPU Render Worker
echo ============================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and fill in your credentials.
    pause
    exit /b 1
)

REM Load .env file into environment
for /f "usebackq tokens=*" %%a in (".env") do (
    for /f "tokens=1,* delims==" %%b in ("%%a") do (
        set "%%b=%%c"
    )
)

REM Check if already running
netstat -ano | findstr :%PORT% >nul 2>&1
if %errorlevel% == 0 (
    echo Worker is already running on port %PORT%!
    echo Run stop-worker.bat first if you want to restart.
    pause
    exit /b 1
)

REM Create jobs directory
if not exist "jobs" mkdir jobs

echo Starting worker on port %PORT% with GPU backend: %REMOTION_GL%
echo.

REM Start worker in a minimized window
start /MIN "StoryFyne Worker" cmd /c "node dist/worker.js ^> worker.log 2^>^&1"

timeout /t 2 /nobreak >nul

REM Check if worker started
netstat -ano | findstr :%PORT% >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Worker failed to start. Check worker.log
    pause
    exit /b 1
)

echo Worker is running!
echo.

REM Start ngrok in a minimized window
start /MIN "Ngrok Tunnel" cmd /c "npx ngrok http %PORT% ^> tunnel.log 2^>^&1"

timeout /t 4 /nobreak >nul

echo ============================================
echo  WORKER AND TUNNEL ARE RUNNING
echo ============================================
echo.
echo Get your tunnel URL:
echo   http://127.0.0.1:4040/status
echo.
echo Or run this command to see it:
echo   curl -s http://127.0.0.1:4040/api/tunnels ^| findstr public_url
echo.
echo Logs:    type worker.log
echo           type tunnel.log
echo.
echo Stop:    double-click stop-worker.bat
echo.
pause
