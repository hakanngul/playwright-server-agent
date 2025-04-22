@echo off
setlocal enabledelayedexpansion

REM Parametreleri kontrol et
if "%1"=="" (
    echo Kullanim: run-browser-test.bat [tarayici] [headless]
    echo.
    echo Tarayici: chromium, firefox, edge
    echo Headless: true, false
    echo.
    echo Ornek: run-browser-test.bat firefox true
    exit /b 1
)

REM Tarayici tipini ayarla
set BROWSER_TYPE=%1
if not "%BROWSER_TYPE%"=="chromium" if not "%BROWSER_TYPE%"=="firefox" if not "%BROWSER_TYPE%"=="edge" (
    echo Hatali tarayici tipi: %BROWSER_TYPE%
    echo Gecerli tarayici tipleri: chromium, firefox, edge
    exit /b 1
)

REM Headless modunu ayarla
set HEADLESS=false
if not "%2"=="" (
    set HEADLESS=%2
)
if not "%HEADLESS%"=="true" if not "%HEADLESS%"=="false" (
    echo Hatali headless degeri: %HEADLESS%
    echo Gecerli headless degerleri: true, false
    exit /b 1
)

echo %BROWSER_TYPE% tarayicisinda Google Arama Testi calistiriliyor...
echo Headless modu: %HEADLESS%
echo.

REM Test planini gecici bir dosyaya kopyala
copy test-plan.json temp-test-plan.json > nul

REM JSON dosyasini manuel olarak duzenle
echo Tarayici tipi ve headless modu guncelleniyor...

set "tempfile=temp-test-plan2.json"

REM Tarayici tipini guncelle
(for /f "tokens=1* delims=" %%a in (temp-test-plan.json) do (
    set "line=%%a"
    set "line=!line:"browserPreference": "chromium"="browserPreference": "%BROWSER_TYPE%"!"
    set "line=!line:"browserPreference": "firefox"="browserPreference": "%BROWSER_TYPE%"!"
    set "line=!line:"browserPreference": "edge"="browserPreference": "%BROWSER_TYPE%"!"
    echo !line!
)) > %tempfile%

copy %tempfile% temp-test-plan.json > nul

REM Headless modunu guncelle
(for /f "tokens=1* delims=" %%a in (temp-test-plan.json) do (
    set "line=%%a"
    set "line=!line:"headless": true="headless": %HEADLESS%!"
    set "line=!line:"headless": false="headless": %HEADLESS%!"
    echo !line!
)) > %tempfile%

copy %tempfile% temp-test-plan.json > nul
del %tempfile%

REM Test planini server-agent'a gonder
echo Server'a test plani gonderiliyor...
curl.exe -v -X POST ^
  http://localhost:3002/api/test/run ^
  -H "Content-Type: application/json" ^
  -d @temp-test-plan.json

REM Gecici dosyayi temizle
del temp-test-plan.json

echo.
echo Test tamamlandi.
pause
