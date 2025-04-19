#!/bin/bash

# Kullanıcıya tarayıcı seçimi için menü göster
echo "Hangi tarayıcıda test çalıştırmak istiyorsunuz?"
echo "1) Chromium"
echo "2) Firefox"
echo "3) Microsoft Edge"
echo "4) Çıkış"

# Kullanıcı seçimini al
read -p "Seçiminiz (1-4): " choice

# Headless modu seçimi
echo -e "\nHeadless modunu seçin:"
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

# Seçime göre işlem yap
case $choice in
  1)
    echo "Chromium tarayıcısında test çalıştırılıyor..."
    ./run-test.sh -b chromium -h $HEADLESS
    ;;
  2)
    echo "Firefox tarayıcısında test çalıştırılıyor..."
    ./run-test.sh -b firefox -h $HEADLESS
    ;;
  3)
    echo "Microsoft Edge tarayıcısında test çalıştırılıyor..."
    ./run-test.sh -b edge -h $HEADLESS
    ;;
  4)
    echo "Çıkış yapılıyor..."
    exit 0
    ;;
  *)
    echo "Geçersiz seçim. Lütfen 1-4 arasında bir sayı girin."
    exit 1
    ;;
esac

echo "Test tamamlandı."
