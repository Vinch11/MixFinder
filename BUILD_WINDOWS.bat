@echo off
title MixFinder V5 - Build Windows
echo.
echo ================================================
echo   MixFinder V5 Premium - Compilation Windows
echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe.
  echo Installation via winget...
  winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
)
where cargo >nul 2>nul
if errorlevel 1 (
  echo Rust n'est pas installe.
  echo Installation via winget...
  winget install Rustlang.Rustup --accept-source-agreements --accept-package-agreements
)
echo.
echo IMPORTANT : ferme puis relance ce fichier si Node ou Rust viennent d'etre installes.
echo.
call npm install
call npm run tauri build
echo.
echo Build termine.
echo Les installateurs sont dans :
echo src-tauri\target\release\bundle\
pause
