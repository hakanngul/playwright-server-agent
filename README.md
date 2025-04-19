# Playwright-Based Test Runner Server

A server application for running automated browser tests using Playwright.

## Features

- Run tests in Chromium, Firefox, or WebKit (Safari)
- Element-based test automation
- Screenshot capture
- Test results storage
- WebSocket real-time updates
- RESTful API

## Project Structure

```
/server-agent/
├── server.js                # Main server file
├── services/
│   └── testAgent.js         # Playwright test agent
├── routes/
│   └── api.js               # API routes
├── database/
│   ├── index.js             # Database exports
│   ├── db.js                # SQLite database setup
│   ├── elementService.js    # Element CRUD operations
│   ├── scenarioService.js   # Test scenario CRUD operations
│   └── resultService.js     # Test result CRUD operations
├── screenshots/             # Test screenshots directory
└── data/                    # Database files
```

## Technology Stack

- **Backend**:
  - Node.js
  - Express 4.18.2
  - Playwright 1.40.0
  - WebSocket (ws) 8.18.1
  - better-sqlite3 11.9.1

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd server-agent
npm install
```

3. Start the server:

```bash
npm start
```

4. For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Test Execution

- `POST /api/test/run`: Run a test with the provided test plan

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
  "browserPreference": "chromium", // "chromium", "firefox", or "webkit"
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
      "action": "takeScreenshot",
      "description": "Capture search results"
    }
  ]
}
```

## WebSocket Communication

Connect to the WebSocket server at `ws://localhost:3001` to receive real-time updates during test execution.

## Supported Actions

- **Navigation**: navigate, navigateAndWait, goBack, goForward, refresh
- **Element Interaction**: click, type, select, scrollIntoView
- **Keyboard**: keypress, pressEnter, pressTab, pressEsc
- **Wait**: wait
- **Screenshot**: takeScreenshot, captureElement
- **Verification**: assert, verifyText, verifyTextContains, verifyTitle, verifyTitleContains, verifyUrl, verifyUrlContains, verifyElementExists, verifyElementVisible

## Selector Strategies

- **css**: CSS selector
- **xpath**: XPath selector
- **id**: Element ID
- **name**: Element name attribute
- **class**: Element class name
- **text**: Text content (Playwright-specific)
- **role**: Accessibility role (Playwright-specific)

## License

ISC
