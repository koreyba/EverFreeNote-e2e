import { test as apiTest } from './api.fixture';
import { DeleteDialog } from '../views/dialogs/delete-dialog.view';
import { BulkDeleteDialog } from '../views/dialogs/bulk-delete-dialog.view';
import { ExportCompletedDialog } from '../views/dialogs/export-completed-dialog.view';
import { ExportNotesDialog } from '../views/dialogs/export-notes-dialog.view';
import { ImportCompletedDialog } from '../views/dialogs/import-completed-dialog.view';
import { ImportNotesDialog } from '../views/dialogs/import-notes-dialog.view';
import { EditView } from '../views/edit.view';
import { LeftPanel } from '../views/left-panel.view';
import { ReadView } from '../views/read.view';

type NotesPageObjectsFixtures = {
  leftPanel: LeftPanel;
  editView: EditView;
  readView: ReadView;
};

type DialogPageObjectsFixtures = {
  bulkDeleteDialog: BulkDeleteDialog;
  deleteDialog: DeleteDialog;
  exportNotesDialog: ExportNotesDialog;
  exportCompletedDialog: ExportCompletedDialog;
  importCompletedDialog: ImportCompletedDialog;
  importNotesDialog: ImportNotesDialog;
};

type PageObjectsFixtures = NotesPageObjectsFixtures & DialogPageObjectsFixtures;

export const test = apiTest.extend<PageObjectsFixtures>({
  leftPanel: async ({ page }, use) => use(new LeftPanel(page)),
  editView: async ({ page }, use) => use(new EditView(page)),
  readView: async ({ page }, use) => use(new ReadView(page)),
  bulkDeleteDialog: async ({ page }, use) => use(new BulkDeleteDialog(page)),
  deleteDialog: async ({ page }, use) => use(new DeleteDialog(page)),
  exportNotesDialog: async ({ page }, use) => use(new ExportNotesDialog(page)),
  exportCompletedDialog: async ({ page }, use) => use(new ExportCompletedDialog(page)),
  importCompletedDialog: async ({ page }, use) => use(new ImportCompletedDialog(page)),
  importNotesDialog: async ({ page }, use) => use(new ImportNotesDialog(page)),
});

export { expect } from './api.fixture';
