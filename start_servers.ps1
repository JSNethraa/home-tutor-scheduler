# Home Tutor & Coaching Batch Scheduler PowerShell Launcher
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PATH = "$env:LOCALAPPDATA\Programs\nodejs;$env:PATH"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Home Tutor & Coaching Batch Scheduler" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Starting Django Backend on 0.0.0.0:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting React Vite Frontend on 0.0.0.0:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$env:LOCALAPPDATA\Programs\nodejs;`$env:PATH'; cd '$scriptDir\frontend'; npm run dev -- --host 0.0.0.0 --port 5173"

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host "`nServers are running!" -ForegroundColor Green
Write-Host "• Local Link:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "• Network Link: http://172.100.1.213:5173" -ForegroundColor Cyan
