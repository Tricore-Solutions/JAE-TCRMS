@echo off
title JAE TCRMS - Install Windows Service
echo ============================================
echo  JAE TCRMS - Install as Windows Service
echo ============================================
echo.
echo This will install the JAE TCRMS server to run
echo automatically when Windows starts.
echo.
echo You must run this as Administrator!
echo.
pause

cd /d "%~dp0"

REM Install node-windows globally if not present
npm install -g node-windows

REM Run the service installer
node install-service.js

echo.
echo Done! The server will now start automatically with Windows.
pause
