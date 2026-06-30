@echo off
REM MySQL Setup Script for JAE TCRMS
REM Creates database and application user with fixed credentials

echo Setting up MySQL for JAE TCRMS...

set "mysqlUser=root"
set "mysqlPassword=rootroot"
set "appUser=tcrms_user"
set "appPassword=tcrms_password"
set "databaseName=tcrms"

set "mysqlPath="
for %%P in (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe"
    "C:\xampp\mysql\bin\mysql.exe"
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"
    "mysql.exe"
) do (
    if exist %%P (
        set "mysqlPath=%%P"
        goto :found
    )
)

where mysql.exe >nul 2>&1
if %errorlevel% == 0 (
    set "mysqlPath=mysql.exe"
    goto :found
)

echo ERROR: MySQL client not found!
pause
exit /b 1

:found
echo SUCCESS: MySQL client found: %mysqlPath%

echo Testing MySQL connection...
%mysqlPath% -u %mysqlUser% -p%mysqlPassword% -e "SELECT VERSION();" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: MySQL connection failed
    echo   User: %mysqlUser%
    echo   Password: %mysqlPassword%
    pause
    exit /b 1
)

echo Creating database %databaseName%...
%mysqlPath% -u %mysqlUser% -p%mysqlPassword% -e "CREATE DATABASE IF NOT EXISTS %databaseName% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo Creating user %appUser%...
%mysqlPath% -u %mysqlUser% -p%mysqlPassword% -e "DROP USER IF EXISTS '%appUser%'@'localhost';"
%mysqlPath% -u %mysqlUser% -p%mysqlPassword% -e "CREATE USER '%appUser%'@'localhost' IDENTIFIED BY '%appPassword%';"
%mysqlPath% -u %mysqlUser% -p%mysqlPassword% -e "GRANT ALL PRIVILEGES ON %databaseName%.* TO '%appUser%'@'localhost';"
%mysqlPath% -u %mysqlUser% -p%mysqlPassword% -e "FLUSH PRIVILEGES;"

echo.
echo Running Django migrations...
cd /d "%~dp0..\backend"
if not exist ".env" (
    copy .env.example .env
)

if not exist "venv\Scripts\python.exe" (
    echo Backend venv not found — running install-backend.bat first...
    call "%~dp0install-backend.bat"
)

call venv\Scripts\python.exe manage.py migrate

echo.
echo Database setup completed!
echo.
echo Connection settings:
echo   Database: %databaseName%
echo   User: %appUser%
echo   Password: %appPassword%
echo   Host: localhost:3306
echo.
pause
