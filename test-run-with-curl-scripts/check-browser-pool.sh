#!/bin/bash

# Tarayıcı havuzu durumunu kontrol et
echo "Tarayıcı havuzu durumunu kontrol ediliyor..."
curl -s http://localhost:3002/api/browser-pool/stats | jq .

echo -e "\nTarayıcı havuzu durumu başarıyla alındı."
