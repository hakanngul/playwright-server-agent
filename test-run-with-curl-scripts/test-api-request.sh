#!/bin/bash

# API test betiği
# Kullanım: ./test-api-request.sh [--browser browser_type] [--headless true|false]

# Varsayılan değerler
BROWSER="chromium"
HEADLESS="true"

# Parametreleri işle
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --browser) BROWSER="$2"; shift ;;
    --headless) HEADLESS="$2"; shift ;;
    *) echo "Bilinmeyen parametre: $1"; exit 1 ;;
  esac
  shift
done

echo "Browser: $BROWSER, Headless: $HEADLESS"

# Test planını oluştur
TEST_PLAN=$(cat <<EOF
{
  "name": "API Test",
  "description": "API test örneği",
  "browserPreference": "$BROWSER",
  "headless": $HEADLESS,
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
    },
    {
      "action": "apiRequest",
      "method": "POST",
      "target": "https://jsonplaceholder.typicode.com/posts",
      "data": {
        "title": "Test Başlık",
        "body": "Test İçerik",
        "userId": 1
      },
      "description": "POST API isteği gönder"
    }
  ]
}
EOF
)

# Test isteğini gönder
echo "Sending test request to http://localhost:3002/api/test/run..."
curl -s -X POST http://localhost:3002/api/test/run \
  -H "Content-Type: application/json" \
  -d "$TEST_PLAN" | jq .

echo "Test request sent successfully!"
