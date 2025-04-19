#!/bin/bash

# Gelişmiş testi çalıştır
echo "GitHub Arama ve Doğrulama Testini çalıştırıyor..."
curl -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan-advanced.json
