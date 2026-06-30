@echo off
cd /d "%~dp0..\backend"

if not exist ".env" (
    copy .env.example .env
    echo Created .env from .env.example — review settings before production use.
)

if not exist "venv\Scripts\python.exe" (
    echo Backend venv not found — run install-backend.bat first.
    pause
    exit /b 1
)

call venv\Scripts\python.exe manage.py runserver 0.0.0.0:3000
