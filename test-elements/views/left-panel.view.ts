import type { Locator, Page } from '@playwright/test';
import { NoteCard } from '../components/note.component';

export class LeftPanel {
  private readonly page: Page;
  readonly newNoteButton: Locator;
  readonly notesList: Locator;
  readonly noteCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newNoteButton = page.getByRole('button', { name: 'New Note' });
    this.notesList = page.getByRole('list');
    this.noteCards = page.getByTestId('note-card');
  }

  getNoteCardNumber(index: number) {
    return new NoteCard(this.noteCards.nth(index));
  }

  getNoteCardByTitle(title: string) {
    return new NoteCard(
      this.noteCards
        .filter({ has: this.page.getByRole('heading', { name: title }) })
        .first(),
    );
  }
}
