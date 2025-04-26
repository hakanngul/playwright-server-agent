# Playwright-Based Test Runner Server

A server application for running automated browser tests using Playwright. This server allows you to execute browser automation tests through a REST API and provides real-time updates via WebSockets.

## TODO : Features
0. Database will be change to MongoDB
1. Kapsamlı Dokümantasyon:
    * Projenin mimarisi, kullanımı ve genişletilmesi hakkında Türkçe ve İngilizce dokümantasyon hazırlayın.
    * Örnek kullanım senaryoları ve en iyi uygulamalar ekleyin.
2. Veritabanı Entegrasyonu:
    * Test sonuçlarını ve verileri saklamak için veritabanı entegrasyonunu tamamlayın.
    * Belirttiğiniz şema yapısını uygulayın (TestRun, TestResult, TestSuite vb. tablolar).
3. Paralelleştirme Desteği:
    * Testleri paralel çalıştırmak için bir mekanizma ekleyin.
    * Tarayıcı havuzu yönetimini geliştirin.
4. CI/CD Entegrasyonu:
    * Popüler CI/CD sistemleri için hazır yapılandırmalar ve örnekler ekleyin.
    * GitHub Actions, Jenkins, GitLab CI için workflow örnekleri hazırlayın.
5. Ek Stratejiler:
    * Mobil görünüm testleri için stratejiler ekleyin.
    * Erişilebilirlik testleri için stratejiler geliştirin.
    * API testleri için stratejiler ekleyin.
6. Güvenlik Testleri:
    * XSS, CSRF gibi güvenlik testleri için stratejiler ekleyin.
7. Performans İzleme:
    * Test performansını izleyen ve raporlayan bir sistem ekleyin.
    * Yavaş çalışan testleri tespit eden ve optimize eden araçlar geliştirin.
8. Çoklu Dil Desteği:
    * Test planları ve raporlar için çoklu dil desteği ekleyin.
## Features

- Run tests in Chromium, Firefox, or Microsoft Edge
- Element-based test automation with multiple selector strategies
- Headless or visible browser mode
- Anti-detection measures to avoid CAPTCHA and bot detection
- Screenshot capture
- Test results storage
- WebSocket real-time updates
- RESTful API
- Modular and extensible architecture
- Browser pool for efficient resource management
- **NEW: Hybrid Test Runner** - Use either custom test runner or Playwright Test Runner
- **NEW: Automatic Retry** - Automatically retry failed tests and steps
- **NEW: Configuration System** - Flexible configuration options
- **NEW: Performance Metrics** - Collect and analyze Web Vitals and network metrics

## Project Structure

```
/server-agent/
├── server.js                # Main server file
├── config.js                # Configuration system
├── playwright-server-config.example.js # Example configuration
├── services/
│   ├── testAgent.js         # Playwright test agent (entry point)
│   └── browser/             # Modular browser automation components
│       ├── index.js         # Main module exports
│       ├── AntiDetection.js # Bot detection avoidance
│       ├── BrowserManager.js # Browser initialization and management
│       ├── ElementHelper.js # Element interaction utilities
│       ├── ScreenshotManager.js # Screenshot capture utilities
│       ├── StepExecutor.js  # Test step execution
│       ├── TestRunner.js    # Test plan execution
│       ├── PlaywrightTestAdapter.js # Playwright Test Runner adapter
│       ├── PlaywrightParallelRunner.js # Parallel test execution
│       └── RetryManager.js  # Automatic retry mechanism
├── routes/
│   └── api.js               # API routes
├── database/
│   ├── index.js             # Database exports
│   ├── db.js                # SQLite database setup
│   ├── elementService.js    # Element CRUD operations
│   ├── scenarioService.js   # Test scenario CRUD operations
│   └── resultService.js     # Test result CRUD operations
├── test-run-with-curl-scripts/ # Test execution scripts
│   ├── run-test.sh          # Run a single test
│   ├── interactive-test.sh  # Interactive test runner
│   ├── run-all-browsers.sh  # Run tests in all browsers
│   ├── parallel-test.sh     # Run tests in parallel
│   └── test-plan.json       # Sample test plan
├── screenshots/             # Test screenshots directory
├── test-results/            # Test results directory
└── data/                    # Database files
```

## Technology Stack

- **Backend**:
  - Node.js
  - Express 4.18.2
  - Playwright 1.40.0
  - WebSocket (ws) 8.18.1
  - better-sqlite3 11.9.1

## Browser Support

This server supports the following browsers:

- **Chromium** - Default browser, based on the same engine as Google Chrome
- **Firefox** - Mozilla Firefox browser
- **Microsoft Edge** - Microsoft Edge browser (Chromium-based)

> **Note:** WebKit (Safari) support has been removed from this version.

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd server-agent
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install chromium firefox
```

4. Configure the server (optional):

```bash
cp playwright-server-config.example.js playwright-server-config.js
# Edit playwright-server-config.js with your preferred settings
```

5. Start the server:

```bash
npm start
```

6. For development with auto-reload:

```bash
npm run dev
```

## Running Tests

There are several ways to run tests with this server:

### 1. Using the API

Send a POST request to `/api/agent/test-run` with a test plan in the request body:

```bash
curl -X POST -H "Content-Type: application/json" -d @test-plan.json http://localhost:3002/api/agent/test-run
```

### 2. Using the Provided Scripts

The repository includes several scripts to make testing easier:

#### Run a Single Test

```bash
./test-run-with-curl-scripts/run-test.sh -b chromium -h true
```

Parameters:
- `-b` or `--browser`: Browser to use (chromium, firefox, edge)
- `-h` or `--headless`: Headless mode (true/false)

#### Interactive Test Runner

```bash
./test-run-with-curl-scripts/interactive-test.sh
```

This script provides an interactive menu to select browser and headless mode.

#### Run Tests in All Browsers

```bash
./test-run-with-curl-scripts/run-all-browsers.sh -h false
```

Parameters:
- `-h` or `--headless`: Headless mode (true/false)

This script runs the test in all supported browsers sequentially.

## API Endpoints

### Test Execution

- `POST /api/agent/test-run`: Run a test with the provided test plan
- `POST /api/test/run-parallel`: Run multiple tests in parallel

### Browser Information

- `GET /api/browsers`: Get available browsers

### Elements Management

- `GET /api/elements/list`: Get all elements
- `GET /api/elements/:id`: Get element by ID
- `POST /api/elements/save`: Create or update element
- `DELETE /api/elements/delete/:id`: Delete element

### Test Scenarios Management

- `GET /api/scenarios`: Get all scenarios
- `GET /api/scenarios/:id`: Get scenario by ID
- `POST /api/scenarios`: Create scenario
- `PUT /api/scenarios/:id`: Update scenario
- `DELETE /api/scenarios/:id`: Delete scenario

### Test Results

- `GET /api/results`: Get all test results
- `GET /api/results/recent`: Get recent test results
- `GET /api/results/stats`: Get test result statistics
- `GET /api/results/:id`: Get test result by ID
- `POST /api/results`: Create test result
- `DELETE /api/results/:id`: Delete test result

## Test Plan Format

```javascript
{
  "name": "Google Search Test",
  "description": "Navigate to Google and search for a term",
  "browserPreference": "chromium", // "chromium", "firefox", or "edge"
  "headless": true,               // true for headless mode, false for visible browser
  "useBrowserPool": true,         // true to use browser pool, false for dedicated browser
  "takeScreenshots": true,
  "steps": [
    {
      "action": "navigate",
      "value": "https://www.google.com",
      "description": "Navigate to Google"
    },
    {
      "action": "type",
      "target": "input[name='q']",
      "strategy": "css",
      "value": "playwright",
      "description": "Type search term"
    },
    {
      "action": "pressEnter",
      "description": "Press Enter to search"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "Wait for results to load"
    },
    {
      "action": "click",
      "target": "//h3[text()='Playwright: Fast and reliable end-to-end testing for modern web apps']",
      "strategy": "xpath",
      "description": "Click on Playwright result"
    },
    {
      "action": "wait",
      "value": "2000",
      "description": "Wait for page to load"
    },
    {
      "action": "takeScreenshot",
      "description": "Capture Playwright page"
    }
  ]
}
```

## WebSocket Communication

Connect to the WebSocket server at `ws://localhost:3002` to receive real-time updates during test execution. The server sends messages with the following format:

```javascript
{
  "type": "step_completed",
  "stepIndex": 0, // Zero-based index of the step
  "step": {
    "action": "navigate",
    "target": null,
    "value": "https://www.google.com",
    "strategy": null,
    "description": "Navigate to Google"
  },
  "result": {
    "step": 1, // One-based index of the step
    "action": "navigate",
    "target": null,
    "value": "https://www.google.com",
    "strategy": null,
    "description": "Navigate to Google",
    "success": true,
    "error": null,
    "message": "",
    "screenshot": null,
    "startTime": "2023-06-15T12:34:56.789Z",
    "endTime": "2023-06-15T12:34:57.123Z",
    "duration": 334
  }
}
```

## Supported Actions

The server supports the following actions in test steps:

- **Navigation**:
  - `navigate`: Navigate to a URL
  - `navigateAndWait`: Navigate to a URL and wait for page to load
  - `goBack`: Navigate back in browser history
  - `goForward`: Navigate forward in browser history
  - `refresh`: Refresh the current page

- **Element Interaction**:
  - `click`: Click on an element
  - `doubleClick`: Double-click on an element
  - `hover`: Hover over an element
  - `type`: Type text into an element
  - `select`: Select an option from a dropdown
  - `check`: Check a checkbox or radio button
  - `uncheck`: Uncheck a checkbox
  - `upload`: Upload a file to a file input

- **Keyboard**:
  - `pressEnter`: Press the Enter key
  - `pressTab`: Press the Tab key
  - `pressEscape`: Press the Escape key

- **Wait**:
  - `wait`: Wait for a specified time in milliseconds
  - `waitForElement`: Wait for an element to appear
  - `waitForElementToDisappear`: Wait for an element to disappear
  - `waitForNavigation`: Wait for navigation to complete
  - `waitForURL`: Wait for a specific URL

- **Screenshot**:
  - `takeScreenshot`: Take a screenshot of the current page
  - `takeElementScreenshot`: Take a screenshot of a specific element

- **Verification**:
  - `verifyText`: Verify text is present on the page
  - `verifyTitle`: Verify the page title
  - `verifyURL`: Verify the current URL
  - `verifyElementExists`: Verify an element exists in the DOM
  - `verifyElementVisible`: Verify an element is visible

- **Frame Handling**:
  - `clickInFrame`: Click on an element within an iframe

## Selector Strategies

The server supports the following selector strategies for targeting elements:

- **css**: CSS selector (e.g., `input[name='q']`)
- **xpath**: XPath selector (e.g., `//h3[text()='Playwright']`)
- **id**: Element ID (e.g., `searchInput`)
- **name**: Element name attribute (e.g., `q`)
- **class**: Element class name (e.g., `search-box`)
- **text**: Text content (Playwright-specific)
- **role**: Accessibility role (Playwright-specific)

## Hybrid Test Runner

The server now includes a hybrid test runner that can use either the custom test runner or Playwright Test Runner:

- **Custom Test Runner**: The original test runner with JSON-based test plans and REST API integration
- **Playwright Test Runner**: Uses Playwright's official test runner for better performance and reliability

### Configuration

You can configure which test runner to use in the configuration file:

```javascript
// playwright-server-config.js
export default {
  test: {
    usePlaywrightTestRunner: true, // Set to false to use custom test runner
    // Other test configuration...
  }
}
```

## Automatic Retry

The server now includes an automatic retry mechanism for failed tests and steps:

- **Test Retries**: Automatically retry failed tests
- **Step Retries**: Automatically retry failed steps
- **Configurable Retry Conditions**: Configure which errors should trigger retries

### Configuration

```javascript
// playwright-server-config.js
export default {
  test: {
    retries: 2, // Number of retries for failed tests
    // Other test configuration...
  }
}
```

## Configuration System

The server now includes a flexible configuration system:

- **Default Configuration**: Sensible defaults for all settings
- **User Configuration**: Override defaults with your own settings
- **Environment Variables**: Override configuration with environment variables

### Configuration File

Create a `playwright-server-config.js` file in the root directory to override default settings:

```javascript
// playwright-server-config.js
export default {
  server: {
    port: 3002,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  test: {
    usePlaywrightTestRunner: true,
    workers: 4,
    headless: true,
    retries: 1,
    timeout: 30000,
    browserTypes: ['chromium', 'firefox']
  },
  // Other configuration...
}
```

## Performance Metrics

The server now collects and analyzes performance metrics:

- **Web Vitals**: Collect Core Web Vitals metrics (LCP, FID, CLS, TTFB)
- **Network Metrics**: Collect network performance metrics
- **Performance Thresholds**: Configure performance thresholds

### Configuration

```javascript
// playwright-server-config.js
export default {
  performance: {
    collectMetrics: true,
    webVitals: true,
    networkMetrics: true,
    thresholds: {
      lcp: 2500, // Largest Contentful Paint (ms)
      fid: 100,  // First Input Delay (ms)
      cls: 0.1,  // Cumulative Layout Shift
      ttfb: 600  // Time to First Byte (ms)
    }
  }
}
```

## Anti-Detection Features

The server includes several features to avoid bot detection:

- **User Agent Spoofing**: Realistic user agents for each browser
- **WebDriver Property Removal**: Hides automation flags
- **Extra HTTP Headers**: Adds realistic headers to requests
- **Firefox-specific Protections**: Special configurations for Firefox
- **Chromium/Edge Protections**: Special configurations for Chromium-based browsers

These features help avoid CAPTCHAs and other bot detection mechanisms during test execution.

## Troubleshooting

### Browser Not Closing After Test

If the browser doesn't close after a test completes:

1. Make sure you're using the latest version of the server
2. Check if there are any active WebSocket connections
3. Try running the test with the `-h true` flag to use headless mode

### Element Not Found

If elements are not being found during tests:

1. Check that the selector strategy matches the target format (e.g., use `xpath` for XPath selectors)
2. Verify the element exists on the page using browser developer tools
3. Try adding a `wait` step before interacting with the element
4. For dynamic content, increase wait times

### CAPTCHA Detection

If your tests are being blocked by CAPTCHAs:

1. Use the Firefox browser which has enhanced anti-detection measures
2. Run tests with `-h false` to see what's happening
3. Add more human-like behavior (waits between actions)
4. Avoid running too many tests in a short period

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
