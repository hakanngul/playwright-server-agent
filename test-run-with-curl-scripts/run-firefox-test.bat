@echo off
setlocal enabledelayedexpansion

echo Firefox tarayıcısında Google Arama Testi çalıştırılıyor...
echo Headless modu: false (görünür tarayıcı)
echo.

REM Test planını server-agent'a gönder
echo Server'a Firefox test planı gönderiliyor...
curl.exe -v -X POST ^
  http://localhost:3002/api/test/run ^
  -H "Content-Type: application/json" ^
  -d @firefox-test-plan.json

echo.
echo Test tamamlandı.
pause
