import type { Locator } from '@playwright/test';

/**
 * Single note card in the left notes list.
 */
export class NoteCard {
  readonly root: Locator;
  readonly titleHeading: Locator;
  readonly bodyParagraph: Locator;
  readonly dateParagraph: Locator;
  readonly checkbox: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.titleHeading = root.getByRole('heading', { level: 3 });
    this.bodyParagraph = root.locator('p').first();
    this.dateParagraph = root.locator('p').nth(1);
    this.checkbox = root.getByRole('checkbox');
  }
}
