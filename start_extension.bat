@echo off
setlocal

REM Define paths
set FAST_SCRIPT=C:\Users\joaqu\Documents\ENMGT 5400\LeetCode_Extension\fast_app.py
set EXTENSION_PATH=C:\Users\joaqu\Documents\ENMGT 5400\LeetCode_Extension\Extension
set LEETCODE_URL=https://leetcode.com/problemset/

REM Start FastAPI server (no /B anymore — just background naturally)
start python "%FAST_SCRIPT%"

REM Wait for server to be ready (port 5000)
echo Waiting for FastAPI server to become ready...
:loop
timeout /t 2 /nobreak >nul
powershell -Command "try { (Invoke-WebRequest -Uri http://localhost:5000 -UseBasicParsing).StatusCode } catch { exit 1 }"
if %errorlevel% neq 0 goto loop

REM Server ready, launch Chrome
echo FastAPI server ready!
start chrome --load-extension="%EXTENSION_PATH%" "%LEETCODE_URL%"

REM Done
exit
