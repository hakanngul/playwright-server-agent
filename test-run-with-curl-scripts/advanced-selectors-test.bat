@echo off
chcp 65001 >nul
echo Gelismiş seciciler ve etkilesimler test plani calistiriliyor...

REM Sunucu port ayari
set SERVER_PORT=3002

echo Sunucunun calistigindan emin olun (http://localhost:%SERVER_PORT%)

REM Sunucunun calisip calismadigini kontrol et
curl -s -o nul -I -w "%%{http_code}" http://localhost:%SERVER_PORT%/api/health > temp.txt
set /p HTTP_CODE=<temp.txt
del temp.txt

if not "%HTTP_CODE%"=="200" (
    echo HATA: Sunucu calismiyor veya erisilemez. Lutfen sunucuyu baslattiginizdan emin olun.
    echo Sunucuyu baslatmak icin: npm run start
    echo Sunucu %SERVER_PORT% portunda calismali. Eger farkli bir portta calisiyorsa, bu script'i guncelleyin.
    pause
    exit /b 1
)

echo Sunucu calisiyor!

REM Test planini calistir
echo Test plani calistiriliyor...
curl -X POST -H "Content-Type: application/json" -d @advanced-selectors-test-plan.json http://localhost:%SERVER_PORT%/api/test/run

echo.
echo Test istegi gonderildi. Sonuclari kontrol edin.
pause
