import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { deleteNotesWithGivenTitleIfFound } from '../test-api/flows/notes.api.flow';

let createdNoteTitle = '';
let shouldCleanupCreatedNote = true;

test.describe('notes crud', () => {
  test.beforeEach(async ({ page, analyzeA11y }, testInfo) => {
    shouldCleanupCreatedNote = true;
    createdNoteTitle = '';
    await page.goto('/');
    
    const a11y = await analyzeA11y();
    if (a11y.hasViolations()) {
      await testInfo.attach('a11y-report-landing.txt', { body: a11y.format(), contentType: 'text/plain' });
    }
    expect(a11y.criticalViolations.length, 'Landing page should have 0 critical a11y violations').toBe(0);
  });

  test.afterEach(async ({ notesApi }) => {
    if (!shouldCleanupCreatedNote || !createdNoteTitle) {
      return;
    }

    try {
      await deleteNotesWithGivenTitleIfFound(notesApi, createdNoteTitle);
    } catch {
      // Best-effort cleanup to keep shared environment stable.
    }
  });

  test('create, read, and delete a note', async ({
    leftPanel,
    editView,
    readView,
    deleteDialog,
    analyzeA11y,
  }, testInfo) => {
    const timestamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    createdNoteTitle = `Created by Playwright ${timestamp}`;
    const noteBodyText = `Text body ${timestamp}`;
 
    await test.step('create a new note', async () => {
      await leftPanel.clickNewNote();
      await editView.fillNote(createdNoteTitle, noteBodyText);
 
      await expect(
        editView.tiptapEditor,
        'Editor should contain entered note body text before save',
      ).toContainText(noteBodyText);
 
      const a11y = await analyzeA11y();
      if (a11y.hasViolations()) {
        await testInfo.attach('a11y-report-edit.txt', { body: a11y.format(), contentType: 'text/plain' });
      }
      expect(a11y.criticalViolations.length, 'Editor view should have 0 critical a11y violations').toBe(0);

      await editView.save();
    });

    await test.step('read the created note', async () => {
      await expect(
        editView.readButton,
        'Read button should be enabled after saving the note',
      ).toBeEnabled();

      await editView.switchToRead();

      await expect(
        readView.readingHeading,
        'Reading view heading should be visible after switching to read mode',
      ).toBeVisible();
      await expect(
        readView.noteText,
        'Reading view should display the saved note body text',
      ).toContainText(noteBodyText);

      const noteCard = leftPanel.getNoteCardNumber(0);

      await expect(
        noteCard.titleHeading,
        'Top note card title should match the created note title',
      ).toHaveText(createdNoteTitle);
      await expect(
        noteCard.bodyParagraph,
        'Top note card body should match the created note body text',
      ).toHaveText(noteBodyText);

      const date = getFormattedDate();

      await expect(
        noteCard.dateParagraph,
        "Top note card date should match today's date",
      ).toHaveText(date);

      const a11yRead = await analyzeA11y();
      if (a11yRead.hasViolations()) {
        await testInfo.attach('a11y-report-read.txt', { body: a11yRead.format(), contentType: 'text/plain' });
      }
      expect(a11yRead.criticalViolations.length, 'Read view should have 0 critical a11y violations').toBe(0);
    });

    await test.step('delete the created note', async () => {
      await readView.deleteNote();
      await expect(
        deleteDialog.dialog,
        'Delete confirmation dialog should be visible after clicking delete',
      ).toBeVisible();

      const a11yDelete = await analyzeA11y();
      if (a11yDelete.hasViolations()) {
        await testInfo.attach('a11y-report-delete.txt', { body: a11yDelete.format(), contentType: 'text/plain' });
      }
      expect(a11yDelete.criticalViolations.length, 'Delete dialog should have 0 critical a11y violations').toBe(0);

      await deleteDialog.confirm();
      await expect(
        readView.emptyStateText,
        'Empty state text should be visible after deleting the note',
      ).toBeVisible();

      const deletedNote = leftPanel.getNoteCardByTitle(createdNoteTitle);
      await expect(deletedNote.root, 'Deleted note was found when not expected').toHaveCount(0);
      shouldCleanupCreatedNote = false;
    });
  });
});

function getFormattedDate() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const formatted = `${dd}.${mm}.${yyyy}`;
  return formatted;
}
