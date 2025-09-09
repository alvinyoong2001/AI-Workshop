import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.{test,spec,specs}.{js,ts,mjs}'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // Global timeout for all tests
  use: {
    // Remove baseURL for external testing
    // baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Add navigation timeout
    navigationTimeout: 30000,
    // Add action timeout
    actionTimeout: 10000,
    // Force incognito mode for all browsers
    contextOptions: {
      // This ensures a clean context for each test
      ignoreHTTPSErrors: true,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Add viewport settings
        viewport: { width: 1280, height: 720 },
        // Enable incognito mode for Chromium
        launchOptions: {
          args: ['--incognito'],
        },
      },
    },
    // Additional browsers can be enabled if needed
    /*
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        // Enable private browsing for Firefox
        launchOptions: {
          args: ['--private-window'],
        },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        // WebKit (Safari) doesn't have a direct incognito flag,
        // but each test gets a fresh context by default
        launchOptions: {
          args: [],
        },
      },
    },
    */
  ],

  // Remove webServer configuration for external URL testing
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

