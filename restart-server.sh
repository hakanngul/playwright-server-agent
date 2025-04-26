#!/bin/bash

echo "Sunucuyu yeniden başlatıyor..."

# Mevcut sunucu işlemlerini bul ve sonlandır
PIDS=$(lsof -t -i:3002)
if [ -n "$PIDS" ]; then
  echo "Mevcut sunucu işlemleri (PID: $PIDS) sonlandırılıyor..."
  for PID in $PIDS; do
    kill -9 $PID
  done
  sleep 2

  # Port kullanımını tekrar kontrol et
  if [ -n "$(lsof -t -i:3002)" ]; then
    echo "UYARI: 3002 portu hala kullanımda. Lütfen manuel olarak işlemleri sonlandırın."
    exit 1
  fi
fi

# Sunucuyu yeniden başlat
echo "Sunucu yeniden başlatılıyor..."
npm start &

echo "Sunucu yeniden başlatıldı. 5 saniye bekleniyor..."
sleep 5
echo "Sunucu hazır!"
