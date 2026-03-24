@echo off
setlocal
cd /d "%~dp0"

if not exist "server\node_modules\express\" (
  echo Installing dependencies...
  call npm run install:all
  if errorlevel 1 exit /b 1
)

if not defined PORT set "PORT=3000"

start "Log Viewer Server" cmd /k "cd /d ""%~dp0"" && set PORT=%PORT% && npm run start"

echo Waiting for server on port %PORT%...
set /a _wait=0
:wait
set /a _wait+=1
if %_wait% gtr 60 (
  echo Timed out waiting for http://127.0.0.1:%PORT%/health
  exit /b 1
)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%PORT%/health' -UseBasicParsing -TimeoutSec 1; exit ([int]($r.StatusCode -ne 200)) } catch { exit 1 }" 2>nul
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto wait
)

start "" "http://127.0.0.1:%PORT%/api-docs"
start "" "http://127.0.0.1:%PORT%/"

echo.
echo Server window: Log Viewer Server
echo OpenAPI UI:   http://127.0.0.1:%PORT%/api-docs
echo Web UI:       http://127.0.0.1:%PORT%/
echo.
endlocal
