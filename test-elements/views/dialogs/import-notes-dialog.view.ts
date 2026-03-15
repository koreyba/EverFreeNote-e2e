import type { Locator, Page } from '@playwright/test';

/**
 * Dialog for importing notes from an ENEX file.
 */
export class ImportNotesDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly skipDuplicateNotesRadio: Locator;
  readonly skipDuplicateNotesLabel: Locator;
  readonly fileInput: Locator;
  readonly importButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Import ENEX file' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Import ENEX file' });
    this.skipDuplicateNotesRadio = this.dialog.locator('button[role="radio"]#skip');
    this.skipDuplicateNotesLabel = this.dialog.locator('label[for="skip"]');
    this.fileInput = this.dialog.locator('input[type="file"]');
    this.importButton = this.dialog.getByRole('button', { name: /^Import(?: \(\d+\))?$/ });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }

  async selectSkipDuplicates() {
    await this.skipDuplicateNotesLabel.click();
  }

  async setFiles(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async clickImport() {
    await this.importButton.click();
  }
}
