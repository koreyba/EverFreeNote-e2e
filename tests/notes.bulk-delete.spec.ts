import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { createNotesViaApi } from '../test-api/flows/notes.api.flow';
import { A11yReport } from '../test-utils/a11y';

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

  test('bulk delete selected notes', async ({
    notesApi,
    leftPanel,
    bulkDeleteDialog,
    analyzeA11y,
  }, testInfo) => {
    const a11yScans: { context: string; report: A11yReport }[] = [];

    await test.step('select notes to delete', async () => {
      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Note card with title "${title}" should be visible`,
        ).toBeVisible();
      }

      for (const title of createdNoteTitles) {
        const noteCard = leftPanel.getNoteCardByTitle(title);
        await noteCard.select();
        await expect(
          noteCard.checkbox,
          `Checkbox for note "${title}" should be checked`,
        ).toBeChecked();
      }
    });

    await test.step('delete selected notes', async () => {
      await expect(
        leftPanel.deleteSelectedButton,
        `"Delete" action should show ${NOTES_TO_CREATE} selected notes`,
      ).toHaveText(`Delete (${NOTES_TO_CREATE})`);
      await leftPanel.clickDeleteSelected();

      await expect(bulkDeleteDialog.dialog, 'Bulk delete dialog should be visible').toBeVisible();
      await expect(
        bulkDeleteDialog.titleHeading,
        'Bulk delete dialog title should be visible',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Bulk Delete Dialog', async () => {
      const a11y = await analyzeA11y();
      if (a11y.hasViolations()) {
        await testInfo.attach('a11y-report-bulk-delete.md', {
          body: a11y.format(),
          contentType: 'text/markdown',
        });
      }
      a11yScans.push({ context: 'Bulk Delete Dialog', report: a11y });
    });

    await test.step('confirm bulk deletion', async () => {
      await bulkDeleteDialog.fillCount(NOTES_TO_CREATE);
      await expect(
        bulkDeleteDialog.confirmButton,
        'Confirm button should be enabled after entering correct count',
      ).toBeEnabled();
      await bulkDeleteDialog.confirm();
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
    });

    await test.step('Verify accessibility compliance', async () => {
      for (const scan of a11yScans) {
        expect(
          scan.report.moderateViolations.length,
          `Accessibility scan on "${scan.context}" should have 0 critical violations`,
        ).toBe(0);
      }
      needAPINotesCleanup = false;
    });
  });
});
