import type { Locator, Page } from '@playwright/test';

/**
 * Footer account actions in the left panel.
 */
export class AccountMenu {
  readonly openSettingsPageButton: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.openSettingsPageButton = page.getByRole('button', { name: 'Open settings page' });
    this.signOutButton = page.locator('button').filter({ has: page.locator('svg.lucide-log-out') });
  }

  async openSettings() {
    await this.openSettingsPageButton.click();
  }
}
