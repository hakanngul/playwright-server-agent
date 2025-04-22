@echo off
setlocal enabledelayedexpansion

echo =================================================
echo Performans Raporlama Testi
echo =================================================
echo.

REM Parametreleri kontrol et
set BROWSER=%1
if "%BROWSER%"=="" set BROWSER=chromium

set HEADLESS=%2
if "%HEADLESS%"=="" set HEADLESS=true

echo Tarayici: %BROWSER%
echo Headless: %HEADLESS%
echo.

REM Test plani dosyasi
set TEST_PLAN_FILE=..\test-plans\performance-test-plan.json

REM Test plani yoksa olustur
if not exist "%TEST_PLAN_FILE%" (
    echo Test plani bulunamadi, olusturuluyor...

    if not exist "..\test-plans" mkdir "..\test-plans"

    echo {> "%TEST_PLAN_FILE%"
    echo   "name": "Performans Test Plani",>> "%TEST_PLAN_FILE%"
    echo   "description": "Web Vitals ve performans metriklerini test etmek icin ornek test plani",>> "%TEST_PLAN_FILE%"
    echo   "browser": "%BROWSER%",>> "%TEST_PLAN_FILE%"
    echo   "headless": %HEADLESS%,>> "%TEST_PLAN_FILE%"
    echo   "steps": [>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "navigate",>> "%TEST_PLAN_FILE%"
    echo       "value": "https://only-testing-blog.blogspot.com/",>> "%TEST_PLAN_FILE%"
    echo       "description": "Test sayfasina git">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "wait",>> "%TEST_PLAN_FILE%"
    echo       "value": "2000",>> "%TEST_PLAN_FILE%"
    echo       "description": "2 saniye bekle">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "takeScreenshot",>> "%TEST_PLAN_FILE%"
    echo       "value": "anasayfa",>> "%TEST_PLAN_FILE%"
    echo       "description": "Ekran goruntusu al">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "click",>> "%TEST_PLAN_FILE%"
    echo       "selector": "a[href='https://only-testing-blog.blogspot.com/2014/01/textbox.html']",>> "%TEST_PLAN_FILE%"
    echo       "description": "Textbox sayfasina git">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "wait",>> "%TEST_PLAN_FILE%"
    echo       "value": "2000",>> "%TEST_PLAN_FILE%"
    echo       "description": "2 saniye bekle">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "takeScreenshot",>> "%TEST_PLAN_FILE%"
    echo       "value": "textbox-sayfasi",>> "%TEST_PLAN_FILE%"
    echo       "description": "Ekran goruntusu al">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "type",>> "%TEST_PLAN_FILE%"
    echo       "selector": "input[name='fname']",>> "%TEST_PLAN_FILE%"
    echo       "value": "Test Kullanici",>> "%TEST_PLAN_FILE%"
    echo       "description": "Isim alanini doldur">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "type",>> "%TEST_PLAN_FILE%"
    echo       "selector": "input[name='lname']",>> "%TEST_PLAN_FILE%"
    echo       "value": "Performans Test",>> "%TEST_PLAN_FILE%"
    echo       "description": "Soyisim alanini doldur">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "click",>> "%TEST_PLAN_FILE%"
    echo       "selector": "input[type='submit']",>> "%TEST_PLAN_FILE%"
    echo       "description": "Formu gonder">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "wait",>> "%TEST_PLAN_FILE%"
    echo       "value": "2000",>> "%TEST_PLAN_FILE%"
    echo       "description": "2 saniye bekle">> "%TEST_PLAN_FILE%"
    echo     },>> "%TEST_PLAN_FILE%"
    echo     {>> "%TEST_PLAN_FILE%"
    echo       "action": "takeScreenshot",>> "%TEST_PLAN_FILE%"
    echo       "value": "form-sonuc",>> "%TEST_PLAN_FILE%"
    echo       "description": "Ekran goruntusu al">> "%TEST_PLAN_FILE%"
    echo     }>> "%TEST_PLAN_FILE%"
    echo   ]>> "%TEST_PLAN_FILE%"
    echo }>> "%TEST_PLAN_FILE%"

    echo Test plani olusturuldu: %TEST_PLAN_FILE%
    echo.
)

REM Test planini calistir
echo =================================================
echo Test calistiriliyor...
echo =================================================
echo.

REM API'ye istek gonder
curl -s -X POST ^
  http://localhost:3002/api/test/run ^
  -H "Content-Type: application/json" ^
  -d @"%TEST_PLAN_FILE%" > test_response.json

REM Yaniti debug icin yazdir
echo API Yaniti:
type test_response.json
echo.

REM Test sonucunu kontrol et
if %ERRORLEVEL% EQU 0 (
    echo Test basariyla tamamlandi.

    REM Test ID'sini al (farkli yontemler dene)
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"id\":" test_response.json') do (
        set TEST_ID=%%a
        set TEST_ID=!TEST_ID:"=!
        set TEST_ID=!TEST_ID: =!
    )

    REM ID bulunamadiysa reportId'yi dene
    if not defined TEST_ID (
        for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"reportId\":" test_response.json') do (
            set TEST_ID=%%a
            set TEST_ID=!TEST_ID:"=!
            set TEST_ID=!TEST_ID: =!
        )
    )

    if defined TEST_ID (
        echo Test ID: !TEST_ID!

        REM Performans raporunu goruntule
        echo =================================================
        echo Performans raporu aliniyor...
        echo =================================================
        echo.

        curl -s http://localhost:3002/api/results/!TEST_ID!/performance > performance_report.json
        type performance_report.json
        echo.

        REM Web Vitals metriklerini goruntule
        echo =================================================
        echo Web Vitals metrikleri aliniyor...
        echo =================================================
        echo.

        curl -s http://localhost:3002/api/results/!TEST_ID!/web-vitals > web_vitals.json
        type web_vitals.json
        echo.

        REM Ag metriklerini goruntule
        echo =================================================
        echo Ag metrikleri aliniyor...
        echo =================================================
        echo.

        curl -s http://localhost:3002/api/results/!TEST_ID!/network-metrics > network_metrics.json
        type network_metrics.json
        echo.

        REM Trend raporunu goruntule
        echo =================================================
        echo Trend raporu aliniyor...
        echo =================================================
        echo.

        curl -s http://localhost:3002/api/performance/trend/Performans%%20Test%%20Plani > trend_report.json
        type trend_report.json
        echo.

        REM Optimizasyon onerilerini goruntule
        echo =================================================
        echo Optimizasyon onerileri aliniyor...
        echo =================================================
        echo.

        curl -s http://localhost:3002/api/results/!TEST_ID!/optimization-recommendations > optimization_recommendations.json
        type optimization_recommendations.json
        echo.
    ) else (
        echo Test ID alinamadi.
    )
) else (
    echo Test calistirilirken hata olustu.
    type test_response.json
)

echo =================================================
echo Test tamamlandi.
echo =================================================

REM Gecici dosyalari temizle
del test_response.json 2>nul
del performance_report.json 2>nul
del web_vitals.json 2>nul
del network_metrics.json 2>nul
del trend_report.json 2>nul
del optimization_recommendations.json 2>nul

pause
