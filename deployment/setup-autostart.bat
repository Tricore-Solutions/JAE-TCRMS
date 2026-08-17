@echo off
REM Add JAE TRMS server to Windows Startup folder (runs on boot)
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SCRIPT=%~dp0start-server.bat"

echo Creating startup shortcut for JAE TRMS server...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP%\JAE TRMS Server.lnk'); $s.TargetPath = '%SCRIPT%'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 7; $s.Save()"

echo Done. The server will start automatically when this PC logs in.
pause
