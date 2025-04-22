@echo off
setlocal enabledelayedexpansion

echo Test Raporlari Goruntuleme Araci
echo ==============================
echo.

REM Komut satiri parametresi kontrol et
if "%~1"=="" (
    REM Parametre yoksa tum raporlari goster
    call :view_today_reports
    call :view_last_7_days
    call :view_api_reports
) else if "%~1"=="today" (
    call :view_today_reports
) else if "%~1"=="last7" (
    call :view_last_7_days
) else if "%~1"=="api" (
    call :view_api_reports
) else (
    REM Parametre varsa o tarihin raporlarini goster
    call :view_reports_for_date %~1
)

:view_today_reports
echo.
echo Bugunun Raporlari
echo ----------------

REM Bugunun tarihini al
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set day=%%a
    set month=%%b
    set year=%%c
)
set today=%year%-%month%-%day%

call :view_reports_for_date %today%
echo.
goto :eof

:view_specific_day
echo.
echo Belirli Bir Gunun Raporlari
echo -------------------------
REM Bu fonksiyon artik kullanilmiyor
REM Dogrudan view_reports_for_date fonksiyonunu cagirin
set date="2025-04-22"

call :view_reports_for_date %date%
echo.
goto :eof

:view_reports_for_date
echo.
echo %~1 tarihli raporlar:
echo.

REM Rapor dosyasini kontrol et
set "report_file=..\data\reports\daily\%~1.json"

if not exist "%report_file%" (
    echo %~1 tarihli rapor bulunamadi.
    goto :eof
)

REM Rapor dosyasini oku ve ozetle
type "%report_file%" | findstr /C:"totalTests" /C:"successfulTests" /C:"failedTests" /C:"successRate" /C:"averageDuration"
echo.

REM Son 5 testi goster
echo Son 5 test:
echo.
type "%report_file%" | findstr /C:"id" /C:"name" /C:"success" /C:"duration" | findstr /V /C:"steps" /C:"browsers" | findstr /N "." | findstr /B "1: 2: 3: 4: 5: 6: 7: 8: 9: 10: 11: 12: 13: 14: 15: 16: 17: 18: 19: 20:"

echo.
echo Tum raporu gormek icin ..\data\reports\daily\%~1.json dosyasini acin.
goto :eof

:view_last_7_days
echo.
echo Son 7 Gunun Ozet Istatistikleri
echo -----------------------------

REM Son 7 gunun tarihlerini hesapla
for /l %%i in (0,1,6) do (
    set /a "days_ago=%%i"
    call :get_date_days_ago !days_ago!
    call :show_day_summary !date_result!
)

echo.
goto :eof

:get_date_days_ago
REM Bu fonksiyon Windows'ta karmasik, basit bir yaklasim kullaniyoruz
REM Gercek uygulamada daha dogru bir tarih hesaplama kullanilmalidir
set /a day_num=%1
if %day_num%==0 (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
        set day=%%a
        set month=%%b
        set year=%%c
    )
) else if %day_num%==1 (
    set day=21
    set month=04
    set year=2025
) else if %day_num%==2 (
    set day=20
    set month=04
    set year=2025
) else if %day_num%==3 (
    set day=19
    set month=04
    set year=2025
) else if %day_num%==4 (
    set day=18
    set month=04
    set year=2025
) else if %day_num%==5 (
    set day=17
    set month=04
    set year=2025
) else if %day_num%==6 (
    set day=16
    set month=04
    set year=2025
)

set date_result=%year%-%month%-%day%
goto :eof

:show_day_summary
set "report_file=..\data\reports\daily\%~1.json"

if exist "%report_file%" (
    echo %~1:
    type "%report_file%" | findstr /C:"totalTests" /C:"successfulTests" /C:"failedTests" /C:"successRate"
    echo.
) else (
    echo %~1: Rapor bulunamadi.
    echo.
)
goto :eof

:view_api_reports
echo.
echo API'den Son Raporlar (Veritabani)
echo ------------------------------

echo Son 5 test sonucunu getiriliyor...
curl.exe -s http://localhost:3002/api/results/recent?limit=5

echo.
echo.
echo Test istatistiklerini getiriliyor...
curl.exe -s http://localhost:3002/api/results/stats

echo.
echo.
goto :eof
