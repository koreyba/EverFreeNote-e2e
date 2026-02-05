import type { Locator, Page } from '@playwright/test';

export class LandingView {
  readonly testLoginButton: Locator;
  readonly quickTestButton: Locator;

  constructor(page: Page) {
    this.testLoginButton = page.getByRole('button', { name: 'Test Login (Persistent)' });
    this.quickTestButton = page.getByRole('button', { name: 'Skip Authentication (Quick Test)' });
  }
}
