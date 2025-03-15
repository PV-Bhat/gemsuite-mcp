@echo off
echo Building GemSuite MCP server...
call npm run build

if %ERRORLEVEL% NEQ 0 (
  echo Build failed with error code %ERRORLEVEL%
  pause
  exit /b %ERRORLEVEL%
)

echo Starting GemSuite MCP server...
call npm start

pause
