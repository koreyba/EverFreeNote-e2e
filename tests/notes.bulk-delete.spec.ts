import { expect, test } from '../test-elements/fixtures/api.fixture';
import { createNotesViaApi } from '../test-api/flows/notes.api.flow';
import { BulkDeleteDialog } from '../test-elements/views/dialogs/bulk-delete-dialog.view';
import { LeftPanel } from '../test-elements/views/left-panel.view';

const NOTES_TO_CREATE = 3;

let createdNoteIds: string[] = [];
let createdNoteTitles: string[] = [];
let needAPINotesCleanup: boolean;

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

test('bulk delete selected notes', async ({ page, notesApi }) => {
  const leftPanel = new LeftPanel(page);
  const bulkDeleteDialog = new BulkDeleteDialog(page);

  for (const title of createdNoteTitles) {
    await expect(leftPanel.getNoteCardByTitle(title).root).toBeVisible();
  }

  await leftPanel.selectNotesButton.click();

  for (const title of createdNoteTitles) {
    const noteCheckbox = leftPanel.getNoteCardByTitle(title).checkbox;
    await noteCheckbox.check();
    await expect(noteCheckbox).toBeChecked();
  }

  await expect(leftPanel.deleteSelectedButton).toHaveText(`Delete selected (${NOTES_TO_CREATE})`);
  await leftPanel.deleteSelectedButton.click();

  await expect(bulkDeleteDialog.dialog).toBeVisible();
  await expect(bulkDeleteDialog.titleHeading).toBeVisible();
  await bulkDeleteDialog.confirmationInput.fill(String(NOTES_TO_CREATE));
  await expect(bulkDeleteDialog.confirmButton).toBeEnabled();
  await bulkDeleteDialog.confirmButton.click();
  await expect(bulkDeleteDialog.dialog).toHaveCount(0);

  for (const title of createdNoteTitles) {
    await expect(
      leftPanel.getNoteCardByTitle(title).root,
      `Deleted note "${title}" is still visible in the left panel.`,
    ).toHaveCount(0);
  }

  for (const noteId of createdNoteIds) {
    const fetched = await notesApi.getNotes({ id: noteId });
    expect(fetched.status).toBe(404);
  }
  needAPINotesCleanup = false;
});
