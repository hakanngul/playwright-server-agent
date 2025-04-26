#!/bin/bash

# Tam ekran modunda test çalıştırma örneği (test planı kimliği kullanarak)

# Test planı kimliğini belirt
TEST_PLAN_ID="fullscreen-test-plan"

# Test planını çalıştır
curl -X POST http://localhost:3002/agent/test-run \
  -H "Content-Type: application/json" \
  -d "{\"testPlanId\": \"$TEST_PLAN_ID\"}"

echo "Tam ekran test isteği gönderildi."
