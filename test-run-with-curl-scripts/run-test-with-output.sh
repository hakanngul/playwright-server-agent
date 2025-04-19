#!/bin/bash

# Test planını server-agent'a gönder ve sonucu bir değişkene kaydet
echo "Test çalıştırılıyor..."
RESPONSE=$(curl -s -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan.json)

# Sonucu ekrana yazdır
echo "Test sonucu:"
echo $RESPONSE | jq .

# Ekran görüntüsü URL'lerini çıkar ve ekrana yazdır
echo -e "\nEkran görüntüleri:"
echo $RESPONSE | jq -r '.steps[] | select(.screenshot != null) | "http://localhost:3002/screenshots/\(.screenshot)"'
