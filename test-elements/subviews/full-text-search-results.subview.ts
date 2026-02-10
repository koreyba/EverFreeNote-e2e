import type { Locator, Page } from '@playwright/test';

/**
 * Sidebar search results block shown for long full-text queries.
 */
export class FullTextSearchResults {
  readonly root: Locator;
  readonly foundNotesText: Locator;
  readonly searchDurationText: Locator;
  readonly searchModeLabel: Locator;
  readonly resultCards: Locator;
  readonly highlightedFragments: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId('sidebar-container').filter({
      has: page.getByText(/^Found:\s+\d+\s+note/),
    });
    this.foundNotesText = this.root.getByText(/^Found:\s+\d+\s+note/);
    this.searchDurationText = this.root.getByText(/^\d+ms$/);
    this.searchModeLabel = this.root.getByText(/^(Quick|Full text) search$/i);
    this.resultCards = this.root.getByTestId('note-card');
    this.highlightedFragments = this.root.locator('mark');
  }

  getResultCardByTitle(title: string) {
    return this.resultCards.filter({ hasText: title }).first();
  }

  getTagChipByTitle(title: string, tagText: string) {
    return this.getResultCardByTitle(title).getByText(tagText, { exact: true });
  }
}
