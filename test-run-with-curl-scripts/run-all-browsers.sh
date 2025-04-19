#!/bin/bash

# Headless modu seçimi
echo "Headless modunu seçin:"
echo "1) Headless (tarayıcı arayüzü görünmez)"
echo "2) Non-Headless (tarayıcı arayüzü görünür)"

# Kullanıcı seçimini al
read -p "Seçiminiz (1-2): " headless_choice

# Headless modunu ayarla
if [ "$headless_choice" = "1" ]; then
  HEADLESS="true"
else
  HEADLESS="false"
fi

# Chromium testini çalıştır
echo "Chromium testini çalıştırıyor..."
./run-test.sh -b chromium -h $HEADLESS

echo -e "\n\n"
echo "5 saniye bekleniyor..."
sleep 5

# Firefox testini çalıştır
echo "Firefox testini çalıştırıyor..."
./run-test.sh -b firefox -h $HEADLESS
