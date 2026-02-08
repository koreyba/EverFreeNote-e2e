import type { Locator } from '@playwright/test';

export class NoteCard {
  readonly titleHeading: Locator;
  readonly bodyParagraph: Locator;
  readonly dateParagraph: Locator;
  readonly root: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.titleHeading = root.getByRole('heading', { level: 3 });
    this.bodyParagraph = root.locator('p').first();
    this.dateParagraph = root.locator('p').nth(1);
  }
}
