import { existsSync } from 'node:fs';
import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { createNotesViaApi, deleteNotesWithGivenTitleIfFound } from '../test-api/flows/notes.api.flow';
import type { Note } from '../test-api/notes.types';

const NOTES_TO_CREATE = 3;

let createdNoteIds: string[] = [];
let createdNoteTitles: string[] = [];
type ExpectedNoteData = Pick<Note, 'title' | 'description' | 'tags'>;
let expectedCreatedNotes: ExpectedNoteData[] = [];

test.describe('notes export/import', () => {
  test.beforeEach(async ({ notesApi, page }) => {
    // Seed a deterministic batch of notes via API for export/import validation.
    const createdNotes = await createNotesViaApi(notesApi, {
      count: NOTES_TO_CREATE,
      titlePrefix: 'Export note',
      bodyPrefix: 'Export body',
      tagsPerNote: 2,
      tagPrefix: 'export-tag',
    });
    
    createdNoteIds = createdNotes.map((note) => note.id);
    createdNoteTitles = createdNotes.map((note) => note.title);
    expectedCreatedNotes = createdNotes.map((note) => ({
      title: note.title,
      description: note.description,
      tags: note.tags,
    }));

    await page.goto('/');
  });

  test.afterEach(async ({ notesApi }) => {
    // Clean up all notes that belong to this run by their unique titles.
    for (const title of createdNoteTitles) {
      try {
        await deleteNotesWithGivenTitleIfFound(notesApi, title);
      } catch {
        // Best-effort cleanup to keep shared environment stable.
      }
    }
  });

  test(
    'export and import selected notes from enex file',
    async (
      {
        page,
        notesApi,
        leftPanel,
        exportNotesDialog,
        exportCompletedDialog,
        importCompletedDialog,
        importNotesDialog,
      },
      testInfo,
    ) => {

      // Open export flow and select only notes created in this test run.
      await leftPanel.accountMenu.menuButton.click();
      await leftPanel.accountMenu.exportEnexMenuButton.click();

      await expect(exportNotesDialog.dialog).toBeVisible();
      await expect(exportNotesDialog.titleHeading).toBeVisible();

      for (const title of createdNoteTitles) {
        const noteCheckbox = exportNotesDialog.getNoteCheckboxByTitle(title);
        await noteCheckbox.check();
        await expect(noteCheckbox).toBeChecked();
      }

      await expect(exportNotesDialog.selectedCounter).toContainText(`Selected: ${NOTES_TO_CREATE} of`);

      // Export selected notes and persist downloaded ENEX into the test output folder.
      const downloadPromise = page.waitForEvent('download');
      await exportNotesDialog.exportButton.click();
      const download = await downloadPromise;

      expect(await download.failure()).toBeNull();
      await expect(exportCompletedDialog.dialog).toBeVisible();
      await expect(exportCompletedDialog.titleHeading).toBeVisible();
      await expect(exportCompletedDialog.readyMessage).toBeVisible();

      const downloadedFilePath = testInfo.outputPath(download.suggestedFilename());
      await download.saveAs(downloadedFilePath);
      expect(existsSync(downloadedFilePath)).toBeTruthy();

      await exportCompletedDialog.closeButton.click();
      await expect(exportCompletedDialog.dialog).toBeHidden();

      // Remove source notes first to prove imported notes are newly created records.
      for (const noteId of createdNoteIds) {
        const deleted = await notesApi.deleteNote(noteId);
        expect(deleted.status).toBe(200);
      }

      await page.reload();

      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Original note "${title}" should be deleted before import.`,
        ).toHaveCount(0);
      }

      // Import the same exported file using the "Skip duplicate notes" strategy.
      await leftPanel.accountMenu.menuButton.click();
      await leftPanel.accountMenu.importEnexMenuButton.click();

      // Ensure import dialog is opened before interacting with import controls.
      await expect(importNotesDialog.dialog).toBeVisible();
      await expect(importNotesDialog.titleHeading).toBeVisible();
      // Use "Skip duplicate notes" strategy explicitly to keep import behavior deterministic.
      await importNotesDialog.skipDuplicateNotesRadio.check();
      await expect(importNotesDialog.skipDuplicateNotesRadio).toBeChecked();

      // Trigger native file chooser and provide the downloaded ENEX file path.
      const fileChooserPromise = page.waitForEvent('filechooser');
      await importNotesDialog.chooseFileButton.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(downloadedFilePath);

      // Import button should become enabled only after a valid ENEX file is selected.
      await expect(importNotesDialog.importButton).toBeEnabled();
      await importNotesDialog.importButton.click();

      // Wait for import dialog to close and assert successful import summary in completion dialog.
      await expect(importNotesDialog.dialog).toHaveCount(0);
      await expect(importCompletedDialog.dialog).toBeVisible();
      await expect(importCompletedDialog.titleHeading).toBeVisible();
      await expect(importCompletedDialog.readyMessage).toBeVisible();
      await expect(importCompletedDialog.successfulCountText).toContainText(
        `Successfully imported ${NOTES_TO_CREATE} notes`,
      );
      await importCompletedDialog.closeButton.click();

      // Verify imported notes through API by matching title, body, and tags.
      for (const expectedNote of expectedCreatedNotes) {
        const fetched = await notesApi.getNotes({ title: expectedNote.title });
        expect(fetched.status).toBe(200);

        const notes = fetched.data.notes;
        const matchedNote = notes.find((note) => areNotesEquivalent(note, expectedNote));

        expect(matchedNote, `Imported note "${expectedNote.title}" did not match expected data.`).toBeDefined();
      }

      // Verify imported notes are visible in the left panel immediately after import.
      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Imported note "${title}" was not found in the left panel.`,
        ).toBeVisible();
      }
    },
  );
});

const areNotesEquivalent = (actual: Note, expected: ExpectedNoteData) => {
  const actualSortedTags = [...actual.tags].sort();
  const expectedSortedTags = [...expected.tags].sort();

  return (
    actual.title === expected.title &&
    actual.description === expected.description &&
    actualSortedTags.length === expectedSortedTags.length &&
    actualSortedTags.every((tag, index) => tag === expectedSortedTags[index])
  );
};
