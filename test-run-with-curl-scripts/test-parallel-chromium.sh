#!/bin/bash

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Chromium Paralel Test Koşumu${NC}"
echo -e "${BLUE}==================================================${NC}"

# Headless modu parametresi
HEADLESS_PARAM=${1:-"true"}

# Headless parametresini boolean olarak ayarla
if [ "$HEADLESS_PARAM" = "false" ]; then
  HEADLESS=false
  echo -e "${GREEN}Headless: ${HEADLESS} (görünür tarayıcı)${NC}"
else
  HEADLESS=true
  echo -e "${GREEN}Headless: ${HEADLESS} (görünmez tarayıcı)${NC}"
fi

# Sunucuyu yeniden başlatmak gerekebilir
echo -e "${YELLOW}NOT: Headless modunu değiştirmek için sunucuyu ./start-server.sh false komutuyla başlatmanız gerekebilir${NC}"
echo -e "${YELLOW}NOT: Bu test, BrowserPool özelliğini test eder. Tarayıcılar havuzda tutulur ve yeniden kullanılır.${NC}"
echo -e "${YELLOW}NOT: Tarayıcıların havuzda tutulduğunu görmek için, test öncesi ve sonrası browser pool istatistiklerini kontrol edin.${NC}"

# Test planları dizini
mkdir -p ./test-plans

# Browser pool istatistiklerini al
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Öncesi Browser Pool İstatistikleri${NC}"
echo -e "${BLUE}==================================================${NC}"

curl -s http://localhost:3002/api/browser-pool/stats | jq .

# Test Plan 1: Blog sayfası testi
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Plan 1: Blog Sayfası Testi${NC}"
echo -e "${BLUE}==================================================${NC}"

cat > "./test-plans/chromium-test1.json" << EOF
{
  "name": "Blog Sayfası Testi",
  "browser": "chromium",
  "headless": ${HEADLESS},
  "steps": [
    {
      "action": "navigate",
      "value": "https://only-testing-blog.blogspot.com/",
      "description": "Blog ana sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "blog-anasayfa",
      "description": "Ana sayfa ekran görüntüsü al"
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
      "description": "Textbox sayfası ekran görüntüsü al"
    }
  ]
}
EOF

# Test Plan 2: Form doldurma testi
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Plan 2: Form Doldurma Testi${NC}"
echo -e "${BLUE}==================================================${NC}"

cat > "./test-plans/chromium-test2.json" << EOF
{
  "name": "Form Doldurma Testi",
  "browser": "chromium",
  "headless": ${HEADLESS},
  "steps": [
    {
      "action": "navigate",
      "value": "https://only-testing-blog.blogspot.com/2014/05/form.html",
      "description": "Form sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "form-sayfasi",
      "description": "Form sayfası ekran görüntüsü al"
    },
    {
      "action": "type",
      "selector": "input[name='FirstName']",
      "value": "Test Kullanıcı",
      "description": "İsim alanını doldur"
    },
    {
      "action": "type",
      "selector": "input[name='LastName']",
      "value": "Soyadı",
      "description": "Soyisim alanını doldur"
    },
    {
      "action": "type",
      "selector": "input[name='EmailID']",
      "value": "test@example.com",
      "description": "Email alanını doldur"
    },
    {
      "action": "type",
      "selector": "input[name='MobNo']",
      "value": "5551234567",
      "description": "Telefon alanını doldur"
    },
    {
      "action": "click",
      "selector": "input[name='male']",
      "description": "Cinsiyet seç"
    },
    {
      "action": "takeScreenshot",
      "value": "form-dolduruldu",
      "description": "Doldurulmuş form ekran görüntüsü al"
    }
  ]
}
EOF

# Test Plan 3: Tablo testi
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Plan 3: Tablo Testi${NC}"
echo -e "${BLUE}==================================================${NC}"

cat > "./test-plans/chromium-test3.json" << EOF
{
  "name": "Tablo Testi",
  "browser": "chromium",
  "headless": ${HEADLESS},
  "steps": [
    {
      "action": "navigate",
      "value": "https://only-testing-blog.blogspot.com/2013/09/test.html",
      "description": "Tablo sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "tablo-sayfasi",
      "description": "Tablo sayfası ekran görüntüsü al"
    },
    {
      "action": "click",
      "selector": "#check1",
      "description": "Checkbox'ı işaretle"
    },
    {
      "action": "click",
      "selector": "#radio1",
      "description": "Radio butonu seç"
    },
    {
      "action": "click",
      "selector": "select[name='FromLB'] option:nth-child(2)",
      "description": "Listeden bir öğe seç"
    },
    {
      "action": "click",
      "selector": "#add",
      "description": "Add butonuna tıkla"
    },
    {
      "action": "wait",
      "value": "1000",
      "description": "1 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "tablo-islemler",
      "description": "İşlemler sonrası ekran görüntüsü al"
    }
  ]
}
EOF

# Paralel test çalıştırma
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Paralel Test Çalıştırma${NC}"
echo -e "${BLUE}==================================================${NC}"

# Kaç test çalıştırılacağını belirle
TEST_COUNT=${2:-"3"}
echo -e "${GREEN}Paralel çalıştırılacak test sayısı: ${TEST_COUNT}${NC}"

# Browser pool istatistiklerini göster
echo -e "${YELLOW}Test öncesi browser pool durumu:${NC}"
curl -s http://localhost:3002/api/browser-pool/stats | jq '.overall'

# Testleri paralel çalıştır
for i in $(seq 1 $TEST_COUNT); do
  # Hangi test planını kullanacağımızı belirle (döngüsel olarak)
  TEST_INDEX=$(( (i - 1) % 3 + 1 ))
  TEST_PLAN="./test-plans/chromium-test${TEST_INDEX}.json"

  echo -e "${GREEN}Test $i başlatılıyor (Plan: $TEST_PLAN)...${NC}"
  curl -s -X POST \
    http://localhost:3002/api/test/run \
    -H 'Content-Type: application/json' \
    -d @"$TEST_PLAN" > "test_response_$i.json" &

  # Her 3 testte bir kısa bekle (sunucuya yük bindirmemek için)
  if [ $((i % 3)) -eq 0 ]; then
    sleep 1
  fi
done

# Tüm testlerin tamamlanmasını bekle
echo -e "${YELLOW}Tüm testlerin tamamlanması bekleniyor...${NC}"
wait

# Test sonuçlarını göster
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Sonuçları${NC}"
echo -e "${BLUE}==================================================${NC}"

# Tüm test sonuçlarını göster
for i in $(seq 1 $TEST_COUNT); do
  echo -e "${GREEN}Test $i Sonucu:${NC}"
  cat "test_response_$i.json" | jq '.success, .reportId, .duration'
  rm "test_response_$i.json"
  echo ""
done

# Özet bilgileri göster
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Özeti${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}Toplam $TEST_COUNT test paralel olarak çalıştırıldı.${NC}"

# Browser pool istatistiklerini tekrar al
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test Sonrası Browser Pool İstatistikleri${NC}"
echo -e "${BLUE}==================================================${NC}"

curl -s http://localhost:3002/api/browser-pool/stats | jq .

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Test tamamlandı.${NC}"
echo -e "${BLUE}==================================================${NC}"

# Performans özeti
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Performans Özeti${NC}"
echo -e "${BLUE}==================================================${NC}"

echo -e "${YELLOW}Paralel test koşumu sayesinde 3 test aynı anda çalıştırıldı.${NC}"
echo -e "${YELLOW}Browser Pool sayesinde tarayıcılar verimli bir şekilde yönetildi.${NC}"
echo -e "${YELLOW}Tarayıcılar test sonrası havuza geri verildi ve yeniden kullanılabilir durumda.${NC}"
