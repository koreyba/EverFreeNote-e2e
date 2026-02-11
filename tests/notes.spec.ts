import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { deleteNotesWithGivenTitleIfFound } from '../test-api/flows/notes.api.flow';

let createdNoteTitle = '';
let shouldCleanupCreatedNote = true;

test.describe('notes crud', () => {
  test.beforeEach(async ({ page }) => {
    shouldCleanupCreatedNote = true;
    createdNoteTitle = '';
    await page.goto('/');
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
  }) => {
    const timestamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    createdNoteTitle = `Created by Playwright ${timestamp}`;
    const noteBodyText = `Text body ${timestamp}`;

    await test.step('create a new note', async () => {
      await leftPanel.newNoteButton.click();
      await editView.noteTitleInput.click();
      await editView.noteTitleInput.fill(createdNoteTitle);
      await editView.noteContentArea.click();
      await editView.tiptapEditor.fill(noteBodyText);

      await expect(editView.tiptapEditor).toContainText(noteBodyText);

      await editView.saveButton.click();
    });

    await test.step('read the created note', async () => {
      await expect(editView.readButton).toBeEnabled();

      await editView.readButton.click();

      await expect(readView.readingHeading).toBeVisible();
      await expect(readView.noteText).toContainText(noteBodyText);

      const noteCard = leftPanel.getNoteCardNumber(0);

      await expect(noteCard.titleHeading).toHaveText(createdNoteTitle);
      await expect(noteCard.bodyParagraph).toHaveText(noteBodyText);

      const date = getFormattedDate();

      await expect(noteCard.dateParagraph).toHaveText(date);
    });

    await test.step('delete the created note', async () => {
      await readView.deleteButton.click();
      await expect(deleteDialog.dialog).toBeVisible();

      await deleteDialog.confirmButton.click();
      await expect(readView.emptyStateText).toBeVisible();

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
