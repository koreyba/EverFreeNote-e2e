import type { Locator, Page } from '@playwright/test';
import { DeleteDialog } from '../components/delete-dialog.component';

export class ReadView {
  readonly noteText: Locator;
  readonly deleteButton: Locator;
  readonly emptyStateText: Locator;
  readonly readingHeading: Locator;
  readonly deleteDialog: DeleteDialog;

  constructor(page: Page) {
    this.noteText = page.locator('.note-content > p');
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
    this.emptyStateText = page.getByText('Select a note or create a new');
    this.readingHeading = page.getByRole('heading', { name: 'Reading' });
    this.deleteDialog = new DeleteDialog(page);
  }
}
