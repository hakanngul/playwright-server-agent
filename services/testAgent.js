import { chromium, firefox } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestAgent {
  constructor(browserType = 'chromium', options = {}) {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotsDir = path.join(__dirname, '../screenshots');
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true; // Varsayılan olarak headless mod
    this.onStepCompleted = null; // Callback for step completion
    // Başlangıçta initialized false olsun
    this.initialized = false;

    console.log(`TestAgent created with browserType: ${browserType}, headless: ${this.headless}`);
  }

  async initialize() {
    // Eğer zaten initialize edildiyse tekrar etmeyelim
    if (this.initialized) {
      return;
    }

    console.log(`Initializing browser (type: ${this.browserType})...`);
    try {
      // Ensure screenshots directory exists
      if (!fs.existsSync(this.screenshotsDir)) {
        fs.mkdirSync(this.screenshotsDir, { recursive: true });
      }

      // Launch options based on Puppeteer's successful configuration
      const launchOptions = {
        headless: this.headless, // Use headless mode based on test plan
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled', // Try to avoid detection
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--hide-scrollbars',
          '--window-size=1920,1080',
          '--lang=en-US,en',
          '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        timeout: 60000 // Increase timeout to 60 seconds
      };

      // Launch the appropriate browser based on preference
      switch (this.browserType) {
        case 'firefox':
          console.log('Using Firefox browser');
          this.browser = await firefox.launch(launchOptions);
          break;
        case 'chromium':
        default:
          console.log('Using Chromium browser');
          this.browser = await chromium.launch(launchOptions);
          break;
      }

      console.log('Browser launched successfully');

      // Create a new browser context with viewport and user agent
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        geolocation: { longitude: -122.084, latitude: 37.422 }, // Silicon Valley
        permissions: ['geolocation'],
        colorScheme: 'light',
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        javaScriptEnabled: true,
        // Avoid bot detection
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120", "Not-A.Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1'
        }
      });

      // Create a new page
      this.page = await this.context.newPage();

      // Set timeouts
      this.page.setDefaultTimeout(30000); // 30 seconds timeout for operations

      // Add script to avoid bot detection (based on Puppeteer's successful configuration)
      await this.page.addInitScript(() => {
        // Overwrite the 'webdriver' property to make it undefined
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        // Add language plugins to avoid detection
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'tr']
        });

        // Overwrite permissions to avoid detection
        if (navigator.permissions) {
          const originalQuery = navigator.permissions.query;
          navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
              Promise.resolve({ state: Notification.permission }) :
              originalQuery(parameters)
          );
        }

        // Hide automation features
        delete navigator.__proto__.webdriver;

        // Modify plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => {
            return [{
              0: {
                type: 'application/pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format'
              },
              description: 'PDF Viewer',
              filename: 'internal-pdf-viewer',
              length: 1,
              name: 'Chrome PDF Viewer'
            }];
          }
        });

        // Add Chrome specific properties
        window.chrome = {
          app: {
            isInstalled: false,
            InstallState: {
              DISABLED: 'disabled',
              INSTALLED: 'installed',
              NOT_INSTALLED: 'not_installed'
            },
            RunningState: {
              CANNOT_RUN: 'cannot_run',
              READY_TO_RUN: 'ready_to_run',
              RUNNING: 'running'
            }
          },
          runtime: {
            OnInstalledReason: {
              CHROME_UPDATE: 'chrome_update',
              INSTALL: 'install',
              SHARED_MODULE_UPDATE: 'shared_module_update',
              UPDATE: 'update'
            },
            OnRestartRequiredReason: {
              APP_UPDATE: 'app_update',
              OS_UPDATE: 'os_update',
              PERIODIC: 'periodic'
            },
            PlatformArch: {
              ARM: 'arm',
              ARM64: 'arm64',
              MIPS: 'mips',
              MIPS64: 'mips64',
              X86_32: 'x86-32',
              X86_64: 'x86-64'
            },
            PlatformNaclArch: {
              ARM: 'arm',
              MIPS: 'mips',
              MIPS64: 'mips64',
              X86_32: 'x86-32',
              X86_64: 'x86-64'
            },
            PlatformOs: {
              ANDROID: 'android',
              CROS: 'cros',
              LINUX: 'linux',
              MAC: 'mac',
              OPENBSD: 'openbsd',
              WIN: 'win'
            },
            RequestUpdateCheckStatus: {
              NO_UPDATE: 'no_update',
              THROTTLED: 'throttled',
              UPDATE_AVAILABLE: 'update_available'
            }
          }
        };
      });

      console.log('Browser page initialized with anti-detection measures');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  async takeScreenshot(stepIndex) {
    const timestamp = new Date().getTime();
    const filename = `step_${stepIndex + 1}_${timestamp}.png`;
    const filePath = path.join(this.screenshotsDir, filename);

    await this.page.screenshot({ path: filePath, fullPage: true });

    return filename;
  }

  async getElementByStrategy(target, strategy) {
    console.log(`Getting element by strategy: ${strategy}, target: ${target}`);
    try {
      // Playwright uses a unified selector engine, but we'll maintain compatibility
      // with the existing strategy-based approach
      switch (strategy) {
        case 'css':
          return await this.page.$(target);
        case 'xpath':
          console.log(`Looking for element with XPath: ${target}`);
          return await this.page.$(`xpath=${target}`);
        case 'id':
          console.log(`Looking for element with ID: #${target}`);
          return await this.page.$(`#${target}`);
        case 'name':
          return await this.page.$(`[name="${target}"]`);
        case 'class':
          return await this.page.$(`.${target}`);
        case 'text':
          // Playwright's text selector
          return await this.page.$(`text=${target}`);
        case 'role':
          // Playwright's role selector (accessibility)
          return await this.page.$(`role=${target}`);
        default:
          throw new Error(`Unsupported selector strategy: ${strategy}`);
      }
    } catch (error) {
      console.error(`Error in getElementByStrategy: ${error.message}`);
      return null;
    }
  }

  // Wait for element to be visible based on strategy
  async waitForElementByStrategy(target, strategy, timeout = 10000) {
    console.log(`Waiting for element by strategy: ${strategy}, target: ${target}`);
    try {
      let selector;

      switch (strategy) {
        case 'css':
          selector = target;
          break;
        case 'xpath':
          console.log(`Waiting for XPath: ${target}`);
          selector = `xpath=${target}`;
          break;
        case 'id':
          selector = `#${target}`;
          break;
        case 'name':
          selector = `[name="${target}"]`;
          break;
        case 'class':
          selector = `.${target}`;
          break;
        case 'text':
          selector = `text=${target}`;
          break;
        case 'role':
          selector = `role=${target}`;
          break;
        default:
          throw new Error(`Unsupported selector strategy: ${strategy}`);
      }

      // Wait for the element to be visible
      await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout
      });

      return true;
    } catch (error) {
      console.error(`Error waiting for element: ${error.message}`);
      return false;
    }
  }

  async executeStep(step, index, takeScreenshots = true) {
    const { action, target, value, strategy } = step;
    let success = true;
    let message = '';
    let screenshot = null;
    let startTime = new Date();

    console.log(`Executing step ${index + 1}: ${action} on ${target || value}`);

    try {
      switch (action) {
        // Navigation actions
        case 'navigate':
        case 'navigateAndWait':
          console.log(`Navigating to: ${value}`);
          await this.page.goto(value, {
            waitUntil: 'networkidle',
            timeout: 60000
          });
          console.log('Navigation complete');
          break;

        case 'goBack':
          console.log('Going back to previous page');
          await this.page.goBack();
          break;

        case 'goForward':
          console.log('Going forward to next page');
          await this.page.goForward();
          break;

        case 'refresh':
          console.log('Refreshing the current page');
          await this.page.reload();
          break;

        // Click actions
        case 'click':
          console.log(`Finding element to click: ${target} using ${strategy}`);

          // Playwright has built-in waiting, but we'll keep our explicit wait for compatibility
          const clickElementVisible = await this.waitForElementByStrategy(target, strategy, 10000);
          if (!clickElementVisible) {
            throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
          }

          // Convert strategy and target to Playwright selector
          let clickSelector;
          switch (strategy) {
            case 'css': clickSelector = target; break;
            case 'xpath': clickSelector = `xpath=${target}`; break;
            case 'id': clickSelector = `#${target}`; break;
            case 'name': clickSelector = `[name="${target}"]`; break;
            case 'class': clickSelector = `.${target}`; break;
            case 'text': clickSelector = `text=${target}`; break;
            case 'role': clickSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Click with force:true to ensure the click happens even if the element
          // is covered by another element
          await this.page.click(clickSelector, {
            force: false,  // Set to true only if needed
            timeout: 10000,
            delay: 100     // Small delay for more human-like interaction
          });

          console.log('Click performed successfully');

          // If this is a search button, wait for results to load
          if (target.includes('btnK') || target.includes('search')) {
            console.log('Search button detected, waiting for results...');
            await this.page.waitForLoadState('networkidle');
          }
          break;

        case 'type':
          console.log(`Finding element to type into: ${target} using ${strategy}`);

          // Wait for element to be visible
          const typeElementVisible = await this.waitForElementByStrategy(target, strategy, 10000);
          if (!typeElementVisible) {
            throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
          }

          // Convert strategy and target to Playwright selector
          let typeSelector;
          switch (strategy) {
            case 'css': typeSelector = target; break;
            case 'xpath': typeSelector = `xpath=${target}`; break;
            case 'id': typeSelector = `#${target}`; break;
            case 'name': typeSelector = `[name="${target}"]`; break;
            case 'class': typeSelector = `.${target}`; break;
            case 'text': typeSelector = `text=${target}`; break;
            case 'role': typeSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Clear the field first (Playwright doesn't have a direct clear method)
          await this.page.fill(typeSelector, '');

          // Type the text with a delay for more human-like typing
          // Using fill with delay for more human-like typing
          await this.page.fill(typeSelector, value, { delay: 50 });

          console.log(`Typed text: ${value}`);
          break;

        case 'select':
          console.log(`Finding select element: ${target} using ${strategy}`);

          // Wait for element to be visible
          const selectElementVisible = await this.waitForElementByStrategy(target, strategy, 10000);
          if (!selectElementVisible) {
            throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
          }

          // Convert strategy and target to Playwright selector
          let selectSelector;
          switch (strategy) {
            case 'css': selectSelector = target; break;
            case 'xpath': selectSelector = `xpath=${target}`; break;
            case 'id': selectSelector = `#${target}`; break;
            case 'name': selectSelector = `[name="${target}"]`; break;
            case 'class': selectSelector = `.${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Select the option
          await this.page.selectOption(selectSelector, value);

          console.log(`Selected option: ${value}`);
          break;

        case 'wait':
          const waitTime = parseInt(value) || 1000;
          console.log(`Waiting for ${waitTime}ms`);
          await this.page.waitForTimeout(waitTime);
          console.log('Wait complete');
          break;

        // Keyboard actions
        case 'keypress':
          console.log(`Pressing key: ${value}`);
          await this.page.keyboard.press(value);
          console.log(`Key pressed: ${value}`);

          // If Enter key is pressed, wait for page to load
          if (value === 'Enter') {
            console.log('Enter key detected, waiting for page to load...');
            await this.page.waitForLoadState('networkidle');
          }
          break;

        case 'pressEnter':
          console.log('Pressing Enter key');
          await this.page.keyboard.press('Enter');
          console.log('Enter key pressed, waiting for page to load...');
          await this.page.waitForLoadState('networkidle');
          break;

        case 'pressTab':
          console.log('Pressing Tab key');
          await this.page.keyboard.press('Tab');
          break;

        case 'pressEsc':
          console.log('Pressing Escape key');
          await this.page.keyboard.press('Escape');
          break;

        // Scroll actions
        case 'scrollIntoView':
          console.log(`Scrolling element into view: ${target} using ${strategy}`);

          // Convert strategy and target to Playwright selector
          let scrollSelector;
          switch (strategy) {
            case 'css': scrollSelector = target; break;
            case 'xpath': scrollSelector = `xpath=${target}`; break;
            case 'id': scrollSelector = `#${target}`; break;
            case 'name': scrollSelector = `[name="${target}"]`; break;
            case 'class': scrollSelector = `.${target}`; break;
            case 'text': scrollSelector = `text=${target}`; break;
            case 'role': scrollSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Scroll element into view
          const element = await this.page.$(scrollSelector);
          if (!element) {
            throw new Error(`Element not found: ${target} using ${strategy}`);
          }

          await element.scrollIntoViewIfNeeded();
          console.log('Element scrolled into view');
          break;

        case 'scrollToTop':
          console.log('Scrolling to top of the page');
          await this.page.evaluate(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          break;

        case 'scrollToBottom':
          console.log('Scrolling to bottom of the page');
          await this.page.evaluate(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          });
          break;

        // Screenshot actions
        case 'takeScreenshot':
          if (takeScreenshots) {
            console.log('Taking screenshot of the current page');
            screenshot = `screenshot_${Date.now()}.png`;
            await this.page.screenshot({ path: path.join(this.screenshotsDir, screenshot) });
            console.log(`Screenshot saved: ${screenshot}`);
          } else {
            console.log('Screenshot capture is disabled, skipping takeScreenshot action');
          }
          break;

        case 'captureElement':
          if (takeScreenshots) {
            console.log(`Capturing screenshot of element: ${target} using ${strategy}`);

            // Convert strategy and target to Playwright selector
            let captureSelector;
            switch (strategy) {
              case 'css': captureSelector = target; break;
              case 'xpath': captureSelector = `xpath=${target}`; break;
              case 'id': captureSelector = `#${target}`; break;
              case 'name': captureSelector = `[name="${target}"]`; break;
              case 'class': captureSelector = `.${target}`; break;
              case 'text': captureSelector = `text=${target}`; break;
              case 'role': captureSelector = `role=${target}`; break;
              default: throw new Error(`Unsupported selector strategy: ${strategy}`);
            }

            // Get the element
            const captureElement = await this.page.$(captureSelector);
            if (!captureElement) {
              throw new Error(`Element not found: ${target} using ${strategy}`);
            }

            // Take screenshot of element
            screenshot = `element_${Date.now()}.png`;
            await captureElement.screenshot({ path: path.join(this.screenshotsDir, screenshot) });
            console.log(`Element screenshot saved: ${screenshot}`);
          } else {
            console.log('Screenshot capture is disabled, skipping captureElement action');
          }
          break;

        // Verification actions
        case 'assert':
        case 'verifyText':
          console.log(`Verifying text of element: ${target} using ${strategy}`);

          // Convert strategy and target to Playwright selector
          let assertSelector;
          switch (strategy) {
            case 'css': assertSelector = target; break;
            case 'xpath': assertSelector = `xpath=${target}`; break;
            case 'id': assertSelector = `#${target}`; break;
            case 'name': assertSelector = `[name="${target}"]`; break;
            case 'class': assertSelector = `.${target}`; break;
            case 'text': assertSelector = `text=${target}`; break;
            case 'role': assertSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Wait for element to be visible
          await this.page.waitForSelector(assertSelector, { state: 'visible', timeout: 10000 });

          // Get the text content of the element
          const textContent = await this.page.$eval(assertSelector, el => el.textContent.trim());
          console.log(`Assertion check - Expected: "${value}", Actual: "${textContent}"`);

          // Compare with expected value
          if (textContent !== value) {
            throw new Error(`Assertion failed: Expected "${value}" but got "${textContent}"`);
          }

          console.log('Assertion passed');
          break;

        case 'verifyTextContains':
          console.log(`Verifying text of element contains: ${target} using ${strategy}`);

          // Convert strategy and target to Playwright selector
          let containsSelector;
          switch (strategy) {
            case 'css': containsSelector = target; break;
            case 'xpath': containsSelector = `xpath=${target}`; break;
            case 'id': containsSelector = `#${target}`; break;
            case 'name': containsSelector = `[name="${target}"]`; break;
            case 'class': containsSelector = `.${target}`; break;
            case 'text': containsSelector = `text=${target}`; break;
            case 'role': containsSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Wait for element to be visible
          await this.page.waitForSelector(containsSelector, { state: 'visible', timeout: 10000 });

          // Get the text content of the element
          const containsText = await this.page.$eval(containsSelector, el => el.textContent.trim());

          // Check if text contains expected value
          if (!containsText.includes(value)) {
            throw new Error(`Assertion failed: Expected text to contain "${value}", but got "${containsText}"`);
          }

          console.log(`Assertion passed: Text contains "${value}"`);
          break;

        case 'verifyTitle':
          console.log(`Verifying page title is: ${value}`);
          const pageTitle = await this.page.title();

          if (pageTitle !== value) {
            throw new Error(`Assertion failed: Expected title "${value}", but got "${pageTitle}"`);
          }

          console.log(`Assertion passed: Title is "${pageTitle}"`);
          break;

        case 'verifyTitleContains':
          console.log(`Verifying page title contains: ${value}`);
          const titleText = await this.page.title();

          if (!titleText.includes(value)) {
            throw new Error(`Assertion failed: Expected title to contain "${value}", but got "${titleText}"`);
          }

          console.log(`Assertion passed: Title contains "${value}"`);
          break;

        case 'verifyUrl':
          console.log(`Verifying URL is: ${value}`);
          const pageUrl = this.page.url();

          if (pageUrl !== value) {
            throw new Error(`Assertion failed: Expected URL "${value}", but got "${pageUrl}"`);
          }

          console.log(`Assertion passed: URL is "${pageUrl}"`);
          break;

        case 'verifyUrlContains':
          console.log(`Verifying URL contains: ${value}`);
          const urlText = this.page.url();

          if (!urlText.includes(value)) {
            throw new Error(`Assertion failed: Expected URL to contain "${value}", but got "${urlText}"`);
          }

          console.log(`Assertion passed: URL contains "${value}"`);
          break;

        case 'verifyElementExists':
          console.log(`Verifying element exists: ${target} using ${strategy}`);

          // Convert strategy and target to Playwright selector
          let existsSelector;
          switch (strategy) {
            case 'css': existsSelector = target; break;
            case 'xpath': existsSelector = `xpath=${target}`; break;
            case 'id': existsSelector = `#${target}`; break;
            case 'name': existsSelector = `[name="${target}"]`; break;
            case 'class': existsSelector = `.${target}`; break;
            case 'text': existsSelector = `text=${target}`; break;
            case 'role': existsSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Check if element exists
          const elementExists = await this.page.$(existsSelector);
          if (!elementExists) {
            throw new Error(`Assertion failed: Element does not exist: ${target}`);
          }

          console.log('Assertion passed: Element exists');
          break;

        case 'verifyElementVisible':
          console.log(`Verifying element is visible: ${target} using ${strategy}`);

          // Convert strategy and target to Playwright selector
          let visibleSelector;
          switch (strategy) {
            case 'css': visibleSelector = target; break;
            case 'xpath': visibleSelector = `xpath=${target}`; break;
            case 'id': visibleSelector = `#${target}`; break;
            case 'name': visibleSelector = `[name="${target}"]`; break;
            case 'class': visibleSelector = `.${target}`; break;
            case 'text': visibleSelector = `text=${target}`; break;
            case 'role': visibleSelector = `role=${target}`; break;
            default: throw new Error(`Unsupported selector strategy: ${strategy}`);
          }

          // Check if element is visible
          try {
            await this.page.waitForSelector(visibleSelector, {
              state: 'visible',
              timeout: 5000
            });
            console.log('Assertion passed: Element is visible');
          } catch (error) {
            throw new Error(`Assertion failed: Element is not visible: ${target}`);
          }
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Take screenshot after successful step execution if enabled
      if (takeScreenshots) {
        screenshot = await this.takeScreenshot(index);
        console.log(`Screenshot taken for step ${index + 1}: ${screenshot}`);
      } else {
        console.log(`Screenshot capture disabled for step ${index + 1}`);
      }
    } catch (error) {
      success = false;
      message = error.message;

      // Take screenshot on failure as well if enabled
      if (takeScreenshots) {
        screenshot = await this.takeScreenshot(index);
        console.log(`Error screenshot taken for step ${index + 1}: ${screenshot}`);
      } else {
        console.log(`Screenshot capture disabled for error in step ${index + 1}`);
      }
    }

    const endTime = new Date();
    const duration = endTime - startTime;

    return {
      ...step,
      success,
      message,
      screenshot,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration
    };
  }

  async runTest(testPlan) {
    // Test çalıştırılmadan önce initialize edelim
    if (!this.initialized) {
      await this.initialize();
    }
    console.log(`\n=== Starting test: ${testPlan.name || 'Unnamed Test'} ===`);
    console.log(`Description: ${testPlan.description || 'No description'}`);
    console.log(`Total steps: ${testPlan.steps.length}\n`);

    // Record start time
    const startTime = new Date().toISOString();

    const results = {
      name: testPlan.name || 'Unnamed Test',
      description: testPlan.description || 'No description',
      startTime,
      steps: [],
      success: true,
      browser: this.browserType
    };

    try {
      // Initialize browser
      await this.initialize();

      // Check if screenshot capture is enabled
      const takeScreenshots = testPlan.takeScreenshots !== undefined ? testPlan.takeScreenshots : true;
      console.log(`Screenshot capture is ${takeScreenshots ? 'enabled' : 'disabled'} for this test run`);

      // Execute each step
      for (let i = 0; i < testPlan.steps.length; i++) {
        console.log(`\n--- Step ${i + 1}/${testPlan.steps.length} ---`);
        const stepResult = await this.executeStep(testPlan.steps[i], i, takeScreenshots);
        results.steps.push(stepResult);

        // Call step completed callback
        if (this.onStepCompleted) {
          this.onStepCompleted(testPlan.steps[i], stepResult, i);
        }

        // Stop execution if a step fails
        if (!stepResult.success) {
          results.success = false;
          console.log(`Test stopped due to failure at step ${i + 1}`);
          break;
        }
      }

      // Record end time and calculate duration
      results.endTime = new Date().toISOString();
      results.duration = new Date(results.endTime) - new Date(startTime);

      // Log summary
      const successCount = results.steps.filter(step => step.success).length;
      console.log(`\n=== Test completed ===`);
      console.log(`Result: ${successCount}/${results.steps.length} steps passed`);
      console.log(`Duration: ${results.duration}ms\n`);

      return results;
    } catch (error) {
      console.error('Test execution failed:', error);

      // Record end time and calculate duration for failed test
      results.endTime = new Date().toISOString();
      results.duration = new Date(results.endTime) - new Date(startTime);
      results.success = false;
      results.error = error.message;

      throw error;
    } finally {
      try {
        await this.close();
        console.log('Browser closed');
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
}

export { TestAgent };
