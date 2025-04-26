#!/bin/bash

# Paralel test çalıştırma script'i (5 agent ile)
# Kullanım: ./run-parallel-with-5-agents.sh [headless] [browser]
# Örnek: ./run-parallel-with-5-agents.sh true chromium

# Parametreleri al
HEADLESS=${1:-true}
BROWSER=${2:-chromium}

# Renkli çıktı için ANSI renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Paralel Test Çalıştırma (5 Agent)${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}Headless: ${HEADLESS}, Browser: ${BROWSER}${NC}"
echo -e "${YELLOW}Agent Sayısı: 5${NC}"
echo -e "${BLUE}==================================================${NC}"

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
    },
    {
      "name": "Paralel Test 6",
      "description": "Paralel çalıştırma testi 6",
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
          "target": "#text2",
          "value": "Test 6",
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
      "name": "Paralel Test 7",
      "description": "Paralel çalıştırma testi 7",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/01/textbox.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "click",
          "target": "#radio1",
          "description": "Radio butonuna tıkla"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Paralel Test 8",
      "description": "Paralel çalıştırma testi 8",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/01/textbox.html",
          "description": "Test sayfasına git"
        },
        {
          "action": "click",
          "target": "#radio2",
          "description": "Radio butonuna tıkla"
        },
        {
          "action": "wait",
          "target": 1000,
          "description": "1 saniye bekle"
        }
      ]
    },
    {
      "name": "Paralel Test 9",
      "description": "Paralel çalıştırma testi 9",
      "browserPreference": "${BROWSER}",
      "headless": ${HEADLESS},
      "steps": [
        {
          "action": "navigate",
          "target": "https://only-testing-blog.blogspot.com/2014/01/textbox.html",
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
      "name": "Paralel Test 10",
      "description": "Paralel çalıştırma testi 10",
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
          "target": "#text3",
          "value": "Test 10",
          "description": "Text kutusuna yaz"
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
echo -e "${GREEN}Paralel test çalıştırma isteği gönderiliyor...${NC}"

# MAX_WORKERS ortam değişkeni ile 5 agent kullanarak çalıştır
MAX_WORKERS=5 curl -X POST http://localhost:3002/api/test/run-parallel \
  -H "Content-Type: application/json" \
  -d "${TEST_PLANS}" \
  | jq .

echo -e "${GREEN}Paralel test çalıştırma isteği tamamlandı.${NC}"
