import type { Locator, Page } from '@playwright/test';

/**
 * Search and filtering controls located in the left panel header area.
 */
export class SearchControls {
  readonly searchTrigger: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly clearTagsButton: Locator;
  readonly notesDisplayedCounter: Locator;
  readonly pressEnterHint: Locator;

  constructor(page: Page) {
    this.searchTrigger = page.getByTestId('sidebar-search-trigger');
    this.searchInput = page.getByTestId('search-panel-input');
    this.clearSearchButton = page.getByTestId('search-panel-clear');
    this.clearTagsButton = page.getByTestId('search-panel-clear-tag');
    this.notesDisplayedCounter = page.getByText(/^Notes displayed:/);
    this.pressEnterHint = page.getByText('Press Enter to search');
  }

  async openGlobalSearch() {
    await this.searchTrigger.click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.focus();
    await this.searchInput.press('Enter');
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }
}
