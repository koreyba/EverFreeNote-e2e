import type { Locator, Page } from '@playwright/test';

/**
 * Right panel in Reading mode (after clicking "Read").
 */
export class ReadView {
  readonly noteText: Locator;
  readonly editorContainer: Locator;
  readonly deleteButton: Locator;
  readonly deleteIndexButton: Locator;
  readonly editButton: Locator;
  readonly moreActionsButton: Locator;
  readonly shareNoteMenuItem: Locator;
  readonly addTagButton: Locator;
  readonly tagInput: Locator;
  readonly removeTagButtons: Locator;
  readonly emptyStateText: Locator;
  readonly readingHeading: Locator;

  constructor(page: Page) {
    this.noteText = page.locator('.note-content');
    this.editorContainer = page.getByTestId('editor-container');
    this.deleteButton = page.locator('[data-cy="note-delete-button"]');
    this.deleteIndexButton = page.locator('[data-cy="note-delete-index-button"]');
    this.editButton = this.editorContainer.getByRole('button', { name: 'Edit', exact: true });
    this.moreActionsButton = page.getByRole('button', { name: 'More actions' });
    this.shareNoteMenuItem = page.getByRole('menuitem', { name: 'Share note' });
    this.addTagButton = page.getByRole('button', { name: 'Add tag' });
    this.tagInput = page.getByPlaceholder('work, personal, ideas');
    this.removeTagButtons = this.editorContainer.getByRole('button', { name: /remove/i });
    this.emptyStateText = page.getByText('Select a note or create a new');
    this.readingHeading = page.getByRole('heading', { name: 'Reading' });
  }

  getTagBadgeByText(tagText: string) {
    return this.editorContainer.getByText(tagText, { exact: true });
  }

  async deleteNote() {
    await this.deleteButton.click();
  }

  async openShareDialog() {
    await this.moreActionsButton.click();
    await this.shareNoteMenuItem.click();
  }
}
