@echo off
SETLOCAL EnableDelayedExpansion

:: Amigos Printer Bridge Manager for Windows
:: This script manages the printer bridge as a background process using PM2

:: Usage:
:: To START the printer:   manager.bat start
:: To STOP the printer:    manager.bat stop
:: To RESTART:             manager.bat restart
:: To check STATUS:        manager.bat status
:: To see live LOGS:       manager.bat logs

SET "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check if local dependencies are installed
if not exist "..\node_modules" (
    echo [INFO] node_modules not found in parent directory. Running npm install...
    pushd ..
    call npm install
    popd
)

:: 3. Check if PM2 is installed globally
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] PM2 is not installed. Attempting to install PM2 globally...
    echo [HINT] This may require Administrative privileges.
    call npm install pm2 -g
    where pm2 >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install or locate PM2. Please run: npm install pm2 -g
        pause
        exit /b 1
    )
)

:: 4. Process Commands (Case-Insensitive)
if /I "%1"=="start" goto start
if /I "%1"=="stop" goto stop
if /I "%1"=="restart" goto restart
if /I "%1"=="status" goto status
if /I "%1"=="logs" goto logs

:usage
echo.
echo Usage: %~nx0 {start^|stop^|restart^|status^|logs}
echo Example: %~nx0 start
echo.
exit /b 1

:start
echo [INFO] Starting Amigos Printer Bridge...
pm2 start ecosystem.config.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start printer bridge. Check logs for details.
)
goto :end

:stop
echo [INFO] Stopping Amigos Printer Bridge...
pm2 stop amigos-printer-bridge
goto :end

:restart
echo [INFO] Restarting Amigos Printer Bridge...
pm2 restart amigos-printer-bridge
goto :end

:status
pm2 status amigos-printer-bridge
goto :end

:logs
echo [INFO] Press Ctrl+C to stop viewing logs.
pm2 logs amigos-printer-bridge
goto :end

:end
exit /b 0
