@echo off
REM StoryFyne GPU Render Worker - Stop Script
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  Stopping StoryFyne GPU Render Worker
echo ============================================
echo.

REM Read PORT from .env if it exists
set LOCAL_PORT=3000
if exist ".env" (
    for /f "usebackq tokens=*" %%a in (".env") do (
        for /f "tokens=1,* delims==" %%b in ("%%a") do (
            if "%%b"=="PORT" set LOCAL_PORT=%%c
        )
    )
)

REM Kill process on the worker port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%LOCAL_PORT%') do (
    echo Killing worker process on port %LOCAL_PORT% (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill ngrok
taskkill /IM ngrok.exe /F >nul 2>&1

REM Kill any node processes for localtunnel
wmic process where "name='node.exe' and CommandLine like '%%localtunnel%%'" delete >nul 2>&1

echo.
echo Worker stopped.
pause
