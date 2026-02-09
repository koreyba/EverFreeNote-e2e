import type { Locator, Page } from '@playwright/test';

/**
 * Right panel in Reading mode (after clicking "Read").
 */
export class ReadView {
  readonly noteText: Locator;
  readonly deleteButton: Locator;
  readonly emptyStateText: Locator;
  readonly readingHeading: Locator;

  constructor(page: Page) {
    this.noteText = page.locator('.note-content > p');
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
    this.emptyStateText = page.getByText('Select a note or create a new');
    this.readingHeading = page.getByRole('heading', { name: 'Reading' });
  }
}
