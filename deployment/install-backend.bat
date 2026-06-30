@echo off
REM First-time backend setup for Windows (server machine or dev PC)
cd /d "%~dp0..\backend"

echo Installing JAE TCRMS backend (Python + Django)...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Install Python 3.9+ from https://python.org
    echo Make sure "Add Python to PATH" is checked during install.
    pause
    exit /b 1
)

if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\python.exe -m pip install -r requirements.txt

if not exist ".env" (
    copy .env.example .env
    echo Created .env from .env.example
)

echo.
echo Backend installed successfully.
echo Next: run setup-mysql.bat, then start-server.bat
echo.
pause
