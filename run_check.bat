@echo off
"C:\Program Files\nodejs\node.exe" "%~dp0check_v3.js" > "%~dp0check_output.txt" 2>&1
"C:\Program Files\nodejs\node.exe" "%~dp0smoke_check.js" >> "%~dp0check_output.txt" 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Checks failed. See check_output.txt
  exit /b 1
)
echo Checks passed. See check_output.txt
