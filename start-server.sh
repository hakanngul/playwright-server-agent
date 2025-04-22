#!/bin/bash

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Playwright Server Agent Başlatma${NC}"
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

# Mevcut çalışan sunucuyu kontrol et
PID=$(lsof -t -i:3002)
if [ ! -z "$PID" ]; then
  echo -e "${YELLOW}Port 3002'de çalışan bir sunucu bulundu (PID: $PID). Kapatılıyor...${NC}"
  kill -9 $PID
  sleep 2
fi

# Sunucuyu başlat
echo -e "${GREEN}Sunucu başlatılıyor...${NC}"
echo -e "${BLUE}==================================================${NC}"

HEADLESS=$HEADLESS node server.js
