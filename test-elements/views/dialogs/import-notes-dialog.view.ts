import type { Locator, Page } from '@playwright/test';

/**
 * Dialog for importing notes from an ENEX file.
 */
export class ImportNotesDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly skipDuplicateNotesRadio: Locator;
  readonly chooseFileButton: Locator;
  readonly importButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Import ENEX file' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Import ENEX file' });
    this.skipDuplicateNotesRadio = this.dialog.getByRole('radio', { name: 'Skip duplicate notes' });
    this.chooseFileButton = this.dialog.getByRole('button', { name: 'Choose File' });
    this.importButton = this.dialog.getByRole('button', { name: 'Import' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }
}
