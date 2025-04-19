#!/bin/bash

# Chromium testini çalıştır
echo "Chromium testini çalıştırıyor..."
curl -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan.json

echo -e "\n\n"
echo "5 saniye bekleniyor..."
sleep 5

# Firefox testini çalıştır
echo "Firefox testini çalıştırıyor..."
curl -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan-firefox.json

echo -e "\n\n"
echo "5 saniye bekleniyor..."
sleep 5

# WebKit testini çalıştır
echo "WebKit testini çalıştırıyor..."
curl -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan-webkit.json
