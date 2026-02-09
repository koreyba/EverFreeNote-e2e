import type { Locator, Page } from '@playwright/test';

/**
 * Confirmation dialog shown when deleting a note.
 */
export class DeleteDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('alertdialog', { name: 'Delete Note' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Delete Note' });
    this.confirmButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }
}
