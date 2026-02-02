# PopeBot Available Tools

## Credentials

Your API credentials for external services are at `/app/secrets.json`.
Read this file when you need tokens for GitHub, Gmail, Slack, etc.

```bash
# Example: Get GitHub token
jq -r '.github.token' /app/secrets.json

# Example: See all available services
jq 'keys' /app/secrets.json
```

## Browser Automation

A Chrome browser is running in a separate container and accessible for automation tasks.

### Browser Connection

- **Host**: `browser` (internal Docker network)
- **CDP Port**: `9222` (Chrome DevTools Protocol)
- **VNC Desktop**: `https://localhost:6901` (password: `popebot`) - for manual viewing/debugging

**Important**: Chrome's DevTools Protocol rejects connections with hostname-based Host headers. You must connect using the IP address, not the hostname.

```bash
# Get browser IP address
BROWSER_IP=$(getent hosts browser | awk '{print $1}')
# Then use: http://${BROWSER_IP}:9222
```

### Capabilities

- Navigate to URLs
- Click elements
- Fill forms
- Take screenshots
- Extract page content
- Execute JavaScript

### Usage with Puppeteer

```javascript
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

// Get browser IP (Chrome CDP requires IP, not hostname)
const browserIP = execSync('getent hosts browser | awk \'{print $1}\'').toString().trim();

const browser = await puppeteer.connect({
  browserURL: `http://${browserIP}:9222`
});

const page = await browser.newPage();
await page.goto('https://example.com');
// ... perform actions
await browser.disconnect();
```

### Usage with Playwright

**Important**: Always use try/finally and call `process.exit()` to ensure scripts terminate properly.

```javascript
const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
  // Get browser IP (Chrome CDP requires IP, not hostname)
  const browserIP = execSync('getent hosts browser | awk \'{print $1}\'').toString().trim();

  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://${browserIP}:9222`);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();

    await page.goto('https://example.com');
    // ... perform actions
    await page.screenshot({ path: 'workspace/screenshot.png' });

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);  // Always exit to prevent hanging
  }
})();
```

## Command Line Tools

### Git
Full git CLI available for version control operations.

### Node.js (v22)
Latest Node.js runtime with npm for running JavaScript/TypeScript.

### jq
JSON processor for parsing and manipulating JSON data.

```bash
# Parse JSON file
cat data.json | jq '.field'

# Extract from API response
curl -s api.example.com | jq '.results[]'
```

### curl/wget
HTTP clients for making API requests.

## File Operations

Standard Unix file operations are available:
- `cat`, `head`, `tail` - Read files
- `grep`, `find` - Search files
- `sed`, `awk` - Process text
- `mkdir`, `cp`, `mv`, `rm` - Manage files

## Environment Variables

Access configuration through environment variables:
- `$BRANCH` - Current working branch
- `$TASK_FILE` - Path to current task file
- `$ROLE` - Agent role (worker/orchestrator)
- `$REPO_URL` - Repository URL
