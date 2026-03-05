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
    this.dialog = page.getByTestId('bulk-delete-dialog');
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Delete selected notes' });
    this.confirmationInput = page.getByTestId('bulk-delete-confirm-input');
    this.confirmButton = page.getByTestId('bulk-delete-confirm');
    this.cancelButton = page.getByTestId('bulk-delete-cancel');
  }

  async fillCount(count: number) {
    await this.confirmationInput.fill(String(count));
  }

  async confirm() {
    await this.confirmButton.click();
  }
}
