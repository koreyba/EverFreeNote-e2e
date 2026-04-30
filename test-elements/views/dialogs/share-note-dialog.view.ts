import type { Locator, Page } from '@playwright/test';

/**
 * Dialog for creating and copying a public read-only note link.
 */
export class ShareNoteDialog {
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly publicLinkInput: Locator;
  readonly copyLinkButton: Locator;
  readonly getLinkButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Share note' });
    this.titleHeading = this.dialog.getByRole('heading', { name: 'Share note' });
    this.publicLinkInput = this.dialog.getByLabel('Public link');
    this.copyLinkButton = this.dialog.getByRole('button', { name: 'Copy share link' });
    this.getLinkButton = this.dialog.getByRole('button', { name: 'Get link' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' }).first();
  }

  async getPublicLink() {
    return this.publicLinkInput.inputValue();
  }
}
