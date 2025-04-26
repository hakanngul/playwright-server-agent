#!/bin/bash

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Paralel tarayıcı testleri başlatılıyor...${NC}"

# Test planlarını oku
TEST_PLANS=$(cat ./test-plans/parallel-browser-tests.json)

# Paralel test çalıştırma isteği gönder
echo -e "${GREEN}Paralel test çalıştırma isteği gönderiliyor...${NC}"

# MAX_WORKERS ortam değişkeni ile 3 agent kullanarak çalıştır
MAX_WORKERS=3 curl -X POST http://localhost:3002/api/agent/run-parallel \
  -H "Content-Type: application/json" \
  -d "${TEST_PLANS}" \
  | jq .

echo -e "${GREEN}Paralel test çalıştırma isteği tamamlandı.${NC}"
echo -e "${YELLOW}Test sonuçları agent tarafından işleniyor. Sonuçları görmek için:${NC}"
echo -e "${BLUE}curl http://localhost:3002/api/agent/completed-requests | jq .${NC}"

# Tek bir Firefox tam ekran testi çalıştırmak için
echo -e "\n${GREEN}Tek Firefox tam ekran testi başlatılıyor...${NC}"

# Test planını oku
FIREFOX_TEST=$(cat ./test-plans/firefox-fullscreen-test.json)

# Test çalıştırma isteği gönder
echo -e "${GREEN}Firefox tam ekran test isteği gönderiliyor...${NC}"

curl -X POST http://localhost:3002/api/agent/run \
  -H "Content-Type: application/json" \
  -d "${FIREFOX_TEST}" \
  | jq .

echo -e "${GREEN}Firefox tam ekran test isteği tamamlandı.${NC}"
echo -e "${YELLOW}Test sonuçları agent tarafından işleniyor. Sonuçları görmek için:${NC}"
echo -e "${BLUE}curl http://localhost:3002/api/agent/completed-requests | jq .${NC}"
