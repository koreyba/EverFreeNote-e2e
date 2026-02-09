import type { Locator, Page } from '@playwright/test';

/**
 * Dialog shown when ENEX export is successfully completed.
 */
export class ExportCompletedDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly readyMessage: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Export completed' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Export completed' });
    this.readyMessage = this.dialog.getByText('File is ready to download.');
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' }).first();
  }
}
