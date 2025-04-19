#!/bin/bash

# Son test sonuçlarını görüntüle
echo "Son test sonuçlarını görüntülüyor..."
curl http://localhost:3001/api/results/recent?limit=5

# Test sonuç istatistiklerini görüntüle
echo -e "\n\n"
echo "Test sonuç istatistiklerini görüntülüyor..."
curl http://localhost:3001/api/results/stats
