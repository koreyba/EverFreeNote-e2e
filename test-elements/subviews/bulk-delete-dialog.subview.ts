import type { Locator, Page } from '@playwright/test';

/**
 * Confirmation dialog shown when deleting multiple selected notes.
 */
export class BulkDeleteDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly confirmationInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('alertdialog', { name: 'Delete selected notes' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Delete selected notes' });
    this.confirmationInput = this.dialog.getByRole('spinbutton');
    this.confirmButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }
}
