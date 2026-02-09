import type { Locator, Page } from '@playwright/test';

/**
 * Dialog shown when ENEX import is completed.
 */
export class ImportCompletedDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly readyMessage: Locator;
  readonly successfulCountText: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Import Complete' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Import Complete' });
    this.readyMessage = this.dialog.getByText('Your import has finished.');
    this.successfulCountText = this.dialog.getByText('Successfully imported');
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' }).first();
  }
}
