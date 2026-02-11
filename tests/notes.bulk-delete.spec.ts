import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { createNotesViaApi } from '../test-api/flows/notes.api.flow';

const NOTES_TO_CREATE = 3;

let createdNoteIds: string[] = [];
let createdNoteTitles: string[] = [];
let needAPINotesCleanup: boolean;

test.describe('notes bulk delete', () => {
  test.beforeEach(async ({ notesApi, page }) => {
    needAPINotesCleanup = true;
    const createdNotes = await createNotesViaApi(notesApi, {
      count: NOTES_TO_CREATE,
      titlePrefix: 'Bulk delete note',
      bodyPrefix: 'Bulk delete body',
    });

    createdNoteIds = createdNotes.map((note) => note.id);
    createdNoteTitles = createdNotes.map((note) => note.title);

    await page.goto('/');
  });

  test.afterEach(async ({ notesApi }) => {
    if (needAPINotesCleanup) {
      for (const noteId of createdNoteIds) {
        try {
          await notesApi.deleteNote(noteId);
        } catch {
          // Best-effort cleanup to keep shared environment stable.
        }
      }
    }
  });

  test('bulk delete selected notes', async ({ notesApi, leftPanel, bulkDeleteDialog }) => {
    await test.step('select notes to delete', async () => {
      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Note card with title "${title}" should be visible`,
        ).toBeVisible();
      }

      await leftPanel.selectNotesButton.click();

      for (const title of createdNoteTitles) {
        const noteCheckbox = leftPanel.getNoteCardByTitle(title).checkbox;
        await noteCheckbox.check();
        await expect(noteCheckbox, `Checkbox for note "${title}" should be checked`).toBeChecked();
      }
    });

    await test.step('delete selected notes', async () => {
      await expect(
        leftPanel.deleteSelectedButton,
        `"Delete selected" button should show ${NOTES_TO_CREATE} notes selected`,
      ).toHaveText(`Delete selected (${NOTES_TO_CREATE})`);
      await leftPanel.deleteSelectedButton.click();

      await expect(bulkDeleteDialog.dialog, 'Bulk delete dialog should be visible').toBeVisible();
      await expect(
        bulkDeleteDialog.titleHeading,
        'Bulk delete dialog title should be visible',
      ).toBeVisible();
      await bulkDeleteDialog.confirmationInput.fill(String(NOTES_TO_CREATE));
      await expect(
        bulkDeleteDialog.confirmButton,
        'Confirm button should be enabled after entering correct count',
      ).toBeEnabled();
      await bulkDeleteDialog.confirmButton.click();
      await expect(
        bulkDeleteDialog.dialog,
        'Bulk delete dialog should be hidden after confirmation',
      ).toHaveCount(0);
    });

    await test.step('verify notes are deleted', async () => {
      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Deleted note "${title}" is still visible in the left panel.`,
        ).toHaveCount(0);
      }

      for (const noteId of createdNoteIds) {
        const fetched = await notesApi.getNotes({ id: noteId });
        expect(fetched.status, `Note with ID ${noteId} should be deleted, but it's not`).toBe(404);
      }
      needAPINotesCleanup = false;
    });
  });
});
