@echo off
title JAE TCRMS Server
echo ============================================
echo  JAE Philippines, Inc.
echo  Training and Certification Record System
echo  Server v1.0.0
echo ============================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    echo Minimum version: 18.x
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting server...
echo Server will be accessible to all computers on this network.
echo.

REM Show the machine's IP address
echo Your IP addresses:
ipconfig | findstr /i "IPv4"
echo.
echo Use one of the above IPs when configuring the client app.
echo.
echo Server is running on port 3000. Press Ctrl+C to stop.
echo.

node src/index.js

pause
