@echo off
title Home Tutor & Coaching Batch Scheduler - Launcher
echo ========================================================
echo  Home Tutor ^& Coaching Batch Scheduler Launcher
echo ========================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo [1/3] Starting Django Backend on http://127.0.0.1:8000 ...
start "TutorScheduler - Django Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting React Frontend on http://localhost:5173 ...
start "TutorScheduler - React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak >nul

echo [3/3] Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo  Servers are running!
echo  - Local URL:   http://localhost:5173
echo  - Network URL: http://172.100.1.213:5173
echo ========================================================
pause
