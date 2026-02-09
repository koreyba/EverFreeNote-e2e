---
name: playwright-test-quality-standard
description: Enforce visual and structural quality standards for Playwright + TypeScript tests. Use when reviewing, writing, or refactoring Playwright tests for readability, maintainability, and consistent test architecture (assert placement, fixture usage, locator style, page object boundaries, file structure, and typing).
---

# Playwright Test Quality Standard (Visual / Structural)

Apply these rules to evaluate and improve Playwright + TypeScript tests.

Scope:
- Focus on readability, structure, and consistency.
- Exclude functional correctness unless explicitly requested.
- Operate in report-only mode: do not edit code, do not apply patches, do not run refactoring commands.

## Operating mode (report only)

When this skill is active:
- Do not modify files.
- Do not propose silent auto-fixes.
- Deliver a structured review report with concrete file/line references.
- For every reported issue, include an actionable AI prompt that can be used to implement the fix in a separate step.

## 1. Keep assertions visible

Place all meaningful checks (`expect`) directly in the test body.

Rules:
- Do not hide `expect` inside helper functions, Page Object methods, or utilities.
- Allow repeated `expect` lines across tests when it improves clarity.
- Allow helpers to prepare data and perform actions, but not validate outcomes.

Example:
```ts
// Bad: assertion is hidden
await loginPage.loginAndVerify(user);

// Good: action and assertion are explicit
await loginPage.login(user);
await expect(page.getByText('Dashboard')).toBeVisible();
```

## 2. Make tests read like scenarios

Ensure each test reads top-down as: setup -> action -> verification.

Rules:
- Write test names as expected behavior, not implementation detail.
- Avoid vague names like `works correctly`.
- Prefer concise names (2-8 words).

## 3. Use fixtures for environment, not for actions

Fixture purpose:
- Define the world the test runs in, not what the test does.

Move into fixtures:
- Authentication (especially `storageState`).
- API setup/teardown for test data.
- Page Object instances with trivial constructors (`new PO(page)`).

Do not move into fixtures:
- Navigation to a concrete page in a specific scenario.
- Actions needed only by one or two tests.
- Repeated auth logic in file-level `beforeEach` (replace with fixture).

Keep fixture usage healthy:
- Use transparent fixture names (`authenticatedPage` is clear; `testData` is vague).
- Keep fixture dependency depth <= 2 levels.
- Do not place `expect` inside fixtures.
- If fixture extraction makes the test hard to understand, roll back that extraction.

Example:
```ts
// fixtures.ts
export const test = base.extend<{
  leftPanel: LeftPanel;
  editView: EditView;
}>({
  leftPanel: async ({ page }, use) => use(new LeftPanel(page)),
  editView: async ({ page }, use) => use(new EditView(page)),
});
```

```ts
// Good: reduced boilerplate, scenario still explicit
test('user sees order history', async ({ authenticatedPage, ordersPage }) => {
  await authenticatedPage.goto('/orders');
  await expect(ordersPage.table).toBeVisible();
});
```

## 4. Prefer Playwright-idiomatic locators

Priority:
- `getByRole`, `getByText`, `getByLabel`, `getByTestId`.

Avoid:
- `page.locator('.css-class')`, `page.locator('#id')`, XPath.

Rules:
- Choose semantic locators that reflect user-visible behavior.
- Complex locators may live in Page Objects as properties (not logic-heavy methods).

## 5. Keep Page Objects thin

Page Objects should contain:
- Locators (properties/getters).
- Action methods (`fill`, `click`, navigation).

Page Objects should not contain:
- `expect` checks.
- Business logic.
- Conditional branching (`if`/`else`).

## 6. Avoid magic values

Rules:
- Keep strings, URLs, and numbers self-explanatory or move them into named constants.
- Prefer route builders and named values over hardcoded IDs/paths.

Example:
```ts
// Bad
await page.goto('/app/v2/entity/42');

// Good
await page.goto(routes.entityDetails(entityId));
```

## 7. Avoid conditional logic in tests

Rules:
- Do not use `if`, `switch`, or `try/catch` in test bodies.
- Keep tests linear and deterministic.
- Represent different conditions as separate tests or parameterized cases.

## 8. Rely on Playwright auto-waiting

Use:
- `await expect(locator).toBeVisible()` and related assertions.

Avoid:
- `waitForTimeout`.
- `page.waitForSelector` before assertion when assertion already waits.
- Manual retry/poll loops for native Playwright wait scenarios.

## 9. Group tests by feature with `test.describe`

Rules:
- Group tests by feature or page.
- Keep `describe` nesting depth <= 2.
- Do not group by check polarity (`positive`/`negative`).

## 10. Require strict typing

Rules:
- Keep TypeScript typing strict.
- Do not use `any`.
- Type test data with explicit interfaces/types.

## 11. Keep imports and file structure clean

Rules:
- File order: imports -> `describe` -> tests.
- Remove unused imports.
- Prefer one top-level `test.describe` per file (nested exception allowed).

## Review checklist (AI agent)

| # | Criterion | Violation |
|---|-----------|-----------|
| 1 | All `expect` in test body | `expect` hidden in helper/PO |
| 2 | Test reads as a scenario | Test intent unclear without opening helpers |
| 3 | Fixtures are for environment, not actions | Scenario actions in fixtures; `beforeEach` instead of fixture; PO constructed in test body; fixture chains 3+ levels |
| 4 | Semantic locators | CSS/XPath selectors |
| 5 | PO without `expect` | `expect` inside Page Object |
| 6 | No magic values | Hardcoded URL, ID, unclear strings |
| 7 | No conditional logic | `if`/`try-catch` in test body |
| 8 | Native Playwright waiting | `waitForTimeout`, manual retries |
| 9 | Feature-based grouping | Chaotic or missing `describe` structure |
| 10 | Strict typing | `any`, missing types |
| 11 | Clean imports | Unused imports, disordered file structure |

## Required report format

Use this format for the final output:

1. Findings by severity (`High`, `Medium`, `Low`), each with:
- Checklist criterion number.
- Exact file reference(s) with line number(s).
- Why it is a violation in this project context.
- Suggested fix (short, practical).
- **AI fix prompt**: a ready-to-use prompt for another AI agent to implement the change.

2. Passed checks:
- List checklist items that were verified and have no violations.

3. Residual risks / notes:
- Briefly mention ambiguity, trade-offs, or cases where strict rule application may hurt clarity.

AI fix prompt rules:
- Keep prompts specific to the referenced file(s).
- Require preserving test intent and existing assertions unless the issue is about assertions.
- Require no unrelated refactors.
- Ask for updated code and short change summary.
