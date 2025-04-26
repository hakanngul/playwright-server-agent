#!/bin/bash

# Playwright Server Agent'ı durdurma script'i
# Kullanım: ./shutdown-server.sh

# Renkli çıktı için ANSI renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${RED}Playwright Server Agent Durdurma${NC}"
echo -e "${BLUE}==================================================${NC}"

# Sunucu durumunu kontrol et
echo -e "${YELLOW}Sunucu durumu kontrol ediliyor...${NC}"
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health)

if [ "$SERVER_STATUS" == "200" ]; then
    echo -e "${GREEN}Sunucu çalışıyor. Durdurma işlemi başlatılıyor...${NC}"
    
    # Çalışan Node.js süreçlerini bul
    echo -e "${YELLOW}Node.js süreçleri aranıyor...${NC}"
    NODE_PROCESSES=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
    
    if [ -z "$NODE_PROCESSES" ]; then
        echo -e "${RED}Çalışan Node.js süreci bulunamadı.${NC}"
    else
        # Süreçleri sonlandır
        echo -e "${YELLOW}Bulunan süreçler: ${NODE_PROCESSES}${NC}"
        echo -e "${RED}Süreçler sonlandırılıyor...${NC}"
        
        for PID in $NODE_PROCESSES; do
            echo -e "${YELLOW}PID: ${PID} sonlandırılıyor...${NC}"
            kill -15 $PID
            
            # Sürecin sonlandığını kontrol et
            sleep 2
            if ps -p $PID > /dev/null; then
                echo -e "${RED}PID: ${PID} normal şekilde sonlandırılamadı, zorla sonlandırılıyor...${NC}"
                kill -9 $PID
            else
                echo -e "${GREEN}PID: ${PID} başarıyla sonlandırıldı.${NC}"
            fi
        done
        
        # Tüm süreçlerin sonlandığını kontrol et
        sleep 2
        REMAINING_PROCESSES=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
        
        if [ -z "$REMAINING_PROCESSES" ]; then
            echo -e "${GREEN}Tüm süreçler başarıyla sonlandırıldı.${NC}"
        else
            echo -e "${RED}Bazı süreçler hala çalışıyor: ${REMAINING_PROCESSES}${NC}"
            echo -e "${YELLOW}Bu süreçleri manuel olarak sonlandırmanız gerekebilir.${NC}"
            echo -e "${BLUE}Örnek: kill -9 ${REMAINING_PROCESSES}${NC}"
        fi
    fi
    
    # Tarayıcı süreçlerini kontrol et ve sonlandır
    echo -e "${YELLOW}Tarayıcı süreçleri kontrol ediliyor...${NC}"
    
    # Chromium süreçlerini kontrol et
    CHROMIUM_PROCESSES=$(ps aux | grep -E "chromium|chrome" | grep -v grep | awk '{print $2}')
    if [ -n "$CHROMIUM_PROCESSES" ]; then
        echo -e "${YELLOW}Chromium süreçleri bulundu: ${CHROMIUM_PROCESSES}${NC}"
        echo -e "${RED}Chromium süreçleri sonlandırılıyor...${NC}"
        
        for PID in $CHROMIUM_PROCESSES; do
            echo -e "${YELLOW}PID: ${PID} sonlandırılıyor...${NC}"
            kill -15 $PID 2>/dev/null
        done
    fi
    
    # Firefox süreçlerini kontrol et
    FIREFOX_PROCESSES=$(ps aux | grep "firefox" | grep -v grep | awk '{print $2}')
    if [ -n "$FIREFOX_PROCESSES" ]; then
        echo -e "${YELLOW}Firefox süreçleri bulundu: ${FIREFOX_PROCESSES}${NC}"
        echo -e "${RED}Firefox süreçleri sonlandırılıyor...${NC}"
        
        for PID in $FIREFOX_PROCESSES; do
            echo -e "${YELLOW}PID: ${PID} sonlandırılıyor...${NC}"
            kill -15 $PID 2>/dev/null
        done
    fi
    
    # WebKit süreçlerini kontrol et
    WEBKIT_PROCESSES=$(ps aux | grep "webkit" | grep -v grep | awk '{print $2}')
    if [ -n "$WEBKIT_PROCESSES" ]; then
        echo -e "${YELLOW}WebKit süreçleri bulundu: ${WEBKIT_PROCESSES}${NC}"
        echo -e "${RED}WebKit süreçleri sonlandırılıyor...${NC}"
        
        for PID in $WEBKIT_PROCESSES; do
            echo -e "${YELLOW}PID: ${PID} sonlandırılıyor...${NC}"
            kill -15 $PID 2>/dev/null
        done
    fi
    
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}Sunucu durdurma işlemi tamamlandı.${NC}"
    echo -e "${BLUE}==================================================${NC}"
else
    echo -e "${RED}Sunucu çalışmıyor veya erişilemiyor.${NC}"
    echo -e "${YELLOW}Sunucu durumu: ${SERVER_STATUS}${NC}"
    
    # Yine de Node.js süreçlerini kontrol et
    NODE_PROCESSES=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
    
    if [ -n "$NODE_PROCESSES" ]; then
        echo -e "${YELLOW}Ancak çalışan Node.js süreçleri bulundu: ${NODE_PROCESSES}${NC}"
        echo -e "${RED}Bu süreçleri sonlandırmak ister misiniz? (e/h)${NC}"
        read -r RESPONSE
        
        if [ "$RESPONSE" == "e" ] || [ "$RESPONSE" == "E" ]; then
            for PID in $NODE_PROCESSES; do
                echo -e "${YELLOW}PID: ${PID} sonlandırılıyor...${NC}"
                kill -9 $PID
            done
            echo -e "${GREEN}Süreçler sonlandırıldı.${NC}"
        else
            echo -e "${YELLOW}Süreçler sonlandırılmadı.${NC}"
        fi
    fi
fi

# Port durumunu kontrol et
echo -e "${YELLOW}3002 portu kontrol ediliyor...${NC}"
PORT_STATUS=$(lsof -i:3002 | grep LISTEN)

if [ -n "$PORT_STATUS" ]; then
    echo -e "${RED}3002 portu hala kullanımda:${NC}"
    echo -e "${YELLOW}${PORT_STATUS}${NC}"
    echo -e "${BLUE}Bu portu manuel olarak serbest bırakmak için:${NC}"
    echo -e "${BLUE}sudo lsof -i:3002 | grep LISTEN | awk '{print \$2}' | xargs kill -9${NC}"
else
    echo -e "${GREEN}3002 portu serbest.${NC}"
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}İşlem tamamlandı.${NC}"
echo -e "${BLUE}==================================================${NC}"
