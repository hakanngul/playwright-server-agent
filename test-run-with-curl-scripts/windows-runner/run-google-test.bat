@echo off
echo Google Arama Testi Calistiriliyor...
echo.

REM Test planini server-agent'a gonder
curl.exe -v -X POST ^
  http://localhost:3002/api/test/run ^
  -H "Content-Type: application/json" ^
  -d @test-plan.json

echo.
echo Test tamamlandi.
pause
