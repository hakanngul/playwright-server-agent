#!/bin/bash

# Gelişmiş seçiciler test planını çalıştıran script
echo "Gelişmiş seçiciler ve etkileşimler test planı çalıştırılıyor..."

# Sunucunun çalıştığından emin olun
echo "Sunucunun çalıştığından emin olun (http://localhost:3000)"

# Test planını çalıştır
curl -X POST -H "Content-Type: application/json" -d @test-run-with-curl-scripts/advanced-selectors-test-plan.json http://localhost:3000/api/test/run

echo ""
echo "Test isteği gönderildi. Sonuçları kontrol edin."
