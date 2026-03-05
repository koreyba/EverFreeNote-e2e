import type { Locator, Page } from '@playwright/test';

/**
 * Sidebar search results block shown for long full-text queries.
 */
export class FullTextSearchResults {
  readonly root: Locator;
  readonly foundNotesText: Locator;
  readonly searchDurationText: Locator;
  readonly resultCards: Locator;
  readonly highlightedFragments: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('div')
      .filter({ has: page.getByRole('textbox', { name: /Search notes|In "/i }).first() })
      .filter({ has: page.getByText(/^Found:\s+\d+\s+note/) })
      .last();
    this.foundNotesText = this.root.getByText(/^Found:\s+\d+\s+note/).first();
    this.searchDurationText = this.root.getByText(/^\d+ms$/).first();
    this.resultCards = this.root.locator('[data-testid="note-card"], article');
    this.highlightedFragments = this.root.locator('mark');
  }

  getResultCardByTitle(title: string) {
    return this.resultCards.filter({ hasText: title }).first();
  }

  getTagChipByTitle(title: string, tagText: string) {
    return this.getResultCardByTitle(title).getByText(tagText, { exact: true });
  }

  async clickResultCard(title: string) {
    await this.getResultCardByTitle(title).click();
  }

  async clickTagChip(title: string, tagText: string) {
    await this.getTagChipByTitle(title, tagText).click();
  }
}
