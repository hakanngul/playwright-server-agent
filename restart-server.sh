#!/bin/bash

echo "Sunucuyu yeniden başlatıyor..."

# Mevcut sunucu işlemini bul ve sonlandır
PID=$(lsof -t -i:3002)
if [ -n "$PID" ]; then
  echo "Mevcut sunucu işlemi (PID: $PID) sonlandırılıyor..."
  kill -9 $PID
  sleep 2
fi

# Sunucuyu yeniden başlat
echo "Sunucu yeniden başlatılıyor..."
npm start &

echo "Sunucu yeniden başlatıldı. 5 saniye bekleniyor..."
sleep 5
echo "Sunucu hazır!"
