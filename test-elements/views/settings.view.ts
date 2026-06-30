import type { Locator, Page } from '@playwright/test';

/**
 * Settings route with section navigation for account, import, export, and integrations.
 */
export class SettingsView {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly closeButton: Locator;
  readonly tabHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Settings', level: 1 });
    this.backButton = page.getByRole('button', { name: 'Back' });
    this.closeButton = page.getByRole('button', { name: 'Close settings' });
    this.tabHeading = page.locator('section h2').first();
  }

  getSidebarTab(label: string) {
    return this.page.locator('aside button').filter({ hasText: label }).first();
  }

  getPrimaryActionButton(label: string) {
    return this.page
      .locator('button:visible')
      .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) });
  }

  async openTab(label: string) {
    await this.getSidebarTab(label).click();
  }

  async goBackToWorkspace() {
    await this.backButton.click();
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
