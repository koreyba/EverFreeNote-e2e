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
    this.titleHeading = root.getByRole('heading', { level: 2 });
    this.bodyParagraph = root.locator('p').first();
    this.dateParagraph = root.locator('p').nth(1);
    this.checkbox = root.getByRole('checkbox', { includeHidden: true });
  }

  getTagChipByText(tagText: string) {
    return this.root.getByText(tagText, { exact: true });
  }

  async click() {
    await this.root.click();
  }

  async open() {
    await this.titleHeading.click();
  }

  async select() {
    await this.root.scrollIntoViewIfNeeded();
    await this.checkbox.dispatchEvent('click');
  }

  async clickTag(tagText: string) {
    await this.getTagChipByText(tagText).click();
  }
}
