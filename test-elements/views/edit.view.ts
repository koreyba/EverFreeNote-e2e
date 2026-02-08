import type { Locator, Page } from '@playwright/test';

/**
 * Right panel in Editing mode (after clicking "New Note").
 */
export class EditView {
  readonly noteTitleInput: Locator;
  readonly noteContentArea: Locator;
  readonly tiptapEditor: Locator;
  readonly saveButton: Locator;
  readonly readButton: Locator;

  constructor(page: Page) {
    this.noteTitleInput = page.getByRole('textbox', { name: 'Note title' });
    this.noteContentArea = page.locator('.note-content');
    this.tiptapEditor = page.locator('.tiptap');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.readButton = page.getByRole('button', { name: 'Read' });
  }
}
