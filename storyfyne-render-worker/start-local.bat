@echo off
REM StoryFyne Local GPU Render Worker - Windows
REM Run this to start the render worker on your local GPU

cd /d "%~dp0"

echo ============================================
echo  StoryFyne Local GPU Render Worker
echo ============================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

REM Install deps if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Build if needed
if not exist "dist\worker.js" (
    echo Building worker...
    call npm run build
)

echo.
echo Starting GPU render worker...
echo Concurrency: 2 (safe for 8GB VRAM)
echo GPU Backend: angle (NVIDIA optimized)
echo.

set PORT=3000
set REMOTION_GL=angle
set REMOTION_CHROME_MODE=chrome-for-testing
set BACKEND_WEBHOOK_URL=https://your-backend.up.railway.app/api/render-complete
set R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
set R2_ACCESS_KEY_ID=your-r2-key
set R2_SECRET_ACCESS_KEY=your-r2-secret
set R2_BUCKET=storyfyne-videos

node dist/worker.js

pause
