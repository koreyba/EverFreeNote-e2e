import type { Locator, Page } from '@playwright/test';

/**
 * Dialog for selecting notes and exporting them into an ENEX file.
 */
export class ExportNotesDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly searchInput: Locator;
  readonly selectedCounter: Locator;
  readonly selectAllButton: Locator;
  readonly exportButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Export notes to .enex' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Export notes to .enex' });
    this.searchInput = this.dialog.getByRole('textbox', { name: 'Search by title or text' });
    this.selectedCounter = this.dialog.getByText(/Selected: \d+ of \d+/);
    this.selectAllButton = this.dialog.getByRole('button', { name: 'Select all' });
    this.exportButton = this.dialog.getByRole('button', { name: 'Export' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  getNoteCheckboxByTitle(title: string) {
    return this.dialog.getByRole('checkbox', { name: `Select note ${title}` });
  }
}
