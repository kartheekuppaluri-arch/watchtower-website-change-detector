@echo off
title WatchTower - Website Change Detector
echo ========================================================
echo   Starting WatchTower Website Change Detector...
echo ========================================================
cd /d "%~dp0"
echo Starting Backend and Frontend servers...
npm run dev
pause
