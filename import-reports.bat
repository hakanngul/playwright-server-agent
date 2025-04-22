@echo off
echo Raporlari Veritabanina Aktarma Araci
echo ================================
echo.

if "%1"=="" (
    echo Komut belirtilmedi. Kullanim:
    echo   import-reports.bat all                  - Tum raporlari ice aktar
    echo   import-reports.bat date 2025-04-22      - Belirli bir gunun raporlarini ice aktar
    exit /b 1
)

if "%1"=="all" (
    echo Tum raporlar ice aktariliyor...
    node import-reports.js all
) else if "%1"=="date" (
    if "%2"=="" (
        echo Tarih belirtilmedi. Kullanim:
        echo   import-reports.bat date 2025-04-22
        exit /b 1
    )
    
    echo %2 tarihli raporlar ice aktariliyor...
    node import-reports.js date %2
) else (
    echo Bilinmeyen komut: %1
    echo Kullanim:
    echo   import-reports.bat all                  - Tum raporlari ice aktar
    echo   import-reports.bat date 2025-04-22      - Belirli bir gunun raporlarini ice aktar
    exit /b 1
)

echo.
echo Islem tamamlandi.
