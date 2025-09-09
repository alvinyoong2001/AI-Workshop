# AGENTS.md

This file provides context and instructions to help AI coding agents work effectively on this AI automation repository.

## Project Overview

This repository contains an AI agent automation framework with:
- **Playwright MCP**: Browser automation with Model Context Protocol integration
- **Graphiti**: Persistent memory management and knowledge graph
- **Custom MCP Servers**: Git repository management and analysis tools
- **Agent Workflows**: Automated testing, data extraction, and task execution

## Dev Environment Setup

### Prerequisites
- Node.js 18.x or higher
- Python 3.8+ (for Graphiti)
- Git configured with appropriate credentials

### Quick Start
```bash
# Browser automation setup
cd Playwright-MCP
npm install
npx playwright install

# Install browsers (REQUIRED for Playwright)
npx playwright install chromium firefox webkit
```

### Key Commands
- Use `cd Playwright-MCP && npm test` to run all browser automation tests
- Use `npm run test:headed` to run tests with visible browser
- Use `npm run test:debug` to debug failing tests
- Use `npx playwright codegen <URL>` to generate new test scripts
- Check `playwright.config.ts` for timeout and browser settings

## Testing Instructions

### Browser Automation Tests
- Find test files in `Playwright-MCP/tests/` directory (auto-created when first test is generated)
- Run `npm test` from `Playwright-MCP/` directory to execute all tests
- Use `npm run test:headed` to see browser actions during testing
- Use `npm run test:debug` to step through tests and debug failures
- Check `npm run test:report` to view detailed HTML reports with screenshots/videos

### Test Creation Workflow
- Use `npx playwright codegen <target-url>` to record new test interactions
- Save generated tests to `Playwright-MCP/tests/` with descriptive names
- Follow naming convention: `<feature>.spec.ts` (e.g., `login.spec.ts`)
- Always test with incognito mode (configured by default)

### Common Test Patterns
```typescript
// Example: Authentication workflow
test('should login successfully', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('[data-testid="email"]', process.env.EMAIL);
  await page.fill('[data-testid="password"]', process.env.PASSWORD);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('**/dashboard');
});
```

## Configuration Files

### Key Configuration Locations
- `Playwright-MCP/playwright.config.ts` - Browser automation settings
- `Playwright-MCP/package.json` - Dependencies and scripts
- `mcp-browser-config.json` - MCP server configuration for Cursor
- `graphiti/mcp_server/` - Memory management MCP configuration

## MCP Integration Instructions

### Setting up MCP for Agent Automation
- Copy `mcp-browser-config.json` to your Cursor project root
- Restart Cursor IDE after adding MCP configuration
- Test MCP connection by asking agent: "take a screenshot of google.com"

### MCP Configuration Format
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

## Agent Workflow Patterns

### Browser Automation Agent Commands
- "Create a test for login functionality at [URL]"
- "Take a screenshot of the current page"
- "Fill out the form with [data] and submit"
- "Navigate to [URL] and extract [specific data]"
- "Test the responsive design on mobile viewport"

### Memory-Driven Agent Operations
- Agent remembers user preferences and authentication details
- Stores successful test patterns for reuse
- Learns from failed tests to avoid similar issues
- Maintains context across multiple automation sessions

## Troubleshooting

### Browser Installation Issues
```bash
# Reinstall browsers if tests fail
npx playwright install --force

# Install specific browser only
npx playwright install chromium
```

### MCP Connection Problems
- Verify `mcp-browser-config.json` syntax is valid JSON
- Restart Cursor IDE completely (not just reload)
- Check that `@playwright/mcp` is installed: `npm list @playwright/mcp`
- Test with simple command: "take a screenshot of google.com"

### Test Execution Issues
- Check Node.js version is 18.x or higher: `node --version`
- Verify all dependencies installed: `npm install`
- Run tests with debug flag: `npm run test:debug`
- Check `playwright.config.ts` for timeout settings

### Memory/Context Issues
- Ensure Graphiti dependencies are installed
- Check Python version: `python --version` (3.8+ required)
- Verify MCP server configurations in respective directories

## Project Structure Tips

### Repository Organization
```
d:\AI\
├── AGENTS.md                   # This file - agent instructions
├── Playwright-MCP\            # Browser automation framework
│   ├── playwright.config.ts   # Main config for timeouts, browsers
│   ├── package.json           # Scripts: test, test:headed, test:debug
│   └── tests\                 # Auto-created test directory
├── graphiti\                  # Memory management system
│   ├── graphiti_core\         # Core memory engine
│   └── mcp_server\            # MCP integration for memory
├── Custom-MCPservers\         # Custom MCP implementations
│   └── Git-Mcp-server\        # Git repository management
└── mcp-browser-config.json    # MCP server config for Cursor
```

### Working with Components
- **Playwright-MCP**: Browser automation and testing
- **Graphiti**: Agent memory and context management
- **Custom MCP Servers**: Extended functionality for Git/analysis
- **MCP Integration**: Natural language commands for automation

## Agent Instructions Summary

When working on this repository:
1. **Always run browser tests** before committing changes to Playwright-MCP
2. **Use descriptive test names** that explain the scenario being tested
3. **Test with incognito mode** (configured by default in playwright.config.ts)
4. **Generate new tests** using `npx playwright codegen <URL>` for efficiency
5. **Check MCP integration** by testing simple commands like "take a screenshot"
6. **Follow TypeScript patterns** shown in existing configuration files
7. **Run full test suite** with `npm test` before merging any changes

This setup enables agents to perform browser automation, maintain persistent memory, and execute complex workflows through natural language commands.
