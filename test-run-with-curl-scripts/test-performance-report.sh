#!/bin/bash

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Performans Raporlama Testi${NC}"
echo -e "${BLUE}==================================================${NC}"

# Parametreleri kontrol et
BROWSER=${1:-"chromium"}
HEADLESS=${2:-"true"}

echo -e "${GREEN}Tarayıcı: ${BROWSER}${NC}"
echo -e "${GREEN}Headless: ${HEADLESS}${NC}"

# Test planı dosyası
TEST_PLAN_FILE="./test-plans/performance-test-plan.json"

# Test planı yoksa oluştur
if [ ! -f "$TEST_PLAN_FILE" ]; then
  echo -e "${YELLOW}Test planı bulunamadı, oluşturuluyor...${NC}"

  mkdir -p ./test-plans

  cat > "$TEST_PLAN_FILE" << EOF
{
  "name": "Performans Test Planı",
  "description": "Web Vitals ve performans metriklerini test etmek için örnek test planı",
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
    },
    {
      "action": "type",
      "selector": "input[name='fname']",
      "value": "Test Kullanıcı",
      "description": "İsim alanını doldur"
    },
    {
      "action": "type",
      "selector": "input[name='lname']",
      "value": "Performans Test",
      "description": "Soyisim alanını doldur"
    },
    {
      "action": "click",
      "selector": "input[type='submit']",
      "description": "Formu gönder"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "form-sonuc",
      "description": "Ekran görüntüsü al"
    }
  ]
}
EOF

  echo -e "${GREEN}Test planı oluşturuldu: ${TEST_PLAN_FILE}${NC}"
fi

# Test planını çalıştır
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test çalıştırılıyor...${NC}"
echo -e "${BLUE}==================================================${NC}"

# API'ye istek gönder
RESPONSE=$(curl -s -X POST \
  http://localhost:3002/api/agent/test-run \
  -H 'Content-Type: application/json' \
  -d @"$TEST_PLAN_FILE")

# Yanıtı debug için yazdır
echo -e "${YELLOW}API Yanıtı:${NC}"
echo "$RESPONSE" | jq .

# Test sonucunu kontrol et
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test başarıyla tamamlandı.${NC}"

  # Test ID'sini al (farklı formatları dene)
  TEST_ID=$(echo $RESPONSE | jq -r '.requestId // .id // .reportId // empty')

  if [ -n "$TEST_ID" ]; then
    echo -e "${GREEN}Test ID: ${TEST_ID}${NC}"

    # Test durumunu görüntüle
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}Test durumu alınıyor...${NC}"
    echo -e "${BLUE}==================================================${NC}"

    curl -s http://localhost:3002/api/agent/test-status/${TEST_ID} | jq .

    # Sistem durumunu görüntüle
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}Sistem durumu alınıyor...${NC}"
    echo -e "${BLUE}==================================================${NC}"

    curl -s http://localhost:3002/api/agent/system-metrics | jq .

    # Tamamlanan testleri görüntüle
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}Tamamlanan testler alınıyor...${NC}"
    echo -e "${BLUE}==================================================${NC}"

    curl -s http://localhost:3002/api/agent/completed-requests | jq .

    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}Test raporları sayfasını açabilirsiniz:${NC}"
    echo -e "${YELLOW}http://localhost:3002/reports.html${NC}"
    echo -e "${BLUE}==================================================${NC}"
  else
    echo -e "${RED}Test ID alınamadı.${NC}"
  fi
else
  echo -e "${RED}Test çalıştırılırken hata oluştu.${NC}"
  echo $RESPONSE
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test tamamlandı.${NC}"
echo -e "${BLUE}==================================================${NC}"
