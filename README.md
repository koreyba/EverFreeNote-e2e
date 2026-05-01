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
npm run test:allure      # all browsers + generate Allure report
npm run test:chromium    # chromium only
npm run test:headed      # with browser UI
npm run test:ui          # interactive Playwright UI
npm run test:report      # open last HTML report
npm run allure:generate  # build Allure HTML from allure-results/e2e
npm run allure:open      # serve generated Allure report locally
```

## Reports

Playwright now writes three report outputs in parallel:

- HTML report in `playwright-report/`
- JSON report in `results.json`
- Allure raw results in `allure-results/e2e/`

Generate the Allure Report v3 HTML output into `allure-report/e2e/` with:

```bash
npm run allure:generate
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
