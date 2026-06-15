@echo off
echo Starting CareSync AI...

echo Starting Frontend...
start "CareSync Frontend" cmd /k "cd /d "%~dp0..\caresync-ai" && node node_modules\vite\bin\vite.js"

echo Starting Backend...
start "CareSync Backend" cmd /k "cd /d "%~dp0" && node src\index.js"

echo Both servers are starting in separate windows.
