#!/bin/bash

# Tam ekran modunda test çalıştırma örneği

# Test planı dosyasını belirt
TEST_PLAN="test-plans/fullscreen-test-plan.json"

# Test planını çalıştır
curl -X POST http://localhost:3002/agent/test-run \
  -H "Content-Type: application/json" \
  -d @$TEST_PLAN

echo "Tam ekran test isteği gönderildi."
