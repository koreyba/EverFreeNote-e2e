import { existsSync } from 'node:fs';
import type { Download } from '@playwright/test';
import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import {
  createNotesViaApi,
  deleteNotesWithGivenTitleIfFound,
} from '../test-api/flows/notes.api.flow';
import type { Note } from '../test-api/notes.types';


const NOTES_TO_CREATE = 3;
const SETTINGS_ROUTE_PATTERN = /\/settings\/?(?:\?tab=[\w-]+)?$/;

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

  test('export and import selected notes from enex file', async ({
    page,
    notesApi,
    leftPanel,
    settingsView,
    exportNotesDialog,
    exportCompletedDialog,
    importCompletedDialog,
    importNotesDialog,
    analyzeA11y,
  }, testInfo) => {
    test.slow();
    let downloadedFilePath: string;
    let download: Download;

    await test.step('open settings', async () => {
      // Open settings route, switch to export tab.
      await leftPanel.accountMenu.openSettings();
      await expect(
        settingsView.heading,
        'Settings page heading should be visible after opening settings from the sidebar footer',
      ).toBeVisible();
      await expect(
        page,
        'Opening settings from the sidebar footer should navigate to the dedicated /settings route',
      ).toHaveURL(SETTINGS_ROUTE_PATTERN);
    });

    await test.step('Accessibility scan: Settings Page', async () => {
      await expect(page).toHaveTitle(/EverFreeNote/);
      const a11ySettings = await analyzeA11y();
      if (a11ySettings.hasViolations()) {
        await testInfo.attach('a11y-report-settings.md', {
          body: a11ySettings.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11ySettings.hasViolations(),
        'Accessibility scan on "Settings Page" should have no violations',
      ).toBe(false);
    });

    await test.step('open export notes dialog', async () => {
      await settingsView.openTab('Export .enex file');
      await expect(
        settingsView.tabHeading,
        'Settings page should show the export tab heading after selecting export',
      ).toHaveText('Export .enex file');
      await expect(
        settingsView.getPrimaryActionButton('Export .enex file'),
        'Export tab should expose the primary export action button',
      ).toBeVisible();
      await settingsView.getPrimaryActionButton('Export .enex file').click();

      await expect(
        exportNotesDialog.dialog,
        'Export notes dialog should be visible after opening export flow',
      ).toBeVisible();
      await expect(
        exportNotesDialog.titleHeading,
        'Export notes dialog title should be visible',
      ).toBeVisible();
      await expect(
        exportNotesDialog.searchInput,
        'Export notes dialog should expose the notes search field on the new settings flow',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Export Dialog', async () => {
      await expect(page).toHaveTitle(/EverFreeNote/);
      await expect(
        page.getByRole('button', { name: 'Select all' }),
        'Select all button should be enabled after loading notes',
      ).toBeEnabled();
      const a11yExportDialog = await analyzeA11y();
      if (a11yExportDialog.hasViolations()) {
        await testInfo.attach('a11y-report-export-dialog.md', {
          body: a11yExportDialog.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11yExportDialog.hasViolations(),
        'Accessibility scan on "Export Notes Dialog" should have no violations',
      ).toBe(false);
    });

    await test.step('trigger export notes download', async () => {
      for (const title of createdNoteTitles) {
        await exportNotesDialog.checkNoteByTitle(title);
        await expect(
          exportNotesDialog.getNoteCheckboxByTitle(title),
          `Note checkbox for "${title}" should be checked before export`,
        ).toBeChecked();
      }

      await expect(
        exportNotesDialog.selectedCounter,
        'Selected counter should reflect the number of notes picked for export',
      ).toContainText(`Selected: ${NOTES_TO_CREATE} of`);

      // Export selected notes and persist downloaded ENEX into the test output folder.
      const downloadPromise = page.waitForEvent('download');
      await exportNotesDialog.clickExport();
      download = await downloadPromise;

      expect(
        await download.failure(),
        'Download should complete successfully without browser-reported failure',
      ).toBeNull();
      await expect(
        exportCompletedDialog.dialog,
        'Export completed dialog should appear after export finishes',
      ).toBeVisible();
      await expect(
        exportCompletedDialog.titleHeading,
        'Export completed dialog title should be visible',
      ).toBeVisible();
      await expect(
        exportCompletedDialog.readyMessage,
        'Export completed dialog should show ready message',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Export Completed Dialog', async () => {
      const a11yExportCompleted = await analyzeA11y();
      if (a11yExportCompleted.hasViolations()) {
        await testInfo.attach('a11y-report-export-completed.md', {
          body: a11yExportCompleted.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11yExportCompleted.hasViolations(),
        'Accessibility scan on "Export Completed Dialog" should have no violations',
      ).toBe(false);
    });

    await test.step('save export download and close dialog', async () => {
      downloadedFilePath = testInfo.outputPath(download.suggestedFilename());
      await download.saveAs(downloadedFilePath);
      expect(
        existsSync(downloadedFilePath),
        'Exported ENEX file should exist on disk after saving download',
      ).toBeTruthy();

      await exportCompletedDialog.closeDialog();
      await expect(
        exportCompletedDialog.dialog,
        'Export completed dialog should be hidden after closing it',
      ).toBeHidden();
      await expect(
        page,
        'Closing the export completion dialog should keep the user on the settings route',
      ).toHaveURL(SETTINGS_ROUTE_PATTERN);
    });

    await test.step('delete exported notes', async () => {
      // Remove source notes first to prove imported notes are newly created records.
      for (const noteId of createdNoteIds) {
        const deleted = await notesApi.deleteNote(noteId);
        expect(
          deleted.status,
          `API should delete original note with ID ${noteId} before import`,
        ).toBe(200);
      }

      await settingsView.goBackToWorkspace();
      await expect(
        page,
        'Back button on the settings page should return the user to the notes workspace',
      ).toHaveURL(/\/$/);
      await page.reload();

      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Original note "${title}" should be deleted before import.`,
        ).toHaveCount(0);
      }
    });

    await test.step('open import tab', async () => {
      // Import the same exported file using the "Skip duplicate notes" strategy.
      await leftPanel.accountMenu.openSettings();
      await expect(
        page,
        'Reopening settings for import should navigate back to the settings route',
      ).toHaveURL(SETTINGS_ROUTE_PATTERN);
      await settingsView.openTab('Import .enex file');
      await expect(
        settingsView.tabHeading,
        'Settings page should show the import tab heading after selecting import',
      ).toHaveText('Import .enex file');
      await expect(
        settingsView.getPrimaryActionButton('Import .enex file'),
        'Import tab should expose the primary import action button',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Import Tab', async () => {
      await expect(page).toHaveTitle(/EverFreeNote/);
      const a11yImportTab = await analyzeA11y();
      if (a11yImportTab.hasViolations()) {
        await testInfo.attach('a11y-report-import-tab.md', {
          body: a11yImportTab.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11yImportTab.hasViolations(),
        'Accessibility scan on "Import Tab" should have no violations',
      ).toBe(false);
    });

    await test.step('open import notes dialog', async () => {
      await settingsView.getPrimaryActionButton('Import .enex file').click();

      // Ensure import dialog is opened before interacting with import controls.
      await expect(
        importNotesDialog.dialog,
        'Import notes dialog should be visible after opening import flow',
      ).toBeVisible();
      await expect(
        importNotesDialog.titleHeading,
        'Import notes dialog title should be visible',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Import Dialog', async () => {
      await expect(page).toHaveTitle(/EverFreeNote/);
      const a11yImportDialog = await analyzeA11y();
      if (a11yImportDialog.hasViolations()) {
        await testInfo.attach('a11y-report-import-dialog.md', {
          body: a11yImportDialog.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11yImportDialog.hasViolations(),
        'Accessibility scan on "Import Notes Dialog" should have no violations',
      ).toBe(false);
    });

    await test.step('trigger import notes', async () => {
      // Use "Skip duplicate notes" strategy explicitly to keep import behavior deterministic.
      await importNotesDialog.selectSkipDuplicates();
      await expect(
        importNotesDialog.skipDuplicateNotesRadio,
        '"Skip duplicate notes" option should be selected before import',
      ).toHaveAttribute('aria-checked', 'true');

      // Provide the exported ENEX file directly into the hidden file input inside the new import dialog.
      await importNotesDialog.setFiles(downloadedFilePath);

      // Import button should become enabled only after a valid ENEX file is selected.
      await expect(
        importNotesDialog.importButton,
        'Import button should become enabled after selecting a valid ENEX file',
      ).toBeEnabled();
      await importNotesDialog.clickImport();

      // Wait for import dialog to close and assert successful import summary in completion dialog.
      await expect(
        importNotesDialog.dialog,
        'Import notes dialog should close after starting import',
      ).toHaveCount(0);
      await expect(
        importCompletedDialog.dialog,
        'Import completed dialog should be visible after import finishes',
      ).toBeVisible();
      await expect(
        importCompletedDialog.titleHeading,
        'Import completed dialog title should be visible',
      ).toBeVisible();
      await expect(
        importCompletedDialog.readyMessage,
        'Import completed dialog should show ready message',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Import Completed Dialog', async () => {
      await expect(page).toHaveTitle(/EverFreeNote/);
      const a11yImportCompleted = await analyzeA11y();
      if (a11yImportCompleted.hasViolations()) {
        await testInfo.attach('a11y-report-import-completed.md', {
          body: a11yImportCompleted.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11yImportCompleted.hasViolations(),
        'Accessibility scan on "Import Completed Dialog" should have no violations',
      ).toBe(false);
    });

    await test.step('close import completion dialog', async () => {
      await expect(
        importCompletedDialog.successfulCountText,
        'Import completed dialog should report the expected number of imported notes',
      ).toContainText(`Successfully imported ${NOTES_TO_CREATE} notes`);
      await importCompletedDialog.closeDialog();
      await expect(
        importCompletedDialog.dialog,
        'Import completed dialog should be hidden after closing it',
      ).toBeHidden();
      await expect(
        page,
        'Closing the import completion dialog should keep the user on the settings route until the user exits it',
      ).toHaveURL(SETTINGS_ROUTE_PATTERN);
    });

    await test.step('verify imported notes content', async () => {
      // Verify imported notes through API by matching title, body, and tags.
      for (const expectedNote of expectedCreatedNotes) {
        const fetched = await notesApi.getNotes({ title: expectedNote.title });
        expect(
          fetched.status,
          `API should return notes when fetching imported note "${expectedNote.title}" by title`,
        ).toBe(200);

        const notes = fetched.data.notes;
        const matchedNote = notes.find((note) => areNotesEquivalent(note, expectedNote));

        expect(
          matchedNote,
          `Imported note "${expectedNote.title}" did not match expected data.`,
        ).toBeDefined();
      }
    });

    await test.step('verify imported notes in general list', async () => {
      // Return from settings and verify imported notes appear without a manual page refresh.
      await settingsView.goBackToWorkspace();
      await expect(
        page,
        'Back button should return from settings to the notes workspace after import',
      ).toHaveURL(/\/$/);

      for (const title of createdNoteTitles) {
        await expect(
          leftPanel.getNoteCardByTitle(title).root,
          `Imported note "${title}" should be visible in the general notes list.`,
        ).toBeVisible();
      }
    });

  });
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
