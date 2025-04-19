/**
 * Anti-detection measures for browser automation
 * Helps avoid bot detection mechanisms on websites
 */

/**
 * Applies anti-detection measures to the page
 * @param {Page} page - Playwright page object
 * @param {string} browserType - Type of browser being used
 * @returns {Promise<void>}
 */
export async function applyAntiDetectionMeasures(page, browserType) {
  await page.addInitScript(getAntiDetectionScript(browserType));
  console.log('Anti-detection measures applied to browser page');
}

/**
 * Returns the anti-detection script based on browser type
 * @param {string} browserType - Type of browser being used
 * @returns {Function} Script function to be injected
 */
function getAntiDetectionScript(browserType) {
  return () => {
    // Firefox için özel gizleme
    if (navigator.userAgent.includes('Firefox')) {
      // Firefox'ta window.navigator.webdriver'i gizle
      Object.defineProperty(window, 'navigator', {
        value: new Proxy(navigator, {
          has: (target, key) => (key === 'webdriver' ? false : key in target),
          get: (target, key) => {
            if (key === 'webdriver') {
              return undefined;
            }
            return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
          }
        })
      });
    }
    
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
  };
}
