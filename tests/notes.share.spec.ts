import { expect, test } from '../test-elements/fixtures/page-objects.fixture';

let createdNoteId = '';
let noteTitle = '';
let noteBodyText = '';
let noteBodyExcerpt = '';
let noteTags: string[] = [];

test.describe('notes sharing', () => {
  test.beforeEach(async ({ notesApi, page }) => {
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    createdNoteId = '';
    noteTitle = `Shared note ${runId}`;
    noteBodyText = `Public body ${runId} with expected read-only content.`;
    noteBodyExcerpt = `expected read-only content`;
    noteTags = [`share-tag-${runId}-one`, `share-tag-${runId}-two`];

    const createdNote = await notesApi.createNote({
      title: noteTitle,
      description: `<p>${noteBodyText}</p><p>Private edit controls should not be needed here.</p>`,
      tags: noteTags,
    });

    expect(createdNote.status, 'API should create a note for the share-link scenario').toBe(200);
    createdNoteId = createdNote.data.note.id;

    await page.goto('/');
  });

  test.afterEach(async ({ notesApi }) => {
    if (!createdNoteId) {
      return;
    }

    const deletedNote = await notesApi.deleteNote(createdNoteId);
    expect(
      deletedNote.status,
      'API cleanup should delete the note created for the share-link scenario',
    ).toBe(200);
  });

  test('shared note opens for signed-out visitors', async ({
    guestPage,
    leftPanel,
    readView,
    shareNoteDialog,
    guestLandingView,
    guestPublicNoteView,
    analyzeA11y,
  }, testInfo) => {
    let publicLink = '';

    await test.step('open note created through API', async () => {
      const noteCard = leftPanel.getNoteCardByTitle(noteTitle);
      await expect(
        noteCard.root,
        'API-created note card should be visible in the notes list',
      ).toBeVisible();

      await noteCard.open();

      await expect(
        readView.readingHeading,
        'Reading view should be visible after opening the API-created note',
      ).toBeVisible();
      await expect(
        readView.noteText,
        'Reading view should display the expected note body before sharing',
      ).toContainText(noteBodyText);
      for (const tag of noteTags) {
        await expect(
          readView.getTagBadgeByText(tag),
          `Reading view should display tag "${tag}" before sharing`,
        ).toBeVisible();
      }
    });

    await test.step('create public share link', async () => {
      await readView.openShareDialog();

      await expect(
        shareNoteDialog.dialog,
        'Share note dialog should be visible after choosing Share note from more actions',
      ).toBeVisible();
      await expect(
        shareNoteDialog.titleHeading,
        'Share note dialog title should be visible',
      ).toBeVisible();
      await expect(
        shareNoteDialog.publicLinkInput,
        'Share note dialog should generate a public share link',
      ).toHaveValue(/\/share\/\?token=.+/);
      await expect(
        shareNoteDialog.copyLinkButton,
        'Copy share link button should become enabled after link generation',
      ).toBeEnabled();

      const a11yShareDialog = await analyzeA11y();
      if (a11yShareDialog.hasViolations()) {
        await testInfo.attach('a11y-report-share-dialog.txt', { body: a11yShareDialog.format(), contentType: 'text/plain' });
      }
      expect(a11yShareDialog.criticalViolations.length, 'Share dialog should have 0 critical a11y violations').toBe(0);

      publicLink = await shareNoteDialog.getPublicLink();
      expect(publicLink, 'Generated public link should target the share page').toContain('/share/');
    });

    await test.step('verify a guest browser is signed out', async () => {
      await shareNoteDialog.closeButton.click();
      await expect(
        shareNoteDialog.dialog,
        'Share note dialog should close before opening the link as a guest',
      ).toBeHidden();

      await guestPage.goto('/');
      await expect(
        guestLandingView.testLoginButton,
        'Test login button should be visible in the separate guest browser context',
      ).toBeVisible();
      await expect(
        guestPage.getByText('test@example.com', { exact: true }),
        'Guest browser context should not show the authenticated test user email',
      ).toHaveCount(0);
    });

    await test.step('open public link and verify shared content', async () => {
      await guestPage.goto(publicLink);

      await expect(
        guestPage,
        'Public share link should navigate to the shared note route',
      ).toHaveURL(/\/share\/?\?token=.+/);
      await expect(
        guestPublicNoteView.pageHeader,
        'Public page header should be visible for a signed-out visitor',
      ).toBeVisible();
      await expect(
        guestPublicNoteView.sharedNoteLabel,
        'Public note page should label the content as a shared note',
      ).toBeVisible();
      await expect(
        guestPublicNoteView.getTitleHeading(noteTitle),
        'Public note page should display the expected shared note title',
      ).toBeVisible();
      await expect(
        guestPublicNoteView.noteContent,
        'Public note page should display the expected body excerpt',
      ).toContainText(noteBodyExcerpt);

      const a11yPublicNote = await analyzeA11y({ page: guestPage });
      if (a11yPublicNote.hasViolations()) {
        await testInfo.attach('a11y-report-public-note.txt', { body: a11yPublicNote.format(), contentType: 'text/plain' });
      }
      expect(a11yPublicNote.criticalViolations.length, 'Guest public note view should have 0 critical a11y violations').toBe(0);

      for (const tag of noteTags) {
        await expect(
          guestPublicNoteView.getTagBadge(tag),
          `Public note page should display tag "${tag}"`,
        ).toBeVisible();
      }
    });
  });
});
