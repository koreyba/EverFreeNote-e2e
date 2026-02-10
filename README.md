# EverFreeNote Playwright

End-to-end and API tests for [EverFreeNote](https://github.com/) using Playwright.

## Prerequisites

- Node.js 18+
- Playwright browsers installed

## Setup

```bash
npm install
npx playwright install
```

Create a `.env` file in the project root:

```env
BASE_URL=https://your-app-url.com
SUPABASE_ANON_KEY=your-anon-key        # optional
SUPABASE_FUNCTIONS_URL=https://...      # optional, resolved from JWT by default
```

## Running Tests

```bash
npm test                 # all browsers
npm run test:chromium    # chromium only
npm run test:headed      # with browser UI
npm run test:ui          # interactive Playwright UI
npm run test:report      # open last HTML report
```

## Project Structure

```
tests/                  # Test specs (CRUD, search, bulk delete, export/import)
test-api/               # Typed API client, auth module, types
test-elements/          # Page objects, fixtures, UI flows
test-utils/             # Global setup, auth state, helpers
playwright.config.ts    # Playwright configuration
```

## Auth

Authentication is handled automatically. Global setup logs in via a test user, saves the session to `playwright/.auth/user.json`, and reuses it across all tests. Tokens are refreshed proactively before expiry.
