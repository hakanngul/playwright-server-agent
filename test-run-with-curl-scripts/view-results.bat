@echo off
echo Test Sonuclarini Goruntuleme
echo ==========================
echo.

echo Son 5 test sonucunu getiriliyor...
curl.exe -s http://localhost:3002/api/results/recent?limit=5

echo.
echo.
echo Test istatistiklerini getiriliyor...
curl.exe -s http://localhost:3002/api/results/stats

echo.
echo.
pause
