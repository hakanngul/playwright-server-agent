#!/bin/bash

# Varsayılan tarayıcı tipi
BROWSER_TYPE="chromium"

# Varsayılan headless modu
HEADLESS="true"

# Komut satırı parametrelerini kontrol et
while getopts ":b:h:" opt; do
  case $opt in
    b) BROWSER_TYPE="$OPTARG"
       ;;
    h) HEADLESS="$OPTARG"
       ;;
    \?) echo "Geçersiz seçenek: -$OPTARG" >&2
        exit 1
        ;;
    :) echo "Seçenek -$OPTARG bir argüman gerektiriyor." >&2
       exit 1
       ;;
  esac
done

echo "Kullanılan tarayıcı: $BROWSER_TYPE"
echo "Headless modu: $HEADLESS"

# Test planını geçici bir dosyaya kopyala ve tarayıcı tipini güncelle
cp test-plan.json temp-test-plan.json

# jq kullanarak tarayıcı tipini ve headless modunu güncelle (eğer jq yüklü değilse: brew install jq)
if command -v jq &> /dev/null; then
  # Önce tarayıcı tipini güncelle
  jq ".browserPreference = \"$BROWSER_TYPE\"" temp-test-plan.json > temp-test-plan2.json
  mv temp-test-plan2.json temp-test-plan.json

  # Sonra headless modunu güncelle
  if [ "$HEADLESS" = "true" ] || [ "$HEADLESS" = "false" ]; then
    jq ".headless = $HEADLESS" temp-test-plan.json > temp-test-plan2.json
    mv temp-test-plan2.json temp-test-plan.json
  else
    echo "Uyarı: Geçersiz headless değeri. 'true' veya 'false' olmalıdır."
  fi
else
  echo "Uyarı: jq yüklü değil, tarayıcı tipi ve headless modu test planında güncellenemedi."
  echo "Test planını güncellemek için jq yükleyin: brew install jq"
fi

# Test planını server-agent'a gönder
echo "Server'a test planı gönderiliyor..."
curl -v -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @temp-test-plan.json

# Geçici dosyayı temizle
rm temp-test-plan.json
