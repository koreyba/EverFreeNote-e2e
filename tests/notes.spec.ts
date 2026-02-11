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

      await expect(
        editView.tiptapEditor,
        'Editor should contain entered note body text before save',
      ).toContainText(noteBodyText);

      await editView.saveButton.click();
    });

    await test.step('read the created note', async () => {
      await expect(
        editView.readButton,
        'Read button should be enabled after saving the note',
      ).toBeEnabled();

      await editView.readButton.click();

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
    });

    await test.step('delete the created note', async () => {
      await readView.deleteButton.click();
      await expect(
        deleteDialog.dialog,
        'Delete confirmation dialog should be visible after clicking delete',
      ).toBeVisible();

      await deleteDialog.confirmButton.click();
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
