#!/bin/bash

# Default values
BROWSER="chromium"
HEADLESS="false"
SERVER_URL="http://localhost:3002/api/agent/test-run"
#TEST_PLAN_FILE="./test-plans/test-plan.json"
TEST_PLAN_FILE="./test-plans/advanced-interactions.json"

# Firefox için özel uyarı
FIREFOX_WARNING="Firefox tarayıcısı için tam ekran modu devre dışı bırakıldı. Normal pencere boyutunda çalışacak."

# Display usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -b, --browser BROWSER    Specify browser (chromium, firefox, edge) [default: chromium]"
  echo "  -h, --headless BOOL      Run in headless mode (true, false) [default: false]"
  echo "  -f, --file FILE          Test plan file to use [default: test-plan.json]"
  echo "  --help                   Show this help message"
  echo ""
  echo "Example: $0 -b firefox -h true"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--browser)
      BROWSER="$2"
      shift 2
      ;;
    -h|--headless)
      HEADLESS="$2"
      shift 2
      ;;
    -f|--file)
      TEST_PLAN_FILE="$2"
      shift 2
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate browser
if [[ "$BROWSER" != "chromium" && "$BROWSER" != "firefox" && "$BROWSER" != "edge" ]]; then
  echo "Error: Invalid browser '$BROWSER'. Must be one of: chromium, firefox, edge"
  exit 1
fi

# Validate headless
if [[ "$HEADLESS" != "true" && "$HEADLESS" != "false" ]]; then
  echo "Error: Invalid headless value '$HEADLESS'. Must be either 'true' or 'false'"
  exit 1
fi

# Check if test plan file exists
if [[ ! -f "$TEST_PLAN_FILE" ]]; then
  echo "Error: Test plan file '$TEST_PLAN_FILE' not found"
  exit 1
fi

# Create a temporary file for the modified test plan
TEMP_FILE=$(mktemp)

# Read the test plan and update browser and headless settings
cat "$TEST_PLAN_FILE" | sed "s/\"browserPreference\": \"[^\"]*\"/\"browserPreference\": \"$BROWSER\"/" | \
  sed "s/\"headless\": [^,}]*/\"headless\": $HEADLESS/" > "$TEMP_FILE"

echo "==================================================="
echo "Running Google Search Test with the following settings:"
echo "Browser: $BROWSER"
echo "Headless: $HEADLESS"
echo "Test Plan: $TEST_PLAN_FILE"
echo "==================================================="

# Firefox için uyarı göster
if [[ "$BROWSER" == "firefox" ]]; then
  echo -e "\033[33mUYARI: $FIREFOX_WARNING\033[0m"
fi

# Send the test plan to the server
echo "Sending test plan to server..."
RESPONSE=$(curl -s -X POST \
  "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_FILE")

# Clean up the temporary file
rm "$TEMP_FILE"

# Extract request ID from response
REQUEST_ID=$(echo $RESPONSE | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$REQUEST_ID" ]; then
  echo "Test request submitted with ID: $REQUEST_ID"
else
  echo "Error: Failed to get request ID from response"
  echo "Response: $RESPONSE"
fi

echo ""
echo "Test execution request sent. Check server logs for results."
echo "You can view request status with: curl http://localhost:3002/api/agent/test-status/$REQUEST_ID"
echo "You can view system status with: curl http://localhost:3002/api/agent/system-status"
