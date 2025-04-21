# Gelismiş seciciler test planini calistiran PowerShell script
Write-Host "Gelismiş seciciler ve etkilesimler test plani calistiriliyor..." -ForegroundColor Green

# Sunucu port ayari
$serverPort = 3002

# Sunucunun calistigindan emin olun
Write-Host "Sunucunun calistigindan emin olunuyor (http://localhost:$serverPort)..." -ForegroundColor Yellow

# Sunucunun calisip calismadigini kontrol et
try {
    $testConnection = Invoke-WebRequest -Uri "http://localhost:$serverPort/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Sunucu calisiyor!" -ForegroundColor Green
} catch {
    Write-Host "HATA: Sunucu calismiyor veya erisilemez. Lutfen sunucuyu baslattiginizdan emin olun." -ForegroundColor Red
    Write-Host "Sunucuyu baslatmak icin: npm run start" -ForegroundColor Yellow
    Write-Host "Sunucu 3002 portunda calismali. Eger farkli bir portta calisiyorsa, bu script'i guncelleyin." -ForegroundColor Yellow
    exit 1
}

# Test planinin yolu
$testPlanPath = Join-Path -Path $PSScriptRoot -ChildPath "advanced-selectors-test-plan.json"

# Test planinin varligini kontrol et
if (-not (Test-Path -Path $testPlanPath)) {
    Write-Host "HATA: Test plani dosyasi bulunamadi: $testPlanPath" -ForegroundColor Red
    exit 1
}

# Test planini calistir
Write-Host "Test plani calistiriliyor: $testPlanPath" -ForegroundColor Cyan
$testPlanContent = Get-Content -Path $testPlanPath -Raw

# Istegi gonder
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$serverPort/api/test/run" -Method Post -Body $testPlanContent -ContentType "application/json"
    
    # Sonucu goster
    Write-Host "Test istegi gonderildi." -ForegroundColor Green
    Write-Host "Sonuc:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "Test tamamlandi." -ForegroundColor Green
} catch {
    Write-Host "HATA: Test calistirilirken bir sorun olustu:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Sunucunun dogru calistigindan emin olun ve tekrar deneyin." -ForegroundColor Yellow
    exit 1
}
