#!/bin/bash

# Test script to run a test with the modern report template

# Default values
BROWSER="chromium"
HEADLESS=false
PORT=3002

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --browser)
      BROWSER="$2"
      shift
      shift
      ;;
    --headless)
      HEADLESS="$2"
      shift
      shift
      ;;
    --port)
      PORT="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate browser type
if [[ "$BROWSER" != "chromium" && "$BROWSER" != "firefox" && "$BROWSER" != "webkit" ]]; then
  echo "Invalid browser type. Must be one of: chromium, firefox, webkit"
  exit 1
fi

# Validate headless mode
if [[ "$HEADLESS" != "true" && "$HEADLESS" != "false" ]]; then
  echo "Invalid headless value. Must be true or false"
  exit 1
fi

# Create temporary test plan file
TEST_PLAN_FILE=$(mktemp)

# Create test plan
cat > "$TEST_PLAN_FILE" << EOF
{
  "name": "Modern Report Test",
  "description": "Test for the modern report template with dark mode and embedded video",
  "browser": "${BROWSER}",
  "headless": ${HEADLESS},
  "steps": [
    {
      "action": "navigate",
      "value": "https://only-testing-blog.blogspot.com/",
      "description": "Test sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "value": "anasayfa",
      "description": "Ekran görüntüsü al"
    },
    {
      "action": "click",
      "target": "a[href='https://only-testing-blog.blogspot.com/2014/01/textbox.html']",
      "strategy": "css",
      "description": "Textbox sayfasına git"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "type",
      "target": "#text1",
      "strategy": "css",
      "value": "Test Metni",
      "description": "Text kutusuna metin gir"
    },
    {
      "action": "click",
      "target": "#check1",
      "strategy": "css",
      "description": "Checkbox'ı işaretle"
    },
    {
      "action": "select",
      "target": "#Carlist",
      "strategy": "css",
      "value": "Audi",
      "description": "Dropdown'dan Audi seç"
    },
    {
      "action": "takeScreenshot",
      "value": "form_dolduruldu",
      "description": "Form doldurulduktan sonra ekran görüntüsü al"
    }
  ],
  "options": {
    "recordVideo": true,
    "captureTraces": true,
    "screenshotAfterEachStep": true,
    "videoOptions": {
      "width": 1280,
      "height": 720,
      "quality": "high"
    }
  }
}
EOF

# Send test request
echo "Sending test request to http://localhost:${PORT}/api/test/run..."
curl -X POST \
  -H "Content-Type: application/json" \
  --data-binary @"$TEST_PLAN_FILE" \
  "http://localhost:${PORT}/api/test/run" \
  -o response.json

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo "Test request sent successfully!"

  # Extract report ID from response
  REPORT_ID=$(grep -o '"reportId":"[^"]*"' response.json | cut -d'"' -f4)

  if [ -n "$REPORT_ID" ]; then
    echo "Report ID: $REPORT_ID"

    # Generate modern HTML report
    echo "Generating modern HTML report..."
    node generate-modern-report.js "$REPORT_ID"

    # Check if the report was generated successfully
    if [ $? -eq 0 ]; then
      echo "Report will be available at: http://localhost:${PORT}/reports/${REPORT_ID}.html"

      # Open the report in the default browser
      if command -v open &> /dev/null; then
        open "http://localhost:${PORT}/reports/${REPORT_ID}.html"
      elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:${PORT}/reports/${REPORT_ID}.html"
      elif command -v start &> /dev/null; then
        start "http://localhost:${PORT}/reports/${REPORT_ID}.html"
      else
        echo "Could not open browser automatically. Please visit the URL manually."
      fi
    else
      echo "Failed to generate modern HTML report."
    fi
  else
    echo "Could not extract report ID from response."
    echo "Response content:"
    cat response.json
  fi
else
  echo "Failed to send test request."
  echo "Response content:"
  cat response.json
fi

# Clean up
rm "$TEST_PLAN_FILE"
