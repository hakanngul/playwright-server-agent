#!/bin/bash

# Test planını server-agent'a gönder
curl -X POST \
  http://localhost:3002/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan.json
