import type { Locator, Page } from '@playwright/test';
import { NoteCard } from '../subviews/note-card.subview';

/**
 * Left panel containing navigation buttons and the notes list.
 */
export class LeftPanel {
  private readonly page: Page;
  readonly newNoteButton: Locator;
  readonly selectNotesButton: Locator;
  readonly exitSelectionButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly searchInput: Locator;
  readonly notesList: Locator;
  readonly noteCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newNoteButton = page.getByRole('button', { name: 'New Note' });
    this.selectNotesButton = page.getByRole('button', { name: 'Select Notes' });
    this.exitSelectionButton = page.getByRole('button', { name: 'Exit selection' });
    this.deleteSelectedButton = page.getByRole('button', { name: /Delete selected/ });
    this.searchInput = page.getByRole('textbox', { name: 'Search notes...' });
    this.notesList = page.getByRole('list');
    this.noteCards = page.getByTestId('note-card');
  }

  getNoteCardNumber(index: number) {
    return new NoteCard(this.noteCards.nth(index));
  }

  getNoteCardByTitle(title: string) {
    return new NoteCard(
      this.noteCards.filter({ has: this.page.getByRole('heading', { name: title }) }).first(),
    );
  }
}
