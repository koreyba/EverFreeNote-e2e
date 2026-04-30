import type { Locator, Page } from '@playwright/test';

/**
 * Right panel in Editing mode (after clicking "New Note").
 */
export class EditView {
  readonly editorContainer: Locator;
  readonly noteTitleInput: Locator;
  readonly noteContentArea: Locator;
  readonly tiptapEditor: Locator;
  readonly saveButton: Locator;
  readonly readButton: Locator;

  constructor(page: Page) {
    this.editorContainer = page.getByTestId('editor-container');
    this.noteTitleInput = this.editorContainer.getByRole('textbox', { name: 'Note title' });
    this.noteContentArea = this.editorContainer.locator('.note-content');
    this.tiptapEditor = this.editorContainer.locator('.tiptap');
    this.saveButton = this.editorContainer.getByRole('button', { name: 'Save' });
    this.readButton = this.editorContainer.getByRole('button', { name: 'Read' });
  }

  async fillNote(title: string, body: string) {
    await this.noteTitleInput.click();
    await this.noteTitleInput.fill(title);
    await this.noteContentArea.click();
    await this.tiptapEditor.fill(body);
  }

  async save() {
    await this.saveButton.click();
  }

  async switchToRead() {
    await this.readButton.click();
  }
}
