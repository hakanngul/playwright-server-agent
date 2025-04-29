#!/bin/bash

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kullanım bilgisi
function show_usage {
    echo -e "${BLUE}Test Suite Çalıştırma Aracı${NC}"
    echo -e "Kullanım: $0 [options]"
    echo -e "Seçenekler:"
    echo -e "  -s, --suite SUITE_ID    Çalıştırılacak test suite ID'si"
    echo -e "  -w, --workers NUMBER    Maksimum paralel worker sayısı (varsayılan: suite'teki değer)"
    echo -e "  -h, --headless          Headless modda çalıştır (varsayılan: suite'teki değer)"
    echo -e "  --help                  Bu yardım mesajını göster"
    echo -e "\nÖrnek: $0 -s test-suite -w 3 -h"
}

# Varsayılan değerler
SUITE_ID=""
MAX_WORKERS=""
HEADLESS=""

# Parametreleri işle
while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--suite)
      SUITE_ID="$2"
      shift 2
      ;;
    -w|--workers)
      MAX_WORKERS="$2"
      shift 2
      ;;
    -h|--headless)
      HEADLESS="true"
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Bilinmeyen seçenek: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Suite ID kontrolü
if [ -z "$SUITE_ID" ]; then
    echo -e "${RED}Hata: Test suite ID'si belirtilmedi.${NC}"
    show_usage
    exit 1
fi

# Test suite dosyasını kontrol et
SUITE_FILE="test-plans/${SUITE_ID}.json"
if [ ! -f "$SUITE_FILE" ]; then
    echo -e "${RED}Hata: ${SUITE_FILE} dosyası bulunamadı.${NC}"
    exit 1
fi

echo -e "${GREEN}Test suite çalıştırılıyor: ${SUITE_ID}${NC}"

# Test suite'i oku
TEST_SUITE=$(cat "$SUITE_FILE")

# Test suite bilgilerini çıkar
SUITE_NAME=$(echo "$TEST_SUITE" | jq -r '.name')
SUITE_PARALLEL=$(echo "$TEST_SUITE" | jq -r '.parallelExecution')
SUITE_MAX_WORKERS=$(echo "$TEST_SUITE" | jq -r '.maxWorkers')
SUITE_BROWSER=$(echo "$TEST_SUITE" | jq -r '.defaultBrowserPreference')
SUITE_HEADLESS=$(echo "$TEST_SUITE" | jq -r '.defaultHeadless')

# Parametrelerden gelen değerleri kullan veya suite'ten al
if [ -z "$MAX_WORKERS" ]; then
    MAX_WORKERS=$SUITE_MAX_WORKERS
fi

if [ -z "$HEADLESS" ]; then
    HEADLESS=$SUITE_HEADLESS
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Suite: ${SUITE_NAME}${NC}"
echo -e "${GREEN}Paralel Çalıştırma: ${SUITE_PARALLEL}${NC}"
echo -e "${GREEN}Maksimum Worker: ${MAX_WORKERS}${NC}"
echo -e "${GREEN}Varsayılan Tarayıcı: ${SUITE_BROWSER}${NC}"
echo -e "${GREEN}Headless Mod: ${HEADLESS}${NC}"
echo -e "${BLUE}==================================================${NC}"

# Paralel çalıştırma kontrolü
if [ "$SUITE_PARALLEL" = "true" ]; then
    echo -e "${GREEN}Paralel test çalıştırma isteği gönderiliyor...${NC}"
    
    # MAX_WORKERS ortam değişkeni ile worker sayısını ayarla
    MAX_WORKERS=$MAX_WORKERS curl -X POST http://localhost:3002/api/agent/run-parallel \
      -H "Content-Type: application/json" \
      -d "$TEST_SUITE" \
      | jq .
    
    echo -e "${GREEN}Paralel test çalıştırma isteği tamamlandı.${NC}"
    echo -e "${YELLOW}Test sonuçları agent tarafından işleniyor. Sonuçları görmek için:${NC}"
    echo -e "${BLUE}curl http://localhost:3002/api/agent/completed-requests | jq .${NC}"
else
    echo -e "${GREEN}Sıralı test çalıştırma başlatılıyor...${NC}"
    
    # Test planlarını tek tek çalıştır
    TEST_PLANS=$(echo "$TEST_SUITE" | jq -c '.testPlans[]')
    
    for TEST_PLAN in $TEST_PLANS; do
        TEST_NAME=$(echo "$TEST_PLAN" | jq -r '.name')
        echo -e "${YELLOW}Test çalıştırılıyor: ${TEST_NAME}${NC}"
        
        # Headless değerini ayarla
        TEST_PLAN=$(echo "$TEST_PLAN" | jq ".headless = $HEADLESS")
        
        # Test planını çalıştır
        curl -s -X POST http://localhost:3002/api/agent/test-run \
          -H "Content-Type: application/json" \
          -d "$TEST_PLAN" \
          | jq .
        
        echo -e "${GREEN}Test tamamlandı: ${TEST_NAME}${NC}"
        echo -e "${BLUE}--------------------------------------------------${NC}"
    done
    
    echo -e "${GREEN}Tüm testler tamamlandı.${NC}"
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test suite çalıştırma işlemi tamamlandı.${NC}"
echo -e "${BLUE}==================================================${NC}"
