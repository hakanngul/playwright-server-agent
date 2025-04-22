#!/bin/bash

# Paralel test çalıştırma script'i
# Kullanım: ./parallel-test.sh [headless] [browser]
# Örnek: ./parallel-test.sh true chromium

# Parametreleri al
HEADLESS=${1:-true}
BROWSER=${2:-chromium}

# Test planları
TEST_PLANS=$(cat <<EOF
{
  "testPlans": [
    {
      "name": "Paralel Test 1",
      "description": "Paralel çalıştırma testi 1",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/",
          "description": "Test sayfasına git"
        },
        {
          "action": "click",
          "target": "#post-body-4292417847084983089 > div:nth-child(1) > button:nth-child(1)",
          "description": "Show Me Alert butonuna tıkla"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Paralel Test 2",
      "description": "Paralel çalıştırma testi 2",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/01/textbox.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "type",
          "target": "#text1",
          "value": "Playwright Test",
          "description": "Text kutusuna yaz"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Paralel Test 3",
      "description": "Paralel çalıştırma testi 3",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2013/11/new-test.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "click",
          "target": "#submitButton",
          "description": "Submit butonuna tıkla"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Paralel Test 4",
      "description": "Paralel çalıştırma testi 4",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/09/temp.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "select",
          "target": "#Carlist",
          "value": "Audi",
          "description": "Dropdown'dan Audi seç"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Paralel Test 5",
      "description": "Paralel çalıştırma testi 5",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/01/textbox.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "check",
          "target": "#checkbox1",
          "description": "Checkbox'ı işaretle"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    }
  ]
}
EOF
)

# Paralel test çalıştırma isteği gönder
echo "Paralel test çalıştırma isteği gönderiliyor..."
echo "Headless: ${HEADLESS}, Browser: ${BROWSER}"

curl -X POST http://localhost:3002/api/test/run-parallel \
  -H "Content-Type: application/json" \
  -d "${TEST_PLANS}" \
  | jq .

echo "Paralel test çalıştırma isteği tamamlandı."
