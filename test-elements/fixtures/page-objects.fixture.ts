import { test as apiTest } from './api.fixture';
import type { Page } from '@playwright/test';
import { DeleteDialog } from '../views/dialogs/delete-dialog.view';
import { BulkDeleteDialog } from '../views/dialogs/bulk-delete-dialog.view';
import { ExportCompletedDialog } from '../views/dialogs/export-completed-dialog.view';
import { ExportNotesDialog } from '../views/dialogs/export-notes-dialog.view';
import { ImportCompletedDialog } from '../views/dialogs/import-completed-dialog.view';
import { ImportNotesDialog } from '../views/dialogs/import-notes-dialog.view';
import { ShareNoteDialog } from '../views/dialogs/share-note-dialog.view';
import { EditView } from '../views/edit.view';
import { LandingView } from '../views/landing.view';
import { LeftPanel } from '../views/left-panel.view';
import { PublicNoteView } from '../views/public-note.view';
import { ReadView } from '../views/read.view';
import { SettingsView } from '../views/settings.view';

type NotesPageObjectsFixtures = {
  guestPage: Page;
  leftPanel: LeftPanel;
  editView: EditView;
  guestLandingView: LandingView;
  guestPublicNoteView: PublicNoteView;
  landingView: LandingView;
  readView: ReadView;
  publicNoteView: PublicNoteView;
  settingsView: SettingsView;
};

type DialogPageObjectsFixtures = {
  bulkDeleteDialog: BulkDeleteDialog;
  deleteDialog: DeleteDialog;
  exportNotesDialog: ExportNotesDialog;
  exportCompletedDialog: ExportCompletedDialog;
  importCompletedDialog: ImportCompletedDialog;
  importNotesDialog: ImportNotesDialog;
  shareNoteDialog: ShareNoteDialog;
};

type PageObjectsFixtures = NotesPageObjectsFixtures & DialogPageObjectsFixtures;

export const test = apiTest.extend<PageObjectsFixtures>({
  guestPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await use(page);
    await context.close();
  },
  leftPanel: async ({ page }, use) => use(new LeftPanel(page)),
  editView: async ({ page }, use) => use(new EditView(page)),
  guestLandingView: async ({ guestPage }, use) => use(new LandingView(guestPage)),
  guestPublicNoteView: async ({ guestPage }, use) => use(new PublicNoteView(guestPage)),
  landingView: async ({ page }, use) => use(new LandingView(page)),
  readView: async ({ page }, use) => use(new ReadView(page)),
  publicNoteView: async ({ page }, use) => use(new PublicNoteView(page)),
  settingsView: async ({ page }, use) => use(new SettingsView(page)),
  bulkDeleteDialog: async ({ page }, use) => use(new BulkDeleteDialog(page)),
  deleteDialog: async ({ page }, use) => use(new DeleteDialog(page)),
  exportNotesDialog: async ({ page }, use) => use(new ExportNotesDialog(page)),
  exportCompletedDialog: async ({ page }, use) => use(new ExportCompletedDialog(page)),
  importCompletedDialog: async ({ page }, use) => use(new ImportCompletedDialog(page)),
  importNotesDialog: async ({ page }, use) => use(new ImportNotesDialog(page)),
  shareNoteDialog: async ({ page }, use) => use(new ShareNoteDialog(page)),
});

export { expect } from './api.fixture';
