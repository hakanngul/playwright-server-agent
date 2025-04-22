#!/bin/bash

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Browser Pool Testi${NC}"
echo -e "${BLUE}==================================================${NC}"

# Parametreleri kontrol et
BROWSER=${1:-"chromium"}
HEADLESS=${2:-"false"}

echo -e "${GREEN}Tarayıcı: ${BROWSER}${NC}"
echo -e "${GREEN}Headless: ${HEADLESS}${NC}"

# Browser pool istatistiklerini al
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Browser Pool İstatistikleri${NC}"
echo -e "${BLUE}==================================================${NC}"

curl -s http://localhost:3002/api/browser-pool/stats | jq .

# Test planı dosyası
TEST_PLAN_FILE="./test-plans/browser-pool-test-plan.json"

# Test planı yoksa oluştur
if [ ! -f "$TEST_PLAN_FILE" ]; then
  echo -e "${YELLOW}Test planı bulunamadı, oluşturuluyor...${NC}"

  mkdir -p ./test-plans

  cat > "$TEST_PLAN_FILE" << EOF
{
  "name": "Browser Pool Test Planı",
  "description": "Browser Pool'u test etmek için örnek test planı",
  "browser": "${BROWSER}",
  "headless": ${HEADLESS},
  "steps": [
    {
      "action": "navigate",
      "value": "https://only-testing-blog.blogspot.com/",
      "description": "Test sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "anasayfa",
      "description": "Ekran görüntüsü al"
    },
    {
      "action": "click",
      "selector": "a[href='https://only-testing-blog.blogspot.com/2014/01/textbox.html']",
      "description": "Textbox sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "textbox-sayfasi",
      "description": "Ekran görüntüsü al"
    }
  ]
}
EOF

  echo -e "${GREEN}Test planı oluşturuldu: ${TEST_PLAN_FILE}${NC}"
fi

# Paralel test çalıştırma
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Paralel Test Çalıştırma${NC}"
echo -e "${BLUE}==================================================${NC}"

# Farklı tarayıcılarla paralel test çalıştırma
echo -e "${GREEN}Chromium testi başlatılıyor...${NC}"
cat > "./test-plans/chromium-test.json" << EOF
{
  "name": "Chromium Test Planı",
  "browser": "chromium",
  "headless": ${HEADLESS},
  "steps": $(cat "$TEST_PLAN_FILE" | jq '.steps')
}
EOF
curl -s -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @"./test-plans/chromium-test.json" > "test_response_chromium.json" &

echo -e "${GREEN}Firefox testi başlatılıyor...${NC}"
cat > "./test-plans/firefox-test.json" << EOF
{
  "name": "Firefox Test Planı",
  "browser": "firefox",
  "headless": ${HEADLESS},
  "steps": $(cat "$TEST_PLAN_FILE" | jq '.steps')
}
EOF
curl -s -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @"./test-plans/firefox-test.json" > "test_response_firefox.json" &

echo -e "${GREEN}Edge testi başlatılıyor...${NC}"
cat > "./test-plans/edge-test.json" << EOF
{
  "name": "Edge Test Planı",
  "browser": "edge",
  "headless": ${HEADLESS},
  "steps": $(cat "$TEST_PLAN_FILE" | jq '.steps')
}
EOF
curl -s -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @"./test-plans/edge-test.json" > "test_response_edge.json" &

# Tüm testlerin tamamlanmasını bekle
echo -e "${YELLOW}Tüm testlerin tamamlanması bekleniyor...${NC}"
wait

# Test sonuçlarını göster
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Chromium Test Sonucu${NC}"
echo -e "${BLUE}==================================================${NC}"
cat "test_response_chromium.json" | jq '.success, .reportId'
rm "test_response_chromium.json"

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Firefox Test Sonucu${NC}"
echo -e "${BLUE}==================================================${NC}"
cat "test_response_firefox.json" | jq '.success, .reportId'
rm "test_response_firefox.json"

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Edge Test Sonucu${NC}"
echo -e "${BLUE}==================================================${NC}"
cat "test_response_edge.json" | jq '.success, .reportId'
rm "test_response_edge.json"

# Browser pool istatistiklerini tekrar al
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Sonrası Browser Pool İstatistikleri${NC}"
echo -e "${BLUE}==================================================${NC}"

curl -s http://localhost:3002/api/browser-pool/stats | jq .

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test tamamlandı.${NC}"
echo -e "${BLUE}==================================================${NC}"
