@echo off
SETLOCAL EnableDelayedExpansion

:: Amigos Printer Bridge Manager for Windows
:: This script manages the printer bridge as a background process using PM2

:: To START the printer: ./manager.bat start
:: To STOP the printer: ./manager.bat stop
:: To check IF it is running: ./manager.bat status
:: To see the live printer logs: ./manager.bat logs

SET SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo PM2 is not installed. Installing PM2 globally...
    npm install pm2 -g
)

IF "%1"=="" GOTO usage
IF "%1"=="start" GOTO start
IF "%1"=="stop" GOTO stop
IF "%1"=="restart" GOTO restart
IF "%1"=="status" GOTO status
IF "%1"=="logs" GOTO logs

:usage
echo Usage: %0 {start^|stop^|restart^|status^|logs}
echo Example: %0 start
exit /b 1

:start
echo Starting Amigos Printer Bridge in background...
pm2 start ecosystem.config.js
goto :eof

:stop
echo Stopping Amigos Printer Bridge...
pm2 stop amigos-printer-bridge
goto :eof

:restart
echo Restarting Amigos Printer Bridge...
pm2 restart amigos-printer-bridge
goto :eof

:status
pm2 status amigos-printer-bridge
goto :eof

:logs
pm2 logs amigos-printer-bridge
goto :eof
