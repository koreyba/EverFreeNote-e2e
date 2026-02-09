import type { Locator, Page } from '@playwright/test';

/**
 * Account actions menu in the left panel footer.
 */
export class AccountMenu {
  readonly menuButton: Locator;
  readonly importEnexMenuButton: Locator;
  readonly exportEnexMenuButton: Locator;
  readonly deleteAccountButton: Locator;

  constructor(page: Page) {
    this.menuButton = page.locator('button[aria-haspopup="menu"]').first();
    this.importEnexMenuButton = page.getByRole('button', { name: 'Import .enex file' });
    this.exportEnexMenuButton = page.getByRole('button', { name: 'Export .enex file' });
    this.deleteAccountButton = page.getByRole('button', { name: 'Delete my account' });
  }
}
