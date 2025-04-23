#!/bin/bash

# Gelişmiş paralel test çalıştırma script'i
# Kullanım: ./advanced-parallel-test.sh [headless] [browser]
# Örnek: ./advanced-parallel-test.sh false chromium

# Parametreleri al
HEADLESS=${1:-true}
BROWSER=${2:-chromium}

# Test planları
TEST_PLANS=$(cat <<EOF
{
  "testPlans": [
    {
      "name": "API Test",
      "description": "API test örneği",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "apiRequest",
          "method": "GET",
          "target": "https://jsonplaceholder.typicode.com/posts/1",
          "description": "API isteği gönder"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Visual Comparison Test",
      "description": "Görsel karşılaştırma testi",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/",
          "description": "Test sayfasına git"
        },
        {
          "action": "wait",
          "target": 2000,
          "description": "2 saniye bekle"
        },
        {
          "action": "visualCompare",
          "target": "homepage",
          "description": "Ana sayfa görsel karşılaştırma"
        }
      ]
    },
    {
      "name": "Accessibility Test",
      "description": "Erişilebilirlik testi",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/01/textbox.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "wait",
          "target": 2000,
          "description": "2 saniye bekle"
        },
        {
          "action": "accessibilityCheck",
          "description": "Erişilebilirlik kontrolü"
        }
      ]
    },
    {
      "name": "Mobile Emulation Test",
      "description": "Mobil emülasyon testi",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "mobileDevice": "iPhone 12",
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/",
          "description": "Test sayfasına git"
        },
        {
          "action": "wait",
          "target": 2000,
          "description": "2 saniye bekle"
        },
        {
          "action": "screenshot",
          "target": "mobile_view",
          "description": "Mobil görünüm ekran görüntüsü"
        }
      ]
    },
    {
      "name": "Assertion Test",
      "description": "Assertion testi",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/",
          "description": "Test sayfasına git"
        },
        {
          "action": "wait",
          "target": 2000,
          "description": "2 saniye bekle"
        },
        {
          "action": "assertTitle",
          "target": "Only Testing",
          "description": "Sayfa başlığını kontrol et"
        }
      ]
    }
  ]
}
EOF
)

# Gelişmiş özellikleri etkinleştir
export RECORD_VIDEO=true
export CAPTURE_TRACES=true
export VISUAL_COMPARISON=true
export ACCESSIBILITY_TEST=true
export API_TESTING=true
export MOBILE_EMULATION=true

# Paralel test çalıştırma isteği gönder
echo "Gelişmiş paralel test çalıştırma isteği gönderiliyor..."
echo "Headless: ${HEADLESS}, Browser: ${BROWSER}"
echo "Etkin özellikler: Video kaydı, İz toplama, Görsel karşılaştırma, Erişilebilirlik testi, API testi, Mobil emülasyon"

curl -X POST http://localhost:3002/api/test/run-parallel \
  -H "Content-Type: application/json" \
  -d "${TEST_PLANS}" \
  | jq .

echo "Gelişmiş paralel test çalıştırma isteği tamamlandı."
