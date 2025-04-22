#!/bin/bash

# Chromium test script
# Usage: ./chromium.sh [headless]
# Example: ./chromium.sh false - runs with visible browser
# Example: ./chromium.sh true - runs with headless browser
# If no parameter is provided, defaults to true (headless)

# Get headless parameter, default to true if not provided
HEADLESS=${1:-true}

echo "Running test with Chromium browser (headless=$HEADLESS)"

# Define the test plan
TEST_PLAN=$(cat <<EOF
{
  "name": "Basic Navigation Test",
  "description": "Tests basic navigation and interaction with a website",
  "browserPreference": "chromium",
  "headless": $HEADLESS,
  "steps": [
    {
      "action": "navigate",
      "target": "https://only-testing-blog.blogspot.com/",
      "value": "https://only-testing-blog.blogspot.com/",
      "description": "Navigate to test website"
    },
    {
      "action": "wait",
      "target": 2000,
      "description": "Wait for 2 seconds"
    },
    {
      "action": "click",
      "target": "//button[contains(text(), 'Alert')]",
      "strategy": "xpath",
      "description": "Click on Alert button"
    },
    {
      "action": "acceptDialog",
      "description": "Accept the alert dialog"
    },
    {
      "action": "wait",
      "target": 2000,
      "description": "Wait for 2 seconds"
    }
  ]
}
EOF
)

# Send the test plan to the server
curl -X POST http://localhost:3002/api/test/run \
  -H "Content-Type: application/json" \
  -d "$TEST_PLAN" \
  | tee test_response.json

echo ""
echo "Test completed. Results saved to test_response.json"
