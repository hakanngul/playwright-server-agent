@echo off
setlocal enabledelayedexpansion

echo Dosya Tabanli Test Raporlarini Goruntuleme
echo =======================================
echo.

REM Bugunun tarihini al
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set day=%%a
    set month=%%b
    set year=%%c
)
set date=%year%-%month%-%day%

REM Eger komut satirindan tarih parametresi verildiyse onu kullan
if not "%~1"=="" set date=%~1

echo Kullanilan tarih: %date%

echo.
echo %date% tarihli raporlar:
echo.

REM Rapor dosyasini kontrol et
set "report_file=..\data\reports\daily\%date%.json"
echo Aranan dosya: %report_file%

if not exist "%report_file%" (
    echo %date% tarihli rapor bulunamadi.
    goto :eof
)

REM Rapor dosyasini oku ve ozetle
type "%report_file%" | findstr /C:"totalTests" /C:"successfulTests" /C:"failedTests" /C:"successRate"
echo.

REM Son 5 testi goster
echo Son 5 test:
echo.
type "%report_file%" | findstr /C:"id" /C:"name" /C:"success" /C:"duration" | findstr /V /C:"steps" /C:"browsers" | findstr /N "." | findstr /B "1: 2: 3: 4: 5: 6: 7: 8: 9: 10: 11: 12: 13: 14: 15: 16: 17: 18: 19: 20:"

echo.
echo Tum raporu gormek icin ..\data\reports\daily\%date%.json dosyasini acin.
echo.
