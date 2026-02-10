import type { Locator, Page } from '@playwright/test';

/**
 * Search and filtering controls located in the left panel header area.
 */
export class SearchControls {
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly clearTagsButton: Locator;
  readonly notesDisplayedCounter: Locator;

  constructor(page: Page) {
    this.searchInput = page.getByRole('textbox', { name: /Search/ });
    this.clearSearchButton = page.getByRole('button', { name: 'Clear Search' });
    this.clearTagsButton = page.getByRole('button', { name: 'Clear Tags' });
    this.notesDisplayedCounter = page.getByText(/^Notes displayed:/);
  }
}
