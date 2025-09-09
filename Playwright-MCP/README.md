# Playwright

## Prerequisites

### Node.js Installation
- **Download**: Visit [nodejs.org](https://nodejs.org/) and download the LTS version
- **Version**: Node.js 18.x or higher recommended
- **Verify**: Run `node --version` in terminal to confirm installation

### npm (Node Package Manager)
- **Included**: Automatically installed with Node.js
- **Verify**: Run `npm --version` to check installation
- **Update**: Run `npm install -g npm@latest` to get latest version

### npx (Node Package Execute)
- **Included**: Comes with npm 5.2.0+ and Node.js 8.2.0+
- **Purpose**: Runs packages without installing them globally
- **Verify**: Run `npx --version` to confirm availability

### System Requirements
- **OS**: Windows 10+, macOS 10.14+, or Linux
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 1GB free space for browsers and dependencies

## Playwright CodeGen

### Installation
```bash
# Install Playwright framework
npm install -D @playwright/test

# Install browsers (REQUIRED!)
npx playwright install
```

> **⚠️ Critical Step:** You MUST run `npx playwright install` to download browser binaries. This downloads Chromium, Firefox, and WebKit browsers that Playwright uses for testing.

### Start Recording
```bash
npx playwright codegen https://tigerlily-hub.staging-0-1-0.ideagendev.com/
```

### Run Tests
```bash
npx playwright test test.spec.ts --headed
```

## Playwright MCP

### Installation
```bash
npm install -D @playwright/mcp
```

### Configuration
Create `mcp.json` file:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp"
      ],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "PLAYWRIGHT_BROWSER": "chromium"
      }
    }
  }
}
```
### Setup MCP in Cursor
1. Create `mcp.json` file in your project root
2. Restart Cursor IDE
3. Verify MCP is working: Ask Cursor AI to "take a screenshot of google.com"

### Example Usage
In Cursor AI chat, you can use natural language:
```
"Create a Playwright test using MCP workflow for Tigerlily Hub authentication"
"Take a screenshot of the current page"
"Fill the login form and submit"
"Navigate to the dashboard and verify it loads"
```

## Quick Start Guide

### 1. Initialize Project
```bash
# Create new project folder
mkdir my-playwright-project
cd my-playwright-project

# Initialize npm project
npm init -y
```

### 2. Install Playwright
```bash
# Install Playwright testing framework
npm install -D @playwright/test

# Install browsers (REQUIRED) - Downloads Chromium, Firefox, WebKit
npx playwright install
```

**⚠️ Important:** The `npx playwright install` command downloads the actual browser binaries (Chromium, Firefox, WebKit) that Playwright needs to run tests. Without this step, your tests will fail!

### 3. Install MCP
```bash
npm install -D @playwright/mcp
```

### 4. Create Configuration Files

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--incognito'] }
      },
    }
  ],
});
```

**mcp.json:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "PLAYWRIGHT_BROWSER": "chromium"
      }
    }
  }
}
```

### 5. Test Your Setup
```bash
# Test Playwright installation
npx playwright test --version

# Record your first test
npx playwright codegen https://example.com

# Test MCP integration (in Cursor AI)
"Take a screenshot of google.com"
```

## Common Commands

### Playwright Commands
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test test.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug tests
npx playwright test --debug

# Generate test report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots
```

### CodeGen Commands
```bash
# Basic recording
npx playwright codegen <URL>

# Record with specific browser
npx playwright codegen --browser=firefox <URL>

# Save to specific file
npx playwright codegen --target=tests/my-test.spec.ts <URL>

# Record mobile viewport
npx playwright codegen --device="iPhone 12" <URL>
```

## Troubleshooting

### MCP Not Working?
1. Restart Cursor IDE completely
2. Check `mcp.json` is in project root
3. Verify syntax in `mcp.json` file
4. Try simple command: "take a screenshot of google.com"

### Browser Installation Issues?
```bash
# Reinstall browsers
npx playwright install --force

# Install specific browser
npx playwright install chromium
```

### Tests Failing?
```bash
# Run with debug info
npx playwright test --debug

# Check configuration
npx playwright test --list

# View last test report
npx playwright show-report
```

## Example Test Workflow

### Traditional Approach:
1. Write test manually or use codegen
2. Run `npx playwright test`
3. Debug failures manually

### MCP Approach:
1. Ask Cursor AI: "Create a test for login flow"
2. AI generates and runs test automatically
3. Ask AI to fix any issues: "The test is failing, please debug"
4. Example test case below

### Create a Playwright test using MCP workflow for Tigerlily Hub authentication :

 @.cursorrules 

**Requirements:**
1. Follow .cursorrules ruleset strictly
2. Use Playwright MCP

Steps
1. Target URL: https://tigerlily-hub.staging-0-1-0.ideagendev.com/
2. Fill Credentials Email textbox = xxxxxxx  and Password textbox =  xxxxxx

After all steps done. 
1.Generate code for all steps above based on your Playwright MCP walkthrough testing. Your code need to fill on visible element only.
2. Create code in d:\AI\Playwright-MCP\tests\
3.Test the script and fix it if failures


refine my prompt above just refine above

## Best Practices

- **Use descriptive test names**: `test('should login successfully with valid credentials')`
- **Implement proper waits**: Avoid `page.waitForTimeout()`, use `page.waitForLoadState()`
- **Handle dynamic content**: Use `page.waitForSelector()` for elements
- **Clean test data**: Reset state between tests
- **Use incognito mode**: Prevents session interference
- **Take screenshots on failure**: Helps with debugging

