#!/bin/bash

# Default values
BROWSER="webkit"
HEADLESS="false"
TEST_PLAN="test-run-with-curl-scripts/test-plans/webkit-test.json"

# Parse command line arguments
while getopts ":b:h:t:" opt; do
  case $opt in
    b) BROWSER="$OPTARG" ;;
    h) HEADLESS="$OPTARG" ;;
    t) TEST_PLAN="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2; exit 1 ;;
  esac
done

echo "==================================================="
echo "Running WebKit Test with the following settings:"
echo "Browser: $BROWSER"
echo "Headless: $HEADLESS"
echo "Test Plan: $TEST_PLAN"
echo "==================================================="

# Check if test plan exists
if [ ! -f "$TEST_PLAN" ]; then
  echo "Error: Test plan file not found: $TEST_PLAN"
  exit 1
fi

# Read test plan
TEST_PLAN_CONTENT=$(cat "$TEST_PLAN")

# Update browser preference and headless mode in test plan
TEST_PLAN_CONTENT=$(echo "$TEST_PLAN_CONTENT" | sed "s/\"browserPreference\": \"[^\"]*\"/\"browserPreference\": \"$BROWSER\"/")
TEST_PLAN_CONTENT=$(echo "$TEST_PLAN_CONTENT" | sed "s/\"headless\": [^,}]*/\"headless\": $HEADLESS/")

echo "Sending test plan to server..."

# Send test plan to server
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$TEST_PLAN_CONTENT" http://localhost:3002/api/agent/test-run)

# Extract request ID from response
REQUEST_ID=$(echo $RESPONSE | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REQUEST_ID" ]; then
  echo "Error: Failed to submit test request. Server response:"
  echo $RESPONSE
  exit 1
fi

echo "Test request submitted with ID: $REQUEST_ID"
echo ""
echo "Test execution request sent. Check server logs for results."
echo "You can view request status with: curl http://localhost:3002/api/agent/test-status/$REQUEST_ID"
echo "You can view system status with: curl http://localhost:3002/api/agent/system-status"
