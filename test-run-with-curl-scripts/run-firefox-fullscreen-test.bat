@echo off
setlocal enabledelayedexpansion

echo Firefox Tam Ekran Testi Çalıştırılıyor...
echo =============================================
echo.

REM Test planını server-agent'a gönder
echo Server'a Firefox tam ekran test planı gönderiliyor...
curl.exe -v -X POST ^
  http://localhost:3002/api/test/run ^
  -H "Content-Type: application/json" ^
  -d @firefox-fullscreen-test.json

echo.
echo Test tamamlandı.
pause
