@echo off
echo Google Arama Testini Tum Tarayicilarda Calistirma
echo =============================================
echo.

REM Headless modunu sec
set /p HEADLESS="true"

echo.
echo Chromium tarayicisinda test calistiriliyor...
call run-browser-test.bat chromium %HEADLESS%
echo.

echo Firefox tarayicisinda test calistiriliyor...
call run-browser-test.bat firefox %HEADLESS%
echo.

echo Edge tarayicisinda test calistiriliyor...
call run-browser-test.bat edge %HEADLESS%
echo.

echo Tum testler tamamlandi.
pause
