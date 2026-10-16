@echo off
title BlightVision - Stop
echo ============================================
echo   BlightVision - stopping the system...
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$stopped = 0;" ^
  "$windows = Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { $_.CommandLine -match 'uvicorn main:app|npm run dev' };" ^
  "foreach ($w in $windows) { & taskkill.exe /PID $w.ProcessId /T /F *> $null; $stopped++ }" ^
  "foreach ($port in 8000, 5173) {" ^
  "  $ids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "  foreach ($id in $ids) {" ^
  "    if (Get-Process -Id $id -ErrorAction SilentlyContinue) { & taskkill.exe /PID $id /T /F *> $null; $stopped++ }" ^
  "    else { Get-CimInstance Win32_Process -Filter \"ParentProcessId=$id\" | ForEach-Object { & taskkill.exe /PID $_.ProcessId /T /F *> $null; $stopped++ } }" ^
  "  }" ^
  "}" ^
  "Start-Sleep -Seconds 2;" ^
  "foreach ($port in 8000, 5173) { $name = @{8000='Backend (port 8000)'; 5173='Website (port 5173)'}[$port]; if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { Write-Host ('  ' + $name + ': still running - restart your computer if this persists') } else { Write-Host ('  ' + $name + ': stopped') } }" ^
  "if ($stopped -eq 0) { Write-Host '  (BlightVision was not running.)' }"

echo.
echo BlightVision has been stopped.
timeout /t 4 >nul
