#!/bin/bash

# Sabit değerler
SERVER_URL="http://localhost:3002/api/agent/test-run"
HEADLESS=true
TEST_PLANS_DIR="test-plans"
BROWSERS=("chromium" "firefox" "edge")
DEFAULT_BROWSER="chromium"

# Renkli çıktı için ANSI renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kullanım bilgilerini göster
function show_usage {
  echo "Kullanım: $0 [seçenekler]"
  echo "Seçenekler:"
  echo "  -b, --browser BROWSER    Tarayıcı belirt (chromium, firefox, edge, all) [varsayılan: chromium]"
  echo "  -f, --filter PATTERN     Test planlarını filtrelemek için desen (örn: 'basic|advanced')"
  echo "  --help                   Bu yardım mesajını göster"
  echo ""
  echo "Örnek: $0 -b all                  # Tüm tarayıcılarda tüm testleri çalıştır"
  echo "       $0 -b firefox -f basic     # Firefox'ta sadece 'basic' içeren test planlarını çalıştır"
}

# Komut satırı argümanlarını ayrıştır
BROWSER="$DEFAULT_BROWSER"
FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--browser)
      BROWSER="$2"
      shift 2
      ;;
    -f|--filter)
      FILTER="$2"
      shift 2
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Bilinmeyen seçenek: $1${NC}"
      show_usage
      exit 1
      ;;
  esac
done

# Tarayıcıyı doğrula
if [[ "$BROWSER" != "chromium" && "$BROWSER" != "firefox" && "$BROWSER" != "edge" && "$BROWSER" != "all" ]]; then
  echo -e "${RED}Hata: Geçersiz tarayıcı '$BROWSER'. Şunlardan biri olmalı: chromium, firefox, edge, all${NC}"
  exit 1
fi

# Test planlarını çalıştır
function run_test_plan {
  local browser=$1
  local test_plan=$2
  local test_plan_name=$(basename "$test_plan")

  echo -e "${BLUE}==================================================${NC}"
  echo -e "${GREEN}Test Planı Çalıştırılıyor: ${test_plan_name}${NC}"
  echo -e "${GREEN}Tarayıcı: ${browser}${NC}"
  echo -e "${GREEN}Headless: ${HEADLESS}${NC}"
  echo -e "${BLUE}==================================================${NC}"

  # Firefox için uyarı göster
  if [[ "$browser" == "firefox" ]]; then
    echo -e "${YELLOW}UYARI: Firefox tarayıcısı için tam ekran modu devre dışı bırakıldı. Normal pencere boyutunda çalışacak.${NC}"
  fi

  # Geçici dosya oluştur
  TEMP_FILE=$(mktemp)

  # Test planını oku ve tarayıcı ve headless ayarlarını güncelle
  cat "$test_plan" | sed "s/\"browserPreference\": \"[^\"]*\"/\"browserPreference\": \"$browser\"/" | \
    sed "s/\"headless\": [^,}]*/\"headless\": $HEADLESS/" > "$TEMP_FILE"

  # Test planını sunucuya gönder
  echo -e "${BLUE}Test planı sunucuya gönderiliyor...${NC}"
  RESPONSE=$(curl -s -X POST \
    "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_FILE")

  # Geçici dosyayı temizle
  rm "$TEMP_FILE"

  # Extract request ID from response
  REQUEST_ID=$(echo $RESPONSE | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$REQUEST_ID" ]; then
    echo -e "${GREEN}Test isteği gönderildi, ID: $REQUEST_ID${NC}"
  else
    echo -e "${RED}Hata: Yanıttan istek ID'si alınamadı${NC}"
    echo -e "${YELLOW}Yanıt: $RESPONSE${NC}"
  fi

  echo ""
  echo -e "${GREEN}Test yürütme isteği gönderildi. Sonuçlar için sunucu loglarını kontrol edin.${NC}"
  echo -e "${BLUE}Test durumunu görüntülemek için: curl http://localhost:3002/api/agent/test-status/$REQUEST_ID${NC}"
  echo -e "${BLUE}Tamamlanan testleri görüntülemek için: curl http://localhost:3002/api/agent/completed-requests${NC}"
  echo -e "${BLUE}Raporları görüntülemek için: http://localhost:3002/reports.html${NC}"
  echo ""

  # Testler arasında kısa bir bekleme süresi
  echo -e "${YELLOW}Bir sonraki teste geçmeden önce 3 saniye bekleniyor...${NC}"
  sleep 3
}

# Test planlarını bul
if [[ -n "$FILTER" ]]; then
  TEST_PLANS=$(find "$TEST_PLANS_DIR" -name "*.json" | grep -E "$FILTER")
else
  TEST_PLANS=$(find "$TEST_PLANS_DIR" -name "*.json")
fi

# Test planı sayısını kontrol et
TEST_PLAN_COUNT=$(echo "$TEST_PLANS" | wc -l)
if [[ "$TEST_PLAN_COUNT" -eq 0 ]]; then
  echo -e "${RED}Hata: Hiç test planı bulunamadı.${NC}"
  exit 1
fi

echo -e "${GREEN}Toplam ${TEST_PLAN_COUNT} test planı bulundu.${NC}"

# Tüm tarayıcılar için mi yoksa belirli bir tarayıcı için mi çalıştırılacak?
if [[ "$BROWSER" == "all" ]]; then
  # Tüm tarayıcılar için çalıştır
  for browser in "${BROWSERS[@]}"; do
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}${browser} tarayıcısında testler çalıştırılıyor...${NC}"
    echo -e "${BLUE}==================================================${NC}"

    for test_plan in $TEST_PLANS; do
      run_test_plan "$browser" "$test_plan"
    done
  done
else
  # Belirli bir tarayıcı için çalıştır
  for test_plan in $TEST_PLANS; do
    run_test_plan "$BROWSER" "$test_plan"
  done
fi

echo -e "${GREEN}Tüm testler tamamlandı!${NC}"
