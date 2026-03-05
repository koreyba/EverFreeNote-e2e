import type { Locator, Page } from '@playwright/test';

/**
 * Search and filtering controls located in the left panel header area.
 */
export class SearchControls {
  readonly searchTrigger: Locator;
  readonly searchTriggerInTagScope: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly clearTagsButton: Locator;
  readonly notesDisplayedCounter: Locator;
  readonly pressEnterHint: Locator;

  constructor(page: Page) {
    this.searchTrigger = page.getByText('Search notes...').first();
    this.searchTriggerInTagScope = page.getByText(/^Search in ".*" notes\.\.\.$/).first();
    this.searchInput = page.getByRole('textbox', { name: /Search notes|In "/i });
    this.clearSearchButton = page.getByRole('button', { name: /Clear search/i });
    this.clearTagsButton = page.getByRole('button', { name: /Clear tag/i });
    this.notesDisplayedCounter = page.getByText(/^Notes displayed:/);
    this.pressEnterHint = page.getByText('Press Enter to search');
  }

  async openGlobalSearch() {
    await this.searchTrigger.click();
  }

  async openScopedSearch() {
    await this.searchTriggerInTagScope.click();
  }

  async search(query: string) {
    await this.searchInput.first().fill(query);
    await this.searchInput.first().focus();
    await this.searchInput.first().press('Enter');
    await this.searchInput.first().press('Enter');
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }
}
