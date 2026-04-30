import type { Locator, Page } from '@playwright/test';

/**
 * Public read-only note page opened from a share link.
 */
export class PublicNoteView {
  readonly pageHeader: Locator;
  readonly sharedNoteLabel: Locator;
  readonly article: Locator;
  readonly noteContent: Locator;
  readonly tagsGroup: Locator;

  constructor(page: Page) {
    this.pageHeader = page.getByTestId('public-page-header');
    this.sharedNoteLabel = page.getByText('Shared note', { exact: true });
    this.article = page.locator('article');
    this.noteContent = this.article.locator('.note-content');
    this.tagsGroup = this.article.getByLabel('Tags');
  }

  getTitleHeading(title: string) {
    return this.article.getByRole('heading', { name: title });
  }

  getTagBadge(tag: string) {
    return this.tagsGroup.getByText(tag, { exact: true });
  }
}
