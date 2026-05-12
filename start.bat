@echo off
title Werkstatt-Blackout
cd /d "%~dp0"

if not exist "%~dp0server.ps1" (
    echo FEHLER: server.ps1 nicht gefunden.
    echo Bitte stelle sicher, dass start.bat und server.ps1 im gleichen Ordner liegen.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
